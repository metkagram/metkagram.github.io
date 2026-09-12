import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ATTRIBUTION } from "../src/provenance.mjs";
import { projectSpokenPracticeHandoff, SPOKEN_PRACTICE_CONSUMER_BOUNDARY } from "../src/spoken-practice-handoff.mjs";

const ROOT = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

function dataOf(value) {
  return value && typeof value === "object" && "data" in value ? value.data : value;
}

function fieldNames(value, names = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => fieldNames(item, names));
    return names;
  }
  if (!value || typeof value !== "object") return names;
  for (const [key, child] of Object.entries(value)) {
    names.push(key);
    fieldNames(child, names);
  }
  return names;
}

const fixtures = readJson("data/spoken-practice-handoff-fixtures.json");
const sourceSchema = readJson("data/schemas/spoken-practice-handoff.schema.json");
const patterns = readJson("dist/data/advanced-patterns.json");
const choices = readJson("data/choice-drills.json");
const routes = readJson("data/reasoning-packs.json");
const publishedEnvelope = readJson("dist/api/v1/spoken-practice-handoffs.json");
const published = dataOf(publishedEnvelope);

test("spoken-practice schema and fixtures cover the bounded M0/M1 contract", () => {
  assert.equal(sourceSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(sourceSchema.$id, "https://metkagram.github.io/api/v1/schemas/spoken-practice-handoff.json");
  assert.equal(sourceSchema.properties.practice_projection.properties.consumer_boundary.const, SPOKEN_PRACTICE_CONSUMER_BOUNDARY);
  assert.equal(fixtures.schemaVersion, 1);
  assert.equal(fixtures.status, "reviewed-reference");
  assert.deepEqual(new Set(fixtures.fixtures.map((fixture) => fixture.source.type)), new Set(["pattern", "choice", "route"]));
  assert.equal(fixtures.fixtures.length, 3);
});

test("generated handoffs preserve canonical identity, provenance, language dimensions and rights", () => {
  assert.equal(published.schemaVersion, 1);
  assert.equal(published.status, "reviewed-reference");
  assert.equal(published.handoffs.length, 3);

  for (const handoff of published.handoffs) {
    assert.equal(handoff.schema_version, "1.0.0");
    assert.match(handoff.handoff_id, /^metkagram:spoken-practice:v1:/);
    assert.equal(handoff.provider_id, "provider-neutral-reference");
    assert.ok(handoff.source_object.id);
    assert.match(handoff.source_object.canonical_url, /^https:\/\/metkagram\.github\.io\//);
    assert.match(handoff.source_object.api_url, /^https:\/\/metkagram\.github\.io\/api\/v1\//);
    assert.match(handoff.source_object.content_hash, /^[a-f0-9]{64}$/);
    assert.equal(handoff.source_provenance.canonical_url, handoff.source_object.canonical_url);
    assert.equal(handoff.source_provenance.content_hash, handoff.source_object.content_hash);
    assert.equal(handoff.source_provenance.dataset_version, handoff.dataset_version);
    assert.equal(handoff.source_provenance.release_date, handoff.release_date);
    assert.equal(handoff.rights.rights_url, ATTRIBUTION.rights_url);
    assert.equal(handoff.rights.license_url, ATTRIBUTION.license_url);
    assert.equal(handoff.rights.attribution_required, true);
    assert.equal(handoff.rights.cache_scope, "authorized-user-requested-immutable-snapshot-only");
    assert.equal(handoff.language_context.practice_language, "en");
    assert.equal(handoff.language_context.interface_locale, "en");
    assert.equal(handoff.language_context.support_translation_locale, "ru");
    assert.equal(handoff.language_context.bridge_language, null);
    assert.equal(handoff.practice_projection.consumer_boundary, SPOKEN_PRACTICE_CONSUMER_BOUNDARY);
  }
});

test("Route handoff keeps ordered canonical references without copying Route instructions", () => {
  const sourceRoute = routes.packs.find((route) => route.id === "reframe-with-precision");
  const handoff = published.handoffs.find((item) => item.source_object.type === "route");
  assert.ok(sourceRoute);
  assert.ok(handoff);
  assert.deepEqual(handoff.semantic_context.route_steps, sourceRoute.steps.map((step) => ({ kind: step.kind, id: step.id })));
  for (const step of handoff.semantic_context.route_steps) assert.deepEqual(Object.keys(step).sort(), ["id", "kind"]);
  assert.equal(JSON.stringify(handoff).includes("instruction_en"), false);
  assert.equal(JSON.stringify(handoff).includes("instruction_ru"), false);
});

test("machine-readable handoff stays speech-agnostic and corpus-thin", () => {
  const forbidden = /^(?:audio|asr|transcript|pronunciation|prosody|acoustic|phoneme|speech_score|delivery_score|fluency_score)$/i;
  const corpusCopies = new Set(["formula", "example", "examples", "translation", "instruction_en", "instruction_ru"]);
  for (const name of fieldNames(published.handoffs)) {
    assert.equal(forbidden.test(name), false, `speech-analysis field leaked into handoff: ${name}`);
    assert.equal(corpusCopies.has(name), false, `canonical corpus content leaked into handoff: ${name}`);
  }
  assert.equal(JSON.stringify(published.handoffs).toLowerCase().includes("ptichi"), false);
});

test("direct Choice and Route APIs and MCP tools remove the need for HTML scraping", () => {
  const choiceId = "benchmark-suggests-not-proves";
  const routeId = "reframe-with-precision";
  const choice = readJson(`dist/api/v1/choices/${choiceId}.json`);
  const route = readJson(`dist/api/v1/routes/${routeId}.json`);
  assert.equal(dataOf(choice).id, choiceId);
  assert.equal(dataOf(route).id, routeId);
  assert.equal(choice.provenance.record_type, "pattern_choice_drill");
  assert.equal(route.provenance.record_type, "reasoning_pack");

  const mcp = readJson("dist/api/v1/mcp-server.json");
  const toolNames = new Set((mcp.tools || []).map((tool) => tool.name));
  for (const name of ["metkagram_get_choice", "metkagram_get_route", "metkagram_get_spoken_practice_handoffs"]) assert.ok(toolNames.has(name), `${name} missing from MCP spec`);

  const openapi = readJson("dist/api/v1/openapi.json");
  for (const endpoint of ["/spoken-practice-handoffs.json", "/schemas/spoken-practice-handoff.json", "/choices/{id}.json", "/routes/{id}.json"]) assert.ok(openapi.paths?.[endpoint], `${endpoint} missing from OpenAPI`);
});

test("unsupported object or practice language abstains explicitly", () => {
  const base = fixtures.fixtures.find((fixture) => fixture.source.type === "pattern");
  assert.ok(base);

  assert.throws(() => projectSpokenPracticeHandoff({
    ...base,
    id: "unsupported-french-language",
    language_context: { ...base.language_context, practice_language: "fr" },
  }, { patterns, choices: choices.items, routes: routes.packs }), /abstained.*no reviewed fr learning record/i);

  assert.throws(() => projectSpokenPracticeHandoff({
    ...base,
    id: "missing-pattern-object",
    source: { type: "pattern", id: "DOES-NOT-EXIST" },
  }, { patterns, choices: choices.items, routes: routes.packs }), /abstained.*does not resolve/i);
});
