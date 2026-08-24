// One-off migration for issue #71: split the monolithic
// data/advanced-patterns.json into per-study-set shards under data/patterns/.
//
// Usage: node scripts/migrate-pattern-shards.mjs
// The monolith is not deleted here — remove it with git rm after the
// reconstruction check below has passed.
//
// Parity contract: every pattern record survives byte-identically, within-set
// relative order is preserved, and global reconstruction follows the canonical
// study-set order (the legacy monolith interleaved a few sets; that accidental
// ordering is normalized, not preserved).
import fs from "node:fs";
import path from "node:path";
import { loadPatternShards, writePatternCorpus } from "../src/pattern-sources.mjs";
import { stableHash } from "../src/provenance.mjs";

const ROOT = process.cwd();
const MONOLITH = path.join(ROOT, "data", "advanced-patterns.json");

function main() {
  if (!fs.existsSync(MONOLITH)) throw new Error("data/advanced-patterns.json is already removed; nothing to migrate");
  const monolith = JSON.parse(fs.readFileSync(MONOLITH, "utf8"));
  if (!Array.isArray(monolith)) throw new Error("data/advanced-patterns.json must be an array");

  const studySets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "study-sets.json"), "utf8"));
  const setOrder = studySets.sets.map((set) => set.id);

  const written = writePatternCorpus(monolith, { setOrder });
  const { patterns: rebuilt } = loadPatternShards({ setOrder });

  const byId = new Map(monolith.map((pattern) => [pattern.id, pattern]));
  const failures = [];
  if (rebuilt.length !== monolith.length) failures.push(`count: ${monolith.length} -> ${rebuilt.length}`);
  for (const pattern of rebuilt) {
    const original = byId.get(pattern.id);
    if (!original) {
      failures.push(`unexpected pattern ${pattern.id}`);
      continue;
    }
    if (stableHash(original) !== stableHash(pattern)) failures.push(`record content changed: ${pattern.id}`);
  }
  // Within-set relative order must be preserved exactly.
  const monolithOrder = new Map();
  for (const pattern of monolith) {
    if (!monolithOrder.has(pattern.set_id)) monolithOrder.set(pattern.set_id, []);
    monolithOrder.get(pattern.set_id).push(pattern.id);
  }
  const rebuiltOrder = new Map();
  for (const pattern of rebuilt) {
    if (!rebuiltOrder.has(pattern.set_id)) rebuiltOrder.set(pattern.set_id, []);
    rebuiltOrder.get(pattern.set_id).push(pattern.id);
  }
  for (const [setId, ids] of monolithOrder) {
    if (JSON.stringify(ids) !== JSON.stringify(rebuiltOrder.get(setId) || [])) failures.push(`within-set order changed for ${setId}`);
  }

  if (failures.length) throw new Error(`Migration parity failed:\n- ${failures.join("\n- ")}`);
  console.log(`Migrated ${monolith.length} patterns into ${written.length} shards under data/patterns/.`);
  console.log("Parity: record-for-record identical, within-set order preserved; global order now follows study-sets.json.");
  console.log("Next: git rm data/advanced-patterns.json");
}

main();
