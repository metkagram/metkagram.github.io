import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadContent } from "../src/content.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET = path.join(ROOT, "reports", "redesign-baseline.json");

// Use the same loader as the build so enrichment/merge behaviour is included.
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
    const primaryKey = `${pattern.id}:${lang.lang}:primary`;
    langs[lang.lang] = {
      formula: lang.formula || "",
      translation: lang.translation || "",
      primary_text: cleanMarked(lang.example),
      primary_spans: annotationSpans.get(primaryKey) ?? null,
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

const totals = {
  patterns: records.length,
  sets: new Set(records.map((record) => record.set_id)).size,
  examples: Object.fromEntries(["en", "de"].map((lang) => [
    lang,
    records.reduce((sum, record) => sum + (record.langs[lang]?.examples.length || 0), 0)
  ])),
  ru_cues: records.reduce((sum, record) => sum + ["en", "de"]
    .reduce((inner, lang) => inner + (record.langs[lang]?.examples || []).filter((example) => example.translation_ru).length, 0), 0),
  annotated_sentences: annotationSpans.size,
  annotation_spans: [...annotationSpans.values()].reduce((sum, count) => sum + count, 0)
};

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, `${JSON.stringify({ generated: new Date().toISOString(), totals, records }, null, 2)}\n`);
console.log(`Content baseline written to ${path.relative(ROOT, TARGET)}`);
console.log(JSON.stringify(totals, null, 2));
