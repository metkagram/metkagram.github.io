import fs from "node:fs";
import path from "node:path";

import { normalizeFrameFormula } from "./frame-quality-audit.mjs";
import { languageRegistry } from "./language-registry.mjs";

export const FRAME_FAMILIES_FILE = path.join("data", "frame-families.json");

function invariant(condition, message) {
  if (!condition) throw new Error(`Frame family validation failed: ${message}`);
}

export function canonicalFrameId(familyId, language) {
  return `canonical-frame:${String(familyId).toLowerCase()}:${String(language).toLowerCase()}`;
}

export function frameVariantId(patternId, language) {
  return `frame-variant:${String(patternId).toLowerCase()}:${String(language).toLowerCase()}`;
}

export function loadFrameFamilies(root = process.cwd()) {
  const file = path.join(root, FRAME_FAMILIES_FILE);
  invariant(fs.existsSync(file), `${FRAME_FAMILIES_FILE} is required`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function validateFrameFamilies(patterns, manifest, registry = languageRegistry) {
  invariant(manifest?.schemaVersion === 1, "schemaVersion must be 1");
  invariant(manifest?.policy === "explicit-reviewed-pilot-only", "policy must require explicit reviewed pilots");
  invariant(Array.isArray(manifest.families), "families must be an array");

  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const familyIds = new Set();
  const occupiedPatterns = new Set();

  for (const family of manifest.families) {
    invariant(typeof family.id === "string" && /^[a-z0-9-]+$/.test(family.id), `invalid family id ${family.id || "<missing>"}`);
    invariant(!familyIds.has(family.id), `duplicate family id ${family.id}`);
    familyIds.add(family.id);
    invariant(typeof family.set_id === "string" && family.set_id, `${family.id} requires set_id`);
    invariant(Array.isArray(family.member_pattern_ids) && family.member_pattern_ids.length >= 2, `${family.id} needs at least two member Pattern IDs`);
    invariant(new Set(family.member_pattern_ids).size === family.member_pattern_ids.length, `${family.id} contains duplicate member Pattern IDs`);
    invariant(family.member_pattern_ids.includes(family.representative_pattern_id), `${family.id} representative Pattern must be a member`);
    invariant(family.relation === "contextual_realization", `${family.id} relation must be contextual_realization for this pilot`);
    invariant(family.review?.status === "reviewed_pilot", `${family.id} requires reviewed_pilot status`);
    invariant(family.review?.confidence === "high", `${family.id} requires high review confidence`);
    invariant(typeof family.review?.basis === "string" && family.review.basis.length >= 80, `${family.id} requires a substantive review basis`);
    invariant(typeof family.review?.reviewed_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(family.review.reviewed_on), `${family.id} requires reviewed_on`);
    invariant(typeof family.review?.reviewer_type === "string" && family.review.reviewer_type, `${family.id} requires reviewer_type`);
    invariant(typeof family.review?.human_reviewed === "boolean", `${family.id} must state whether human review occurred`);
    invariant(family.languages && typeof family.languages === "object", `${family.id} requires language formulas`);

    const members = family.member_pattern_ids.map((patternId) => {
      const pattern = patternById.get(patternId);
      invariant(pattern, `${family.id} references unknown Pattern ${patternId}`);
      invariant(pattern.set_id === family.set_id, `${family.id} member ${patternId} belongs to ${pattern.set_id}, not ${family.set_id}`);
      invariant(!occupiedPatterns.has(patternId), `${patternId} is assigned to more than one canonical Frame family`);
      occupiedPatterns.add(patternId);
      return pattern;
    });

    for (const [language, canonical] of Object.entries(family.languages)) {
      invariant(registry[language]?.roles?.learning, `${family.id}/${language} is not an enabled learning language`);
      invariant(typeof canonical?.formula === "string" && canonical.formula.includes("["), `${family.id}/${language} requires a reusable formula with at least one slot`);
      const expectedSignature = normalizeFrameFormula(canonical.formula, { abstractSlots: true });
      for (const pattern of members) {
        const languageRecord = (pattern.langs || []).find((record) => record.lang === language);
        invariant(languageRecord, `${family.id} member ${pattern.id} is missing ${language}`);
        const actualSignature = normalizeFrameFormula(languageRecord.formula, { abstractSlots: true });
        invariant(
          actualSignature === expectedSignature,
          `${family.id}/${language} member ${pattern.id} does not match the reviewed abstract Frame signature`,
        );
      }
    }
  }

  return manifest;
}

export function buildFrameFamilyLayer(patterns, manifest, patternFrameId, registry = languageRegistry) {
  validateFrameFamilies(patterns, manifest, registry);
  const canonicalFrames = [];
  const frameVariants = [];

  for (const family of manifest.families) {
    for (const [language, canonical] of Object.entries(family.languages).sort(([a], [b]) => a.localeCompare(b))) {
      const canonicalId = canonicalFrameId(family.id, language);
      const patternFrameIds = family.member_pattern_ids.map((patternId) => patternFrameId(patternId, language));
      canonicalFrames.push({
        id: canonicalId,
        kind: "canonical_frame",
        family_id: family.id,
        set_id: family.set_id,
        language,
        formula: canonical.formula,
        representative_pattern_id: family.representative_pattern_id,
        member_pattern_ids: [...family.member_pattern_ids],
        pattern_frame_ids: patternFrameIds,
        relation: family.relation,
        review_status: family.review.status,
        review_confidence: family.review.confidence,
        reviewer_type: family.review.reviewer_type,
        human_reviewed: family.review.human_reviewed,
        reviewed_on: family.review.reviewed_on,
        review_basis: family.review.basis,
        source: FRAME_FAMILIES_FILE,
      });

      for (const patternId of family.member_pattern_ids) {
        frameVariants.push({
          id: frameVariantId(patternId, language),
          kind: "frame_variant",
          pattern_id: patternId,
          pattern_frame_id: patternFrameId(patternId, language),
          canonical_frame_id: canonicalId,
          family_id: family.id,
          set_id: family.set_id,
          language,
          role: patternId === family.representative_pattern_id ? "representative" : "contextual_variant",
          relation: family.relation,
          review_status: family.review.status,
          review_confidence: family.review.confidence,
          reviewer_type: family.review.reviewer_type,
          human_reviewed: family.review.human_reviewed,
          reviewed_on: family.review.reviewed_on,
          source: FRAME_FAMILIES_FILE,
        });
      }
    }
  }

  canonicalFrames.sort((a, b) => a.id.localeCompare(b.id));
  frameVariants.sort((a, b) => a.id.localeCompare(b.id));
  return { canonicalFrames, frameVariants };
}
