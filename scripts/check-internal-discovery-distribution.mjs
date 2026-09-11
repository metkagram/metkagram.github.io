import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const manifestFile = path.join(DIST, 'data', 'internal-discovery.json');
if (!fs.existsSync(manifestFile)) throw new Error('Internal Discovery audit: missing dist/data/internal-discovery.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
if (manifest.arwpRevision !== '793483e3404a97f7892e86bcda3fd317d5c7427c') throw new Error('Internal Discovery audit: ARWP revision mismatch');
if (manifest.learningPageCount < 4) throw new Error(`Internal Discovery audit: learning cohort too small (${manifest.learningPageCount})`);
if (manifest.continuationPages.length < 2) throw new Error(`Internal Discovery audit: too few continuation pages (${manifest.continuationPages.length})`);
if (manifest.utilityPages.length < 2) throw new Error(`Internal Discovery audit: too few existing share bars were extended (${manifest.utilityPages.length})`);

const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&').trim()));
function fileFor(url) {
  const p = new URL(url).pathname;
  return p === '/' ? path.join(DIST, 'index.html') : p.endsWith('/') ? path.join(DIST, p.slice(1), 'index.html') : path.join(DIST, p.slice(1));
}
function canonical(html) { return html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] || ''; }
function section(html) { const m = html.match(/<section\b[^>]*data-internal-discovery-continuation[\s\S]*?<\/section>/i); return m?.[0] || ''; }

for (const url of manifest.continuationPages) {
  if (!sitemapUrls.has(url)) throw new Error(`Internal Discovery audit: continuation source not in sitemap ${url}`);
  const file = fileFor(url);
  if (!fs.existsSync(file)) throw new Error(`Internal Discovery audit: missing continuation source HTML ${url}`);
  const html = fs.readFileSync(file, 'utf8');
  if (canonical(html) !== url) throw new Error(`Internal Discovery audit: canonical mismatch ${url}`);
  if (/name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html)) throw new Error(`Internal Discovery audit: noindex continuation source ${url}`);
  if (!html.includes('src="/assets/internal-discovery.js"')) throw new Error(`Internal Discovery audit: helper script missing ${url}`);
  const block = section(html);
  const links = [...block.matchAll(/href=["']([^"']+)["']/g)].map((m) => new URL(m[1], url));
  if (links.length < 2 || links.length > 3) throw new Error(`Internal Discovery audit: expected 2-3 continuation links on ${url}`);
  for (const link of links) {
    link.hash=''; link.search='';
    if (!sitemapUrls.has(link.href)) throw new Error(`Internal Discovery audit: continuation target not canonical sitemap URL ${link.href}`);
  }
}
for (const url of manifest.utilityPages) {
  const html = fs.readFileSync(fileFor(url), 'utf8');
  for (const marker of ['data-share-bar','data-save-page','data-cite-page','src="/assets/internal-discovery.js"']) {
    if (!html.includes(marker)) throw new Error(`Internal Discovery audit: ${url} missing ${marker}`);
  }
}
const css = fs.readFileSync(path.join(DIST, 'assets', 'styles.css'), 'utf8');
if (!css.includes('/* ARWP Internal Discovery & Distribution */')) throw new Error('Internal Discovery audit: CSS marker missing');
if (!fs.existsSync(path.join(DIST, 'assets', 'internal-discovery.js'))) throw new Error('Internal Discovery audit: helper JS missing');
console.log(`Internal Discovery & Distribution audit passed: ${manifest.learningPageCount} canonical learning pages, ${manifest.continuationPages.length} contextual continuation pages, ${manifest.utilityPages.length} existing share bars extended.`);
