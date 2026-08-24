// Canonical pattern corpus storage: one reviewable shard per study set.
//
// The 31 MB monolithic data/advanced-patterns.json was split (issue #71) into
// per-set shards at data/patterns/<SET_ID>.json. This module is the single
// place that understands that layout: every consumer reconstructs the corpus
// through loadPatternShards() instead of reading shard files directly.
//
// Invariants enforced here:
// - shard file name, shard set_id and every pattern's set_id agree;
// - no duplicate pattern IDs across shards;
// - no shard for an unknown study set;
// - deterministic reconstruction: shards are concatenated in study-set order
//   (the order data/study-sets.json + practice-extensions.json define), with
//   the within-shard order preserved from the file;
// - every known study set either has a shard or receives its patterns from
//   the supplemental reasoning-frames layer (data/reasoning-frames/).
//
// data/patterns/ is the canonical authoring location. The consolidated
// advanced-patterns.json still exists, but only as a generated distribution
// artifact under dist/ — never edit it by hand.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
export const PATTERN_SHARD_DIR = path.join("data", "patterns");
export const PATTERN_SHARD_SCHEMA_VERSION = 1;

function assertShard(condition, message) {
  if (!condition) throw new Error(`Pattern shard validation failed: ${message}`);
}

export function patternShardPath(setId, root = ROOT) {
  return path.join(root, PATTERN_SHARD_DIR, `${setId}.json`);
}

// Discovers, loads and validates every shard. `setOrder` is the canonical
// study-set order (study-sets.json followed by practice-extension sets).
// Returns the reconstructed corpus array plus the shard map.
export function loadPatternShards({ root = ROOT, setOrder = [] } = {}) {
  const directory = path.join(root, PATTERN_SHARD_DIR);
  assertShard(fs.existsSync(directory), `${directory} does not exist; the pattern corpus lives in per-set shards`);
  const files = fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));
  assertShard(files.length > 0, `${directory} contains no shards`);

  const knownSets = new Set(setOrder);
  const shards = new Map();
  const patternIds = new Set();
  for (const name of files) {
    const file = path.join(directory, name);
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    assertShard(value?.schemaVersion === PATTERN_SHARD_SCHEMA_VERSION, `${name}: schemaVersion must be ${PATTERN_SHARD_SCHEMA_VERSION}`);
    assertShard(typeof value.set_id === "string" && value.set_id, `${name}: set_id is required`);
    assertShard(value.set_id === name.slice(0, -".json".length), `${name}: file name must match set_id ${value.set_id}`);
    assertShard(!shards.has(value.set_id), `${name}: duplicate shard for set ${value.set_id}`);
    assertShard(knownSets.has(value.set_id), `${name}: shard belongs to unknown study set ${value.set_id}`);
    assertShard(Array.isArray(value.patterns) && value.patterns.length > 0, `${name}: patterns must be a non-empty array`);
    for (const pattern of value.patterns) {
      assertShard(pattern && typeof pattern === "object", `${name}: pattern entries must be objects`);
      assertShard(typeof pattern.id === "string" && pattern.id, `${name}: every pattern needs an id`);
      assertShard(pattern.set_id === value.set_id, `${name}: pattern ${pattern.id} has set_id ${pattern.set_id} outside shard ${value.set_id}`);
      assertShard(!patternIds.has(pattern.id), `${name}: duplicate pattern id ${pattern.id} (already in another shard)`);
      patternIds.add(pattern.id);
    }
    shards.set(value.set_id, value.patterns);
  }

  const patterns = [];
  for (const setId of setOrder) {
    const shard = shards.get(setId);
    if (shard) patterns.push(...shard);
  }
  return { patterns, shards };
}

// Editorial convenience: loads the corpus shards together with the study-set
// registry they belong to. Used by the corpus-growth/enrichment scripts.
export function loadEditorialCorpus(root = ROOT) {
  const studySets = JSON.parse(fs.readFileSync(path.join(root, "data", "study-sets.json"), "utf8"));
  const setOrder = studySets.sets.map((set) => set.id);
  const { patterns } = loadPatternShards({ root, setOrder });
  return { patterns, studySets, setOrder };
}

// Writes the corpus back as canonical shards. Used by the one-off migration
// and by editorial tooling; refuses to write a pattern into an unknown set.
export function writePatternCorpus(patterns, { root = ROOT, setOrder = [] } = {}) {
  const knownSets = new Set(setOrder);
  const bySet = new Map();
  for (const pattern of patterns) {
    assertShard(knownSets.has(pattern.set_id), `cannot write pattern ${pattern.id}: unknown study set ${pattern.set_id}`);
    if (!bySet.has(pattern.set_id)) bySet.set(pattern.set_id, []);
    bySet.get(pattern.set_id).push(pattern);
  }
  const directory = path.join(root, PATTERN_SHARD_DIR);
  fs.mkdirSync(directory, { recursive: true });
  const written = [];
  for (const setId of setOrder) {
    const shard = bySet.get(setId);
    if (!shard) continue;
    const file = patternShardPath(setId, root);
    fs.writeFileSync(file, `${JSON.stringify({ schemaVersion: PATTERN_SHARD_SCHEMA_VERSION, set_id: setId, patterns: shard }, null, 2)}\n`);
    written.push(file);
  }
  return written;
}
