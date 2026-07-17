import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ATTRIBUTION } from "../src/provenance.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API = path.join(DIST, "api", "v1");

function readJson(...segments) {
  return JSON.parse(fs.readFileSync(path.join(...segments), "utf8"));
}

const REQUIRED_PROVENANCE_FIELDS = [
  "source",
  "source_url",
  "creator",
  "creator_url",
  "license",
  "attribution_required",
  "attribution_text",
  "dataset_version",
  "release_date",
  "canonical_url",
];

function assertProvenance(record, context) {
  assert.ok(record.provenance, `missing provenance ${context}`);
  for (const field of REQUIRED_PROVENANCE_FIELDS) {
    assert.ok(field in record.provenance, `missing provenance.${field} ${context}`);
  }
  assert.strictEqual(record.provenance.attribution_required, true);
  assert.ok(record.provenance.canonical_url, `missing canonical_url ${context}`);
  assert.ok(record.provenance.content_hash, `missing content_hash ${context}`);
}

test("API index declares stable v1 endpoints and provenance", () => {
  const index = readJson(API, "index.json");
  assert.strictEqual(index.api_version, "v1");
  assert.ok(index.api_base_url.endsWith("/api/v1"));
  assert.ok(Array.isArray(index.endpoints));
  assert.ok(index.endpoints.some((endpoint) => endpoint.path === "/patterns.json"));
  assert.ok(index.endpoints.some((endpoint) => endpoint.path === "/openapi.json"));
  assert.ok(index.datasets.some((dataset) => dataset.id === "advanced-patterns"));
  for (const field of REQUIRED_PROVENANCE_FIELDS) {
    assert.ok(field in index, `missing ${field} in API index`);
  }
});

test("attribution policy is machine-readable and requires attribution", () => {
  const policy = readJson(API, "attribution.json");
  assertProvenance(policy, "in attribution.json");
  assert.strictEqual(policy.provenance.contact_url, "https://www.linkedin.com/company/metalhatscats");
  assert.strictEqual(policy.provenance.attribution_required, true);
  assert.strictEqual(policy.data.attribution_required, true);
  assert.ok(Array.isArray(policy.data.policy.requirements));
  assert.ok(policy.data.policy.requirements.length > 0);
  assert.ok(policy.data.policy.citation_formats.web);
  assert.ok(policy.data.policy.citation_formats.academic);
  assert.ok(policy.data.policy.citation_formats.ai_answer);
  assert.ok(policy.data.policy.citation_formats.application);
});

test("every pattern record has provenance and canonical URL", () => {
  const patterns = readJson(API, "patterns.json");
  assertProvenance(patterns, "in patterns.json");
  assert.ok(Array.isArray(patterns.data));
  assert.ok(patterns.data.length >= 1000, `expected at least 1000 patterns, got ${patterns.data.length}`);
  for (const item of patterns.data) {
    assertProvenance(item, `for pattern ${item.data?.id}`);
    assert.ok(item.data.id);
    assert.ok(item.data.title_ru);
    assert.ok(item.data.langs.length > 0);
  }
});

test("paginated pattern summaries include provenance and pagination", () => {
  const page = readJson(API, "patterns", "index.json");
  assertProvenance(page, "in patterns/index.json");
  assert.ok(page.pagination);
  assert.strictEqual(typeof page.pagination.total, "number");
  assert.ok(page.pagination.total >= 1000);
  assert.ok(page.pagination.first);
  assert.ok(page.pagination.last);
});

test("individual pattern endpoint contains a canonical URL", () => {
  const patterns = readJson(API, "patterns.json");
  const first = patterns.data[0].data;
  const record = readJson(API, "patterns", `${first.id.toLowerCase()}.json`);
  assertProvenance(record, `for pattern ${first.id}`);
  assert.ok(record.provenance.canonical_url.includes(`/practice/${first.id.toLowerCase()}/`));
});

test("study sets expose canonical URLs and pattern counts", () => {
  const sets = readJson(API, "sets.json");
  assertProvenance(sets, "in sets.json");
  assert.ok(Array.isArray(sets.data));
  assert.ok(sets.data.length > 0);
  for (const set of sets.data) {
    assert.ok(set.canonical_url, `missing canonical_url for set ${set.id}`);
    assert.ok(set.api_url, `missing api_url for set ${set.id}`);
    assert.strictEqual(typeof set.pattern_count, "number");
  }
});

test("single set endpoint includes patterns and provenance", () => {
  const sets = readJson(API, "sets.json");
  const first = sets.data[0];
  const record = readJson(API, "sets", `${first.id.toLowerCase()}.json`);
  assertProvenance(record, `for set ${first.id}`);
  assert.ok(record.data.patterns);
  assert.strictEqual(record.data.pattern_count, record.data.patterns.length);
});

test("annotations endpoints include provenance for collections and documents", () => {
  const collection = readJson(API, "annotations", "en", "dialogues.json");
  assertProvenance(collection, "in annotations/en/dialogues.json");
  assert.ok(Array.isArray(collection.data));
  assert.ok(collection.data.length > 0);
  const first = collection.data[0];
  assert.ok(first.canonical_url);
  assert.ok(first.api_url);
  const doc = readJson(API, "annotations", "en", "dialogues", `${first.id}.json`);
  assertProvenance(doc, `for document ${first.id}`);
  assert.ok(doc.provenance.canonical_url.includes(`/explore/`));
});

test("language subsets are generated for English and German", () => {
  for (const lang of ["en", "de"]) {
    const subset = readJson(API, "subsets", "language", `${lang}.json`);
    assertProvenance(subset, `in subsets/language/${lang}.json`);
    assert.ok(subset.data.length > 0);
    assert.ok(subset.data.every((item) => item.language === lang));
  }
});

test("search index, categories and languages endpoints are generated", () => {
  const search = readJson(API, "search-index.json");
  assertProvenance(search, "in search-index.json");
  assert.ok(Array.isArray(search.data.patterns));
  assert.ok(Array.isArray(search.data.sets));
  assert.ok(Array.isArray(search.data.categories));

  const categories = readJson(API, "categories.json");
  assertProvenance(categories, "in categories.json");
  assert.ok(categories.data.length > 0);

  const languages = readJson(API, "languages.json");
  assertProvenance(languages, "in languages.json");
  assert.ok(languages.data.some((lang) => lang.code === "en"));
  assert.ok(languages.data.some((lang) => lang.code === "de"));
});

test("schemas and OpenAPI are generated with required fields", () => {
  const openapi = readJson(API, "openapi.json");
  assert.strictEqual(openapi.openapi, "3.0.3");
  assert.ok(openapi.info);
  assert.ok(openapi.paths);
  assert.ok(openapi.components.schemas.Pattern);
  assert.ok(openapi.components.schemas.Provenance);

  const provenanceSchema = readJson(API, "schemas", "provenance.json");
  assert.ok(provenanceSchema.required.includes("source"));
  assert.ok(provenanceSchema.required.includes("canonical_url"));

  for (const name of ["pattern.json", "set.json", "document.json", "api-response.json"]) {
    assert.ok(fs.existsSync(path.join(API, "schemas", name)), `missing schema ${name}`);
  }
});

test("MCP server specification maps tools to static URLs", () => {
  const mcp = readJson(API, "mcp-server.json");
  assert.ok(Array.isArray(mcp.tools));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_pattern"));
  assert.ok(mcp.tools.every((tool) => tool.staticUrl || tool.staticUrlTemplate));
  assert.ok(mcp.attribution);
  assert.strictEqual(mcp.attribution.source, ATTRIBUTION.source);
});

test("downloadable full datasets exist and contain provenance", () => {
  const patternsDownload = readJson(API, "download", "full-patterns.json");
  assertProvenance(patternsDownload, "in download/full-patterns.json");
  assert.ok(Array.isArray(patternsDownload.data));
  assert.ok(fs.existsSync(path.join(API, "download", "annotations-en-dialogues.json")));
});

test("llms.txt, robots.txt and sitemap expose the right surfaces", () => {
  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.ok(llms.includes("/api/v1/index.json"));
  assert.ok(llms.includes("/connectors/metkagram-mcp.mjs"));
  assert.ok(llms.includes("Attribution"));
  assert.ok(llms.includes("Source: Metkagram"));
  assert.ok(llms.includes('attribution."'));

  const robots = fs.readFileSync(path.join(DIST, "robots.txt"), "utf8");
  assert.ok(robots.includes("Allow: /api/v1/"));
  assert.ok(robots.includes("Sitemap:"));
  for (const agent of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended"]) {
    assert.ok(robots.includes(`User-agent: ${agent}`));
  }

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.ok(!sitemap.includes("/api/v1/"));
  assert.ok(sitemap.includes("/en/ai/"));
  assert.ok(sitemap.includes("/ru/ai/"));
});

test("AI documentation pages include structured data and API links", () => {
  for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(path.join(DIST, locale, "ai", "index.html"), "utf8");
    assert.ok(html.includes("/api/v1/index.json"));
    assert.ok(html.includes("Dataset"));
    assert.ok(html.includes("Source: Metkagram"));
    assert.ok(html.includes("/connectors/metkagram-mcp.mjs"));
    assert.ok(html.includes("OpenClaw"));
    assert.ok(html.includes("Hermes"));
  }
  const connector = fs.readFileSync(path.join(DIST, "connectors", "metkagram-mcp.mjs"), "utf8");
  assert.match(connector, /tools\/list/);
  assert.match(connector, /tools\/call/);
  assert.match(connector, /metkagram\.github\.io\/api\/v1/);
});

test("homepage and footer link to the AI & Developers page", () => {
  for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(path.join(DIST, locale, "index.html"), "utf8");
    assert.ok(html.includes(`/${locale}/ai/`), `missing /${locale}/ai/ link on homepage`);
  }
});
