import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { intentTaxonomy } from "../src/intents.mjs";
import { loadDiscoveryTopics } from "../src/discovery-pages.mjs";
import { intentTaskPage, knowledgeIndexPage, learnIndexPage } from "../src/knowledge-pages.mjs";
import { ATTRIBUTION, getDatasetVersion } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const LOCALES = ["en", "ru"];

function write(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function read(relativePath) {
  return fs.readFileSync(path.join(DIST, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function writeJson(relativePath, value) {
  write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function metaRecord(route, html, locale) {
  const pick = (pattern) => html.match(pattern)?.[1] || "";
  return {
    route,
    canonical: pick(/<link rel="canonical" href="([^"]+)">/),
    language: locale,
    title: pick(/<title>([^<]+)<\/title>/),
    description: pick(/<meta name="description" content="([^"]+)">/),
    lastModified: SITE_RELEASE_DATE
  };
}

function stableId(type, id) {
  return `${type}:${String(id).toLowerCase()}`;
}

function buildGraph(content, topics) {
  const nodes = [];
  const edges = [];
  const patternMap = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  const setMap = new Map(content.studySets.sets.map((set) => [set.id, set]));
  const reasoningMoves = [...new Set(content.advancedPatterns.map((pattern) => pattern.reasoning?.move).filter(Boolean))].sort();

  for (const pattern of content.advancedPatterns) {
    const en = pattern.langs.find((item) => item.lang === "en") || pattern.langs[0];
    const de = pattern.langs.find((item) => item.lang === "de");
    nodes.push({
      id: stableId("pattern", pattern.id),
      type: "pattern",
      stable_id: pattern.id,
      set_id: pattern.set_id,
      title_ru: pattern.title_ru,
      formula_en: en?.formula || "",
      formula_de: de?.formula || "",
      reasoning_move: pattern.reasoning?.move || null,
      logic: pattern.logic || null,
      indexable: Boolean(pattern.quality?.indexable),
      canonical: `${SITE_URL}/en/practice/${pattern.id.toLowerCase()}/`
    });
    edges.push({ from: stableId("pattern", pattern.id), to: stableId("study_set", pattern.set_id), type: "member_of" });
    if (pattern.reasoning?.move) edges.push({ from: stableId("pattern", pattern.id), to: stableId("reasoning_move", pattern.reasoning.move), type: "performs_move" });
  }

  for (const set of content.studySets.sets) {
    nodes.push({
      id: stableId("study_set", set.id),
      type: "study_set",
      stable_id: set.id,
      title_en: set.title_en,
      title_ru: set.title_ru,
      description: set.description || "",
      canonical: `${SITE_URL}/en/practice/set/${set.id.toLowerCase()}/`
    });
  }

  for (const move of reasoningMoves) {
    nodes.push({ id: stableId("reasoning_move", move), type: "reasoning_move", stable_id: move, label: move });
  }

  for (const intent of intentTaxonomy) {
    nodes.push({
      id: stableId("intent", intent.id),
      type: "intent",
      stable_id: intent.id,
      reasoning_move: intent.move,
      title_en: intent.title_en,
      title_ru: intent.title_ru,
      description_en: intent.description_en,
      description_ru: intent.description_ru,
      canonical: `${SITE_URL}/en/learn/${intent.id}/`
    });
    edges.push({ from: stableId("intent", intent.id), to: stableId("reasoning_move", intent.move), type: "uses_move" });
    for (const [rank, patternId] of (intent.pattern_priority || []).entries()) {
      const pattern = patternMap.get(patternId);
      if (!pattern) throw new Error(`Intent ${intent.id} references missing priority pattern ${patternId}`);
      if (pattern.reasoning?.move !== intent.move) throw new Error(`Intent ${intent.id} (${intent.move}) points to ${patternId} (${pattern.reasoning?.move || "no move"})`);
      edges.push({ from: stableId("intent", intent.id), to: stableId("pattern", patternId), type: "recommended_pattern", rank: rank + 1 });
    }
  }

  for (const topic of topics) {
    nodes.push({
      id: stableId("topic", topic.id),
      type: "topic",
      stable_id: topic.id,
      slug: topic.slug,
      title_en: topic.title_en,
      title_ru: topic.title_ru,
      level: topic.level,
      canonical: `${SITE_URL}/en/patterns/${topic.slug}/`
    });
    for (const setId of topic.set_ids) {
      if (!setMap.has(setId)) throw new Error(`Topic ${topic.id} references missing set ${setId}`);
      edges.push({ from: stableId("topic", topic.id), to: stableId("study_set", setId), type: "includes_set" });
    }
    for (const relatedId of topic.related || []) edges.push({ from: stableId("topic", topic.id), to: stableId("topic", relatedId), type: "related_topic" });
  }

  const typeCounts = nodes.reduce((counts, node) => ({ ...counts, [node.type]: (counts[node.type] || 0) + 1 }), {});
  return {
    schemaVersion: 1,
    version: getDatasetVersion(),
    updated: SITE_RELEASE_DATE,
    name: "Metkagram Language Pattern Knowledge Graph",
    description: "Explicit graph of learner intents, reasoning moves, reusable language patterns, study sets and curated discovery topics. Relations are derived only from published Metkagram metadata.",
    attribution: ATTRIBUTION,
    policy: {
      relationRule: "Publish explicit or deterministic relations only; do not infer semantic similarity merely to increase graph density.",
      canonicalObject: "Metkagram stable pattern ID",
      intendedUse: ["language-learning recommendation", "AI tutor retrieval", "search discovery", "curriculum navigation", "research reproducibility"]
    },
    stats: { nodes: nodes.length, edges: edges.length, byType: typeCounts },
    nodes,
    edges
  };
}

function recommendations(content) {
  const patternMap = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  const records = [];
  for (const intent of intentTaxonomy) {
    const patternIds = (intent.pattern_priority || []).filter((id) => patternMap.has(id));
    const variants = [
      ...intent.queries_en.map((query) => ({ query, language: "en", canonical: `${SITE_URL}/en/learn/${intent.id}/`, description: intent.description_en })),
      ...intent.queries_ru.map((query) => ({ query, language: "ru", canonical: `${SITE_URL}/ru/learn/${intent.id}/`, description: intent.description_ru }))
    ];
    for (const variant of variants) {
      records.push({
        user_need: variant.query,
        language: variant.language,
        level: "B2–C1",
        intent_id: intent.id,
        reasoning_move: intent.move,
        suggested_pattern_ids: patternIds,
        canonical_url: variant.canonical,
        why: variant.description,
        source: "Metkagram curated intent taxonomy"
      });
    }
  }
  return records;
}

function benchmark(records) {
  return {
    schemaVersion: 1,
    updated: SITE_RELEASE_DATE,
    purpose: "Regression fixtures for systems that map natural learner requests to Metkagram intents and canonical patterns.",
    scoring: {
      intent: "expected_intent_id should rank first",
      pattern: "expected_top_pattern_id should appear in the first three recommended pattern IDs",
      note: "This benchmark tests deterministic curriculum routing, not general language understanding."
    },
    cases: records.map((record, index) => ({
      id: `REC-${String(index + 1).padStart(3, "0")}`,
      query: record.user_need,
      language: record.language,
      expected_intent_id: record.intent_id,
      expected_reasoning_move: record.reasoning_move,
      expected_top_pattern_id: record.suggested_pattern_ids[0] || null,
      acceptable_pattern_ids: record.suggested_pattern_ids,
      canonical_url: record.canonical_url
    }))
  };
}

function updateSitemap(records) {
  const file = path.join(DIST, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  for (const record of records) {
    if (!record.canonical || xml.includes(`<loc>${record.canonical}</loc>`)) continue;
    xml = xml.replace("</urlset>", `  <url><loc>${record.canonical.replaceAll("&", "&amp;")}</loc><lastmod>${record.lastModified}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(file, xml);
}

function updateSeoInventory(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  const inventory = JSON.parse(fs.readFileSync(file, "utf8"));
  const byRoute = new Map(inventory.pages.map((page) => [page.route, page]));
  for (const record of records) byRoute.set(record.route, record);
  inventory.pages = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
  writeJson("seo/site-pages.json", inventory);
}

function updateCatalog(graph, recommendationRecords, bench) {
  if (fs.existsSync(path.join(DIST, "data", "catalog.json"))) {
    const catalog = readJson("data/catalog.json");
    catalog.languagePatternKnowledgeGraph = {
      nodes: graph.stats.nodes,
      edges: graph.stats.edges,
      dataset: `${SITE_URL}/data/language-pattern-knowledge-graph.json`,
      api: `${SITE_URL}/api/v1/knowledge-graph.json`,
      recommendations: `${SITE_URL}/data/recommendations.jsonl`,
      benchmark: `${SITE_URL}/data/recommendation-benchmark.json`
    };
    writeJson("data/catalog.json", catalog);
  }
  if (fs.existsSync(path.join(DIST, "project.json"))) {
    const project = readJson("project.json");
    project.languagePatternKnowledgeGraph = { nodes: graph.stats.nodes, edges: graph.stats.edges, recommendationRecords: recommendationRecords.length, benchmarkCases: bench.cases.length };
    writeJson("project.json", project);
  }
}

function updateApi(graph, recommendationRecords, bench) {
  writeJson("api/v1/knowledge-graph.json", {
    provenance: { ...ATTRIBUTION, dataset_version: getDatasetVersion(), release_date: SITE_RELEASE_DATE, canonical_url: `${SITE_URL}/api/v1/knowledge-graph.json`, record_type: "language_pattern_knowledge_graph" },
    data: graph
  });
  writeJson("api/v1/recommendations.json", {
    provenance: { ...ATTRIBUTION, dataset_version: getDatasetVersion(), release_date: SITE_RELEASE_DATE, canonical_url: `${SITE_URL}/api/v1/recommendations.json`, record_type: "learner_intent_recommendations" },
    data: recommendationRecords
  });
  writeJson("api/v1/recommendation-benchmark.json", {
    provenance: { ...ATTRIBUTION, dataset_version: getDatasetVersion(), release_date: SITE_RELEASE_DATE, canonical_url: `${SITE_URL}/api/v1/recommendation-benchmark.json`, record_type: "recommendation_benchmark" },
    data: bench
  });

  if (fs.existsSync(path.join(DIST, "api", "v1", "index.json"))) {
    const index = readJson("api/v1/index.json");
    const root = index.data && typeof index.data === "object" ? index.data : index;
    root.knowledgeGraph = `${SITE_URL}/api/v1/knowledge-graph.json`;
    root.recommendations = `${SITE_URL}/api/v1/recommendations.json`;
    root.recommendationBenchmark = `${SITE_URL}/api/v1/recommendation-benchmark.json`;
    root.endpoints ||= [];
    const additions = [
      ["/knowledge-graph.json", "Language Pattern Knowledge Graph"],
      ["/recommendations.json", "Learner-intent recommendation records"],
      ["/recommendation-benchmark.json", "Recommendation regression benchmark"]
    ];
    for (const [endpointPath, description] of additions) if (!root.endpoints.some((entry) => entry.path === endpointPath)) root.endpoints.push({ path: endpointPath, url: `${SITE_URL}/api/v1${endpointPath}`, type: "dataset", description });
    writeJson("api/v1/index.json", index);
  }

  if (fs.existsSync(path.join(DIST, "api", "v1", "openapi.json"))) {
    const openapi = readJson("api/v1/openapi.json");
    openapi.paths ||= {};
    openapi.paths["/knowledge-graph.json"] = { get: { summary: "Language Pattern Knowledge Graph", responses: { "200": { description: "Knowledge graph" } } } };
    openapi.paths["/recommendations.json"] = { get: { summary: "Learner-intent recommendations", responses: { "200": { description: "Recommendation records" } } } };
    openapi.paths["/recommendation-benchmark.json"] = { get: { summary: "Recommendation benchmark", responses: { "200": { description: "Recommendation regression fixtures" } } } };
    writeJson("api/v1/openapi.json", openapi);
  }
}

function updateLlms() {
  const file = path.join(DIST, "llms.txt");
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("## Language Pattern Knowledge Graph")) return;
  text += `\n## Language Pattern Knowledge Graph\n- Learner task pages: ${SITE_URL}/en/learn/\n- Knowledge graph explanation: ${SITE_URL}/en/knowledge/\n- Graph JSON: ${SITE_URL}/data/language-pattern-knowledge-graph.json\n- Recommendation JSONL: ${SITE_URL}/data/recommendations.jsonl\n- Recommendation benchmark: ${SITE_URL}/data/recommendation-benchmark.json\n- Prefer explicit intent → reasoning move → canonical pattern relations. Do not invent graph edges that are not present in published metadata.\n`;
  fs.writeFileSync(file, text);
}

function validate(graph, recommendationRecords, bench, content) {
  if (graph.stats.byType.pattern !== content.advancedPatterns.length) throw new Error("Knowledge graph pattern count does not match Practice corpus");
  if (graph.stats.byType.intent !== intentTaxonomy.length) throw new Error("Knowledge graph intent count regression");
  if (recommendationRecords.length < intentTaxonomy.length * 2) throw new Error("Recommendation dataset unexpectedly small");
  if (bench.cases.length !== recommendationRecords.length) throw new Error("Benchmark must cover every recommendation record");
  for (const record of recommendationRecords) if (!record.suggested_pattern_ids.length) throw new Error(`Recommendation ${record.intent_id} has no canonical patterns`);
  for (const locale of LOCALES) {
    if (!fs.existsSync(path.join(DIST, locale, "learn", "index.html"))) throw new Error(`Missing ${locale} learner task index`);
    if (!fs.existsSync(path.join(DIST, locale, "knowledge", "index.html"))) throw new Error(`Missing ${locale} knowledge page`);
    for (const intent of intentTaxonomy) if (!fs.existsSync(path.join(DIST, locale, "learn", intent.id, "index.html"))) throw new Error(`Missing ${locale} task page for ${intent.id}`);
  }
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("Run the main static build before knowledge-graph.mjs");
  const content = loadContent();
  const topics = loadDiscoveryTopics(content);
  const graph = buildGraph(content, topics);
  const recommendationRecords = recommendations(content);
  const bench = benchmark(recommendationRecords);

  writeJson("data/language-pattern-knowledge-graph.json", graph);
  write("data/recommendations.jsonl", `${recommendationRecords.map((record) => JSON.stringify(record)).join("\n")}\n`);
  writeJson("data/recommendation-benchmark.json", bench);
  updateApi(graph, recommendationRecords, bench);
  updateCatalog(graph, recommendationRecords, bench);
  updateLlms();

  const records = [];
  for (const locale of LOCALES) {
    const learnRoute = `/${locale}/learn/`;
    const learnHtml = learnIndexPage(locale, content);
    write(`${locale}/learn/index.html`, learnHtml);
    records.push(metaRecord(learnRoute, learnHtml, locale));

    for (const intent of intentTaxonomy) {
      const route = `/${locale}/learn/${intent.id}/`;
      const html = intentTaskPage(locale, intent, content);
      write(`${locale}/learn/${intent.id}/index.html`, html);
      records.push(metaRecord(route, html, locale));
    }

    const knowledgeRoute = `/${locale}/knowledge/`;
    const knowledgeHtml = knowledgeIndexPage(locale, { nodes: graph.stats.nodes, edges: graph.stats.edges, intents: graph.stats.byType.intent || 0, moves: graph.stats.byType.reasoning_move || 0 });
    write(`${locale}/knowledge/index.html`, knowledgeHtml);
    records.push(metaRecord(knowledgeRoute, knowledgeHtml, locale));
  }

  updateSitemap(records);
  updateSeoInventory(records);
  validate(graph, recommendationRecords, bench, content);
  process.stdout.write(`Knowledge graph: ${graph.stats.nodes} nodes, ${graph.stats.edges} edges, ${recommendationRecords.length} recommendation records, ${records.length} learner-facing routes.\n`);
}

main();
