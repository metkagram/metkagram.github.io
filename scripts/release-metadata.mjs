// Regenerates the committed release artifacts from the canonical release state
// (src/release.mjs): root CITATION.cff and public/rights.json. Runs at the start
// of the build so dist/ always ships the current canonical metadata.
import fs from "node:fs";
import path from "node:path";
import { citationCff, rightsJson } from "../src/release.mjs";

const ROOT = process.cwd();

export function writeReleaseMetadata(root = ROOT) {
  const citation = citationCff();
  fs.writeFileSync(path.join(root, "CITATION.cff"), citation);
  const rights = `${JSON.stringify(rightsJson(), null, 2)}\n`;
  fs.writeFileSync(path.join(root, "public", "rights.json"), rights);
  return { citation, rights };
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  writeReleaseMetadata();
  console.log("Release metadata regenerated: CITATION.cff, public/rights.json");
}
