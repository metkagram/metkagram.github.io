export function buildQualityReport(content) {
  const patterns = content.advancedPatterns;
  const nonIndexable = patterns.filter((pattern) => pattern.quality && !pattern.quality.indexable);
  const duplicateHeavy = patterns.filter((pattern) => Object.values(pattern.quality?.languages || {}).some((lang) => lang.duplicate_example_count > 0));
  const byStatus = {};
  for (const pattern of patterns) {
    const status = pattern.quality?.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  return {
    schemaVersion: 1,
    purpose: "Editorial quality signals for the public Metkagram pattern corpus. Counts describe the data; they are not efficacy claims.",
    patternCount: patterns.length,
    indexablePatternCount: patterns.length - nonIndexable.length,
    nonIndexablePatternCount: nonIndexable.length,
    duplicateHeavyPatternCount: duplicateHeavy.length,
    byStatus,
    rules: {
      minimumVariationsPerLanguage: 2,
      indexableMinimumUniqueExamplesPerLanguage: 3,
      translationsRequired: true,
      syntheticPaddingAllowed: false,
    },
    reviewQueue: nonIndexable.map((pattern) => ({
      id: pattern.id,
      set_id: pattern.set_id,
      status: pattern.quality.status,
      min_unique_examples: pattern.quality.min_unique_examples,
      translations_complete: pattern.quality.translations_complete,
    })),
  };
}
