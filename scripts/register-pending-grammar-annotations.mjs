import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { loadContent } from '../src/content.mjs';
import { buildFrameQualityAudit } from '../src/frame-quality-audit.mjs';
import { ANNOTATION_SCHEMA_VERSION, cleanMarkedText, validateAnnotation } from '../src/annotation-schema.mjs';

// The owner permits publishing the new grammar frames before local annotation.
// These are text-only transport records, NOT completed parser annotations.
// Existing records are never replaced, reclassified, or stripped of their Marks.
const file = path.join(process.cwd(), 'data', 'pattern-annotations.json.gz');
assert.ok(fs.existsSync(file), 'The existing annotation export must be present');
const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
assert.equal(payload.count, Object.keys(payload.items || {}).length, 'Invalid existing annotation count');
const original = new Map(Object.entries(payload.items).map(([key, value]) => [key, JSON.stringify(value)]));
const content = loadContent();
const additions = content.advancedPatterns.filter(p => /^GF[A-O]\d{3}$/.test(p.id));
assert.equal(additions.length, 300, 'Only the complete grammar-flexibility expansion is supported');
let added = 0;
for (const pattern of additions) {
  for (const language of pattern.langs) {
    const examples = [{ key: 'primary', text: language.example, translation: language.translation },
      ...language.examples.map((example, index) => ({ key: String(index + 1), text: example.text, translation: example.translation_ru }))];
    for (const example of examples) {
      const key = `${pattern.id}:${language.lang}:${example.key}`;
      const text = cleanMarkedText(example.text);
      const existing = payload.items[key];
      if (existing) {
        assert.equal(existing.text, text, `${key}: stale existing annotation; rebuild explicitly rather than overwrite it`);
        assert.equal(existing.inline_text, text, `${key}: stale inline text`);
        assert.deepEqual(validateAnnotation(existing), [], `${key}: invalid existing record`);
        continue;
      }
      const record = {
        schema_version: ANNOTATION_SCHEMA_VERSION,
        id: `pending-${pattern.id}-${language.lang}-${example.key}`,
        kind: 'sentence',
        text,
        inline_text: text,
        language: language.lang,
        locale: language.lang,
        translations: { ru: example.translation },
        explanation: '',
        examples: [],
        cefr: pattern.level,
        source: { dataset: 'advanced-patterns', set_id: pattern.set_id, pattern_example_id: key },
        slots: [],
        spans: [],
        validation: {
          status: 'pending',
          reason: 'awaiting_local_annotation',
          needs_rebuild: true,
          text_sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex'),
          generator: 'none'
        }
      };
      assert.deepEqual(validateAnnotation(record), [], `${key}: invalid pending transport record`);
      assert.equal(record.spans.length, 0, 'Pending records must not fabricate grammar spans');
      payload.items[key] = record;
      added += 1;
    }
  }
}
for (const [key, value] of original) assert.equal(JSON.stringify(payload.items[key]), value, `${key}: existing annotation changed`);
if (added) {
  payload.previous_generator ??= payload.generator;
  payload.generator = 'mixed-local-annotations-and-explicit-pending-records';
  payload.generated_at = new Date().toISOString();
  payload.count = Object.keys(payload.items).length;
  payload.pending_count = Object.values(payload.items).filter(record => record.validation?.status === 'pending').length;
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
  fs.renameSync(temporary, file);
}
console.log(JSON.stringify({ preserved_existing_records: original.size, added_pending_records: added, total_records: payload.count, pending_records: Object.values(payload.items).filter(record => record.validation?.status === 'pending').length }));
// Keep release diagnostics scoped to the new, already-public grammar corpus.
const audit = buildFrameQualityAudit(content);
for (const groups of Object.values(audit.duplicateGroups)) for (const group of groups) {
  if (/^GF[A-O]$/.test(group.set_id)) console.log('GRAMMAR_DUPLICATE_CANDIDATE ' + JSON.stringify({ ...group, formulas: content.advancedPatterns.filter(p => group.pattern_ids.includes(p.id)).map(p => ({ id: p.id, language: p.langs.find(l => l.lang === group.lang) })) }));
}
for (const item of audit.remediationQueue || []) if (/^GF[A-O]$/.test(item.set_id)) console.log('GRAMMAR_QA_FINDING ' + JSON.stringify(item));
