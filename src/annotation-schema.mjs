// Canonical annotation records are deliberately text-first. Offsets use JavaScript
// UTF-16 code units, the same coordinate system used by the static renderer.
export const ANNOTATION_SCHEMA_VERSION = "1.0.0";

export function cleanMarkedText(value = "") {
  return String(value).replaceAll(/\*\*(.+?)\*\*/g, "$1");
}

export function validateAnnotation(record) {
  const errors = [];
  const knownTypes = new Set(["subject", "verb", "helper", "function", "pattern_part"]);
  const knownGenders = new Set(["feminine", "masculine", "neuter"]);
  if (record.schema_version !== ANNOTATION_SCHEMA_VERSION) errors.push("unsupported schema_version");
  if (!record.id) errors.push("missing id");
  if (!record.text) errors.push("missing text");
  if (!record.language) errors.push("missing language");
  const spans = record.spans || [];
  const seen = new Set();
  let previousEnd = 0;
  for (const span of spans) {
    if (!span.id || seen.has(span.id)) errors.push(`duplicate span id ${span.id || "(empty)"}`);
    seen.add(span.id);
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > record.text.length) errors.push(`invalid offsets for ${span.id}`);
    if (!span.type || !span.label) errors.push(`incomplete span ${span.id}`);
    if (!knownTypes.has(span.type)) errors.push(`invalid annotation type for ${span.id}`);
    if (span.gender && !knownGenders.has(span.gender)) errors.push(`invalid gender for ${span.id}`);
    if (span.tense && span.tense !== "past") errors.push(`invalid tense for ${span.id}`);
    if (span.start < previousEnd) errors.push(`overlapping span ${span.id}`);
    previousEnd = Math.max(previousEnd, span.end);
  }
  return errors;
}

function leaves(node, output = []) {
  if (!node || typeof node !== "object") return output;
  if (Array.isArray(node.children) && node.children.length) node.children.forEach((child) => leaves(child, output));
  else if (typeof node.text === "string") output.push({ text: node.text, tag: node.tag, extra: node.extra });
  return output;
}

function tagKind(tag) {
  if (["S", "S*"].includes(tag)) return "subject";
  if (["V", "v2", "vI", "vP", "Vp"].includes(tag)) return "verb";
  if (["Hf", "Hr", "Hst", "M"].includes(tag)) return "helper";
  return "function";
}

function legacyGender(tag = "") {
  const normalized = String(tag).replace(/^Q\//, "");
  return { FEM: "feminine", MASC: "masculine", NEUT: "neuter" }[normalized] || null;
}

function legacyTense(extra = "") {
  return String(extra).toLowerCase() === "past" ? "past" : null;
}

export function legacyAnnotationToCanonical(annotation, context = {}) {
  const recoveredText = leaves(annotation.text_span).filter((token) => token.tag !== "tag").map((token) => token.text).join("");
  const text = annotation.original_text || recoveredText;
  const spans = [];
  let pendingTag = null;
  let cursor = 0;
  const isGerman = /^de(?:-|$)/i.test(context.language || "");
  for (const token of leaves(annotation.text_span)) {
    if (token.tag === "tag") { pendingTag = { label: token.text.trim() || "Unclassified", role: token.extra || null }; continue; }
    const start = text.indexOf(token.text, cursor);
    if (start < 0) {
      if (token.text.trim()) pendingTag = null;
      continue;
    }
    cursor = start + token.text.length;
    if (!token.text.trim()) continue;
    const gender = isGerman ? legacyGender(token.tag) : null;
    if (pendingTag) {
      const tense = isGerman ? legacyTense(pendingTag.role) : null;
      spans.push({
        id: `${annotation.id}-s${spans.length + 1}`,
        start,
        end: start + token.text.length,
        type: tagKind(pendingTag.label),
        label: pendingTag.label,
        role: pendingTag.role,
        ...(gender ? { gender } : {}),
        ...(tense ? { tense } : {})
      });
      pendingTag = null;
    } else if (gender) {
      spans.push({ id: `${annotation.id}-s${spans.length + 1}`, start, end: start + token.text.length, type: "function", label: "Gender", role: "gender", gender });
    }
  }
  return {
    schema_version: ANNOTATION_SCHEMA_VERSION,
    id: annotation.id,
    kind: "sentence",
    text,
    inline_text: text,
    language: context.language || "und",
    locale: context.locale || context.language || "und",
    translations: annotation.translations || (annotation.translated_text ? { und: annotation.translated_text } : {}),
    explanation: annotation.chunkList || "",
    examples: [],
    difficulty: context.difficulty || null,
    cefr: context.cefr || null,
    source: { dataset: context.dataset || "legacy", set_id: context.set_id || null, document_id: context.document_id || null },
    slots: [],
    spans,
    validation: { migrated_from: "metkagram-text-span", status: "valid" },
    legacy: { text_span: annotation.text_span, translated_text: annotation.translated_text || "" }
  };
}

function spansFromMarkedText(value, id) {
  const text = cleanMarkedText(value);
  const spans = [];
  let cleanCursor = 0;
  const matcher = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = matcher.exec(value))) {
    const prefix = value.slice(cleanCursor ? 0 : 0, match.index).replaceAll("**", "");
    const start = prefix.length;
    spans.push({ id: `${id}-s${spans.length + 1}`, start, end: start + match[1].length, type: "pattern_part", label: "Functional part", role: "reusable structure" });
    cleanCursor = matcher.lastIndex;
  }
  return { text, spans };
}

export function patternToCanonicalCards(pattern, serviceAnnotations = {}) {
  return pattern.langs.map((lang) => {
    const primary = serviceAnnotations[`${pattern.id}:${lang.lang}:primary`] || spansFromMarkedText(lang.example, `${pattern.id}-${lang.lang}`);
    const examples = (lang.examples || []).map((example, index) => {
      const serviceRecord = serviceAnnotations[`${pattern.id}:${lang.lang}:${index + 1}`];
      if (serviceRecord) return { id: serviceRecord.id, text: serviceRecord.text, translation: example.translation_ru || "", spans: serviceRecord.spans, validation: serviceRecord.validation };
      const value = spansFromMarkedText(example.text, `${pattern.id}-${lang.lang}-e${index + 1}`);
      return { id: `${pattern.id}-${lang.lang}-e${index + 1}`, text: value.text, translation: example.translation_ru || "", spans: value.spans };
    });
    return {
      schema_version: ANNOTATION_SCHEMA_VERSION, id: `${pattern.id}-${lang.lang}`, kind: "pattern_card",
      text: primary.text, inline_text: primary.text, language: lang.lang, locale: lang.lang,
      translations: lang.translation ? { ru: lang.translation } : {}, explanation: pattern.metaphor_ru || "",
      examples, difficulty: "advanced", cefr: "B2–C1", source: { dataset: "advanced-patterns", set_id: pattern.set_id, pattern_id: pattern.id },
      slots: [{ id: "formula", label: lang.formula, substitutions: [] }], spans: primary.spans,
      metadata: { function: pattern.group_id, topic: pattern.set_id, register: "neutral", tags: [pattern.group_id, pattern.set_id], related_patterns: [] },
      validation: primary.validation || { migrated_from: "advanced-patterns", status: "valid" }
    };
  });
}

export function renderCanonicalText(record, renderSpan) {
  let output = ""; let cursor = 0;
  for (const span of [...(record.spans || [])].sort((a, b) => a.start - b.start)) {
    output += record.text.slice(cursor, span.start);
    output += renderSpan(span, record.text.slice(span.start, span.end));
    cursor = span.end;
  }
  return output + record.text.slice(cursor);
}
