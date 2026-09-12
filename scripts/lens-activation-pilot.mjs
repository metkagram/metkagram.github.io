import fs from "node:fs";
import path from "node:path";
import {
  aggregateLensActivationPilot,
  renderLensActivationMarkdown,
  validateLearningActivityBundle,
} from "../src/lens-activation-metrics.mjs";

const ROOT = process.cwd();

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function usage() {
  console.error("Usage: node scripts/lens-activation-pilot.mjs --input <export.json|directory> [--out-dir <directory>] [--repeat-after-days <n>]");
}

function inputFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return [inputPath];
  if (!stat.isDirectory()) throw new Error("--input must be a JSON file or directory");
  return fs.readdirSync(inputPath)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort()
    .map((name) => path.join(inputPath, name));
}

const inputArg = arg("--input");
if (!inputArg) {
  usage();
  process.exit(1);
}

const inputPath = path.resolve(ROOT, inputArg);
const outDir = path.resolve(ROOT, arg("--out-dir", "reports/lens-activation/private"));
const repeatAfterDays = Number(arg("--repeat-after-days", "2"));
if (!Number.isFinite(repeatAfterDays) || repeatAfterDays < 0) throw new Error("--repeat-after-days must be a finite number >= 0");

const files = inputFiles(inputPath);
if (!files.length) throw new Error("No JSON participant exports found");
const bundles = files.map((file) => validateLearningActivityBundle(JSON.parse(fs.readFileSync(file, "utf8"))));
const report = aggregateLensActivationPilot(bundles, { repeatAfterDays });

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "lens-activation.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "lens-activation.md"), renderLensActivationMarkdown(report));

console.log(`Lens activation pilot: ${report.participant_count} participant export(s).`);
console.log(`Useful Reuse Sessions: ${report.sessions.useful_reuse_sessions}/${report.sessions.lens_sessions} Lens sessions.`);
console.log(`Repeat pull after ${report.repeat_after_days} day(s): ${report.repeat_pull.participants}/${report.first_session_funnel.analysis_started} participants with Lens analysis.`);
console.log(`Aggregate report written to ${path.relative(ROOT, outDir)}/; participant files and identifiers are not copied into the report.`);
