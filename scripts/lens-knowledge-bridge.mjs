import fs from "node:fs";
import path from "node:path";
import { wrapRecord } from "../src/provenance.mjs";
import { SITE_URL } from "../src/site.mjs";

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

function relationRecord(byPattern, patternId) {
  byPattern[patternId] ||= { pattern_id: patternId, contrasts: [], drills: [], packs: [] };
  return byPattern[patternId];
}

function packMembers(pack, contrastMap, drillMap) {
  const members = new Set();
  for (const step of pack.steps || []) {
    if (step.kind === "pattern") members.add(step.id);
    if (step.kind === "contrast") {
      const contrast = contrastMap.get(step.id);
      for (const id of contrast?.patterns || []) members.add(id);
    }
    if (step.kind === "drill") {
      const drill = drillMap.get(step.id);
      for (const id of drill?.options || []) members.add(id);
    }
  }
  return members;
}

function buildIndex() {
  const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
  const contrasts = readJson(path.join(ROOT, "data", "contrasts.json"));
  const drills = readJson(path.join(ROOT, "data", "choice-drills.json"));
  const packs = readJson(path.join(ROOT, "data", "reasoning-packs.json"));

  const patternIds = new Set(patterns.map((pattern) => pattern.id));
  const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
  const drillMap = new Map(drills.items.map((item) => [item.id, item]));
  const byPattern = {};

  for (const contrast of contrasts.items) {
    if (contrast.review_status !== "reviewed" || contrast.patterns.length !== 2) throw new Error(`Contrast ${contrast.id} is not a reviewed pair.`);
    for (const patternId of contrast.patterns) {
      if (!patternIds.has(patternId)) throw new Error(`Contrast ${contrast.id} references missing pattern ${patternId}.`);
      const pairedPattern = contrast.patterns.find((id) => id !== patternId);
      relationRecord(byPattern, patternId).contrasts.push({
        id: contrast.id,
        relation: contrast.relation,
        title_en: contrast.title_en,
        title_ru: contrast.title_ru,
        paired_pattern: pairedPattern,
      });
    }
  }

  for (const drill of drills.items) {
    const contrast = contrastMap.get(drill.contrast_id);
    if (!contrast) throw new Error(`Drill ${drill.id} references missing contrast ${drill.contrast_id}.`);
    if (drill.review_status !== "reviewed") throw new Error(`Drill ${drill.id} is not reviewed.`);
    for (const patternId of drill.options) {
      if (!patternIds.has(patternId) || !contrast.patterns.includes(patternId)) throw new Error(`Drill ${drill.id} has an invalid option ${patternId}.`);
      relationRecord(byPattern, patternId).drills.push({
        id: drill.id,
        contrast_id: drill.contrast_id,
        answer_pattern: drill.answer_pattern,
        role: drill.answer_pattern === patternId ? "best-fit" : "nearby",
        scenario_en: drill.scenario_en,
        scenario_ru: drill.scenario_ru,
      });
    }
  }

  for (const pack of packs.packs) {
    if (pack.review_status !== "reviewed") throw new Error(`Pack ${pack.id} is not reviewed.`);
    for (const patternId of packMembers(pack, contrastMap, drillMap)) {
      if (!patternIds.has(patternId)) throw new Error(`Pack ${pack.id} resolves to missing pattern ${patternId}.`);
      relationRecord(byPattern, patternId).packs.push({
        id: pack.id,
        title_en: pack.title_en,
        title_ru: pack.title_ru,
        description_en: pack.description_en,
        description_ru: pack.description_ru,
      });
    }
  }

  for (const record of Object.values(byPattern)) {
    record.contrasts.sort((a, b) => a.id.localeCompare(b.id));
    record.drills.sort((a, b) => (a.role === b.role ? a.id.localeCompare(b.id) : a.role === "best-fit" ? -1 : 1));
    record.packs.sort((a, b) => a.id.localeCompare(b.id));
  }

  return {
    schemaVersion: 1,
    status: "derived-reviewed-relations",
    description: "Derived relation index connecting a canonical pattern to reviewed contrasts, Pattern Choice Clinic drills and curated Reasoning Packs.",
    counts: {
      patterns: Object.keys(byPattern).length,
      contrasts: contrasts.items.length,
      drills: drills.items.length,
      packs: packs.packs.length,
    },
    byPattern: Object.fromEntries(Object.entries(byPattern).sort(([a], [b]) => a.localeCompare(b))),
  };
}

function injectLensAssets() {
  for (const locale of ["en", "ru"]) {
    const target = path.join(DIST, locale, "lens", "index.html");
    if (!fs.existsSync(target)) throw new Error(`Missing Pattern Lens page for ${locale}.`);
    let html = fs.readFileSync(target, "utf8");
    if (!html.includes("/assets/lens-knowledge-bridge.css")) {
      html = html.replace("</head>", "  <link rel=\"stylesheet\" href=\"/assets/lens-knowledge-bridge.css\">\n</head>");
    }
    if (!html.includes("/assets/lens-knowledge-bridge.js")) {
      html = html.replace("</body>", "  <script type=\"module\" src=\"/assets/lens-knowledge-bridge.js\"></script>\n</body>");
    }
    fs.writeFileSync(target, html);
  }
}

function patchMachineSurfaces(index) {
  writeJson("data/pattern-relations.json", index);
  writeJson("api/v1/pattern-relations.json", wrapRecord(index, {
    canonical_url: `${API_URL}/pattern-relations.json`,
    record_type: "pattern_relation_index",
    record_id: "public-pattern-relations",
  }));

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = { ...(root.counts || {}), patternRelations: index.counts.patterns };
    root.endpoints ||= [];
    if (!root.endpoints.some((item) => item.path === "/pattern-relations.json")) {
      root.endpoints.push({ path: "/pattern-relations.json", url: `${API_URL}/pattern-relations.json`, type: "index", description: "Pattern-to-contrast, drill and reasoning-pack relation index" });
    }
  });

  patchJson("api/v1/openapi.json", (spec) => {
    spec.paths ||= {};
    spec.paths["/pattern-relations.json"] ||= {
      get: {
        summary: "Pattern relation index",
        operationId: "pattern_relations_json",
        responses: { "200": { description: "Reviewed downstream relations for canonical patterns" } },
      },
    };
  });

  patchJson("api/v1/mcp-server.json", (spec) => {
    spec.tools ||= [];
    if (!spec.tools.some((tool) => tool.name === "metkagram_get_pattern_relations")) {
      spec.tools.push({
        name: "metkagram_get_pattern_relations",
        title: "Get pattern relations",
        description: "Get reviewed contrasts, choice drills and reasoning packs connected to canonical Metkagram pattern IDs.",
        inputSchema: { type: "object", additionalProperties: false },
        staticUrl: `${API_URL}/pattern-relations.json`,
      });
      spec.tools.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  patchJson("data/catalog.json", (catalog) => {
    catalog.patternRelations = {
      dataset: `${SITE_URL}/data/pattern-relations.json`,
      api: `${API_URL}/pattern-relations.json`,
      patternCount: index.counts.patterns,
      relationTypes: ["contrast", "choice drill", "reasoning pack"],
    };
  });

  patchJson("api/v1/teaching-manifest.json", (manifest) => {
    manifest.interfaces ||= {};
    manifest.interfaces.pattern_relations = `${API_URL}/pattern-relations.json`;
    manifest.recommended_workflows ||= [];
    if (!manifest.recommended_workflows.some((workflow) => workflow.id === "continue_from_pattern_match")) {
      manifest.recommended_workflows.push({
        id: "continue_from_pattern_match",
        steps: ["Receive a Pattern Lens match", "Keep the canonical pattern ID", "Look up reviewed pattern relations", "Offer a contrast or choice drill when ambiguity matters", "Offer a Reasoning Pack when the learner needs a short route", "Return to canonical Practice for reuse"],
      });
    }
  });

  for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) {
    patchJson(relative, (value) => {
      const model = value.data && typeof value.data === "object" ? value.data : value;
      const lens = model.surfaces?.find((surface) => surface.id === "pattern-lens");
      if (!lens) return;
      lens.relationIndex = `${SITE_URL}/data/pattern-relations.json`;
      lens.jobs ||= [];
      if (!lens.jobs.includes("continue from a match to a reviewed contrast or reasoning route")) lens.jobs.push("continue from a match to a reviewed contrast or reasoning route");
    });
  }

  const llmsPath = path.join(DIST, "llms.txt");
  if (fs.existsSync(llmsPath)) {
    let text = fs.readFileSync(llmsPath, "utf8");
    if (!text.includes("## Pattern relation index")) {
      text += `\n## Pattern relation index\n- After a Pattern Lens match, keep the canonical pattern ID and inspect reviewed next steps: ${SITE_URL}/data/pattern-relations.json\n- Prefer a reviewed contrast or Choice Clinic drill when two nearby patterns are easy to confuse.\n- Prefer a Reasoning Pack when the learner needs a short sequence rather than one isolated pattern.\n- Do not infer an unlisted relationship merely because two formulas look similar.\n`;
      fs.writeFileSync(llmsPath, text);
    }
  }
}

const index = buildIndex();
patchMachineSurfaces(index);
injectLensAssets();
console.log(`Pattern Lens knowledge bridge: ${index.counts.patterns} linked patterns, ${index.counts.contrasts} contrasts, ${index.counts.drills} drills, ${index.counts.packs} packs.`);
