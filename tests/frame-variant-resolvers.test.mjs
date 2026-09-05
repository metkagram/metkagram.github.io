import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");
const json = (...parts) => JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));

test("relation-driven Lens, Map, Contrasts, Choice and Routes preserve Pattern refs and expose canonical Frame resolution", () => {
  const relations = json("data", "pattern-relations.json");
  const index = json("data", "domain", "pattern-index.json");
  const byPattern = new Map(index.items.map((record) => [record.pattern_id, record]));

  assert.match(relations.canonicalFrameResolver.pattern_index, /pattern-index\.json$/);
  assert.match(relations.canonicalFrameResolver.canonical_frames, /canonical-frames\.json$/);
  assert.match(relations.canonicalFrameResolver.frame_variants, /frame-variants\.json$/);

  for (const [patternId, relation] of Object.entries(relations.byPattern)) {
    const record = byPattern.get(patternId);
    assert.ok(record, `${patternId} in relation layer must remain a stable Pattern reference`);
    assert.deepEqual(relation.domain_model.frame_ids, record.frame_ids);
    assert.deepEqual(relation.domain_model.canonical_frame_ids, record.canonical_frame_ids);
    assert.deepEqual(relation.domain_model.frame_variant_ids, record.frame_variant_ids);
  }
});

test("Pattern Atlas and discovery surfaces publish the same canonical Frame resolver", () => {
  const discovery = json("data", "discovery.json");
  assert.match(discovery.canonicalFrameResolver.pattern_index, /pattern-index\.json$/);
  assert.match(discovery.canonicalFrameResolver.canonical_frames, /canonical-frames\.json$/);
  assert.match(discovery.canonicalFrameResolver.frame_variants, /frame-variants\.json$/);
});

test("Pattern Bridge retains reviewed legacy Frame refs and adds canonical Frame refs", () => {
  const bridges = json("data", "domain", "bridges.json");
  const frames = json("data", "domain", "frames.json");
  const canonicalFrames = json("data", "domain", "canonical-frames.json");
  const resolvable = new Set([...frames.items.map((frame) => frame.id), ...canonicalFrames.items.map((frame) => frame.id)]);

  for (const bridge of bridges.items) {
    assert.ok(resolvable.has(bridge.from_frame_id));
    assert.ok(resolvable.has(bridge.to_frame_id));
    assert.ok(resolvable.has(bridge.from_canonical_frame_id));
    assert.ok(resolvable.has(bridge.to_canonical_frame_id));
    assert.equal(bridge.review_status, "reviewed");
  }
});
