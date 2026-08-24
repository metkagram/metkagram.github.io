// Pre-render validation of canonical source datasets (build stage 2, see
// ARCHITECTURE.md "Build pipeline").
//
// These validators were extracted from the feature renderers so invalid
// source data fails in the validate stage — before any HTML exists — instead
// of midway through rendering. The feature scripts import the same functions,
// so render-time behaviour is unchanged and there is exactly one copy of each
// rule.

export function validateContrastLibrary(source, patternMap) {
  if (source.schemaVersion !== 1 || !Array.isArray(source.items) || !source.items.length) {
    throw new Error("Contrast dataset must contain schemaVersion 1 and at least one item.");
  }
  const ids = new Set();
  for (const item of source.items) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing contrast id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    if (!Array.isArray(item.patterns) || item.patterns.length !== 2) throw new Error(`Contrast ${item.id} must reference exactly two patterns.`);
    if (item.patterns[0] === item.patterns[1]) throw new Error(`Contrast ${item.id} references the same pattern twice.`);
    for (const patternId of item.patterns) {
      if (!patternMap.has(patternId)) throw new Error(`Contrast ${item.id} references missing pattern ${patternId}.`);
    }
    for (const field of ["title_en", "title_ru", "question_en", "question_ru", "distinction_en", "distinction_ru"]) {
      if (!item[field]?.trim()) throw new Error(`Contrast ${item.id} is missing ${field}.`);
    }
  }
}

export function validateContrastExtensions(source, patternMap, existingIds) {
  if (source?.schemaVersion !== 1) throw new Error("contrast-extensions.json must use schemaVersion 1");
  if (!Array.isArray(source.pair_items) || !Array.isArray(source.grammar_items)) throw new Error("contrast extension arrays are required");
  const ids = new Set(existingIds);
  for (const item of [...source.pair_items, ...source.grammar_items]) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate contrast id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    for (const field of ["title_en", "title_ru", "question_en", "question_ru", "distinction_en", "distinction_ru"]) {
      if (!item[field]?.trim()) throw new Error(`${item.id} is missing ${field}`);
    }
    if (item.review_status !== "reviewed") throw new Error(`${item.id} must be reviewed`);
  }
  for (const item of source.pair_items) {
    if (!Array.isArray(item.patterns) || item.patterns.length !== 2) throw new Error(`${item.id} must reference two patterns`);
    if (item.patterns[0] === item.patterns[1]) throw new Error(`${item.id} repeats the same pattern`);
    for (const id of item.patterns) if (!patternMap.has(id)) throw new Error(`${item.id} references missing pattern ${id}`);
  }
  for (const item of source.grammar_items) {
    if (!patternMap.has(item.pattern_id)) throw new Error(`${item.id} references missing pattern ${item.pattern_id}`);
    for (const side of ["left", "right"]) {
      if (!item[side]?.label || !item[side]?.meaning_en || !item[side]?.meaning_ru) throw new Error(`${item.id} is missing ${side} content`);
    }
  }
}

export function validateChoiceDrills(source, contrasts, patternMap) {
  if (source.schemaVersion !== 1 || !Array.isArray(source.items) || source.items.length < 2) {
    throw new Error("Choice drill dataset must contain schemaVersion 1 and multiple items.");
  }
  const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
  const ids = new Set();
  for (const item of source.items) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing drill id: ${item.id || "<missing>"}`);
    ids.add(item.id);
    const contrast = contrastMap.get(item.contrast_id);
    if (!contrast) throw new Error(`Drill ${item.id} references unknown contrast ${item.contrast_id}.`);
    if (!Array.isArray(item.options) || item.options.length !== 2) throw new Error(`Drill ${item.id} must have exactly two options.`);
    if (!item.options.includes(item.answer_pattern)) throw new Error(`Drill ${item.id} answer must be one of its options.`);
    if (new Set(item.options).size !== 2) throw new Error(`Drill ${item.id} options must be distinct.`);
    if (item.options.some((id) => !patternMap.has(id))) throw new Error(`Drill ${item.id} references a missing pattern.`);
    if (item.options.some((id) => !contrast.patterns.includes(id))) throw new Error(`Drill ${item.id} options must stay inside contrast ${item.contrast_id}.`);
    for (const field of ["scenario_en", "scenario_ru", "explanation_en", "explanation_ru", "why_other_en", "why_other_ru"]) {
      if (!item[field]?.trim()) throw new Error(`Drill ${item.id} is missing ${field}.`);
    }
    if (item.review_status !== "reviewed") throw new Error(`Drill ${item.id} must be reviewed before publication.`);
  }
}

export function validateReasoningPacks(source, patternMap, contrastMap, drillMap) {
  if (source.schemaVersion !== 1 || source.status !== "reviewed-pilot" || !Array.isArray(source.packs) || source.packs.length < 3) {
    throw new Error("Reasoning packs must be a reviewed schemaVersion 1 collection.");
  }
  const packIds = new Set();
  for (const pack of source.packs) {
    if (!pack.id || packIds.has(pack.id)) throw new Error(`Duplicate or missing pack id: ${pack.id || "<missing>"}`);
    packIds.add(pack.id);
    if (pack.review_status !== "reviewed") throw new Error(`Pack ${pack.id} must be reviewed.`);
    if (!pack.title_en || !pack.title_ru || !pack.description_en || !pack.description_ru || !pack.outcome_en || !pack.outcome_ru) throw new Error(`Pack ${pack.id} is incomplete.`);
    if (!Array.isArray(pack.steps) || pack.steps.length < 4) throw new Error(`Pack ${pack.id} needs at least four steps.`);
    for (const step of pack.steps) {
      if (!step.instruction_en || !step.instruction_ru) throw new Error(`Pack ${pack.id} has an untranslated instruction.`);
      if (step.kind === "pattern" && !patternMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing pattern ${step.id}.`);
      if (step.kind === "contrast" && !contrastMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing contrast ${step.id}.`);
      if (step.kind === "drill" && !drillMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing drill ${step.id}.`);
      if (!["pattern", "contrast", "drill"].includes(step.kind)) throw new Error(`Pack ${pack.id} has unsupported step kind ${step.kind}.`);
    }
  }
}

export function validateTeacherExportSources(packSource, patternMap, contrastMap, drillMap) {
  if (packSource.schemaVersion !== 1 || packSource.status !== "reviewed-pilot") throw new Error("Teacher exports require the reviewed Reasoning Pack source.");
  for (const pack of packSource.packs) {
    if (pack.review_status !== "reviewed") throw new Error(`Pack ${pack.id} is not reviewed.`);
    for (const step of pack.steps) {
      if (step.kind === "pattern" && !patternMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing pattern ${step.id}.`);
      if (step.kind === "contrast" && !contrastMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing contrast ${step.id}.`);
      if (step.kind === "drill" && !drillMap.has(step.id)) throw new Error(`Pack ${pack.id} references missing drill ${step.id}.`);
    }
  }
}

export function validateRussianSpeakerErrors(source, patternMap) {
  if (source?.schemaVersion !== 1 || source.status !== "reviewed-pilot") throw new Error("Russian-speaker error map must be reviewed-pilot schemaVersion 1");
  if (!Array.isArray(source.items) || source.items.length < 3) throw new Error("Russian-speaker error map requires items");
  const ids = new Set();
  const slugs = new Set();
  for (const item of source.items) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing Russian-speaker error id: ${item.id || "<missing>"}`);
    if (!item.slug || slugs.has(item.slug)) throw new Error(`Duplicate or missing Russian-speaker error slug: ${item.slug || "<missing>"}`);
    ids.add(item.id);
    slugs.add(item.slug);
    if (!patternMap.has(item.pattern_id)) throw new Error(`${item.id} references missing pattern ${item.pattern_id}`);
    for (const field of ["title_en", "title_ru", "search_title_en", "search_title_ru", "wrong_en", "correct_en", "why_en", "why_ru", "memory_en", "memory_ru"]) {
      if (!item[field]?.trim()) throw new Error(`${item.id} is missing ${field}`);
    }
  }
}

export function validatePartnershipPayload(payload) {
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.opportunities) || !payload.opportunities.length) {
    throw new Error("data/partnership-opportunities.json must contain schemaVersion 1 and opportunities");
  }
}

// Validates the merged base + extension discovery topics. `combined` is the
// ordered topic list, `validSets` the known study-set ids.
export function validateDiscoveryTopics(combined, validSets) {
  const ids = new Set();
  const slugs = new Set();
  for (const topic of combined) {
    if (!topic.id || ids.has(topic.id)) throw new Error(`Duplicate or missing discovery topic id: ${topic.id}`);
    if (!topic.slug || slugs.has(topic.slug)) throw new Error(`Duplicate or missing discovery topic slug: ${topic.slug}`);
    ids.add(topic.id);
    slugs.add(topic.slug);
    if (!Array.isArray(topic.set_ids) || !topic.set_ids.length) throw new Error(`${topic.id}: missing set_ids`);
    for (const setId of topic.set_ids) if (!validSets.has(setId)) throw new Error(`${topic.id}: unknown set ${setId}`);
  }
  for (const topic of combined) for (const relatedId of topic.related || []) if (!ids.has(relatedId)) throw new Error(`${topic.id}: unknown related topic ${relatedId}`);
}

export function validateLanguagePilotFrames(file, value) {
  if (!Array.isArray(value)) throw new Error(`${file} must contain an array of Frame extensions.`);
}

export function validateLearningEventSchema(schema) {
  if (schema?.properties?.event_name?.enum?.length < 6) throw new Error("Learning event schema must define the reviewed event vocabulary.");
}
