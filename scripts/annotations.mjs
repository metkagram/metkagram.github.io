import fs from "node:fs";
import path from "node:path";
import { legacyAnnotationToCanonical, patternToCanonicalCards, validateAnnotation, ANNOTATION_SCHEMA_VERSION } from "../src/annotation-schema.mjs";
import { collectionKeys, targetMeta } from "../src/i18n.mjs";

const ROOT = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

export function migrateAnnotations() {
  const records = []; const report = { schema_version: ANNOTATION_SCHEMA_VERSION, migrated_at: new Date().toISOString(), sources: [], warnings: [], errors: [], checks: { missing_translations: 0, incomplete_examples: 0, recovered_text: 0 } };
  for (const target of Object.values(targetMeta)) for (const collection of collectionKeys) {
    const file = path.join(ROOT, "data/metkagram-export", target.gram, collection, "documents.json");
    for (const document of read(file)) for (const annotation of document.annotations || []) {
      const record = legacyAnnotationToCanonical(annotation, { language: target.dataKey, locale: target.dataKey, dataset: `${target.dataKey}/${collection}`, document_id: document.id });
      const errors = validateAnnotation(record); if (errors.length) report.errors.push({ id: record.id, errors });
      if (!annotation.original_text) { report.warnings.push({ id: record.id, warning: "original_text missing; recovered from legacy text_span" }); report.checks.recovered_text += 1; }
      if (!Object.values(record.translations).some(Boolean)) report.checks.missing_translations += 1;
      records.push(record);
    }
    report.sources.push({ dataset: `${target.dataKey}/${collection}`, records: records.length });
  }
  const patternCards = read(path.join(ROOT, "data/advanced-patterns.json")).flatMap(patternToCanonicalCards);
  for (const record of patternCards) { const errors = validateAnnotation(record); if (errors.length) report.errors.push({ id: record.id, errors }); if (!record.examples.length || record.examples.some((example) => !example.text || !example.translation)) report.checks.incomplete_examples += 1; }
  const ids = new Set(); for (const record of [...records, ...patternCards]) { if (ids.has(record.id)) report.errors.push({ id: record.id, errors: ["duplicate record id"] }); ids.add(record.id); }
  report.counts = { sentences: records.length, pattern_cards: patternCards.length, errors: report.errors.length };
  return { records, patternCards, report };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const output = path.join(ROOT, "data", "canonical-annotations.json");
  const reportFile = path.join(ROOT, "reports", "annotation-migration-report.json");
  const result = migrateAnnotations();
  fs.writeFileSync(output, `${JSON.stringify({ schema_version: ANNOTATION_SCHEMA_VERSION, items: result.records, pattern_cards: result.patternCards })}\n`);
  fs.mkdirSync(path.dirname(reportFile), { recursive: true }); fs.writeFileSync(reportFile, `${JSON.stringify(result.report, null, 2)}\n`);
  if (result.report.errors.length) { console.error(JSON.stringify(result.report.errors, null, 2)); process.exitCode = 1; }
  else console.log(`Migrated ${result.records.length} sentences and ${result.patternCards.length} pattern cards (${result.report.warnings.length} recovery warnings).`);
}
