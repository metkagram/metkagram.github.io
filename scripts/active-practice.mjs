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

let practicePages = 0;
let lensPages = 0;

for (const locale of ['en', 'ru']) {
  for (const file of htmlFiles(path.join(DIST, locale, 'practice'))) {
    if (addModuleScript(file, '/assets/practice-loop.js') || fs.readFileSync(file, 'utf8').includes('src="/assets/practice-loop.js"')) practicePages += 1;
  }
  const lens = path.join(DIST, locale, 'lens', 'index.html');
  if (addModuleScript(lens, '/assets/lens-practice-bridge.js') || (fs.existsSync(lens) && fs.readFileSync(lens, 'utf8').includes('src="/assets/lens-practice-bridge.js"'))) lensPages += 1;
}

if (!practicePages) throw new Error('Active practice runtime was not attached to any practice pages');
console.log(`Active practice wired into ${practicePages} practice pages and ${lensPages} Pattern Lens pages.`);
