const fs = require('fs');
const path = require('path');
const R = require('../lib/blog-render');

async function loadPosts() {
  const candidates = [
    path.join(__dirname, '..', 'content', 'blog.json'),
    path.join(process.cwd(), 'content', 'blog.json')
  ];
  for (const file of candidates) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')).items || []; } catch (e) { /* try next */ }
  }
  const res = await fetch(R.SITE + '/content/blog.json');
  return (await res.json()).items || [];
}

module.exports = async (req, res) => {
  try {
    const xml = R.renderSitemap(await loadPosts());
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send('Sitemap is temporarily unavailable.');
  }
};
