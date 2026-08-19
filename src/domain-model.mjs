import { languageRegistry, normalizeTranslations } from "./language-registry.mjs";

export const DOMAIN_MODEL_VERSION = "1.1.0";

function slug(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clean(value = "") {
  return String(value).replaceAll("**", "").replaceAll(/\s+/g, " ").trim();
}

function cleanTranslations(record) {
  return Object.fromEntries(
    Object.entries(normalizeTranslations(record))
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([locale, value]) => [locale, clean(value)])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

export function moveId(moveName) {
  const key = slug(moveName);
  return key ? `move:${key}` : null;
}

export function frameId(patternId, language) {
  return `frame:${String(patternId).toLowerCase()}:${String(language).toLowerCase()}`;
}

export function bridgeId(patternId, fromLanguage, toLanguage) {
  return `bridge:${String(patternId).toLowerCase()}:${String(fromLanguage).toLowerCase()}-${String(toLanguage).toLowerCase()}`;
}

function frameRecord(pattern, languageRecord, registry, metadata = {}) {
  const language = languageRecord.lang;
  const languageMeta = registry[language];
  if (!languageMeta) throw new Error(`Pattern ${pattern.id} uses unregistered language ${language}.`);
  if (!languageMeta.roles?.learning) throw new Error(`Pattern ${pattern.id} uses ${language} as a Frame language, but it is not enabled for learning.`);

  const move = moveId(pattern.reasoning?.move);
  const record = {
    id: frameId(pattern.id, language),
    kind: "frame",
    model_version: DOMAIN_MODEL_VERSION,
    pattern_id: pattern.id,
    move_id: move,
    language,
    formula: clean(languageRecord.formula || ""),
    example: clean(languageRecord.example || ""),
    translations: cleanTranslations(languageRecord),
    examples: (languageRecord.examples || []).map((example) => ({
      text: clean(example.text || ""),
      translations: cleanTranslations(example),
    })),
    source_status: metadata.source_status || languageRecord.source_status || pattern.quality?.status || pattern.gen?.status || "unknown",
    source_kind: metadata.source_kind || "canonical_pattern",
  };
  if (metadata.review || languageRecord.review) record.review = metadata.review || languageRecord.review;
  return record;
}

function extensionFrameRecords(patterns, frameExtensions, registry, occupiedFrameIds) {
  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const result = [];
  for (const extension of frameExtensions || []) {
    if (!extension || typeof extension.pattern_id !== "string" || !extension.pattern_id) throw new Error("Frame extension requires pattern_id.");
    if (typeof extension.lang !== "string" || !extension.lang) throw new Error(`Frame extension ${extension.pattern_id} requires lang.`);
    const pattern = patternById.get(extension.pattern_id);
    if (!pattern) throw new Error(`Frame extension ${extension.pattern_id}/${extension.lang} references an unknown canonical pattern.`);
    const id = frameId(extension.pattern_id, extension.lang);
    if (occupiedFrameIds.has(id)) throw new Error(`Frame extension duplicates existing Frame ${id}.`);
    const frame = frameRecord(pattern, extension, registry, {
      source_status: extension.source_status || "language_extension",
      source_kind: "language_extension",
      review: extension.review || null,
    });
    occupiedFrameIds.add(id);
    result.push(frame);
  }
  return result;
}

function moveRecords(patterns, frames) {
  const byId = new Map();
  const framesByPattern = new Map();
  for (const frame of frames) {
    if (!framesByPattern.has(frame.pattern_id)) framesByPattern.set(frame.pattern_id, []);
    framesByPattern.get(frame.pattern_id).push(frame.id);
  }

  for (const pattern of patterns) {
    const name = pattern.reasoning?.move;
    const id = moveId(name);
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        kind: "move",
        model_version: DOMAIN_MODEL_VERSION,
        name,
        language: null,
        language_independent: true,
        pattern_ids: [],
        frame_ids: [],
      });
    }
    const move = byId.get(id);
    move.pattern_ids.push(pattern.id);
    move.frame_ids.push(...(framesByPattern.get(pattern.id) || []));
  }

  return [...byId.values()]
    .map((move) => ({
      ...move,
      pattern_ids: [...new Set(move.pattern_ids)].sort(),
      frame_ids: [...new Set(move.frame_ids)].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeReviewedMapping(mapping) {
  if (!mapping || !mapping.pattern_id) return null;
  if (mapping.from_language && mapping.to_language) {
    return {
      pattern_id: mapping.pattern_id,
      from_language: mapping.from_language,
      to_language: mapping.to_language,
      relation: mapping.relation || "functional_near_equivalent",
      review_status: mapping.review_status || "reviewed",
      literal_equivalence: mapping.literal_equivalence === true,
      review_basis: mapping.review_basis || "Explicit reviewed cross-language mapping.",
      source: mapping.source || "reviewed-mapping",
    };
  }

  if (mapping.formula_en && mapping.formula_de) {
    return {
      pattern_id: mapping.pattern_id,
      from_language: "en",
      to_language: "de",
      relation: "functional_near_equivalent",
      review_status: "reviewed",
      literal_equivalence: mapping.literal_equivalence === true,
      review_basis: mapping.review_basis || "Reviewed bilingual forms stored in the same canonical Metkagram pattern.",
      source: "cross-language-map",
    };
  }
  return null;
}

function bridgeRecords(reviewedMappings, frames) {
  const frameMap = new Map(frames.map((frame) => [frame.id, frame]));
  const result = [];

  for (const raw of reviewedMappings || []) {
    const mapping = normalizeReviewedMapping(raw);
    if (!mapping) continue;
    const fromFrameId = frameId(mapping.pattern_id, mapping.from_language);
    const toFrameId = frameId(mapping.pattern_id, mapping.to_language);
    const fromFrame = frameMap.get(fromFrameId);
    const toFrame = frameMap.get(toFrameId);
    if (!fromFrame || !toFrame) throw new Error(`Reviewed Bridge ${mapping.pattern_id} references a missing Frame.`);
    if (fromFrame.language === toFrame.language) throw new Error(`Bridge ${mapping.pattern_id} must connect two different learning languages.`);
    if (mapping.review_status !== "reviewed") throw new Error(`Bridge ${mapping.pattern_id} is not reviewed.`);

    const sharedMove = fromFrame.move_id && fromFrame.move_id === toFrame.move_id ? fromFrame.move_id : null;
    result.push({
      id: bridgeId(mapping.pattern_id, mapping.from_language, mapping.to_language),
      kind: "bridge",
      model_version: DOMAIN_MODEL_VERSION,
      pattern_id: mapping.pattern_id,
      move_id: sharedMove,
      from_frame_id: fromFrameId,
      to_frame_id: toFrameId,
      from_language: mapping.from_language,
      to_language: mapping.to_language,
      relation: mapping.relation,
      review_status: mapping.review_status,
      literal_equivalence: mapping.literal_equivalence,
      review_basis: mapping.review_basis,
      source: mapping.source,
    });
  }

  return result.sort((a, b) => a.id.localeCompare(b.id));
}

function patternIndex(patterns, frames) {
  const byPattern = new Map();
  for (const frame of frames) {
    if (!byPattern.has(frame.pattern_id)) byPattern.set(frame.pattern_id, {});
    byPattern.get(frame.pattern_id)[frame.language] = frame.id;
  }
  return patterns.map((pattern) => ({
    pattern_id: pattern.id,
    move_id: moveId(pattern.reasoning?.move),
    frame_ids: Object.fromEntries(Object.entries(byPattern.get(pattern.id) || {}).sort(([a], [b]) => a.localeCompare(b))),
  })).sort((a, b) => a.pattern_id.localeCompare(b.pattern_id));
}

function validateTranslationMap(frameIdValue, translations, registry) {
  for (const locale of Object.keys(translations || {})) {
    if (!registry[locale]?.roles?.translation) throw new Error(`Frame ${frameIdValue} uses unsupported translation locale ${locale}.`);
  }
}

export function validateDomainModel(model, registry = languageRegistry) {
  const moveIds = new Set();
  const frameIds = new Set();
  const bridgeIds = new Set();

  for (const move of model.moves) {
    if (!move.id || moveIds.has(move.id)) throw new Error(`Duplicate or missing Move id: ${move.id || "<missing>"}.`);
    if (move.language !== null || move.language_independent !== true) throw new Error(`Move ${move.id} must be language-independent.`);
    moveIds.add(move.id);
  }

  for (const frame of model.frames) {
    if (!frame.id || frameIds.has(frame.id)) throw new Error(`Duplicate or missing Frame id: ${frame.id || "<missing>"}.`);
    if (!frame.language || !registry[frame.language]?.roles?.learning) throw new Error(`Frame ${frame.id} must have exactly one enabled learning language.`);
    if (!frame.formula) throw new Error(`Frame ${frame.id} is missing its formula.`);
    if (!frame.example) throw new Error(`Frame ${frame.id} is missing its primary example.`);
    if (frame.move_id && !moveIds.has(frame.move_id)) throw new Error(`Frame ${frame.id} references missing Move ${frame.move_id}.`);
    validateTranslationMap(frame.id, frame.translations, registry);
    for (const example of frame.examples || []) {
      if (!example.text) throw new Error(`Frame ${frame.id} contains an empty example.`);
      validateTranslationMap(frame.id, example.translations, registry);
    }
    if (frame.source_kind === "language_extension") {
      if ((frame.examples || []).length < 2) throw new Error(`Language extension ${frame.id} requires at least two additional examples.`);
      if (!frame.review?.status || !frame.review?.basis) throw new Error(`Language extension ${frame.id} requires explicit editorial review metadata.`);
    }
    frameIds.add(frame.id);
  }

  for (const bridge of model.bridges) {
    if (!bridge.id || bridgeIds.has(bridge.id)) throw new Error(`Duplicate or missing Bridge id: ${bridge.id || "<missing>"}.`);
    if (!frameIds.has(bridge.from_frame_id) || !frameIds.has(bridge.to_frame_id)) throw new Error(`Bridge ${bridge.id} references a missing Frame.`);
    if (bridge.from_frame_id === bridge.to_frame_id || bridge.from_language === bridge.to_language) throw new Error(`Bridge ${bridge.id} must connect different Frames and languages.`);
    if (bridge.review_status !== "reviewed") throw new Error(`Bridge ${bridge.id} must be reviewed before publication.`);
    if (bridge.literal_equivalence !== false) throw new Error(`Bridge ${bridge.id} must not claim literal equivalence.`);
    if (bridge.move_id && !moveIds.has(bridge.move_id)) throw new Error(`Bridge ${bridge.id} references missing Move ${bridge.move_id}.`);
    bridgeIds.add(bridge.id);
  }

  if (model.patternIndex.length !== model.patternCount) throw new Error("Pattern compatibility index must cover every canonical pattern.");
  return model;
}

export function buildDomainModel(patterns, { registry = languageRegistry, reviewedMappings = [], frameExtensions = [] } = {}) {
  if (!Array.isArray(patterns) || !patterns.length) throw new Error("Multilingual domain model requires canonical patterns.");

  const canonicalFrames = patterns
    .flatMap((pattern) => (pattern.langs || []).map((languageRecord) => frameRecord(pattern, languageRecord, registry)));
  const occupiedFrameIds = new Set(canonicalFrames.map((frame) => frame.id));
  const extensionFrames = extensionFrameRecords(patterns, frameExtensions, registry, occupiedFrameIds);
  const frames = [...canonicalFrames, ...extensionFrames].sort((a, b) => a.id.localeCompare(b.id));
  const moves = moveRecords(patterns, frames);
  const bridges = bridgeRecords(reviewedMappings, frames);
  const index = patternIndex(patterns, frames);

  return validateDomainModel({
    schemaVersion: 1,
    modelVersion: DOMAIN_MODEL_VERSION,
    patternCount: patterns.length,
    extensionFrameCount: extensionFrames.length,
    moves,
    frames,
    bridges,
    patternIndex: index,
  }, registry);
}
