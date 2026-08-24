// Stage 1 — source/load. Prepares a clean output tree and regenerates the
// canonical release artifacts (CITATION.cff, public/rights.json) from
// src/release.mjs before anything reads or copies them.
//
// Inputs: data/, src/, public/, package.json, CITATION.cff sources of truth.
// Output: empty dist/, regenerated CITATION.cff + public/rights.json.
import fs from "node:fs";
import path from "node:path";
import { writeReleaseMetadata } from "../release-metadata.mjs";

const ROOT = process.cwd();

export function runSourceStage(root = ROOT) {
  fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
  writeReleaseMetadata(root);
  console.log("[build:source] clean dist/; regenerated CITATION.cff and public/rights.json from src/release.mjs");
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runSourceStage();
}
