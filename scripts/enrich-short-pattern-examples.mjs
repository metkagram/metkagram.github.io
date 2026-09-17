// Historical cleanup migration.
//
// This script used to append generic second sentences to short pattern examples
// purely to reach a word-count target. Those follow-ups were repetitive and
// often unrelated to the pattern itself. Keep the filename for compatibility,
// but the old enrichment behavior is retired permanently.
import { cleanPatternGeneratedFollowUps } from "../src/pattern-example-quality.mjs";
import { loadEditorialCorpus, writePatternCorpus } from "../src/pattern-sources.mjs";

const { patterns, setOrder } = loadEditorialCorpus(process.cwd());

let removed = 0;
let changedPatterns = 0;

for (const pattern of patterns) {
  const patternRemoved = cleanPatternGeneratedFollowUps(pattern);
  if (patternRemoved > 0) {
    removed += patternRemoved;
    changedPatterns += 1;
  }
}

writePatternCorpus(patterns, { setOrder });
console.log(`Removed ${removed} generated follow-up sentences from ${changedPatterns} canonical patterns.`);
