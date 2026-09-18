import assert from 'node:assert/strict';
import fs from 'node:fs';

// Normal corpus rules remain 5–7 additional examples. The owner explicitly
// approved merging this existing 300-pattern batch with three total examples
// before enrichment. Keep that debt finite, inspectable and separate from QA.
const ledger = JSON.parse(fs.readFileSync(new URL('../data/quality/pending-example-enrichment.json', import.meta.url), 'utf8'));
assert.equal(ledger.schemaVersion, 1);
assert.equal(ledger.status, 'pending');
assert.equal(ledger.expectedAdditionalExampleCount, 2);
assert.equal(ledger.expectedTotalIncludingPrimary, 3);
assert.equal(ledger.patternIds.length, 300);
assert.equal(new Set(ledger.patternIds).size, 300);
assert.deepEqual([...ledger.languages].sort(), ['de', 'en']);
const ids = new Set(ledger.patternIds);

export function hasPendingExampleEnrichment(pattern, language) {
  if (!ids.has(pattern?.id) || pattern.set_id !== pattern.id.slice(0, -3)) return false;
  return ledger.languages.includes(language?.lang)
    && typeof language.example === 'string' && language.example.trim().length > 0
    && Array.isArray(language.examples)
    && language.examples.length === ledger.expectedAdditionalExampleCount;
}

export function pendingExampleEnrichmentInventory() {
  return structuredClone(ledger);
}
