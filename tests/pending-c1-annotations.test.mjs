import assert from 'node:assert/strict';
import test from 'node:test';
import { loadContent } from '../src/content.mjs';
import { loadPracticeAnnotationLayer } from '../src/practice-annotations.mjs';
import { practiceAnnotationWork } from '../src/annotation-corpus.mjs';

test('the complete cleaned corpus has current source-bound annotations and no pending ledger', () => {
  const content = loadContent();
  const { items, ledger, overlayPendingCount } = loadPracticeAnnotationLayer(content);
  assert.equal(overlayPendingCount, 0);
  assert.deepEqual(ledger.patterns, []);
  assert.deepEqual(ledger.retired_records, []);
  for (const source of practiceAnnotationWork(content)) {
    const record = items[source.key];
    assert.equal(record.source.source_hash, source.source_hash, source.key);
    assert.equal(record.validation.status, 'valid', source.key);
    assert.equal(record.validation.generator, 'spacy-dependency', source.key);
    assert.equal(record.validation.spacy_loaded, true, source.key);
    assert.ok(record.emphasis.version, source.key);
  }
});
