import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ANNOTATION_SCHEMA_VERSION, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { practiceAnnotationWork, showcaseAnnotationWork } from "../src/annotation-corpus.mjs";
import { targetMeta } from "../src/i18n.mjs";

const endpoint = (process.env.METKAGRAM_ANNOTATION_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  return response.json();
}
const health = await fetchJson(`${endpoint}/health`);
if (health.status !== "ok" || !health.heuristics_version || !["en", "de"].every(l => health.models?.[l]?.dependency_parser)) throw new Error("Updated EN/DE dependency service required");
const content = loadContent();
const practice = practiceAnnotationWork(content);
const showcase = showcaseAnnotationWork(content);
const work = [...practice, ...showcase];
const items = {};
const review = [];
for (let start = 0; start < work.length; start += 128) {
  const batch = work.slice(start, start + 128);
  const annotations = await fetchJson(`${endpoint}/v1/annotate/batch`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: batch.map(({text, language, formula}) => ({text, language, formula})) }) });
  if (!Array.isArray(annotations) || annotations.length !== batch.length) throw new Error(`Invalid batch ${start}`);
  for (const [index, record] of annotations.entries()) {
    const source = batch[index];
    if (record.text !== source.text || record.inline_text !== source.text || record.language !== source.language) throw new Error(`${source.key}: source mismatch`);
    const errors = validateAnnotation(record);
    if (errors.length) throw new Error(`${source.key}: ${errors.join(', ')}`);
    record.source = { dataset: source.pattern_id ? "advanced-patterns" : "public-showcase", set_id: source.set_id || null, pattern_example_id: source.pattern_id ? source.key : null, source_hash: source.source_hash };
    if (items[source.key]) throw new Error(`Duplicate ${source.key}`);
    items[source.key] = record;
    for (const reason of record.emphasis.review) review.push({ key: source.key, language: source.language, text: source.text, formula: source.formula, reason });
  }
  console.log(`Annotated ${Math.min(start + 128, work.length)}/${work.length}`);
}
const payload = { schema_version: ANNOTATION_SCHEMA_VERSION, generated_at: new Date().toISOString(), generator: "local-spacy-dependency", spacy_version: health.spacy_version, heuristics_version: health.heuristics_version, models: health.models, count: practice.length, items: Object.fromEntries(practice.map(s => [s.key, items[s.key]])) };
// Prepare every output before replacing any source artifact.
const writes = new Map();
writes.set("data/pattern-annotations.json.gz", zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
const documents = new Map();
for (const source of showcase) {
  const target = Object.values(targetMeta).find(t => t.dataKey === source.language);
  const file = path.join("data/metkagram-export", target.gram, source.collection, "documents.json");
  if (!documents.has(file)) documents.set(file, JSON.parse(fs.readFileSync(file)));
  const annotation = documents.get(file).find(d => d.id === source.document_id).annotations.find(a => a.id === source.annotation_id);
  annotation.canonical_annotation = { ...items[source.key], id: annotation.id };
}
for (const [file, value] of documents) writes.set(file, JSON.stringify(value) + "\n");
const ledgerFile = "data/pending-practice-annotation-rebuilds.json";
const ledger = JSON.parse(fs.readFileSync(ledgerFile));
ledger.patterns = []; ledger.retired_records = []; ledger.refreshed_by = health.heuristics_version;
writes.set(ledgerFile, JSON.stringify(ledger, null, 2) + "\n");
writes.set("reports/annotation-refresh-review.json", JSON.stringify({ heuristics_version: health.heuristics_version, count: review.length, items: review }, null, 2) + "\n");
for (const [file, data] of writes) fs.writeFileSync(file + ".tmp", data);
for (const file of writes.keys()) fs.renameSync(file + ".tmp", file);
console.log(`Wrote ${practice.length} Practice and ${showcase.length} showcase annotations; ${review.length} review items.`);
