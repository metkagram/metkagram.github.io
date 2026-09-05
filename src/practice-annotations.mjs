import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import zlib from "node:zlib";
import { ANNOTATION_SCHEMA_VERSION, cleanMarkedText, validateAnnotation } from "./annotation-schema.mjs";

export const EDITORIAL_ANNOTATION_GENERATOR = "editorial-fixed-frame-v1";
const EDITORIAL_SETS = ["ARG", "PRO"];

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function practiceAnnotationReferences(content) {
  const references = new Map();
  for (const pattern of content.advancedPatterns) for (const language of pattern.langs) {
    const examples = [{ index: "primary", text: language.example }, ...(language.examples || []).map((example, index) => ({ index: String(index + 1), text: example.text }))];
    for (const example of examples) {
      const key = `${pattern.id}:${language.lang}:${example.index}`;
      if (references.has(key)) throw new Error(`Duplicate Practice annotation source ${key}`);
      references.set(key, { key, setId: pattern.set_id, language: language.lang, text: cleanMarkedText(example.text) });
    }
  }
  return references;
}

function validatePayload(payload, label, generator) {
  if (!payload || typeof payload !== "object" || payload.schema_version !== ANNOTATION_SCHEMA_VERSION || payload.generator !== generator) throw new Error(`Invalid ${label} annotation payload`);
  if (!payload.items || Array.isArray(payload.items) || typeof payload.items !== "object" || !Number.isInteger(payload.count) || payload.count !== Object.keys(payload.items).length) throw new Error(`${label} annotation export count is invalid`);
}

function validateRecord(record, reference, label) {
  if (!record || typeof record !== "object" || typeof record.text !== "string" || !Array.isArray(record.spans) || record.spans.some((span) => !span || typeof span !== "object")) throw new Error(`Malformed ${label} annotation ${reference.key}`);
  const errors = validateAnnotation(record);
  if (errors.length || !record.spans.length) throw new Error(`Invalid ${label} annotation ${reference.key}: ${errors.join(", ") || "missing spans"}`);
  if (record.language !== reference.language || record.locale !== reference.language || record.source?.dataset !== "advanced-patterns" || record.source?.set_id !== reference.setId || record.source?.pattern_example_id !== reference.key) throw new Error(`${label} annotation source mismatch for ${reference.key}`);
}

export function resolvePracticeAnnotations(content, payload, overrides = null, integrity = null) {
  validatePayload(payload, "Practice", "local-spacy-dependency");
  const references = practiceAnnotationReferences(content);
  if (overrides !== null) {
    validatePayload(overrides, "Editorial", EDITORIAL_ANNOTATION_GENERATOR);
    if (!isDeepStrictEqual(overrides.set_ids, EDITORIAL_SETS)) throw new Error("Invalid editorial annotation scope");
    for (const key of Object.keys(overrides.items)) {
      if (!references.has(key) || !Object.hasOwn(payload.items, key)) throw new Error(`Unknown editorial annotation ${key}`);
      if (!EDITORIAL_SETS.includes(references.get(key).setId)) throw new Error(`Unsupported editorial annotation source ${key}`);
    }
  }
  for (const key of Object.keys(payload.items)) if (!references.has(key)) throw new Error(`Unknown Practice annotation ${key}`);
  const resolved = {};
  for (const [key, reference] of references) {
    const baseRecord = payload.items[key];
    if (!baseRecord) throw new Error(`Missing Practice annotation ${key}`);
    validateRecord(baseRecord, reference, "Practice");
    if (baseRecord.inline_text !== baseRecord.text) throw new Error(`Practice annotation inline text mismatch for ${key}`);
    const hasOverride = overrides !== null && Object.hasOwn(overrides.items, key);
    const override = hasOverride ? overrides.items[key] : null;
    if (hasOverride) validateRecord(override, reference, "Editorial");
    const record = hasOverride ? override : baseRecord;
    if (record.text !== reference.text || record.inline_text !== reference.text) throw new Error(`Practice annotation text mismatch for ${key}`);
    if (hasOverride) {
      if (baseRecord.text === reference.text) throw new Error(`Unnecessary editorial override for unchanged ${key}`);
      if (override.provenance?.base_record_id !== baseRecord.id || override.provenance?.base_record_sha256 !== hash(JSON.stringify(baseRecord)) || override.provenance?.source_text_sha256 !== hash(reference.text)) throw new Error(`Stale editorial annotation ${key}: prepare a new explicit export in the private editorial workflow`);
      if (override.validation?.generator !== EDITORIAL_ANNOTATION_GENERATOR || override.validation?.coverage !== "fixed-frame-only" || override.validation?.dependency_parse !== false) throw new Error(`Invalid partial editorial annotation provenance for ${key}`);
    }
    resolved[key] = record;
  }
  if (payload.count !== references.size) throw new Error(`Practice annotation export count mismatch: expected ${references.size}, found ${payload.count}`);
  if (overrides !== null) {
    if (integrity?.schemaVersion !== 1 || integrity?.count !== overrides.count || integrity?.payload_sha256 !== hash(JSON.stringify(overrides))) throw new Error("Editorial annotation integrity mismatch: the published export requires deliberate editorial verification");
  }
  return resolved;
}

export function readPracticeAnnotationPayload(root = process.cwd()) {
  const source = path.join(root, "data", "pattern-annotations.json.gz");
  if (!fs.existsSync(source)) throw new Error("Missing required public Practice annotation layer");
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(source)).toString("utf8"));
}

export function loadPatternAnnotations(content, { root = process.cwd() } = {}) {
  const overridePath = path.join(root, "data", "pattern-annotation-overrides.json");
  const overrides = fs.existsSync(overridePath) ? JSON.parse(fs.readFileSync(overridePath, "utf8")) : null;
  const integrityPath = path.join(root, "data", "pattern-annotation-integrity.json");
  const integrity = fs.existsSync(integrityPath) ? JSON.parse(fs.readFileSync(integrityPath, "utf8")) : null;
  return resolvePracticeAnnotations(content, readPracticeAnnotationPayload(root), overrides, integrity);
}

