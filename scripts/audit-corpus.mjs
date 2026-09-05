import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { auditCorpus, checkCurriculumPreservation, renderCorpusAuditMarkdown } from "../src/corpus-audit.mjs";

const options = {
  json: "dist/data/quality/corpus-audit.json",
  markdown: "dist/data/quality/corpus-audit.md",
  baseline: "data/curriculum-preservation.json"
};
const args = process.argv.slice(2);
let checkPreservationOnly = false;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--help") {
    console.log("Usage: node scripts/audit-corpus.mjs [--json PATH] [--markdown PATH] [--baseline PATH] [--check-preservation-only]\nRuns against loadContent(); writes deterministic reports. Preservation violations exit 1; language candidates do not. --check-preservation-only writes no files. No baseline refresh or automatic edits.");
    process.exit(0);
  }
  if (arg === "--check-preservation-only") { checkPreservationOnly = true; continue; }
  const key = arg.replace(/^--/u, "");
  if (!arg.startsWith("--") || !Object.hasOwn(options, key) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Unknown or incomplete argument: ${arg}`);
  options[key] = args[++index];
}

// Do not allow a typo to replace the protection baseline or another output.
const paths = Object.fromEntries(Object.entries(options).map(([key, file]) => [key, path.resolve(file)]));
if (new Set(Object.values(paths)).size !== 3) throw new Error("JSON, Markdown and baseline paths must be different");
const content = loadContent();
const registry = JSON.parse(fs.readFileSync("data/seo-slugs.json", "utf8"));
const baseline = JSON.parse(fs.readFileSync(paths.baseline, "utf8"));
const preservation = checkCurriculumPreservation(content, registry, baseline);
if (checkPreservationOnly) {
  console.log(`Curriculum preservation ${preservation.passed ? "PASS" : "FAIL"}: ${preservation.protected_set_count} sets / ${preservation.protected_pattern_count} patterns protected.`);
  if (!preservation.passed) console.error(JSON.stringify(preservation.errors, null, 2));
  process.exit(preservation.passed ? 0 : 1);
}
const report = auditCorpus(content, { preservation });
for (const file of [paths.json, paths.markdown]) fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(paths.json, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(paths.markdown, renderCorpusAuditMarkdown(report));
console.log(`Corpus audit: ${report.summary.pattern_count} records / ${report.summary.set_count} sets; ${report.summary.candidate_finding_count} review candidates; preservation ${preservation.passed ? "PASS" : "FAIL"}.`);
console.log(`JSON: ${options.json}\nMarkdown: ${options.markdown}`);
if (!preservation.passed) process.exitCode = 1;
