# Metkagram Remote MCP

Status: deployment-ready runtime, public hosted endpoint not yet declared canonical.

Metkagram already exposes static, provenance-preserving JSON data on GitHub Pages. The Remote MCP layer is deliberately thin: it translates MCP tool calls into reads against those published canonical assets. It does not store learner state, mutate project data, or invent missing patterns.

## Protocol

The HTTP handler supports the current MCP `2026-07-28` stateless core and a stateless compatibility path for legacy `initialize` clients up to `2025-11-25`.

For `2026-07-28`, requests must carry:

- `MCP-Protocol-Version: 2026-07-28`
- `Mcp-Method` matching the JSON-RPC `method`
- `Mcp-Name` for `tools/call`, matching `params.name`
- the same protocol version inside `params._meta.io.modelcontextprotocol/protocolVersion`

The server implements `server/discover`, deterministic cacheable `tools/list`, `tools/call`, `ping`, legacy `initialize`, and a read-only health response on HTTP `GET`.

## Public tools

- `metkagram_discover`
- `metkagram_get_ai_recipes`
- `metkagram_get_contrast`
- `metkagram_get_pattern`
- `metkagram_get_set`
- `metkagram_health`
- `metkagram_search_by_intent`

Intent search is deterministic and conservative. No match is a valid result; clients should not turn an abstention into an invented Metkagram object.

## Local run

```bash
node remote-mcp/server.mjs
```

The default local endpoint is `http://127.0.0.1:8787/mcp`. `GET /mcp` checks the public upstream API.

Example discovery call:

```bash
curl -s http://127.0.0.1:8787/mcp \
  -H 'content-type: application/json' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  --data '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"curl","version":"1"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

## Vercel deployment

`api/mcp.mjs` is a Web-standard Vercel Function. `vercel.json` rewrites `/mcp` to `/api/mcp`, so the eventual deployment can expose one clean MCP URL.

The runtime defaults to `https://metkagram.github.io` as its public source. Set `METKAGRAM_PUBLIC_ORIGIN` only when testing against another compatible publication origin.

Do not advertise a registry entry until the deployed endpoint has passed the repository tests and a real remote-client smoke test.

## Boundaries

The endpoint is public and read-only. It has no account system, learner profiles, writes, hidden corpus access, model-training endpoint, or participant data. Tool results preserve upstream provenance wherever the canonical static API provides it.
