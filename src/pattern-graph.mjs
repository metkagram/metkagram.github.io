import { patternPath } from "./seo-slugs.mjs";

const LOGIC_STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "is", "of", "on", "or", "the", "to", "vs", "with"
]);

function normalizeWords(value = "") {
  return new Set(String(value)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !LOGIC_STOP_WORDS.has(item)));
}

function logicOverlap(left, right) {
  const leftWords = normalizeWords(left.logic);
  const rightWords = normalizeWords(right.logic);
  return [...leftWords].filter((word) => rightWords.has(word));
}

function comparePatterns(left, right) {
  const relations = [];
  let score = 0;

  const leftMove = left.reasoning?.move || null;
  const rightMove = right.reasoning?.move || null;
  if (leftMove && leftMove === rightMove) {
    relations.push("same_reasoning_move");
    score += 6;
  }

  if (left.set_id && left.set_id === right.set_id) {
    relations.push("same_study_set");
    score += 3;
  }

  const overlap = logicOverlap(left, right);
  if (overlap.length) {
    relations.push("logic_overlap");
    score += Math.min(4, overlap.length * 2);
  }

  if (!relations.length) return null;
  return { score, relations, logic_overlap: overlap };
}

function formulaMap(pattern) {
  return Object.fromEntries((pattern.langs || []).map((language) => [language.lang, language.formula]));
}

export function buildPatternGraph(patterns, { maxRelated = 4, siteUrl = "https://metkagram.github.io", patternPathFor = patternPath } = {}) {
  const publicPatterns = patterns
    .filter((pattern) => pattern?.id && pattern.reasoning?.move)
    .sort((left, right) => left.id.localeCompare(right.id));
  const ids = new Set();
  for (const pattern of publicPatterns) {
    if (ids.has(pattern.id)) throw new Error(`Pattern graph requires unique IDs; duplicate ${pattern.id}`);
    ids.add(pattern.id);
  }

  const relationIndex = new Map();
  for (let leftIndex = 0; leftIndex < publicPatterns.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < publicPatterns.length; rightIndex += 1) {
      const left = publicPatterns[leftIndex];
      const right = publicPatterns[rightIndex];
      const relation = comparePatterns(left, right);
      if (!relation) continue;
      relationIndex.set(`${left.id}:${right.id}`, { source: left.id, target: right.id, ...relation });
    }
  }

  const selectedEdges = new Map();
  const relatedById = new Map();
  for (const pattern of publicPatterns) {
    const candidates = [...relationIndex.values()]
      .filter((edge) => edge.source === pattern.id || edge.target === pattern.id)
      .map((edge) => ({
        id: edge.source === pattern.id ? edge.target : edge.source,
        score: edge.score,
        relations: edge.relations,
        logic_overlap: edge.logic_overlap
      }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, maxRelated);

    relatedById.set(pattern.id, candidates);
    for (const candidate of candidates) {
      const pair = [pattern.id, candidate.id].sort();
      const key = pair.join(":");
      const original = relationIndex.get(key);
      if (original) selectedEdges.set(key, original);
    }
  }

  const nodes = publicPatterns.map((pattern) => ({
    id: pattern.id,
    title_ru: pattern.title_ru,
    set_id: pattern.set_id,
    group_id: pattern.group_id,
    reasoning_move: pattern.reasoning.move,
    logic: pattern.logic || null,
    formulas: formulaMap(pattern),
    canonical_url: `${siteUrl}${patternPathFor("en", pattern)}`,
    related: relatedById.get(pattern.id) || []
  }));
  const edges = [...selectedEdges.values()].sort((left, right) => left.source.localeCompare(right.source) || left.target.localeCompare(right.target));
  const moves = [...new Set(nodes.map((node) => node.reasoning_move))].sort().map((move) => ({
    id: move,
    pattern_ids: nodes.filter((node) => node.reasoning_move === move).map((node) => node.id)
  }));

  return {
    schema_version: 1,
    kind: "metkagram-public-pattern-graph",
    derivation: "taxonomy-derived",
    description: "A bounded public graph connecting reusable language patterns by explicit reasoning move, study set and shared logic vocabulary.",
    node_count: nodes.length,
    edge_count: edges.length,
    move_count: moves.length,
    nodes,
    edges,
    moves
  };
}

export function relatedPatternIds(graph, patternId) {
  return graph.nodes.find((node) => node.id === patternId)?.related?.map((item) => item.id) || [];
}
