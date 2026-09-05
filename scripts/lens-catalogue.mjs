import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../src/content.mjs";
import { buildLensCatalogueSelection, LENS_INLINE_STARTER_LIMIT } from "../src/lens-catalogue.mjs";
import { patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function writeDist(relativePath, content) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content);
}

function browserRecord(pattern) {
  return {
    id: pattern.id,
    reasoning_move: pattern.reasoning?.move || null,
    page_urls: {
      en: patternUrl("en", pattern),
      ru: patternUrl("ru", pattern),
    },
    langs: pattern.langs
      .filter((lang) => ["en", "de"].includes(lang.lang))
      .map((lang) => ({
        lang: lang.lang,
        formula: lang.formula,
        example: lang.example,
        translation: lang.translation,
      })),
  };
}

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value = "") {
  return escapeAttribute(value).replaceAll("'", "&#039;");
}

function patchLensPage(locale, catalogue) {
  const file = path.join(DIST, locale, "lens", "index.html");
  let html = fs.readFileSync(file, "utf8");
  const payloadPattern = /<script type="application\/json" id="pattern-lens-data">([^<]+)<\/script>/;
  const match = html.match(payloadPattern);
  if (!match) throw new Error(`Pattern Lens payload not found in ${file}`);
  const payload = JSON.parse(match[1]);
  payload.catalogue = catalogue.slice(0, LENS_INLINE_STARTER_LIMIT);
  const serialized = JSON.stringify(payload).replaceAll("<", "\\u003c");
  html = html.replace(payloadPattern, `<script type="application/json" id="pattern-lens-data">${serialized}</script>`);

  const samples = catalogue
    .flatMap((pattern) => pattern.langs.filter((lang) => lang.lang === "en").map((lang) => lang.example))
    .filter(Boolean)
    .slice(0, 3);
  const sampleMarkup = `<div class="lens-samples" aria-label="Examples">\n      ${samples.map((sample) => `<button type="button" data-lens-sample="${escapeAttribute(sample)}">${escapeText(sample)}</button>`).join("")}\n    </div>`;
  if (!/<div class="lens-samples" aria-label="Examples">[\s\S]*?<\/div>/.test(html)) {
    throw new Error(`Pattern Lens samples container not found in ${file}`);
  }
  html = html.replace(/<div class="lens-samples" aria-label="Examples">[\s\S]*?<\/div>/, sampleMarkup);
  fs.writeFileSync(file, html);
}

function patchCatalog(report) {
  const file = path.join(DIST, "data", "catalog.json");
  if (!fs.existsSync(file)) return;
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  catalog.patternLensCatalogue = {
    selectionPolicy: report.selectionPolicy,
    catalogueCount: report.catalogueCount,
    catalogueLimit: report.catalogueLimit,
    coverageReport: "/data/pattern-lens-coverage.json",
  };
  fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}

export function buildLensCatalogue() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the base render first.");
  const content = loadContent();
  const { patterns, report } = buildLensCatalogueSelection(content, ROOT);
  const catalogue = patterns.map(browserRecord);

  writeDist("data/pattern-lens-patterns.json", `${JSON.stringify(catalogue)}\n`);
  writeDist("data/pattern-lens-coverage.json", `${JSON.stringify(report, null, 2)}\n`);
  for (const locale of ["en", "ru"]) patchLensPage(locale, catalogue);
  patchCatalog(report);

  console.log(`Pattern Lens catalogue: ${catalogue.length} job-balanced Frames across ${report.coverage.coveredLearnerJobCount}/${report.coverage.learnerJobCount} learner jobs.`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) buildLensCatalogue();
