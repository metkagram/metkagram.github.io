import assert from "node:assert/strict";
import test from "node:test";
import { createRemoteMcpHandler, MODERN_VERSION, TOOLS } from "../remote-mcp/core.mjs";

const ORIGIN = "https://example.test";

function response(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function mockFetch(url) {
  const path = new URL(url).pathname;
  const fixtures = {
    "/api/v1/index.json": { dataset_version: "1.2.3+abc123abc123", release_date: "2026-08-19", canonical_url: `${ORIGIN}/api/v1/index.json` },
    "/api/v1/discovery.json": { data: { surfaces: [{ id: "practice" }] }, provenance: { source: "Metkagram" } },
    "/api/v1/ai-recipes.json": { data: { recipes: [{ id: "intent" }] }, provenance: { source: "Metkagram" } },
    "/api/v1/patterns/xprtest001.json": { data: { id: "XPRTEST001" }, provenance: { source: "Metkagram", canonical_url: `${ORIGIN}/en/practice/xprtest001/` } },
    "/api/v1/sets/arg.json": { data: { id: "ARG", patterns: [{ id: "XPRTEST001" }] }, provenance: { source: "Metkagram" } },
    "/api/v1/contrasts.json": { data: { items: [{ id: "contrast-test", patterns: ["XPRTEST001", "XPRTEST002"] }] }, provenance: { source: "Metkagram", dataset_version: "1.2.3+abc123abc123" } },
    "/data/intents.json": {
      version: "1.2.3+abc123abc123",
      items: [
        { id: "disagree-politely", reasoning_move: "QUALIFY", title_en: "Disagree politely", title_ru: "Вежливо не согласиться", description_en: "Challenge a claim without sounding abrupt", queries_en: ["disagree politely", "push back politely"], queries_ru: [], signals_en: ["not sure I agree"], signals_ru: [], pattern_ids: ["XPRTEST001"], routes: { en: `${ORIGIN}/en/practice/intents/#intent-disagree-politely` } },
        { id: "draw-a-conclusion", reasoning_move: "CONCLUDE", title_en: "Draw a conclusion", title_ru: "Сделать вывод", description_en: "Move from evidence to a conclusion", queries_en: ["draw a conclusion"], queries_ru: [], signals_en: [], signals_ru: [], pattern_ids: ["XPRTEST002"], routes: {} },
      ],
    },
  };
  return Promise.resolve(path in fixtures ? response(fixtures[path]) : response({ error: "not found" }, 404));
}

function modernRequest(method, params = {}, id = 1, headers = {}) {
  const body = {
    jsonrpc: "2.0",
    id,
    method,
    params: {
      ...params,
      _meta: {
        ...(params._meta || {}),
        "io.modelcontextprotocol/protocolVersion": MODERN_VERSION,
        "io.modelcontextprotocol/clientInfo": { name: "test", version: "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {},
      },
    },
  };
  return new Request("https://mcp.example.test/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": MODERN_VERSION,
      "mcp-method": method,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function body(responseValue) {
  return responseValue.json();
}

test("server/discover implements the 2026-07-28 stateless discovery contract", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const res = await handle(modernRequest("server/discover"));
  assert.equal(res.status, 200);
  const json = await body(res);
  assert.equal(json.result.resultType, "complete");
  assert.deepEqual(json.result.supportedVersions, [MODERN_VERSION]);
  assert.deepEqual(json.result.capabilities, { tools: {} });
  assert.equal(json.result.cacheScope, "public");
  assert.equal(json.result._meta["io.modelcontextprotocol/serverInfo"].name, "metkagram-remote-mcp");
});

test("modern HTTP rejects missing or mismatched routing headers", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const request = modernRequest("tools/list");
  request.headers.delete("mcp-method");
  const res = await handle(request);
  const json = await body(res);
  assert.equal(res.status, 400);
  assert.equal(json.error.code, -32020);
});

test("tools/list is deterministic and cacheable", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const res = await handle(modernRequest("tools/list"));
  const json = await body(res);
  assert.deepEqual(json.result.tools.map((tool) => tool.name), [...TOOLS].map((tool) => tool.name).sort());
  assert.equal(json.result.ttlMs, 3_600_000);
  assert.equal(json.result.cacheScope, "public");
});

test("pattern tool preserves the canonical upstream record", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const res = await handle(modernRequest("tools/call", { name: "metkagram_get_pattern", arguments: { id: "XPRTEST001" } }, 2, { "mcp-name": "metkagram_get_pattern" }));
  const json = await body(res);
  assert.equal(json.result.isError, false);
  assert.equal(json.result.structuredContent.data.id, "XPRTEST001");
  assert.match(json.result.structuredContent.provenance.canonical_url, /xprtest001/);
});

test("intent search returns reviewed IDs and abstains on unsupported goals", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const matched = await handle(modernRequest("tools/call", { name: "metkagram_search_by_intent", arguments: { query: "I want to disagree politely", limit: 2 } }, 3, { "mcp-name": "metkagram_search_by_intent" }));
  const matchedJson = await body(matched);
  assert.equal(matchedJson.result.structuredContent.matched, true);
  assert.equal(matchedJson.result.structuredContent.items[0].id, "disagree-politely");
  assert.deepEqual(matchedJson.result.structuredContent.items[0].pattern_ids, ["XPRTEST001"]);

  const missed = await handle(modernRequest("tools/call", { name: "metkagram_search_by_intent", arguments: { query: "quantum submarine banana" } }, 4, { "mcp-name": "metkagram_search_by_intent" }));
  const missedJson = await body(missed);
  assert.equal(missedJson.result.structuredContent.matched, false);
  assert.deepEqual(missedJson.result.structuredContent.items, []);
  assert.match(missedJson.result.structuredContent.note, /Do not invent/);
});

test("contrast lookup returns a canonical page and explicit no-match response", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const found = await handle(modernRequest("tools/call", { name: "metkagram_get_contrast", arguments: { id: "contrast-test" } }, 5, { "mcp-name": "metkagram_get_contrast" }));
  const foundJson = await body(found);
  assert.equal(foundJson.result.structuredContent.data.id, "contrast-test");
  assert.equal(foundJson.result.structuredContent.data.canonical_url, `${ORIGIN}/en/contrasts/contrast-test/`);

  const missed = await handle(modernRequest("tools/call", { name: "metkagram_get_contrast", arguments: { id: "missing" } }, 6, { "mcp-name": "metkagram_get_contrast" }));
  const missedJson = await body(missed);
  assert.equal(missedJson.result.structuredContent.found, false);
});

test("legacy initialize and stateless tool listing remain available", async () => {
  const handle = createRemoteMcpHandler({ publicOrigin: ORIGIN, fetchImpl: mockFetch });
  const initialize = new Request("https://mcp.example.test/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "legacy", version: "1" } } }) });
  const initJson = await body(await handle(initialize));
  assert.equal(initJson.result.protocolVersion, "2025-11-25");

  const list = new Request("https://mcp.example.test/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) });
  const listJson = await body(await handle(list));
  assert.ok(Array.isArray(listJson.result.tools));
  assert.equal("resultType" in listJson.result, false);
});
