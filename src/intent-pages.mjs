import { intentTaxonomy } from "./intents.mjs";
import { patternsForIntent } from "./intent-discovery.mjs";
import { SITE_URL, breadcrumbs, escapeHtml, layout } from "./render.mjs";

function localized(locale, en, ru) {
  return locale === "ru" ? ru : en;
}

function titleFor(intent, locale) {
  return locale === "ru" ? intent.title_ru : intent.title_en;
}

function descriptionFor(intent, locale) {
  return locale === "ru" ? intent.description_ru : intent.description_en;
}

function formula(pattern, language) {
  return pattern.langs.find((item) => item.lang === language)?.formula || "";
}

function intentCard(locale, intent, patterns) {
  const ranked = patternsForIntent(intent, patterns, 4);
  const patternLinks = ranked.map(({ pattern }) => {
    const en = formula(pattern, "en");
    const de = formula(pattern, "de");
    return `<a href="/${locale}/practice/${pattern.id.toLowerCase()}/#reasoning-move"><span class="document-number">${escapeHtml(pattern.id)}</span><span><strong>${escapeHtml(en || pattern.id)}</strong><small>DE · ${escapeHtml(de)}</small></span><span aria-hidden="true">→</span></a>`;
  }).join("");

  const examples = (locale === "ru" ? intent.queries_ru : intent.queries_en).slice(0, 3);
  return `<article id="intent-${intent.id}" class="section-pad ruled intent-card" data-intent="${escapeHtml(intent.id)}" data-reasoning-move="${escapeHtml(intent.move)}">
    <p class="eyebrow">${localized(locale, "Reasoning move", "Логическая операция")} · ${escapeHtml(intent.move)}</p>
    <h2>${escapeHtml(titleFor(intent, locale))}</h2>
    <p class="lede">${escapeHtml(descriptionFor(intent, locale))}</p>
    <p><strong>${localized(locale, "You might think", "Так можно сформулировать намерение")}:</strong> ${examples.map((item) => `<code>${escapeHtml(item)}</code>`).join(" · ")}</p>
    <div class="pattern-index">${patternLinks}</div>
  </article>`;
}

export function intentDiscoveryPage(locale, content) {
  const pathname = `/${locale}/practice/intents/`;
  const title = localized(locale, "Find a pattern by what you want to do", "Найдите паттерн по тому, что хотите выразить");
  const description = localized(
    locale,
    "Start from a communicative intent such as disagreeing politely, correcting an assumption, comparing alternatives, or drawing a conclusion, then move to reusable English and German sentence frames.",
    "Начните с коммуникативного намерения: вежливо не согласиться, исправить предположение, сравнить варианты или сделать вывод, а затем перейдите к переиспользуемым английским и немецким каркасам."
  );

  const moveOrder = [...new Set(intentTaxonomy.map((intent) => intent.move))];
  const moveNav = moveOrder.map((move) => {
    const first = intentTaxonomy.find((intent) => intent.move === move);
    const count = intentTaxonomy.filter((intent) => intent.move === move).length;
    return `<a href="#intent-${first.id}"><span class="document-number">${String(count).padStart(2, "0")}</span><span><strong>${escapeHtml(move)}</strong><small>${escapeHtml(titleFor(first, locale))}</small></span><span aria-hidden="true">↓</span></a>`;
  }).join("");

  const cards = intentTaxonomy.map((intent) => intentCard(locale, intent, content.advancedPatterns)).join("");
  const body = `${breadcrumbs(locale, [
    { href: `/${locale}/`, label: localized(locale, "Home", "Главная") },
    { href: `/${locale}/practice/`, label: localized(locale, "Practice", "Практика") },
    { href: pathname, label: localized(locale, "Intent discovery", "Поиск по намерению") }
  ])}
  <section class="page-head section-pad">
    <p class="eyebrow">${intentTaxonomy.length} ${localized(locale, "communicative intents", "коммуникативных намерений")} · ${moveOrder.length} ${localized(locale, "reasoning moves", "логических операций")}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(description)}</p>
    <p>${localized(locale, "You do not need to know the grammar label first. Start with the job the sentence has to perform.", "Не обязательно сначала знать название грамматической конструкции. Начните с задачи, которую должна выполнить фраза.")}</p>
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">${localized(locale, "Browse by operation", "По операциям")}</p>
    <div class="pattern-index">${moveNav}</div>
  </section>
  <section aria-label="${localized(locale, "Intent catalogue", "Каталог намерений")}">${cards}</section>`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: intentTaxonomy.length,
    itemListElement: intentTaxonomy.map((intent, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: titleFor(intent, locale),
      url: `${SITE_URL}${pathname}#intent-${intent.id}`
    }))
  };

  return layout({
    locale,
    pathname,
    title: `${title} | Metkagram`,
    description,
    body,
    structuredData: [itemList]
  });
}
