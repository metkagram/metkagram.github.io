import { ATTRIBUTION, getDatasetVersion, getReleaseDate, provenance, stableHash } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";
import { patternUrl } from "./seo-slugs.mjs";

export const SPOKEN_PRACTICE_HANDOFF_VERSION = "1.0.0";
export const SPOKEN_PRACTICE_CONSUMER_BOUNDARY = "Speech capture, playback, delivery feedback and any speech evaluation belong to the external consumer; Metkagram supplies the reviewed language task only.";
export const SPOKEN_PRACTICE_CACHE_SCOPE = "authorized-user-requested-immutable-snapshot-only";

const FORBIDDEN_FIELD = /(?:^|_)(?:audio|asr|transcript|pronunciation|prosody|acoustic|phoneme|speech_score|delivery_score|fluency_score)(?:_|$)/i;
const FIXTURE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function asMap(items, key = "id") {
  return items instanceof Map ? items : new Map((items || []).map((item) => [item?.[key], item]));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function assertFixture(fixture) {
  if (!fixture || !FIXTURE_ID.test(fixture.id || "")) throw new Error(`Spoken practice handoff fixture needs a stable slug id: ${fixture?.id || "<missing>"}`);
  if (!fixture.provider_id) throw new Error(`${fixture.id}: provider_id is required`);
  if (!fixture.source?.type || !fixture.source?.id) throw new Error(`${fixture.id}: source type and id are required`);
  if (!fixture.language_context?.practice_language) throw new Error(`${fixture.id}: practice_language is required`);
  for (const key of ["communicative_job", "production_prompt", "transfer_prompt"]) {
    if (!fixture.practice_projection?.[key]) throw new Error(`${fixture.id}: practice_projection.${key} is required`);
  }
}

function assertPatternLanguage(pattern, language, fixtureId) {
  const record = pattern?.langs?.find((item) => item.lang === language);
  if (!record) throw new Error(`Spoken practice handoff abstained for ${fixtureId}: ${pattern?.id || "source Pattern"} has no reviewed ${language} learning record`);
  return record;
}

function sourceProvenance(source, canonicalUrl, recordType) {
  const contentHash = stableHash(source);
  return {
    contentHash,
    value: provenance({
      canonical_url: canonicalUrl,
      record_type: recordType,
      record_id: source.id,
      content_hash: contentHash,
    }),
  };
}

function patternProjection(fixture, patternMap) {
  const pattern = patternMap.get(fixture.source.id);
  if (!pattern) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Pattern ${fixture.source.id} does not resolve`);
  assertPatternLanguage(pattern, fixture.language_context.practice_language, fixture.id);
  const canonicalUrl = patternUrl("en", pattern);
  const source = sourceProvenance(pattern, canonicalUrl, "pattern");
  return {
    source,
    sourceObject: {
      type: "pattern",
      id: pattern.id,
      canonical_url: canonicalUrl,
      api_url: `${SITE_URL}/api/v1/patterns/${pattern.id.toLowerCase()}.json`,
      content_hash: source.contentHash,
    },
    semanticContext: {
      move_id: pattern.reasoning?.move || null,
      pattern_ids: [pattern.id],
      frame_ids: pattern.reasoning ? [pattern.id] : [],
      contrast_id: null,
      choice_id: null,
      route_id: null,
      route_steps: [],
      bridge_id: null,
    },
  };
}

function choiceProjection(fixture, patternMap, choiceMap) {
  const choice = choiceMap.get(fixture.source.id);
  if (!choice) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Choice ${fixture.source.id} does not resolve`);
  const patternIds = unique(choice.options || []);
  if (!patternIds.length || !choice.answer_pattern || !patternIds.includes(choice.answer_pattern)) {
    throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Choice ${choice.id} does not preserve a reviewed answer inside its options`);
  }
  for (const patternId of patternIds) {
    const pattern = patternMap.get(patternId);
    if (!pattern) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Choice ${choice.id} references missing Pattern ${patternId}`);
    assertPatternLanguage(pattern, fixture.language_context.practice_language, fixture.id);
  }
  const canonicalUrl = `${SITE_URL}/en/clinic/#${choice.id}`;
  const source = sourceProvenance(choice, canonicalUrl, "pattern_choice_drill");
  return {
    source,
    sourceObject: {
      type: "choice",
      id: choice.id,
      canonical_url: canonicalUrl,
      api_url: `${SITE_URL}/api/v1/choices/${choice.id}.json`,
      content_hash: source.contentHash,
    },
    semanticContext: {
      move_id: null,
      pattern_ids: patternIds,
      frame_ids: patternIds.filter((id) => Boolean(patternMap.get(id)?.reasoning)),
      contrast_id: choice.contrast_id || null,
      choice_id: choice.id,
      route_id: null,
      route_steps: [],
      bridge_id: null,
    },
  };
}

function routeProjection(fixture, patternMap, choiceMap, routeMap) {
  const route = routeMap.get(fixture.source.id);
  if (!route) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Route ${fixture.source.id} does not resolve`);
  if (!Array.isArray(route.steps) || !route.steps.length) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Route ${route.id} has no reviewed steps`);

  const patternIds = [];
  for (const step of route.steps) {
    if (step.kind === "pattern") {
      const pattern = patternMap.get(step.id);
      if (!pattern) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Route ${route.id} references missing Pattern ${step.id}`);
      assertPatternLanguage(pattern, fixture.language_context.practice_language, fixture.id);
      patternIds.push(step.id);
    } else if (step.kind === "drill") {
      const drill = choiceMap.get(step.id);
      if (!drill) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Route ${route.id} references missing Choice ${step.id}`);
      for (const patternId of drill.options || []) {
        const pattern = patternMap.get(patternId);
        if (!pattern) throw new Error(`Spoken practice handoff abstained for ${fixture.id}: Choice ${drill.id} references missing Pattern ${patternId}`);
        assertPatternLanguage(pattern, fixture.language_context.practice_language, fixture.id);
      }
    } else if (step.kind !== "contrast") {
      throw new Error(`Spoken practice handoff abstained for ${fixture.id}: unsupported Route step kind ${step.kind}`);
    }
  }

  const canonicalUrl = `${SITE_URL}/en/packs/${route.id}/`;
  const source = sourceProvenance(route, canonicalUrl, "reasoning_pack");
  return {
    source,
    sourceObject: {
      type: "route",
      id: route.id,
      canonical_url: canonicalUrl,
      api_url: `${SITE_URL}/api/v1/routes/${route.id}.json`,
      content_hash: source.contentHash,
    },
    semanticContext: {
      move_id: null,
      pattern_ids: unique(patternIds),
      frame_ids: unique(patternIds.filter((id) => Boolean(patternMap.get(id)?.reasoning))),
      contrast_id: null,
      choice_id: null,
      route_id: route.id,
      route_steps: route.steps.map((step) => ({ kind: step.kind, id: step.id })),
      bridge_id: null,
    },
  };
}

function assertNoSpeechMetrics(value, path = "handoff") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSpeechMetrics(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELD.test(key)) throw new Error(`${path}.${key}: speech-analysis fields do not belong in a Metkagram handoff`);
    assertNoSpeechMetrics(child, `${path}.${key}`);
  }
}

export function validateSpokenPracticeHandoff(handoff) {
  if (handoff?.schema_version !== SPOKEN_PRACTICE_HANDOFF_VERSION) throw new Error("Spoken practice handoff schema_version drifted");
  if (!handoff?.handoff_id?.startsWith("metkagram:spoken-practice:v1:")) throw new Error("Spoken practice handoff id is missing or invalid");
  if (!handoff.provider_id) throw new Error(`${handoff.handoff_id}: provider_id is required`);
  if (!handoff.dataset_version || !handoff.release_date) throw new Error(`${handoff.handoff_id}: dataset/release identity is required`);
  if (!handoff.source_object?.id || !handoff.source_object?.canonical_url || !handoff.source_object?.api_url || !handoff.source_object?.content_hash) throw new Error(`${handoff.handoff_id}: canonical source identity is incomplete`);
  if (!handoff.language_context?.practice_language) throw new Error(`${handoff.handoff_id}: practice language is required`);
  if (!handoff.practice_projection?.communicative_job || !handoff.practice_projection?.production_prompt || !handoff.practice_projection?.transfer_prompt) throw new Error(`${handoff.handoff_id}: productive practice projection is incomplete`);
  if (handoff.practice_projection.consumer_boundary !== SPOKEN_PRACTICE_CONSUMER_BOUNDARY) throw new Error(`${handoff.handoff_id}: consumer speech boundary drifted`);
  if (handoff.source_provenance?.canonical_url !== handoff.source_object.canonical_url) throw new Error(`${handoff.handoff_id}: provenance canonical URL drifted`);
  if (handoff.source_provenance?.content_hash !== handoff.source_object.content_hash) throw new Error(`${handoff.handoff_id}: provenance content hash drifted`);
  if (handoff.rights?.rights_url !== ATTRIBUTION.rights_url || handoff.rights?.license_url !== ATTRIBUTION.license_url) throw new Error(`${handoff.handoff_id}: rights references drifted`);
  if (handoff.rights?.cache_scope !== SPOKEN_PRACTICE_CACHE_SCOPE) throw new Error(`${handoff.handoff_id}: cache scope drifted`);
  assertNoSpeechMetrics(handoff);
  return handoff;
}

export function projectSpokenPracticeHandoff(fixture, { patterns = [], choices = [], routes = [] } = {}) {
  assertFixture(fixture);
  const patternMap = asMap(patterns);
  const choiceMap = asMap(choices);
  const routeMap = asMap(routes);

  let projection;
  if (fixture.source.type === "pattern") projection = patternProjection(fixture, patternMap);
  else if (fixture.source.type === "choice") projection = choiceProjection(fixture, patternMap, choiceMap);
  else if (fixture.source.type === "route") projection = routeProjection(fixture, patternMap, choiceMap, routeMap);
  else throw new Error(`Spoken practice handoff abstained for ${fixture.id}: source type ${fixture.source.type} is not supported by the M0/M1 projector`);

  const handoff = {
    schema_version: SPOKEN_PRACTICE_HANDOFF_VERSION,
    handoff_id: `metkagram:spoken-practice:v1:${fixture.id}`,
    provider_id: fixture.provider_id,
    dataset_version: getDatasetVersion(),
    release_date: getReleaseDate(),
    source_object: projection.sourceObject,
    language_context: {
      practice_language: fixture.language_context.practice_language,
      interface_locale: fixture.language_context.interface_locale ?? null,
      support_translation_locale: fixture.language_context.support_translation_locale ?? null,
      bridge_language: fixture.language_context.bridge_language ?? null,
    },
    semantic_context: projection.semanticContext,
    practice_projection: {
      communicative_job: fixture.practice_projection.communicative_job,
      production_prompt: fixture.practice_projection.production_prompt,
      self_check: fixture.practice_projection.self_check ?? null,
      transfer_prompt: fixture.practice_projection.transfer_prompt,
      consumer_boundary: SPOKEN_PRACTICE_CONSUMER_BOUNDARY,
    },
    source_provenance: projection.source.value,
    rights: {
      rights_status: ATTRIBUTION.rights_status,
      rights_url: ATTRIBUTION.rights_url,
      license_url: ATTRIBUTION.license_url,
      attribution_required: ATTRIBUTION.attribution_required,
      attribution_text: ATTRIBUTION.attribution_text,
      cache_scope: SPOKEN_PRACTICE_CACHE_SCOPE,
    },
  };

  return validateSpokenPracticeHandoff(handoff);
}
