import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { validateStudySetPreservation } from "../src/study-set-preservation.mjs";

export function main() {
  const summary = validateStudySetPreservation(loadContent());
  console.log(`Study-set preservation passed: ${summary.establishedCount} established, ${summary.currentCount} current, ${summary.additiveSetIds.length} additive.`);
  return summary;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
