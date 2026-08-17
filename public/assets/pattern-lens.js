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

  const rank = (input) => {
    const normalizedText = normalize(input);
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
        const score = hits.reduce((sum, segment) => sum + 2 + Math.min(3, normalize(segment).length / 10), 0)
          + (exampleMatch ? 10 : 0)
          + (hits.length > 1 ? 2 : 0);
        if (!score) return null;
        return { pattern, lang, hits, score, coverage: segments.length ? hits.length / segments.length : 0 };
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
        if (!ranges.some((range) => index < range.end && end > range.start)) ranges.push({ start: index, end, label: hit });
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
    results.innerHTML = matches.map(({ pattern, lang, hits, coverage }) => {
      const purpose = pattern.reasoning_move ? `<span>${escapeHtml(pattern.reasoning_move)}</span>` : "";
      const page = pattern.page_urls?.[locale] || `/${locale}/practice/${pattern.id.toLowerCase()}/`;
      const matchText = hits.length
        ? (locale === "ru" ? `Совпало устойчивых частей: ${hits.length}` : `${hits.length} stable part${hits.length === 1 ? "" : "s"} matched`)
        : "";
      return `<article class="lens-card">
        <div class="lens-card-meta"><code>${escapeHtml(pattern.id)}</code>${purpose}<span>${Math.round(coverage * 100)}%</span></div>
        <h3>${escapeHtml(lang.formula)}</h3>
        <p class="lens-example">${escapeHtml(lang.example)}</p>
        <p class="lens-translation">${escapeHtml(lang.translation || "")}</p>
        <div class="lens-card-foot"><span>${escapeHtml(matchText)}</span><a href="${escapeHtml(page)}">${locale === "ru" ? "Учить паттерн" : "Learn this pattern"} →</a></div>
      </article>`;
    }).join("");
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

  render();
}
