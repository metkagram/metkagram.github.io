import fs from "node:fs";
import path from "node:path";
import { SITE_URL, breadcrumbs, escapeHtml, layout, patternTitle } from "./render.mjs";
import { corpusLanguages } from "./release.mjs";
import { patternPath, patternUrl, studySetPath } from "./seo-slugs.mjs";

const ROOT = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(`Discovery content validation failed: ${message}`);
}

export function loadDiscoveryTopics(content) {
  const file = path.join(ROOT, "data", "discovery-topics.json");
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  assert(payload?.schemaVersion === 1, "data/discovery-topics.json must use schemaVersion 1");
  assert(Array.isArray(payload.topics) && payload.topics.length > 0, "topics must be a non-empty array");

  const validSets = new Set(content.studySets.sets.map((set) => set.id));
  const ids = new Set();
  const slugs = new Set();
  for (const topic of payload.topics) {
    assert(typeof topic.id === "string" && topic.id, "every topic needs an id");
    assert(typeof topic.slug === "string" && /^[a-z0-9-]+$/.test(topic.slug), `${topic.id}: invalid slug`);
    assert(!ids.has(topic.id), `duplicate id ${topic.id}`);
    assert(!slugs.has(topic.slug), `duplicate slug ${topic.slug}`);
    ids.add(topic.id);
    slugs.add(topic.slug);
    assert(Array.isArray(topic.set_ids) && topic.set_ids.length > 0, `${topic.id}: set_ids must not be empty`);
    for (const setId of topic.set_ids) assert(validSets.has(setId), `${topic.id}: unknown study set ${setId}`);
    assert(Array.isArray(topic.related), `${topic.id}: related must be an array`);
    assert(Array.isArray(topic.use_cases_en) && topic.use_cases_en.length >= 3, `${topic.id}: use_cases_en needs at least three items`);
    assert(Array.isArray(topic.use_cases_ru) && topic.use_cases_ru.length >= 3, `${topic.id}: use_cases_ru needs at least three items`);
  }
  for (const topic of payload.topics) {
    for (const relatedId of topic.related) assert(ids.has(relatedId), `${topic.id}: unknown related topic ${relatedId}`);
  }
  return payload.topics;
}

function topicPath(locale, topic) {
  return `/${locale}/patterns/${topic.slug}/`;
}

function localized(topic, key, locale) {
  return topic[`${key}_${locale}`] || topic[`${key}_en`] || "";
}

function topicPatterns(content, topic) {
  const setIds = new Set(topic.set_ids);
  return content.advancedPatterns.filter((pattern) => setIds.has(pattern.set_id));
}

function topicSets(content, topic) {
  const byId = new Map(content.studySets.sets.map((set) => [set.id, set]));
  return topic.set_ids.map((id) => byId.get(id)).filter(Boolean);
}

function atlasBreadcrumbs(locale, current = null) {
  const home = locale === "ru" ? "Главная" : "Home";
  const practice = locale === "ru" ? "Практика" : "Practice";
  const atlas = locale === "ru" ? "Атлас паттернов" : "Pattern Atlas";
  const items = [
    { href: `/${locale}/`, label: home },
    { href: `/${locale}/practice/`, label: practice },
    { href: `/${locale}/patterns/`, label: atlas }
  ];
  if (current) items.push({ href: current.href, label: current.label });
  return breadcrumbs(locale, items);
}

export function patternAtlasIndexPage(locale, topics, content) {
  const ru = locale === "ru";
  const pathname = `/${locale}/patterns/`;
  const title = ru ? "Атлас языковых паттернов B2–C1" : "B2–C1 Pattern Atlas for advanced English and German";
  const description = ru
    ? "Тематические маршруты по паттернам Metkagram: аргументация, мнение, условные конструкции, рабочая коммуникация, вопросы и немецкая грамматика."
    : "Explore Metkagram patterns by real communication task: argumentation, hedging, conditionals, professional English, advanced questions, German word order, and more.";
  const totalMapped = new Set(topics.flatMap((topic) => topicPatterns(content, topic).map((pattern) => pattern.id))).size;
  const body = `${atlasBreadcrumbs(locale)}
  <section class="page-head section-pad practice-intro">
    <p class="eyebrow">${ru ? "B2–C1 · по задаче, а не по ID" : "B2–C1 · organised by what you need to say"}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(description)}</p>
    <div class="practice-status"><a href="/${locale}/practice/">${ru ? "Все паттерны" : "All patterns"} <b>${content.advancedPatterns.length.toLocaleString(ru ? "ru-RU" : "en-US")}</b></a><span>${ru ? "В тематических маршрутах" : "Mapped into topics"} <b>${totalMapped.toLocaleString(ru ? "ru-RU" : "en-US")}</b></span></div>
  </section>
  <section class="entry-list section-pad ruled">${topics.map((topic, index) => {
    const patterns = topicPatterns(content, topic);
    return `<a href="${topicPath(locale, topic)}"><span class="entry-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(localized(topic, "title", locale))}</strong><span>${patterns.length.toLocaleString(ru ? "ru-RU" : "en-US")} ${ru ? "паттернов" : "patterns"} · ${escapeHtml(localized(topic, "description", locale))}</span><span aria-hidden="true">↗</span></a>`;
  }).join("")}</section>`;
  const itemList = topics.map((topic, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: localized(topic, "title", locale),
    url: `${SITE_URL}${topicPath(locale, topic)}`
  }));
  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body,
    structuredData: [{ "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: itemList }]
  });
}

export function patternTopicPage(locale, topic, topics, content) {
  const ru = locale === "ru";
  const pathname = topicPath(locale, topic);
  const title = localized(topic, "search_title", locale) || localized(topic, "title", locale);
  const shortTitle = localized(topic, "title", locale);
  const description = localized(topic, "description", locale);
  const patterns = topicPatterns(content, topic);
  const sets = topicSets(content, topic);
  const relatedById = new Map(topics.map((item) => [item.id, item]));
  const related = topic.related.map((id) => relatedById.get(id)).filter(Boolean);
  const sample = patterns.slice(0, 24);
  const visibleUseCases = locale === "ru" ? topic.use_cases_ru : topic.use_cases_en;

  const body = `${atlasBreadcrumbs(locale, { href: pathname, label: shortTitle })}
  <section class="page-head section-pad compact study-set-head">
    <p class="eyebrow">${escapeHtml(topic.level)} · ${patterns.length.toLocaleString(ru ? "ru-RU" : "en-US")} ${ru ? "паттернов" : "patterns"}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(description)}</p>
  </section>
  <section class="research-questions section-pad ruled">
    <div><p class="eyebrow">01 · ${ru ? "Задачи" : "Use it when you need to"}</p><h2>${ru ? "Что вы учитесь делать" : "Communication goals"}</h2></div>
    <ol>${visibleUseCases.map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(item)}</h3></div></li>`).join("")}</ol>
  </section>
  <section class="page-head section-pad compact"><p class="eyebrow">02 · ${ru ? "Наборы" : "Study sets"}</p><h2>${ru ? "Из каких наборов собран маршрут" : "Study the topic from these validated sets"}</h2></section>
  <section class="document-index section-pad">${sets.map((set, index) => `<a href="${studySetPath(locale, set)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(ru ? set.title_ru : set.title_en)}</strong><small>${escapeHtml(ru ? set.description_ru || set.description : set.description)} · ${escapeHtml(set.id)}</small></span><span aria-hidden="true">↗</span></a>`).join("")}</section>
  <section class="page-head section-pad compact ruled"><p class="eyebrow">03 · ${ru ? "Примеры" : "Pattern examples"}</p><h2>${ru ? "Сначала полезная модель, затем варианты" : "Start with a reusable structure"}</h2><p>${ru ? "Ниже показана редакционная выборка. Полный набор остаётся доступен в связанных study sets." : "This is an editorial sample. The linked study sets contain the complete topic collection."}</p></section>
  <section class="pattern-index section-pad">${sample.map((pattern, index) => {
    const english = pattern.langs.find((lang) => lang.lang === "en") || pattern.langs[0];
    const german = pattern.langs.find((lang) => lang.lang === "de");
    const label = patternTitle(pattern, locale, "en");
    const detail = ru
      ? `${english.formula} · ${english.example}`
      : `${english.example}${german?.example ? ` · DE: ${german.example}` : ""}`;
    return `<a href="${patternPath(locale, pattern)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span><span aria-hidden="true">↗</span></a>`;
  }).join("")}</section>
  <section class="page-head section-pad compact ruled"><p class="eyebrow">04 · ${ru ? "Дальше" : "Related paths"}</p><h2>${ru ? "Соседние речевые задачи" : "Continue by communication goal"}</h2></section>
  <section class="entry-list section-pad">${related.map((item, index) => `<a href="${topicPath(locale, item)}"><span class="entry-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(localized(item, "title", locale))}</strong><span>${escapeHtml(localized(item, "description", locale))}</span><span aria-hidden="true">↗</span></a>`).join("")}</section>`;

  const itemList = sample.map((pattern, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: patternTitle(pattern, locale, "en"),
    url: patternUrl(locale, pattern)
  }));
  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description,
    url: `${SITE_URL}${pathname}`,
    educationalLevel: topic.level,
    learningResourceType: "Language pattern collection",
    teaches: visibleUseCases,
    about: sets.map((set) => ru ? set.title_ru : set.title_en),
    inLanguage: corpusLanguages(),
    isAccessibleForFree: true
  };

  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body,
    structuredData: [learningResource, { "@context": "https://schema.org", "@type": "ItemList", name: shortTitle, numberOfItems: patterns.length, itemListElement: itemList }]
  });
}
