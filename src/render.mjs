import { collectionKeys, collectionLabel, targetMeta, ui } from "./i18n.mjs";

export const SITE_URL = "https://metkagram.github.io";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function slugPath(pathname) {
  if (pathname === "/") return "/";
  return `/${pathname.split("/").filter(Boolean).join("/")}/`;
}

function equivalentLocalePath(pathname, locale) {
  if (pathname.endsWith(".html")) return `/${locale}/`;
  const parts = slugPath(pathname).split("/").filter(Boolean);
  if (["en", "ru"].includes(parts[0])) parts[0] = locale;
  else parts.unshift(locale);
  return `/${parts.join("/")}/`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

function breadcrumbJson(pathname, title, locale) {
  const t = ui[locale];
  const parts = slugPath(pathname).split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", position: 1, name: t.home, item: `${SITE_URL}/${locale}/` }];
  let current = "";
  for (let index = 1; index < parts.length; index += 1) {
    current += `/${parts[index]}`;
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: index === parts.length - 1 ? title : parts[index].replaceAll("-", " "),
      item: `${SITE_URL}/${locale}${current}/`
    });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function header(locale, pathname) {
  const t = ui[locale];
  const nav = [
    ["navExplore", `/${locale}/explore/`],
    ["navPractice", `/${locale}/practice/`],
    ["navReview", `/${locale}/review/`],
    ["navProgress", `/${locale}/progress/`],
    ["navMethod", `/${locale}/method/`],
    ["navAbout", `/${locale}/about/`]
  ];
  return `<a class="skip-link" href="#content">${t.skip}</a>
  <header class="site-header">
    <a class="wordmark" href="/${locale}/" aria-label="Metkagram"><span class="brand-metka" aria-hidden="true">Metka</span><span class="brand-gram" aria-hidden="true">gram</span></a>
    <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav">${t.menu}</button>
    <nav id="site-nav" class="site-nav" aria-label="Primary">
      ${nav.map(([label, href]) => `<a href="${href}"${slugPath(pathname).startsWith(href) ? ' aria-current="page"' : ""}>${t[label]}</a>`).join("")}
    </nav>
    <div class="locale-switch" aria-label="${t.chooseInterface}">
      <a href="${equivalentLocalePath(pathname, "en")}" lang="en"${locale === "en" ? ' aria-current="page"' : ""}>EN</a>
      <span aria-hidden="true">/</span>
      <a href="${equivalentLocalePath(pathname, "ru")}" lang="ru"${locale === "ru" ? ' aria-current="page"' : ""}>RU</a>
    </div>
  </header>`;
}

function footer(locale) {
  const t = ui[locale];
  return `<footer class="site-footer">
    <p class="footer-mark"><span class="brand-metka">Metka</span><span class="brand-gram">gram</span></p>
    <nav aria-label="Footer"><a href="https://github.com/metkagram/metkagram.github.io">${t.source}</a><a href="/data/catalog.json">${t.datasets}</a><a href="/${locale}/about/#privacy">${t.privacy}</a></nav>
    <p>${t.connected}</p>
  </footer>`;
}

export function layout({ locale = "en", pathname, title, description, body, type = "website", structuredData = [], root = false, notFound = false, bodyClass = "" }) {
  const canonicalPath = notFound ? "/404.html" : slugPath(pathname);
  const canonical = `${SITE_URL}${canonicalPath}`;
  const alternates = notFound ? "" : root
    ? `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/"><link rel="alternate" hreflang="en" href="${SITE_URL}/en/"><link rel="alternate" hreflang="ru" href="${SITE_URL}/ru/">`
    : `<link rel="alternate" hreflang="en" href="${SITE_URL}${equivalentLocalePath(pathname, "en")}"><link rel="alternate" hreflang="ru" href="${SITE_URL}${equivalentLocalePath(pathname, "ru")}"><link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`;
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${notFound ? '<meta name="robots" content="noindex,follow">' : ""}
  <meta name="theme-color" content="#f2efe6">
  <meta name="color-scheme" content="light">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/assets/social-preview.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/social-preview.png">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta name="metkagram-sync-endpoint" content="https://metalhatscats.com/api/metkax/srs">
  ${structuredData.map(jsonLd).join("\n")}
</head>
<body class="${escapeHtml(bodyClass)}" data-locale="${locale}">
  ${root ? "" : header(locale, pathname)}
  <main id="content">${body}</main>
  ${root ? "" : footer(locale)}
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

export function breadcrumbs(locale, items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item, index) => `${index ? '<span aria-hidden="true">/</span>' : ""}<a href="${item.href}"${index === items.length - 1 ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`).join("")}</nav>`;
}

export function languageTabs(locale, current = "english", suffix = "") {
  const t = ui[locale];
  return `<div class="target-tabs" aria-label="${t.chooseTarget}">
    ${Object.values(targetMeta).map((target) => `<a href="/${locale}/explore/${target.key}/${suffix}"${current === target.key ? ' aria-current="page"' : ""}><span class="language-code">${target.flag}</span>${t[target.key]}</a>`).join("")}
  </div>`;
}

export function annotatedPreview() {
  return `<div class="sentence-stage" aria-label="Annotated example sentence">
    <p class="sentence-line"><span class="annotation subject" data-tag="S">We</span> <span class="annotation verb" data-tag="V">learn</span> <span class="annotation object" data-tag="p2">language patterns</span> <span class="annotation helper" data-tag="Hf">by using them</span>.</p>
    <div class="annotation-legend" aria-label="Annotation legend"><span><i class="subject"></i>S · subject</span><span><i class="verb"></i>V · verb</span><span><i class="object"></i>p2 · predicate</span><span><i class="helper"></i>Hf · helper</span></div>
  </div>`;
}

export function localeHome(locale, content) {
  const t = ui[locale];
  const counts = {};
  for (const target of Object.values(targetMeta)) {
    counts[target.key] = Object.fromEntries(collectionKeys.map((key) => [key, content.collections[target.key][key].documents.length]));
  }
  const pathname = `/${locale}/`;
  const totalSets = (targetKey) => Object.values(counts[targetKey]).reduce((sum, count) => sum + count, 0);
  const body = `<section class="home-hero section-pad">
    <div class="home-copy"><p class="eyebrow">Metkagram · language notation</p><h1>${t.statement}</h1><p class="lede">${t.statementDetail}</p>
      <section class="language-picker" aria-labelledby="language-picker-title"><div><h2 id="language-picker-title">${t.homeLanguageTitle}</h2><p>${t.homeLanguageDetail}</p></div><div class="language-choices">${Object.values(targetMeta).map((target) => `<a href="/${locale}/explore/${target.key}/"><span class="language-choice-code">${target.flag}</span><span><strong>${t[target.key]}</strong><small>${totalSets(target.key).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${t.sets}</small></span><span aria-hidden="true">→</span></a>`).join("")}</div></section>
    </div>
    <div class="home-example">${annotatedPreview()}</div>
  </section>
  <section class="next-actions section-pad ruled" aria-labelledby="next-actions-title"><div class="section-heading"><p class="eyebrow">01 · ${t.home}</p><h2 id="next-actions-title">${t.homeStartTitle}</h2></div><div class="next-action-grid"><a href="/${locale}/explore/"><span class="entry-index">01</span><strong>${t.navExplore}</strong><p>${t.homeExploreDetail}</p><span aria-hidden="true">→</span></a><a href="/${locale}/practice/"><span class="entry-index">02</span><strong>${t.navPractice}</strong><p>${t.homePracticeDetail}</p><span aria-hidden="true">→</span></a><a href="/${locale}/method/"><span class="entry-index">03</span><strong>${t.navMethod}</strong><p>${t.homeMethodDetail}</p><span aria-hidden="true">→</span></a></div></section>`;
  const structuredData = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Metkagram", url: SITE_URL, inLanguage: ["en", "ru"] },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Metkagram", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: `${SITE_URL}/${locale}/`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }
  ];
  return layout({ locale, pathname, title: locale === "en" ? "Metkagram — annotated language patterns" : "Metkagram — аннотированные языковые паттерны", description: t.statementDetail, body, structuredData });
}

export function explorePage(locale, content) {
  const t = ui[locale];
  const pathname = `/${locale}/explore/`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">${t.navExplore}</p><h1>${t.exploreTitle}</h1><p class="lede">${t.exploreIntro}</p></section>
  <section class="language-planes section-pad ruled">${Object.values(targetMeta).map((target) => `<article><p class="language-code">${target.flag}</p><h2>${t[target.key]} <span>${target.native}</span></h2><ul>${collectionKeys.map((key) => `<li><a href="/${locale}/explore/${target.key}/${key}/"><span>${t[key]}</span><strong>${content.collections[target.key][key].documents.length}</strong></a></li>`).join("")}<li><a href="/${locale}/explore/${target.key}/annotation-rules/"><span>${t.rules}</span><span aria-hidden="true">↗</span></a></li></ul></article>`).join("")}</section>`;
  return layout({ locale, pathname, title: `${t.navExplore} — Metkagram`, description: t.exploreIntro, body, structuredData: [breadcrumbJson(pathname, t.navExplore, locale)] });
}

export function languageHub(locale, targetKey, content) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = `/${locale}/explore/${targetKey}/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: pathname, label: t[targetKey] }])}<section class="page-head section-pad compact"><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${t[targetKey]} — ${t.collections.toLowerCase()}</h1>${languageTabs(locale, targetKey)}</section><section class="entry-list section-pad ruled">${collectionKeys.map((key, index) => `<a href="/${locale}/explore/${targetKey}/${key}/"><span class="entry-index">0${index + 1}</span><strong>${t[key]}</strong><span>${content.collections[targetKey][key].documents.length} ${t.sets}</span><span aria-hidden="true">↗</span></a>`).join("")}<a href="/${locale}/explore/${targetKey}/annotation-rules/"><span class="entry-index">04</span><strong>${t.rules}</strong><span>${t.notation}</span><span aria-hidden="true">↗</span></a></section>`;
  return layout({ locale, pathname, title: `${t[targetKey]} ${t.collections.toLowerCase()} — Metkagram`, description: t.exploreIntro, body, structuredData: [breadcrumbJson(pathname, t[targetKey], locale)] });
}

function itemUrl(locale, targetKey, collection, document) {
  return `/${locale}/explore/${targetKey}/${collection}/${document.id}/`;
}

export function collectionPage(locale, targetKey, collectionKey, collection) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const title = `${t[collectionKey]} · ${t[targetKey]}`;
  const pathname = `/${locale}/explore/${targetKey}/${collectionKey}/`;
  const totalSentences = collection.documents.reduce((sum, doc) => sum + doc.annotations.length, 0);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: pathname, label: t[collectionKey] }])}
  <section class="page-head section-pad compact"><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${title}</h1><p class="lede"><strong>${collection.documents.length}</strong> ${t.sets} · <strong>${totalSentences.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</strong> ${t.sentences}</p>${languageTabs(locale, targetKey, `${collectionKey}/`)}</section>
  <section class="collection-tools section-pad ruled"><label>${t.search}<input type="search" data-collection-search autocomplete="off"></label></section>
  <section class="document-index section-pad" data-collection-list><h2 class="sr-only">${t.allItems}</h2>${collection.documents.map((doc, index) => `<a href="${itemUrl(locale, targetKey, collectionKey, doc)}" data-search-text="${escapeHtml(doc.title.toLowerCase())}"><span class="document-number">${String(index + 1).padStart(3, "0")}</span><span><strong>${escapeHtml(doc.title)}</strong><small>${doc.annotations.length} ${t.sentences}</small></span><span aria-hidden="true">↗</span></a>`).join("")}<p class="empty-state" data-empty-state hidden>${t.noResults}</p></section>`;
  const itemList = collection.documents.map((doc, index) => ({ "@type": "ListItem", position: index + 1, name: doc.title, url: `${SITE_URL}${itemUrl(locale, targetKey, collectionKey, doc)}` }));
  return layout({ locale, pathname, title: `${title} — Metkagram`, description: `${collection.documents.length} ${t.sets}: ${title}.`, body, structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: itemList }] });
}

function flattenSpan(node, output = []) {
  if (!node || typeof node !== "object") return output;
  if (Array.isArray(node.children) && node.children.length) {
    for (const child of node.children) flattenSpan(child, output);
  } else if (typeof node.text === "string" && node.text) {
    output.push({ text: node.text, tag: node.tag, extra: node.extra });
  }
  return output;
}

function tokenClass(tag) {
  if (["S", "S*"].includes(tag)) return "subject";
  if (["V", "v2", "vI", "vP", "Vp"].includes(tag)) return "verb";
  if (["Hf", "Hr", "Hst", "M"].includes(tag)) return "helper";
  return "object";
}

function renderAnnotation(annotation, locale, index) {
  const t = ui[locale];
  const tokens = flattenSpan(annotation.text_span).map((token) => {
    if (token.tag === "tag") return `<span class="grammar-tag ${tokenClass(token.text.trim())}" title="${escapeHtml(token.extra || t.notation)}">${escapeHtml(token.text.trim())}${token.extra ? `<small>${escapeHtml(token.extra)}</small>` : ""}</span>`;
    return escapeHtml(token.text);
  }).join("");
  const translation = locale === "ru" ? annotation.translations?.ru || annotation.translated_text : annotation.translations?.en;
  return `<article class="annotation-row" id="sentence-${index + 1}"><span class="line-number">${String(index + 1).padStart(2, "0")}</span><div><p class="annotated-line">${tokens || escapeHtml(annotation.original_text)}</p><details><summary>${t.explanation}</summary><p class="plain-sentence">${escapeHtml(annotation.original_text)}</p>${translation ? `<p class="translation"><span>${t.translation}</span>${escapeHtml(translation)}</p>` : ""}${annotation.chunkList ? `<p class="chunks"><span>${t.patterns}</span>${escapeHtml(annotation.chunkList)}</p>` : ""}</details></div></article>`;
}

export function documentPage(locale, targetKey, collectionKey, document) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = itemUrl(locale, targetKey, collectionKey, document);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: `/${locale}/explore/${targetKey}/${collectionKey}/`, label: t[collectionKey] }, { href: pathname, label: document.title }])}
  <article class="document-page"><header class="document-head section-pad"><p class="eyebrow">${target.flag} · ${t[collectionKey]}</p><h1>${escapeHtml(document.title)}</h1><p>${t.documentContains} <strong>${document.annotations.length}</strong> ${t.sentences}.</p>${document.version ? `<p class="version">${t.updated}: ${escapeHtml(document.version)}</p>` : ""}</header><div class="annotation-sheet section-pad">${document.annotations.map((annotation, index) => renderAnnotation(annotation, locale, index)).join("")}</div></article>`;
  const learningResource = { "@context": "https://schema.org", "@type": "LearningResource", name: document.title, url: `${SITE_URL}${pathname}`, inLanguage: target.dataKey, educationalLevel: "Intermediate to advanced", learningResourceType: collectionLabel(locale, collectionKey), isAccessibleForFree: true };
  return layout({ locale, pathname, title: `${document.title} — Metkagram`, description: `${document.title}: ${document.annotations.length} ${t.sentences}.`, body, type: "article", structuredData: [breadcrumbJson(pathname, document.title, locale), learningResource] });
}

const rules = {
  english: [
    ["S", "Subject", "The main actor or receiver in the sentence."], ["S*", "Subject, emphasized", "A subject highlighted in a trainer prompt."], ["st", "State", "A condition or state."], ["st*", "Passive state", "A state used in passive constructions."], ["v2", "Second verb", "A secondary verb paired with a helper."], ["p2", "Predicate", "Predicate detail connected to the subject."], ["vI", "Infinitive", "A verb in infinitive form."], ["vP", "Participle", "A participle used in a compound tense."], ["Vp", "Participle, alternate", "Alternate participle notation."], ["Hr", "Result helper", "A helper showing a completed result."], ["Hst", "State helper", "A helper emphasizing an ongoing state."], ["pA", "Placeholder A", "A structural placeholder in a rule."], ["pS", "Placeholder S", "A secondary structural placeholder."], ["Hf", "Future helper", "A helper projecting action into the future."], ["V", "Main verb", "The primary action or state."]
  ],
  german: [
    ["S", "Subjekt", "Die handelnde oder betroffene Person."], ["S*", "Subjekt, betont", "Ein zusätzlich hervorgehobenes Subjekt."], ["st", "Zustand", "Ein Zustand oder eine Bedingung."], ["st*", "Passiver Zustand", "Ein Zustandsmarker für Passivkonstruktionen."], ["v2", "Zweites Verb", "Ein Verbteil an zweiter Position."], ["vI", "Infinitiv", "Ein infinitiver Verbteil."], ["/→", "Akkusativ", "Das direkte Objekt: wen oder was?"], ["\\→", "Dativ", "Das indirekte Objekt: wem?"], ["\\?", "Genitiv", "Besitz oder Zugehörigkeit: wessen?"], ["←…", "Inversion", "Eine Umstellung im Satz."], ["vP", "Partizip", "Ein Partizip in zusammengesetzten Zeiten."], ["Vp", "Partizip, alternativ", "Alternative Partizip-Notation."], ["Hr", "Hilfsverb Resultat", "Ein Hilfsverb für ein abgeschlossenes Ergebnis."], ["Hst", "Hilfsverb Zustand", "Ein Hilfsverb für eine Zustandsveränderung."], ["Hf", "Hilfsverb Zukunft", "Ein Hilfsverb, das in die Zukunft verweist."], ["V", "Hauptverb", "Das grundlegende Verb der Aussage."], ["M", "Modalverb", "Ein Modalverb für Fähigkeit oder Pflicht."]
  ]
};

export function rulesPage(locale, targetKey) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = `/${locale}/explore/${targetKey}/annotation-rules/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: pathname, label: t.rules }])}<section class="page-head section-pad compact"><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${t.rules}</h1><p class="lede">${t.methodAnnotation}</p>${languageTabs(locale, targetKey, "annotation-rules/")}</section><section class="rules-grid section-pad ruled">${rules[targetKey].map(([tag, title, description]) => `<article><span class="grammar-tag ${tokenClass(tag)}">${escapeHtml(tag)}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></article>`).join("")}</section>`;
  return layout({ locale, pathname, title: `${t.rules} · ${t[targetKey]} — Metkagram`, description: t.methodAnnotation, body, structuredData: [breadcrumbJson(pathname, t.rules, locale)] });
}

function markdownStrong(text = "") {
  return escapeHtml(text).replaceAll(/\*\*(.+?)\*\*/g, "<mark>$1</mark>");
}

export function patternTitle(pattern, locale, targetLanguage = "en") {
  if (locale === "ru") return pattern.title_ru;
  return pattern.langs.find((lang) => lang.lang === targetLanguage)?.formula || pattern.formulas?.[0] || pattern.id;
}

export function patternPage(locale, pattern) {
  const t = ui[locale];
  const primary = pattern.langs[0];
  const title = patternTitle(pattern, locale, primary.lang);
  const pathname = `/${locale}/practice/${pattern.id.toLowerCase()}/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/practice/`, label: t.navPractice }, { href: pathname, label: title }])}<article class="pattern-page section-pad" data-pattern-id="${escapeHtml(pattern.id)}"><header><p class="eyebrow">B2–C1 · ${escapeHtml(pattern.group_id)} · ${escapeHtml(pattern.id)}</p><h1>${escapeHtml(title)}</h1>${locale === "en" && pattern.title_ru ? `<details class="source-note"><summary>${t.contentFallback}</summary><p lang="ru">${escapeHtml(pattern.title_ru)}</p>${pattern.metaphor_ru ? `<p lang="ru">${escapeHtml(pattern.metaphor_ru)}</p>` : ""}</details>` : pattern.metaphor_ru ? `<p class="lede">${escapeHtml(pattern.metaphor_ru)}</p>` : ""}</header><div class="pattern-languages">${pattern.langs.map((lang) => `<section id="${lang.lang}" data-target-language="${lang.lang}"><p class="language-code">${lang.lang.toUpperCase()}</p><h2>${lang.lang === "en" ? t.english : t.german}</h2><dl><div><dt>${t.formula}</dt><dd><code>${escapeHtml(lang.formula)}</code></dd></div><div><dt>${t.example}</dt><dd>${escapeHtml(lang.example)}</dd></div>${lang.translation ? `<div><dt>${t.translation}</dt><dd lang="ru">${escapeHtml(lang.translation)}</dd></div>` : ""}</dl>${lang.examples?.length ? `<h3>${t.examples}</h3><ol class="example-list">${lang.examples.map((example) => `<li><p>${markdownStrong(example.text)}</p>${example.translation_ru ? `<small lang="ru">${escapeHtml(example.translation_ru)}</small>` : ""}</li>`).join("")}</ol>` : ""}</section>`).join("")}</div><section class="inline-review" data-inline-review><p>${t.answerPrompt}</p><div class="review-actions"><button type="button" data-grade="0">${t.hard}</button><button type="button" data-grade="1">${t.good}</button><button type="button" data-grade="2">${t.easy}</button></div><output aria-live="polite"></output></section></article>`;
  return layout({ locale, pathname, title: `${title} — Metkagram`, description: `${primary.formula}. ${primary.example}`, body, type: "article", structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: title, identifier: pattern.id, educationalLevel: "B2–C1", teaches: pattern.formulas || pattern.langs.map((lang) => lang.formula), inLanguage: pattern.langs.map((lang) => lang.lang), url: `${SITE_URL}${pathname}` }] });
}

export function practicePage(locale, patterns) {
  const t = ui[locale];
  const pathname = `/${locale}/practice/`;
  const categories = [...new Set(patterns.map((pattern) => pattern.group_id))].sort();
  const body = `<section class="page-head section-pad"><p class="eyebrow">B2–C1 · ${patterns.length} ${t.patterns.toLowerCase()}</p><h1>${t.practiceTitle}</h1><p class="lede">${t.practiceIntro}</p></section><section class="practice-tools section-pad ruled"><div class="segmented" aria-label="${t.chooseTarget}"><button type="button" data-language-filter="en" aria-pressed="true">EN · ${t.english}</button><button type="button" data-language-filter="de" aria-pressed="true">DE · ${t.german}</button></div><label>${t.category}<select data-category-filter><option value="">${t.allCategories}</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label><label>${t.search}<input type="search" data-pattern-search></label></section><section class="pattern-index section-pad" data-pattern-list>${patterns.map((pattern, index) => `<a href="/${locale}/practice/${pattern.id.toLowerCase()}/" data-language="${pattern.langs.map((lang) => lang.lang).join(" ")}" data-category="${escapeHtml(pattern.group_id)}" data-search-text="${escapeHtml(`${pattern.id} ${pattern.title_ru} ${pattern.formulas?.join(" ") || ""}`.toLowerCase())}"><span class="document-number">${String(index + 1).padStart(3, "0")}</span><span><strong>${escapeHtml(patternTitle(pattern, locale))}</strong><small>${escapeHtml(pattern.id)} · ${pattern.langs.map((lang) => lang.lang.toUpperCase()).join(" / ")}</small></span><span aria-hidden="true">↗</span></a>`).join("")}<p class="empty-state" data-empty-state hidden>${t.noResults}</p></section>`;
  return layout({ locale, pathname, title: `${t.practiceTitle} — Metkagram`, description: t.practiceIntro, body, structuredData: [breadcrumbJson(pathname, t.practiceTitle, locale), { "@context": "https://schema.org", "@type": "ItemList", name: t.practiceTitle, numberOfItems: patterns.length }] });
}

export function reviewPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/review/`;
  const body = `<section class="page-head section-pad compact"><p class="eyebrow">SRS · active recall</p><h1>${t.reviewTitle}</h1><p class="lede">${t.reviewIntro}</p></section><section class="review-workspace section-pad ruled" data-review-workspace><p class="review-counter" data-review-counter></p><article data-review-card><p>${t.answerPrompt}</p><h2 data-review-title></h2><div data-review-answer hidden><p class="formula" data-review-formula></p><p data-review-example></p><p class="translation" data-review-translation></p></div><div class="review-actions"><button type="button" data-reveal>${t.reveal}</button><button type="button" data-grade="0" hidden>${t.hard}</button><button type="button" data-grade="1" hidden>${t.good}</button><button type="button" data-grade="2" hidden>${t.easy}</button></div></article><p class="empty-state" data-review-empty hidden>${t.queueEmpty}</p></section>`;
  return layout({ locale, pathname, title: `${t.reviewTitle} — Metkagram`, description: t.reviewIntro, body, structuredData: [breadcrumbJson(pathname, t.reviewTitle, locale)] });
}

export function progressPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/progress/`;
  const body = `<section class="page-head section-pad compact"><p class="eyebrow">SRS · local-first</p><h1>${t.progressTitle}</h1><p class="lede">${t.progressIntro}</p></section><section class="progress-grid section-pad ruled" data-progress-page><div class="stats-block"><article><strong data-stat-due>0</strong><span>${t.dueNow}</span></article><article><strong data-stat-reviewed>0</strong><span>${t.reviewed}</span></article><article><strong data-stat-reviews>0</strong><span>${t.totalReviews}</span></article></div><div class="sync-block"><label>${t.syncCode}<input data-sync-code placeholder="${t.syncPlaceholder}" pattern="[a-zA-Z0-9_-]{3,64}"></label><div class="button-row"><button type="button" data-save-code>${t.saveCode}</button><button type="button" data-sync-now>${t.syncNow}</button></div><output data-sync-status aria-live="polite">${t.syncIdle}</output></div><div class="transfer-block"><h2>${t.migration}</h2><div class="button-row"><button type="button" data-export-progress>${t.export}</button><label class="button-label">${t.import}<input type="file" accept="application/json" data-import-progress></label></div><output data-import-status aria-live="polite"></output><a class="text-link" href="https://metalhatscats.com/ru/metkax/transfer-progress">${t.oldTransfer} ↗</a></div><div class="progress-table-wrap"><table><thead><tr><th>${t.patterns}</th><th>${t.reviewed}</th><th>${t.currentInterval}</th><th>${t.dueNow}</th></tr></thead><tbody data-progress-rows></tbody></table><p data-progress-empty>${t.statsEmpty}</p></div></section>`;
  return layout({ locale, pathname, title: `${t.progressTitle} — Metkagram`, description: t.progressIntro, body, structuredData: [breadcrumbJson(pathname, t.progressTitle, locale)] });
}

export function methodPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/method/`;
  const steps = [t.methodSentence, t.methodAnnotation, t.methodPatterns, t.methodSrs];
  const body = `<section class="page-head section-pad"><p class="eyebrow">Metkagram method</p><h1>${t.methodTitle}</h1><p class="lede">${t.methodIntro}</p>${annotatedPreview()}</section><section class="method-details section-pad ruled">${steps.map((step, index) => `<article><span>0${index + 1}</span><h2>${step}</h2></article>`).join("")}</section>`;
  return layout({ locale, pathname, title: `${t.methodTitle} — Metkagram`, description: t.methodIntro, body, structuredData: [breadcrumbJson(pathname, t.methodTitle, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: t.methodTitle, learningResourceType: "Method", url: `${SITE_URL}${pathname}` }] });
}

export function aboutPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/about/`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">M: · project notes</p><h1>${t.aboutTitle}</h1><p class="lede">${t.aboutIntro}</p></section><section class="about-sections section-pad ruled"><article><h2>${t.license}</h2><p>${locale === "ru" ? "Структурированные коллекции публикуются для обучения и исследовательского использования с указанием Metkagram как источника. Проверьте файл LICENSE перед повторной публикацией данных." : "Structured collections are published for learning and research use with Metkagram attribution. Check LICENSE before redistributing the datasets."}</p><a href="/data/catalog.json">${t.datasets} →</a></article><article id="privacy"><h2>${t.privacy}</h2><p>${t.privacyText}</p></article><article><h2>${t.source}</h2><p>${t.connected}</p><a href="https://github.com/metkagram/metkagram.github.io">GitHub ↗</a></article></section>`;
  return layout({ locale, pathname, title: `${t.aboutTitle} — Metkagram`, description: t.aboutIntro, body, structuredData: [breadcrumbJson(pathname, t.aboutTitle, locale), { "@context": "https://schema.org", "@type": "Organization", name: "Metkagram", url: SITE_URL, sameAs: ["https://github.com/metkagram"] }] });
}

export function gatewayPage() {
  const t = ui.en;
  const body = `<section class="gateway"><a class="wordmark" href="/en/" aria-label="Metkagram"><span class="brand-metka" aria-hidden="true">Metka</span><span class="brand-gram" aria-hidden="true">gram</span></a><div>${annotatedPreview()}<p class="eyebrow">${t.chooseInterface}</p><h1>${t.gatewayText}</h1><nav><a href="/en/" lang="en"><strong>English</strong><span>Open interface →</span></a><a href="/ru/" lang="ru"><strong>Русский</strong><span>Открыть интерфейс →</span></a></nav><aside data-locale-suggestion hidden><p>${t.browserSuggestion}</p><a href="/ru/">${t.openRussian}</a><button type="button" data-dismiss-locale>${t.stayEnglish}</button></aside></div><footer><a href="https://github.com/metkagram/metkagram.github.io">GitHub</a><a href="/llms.txt">llms.txt</a></footer></section>`;
  return layout({ locale: "en", pathname: "/", title: "Metkagram — choose your interface language", description: t.gatewayText, body, root: true, bodyClass: "gateway-body", structuredData: [{ "@context": "https://schema.org", "@type": "WebSite", name: "Metkagram", url: SITE_URL, inLanguage: ["en", "ru"] }] });
}

export function notFoundPage(locale = "en") {
  const t = ui[locale];
  return layout({ locale, pathname: "/404.html", notFound: true, title: `${t.notFound} — Metkagram`, description: t.notFoundText, body: `<section class="page-head section-pad"><p class="eyebrow">404</p><h1>${t.notFound}</h1><p class="lede">${t.notFoundText}</p><a class="text-link" href="/${locale}/">← ${t.home}</a></section>` });
}
