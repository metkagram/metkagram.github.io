import { buildDomainModel } from "./domain-model.mjs";
import { loadFrameFamilies } from "./frame-families.mjs";
import { normalizeFrameFormula } from "./frame-quality-audit.mjs";
import { intentTaxonomy } from "./intents.mjs";

export const LENS_CATALOGUE_LIMIT = 96;
export const LENS_INLINE_STARTER_LIMIT = 18;

export const LENS_FOUNDATION_JOBS = [
  {
    id: "hedging",
    title: "Qualification and hedging",
    anchor_pattern_ids: ["C1HED001"],
    set_ids: ["HED"],
  },
  {
    id: "polite-disagreement",
    title: "Agreement and polite disagreement",
    anchor_pattern_ids: ["C1AGR001"],
    set_ids: ["AGR"],
  },
  {
    id: "clarification-reformulation",
    title: "Clarification and reformulation",
    anchor_pattern_ids: ["CLA001", "CLF061", "CLF062"],
    set_ids: ["CLR"],
  },
  {
    id: "evidence-claims",
    title: "Evidence, claims and argumentation",
    anchor_pattern_ids: ["C1EVD001"],
    set_ids: ["EVD", "ARG"],
  },
  {
    id: "cause-effect",
    title: "Cause, effect and consequence",
    anchor_pattern_ids: ["C1CAU001", "CLF059", "CLF060"],
    set_ids: ["CAU"],
  },
  {
    id: "conditionals",
    title: "Conditions and counterfactuals",
    anchor_pattern_ids: ["CON001", "CLF043", "CLF044"],
    set_ids: ["CND"],
  },
  {
    id: "comparison",
    title: "Comparison and evaluation",
    anchor_pattern_ids: ["COM001", "CLF063", "CLF064"],
    set_ids: ["CMP"],
  },
  {
    id: "requests-negotiation",
    title: "Requests, negotiation and commitments",
    anchor_pattern_ids: ["FUNRQT001", "C1NEG001"],
    set_ids: ["RQT", "NEG", "OFR"],
  },
  {
    id: "problem-framing",
    title: "Problem framing and reframing",
    anchor_pattern_ids: ["CLF061", "CLF062", "CLF050"],
    set_ids: ["CLR"],
  },
  {
    id: "decisions",
    title: "Decisions and trade-offs",
    anchor_pattern_ids: ["CLF046", "CLF069", "C1NEG001"],
    set_ids: ["NEG"],
  },
];

function targetLanguageRecord(pattern, language) {
  return pattern.langs?.find((item) => item.lang === language) || null;
}

function isBrowserEligible(pattern) {
  const en = targetLanguageRecord(pattern, "en");
  const de = targetLanguageRecord(pattern, "de");
  return Boolean(
    pattern?.id
    && pattern?.set_id
    && en?.formula
    && en?.example
    && de?.formula
    && de?.example
    && pattern.quality?.translations_complete !== false
  );
}

function abstractSignature(pattern) {
  return ["en", "de"]
    .map((language) => normalizeFrameFormula(targetLanguageRecord(pattern, language)?.formula || "", { abstractSlots: true }))
    .join(" || ");
}

function canonicalKey(pattern, compatibilityByPattern) {
  const record = compatibilityByPattern.get(pattern.id);
  const canonicalIds = [record?.canonical_frame_ids?.en, record?.canonical_frame_ids?.de].filter(Boolean);
  if (canonicalIds.length && canonicalIds.some((id, index) => id !== record?.frame_ids?.[index === 0 ? "en" : "de"])) {
    return `canonical:${canonicalIds.join("|")}`;
  }
  return `formula:${abstractSignature(pattern)}`;
}

function sortCandidates(patterns, representativeIds, compatibilityByPattern) {
  return [...patterns].sort((left, right) => {
    const leftRepresentative = representativeIds.has(left.id) ? 1 : 0;
    const rightRepresentative = representativeIds.has(right.id) ? 1 : 0;
    if (leftRepresentative !== rightRepresentative) return rightRepresentative - leftRepresentative;

    const leftVariant = Object.keys(compatibilityByPattern.get(left.id)?.frame_variant_ids || {}).length ? 1 : 0;
    const rightVariant = Object.keys(compatibilityByPattern.get(right.id)?.frame_variant_ids || {}).length ? 1 : 0;
    if (leftVariant !== rightVariant) return leftVariant - rightVariant;

    const leftReasoning = left.reasoning?.move ? 1 : 0;
    const rightReasoning = right.reasoning?.move ? 1 : 0;
    if (leftReasoning !== rightReasoning) return rightReasoning - leftReasoning;
    return left.id.localeCompare(right.id);
  });
}

function intentJobs() {
  return intentTaxonomy.map((intent) => ({
    id: `intent:${intent.id}`,
    title: intent.title_en,
    kind: "intent",
    move: intent.move,
    anchor_pattern_ids: [...intent.pattern_priority],
    set_ids: [],
  }));
}

function foundationJobs() {
  return LENS_FOUNDATION_JOBS.map((job) => ({ ...job, kind: "foundation", move: null }));
}

function selectionJobRecord(job) {
  return {
    id: job.id,
    kind: job.kind,
    title: job.title,
    move: job.move || null,
    anchor_pattern_ids: [...job.anchor_pattern_ids],
    set_ids: [...job.set_ids],
    selected_pattern_ids: [],
  };
}

export function buildLensCatalogueSelection(content, root = process.cwd()) {
  const all = content.advancedPatterns.filter(isBrowserEligible);
  const byId = new Map(all.map((pattern) => [pattern.id, pattern]));
  const frameFamilies = loadFrameFamilies(root);
  const domainModel = buildDomainModel(content.advancedPatterns, { frameFamilies });
  const compatibilityByPattern = new Map(domainModel.patternIndex.map((record) => [record.pattern_id, record]));
  const representativeIds = new Set((domainModel.canonicalFrames || []).map((frame) => frame.representative_pattern_id));
  const jobs = [...intentJobs(), ...foundationJobs()];
  const reportJobs = new Map(jobs.map((job) => [job.id, selectionJobRecord(job)]));

  const selected = [];
  const selectedIds = new Set();
  const selectedFrameKeys = new Set();
  const selectedMoves = new Set();
  const selectionReasons = new Map();

  const markForJob = (patternId, jobId) => {
    const report = reportJobs.get(jobId);
    if (report && !report.selected_pattern_ids.includes(patternId)) report.selected_pattern_ids.push(patternId);
    if (!selectionReasons.has(patternId)) selectionReasons.set(patternId, new Set());
    selectionReasons.get(patternId).add(jobId);
  };

  const add = (pattern, jobId, { allowExistingFrame = false } = {}) => {
    if (!pattern || selectedIds.has(pattern.id)) {
      if (pattern?.id) markForJob(pattern.id, jobId);
      return false;
    }
    const frameKey = canonicalKey(pattern, compatibilityByPattern);
    if (!allowExistingFrame && selectedFrameKeys.has(frameKey)) return false;
    selected.push(pattern);
    selectedIds.add(pattern.id);
    selectedFrameKeys.add(frameKey);
    if (pattern.reasoning?.move) selectedMoves.add(pattern.reasoning.move);
    markForJob(pattern.id, jobId);
    return true;
  };

  // Phase 1: every learner job starts from explicit editorial anchors, never corpus position.
  for (const job of jobs) {
    for (const patternId of job.anchor_pattern_ids) {
      const pattern = byId.get(patternId);
      if (!pattern) continue;
      if (add(pattern, job.id)) break;
      if (selectedIds.has(patternId)) {
        markForJob(patternId, job.id);
        break;
      }
    }
  }

  // Phase 2: every published reasoning Move gets at least one bilingual Frame when available.
  const reasoningByMove = new Map();
  for (const pattern of all) {
    const move = pattern.reasoning?.move;
    if (!move) continue;
    if (!reasoningByMove.has(move)) reasoningByMove.set(move, []);
    reasoningByMove.get(move).push(pattern);
  }
  for (const [move, patterns] of [...reasoningByMove.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (selectedMoves.has(move)) continue;
    const candidates = sortCandidates(patterns, representativeIds, compatibilityByPattern);
    for (const pattern of candidates) {
      if (add(pattern, `move:${move}`)) break;
    }
  }

  // Phase 3: round-robin through explicit high-value job pools. This prevents one large set
  // from consuming the bounded browser catalogue and replaces the former corpus stride.
  const pools = foundationJobs().map((job) => ({
    job,
    candidates: sortCandidates(
      all.filter((pattern) => job.set_ids.includes(pattern.set_id)),
      representativeIds,
      compatibilityByPattern,
    ),
    cursor: 0,
  }));

  let madeProgress = true;
  while (selected.length < LENS_CATALOGUE_LIMIT && madeProgress) {
    madeProgress = false;
    for (const pool of pools) {
      while (pool.cursor < pool.candidates.length) {
        const candidate = pool.candidates[pool.cursor++];
        if (add(candidate, pool.job.id)) {
          madeProgress = true;
          break;
        }
      }
      if (selected.length >= LENS_CATALOGUE_LIMIT) break;
    }
  }

  // Phase 4: use remaining space for reasoning Frames, balanced by Move rather than storage order.
  const movePools = [...reasoningByMove.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([move, patterns]) => ({
      move,
      candidates: sortCandidates(patterns, representativeIds, compatibilityByPattern),
      cursor: 0,
    }));
  madeProgress = true;
  while (selected.length < LENS_CATALOGUE_LIMIT && madeProgress) {
    madeProgress = false;
    for (const pool of movePools) {
      while (pool.cursor < pool.candidates.length) {
        const candidate = pool.candidates[pool.cursor++];
        if (add(candidate, `move:${pool.move}`)) {
          madeProgress = true;
          break;
        }
      }
      if (selected.length >= LENS_CATALOGUE_LIMIT) break;
    }
  }

  // Attribute already selected Frames to every job they satisfy, without duplicating catalogue rows.
  for (const job of jobs) {
    const matchingIds = new Set(job.anchor_pattern_ids);
    for (const pattern of selected) {
      if (matchingIds.has(pattern.id) || job.set_ids.includes(pattern.set_id)) markForJob(pattern.id, job.id);
    }
  }

  const setCounts = {};
  const moveCounts = {};
  const languageCounts = { en: 0, de: 0 };
  for (const pattern of selected) {
    setCounts[pattern.set_id] = (setCounts[pattern.set_id] || 0) + 1;
    if (pattern.reasoning?.move) moveCounts[pattern.reasoning.move] = (moveCounts[pattern.reasoning.move] || 0) + 1;
    for (const language of Object.keys(languageCounts)) {
      if (targetLanguageRecord(pattern, language)) languageCounts[language] += 1;
    }
  }

  const contextualVariantPatternIds = selected.filter((pattern) => {
    const record = compatibilityByPattern.get(pattern.id);
    return Object.keys(record?.frame_variant_ids || {}).length > 0 && !representativeIds.has(pattern.id);
  }).map((pattern) => pattern.id);

  const report = {
    schemaVersion: 1,
    selectionPolicy: "job-balanced-frame-v1",
    catalogueLimit: LENS_CATALOGUE_LIMIT,
    catalogueCount: selected.length,
    sourcePatternCount: content.advancedPatterns.length,
    eligibleBilingualPatternCount: all.length,
    jobs: [...reportJobs.values()].map((job) => ({
      ...job,
      selected_pattern_ids: [...job.selected_pattern_ids].sort(),
      covered: job.selected_pattern_ids.length > 0,
    })),
    coverage: {
      learnerJobCount: reportJobs.size,
      coveredLearnerJobCount: [...reportJobs.values()].filter((job) => job.selected_pattern_ids.length > 0).length,
      moves: Object.fromEntries(Object.entries(moveCounts).sort(([a], [b]) => a.localeCompare(b))),
      studySets: Object.fromEntries(Object.entries(setCounts).sort(([a], [b]) => a.localeCompare(b))),
      languages: languageCounts,
      distinctFrameKeys: selectedFrameKeys.size,
      contextualVariantPatternIds,
    },
    patterns: selected.map((pattern) => ({
      id: pattern.id,
      set_id: pattern.set_id,
      reasoning_move: pattern.reasoning?.move || null,
      frame_key: canonicalKey(pattern, compatibilityByPattern),
      selection_reasons: [...(selectionReasons.get(pattern.id) || [])].sort(),
    })),
  };

  return { patterns: selected, report };
}
