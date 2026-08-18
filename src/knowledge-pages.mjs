import { SITE_URL, breadcrumbs, escapeHtml, layout, patternTitle } from "./render.mjs";
import { intentTaxonomy } from "./intents.mjs";

function intentPath(locale, intent) {
  return `/${locale}/learn/${intent.id}/`;
}

function localized(intent, key, locale) {
  return intent[`${key}_${locale}`] || intent[`${key}_en`] || "";
}

function patternById(content) {
  return new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
}

function priorityPatterns(intent, content) {
  const byId = patternById(content);
  const explicit = (intent.pattern_priority || []).map((id) => byId.get(id)).filter(Boolean);
  const explicitIds = new Set(explicit.map((pattern) => pattern.id));
  const sameMove = content.advancedPatterns
    .filter((pattern) => pattern.reasoning?.move === intent.move && !explicitIds.has(pattern.id))
    .slice(0, Math.max(0, 6 - explicit.length));
  return [...explicit, ...sameMove];
}

function learnBreadcrumbs(locale, current = null) {
  const ru = locale === "ru";
  const items = [
    { href: `/${locale}/`, label: ru ? "Главная" : "Home" },
    { href: `/${locale}/practice/`, label: ru ? "Практика" : "Practice" },
    { href: `/${locale}/learn/`, label: ru ? "Речевые задачи" : "Communication goals" }
  ];
  if (current) items.push(current);
  return breadcrumbs(locale, items);
}

function formula(pattern, lang = "en") {
  return pattern.langs.find((item) => item.lang === lang)?.formula || pattern.langs[0]?.formula || pattern.id;
}

function example(pattern, lang = "en") {
  return pattern.langs.find((item) => item.lang === lang)?.example || pattern.langs[0]?.example || "";
}

export function learnIndexPage(locale, content) {
  const ru = locale === "ru";
  const pathname = `/${locale}/learn/`;
  const title = ru ? "Речевые задачи B2–C1: найдите языковой каркас по смыслу" : "B2–C1 communication goals: find a language pattern by meaning";
  const description = ru
    ? "Начните не с названия грамматики, а с задачи: вежливо не согласиться, уточнить мысль, задать условие, объяснить причину или сделать вывод."
    : "Start from the job your sentence needs to do: disagree politely, correct an assumption, set a condition, explain a cause, compare alternatives, or draw a conclusion.";

  const body = `${learnBreadcrumbs(locale)}
  <section class="page-head section-pad practice-intro">
    <p class="eyebrow">${ru ? "B2–C1 · задача → логический ход → паттерн" : "B2–C1 · goal → reasoning move → pattern"}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(description)}</p>
    <p><a class="primary-link" href="/${locale}/practice/intents/">${ru ? "Открыть поиск по намерениям" : "Open intent discovery"} <span aria-hidden="true">→</span></a> <a class="text-link" href="/${locale}/knowledge/">${ru ? "Как устроен граф знаний" : "How the knowledge graph works"} <span aria-hidden="true">→</span></a></p>
  </section>
  <section class="entry-list section-pad ruled">${intentTaxonomy.map((intent, index) => {
    const count = content.advancedPatterns.filter((pattern) => pattern.reasoning?.move === intent.move).length;
    return `<a href="${intentPath(locale, intent)}"><span class="entry-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(localized(intent, "title", locale))}</strong><span>${escapeHtml(localized(intent, "description", locale))} · ${count} ${ru ? "связанных каркасов" : "related frames"}</span><span aria-hidden="true">↗</span></a>`;
  }).join("")}</section>`;

  const itemList = intentTaxonomy.map((intent, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: localized(intent, "title", locale),
    url: `${SITE_URL}${intentPath(locale, intent)}`
  }));
  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body,
    structuredData: [
      { "@context": "https://schema.org", "@type": "LearningResource", name: title, description, url: `${SITE_URL}${pathname}`, educationalLevel: "B2–C1", learningResourceType: "Communication-goal index", teaches: intentTaxonomy.map((intent) => localized(intent, "title", locale)), inLanguage: ["en", "de"], isAccessibleForFree: true },
      { "@context": "https://schema.org", "@type": "ItemList", name: title, numberOfItems: intentTaxonomy.length, itemListElement: itemList }
    ]
  });
}

export function intentTaskPage(locale, intent, content) {
  const ru = locale === "ru";
  const pathname = intentPath(locale, intent);
  const shortTitle = localized(intent, "title", locale);
  const englishTitle = intent.title_en;
  const title = ru ? `${shortTitle}: паттерны B2–C1` : `How to ${englishTitle.charAt(0).toLowerCase()}${englishTitle.slice(1)}: B2–C1 language patterns`;
  const description = localized(intent, "description", locale);
  const patterns = priorityPatterns(intent, content);
  const related = intentTaxonomy.filter((item) => item.id !== intent.id && item.move === intent.move).slice(0, 4);

  const body = `${learnBreadcrumbs(locale, { href: pathname, label: shortTitle })}
  <section class="page-head section-pad compact study-set-head">
    <p class="eyebrow">${escapeHtml(intent.move)} · ${ru ? "речевая задача" : "communication goal"}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(description)}</p>
    <p>${ru ? "Metkagram начинает с того, что вы хотите сделать мыслью, затем связывает задачу с логическим ходом и несколькими проверяемыми языковыми каркасами." : "Metkagram starts from what you want the sentence to do, maps that goal to a reasoning move, and then surfaces a small set of canonical language frames."}</p>
  </section>
  <section class="research-questions section-pad ruled">
    <div><p class="eyebrow">01 · ${ru ? "Каркасы" : "Reusable frames"}</p><h2>${ru ? "С чего начать" : "Patterns to try first"}</h2></div>
    <ol>${patterns.map((pattern, index) => {
      const reasoning = pattern.reasoning || {};
      const formulaEn = formula(pattern, "en");
      const formulaDe = formula(pattern, "de");
      const exampleEn = example(pattern, "en").replaceAll("**", "");
      const why = ru ? reasoning.what_it_does_ru : reasoning.what_it_does_en;
      const mistake = ru ? reasoning.common_mistake_ru : reasoning.common_mistake_en;
      return `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3><a href="/${locale}/practice/${pattern.id.toLowerCase()}/">${escapeHtml(patternTitle(pattern, locale, "en"))}</a></h3><p><code>${escapeHtml(formulaEn)}</code></p><p>${escapeHtml(exampleEn)}</p>${why ? `<small><b>${ru ? "Что делает" : "What it does"}:</b> ${escapeHtml(why)}</small>` : ""}${mistake ? `<small><b>${ru ? "Не перепутайте" : "Watch for"}:</b> ${escapeHtml(mistake)}</small>` : ""}<small>DE · <code>${escapeHtml(formulaDe)}</code> · ${escapeHtml(pattern.id)}</small></div></li>`;
    }).join("")}</ol>
  </section>
  <section class="page-head section-pad compact ruled"><p class="eyebrow">02 · ${ru ? "Поиск" : "Find it in your own sentence"}</p><h2>${ru ? "Теперь найдите каркас в контексте" : "Move from examples to your own context"}</h2><p>${ru ? "Вставьте собственную фразу в Pattern Lens или откройте Practice и попробуйте написать новый пример до подсказки." : "Paste your own sentence into Pattern Lens, or open Practice and write a new example before revealing feedback."}</p><p><a class="primary-link" href="/${locale}/lens/">Pattern Lens <span aria-hidden="true">→</span></a> <a class="text-link" href="/${locale}/practice/intents/#intent-${intent.id}">${ru ? "Намерение и связанные паттерны" : "Intent and related patterns"} <span aria-hidden="true">→</span></a></p></section>
  ${related.length ? `<section class="page-head section-pad compact ruled"><p class="eyebrow">03 · ${ru ? "Рядом" : "Related goals"}</p><h2>${ru ? "Другие задачи с тем же логическим ходом" : "Other goals using the same reasoning move"}</h2></section><section class="entry-list section-pad">${related.map((item, index) => `<a href="${intentPath(locale, item)}"><span class="entry-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(localized(item, "title", locale))}</strong><span>${escapeHtml(localized(item, "description", locale))}</span><span aria-hidden="true">↗</span></a>`).join("")}</section>` : ""}`;

  const itemList = patterns.map((pattern, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: patternTitle(pattern, locale, "en"),
    url: `${SITE_URL}/${locale}/practice/${pattern.id.toLowerCase()}/`
  }));
  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description,
    url: `${SITE_URL}${pathname}`,
    educationalLevel: "B2–C1",
    learningResourceType: "Communication-goal language pattern guide",
    teaches: [shortTitle, intent.move],
    about: { "@type": "DefinedTerm", name: intent.move, termCode: intent.move },
    inLanguage: ["en", "de"],
    isAccessibleForFree: true
  };
  return layout({ locale, pathname, title: `${title} | Metkagram`, description, body, structuredData: [learningResource, { "@context": "https://schema.org", "@type": "ItemList", name: shortTitle, numberOfItems: patterns.length, itemListElement: itemList }] });
}

export function knowledgeIndexPage(locale, stats) {
  const ru = locale === "ru";
  const pathname = `/${locale}/knowledge/`;
  const title = ru ? "Граф языковых паттернов Metkagram" : "Metkagram Language Pattern Knowledge Graph";
  const description = ru
    ? "Машиночитаемый граф связывает речевые задачи, логические операции, паттерны, учебные наборы и тематические маршруты Metkagram."
    : "A machine-readable graph connecting learner goals, reasoning moves, reusable patterns, study sets, and curated Pattern Atlas topics.";
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ru ? "Главная" : "Home" }, { href: pathname, label: ru ? "Граф знаний" : "Knowledge Graph" }])}
  <section class="page-head section-pad practice-intro"><p class="eyebrow">${ru ? "Metkagram · knowledge layer" : "Metkagram · knowledge layer"}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(description)}</p><p>${ru ? "LLM может придумать тысячи фраз. Полезнее знать, какую задачу решает каркас, с чем его сравнивать, где он находится в учебной программе и к какому объекту вернуться позже." : "An LLM can generate thousands of sentences. The durable part is knowing what a frame does, what it contrasts with, where it lives in the curriculum, and which stable object a learner should revisit."}</p></section>
  <section class="project-metrics section-pad ruled" aria-label="${ru ? "Размер графа" : "Graph size"}"><div><dt>${stats.nodes}</dt><dd>${ru ? "узлов" : "nodes"}</dd></div><div><dt>${stats.edges}</dt><dd>${ru ? "связей" : "edges"}</dd></div><div><dt>${stats.intents}</dt><dd>${ru ? "речевых задач" : "learner intents"}</dd></div><div><dt>${stats.moves}</dt><dd>${ru ? "логических ходов" : "reasoning moves"}</dd></div></section>
  <section class="research-questions section-pad ruled"><div><p class="eyebrow">01 · ${ru ? "Модель" : "Model"}</p><h2>${ru ? "Что связано" : "What the graph connects"}</h2></div><ol>${[
    [ru ? "Речевая задача" : "Learner intent", ru ? "Что человек хочет сделать: не согласиться, уточнить, сравнить, объяснить причину." : "What the learner wants to do: disagree, clarify, compare, explain a cause."],
    [ru ? "Логический ход" : "Reasoning move", ru ? "Операция мысли: Challenge, Reframe, Cause, Condition и другие." : "The thought operation: Challenge, Reframe, Cause, Condition, and others."],
    [ru ? "Паттерн" : "Pattern", ru ? "Стабильный ID, формула, примеры и языковые параллели EN/DE." : "A stable ID with formulas, examples, and EN/DE parallels."],
    [ru ? "Учебный контекст" : "Curriculum context", ru ? "Study set и тематический маршрут Pattern Atlas, где паттерн можно изучать дальше." : "The study set and Pattern Atlas topic where the pattern can be practised further."]
  ].map(([heading, text], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(text)}</p></div></li>`).join("")}</ol></section>
  <section class="page-head section-pad compact ruled"><p class="eyebrow">02 · ${ru ? "Доступ" : "Machine access"}</p><h2>${ru ? "Один и тот же слой для сайта, API и агентов" : "The same layer for the site, API, and agents"}</h2><nav class="download-list"><a href="/data/language-pattern-knowledge-graph.json">${ru ? "Граф JSON" : "Knowledge graph JSON"} ↗</a><a href="/data/recommendations.jsonl">${ru ? "Recommendation JSONL" : "Recommendation JSONL"} ↗</a><a href="/data/recommendation-benchmark.json">${ru ? "Benchmark рекомендаций" : "Recommendation benchmark"} ↗</a><a href="/${locale}/mcp/">MCP →</a><a href="/${locale}/learn/">${ru ? "Речевые задачи" : "Learner task pages"} →</a></nav></section>`;

  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body,
    structuredData: [{ "@context": "https://schema.org", "@type": "Dataset", name: title, description, url: `${SITE_URL}/data/language-pattern-knowledge-graph.json`, creator: { "@id": `${SITE_URL}/#organization` }, isAccessibleForFree: true, keywords: ["language patterns", "language learning", "reasoning moves", "knowledge graph", "English", "German"] }]
  });
}
