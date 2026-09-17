import fs from "node:fs";
import path from "node:path";

import { buildStructuralDuplicateReport } from "./pattern-structural-dedupe-audit.mjs";

const ROOT = process.cwd();
const output = path.join(ROOT, "data", "pattern-aliases.json");

const report = buildStructuralDuplicateReport();
const manifest = {
  schemaVersion: 1,
  policy: "one-reusable-frame-one-canonical-pattern",
  generatedFrom: "deterministic EN+DE structural signatures within the same study set and pattern group",
  generatedOn: new Date().toISOString().slice(0, 10),
  activePatternCountBeforeCanonicalization: report.pattern_count,
  canonicalPatternCount: report.estimated_canonical_pattern_count,
  aliasCount: report.removable_alias_count,
  groups: report.groups.map((group) => ({
    canonical_id: group.canonical_id,
    alias_ids: group.aliases,
    set_id: group.set_id,
    group_id: group.group_id,
    structural_signature: group.signature,
    example_overlap: group.example_overlap,
    reason: "same_reusable_frame_contextual_realization",
  })),
};

fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, output)}: ${manifest.canonicalPatternCount} canonical patterns, ${manifest.aliasCount} aliases in ${manifest.groups.length} groups.`);
