import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

function htmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name === 'index.html' ? [target] : [];
  });
}

function addModuleScript(file, src) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(`src="${src}"`)) return false;
  if (!html.includes('</body>')) throw new Error(`Missing </body> in ${file}`);
  html = html.replace('</body>', `  <script type="module" src="${src}"></script>\n</body>`);
  fs.writeFileSync(file, html);
  return true;
}

function ensureStylesheet(file, href) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(`href="${href}"`)) return true;
  if (!html.includes('</head>')) throw new Error(`Missing </head> in ${file}`);
  html = html.replace('</head>', `  <link rel="stylesheet" href="${href}">\n</head>`);
  fs.writeFileSync(file, html);
  return true;
}

let practicePages = 0;
let patternPages = 0;
let lensPages = 0;

for (const locale of ['en', 'ru']) {
  for (const file of htmlFiles(path.join(DIST, locale, 'practice'))) {
    const isPatternPage = file.includes(`${path.sep}patterns${path.sep}`);
    if (isPatternPage) {
      const hasStyles = ensureStylesheet(file, '/assets/pattern-reading.css');
      const hasControls = addModuleScript(file, '/assets/pattern-reading.js') || fs.readFileSync(file, 'utf8').includes('src="/assets/pattern-reading.js"');
      if (hasStyles && hasControls) patternPages += 1;
      continue;
    }

    if (addModuleScript(file, '/assets/practice-loop.js') || fs.readFileSync(file, 'utf8').includes('src="/assets/practice-loop.js"')) practicePages += 1;
  }

  const lens = path.join(DIST, locale, 'lens', 'index.html');
  if (addModuleScript(lens, '/assets/lens-practice-bridge.js') || (fs.existsSync(lens) && fs.readFileSync(lens, 'utf8').includes('src="/assets/lens-practice-bridge.js"'))) lensPages += 1;
}

if (!practicePages) throw new Error('Active practice runtime was not attached to any non-pattern practice pages');
if (!patternPages) throw new Error('Pattern reading assets were not attached to any pattern pages');
console.log(`Active practice wired into ${practicePages} non-pattern practice pages; reading assets wired into ${patternPages} pattern pages; Lens bridge wired into ${lensPages} Pattern Lens pages.`);
