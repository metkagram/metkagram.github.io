import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "data", "contrast-extensions.json");
const API_URL = `${SITE_URL}/api/v1`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (relativePath, content) => {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const writeJson = (relativePath, value) => write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
const clean = (value = "") => String(value).replaceAll("**", "").replaceAll(/\s+/g, " ").trim();
const lang = (pattern, code) => pattern?.langs?.find((item) => item.lang === code) || null;

function local(item, key, locale) {
  return item[`${key}_${locale}`] || item[`${key}_en`] || "";
}

function validate(source, patternMap, existingIds) {
  if (source?.schemaVersion !== 1) throw new Error("contrast-extensions.json must use schemaVersion 1");
  if (!Array.isArray(source.pair_items) || !Array.isArray(source.grammar_items)) throw new Error("contrast extension arrays are required");
  const ids = new Set(existingIds);
  for (const item of [...source.pair_items, ...source.grammar_items]) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate contrast id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    for (const field of ["title_en", "title_ru", "question_en", "question_ru", "distinction_en", "distinction_ru"]) {
      if (!item[field]?.trim()) throw new Error(`${item.id} is missing ${field}`);
    }
    if (item.review_status !== "reviewed") throw new Error(`${item.id} must be reviewed`);
  }
  for (const item of source.pair_items) {
    if (!Array.isArray(item.patterns) || item.patterns.length !== 2) throw new Error(`${item.id} must reference two patterns`);
    if (item.patterns[0] === item.patterns[1]) throw new Error(`${item.id} repeats the same pattern`);
    for (const id of item.patterns) if (!patternMap.has(id)) throw new Error(`${item.id} references missing pattern ${id}`);
  }
  for (const item of source.grammar_items) {
    if (!patternMap.has(item.pattern_id)) throw new Error(`${item.id} references missing pattern ${item.pattern_id}`);
    for (const side of ["left", "right"]) {
      if (!item[side]?.label || !item[side]?.meaning_en || !item[side]?.meaning_ru) throw new Error(`${item.id} is missing ${side} content`);
    }
  }
}

function copy(locale) {
  return locale === "ru"
    ? {
        question: "Как выбрать",
        difference: "Главное различие",
        first: "Первая модель",
        second: "Вторая модель",
        formula: "Формула",
        example: "Пример",
        openPattern: "Открыть исходный паттерн",
        all: "Все сравнения",
        newSection: "Новые проверенные сравнения",
        newIntro: "Поисковые сравнения добавляются только там, где различие можно объяснить через форму, значение или речевую функцию, а не через случайную разницу в словах.",
        grammar: "Грамматический выбор",
        reasoning: "Речевая функция",
      }
    : {
        question: "How to choose",
        difference: "Core distinction",
        first: "First pattern",
        second: "Second pattern",
        formula: "Formula",
        example: "Example",
        openPattern: "Open canonical pattern",
        all: "All contrasts",
        newSection: "More reviewed comparisons",
        newIntro: "Search-focused comparisons are added only when the difference can be explained through form, meaning, or communicative function rather than superficial wording.",
        grammar: "Grammar choice",
        reasoning: "Reasoning choice",
      };
}

function patternSummary(pattern, locale, label) {
  const en = lang(pattern, "en");
  const de = lang(pattern, "de");
  const detail = locale === "ru"
    ? clean(pattern.reasoning?.what_it_does_ru || pattern.metaphor_ru || pattern.practice?.cue || "")
    : clean(pattern.reasoning?.what_it_does_en || pattern.practice?.cue || pattern.logic || "");
  return `<article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(label)} · ${escapeHtml(pattern.id)}</p><h2>${escapeHtml(clean(en?.formula || pattern.id))}</h2><p>${escapeHtml(detail)}</p><dl><div><dt>EN</dt><dd>${escapeHtml(clean(en?.formula))}</dd></div><div><dt>DE</dt><dd>${escapeHtml(clean(de?.formula))}</dd></div></dl><a class="text-link" href="/${locale}/practice/${pattern.id.toLowerCase()}/">${escapeHtml(copy(locale).openPattern)} <span aria-hidden="true">→</span></a></article>`;
}

function pairPage(locale, item, patternMap) {
  const t = copy(locale);
  const first = patternMap.get(item.patterns[0]);
  const second = patternMap.get(item.patterns[1]);
  const title = local(item, "title", locale);
  const question = local(item, "question", locale);
  const distinction = local(item, "distinction", locale);
  const pathname = `/${locale}/contrasts/${item.id}/`;
  const firstEn = lang(first, "en");
  const secondEn = lang(second, "en");
  const body = `<article class="pattern-reader section-pad"><p class="eyebrow">Metkagram · Contrast · ${escapeHtml(item.relation)}</p><h1>${escapeHtml(title)}</h1><p class="lede"><strong>${escapeHtml(t.question)}:</strong> ${escapeHtml(question)}</p><section class="pattern-variations"><h2>${escapeHtml(t.difference)}</h2><p>${escapeHtml(distinction)}</p></section><section class="pattern-variations"><div class="pattern-comparison-list">${patternSummary(first, locale, t.first)}${patternSummary(second, locale, t.second)}</div></section><section class="pattern-variations"><h2>${locale === "ru" ? "Примеры" : "Examples"}</h2><div class="pattern-comparison-list"><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(first.id)}</p><p><strong>${escapeHtml(t.formula)}:</strong> ${escapeHtml(clean(firstEn?.formula))}</p><p><strong>${escapeHtml(t.example)}:</strong> ${escapeHtml(clean(firstEn?.example))}</p></article><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(second.id)}</p><p><strong>${escapeHtml(t.formula)}:</strong> ${escapeHtml(clean(secondEn?.formula))}</p><p><strong>${escapeHtml(t.example)}:</strong> ${escapeHtml(clean(secondEn?.example))}</p></article></div></section><nav class="legal-inline-links"><a href="/${locale}/contrasts/">${escapeHtml(t.all)}</a></nav></article>`;
  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description: distinction,
    body,
    pageType: "LearningResource",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: title,
      description: distinction,
      educationalLevel: "B2–C1",
      learningResourceType: "Pattern comparison",
      url: `${SITE_URL}${pathname}`,
      isAccessibleForFree: true,
      about: item.patterns.map((id) => ({ "@type": "DefinedTerm", name: id, url: `${SITE_URL}/${locale}/practice/${id.toLowerCase()}/` })),
    }],
  });
}

function grammarPage(locale, item, patternMap) {
  const t = copy(locale);
  const pattern = patternMap.get(item.pattern_id);
  const en = lang(pattern, "en");
  const de = lang(pattern, "de");
  const title = local(item, "title", locale);
  const question = local(item, "question", locale);
  const distinction = local(item, "distinction", locale);
  const pathname = `/${locale}/contrasts/${item.id}/`;
  const meaningKey = locale === "ru" ? "meaning_ru" : "meaning_en";
  const body = `<article class="pattern-reader section-pad"><p class="eyebrow">Metkagram · ${escapeHtml(t.grammar)} · ${escapeHtml(item.pattern_id)}</p><h1>${escapeHtml(title)}</h1><p class="lede"><strong>${escapeHtml(t.question)}:</strong> ${escapeHtml(question)}</p><section class="pattern-variations"><h2>${escapeHtml(t.difference)}</h2><p>${escapeHtml(distinction)}</p></section><section class="pattern-variations"><div class="pattern-comparison-list"><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(t.first)}</p><h2>${escapeHtml(item.left.label)}</h2><p>${escapeHtml(item.left[meaningKey])}</p></article><article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(t.second)}</p><h2>${escapeHtml(item.right.label)}</h2><p>${escapeHtml(item.right[meaningKey])}</p></article></div></section><section class="pattern-variations"><h2>${locale === "ru" ? "Один паттерн, два значения" : "One contrast pattern, two meanings"}</h2><p><strong>EN:</strong> ${escapeHtml(clean(en?.formula))}</p><p><strong>${escapeHtml(t.example)}:</strong> ${escapeHtml(clean(en?.example))}</p><p><strong>DE:</strong> ${escapeHtml(clean(de?.formula))}</p></section><nav class="legal-inline-links"><a href="/${locale}/practice/${item.pattern_id.toLowerCase()}/">${escapeHtml(t.openPattern)}</a><a href="/${locale}/contrasts/">${escapeHtml(t.all)}</a></nav></article>`;
  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description: distinction,
    body,
    pageType: "LearningResource",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: title,
      description: distinction,
      educationalLevel: "B2–C1",
      learningResourceType: "Grammar contrast",
      url: `${SITE_URL}${pathname}`,
      isAccessibleForFree: true,
      teaches: [item.left.label, item.right.label],
      about: { "@type": "DefinedTerm", name: item.pattern_id, url: `${SITE_URL}/${locale}/practice/${item.pattern_id.toLowerCase()}/` },
    }],
  });
}

function patchIndex(locale, source) {
  const file = path.join(DIST, locale, "contrasts", "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing contrast index for ${locale}`);
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-contrast-growth")) return;
  const t = copy(locale);
  const cards = [
    ...source.grammar_items.map((item) => ({ ...item, type: t.grammar })),
    ...source.pair_items.map((item) => ({ ...item, type: t.reasoning })),
  ].map((item) => `<li class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(item.type)} · ${escapeHtml(item.relation)}</p><h2><a href="/${locale}/contrasts/${item.id}/">${escapeHtml(local(item, "title", locale))}</a></h2><p>${escapeHtml(local(item, "question", locale))}</p><a class="text-link" href="/${locale}/contrasts/${item.id}/">${locale === "ru" ? "Сравнить" : "Compare"} <span aria-hidden="true">→</span></a></li>`).join("");
  const section = `<section class="section-pad ruled" data-contrast-growth><p class="eyebrow">SEO · reviewed contrasts</p><h2>${escapeHtml(t.newSection)}</h2><p>${escapeHtml(t.newIntro)}</p><ol class="pattern-comparison-list">${cards}</ol></section>`;
  html = html.replace("</main>", `${section}</main>`);
  fs.writeFileSync(file, html);
}

function patchPatternBacklinks(locale, pairItems, grammarItems) {
  const byPattern = new Map();
  const add = (patternId, item) => {
    if (!byPattern.has(patternId)) byPattern.set(patternId, []);
    byPattern.get(patternId).push(item);
  };
  for (const item of pairItems) for (const id of item.patterns) add(id, item);
  for (const item of grammarItems) add(item.pattern_id, item);
  for (const [patternId, items] of byPattern) {
    const file = path.join(DIST, locale, "practice", patternId.toLowerCase(), "index.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes("data-contrast-backlinks")) continue;
    const links = items.map((item) => `<a href="/${locale}/contrasts/${item.id}/">${escapeHtml(local(item, "title", locale))} <span aria-hidden="true">→</span></a>`).join("");
    const section = `<section class="section-pad ruled" data-contrast-backlinks><p class="eyebrow">Contrast Library</p><h2>${locale === "ru" ? "Сравните с близкой конструкцией" : "Compare with a nearby structure"}</h2><div class="legal-inline-links">${links}</div></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchSitemap(routes) {
  const file = path.join(DIST, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  const additions = routes.filter((route) => !xml.includes(`<loc>${SITE_URL}${route}</loc>`))
    .map((route) => `  <url><loc>${SITE_URL}${route}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>`)
    .join("\n");
  if (additions) xml = xml.replace("</urlset>", `${additions}\n</urlset>`);
  fs.writeFileSync(file, xml);
}

function patchSeo(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  const value = readJson(file);
  const byRoute = new Map((value.pages || []).map((page) => [page.route, page]));
  for (const record of records) byRoute.set(record.route, record);
  value.pages = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  writeJson("seo/site-pages.json", value);
}

function patchApiAndData(source) {
  const base = readJson(path.join(DIST, "data", "contrasts.json"));
  const existing = new Set(base.items.map((item) => item.id));
  const pairItems = source.pair_items.filter((item) => !existing.has(item.id));
  const merged = { ...base, items: [...base.items, ...pairItems] };
  writeJson("data/contrasts.json", merged);
  writeJson("api/v1/contrasts.json", wrapRecord(merged, {
    canonical_url: `${API_URL}/contrasts.json`,
    record_type: "pattern_contrast_collection",
    record_id: "public-pattern-contrasts",
  }));

  const grammar = {
    schemaVersion: 1,
    status: source.status,
    description: "Reviewed within-pattern grammar contrasts for high-confusion form and meaning choices.",
    items: source.grammar_items,
  };
  writeJson("data/grammar-contrasts.json", grammar);
  writeJson("api/v1/grammar-contrasts.json", wrapRecord(grammar, {
    canonical_url: `${API_URL}/grammar-contrasts.json`,
    record_type: "grammar_contrast_collection",
    record_id: "public-grammar-contrasts",
  }));

  const indexFile = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(indexFile)) {
    const index = readJson(indexFile);
    index.counts = { ...(index.counts || {}), contrasts: merged.items.length, grammarContrasts: grammar.items.length };
    index.endpoints ||= [];
    if (!index.endpoints.some((item) => item.path === "/grammar-contrasts.json")) index.endpoints.push({ path: "/grammar-contrasts.json", url: `${API_URL}/grammar-contrasts.json`, type: "collection", description: "Reviewed high-confusion grammar contrasts" });
    index.datasets ||= [];
    const existingGrammar = index.datasets.find((item) => item.id === "grammar-contrasts");
    if (existingGrammar) existingGrammar.count = grammar.items.length;
    else index.datasets.push({ id: "grammar-contrasts", label: "Reviewed grammar contrasts", count: grammar.items.length, url: `${API_URL}/grammar-contrasts.json` });
    const contrastDataset = index.datasets.find((item) => item.id === "contrasts");
    if (contrastDataset) contrastDataset.count = merged.items.length;
    writeJson("api/v1/index.json", index);
  }

  const catalogFile = path.join(DIST, "data", "catalog.json");
  if (fs.existsSync(catalogFile)) {
    const catalog = readJson(catalogFile);
    catalog.contrasts = {
      reviewedPairCount: merged.items.length,
      grammarContrastCount: grammar.items.length,
      pages: { en: `${SITE_URL}/en/contrasts/`, ru: `${SITE_URL}/ru/contrasts/` },
      pairDataset: `${SITE_URL}/data/contrasts.json`,
      grammarDataset: `${SITE_URL}/data/grammar-contrasts.json`,
    };
    writeJson("data/catalog.json", catalog);
  }
}

function patchLlms() {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("## High-confusion contrasts")) return;
  text += `\n## High-confusion contrasts\n- Contrast Library: ${SITE_URL}/en/contrasts/\n- Reviewed pair comparisons: ${SITE_URL}/data/contrasts.json\n- Reviewed grammar contrasts: ${SITE_URL}/data/grammar-contrasts.json\n- Use a contrast page when the learner is choosing between two easily confused forms or nearby communicative moves. Do not treat surface similarity as a reviewed contrast.\n`;
  fs.writeFileSync(file, text);
}

const source = readJson(SOURCE);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
const baseContrasts = readJson(path.join(DIST, "data", "contrasts.json"));
validate(source, patternMap, baseContrasts.items.map((item) => item.id));

const routes = [];
const records = [];
for (const locale of ["en", "ru"]) {
  for (const item of source.pair_items) {
    const route = `/${locale}/contrasts/${item.id}/`;
    const html = pairPage(locale, item, patternMap);
    write(`${locale}/contrasts/${item.id}/index.html`, html);
    routes.push(route);
    records.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: `${local(item, "title", locale)} | Metkagram`, description: local(item, "distinction", locale), lastModified: SITE_RELEASE_DATE });
  }
  for (const item of source.grammar_items) {
    const route = `/${locale}/contrasts/${item.id}/`;
    const html = grammarPage(locale, item, patternMap);
    write(`${locale}/contrasts/${item.id}/index.html`, html);
    routes.push(route);
    records.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: `${local(item, "title", locale)} | Metkagram`, description: local(item, "distinction", locale), lastModified: SITE_RELEASE_DATE });
  }
  patchIndex(locale, source);
  patchPatternBacklinks(locale, source.pair_items, source.grammar_items);
}

patchApiAndData(source);
writeJson("data/contrast-extensions.json", source);
patchSitemap(routes);
patchSeo(records);
patchLlms();

console.log(`Contrast growth: ${source.pair_items.length} reviewed pair contrasts + ${source.grammar_items.length} reviewed grammar contrasts.`);
