import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { buildIntentDataset } from "../src/intent-discovery.mjs";
import { intentDiscoveryPage } from "../src/intent-pages.mjs";
import { intentSearchText, intentTaxonomy, intentsForMove } from "../src/intents.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const LOCALES = ["en", "ru"];
const FEATURED_INTENTS = [
  "disagree-politely",
  "correct-an-assumption",
  "set-a-condition",
  "explain-a-cause",
  "draw-a-conclusion",
  "compare-alternatives"
];

function localized(locale, en, ru) {
  return locale === "ru" ? ru : en;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function writeFile(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(DIST, relativePath), "utf8");
}

function metaRecord(route, html, locale) {
  const match = (pattern) => html.match(pattern)?.[1] || "";
  return {
    route,
    canonical: match(/<link rel="canonical" href="([^"]+)">/),
    language: locale,
    title: match(/<title>([^<]+)<\/title>/),
    description: match(/<meta name="description" content="([^"]+)">/),
    lastModified: SITE_RELEASE_DATE
  };
}

function updateSeoInventory(pages) {
  const seoPath = path.join(DIST, "seo", "site-pages.json");
  const inventory = JSON.parse(fs.readFileSync(seoPath, "utf8"));
  const routes = new Set(pages.map((page) => page.route));
  inventory.pages = inventory.pages.filter((page) => !routes.has(page.route));
  inventory.pages.push(...pages);
  inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
  fs.writeFileSync(seoPath, `${JSON.stringify(inventory, null, 2)}\n`);
}

function updateSitemap(routes) {
  const sitemapPath = path.join(DIST, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  for (const route of routes) {
    const url = `${SITE_URL}${route}`;
    if (sitemap.includes(`<loc>${url}</loc>`)) continue;
    sitemap = sitemap.replace("\n</urlset>", `\n  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

function updateCatalog(dataset) {
  const catalogPath = path.join(DIST, "data", "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  catalog.intentDiscovery = {
    count: dataset.intentCount,
    reasoningMoveCount: dataset.reasoningMoveCount,
    dataset: `${SITE_URL}/data/intents.json`,
    routes: {
      en: `${SITE_URL}/en/practice/intents/`,
      ru: `${SITE_URL}/ru/practice/intents/`
    }
  };
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
}

function updateProject(dataset) {
  const projectPath = path.join(DIST, "project.json");
  const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
  project.intentDiscovery = {
    intents: dataset.intentCount,
    reasoningMoves: dataset.reasoningMoveCount,
    dataset: `${SITE_URL}/data/intents.json`
  };
  fs.writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);
}

function updateLlms() {
  const llmsPath = path.join(DIST, "llms.txt");
  let llms = fs.readFileSync(llmsPath, "utf8");
  if (llms.includes("## Intent discovery")) return;
  llms += `\n## Intent discovery\n- Human intent index: ${SITE_URL}/data/intents.json\n- English intent browser: ${SITE_URL}/en/practice/intents/\n- Russian intent browser: ${SITE_URL}/ru/practice/intents/\n- Use intent records to map a communicative goal to a reasoning move and then to attributed Metkagram patterns.\n`;
  fs.writeFileSync(llmsPath, llms);
}

function intentTitle(intent, locale) {
  return locale === "ru" ? intent.title_ru : intent.title_en;
}

function practiceIntentSection(locale) {
  const featured = FEATURED_INTENTS.map((id) => intentTaxonomy.find((intent) => intent.id === id)).filter(Boolean);
  const cards = featured.map((intent) => `<a href="/${locale}/practice/intents/#intent-${intent.id}"><span class="document-number">${escapeHtml(intent.move)}</span><span><strong>${escapeHtml(intentTitle(intent, locale))}</strong><small>${escapeHtml(locale === "ru" ? intent.description_ru : intent.description_en)}</small></span><span aria-hidden="true">→</span></a>`).join("");
  return `<section class="section-pad ruled" data-intent-discovery="practice"><p class="eyebrow">${localized(locale, "Intent discovery", "Поиск по намерению")}</p><h2>${localized(locale, "What do you want the sentence to do?", "Что должна сделать ваша фраза?")}</h2><p class="lede">${localized(locale, "Start from a goal such as disagreeing politely or correcting an assumption. Metkagram maps it to a reasoning move and reusable English/German frames.", "Начните с цели: например, вежливо не согласиться или исправить предположение. Metkagram свяжет её с логической операцией и английскими/немецкими каркасами.")}</p><div class="pattern-index">${cards}</div><p><a href="/${locale}/practice/intents/">${localized(locale, "Browse all 18 intents", "Все 18 намерений")} →</a></p></section>`;
}

function enrichPracticeSearch(html, locale, content) {
  let enhanced = html;
  for (const pattern of content.advancedPatterns.filter((item) => item.reasoning?.move)) {
    const intents = intentsForMove(pattern.reasoning.move);
    const terms = intents.map(intentSearchText).join(" ").replaceAll('"', "&quot;");
    const href = patternPath(locale, pattern);
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patternRegex = new RegExp(`(<a href="${escapedHref}"[^>]*data-search-text=")([^"]*)(")`);
    enhanced = enhanced.replace(patternRegex, (_, start, search, end) => `${start}${search} ${terms}${end}`);
  }
  return enhanced;
}

function enhancePractice(locale, content) {
  const relative = path.join(locale, "practice", "index.html");
  let html = readFile(relative);
  if (!html.includes('data-intent-discovery="practice"')) {
    const reasoningMarker = '<section class="section-pad ruled connectivity-section" data-connectivity="reasoning-nav">';
    const toolsMarker = '<section id="all-patterns" class="practice-tools';
    const section = practiceIntentSection(locale);
    if (html.includes(reasoningMarker)) html = html.replace(reasoningMarker, `${section}${reasoningMarker}`);
    else if (html.includes(toolsMarker)) html = html.replace(toolsMarker, `${section}${toolsMarker}`);
    else throw new Error(`Unable to inject intent discovery into ${relative}`);
  }
  html = enrichPracticeSearch(html, locale, content);
  writeFile(relative, html);
}

function enhanceReasoningPattern(locale, pattern) {
  if (!pattern.reasoning?.move) return;
  const intents = intentsForMove(pattern.reasoning.move);
  if (!intents.length) return;
  const relative = path.join(patternPath(locale, pattern).slice(1), "index.html");
  let html = readFile(relative);
  if (html.includes('data-intent-discovery="pattern"')) return;
  const cards = intents.map((intent) => `<a href="/${locale}/practice/intents/#intent-${intent.id}"><span class="document-number">${escapeHtml(intent.move)}</span><span><strong>${escapeHtml(intentTitle(intent, locale))}</strong><small>${escapeHtml(locale === "ru" ? intent.description_ru : intent.description_en)}</small></span><span aria-hidden="true">→</span></a>`).join("");
  const section = `<section class="section-pad ruled connectivity-section" data-intent-discovery="pattern"><p class="eyebrow">${localized(locale, "Use this move when you want to…", "Используйте этот ход, когда хотите…")}</p><div class="pattern-index connectivity-index">${cards}</div></section>`;
  const marker = '<div data-connectivity="pattern">';
  if (!html.includes(marker)) throw new Error(`Reasoning pattern ${pattern.id} has no connectivity container`);
  html = html.replace(marker, `${marker}${section}`);
  writeFile(relative, html);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the base build first");
  const content = loadContent();
  const dataset = buildIntentDataset(content);
  writeFile("data/intents.json", `${JSON.stringify(dataset, null, 2)}\n`);

  const seoPages = [];
  const routes = [];
  for (const locale of LOCALES) {
    const route = `/${locale}/practice/intents/`;
    const html = intentDiscoveryPage(locale, content);
    writeFile(path.join(locale, "practice", "intents", "index.html"), html);
    seoPages.push(metaRecord(route, html, locale));
    routes.push(route);
    enhancePractice(locale, content);
    for (const pattern of content.advancedPatterns) enhanceReasoningPattern(locale, pattern);
  }

  updateSeoInventory(seoPages);
  updateSitemap(routes);
  updateCatalog(dataset);
  updateProject(dataset);
  updateLlms();
  process.stdout.write(`Intent discovery: ${dataset.intentCount} intents across ${dataset.reasoningMoveCount} reasoning moves.\n`);
}

main();
