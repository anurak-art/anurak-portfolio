const N = require('../lib/news');

const FEEDS = [
  { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer' }
];
const UA = 'Mozilla/5.0 (compatible; DynaSecNews/1.0; +https://www.dynasec.pro)';

// Translations are remembered while this serverless instance stays warm.
const memo = new Map();

async function viaOfficial(text) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;
  const res = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: 'en', target: 'th', format: 'text' }),
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error('official ' + res.status);
  const data = await res.json();
  const t = data && data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText;
  return t ? N.plain(t) : null;
}
async function viaGtx(text) {
  const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=' + encodeURIComponent(text), {
    headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error('gtx ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  return data[0].map(s => s[0]).join('') || null;
}
async function viaMyMemory(text) {
  const res = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|th', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('mymemory ' + res.status);
  const data = await res.json();
  const t = data && data.responseData && data.responseData.translatedText;
  if (!t || data.responseStatus !== 200 || /^MYMEMORY WARNING/i.test(t)) return null;
  return t;
}

// Try each provider in order; a provider that fails is skipped for the rest of this run
// so one blocked service cannot slow the whole response down.
function makeTranslator() {
  const providers = [['official', viaOfficial], ['gtx', viaGtx], ['mymemory', viaMyMemory]];
  const dead = new Set();
  return async function translate(text) {
    if (!text) return null;
    if (memo.has(text)) return memo.get(text);
    for (const [name, fn] of providers) {
      if (dead.has(name)) continue;
      try {
        const out = await fn(text);
        if (out) { memo.set(text, out); return out; }
        if (name === 'official') continue;
      } catch (e) {
        dead.add(name);
      }
    }
    return null;
  };
}

async function inBatches(items, size, fn) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(feed.name + ' ' + res.status);
  return N.parseRss(await res.text(), feed.name, 10);
}

module.exports = async (req, res) => {
  try {
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const items = N.mergeFeeds(settled.filter(r => r.status === 'fulfilled').map(r => r.value), 20);
    if (!items.length) {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
      res.status(502).json({ error: 'no feed items available' });
      return;
    }
    const translate = makeTranslator();
    await inBatches(items, 3, async it => {
      it.title_th = await translate(it.title);
      it.description_th = await translate(it.description);
    });
    items.forEach(it => { if (!it.title_th) delete it.title_th; if (!it.description_th) delete it.description_th; });
    const translated = items.filter(it => it.title_th).length;
    // Cache hard at the CDN: every visitor shares one fetch + translation per period.
    // If nothing could be translated, cache only briefly so the next visitor retries.
    res.setHeader('Cache-Control', translated ? 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' : 'public, max-age=0, s-maxage=120');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ generatedAt: new Date().toISOString(), translated, items });
  } catch (err) {
    res.status(500).json({ error: 'news temporarily unavailable' });
  }
};
