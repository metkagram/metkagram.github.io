import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ANNOTATION_SCHEMA_VERSION, cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const endpoint = (process.env.METKAGRAM_ANNOTATION_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const output = path.join(ROOT, "data", "pattern-annotations.json.gz");
const batchSize = 128;

function createWork() {
  const work = [];
  for (const pattern of loadContent().advancedPatterns) {
    for (const language of pattern.langs) {
      work.push({
        key: `${pattern.id}:${language.lang}:primary`,
        text: cleanMarkedText(language.example),
        language: language.lang,
        setId: pattern.set_id
      });
      for (const [index, example] of (language.examples || []).entries()) {
        work.push({
          key: `${pattern.id}:${language.lang}:${index + 1}`,
          text: cleanMarkedText(example.text),
          language: language.lang,
          setId: pattern.set_id
        });
      }
    }
  }
  return work;
}

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.json();
}

async function main() {
  const health = await fetchJson(`${endpoint}/health`);
  if (health.status !== "ok" || !["en", "de"].every((lang) => health.models?.[lang]?.dependency_parser)) {
    throw new Error("The annotation service must have EN and DE dependency parsers loaded");
  }

  const work = createWork();
  const items = {};
  for (let start = 0; start < work.length; start += batchSize) {
    const batch = work.slice(start, start + batchSize);
    const annotations = await fetchJson(`${endpoint}/v1/annotate/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: batch.map(({ text, language }) => ({ text, language })) })
    });
    if (!Array.isArray(annotations) || annotations.length !== batch.length) throw new Error(`Batch ${start} returned an unexpected record count`);
    for (const [index, record] of annotations.entries()) {
      const source = batch[index];
      if (record.text !== source.text || record.inline_text !== source.text) throw new Error(`${source.key}: the service modified its input text`);
      const errors = validateAnnotation(record);
      if (errors.length) throw new Error(`${source.key}: invalid annotation: ${errors.join(", ")}`);
      record.source = { dataset: "advanced-patterns", set_id: source.setId, pattern_example_id: source.key };
      items[source.key] = record;
    }
    process.stdout.write(`Annotated ${Math.min(start + batch.length, work.length)}/${work.length}\n`);
  }

  if (Object.keys(items).length !== work.length) throw new Error("Annotation export has duplicate or missing record keys");
  const payload = {
    schema_version: ANNOTATION_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    generator: "local-spacy-dependency",
    models: Object.fromEntries(Object.entries(health.models).map(([language, model]) => [language, { name: model.name, version: model.version }])),
    count: work.length,
    items
  };
  const temporary = `${output}.tmp`;
  fs.writeFileSync(temporary, zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
  fs.renameSync(temporary, output);
  process.stdout.write(`Wrote ${output} with ${payload.count} records.\n`);
}

await main();
