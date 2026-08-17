const dataNode = document.querySelector("#pattern-lens-data");
const root = document.querySelector("[data-pattern-lens]");

if (dataNode && root) {
  const payload = JSON.parse(dataNode.textContent);
  const { patterns, locale, copy } = payload;
  const text = root.querySelector("[data-lens-text]");
  const form = root.querySelector("[data-lens-form]");
  const results = root.querySelector("[data-lens-results]");
  const annotation = root.querySelector("[data-lens-annotation]");
  const empty = root.querySelector("[data-lens-empty]");
  const languageButtons = [...root.querySelectorAll("[data-lens-language]")];
  const sampleButtons = [...document.querySelectorAll("[data-lens-sample]")];
  let language = "en";
  let reasoningRules = null;

  const normalize = (value = "") => String(value)
    .replaceAll("**", "")
    .replace(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const literalSegments = (formula = "") => String(formula)
    .replaceAll("**", "")
    .split(/\[[^\]]+\]|\{[^}]+\}|<[^>]+>/g)
    .flatMap((part) => part.split(/\s+(?:\+|\/|\|)\s+|\s*→\s*/g))
    .map((part) => part
      .replace(/^[\s,;:.!?()\-–—+/|]+|[\s,;:.!?()\-–—+/|]+$/g, "")
      .replaceAll(/\s+/g, " ")
      .trim())
    .filter((part) => part.length >= 2 && /[\p{L}\p{N}]/u.test(part));

  const recordFor = (pattern) => pattern.langs.find((item) => item.lang === language);

  const classifyReasoning = (input) => {
    if (!reasoningRules?.rules?.length) return [];
    const minConfidence = reasoningRules.min_confidence || 0.9;
    const genericConditionIds = new Set(reasoningRules.generic_condition_rule_ids || []);
    let matches = reasoningRules.rules
      .filter((item) => {
        if (item.language !== language || item.confidence < minConfidence) return false;
        try {
          return new RegExp(item.pattern, item.flags).test(input);
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.confidence - a.confidence || b.priority - a.priority || a.id.localeCompare(b.id));

    const hasStrongTest = matches.some((item) => item.reasoning_move === "Test" && item.confidence >= 0.95);
    if (hasStrongTest) matches = matches.filter((item) => !genericConditionIds.has(item.id));

    const selected = [];
    for (const item of matches) {
      if (selected.some((current) => current.reasoning_move === item.reasoning_move)) continue;
      selected.push(item);
      if (selected.length >= 3) break;
    }
    return selected;
  };

  const rank = (input) => {
    const normalizedText = normalize(input);
    const reasoningByPattern = new Map(classifyReasoning(input).map((item) => [item.pattern_id, item]));
    return patterns
      .map((pattern) => {
        const lang = recordFor(pattern);
        if (!lang) return null;
        const segments = literalSegments(lang.formula);
        const hits = segments.filter((segment) => normalizedText.includes(normalize(segment)));
        const examples = [lang.example, ...(lang.examples || []).map((item) => item.text)].filter(Boolean);
        const exampleMatch = examples.some((example) => {
          const normalized = normalize(example);
          return normalized.length >= 8 && (normalizedText.includes(normalized) || normalized.includes(normalizedText));
        });
        const reasoningMatch = reasoningByPattern.get(pattern.id) || null;
        const literalScore = hits.reduce((sum, segment) => sum + 2 + Math.min(3, normalize(segment).length / 10), 0)
          + (exampleMatch ? 10 : 0)
          + (hits.length > 1 ? 2 : 0);
        const reasoningScore = reasoningMatch ? 12 + reasoningMatch.confidence * 6 : 0;
        const combinedBonus = reasoningMatch && hits.length ? 3 : 0;
        const score = literalScore + reasoningScore + combinedBonus;
        if (!score) return null;
        return {
          pattern,
          lang,
          hits,
          reasoningMatch,
          score,
          evidenceType: reasoningMatch && hits.length ? "literal+reasoning" : reasoningMatch ? "reasoning" : "literal",
          coverage: segments.length ? hits.length / segments.length : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.pattern.id.localeCompare(b.pattern.id))
      .slice(0, 6);
  };

  const highlight = (input, hits) => {
    if (!hits.length) return `<p class="lens-annotated-sentence">${escapeHtml(input)}</p>`;
    const ordered = [...hits].sort((a, b) => b.length - a.length);
    const ranges = [];
    const lower = input.toLocaleLowerCase();
    for (const hit of ordered) {
      const needle = hit.toLocaleLowerCase();
      let from = 0;
      while (from < lower.length) {
        const index = lower.indexOf(needle, from);
        if (index < 0) break;
        const end = index + needle.length;
        if (!ranges.some((range) => index < range.end && end > range.start)) ranges.push({ start: index, end });
        from = end;
      }
    }
    ranges.sort((a, b) => a.start - b.start);
    if (!ranges.length) return `<p class="lens-annotated-sentence">${escapeHtml(input)}</p>`;
    let cursor = 0;
    let html = "";
    for (const range of ranges) {
      html += escapeHtml(input.slice(cursor, range.start));
      html += `<span class="lens-hit"><small>${language === "de" ? "MUSTER" : "PATTERN"}</small>${escapeHtml(input.slice(range.start, range.end))}</span>`;
      cursor = range.end;
    }
    html += escapeHtml(input.slice(cursor));
    return `<p class="lens-annotated-sentence">${html}</p>`;
  };

  const evidenceText = ({ hits, reasoningMatch }) => {
    const parts = [];
    if (hits.length) parts.push(locale === "ru" ? `структура: ${hits.length}` : `structure: ${hits.length} literal cue${hits.length === 1 ? "" : "s"}`);
    if (reasoningMatch) {
      const prefix = locale === "ru" ? "логика" : "reasoning";
      parts.push(`${prefix}: ${reasoningMatch.reasoning_move} · ${reasoningMatch.evidence}`);
    }
    return parts.join(" · ");
  };

  const render = () => {
    const input = text.value.trim();
    if (!input) {
      results.innerHTML = "";
      annotation.innerHTML = "";
      empty.hidden = false;
      return;
    }
    const matches = rank(input);
    empty.hidden = matches.length > 0;
    annotation.innerHTML = highlight(input, matches[0]?.hits || []);
    results.innerHTML = matches.map(({ pattern, lang, hits, reasoningMatch, evidenceType, coverage }) => {
      const purpose = (reasoningMatch?.reasoning_move || pattern.reasoning_move) ? `<span>${escapeHtml(reasoningMatch?.reasoning_move || pattern.reasoning_move)}</span>` : "";
      const page = pattern.page_urls?.[locale] || `/${locale}/practice/${pattern.id.toLowerCase()}/`;
      const metric = reasoningMatch
        ? `${Math.round(reasoningMatch.confidence * 100)}% cue`
        : `${Math.round(coverage * 100)}% structure`;
      return `<article class="lens-card" data-evidence-type="${escapeHtml(evidenceType)}">
        <div class="lens-card-meta"><code>${escapeHtml(pattern.id)}</code>${purpose}<span>${escapeHtml(metric)}</span></div>
        <h3>${escapeHtml(lang.formula)}</h3>
        <p class="lens-example">${escapeHtml(lang.example)}</p>
        <p class="lens-translation">${escapeHtml(lang.translation || "")}</p>
        <p class="lens-evidence">${escapeHtml(evidenceText({ hits, reasoningMatch }))}</p>
        <div class="lens-card-foot"><span>${escapeHtml(evidenceType)}</span><a href="${escapeHtml(page)}">${locale === "ru" ? "Учить паттерн" : "Learn this pattern"} →</a></div>
      </article>`;
    }).join("");
  };

  const loadReasoningRules = async () => {
    try {
      const response = await fetch("/data/pattern-lens-rules.json");
      if (!response.ok) return;
      reasoningRules = await response.json();
    } catch {
      reasoningRules = null;
    }
  };

  languageButtons.forEach((button) => button.addEventListener("click", () => {
    language = button.dataset.lensLanguage;
    languageButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    if (language === "de" && text.value.trim() === copy.placeholder.trim()) {
      const germanSample = patterns.flatMap((pattern) => pattern.langs.filter((item) => item.lang === "de").map((item) => item.example)).find(Boolean);
      if (germanSample) text.value = germanSample;
    }
    render();
  }));

  sampleButtons.forEach((button) => button.addEventListener("click", () => {
    language = "en";
    languageButtons.forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.lensLanguage === "en")));
    text.value = button.dataset.lensSample;
    text.focus();
    render();
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  loadReasoningRules().finally(render);
}
