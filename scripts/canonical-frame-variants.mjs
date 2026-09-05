import fs from "node:fs";
import path from "node:path";

import { buildDomainModel, DOMAIN_MODEL_VERSION } from "../src/domain-model.mjs";
import { loadFrameFamilies } from "../src/frame-families.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { escapeHtml } from "../src/render.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";
import { validateLanguagePilotFrames } from "../src/source-validation.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function writeJson(relative, value) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function patchJson(relative, mutate) {
  const target = path.join(DIST, relative);
  if (!fs.existsSync(target)) return;
  const value = readJson(target);
  mutate(value);
  writeJson(relative, value);
}

function collection(items, kind) {
  return { schemaVersion: 1, modelVersion: DOMAIN_MODEL_VERSION, kind, count: items.length, items };
}

function reviewedMappings() {
  const file = path.join(DIST, "data", "cross-language-map.json");
  if (!fs.existsSync(file)) return [];
  return readJson(file).items || [];
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
      validateLanguagePilotFrames(file, value);
      return value.map((record) => ({ ...record, source_file: `data/language-pilots/${name}` }));
    });
}

function publishDomainCollections(model) {
  const moves = collection(model.moves, "move_collection");
  const frames = collection(model.frames, "frame_collection");
  const canonicalFrames = collection(model.canonicalFrames, "canonical_frame_collection");
  const frameVariants = collection(model.frameVariants, "frame_variant_collection");
  const bridges = collection(model.bridges, "bridge_collection");
  const patternIndex = {
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    kind: "pattern_compatibility_index",
    count: model.patternIndex.length,
    items: model.patternIndex,
  };

  for (const [relative, value] of [
    ["data/domain/moves.json", moves],
    ["data/domain/frames.json", frames],
    ["data/domain/canonical-frames.json", canonicalFrames],
    ["data/domain/frame-variants.json", frameVariants],
    ["data/domain/bridges.json", bridges],
    ["data/domain/pattern-index.json", patternIndex],
  ]) writeJson(relative, value);

  const manifestFile = path.join(DIST, "data", "domain", "index.json");
  const manifest = readJson(manifestFile);
  manifest.modelVersion = DOMAIN_MODEL_VERSION;
  manifest.description = "Language-independent Moves, stable Pattern Frames, explicit canonical Frames, reviewed-pilot FrameVariant relations and reviewed cross-language Bridges.";
  manifest.compatibility = "Every existing Pattern ID and Pattern Frame remains valid. Reviewed canonical Frame families add a semantic layer over contextual Pattern variants; they do not delete or rename legacy records.";
  manifest.counts = {
    ...manifest.counts,
    frames: model.frames.length,
    canonicalFrames: model.canonicalFrames.length,
    frameVariants: model.frameVariants.length,
    canonicalFrameFamilies: model.canonicalFrameFamilyCount,
    bridges: model.bridges.length,
  };
  manifest.datasets = {
    ...manifest.datasets,
    canonicalFrames: `${SITE_URL}/data/domain/canonical-frames.json`,
    frameVariants: `${SITE_URL}/data/domain/frame-variants.json`,
  };
  manifest.api = {
    ...manifest.api,
    canonicalFrames: `${API_URL}/canonical-frames.json`,
    frameVariants: `${API_URL}/frame-variants.json`,
  };
  manifest.invariants = [...new Set([
    ...(manifest.invariants || []),
    "A stable Pattern Frame may resolve to itself or to one explicit canonical Frame.",
    "A FrameVariant relation never deletes, renames or rewrites the stable Pattern ID that produced it.",
    "Canonical Frame grouping is published only from the explicit reviewed-pilot manifest; audit similarity alone cannot create a family.",
    "Canonical Frame membership is language-specific and does not imply cross-language equivalence; Bridges remain separate reviewed relations.",
  ])];
  writeJson("data/domain/index.json", manifest);

  const apiCollections = [
    ["api/v1/moves.json", moves, "move_collection", "metkagram-moves-v1"],
    ["api/v1/frames.json", frames, "frame_collection", "metkagram-frames-v1"],
    ["api/v1/canonical-frames.json", canonicalFrames, "canonical_frame_collection", "metkagram-canonical-frames-v1"],
    ["api/v1/frame-variants.json", frameVariants, "frame_variant_collection", "metkagram-frame-variants-v1"],
    ["api/v1/bridges.json", bridges, "bridge_collection", "metkagram-bridges-v1"],
  ];
  for (const [relative, value, recordType, recordId] of apiCollections) {
    writeJson(relative, wrapRecord(value, {
      canonical_url: `${SITE_URL}/${relative}`,
      record_type: recordType,
      record_id: recordId,
    }));
  }
  writeJson("api/v1/domain-model.json", wrapRecord(manifest, {
    canonical_url: `${API_URL}/domain-model.json`,
    record_type: "multilingual_domain_model",
    record_id: "metkagram-domain-model-v1",
  }));

  return manifest;
}

function patchApiDiscovery(model, manifest) {
  const endpoints = [
    ["/canonical-frames.json", "Explicit canonical Frames from reviewed-pilot Frame families"],
    ["/frame-variants.json", "FrameVariant relations from stable Pattern Frames to canonical Frames"],
  ];
  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = {
      ...(root.counts || {}),
      domainCanonicalFrames: model.canonicalFrames.length,
      domainFrameVariants: model.frameVariants.length,
      canonicalFrameFamilies: model.canonicalFrameFamilyCount,
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
      spec.paths[endpoint] = {
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
        name: "metkagram_get_canonical_frames",
        title: "Get canonical Metkagram Frames",
        description: "Get explicit canonical Frame families and representative formulas without collapsing legacy Pattern records.",
        staticUrl: `${API_URL}/canonical-frames.json`,
      },
      {
        name: "metkagram_get_frame_variants",
        title: "Get Metkagram Frame variants",
        description: "Resolve stable Pattern Frames to explicit canonical Frames when a reviewed-pilot FrameVariant relation exists.",
        staticUrl: `${API_URL}/frame-variants.json`,
      },
    ];
    for (const tool of tools) {
      if (!spec.tools.some((item) => item.name === tool.name)) {
        spec.tools.push({ ...tool, inputSchema: { type: "object", additionalProperties: false } });
      }
    }
    spec.tools.sort((a, b) => a.name.localeCompare(b.name));
  });

  patchJson("data/catalog.json", (catalog) => {
    catalog.multilingualDomainModel ||= {};
    catalog.multilingualDomainModel.modelVersion = DOMAIN_MODEL_VERSION;
    catalog.multilingualDomainModel.canonicalFrames = manifest.datasets.canonicalFrames;
    catalog.multilingualDomainModel.frameVariants = manifest.datasets.frameVariants;
    catalog.multilingualDomainModel.counts = manifest.counts;
  });

  patchJson("api/v1/teaching-manifest.json", (teaching) => {
    teaching.interfaces ||= {};
    teaching.interfaces.canonical_frames = `${API_URL}/canonical-frames.json`;
    teaching.interfaces.frame_variants = `${API_URL}/frame-variants.json`;
    teaching.recommended_workflows ||= [];
    if (!teaching.recommended_workflows.some((workflow) => workflow.id === "pattern_to_canonical_frame")) {
      teaching.recommended_workflows.push({
        id: "pattern_to_canonical_frame",
        steps: [
          "Keep the stable Pattern ID supplied by the learner or upstream feature",
          "Resolve that Pattern through pattern-index.json",
          "If a frame_variant_id exists, use the referenced canonical Frame as the reusable learning concept",
          "Keep the original Pattern as a contextual realization and provenance-bearing compatibility record",
          "Do not infer a family from lexical similarity when no explicit FrameVariant relation exists",
        ],
      });
    }
  });
}

function patchFeatureResolvers(model, manifest) {
  const byPattern = new Map(model.patternIndex.map((record) => [record.pattern_id, record]));
  const resolver = {
    model_version: DOMAIN_MODEL_VERSION,
    pattern_index: manifest.datasets.patternIndex,
    canonical_frames: manifest.datasets.canonicalFrames,
    frame_variants: manifest.datasets.frameVariants,
    rule: "Resolve stable Pattern IDs through pattern-index. Absence of frame_variant_ids means the Pattern Frame remains its own canonical Frame; never infer grouping from similarity alone.",
  };

  for (const relative of ["data/pattern-relations.json", "api/v1/pattern-relations.json"]) {
    patchJson(relative, (value) => {
      const root = value.data && typeof value.data === "object" ? value.data : value;
      root.canonicalFrameResolver = resolver;
      for (const [patternId, relation] of Object.entries(root.byPattern || {})) {
        const record = byPattern.get(patternId);
        if (!record) continue;
        relation.domain_model = {
          move_id: record.move_id,
          frame_ids: record.frame_ids,
          canonical_frame_ids: record.canonical_frame_ids,
          frame_variant_ids: record.frame_variant_ids,
        };
      }
    });
  }

  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const root = value.data && typeof value.data === "object" ? value.data : value;
      root.canonicalFrameResolver = resolver;
      for (const surface of root.surfaces || []) {
        if (["pattern-lens", "pattern-atlas", "pattern-map", "pattern-contrasts", "pattern-choice", "pattern-routes", "pattern-bridge"].includes(surface.id)) {
          surface.canonicalFrameResolver = manifest.datasets.patternIndex;
        }
      }
    });
  }
}

function patchPatternApi(model) {
  for (const record of model.patternIndex) {
    const relative = `api/v1/patterns/${record.pattern_id.toLowerCase()}.json`;
    patchJson(relative, (value) => {
      const root = value.data && typeof value.data === "object" ? value.data : value;
      root.domain_model = {
        model_version: DOMAIN_MODEL_VERSION,
        move_id: record.move_id,
        frame_ids: record.frame_ids,
        canonical_frame_ids: record.canonical_frame_ids,
        frame_variant_ids: record.frame_variant_ids,
        pattern_index: `${SITE_URL}/data/domain/pattern-index.json`,
      };
    });
  }
}

function patternPageFile(locale, patternId) {
  const route = patternPath(locale, patternId);
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

function patchPatternPages(model) {
  const canonicalById = new Map(model.canonicalFrames.map((frame) => [frame.id, frame]));
  const variantsByPattern = new Map();
  for (const variant of model.frameVariants) {
    if (!variantsByPattern.has(variant.pattern_id)) variantsByPattern.set(variant.pattern_id, []);
    variantsByPattern.get(variant.pattern_id).push(variant);
  }

  for (const [patternId, variants] of variantsByPattern) {
    const canonicalFrames = variants.map((variant) => canonicalById.get(variant.canonical_frame_id)).filter(Boolean);
    const siblings = [...new Set(canonicalFrames.flatMap((frame) => frame.member_pattern_ids).filter((id) => id !== patternId))];
    for (const locale of ["en", "ru"]) {
      const file = patternPageFile(locale, patternId);
      if (!fs.existsSync(file)) continue;
      let page = fs.readFileSync(file, "utf8");
      if (page.includes("data-canonical-frame-family")) continue;
      const ru = locale === "ru";
      const formulas = canonicalFrames.map((frame) => `<li><strong>${escapeHtml(frame.language.toUpperCase())}</strong> · ${(frame.formula_variants || [frame.formula]).map((formula) => `<code lang="${escapeHtml(frame.language)}">${escapeHtml(formula)}</code>`).join(" / ")}</li>`).join("");
      const siblingLinks = siblings.slice(0, 7).map((sibling) => `<a href="${patternPath(locale, sibling)}">${escapeHtml(sibling)}</a>`).join(" · ");
      const section = `<section class="section-pad ruled" data-canonical-frame-family="${escapeHtml(canonicalFrames[0]?.family_id || "")}">
        <p class="eyebrow">Canonical Frame · pilot</p>
        <h2>${ru ? "Одна структура, несколько контекстов" : "One reusable Frame, several contexts"}</h2>
        <p>${ru ? "Этот Pattern сохранён как стабильная контекстная реализация. Проверенная структурная связь указывает на более общий Frame; старый Pattern ID, URL и API-запись не удаляются." : "This Pattern remains a stable contextual realization. An explicit structural relation points to a more general Frame; the existing Pattern ID, URL and API record remain intact."}</p>
        <ul>${formulas}</ul>
        <p><strong>${ru ? "Связь" : "Relation"}:</strong> contextual_realization · ${ru ? "пилотная проверка структуры, не human-reviewed" : "source-verified pilot grouping, not human-reviewed"}</p>
        ${siblingLinks ? `<p><strong>${ru ? "Другие контексты" : "Other contexts"}:</strong> ${siblingLinks}</p>` : ""}
        <a class="text-link" href="/data/domain/canonical-frames.json">${ru ? "Открыть canonical Frame data" : "Open canonical Frame data"} <span aria-hidden="true">→</span></a>
      </section>`;
      page = page.replace("</main>", `${section}</main>`);
      fs.writeFileSync(file, page);
    }
  }
}

function patchLlms(manifest) {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("## Canonical Frame families")) {
    text += `\n## Canonical Frame families\n- Canonical Frames: ${manifest.datasets.canonicalFrames}\n- FrameVariant relations: ${manifest.datasets.frameVariants}\n- Compatibility index: ${manifest.datasets.patternIndex}\n- Existing Pattern IDs remain valid. Resolve a Pattern to a canonical Frame only when an explicit FrameVariant relation is published; do not infer grouping from lexical similarity.\n`;
  }
  fs.writeFileSync(file, text);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the base build first.");
  const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
  const model = buildDomainModel(patterns, {
    reviewedMappings: reviewedMappings(),
    frameExtensions: frameExtensions(),
    frameFamilies: loadFrameFamilies(),
  });
  const manifest = publishDomainCollections(model);
  patchApiDiscovery(model, manifest);
  patchFeatureResolvers(model, manifest);
  patchPatternApi(model);
  patchPatternPages(model);
  patchLlms(manifest);
  console.log(`Canonical Frame layer: ${model.canonicalFrameFamilyCount} families / ${model.canonicalFrames.length} language-specific canonical Frames / ${model.frameVariants.length} reviewed-pilot FrameVariant relations.`);
}

main();
