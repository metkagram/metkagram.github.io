#!/usr/bin/env node
import http from "node:http";
import { createRemoteMcpHandler } from "./core.mjs";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const handle = createRemoteMcpHandler();

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://${req.headers.host || `${host}:${port}`}${req.url || "/mcp"}`, {
      method: req.method,
      headers: req.headers,
      ...(body && req.method !== "GET" && req.method !== "HEAD" ? { body } : {}),
    });
    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
});

server.listen(port, host, () => {
  process.stderr.write(`Metkagram Remote MCP listening on http://${host}:${port}/mcp\n`);
});
