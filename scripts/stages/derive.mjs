// Stage 3 — derive. Deterministic secondary artifacts computed from validated
// canonical data, before any page rendering. Scripts here must not read
// rendered HTML.
import path from "node:path";
import { runStage } from "./run.mjs";

export const DERIVE_STEPS = [
  // Pattern Lens rule configuration: pure serialization of src/ rule modules.
  "scripts/pattern-lens-rules.mjs",
  // Corpus-wide editorial quality audit over canonical Pattern/Frame data.
  "scripts/frame-quality-audit.mjs",
  // Exact legacy identity/URL protection and bounded multilingual diagnostics.
  "scripts/audit-corpus.mjs",
];

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runStage("derive", DERIVE_STEPS);
}
