const SEARCH_APPROVED_STATUSES = new Set(["curated", "reviewed", "reviewed_pilot"]);

export const INDEXABILITY_POLICY_VERSION = "editorial-pattern-indexability-v1";

function highConfidenceSevereFindings(audit) {
  const byPattern = new Map();
  for (const finding of audit?.linguisticIssues || []) {
    if (finding.severity !== "high" || finding.confidence !== "high") continue;
    if (!byPattern.has(finding.pattern_id)) byPattern.set(finding.pattern_id, []);
    byPattern.get(finding.pattern_id).push({
      type: finding.type,
      lang: finding.lang,
      source: finding.source,
    });
  }
  return byPattern;
}

function familyMembership(frameFamilies) {
  const byPattern = new Map();
  for (const family of frameFamilies?.families || []) {
    for (const patternId of family.member_pattern_ids || []) {
      byPattern.set(patternId, {
        family_id: family.id,
        representative_pattern_id: family.representative_pattern_id,
        review_status: family.review?.status || "unknown",
        human_reviewed: Boolean(family.review?.human_reviewed),
        relation: family.relation,
      });
    }
  }
  return byPattern;
}

function structuralAliasMembership(patternAliases) {
  const byPattern = new Map();
  for (const group of patternAliases?.groups || []) {
    for (const patternId of group.alias_ids || []) {
      byPattern.set(patternId, {
        canonical_pattern_id: group.canonical_id,
        reason: group.reason || "same_reusable_frame_contextual_realization",
        set_id: group.set_id,
        group_id: group.group_id,
      });
    }
  }
  return byPattern;
}

function technicalReasons(pattern) {
  const reasons = [];
  if (!pattern.quality?.translations_complete) reasons.push("incomplete_translations");
  if ((pattern.quality?.min_unique_examples || 0) < 3) reasons.push("insufficient_context_diversity");
  if (pattern.quality?.has_variation_duplicates) reasons.push("duplicate_variations");
  return reasons;
}

export function evaluatePatternIndexability(pattern, { family = null, severeFindings = [], structuralAlias = null } = {}) {
  const reasons = technicalReasons(pattern);
  const editorialStatus = pattern.quality?.status || "unknown";

  if (!SEARCH_APPROVED_STATUSES.has(editorialStatus)) reasons.push("unreviewed_editorial_status");
  if (severeFindings.length) reasons.push("unresolved_high_confidence_quality_finding");
  if (family && pattern.id !== family.representative_pattern_id) reasons.push("reviewed_contextual_variant");
  if (structuralAlias) reasons.push("structural_pattern_alias");

  const indexable = reasons.length === 0;
  const evidence = [];
  if (indexable && family && pattern.id === family.representative_pattern_id) evidence.push("reviewed_frame_representative");
  if (indexable && !family && !structuralAlias) evidence.push("curated_distinct_pattern");
  if (pattern.quality?.translations_complete) evidence.push("translations_complete");
  if ((pattern.quality?.min_unique_examples || 0) >= 3) evidence.push("context_examples_sufficient");
  if (!pattern.quality?.has_variation_duplicates) evidence.push("variation_duplicates_absent");

  return {
    pattern_id: pattern.id,
    set_id: pattern.set_id,
    indexable,
    robots: indexable ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow",
    editorial_status: editorialStatus,
    reasons,
    evidence,
    canonical_pattern_id: structuralAlias?.canonical_pattern_id || family?.representative_pattern_id || pattern.id,
    structural_alias_of: structuralAlias?.canonical_pattern_id || null,
    structural_alias_reason: structuralAlias?.reason || null,
    frame_family_id: family?.family_id || null,
    frame_relation: family?.relation || null,
    frame_review_status: family?.review_status || null,
    frame_human_reviewed: family?.human_reviewed ?? null,
    severe_findings: severeFindings,
  };
}

export function buildPatternIndexabilityPolicy(content, frameFamilies, audit, { patternAliases = null } = {}) {
  const families = familyMembership(frameFamilies);
  const aliases = structuralAliasMembership(patternAliases);
  const severe = highConfidenceSevereFindings(audit);
  const records = content.advancedPatterns.map((pattern) => evaluatePatternIndexability(pattern, {
    family: families.get(pattern.id) || null,
    severeFindings: severe.get(pattern.id) || [],
    structuralAlias: aliases.get(pattern.id) || null,
  }));

  const byReason = {};
  const byStatus = {};
  const bySet = {};
  for (const record of records) {
    byStatus[record.editorial_status] ||= { total: 0, indexable: 0, noindex: 0 };
    byStatus[record.editorial_status].total += 1;
    byStatus[record.editorial_status][record.indexable ? "indexable" : "noindex"] += 1;

    bySet[record.set_id] ||= { total: 0, indexable: 0, noindex: 0 };
    bySet[record.set_id].total += 1;
    bySet[record.set_id][record.indexable ? "indexable" : "noindex"] += 1;

    for (const reason of record.reasons) byReason[reason] = (byReason[reason] || 0) + 1;
  }

  const indexable = records.filter((record) => record.indexable);
  const noindex = records.filter((record) => !record.indexable);
  return {
    schemaVersion: 1,
    policy: INDEXABILITY_POLICY_VERSION,
    purpose: "Search promotion is an editorial decision. Stable Pattern IDs and API records remain available, while contextual aliases resolve to one canonical reusable Pattern page.",
    rules: {
      approvedEditorialStatuses: [...SEARCH_APPROVED_STATUSES].sort(),
      minimumUniqueExamplesPerLanguage: 3,
      translationsRequired: true,
      duplicateVariationsAllowed: false,
      unresolvedHighConfidenceSevereFindingsAllowed: false,
      reviewedContextualVariantsIndexable: false,
      structuralPatternAliasesIndexable: false,
      automatedNearDuplicateCandidatesAffectIndexability: false,
      automatedSlotVariantCandidatesAffectIndexability: false,
    },
    summary: {
      patternCount: records.length,
      indexablePatternCount: indexable.length,
      nonIndexablePatternCount: noindex.length,
      indexableRate: records.length ? Number((indexable.length / records.length).toFixed(4)) : 0,
      byReason: Object.fromEntries(Object.entries(byReason).sort(([a], [b]) => a.localeCompare(b))),
      byEditorialStatus: Object.fromEntries(Object.entries(byStatus).sort(([a], [b]) => a.localeCompare(b))),
      bySet: Object.fromEntries(Object.entries(bySet).sort(([a], [b]) => a.localeCompare(b))),
    },
    records,
  };
}
