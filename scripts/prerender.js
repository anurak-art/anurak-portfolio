// Runs at deploy time (see buildCommand in vercel.json). Fills editable content into the
// home and solutions pages so crawlers see it without running JavaScript.
// Each page is handled independently; on any error the original file is left untouched,
// so a problem here can never take the site down.
const fs = require('fs');
const path = require('path');
const P = require('../lib/prerender');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const json = f => JSON.parse(read(f));

try {
  const html = P.prerenderHome(read('index.html'), {
    about: json('content/about.json'),
    cases: json('content/cases.json'),
    certs: json('content/certifications.json'),
    blog: (json('content/blog.json').items || [])
  });
  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log('prerender: index.html ok');
} catch (e) {
  console.error('prerender: index.html skipped -', e.message);
}

try {
  const html = P.prerenderSolutions(read('solutions.html'), json('content/solutions.json'));
  fs.writeFileSync(path.join(root, 'solutions.html'), html);
  console.log('prerender: solutions.html ok');
} catch (e) {
  console.error('prerender: solutions.html skipped -', e.message);
}
process.exit(0);
