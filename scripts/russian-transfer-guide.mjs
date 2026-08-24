import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { patternPath, patternUrl, studySetPath } from "../src/seo-slugs.mjs";
import { validateRussianSpeakerErrors } from "../src/source-validation.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "data", "russian-speaker-errors.json");
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

function copy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "Metkagram · Russian → English transfer",
        hubTitle: "Типичные ошибки русскоязычных в английском — как повторяемые паттерны.",
        hubIntro: "Не список для самокритики, а карта переносов из русского: увидьте ошибочную модель, замените её целевым каркасом и отработайте на примерах.",
        wrong: "Так часто говорят",
        correct: "Нужная модель",
        why: "Почему возникает ошибка",
        remember: "Что запомнить",
        examples: "Ещё примеры",
        practice: "Практиковать исходный паттерн",
        set: "Открыть весь набор Russian-speaker transfer traps",
        related: "Связанные ошибки",
        research: "Исследовательская опора",
        researchIntro: "Раздел не предполагает, что все русскоязычные делают одинаковые ошибки. Он фиксирует повторяющиеся L1→L2 transfer patterns, часть которых хорошо описана в исследованиях learner English.",
        open: "Разобрать ошибку",
        back: "Все ошибки",
        bridgeTitle: "Русский подсказывает английскую конструкцию слишком буквально?",
        bridgeText: "Этот раздел собирает такие случаи отдельно от общего каталога, чтобы ошибка вела сразу к объяснению и тренировочному паттерну.",
        bridgeLink: "Ошибки русскоязычных",
      }
    : {
        eyebrow: "Metkagram · Russian → English transfer",
        hubTitle: "Common English mistakes Russian speakers make — as reusable patterns.",
        hubIntro: "Not a shame list. This is a transfer map: spot the Russian-shaped frame, replace it with the target English pattern, then practise the corrected structure in context.",
        wrong: "Common transfer form",
        correct: "Target English frame",
        why: "Why the error happens",
        remember: "What to remember",
        examples: "More examples",
        practice: "Practise the source pattern",
        set: "Open all Russian-speaker transfer traps",
        related: "Related transfer errors",
        research: "Research grounding",
        researchIntro: "This section does not assume that every Russian speaker makes the same mistakes. It tracks recurring L1→L2 transfer patterns, several of which are well documented in learner-English research.",
        open: "Open explanation",
        back: "All Russian-speaker errors",
        bridgeTitle: "Does Russian keep suggesting the wrong English frame?",
        bridgeText: "This guide isolates recurring transfer errors so each wrong form leads directly to an explanation, corrected frame and practice object.",
        bridgeLink: "Russian-speaker English mistakes",
      };
}

function errorCard(locale, item) {
  const t = copy(locale);
  return `<article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(item.pattern_id)}</p><h2><a href="/${locale}/mistakes/russian-speakers/${item.slug}/">${escapeHtml(local(item, "title", locale))}</a></h2><p><strong>✕</strong> ${escapeHtml(item.wrong_en)}</p><p><strong>✓</strong> ${escapeHtml(item.correct_en)}</p><a class="text-link" href="/${locale}/mistakes/russian-speakers/${item.slug}/">${escapeHtml(t.open)} <span aria-hidden="true">→</span></a></article>`;
}

function hubPage(locale, source) {
  const t = copy(locale);
  const pathname = `/${locale}/mistakes/russian-speakers/`;
  const cards = source.items.map((item) => errorCard(locale, item)).join("");
  const research = source.research.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a><span>${escapeHtml(item.publisher)} · ${item.year}</span></li>`).join("");
  const body = `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)} · ${source.items.length} reviewed patterns</p><h1>${escapeHtml(t.hubTitle)}</h1><p class="lede">${escapeHtml(t.hubIntro)}</p><p class="legal-inline-links"><a href="${studySetPath(locale, "RTR")}">${escapeHtml(t.set)}</a><a href="/${locale}/contrasts/">Contrast Library</a></p></section><section class="section-pad ruled"><div class="pattern-comparison-list">${cards}</div></section><section class="section-pad ruled"><p class="eyebrow">${escapeHtml(t.research)}</p><h2>${escapeHtml(t.research)}</h2><p>${escapeHtml(t.researchIntro)}</p><ul class="research-list">${research}</ul></section>`;
  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "ru" ? "Типичные ошибки русскоязычных в английском" : "Common English mistakes Russian speakers make",
    numberOfItems: source.items.length,
    itemListElement: source.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: local(item, "title", locale),
      url: `${SITE_URL}/${locale}/mistakes/russian-speakers/${item.slug}/`,
    })),
  }];
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Типичные ошибки русскоязычных в английском | Metkagram" : "Common English mistakes Russian speakers make | Metkagram",
    description: locale === "ru" ? source.description_ru : source.description_en,
    body,
    pageType: "CollectionPage",
    structuredData,
  });
}

function exampleRows(pattern) {
  const record = lang(pattern, "en");
  return (record?.examples || []).slice(0, 3).map((item) => `<li><span>${escapeHtml(clean(item.text))}</span><small>${escapeHtml(item.translation_ru || "")}</small></li>`).join("");
}

function relatedCards(locale, source, current) {
  const index = source.items.findIndex((item) => item.id === current.id);
  const candidates = [
    source.items[(index + 1) % source.items.length],
    source.items[(index + 2) % source.items.length],
    source.items[(index + source.items.length - 1) % source.items.length],
  ].filter((item, pos, arr) => item.id !== current.id && arr.findIndex((x) => x.id === item.id) === pos);
  return candidates.map((item) => `<a href="/${locale}/mistakes/russian-speakers/${item.slug}/">${escapeHtml(local(item, "title", locale))} <span aria-hidden="true">→</span></a>`).join("");
}

function detailPage(locale, source, item, patternMap) {
  const t = copy(locale);
  const pattern = patternMap.get(item.pattern_id);
  const en = lang(pattern, "en");
  const pathname = `/${locale}/mistakes/russian-speakers/${item.slug}/`;
  const body = `<article class="pattern-reader section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)} · ${escapeHtml(item.pattern_id)}</p><h1>${escapeHtml(local(item, "title", locale))}</h1><div class="pattern-comparison-list"><section class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(t.wrong)}</p><p class="lede">✕ ${escapeHtml(item.wrong_en)}</p></section><section class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(t.correct)}</p><p class="lede">✓ ${escapeHtml(item.correct_en)}</p></section></div><section class="pattern-variations"><h2>${escapeHtml(t.why)}</h2><p>${escapeHtml(local(item, "why", locale))}</p></section><section class="pattern-variations"><h2>${escapeHtml(t.remember)}</h2><p><strong>${escapeHtml(local(item, "memory", locale))}</strong></p><p>${escapeHtml(clean(en?.formula || ""))}</p></section><section class="pattern-variations"><h2>${escapeHtml(t.examples)}</h2><ul class="pattern-list">${exampleRows(pattern)}</ul></section><section class="pattern-variations"><p class="legal-inline-links"><a href="${patternPath(locale, item.pattern_id)}">${escapeHtml(t.practice)}</a><a href="${studySetPath(locale, "RTR")}">${escapeHtml(t.set)}</a><a href="/${locale}/mistakes/russian-speakers/">${escapeHtml(t.back)}</a></p></section><section class="pattern-variations"><h2>${escapeHtml(t.related)}</h2><div class="legal-inline-links">${relatedCards(locale, source, item)}</div></section></article>`;
  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: local(item, "title", locale),
    description: local(item, "why", locale),
    inLanguage: locale,
    educationalLevel: source.level,
    learningResourceType: "L1 transfer error explanation and practice",
    teaches: item.correct_en,
    audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: source.audience },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    url: `${SITE_URL}${pathname}`,
    about: { "@type": "DefinedTerm", name: item.pattern_id, url: patternUrl(locale, item.pattern_id) },
    citation: source.research.map((research) => ({ "@type": "CreativeWork", name: research.title, url: research.url })),
  }];
  return layout({
    locale,
    pathname,
    title: `${local(item, "search_title", locale)} | Metkagram`,
    description: `${item.wrong_en} → ${item.correct_en}. ${local(item, "why", locale)}`,
    body,
    pageType: "LearningResource",
    structuredData,
  });
}

function patchPracticeBridge(locale) {
  const t = copy(locale);
  const targets = [
    path.join(DIST, locale, "practice", "index.html"),
    path.join(DIST, locale, "practice", "set", "rtr", "index.html"),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(`/${locale}/mistakes/russian-speakers/`)) continue;
    const section = `<section class="section-pad ruled" data-russian-transfer-bridge><p class="eyebrow">Russian → English</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/mistakes/russian-speakers/">${escapeHtml(t.bridgeLink)} <span aria-hidden="true">→</span></a></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchPatternBacklinks(locale, source) {
  for (const item of source.items) {
    const file = path.join(DIST, patternPath(locale, item.pattern_id).slice(1), "index.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(`/${locale}/mistakes/russian-speakers/${item.slug}/`)) continue;
    const section = `<section class="section-pad ruled" data-transfer-error-backlink><p class="eyebrow">Russian → English transfer</p><h2>${escapeHtml(local(item, "title", locale))}</h2><p>✕ ${escapeHtml(item.wrong_en)}<br>✓ ${escapeHtml(item.correct_en)}</p><a class="text-link" href="/${locale}/mistakes/russian-speakers/${item.slug}/">${escapeHtml(copy(locale).open)} <span aria-hidden="true">→</span></a></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchSitemap(routes) {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, "utf8");
  const additions = routes.filter((route) => !xml.includes(`<loc>${SITE_URL}${route}</loc>`))
    .map((route) => `  <url><loc>${SITE_URL}${route}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>`)
    .join("\n");
  if (additions) xml = xml.replace("</urlset>", `${additions}\n</urlset>`);
  fs.writeFileSync(file, xml);
}

function patchSeo(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  if (!fs.existsSync(file)) return;
  const value = readJson(file);
  const byRoute = new Map((value.pages || []).map((page) => [page.route, page]));
  for (const record of records) byRoute.set(record.route, record);
  value.pages = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  writeJson("seo/site-pages.json", value);
}

function patchApi(source) {
  writeJson("data/russian-speaker-errors.json", source);
  writeJson("api/v1/russian-speaker-errors.json", wrapRecord(source, {
    canonical_url: `${API_URL}/russian-speaker-errors.json`,
    record_type: "l1_transfer_error_collection",
    record_id: "russian-speaker-english-errors",
  }));
  const indexFile = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(indexFile)) {
    const index = readJson(indexFile);
    index.counts = { ...(index.counts || {}), russianSpeakerErrors: source.items.length };
    index.endpoints ||= [];
    if (!index.endpoints.some((entry) => entry.path === "/russian-speaker-errors.json")) index.endpoints.push({ path: "/russian-speaker-errors.json", url: `${API_URL}/russian-speaker-errors.json`, type: "collection", description: "Reviewed Russian-to-English transfer errors linked to practice patterns" });
    index.datasets ||= [];
    const existing = index.datasets.find((entry) => entry.id === "russian-speaker-errors");
    if (existing) existing.count = source.items.length;
    else index.datasets.push({ id: "russian-speaker-errors", label: "Russian-speaker English transfer errors", count: source.items.length, url: `${API_URL}/russian-speaker-errors.json` });
    writeJson("api/v1/index.json", index);
  }
  const catalogFile = path.join(DIST, "data", "catalog.json");
  if (fs.existsSync(catalogFile)) {
    const catalog = readJson(catalogFile);
    catalog.russianSpeakerErrors = {
      count: source.items.length,
      page: `${SITE_URL}/en/mistakes/russian-speakers/`,
      dataset: `${SITE_URL}/data/russian-speaker-errors.json`,
      api: `${API_URL}/russian-speaker-errors.json`,
    };
    writeJson("data/catalog.json", catalog);
  }
}

function patchLlms() {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("## Russian-speaker transfer errors")) return;
  text += `\n## Russian-speaker transfer errors\n- Human-readable guide: ${SITE_URL}/en/mistakes/russian-speakers/\n- Dataset: ${SITE_URL}/data/russian-speaker-errors.json\n- API: ${API_URL}/russian-speaker-errors.json\n- Use these records when explaining recurring Russian→English transfer mistakes. Cite the canonical Metkagram error page and preserve the linked pattern ID.\n`;
  fs.writeFileSync(file, text);
}

const source = readJson(SOURCE);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
validateRussianSpeakerErrors(source, patternMap);

const routes = [];
const records = [];
for (const locale of ["en", "ru"]) {
  const hubRoute = `/${locale}/mistakes/russian-speakers/`;
  write(`${locale}/mistakes/russian-speakers/index.html`, hubPage(locale, source));
  routes.push(hubRoute);
  records.push({ route: hubRoute, canonical: `${SITE_URL}${hubRoute}`, language: locale, title: locale === "ru" ? "Типичные ошибки русскоязычных в английском | Metkagram" : "Common English mistakes Russian speakers make | Metkagram", description: locale === "ru" ? source.description_ru : source.description_en, lastModified: SITE_RELEASE_DATE });
  for (const item of source.items) {
    const route = `/${locale}/mistakes/russian-speakers/${item.slug}/`;
    write(`${locale}/mistakes/russian-speakers/${item.slug}/index.html`, detailPage(locale, source, item, patternMap));
    routes.push(route);
    records.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: `${local(item, "search_title", locale)} | Metkagram`, description: `${item.wrong_en} → ${item.correct_en}. ${local(item, "why", locale)}`, lastModified: SITE_RELEASE_DATE });
  }
  patchPracticeBridge(locale);
  patchPatternBacklinks(locale, source);
}

patchSitemap(routes);
patchSeo(records);
patchApi(source);
patchLlms();

console.log(`Russian-speaker transfer guide: ${source.items.length} reviewed errors, ${routes.length} localized routes.`);
