// Pure helpers for the cyber news feed: parse RSS 2.0 and merge feeds. No network access here.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENTITIES[n.toLowerCase()] !== undefined ? ENTITIES[n.toLowerCase()] : m));
}
function plain(s) {
  return decode(decode(s)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function truncate(s, n) {
  s = String(s || '');
  return s.length <= n ? s : s.slice(0, n - 1).trim() + '…';
}
function tag(block, name) {
  const m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'i'));
  return m ? m[1] : '';
}

function parseRss(xml, source, limit) {
  const blocks = String(xml || '').match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return blocks.slice(0, limit || 10).map(b => {
    const link = plain(tag(b, 'link'));
    const d = new Date(plain(tag(b, 'pubDate')));
    return {
      title: plain(tag(b, 'title')),
      link,
      source,
      pubDate: isNaN(d.getTime()) ? '' : d.toISOString(),
      description: truncate(plain(tag(b, 'description')), 160)
    };
  }).filter(it => it.title && /^https?:\/\//.test(it.link));
}

function mergeFeeds(lists, max) {
  const seen = new Set();
  return [].concat(...lists)
    .filter(it => (seen.has(it.link) ? false : (seen.add(it.link), true)))
    .sort((a, b) => String(b.pubDate).localeCompare(String(a.pubDate)))
    .slice(0, max || 20);
}

module.exports = { parseRss, mergeFeeds, plain, truncate };
