import fs from "node:fs";
import path from "node:path";
import { ATTRIBUTION, wrapRecord } from "../src/provenance.mjs";
import { SITE_URL } from "../src/site.mjs";
import { projectSpokenPracticeHandoff } from "../src/spoken-practice-handoff.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;
const FIXTURES = path.join(ROOT, "data", "spoken-practice-handoff-fixtures.json");
const SCHEMA = path.join(ROOT, "data", "schemas", "spoken-practice-handoff.schema.json");
const CHOICES = path.join(ROOT, "data", "choice-drills.json");
const ROUTES = path.join(ROOT, "data", "reasoning-packs.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

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

function validateFixtureSource(source) {
  if (source?.schemaVersion !== 1 || source?.status !== "reviewed-reference") {
    throw new Error("Spoken-practice fixtures must use schemaVersion 1 and reviewed-reference status");
  }
  if (!Array.isArray(source.fixtures) || source.fixtures.length < 3) {
    throw new Error("Spoken-practice handoff requires at least Pattern, Choice and Route fixtures");
  }
  const ids = new Set();
  const types = new Set();
  for (const fixture of source.fixtures) {
    if (!fixture.id || ids.has(fixture.id)) throw new Error(`Duplicate or missing spoken-practice fixture id: ${fixture.id || "<missing>"}`);
    ids.add(fixture.id);
    types.add(fixture.source?.type);
  }
  for (const type of ["pattern", "choice", "route"]) {
    if (!types.has(type)) throw new Error(`Spoken-practice fixtures must include a ${type} projection`);
  }
}

function directChoiceRecord(choice) {
  const canonicalUrl = `${SITE_URL}/en/clinic/#${choice.id}`;
  return wrapRecord(choice, {
    canonical_url: canonicalUrl,
    record_type: "pattern_choice_drill",
    record_id: choice.id,
  });
}

function directRouteRecord(route) {
  const canonicalUrl = `${SITE_URL}/en/packs/${route.id}/`;
  return wrapRecord(route, {
    canonical_url: canonicalUrl,
    record_type: "reasoning_pack",
    record_id: route.id,
  });
}

const fixtureSource = readJson(FIXTURES);
const schema = readJson(SCHEMA);
const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));
const choiceSource = readJson(CHOICES);
const routeSource = readJson(ROUTES);

validateFixtureSource(fixtureSource);
if (schema?.$id !== `${API_URL}/schemas/spoken-practice-handoff.json`) throw new Error("Spoken-practice schema $id must resolve to the public static API contract");

const handoffs = fixtureSource.fixtures.map((fixture) => projectSpokenPracticeHandoff(fixture, {
  patterns,
  choices: choiceSource.items,
  routes: routeSource.packs,
}));

const publication = {
  schemaVersion: 1,
  status: "reviewed-reference",
  description: "Small immutable provider-neutral projections from canonical Metkagram language objects into productive spoken-practice tasks.",
  schema: `${API_URL}/schemas/spoken-practice-handoff.json`,
  canonicalPage: `${SITE_URL}/en/build-with-metkagram/`,
  handoffs,
  rights: {
    rights_status: ATTRIBUTION.rights_status,
    rights_url: ATTRIBUTION.rights_url,
    license_url: ATTRIBUTION.license_url,
    attribution_required: ATTRIBUTION.attribution_required,
    attribution_text: ATTRIBUTION.attribution_text,
  },
  consumerBoundary: "Metkagram supplies reviewed language structure and prompts; external rehearsal tools own recording, playback, speech evidence, feedback and local session state.",
};

writeJson("api/v1/schemas/spoken-practice-handoff.json", schema);
writeJson("data/spoken-practice-handoffs.json", publication);
writeJson("api/v1/spoken-practice-handoffs.json", wrapRecord(publication, {
  canonical_url: `${API_URL}/spoken-practice-handoffs.json`,
  record_type: "spoken_practice_handoff_collection",
  record_id: "metkagram-spoken-practice-handoffs",
}));

for (const choice of choiceSource.items) {
  writeJson(`api/v1/choices/${choice.id}.json`, directChoiceRecord(choice));
}
for (const route of routeSource.packs) {
  writeJson(`api/v1/routes/${route.id}.json`, directRouteRecord(route));
}

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.counts = { ...(root.counts || {}), spokenPracticeHandoffs: handoffs.length, directChoices: choiceSource.items.length, directRoutes: routeSource.packs.length };
  root.endpoints ||= [];
  const endpoints = [
    { path: "/spoken-practice-handoffs.json", url: `${API_URL}/spoken-practice-handoffs.json`, type: "collection", description: "Versioned provider-neutral spoken-practice handoff fixtures over canonical Metkagram objects" },
    { path: "/schemas/spoken-practice-handoff.json", url: `${API_URL}/schemas/spoken-practice-handoff.json`, type: "schema", description: "JSON Schema for immutable external spoken-practice handoffs" },
    { path: "/choices/{id}.json", url: `${API_URL}/choices/{id}.json`, type: "record-template", description: "Direct reviewed Choice retrieval by stable drill ID" },
    { path: "/routes/{id}.json", url: `${API_URL}/routes/{id}.json`, type: "record-template", description: "Direct reviewed Route retrieval by stable reasoning-pack ID" },
  ];
  for (const endpoint of endpoints) {
    if (!root.endpoints.some((item) => item.path === endpoint.path)) root.endpoints.push(endpoint);
  }
  root.datasets ||= [];
  if (!root.datasets.some((item) => item.id === "spoken-practice-handoffs")) {
    root.datasets.push({ id: "spoken-practice-handoffs", label: "Spoken practice handoff reference fixtures", count: handoffs.length, url: `${SITE_URL}/data/spoken-practice-handoffs.json` });
  }
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  const tools = [
    {
      name: "metkagram_get_choice",
      title: "Get one reviewed Choice drill",
      description: "Resolve a reviewed Pattern Choice Clinic drill by stable ID without scraping HTML.",
      inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } }, additionalProperties: false },
      staticUrlTemplate: `${API_URL}/choices/{id}.json`,
    },
    {
      name: "metkagram_get_route",
      title: "Get one reviewed reasoning Route",
      description: "Resolve a reviewed Reasoning Pack by stable ID while preserving the canonical ordered step references.",
      inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } }, additionalProperties: false },
      staticUrlTemplate: `${API_URL}/routes/{id}.json`,
    },
    {
      name: "metkagram_get_spoken_practice_handoffs",
      title: "Get spoken-practice handoff references",
      description: "Get bounded provider-neutral reference handoffs that preserve canonical Metkagram IDs, provenance and rights for external rehearsal tools.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${API_URL}/spoken-practice-handoffs.json`,
    },
  ];
  for (const tool of tools) {
    if (!spec.tools.some((item) => item.name === tool.name)) spec.tools.push(tool);
  }
  spec.tools.sort((a, b) => a.name.localeCompare(b.name));
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/spoken-practice-handoffs.json"] ||= { get: { summary: "Provider-neutral spoken-practice handoff references", operationId: "spoken_practice_handoffs_json", responses: { "200": { description: "Bounded immutable handoff projections with provenance and rights" } } } };
  spec.paths["/schemas/spoken-practice-handoff.json"] ||= { get: { summary: "Spoken-practice handoff JSON Schema", operationId: "spoken_practice_handoff_schema_json", responses: { "200": { description: "JSON Schema for the Metkagram spoken-practice handoff contract" } } } };
  spec.paths["/choices/{id}.json"] ||= { get: { summary: "Resolve one reviewed Choice drill", operationId: "choice_by_id_json", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Reviewed Pattern Choice Clinic drill with provenance" } } } };
  spec.paths["/routes/{id}.json"] ||= { get: { summary: "Resolve one reviewed reasoning Route", operationId: "route_by_id_json", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Reviewed Reasoning Pack with provenance" } } } };
});

patchJson("data/catalog.json", (catalog) => {
  catalog.spokenPracticeHandoff = {
    status: "reference-contract",
    count: handoffs.length,
    schema: `${API_URL}/schemas/spoken-practice-handoff.json`,
    dataset: `${SITE_URL}/data/spoken-practice-handoffs.json`,
    api: `${API_URL}/spoken-practice-handoffs.json`,
    principle: "Project one user-requested practice task from canonical IDs; do not mirror the Metkagram corpus or infer speech metrics.",
  };
});

patch("llms.txt", (text) => text.includes("## Spoken-practice handoff") ? text : `${text}\n## Spoken-practice handoff\n- Contract: ${API_URL}/schemas/spoken-practice-handoff.json\n- Reference fixtures: ${API_URL}/spoken-practice-handoffs.json\n- Direct Choice lookup: ${API_URL}/choices/{id}.json\n- Direct Route lookup: ${API_URL}/routes/{id}.json\n- Use a handoff as one immutable user-requested practice snapshot. Keep canonical IDs, URLs, provenance and rights; do not mirror the corpus.\n- Metkagram supplies language structure and prompts only. Recording, playback and speech evaluation belong to the external rehearsal tool.\n`);

console.log(`Spoken-practice handoff published: ${handoffs.length} reference projections, ${choiceSource.items.length} direct Choices, ${routeSource.packs.length} direct Routes.`);
