import fs from "node:fs";
import path from "node:path";
import { ATTRIBUTION, wrapRecord } from "../src/provenance.mjs";
import { escapeHtml, SITE_URL } from "../src/render.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API = `${SITE_URL}/api/v1`;
const SOURCE = path.join(ROOT, "data", "agent-integration-recipes.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeFile(relative, contents) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function writeJson(relative, value) {
  writeFile(relative, `${JSON.stringify(value, null, 2)}\n`);
}

function patch(relative, mutate) {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  const after = mutate(before);
  if (after !== before) fs.writeFileSync(file, after);
}

function patchJson(relative, mutate) {
  patch(relative, (text) => {
    const value = JSON.parse(text);
    mutate(value);
    return `${JSON.stringify(value, null, 2)}\n`;
  });
}

function apiFile(endpoint) {
  if (!endpoint.startsWith("/api/v1/")) throw new Error(`Integration recipe endpoint must stay under /api/v1/: ${endpoint}`);
  return path.join(DIST, endpoint.slice(1));
}

function apiRecord(endpoint) {
  const file = apiFile(endpoint);
  if (!fs.existsSync(file)) throw new Error(`Integration recipe references missing endpoint ${endpoint}`);
  return readJson(file);
}

function dataOf(value) {
  return value && typeof value === "object" && "data" in value ? value.data : value;
}

function provenanceOf(value) {
  return value && typeof value === "object" ? value.provenance || null : null;
}

function itemBy(items, key, value, recipeId) {
  const item = (items || []).find((candidate) => candidate?.[key] === value);
  if (!item) throw new Error(`${recipeId} cannot resolve ${key}=${value}`);
  return item;
}

function validatePositiveRecipes(source) {
  const byId = new Map(source.recipes.map((recipe) => [recipe.id, recipe]));

  const discoveryRecipe = byId.get("intent-to-reviewed-surface");
  const discoveryEnvelope = apiRecord(discoveryRecipe.entrypoint);
  const discovery = dataOf(discoveryEnvelope);
  const surface = itemBy(discovery.surfaces, "id", discoveryRecipe.lookup.surface_id, discoveryRecipe.id);
  if (surface.id !== discoveryRecipe.expected.surface_id) throw new Error(`${discoveryRecipe.id} surface mismatch`);
  if (!fs.existsSync(apiFile(discoveryRecipe.expected.next_endpoint))) throw new Error(`${discoveryRecipe.id} next endpoint is missing`);

  const patternRecipe = byId.get("canonical-pattern-with-provenance");
  const patternEnvelope = apiRecord(patternRecipe.entrypoint);
  const pattern = dataOf(patternEnvelope);
  if (pattern.id !== patternRecipe.expected.pattern_id) throw new Error(`${patternRecipe.id} pattern mismatch`);
  if (!provenanceOf(patternEnvelope)) throw new Error(`${patternRecipe.id} must resolve record provenance`);
  if (!provenanceOf(patternEnvelope).canonical_url) throw new Error(`${patternRecipe.id} provenance must retain canonical_url`);

  const contrastRecipe = byId.get("contrast-then-choice");
  const contrasts = dataOf(apiRecord(contrastRecipe.entrypoint));
  const contrast = itemBy(contrasts.items, "id", contrastRecipe.lookup.contrast_id, contrastRecipe.id);
  if (JSON.stringify(contrast.patterns) !== JSON.stringify(contrastRecipe.expected.contrast_patterns)) throw new Error(`${contrastRecipe.id} contrast Pattern refs drifted`);
  const drills = dataOf(apiRecord(contrastRecipe.followup_endpoint));
  const drill = itemBy(drills.items, "id", contrastRecipe.lookup.drill_id, contrastRecipe.id);
  if (drill.contrast_id !== contrast.id || drill.answer_pattern !== contrastRecipe.expected.answer_pattern) throw new Error(`${contrastRecipe.id} drill contract drifted`);

  const routeRecipe = byId.get("follow-reviewed-route");
  const packs = dataOf(apiRecord(routeRecipe.entrypoint));
  const pack = itemBy(packs.packs, "id", routeRecipe.lookup.pack_id, routeRecipe.id);
  if (pack.id !== routeRecipe.expected.pack_id) throw new Error(`${routeRecipe.id} pack mismatch`);
  if (pack.steps?.[0]?.kind !== routeRecipe.expected.first_step_kind || pack.steps?.[0]?.id !== routeRecipe.expected.first_step_id) throw new Error(`${routeRecipe.id} ordered Route contract drifted`);

  const bridgeRecipe = byId.get("english-german-functional-bridge");
  const map = dataOf(apiRecord(bridgeRecipe.entrypoint));
  const bridge = itemBy(map.items, "pattern_id", bridgeRecipe.lookup.pattern_id, bridgeRecipe.id);
  if (bridge.mapping_type !== bridgeRecipe.expected.mapping_type || bridge.literal_equivalence !== false) throw new Error(`${bridgeRecipe.id} bridge boundary drifted`);

  const abstentionRecipe = byId.get("abstain-on-missing-pattern");
  if (fs.existsSync(apiFile(abstentionRecipe.entrypoint))) throw new Error(`${abstentionRecipe.id} negative fixture unexpectedly resolves to a public Pattern`);
  if (abstentionRecipe.expected.behavior !== "abstain" || abstentionRecipe.expected.exists !== false) throw new Error(`${abstentionRecipe.id} must require explicit abstention`);

  return {
    discovery: { surface_id: surface.id, next_endpoint: discoveryRecipe.expected.next_endpoint },
    pattern: { pattern_id: pattern.id, canonical_url: provenanceOf(patternEnvelope).canonical_url },
    contrast: { contrast_id: contrast.id, pattern_ids: contrast.patterns, drill_id: drill.id, answer_pattern: drill.answer_pattern },
    route: { pack_id: pack.id, first_step: pack.steps[0] },
    bridge: { pattern_id: bridge.pattern_id, mapping_type: bridge.mapping_type, literal_equivalence: bridge.literal_equivalence },
    abstention: { requested_pattern_id: abstentionRecipe.lookup.pattern_id, exists: false, behavior: "abstain" },
  };
}

function validateSource(source) {
  if (source?.schemaVersion !== 1 || source.status !== "reviewed-reference") throw new Error("Agent integration cookbook must use reviewed-reference schemaVersion 1");
  if (!Array.isArray(source.recipes) || source.recipes.length < 5) throw new Error("Agent integration cookbook requires at least five end-to-end recipes");
  const ids = new Set();
  for (const recipe of source.recipes) {
    if (!recipe.id || ids.has(recipe.id)) throw new Error(`Duplicate or missing agent integration recipe id: ${recipe.id || "<missing>"}`);
    ids.add(recipe.id);
    if (!recipe.job || !recipe.entrypoint || !Array.isArray(recipe.output_contract) || !recipe.output_contract.length) throw new Error(`${recipe.id} is incomplete`);
  }
  if (!ids.has("abstain-on-missing-pattern")) throw new Error("Agent integration cookbook requires an explicit abstention recipe");
}

function recipeCards(source) {
  return source.recipes.map((recipe, index) => `<article class="pattern-reader"><p class="eyebrow">${String(index + 1).padStart(2, "0")} · integration recipe</p><h2>${escapeHtml(recipe.job)}</h2><p><code>${escapeHtml(recipe.entrypoint)}</code>${recipe.followup_endpoint ? ` → <code>${escapeHtml(recipe.followup_endpoint)}</code>` : ""}</p><p><strong>Lookup:</strong> <code>${escapeHtml(JSON.stringify(recipe.lookup))}</code></p><ul>${recipe.output_contract.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul></article>`).join("");
}

function patchCookbookPages(source) {
  const section = `<section class="section-pad ruled" data-agent-integration-cookbook><p class="eyebrow">Developer integration cookbook</p><h2>Resolve reviewed objects, then keep their identity.</h2><p>These examples name current public records and are verified during every production build. If a reviewed object cannot be resolved, abstain instead of manufacturing a Metkagram ID.</p><div class="pattern-comparison-list">${recipeCards(source)}</div><div class="legal-inline-links"><a href="/api/v1/agent-integration-recipes.json">Machine-readable recipes →</a><a href="/en/mcp/">MCP reference →</a></div></section>`;
  for (const locale of ["en", "ru"]) {
    for (const slug of ["ai-cookbook", "build-with-metkagram"]) {
      patch(`${locale}/${slug}/index.html`, (html) => html.includes("data-agent-integration-cookbook") ? html : html.replace("</main>", `${section}</main>`));
    }
  }
}

const source = readJson(SOURCE);
validateSource(source);
const verifiedRefs = validatePositiveRecipes(source);
const publication = {
  ...source,
  verifiedRefs,
  rights: ATTRIBUTION,
  canonicalPage: `${SITE_URL}/en/build-with-metkagram/`,
};

writeJson("data/agent-integration-recipes.json", publication);
writeJson("api/v1/agent-integration-recipes.json", wrapRecord(publication, {
  canonical_url: `${API}/agent-integration-recipes.json`,
  record_type: "agent_integration_recipes",
  record_id: "metkagram-agent-integration-cookbook",
}));
patchCookbookPages(source);

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.endpoints ||= [];
  if (!root.endpoints.some((item) => item.path === "/agent-integration-recipes.json")) root.endpoints.push({ path: "/agent-integration-recipes.json", url: `${API}/agent-integration-recipes.json`, type: "index", description: "Verified provider-neutral integration recipes over current canonical Metkagram objects" });
});
patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_agent_integration_recipes")) spec.tools.push({ name: "metkagram_get_agent_integration_recipes", title: "Get verified integration recipes", description: "Get provider-neutral end-to-end recipes that preserve canonical Metkagram IDs, provenance and abstention boundaries.", inputSchema: { type: "object", additionalProperties: false }, staticUrl: `${API}/agent-integration-recipes.json` });
  spec.tools.sort((a, b) => a.name.localeCompare(b.name));
});
patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/agent-integration-recipes.json"] ||= { get: { summary: "Verified agent integration recipes", operationId: "agent_integration_recipes_json", responses: { "200": { description: "Current provider-neutral recipes over canonical Metkagram objects" } } } };
});

patch("llms.txt", (text) => text.includes("## Agent integration cookbook") ? text : `${text}\n## Agent integration cookbook\n- Verified recipes: ${API}/agent-integration-recipes.json\n- Developer page: ${SITE_URL}/en/build-with-metkagram/\n- Resolve stable public objects before generating explanations. Preserve IDs, canonical URLs and provenance.\n- If an exact reviewed object does not resolve, abstain; do not invent a Metkagram ID.\n`);

console.log(`Agent integration cookbook published: ${source.recipes.length} verified recipes.`);
