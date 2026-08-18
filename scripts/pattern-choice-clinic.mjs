import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "data", "choice-drills.json");
const CONTRASTS = path.join(ROOT, "data", "contrasts.json");
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
        eyebrow: "Metkagram · Pattern Choice Clinic",
        title: "Сначала выберите логическую задачу. Потом — формулировку.",
        intro: "Короткие задания заставляют различить две близкие речевые модели до того, как вы увидите ответ. Каждый выбор связан с проверенной contrast-парой и стабильными pattern ID.",
        howTitle: "Как работать",
        how: ["Прочитайте ситуацию", "Выберите A или B", "Откройте объяснение", "Перейдите к модели и используйте её сами"],
        scenario: "Ситуация",
        options: "Выберите модель",
        reveal: "Показать ответ и объяснение",
        answer: "Подходящая модель",
        why: "Почему",
        whyOther: "Почему не соседняя модель",
        openPattern: "Открыть модель",
        openContrast: "Разобрать различие",
        clinic: "Открыть Choice Clinic",
        bridgeTitle: "Проверить, действительно ли вы видите разницу?",
        bridgeText: "Choice Clinic превращает сравнение в короткое задание: сначала выбор, затем объяснение и переход к исходной модели.",
      }
    : {
        eyebrow: "Metkagram · Pattern Choice Clinic",
        title: "Choose the reasoning job before the wording.",
        intro: "Short drills make you distinguish two nearby reusable patterns before revealing the answer. Every choice is anchored to a reviewed contrast and stable pattern IDs.",
        howTitle: "How to use it",
        how: ["Read the situation", "Choose A or B", "Reveal the explanation", "Open the pattern and reuse it yourself"],
        scenario: "Situation",
        options: "Choose a pattern",
        reveal: "Reveal answer and explanation",
        answer: "Best-fit pattern",
        why: "Why it fits",
        whyOther: "Why not the nearby pattern",
        openPattern: "Open pattern",
        openContrast: "Inspect the contrast",
        clinic: "Open Choice Clinic",
        bridgeTitle: "Can you actually tell the two patterns apart?",
        bridgeText: "Choice Clinic turns the comparison into a short decision task: choose first, then reveal the explanation and practise the canonical pattern.",
      };
}

function validate(source, contrasts, patternMap) {
  if (source.schemaVersion !== 1 || !Array.isArray(source.items) || source.items.length < 2) {
    throw new Error("Choice drill dataset must contain schemaVersion 1 and multiple items.");
  }
  const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
  const ids = new Set();
  for (const item of source.items) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing drill id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    const contrast = contrastMap.get(item.contrast_id);
    if (!contrast) throw new Error(`Drill ${item.id} references unknown contrast ${item.contrast_id}.`);
    if (!Array.isArray(item.options) || item.options.length !== 2) throw new Error(`Drill ${item.id} must have exactly two options.`);
    if (!item.options.includes(item.answer_pattern)) throw new Error(`Drill ${item.id} answer must be one of its options.`);
    if (new Set(item.options).size !== 2) throw new Error(`Drill ${item.id} options must be distinct.`);
    if (item.options.some((id) => !patternMap.has(id))) throw new Error(`Drill ${item.id} references a missing pattern.`);
    if (item.options.some((id) => !contrast.patterns.includes(id))) throw new Error(`Drill ${item.id} options must stay inside contrast ${item.contrast_id}.`);
    for (const field of ["scenario_en", "scenario_ru", "explanation_en", "explanation_ru", "why_other_en", "why_other_ru"]) {
      if (!item[field]?.trim()) throw new Error(`Drill ${item.id} is missing ${field}.`);
    }
    if (item.review_status !== "reviewed") throw new Error(`Drill ${item.id} must be reviewed before publication.`);
  }
}

function optionCard(pattern, locale, label) {
  const en = languageRecord(pattern, "en");
  const de = languageRecord(pattern, "de");
  const title = locale === "ru" ? (pattern.title_ru || pattern.id) : clean(en?.formula || pattern.id);
  return `<article class="pattern-comparison-card"><p class="eyebrow">${escapeHtml(label)} · ${escapeHtml(pattern.id)}</p><h3>${escapeHtml(title)}</h3><dl><div><dt>EN</dt><dd>${escapeHtml(clean(en?.formula))}</dd></div><div><dt>DE</dt><dd>${escapeHtml(clean(de?.formula))}</dd></div></dl></article>`;
}

function drillCard(locale, drill, patternMap) {
  const t = copy(locale);
  const first = patternMap.get(drill.options[0]);
  const second = patternMap.get(drill.options[1]);
  const scenario = locale === "ru" ? drill.scenario_ru : drill.scenario_en;
  const explanation = locale === "ru" ? drill.explanation_ru : drill.explanation_en;
  const whyOther = locale === "ru" ? drill.why_other_ru : drill.why_other_en;
  const answer = patternMap.get(drill.answer_pattern);
  const answerFormula = clean(languageRecord(answer, "en")?.formula || answer.id);
  return `<article class="pattern-reader" id="${escapeHtml(drill.id)}"><p class="eyebrow">${escapeHtml(t.scenario)} · ${escapeHtml(drill.id)}</p><h3>${escapeHtml(scenario)}</h3><p><strong>${escapeHtml(t.options)}</strong></p><div class="pattern-comparison-list">${optionCard(first, locale, "A")}${optionCard(second, locale, "B")}</div><details class="faq-list"><summary>${escapeHtml(t.reveal)}</summary><div><p><strong>${escapeHtml(t.answer)}:</strong> ${escapeHtml(drill.answer_pattern)} · ${escapeHtml(answerFormula)}</p><p><strong>${escapeHtml(t.why)}:</strong> ${escapeHtml(explanation)}</p><p><strong>${escapeHtml(t.whyOther)}:</strong> ${escapeHtml(whyOther)}</p><a class="text-link" href="/${locale}/practice/${drill.answer_pattern.toLowerCase()}/">${escapeHtml(t.openPattern)} <span aria-hidden="true">→</span></a></div></details></article>`;
}

function clinicPage(locale, source, contrasts, patternMap) {
  const t = copy(locale);
  const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
  const groups = contrasts.items.map((contrast) => {
    const drills = source.items.filter((item) => item.contrast_id === contrast.id);
    if (!drills.length) return "";
    const title = locale === "ru" ? contrast.title_ru : contrast.title_en;
    return `<section class="section-pad ruled"><div><p class="eyebrow">Contrast · ${escapeHtml(contrast.relation)}</p><h2>${escapeHtml(title)}</h2><a class="text-link" href="/${locale}/contrasts/${contrast.id}/">${escapeHtml(t.openContrast)} <span aria-hidden="true">→</span></a></div><div class="pattern-comparison-list">${drills.map((drill) => drillCard(locale, drill, patternMap)).join("")}</div></section>`;
  }).join("");
  const steps = t.how.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(step)}</p></li>`).join("");
  const pathname = `/${locale}/clinic/`;
  const body = `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.title)}</h1><p class="lede">${escapeHtml(t.intro)}</p></section><section class="section-pad ruled"><h2>${escapeHtml(t.howTitle)}</h2><ol class="roadmap-grid">${steps}</ol></section>${groups}`;
  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: locale === "ru" ? "Metkagram Pattern Choice Clinic" : "Metkagram Pattern Choice Clinic",
    description: t.intro,
    inLanguage: locale,
    educationalLevel: "B2-C1",
    learningResourceType: "Pattern choice drills",
    isAccessibleForFree: true,
    numberOfItems: source.items.length,
    url: `${SITE_URL}${pathname}`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    hasPart: source.items.map((drill) => ({ "@type": "LearningResource", name: drill.id, url: `${SITE_URL}${pathname}#${drill.id}` })),
  }];
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Pattern Choice Clinic | Metkagram" : "Pattern Choice Clinic | Metkagram",
    description: t.intro,
    body,
    pageType: "LearningResource",
    structuredData,
  });
}

function patchContrastPage(locale, contrast, drills, patternMap) {
  const file = path.join(DIST, locale, "contrasts", contrast.id, "index.html");
  if (!fs.existsSync(file) || !drills.length) return;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-choice-clinic-drills")) return;
  const t = copy(locale);
  const title = locale === "ru" ? "Проверьте различие на практике" : "Test the distinction before practising it";
  const section = `<section class="section-pad ruled" data-choice-clinic-drills><p class="eyebrow">Pattern Choice Clinic</p><h2>${escapeHtml(title)}</h2><div class="pattern-comparison-list">${drills.map((drill) => drillCard(locale, drill, patternMap)).join("")}</div><a class="text-link" href="/${locale}/clinic/">${escapeHtml(t.clinic)} <span aria-hidden="true">→</span></a></section>`;
  html = html.replace("</main>", `${section}</main>`);
  fs.writeFileSync(file, html);
}

function patchBridge(locale) {
  const t = copy(locale);
  const targets = [
    path.join(DIST, locale, "practice", "index.html"),
    path.join(DIST, locale, "contrasts", "index.html"),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes("data-choice-clinic-bridge")) continue;
    const section = `<section class="section-pad ruled" data-choice-clinic-bridge><p class="eyebrow">Pattern Choice Clinic</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/clinic/">${escapeHtml(t.clinic)} <span aria-hidden="true">→</span></a></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchSitemap(routes) {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, "utf8");
  for (const route of routes) {
    const url = `${SITE_URL}${route}`;
    if (!xml.includes(`<loc>${url}</loc>`)) xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(file, xml);
}

function patchSeoInventory(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  if (!fs.existsSync(file)) return;
  const value = readJson(file);
  value.pages ||= [];
  for (const record of records) {
    const existing = value.pages.findIndex((page) => page.route === record.route);
    if (existing >= 0) value.pages[existing] = record;
    else value.pages.push(record);
  }
  value.pages.sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  writeJson("seo/site-pages.json", value);
}

function patchDiscovery(source) {
  const additions = [
    {
      id: "pattern-contrasts",
      audience: ["advanced learner", "teacher", "AI tutor"],
      jobs: ["distinguish nearby patterns", "avoid confusing related reasoning frames"],
      pages: { en: `${SITE_URL}/en/contrasts/`, ru: `${SITE_URL}/ru/contrasts/` },
      dataset: `${SITE_URL}/data/contrasts.json`,
      searchTerms: ["difference between English sentence patterns", "compare similar grammar patterns", "English reasoning pattern contrast"],
    },
    {
      id: "choice-clinic",
      audience: ["advanced learner", "teacher", "AI tutor"],
      jobs: ["test pattern choice", "diagnose a reasoning-frame confusion", "practise before seeing the answer"],
      pages: { en: `${SITE_URL}/en/clinic/`, ru: `${SITE_URL}/ru/clinic/` },
      dataset: `${SITE_URL}/data/choice-drills.json`,
      itemCount: source.items.length,
      searchTerms: ["choose the right English pattern", "English pattern practice B2 C1", "grammar choice exercises advanced English"],
    },
  ];
  const routeAdditions = [
    { when: "The learner is choosing between two nearby reusable patterns and needs the semantic or reasoning distinction.", recommend: "pattern-contrasts", reason: "Contrast Library explains the reviewed distinction without pretending similar forms are interchangeable." },
    { when: "The learner understands a contrast but wants to test the choice before seeing feedback.", recommend: "choice-clinic", reason: "Pattern Choice Clinic uses reviewed two-option decision drills tied to stable pattern IDs." },
  ];

  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const model = value.data && typeof value.data === "object" ? value.data : value;
      model.surfaces ||= [];
      for (const addition of additions) {
        const index = model.surfaces.findIndex((item) => item.id === addition.id);
        if (index >= 0) model.surfaces[index] = addition;
        else model.surfaces.push(addition);
      }
      model.recommendationPolicy ||= {};
      model.recommendationPolicy.routes ||= [];
      for (const addition of routeAdditions) {
        if (!model.recommendationPolicy.routes.some((item) => item.recommend === addition.recommend)) model.recommendationPolicy.routes.push(addition);
      }
    });
  }
}

const source = readJson(SOURCE);
const contrasts = readJson(CONTRASTS);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
validate(source, contrasts, patternMap);

const routes = [];
const seoRecords = [];
for (const locale of ["en", "ru"]) {
  const route = `/${locale}/clinic/`;
  const description = copy(locale).intro;
  writeFile(`${locale}/clinic/index.html`, clinicPage(locale, source, contrasts, patternMap));
  routes.push(route);
  seoRecords.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: "Pattern Choice Clinic | Metkagram", description, lastModified: SITE_RELEASE_DATE });
  patchBridge(locale);
  for (const contrast of contrasts.items) {
    patchContrastPage(locale, contrast, source.items.filter((item) => item.contrast_id === contrast.id), patternMap);
  }
}

writeJson("data/choice-drills.json", source);
writeJson("api/v1/choice-drills.json", wrapRecord(source, {
  canonical_url: `${API_URL}/choice-drills.json`,
  record_type: "pattern_choice_drill_collection",
  record_id: "public-pattern-choice-drills",
}));

patchJson("api/v1/index.json", (index) => {
  index.counts = { ...(index.counts || {}), choiceDrills: source.items.length };
  index.endpoints ||= [];
  if (!index.endpoints.some((item) => item.path === "/choice-drills.json")) {
    index.endpoints.push({ path: "/choice-drills.json", url: `${API_URL}/choice-drills.json`, type: "collection", description: "Reviewed two-option drills for choosing between nearby language patterns" });
  }
  index.datasets ||= [];
  if (!index.datasets.some((item) => item.id === "choice-drills")) {
    index.datasets.push({ id: "choice-drills", label: "Pattern choice drills", count: source.items.length, url: `${SITE_URL}/data/choice-drills.json` });
  }
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_choice_drills")) {
    spec.tools.push({
      name: "metkagram_get_choice_drills",
      title: "Get pattern choice drills",
      description: "Get reviewed two-option scenarios for distinguishing nearby reusable language patterns before feedback.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${API_URL}/choice-drills.json`,
    });
    spec.tools.sort((a, b) => a.name.localeCompare(b.name));
  }
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/choice-drills.json"] ||= {
    get: {
      summary: "Reviewed pattern choice drills",
      operationId: "choice_drills_json",
      responses: { "200": { description: "Reviewed two-option pattern choice scenarios" } },
    },
  };
});

patchJson("data/catalog.json", (catalog) => {
  catalog.choiceClinic = {
    count: source.items.length,
    dataset: `${SITE_URL}/data/choice-drills.json`,
    api: `${API_URL}/choice-drills.json`,
    routes: { en: `${SITE_URL}/en/clinic/`, ru: `${SITE_URL}/ru/clinic/` },
    principle: "Choose before feedback; every drill stays anchored to a reviewed contrast and stable pattern IDs.",
  };
});

patchDiscovery(source);
patchSitemap(routes);
patchSeoInventory(seoRecords);

const llmsFile = path.join(DIST, "llms.txt");
if (fs.existsSync(llmsFile)) {
  let text = fs.readFileSync(llmsFile, "utf8");
  if (!text.includes("## Pattern Choice Clinic")) {
    text += `\n## Pattern Choice Clinic\n- Human practice: ${SITE_URL}/en/clinic/\n- Reviewed drill dataset: ${SITE_URL}/data/choice-drills.json\n- API: ${API_URL}/choice-drills.json\n- Use when a learner must choose between two nearby reviewed patterns before seeing feedback.\n- Each drill references a Contrast Library record and stable pattern IDs; do not generalize the pilot into a complete grammar-correction system.\n`;
  }
  fs.writeFileSync(llmsFile, text);
}

console.log(`Pattern Choice Clinic published: ${source.items.length} reviewed drills across ${contrasts.items.length} contrasts.`);
