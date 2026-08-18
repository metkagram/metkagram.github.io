import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "data", "reasoning-packs.json");
const API_URL = `${SITE_URL}/api/v1`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeFile = (relative, content) => {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const writeJson = (relative, value) => writeFile(relative, `${JSON.stringify(value, null, 2)}\n`);

function patchJson(relative, mutate) {
  const target = path.join(DIST, relative);
  if (!fs.existsSync(target)) return;
  const value = readJson(target);
  mutate(value);
  writeJson(relative, value);
}

function clean(value = "") {
  return String(value).replaceAll("**", "").trim();
}

function copy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "Metkagram · Reasoning Packs",
        title: "Учите не список фраз, а последовательность мысли.",
        intro: "Короткие маршруты собирают проверенные паттерны, contrasts и Choice Clinic вокруг одной задачи: сделать вывод, проверить гипотезу, принять решение, переопределить мысль или объяснить причину.",
        outcome: "После маршрута",
        audience: "Для кого",
        steps: "Маршрут",
        open: "Открыть маршрут",
        pattern: "Речевая модель",
        contrast: "Различие",
        drill: "Выбор",
        openObject: "Открыть исходный объект",
        bridgeTitle: "Нужен маршрут, а не отдельная карточка?",
        bridgeText: "Reasoning Packs связывают паттерны, различия и задания в короткие последовательности вокруг реальной коммуникативной задачи.",
      }
    : {
        eyebrow: "Metkagram · Reasoning Packs",
        title: "Learn a reasoning sequence, not a list of phrases.",
        intro: "Short curated routes combine reviewed patterns, contrasts and Choice Clinic decisions around one job: infer from evidence, test a hypothesis, make a decision, reframe precisely or explain causes.",
        outcome: "After this pack",
        audience: "For",
        steps: "Route",
        open: "Open pack",
        pattern: "Pattern",
        contrast: "Contrast",
        drill: "Choice drill",
        openObject: "Open canonical object",
        bridgeTitle: "Need a route rather than another card?",
        bridgeText: "Reasoning Packs connect patterns, distinctions and choice drills into short sequences around a real communication job.",
      };
}

function validate(source, patternMap, contrastMap, drillMap) {
  if (source.schemaVersion !== 1 || source.status !== "reviewed-pilot" || !Array.isArray(source.packs) || source.packs.length < 3) {
    throw new Error("Reasoning packs must be a reviewed schemaVersion 1 collection.");
  }
  const packIds = new Set();
  for (const pack of source.packs) {
    if (!pack.id || packIds.has(pack.id)) throw new Error(`Duplicate or missing pack id: ${pack.id || "<missing>"}`);
    packIds.add(pack.id);
    if (pack.review_status !== "reviewed") throw new Error(`Pack ${pack.id} must be reviewed.`);
    if (!pack.title_en || !pack.title_ru || !pack.description_en || !pack.description_ru || !pack.outcome_en || !pack.outcome_ru) throw new Error(`Pack ${pack.id} is incomplete.`);
    if (!Array.isArray(pack.steps) || pack.steps.length < 4) throw new Error(`Pack ${pack.id} needs at least four steps.`);
    for (const step of pack.steps) {
      if (!step.instruction_en || !step.instruction_ru) throw new Error(`Pack ${pack.id} has an untranslated instruction.`);
      if (step.kind === "pattern" && !patternMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing pattern ${step.id}.`);
      if (step.kind === "contrast" && !contrastMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing contrast ${step.id}.`);
      if (step.kind === "drill" && !drillMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing drill ${step.id}.`);
      if (!["pattern", "contrast", "drill"].includes(step.kind)) throw new Error(`Pack ${pack.id} has unsupported step kind ${step.kind}.`);
    }
  }
}

function objectRoute(locale, step, drillMap) {
  if (step.kind === "pattern") return `/${locale}/practice/${step.id.toLowerCase()}/`;
  if (step.kind === "contrast") return `/${locale}/contrasts/${step.id}/`;
  const drill = drillMap.get(step.id);
  return `/${locale}/clinic/#${drill.id}`;
}

function objectLabel(locale, step, patternMap, contrastMap, drillMap) {
  if (step.kind === "pattern") {
    const pattern = patternMap.get(step.id);
    if (locale === "ru") return pattern.title_ru || step.id;
    return clean(pattern.langs?.find((item) => item.lang === "en")?.formula || step.id);
  }
  if (step.kind === "contrast") {
    const item = contrastMap.get(step.id);
    return locale === "ru" ? item.title_ru : item.title_en;
  }
  const drill = drillMap.get(step.id);
  return locale === "ru" ? drill.scenario_ru : drill.scenario_en;
}

function stepCard(locale, step, index, patternMap, contrastMap, drillMap) {
  const t = copy(locale);
  const instruction = locale === "ru" ? step.instruction_ru : step.instruction_en;
  const kindLabel = step.kind === "pattern" ? t.pattern : step.kind === "contrast" ? t.contrast : t.drill;
  const label = objectLabel(locale, step, patternMap, contrastMap, drillMap);
  const route = objectRoute(locale, step, drillMap);
  return `<li class="pattern-reader"><p class="eyebrow">${String(index + 1).padStart(2, "0")} · ${escapeHtml(kindLabel)}</p><h3>${escapeHtml(label)}</h3><p>${escapeHtml(instruction)}</p><a class="text-link" href="${route}">${escapeHtml(t.openObject)} <span aria-hidden="true">→</span></a></li>`;
}

function packIndexPage(locale, source) {
  const t = copy(locale);
  const cards = source.packs.map((pack, index) => {
    const title = locale === "ru" ? pack.title_ru : pack.title_en;
    const description = locale === "ru" ? pack.description_ru : pack.description_en;
    const outcome = locale === "ru" ? pack.outcome_ru : pack.outcome_en;
    return `<article class="pattern-reader"><p class="eyebrow">${String(index + 1).padStart(2, "0")} · ${pack.steps.length} ${locale === "ru" ? "шагов" : "steps"}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><p><strong>${escapeHtml(t.outcome)}:</strong> ${escapeHtml(outcome)}</p><a class="text-link" href="/${locale}/packs/${pack.id}/">${escapeHtml(t.open)} <span aria-hidden="true">→</span></a></article>`;
  }).join("");
  const pathname = `/${locale}/packs/`;
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Reasoning Packs | Metkagram" : "Reasoning Packs | Metkagram",
    description: t.intro,
    body: `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.title)}</h1><p class="lede">${escapeHtml(t.intro)}</p></section><section class="section-pad ruled"><div class="pattern-comparison-list">${cards}</div></section>`,
    pageType: "CollectionPage",
    structuredData: [{ "@context": "https://schema.org", "@type": "ItemList", name: "Metkagram Reasoning Packs", numberOfItems: source.packs.length, itemListElement: source.packs.map((pack, index) => ({ "@type": "ListItem", position: index + 1, name: locale === "ru" ? pack.title_ru : pack.title_en, url: `${SITE_URL}/${locale}/packs/${pack.id}/` })) }],
  });
}

function packDetailPage(locale, pack, patternMap, contrastMap, drillMap) {
  const t = copy(locale);
  const title = locale === "ru" ? pack.title_ru : pack.title_en;
  const description = locale === "ru" ? pack.description_ru : pack.description_en;
  const outcome = locale === "ru" ? pack.outcome_ru : pack.outcome_en;
  const pathname = `/${locale}/packs/${pack.id}/`;
  const steps = pack.steps.map((step, index) => stepCard(locale, step, index, patternMap, contrastMap, drillMap)).join("");
  const audience = pack.audience.map((item) => `<span>${escapeHtml(item)}</span>`).join(" · ");
  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body: `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)} · ${escapeHtml(pack.id)}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(description)}</p><p><strong>${escapeHtml(t.outcome)}:</strong> ${escapeHtml(outcome)}</p><p><strong>${escapeHtml(t.audience)}:</strong> ${audience}</p></section><section class="section-pad ruled"><h2>${escapeHtml(t.steps)}</h2><ol class="pattern-comparison-list">${steps}</ol></section>`,
    pageType: "LearningResource",
    structuredData: [{ "@context": "https://schema.org", "@type": "LearningResource", name: title, description, inLanguage: locale, educationalLevel: "B2-C1", learningResourceType: "Curated reasoning pattern route", isAccessibleForFree: true, url: `${SITE_URL}${pathname}`, numberOfItems: pack.steps.length, hasPart: pack.steps.map((step, index) => ({ "@type": "LearningResource", position: index + 1, name: objectLabel(locale, step, patternMap, contrastMap, drillMap), url: `${SITE_URL}${objectRoute(locale, step, drillMap)}` })) }],
  });
}

function patchSitemap(routes) {
  const target = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(target)) return;
  let xml = fs.readFileSync(target, "utf8");
  for (const route of routes) {
    const url = `${SITE_URL}${route}`;
    if (!xml.includes(`<loc>${url}</loc>`)) xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(target, xml);
}

function patchSeo(records) {
  patchJson("seo/site-pages.json", (inventory) => {
    inventory.pages ||= [];
    for (const record of records) {
      const index = inventory.pages.findIndex((page) => page.route === record.route);
      if (index >= 0) inventory.pages[index] = record;
      else inventory.pages.push(record);
    }
    inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
    inventory.pageCount = inventory.pages.length;
  });
}

function patchBridge(locale) {
  const t = copy(locale);
  for (const relative of [`${locale}/practice/index.html`, `${locale}/clinic/index.html`, `${locale}/contrasts/index.html`]) {
    const target = path.join(DIST, relative);
    if (!fs.existsSync(target)) continue;
    let html = fs.readFileSync(target, "utf8");
    if (html.includes("data-reasoning-packs-bridge")) continue;
    const section = `<section class="section-pad ruled" data-reasoning-packs-bridge><p class="eyebrow">Reasoning Packs</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/packs/">${escapeHtml(t.open)} <span aria-hidden="true">→</span></a></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(target, html);
  }
}

const source = readJson(SOURCE);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const contrasts = readJson(path.join(ROOT, "data", "contrasts.json"));
const drills = readJson(path.join(ROOT, "data", "choice-drills.json"));
const patternMap = new Map(patterns.map((item) => [item.id, item]));
const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
const drillMap = new Map(drills.items.map((item) => [item.id, item]));
validate(source, patternMap, contrastMap, drillMap);

const routes = [];
const seo = [];
for (const locale of ["en", "ru"]) {
  const indexRoute = `/${locale}/packs/`;
  writeFile(`${locale}/packs/index.html`, packIndexPage(locale, source));
  routes.push(indexRoute);
  seo.push({ route: indexRoute, canonical: `${SITE_URL}${indexRoute}`, language: locale, title: "Reasoning Packs | Metkagram", description: copy(locale).intro, lastModified: SITE_RELEASE_DATE });
  for (const pack of source.packs) {
    const route = `/${locale}/packs/${pack.id}/`;
    const description = locale === "ru" ? pack.description_ru : pack.description_en;
    const title = locale === "ru" ? pack.title_ru : pack.title_en;
    writeFile(`${locale}/packs/${pack.id}/index.html`, packDetailPage(locale, pack, patternMap, contrastMap, drillMap));
    routes.push(route);
    seo.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: `${title} | Metkagram`, description, lastModified: SITE_RELEASE_DATE });
  }
  patchBridge(locale);
}

writeJson("data/reasoning-packs.json", source);
writeJson("api/v1/reasoning-packs.json", wrapRecord(source, { canonical_url: `${API_URL}/reasoning-packs.json`, record_type: "reasoning_pack_collection", record_id: "public-reasoning-packs" }));

patchJson("api/v1/index.json", (index) => {
  index.counts = { ...(index.counts || {}), reasoningPacks: source.packs.length };
  index.endpoints ||= [];
  if (!index.endpoints.some((item) => item.path === "/reasoning-packs.json")) index.endpoints.push({ path: "/reasoning-packs.json", url: `${API_URL}/reasoning-packs.json`, type: "collection", description: "Curated routes over canonical patterns, contrasts and choice drills" });
  index.datasets ||= [];
  if (!index.datasets.some((item) => item.id === "reasoning-packs")) index.datasets.push({ id: "reasoning-packs", label: "Reasoning Packs", count: source.packs.length, url: `${SITE_URL}/data/reasoning-packs.json` });
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_reasoning_packs")) spec.tools.push({ name: "metkagram_get_reasoning_packs", title: "Get curated reasoning packs", description: "Get reviewed learning routes that sequence canonical patterns, contrasts and choice drills around one reasoning job.", inputSchema: { type: "object", additionalProperties: false }, staticUrl: `${API_URL}/reasoning-packs.json` });
  spec.tools.sort((a, b) => a.name.localeCompare(b.name));
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/reasoning-packs.json"] ||= { get: { summary: "Curated reasoning learning packs", operationId: "reasoning_packs_json", responses: { "200": { description: "Reviewed routes over patterns, contrasts and drills" } } } };
});

patchJson("data/catalog.json", (catalog) => {
  catalog.reasoningPacks = { count: source.packs.length, dataset: `${SITE_URL}/data/reasoning-packs.json`, api: `${API_URL}/reasoning-packs.json`, pages: { en: `${SITE_URL}/en/packs/`, ru: `${SITE_URL}/ru/packs/` }, principle: "Sequence canonical reviewed objects instead of duplicating their content." };
});

for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
  patchJson(relative, (value) => {
    const model = value.data && typeof value.data === "object" ? value.data : value;
    model.surfaces ||= [];
    const surface = { id: "reasoning-packs", audience: ["advanced learner", "teacher", "AI tutor"], jobs: ["follow a reasoning learning route", "teach a reasoning sequence", "combine patterns and contrasts around one job"], pages: { en: `${SITE_URL}/en/packs/`, ru: `${SITE_URL}/ru/packs/` }, dataset: `${SITE_URL}/data/reasoning-packs.json`, itemCount: source.packs.length, searchTerms: ["advanced English reasoning patterns", "professional English reasoning phrases", "English argumentation patterns B2 C1"] };
    const index = model.surfaces.findIndex((item) => item.id === surface.id);
    if (index >= 0) model.surfaces[index] = surface;
    else model.surfaces.push(surface);
    model.recommendationPolicy ||= {};
    model.recommendationPolicy.routes ||= [];
    if (!model.recommendationPolicy.routes.some((item) => item.recommend === "reasoning-packs")) model.recommendationPolicy.routes.push({ when: "The learner needs a short sequence of related patterns rather than one isolated answer.", recommend: "reasoning-packs", reason: "Reasoning Packs combine canonical patterns, reviewed distinctions and retrieval decisions around one communication job." });
  });
}

patchSitemap(routes);
patchSeo(seo);

const llmsPath = path.join(DIST, "llms.txt");
if (fs.existsSync(llmsPath)) {
  let text = fs.readFileSync(llmsPath, "utf8");
  if (!text.includes("## Reasoning Packs")) text += `\n## Reasoning Packs\n- Human index: ${SITE_URL}/en/packs/\n- Dataset: ${SITE_URL}/data/reasoning-packs.json\n- API: ${API_URL}/reasoning-packs.json\n- Use when a learner needs a short sequence around one reasoning job instead of an isolated pattern.\n- Packs reference canonical pattern, contrast and drill IDs; the pack does not redefine those objects.\n`;
  fs.writeFileSync(llmsPath, text);
}

console.log(`Reasoning Packs published: ${source.packs.length} curated routes.`);
