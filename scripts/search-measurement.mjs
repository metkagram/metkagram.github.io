import fs from "node:fs";
import path from "node:path";
import { buildSearchMeasurementReport, renderSearchMeasurementMarkdown } from "../src/search-measurement.mjs";

const ROOT = process.cwd();

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const inputArg = arg("--input");
if (!inputArg) {
  console.error("Usage: node scripts/search-measurement.mjs --input <aggregate.json> [--out-dir <directory>]");
  process.exit(1);
}

const inputPath = path.resolve(ROOT, inputArg);
const outDir = path.resolve(ROOT, arg("--out-dir", "reports/search-measurement/private"));
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const report = buildSearchMeasurementReport(payload);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "search-opportunities.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "search-opportunities.md"), renderSearchMeasurementMarkdown(report));

console.log(`Search measurement: ${report.totals.pages} pages, ${report.totals.impressions} impressions, ${report.totals.clicks} clicks.`);
console.log(`Decision queue: improve=${report.actionCounts.improve}, expand=${report.actionCounts.expand}, consolidate=${report.actionCounts.consolidate}, noindex=${report.actionCounts.noindex}, observe=${report.actionCounts.observe}.`);
console.log(`Report written to ${path.relative(ROOT, outDir)}/`);
