// Stage 6 — audit. Read-only checks over the finished dist/ output. Scripts in
// this stage must not write to dist/ (tests/build-stages.test.mjs enforces it):
// semantic state is decided before and during rendering, never after.
import path from "node:path";
import { runStage } from "./run.mjs";

export const AUDIT_STEPS = [
  // Archived mobile apps: no store promotion or MobileApplication schema anywhere.
  "scripts/archive-mobile.mjs",
  // Release contracts: rendered pages match the canonical release/rights state.
  "scripts/release-contracts.mjs",
  // Internal links and obsolete-route references.
  "scripts/check-links.mjs",
  // Sitemap/canonical/JSON-LD graph integrity.
  "scripts/seo-graph-audit.mjs",
];

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runStage("audit", AUDIT_STEPS);
}
