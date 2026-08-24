import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { patternPath, patternUrl } from "../src/seo-slugs.mjs";
import { validateContrastLibrary } from "../src/source-validation.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "data", "contrasts.json");
const API_URL = `${SITE_URL}/api/v1`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeFile(relativePath, contents) {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function writeJson(relativePath, value) {
  writeFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function patchJson(relativePath, mutate) {
  const target = path.join(DIST, relativePath);
  if (!fs.existsSync(target)) return;
  const value = readJson(target);
  mutate(value);
  writeJson(relativePath, value);
}

function clean(value = "") {
  return String(value).replaceAll("**", "").trim();
}

function languageRecord(pattern, lang) {
  return pattern.langs?.find((item) => item.lang === lang) || null;
}

function copy(locale) {
  return locale === "ru"
    ? {
        indexEyebrow: "Metkagram · различия между моделями",
        indexTitle: "Похожие конструкции, разные логические задачи.",
        indexIntro: "Contrast Library объясняет, когда две близкие речевые модели нельзя считать взаимозаменяемыми. Сравнение строится поверх стабильных Metkagram pattern ID и проверяемых примеров.",
        open: "Сравнить",
        question: "Как выбрать",
        first: "Первая модель",
        second: "Вторая модель",
        difference: "Главное различие",
        examples: "Канонические примеры",
        formula: "Формула",
        example: "Пример",
        pattern: "Открыть модель",
        all: "Все сравнения",
        practice: "Практиковать речевые модели",
        bridgeTitle: "Не уверены, какую модель выбрать?",
        bridgeText: "Сравнения показывают разницу в логической функции, а не просто похожие слова. Начните с конкретной задачи, затем откройте исходную модель для практики.",
      }
    : {
        indexEyebrow: "Metkagram · pattern contrasts",
        indexTitle: "Similar structures, different reasoning jobs.",
        indexIntro: "Contrast Library explains when two nearby reusable patterns are not interchangeable. Every comparison stays anchored to stable Metkagram pattern IDs and reviewed examples.",
        open: "Compare",
        question: "How to choose",
        first: "First pattern",
        second: "Second pattern",
        difference: "Core distinction",
        examples: "Canonical examples",
        formula: "Formula",
        example: "Example",
        pattern: "Open pattern",
        all: "All contrasts",
        practice: "Practise reusable patterns",
        bridgeTitle: "Not sure which pattern fits?",
        bridgeText: "Contrasts explain a difference in communicative or reasoning function, not just a difference in wording. Start from the job you need to do, then open the canonical pattern for practice.",
      };
}

function summary(pattern, locale, label) {
  const lang = languageRecord(pattern, "en");
  const german = languageRecord(pattern, "de");
  const title = locale === "ru" ? (pattern.title_ru || pattern.id) : clean(lang?.formula || pattern.id);
  const detail = locale === "ru"
    ? clean(pattern.reasoning?.what_it_does_ru || pattern.metaphor_ru || "")
    : clean(pattern.reasoning?.what_it_does_en || "");
  return `<article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(label)} · ${escapeHtml(pattern.id)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p><dl><div><dt>EN</dt><dd>${escapeHtml(clean(lang?.formula))}</dd></div><div><dt>DE</dt><dd>${escapeHtml(clean(german?.formula))}</dd></div></dl><a class="text-link" href="${patternPath(locale, pattern)}">${escapeHtml(copy(locale).pattern)} <span aria-hidden="true">→</span></a></article>`;
}

function indexPage(locale, source, patternMap) {
  const t = copy(locale);
  const items = source.items.map((item) => {
    const first = patternMap.get(item.patterns[0]);
    const second = patternMap.get(item.patterns[1]);
    const firstFormula = clean(languageRecord(first, "en")?.formula || first.id);
    const secondFormula = clean(languageRecord(second, "en")?.formula || second.id);
    const title = locale === "ru" ? item.title_ru : item.title_en;
    const question = locale === "ru" ? item.question_ru : item.question_en;
    return `<li class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(item.relation)}</p><h2><a href="/${locale}/contrasts/${item.id}/">${escapeHtml(title)}</a></h2><p>${escapeHtml(question)}</p><small>${escapeHtml(firstFormula)} · ${escapeHtml(secondFormula)}</small><a class="text-link" href="/${locale}/contrasts/${item.id}/">${escapeHtml(t.open)} <span aria-hidden="true">→</span></a></li>`;
  }).join("");

  const pathname = `/${locale}/contrasts/`;
  const body = `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.indexEyebrow)}</p><h1>${escapeHtml(t.indexTitle)}</h1><p class="lede">${escapeHtml(t.indexIntro)}</p></section><section class="section-pad ruled"><ol class="pattern-comparison-list">${items}</ol></section>`;
  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "ru" ? "Сравнения речевых моделей Metkagram" : "Metkagram Pattern Contrasts",
    numberOfItems: source.items.length,
    itemListElement: source.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/${locale}/contrasts/${item.id}/`,
      name: locale === "ru" ? item.title_ru : item.title_en,
    })),
  }];
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Сравнение речевых моделей | Metkagram" : "Pattern contrasts | Metkagram",
    description: t.indexIntro,
    body,
    pageType: "CollectionPage",
    structuredData,
  });
}

function detailPage(locale, item, patternMap) {
  const t = copy(locale);
  const first = patternMap.get(item.patterns[0]);
  const second = patternMap.get(item.patterns[1]);
  const firstEn = languageRecord(first, "en");
  const secondEn = languageRecord(second, "en");
  const title = locale === "ru" ? item.title_ru : item.title_en;
  const question = locale === "ru" ? item.question_ru : item.question_en;
  const distinction = locale === "ru" ? item.distinction_ru : item.distinction_en;
  const pathname = `/${locale}/contrasts/${item.id}/`;

  const body = `<article class="pattern-reader section-pad"><p class="eyebrow">Metkagram · Contrast · ${escapeHtml(item.relation)}</p><h1>${escapeHtml(title)}</h1><p class="lede"><strong>${escapeHtml(t.question)}:</strong> ${escapeHtml(question)}</p><section class="pattern-variations"><h2>${escapeHtml(t.difference)}</h2><p>${escapeHtml(distinction)}</p></section><section class="pattern-variations"><div class="pattern-comparison-list">${summary(first, locale, t.first)}${summary(second, locale, t.second)}</div></section><section class="pattern-variations"><h2>${escapeHtml(t.examples)}</h2><div class="pattern-comparison-list"><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(first.id)}</p><p><strong>${escapeHtml(t.formula)}:</strong> ${escapeHtml(clean(firstEn?.formula))}</p><p><strong>${escapeHtml(t.example)}:</strong> ${escapeHtml(clean(firstEn?.example))}</p></article><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(second.id)}</p><p><strong>${escapeHtml(t.formula)}:</strong> ${escapeHtml(clean(secondEn?.formula))}</p><p><strong>${escapeHtml(t.example)}:</strong> ${escapeHtml(clean(secondEn?.example))}</p></article></div></section><nav class="legal-inline-links"><a href="/${locale}/contrasts/">${escapeHtml(t.all)}</a><a href="/${locale}/practice/">${escapeHtml(t.practice)}</a></nav></article>`;

  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description: distinction,
    inLanguage: locale,
    educationalLevel: "B2-C1",
    learningResourceType: "Pattern comparison",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    url: `${SITE_URL}${pathname}`,
    about: item.patterns.map((id) => ({ "@type": "DefinedTerm", name: id, url: patternUrl(locale, id) })),
  }];

  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description: distinction,
    body,
    pageType: "LearningResource",
    structuredData,
  });
}

function patchDiscoveryBridge(locale) {
  const t = copy(locale);
  const targets = [
    path.join(DIST, locale, "practice", "index.html"),
    path.join(DIST, locale, "patterns", "index.html"),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(`/${locale}/contrasts/`)) continue;
    const section = `<section class="section-pad ruled" data-contrast-library-bridge><p class="eyebrow">Contrast Library</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/contrasts/">${escapeHtml(t.all)} <span aria-hidden="true">→</span></a></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchSitemap(routes) {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, "utf8");
  const additions = routes
    .filter((route) => !xml.includes(`<loc>${SITE_URL}${route}</loc>`))
    .map((route) => `  <url><loc>${SITE_URL}${route}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>`)
    .join("\n");
  if (additions) xml = xml.replace("</urlset>", `${additions}\n</urlset>`);
  fs.writeFileSync(file, xml);
}

function patchSeoInventory(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  if (!fs.existsSync(file)) return;
  const value = readJson(file);
  value.pages ||= [];
  for (const record of records) {
    if (!value.pages.some((page) => page.route === record.route)) value.pages.push(record);
  }
  value.pages.sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  writeJson("seo/site-pages.json", value);
}

const source = readJson(SOURCE);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
validateContrastLibrary(source, patternMap);

const routes = [];
const seoRecords = [];
for (const locale of ["en", "ru"]) {
  const indexRoute = `/${locale}/contrasts/`;
  const indexTitle = locale === "ru" ? "Сравнение речевых моделей | Metkagram" : "Pattern contrasts | Metkagram";
  const indexDescription = copy(locale).indexIntro;
  writeFile(`${locale}/contrasts/index.html`, indexPage(locale, source, patternMap));
  routes.push(indexRoute);
  seoRecords.push({ route: indexRoute, canonical: `${SITE_URL}${indexRoute}`, language: locale, title: indexTitle, description: indexDescription, lastModified: SITE_RELEASE_DATE });

  for (const item of source.items) {
    const route = `/${locale}/contrasts/${item.id}/`;
    const title = `${locale === "ru" ? item.title_ru : item.title_en} | Metkagram`;
    const description = locale === "ru" ? item.distinction_ru : item.distinction_en;
    writeFile(`${locale}/contrasts/${item.id}/index.html`, detailPage(locale, item, patternMap));
    routes.push(route);
    seoRecords.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title, description, lastModified: SITE_RELEASE_DATE });
  }
  patchDiscoveryBridge(locale);
}

writeJson("data/contrasts.json", source);
writeJson("api/v1/contrasts.json", wrapRecord(source, {
  canonical_url: `${API_URL}/contrasts.json`,
  record_type: "pattern_contrast_collection",
  record_id: "public-pattern-contrasts",
}));

patchJson("api/v1/index.json", (index) => {
  index.counts = { ...(index.counts || {}), contrasts: source.items.length };
  index.endpoints ||= [];
  if (!index.endpoints.some((item) => item.path === "/contrasts.json")) {
    index.endpoints.push({ path: "/contrasts.json", url: `${API_URL}/contrasts.json`, type: "collection", description: "Reviewed comparisons between nearby reusable patterns" });
  }
  index.datasets ||= [];
  if (!index.datasets.some((item) => item.id === "contrasts")) {
    index.datasets.push({ id: "contrasts", label: "Reviewed pattern contrasts", count: source.items.length, url: `${API_URL}/contrasts.json` });
  }
});

patchJson("api/v1/catalog.json", (catalog) => {
  catalog.datasets ||= [];
  if (!catalog.datasets.some((item) => item.id === "contrasts")) {
    catalog.datasets.push({ id: "contrasts", title: "Pattern Contrast Library", description: source.description, count: source.items.length, api_url: `${API_URL}/contrasts.json` });
  }
});

patchJson("data/catalog.json", (catalog) => {
  catalog.contrasts = {
    count: source.items.length,
    dataset: `${SITE_URL}/data/contrasts.json`,
    api: `${API_URL}/contrasts.json`,
    routes: { en: `${SITE_URL}/en/contrasts/`, ru: `${SITE_URL}/ru/contrasts/` },
  };
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_contrasts")) {
    spec.tools.push({
      name: "metkagram_get_contrasts",
      description: "Get reviewed distinctions between nearby reusable language patterns.",
      inputSchema: { type: "object" },
      staticUrl: `${API_URL}/contrasts.json`,
    });
  }
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/contrasts.json"] ||= {
    get: {
      summary: "Reviewed pattern contrasts",
      operationId: "contrasts_json",
      responses: {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: { $ref: `${API_URL}/schemas/api-response.json` } } },
        },
      },
    },
  };
});

patchJson("api/v1/teaching-manifest.json", (manifest) => {
  manifest.resources ||= {};
  manifest.resources.contrasts = `${API_URL}/contrasts.json`;
});

const llmsFile = path.join(DIST, "llms.txt");
if (fs.existsSync(llmsFile)) {
  let text = fs.readFileSync(llmsFile, "utf8");
  if (!text.includes(`${API_URL}/contrasts.json`)) {
    text += `\n## Pattern contrasts\n- Human index: ${SITE_URL}/en/contrasts/\n- Reviewed contrast data: ${API_URL}/contrasts.json\n`;
  }
  fs.writeFileSync(llmsFile, text);
}

patchSitemap(routes);
patchSeoInventory(seoRecords);
console.log(`Contrast Library published: ${source.items.length} reviewed contrasts, ${routes.length} localized routes.`);
