import { loadEditorialCorpus } from "../src/pattern-sources.mjs";
import {
  measurePatternExampleDiversity,
  patternExampleDiversityProblems
} from "../src/pattern-example-quality.mjs";

const { patterns } = loadEditorialCorpus(process.cwd());
const c1Patterns = patterns.filter((pattern) => /^C1[A-Z]+\d+$/.test(pattern.id));
const failures = [];

for (const pattern of c1Patterns) {
  for (const language of pattern.langs || []) {
    const problems = patternExampleDiversityProblems(language);
    if (!problems.length) continue;
    failures.push({
      pattern: pattern.id,
      language: language.lang,
      problems,
      metrics: measurePatternExampleDiversity(language)
    });
  }
}

if (failures.length) {
  console.error(JSON.stringify({ checkedPatterns: c1Patterns.length, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`C1 example diversity OK: ${c1Patterns.length} patterns checked across English and German.`);
}
