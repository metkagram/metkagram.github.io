import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { loadFrameFamilies, validateFrameFamilies } from "../src/frame-families.mjs";

export function main() {
  const content = loadContent();
  const manifest = validateFrameFamilies(content.advancedPatterns, loadFrameFamilies());
  const patternCount = new Set(manifest.families.flatMap((family) => family.member_pattern_ids)).size;
  console.log(`Frame family validation passed: ${manifest.families.length} reviewed pilots / ${patternCount} Pattern records.`);
  return manifest;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
