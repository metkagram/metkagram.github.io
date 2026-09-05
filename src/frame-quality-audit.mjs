const PRIORITY_SET_IDS = ["HED", "ARG", "PRO", "AGR", "CLR", "CMP", "CAU", "CND", "RQT", "NEG"];
const SEVERITY_WEIGHT = { high: 30, medium: 20, low: 10 };

function cleanText(value = "") {
  return String(value)
    .replaceAll("**", "")
    .normalize("NFKC")
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/[“”]/g, '"')
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function normalizeFrameFormula(value = "", { abstractSlots = false } = {}) {
  let normalized = cleanText(value).toLocaleLowerCase();
  if (abstractSlots) normalized = normalized.replaceAll(/\[[^\]]*\]/g, "[slot]");
  return normalized
    .replaceAll(/\s+([,.;:!?])/g, "$1")
    .replaceAll(/([([{])\s+/g, "$1")
    .replaceAll(/\s+([)\]}])/g, "$1");
}

function tokens(value = "") {
  return new Set(normalizeFrameFormula(value, { abstractSlots: true })
    .replaceAll(/[^\p{L}\p{N}\[\]]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1));
}

function jaccard(left, right) {
  const a = left instanceof Set ? left : tokens(left);
  const b = right instanceof Set ? right : tokens(right);
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

function placeholderBalance(value = "") {
  let depth = 0;
  for (const character of String(value)) {
    if (character === "[") depth += 1;
    if (character === "]") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formulaCanMatchExample(formula, example) {
  const cleanFormula = cleanText(formula);
  const cleanExample = cleanText(example);
  const slots = [...cleanFormula.matchAll(/\[[^\]]*\]/g)];
  if (!slots.length) return true;
  const parts = cleanFormula.split(/\[[^\]]*\]/g).map((part) => escapeRegex(part).replaceAll(/\\\s+/g, "\\s+"));
  const pattern = parts.join(".+?");
  try {
    return new RegExp(`^${pattern}$`, "iu").test(cleanExample);
  } catch {
    return false;
  }
}

function russianSupportLooksPlausible(value = "") {
  const text = cleanText(value);
  if (!text) return false;
  const letters = text.match(/\p{L}/gu) || [];
  const cyrillic = text.match(/[А-Яа-яЁё]/g) || [];
  return letters.length === 0 || cyrillic.length / letters.length >= 0.35;
}

function detectEnglishAgreement(text) {
  const issues = [];
  const rules = [
    { regex: /\b(?:he|she|it|this|that)\s+(?:do|have|are|were)\b/giu, label: "singular subject with plural/base auxiliary" },
    { regex: /\b(?:they|we)\s+(?:is|has|does|was)\b/giu, label: "plural subject with singular auxiliary" },
    { regex: /\bi\s+(?:is|has|does|are)\b/giu, label: "first-person subject with incompatible auxiliary" },
  ];
  for (const rule of rules) {
    const match = cleanText(text).match(rule.regex)?.[0];
    if (match) issues.push({ type: "en_subject_verb_agreement", severity: "high", confidence: "high", evidence: match, note: rule.label });
  }
  return issues;
}

function detectGermanAgreement(text) {
  const issues = [];
  const normalized = cleanText(text);
  const weakEndingMismatch = /\b(?:den|dem|des|einen|einem|eines|keinen|keinem|keines|meinen|meinem|meines|deinen|deinem|deines|seinen|seinem|seines|ihren|ihrem|ihres|unseren|unserem|unseres|euren|eurem|eures)\s+([a-zäöüß]{3,}e)\s+[A-ZÄÖÜ][\p{L}-]*/gu;
  const match = weakEndingMismatch.exec(normalized);
  if (match) {
    issues.push({
      type: "de_case_article_adjective_agreement",
      severity: "high",
      confidence: "medium",
      evidence: match[0],
      note: "After this determiner/case form, an attributive adjective normally takes the weak -en ending; human review required.",
    });
  }
  return issues;
}

function averagePairwiseSimilarity(examples) {
  if (examples.length < 2) return 0;
  const tokenSets = examples.map((example) => tokens(example));
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < tokenSets.length; i += 1) {
    for (let j = i + 1; j < tokenSets.length; j += 1) {
      total += jaccard(tokenSets[i], tokenSets[j]);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : 0;
}

function issue(pattern, lang, details, source) {
  return {
    pattern_id: pattern.id,
    set_id: pattern.set_id,
    lang,
    source,
    human_reviewed: false,
    ...details,
  };
}

function languageIssues(pattern, language, languageIndex) {
  const issues = [];
  const formula = language.formula || "";
  const canonical = language.example || "";
  const allExamples = [canonical, ...(language.examples || []).map((example) => example.text)].filter(Boolean);

  if (!placeholderBalance(formula) || /\[\s*\]/u.test(formula)) {
    issues.push(issue(pattern, language.lang, {
      type: "malformed_placeholder",
      severity: "high",
      confidence: "high",
      evidence: formula,
      note: "Formula contains unbalanced or empty square-bracket placeholder syntax.",
    }, "formula"));
  }

  if (/\[[^\]]*\]/u.test(canonical)) {
    issues.push(issue(pattern, language.lang, {
      type: "unrealized_placeholder",
      severity: "high",
      confidence: "high",
      evidence: canonical,
      note: "Canonical example still contains placeholder markup.",
    }, "canonical_example"));
  }

  if (placeholderBalance(formula) && /\[[^\]]+\]/u.test(formula) && !formulaCanMatchExample(formula, canonical)) {
    issues.push(issue(pattern, language.lang, {
      type: "formula_example_structure_mismatch",
      severity: "medium",
      confidence: "medium",
      evidence: `${formula} || ${canonical}`,
      note: "Static formula material does not align with the canonical example after treating bracketed material as a free slot.",
    }, "formula+canonical_example"));
  }

  const legacyFormula = pattern.formulas?.[languageIndex];
  if (typeof legacyFormula === "string" && normalizeFrameFormula(legacyFormula) !== normalizeFrameFormula(formula)) {
    issues.push(issue(pattern, language.lang, {
      type: "formula_source_drift",
      severity: "low",
      confidence: "high",
      evidence: `${legacyFormula} || ${formula}`,
      note: "Legacy pattern.formulas entry differs from the canonical language formula and should not silently drift.",
    }, "formula_metadata"));
  }

  const translations = [language.translation, ...(language.examples || []).map((example) => example.translation_ru)];
  for (const [translationIndex, translation] of translations.entries()) {
    if (!russianSupportLooksPlausible(translation)) {
      issues.push(issue(pattern, language.lang, {
        type: "translation_language_mismatch",
        severity: "high",
        confidence: "high",
        evidence: cleanText(translation).slice(0, 180),
        note: "Russian learner-support translation contains too little Cyrillic text; check for missing/wrong-language translation.",
      }, translationIndex === 0 ? "canonical_translation" : `variation_translation_${translationIndex}`));
    }
  }

  for (const [exampleIndex, example] of allExamples.entries()) {
    const grammarIssues = language.lang === "en"
      ? detectEnglishAgreement(example)
      : language.lang === "de" ? detectGermanAgreement(example) : [];
    for (const details of grammarIssues) issues.push(issue(pattern, language.lang, details, exampleIndex === 0 ? "canonical_example" : `variation_${exampleIndex}`));
  }

  if ((language.examples || []).length >= 5) {
    const similarity = averagePairwiseSimilarity((language.examples || []).map((example) => example.text));
    if (similarity >= 0.78) {
      issues.push(issue(pattern, language.lang, {
        type: "low_context_diversity",
        severity: "medium",
        confidence: "low",
        evidence: Number(similarity.toFixed(3)),
        note: "Variation examples are lexically very similar. This is a prioritisation signal, not a linguistic verdict.",
      }, "variations"));
    }
  }

  return issues;
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function duplicateGroups(entries, signatureField, kind) {
  return [...groupBy(entries, (entry) => `${entry.set_id}:${entry.lang}:${entry[signatureField]}`).entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      kind,
      set_id: group[0].set_id,
      lang: group[0].lang,
      signature: key.split(":").slice(2).join(":"),
      pattern_ids: group.map((entry) => entry.pattern_id).sort((a, b) => a.localeCompare(b)),
      count: group.length,
      human_reviewed: false,
      confidence: kind === "exact_formula_duplicate" ? "high" : "high",
    }))
    .sort((a, b) => a.set_id.localeCompare(b.set_id) || a.lang.localeCompare(b.lang) || a.signature.localeCompare(b.signature));
}

function nearDuplicatePairs(entries, exactGroupKeys, frameGroupKeys) {
  const results = [];
  const bySetLanguage = groupBy(entries, (entry) => `${entry.set_id}:${entry.lang}`);
  for (const group of bySetLanguage.values()) {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const left = group[i];
        const right = group[j];
        const exactKey = `${left.set_id}:${left.lang}:${left.exact_signature}`;
        const frameKey = `${left.set_id}:${left.lang}:${left.frame_signature}`;
        if (left.exact_signature === right.exact_signature && exactGroupKeys.has(exactKey)) continue;
        if (left.frame_signature === right.frame_signature && frameGroupKeys.has(frameKey)) continue;
        const similarity = jaccard(left.frame_tokens, right.frame_tokens);
        if (similarity < 0.9) continue;
        results.push({
          kind: "near_frame_duplicate",
          set_id: left.set_id,
          lang: left.lang,
          pattern_ids: [left.pattern_id, right.pattern_id].sort((a, b) => a.localeCompare(b)),
          similarity: Number(similarity.toFixed(3)),
          human_reviewed: false,
          confidence: similarity >= 0.96 ? "medium" : "low",
        });
      }
    }
  }
  return results.sort((a, b) => a.set_id.localeCompare(b.set_id) || a.lang.localeCompare(b.lang) || a.pattern_ids.join(":").localeCompare(b.pattern_ids.join(":")));
}

function severityForDuplicate(group) {
  if (group.kind === "exact_formula_duplicate") return "high";
  if (group.kind === "slot_variant_group") return group.count >= 5 ? "high" : "medium";
  return "medium";
}

function setPriority(setId) {
  const index = PRIORITY_SET_IDS.indexOf(setId);
  return index < 0 ? 0 : 100 - (index * 5);
}

function remediationQueue(duplicateItems, linguisticIssues) {
  const queue = [];
  for (const item of duplicateItems) {
    const severity = severityForDuplicate(item);
    queue.push({
      kind: item.kind,
      set_id: item.set_id,
      lang: item.lang,
      pattern_ids: item.pattern_ids,
      severity,
      confidence: item.confidence,
      human_reviewed: false,
      priority: setPriority(item.set_id) + SEVERITY_WEIGHT[severity] + Math.min(20, (item.count || 2)),
      evidence: item.signature || item.similarity,
    });
  }
  for (const item of linguisticIssues) {
    queue.push({
      kind: item.type,
      set_id: item.set_id,
      lang: item.lang,
      pattern_ids: [item.pattern_id],
      severity: item.severity,
      confidence: item.confidence,
      human_reviewed: false,
      priority: setPriority(item.set_id) + SEVERITY_WEIGHT[item.severity],
      evidence: item.evidence,
      source: item.source,
    });
  }
  return queue.sort((a, b) => b.priority - a.priority || a.set_id.localeCompare(b.set_id) || a.kind.localeCompare(b.kind) || a.pattern_ids.join(":").localeCompare(b.pattern_ids.join(":")));
}

export function buildFrameQualityAudit(content) {
  const entries = [];
  const issues = [];
  for (const pattern of content.advancedPatterns) {
    for (const [languageIndex, language] of (pattern.langs || []).entries()) {
      const exactSignature = normalizeFrameFormula(language.formula);
      const frameSignature = normalizeFrameFormula(language.formula, { abstractSlots: true });
      entries.push({
        pattern_id: pattern.id,
        set_id: pattern.set_id,
        lang: language.lang,
        exact_signature: exactSignature,
        frame_signature: frameSignature,
        frame_tokens: tokens(frameSignature),
      });
      issues.push(...languageIssues(pattern, language, languageIndex));
    }
  }

  const exactGroups = duplicateGroups(entries, "exact_signature", "exact_formula_duplicate");
  const rawFrameGroups = duplicateGroups(entries, "frame_signature", "slot_variant_group");
  const exactKeys = new Set(exactGroups.map((group) => `${group.set_id}:${group.lang}:${group.signature}`));
  const frameGroups = rawFrameGroups.filter((group) => !exactKeys.has(`${group.set_id}:${group.lang}:${group.signature}`));
  const frameKeys = new Set(frameGroups.map((group) => `${group.set_id}:${group.lang}:${group.signature}`));
  const nearPairs = nearDuplicatePairs(entries, exactKeys, frameKeys);
  const duplicates = [...exactGroups, ...frameGroups, ...nearPairs];
  const queue = remediationQueue(duplicates, issues);

  const setMetrics = {};
  for (const set of content.studySets.sets) {
    const setPatterns = content.advancedPatterns.filter((pattern) => pattern.set_id === set.id);
    const affected = new Set(duplicates.filter((item) => item.set_id === set.id).flatMap((item) => item.pattern_ids));
    const setIssues = issues.filter((item) => item.set_id === set.id);
    setMetrics[set.id] = {
      pattern_count: setPatterns.length,
      duplicate_affected_pattern_count: affected.size,
      duplicate_affected_rate: setPatterns.length ? Number((affected.size / setPatterns.length).toFixed(4)) : 0,
      exact_duplicate_group_count: exactGroups.filter((item) => item.set_id === set.id).length,
      slot_variant_group_count: frameGroups.filter((item) => item.set_id === set.id).length,
      near_duplicate_pair_count: nearPairs.filter((item) => item.set_id === set.id).length,
      linguistic_issue_count: setIssues.length,
      high_confidence_linguistic_issue_count: setIssues.filter((item) => item.confidence === "high").length,
      remediation_queue_count: queue.filter((item) => item.set_id === set.id).length,
    };
  }

  const issueTypes = {};
  for (const item of issues) issueTypes[item.type] = (issueTypes[item.type] || 0) + 1;

  const records = entries.map(({ frame_tokens, ...entry }) => entry);
  return {
    schemaVersion: 1,
    purpose: "Deterministic editorial audit of Frame duplication, slot substitution and conservative EN/DE quality signals. Automated findings are review candidates, not human linguistic judgements or efficacy evidence.",
    reviewState: "automated-candidates-not-human-reviewed",
    coverage: {
      study_set_count: content.studySets.sets.length,
      pattern_count: content.advancedPatterns.length,
      language_record_count: entries.length,
      audited_pattern_count: new Set(entries.map((entry) => entry.pattern_id)).size,
      audited_set_count: new Set(entries.map((entry) => entry.set_id)).size,
    },
    summary: {
      exact_duplicate_group_count: exactGroups.length,
      slot_variant_group_count: frameGroups.length,
      near_duplicate_pair_count: nearPairs.length,
      linguistic_issue_count: issues.length,
      issue_types: Object.fromEntries(Object.entries(issueTypes).sort(([a], [b]) => a.localeCompare(b))),
      remediation_queue_count: queue.length,
    },
    prioritySetOrder: PRIORITY_SET_IDS,
    setMetrics,
    duplicateGroups: {
      exact: exactGroups,
      slotVariants: frameGroups,
      nearPairs,
    },
    linguisticIssues: issues.sort((a, b) => a.set_id.localeCompare(b.set_id) || a.pattern_id.localeCompare(b.pattern_id) || a.lang.localeCompare(b.lang) || a.type.localeCompare(b.type)),
    remediationQueue: queue,
    records,
  };
}

export function frameQualityAuditMarkdown(audit) {
  const rankedSets = Object.entries(audit.setMetrics)
    .sort(([, a], [, b]) => b.duplicate_affected_rate - a.duplicate_affected_rate || b.linguistic_issue_count - a.linguistic_issue_count)
    .slice(0, 20);
  const rows = rankedSets.map(([id, metrics]) => `| ${id} | ${metrics.pattern_count} | ${(metrics.duplicate_affected_rate * 100).toFixed(1)}% | ${metrics.slot_variant_group_count} | ${metrics.near_duplicate_pair_count} | ${metrics.linguistic_issue_count} |`).join("\n");
  return `# Metkagram Frame quality audit\n\nAutomated editorial baseline. Findings are **review candidates**, not human-reviewed linguistic judgements and not evidence of learning efficacy.\n\n## Coverage\n\n- Study sets: **${audit.coverage.audited_set_count}/${audit.coverage.study_set_count}**\n- Patterns: **${audit.coverage.audited_pattern_count}/${audit.coverage.pattern_count}**\n- Language records: **${audit.coverage.language_record_count}**\n\n## Findings\n\n- Exact duplicate formula groups: **${audit.summary.exact_duplicate_group_count}**\n- Slot-variant Frame groups: **${audit.summary.slot_variant_group_count}**\n- Near-duplicate candidate pairs: **${audit.summary.near_duplicate_pair_count}**\n- Conservative linguistic/metadata findings: **${audit.summary.linguistic_issue_count}**\n- Prioritised review items: **${audit.summary.remediation_queue_count}**\n\n## Sets with the strongest duplicate signal\n\n| Set | Patterns | Duplicate-affected | Slot groups | Near pairs | QA findings |\n|---|---:|---:|---:|---:|---:|\n${rows}\n\n## Interpretation\n\nA slot-variant group means multiple Pattern records collapse to the same formula after bracketed contextual material is abstracted to a generic slot. This is evidence for editorial review and the future Frame ↔ Variant layer; it is **not** an instruction to delete the patterns or their study sets. Near-duplicate candidates are heuristic and require human review.\n`;
}
