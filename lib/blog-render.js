// Server-side rendering for the blog, so every article has its own crawlable URL
// (/blog/<slug> in Thai, /en/blog/<slug> in English) with its own title, description,
// canonical, hreflang, Open Graph tags and structured data. Used by api/blog.js and api/sitemap.js.

const SITE = 'https://www.dynasec.pro';
const BRAND = 'Anurak';              // author name
const SITE_NAME = 'DynaSec Consultants';
const TITLE_SUFFIX = 'DynaSec';
const LOGO_URL = SITE + '/assets/icon-512.png';
const OG_IMAGE = SITE + '/assets/og-default.png';

const T = {
  th: {
    htmlLang: 'th', ogLocale: 'th_TH', dateLocale: 'th-TH',
    nav: { about: 'เกี่ยวกับ', services: 'บริการ', solutions: 'โซลูชัน', assessment: 'ประเมินเบื้องต้น', blog: 'บทความ', cases: 'ผลงาน', news: 'ข่าว Cyber Attack', certs: 'ใบรับรอง', contact: 'ติดต่อ' },
    home: 'หน้าแรก',
    listTitle: 'บทความ Cybersecurity และแนวทางปฏิบัติ',
    listH1: 'บทความและความรู้ด้าน Cybersecurity',
    listSub: 'แชร์ประสบการณ์และแนวทางปฏิบัติด้านความปลอดภัยไซเบอร์ในภาษาที่เข้าใจง่าย สำหรับทั้งทีมเทคนิคและผู้บริหาร',
    listDesc: 'รวมบทความความรู้ด้านความปลอดภัยไซเบอร์ที่อ่านง่าย ทั้งแนวคิด แนวทางปฏิบัติ และข้อควรระวัง สำหรับทีมเทคนิคและผู้บริหาร',
    all: 'ทั้งหมด', search: 'ค้นหาบทความ...', showMore: 'ดูบทความเพิ่ม', moreTags: 'หมวดอื่น ๆ', lessTags: 'ย่อ', noResults: 'ไม่พบบทความที่ตรงกับคำค้น', readMore: 'อ่านบทความ →', related: 'บทความที่เกี่ยวข้อง',
    by: 'เขียนโดย', published: 'เผยแพร่', updated: 'อัปเดต',
    shareLabel: 'แชร์บทความนี้', copyLink: 'คัดลอกลิงก์', copied: 'คัดลอกแล้ว',
    footer: '© 2026 · DynaSec Consultants · บทความเพื่อให้ความรู้',
    notFoundTitle: 'ไม่พบบทความนี้', notFoundText: 'บทความที่คุณหาอาจถูกย้ายหรือลบไปแล้ว', notFoundLink: 'ดูบทความทั้งหมด'
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US', dateLocale: 'en-US',
    nav: { about: 'About', services: 'Services', solutions: 'Solutions', assessment: 'Assessment', blog: 'Blog', cases: 'Case Studies', news: 'Cyber News', certs: 'Certifications', contact: 'Contact' },
    home: 'Home',
    listTitle: 'Cybersecurity Articles and Practical Guidance',
    listH1: 'Cybersecurity Articles and Insights',
    listSub: 'Experience and practical guidance on cyber security in plain language, for both technical teams and executives.',
    listDesc: 'Easy-to-read cybersecurity articles covering concepts, practical steps, and pitfalls, for technical teams and executives.',
    all: 'All', search: 'Search articles...', showMore: 'Show more articles', moreTags: 'More topics', lessTags: 'Less', noResults: 'No articles match your search.', readMore: 'Read the article →', related: 'Related articles',
    by: 'By', published: 'Published', updated: 'Updated',
    shareLabel: 'Share this article', copyLink: 'Copy link', copied: 'Copied',
    footer: '© 2026 · DynaSec Consultants · Articles for educational purposes',
    notFoundTitle: 'Article not found', notFoundText: 'The article you are looking for may have been moved or removed.', notFoundLink: 'See all articles'
  }
};

const ICON_BAD = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FF7A7A" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="7.2"/><path d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6"/></svg>';
const ICON_GOOD = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#4FD1C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="7.2"/><path d="M5.6 9.3l2.4 2.4 4.4-4.9"/></svg>';
const ICON_ARROW = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- paths and language helpers ----------
function listPath(lang) { return lang === 'en' ? '/en/blog' : '/blog'; }
function postPath(lang, slug) { return listPath(lang) + '/' + encodeURIComponent(slug); }
function pick(o, base, lang) {
  const th = o[base + '_th'], en = o[base + '_en'];
  return lang === 'en' ? (en || th || '') : (th || en || '');
}
function hasEnglish(p) { return !!(p.title_en && p.body_en); }
function available(p, lang) { return lang === 'th' || hasEnglish(p); }
// Scheduled publishing: a post with a future `publish_at` (ISO date-time, e.g. 2026-10-22T08:00:00+07:00)
// stays hidden everywhere until that moment. No `publish_at` (or an unreadable one) means published now.
const clock = { now: () => Date.now() };
function isPublished(p) {
  if (!p || !p.publish_at) return true;
  const t = Date.parse(p.publish_at);
  return isNaN(t) || t <= clock.now();
}
function sorted(posts) {
  return posts.filter(p => p && p.slug && /^[a-z0-9-]+$/.test(p.slug) && isPublished(p))
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.publish_at || '').localeCompare(String(a.publish_at || '')));
}
// Slugs that may be linked right now; set while a post page is rendered so links to
// articles that are scheduled but not yet live render as plain text instead of a 404.
let liveSlugs = null;
function isoDate(d) { return /^\d{4}-\d{2}-\d{2}/.test(String(d || '')) ? String(d).slice(0, 10) : ''; }
function fmtDate(d, lang) {
  const dt = new Date(isoDate(d) + 'T00:00:00Z');
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(T[lang].dateLocale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function withBrand(title) { return title.length > 52 ? title : title + ' | ' + TITLE_SUFFIX; }
function truncate(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length <= n ? s : s.slice(0, n - 1).trim() + '…';
}

// ---------- body rendering ----------
function inline(s, lang) {
  let h = esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    if (url.indexOf('post:') === 0) {
      const slug = url.slice(5);
      return /^[a-z0-9-]+$/.test(slug) && (!liveSlugs || liveSlugs.has(slug)) ? `<a href="${postPath(lang, slug)}">${text}</a>` : text;
    }
    if (/^\/(?!\/)/.test(url)) return `<a href="${url}">${text}</a>`;
    if (/^https:\/\//.test(url)) return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
    return text;
  });
  return h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
function blockHtml(b, lang) {
  if (b.startsWith('## ')) return `<h2>${inline(b.slice(3), lang)}</h2>`;
  const lines = b.split('\n');
  if (lines.every(l => l.trim().startsWith('- '))) {
    return `<ul>${lines.map(l => `<li>${inline(l.trim().slice(2), lang)}</li>`).join('')}</ul>`;
  }
  return `<p>${lines.map(l => inline(l, lang)).join('<br>')}</p>`;
}
function renderBody(text, lang, injections) {
  const inject = injections || {};
  const codes = [];
  const src = String(text || '').replace(/\r/g, '').replace(/```([a-z0-9_-]*)\n([\s\S]*?)\n```/gi, (m, l, c) => { codes.push({ l, c }); return '@@CODE' + (codes.length - 1) + '@@'; });
  let n = 0;
  return src.split(/\n{2,}/).map(block => {
    const b = block.trim();
    if (!b) return '';
    n += 1;
    const m = b.match(/^@@CODE(\d+)@@$/);
    const html = m
      ? `<pre><code${codes[+m[1]].l ? ` class="language-${esc(codes[+m[1]].l)}"` : ''}>${esc(codes[+m[1]].c)}</code></pre>`
      : blockHtml(b, lang);
    return html + (inject[n] || '');
  }).join('');
}

// ---------- infographics ----------
function levelColor(r) {
  const stops = [[255, 122, 122], [255, 176, 32], [79, 209, 197]];
  const x = Math.min(1, Math.max(0, r)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const t = x - i;
  return 'rgb(' + [0, 1, 2].map(k => Math.round(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * t)).join(',') + ')';
}
function igSteps(g, lang) {
  return '<div class="ig-steps">' + (g.items || []).map((it, i) => `
    <div class="ig-step"><div class="ig-num">${i + 1}</div>
      <div><div class="t">${esc(pick(it, 'label', lang))}</div><div class="d">${esc(pick(it, 'detail', lang))}</div></div></div>`).join('') + '</div>';
}
function igSpectrum(g, lang) {
  const items = g.items || [];
  const max = Math.max(1, ...items.map(it => Number(it.level) || 1));
  const a = pick(g, 'label_a', lang), b = pick(g, 'label_b', lang);
  return `<div class="ig-spec" style="--n:${items.length || 1}">` + items.map(it => {
    const lv = Number(it.level) || 1;
    const r = max > 1 ? (lv - 1) / (max - 1) : 1;
    return `<div class="ig-spec-item"><div class="ig-bar" style="--r:${r.toFixed(2)};--c:${levelColor(r)}"></div>
      <div class="t">${esc(pick(it, 'label', lang))}</div><div class="d">${esc(pick(it, 'detail', lang))}</div></div>`;
  }).join('') + '</div>' + ((a || b) ? `<div class="ig-axis"><span>${esc(a)}</span><span>${esc(b)}</span></div>` : '');
}
function igFlow(g, lang) {
  const tones = { danger: 'danger', ok: 'ok' };
  const nodes = (g.items || []).map((it, i) => `
    <div class="ig-node ${tones[it.tone] || ''}"><div class="k">${String(i + 1).padStart(2, '0')}</div>
      <div class="t">${esc(pick(it, 'label', lang))}</div><div class="d">${esc(pick(it, 'detail', lang))}</div></div>`);
  return '<div class="ig-flow">' + nodes.join(`<div class="ig-arrow">${ICON_ARROW}</div>`) + '</div>';
}
function igColumns(g, lang) {
  const col = (side, icon) => {
    const rows = (g.items || []).filter(it => (it.side || 'a') === side).map(it => `
      <li>${icon}<span>${esc(pick(it, 'label', lang))}${pick(it, 'detail', lang) ? `<span class="d">${esc(pick(it, 'detail', lang))}</span>` : ''}</span></li>`).join('');
    return `<div class="ig-col ${side}"><h4>${esc(pick(g, 'label_' + side, lang))}</h4><ul>${rows}</ul></div>`;
  };
  return '<div class="ig-cols">' + col('a', ICON_BAD) + col('b', ICON_GOOD) + '</div>';
}
function igHub(g, lang) {
  const items = g.items || [];
  const note = pick(g, 'center_note', lang);
  return `<div class="ig-hub-center"><div class="t">${esc(pick(g, 'center', lang))}</div>${note ? `<div class="d">${esc(note)}</div>` : ''}</div>
    <div class="ig-hub-grid${items.length > 5 ? ' wrap' : ''}" style="--n:${items.length > 5 ? Math.ceil(items.length / 2) : (items.length || 1)}">` + items.map(it => `
      <div class="ig-pillar"><div class="t">${esc(pick(it, 'label', lang))}</div><div class="d">${esc(pick(it, 'detail', lang))}</div></div>`).join('') + '</div>';
}
function renderInfographics(p, lang) {
  const builders = { steps: igSteps, spectrum: igSpectrum, flow: igFlow, columns: igColumns, hub: igHub };
  const out = {};
  (p.infographics || []).forEach(g => {
    const build = builders[g.type];
    if (!build) return;
    const title = pick(g, 'title', lang);
    const at = Math.max(1, parseInt(g.afterBlock, 10) || 1);
    out[at] = (out[at] || '') + `<figure class="infographic" style="margin-left:0;margin-right:0">
      <div class="ig-label">INFOGRAPHIC</div>
      ${title ? `<figcaption class="ig-title">${esc(title)}</figcaption>` : ''}
      ${build(g, lang)}
    </figure>`;
  });
  return out;
}

// ---------- page shell ----------
function jsonLd(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}
function pageShell({ lang, title, description, canonical, alternates, ogType, extraHead, body, noindex, altLangHref, navCurrent }) {
  const t = T[lang];
  const links = [
    ['/#about', t.nav.about], ['/#services', t.nav.services], ['/solutions.html', t.nav.solutions], ['/assessment.html', t.nav.assessment],
    [listPath(lang), t.nav.blog, true], ['/#cases', t.nav.cases], ['/#news', t.nav.news],
    ['/#certs', t.nav.certs], ['/#contact', t.nav.contact]
  ].map(([href, label, cur]) => `<a href="${href}"${cur ? ' class="current" aria-current="page"' : ''}>${esc(label)}</a>`).join('\n      ');
  const other = lang === 'th' ? 'en' : 'th';
  const toggle = `<div class="lang-toggle" role="group" aria-label="Language">
      ${lang === 'th' ? '<a class="active" href="' + esc(altLangHref.th) + '" hreflang="th" aria-current="true">TH</a>' : '<a href="' + esc(altLangHref.th) + '" hreflang="th">TH</a>'}
      ${altLangHref.en ? (lang === 'en' ? '<a class="active" href="' + esc(altLangHref.en) + '" hreflang="en" aria-current="true">EN</a>' : '<a href="' + esc(altLangHref.en) + '" hreflang="en">EN</a>') : '<span class="off" title="English version not available">EN</span>'}
    </div>`;
  const alt = (alternates || []).map(a => `<link rel="alternate" hreflang="${a.lang}" href="${esc(a.href)}">`).join('\n');
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${alt}
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:image" content="${OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
<link rel="icon" href="/assets/icon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${extraHead || ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/blog.css">
<link rel="stylesheet" href="/assets/modern.css">
<script src="/assets/modern.js" defer></script>
</head>
<body>
<header>
  <div class="nav">
    <a class="brand" href="/" aria-label="DynaSec Consultants">
      <img src="/assets/logo-full.png" alt="DynaSec Consultants" width="120" height="44">
    </a>
    <nav class="links" aria-label="Main">
      ${links}
    </nav>
    ${toggle}
  </div>
</header>
${body}
<footer>
  <div class="wrap foot-main">
    <div class="foot-brand">
      <img src="/assets/logo-full.png" alt="DynaSec Consultants" width="130" height="48" loading="lazy">
      <p><span class="t-th">ที่ปรึกษาโซลูชัน Cybersecurity ช่วยออกแบบโซลูชัน จัดทำ PoC ตอบ RFP และสรุปความเสี่ยงให้ผู้บริหาร</span><span class="t-en">Cybersecurity solution consulting: solution design, PoC delivery, RFP responses and executive risk summaries.</span></p>
    </div>
    <nav class="foot-nav" aria-label="Footer">
      <a class="t-th" href="/">หน้าแรก</a><a class="t-en" href="/">Home</a>
      <a class="t-th" href="/solutions.html">โซลูชัน</a><a class="t-en" href="/solutions.html">Solutions</a>
      <a class="t-th" href="/assessment.html">ประเมินเบื้องต้น</a><a class="t-en" href="/assessment.html">Self-assessment</a>
      <a class="t-th" href="/blog">บทความ</a><a class="t-en" href="/en/blog">Blog</a>
      <a class="t-th" href="/#cases">ผลงาน</a><a class="t-en" href="/#cases">Case studies</a>
      <a class="t-th" href="/#news">ข่าว Cyber Attack</a><a class="t-en" href="/#news">Cyber news</a>
      <a class="t-th" href="/#certs">ใบรับรอง</a><a class="t-en" href="/#certs">Certifications</a>
      <a class="t-th" href="/#contact">ติดต่อ</a><a class="t-en" href="/#contact">Contact</a>
    </nav>
  </div>
  <div class="foot-note"><div class="wrap"><span>${esc(t.footer)}</span></div></div>
</footer>
</body>
</html>`;
}

// ---------- list page ----------
function renderList(posts, lang) {
  const t = T[lang];
  const list = sorted(posts).filter(p => available(p, lang));
  const tagCount = {};
  list.forEach(p => (p.tags || []).forEach(x => { tagCount[x] = (tagCount[x] || 0) + 1; }));
  const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a] || a.localeCompare(b));
  const TOP_TAGS = 10;
  const url = SITE + listPath(lang);
  const alternates = [{ lang: 'th', href: SITE + listPath('th') }, { lang: 'en', href: SITE + listPath('en') }, { lang: 'x-default', href: SITE + listPath('th') }];
  const cards = list.map(p => `
    <article class="post-card" data-tags="${esc((p.tags || []).join('|'))}">
      <div class="post-meta"><time datetime="${isoDate(p.date)}">${esc(fmtDate(p.date, lang))}</time></div>
      <h2><a class="card-link" href="${postPath(lang, p.slug)}">${esc(pick(p, 'title', lang))}</a></h2>
      <p>${esc(pick(p, 'summary', lang))}</p>
      <div class="tags">${(p.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <span class="read-more" aria-hidden="true">${esc(t.readMore)}</span>
    </article>`).join('');
  const chipHtml = (x, i) =>
    `<button type="button" class="chip${i === 0 ? ' active' : ''}" data-tag="${esc(x)}"${i > TOP_TAGS ? ' hidden data-extra="1"' : ''}>${esc(x || t.all)}</button>`;
  const chips = tags.length
    ? [''].concat(tags).map(chipHtml).join('') +
      (tags.length > TOP_TAGS ? `<button type="button" class="chip more" data-more="1" aria-expanded="false" data-more-label="${esc(t.moreTags)}" data-less-label="${esc(t.lessTags)}">+ ${esc(t.moreTags)}</button>` : '')
    : '';
  const PAGE = 12;
  const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const ld = jsonLd({
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.listTitle, description: t.listDesc, url, inLanguage: t.htmlLang,
    mainEntity: { '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + postPath(lang, p.slug), name: pick(p, 'title', lang) })) }
  });
  const hashScript = `<script>(function(){var m=location.hash.match(/^#\\/([a-z0-9-]+)$/);if(m){location.replace(${JSON.stringify(listPath(lang) + '/')}+m[1]);return;}
var PAGE=${PAGE},tag='',q='',limit=PAGE;
var cards=[].slice.call(document.querySelectorAll('.post-card')),btn=document.getElementById('load-more'),none=document.getElementById('no-results'),search=document.getElementById('post-search');
function norm(x){return (x||'').toLowerCase();}
function render(){var shown=0,matched=0;cards.forEach(function(c){var tg=(c.getAttribute('data-tags')||'').split('|');
var ok=(!tag||tg.indexOf(tag)>-1)&&(!q||norm(c.textContent).indexOf(q)>-1);if(ok){matched++;}
var vis=ok&&matched<=limit;c.hidden=!vis;if(vis)shown++;});
if(btn){btn.hidden=matched<=limit;var left=matched-limit;var sp=btn.querySelector('span');if(sp&&left>0)sp.textContent=' ('+left+')';}
if(none)none.classList.toggle('show',matched===0);}
document.addEventListener('click',function(e){var more=e.target.closest&&e.target.closest('.chip.more');
if(more){var open=more.getAttribute('aria-expanded')!=='true';more.setAttribute('aria-expanded',open?'true':'false');
document.querySelectorAll('.chip[data-extra]').forEach(function(c){c.hidden=!open;});more.textContent=open?'− '+more.getAttribute('data-less-label'):'+ '+more.getAttribute('data-more-label');return;}
var b=e.target.closest&&e.target.closest('.chip');if(b){tag=b.getAttribute('data-tag')||'';
document.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('active',c===b)});limit=PAGE;render();return;}
if(btn&&e.target.closest&&e.target.closest('#load-more')){limit+=PAGE;render();}});
if(search){search.addEventListener('input',function(){q=norm(search.value.trim());limit=PAGE;render();});}
render();})();</script>`;
  const body = `<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">${esc(t.home)}</a><span>›</span><span>${esc(t.nav.blog)}</span></nav>
    <h1>${esc(t.listH1)}</h1>
    <p class="sub">${esc(t.listSub)}</p>
  </div>
</section>
<section class="main">
  <div class="wrap">
    <div class="list-tools">
      <div class="search-box">${searchIcon}<input id="post-search" type="search" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}" autocomplete="off"></div>
      <div class="tag-filter">${chips}</div>
    </div>
    <div class="post-grid">${cards}</div>
    <p class="no-results" id="no-results">${esc(t.noResults)}</p>
    <div class="load-more"><button type="button" id="load-more" class="btn btn-ghost">${esc(t.showMore)}<span></span></button></div>
  </div>
</section>
${hashScript}`;
  return pageShell({
    lang, title: withBrand(t.listTitle), description: t.listDesc, canonical: url, alternates, extraHead: ld, body,
    altLangHref: { th: listPath('th'), en: listPath('en') }
  });
}

// ---------- post page ----------
function relatedFor(p, posts, lang) {
  const mine = new Set(p.tags || []);
  return sorted(posts).filter(x => x.slug !== p.slug && available(x, lang))
    .map(x => ({ x, score: (x.tags || []).filter(tg => mine.has(tg)).length }))
    .sort((a, b) => b.score - a.score || String(b.x.date).localeCompare(String(a.x.date)))
    .slice(0, 3).map(o => o.x);
}
function renderPost(posts, slug, lang) {
  const t = T[lang];
  const live = sorted(posts);
  const p = live.find(x => x.slug === slug);
  if (!p || !available(p, lang)) return null;
  liveSlugs = new Set(live.filter(x => available(x, lang)).map(x => x.slug));
  const title = pick(p, 'title', lang);
  const summary = pick(p, 'summary', lang);
  const url = SITE + postPath(lang, p.slug);
  const published = isoDate(p.date);
  const modified = isoDate(p.updated) || published;
  const alternates = [{ lang: 'th', href: SITE + postPath('th', p.slug) }];
  if (hasEnglish(p)) alternates.push({ lang: 'en', href: SITE + postPath('en', p.slug) });
  alternates.push({ lang: 'x-default', href: SITE + postPath('th', p.slug) });
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting', headline: truncate(title, 110), description: summary, url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        datePublished: published, dateModified: modified, inLanguage: t.htmlLang,
        author: { '@type': 'Person', name: BRAND, url: SITE + '/' },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE + '/', logo: { '@type': 'ImageObject', url: LOGO_URL } },
        image: [OG_IMAGE], keywords: (p.tags || []).join(', ')
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.home, item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: t.nav.blog, item: SITE + listPath(lang) },
          { '@type': 'ListItem', position: 3, name: title, item: url }
        ]
      }
    ]
  });
  const rel = relatedFor(p, posts, lang);
  const related = rel.length ? `<aside class="related" aria-labelledby="rel-h"><h2 id="rel-h">${esc(t.related)}</h2><ul>${rel.map(x =>
    `<li><a class="t" href="${postPath(lang, x.slug)}">${esc(pick(x, 'title', lang))}</a><span class="s">${esc(pick(x, 'summary', lang))}</span></li>`).join('')}</ul></aside>` : '';
  const copyScript = `<script>(function(){var b=document.getElementById('copy-link');if(!b||!navigator.clipboard)return;b.addEventListener('click',function(){navigator.clipboard.writeText(location.href).then(function(){var o=b.textContent;b.textContent=${JSON.stringify(t.copied)};setTimeout(function(){b.textContent=o},1500);});});})();</script>`;
  const body = `<section class="main">
  <div class="wrap">
    <article class="article">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">${esc(t.home)}</a><span>›</span><a href="${listPath(lang)}">${esc(t.nav.blog)}</a><span>›</span><span>${esc(truncate(title, 48))}</span></nav>
      <div class="tags">${(p.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <h1>${esc(title)}</h1>
      <div class="byline"><span>${esc(t.by)} ${BRAND}</span><span>${esc(t.published)} <time datetime="${published}">${esc(fmtDate(p.date, lang))}</time></span>${modified !== published ? `<span>${esc(t.updated)} <time datetime="${modified}">${esc(fmtDate(modified, lang))}</time></span>` : ''}</div>
      <div class="article-body">${renderBody(pick(p, 'body', lang), lang, renderInfographics(p, lang))}</div>
      <div class="share"><span>${esc(t.shareLabel)}</span><button type="button" id="copy-link">${esc(t.copyLink)}</button></div>
      ${related}
    </article>
  </div>
</section>
${copyScript}`;
  return pageShell({
    lang, title: withBrand(title), description: summary, canonical: url, alternates, ogType: 'article',
    extraHead: ld + `\n<meta property="article:published_time" content="${published}">\n<meta property="article:modified_time" content="${modified}">\n` +
      (p.tags || []).map(x => `<meta property="article:tag" content="${esc(x)}">`).join('\n'),
    body,
    altLangHref: { th: postPath('th', p.slug), en: hasEnglish(p) ? postPath('en', p.slug) : '' }
  });
}

function renderNotFound(lang) {
  const t = T[lang];
  const body = `<section class="main"><div class="wrap notfound"><h1>${esc(t.notFoundTitle)}</h1><p>${esc(t.notFoundText)}</p><p><a class="t" style="color:var(--teal)" href="${listPath(lang)}">${esc(t.notFoundLink)}</a></p></div></section>`;
  return pageShell({ lang, title: `${t.notFoundTitle} | ${TITLE_SUFFIX}`, description: t.notFoundText, noindex: true, body, altLangHref: { th: listPath('th'), en: listPath('en') } });
}

// ---------- sitemap ----------
function renderSitemap(posts) {
  const list = sorted(posts);
  const url = (loc, lastmod, alts) => `  <url>\n    <loc>${esc(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}${(alts || []).map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${esc(a.href)}"/>`).join('\n')}${alts && alts.length ? '\n' : ''}  </url>`;
  const newest = list.map(p => isoDate(p.updated) || isoDate(p.date)).sort().pop();
  const entries = [
    url(SITE + '/', null),
    url(SITE + '/solutions.html', null),
    url(SITE + '/assessment.html', null),
    url(SITE + '/blog', newest, [{ lang: 'th', href: SITE + '/blog' }, { lang: 'en', href: SITE + '/en/blog' }, { lang: 'x-default', href: SITE + '/blog' }]),
    url(SITE + '/en/blog', newest, [{ lang: 'th', href: SITE + '/blog' }, { lang: 'en', href: SITE + '/en/blog' }, { lang: 'x-default', href: SITE + '/blog' }])
  ];
  list.forEach(p => {
    const alts = [{ lang: 'th', href: SITE + postPath('th', p.slug) }];
    if (hasEnglish(p)) alts.push({ lang: 'en', href: SITE + postPath('en', p.slug) });
    alts.push({ lang: 'x-default', href: SITE + postPath('th', p.slug) });
    const mod = isoDate(p.updated) || isoDate(p.date);
    entries.push(url(SITE + postPath('th', p.slug), mod, alts));
    if (hasEnglish(p)) entries.push(url(SITE + postPath('en', p.slug), mod, alts));
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + entries.join('\n') + '\n</urlset>\n';
}

// The three newest published articles as home-page cards (also served by api/latest.js).
function renderLatest(posts, lang, limit) {
  const list = sorted(posts).filter(p => available(p, lang)).slice(0, limit || 3);
  const base = lang === 'en' ? '/en/blog/' : '/blog/';
  return list.map(p => `
    <article class="latest-card">
      <time datetime="${isoDate(p.date)}">${esc(fmtDate(p.date, lang))}</time>
      <h3><a class="card-link" href="${base}${encodeURIComponent(p.slug)}">${esc(pick(p, 'title', lang))}</a></h3>
      <p>${esc(pick(p, 'summary', lang))}</p>
    </article>`).join('');
}

module.exports = { SITE, renderList, renderPost, renderNotFound, renderSitemap, renderLatest, isPublished, clock, hasEnglish, postPath, listPath };
