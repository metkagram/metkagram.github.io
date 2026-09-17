import { loadEditorialCorpus, writePatternCorpus } from "../src/pattern-sources.mjs";

const MIN_EXAMPLES = 5;
const MAX_EXAMPLES = 7;

const { patterns, setOrder } = loadEditorialCorpus(process.cwd());
const insufficient = [];
let trimmedLanguages = 0;
let removedExamples = 0;

for (const pattern of patterns) {
  for (const language of pattern.langs || []) {
    const examples = Array.isArray(language.examples) ? language.examples : [];

    if (examples.length < MIN_EXAMPLES) {
      insufficient.push(`${pattern.set_id}/${pattern.id}/${language.lang}: ${examples.length}`);
      continue;
    }

    if (examples.length > MAX_EXAMPLES) {
      removedExamples += examples.length - MAX_EXAMPLES;
      language.examples = examples.slice(0, MAX_EXAMPLES);
      trimmedLanguages += 1;
    }
  }
}

if (insufficient.length > 0) {
  throw new Error(
    `Cannot normalize pattern examples: ${insufficient.length} language records contain fewer than ${MIN_EXAMPLES} examples:\n${insufficient.join("\n")}`
  );
}

writePatternCorpus(patterns, { setOrder });
console.log(
  `Normalized ${trimmedLanguages} language example arrays to at most ${MAX_EXAMPLES} examples; removed ${removedExamples} surplus examples.`
);
