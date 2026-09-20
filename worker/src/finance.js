// Stripe invoice.paid -> a row in the Notion "Financiën" database (data source 6cdb5b16-...).
// Uses the same NOTION_TOKEN as the lead capture; the integration must be connected to both
// the Financiën and the Klanten database.

const NOTION_VERSION = '2025-09-03';
const FINANCE_DATA_SOURCE = '6cdb5b16-d379-4ff1-a76e-b8899138140c';
const CLIENTS_DATA_SOURCE = 'aba454c3-218f-4880-9175-a229526a1dae';
const INVOICE_TTL = 365 * 24 * 3600;

// Known clients whose Stripe name/email does not match their Notion page 1:1.
const FIXED_CLIENTS = [
  { match: ['the achievement company', 'julieta timane', 'julieta'], pageId: '3e1048f0-7d93-8110-8e2c-fc8c65a9e4ac' },
  { match: ['sustainable discipline', 'bart van brussel'], pageId: '3e1048f0-7d93-8152-8840-f12c29ae6482' }
];

function headers(env) {
  return { 'Authorization': 'Bearer ' + env.NOTION_TOKEN, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' };
}

function classify(text) {
  const t = String(text || '').toLowerCase();
  if (/retainer|profile to profit|deposit|aanbetaling/.test(t)) return 'Retainer';
  if (/set-?up|onboarding/.test(t)) return 'Set-up fee';
  if (/\bads?\b/.test(t)) return 'Ads-toeslag';
  return 'Overig';
}

function amsterdamDate(unixSeconds) {
  const d = new Date((unixSeconds || Date.now() / 1000) * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function cents(n) {
  return Math.round(Number(n) || 0) / 100;
}

export function buildFinanceRow(invoice) {
  const line = (invoice.lines && invoice.lines.data && invoice.lines.data[0]) || {};
  const lineText = String(line.description || '').trim();
  const customerName = String(invoice.customer_name || invoice.customer_email || '').trim();
  const total = Number(invoice.total) || 0;
  const excl = (invoice.total_excluding_tax !== null && invoice.total_excluding_tax !== undefined)
    ? Number(invoice.total_excluding_tax)
    : total - (Number(invoice.tax) || 0);
  const paidAt = invoice.status_transitions && invoice.status_transitions.paid_at;
  const props = {
    'Omschrijving': { title: [{ text: { content: [customerName, lineText].filter(Boolean).join(' · ') || invoice.number || invoice.id } }] },
    'Bedrag': { number: cents(excl) },
    'BTW': { number: cents(total - excl) },
    'Richting': { select: { name: 'In' } },
    'Status': { select: { name: 'Betaald' } },
    'Soort': { select: { name: 'Zakelijk' } },
    'Type': { select: { name: classify(lineText + ' ' + ((line.price && line.price.nickname) || '')) } },
    'Datum': { date: { start: amsterdamDate(paidAt) } },
    'Stripe ID': { rich_text: [{ text: { content: String(invoice.id || '') } }] }
  };
  if (invoice.number) props['Factuurnummer'] = { rich_text: [{ text: { content: String(invoice.number) } }] };
  if (invoice.hosted_invoice_url) props['Stripe link'] = { url: invoice.hosted_invoice_url };
  return { props, customerName, customerEmail: String(invoice.customer_email || '').trim(), lineText };
}

async function notion(env, path, body) {
  const r = await fetch('https://api.notion.com/v1' + path, { method: 'POST', headers: headers(env), body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('notion_http_' + r.status + ': ' + String(data.message || '').slice(0, 200));
  return data;
}

async function existingRowFor(invoiceId, env) {
  const q = await notion(env, '/data_sources/' + FINANCE_DATA_SOURCE + '/query', {
    filter: { property: 'Stripe ID', rich_text: { equals: invoiceId } }, page_size: 1
  });
  return (q.results && q.results[0]) || null;
}

async function findClientPage(name, email, env) {
  const needle = (name + ' ' + email).toLowerCase();
  for (const c of FIXED_CLIENTS) if (c.match.some(m => needle.includes(m))) return c.pageId;
  const or = [];
  if (email) or.push({ property: 'E-mail', email: { equals: email } });
  if (name) {
    or.push({ property: 'Klant', title: { contains: name } });
    or.push({ property: 'Bedrijfsnaam', rich_text: { contains: name } });
    or.push({ property: 'Contactpersoon', rich_text: { contains: name } });
  }
  if (!or.length) return null;
  try {
    const q = await notion(env, '/data_sources/' + CLIENTS_DATA_SOURCE + '/query', { filter: { or }, page_size: 1 });
    return (q.results && q.results[0] && q.results[0].id) || null;
  } catch (e) {
    return null;
  }
}

export async function handleInvoicePaid(invoice, env) {
  if (!env.NOTION_TOKEN) return { ok: false, error: 'notion_not_configured' };
  if (!invoice || !invoice.id) return { ok: false, error: 'no_invoice' };

  const key = 'invoice:' + invoice.id;
  const seen = await env.REPORTS.get(key, 'json');
  if (seen && seen.status === 'done') return { ok: true, duplicate: true, pageId: seen.pageId };

  const existing = await existingRowFor(invoice.id, env);
  if (existing) {
    await env.REPORTS.put(key, JSON.stringify({ status: 'done', pageId: existing.id, at: new Date().toISOString() }), { expirationTtl: INVOICE_TTL });
    return { ok: true, duplicate: true, pageId: existing.id };
  }

  const row = buildFinanceRow(invoice);
  const clientPage = await findClientPage(row.customerName, row.customerEmail, env);
  if (clientPage) row.props['Klant'] = { relation: [{ id: clientPage }] };

  const page = await notion(env, '/pages', {
    parent: { type: 'data_source_id', data_source_id: FINANCE_DATA_SOURCE },
    properties: row.props
  });
  await env.REPORTS.put(key, JSON.stringify({ status: 'done', pageId: page.id, at: new Date().toISOString() }), { expirationTtl: INVOICE_TTL });
  return { ok: true, pageId: page.id, url: page.url, client: clientPage || null, type: row.props['Type'].select.name };
}
