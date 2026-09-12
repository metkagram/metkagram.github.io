import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const sitemapFile = path.join(DIST, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) throw new Error('Internal Discovery requires the final rendered sitemap.');
const xml = fs.readFileSync(sitemapFile, 'utf8');
const canonicalUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&').trim());
if (!canonicalUrls.length) throw new Error('Internal Discovery found no sitemap URLs.');
const origin = new URL(canonicalUrls[0]).origin;

function fileFor(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return path.join(DIST, 'index.html');
  if (pathname.endsWith('/')) return path.join(DIST, pathname.slice(1), 'index.html');
  return path.join(DIST, pathname.slice(1));
}
function cleanText(value = '') {
  return String(value).replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/gi, '&').replace(/&#0?39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
}
function noindex(html) { return /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html); }
function canonical(html) { return html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] || ''; }
function h1(html) { return cleanText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ''); }
function isLearning(url, html) {
  const pathname = new URL(url).pathname;
  return /"@type"\s*:\s*"LearningResource"/.test(html) || /^\/(?:en|ru)\/(?:patterns|practice|lens|contrasts|clinic|glossary)(?:\/|$)/.test(pathname);
}
function mainHtml(html) { return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || ''; }
function normalizeTarget(href, base) {
  try {
    const url = new URL(href, base);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = ''; url.search = '';
    return url.href;
  } catch { return null; }
}
function jobFor(url) {
  const p = new URL(url).pathname;
  if (p.includes('/patterns/')) return 'Pattern Atlas';
  if (p.includes('/practice/')) return 'Pattern Practice';
  if (p.includes('/lens/')) return 'Pattern Lens';
  if (p.includes('/contrasts/')) return 'Pattern Contrast';
  if (p.includes('/clinic/')) return 'Pattern Choice';
  if (p.includes('/glossary/')) return 'Glossary';
  return 'Continue learning';
}
function relative(url) { const p = new URL(url); return `${p.pathname}${p.search}${p.hash}`; }

const pages = new Map();
for (const url of canonicalUrls) {
  const file = fileFor(url);
  if (!fs.existsSync(file) || !file.endsWith('.html')) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (canonical(html) !== url || noindex(html)) continue;
  pages.set(url, { url, file, html, title: h1(html), learning: isLearning(url, html) });
}
const learningUrls = new Set([...pages.values()].filter((page) => page.learning).map((page) => page.url));
const enhanced = [];
const utilities = [];
for (const page of pages.values()) {
  if (!page.learning) continue;
  let html = page.html;
  const main = mainHtml(html);
  const links = [];
  const seen = new Set();
  for (const match of main.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const target = normalizeTarget(match[1], page.url);
    if (!target || target === page.url || !learningUrls.has(target) || seen.has(target)) continue;
    const text = cleanText(match[2]);
    if (!text || text.length < 3) continue;
    seen.add(target);
    links.push(target);
  }

  const shareBar = html.match(/<aside\b[^>]*class=["'][^"']*share-bar[^"']*["'][^>]*data-share-bar[\s\S]*?<\/aside>/i)?.[0] || '';
  if (shareBar && !shareBar.includes('data-save-page')) {
    const addition = `<button type="button" class="share-button" data-save-page aria-pressed="false">Save</button><button type="button" class="share-button" data-cite-page>Cite</button>`;
    html = html.replace(/(<div class="share-actions">[\s\S]*?)(<\/div><output class="share-feedback")/i, `$1${addition}$2`);
    utilities.push(page.url);
  } else if (shareBar && shareBar.includes('data-save-page')) utilities.push(page.url);

  if (links.length >= 2 && !html.includes('data-internal-discovery-continuation')) {
    const cards = links.slice(0, 3).map((target) => {
      const targetPage = pages.get(target);
      return `<a class="internal-continuation-card" href="${relative(target)}"><span>${jobFor(target)}</span><strong>${targetPage?.title || cleanText(new URL(target).pathname)}</strong><small>Continue through a canonical Metkagram learning surface already linked from this page.</small></a>`;
    }).join('');
    const locale = new URL(page.url).pathname.startsWith('/ru/') ? 'ru' : 'en';
    const label = locale === 'ru' ? 'Продолжить обучение' : 'Continue learning';
    const heading = locale === 'ru' ? 'Выберите следующий полезный маршрут.' : 'Choose the next useful route.';
    const block = `<section class="section-pad ruled internal-continuation" data-internal-discovery-continuation><p class="eyebrow">${label}</p><h2>${heading}</h2><div class="internal-continuation-grid">${cards}</div></section>`;
    html = html.replace('</main>', `${block}</main>`);
    enhanced.push(page.url);
  }
  if ((html.includes('data-save-page') || html.includes('data-internal-discovery-continuation')) && !html.includes('src="/assets/internal-discovery.js"')) {
    html = html.replace('</body>', '<script src="/assets/internal-discovery.js" defer></script></body>');
  }
  if (html !== page.html) fs.writeFileSync(page.file, html);
}

const cssFile = path.join(DIST, 'assets', 'styles.css');
let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes('/* ARWP Internal Discovery & Distribution */')) {
  css += `\n/* ARWP Internal Discovery & Distribution */\n.internal-continuation-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:1.1rem}.internal-continuation-card{display:flex;flex-direction:column;gap:.42rem;padding:1rem;border:1px solid currentColor;text-decoration:none}.internal-continuation-card span{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.internal-continuation-card strong{font-size:1.02rem}.internal-continuation-card small{line-height:1.4}.share-button[aria-pressed="true"]{outline:2px solid currentColor;outline-offset:2px}@media(max-width:760px){.internal-continuation-grid{grid-template-columns:1fr}}\n`;
  fs.writeFileSync(cssFile, css);
}
fs.writeFileSync(path.join(DIST, 'assets', 'internal-discovery.js'), `(()=>{const canonical=()=>document.querySelector('link[rel="canonical"]')?.href||location.href;const title=()=>document.querySelector('h1')?.textContent?.trim()||document.title;const key='metkagram:saved-pages';const feedback=(button,msg)=>{const bar=button.closest('[data-share-bar]');const out=bar?.querySelector('[data-share-feedback]');if(out){out.textContent=msg;setTimeout(()=>out.textContent='',2200)}};document.querySelectorAll('[data-save-page]').forEach(button=>{try{const saved=new Set(JSON.parse(localStorage.getItem(key)||'[]'));button.setAttribute('aria-pressed',String(saved.has(canonical())))}catch{}button.addEventListener('click',()=>{try{const url=canonical(),saved=new Set(JSON.parse(localStorage.getItem(key)||'[]'));if(saved.has(url)){saved.delete(url);button.setAttribute('aria-pressed','false');feedback(button,'Removed from this browser')}else{saved.add(url);button.setAttribute('aria-pressed','true');feedback(button,'Saved in this browser')}localStorage.setItem(key,JSON.stringify([...saved]))}catch{feedback(button,'Could not save')}})});document.querySelectorAll('[data-cite-page]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(\`Metkagram. \${title()}. \${canonical()}\`);feedback(button,'Citation copied')}catch{feedback(button,'Could not copy citation')}}))})();`);

const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), arwpRevision: '793483e3404a97f7892e86bcda3fd317d5c7427c', canonicalPageCount: pages.size, learningPageCount: learningUrls.size, continuationPages: enhanced.sort(), utilityPages: utilities.sort(), method: 'derived only from already-rendered same-origin canonical learning links' };
fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'data', 'internal-discovery.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Internal Discovery & Distribution applied: ${learningUrls.size} canonical learning pages reviewed, ${enhanced.length} continuation blocks, ${utilities.length} existing share bars extended with Save/Cite.`);
