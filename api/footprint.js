// Checks whether a username exists on public sites, using the open WhatsMyName dataset (content/wmn-data.json,
// CC BY-SA 4.0, https://github.com/WebBreacher/WhatsMyName). Only the username is sent to those sites; names
// and email addresses typed in the page are never sent here. Nothing is stored or logged by this function.
const fs = require('fs');
const path = require('path');

const SKIP_CATS = new Set(['xx NSFW xx', 'dating', 'political', 'health', 'archived']);
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/;
const CONCURRENCY = 40;
const PER_SITE_MS = 6000;
const DEADLINE_MS = 22000;
const LIMIT = 6;            // requests per IP per hour (per warm instance)
const hits = new Map();

let SITES = null;
function sites() {
  if (!SITES) {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'wmn-data.json'), 'utf8'));
    SITES = j.sites.filter(s => !s.post_body && s.uri_check && s.uri_check.includes('{account}') &&
      !SKIP_CATS.has(s.cat) && !(s.protection && s.protection.length) && (s.e_string || s.m_string) && s.e_code);
  }
  return SITES;
}

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (list.length >= LIMIT) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

async function check(site, user) {
  const account = site.strip_bad_char ? user.split('').filter(c => !site.strip_bad_char.includes(c)).join('') : user;
  const url = site.uri_check.replace('{account}', encodeURIComponent(account));
  const res = await fetch(url, {
    headers: Object.assign({ 'User-Agent': 'Mozilla/5.0 (compatible; DynaSecFootprint/1.0; +https://www.dynasec.pro/footprint)', 'Accept': 'text/html,*/*' }, site.headers || {}),
    redirect: 'follow', signal: AbortSignal.timeout(PER_SITE_MS)
  });
  const body = (await res.text()).slice(0, 400000);
  if (res.status !== site.e_code) return null;
  if (site.e_string && !body.includes(site.e_string)) return null;
  if (site.m_string && body.includes(site.m_string)) return null;
  return { name: site.name, cat: site.cat, url: (site.uri_pretty || site.uri_check).replace('{account}', encodeURIComponent(account)) };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const user = String(body.username || '');
  if (body.consent !== true) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'consent' })); }
  if (!NAME_RE.test(user)) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'username' })); }
  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim();
  if (limited(ip)) { res.statusCode = 429; return res.end(JSON.stringify({ error: 'rate' })); }

  const queue = shuffle(sites().slice());
  const total = queue.length;
  const found = [];
  let checked = 0, failed = 0;
  const started = Date.now();
  async function worker() {
    while (queue.length && Date.now() - started < DEADLINE_MS) {
      const s = queue.pop();
      try { const r = await check(s, user); if (r) found.push(r); } catch (e) { failed++; }
      checked++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  found.sort((a, b) => (a.cat + a.name).localeCompare(b.cat + b.name));
  res.end(JSON.stringify({ username: user, checked, failed, total, found }));
};
