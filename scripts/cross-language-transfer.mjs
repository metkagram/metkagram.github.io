import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { patternPath, patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
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
  return String(value).replaceAll("**", "").replaceAll(/\s+/g, " ").trim();
}

function languageRecord(pattern, lang) {
  return pattern.langs?.find((item) => item.lang === lang) || null;
}

function buildMap(patterns, relations) {
  const items = patterns
    .filter((pattern) => pattern.reasoning?.move && languageRecord(pattern, "en") && languageRecord(pattern, "de"))
    .map((pattern) => {
      const en = languageRecord(pattern, "en");
      const de = languageRecord(pattern, "de");
      const relation = relations?.byPattern?.[pattern.id] || null;
      return {
        pattern_id: pattern.id,
        reasoning_move: pattern.reasoning.move,
        logic: pattern.logic || "",
        what_it_does_en: pattern.reasoning.what_it_does_en || "",
        what_it_does_ru: pattern.reasoning.what_it_does_ru || pattern.metaphor_ru || "",
        formula_en: clean(en.formula),
        formula_de: clean(de.formula),
        example_en: clean(en.example),
        example_de: clean(de.example),
        translation_ru: clean(en.translation),
        mapping_type: "same-canonical-pattern-functional-counterpart",
        literal_equivalence: false,
        review_basis: "English and German forms are stored in the same reviewed Metkagram canonical pattern record.",
        canonical_urls: {
          en: patternUrl("en", pattern),
          ru: patternUrl("ru", pattern),
        },
        related: relation ? {
          contrasts: relation.contrasts.map((item) => item.id),
          packs: relation.packs.map((item) => item.id),
        } : { contrasts: [], packs: [] },
      };
    })
    .sort((a, b) => a.reasoning_move.localeCompare(b.reasoning_move) || a.pattern_id.localeCompare(b.pattern_id));

  if (!items.length) throw new Error("Cross-language transfer map requires reviewed reasoning patterns with both English and German forms.");
  for (const item of items) {
    if (!item.formula_en || !item.formula_de || !item.example_en || !item.example_de) throw new Error(`Incomplete cross-language mapping for ${item.pattern_id}.`);
    if (item.literal_equivalence !== false) throw new Error(`Cross-language mapping ${item.pattern_id} must not claim literal equivalence.`);
  }

  return {
    schemaVersion: 1,
    status: "derived-reviewed-functional-map",
    description: "Reviewed English↔German functional counterparts derived only from bilingual forms stored inside the same canonical Metkagram reasoning pattern record.",
    boundary: "A mapping means the two forms serve the same reviewed Metkagram reasoning job inside one canonical pattern. It does not claim word-for-word equivalence or universal translation interchangeability.",
    itemCount: items.length,
    items,
  };
}

function copy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "Metkagram · Cross-language Transfer",
        title: "Переносите одну мыслительную операцию между English и Deutsch.",
        intro: "Здесь пары не подбираются по похожим словам. EN и DE формы принадлежат одному reviewed Metkagram pattern ID и выполняют одну функциональную задачу. Это не обещание дословной взаимозаменяемости.",
        move: "Reasoning move",
        enToDe: "EN → DE: сначала сформулируйте по-немецки",
        deToEn: "DE → EN: сначала сформулируйте по-английски",
        reveal: "Показать counterpart",
        function: "Что делает конструкция",
        open: "Открыть canonical pattern",
        contrast: "Разобрать близкое различие",
        pack: "Пройти связанный Reasoning Pack",
        bridgeTitle: "Хотите перенести ту же функцию между EN и DE?",
        bridgeText: "Cross-language Transfer использует только bilingual forms внутри одного stable pattern ID, без автоматического подбора «похожих» переводов.",
        bridgeLink: "Открыть Transfer Map",
      }
    : {
        eyebrow: "Metkagram · Cross-language Transfer",
        title: "Carry the same reasoning job between English and German.",
        intro: "These pairs are not matched by similar words. The EN and DE forms belong to the same reviewed Metkagram pattern ID and perform the same functional job. This does not claim word-for-word interchangeability.",
        move: "Reasoning move",
        enToDe: "EN → DE: produce the German form first",
        deToEn: "DE → EN: produce the English form first",
        reveal: "Reveal counterpart",
        function: "What the pattern does",
        open: "Open canonical pattern",
        contrast: "Inspect a nearby distinction",
        pack: "Follow a related Reasoning Pack",
        bridgeTitle: "Want to transfer the same function between EN and DE?",
        bridgeText: "Cross-language Transfer uses only bilingual forms inside one stable pattern ID, not automatically guessed look-alike translations.",
        bridgeLink: "Open Transfer Map",
      };
}

function relationLinks(locale, item, t) {
  const links = [];
  const contrast = item.related.contrasts?.[0];
  const pack = item.related.packs?.[0];
  if (contrast) links.push(`<a href="/${locale}/contrasts/${contrast}/">${escapeHtml(t.contrast)}</a>`);
  if (pack) links.push(`<a href="/${locale}/packs/${pack}/">${escapeHtml(t.pack)}</a>`);
  return links.join("");
}

function transferCard(locale, item) {
  const t = copy(locale);
  const functionText = locale === "ru" ? item.what_it_does_ru : item.what_it_does_en;
  return `<article class="pattern-reader" id="${escapeHtml(item.pattern_id.toLowerCase())}">
    <p class="eyebrow">${escapeHtml(item.reasoning_move)} · ${escapeHtml(item.pattern_id)}</p>
    <h3>${escapeHtml(functionText || item.logic)}</h3>
    <div class="pattern-comparison-list">
      <details class="faq-list"><summary><strong>${escapeHtml(t.enToDe)}</strong><br>${escapeHtml(item.formula_en)}</summary><div><p><strong>DE:</strong> ${escapeHtml(item.formula_de)}</p><p>${escapeHtml(item.example_de)}</p></div></details>
      <details class="faq-list"><summary><strong>${escapeHtml(t.deToEn)}</strong><br>${escapeHtml(item.formula_de)}</summary><div><p><strong>EN:</strong> ${escapeHtml(item.formula_en)}</p><p>${escapeHtml(item.example_en)}</p></div></details>
    </div>
    <p><strong>${escapeHtml(t.function)}:</strong> ${escapeHtml(functionText)}</p>
    <div class="legal-inline-links"><a href="${patternPath(locale, item.pattern_id)}">${escapeHtml(t.open)}</a>${relationLinks(locale, item, t)}</div>
  </article>`;
}

function transferPage(locale, map) {
  const t = copy(locale);
  const groups = new Map();
  for (const item of map.items) {
    if (!groups.has(item.reasoning_move)) groups.set(item.reasoning_move, []);
    groups.get(item.reasoning_move).push(item);
  }
  const sections = [...groups.entries()].map(([move, items]) => `<section class="section-pad ruled"><p class="eyebrow">${escapeHtml(t.move)}</p><h2>${escapeHtml(move)}</h2><div class="pattern-comparison-list">${items.map((item) => transferCard(locale, item)).join("")}</div></section>`).join("");
  const pathname = `/${locale}/transfer/`;
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "English ↔ German Transfer | Metkagram" : "English ↔ German Transfer | Metkagram",
    description: t.intro,
    body: `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.title)}</h1><p class="lede">${escapeHtml(t.intro)}</p></section>${sections}`,
    pageType: "CollectionPage",
    structuredData: [{ "@context": "https://schema.org", "@type": "ItemList", name: "Metkagram English German Functional Transfer Map", numberOfItems: map.items.length, itemListElement: map.items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: `${item.pattern_id}: ${item.formula_en} ↔ ${item.formula_de}`, url: patternUrl(locale, item.pattern_id) })) }],
  });
}

function patchBridge(locale) {
  const t = copy(locale);
  const targets = [
    path.join(DIST, locale, "practice", "index.html"),
    path.join(DIST, locale, "packs", "index.html"),
    path.join(DIST, locale, "exports", "index.html"),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes("data-cross-language-transfer-bridge")) continue;
    const section = `<section class="section-pad ruled" data-cross-language-transfer-bridge><p class="eyebrow">Cross-language Transfer</p><h2>${escapeHtml(t.bridgeTitle)}</h2><p>${escapeHtml(t.bridgeText)}</p><a class="text-link" href="/${locale}/transfer/">${escapeHtml(t.bridgeLink)} <span aria-hidden="true">→</span></a></section>`;
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

function patchSeo() {
  patchJson("seo/site-pages.json", (inventory) => {
    inventory.pages ||= [];
    for (const locale of ["en", "ru"]) {
      const t = copy(locale);
      const route = `/${locale}/transfer/`;
      const record = { route, canonical: `${SITE_URL}${route}`, language: locale, title: "English ↔ German Transfer | Metkagram", description: t.intro, lastModified: SITE_RELEASE_DATE };
      const existing = inventory.pages.findIndex((page) => page.route === route);
      if (existing >= 0) inventory.pages[existing] = record;
      else inventory.pages.push(record);
    }
    inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
    inventory.pageCount = inventory.pages.length;
  });
}

function patchMachineSurfaces(map) {
  writeJson("data/cross-language-map.json", map);
  writeJson("api/v1/cross-language-map.json", wrapRecord(map, {
    canonical_url: `${API_URL}/cross-language-map.json`,
    record_type: "cross_language_functional_map",
    record_id: "reviewed-en-de-reasoning-map",
  }));

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = { ...(root.counts || {}), crossLanguageMappings: map.itemCount };
    root.endpoints ||= [];
    if (!root.endpoints.some((item) => item.path === "/cross-language-map.json")) root.endpoints.push({ path: "/cross-language-map.json", url: `${API_URL}/cross-language-map.json`, type: "collection", description: "Reviewed English-German functional counterparts inside canonical reasoning patterns" });
  });

  patchJson("api/v1/openapi.json", (spec) => {
    spec.paths ||= {};
    spec.paths["/cross-language-map.json"] ||= { get: { summary: "English-German functional transfer map", operationId: "cross_language_map_json", responses: { "200": { description: "Reviewed same-pattern English and German functional counterparts" } } } };
  });

  patchJson("api/v1/mcp-server.json", (spec) => {
    spec.tools ||= [];
    if (!spec.tools.some((tool) => tool.name === "metkagram_get_cross_language_map")) {
      spec.tools.push({ name: "metkagram_get_cross_language_map", title: "Get English-German functional map", description: "Get reviewed English and German forms that belong to the same canonical Metkagram reasoning pattern ID.", inputSchema: { type: "object", additionalProperties: false }, staticUrl: `${API_URL}/cross-language-map.json` });
      spec.tools.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  patchJson("data/catalog.json", (catalog) => {
    catalog.crossLanguageTransfer = { page: `${SITE_URL}/en/transfer/`, dataset: `${SITE_URL}/data/cross-language-map.json`, api: `${API_URL}/cross-language-map.json`, itemCount: map.itemCount, languages: ["en", "de"] };
  });

  patchJson("api/v1/teaching-manifest.json", (manifest) => {
    manifest.interfaces ||= {};
    manifest.interfaces.cross_language_map = `${API_URL}/cross-language-map.json`;
    manifest.recommended_workflows ||= [];
    if (!manifest.recommended_workflows.some((workflow) => workflow.id === "transfer_same_function_between_languages")) manifest.recommended_workflows.push({ id: "transfer_same_function_between_languages", steps: ["Choose one reviewed canonical pattern ID", "Use its English or German form as the prompt", "Ask the learner to produce the counterpart before revealing it", "Keep the reasoning job constant", "Do not describe the pair as universally word-for-word interchangeable", "Return to the same canonical pattern for practice"] });
  });

  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const model = value.data && typeof value.data === "object" ? value.data : value;
      model.surfaces ||= [];
      if (!model.surfaces.some((surface) => surface.id === "cross-language-transfer")) model.surfaces.push({ id: "cross-language-transfer", audience: ["English learner", "German learner", "teacher", "AI tutor"], jobs: ["transfer one reasoning function between English and German", "compare bilingual forms inside one reviewed canonical pattern"], pages: { en: `${SITE_URL}/en/transfer/`, ru: `${SITE_URL}/ru/transfer/` }, dataset: `${SITE_URL}/data/cross-language-map.json`, itemCount: map.itemCount });
      model.recommendationPolicy ||= { routes: [] };
      model.recommendationPolicy.routes ||= [];
      if (!model.recommendationPolicy.routes.some((route) => route.recommend === "cross-language-transfer")) model.recommendationPolicy.routes.push({ when: "The learner wants to express the same reviewed reasoning job in English and German.", recommend: "cross-language-transfer", reason: "The map only pairs language forms stored inside the same canonical reviewed pattern ID and explicitly avoids claiming literal equivalence." });
    });
  }

  const llmsPath = path.join(DIST, "llms.txt");
  if (fs.existsSync(llmsPath)) {
    let text = fs.readFileSync(llmsPath, "utf8");
    if (!text.includes("## Cross-language transfer")) {
      text += `\n## Cross-language transfer\n- Reviewed EN↔DE functional map: ${SITE_URL}/data/cross-language-map.json\n- Human practice: ${SITE_URL}/en/transfer/\n- A mapping means both forms belong to the same canonical Metkagram reasoning pattern ID. It does not mean word-for-word equivalence in every context.\n- Do not create an unlisted EN↔DE mapping merely from lexical similarity.\n`;
      fs.writeFileSync(llmsPath, text);
    }
  }
}

const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const relationsPath = path.join(DIST, "data", "pattern-relations.json");
const relations = fs.existsSync(relationsPath) ? readJson(relationsPath) : null;
const map = buildMap(patterns, relations);
writeFile("en/transfer/index.html", transferPage("en", map));
writeFile("ru/transfer/index.html", transferPage("ru", map));
for (const locale of ["en", "ru"]) patchBridge(locale);
patchMachineSurfaces(map);
patchSitemap(["/en/transfer/", "/ru/transfer/"]);
patchSeo();
console.log(`Cross-language Transfer published: ${map.itemCount} reviewed EN↔DE functional mappings.`);
