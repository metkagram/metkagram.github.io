import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { ATTRIBUTION, getDatasetVersion, wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { validateTeacherExportSources } from "../src/source-validation.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;
const EXPORT_ROOT = "exports/reasoning-packs";

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
  return String(value).replaceAll("**", "").replaceAll(/\s+/g, " ").trim();
}

function languageRecord(pattern, lang) {
  return pattern.langs?.find((item) => item.lang === lang) || null;
}

function objectRoute(locale, step, drillMap) {
  if (step.kind === "pattern") return patternPath(locale, step.id);
  if (step.kind === "contrast") return `/${locale}/contrasts/${step.id}/`;
  return `/${locale}/clinic/#${drillMap.get(step.id).id}`;
}

function absoluteObjectUrl(step, drillMap) {
  return `${SITE_URL}${objectRoute("en", step, drillMap)}`;
}

function csvCell(value = "") {
  const normalized = String(value ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function tsvCell(value = "") {
  return String(value ?? "").replaceAll(/\t/g, " ").replaceAll(/\r?\n/g, "<br>");
}

function resolveCard(pack, step, index, patternMap, contrastMap, drillMap) {
  const base = {
    pack_id: pack.id,
    pack_title_en: pack.title_en,
    pack_title_ru: pack.title_ru,
    step_no: index + 1,
    kind: step.kind,
    object_id: step.id,
    instruction_en: step.instruction_en,
    instruction_ru: step.instruction_ru,
    canonical_url: absoluteObjectUrl(step, drillMap),
    formula_en: "",
    formula_de: "",
    example_en: "",
    example_de: "",
    front_en: "",
    back_en: "",
    front_ru: "",
    back_ru: "",
    tags: `metkagram reasoning-pack ${pack.id} ${step.kind} ${step.id}`,
  };

  if (step.kind === "pattern") {
    const pattern = patternMap.get(step.id);
    const en = languageRecord(pattern, "en");
    const de = languageRecord(pattern, "de");
    base.formula_en = clean(en?.formula);
    base.formula_de = clean(de?.formula);
    base.example_en = clean(en?.example);
    base.example_de = clean(de?.example);
    base.front_en = step.instruction_en;
    base.back_en = [base.formula_en, base.example_en && `Example: ${base.example_en}`].filter(Boolean).join("\n");
    base.front_ru = step.instruction_ru;
    base.back_ru = [pattern.title_ru || step.id, base.formula_en && `EN: ${base.formula_en}`, base.formula_de && `DE: ${base.formula_de}`, en?.translation && `Перевод: ${clean(en.translation)}`].filter(Boolean).join("\n");
    return base;
  }

  if (step.kind === "contrast") {
    const contrast = contrastMap.get(step.id);
    const formulasEn = contrast.patterns.map((id) => `${id}: ${clean(languageRecord(patternMap.get(id), "en")?.formula)}`).join(" | ");
    const formulasDe = contrast.patterns.map((id) => `${id}: ${clean(languageRecord(patternMap.get(id), "de")?.formula)}`).join(" | ");
    base.formula_en = formulasEn;
    base.formula_de = formulasDe;
    base.front_en = contrast.question_en;
    base.back_en = `${contrast.distinction_en}\n${formulasEn}`;
    base.front_ru = contrast.question_ru;
    base.back_ru = `${contrast.distinction_ru}\n${formulasEn}`;
    return base;
  }

  const drill = drillMap.get(step.id);
  const optionEn = drill.options.map((id) => `${id}: ${clean(languageRecord(patternMap.get(id), "en")?.formula)}`).join(" | ");
  const optionDe = drill.options.map((id) => `${id}: ${clean(languageRecord(patternMap.get(id), "de")?.formula)}`).join(" | ");
  const answer = patternMap.get(drill.answer_pattern);
  const answerFormula = clean(languageRecord(answer, "en")?.formula);
  base.formula_en = optionEn;
  base.formula_de = optionDe;
  base.front_en = `${drill.scenario_en}\nA/B: ${optionEn}`;
  base.back_en = `${drill.answer_pattern}: ${answerFormula}\n${drill.explanation_en}`;
  base.front_ru = `${drill.scenario_ru}\nA/B: ${optionEn}`;
  base.back_ru = `${drill.answer_pattern}: ${answerFormula}\n${drill.explanation_ru}`;
  return base;
}

function bundleFor(pack, cards) {
  return {
    schemaVersion: 1,
    type: "teacher-tutor-reuse-bundle",
    datasetVersion: getDatasetVersion(),
    releaseDate: SITE_RELEASE_DATE,
    pack: {
      id: pack.id,
      title_en: pack.title_en,
      title_ru: pack.title_ru,
      description_en: pack.description_en,
      description_ru: pack.description_ru,
      outcome_en: pack.outcome_en,
      outcome_ru: pack.outcome_ru,
      audience: pack.audience,
      canonical_url: `${SITE_URL}/en/packs/${pack.id}/`,
    },
    rights: ATTRIBUTION,
    cards,
  };
}

function csvFor(cards) {
  const fields = ["pack_id", "pack_title_en", "pack_title_ru", "step_no", "kind", "object_id", "instruction_en", "instruction_ru", "front_en", "back_en", "front_ru", "back_ru", "formula_en", "formula_de", "example_en", "example_de", "canonical_url", "tags"];
  return `${fields.join(",")}\n${cards.map((card) => fields.map((field) => csvCell(card[field])).join(",")).join("\n")}\n`;
}

function tsvFor(cards) {
  const header = ["Front_EN", "Back_EN", "Front_RU", "Back_RU", "Tags", "Canonical_URL"];
  const rows = cards.map((card) => [card.front_en, card.back_en, card.front_ru, card.back_ru, card.tags, card.canonical_url].map(tsvCell).join("\t"));
  return `${header.join("\t")}\n${rows.join("\n")}\n`;
}

function copy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "Metkagram · Teacher & Tutor Exports",
        title: "Переносите reviewed маршруты, а не собирайте урок заново.",
        intro: "Каждый Reasoning Pack можно скачать как JSON bundle, CSV или study-friendly TSV. Экспорты сохраняют stable IDs, canonical links, attribution и текущие source-available terms.",
        route: "Открыть маршрут",
        json: "JSON bundle",
        csv: "CSV для таблиц",
        tsv: "Study TSV",
        steps: "шагов",
        rights: "Экспорт не меняет права на исходные материалы: attribution обязателен, а существенное переиспользование и коммерческая переработка регулируются текущими условиями Metkagram.",
        terms: "Условия использования",
        bridgeTitle: "Нужно использовать этот pack вне Metkagram?",
        bridgeText: "Скачайте переносимый bundle с теми же stable IDs и canonical links вместо ручного копирования карточек.",
        exports: "Открыть экспорты",
      }
    : {
        eyebrow: "Metkagram · Teacher & Tutor Exports",
        title: "Reuse reviewed routes instead of rebuilding the lesson.",
        intro: "Every Reasoning Pack can be downloaded as a JSON bundle, CSV or study-friendly TSV. Exports preserve stable IDs, canonical links, attribution and the current source-available terms.",
        route: "Open learning route",
        json: "JSON bundle",
        csv: "Spreadsheet CSV",
        tsv: "Study TSV",
        steps: "steps",
        rights: "Export does not change the rights attached to the source material: attribution remains required and substantial reuse or commercial adaptation follows the current Metkagram terms.",
        terms: "Read the terms",
        bridgeTitle: "Need to reuse this pack outside Metkagram?",
        bridgeText: "Download a portable bundle with the same stable IDs and canonical links instead of copying cards by hand.",
        exports: "Open exports",
      };
}

function exportsPage(locale, index) {
  const t = copy(locale);
  const cards = index.items.map((item) => {
    const title = locale === "ru" ? item.title_ru : item.title_en;
    const description = locale === "ru" ? item.description_ru : item.description_en;
    return `<article class="pattern-reader"><p class="eyebrow">${escapeHtml(item.pack_id)} · ${item.stepCount} ${escapeHtml(t.steps)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><div class="legal-inline-links"><a href="/${locale}/packs/${item.pack_id}/">${escapeHtml(t.route)}</a><a href="${item.downloads.json}" download>${escapeHtml(t.json)}</a><a href="${item.downloads.csv}" download>${escapeHtml(t.csv)}</a><a href="${item.downloads.tsv}" download>${escapeHtml(t.tsv)}</a></div></article>`;
  }).join("");
  const pathname = `/${locale}/exports/`;
  const body = `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.title)}</h1><p class="lede">${escapeHtml(t.intro)}</p></section><section class="section-pad ruled"><div class="pattern-comparison-list">${cards}</div></section><section class="section-pad ruled"><p>${escapeHtml(t.rights)}</p><a class="text-link" href="${ATTRIBUTION.terms_url}">${escapeHtml(t.terms)} <span aria-hidden="true">→</span></a></section>`;
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Teacher & Tutor Exports | Metkagram" : "Teacher & Tutor Exports | Metkagram",
    description: t.intro,
    body,
    pageType: "CollectionPage",
    structuredData: [{ "@context": "https://schema.org", "@type": "ItemList", name: "Metkagram Teacher and Tutor Exports", numberOfItems: index.items.length, itemListElement: index.items.map((item, position) => ({ "@type": "ListItem", position: position + 1, name: locale === "ru" ? item.title_ru : item.title_en, url: `${SITE_URL}/${locale}/packs/${item.pack_id}/` })) }],
  });
}

function patchPackPages(locale, packSource) {
  const t = copy(locale);
  const indexFile = path.join(DIST, locale, "packs", "index.html");
  if (fs.existsSync(indexFile)) {
    let html = fs.readFileSync(indexFile, "utf8");
    if (!html.includes("data-teacher-export-bridge")) {
      html = html.replace("</main>", `<section class="section-pad ruled" data-teacher-export-bridge><p class="eyebrow">Teacher & Tutor Exports</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/exports/">${escapeHtml(t.exports)} <span aria-hidden="true">→</span></a></section></main>`);
      fs.writeFileSync(indexFile, html);
    }
  }

  for (const pack of packSource.packs) {
    const file = path.join(DIST, locale, "packs", pack.id, "index.html");
    if (!fs.existsSync(file)) throw new Error(`Missing generated pack page ${pack.id} for ${locale}.`);
    let html = fs.readFileSync(file, "utf8");
    if (html.includes("data-teacher-export-links")) continue;
    const downloads = {
      json: `/${EXPORT_ROOT}/${pack.id}.json`,
      csv: `/${EXPORT_ROOT}/${pack.id}.csv`,
      tsv: `/${EXPORT_ROOT}/${pack.id}.anki.tsv`,
    };
    const section = `<section class="section-pad ruled" data-teacher-export-links><p class="eyebrow">Teacher & Tutor Exports</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><div class="legal-inline-links"><a href="${downloads.json}" download>${escapeHtml(t.json)}</a><a href="${downloads.csv}" download>${escapeHtml(t.csv)}</a><a href="${downloads.tsv}" download>${escapeHtml(t.tsv)}</a><a href="/${locale}/exports/">${escapeHtml(t.exports)}</a></div></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(file, html);
  }
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

function patchSeo(index) {
  patchJson("seo/site-pages.json", (inventory) => {
    inventory.pages ||= [];
    for (const locale of ["en", "ru"]) {
      const t = copy(locale);
      const route = `/${locale}/exports/`;
      const record = { route, canonical: `${SITE_URL}${route}`, language: locale, title: "Teacher & Tutor Exports | Metkagram", description: t.intro, lastModified: SITE_RELEASE_DATE };
      const existing = inventory.pages.findIndex((page) => page.route === route);
      if (existing >= 0) inventory.pages[existing] = record;
      else inventory.pages.push(record);
    }
    inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
    inventory.pageCount = inventory.pages.length;
  });
}

function patchMachineSurfaces(index) {
  writeJson("data/teacher-exports.json", index);
  writeJson("api/v1/teacher-exports.json", wrapRecord(index, {
    canonical_url: `${API_URL}/teacher-exports.json`,
    record_type: "teacher_tutor_export_index",
    record_id: "public-reasoning-pack-exports",
  }));

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = { ...(root.counts || {}), teacherExports: index.items.length };
    root.endpoints ||= [];
    if (!root.endpoints.some((item) => item.path === "/teacher-exports.json")) root.endpoints.push({ path: "/teacher-exports.json", url: `${API_URL}/teacher-exports.json`, type: "index", description: "Portable reviewed Reasoning Pack exports for teachers, tutors and integrations" });
  });

  patchJson("api/v1/openapi.json", (spec) => {
    spec.paths ||= {};
    spec.paths["/teacher-exports.json"] ||= { get: { summary: "Teacher and tutor export index", operationId: "teacher_exports_json", responses: { "200": { description: "Portable reviewed Reasoning Pack export catalog" } } } };
  });

  patchJson("api/v1/mcp-server.json", (spec) => {
    spec.tools ||= [];
    if (!spec.tools.some((tool) => tool.name === "metkagram_get_teacher_exports")) {
      spec.tools.push({ name: "metkagram_get_teacher_exports", title: "Get teacher and tutor exports", description: "List portable reviewed Reasoning Pack bundles with stable IDs, attribution and canonical links.", inputSchema: { type: "object", additionalProperties: false }, staticUrl: `${API_URL}/teacher-exports.json` });
      spec.tools.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  patchJson("data/catalog.json", (catalog) => {
    catalog.teacherExports = { page: `${SITE_URL}/en/exports/`, dataset: `${SITE_URL}/data/teacher-exports.json`, api: `${API_URL}/teacher-exports.json`, packCount: index.items.length, formats: ["JSON", "CSV", "TSV"] };
  });

  patchJson("api/v1/teaching-manifest.json", (manifest) => {
    manifest.interfaces ||= {};
    manifest.interfaces.teacher_exports = `${API_URL}/teacher-exports.json`;
    manifest.recommended_workflows ||= [];
    if (!manifest.recommended_workflows.some((workflow) => workflow.id === "reuse_reviewed_pack")) {
      manifest.recommended_workflows.push({ id: "reuse_reviewed_pack", steps: ["Choose a reviewed Reasoning Pack", "Download its JSON/CSV/TSV export", "Preserve stable IDs and canonical links", "Adapt delivery around the learner without changing canonical definitions", "Keep Metkagram attribution and current rights metadata"] });
    }
  });

  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const model = value.data && typeof value.data === "object" ? value.data : value;
      model.surfaces ||= [];
      if (!model.surfaces.some((surface) => surface.id === "teacher-exports")) {
        model.surfaces.push({ id: "teacher-exports", audience: ["teacher", "AI tutor", "EdTech integrator"], jobs: ["reuse a reviewed Reasoning Pack outside the website", "import reviewed learning objects into a teaching workflow"], pages: { en: `${SITE_URL}/en/exports/`, ru: `${SITE_URL}/ru/exports/` }, dataset: `${SITE_URL}/data/teacher-exports.json`, formats: ["JSON", "CSV", "TSV"] });
      }
      model.recommendationPolicy ||= { routes: [] };
      model.recommendationPolicy.routes ||= [];
      if (!model.recommendationPolicy.routes.some((route) => route.recommend === "teacher-exports")) model.recommendationPolicy.routes.push({ when: "A teacher, tutor or integration needs to reuse a reviewed Reasoning Pack outside the Metkagram website.", recommend: "teacher-exports", reason: "Portable exports preserve stable IDs, canonical links, attribution and the reviewed route instead of encouraging manual copying." });
    });
  }

  const llmsPath = path.join(DIST, "llms.txt");
  if (fs.existsSync(llmsPath)) {
    let text = fs.readFileSync(llmsPath, "utf8");
    if (!text.includes("## Teacher and tutor exports")) {
      text += `\n## Teacher and tutor exports\n- Portable reviewed Reasoning Packs: ${SITE_URL}/en/exports/\n- Machine index: ${SITE_URL}/data/teacher-exports.json\n- Preserve stable object IDs, canonical URLs and Metkagram attribution when adapting a pack for a learner.\n- Export availability does not change the current source-available rights attached to the material.\n`;
      fs.writeFileSync(llmsPath, text);
    }
  }
}

const packSource = readJson(path.join(ROOT, "data", "reasoning-packs.json"));
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const contrasts = readJson(path.join(ROOT, "data", "contrasts.json"));
const drills = readJson(path.join(ROOT, "data", "choice-drills.json"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
const drillMap = new Map(drills.items.map((item) => [item.id, item]));
validateTeacherExportSources(packSource, patternMap, contrastMap, drillMap);

const items = [];
for (const pack of packSource.packs) {
  const cards = pack.steps.map((step, index) => resolveCard(pack, step, index, patternMap, contrastMap, drillMap));
  const bundle = bundleFor(pack, cards);
  writeJson(`${EXPORT_ROOT}/${pack.id}.json`, bundle);
  writeFile(`${EXPORT_ROOT}/${pack.id}.csv`, csvFor(cards));
  writeFile(`${EXPORT_ROOT}/${pack.id}.anki.tsv`, tsvFor(cards));
  items.push({
    pack_id: pack.id,
    title_en: pack.title_en,
    title_ru: pack.title_ru,
    description_en: pack.description_en,
    description_ru: pack.description_ru,
    stepCount: cards.length,
    canonical_url: `${SITE_URL}/en/packs/${pack.id}/`,
    downloads: {
      json: `/${EXPORT_ROOT}/${pack.id}.json`,
      csv: `/${EXPORT_ROOT}/${pack.id}.csv`,
      tsv: `/${EXPORT_ROOT}/${pack.id}.anki.tsv`,
    },
  });
}

const index = {
  schemaVersion: 1,
  status: "reviewed-public-exports",
  description: "Portable exports generated from reviewed public Reasoning Packs and their canonical patterns, contrasts and choice drills.",
  datasetVersion: getDatasetVersion(),
  releaseDate: SITE_RELEASE_DATE,
  rights: ATTRIBUTION,
  items,
};
writeJson(`${EXPORT_ROOT}/index.json`, index);
for (const locale of ["en", "ru"]) {
  writeFile(`${locale}/exports/index.html`, exportsPage(locale, index));
  patchPackPages(locale, packSource);
}
patchMachineSurfaces(index);
patchSitemap(["/en/exports/", "/ru/exports/"]);
patchSeo(index);
console.log(`Teacher & Tutor Exports published: ${items.length} Reasoning Packs in JSON, CSV and TSV.`);
