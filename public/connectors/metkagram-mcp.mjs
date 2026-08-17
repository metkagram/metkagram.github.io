#!/usr/bin/env node
// Read-only stdio MCP bridge for the public Metkagram API.
// Requires Node.js 18+ (uses the built-in fetch API). Do not write logs to stdout.

const API = "https://metkagram.github.io/api/v1";
const SPEC_URL = `${API}/mcp-server.json`;
const MODERN_VERSION = "2026-07-28";
const LEGACY_FALLBACK = "2025-11-25";
const LEGACY_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);
const SERVER_INFO = { name: "metkagram-static-mcp", version: "1.1.0" };
const INSTRUCTIONS = "Use canonical Metkagram pattern IDs. Prefer metkagram_discover when the learner's job is unclear. For practice, ask the learner to attempt a structure before revealing feedback. This server is read-only.";

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function fail(id, code, message, data) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } })}\n`);
}

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Metkagram API returned ${response.status} for ${url}`);
  return response.json();
}

async function specification() {
  return getJson(SPEC_URL);
}

function resolveToolUrl(tool, args = {}) {
  if (tool.staticUrl) return tool.staticUrl;
  if (!tool.staticUrlTemplate) throw new Error(`Tool ${tool.name} has no static URL.`);
  return tool.staticUrlTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
    if (args[key] === undefined || args[key] === null || args[key] === "") throw new Error(`Missing required argument: ${key}`);
    return encodeURIComponent(String(args[key]).toLowerCase());
  });
}

function isModern(message) {
  return message.method === "server/discover" || message.params?._meta?.["io.modelcontextprotocol/protocolVersion"] === MODERN_VERSION;
}

async function handle(message) {
  if (message.method === "notifications/initialized") return;

  if (message.method === "server/discover") {
    return respond(message.id, {
      resultType: "complete",
      supportedVersions: [MODERN_VERSION],
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
      instructions: INSTRUCTIONS,
    });
  }

  if (message.method === "initialize") {
    const requested = message.params?.protocolVersion;
    const protocolVersion = LEGACY_VERSIONS.has(requested) ? requested : LEGACY_FALLBACK;
    return respond(message.id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
      instructions: INSTRUCTIONS,
    });
  }

  if (message.method === "ping") return respond(message.id, isModern(message) ? { resultType: "complete" } : {});

  if (message.method === "tools/list") {
    const spec = await specification();
    const tools = [...(spec.tools || [])].sort((a, b) => a.name.localeCompare(b.name));
    return respond(message.id, isModern(message)
      ? { resultType: "complete", tools, ttlMs: 3600000, cacheScope: "public" }
      : { tools });
  }

  if (message.method === "tools/call") {
    const spec = await specification();
    const tool = spec.tools.find((item) => item.name === message.params?.name);
    if (!tool) return fail(message.id, -32602, `Unknown Metkagram tool: ${message.params?.name}`);
    const payload = await getJson(resolveToolUrl(tool, message.params?.arguments));
    const content = [{ type: "text", text: JSON.stringify(payload, null, 2) }];
    return respond(message.id, isModern(message)
      ? { resultType: "complete", content, structuredContent: payload, isError: false }
      : { content });
  }

  if (message.id !== undefined) return fail(message.id, -32601, `Method not found: ${message.method}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      fail(null, -32700, "Parse error");
      continue;
    }
    handle(message).catch((error) => {
      if (message.id !== undefined) fail(message.id, -32000, error.message);
      else process.stderr.write(`${error.message}\n`);
    });
  }
});
