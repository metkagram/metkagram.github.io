import assert from "node:assert/strict";
import test from "node:test";
import { buildPatternGraph, relatedPatternIds } from "../src/pattern-graph.mjs";

const patterns = [
  {
    id: "A001",
    title_ru: "A",
    group_id: "CLF",
    set_id: "ARG",
    logic: "necessary condition",
    reasoning: { move: "Limit" },
    langs: [{ lang: "en", formula: "A" }, { lang: "de", formula: "A-de" }]
  },
  {
    id: "A002",
    title_ru: "B",
    group_id: "CLF",
    set_id: "ARG",
    logic: "necessary but insufficient condition",
    reasoning: { move: "Limit" },
    langs: [{ lang: "en", formula: "B" }, { lang: "de", formula: "B-de" }]
  },
  {
    id: "A003",
    title_ru: "C",
    group_id: "CLF",
    set_id: "CND",
    logic: "hard prerequisite",
    reasoning: { move: "Condition" },
    langs: [{ lang: "en", formula: "C" }, { lang: "de", formula: "C-de" }]
  }
];

test("pattern graph connects explicit reasoning neighbours", () => {
  const graph = buildPatternGraph(patterns, {
    maxRelated: 2,
    siteUrl: "https://example.test",
    patternPathFor: (locale, pattern) => `/${locale}/practice/patterns/${pattern.id.toLowerCase()}/`
  });
  assert.equal(graph.node_count, 3);
  assert.equal(graph.move_count, 2);
  assert.ok(graph.edge_count >= 1);
  assert.deepEqual(relatedPatternIds(graph, "A001"), ["A002"]);
  const neighbour = graph.nodes.find((node) => node.id === "A001").related[0];
  assert.ok(neighbour.relations.includes("same_reasoning_move"));
  assert.ok(neighbour.relations.includes("same_study_set"));
});

test("pattern graph does not invent relations without explicit evidence", () => {
  const isolated = buildPatternGraph([
    patterns[0],
    { ...patterns[2], id: "Z999", set_id: "EVD", logic: "probability estimate", reasoning: { move: "Estimate" } }
  ], { patternPathFor: (locale, pattern) => `/${locale}/practice/patterns/${pattern.id.toLowerCase()}/` });
  assert.equal(isolated.edge_count, 0);
  assert.deepEqual(relatedPatternIds(isolated, "A001"), []);
});
