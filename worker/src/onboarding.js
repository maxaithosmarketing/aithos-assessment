// Client onboarding (replaces the n8n "Onboarding Automation" workflow):
//   Stripe customer.created -> Google Drive client folder via Apps Script -> welcome email via SMTP.
//
// Secrets: STRIPE_WEBHOOK_SECRET (live), STRIPE_WEBHOOK_SECRET_TEST (optional, test mode),
//          SMTP_PASSWORD, APPS_SCRIPT_URL, APPS_SCRIPT_KEY
// Vars (wrangler.toml): SMTP_HOST, SMTP_USER, MAIL_FROM, MAIL_CC
import { sendMail } from './smtp.js';
import { WELCOME_SUBJECT, WELCOME_HTML } from './welcome-email.js';

const ONBOARD_TTL = 90 * 24 * 3600;

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Returns the name of the secret that verified the signature, or null.
async function verifyStripe(rawBody, sigHeader, env) {
  const parts = Object.fromEntries(String(sigHeader || '').split(',').map(p => p.split('=')));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return null;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return null;
  const candidates = [['live', env.STRIPE_WEBHOOK_SECRET], ['test', env.STRIPE_WEBHOOK_SECRET_TEST]].filter(c => c[1]);
  for (const [name, secret] of candidates) {
    const expected = await hmacHex(secret, t + '.' + rawBody);
    if (timingSafeEqual(expected, v1)) return name;
  }
  return null;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function handleStripeWebhook(request, env, ctx) {
  if (!env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET_TEST) return { status: 500, body: { error: 'stripe_not_configured' } };
  const raw = await request.text();
  const mode = await verifyStripe(raw, request.headers.get('Stripe-Signature'), env);
  if (!mode) return { status: 400, body: { error: 'invalid_signature' } };

  let event;
  try { event = JSON.parse(raw); } catch (e) { return { status: 400, body: { error: 'invalid_json' } }; }
  if (event.type !== 'customer.created') return { status: 200, body: { ok: true, ignored: event.type } };

  const customer = (event.data && event.data.object) || {};
  const name = String(customer.name || '').trim();
  const email = String(customer.email || '').trim();
  if (!email) return { status: 200, body: { ok: true, ignored: 'no_email' } };

  const key = 'onboard:' + (customer.id || email);
  const seen = await env.REPORTS.get(key, 'json');
  if (seen && seen.status !== 'failed') return { status: 200, body: { ok: true, duplicate: true } };
  await env.REPORTS.put(key, JSON.stringify({ status: 'started', name, email, mode, startedAt: new Date().toISOString() }), { expirationTtl: ONBOARD_TTL });

  // Answer Stripe right away; the folder creation and the email take 10 to 20 seconds.
  ctx.waitUntil(runOnboarding({ key, name, email, mode }, env));
  return { status: 200, body: { ok: true, started: true } };
}

export async function runOnboarding(job, env) {
  const result = { status: 'done', name: job.name, email: job.email, mode: job.mode, startedAt: new Date().toISOString() };
  try {
    result.folder = await createClientFolder(job.name || job.email, job.email, env);
  } catch (e) {
    result.folderError = String(e && e.message || e).slice(0, 300);
  }
  try {
    await sendWelcomeEmail(job.name, job.email, env);
    result.emailSent = true;
  } catch (e) {
    result.emailError = String(e && e.message || e).slice(0, 300);
  }
  if (result.folderError && result.emailError) result.status = 'failed';
  result.finishedAt = new Date().toISOString();
  await env.REPORTS.put(job.key, JSON.stringify(result), { expirationTtl: ONBOARD_TTL });
  return result;
}

async function createClientFolder(name, email, env) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_KEY) throw new Error('apps_script_not_configured');
  const r = await fetch(env.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: env.APPS_SCRIPT_KEY, name, email }),
    redirect: 'follow'
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('apps_script_bad_response: ' + text.slice(0, 200)); }
  if (!r.ok || !data.ok) throw new Error('apps_script_error: ' + String(data.error || r.status).slice(0, 200));
  return { id: data.folderId, url: data.folderUrl };
}

async function sendWelcomeEmail(name, email, env) {
  if (!env.SMTP_PASSWORD) throw new Error('smtp_not_configured');
  const safeName = escapeHtml(name || 'there');
  const cc = env.MAIL_CC ? [env.MAIL_CC] : [];
  await sendMail({
    host: env.SMTP_HOST || 'smtp.transip.email',
    port: 465,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.MAIL_FROM || 'Max Vonk <max@aithosmarketing.nl>',
    to: [email],
    cc,
    subject: WELCOME_SUBJECT.replace('{{NAME}}', name || 'Welcome'),
    html: WELCOME_HTML.replace('{{NAME}}', safeName)
  });
}
