// Aithos Assessment backend on Cloudflare Workers (replaces the n8n workflows).
//
//   POST /lead     assessment results -> Notion DMPS database (update or create lead)
//   POST /analyze  {handle, name, followers, lang} -> scrapes the Instagram profile via Apify,
//                  writes the AI report with Claude and returns the finished record.
//                  The page keeps this request open while the quiz is filled in.
//   GET  /report?handle=  returns the stored record (fallback when the /analyze call was lost)
//
// Secrets (wrangler secret put): APIFY_TOKEN, ANTHROPIC_API_KEY, NOTION_TOKEN
// KV binding: REPORTS

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store'
};

const WEEK_MS = 7 * 24 * 3600 * 1000;
const REPORT_TTL = 30 * 24 * 3600;
const FAILED_TTL = 24 * 3600;
const PENDING_TTL = 10 * 60;
const NOTION_DB = 'c18048f0-7d93-83d4-b9c1-819f68b27ef4';
const NOTION_VERSION = '2022-06-28';
const CLAUDE_MODEL = 'claude-opus-5';
const APIFY_FIELDS = [
  'username', 'fullName', 'biography', 'externalUrl', 'externalUrls', 'followersCount', 'followsCount',
  'postsCount', 'businessCategoryName', 'verified', 'highlightReelCount', 'latestPosts', 'private',
  'error', 'errorDescription'
].join(',');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (url.pathname === '/analyze' && request.method === 'POST') return json(await analyze(await request.json(), env));
      if (url.pathname === '/report' && request.method === 'GET') return json(await getReport(url.searchParams.get('handle'), env));
      if (url.pathname === '/lead' && request.method === 'POST') return json(await saveLead(await request.json(), env));
      if (url.pathname === '/' ) return json({ ok: true, service: 'aithos-assessment' });
      return json({ error: 'not_found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e).slice(0, 300) }, 500);
    }
  }
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS) });
}

function normalizeHandle(raw) {
  return String(raw || '').trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[\/?].*$/, '')
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Profile analysis
// ---------------------------------------------------------------------------

async function analyze(body, env) {
  const handle = normalizeHandle(body.handle);
  const lang = body.lang === 'en' ? 'en' : 'nl';
  if (!handle) return { status: 'failed', handle: '', lang, error: 'no_handle' };
  const key = 'report:' + handle;
  const now = Date.now();
  const existing = await env.REPORTS.get(key, 'json');

  if (existing) {
    const ts = Date.parse(existing.generatedAt || '');
    if ((existing.status === 'ready' || existing.status === 'limited') && !isNaN(ts) && now - ts < WEEK_MS) {
      const limited = {
        status: 'limited', handle, lang,
        generatedAt: existing.generatedAt,
        nextAllowedAt: new Date(ts + WEEK_MS).toISOString(),
        attemptedAt: new Date(now).toISOString(),
        model: existing.model || null, usage: existing.usage || null, report: existing.report || null
      };
      await env.REPORTS.put(key, JSON.stringify(limited), { expirationTtl: REPORT_TTL });
      return limited;
    }
    if (existing.status === 'pending' && now - Date.parse(existing.startedAt || '') < 5 * 60 * 1000) {
      return existing;
    }
  }

  await env.REPORTS.put(key, JSON.stringify({ status: 'pending', handle, lang, startedAt: new Date(now).toISOString() }), { expirationTtl: PENDING_TTL });

  let record;
  try {
    const profile = await scrapeProfile(handle, env);
    const out = await writeReport(profile, { handle, lang, name: String(body.name || '').trim(), followers: String(body.followers || '').trim() }, env);
    record = { status: 'ready', handle, lang, generatedAt: new Date().toISOString(), model: out.model, usage: out.usage, report: out.report };
  } catch (e) {
    record = { status: 'failed', handle, lang, generatedAt: new Date().toISOString(), error: String(e && e.message || e).slice(0, 300) };
  }
  await env.REPORTS.put(key, JSON.stringify(record), { expirationTtl: record.status === 'ready' ? REPORT_TTL : FAILED_TTL });
  return record;
}

async function getReport(rawHandle, env) {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return { status: 'pending' };
  const rec = await env.REPORTS.get('report:' + handle, 'json');
  if (!rec || rec.status === 'pending') return { status: 'pending' };
  return rec;
}

async function scrapeProfile(handle, env) {
  if (!env.APIFY_TOKEN) throw new Error('apify_not_configured');
  const url = 'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?timeout=150&memory=1024&fields=' + encodeURIComponent(APIFY_FIELDS);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.APIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ directUrls: ['https://www.instagram.com/' + handle + '/'], resultsType: 'details', resultsLimit: 12, addParentData: false })
  });
  if (!r.ok) throw new Error('apify_http_' + r.status + ': ' + (await r.text()).slice(0, 200));
  const items = await r.json();
  const p = (Array.isArray(items) ? items : []).find(i => i && (i.username !== undefined || i.biography !== undefined));
  if (!p) throw new Error('no_profile');
  if (p.error) throw new Error('scrape_error: ' + String(p.error.message || JSON.stringify(p.error)).slice(0, 200));
  if (p.private) throw new Error('private_profile');
  if (p.errorDescription) throw new Error('scrape_error: ' + String(p.errorDescription).slice(0, 200));

  const posts = (p.latestPosts || []).slice(0, 12).map(x => ({
    type: x.productType || x.type || '',
    pinned: !!x.isPinned,
    date: String(x.timestamp || '').slice(0, 10),
    caption: String(x.caption || '').replace(/\s+/g, ' ').slice(0, 400),
    likes: x.likesCount === undefined ? null : x.likesCount,
    comments: x.commentsCount === undefined ? null : x.commentsCount,
    views: x.videoViewCount !== undefined ? x.videoViewCount : (x.videoPlayCount !== undefined ? x.videoPlayCount : null),
    url: x.url || ''
  }));
  const externalUrl = p.externalUrl || (Array.isArray(p.externalUrls) ? p.externalUrls.map(u => (u && u.url) ? u.url : u).join(', ') : '');
  return {
    username: p.username,
    fullName: p.fullName || '',
    biography: p.biography || '',
    externalUrl,
    followers: p.followersCount,
    following: p.followsCount,
    postsCount: p.postsCount,
    category: p.businessCategoryName || '',
    verified: !!p.verified,
    highlightReelCount: p.highlightReelCount,
    latestPosts: posts
  };
}

function reportSchema() {
  const str = { type: 'string' };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['score', 'scoreLabel', 'verdict', 'firstFiveSeconds', 'trustNote', 'working', 'leaks', 'bestPosts', 'bio', 'thisWeek'],
    properties: {
      score: { type: 'integer' },
      scoreLabel: str,
      verdict: str,
      firstFiveSeconds: str,
      trustNote: str,
      working: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'detail'], properties: { title: str, detail: str } } },
      leaks: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'detail', 'whyItMatters', 'whatToDo'], properties: { title: str, detail: str, whyItMatters: str, whatToDo: str } } },
      bestPosts: { type: 'object', additionalProperties: false, required: ['pattern', 'whyItWorks', 'makeNext'], properties: {
        pattern: str, whyItWorks: str,
        makeNext: { type: 'array', description: 'Exactly 3 post ideas, each a complete sentence with format, hook and angle. Never return an empty string.', items: str }
      } },
      bio: { type: 'object', additionalProperties: false, required: ['lines', 'stronger', 'strongerWhy'], properties: {
        lines: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['text', 'tag', 'note'], properties: { text: str, tag: { type: 'string', enum: ['keep', 'fix', 'cut'] }, note: str } } },
        stronger: { type: 'array', description: 'The complete rewritten Instagram bio as 2 to 4 short lines. All lines together, including line breaks, must total at most 150 characters (the Instagram limit). Never return an empty string.', items: str },
        strongerWhy: str
      } },
      thisWeek: { type: 'array', description: 'Exactly 3 concrete actions for the coming 7 days. Each item is a complete sentence of 15 to 40 words that names the action, the very first step and the day to do it. Never return an empty string.', items: str }
    }
  };
}

function systemPrompt(lang) {
  const langName = lang === 'en' ? 'English' : 'Dutch';
  return `You are the senior brand strategist of Aithos Marketing, writing on behalf of Max Vonk. Aithos is a personal branding agency for coaches and experts who want clients from Instagram instead of depending on referrals and their own network. You analyze a real Instagram profile exactly the way a ready-to-buy stranger experiences it: first the 5-second impression of the profile (name line, bio, link, highlights, pinned posts), then as a buyer scrolling the latest posts.

Max's framework, the four pillars:
1. Positioning & Profile: can a stranger tell within 5 seconds who you help, what result you deliver and what to do next? Is proof visible without scrolling?
2. Content Engine: is there a rhythm, and does every post have one job: attract strangers, build trust, or convert?
3. Conversion System: is there a path from attention to a conversation? CTAs, DM flow, follow-up.
4. Offer & Client Flow: is the offer visible, specific and proven, or does the account quietly run on referrals?

Rules:
- Write everything in ${langName}. ${lang === 'en' ? '' : 'Use informal Dutch (je, jij, jouw). Keep common terms like DM, CTA, reel, bio, highlight in English.'}
- Be specific. Quote the actual bio lines and post captions (shortened) and cite the real numbers (likes, comments, views). Never invent posts, numbers or facts. If the data is thin (few posts, low engagement, empty bio), say so plainly and analyze what is there.
- Tone: direct, warm, confident. No fluff, no hype, no emojis. Never use em dashes; use commas, colons or full stops instead.
- Rank leaks by what they cost in clients, most expensive first. Every whatToDo must be doable this week and must name the first step to take today.
- Calibrate to account size in trustNote: under roughly 1,000 followers the job is trust and clarity first with soft CTAs; larger accounts get a conversion focus.
- Scoring: score is 0 to 100 for how ready this profile is to turn a cold visitor into a client conversation. Bands: below 40 invisible or leaky, 40 to 69 promising but leaky, 70 to 84 solid, 85 and up ready to scale. scoreLabel is 2 to 4 words.
- Counts: working has 2 or 3 items; leaks has 3 to 5 items; bestPosts.makeNext has exactly 3 items; thisWeek has exactly 3 actions, each a complete sentence that names the action, the first step and the day (an empty string is never acceptable); bio.lines has one entry per actual bio line (split the biography on line breaks; if the bio is empty, return one line with text "(empty bio)" and tag "fix"); bio.stronger is the complete rewritten Instagram bio: 2 to 4 short lines whose combined length, including line breaks, is at most 150 characters (Instagram's hard limit), so the owner can paste it in as is. Count the characters before you answer and cut words until it fits. Written in the owner's own voice and language.
- Lengths: verdict is one sentence; firstFiveSeconds is 2 or 3 sentences; trustNote is 2 or 3 sentences; detail, whyItMatters and whatToDo are 2 to 4 sentences each; bio line notes are 1 or 2 sentences; strongerWhy is 1 or 2 sentences.
- Tags for bio lines: keep, fix or cut.
- Do not pitch or mention Max's services, and do not mention that you are an AI. The page around this report handles the next step.`;
}

async function writeReport(profile, meta, env) {
  const langName = meta.lang === 'en' ? 'English' : 'Dutch';
  const user = `Analyze this Instagram profile.

Owner's first name: ${meta.name || '(unknown)'}
Followers as stated by the owner: ${meta.followers || '(not given)'}
Output language: ${langName}

Remember: every string in the JSON must be filled in, especially the 3 items in thisWeek. The rewritten bio (bio.stronger) must be at most 150 characters in total.

Profile data (scraped, JSON):
${JSON.stringify(profile, null, 1)}`;

  const r = await claude({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: systemPrompt(meta.lang),
    messages: [{ role: 'user', content: user }],
    output_config: { effort: 'high', format: { type: 'json_schema', schema: reportSchema() } }
  }, env);
  const block = (r.content || []).find(c => c.type === 'text');
  if (!block) throw new Error('no_text_block: ' + (r.stop_reason || ''));
  const report = JSON.parse(block.text);

  const clean = arr => (Array.isArray(arr) ? arr : []).map(s => String(s).trim()).filter(Boolean);
  report.thisWeek = clean(report.thisWeek);
  if (report.bestPosts) report.bestPosts.makeNext = clean(report.bestPosts.makeNext);
  if (report.bio) report.bio.stronger = await fitBio(clean(report.bio.stronger), meta.lang, env);

  return { report, model: r.model, usage: r.usage };
}

// Instagram allows 150 characters in a bio. Ask Claude to shorten when needed, then enforce it.
async function fitBio(lines, lang, env) {
  if (lines.join('\n').length > 150) {
    try {
      const langName = lang === 'en' ? 'English' : 'Dutch';
      const r = await claude({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: 'You shorten Instagram bios. Keep the message, voice and language (' + langName + '). Hard rules: the whole bio, all lines together including line breaks, must be at most 150 characters (the Instagram limit). Use 2 to 4 short lines. No emojis, no hashtags, no em dashes. Count the characters before you answer and cut words until it fits.',
        messages: [{ role: 'user', content: 'Shorten this bio to at most 150 characters in total:\n\n' + lines.join('\n') }],
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: { type: 'object', additionalProperties: false, required: ['lines'], properties: { lines: { type: 'array', description: 'The shortened bio as 2 to 4 lines, at most 150 characters in total.', items: { type: 'string' } } } } } }
      }, env);
      const block = (r.content || []).find(c => c.type === 'text');
      const shorter = block ? JSON.parse(block.text).lines : null;
      if (Array.isArray(shorter) && shorter.length) lines = shorter.map(s => String(s).trim()).filter(Boolean);
    } catch (e) { /* fall through to the hard cut below */ }
  }
  while (lines.length > 1 && lines.join('\n').length > 150) lines.pop();
  if (lines.length && lines[0].length > 150) {
    const cut = lines[0].slice(0, 150);
    const sp = cut.lastIndexOf(' ');
    lines = [sp > 80 ? cut.slice(0, sp) : cut];
  }
  return lines;
}

async function claude(body, env) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('anthropic_not_configured');
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (r.ok) return data;
    last = 'claude_http_' + r.status + ': ' + String(data && data.error && data.error.message || '').slice(0, 200);
    if (r.status === 429 || r.status === 529 || r.status >= 500) { await new Promise(res => setTimeout(res, 4000)); continue; }
    break;
  }
  throw new Error(last || 'claude_error');
}

// ---------------------------------------------------------------------------
// Lead -> Notion (same mapping as the former n8n workflow)
// ---------------------------------------------------------------------------

async function saveLead(body, env) {
  if (!env.NOTION_TOKEN) return { ok: false, error: 'notion_not_configured' };
  const t = (s, m) => (s || '').toString().slice(0, m || 1900);
  const handle = (body.handle || '').replace(/^@/, '');
  const stamp = (body.completed_at || new Date().toISOString()).slice(0, 10);
  const sc = body.scores || {};
  const a = body.answers || {};
  const stageNames = { 1: 'The Invisible Expert', 2: 'Posting Into the Void', 3: 'The Referral Prisoner', 4: 'The Conversion Leak', 5: 'Ready to Scale' };
  const w = (body.weakest_pillar || '').toLowerCase();
  const weakest = w.indexOf('position') >= 0 ? 'Positioning & Profile' : w.indexOf('content') >= 0 ? 'Content Engine' : w.indexOf('conver') >= 0 ? 'Conversion System' : w ? 'Offer & Client Flow' : '';
  const q10 = (body.q10_label || '').toLowerCase();
  const clientSource = (q10.indexOf('no paying') >= 0 || q10.indexOf('do not have') >= 0) ? 'No paying clients yet' : q10.indexOf('mix') >= 0 ? 'Mix of network and inbound' : q10.indexOf('mostly inbound') >= 0 ? 'Mostly inbound from content' : q10.indexOf('referral') >= 0 ? 'Referrals and network' : '';
  const lang = ((body.lang || 'en').toUpperCase() === 'NL') ? 'NL' : 'EN';
  const parseFollowers = v => {
    if (!v) return null;
    v = String(v).toLowerCase().trim();
    const k = v.match(/^([\d.,]+)\s*k\b/);
    if (k) return Math.round(parseFloat(k[1].replace(',', '.')) * 1000);
    const n = parseInt(v.replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? null : n;
  };

  const props = {
    'Stage': { select: { name: 'Assessment done' } },
    'Language': { select: { name: lang } },
    'Followers': { number: parseFollowers(body.followers) },
    'Last Touch': { date: { start: stamp } },
    'Assessment Date': { date: { start: stamp } },
    'Positioning Score': { number: Number(sc.positioning) || 0 },
    'Content Score': { number: Number(sc.content) || 0 },
    'Conversion Score': { number: Number(sc.conversion) || 0 },
    'Offer Score': { number: Number(sc.offer) || 0 },
    'Q1 Who They Help': { rich_text: [{ text: { content: t(a.q1) } }] },
    'Q12 Frustration': { rich_text: [{ text: { content: t(a.q12) } }] },
    'Q13 Ambition': { rich_text: [{ text: { content: t(a.q13) } }] }
  };
  if (stageNames[body.stage]) props['Assessment Stage'] = { select: { name: stageNames[body.stage] } };
  if (weakest) props['Weakest Pillar'] = { select: { name: weakest } };
  if (body.q11_label) props['Revenue Band'] = { select: { name: t(body.q11_label, 90) } };
  if (clientSource) props['Client Source'] = { select: { name: clientSource } };
  if (body.email) props['Assessment Email'] = { email: t(body.email, 200) };

  const headers = { 'Authorization': 'Bearer ' + env.NOTION_TOKEN, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' };

  const q = await fetch('https://api.notion.com/v1/databases/' + NOTION_DB + '/query', {
    method: 'POST', headers,
    body: JSON.stringify({ filter: { property: 'Username', rich_text: { contains: handle } }, page_size: 1 })
  });
  const found = q.ok ? await q.json() : { results: [] };
  const page = Array.isArray(found.results) && found.results.length ? found.results[0] : null;

  let r;
  if (page) {
    r = await fetch('https://api.notion.com/v1/pages/' + page.id, { method: 'PATCH', headers, body: JSON.stringify({ properties: props }) });
  } else {
    const createProps = Object.assign({
      'Datum': { date: { start: body.completed_at || new Date().toISOString() } },
      'Naam': { title: [{ text: { content: body.name || handle || 'Assessment lead' } }] },
      'Username': { rich_text: [{ text: { content: handle } }] }
    }, props);
    r = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers, body: JSON.stringify({ parent: { database_id: NOTION_DB }, properties: createProps }) });
  }
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return { ok: false, updated: !!page, error: 'notion_http_' + r.status + ': ' + String(err.message || '').slice(0, 200) };
  }
  return { ok: true, updated: !!page };
}
