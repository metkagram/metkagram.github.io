import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE,
  PUBLIC_LEARNING_STRENGTHS,
  PUBLIC_LEARNING_STRENGTH_RANK,
  publicLearningRules,
} from "../src/public-learning.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUTPUT = path.join(DIST, "data", "pattern-lens-rules.json");

export function exportPatternLensRules() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the main build first.");
  const payload = {
    schema_version: 2,
    max_links_per_sentence: PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE,
    relation_strengths: PUBLIC_LEARNING_STRENGTHS,
    strength_rank: PUBLIC_LEARNING_STRENGTH_RANK,
    score_policy: "Categorical editorial strength, not probability or statistical confidence.",
    rules: publicLearningRules.map((item) => ({
      id: item.id,
      language: item.language,
      pattern: item.match.source,
      flags: item.match.flags,
      reasoning_move: item.move,
      intent_id: item.intent_id,
      pattern_id: item.pattern_id,
      strength: item.strength,
      scope: item.scope,
      evidence: item.evidence,
      priority: item.priority,
    })),
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Pattern Lens rules exported: ${payload.rules.length} deterministic cues.`);
  return payload;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) exportPatternLensRules();
