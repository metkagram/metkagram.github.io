// Post-build release contracts: validation only.
//
// Semantic release, rights and language-capability state is resolved before
// rendering (src/release.mjs, src/i18n.mjs and the page sources). This script
// never rewrites generated HTML; it fails the build when the rendered output
// drifts from the canonical state or when superseded copy reappears.
import fs from "node:fs";
import path from "node:path";
import { releaseLabel } from "../src/i18n.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const DIST = path.resolve("dist");
const releaseMonth = SITE_RELEASE_DATE.slice(0, 7);

// [file, required substrings, forbidden superseded substrings]
const contracts = [
  ["en/index.html",
    ["a large B2–C1 pattern catalogue, Thinking in Language sets, and a bounded French Frame-only pilot"],
    ["dialogues, reference collections, a notation guide", "open, machine-readable research resource", "free for personal, educational and other non-commercial use"]],
  ["ru/index.html",
    ["ограниченный французский Frame-only пилот без заявлений о французской разметке или интерфейсе"],
    ["Токеновая разметка — открытый машиночитаемый ресурс", "бесплатны для некоммерческого использования"]],
  ["en/roadmap/index.html",
    [releaseLabel("en"), `datetime="${releaseMonth}"`, "French Frame-only pilot; Thinking in Language"],
    ["Current release · July 2026", 'datetime="2026-07"']],
  ["ru/roadmap/index.html",
    [releaseLabel("ru"), `datetime="${releaseMonth}"`, "французский Frame-only пилот"],
    ["Текущий релиз · июль 2026", 'datetime="2026-07"']],
  ["en/support/index.html",
    ["without inventing traction claims"],
    []],
  ["ru/support/index.html",
    ["без выдуманных заявлений об аудитории или результатах"],
    []],
  ["en/apps/index.html",
    ["The mobile app became a research stage."],
    ["The mobile stage is complete."]],
  ["ru/apps/index.html",
    ["Мобильное приложение стало этапом исследования."],
    ["Мобильный этап завершён."]],
];

const failures = [];
for (const [relative, required, forbidden] of contracts) {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) {
    failures.push(`${relative}: missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  for (const needle of required) {
    if (!html.includes(needle)) failures.push(`${relative}: expected copy missing: "${needle.slice(0, 72)}…"`);
  }
  for (const needle of forbidden) {
    if (html.includes(needle)) failures.push(`${relative}: superseded copy present: "${needle.slice(0, 72)}…"`);
  }
}

if (failures.length) {
  throw new Error(`Release contracts violated:\n- ${failures.join("\n- ")}`);
}

console.log(`Release contracts validated (${contracts.length} pages).`);
