import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const dataOf = (value) => value && typeof value === "object" && "data" in value ? value.data : value;

const cookbook = readJson("dist/data/agent-integration-recipes.json");
const byId = new Map(cookbook.recipes.map((recipe) => [recipe.id, recipe]));

test("agent integration cookbook publishes at least five exact provider-neutral recipes plus abstention", () => {
  assert.equal(cookbook.schemaVersion, 1);
  assert.equal(cookbook.status, "reviewed-reference");
  assert.equal(cookbook.recipes.length, 6);
  assert.equal(byId.get("abstain-on-missing-pattern").expected.behavior, "abstain");
  assert.match(cookbook.evidenceBoundary, /not evidence.*improves language learning/i);

  const api = readJson("dist/api/v1/agent-integration-recipes.json");
  assert.equal(dataOf(api).recipes.length, 6);
  assert.equal(api.provenance.record_type, "agent_integration_recipes");
});

test("canonical Pattern recipe resolves CLF051 with canonical provenance", () => {
  const recipe = byId.get("canonical-pattern-with-provenance");
  const envelope = readJson(`dist${recipe.entrypoint}`);
  assert.equal(dataOf(envelope).id, "CLF051");
  assert.ok(envelope.provenance?.canonical_url);
  assert.equal(cookbook.verifiedRefs.pattern.pattern_id, "CLF051");
  assert.equal(cookbook.verifiedRefs.pattern.canonical_url, envelope.provenance.canonical_url);
});

test("Contrast → Choice recipe resolves the reviewed pair and bounded answer", () => {
  const recipe = byId.get("contrast-then-choice");
  const contrasts = dataOf(readJson(`dist${recipe.entrypoint}`));
  const contrast = contrasts.items.find((item) => item.id === recipe.lookup.contrast_id);
  const drills = dataOf(readJson(`dist${recipe.followup_endpoint}`));
  const drill = drills.items.find((item) => item.id === recipe.lookup.drill_id);
  assert.deepEqual(contrast.patterns, ["CLF041", "CLF042"]);
  assert.equal(drill.contrast_id, contrast.id);
  assert.equal(drill.answer_pattern, "CLF041");
  assert.match(recipe.output_contract.join(" "), /not label the rejected option universally wrong/i);
});

test("Route and Bridge recipes preserve current reviewed identity and boundaries", () => {
  const routeRecipe = byId.get("follow-reviewed-route");
  const packs = dataOf(readJson(`dist${routeRecipe.entrypoint}`));
  const pack = packs.packs.find((item) => item.id === routeRecipe.lookup.pack_id);
  assert.equal(pack.id, "evidence-without-overclaiming");
  assert.deepEqual(pack.steps[0], {
    kind: "pattern",
    id: "CLF051",
    instruction_en: pack.steps[0].instruction_en,
    instruction_ru: pack.steps[0].instruction_ru,
  });

  const bridgeRecipe = byId.get("english-german-functional-bridge");
  const bridgeMap = dataOf(readJson(`dist${bridgeRecipe.entrypoint}`));
  const bridge = bridgeMap.items.find((item) => item.pattern_id === "CLF051");
  assert.equal(bridge.mapping_type, "same-canonical-pattern-functional-counterpart");
  assert.equal(bridge.literal_equivalence, false);
});

test("abstention fixture stays absent and never gains fabricated provenance", () => {
  const recipe = byId.get("abstain-on-missing-pattern");
  assert.equal(fs.existsSync(path.join(ROOT, `dist${recipe.entrypoint}`)), false);
  assert.deepEqual(cookbook.verifiedRefs.abstention, {
    requested_pattern_id: "METKAGRAM-DOES-NOT-EXIST",
    exists: false,
    behavior: "abstain",
  });
  assert.match(recipe.output_contract.join(" "), /do not invent a stable ID/i);
});

test("developer pages, API index, MCP and llms expose the verified cookbook", () => {
  for (const relative of [
    "dist/en/ai-cookbook/index.html",
    "dist/ru/ai-cookbook/index.html",
    "dist/en/build-with-metkagram/index.html",
    "dist/ru/build-with-metkagram/index.html",
  ]) {
    const html = read(relative);
    assert.match(html, /data-agent-integration-cookbook/);
    assert.match(html, /agent-integration-recipes\.json/);
    assert.match(html, /abstain instead of manufacturing a Metkagram ID/i);
  }

  const index = dataOf(readJson("dist/api/v1/index.json"));
  assert.ok(index.endpoints.some((item) => item.path === "/agent-integration-recipes.json"));
  const mcp = readJson("dist/api/v1/mcp-server.json");
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_agent_integration_recipes"));
  const openapi = readJson("dist/api/v1/openapi.json");
  assert.ok(openapi.paths["/agent-integration-recipes.json"]);
  assert.match(read("dist/llms.txt"), /## Agent integration cookbook/);
});
