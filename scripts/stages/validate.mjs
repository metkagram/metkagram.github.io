// Stage 2 — validate. Canonical semantic state is validated before any
// rendering: content, annotations, release/rights metadata, language
// capabilities and all feature source datasets. Scripts in this stage must
// not read dist/; a failure here means the renderer never sees invalid data.
import path from "node:path";
import { runStage } from "./run.mjs";

export const VALIDATE_STEPS = ["scripts/validate-sources.mjs"];

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runStage("validate", VALIDATE_STEPS);
}
