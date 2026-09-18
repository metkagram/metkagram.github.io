import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadContent } from "../src/content.mjs";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();

function buildCorpusSnapshot() {
  const { advancedPatterns: patterns } = loadContent();
  const annotationSource = path.join(ROOT, "data", "pattern-annotations.json.gz");
  const annotationPayload = JSON.parse(zlib.gunzipSync(fs.readFileSync(annotationSource)).toString("utf8"));
  const annotationSpans = new Map();
  for (const [key, record] of Object.entries(annotationPayload.items || {})) {
    annotationSpans.set(key, Array.isArray(record?.spans) ? record.spans.length : 0);
  }

  const cleanMarked = (value = "") => String(value).replaceAll("**", "");
  const records = patterns.map((pattern) => {
    const langs = {};
    for (const lang of pattern.langs || []) {
      langs[lang.lang] = {
        formula: lang.formula || "",
        translation: lang.translation || "",
        primary_text: cleanMarked(lang.example),
        primary_spans: annotationSpans.get(`${pattern.id}:${lang.lang}:primary`) ?? null,
        examples: (lang.examples || []).map((example, index) => ({
          text: cleanMarked(example.text),
          translation_ru: example.translation_ru || "",
          spans: annotationSpans.get(`${pattern.id}:${lang.lang}:${index + 1}`) ?? null
        }))
      };
    }
    return {
      id: pattern.id,
      set_id: pattern.set_id,
      group_id: pattern.group_id,
      title_ru: pattern.title_ru || "",
      metaphor_ru: pattern.metaphor_ru || "",
      langs
    };
  });

  return {
    records,
    totals: {
      patterns: records.length,
      sets: new Set(records.map((record) => record.set_id)).size,
      examples: Object.fromEntries(["en", "de"].map((lang) => [
        lang,
        records.reduce((sum, record) => sum + (record.langs[lang]?.examples.length || 0), 0)
      ])),
      annotated_sentences: annotationSpans.size
    }
  };
}

const baseline = buildCorpusSnapshot();

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

test("canonical corpus totals still match the redesign baseline", () => {
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
