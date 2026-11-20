import assert from "node:assert/strict";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { practiceAnnotationWork, showcaseAnnotationWork } from "../src/annotation-corpus.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";

test("annotation rebuild scope matches explicitly pending source records without inventing Marks", () => {
  const content = loadContent();
  const { payload, items, ledger, pendingPatternIds, overlayPendingCount } = loadPracticeAnnotationLayer(content);
  const practice = practiceAnnotationWork(content);
  const showcase = showcaseAnnotationWork(content);
  const pendingSources = practice.filter((source) => pendingPatternIds.has(source.pattern_id));
  const overlays = practice.filter((source) => items[source.key]?.id?.startsWith("pending-rebuild-"));
  const missing = overlays.filter((source) => !payload.items[source.key]);
  const changed = overlays.filter((source) => payload.items[source.key]);
  const newIds = new Set(ledger.patterns.filter((entry) => entry.reason === "new_pattern_requires_local_annotation_build").map((entry) => entry.id));

  assert.equal(pendingPatternIds.size, ledger.patterns.length, "ledger must not contain repeated Pattern IDs");
  assert.equal(overlays.length, overlayPendingCount, "every generated pending record must be accounted for");
  assert.ok(overlays.every((source) => pendingPatternIds.has(source.pattern_id)), "pending source cannot bypass the rebuild ledger");
  assert.ok(overlays.every((source) => items[source.key].validation.status === "pending" && items[source.key].spans.length === 0), "pending records cannot claim generated linguistic Marks");
  assert.ok(practice.every((source) => items[source.key]), "every current example needs either an actual annotation or explicit pending status");

  const countLang = (sources, language) => sources.filter((source) => source.language === language).length;
  const report = {
    canonicalPatterns: content.advancedPatterns.length,
    pendingPatternIds: pendingPatternIds.size,
    newPatternIds: newIds.size,
    editedPatternIds: pendingPatternIds.size - newIds.size,
    sourceRecordsForPendingIds: pendingSources.length,
    generatedPendingOverlays: overlayPendingCount,
    missingRawRecords: missing.length,
    staleTextRecords: changed.length,
    newPatternRecords: overlays.filter((source) => newIds.has(source.pattern_id)).length,
    editedPatternRecords: overlays.filter((source) => !newIds.has(source.pattern_id)).length,
    pendingByLanguage: { en: countLang(overlays, "en"), de: countLang(overlays, "de") },
    fullPracticeRecords: practice.length,
    fullShowcaseRecords: showcase.length,
    fullGeneratorWorkRecords: practice.length + showcase.length
  };
  console.log("ANNOTATION_REBUILD_SCOPE " + JSON.stringify(report));
});
