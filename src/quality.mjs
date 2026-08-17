export function buildQualityReport(content) {
  const patterns = content.advancedPatterns;
  const nonIndexable = patterns.filter((pattern) => pattern.quality && !pattern.quality.indexable);
  const primaryRepeated = patterns.filter((pattern) => Object.values(pattern.quality?.languages || {}).some((lang) => lang.primary_repeated_in_variations));
  const variationDuplicates = patterns.filter((pattern) => pattern.quality?.has_variation_duplicates);
  const byStatus = {};
  for (const pattern of patterns) {
    const status = pattern.quality?.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  return {
    schemaVersion: 2,
    purpose: "Editorial quality signals for the public Metkagram pattern corpus. Counts describe the data; they are not efficacy claims.",
    patternCount: patterns.length,
    indexablePatternCount: patterns.length - nonIndexable.length,
    nonIndexablePatternCount: nonIndexable.length,
    primaryRepeatedInVariationsPatternCount: primaryRepeated.length,
    variationDuplicatePatternCount: variationDuplicates.length,
    byStatus,
    rules: {
      minimumVariationsPerLanguage: 2,
      indexableMinimumUniqueExamplesPerLanguage: 3,
      translationsRequired: true,
      syntheticPaddingAllowed: false,
      primaryMayBeMirroredInVariations: true,
      duplicateVariationsAllowed: false
    },
    reviewQueue: nonIndexable.map((pattern) => ({
      id: pattern.id,
      set_id: pattern.set_id,
      status: pattern.quality.status,
      min_unique_examples: pattern.quality.min_unique_examples,
      translations_complete: pattern.quality.translations_complete,
      has_variation_duplicates: pattern.quality.has_variation_duplicates
    })),
  };
}
