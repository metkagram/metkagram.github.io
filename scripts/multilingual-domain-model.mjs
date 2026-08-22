import fs from "node:fs";
import path from "node:path";
import { buildDomainModel, DOMAIN_MODEL_VERSION } from "../src/domain-model.mjs";
import { publicLanguageMatrix } from "../src/language-registry.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { escapeHtml, layout } from "../src/render.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";
import { patternPath, patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function writeFile(relative, content) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function writeJson(relative, value) {
  writeFile(relative, `${JSON.stringify(value, null, 2)}\n`);
}

function patchJson(relative, mutate) {
  const target = path.join(DIST, relative);
  if (!fs.existsSync(target)) return;
  const value = readJson(target);
  mutate(value);
  writeJson(relative, value);
}

function collection(items, kind) {
  return {
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    kind,
    count: items.length,
    items,
  };
}

function reviewedMappings() {
  const file = path.join(DIST, "data", "cross-language-map.json");
  if (!fs.existsSync(file)) return [];
  const value = readJson(file);
  return value.items || [];
}

function frameExtensions() {
  const directory = path.join(ROOT, "data", "language-pilots");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      const file = path.join(directory, name);
      const value = readJson(file);
      if (!Array.isArray(value)) throw new Error(`${file} must contain an array of Frame extensions.`);
      return value.map((record) => ({ ...record, source_file: `data/language-pilots/${name}` }));
    });
}

function buildPilotManifest(extensions, model) {
  const byLanguage = new Map();
  const frameMap = new Map(model.frames.map((frame) => [frame.id, frame]));
  for (const extension of extensions) {
    if (!byLanguage.has(extension.lang)) byLanguage.set(extension.lang, []);
    byLanguage.get(extension.lang).push(extension);
  }
  const pilots = {};
  for (const [language, items] of [...byLanguage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const frames = items.map((item) => frameMap.get(`frame:${item.pattern_id.toLowerCase()}:${language}`)).filter(Boolean);
    pilots[language] = {
      status: "editorial_pilot",
      frameCount: frames.length,
      exampleCount: frames.reduce((sum, frame) => sum + 1 + (frame.examples?.length || 0), 0),
      patternIds: frames.map((frame) => frame.pattern_id).sort(),
      sourceFiles: [...new Set(items.map((item) => item.source_file))].sort(),
      translationLocales: [...new Set(frames.flatMap((frame) => Object.keys(frame.translations || {})))].sort(),
      reviewedBridges: model.bridges.filter((bridge) => bridge.from_language === language || bridge.to_language === language).length,
      pages: {
        en: `${SITE_URL}/en/practice/language/french/`,
        ru: `${SITE_URL}/ru/practice/language/french/`,
      },
      boundary: "Frame-only pilot. No annotation capability and no cross-language Bridge is implied by the existence of a French Frame.",
    };
  }
  return {
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    kind: "language_pilot_collection",
    count: Object.keys(pilots).length,
    pilots,
  };
}

function publishDatasets(model, extensions) {
  const moves = collection(model.moves, "move_collection");
  const frames = collection(model.frames, "frame_collection");
  const bridges = collection(model.bridges, "bridge_collection");
  const patternIndex = {
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    kind: "pattern_compatibility_index",
    count: model.patternIndex.length,
    items: model.patternIndex,
  };
  const languages = publicLanguageMatrix();
  const languagePilots = buildPilotManifest(extensions, model);
  const manifest = {
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    name: "Metkagram multilingual domain model",
    description: "Language-independent Moves, language-specific Frames and explicitly reviewed cross-language Bridges derived without changing existing public pattern IDs.",
    compatibility: "Pattern remains the public umbrella and stable compatibility identifier. Frame, Move and Bridge are normalized domain objects.",
    invariants: [
      "A Move has no learning language.",
      "A Frame belongs to exactly one enabled learning language.",
      "A Bridge connects two existing Frames in different languages.",
      "No Bridge is published merely because two strings look similar; a reviewed mapping source is required.",
      "Translation locale, learning language, interface locale and annotation capability are independent.",
      "A learning language may publish reviewed Frame extensions before annotation or interface localization exists.",
    ],
    counts: {
      patterns: model.patternCount,
      moves: model.moves.length,
      frames: model.frames.length,
      extensionFrames: model.extensionFrameCount || 0,
      bridges: model.bridges.length,
      languagePilots: languagePilots.count,
    },
    languages,
    languagePilots: languagePilots.pilots,
    datasets: {
      moves: `${SITE_URL}/data/domain/moves.json`,
      frames: `${SITE_URL}/data/domain/frames.json`,
      bridges: `${SITE_URL}/data/domain/bridges.json`,
      patternIndex: `${SITE_URL}/data/domain/pattern-index.json`,
      languagePilots: `${SITE_URL}/data/domain/language-pilots.json`,
    },
    api: {
      manifest: `${API_URL}/domain-model.json`,
      moves: `${API_URL}/moves.json`,
      frames: `${API_URL}/frames.json`,
      bridges: `${API_URL}/bridges.json`,
      languagePilots: `${API_URL}/language-pilots.json`,
    },
  };

  writeJson("data/domain/index.json", manifest);
  writeJson("data/domain/moves.json", moves);
  writeJson("data/domain/frames.json", frames);
  writeJson("data/domain/bridges.json", bridges);
  writeJson("data/domain/pattern-index.json", patternIndex);
  writeJson("data/domain/language-pilots.json", languagePilots);

  writeJson("api/v1/domain-model.json", wrapRecord(manifest, {
    canonical_url: `${API_URL}/domain-model.json`,
    record_type: "multilingual_domain_model",
    record_id: "metkagram-domain-model-v1",
  }));
  writeJson("api/v1/moves.json", wrapRecord(moves, {
    canonical_url: `${API_URL}/moves.json`,
    record_type: "move_collection",
    record_id: "metkagram-moves-v1",
  }));
  writeJson("api/v1/frames.json", wrapRecord(frames, {
    canonical_url: `${API_URL}/frames.json`,
    record_type: "frame_collection",
    record_id: "metkagram-frames-v1",
  }));
  writeJson("api/v1/bridges.json", wrapRecord(bridges, {
    canonical_url: `${API_URL}/bridges.json`,
    record_type: "bridge_collection",
    record_id: "metkagram-bridges-v1",
  }));
  writeJson("api/v1/language-pilots.json", wrapRecord(languagePilots, {
    canonical_url: `${API_URL}/language-pilots.json`,
    record_type: "language_pilot_collection",
    record_id: "metkagram-language-pilots-v1",
  }));

  return manifest;
}

function patchApi(manifest) {
  const endpoints = [
    ["/domain-model.json", "Multilingual domain-model manifest"],
    ["/moves.json", "Language-independent communicative and reasoning Moves"],
    ["/frames.json", "Language-specific reusable Frames"],
    ["/bridges.json", "Reviewed cross-language Frame Bridges"],
    ["/language-pilots.json", "Frame-only learning-language pilots and their capability boundaries"],
  ];

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = {
      ...(root.counts || {}),
      domainMoves: manifest.counts.moves,
      domainFrames: manifest.counts.frames,
      domainExtensionFrames: manifest.counts.extensionFrames,
      domainBridges: manifest.counts.bridges,
      languagePilots: manifest.counts.languagePilots,
    };
    root.endpoints ||= [];
    for (const [endpoint, description] of endpoints) {
      if (!root.endpoints.some((item) => item.path === endpoint)) {
        root.endpoints.push({ path: endpoint, url: `${API_URL}${endpoint}`, type: "collection", description });
      }
    }
  });

  patchJson("api/v1/openapi.json", (spec) => {
    spec.paths ||= {};
    for (const [endpoint, description] of endpoints) {
      spec.paths[endpoint] ||= {
        get: {
          summary: description,
          operationId: endpoint.slice(1, -5).replaceAll("-", "_") + "_json",
          responses: { "200": { description } },
        },
      };
    }
  });

  patchJson("api/v1/mcp-server.json", (spec) => {
    spec.tools ||= [];
    const tools = [
      {
        name: "metkagram_get_domain_model",
        title: "Get Metkagram domain model",
        description: "Get the Move → Frame → Bridge model, language capabilities, invariants and dataset URLs.",
        staticUrl: `${API_URL}/domain-model.json`,
      },
      {
        name: "metkagram_get_moves",
        title: "Get Metkagram Moves",
        description: "Get language-independent communicative and reasoning jobs connected to reviewed Frames.",
        staticUrl: `${API_URL}/moves.json`,
      },
      {
        name: "metkagram_get_frames",
        title: "Get Metkagram Frames",
        description: "Get language-specific reusable Frames with formulas, examples and normalized translation maps.",
        staticUrl: `${API_URL}/frames.json`,
      },
      {
        name: "metkagram_get_bridges",
        title: "Get Metkagram Bridges",
        description: "Get reviewed cross-language links between Frames. Missing Bridges are intentional and must not be guessed.",
        staticUrl: `${API_URL}/bridges.json`,
      },
      {
        name: "metkagram_get_language_pilots",
        title: "Get Metkagram language pilots",
        description: "Get Frame-only pilot languages, coverage counts and explicit capability boundaries.",
        staticUrl: `${API_URL}/language-pilots.json`,
      },
    ];
    for (const tool of tools) {
      if (spec.tools.some((existing) => existing.name === tool.name)) continue;
      spec.tools.push({ ...tool, inputSchema: { type: "object", additionalProperties: false } });
    }
    spec.tools.sort((a, b) => a.name.localeCompare(b.name));
  });
}

function patchCatalog(manifest) {
  patchJson("data/catalog.json", (catalog) => {
    catalog.multilingualDomainModel = {
      modelVersion: manifest.modelVersion,
      manifest: `${SITE_URL}/data/domain/index.json`,
      moves: manifest.datasets.moves,
      frames: manifest.datasets.frames,
      bridges: manifest.datasets.bridges,
      patternIndex: manifest.datasets.patternIndex,
      languagePilots: manifest.datasets.languagePilots,
      counts: manifest.counts,
    };
  });

  patchJson("data/schema.json", (schema) => {
    schema.properties ||= {};
    schema.properties.move = {
      type: "object",
      required: ["id", "kind", "name", "language", "language_independent", "pattern_ids", "frame_ids"],
      properties: {
        kind: { const: "move" },
        language: { type: "null" },
        language_independent: { const: true },
      },
    };
    schema.properties.frame = {
      type: "object",
      required: ["id", "kind", "pattern_id", "language", "formula", "example", "translations", "source_kind"],
      properties: {
        kind: { const: "frame" },
        language: { type: "string" },
        translations: { type: "object", additionalProperties: { type: "string" } },
        source_kind: { enum: ["canonical_pattern", "language_extension"] },
      },
    };
    schema.properties.bridge = {
      type: "object",
      required: ["id", "kind", "from_frame_id", "to_frame_id", "from_language", "to_language", "relation", "review_status", "literal_equivalence"],
      properties: {
        kind: { const: "bridge" },
        review_status: { const: "reviewed" },
        literal_equivalence: { const: false },
      },
    };
  });

  patchJson("project.json", (project) => {
    project.languageCapabilities = `${SITE_URL}/data/languages.json`;
    project.domainModel = `${SITE_URL}/data/domain/index.json`;
    project.languagePilots = `${SITE_URL}/data/domain/language-pilots.json`;
    project.multilingualArchitecture = "Move is language-independent; Frame belongs to one learning language; Bridge is explicit and reviewed; annotation is optional.";
  });
}

function patchDiscovery(manifest) {
  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const root = value.data && typeof value.data === "object" ? value.data : value;
      root.surfaces ||= [];
      if (!root.surfaces.some((surface) => surface.id === "multilingual-domain-model")) {
        root.surfaces.push({
          id: "multilingual-domain-model",
          audience: ["AI agent", "developer", "researcher", "teacher"],
          jobs: ["resolve language-independent Move to language-specific Frames", "inspect reviewed cross-language Bridges", "discover actual language capabilities without guessing"],
          dataset: `${SITE_URL}/data/domain/index.json`,
          counts: manifest.counts,
        });
      }
      if (manifest.languagePilots.fr && !root.surfaces.some((surface) => surface.id === "french-frame-pilot")) {
        root.surfaces.push({
          id: "french-frame-pilot",
          audience: ["French learner", "Russian-speaking learner", "teacher", "AI tutor", "researcher"],
          jobs: ["practice reviewed French reasoning Frames", "study French Frames with Russian support translations", "test Frame-only language support without annotation"],
          pages: manifest.languagePilots.fr.pages,
          dataset: `${SITE_URL}/data/domain/frames.json`,
          frameCount: manifest.languagePilots.fr.frameCount,
          boundary: manifest.languagePilots.fr.boundary,
        });
      }
    });
  }

  patchJson("api/v1/teaching-manifest.json", (manifestFile) => {
    manifestFile.interfaces ||= {};
    manifestFile.interfaces.domain_model = `${API_URL}/domain-model.json`;
    manifestFile.interfaces.moves = `${API_URL}/moves.json`;
    manifestFile.interfaces.frames = `${API_URL}/frames.json`;
    manifestFile.interfaces.bridges = `${API_URL}/bridges.json`;
    manifestFile.interfaces.language_pilots = `${API_URL}/language-pilots.json`;
    manifestFile.recommended_workflows ||= [];
    if (!manifestFile.recommended_workflows.some((workflow) => workflow.id === "move_frame_bridge_transfer")) {
      manifestFile.recommended_workflows.push({
        id: "move_frame_bridge_transfer",
        steps: [
          "Choose the communicative or reasoning Move without assuming a learning language",
          "Select a Frame in the requested learning language",
          "Use translations only in the learner's enabled support locale",
          "Use a Bridge only when an explicit reviewed Bridge record exists",
          "Do not require annotation support for Frame practice",
        ],
      });
    }
    if (!manifestFile.recommended_workflows.some((workflow) => workflow.id === "practice_french_frame_pilot")) {
      manifestFile.recommended_workflows.push({
        id: "practice_french_frame_pilot",
        steps: [
          "Filter Frames by language=fr and source_status=editorial_pilot",
          "Present the French formula before the examples",
          "Use Russian translations only when support is needed",
          "Do not claim French annotation support",
          "Do not infer an EN↔FR or DE↔FR Bridge unless a reviewed Bridge record is published",
        ],
      });
    }
  });
}

function patchHumanPages() {
  const pages = [
    ["en", "ai", `<section class="section-pad ruled" data-multilingual-domain-model><p class="eyebrow">Move → Frame → Bridge</p><h2>A multilingual model that does not confuse language with meaning.</h2><p>Moves are language-independent. Frames belong to one learning language. Bridges are explicit reviewed links between Frames. Translation and annotation are separate capabilities, so a new language can become useful before it has its own annotation pipeline.</p><div class="legal-inline-links"><a href="/data/domain/index.json">Domain model</a><a href="/data/domain/frames.json">Frames</a><a href="/data/domain/bridges.json">Bridges</a><a href="/data/languages.json">Language capabilities</a></div></section>`],
    ["ru", "ai", `<section class="section-pad ruled" data-multilingual-domain-model><p class="eyebrow">Move → Frame → Bridge</p><h2>Мультиязычная модель без смешивания языка и смысла.</h2><p>Move не зависит от языка. Frame принадлежит одному изучаемому языку. Bridge — явная проверенная связь между Frames. Переводы и разметка являются отдельными возможностями, поэтому новый язык может стать полезным ещё до появления собственного annotation pipeline.</p><div class="legal-inline-links"><a href="/data/domain/index.json">Domain model</a><a href="/data/domain/frames.json">Frames</a><a href="/data/domain/bridges.json">Bridges</a><a href="/data/languages.json">Языковые возможности</a></div></section>`],
    ["en", "data", `<section class="section-pad ruled" data-multilingual-domain-model><p class="eyebrow">Normalized knowledge layer</p><h2>Moves, Frames and Bridges</h2><p>The compatibility pattern dataset remains stable. The normalized domain datasets separate language-independent jobs from language-specific realizations for agents, research and future language expansion.</p><a class="text-link" href="/data/domain/index.json">Open domain manifest <span aria-hidden="true">→</span></a></section>`],
    ["ru", "data", `<section class="section-pad ruled" data-multilingual-domain-model><p class="eyebrow">Нормализованный слой знаний</p><h2>Moves, Frames и Bridges</h2><p>Стабильный pattern dataset сохраняется. Нормализованные данные отдельно представляют языконезависимые задачи и их реализации на конкретных языках.</p><a class="text-link" href="/data/domain/index.json">Открыть domain manifest <span aria-hidden="true">→</span></a></section>`],
  ];
  for (const [locale, section, html] of pages) {
    const file = path.join(DIST, locale, section, "index.html");
    if (!fs.existsSync(file)) continue;
    let page = fs.readFileSync(file, "utf8");
    if (page.includes("data-multilingual-domain-model")) continue;
    page = page.replace("</main>", `${html}</main>`);
    fs.writeFileSync(file, page);
  }
}

function frenchPilotPage(locale, frames) {
  const ru = locale === "ru";
  const pathname = `/${locale}/practice/language/french/`;
  const cards = frames.map((frame) => {
    const examples = [frame.example, ...(frame.examples || []).map((item) => item.text)];
    const support = ru && frame.translations?.ru ? `<p><strong>Перевод:</strong> ${escapeHtml(frame.translations.ru)}</p>` : "";
    return `<article class="pattern-reader" data-french-pilot-frame="${escapeHtml(frame.id)}">
      <p class="eyebrow">${escapeHtml(frame.pattern_id)} · ${escapeHtml(frame.move_id?.replace("move:", "") || "Frame")}</p>
      <h3>${escapeHtml(frame.formula)}</h3>
      <p>${escapeHtml(examples[0])}</p>
      ${support}
      <details class="faq-list"><summary>${ru ? "Ещё примеры" : "More examples"}</summary><div>${examples.slice(1).map((example) => `<p>${escapeHtml(example)}</p>`).join("")}</div></details>
      <a class="text-link" href="${patternPath(locale, frame.pattern_id)}">${ru ? "Открыть canonical Pattern" : "Open canonical Pattern"} <span aria-hidden="true">→</span></a>
    </article>`;
  }).join("");
  const title = ru ? "Французский: пилот из 20 речевых Frames | Metkagram" : "French Frame Pilot: 20 reusable reasoning patterns | Metkagram";
  const description = ru
    ? "Пилот Metkagram: 20 французских Frames и 60 примеров с русской поддержкой. Французская разметка и reviewed Bridges пока не заявляются."
    : "A Metkagram pilot with 20 French Frames and 60 examples. French annotation and reviewed cross-language Bridges are intentionally not claimed yet.";
  return layout({
    locale,
    pathname,
    title,
    description,
    pageType: "CollectionPage",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: ru ? "Французский Frame pilot Metkagram" : "Metkagram French Frame pilot",
      numberOfItems: frames.length,
      itemListElement: frames.map((frame, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${frame.pattern_id}: ${frame.formula}`,
        url: patternUrl(locale, frame.pattern_id),
      })),
    }],
    body: `<section class="section-pad"><p class="eyebrow">Metkagram · French Frame pilot</p><h1>${ru ? "Французский без фальшивой «полной поддержки»." : "French, without pretending the whole language stack is finished."}</h1><p class="lede">${escapeHtml(description)}</p><div class="legal-inline-links"><a href="/data/domain/frames.json">${ru ? "Машиночитаемые Frames" : "Machine-readable Frames"}</a><a href="/data/domain/language-pilots.json">${ru ? "Статус пилота" : "Pilot status"}</a><a href="/data/languages.json">${ru ? "Языковые возможности" : "Language capabilities"}</a></div></section><section class="section-pad ruled"><p class="eyebrow">20 Frames · 60 examples</p><h2>${ru ? "Что уже можно учить" : "What is usable now"}</h2><p>${ru ? "Каждый Frame привязан к существующему языконезависимому Move и canonical Pattern ID. Русский здесь только язык поддержки. Для French пока нет собственного annotation profile, и EN↔FR / DE↔FR связи не создаются автоматически." : "Each Frame is attached to an existing language-independent Move and canonical Pattern ID. Russian is a support translation locale only. French has no annotation profile yet, and EN↔FR / DE↔FR relations are not inferred automatically."}</p><div class="pattern-comparison-list">${cards}</div></section>`,
  });
}

function publishPilotPages(model) {
  const frenchFrames = model.frames.filter((frame) => frame.language === "fr" && frame.source_status === "editorial_pilot");
  if (!frenchFrames.length) return [];
  const routes = [];
  for (const locale of ["en", "ru"]) {
    writeFile(`${locale}/practice/language/french/index.html`, frenchPilotPage(locale, frenchFrames));
    routes.push(`/${locale}/practice/language/french/`);
  }
  return routes;
}

function patchSitemap(routes) {
  const target = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(target)) return;
  let xml = fs.readFileSync(target, "utf8");
  for (const route of routes) {
    const url = `${SITE_URL}${route}`;
    if (!xml.includes(`<loc>${url}</loc>`)) {
      xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
    }
  }
  fs.writeFileSync(target, xml);
}

function patchSeo(routes) {
  patchJson("seo/site-pages.json", (inventory) => {
    inventory.pages ||= [];
    for (const route of routes) {
      const locale = route.startsWith("/ru/") ? "ru" : "en";
      const ru = locale === "ru";
      const record = {
        route,
        canonical: `${SITE_URL}${route}`,
        language: locale,
        title: ru ? "Французский: пилот из 20 речевых Frames | Metkagram" : "French Frame Pilot: 20 reusable reasoning patterns | Metkagram",
        description: ru ? "20 французских Frames и 60 примеров с русской поддержкой; без заявления о французской разметке или reviewed Bridges." : "20 French Frames and 60 examples in a Frame-only pilot; no claim of French annotation or reviewed cross-language Bridges.",
        lastModified: SITE_RELEASE_DATE,
      };
      const existing = inventory.pages.findIndex((page) => page.route === route);
      if (existing >= 0) inventory.pages[existing] = record;
      else inventory.pages.push(record);
    }
    inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
    inventory.pageCount = inventory.pages.length;
  });
}

function patchLlms(manifest) {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("## Multilingual domain model")) {
    text += `\n## Multilingual domain model\n- Manifest: ${SITE_URL}/data/domain/index.json\n- Moves: ${manifest.datasets.moves}\n- Frames: ${manifest.datasets.frames}\n- Bridges: ${manifest.datasets.bridges}\n- Language capabilities: ${SITE_URL}/data/languages.json\n- Treat Move as language-independent and Frame as language-specific. A missing Bridge is meaningful: do not infer cross-language equivalence unless a reviewed Bridge exists.\n`;
  }
  if (manifest.languagePilots.fr && !text.includes("## French Frame pilot")) {
    text += `\n## French Frame pilot\n- Human page: ${manifest.languagePilots.fr.pages.en}\n- Pilot manifest: ${manifest.datasets.languagePilots}\n- Coverage: ${manifest.languagePilots.fr.frameCount} French Frames and ${manifest.languagePilots.fr.exampleCount} examples.\n- French is learning=true, annotation=false, interface=false. Russian is used only as a support translation locale.\n- There are currently ${manifest.languagePilots.fr.reviewedBridges} reviewed Bridges involving French. Do not infer EN↔FR or DE↔FR equivalence from shared pattern IDs.\n`;
  }
  fs.writeFileSync(file, text);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the base build first.");
  const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
  const extensions = frameExtensions();
  const model = buildDomainModel(patterns, { reviewedMappings: reviewedMappings(), frameExtensions: extensions });
  const manifest = publishDatasets(model, extensions);
  patchApi(manifest);
  patchCatalog(manifest);
  patchDiscovery(manifest);
  patchHumanPages();
  const pilotRoutes = publishPilotPages(model);
  patchSitemap(pilotRoutes);
  patchSeo(pilotRoutes);
  patchLlms(manifest);
  console.log(`Multilingual domain model: ${manifest.counts.moves} Moves, ${manifest.counts.frames} Frames (${manifest.counts.extensionFrames} extensions), ${manifest.counts.bridges} reviewed Bridges.`);
}

main();
