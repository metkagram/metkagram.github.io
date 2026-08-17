import fs from "node:fs";
import path from "node:path";
import { buildPatternGraph } from "../src/pattern-graph.mjs";
import { stableHash, wrapRecord } from "../src/provenance.mjs";

const DIST = path.resolve("dist");
const SITE_URL = "https://metkagram.github.io";
const API_URL = `${SITE_URL}/api/v1`;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(DIST, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function patchJson(relativePath, mutate) {
  const target = path.join(DIST, relativePath);
  if (!fs.existsSync(target)) return;
  const value = JSON.parse(fs.readFileSync(target, "utf8"));
  mutate(value);
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function relationLabel(relation, locale) {
  const copy = locale === "ru"
    ? { same_reasoning_move: "тот же логический ход", same_study_set: "тот же учебный набор", logic_overlap: "связанная логика" }
    : { same_reasoning_move: "same reasoning move", same_study_set: "same study set", logic_overlap: "related logic" };
  return copy[relation] || relation.replaceAll("_", " ");
}

function patchPatternPages(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  let patched = 0;

  for (const node of graph.nodes) {
    for (const locale of ["en", "ru"]) {
      const file = path.join(DIST, locale, "practice", node.id.toLowerCase(), "index.html");
      if (!fs.existsSync(file)) continue;
      let html = fs.readFileSync(file, "utf8");
      if (html.includes("data-pattern-graph-related")) continue;

      const related = node.related.map((item) => ({ ...item, node: nodesById.get(item.id) })).filter((item) => item.node);
      if (!related.length) continue;
      const title = locale === "ru" ? "Связанные логические каркасы" : "Related reasoning patterns";
      const intro = locale === "ru"
        ? "Похожие конструкции помогают выполнить тот же мыслительный ход другим способом."
        : "Nearby structures let you perform the same reasoning move in a different form.";
      const items = related.map((item) => {
        const label = locale === "ru" ? item.node.title_ru : item.node.formulas.en || item.node.id;
        const meta = `${item.node.reasoning_move} · ${item.relations.map((relation) => relationLabel(relation, locale)).join(" · ")}`;
        return `<li class="pattern-comparison-card"><a href="/${locale}/practice/${item.id.toLowerCase()}/"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(meta)}</small></a></li>`;
      }).join("");
      const section = `<section class="pattern-variations" data-pattern-graph-related><h2>${title}<small>${related.length}</small></h2><p>${intro}</p><ol class="pattern-comparison-list">${items}</ol></section>`;
      const mainClose = html.indexOf("</main>");
      const articleClose = html.lastIndexOf("</article>", mainClose === -1 ? html.length : mainClose);
      if (articleClose === -1) throw new Error(`Could not find outer pattern article in ${file}`);
      html = `${html.slice(0, articleClose)}${section}${html.slice(articleClose)}`;
      fs.writeFileSync(file, html);
      patched += 1;
    }
  }
  return patched;
}

const patterns = readJson("data/advanced-patterns.json");
const graph = buildPatternGraph(patterns, { siteUrl: SITE_URL, maxRelated: 4 });
writeJson("data/pattern-graph.json", graph);
writeJson("api/v1/pattern-graph.json", wrapRecord(graph, {
  canonical_url: `${API_URL}/pattern-graph.json`,
  record_type: "pattern_graph",
  record_id: "public-pattern-graph"
}));

patchJson("api/v1/index.json", (index) => {
  index.counts = { ...(index.counts || {}), patternGraphNodes: graph.node_count, patternGraphEdges: graph.edge_count };
  index.endpoints ||= [];
  if (!index.endpoints.some((item) => item.path === "/pattern-graph.json")) {
    index.endpoints.push({ path: "/pattern-graph.json", url: `${API_URL}/pattern-graph.json`, type: "graph", description: "Taxonomy-derived relationships between public reasoning patterns" });
  }
  index.datasets ||= [];
  if (!index.datasets.some((item) => item.id === "pattern-graph")) {
    index.datasets.push({ id: "pattern-graph", label: "Public reasoning pattern graph", count: graph.node_count, url: `${API_URL}/pattern-graph.json` });
  }
});

patchJson("api/v1/catalog.json", (catalog) => {
  catalog.datasets ||= [];
  if (!catalog.datasets.some((item) => item.id === "pattern-graph")) {
    catalog.datasets.push({
      id: "pattern-graph",
      title: "Public pattern graph",
      description: "Bounded relationships between public patterns derived from reasoning moves, study sets and shared logic vocabulary.",
      count: graph.node_count,
      api_url: `${API_URL}/pattern-graph.json`
    });
  }
});

patchJson("data/catalog.json", (catalog) => {
  catalog.patternGraph = {
    nodeCount: graph.node_count,
    edgeCount: graph.edge_count,
    moveCount: graph.move_count,
    dataset: `${SITE_URL}/data/pattern-graph.json`,
    api: `${API_URL}/pattern-graph.json`
  };
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_pattern_graph")) {
    spec.tools.push({
      name: "metkagram_get_pattern_graph",
      description: "Get the bounded public graph of related reasoning patterns and their nearest reusable alternatives.",
      inputSchema: { type: "object" },
      staticUrl: `${API_URL}/pattern-graph.json`
    });
  }
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/pattern-graph.json"] ||= {
    get: {
      summary: "Public reasoning pattern graph",
      operationId: "pattern_graph_json",
      responses: {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: { $ref: `${API_URL}/schemas/api-response.json` } } }
        }
      }
    }
  };
});

patchJson("api/v1/attribution.json", (wrapped) => {
  const policy = wrapped.data?.policy;
  if (!policy) return;
  policy.summary = "Public access supports reading, linking and citation; substantial reuse requires scoped permission under the current Metkagram terms.";
  policy.allowed_use = [
    "Ordinary personal end-user use of the hosted Metkagram site.",
    "Reading, linking, citation and inspection consistent with the current Metkagram terms.",
    "Other reuse only where a scoped written permission or independently applicable law allows it."
  ];
  policy.commercial_use = "Commercial integration, redistribution, resale, model training on substantial Metkagram material and derived corpora require prior written permission unless applicable law independently permits the use.";
  if (policy.citation_formats) {
    policy.citation_formats.academic = `Metkagram (2026). Visual language annotation and reusable reasoning patterns. ${SITE_URL}. Current rights: ${SITE_URL}/en/licensing/.`;
  }
  if (wrapped.provenance) wrapped.provenance.content_hash = stableHash(wrapped.data);
});

const llmsFile = path.join(DIST, "llms.txt");
if (fs.existsSync(llmsFile)) {
  let text = fs.readFileSync(llmsFile, "utf8");
  if (!text.includes(`${API_URL}/pattern-graph.json`)) {
    text = text.replace(`- Search index: ${API_URL}/search-index.json`, `- Search index: ${API_URL}/search-index.json\n- Pattern graph: ${API_URL}/pattern-graph.json (${graph.node_count} public nodes, ${graph.edge_count} bounded relations)`);
  }
  fs.writeFileSync(llmsFile, text);
}

const patchedPages = patchPatternPages(graph);
console.log(`Product direction finalized: ${graph.node_count} graph nodes, ${graph.edge_count} edges, ${patchedPages} pattern pages enriched.`);
