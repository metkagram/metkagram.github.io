#!/usr/bin/env node
// Read-only stdio MCP bridge for the public Metkagram API.
// Requires Node.js 18+ (uses the built-in fetch API). Do not write logs to stdout.

const API = "https://metkagram.github.io/api/v1";
const SPEC_URL = `${API}/mcp-server.json`;

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function fail(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
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

async function handle(message) {
  if (message.method === "notifications/initialized") return;
  if (message.method === "initialize") {
    return respond(message.id, {
      protocolVersion: message.params?.protocolVersion || "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "metkagram-static-mcp", version: "1.0.0" },
    });
  }
  if (message.method === "tools/list") {
    const spec = await specification();
    return respond(message.id, { tools: spec.tools });
  }
  if (message.method === "tools/call") {
    const spec = await specification();
    const tool = spec.tools.find((item) => item.name === message.params?.name);
    if (!tool) return fail(message.id, -32602, `Unknown Metkagram tool: ${message.params?.name}`);
    const payload = await getJson(resolveToolUrl(tool, message.params?.arguments));
    return respond(message.id, {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    });
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
