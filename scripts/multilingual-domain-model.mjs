import fs from "node:fs";
import path from "node:path";
import { buildDomainModel, DOMAIN_MODEL_VERSION } from "../src/domain-model.mjs";
import { publicLanguageMatrix } from "../src/language-registry.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_URL } from "../src/site.mjs";

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

function publishDatasets(model) {
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
    ],
    counts: {
      patterns: model.patternCount,
      moves: model.moves.length,
      frames: model.frames.length,
      bridges: model.bridges.length,
    },
    languages,
    datasets: {
      moves: `${SITE_URL}/data/domain/moves.json`,
      frames: `${SITE_URL}/data/domain/frames.json`,
      bridges: `${SITE_URL}/data/domain/bridges.json`,
      patternIndex: `${SITE_URL}/data/domain/pattern-index.json`,
    },
    api: {
      manifest: `${API_URL}/domain-model.json`,
      moves: `${API_URL}/moves.json`,
      frames: `${API_URL}/frames.json`,
      bridges: `${API_URL}/bridges.json`,
    },
  };

  writeJson("data/domain/index.json", manifest);
  writeJson("data/domain/moves.json", moves);
  writeJson("data/domain/frames.json", frames);
  writeJson("data/domain/bridges.json", bridges);
  writeJson("data/domain/pattern-index.json", patternIndex);

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

  return manifest;
}

function patchApi(manifest) {
  const endpoints = [
    ["/domain-model.json", "Multilingual domain-model manifest"],
    ["/moves.json", "Language-independent communicative and reasoning Moves"],
    ["/frames.json", "Language-specific reusable Frames"],
    ["/bridges.json", "Reviewed cross-language Frame Bridges"],
  ];

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = {
      ...(root.counts || {}),
      domainMoves: manifest.counts.moves,
      domainFrames: manifest.counts.frames,
      domainBridges: manifest.counts.bridges,
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
      required: ["id", "kind", "pattern_id", "language", "formula", "translations"],
      properties: {
        kind: { const: "frame" },
        language: { type: "string" },
        translations: { type: "object", additionalProperties: { type: "string" } },
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
    });
  }

  patchJson("api/v1/teaching-manifest.json", (manifestFile) => {
    manifestFile.interfaces ||= {};
    manifestFile.interfaces.domain_model = `${API_URL}/domain-model.json`;
    manifestFile.interfaces.moves = `${API_URL}/moves.json`;
    manifestFile.interfaces.frames = `${API_URL}/frames.json`;
    manifestFile.interfaces.bridges = `${API_URL}/bridges.json`;
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

function patchLlms(manifest) {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("## Multilingual domain model")) return;
  text += `\n## Multilingual domain model\n- Manifest: ${SITE_URL}/data/domain/index.json\n- Moves: ${manifest.datasets.moves}\n- Frames: ${manifest.datasets.frames}\n- Bridges: ${manifest.datasets.bridges}\n- Language capabilities: ${SITE_URL}/data/languages.json\n- Treat Move as language-independent and Frame as language-specific. A missing Bridge is meaningful: do not infer cross-language equivalence unless a reviewed Bridge exists.\n`;
  fs.writeFileSync(file, text);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the base build first.");
  const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
  const model = buildDomainModel(patterns, { reviewedMappings: reviewedMappings() });
  const manifest = publishDatasets(model);
  patchApi(manifest);
  patchCatalog(manifest);
  patchDiscovery(manifest);
  patchHumanPages();
  patchLlms(manifest);
  console.log(`Multilingual domain model: ${manifest.counts.moves} Moves, ${manifest.counts.frames} Frames, ${manifest.counts.bridges} reviewed Bridges.`);
}

main();
