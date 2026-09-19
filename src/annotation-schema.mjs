// Canonical annotation records are deliberately text-first. Offsets use JavaScript
// UTF-16 code units, the same coordinate system used by the static renderer.
export const ANNOTATION_SCHEMA_VERSION = "1.0.0";

export function cleanMarkedText(value = "") {
  return String(value).replaceAll(/\*\*(.+?)\*\*/g, "$1");
}

export function validateAnnotation(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["invalid record"];
  const knownTypes = new Set(["subject", "verb", "helper", "function", "pattern_part"]);
  const knownGenders = new Set(["feminine", "masculine", "neuter"]);
  const languageLabels = {
    en: new Set(["S", "S*", "st", "st*", "v2", "p2", "vI", "vP", "Vp", "Hr", "Hst", "pA", "pS", "Hf", "V", "M"]),
    de: new Set(["S", "S*", "st", "st*", "v2", "vI", "/→", "\\→", "\\?", "←…", "←...", "vP", "Vp", "Hr", "Hst", "Hf", "V", "M", "Gender"])
  };
  if (record.schema_version !== ANNOTATION_SCHEMA_VERSION) errors.push("unsupported schema_version");
  if (!record.id) errors.push("missing id");
  if (typeof record.text !== "string" || !record.text) return ["missing text"];
  if (!record.language) errors.push("missing language");
  if (record.emphasis && !["en", "de"].includes(record.language)) errors.push("unsupported emphasis language");
  const spans = record.spans || [];
  if (!Array.isArray(spans)) return ["invalid spans"];
  const seen = new Set();
  let previousEnd = 0;
  for (const span of spans) {
    if (!span || typeof span !== "object") { errors.push("invalid span"); continue; }
    if (!span.id || seen.has(span.id)) errors.push(`duplicate span id ${span.id || "(empty)"}`);
    seen.add(span.id);
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > record.text.length) errors.push(`invalid offsets for ${span.id}`);
    for (const offset of [span.start, span.end]) if (offset > 0 && /[\uD800-\uDBFF]/.test(record.text[offset - 1]) && /[\uDC00-\uDFFF]/.test(record.text[offset] || "")) errors.push(`span splits Unicode ${span.id}`);
    if (!span.type || !span.label) errors.push(`incomplete span ${span.id}`);
    if (!knownTypes.has(span.type)) errors.push(`invalid annotation type for ${span.id}`);
    if (span.text !== undefined && span.text !== record.text.slice(span.start, span.end)) errors.push(`span text mismatch for ${span.id}`);
    if (record.emphasis && !languageLabels[record.language]?.has(span.label)) errors.push(`unsupported language label for ${span.id}`);
    if (span.gender && !knownGenders.has(span.gender)) errors.push(`invalid gender for ${span.id}`);
    if (span.tense && span.tense !== "past") errors.push(`invalid tense for ${span.id}`);
    if (span.start < previousEnd) errors.push(`overlapping span ${span.id}`);
    previousEnd = Math.max(previousEnd, span.end);
  }
  if (record.emphasis) {
    const groups = record.emphasis.groups;
    if (!Array.isArray(groups) || !Array.isArray(record.emphasis.review)) return [...errors, "invalid emphasis"];
    const ids = new Set();
    for (const group of groups) {
      if (!group?.id || ids.has(group.id)) errors.push("duplicate or missing emphasis id");
      ids.add(group?.id);
      if (!["target", "predicate"].includes(group?.kind) || group.confidence !== "supported") errors.push("invalid emphasis kind or confidence");
      if (!Array.isArray(group?.segments) || !group.segments.length) { errors.push("missing emphasis segments"); continue; }
      let end = -1;
      for (const segment of group.segments) {
        if (!Number.isInteger(segment.start) || !Number.isInteger(segment.end) || segment.start < 0 || segment.end <= segment.start || segment.end > record.text.length || segment.start < end) errors.push("invalid emphasis offsets");
        if (record.text.slice(segment.start, segment.end) !== segment.text) errors.push("emphasis text mismatch");
        // Emphasis may sit inside a grammatical Mark: the renderer nests it in
        // the Mark's text instead of repeating the tag. UTF-16 boundaries still
        // have to be exact.
        for (const offset of [segment.start, segment.end]) if (offset > 0 && /[\uD800-\uDBFF]/.test(record.text[offset - 1]) && /[\uDC00-\uDFFF]/.test(record.text[offset] || "")) errors.push("emphasis splits Unicode");
        end = segment.end;
      }
    }
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
  if (annotation.canonical_annotation) {
    const record = annotation.canonical_annotation;
    if (record.text !== annotation.original_text || record.inline_text !== annotation.original_text || (context.language && record.language !== context.language)) throw new Error(`Stale showcase annotation ${annotation.id}`);
    return { ...record, source: { ...record.source, dataset: context.dataset || record.source.dataset, document_id: context.document_id || record.source.document_id || null }, translations: annotation.translations || (annotation.translated_text ? { und: annotation.translated_text } : {}), explanation: annotation.chunkList || "" };
  }
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
      if (serviceRecord) return { id: serviceRecord.id, text: serviceRecord.text, translation: example.translation_ru || "", spans: serviceRecord.spans, emphasis: serviceRecord.emphasis, validation: serviceRecord.validation };
      const value = spansFromMarkedText(example.text, `${pattern.id}-${lang.lang}-e${index + 1}`);
      return { id: `${pattern.id}-${lang.lang}-e${index + 1}`, text: value.text, translation: example.translation_ru || "", spans: value.spans };
    });
    return {
      schema_version: ANNOTATION_SCHEMA_VERSION, id: `${pattern.id}-${lang.lang}`, kind: "pattern_card",
      text: primary.text, inline_text: primary.text, language: lang.lang, locale: lang.lang,
      translations: lang.translation ? { ru: lang.translation } : {}, explanation: pattern.metaphor_ru || "",
      examples, difficulty: "advanced", cefr: "B2–C1", source: { dataset: "advanced-patterns", set_id: pattern.set_id, pattern_id: pattern.id },
      slots: [{ id: "formula", label: lang.formula, substitutions: [] }], spans: primary.spans, emphasis: primary.emphasis,
      metadata: { function: pattern.group_id, topic: pattern.set_id, register: "neutral", tags: [pattern.group_id, pattern.set_id], related_patterns: [] },
      validation: primary.validation || { migrated_from: "advanced-patterns", status: "valid" }
    };
  });
}

export function renderCanonicalText(record, renderSpan) {
  const escape = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const ranges = (record.emphasis?.groups || []).flatMap(g => g.segments.map(s => ({ ...s, kind: g.kind })));
  function emphasisKind(start, end) {
    const active = ranges.filter(r => r.start <= start && r.end >= end);
    return active.some(r => r.kind === "target") ? "target" : active.length ? "predicate" : null;
  }
  function fragment(start, end) {
    const boundaries = [...new Set([start, end, ...ranges.flatMap(r => [r.start, r.end]).filter(n => n > start && n < end)])].sort((a,b) => a-b);
    return boundaries.slice(0,-1).map((a,i) => {
      const b = boundaries[i+1];
      const kind = emphasisKind(a, b);
      const text = escape(record.text.slice(a,b));
      return kind ? `<span class="learning-emphasis emphasis-${kind}">${text}</span>` : text;
    }).join("");
  }
  function renderMarkedSpan(span) {
    const text = record.text.slice(span.start, span.end);
    const inner = fragment(span.start, span.end);
    if (renderSpan.length >= 3) return renderSpan(span, text, inner);
    const html = renderSpan(span, text);
    // Compatibility callbacks do not accept nested text. Keep their output
    // readable and preserve emphasis priority without duplicating a tag.
    const overlapping = ranges.filter(r => r.start < span.end && r.end > span.start);
    const kind = overlapping.some(r => r.kind === "target") ? "target" : overlapping.length ? "predicate" : null;
    return kind ? `<span class="learning-emphasis emphasis-${kind}">${html}</span>` : html;
  }
  let output = ""; let cursor = 0;
  for (const span of [...(record.spans || [])].sort((a, b) => a.start - b.start)) {
    output += fragment(cursor, span.start);
    output += renderMarkedSpan(span);
    cursor = span.end;
  }
  return output + fragment(cursor, record.text.length);
}
