import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const contrasts = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "contrasts.json"), "utf8"));
const drills = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "choice-drills.json"), "utf8"));
const packs = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "reasoning-packs.json"), "utf8"));
const relations = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-relations.json"), "utf8"));
const patternIds = new Set(patterns.map((pattern) => pattern.id));
const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
const drillMap = new Map(drills.items.map((item) => [item.id, item]));

function packMembers(pack) {
  const ids = new Set();
  for (const step of pack.steps) {
    if (step.kind === "pattern") ids.add(step.id);
    if (step.kind === "contrast") for (const id of contrastMap.get(step.id).patterns) ids.add(id);
    if (step.kind === "drill") for (const id of drillMap.get(step.id).options) ids.add(id);
  }
  return ids;
}

test("pattern relation index is derived from reviewed canonical objects", () => {
  assert.equal(relations.schemaVersion, 1);
  assert.equal(relations.status, "derived-reviewed-relations");
  assert.ok(relations.counts.patterns >= 20);
  assert.equal(relations.counts.contrasts, contrasts.items.length);
  assert.equal(relations.counts.drills, drills.items.length);
  assert.equal(relations.counts.packs, packs.packs.length);

  for (const [patternId, record] of Object.entries(relations.byPattern)) {
    assert.ok(patternIds.has(patternId));
    assert.equal(record.pattern_id, patternId);
    for (const contrast of record.contrasts) assert.ok(contrastMap.get(contrast.id).patterns.includes(patternId));
    for (const drill of record.drills) assert.ok(drillMap.get(drill.id).options.includes(patternId));
  }
});

test("every reviewed contrast and drill is reachable from each source pattern", () => {
  for (const contrast of contrasts.items) {
    for (const patternId of contrast.patterns) {
      assert.ok(relations.byPattern[patternId].contrasts.some((item) => item.id === contrast.id));
    }
  }

  for (const drill of drills.items) {
    for (const patternId of drill.options) {
      const relation = relations.byPattern[patternId].drills.find((item) => item.id === drill.id);
      assert.ok(relation);
      assert.equal(relation.role, drill.answer_pattern === patternId ? "best-fit" : "nearby");
    }
  }
});

test("Reasoning Pack membership resolves transitively through contrast and drill steps", () => {
  for (const pack of packs.packs) {
    for (const patternId of packMembers(pack)) {
      assert.ok(relations.byPattern[patternId].packs.some((item) => item.id === pack.id), `${patternId} should resolve to ${pack.id}`);
    }
  }
});

test("Pattern Lens loads the relation bridge in both locales", () => {
  for (const locale of ["en", "ru"]) {
    const page = fs.readFileSync(path.join(DIST, locale, "lens", "index.html"), "utf8");
    assert.match(page, /\/assets\/lens-knowledge-bridge\.css/);
    assert.match(page, /\/assets\/lens-knowledge-bridge\.js/);
  }
  assert.ok(fs.existsSync(path.join(DIST, "assets", "lens-knowledge-bridge.js")));
  assert.ok(fs.existsSync(path.join(DIST, "assets", "lens-knowledge-bridge.css")));
});

test("relation index is exposed to API, MCP, teaching and discovery surfaces", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "pattern-relations.json"), "utf8"));
  assert.equal(api.data.counts.patterns, relations.counts.patterns);
  assert.equal(api.provenance.record_type, "pattern_relation_index");

  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "mcp-server.json"), "utf8"));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_pattern_relations"));

  const openapi = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "openapi.json"), "utf8"));
  assert.ok(openapi.paths["/pattern-relations.json"]);

  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.patternRelations.patternCount, relations.counts.patterns);

  const teaching = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "teaching-manifest.json"), "utf8"));
  assert.match(teaching.interfaces.pattern_relations, /pattern-relations\.json$/);
  assert.ok(teaching.recommended_workflows.some((workflow) => workflow.id === "continue_from_pattern_match"));

  const discovery = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery.json"), "utf8"));
  const lens = discovery.surfaces.find((surface) => surface.id === "pattern-lens");
  assert.match(lens.relationIndex, /pattern-relations\.json$/);
});
