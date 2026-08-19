const DEFAULT_ORIGIN = "https://metkagram.github.io";
const MODERN_VERSION = "2026-07-28";
const LEGACY_VERSION = "2025-11-25";
const LEGACY_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);
const SERVER_INFO = { name: "metkagram-remote-mcp", version: "0.1.0" };
const CACHE_TTL_MS = 3_600_000;
const INSTRUCTIONS = "Metkagram is a read-only source of reviewed language-learning objects. Preserve stable IDs, canonical URLs, provenance and attribution. Prefer search by intent when the learner knows what they want to say. If no reviewed match exists, abstain instead of inventing a Metkagram pattern.";

const TOOLS = [
  {
    name: "metkagram_discover",
    title: "Discover Metkagram learning surfaces",
    description: "Get the public discovery map for learners, teachers and AI integrations.",
    inputSchema: emptySchema(),
  },
  {
    name: "metkagram_get_ai_recipes",
    title: "Get AI learning recipes",
    description: "Get public AI workflows grounded in canonical Metkagram objects.",
    inputSchema: emptySchema(),
  },
  {
    name: "metkagram_get_contrast",
    title: "Get reviewed contrast",
    description: "Get one reviewed contrast by stable contrast ID.",
    inputSchema: idSchema("Stable contrast ID, for example contrast-correction-reframe."),
  },
  {
    name: "metkagram_get_pattern",
    title: "Get canonical pattern",
    description: "Get one published Metkagram pattern by stable pattern ID.",
    inputSchema: idSchema("Stable pattern ID, for example XPRRTR004."),
  },
  {
    name: "metkagram_get_set",
    title: "Get study set",
    description: "Get one published study set and its canonical pattern summaries.",
    inputSchema: idSchema("Stable study-set ID."),
  },
  {
    name: "metkagram_health",
    title: "Check Metkagram source health",
    description: "Check the upstream public API version and release metadata.",
    inputSchema: emptySchema(),
  },
  {
    name: "metkagram_search_by_intent",
    title: "Find patterns by communicative intent",
    description: "Map a natural-language communicative goal to reviewed Metkagram intents and canonical pattern IDs. Returns no match when evidence is insufficient.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: {
        query: { type: "string", minLength: 2, maxLength: 300, description: "What the learner wants the sentence to do." },
        limit: { type: "integer", minimum: 1, maximum: 5, default: 3 },
      },
    },
  },
].sort((a, b) => a.name.localeCompare(b.name));

function emptySchema() {
  return { type: "object", additionalProperties: false };
}

function idSchema(description) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id"],
    properties: { id: { type: "string", minLength: 1, maxLength: 128, description } },
  };
}

function responseMeta() {
  return { "io.modelcontextprotocol/serverInfo": SERVER_INFO };
}

function complete(value = {}) {
  return { resultType: "complete", ...value, _meta: { ...(value._meta || {}), ...responseMeta() } };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "no-store" : "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-method, mcp-name",
      ...extraHeaders,
    },
  });
}

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function normalizeOrigin(value) {
  return String(value || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

function safeId(value, label = "id") {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(text)) throw new Error(`Invalid ${label}.`);
  return text;
}

function normalizedText(value = "") {
  return String(value).normalize("NFKC").toLocaleLowerCase();
}

function tokens(value = "") {
  return normalizedText(value).match(/[\p{L}\p{N}]+/gu)?.filter((token) => token.length > 2) || [];
}

function scoreIntent(query, item) {
  const q = normalizedText(query).trim();
  const queryTokens = [...new Set(tokens(q))];
  const phrases = [item.title_en, item.title_ru, ...(item.queries_en || []), ...(item.queries_ru || []), ...(item.signals_en || []), ...(item.signals_ru || [])].filter(Boolean).map(normalizedText);
  const descriptive = normalizedText([item.description_en, item.description_ru, ...phrases].filter(Boolean).join(" "));
  let score = phrases.some((phrase) => phrase.length >= 4 && (q.includes(phrase) || phrase.includes(q))) ? 8 : 0;
  for (const token of queryTokens) if (descriptive.includes(token)) score += 2;
  return score;
}

function rankIntents(query, dataset, limit) {
  const items = Array.isArray(dataset?.items) ? dataset.items : [];
  return items
    .map((item) => ({ item, score: scoreIntent(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)))
    .slice(0, limit)
    .map(({ item, score }) => ({
      id: item.id,
      reasoning_move: item.reasoning_move,
      title_en: item.title_en,
      title_ru: item.title_ru,
      description_en: item.description_en,
      description_ru: item.description_ru,
      pattern_ids: item.pattern_ids || [],
      routes: item.routes || {},
      score,
    }));
}

function collectionData(payload) {
  return payload?.data ?? payload;
}

function collectionItems(payload) {
  const data = collectionData(payload);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

function recordWithCollectionProvenance(payload, data) {
  return payload?.provenance ? { provenance: payload.provenance, data } : { data };
}

function toolText(payload) {
  return JSON.stringify(payload, null, 2);
}

function modernToolResult(payload, isError = false) {
  return complete({ content: [{ type: "text", text: toolText(payload) }], structuredContent: payload, isError });
}

function legacyToolResult(payload, isError = false) {
  return { content: [{ type: "text", text: toolText(payload) }], ...(isError ? { isError: true } : {}) };
}

function clientProtocol(body) {
  return body?.params?._meta?.["io.modelcontextprotocol/protocolVersion"] || null;
}

function validateModernHeaders(request, body) {
  const headerVersion = request.headers.get("mcp-protocol-version");
  const metaVersion = clientProtocol(body);
  const methodHeader = request.headers.get("mcp-method");
  const nameHeader = request.headers.get("mcp-name");
  if (!headerVersion || !metaVersion || headerVersion !== metaVersion) return "MCP-Protocol-Version must match params._meta protocolVersion.";
  if (methodHeader !== body.method) return "Mcp-Method must match the JSON-RPC method.";
  if (body.method === "tools/call" && nameHeader !== body.params?.name) return "Mcp-Name must match params.name for tools/call.";
  return null;
}

export function createRemoteMcpHandler({ publicOrigin = process.env.METKAGRAM_PUBLIC_ORIGIN || DEFAULT_ORIGIN, fetchImpl = globalThis.fetch } = {}) {
  const origin = normalizeOrigin(publicOrigin);
  const api = `${origin}/api/v1`;

  async function fetchJson(url) {
    if (typeof fetchImpl !== "function") throw new Error("Fetch is unavailable.");
    const response = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Metkagram upstream returned ${response.status} for ${url}`);
    return response.json();
  }

  async function health() {
    const index = await fetchJson(`${api}/index.json`);
    const source = collectionData(index);
    return {
      status: "ok",
      server: SERVER_INFO,
      protocol_versions: [MODERN_VERSION, LEGACY_VERSION],
      public_source: origin,
      upstream: {
        dataset_version: source?.dataset_version || index?.dataset_version || null,
        release_date: source?.release_date || index?.release_date || null,
        canonical_url: source?.canonical_url || index?.canonical_url || `${api}/index.json`,
      },
    };
  }

  const calls = {
    async metkagram_discover() {
      return fetchJson(`${api}/discovery.json`);
    },
    async metkagram_get_ai_recipes() {
      return fetchJson(`${api}/ai-recipes.json`);
    },
    async metkagram_get_contrast(args) {
      const id = safeId(args?.id, "contrast id");
      const payload = await fetchJson(`${api}/contrasts.json`);
      const item = collectionItems(payload).find((candidate) => String(candidate.id).toLocaleLowerCase() === id.toLocaleLowerCase());
      if (!item) return { found: false, id, note: "No reviewed public contrast exists with this ID." };
      return recordWithCollectionProvenance(payload, {
        ...item,
        canonical_url: `${origin}/en/contrasts/${encodeURIComponent(item.id)}/`,
        page_urls: { en: `${origin}/en/contrasts/${encodeURIComponent(item.id)}/`, ru: `${origin}/ru/contrasts/${encodeURIComponent(item.id)}/` },
      });
    },
    async metkagram_get_pattern(args) {
      const id = safeId(args?.id, "pattern id");
      return fetchJson(`${api}/patterns/${encodeURIComponent(id.toLocaleLowerCase())}.json`);
    },
    async metkagram_get_set(args) {
      const id = safeId(args?.id, "set id");
      return fetchJson(`${api}/sets/${encodeURIComponent(id.toLocaleLowerCase())}.json`);
    },
    async metkagram_health() {
      return health();
    },
    async metkagram_search_by_intent(args) {
      const query = String(args?.query || "").trim();
      if (query.length < 2 || query.length > 300) throw new Error("query must contain 2–300 characters.");
      const limit = Math.max(1, Math.min(5, Number.isInteger(args?.limit) ? args.limit : 3));
      const dataset = await fetchJson(`${origin}/data/intents.json`);
      const items = rankIntents(query, dataset, limit);
      return {
        query,
        matched: items.length > 0,
        items,
        dataset_version: dataset?.version || null,
        source_url: `${origin}/data/intents.json`,
        note: items.length ? "Use a returned pattern ID with metkagram_get_pattern for the canonical record." : "No reviewed intent match was strong enough. Do not invent a Metkagram pattern.",
      };
    },
  };

  async function callTool(name, args, modern) {
    const fn = calls[name];
    if (!fn) return { unknown: true };
    try {
      const payload = await fn(args || {});
      return { result: modern ? modernToolResult(payload) : legacyToolResult(payload) };
    } catch (error) {
      const payload = { error: error instanceof Error ? error.message : String(error) };
      return { result: modern ? modernToolResult(payload, true) : legacyToolResult(payload, true) };
    }
  }

  return async function handleRequest(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-method, mcp-name" } });
    if (request.method === "GET") {
      try { return json(await health()); } catch (error) { return json({ status: "degraded", error: error.message, server: SERVER_INFO }, 503); }
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, { allow: "GET, POST, OPTIONS" });

    let body;
    try { body = await request.json(); } catch { return json(rpcError(null, -32700, "Parse error"), 400); }
    const id = body?.id;
    if (body?.jsonrpc !== "2.0" || typeof body?.method !== "string") return json(rpcError(id, -32600, "Invalid Request"), 400);

    const headerVersion = request.headers.get("mcp-protocol-version");
    const metaVersion = clientProtocol(body);
    const requestedVersion = headerVersion || metaVersion;
    const modern = requestedVersion === MODERN_VERSION || body.method === "server/discover";

    if (modern) {
      const mismatch = validateModernHeaders(request, body);
      if (mismatch) return json(rpcError(id, -32020, "Header mismatch", { detail: mismatch }), 400);
    } else if (requestedVersion && !LEGACY_VERSIONS.has(requestedVersion)) {
      return json(rpcError(id, -32022, "Unsupported protocol version", { supported: [MODERN_VERSION, LEGACY_VERSION], requested: requestedVersion }), 400);
    }

    if (body.method === "notifications/initialized") return new Response(null, { status: 202, headers: { "access-control-allow-origin": "*" } });

    if (body.method === "server/discover") {
      return json(rpcResult(id, complete({
        supportedVersions: [MODERN_VERSION],
        capabilities: { tools: {} },
        instructions: INSTRUCTIONS,
        ttlMs: CACHE_TTL_MS,
        cacheScope: "public",
      })));
    }

    if (body.method === "initialize") {
      const requested = body.params?.protocolVersion;
      const protocolVersion = LEGACY_VERSIONS.has(requested) ? requested : LEGACY_VERSION;
      return json(rpcResult(id, { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS }));
    }

    if (body.method === "ping") return json(rpcResult(id, modern ? complete({}) : {}));

    if (body.method === "tools/list") {
      const result = modern
        ? complete({ tools: TOOLS, ttlMs: CACHE_TTL_MS, cacheScope: "public" })
        : { tools: TOOLS };
      return json(rpcResult(id, result));
    }

    if (body.method === "tools/call") {
      const name = String(body.params?.name || "");
      const call = await callTool(name, body.params?.arguments, modern);
      if (call.unknown) return json(rpcError(id, -32602, `Unknown Metkagram tool: ${name}`), 400);
      return json(rpcResult(id, call.result));
    }

    return json(rpcError(id, -32601, `Method not found: ${body.method}`), modern ? 404 : 200);
  };
}

export const remoteMcp = createRemoteMcpHandler();
export { MODERN_VERSION, LEGACY_VERSION, SERVER_INFO, TOOLS };
