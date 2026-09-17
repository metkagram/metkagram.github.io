import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "reports", "redesign-baseline.json"), "utf8"));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uniqueCues(record) {
  const cues = new Set();
  for (const lang of Object.values(record.langs)) {
    if (lang.translation?.trim()) cues.add(lang.translation.trim());
    for (const example of lang.examples) if (example.translation_ru?.trim()) cues.add(example.translation_ru.trim());
  }
  return cues;
}

function expectedDeckSize(record) {
  const counts = { en: new Map(), de: new Map() };
  const add = (lang, cue) => {
    if (!cue?.trim()) return;
    const key = cue.trim();
    counts[lang].set(key, (counts[lang].get(key) || 0) + 1);
  };
  for (const [lang, data] of Object.entries(record.langs)) {
    add(lang, data.translation);
    for (const example of data.examples) add(lang, example.translation_ru);
  }
  const cues = new Set([...counts.en.keys(), ...counts.de.keys()]);
  let size = 0;
  for (const cue of cues) size += Math.max(counts.en.get(cue) || 0, counts.de.get(cue) || 0);
  return size;
}

function spanTotal(record) {
  let total = 0;
  for (const lang of Object.values(record.langs)) {
    total += lang.primary_spans || 0;
    for (const example of lang.examples) total += example.spans || 0;
  }
  return total;
}

test("corpus totals in the baseline match the redesign premise", () => {
  assert.equal(baseline.totals.patterns, 3530);
  assert.equal(baseline.totals.sets, 94);
  assert.equal(baseline.totals.examples.en, 32908);
  assert.equal(baseline.totals.examples.de, 32908);
  assert.equal(baseline.totals.annotated_sentences, 72876);
});

test("every pattern route still exists for both interface locales", () => {
  for (const record of baseline.records) {
    for (const locale of ["en", "ru"]) {
      const file = path.join(ROOT, "dist", patternPath(locale, record), "index.html");
      assert.ok(fs.existsSync(file), `missing ${locale} page for ${record.id}`);
    }
  }
});

test("machine-readable catalogue keeps every pattern and example", () => {
  const searchIndex = JSON.parse(fs.readFileSync(path.join(ROOT, "dist", "api", "v1", "search-index.json"), "utf8"));
  const root = searchIndex.data && typeof searchIndex.data === "object" ? searchIndex.data : searchIndex;
  assert.equal(root.patterns.length, baseline.totals.patterns);
  const advanced = JSON.parse(fs.readFileSync(path.join(ROOT, "dist", "data", "advanced-patterns.json"), "utf8"));
  const patterns = Array.isArray(advanced) ? advanced : advanced.patterns || advanced.data?.patterns || [];
  assert.equal(patterns.length, baseline.totals.patterns);
  const exampleTotals = { en: 0, de: 0 };
  for (const pattern of patterns) {
    for (const lang of pattern.langs || []) if (exampleTotals[lang.lang] !== undefined) exampleTotals[lang.lang] += (lang.examples || []).length;
  }
  assert.deepEqual(exampleTotals, baseline.totals.examples);
});

test("sampled pattern pages preserve every cue, example rendering and annotation span", () => {
  const sampled = baseline.records.filter((_, index) => index % 97 === 0);
  assert.ok(sampled.length >= 30, "meaningful sample size");
  for (const record of sampled) {
    const html = fs.readFileSync(path.join(ROOT, "dist", patternPath("en", record), "index.html"), "utf8");
    const cues = uniqueCues(record);
    for (const cue of cues) {
      assert.ok(html.includes(`>${escapeHtml(cue)}</p>`), `${record.id}: Russian cue preserved: ${cue.slice(0, 40)}`);
    }
    const reviewCards = html.match(/data-review-card /g) || [];
    assert.equal(reviewCards.length, expectedDeckSize(record), `${record.id}: one review card per verified cue-language unit`);
    const spans = spanTotal(record);
    if (spans > 0) {
      const tokens = html.match(/class="annotated-token /g) || [];
      assert.equal(tokens.length, spans * 2, `${record.id}: every annotation span rendered in both the review deck and the full pattern`);
    }
    const variationsSection = html.slice(html.indexOf('class="pattern-variations"'), html.indexOf('data-pattern-graph-related') > 0 ? html.indexOf('data-pattern-graph-related') : undefined);
    const variations = variationsSection.match(/<li class="pattern-comparison-card">/g) || [];
    const expectedVariations = Math.max(record.langs.en?.examples.length || 0, record.langs.de?.examples.length || 0);
    assert.equal(variations.length, expectedVariations, `${record.id}: all variations kept`);
  }
});
