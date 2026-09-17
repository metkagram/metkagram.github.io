import fs from "node:fs";

const file = "scripts/connectivity.mjs";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing expected connectivity.mjs fragment:\n${before}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Expected exactly one connectivity.mjs fragment:\n${before}`);
  source = source.replace(before, after);
}

replaceOnce(
  'import { patternPath } from "../src/seo-slugs.mjs";\n',
  'import { patternPath } from "../src/seo-slugs.mjs";\nimport { canonicalPracticePatterns, loadPatternAliases } from "../src/pattern-aliases.mjs";\n',
);

replaceOnce(
  '  const content = loadContent();\n  const graph = buildGraph(content);\n  writeGraph(graph);\n  updateHtml(content, graph);\n',
  '  const content = loadContent();\n  const publicContent = { ...content, advancedPatterns: canonicalPracticePatterns(content.advancedPatterns, loadPatternAliases()) };\n  const graph = buildGraph(publicContent);\n  writeGraph(graph);\n  updateHtml(publicContent, graph);\n',
);

fs.writeFileSync(file, source);
console.log("Applied canonical public Pattern set to connectivity generation.");
