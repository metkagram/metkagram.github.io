import { buildFrameQualityAudit } from "./frame-quality-audit.mjs";

export const PATTERN_INDEXABILITY_POLICY_VERSION = "1.0.0";

const REVIEWED_SEARCH_STATUSES = new Set([
  "curated",
  "reviewed",
  "editorial",
  "internal_editorial",
  "human_reviewed",
]);

function normalizeStatus(pattern) {
  return String(pattern.quality?.status || pattern.gen?.status || "unknown").trim().toLowerCase();
}

function familyMembership(frameFamilies) {
  const memberships = new Map();
  for (const family of frameFamilies?.families || []) {
    for (const patternId of family.member_pattern_ids || []) {
      if (memberships.has(patternId)) {
        throw new Error(`Pattern indexability policy found conflicting canonical Frame families for ${patternId}.`);
      }
      memberships.set(patternId, {
        family_id: family.id,
        representative_pattern_id: family.representative_pattern_id,
        role: patternId === family.representative_pattern_id ? "representative" : "contextual_variant",
        review_status: family.review?.status || null,
        review_confidence: family.review?.confidence || null,
        human_reviewed: family.review?.human_reviewed === true,
      });
    }
  }
  return memberships;
}

function blockingAuditFindings(audit) {
  const byPattern = new Map();
  for (const finding of audit?.linguisticIssues || []) {
    if (finding.severity !== "high" || finding.confidence !== "high") continue;
    if (!byPattern.has(finding.pattern_id)) byPattern.set(finding.pattern_id, []);
    byPattern.get(finding.pattern_id).push({
      type: finding.type,
      lang: finding.lang,
      source: finding.source,
      severity: finding.severity,
      confidence: finding.confidence,
    });
  }
  return byPattern;
}

function decision(pattern, membership, blockingFindings) {
  const qualityStatus = normalizeStatus(pattern);
  const technicalIndexable = pattern.quality?.indexable === true;
  const reviewedStatus = REVIEWED_SEARCH_STATUSES.has(qualityStatus);
  const severeFindings = blockingFindings.get(pattern.id) || [];

  if (membership?.role === "contextual_variant") {
    return {
      indexable: false,
      robots: "noindex,follow",
      reason: "canonical_frame_contextual_variant",
      detail: `Contextual realization of explicit canonical Frame family ${membership.family_id}; keep the stable Pattern route and API record, but do not promote this variant as a standalone search landing page.`,
    };
  }

  if (!technicalIndexable) {
    return {
      indexable: false,
      robots: "noindex,follow",
      reason: "technical_quality_gate",
      detail: "Pattern does not meet the existing completeness/variation quality contract for a standalone search page.",
    };
  }

  if (!reviewedStatus) {
    return {
      indexable: false,
      robots: "noindex,follow",
      reason: "editorial_review_gate",
      detail: `Editorial status ${qualityStatus || "unknown"} is not approved for standalone search promotion.`,
    };
  }

  if (severeFindings.length) {
    return {
      indexable: false,
      robots: "noindex,follow",
      reason: "unresolved_high_confidence_quality_finding",
      detail: "At least one high-severity, high-confidence automated quality finding requires editorial review before standalone search promotion.",
    };
  }

  return {
    indexable: true,
    robots: "index,follow",
    reason: membership?.role === "representative" ? "canonical_frame_representative" : "reviewed_standalone_pattern",
    detail: membership?.role === "representative"
      ? `Representative Pattern for explicit canonical Frame family ${membership.family_id}.`
      : "Pattern meets the current technical and editorial gates and is not an explicitly reviewed contextual variant.",
  };
}

export function buildPatternIndexability(content, {
  frameFamilies = { families: [] },
  audit = buildFrameQualityAudit(content),
} = {}) {
  if (!Array.isArray(content?.advancedPatterns)) throw new Error("Pattern indexability requires canonical advancedPatterns.");
  const memberships = familyMembership(frameFamilies);
  const blockingFindings = blockingAuditFindings(audit);
  const items = content.advancedPatterns.map((pattern) => {
    const membership = memberships.get(pattern.id) || null;
    const severeFindings = blockingFindings.get(pattern.id) || [];
    const result = decision(pattern, membership, blockingFindings);
    return {
      pattern_id: pattern.id,
      set_id: pattern.set_id,
      policy_version: PATTERN_INDEXABILITY_POLICY_VERSION,
      indexable: result.indexable,
      robots: result.robots,
      reason: result.reason,
      detail: result.detail,
      technical_quality_indexable: pattern.quality?.indexable === true,
      editorial_status: normalizeStatus(pattern),
      canonical_frame_family_id: membership?.family_id || null,
      canonical_frame_role: membership?.role || "standalone",
      representative_pattern_id: membership?.representative_pattern_id || null,
      blocking_quality_findings: severeFindings,
      automated_similarity_used_as_decision: false,
    };
  }).sort((a, b) => a.pattern_id.localeCompare(b.pattern_id));

  const countsByReason = {};
  for (const item of items) countsByReason[item.reason] = (countsByReason[item.reason] || 0) + 1;
  const indexableCount = items.filter((item) => item.indexable).length;
  return {
    schemaVersion: 1,
    policyVersion: PATTERN_INDEXABILITY_POLICY_VERSION,
    purpose: "Editorial search-promotion contract for canonical Pattern pages. noindex changes crawler promotion only; Pattern records, study-set membership, stable routes and APIs remain available.",
    invariants: [
      "Automated duplicate/near-duplicate similarity alone never deindexes a Pattern.",
      "Only explicit canonical Frame family membership can mark a contextual variant as redundant for standalone search promotion.",
      "noindex never deletes a Pattern, study set, stable route or API record.",
      "Standalone search promotion requires both technical completeness and an approved editorial status.",
      "High-severity high-confidence audit findings block standalone promotion until reviewed.",
    ],
    counts: {
      total: items.length,
      indexable: indexableCount,
      noindex: items.length - indexableCount,
      byReason: Object.fromEntries(Object.entries(countsByReason).sort(([a], [b]) => a.localeCompare(b))),
    },
    items,
  };
}

export function indexabilityByPattern(report) {
  return new Map(report.items.map((item) => [item.pattern_id, item]));
}
