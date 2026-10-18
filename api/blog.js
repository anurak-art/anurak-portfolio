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
  const q = req.query || {};
  const lang = q.lang === 'en' ? 'en' : 'th';
  const slug = typeof q.slug === 'string' ? q.slug : '';
  try {
    const posts = await loadPosts();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    if (!slug) {
      res.status(200).send(R.renderList(posts, lang));
      return;
    }
    const html = R.renderPost(posts, slug, lang);
    if (html) {
      res.status(200).send(html);
      return;
    }
    // English version missing but the Thai article exists: send readers to the Thai URL.
    if (lang === 'en' && R.renderPost(posts, slug, 'th')) {
      res.setHeader('Location', R.postPath('th', slug));
      res.status(302).end();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.status(404).send(R.renderNotFound(lang));
  } catch (err) {
    res.status(500).send('Blog is temporarily unavailable.');
  }
};
