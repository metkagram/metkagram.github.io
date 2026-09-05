import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { loadPatternShards, patternShardPath, PATTERN_SHARD_DIR, writePatternCorpus } from "../src/pattern-sources.mjs";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "pattern-corpus-baseline.json"), "utf8"));

function studySetOrder() {
  const studySets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "study-sets.json"), "utf8"));
  return studySets.sets.map((set) => set.id);
}

function writeShard(root, setId, patterns, { fileName = `${setId}.json`, schemaVersion = 1 } = {}) {
  const directory = path.join(root, PATTERN_SHARD_DIR);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, fileName), JSON.stringify({ schemaVersion, set_id: setId, patterns }));
}

test("every shard loads with preserved identities after editorial repair", () => {
  const { patterns, shards } = loadPatternShards({ setOrder: studySetOrder() });
  assert.equal(shards.size, Object.keys(baseline.basePatterns.setCounts).length, "one shard per study set with base patterns");
  assert.equal(patterns.length, baseline.basePatterns.count, "base pattern count parity");
  const ids = patterns.map((pattern) => pattern.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate pattern id survived sharding");
  assert.equal(sha([...ids].sort().join("\n")), baseline.basePatterns.sortedIdSha256, "stable ID set parity");
  // Content hashes in the migration snapshot are historical. Editorial repairs
  // are allowed; curriculum-preservation.test.mjs protects IDs, membership and URLs.
  const setCounts = {};
  for (const pattern of patterns) setCounts[pattern.set_id] = (setCounts[pattern.set_id] || 0) + 1;
  assert.deepEqual(Object.fromEntries(Object.entries(setCounts).sort()), baseline.basePatterns.setCounts, "per-set membership parity");
});

test("reconstruction is deterministic and follows the study-set order", () => {
  const setOrder = studySetOrder();
  const first = loadPatternShards({ setOrder });
  const second = loadPatternShards({ setOrder });
  assert.equal(JSON.stringify(first.patterns), JSON.stringify(second.patterns), "two loads must produce identical arrays");
  const seen = new Set();
  let previousRank = -1;
  for (const pattern of first.patterns) {
    const rank = setOrder.indexOf(pattern.set_id);
    assert.ok(rank >= previousRank, `pattern ${pattern.id} of set ${pattern.set_id} is out of study-set order`);
    if (rank !== previousRank) {
      assert.ok(!seen.has(pattern.set_id), `set ${pattern.set_id} appears twice in the reconstruction`);
      seen.add(pattern.set_id);
      previousRank = rank;
    }
  }
});

test("loadContent preserves merged curriculum counts and reasoning assignments", () => {
  const content = loadContent();
  const patterns = content.advancedPatterns;
  assert.equal(patterns.length, baseline.mergedCorpus.patternCount, "merged pattern count parity");
  assert.equal(content.studySets.sets.length, baseline.mergedCorpus.studySetCount, "study-set count parity");
  assert.equal(patterns.filter((pattern) => pattern.reasoning?.move).length, baseline.mergedCorpus.reasoningMoveCount, "Move assignment parity");
});

test("canonical pattern routes are unchanged by sharding", () => {
  const content = loadContent();
  const routes = content.advancedPatterns.map((pattern) => `${pattern.id}:${patternPath("en", pattern)}`).sort().join("\n");
  assert.equal(sha(routes), baseline.mergedCorpus.idRouteSha256, "stable ID → canonical route mapping drifted");
});

test("duplicate pattern IDs across shards are rejected", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "metkagram-shards-"));
  const pattern = (id, setId) => ({ id, set_id: setId, title_ru: "x", group_id: "g", langs: [] });
  writeShard(fixture, "AAA", [pattern("P1", "AAA")]);
  writeShard(fixture, "BBB", [pattern("P1", "BBB")]);
  assert.throws(() => loadPatternShards({ root: fixture, setOrder: ["AAA", "BBB"] }), /duplicate pattern id P1/i);
  fs.rmSync(fixture, { recursive: true, force: true });
});

test("malformed and misplaced shards are rejected", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "metkagram-shards-"));
  const pattern = { id: "P1", set_id: "AAA", title_ru: "x", group_id: "g", langs: [] };
  writeShard(fixture, "AAA", [pattern], { fileName: "WRONG.json" });
  assert.throws(() => loadPatternShards({ root: fixture, setOrder: ["AAA"] }), /file name must match set_id/);

  fs.rmSync(path.join(fixture, PATTERN_SHARD_DIR), { recursive: true, force: true });
  writeShard(fixture, "AAA", [{ ...pattern, set_id: "BBB" }]);
  assert.throws(() => loadPatternShards({ root: fixture, setOrder: ["AAA"] }), /outside shard AAA/);

  fs.rmSync(path.join(fixture, PATTERN_SHARD_DIR), { recursive: true, force: true });
  writeShard(fixture, "ZZZ", [pattern]);
  assert.throws(() => loadPatternShards({ root: fixture, setOrder: ["AAA"] }), /unknown study set ZZZ/);
  fs.rmSync(fixture, { recursive: true, force: true });
});

test("writePatternCorpus round-trips through loadPatternShards", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "metkagram-shards-"));
  const { patterns } = loadPatternShards({ setOrder: studySetOrder() });
  const setOrder = studySetOrder();
  writePatternCorpus(patterns, { root: fixture, setOrder });
  const rebuilt = loadPatternShards({ root: fixture, setOrder });
  assert.equal(JSON.stringify(rebuilt.patterns), JSON.stringify(patterns), "shard round-trip must be lossless");
  assert.ok(fs.existsSync(patternShardPath("CND", fixture)), "expected per-set shard file");
  fs.rmSync(fixture, { recursive: true, force: true });
});

test("the removed monolith is no longer a source anyone can mistake for canonical", () => {
  assert.ok(!fs.existsSync(path.join(ROOT, "data", "advanced-patterns.json")), "the monolith must stay deleted; edit data/patterns/<SET>.json instead");
  assert.ok(fs.existsSync(path.join(ROOT, PATTERN_SHARD_DIR)), "canonical shard directory must exist");
});
