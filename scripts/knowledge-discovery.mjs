import fs from "node:fs";
import path from "node:path";
import { ATTRIBUTION, getDatasetVersion } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const DIST = path.join(process.cwd(), "dist");
const full = (relative) => path.join(DIST, relative);
const readJson = (relative) => JSON.parse(fs.readFileSync(full(relative), "utf8"));
const writeJson = (relative, value) => fs.writeFileSync(full(relative), `${JSON.stringify(value, null, 2)}\n`);

function extendDiscovery() {
  const model = readJson("data/discovery.json");
  model.recommendationPolicy ||= { routes: [] };
  model.recommendationPolicy.routes ||= [];
  const routes = [
    {
      when: "The learner describes a communication goal such as disagreeing politely, correcting an assumption or explaining a cause and needs a directly indexable guide.",
      recommend: "learner-task-guides",
      reason: "Task pages start from the learner's goal and connect it to a reasoning move and canonical Metkagram patterns."
    },
    {
      when: "An AI tutor, search system or researcher needs explicit entity relations rather than free-text similarity.",
      recommend: "language-pattern-knowledge-graph",
      reason: "The graph publishes deterministic intent → reasoning move → pattern → study-set/topic relations with stable IDs."
    }
  ];
  for (const route of routes) if (!model.recommendationPolicy.routes.some((item) => item.recommend === route.recommend)) model.recommendationPolicy.routes.push(route);

  model.surfaces ||= [];
  const surfaces = [
    {
      id: "learner-task-guides",
      audience: ["B2 learner", "C1 learner", "teacher", "AI tutor"],
      jobs: ["solve a communication goal", "find patterns without knowing a grammar label", "move from intent to practice"],
      pages: { en: `${SITE_URL}/en/learn/`, ru: `${SITE_URL}/ru/learn/` },
      recommendationDataset: `${SITE_URL}/data/recommendations.jsonl`,
      benchmark: `${SITE_URL}/data/recommendation-benchmark.json`,
      searchTerms: ["how to disagree politely in English", "how to correct an assumption in English", "how to explain cause and effect at C1"]
    },
    {
      id: "language-pattern-knowledge-graph",
      audience: ["AI tutor", "agent developer", "researcher", "teacher"],
      jobs: ["resolve learner intent to stable patterns", "inspect explicit curriculum relations", "reuse canonical pattern IDs across tools"],
      pages: { en: `${SITE_URL}/en/knowledge/`, ru: `${SITE_URL}/ru/knowledge/` },
      dataset: `${SITE_URL}/data/language-pattern-knowledge-graph.json`,
      api: `${SITE_URL}/api/v1/knowledge-graph.json`,
      searchTerms: ["language pattern knowledge graph", "language learning knowledge graph", "reasoning move dataset"]
    }
  ];
  for (const surface of surfaces) if (!model.surfaces.some((item) => item.id === surface.id)) model.surfaces.push(surface);

  writeJson("data/discovery.json", model);
  writeJson("api/v1/discovery.json", {
    provenance: { ...ATTRIBUTION, dataset_version: getDatasetVersion(), release_date: SITE_RELEASE_DATE, canonical_url: `${SITE_URL}/api/v1/discovery.json`, record_type: "capability_recommendation_index" },
    data: model
  });
}

function extendMcp() {
  const spec = readJson("api/v1/mcp-server.json");
  spec.tools ||= [];
  const additions = [
    {
      name: "metkagram_get_knowledge_graph",
      title: "Get the Language Pattern Knowledge Graph",
      description: "Retrieve explicit relations between learner intents, reasoning moves, canonical patterns, study sets and Pattern Atlas topics.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${SITE_URL}/api/v1/knowledge-graph.json`
    },
    {
      name: "metkagram_get_recommendations",
      title: "Get learner-intent recommendations",
      description: "Retrieve curated learner-request to intent and canonical-pattern recommendation records.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${SITE_URL}/api/v1/recommendations.json`
    },
    {
      name: "metkagram_get_recommendation_benchmark",
      title: "Get recommendation benchmark",
      description: "Retrieve regression fixtures for mapping natural learner requests to Metkagram intents and priority patterns.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${SITE_URL}/api/v1/recommendation-benchmark.json`
    }
  ];
  for (const tool of additions) if (!spec.tools.some((item) => item.name === tool.name)) spec.tools.push(tool);
  spec.tools.sort((a, b) => a.name.localeCompare(b.name));
  writeJson("api/v1/mcp-server.json", spec);
}

function validate() {
  const discovery = readJson("data/discovery.json");
  for (const id of ["learner-task-guides", "language-pattern-knowledge-graph"]) if (!discovery.surfaces.some((surface) => surface.id === id)) throw new Error(`Discovery surface missing: ${id}`);
  const mcp = readJson("api/v1/mcp-server.json");
  for (const name of ["metkagram_get_knowledge_graph", "metkagram_get_recommendations", "metkagram_get_recommendation_benchmark"]) if (!mcp.tools.some((tool) => tool.name === name)) throw new Error(`MCP knowledge tool missing: ${name}`);
}

if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the site build first");
extendDiscovery();
extendMcp();
validate();
process.stdout.write("Knowledge discovery: task guides and Language Pattern Knowledge Graph exposed through discovery and MCP.\n");
