// Build-time prerendering. The home and solutions pages load their editable content
// (content/*.json) with JavaScript. This fills the same content into the HTML at deploy
// time so search engines see it in the initial response. Thai is the default language;
// the page script still takes over in the browser and handles the TH/EN toggle.

const SITE = 'https://www.dynasec.pro';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// The CMS allows <br> in short text boxes (e.g. the name/title box); keep that and escape the rest.
function escBr(s) { return esc(s).replace(/&lt;br\s*\/?&gt;/gi, '<br>'); }

function fill(html, name, content) {
  const re = new RegExp('(<!--ssr:' + name + '-->)[\\s\\S]*?(<!--/ssr:' + name + '-->)');
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  return html.replace(re, (m, a, b) => a + content + b);
}

function isoDate(d) { return /^\d{4}-\d{2}-\d{2}/.test(String(d || '')) ? String(d).slice(0, 10) : ''; }
function fmtDate(d, locale) {
  const dt = new Date(isoDate(d) + 'T00:00:00Z');
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function pick(o, base, lang) {
  const th = o[base + '_th'], en = o[base + '_en'];
  return lang === 'en' ? (en || th || '') : (th || en || '');
}

function casesHtml(cases) {
  return (cases.items || []).map(c => `
    <div class="case-card">
      <div class="industry">${esc(c.industry_th)}</div>
      <div class="field"><div class="k">โจทย์</div><div class="v">${esc(c.challenge_th)}</div></div>
      <hr>
      <div class="field"><div class="k">แนวทาง</div><div class="v">${esc(c.approach_th)}</div></div>
      <hr>
      <div class="field"><div class="k">ผลลัพธ์</div><div class="v">${esc(c.outcome_th)}</div></div>
    </div>`).join('');
}
function certsHtml(certs) {
  return (certs.items || []).map(c => `
    <div class="cert"><div class="dot"></div><div class="name">${esc(c.name)}<small>${esc(c.issuer)}</small></div></div>`).join('');
}
function latestHtml(posts, lang) {
  const list = posts.filter(p => p && p.slug && /^[a-z0-9-]+$/.test(p.slug) && (lang === 'th' || (p.title_en && p.body_en)))
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
  const base = lang === 'en' ? '/en/blog/' : '/blog/';
  return list.map(p => `
    <article class="latest-card">
      <time datetime="${isoDate(p.date)}">${esc(fmtDate(p.date, lang === 'en' ? 'en-US' : 'th-TH'))}</time>
      <h3><a class="card-link" href="${base}${encodeURIComponent(p.slug)}">${esc(pick(p, 'title', lang))}</a></h3>
      <p>${esc(pick(p, 'summary', lang))}</p>
    </article>`).join('');
}

function homeJsonLd(about, certs) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Anurak', inLanguage: ['th', 'en'] },
      {
        '@type': 'Person', '@id': SITE + '/#person', name: 'Anurak', url: SITE + '/',
        jobTitle: 'Pre-Sales Engineer, Cybersecurity', description: about.bio_th || undefined,
        knowsAbout: about.tags || [],
        hasCredential: (certs.items || []).map(c => ({
          '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: 'certification',
          recognizedBy: { '@type': 'Organization', name: c.issuer }
        }))
      }
    ]
  };
  return '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>';
}

function prerenderHome(html, d) {
  const about = d.about, posts = d.blog || [];
  let out = html;
  out = fill(out, 'avatar', escBr(about.avatar_th));
  out = fill(out, 'bio1', esc(about.bio_th));
  out = fill(out, 'bio2', esc(about.bio2_th));
  out = fill(out, 'tags', (about.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join(''));
  out = fill(out, 'email', esc(about.email));
  out = fill(out, 'location', esc(about.location_th));
  out = fill(out, 'cases', casesHtml(d.cases));
  out = fill(out, 'certs', certsHtml(d.certs));
  out = fill(out, 'jsonld', homeJsonLd(about, d.certs));
  const th = latestHtml(posts, 'th');
  if (th) {
    out = fill(out, 'latest-th', th);
    out = fill(out, 'latest-en', latestHtml(posts, 'en'));
    out = out.replace('<section id="latest" hidden>', '<section id="latest">');
  }
  return out;
}

function prerenderSolutions(html, sol) {
  const cards = (sol.items || []).map((s, i) => `
    <div class="solution-card">
      <div class="head">
        <h2>${esc(s.name_th)}</h2>
        <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <div class="row">
        <div class="k">ภัยคุกคามที่ควบคุม</div>
        <div class="v muted">${esc(s.threat_th)}</div>
      </div>
      <div class="row">
        <div class="k">หน้าที่หลัก</div>
        <div class="v">${esc(s.fn_th)}</div>
      </div>
      <div class="row">
        <div class="k">ตัวอย่างเทคโนโลยี</div>
        <div class="tools-row">${(s.tools || []).map(t => `<span class="tool-chip">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>`).join('');
  return fill(html, 'solutions', cards);
}

module.exports = { prerenderHome, prerenderSolutions, fill };
