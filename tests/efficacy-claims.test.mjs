import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { releaseState } from "../src/release.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

// Issue #68: method description ≠ design rationale ≠ hypothesis ≠ evidence.
// These formulations are prohibited in current public surfaces (EN + RU).
// They target outcome attribution, not confident product description.
const PROHIBITED = [
  { id: "proven-method", pattern: /\bproven (method|to improve|to boost|to increase|way to learn)/i },
  { id: "scientifically-proven", pattern: /scientifically proven/i },
  { id: "clinically-proven", pattern: /clinically (proven|tested)/i },
  { id: "improves-learning-effectiveness", pattern: /improves? (language[- ])?learning effectiveness/i },
  { id: "guaranteed-outcome", pattern: /\bguaranteed (results|improvement|learning|to learn|progress)/i },
  { id: "ru-proven-method", pattern: /доказанн(ый|ым|ая) (метод|способ)/i },
  { id: "ru-scientifically-proven", pattern: /научно доказан/i },
  { id: "ru-guaranteed-outcome", pattern: /гарантированн(ый|ое|ые|о) (результат|обучение|прогресс)/i },
  { id: "ru-improves-learning-effectiveness", pattern: /повышает эффективность (обучения|изучения)/i },
  // Quantified claims are flagged only when the sentence talks about learning
  // or memory — example sentences like "прибыль выросла на 20%" are content,
  // not efficacy marketing.
  { id: "up-to-percent", pattern: /up to \d+\s?%/i, learningContext: true },
  { id: "percent-improvement", pattern: /\b\d+\s?%\s?(faster|better|more effective|improvement)/i, learningContext: true },
  { id: "ru-percent", pattern: /на \d+\s?%/, learningContext: true },
];

const LEARNING_CONTEXT = /learn|language|retention|memor|fluent|vocabular|recall|обучен|изучен|запомн|запомин|эффективн|язык|памят|удержан/i;

// A match is allowed when its sentence explicitly negates, disclaims or
// historicises the claim ("The study did not prove improved learning
// outcomes.", "…not evidence of learning efficacy", "не является доказательством").
const ALLOWED_CONTEXT = /(\bnot\b|\bno\b|\bnever\b|\bnone\b|\bwithout\b|\bcannot\b|\bdid not\b|\bdoes not\b|unsupported|prohibited|не\s|нет\s|без\s|нельзя)/i;

function walk(directory, predicate, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, predicate, output);
    else if (entry.isFile() && predicate(entry.name)) output.push(target);
  }
  return output;
}

function efficacyOffenders(files, baseDir) {
  const offenders = [];
  for (const file of files) {
    const relative = path.relative(baseDir, file).replaceAll(path.sep, "/");
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      // Generated HTML can put several sentences on one line; evaluate each
      // sentence/tag segment separately so a disclaimer cannot whitewash a
      // neighbouring claim.
      const segments = line.split(/(?<=[.!?…])\s+|<[^>]+>/);
      for (const segment of segments) {
        for (const { id, pattern, learningContext } of PROHIBITED) {
          if (!pattern.test(segment)) continue;
          if (learningContext && !LEARNING_CONTEXT.test(segment)) continue;
          if (ALLOWED_CONTEXT.test(segment)) continue;
          offenders.push(`${relative}:${index + 1} [${id}] ${segment.trim().slice(0, 120)}`);
        }
      }
    });
  }
  return offenders;
}

// Files that generate or carry current public copy and metadata.
const PUBLIC_SOURCE_FILES = [
  "src/i18n.mjs",
  "src/render.mjs",
  "src/api.mjs",
  "src/mcp-page.mjs",
  "src/release.mjs",
  "src/content.mjs",
  "src/data-pages.mjs",
  "src/intent-pages.mjs",
  "src/discovery-pages.mjs",
  "scripts/archive-mobile.mjs",
  "scripts/benchmark-publication.mjs",
  "README.md",
  "LICENSING.md",
  "CITATION.cff",
  "public/rights.json",
].map((relative) => path.join(ROOT, relative));

test("public source copy contains no prohibited efficacy formulations", () => {
  const offenders = efficacyOffenders(
    PUBLIC_SOURCE_FILES.filter((file) => fs.existsSync(file)),
    ROOT,
  );
  assert.deepEqual(
    offenders,
    [],
    `Unsupported efficacy wording in public source copy:\n${offenders.join("\n")}\n` +
      "Rewrite as product description, design rationale, research hypothesis, or a clearly labelled historical statement.",
  );
});

test("generated public pages and manifests contain no unsupported efficacy claims", () => {
  const targets = [
    ...walk(DIST, (name) => name.endsWith(".html")),
    ...["llms.txt", "CITATION.cff", "rights.json", "project.json", "data/publication.json", "api/v1/index.json"]
      .map((relative) => path.join(DIST, relative))
      .filter((file) => fs.existsSync(file)),
  ];
  const offenders = efficacyOffenders(targets, DIST);
  assert.deepEqual(
    offenders,
    [],
    `Unsupported efficacy wording in generated output:\n${offenders.join("\n")}`,
  );
});

test("the legacy 35% store claim survives only as a labelled historical record", () => {
  const allowed = new Set([
    "docs/EXTERNAL_SURFACE_REMEDIATION.md",
    "tests/efficacy-claims.test.mjs",
  ]);
  const roots = ["src", "scripts", "docs", "public", "data"].map((dir) => path.join(ROOT, dir));
  const candidates = roots.flatMap((dir) => walk(dir, (name) => /\.(mjs|md|json|txt|cff|html)$/.test(name)));
  for (const top of ["README.md", "LICENSING.md", "ARCHITECTURE.md", "CITATION.cff"]) {
    candidates.push(path.join(ROOT, top));
  }
  const offenders = [];
  for (const file of candidates) {
    const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
    if (allowed.has(relative)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/up to 35|35\s?%/.test(text)) offenders.push(relative);
  }
  assert.deepEqual(
    offenders,
    [],
    `The legacy "up to 35%" claim appears outside the historical remediation record: ${offenders.join(", ")}`,
  );
});

test("canonical release state declares no efficacy claims", () => {
  assert.equal(releaseState().evidence.efficacyClaims, "none");
});

test("archived mobile surfaces are framed as product history", () => {
  for (const locale of ["en", "ru"]) {
    const apps = fs.readFileSync(path.join(DIST, locale, "apps", "index.html"), "utf8");
    assert.match(apps, /product history|история продукта/i, `${locale}/apps/ must present the mobile apps as product history`);
    assert.ok(apps.includes("noindex"), `${locale}/apps/ must stay noindex`);
    const history = fs.readFileSync(path.join(DIST, locale, "history", "index.html"), "utf8");
    assert.match(history, /product history|истори/i, `${locale}/history/ must frame the mobile stage as history`);
  }
});

test("external remediation record documents the Google Play owner action", () => {
  const record = fs.readFileSync(path.join(ROOT, "docs", "EXTERNAL_SURFACE_REMEDIATION.md"), "utf8");
  assert.ok(record.includes("https://play.google.com/store/apps/details?id=app.metkagram.android"));
  assert.ok(record.includes("Owner action"), "remediation record must state the owner action");
  assert.ok(/captured 2026-08-24/.test(record), "remediation record must date the captured claim");
});
