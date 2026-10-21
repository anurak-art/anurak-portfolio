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

// Latest published articles for the home page, so scheduled posts appear on time
// without waiting for a new deploy.
module.exports = async (req, res) => {
  try {
    const posts = await loadPosts();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).send(JSON.stringify({ th: R.renderLatest(posts, 'th', 3), en: R.renderLatest(posts, 'en', 3) }));
  } catch (err) {
    res.status(500).json({ error: 'unavailable' });
  }
};
