import fs from "node:fs";

const file = "scripts/canonical-frame-variants.mjs";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing expected canonical-frame-variants.mjs fragment:\n${before}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Expected exactly one canonical-frame-variants.mjs fragment:\n${before}`);
  source = source.replace(before, after);
}

replaceOnce(
  'import { buildDomainModel, DOMAIN_MODEL_VERSION } from "../src/domain-model.mjs";\n',
  'import { loadContent } from "../src/content.mjs";\nimport { buildDomainModel, DOMAIN_MODEL_VERSION } from "../src/domain-model.mjs";\n',
);

replaceOnce(
  '      let page = fs.readFileSync(file, "utf8");\n      if (page.includes("data-canonical-frame-family")) continue;\n',
  '      let page = fs.readFileSync(file, "utf8");\n      if (page.includes(\'<meta http-equiv="refresh"\') || page.includes("data-canonical-frame-family")) continue;\n',
);

replaceOnce(
  '  const patterns = readJson(path.join(DIST, "data", "advanced-patterns.json"));\n',
  '  const patterns = loadContent().advancedPatterns;\n',
);

fs.writeFileSync(file, source);
console.log("Kept canonical Frame/domain compatibility on the full source corpus while skipping alias redirect pages.");
