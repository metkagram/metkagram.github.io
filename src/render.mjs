import { collectionKeys, collectionLabel, targetMeta, ui } from "./i18n.mjs";
import { ATTRIBUTION, getDatasetVersion } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";

export { SITE_URL };

export const STORE_LINKS = {
  googlePlay: "https://play.google.com/store/apps/details?id=app.metkagram.android",
  appStore: "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918"
};

function metkagramEntityGraph() {
  const applicationId = `${SITE_URL}/#mobile-application`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Metkagram",
        url: SITE_URL,
        logo: `${SITE_URL}/assets/icons/metkagram-icon-512x512.png`,
        sameAs: ["https://github.com/metkagram/metkagram.github.io"]
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Metkagram",
        url: SITE_URL,
        inLanguage: ["en", "ru"],
        publisher: { "@id": `${SITE_URL}/#organization` }
      },
      {
        "@type": ["MobileApplication", "SoftwareApplication"],
        "@id": applicationId,
        name: "Metkagram",
        url: `${SITE_URL}/en/apps/`,
        mainEntityOfPage: `${SITE_URL}/en/apps/`,
        applicationCategory: "EducationalApplication",
        applicationSubCategory: "Language learning",
        operatingSystem: "Android, iOS",
        isAccessibleForFree: true,
        featureList: ["Grammar flashcards", "Minimal pairs", "Grammar drills", "Spaced repetition"],
        image: `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`,
        screenshot: `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`,
        publisher: { "@id": `${SITE_URL}/#organization` },
        downloadUrl: STORE_LINKS.googlePlay,
        installUrl: STORE_LINKS.appStore,
        sameAs: [STORE_LINKS.googlePlay, STORE_LINKS.appStore],
        offers: [
          { "@type": "Offer", name: "Metkagram for Android", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: STORE_LINKS.googlePlay },
          { "@type": "Offer", name: "Metkagram for iOS", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: STORE_LINKS.appStore }
        ]
      }
    ]
  };
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function conciseMeta(value = "", limit) {
  const text = String(value).replaceAll(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit - 1);
  const lastWord = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastWord > limit * 0.55 ? lastWord : slice.length)}…`;
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
    <a class="wordmark" href="/${locale}/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-light.svg" width="800" height="200" alt="Metkagram"></a>
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
    <a class="footer-mark" href="/${locale}/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-light.svg" width="800" height="200" alt="Metkagram"></a>
    <nav aria-label="Footer"><a href="/${locale}/apps/">${t.apps}</a><a href="/${locale}/ai/">${t.forAiDevelopers}</a><a href="/${locale}/legal/privacy/">${t.privacy}</a><a href="/${locale}/legal/terms/">${t.terms}</a><a href="https://github.com/metkagram/metkagram.github.io">${t.source}</a><a href="/${locale}/history/">${t.history}</a><a href="/${locale}/roadmap/">${t.roadmap}</a><a href="/${locale}/roadmap/#changelog">${t.changelog}</a><a href="/${locale}/about/#license">${t.license}</a></nav>
    <p>${t.connected}</p>
  </footer>`;
}

export function layout({ locale = "en", pathname, title, description, body, type = "website", structuredData = [], root = false, notFound = false, bodyClass = "" }) {
  const metaTitle = conciseMeta(title, 68);
  const metaDescription = conciseMeta(description, 155);
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
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  ${notFound ? '<meta name="robots" content="noindex,follow">' : ""}
  <meta name="theme-color" content="#FFC400">
  <meta name="color-scheme" content="light">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:locale" content="${locale === "ru" ? "ru_RU" : "en_US"}">
  <meta property="og:title" content="${escapeHtml(metaTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png">
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/icons/metkagram-mark.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/icons/metkagram-icon-180x180.png">
  <link rel="manifest" href="/assets/web/site.webmanifest">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta name="metkagram-sync-endpoint" content="https://metalhatscats.com/api/metkax/srs">
  ${[metkagramEntityGraph(), ...structuredData].map(jsonLd).join("\n")}
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
    <p class="annotated-line"><span class="grammar-tag subject">S</span> We <span class="grammar-tag verb">V</span> learn <span class="grammar-tag object">p2</span> language patterns <span class="grammar-tag helper">Hf</span> by using them.</p>
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
    <div class="home-rail" aria-label="${t.homeJourneyLabel}"><span>01 · ${t.homeJourneyStart}</span><span>02 · ${t.homeLanguageTitle}</span><span>03 · ${t.homeJourneyUnderstand}</span><span>04 · ${t.homeJourneyReuse}</span></div>
    <div class="home-intro"><div><p class="eyebrow">${t.homeEyebrow}</p><h1>${t.statement}</h1></div><div class="home-action"><p class="home-kicker">${t.homeKicker}</p><p class="lede">${t.homeIntro}</p><div class="home-cta"><a class="primary-link" href="/${locale}/explore/">${t.homeExplore} <span aria-hidden="true">→</span></a><a class="text-link" href="/${locale}/practice/">${t.homePractice} <span aria-hidden="true">→</span></a><a class="text-link" href="/${locale}/ai/">${t.forAiDevelopers} <span aria-hidden="true">→</span></a></div></div></div>
  </section>
  <section class="mode-doors section-pad ruled" aria-labelledby="mode-doors-title"><div><p class="eyebrow">01 · Metkagram</p><h2 id="mode-doors-title">${t.homeModesTitle}</h2></div><div class="mode-door-list"><a class="mode-door annotated-door" href="/${locale}/explore/"><span>01</span><div><p class="eyebrow">${t.navExplore}</p><h3>${t.navExplore}</h3><p>${t.homeAnnotatedIntro}</p></div><b aria-hidden="true">→</b></a><a class="mode-door practice-door" href="/${locale}/practice/"><span>02</span><div><p class="eyebrow">B2–C1</p><h3>${t.navPractice}</h3><p>${t.homePracticeIntro}</p></div><b aria-hidden="true">→</b></a></div></section>
  <section class="home-method section-pad ruled" aria-labelledby="home-method-title"><div><p class="eyebrow">01 · ${t.navMethod}</p><h2 id="home-method-title">${t.homeMethodTitle}</h2></div><div><p class="lede">${t.homeMethodDetail}</p><ol>${t.homeMethodSteps.map((step, index) => `<li><span>0${index + 1}</span><div><strong>${step}</strong><small>${t.homeMethodNotes[index]}</small></div></li>`).join("")}</ol><a class="text-link" href="/${locale}/method/">${t.homeMethodLink} <span aria-hidden="true">→</span></a></div></section>
  <section class="study-language section-pad ruled" aria-labelledby="language-picker-title"><div><p class="eyebrow" id="language-picker-title">02 · ${t.homeLanguageTitle}</p><h2>${t.homeStartTitle}</h2></div><p>${t.homeLanguageDetail}</p><div class="language-choices">${Object.values(targetMeta).map((target) => `<a href="/${locale}/explore/${target.key}/"><span class="language-choice-code">${target.flag}</span><span><strong>${t[target.key]}</strong><small>${totalSets(target.key).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${t.sets} · ${target.native}</small></span><span aria-hidden="true">→</span></a>`).join("")}</div></section>
  <section class="home-connect section-pad ruled" aria-label="${t.homeCollaborationEyebrow} and ${t.homeAppsEyebrow}"><article><p class="eyebrow">03 · ${t.homeCollaborationEyebrow}</p><h2>${t.homeCollaborationTitle}</h2><p>${t.homeCollaborationDetail}</p><a class="text-link" href="https://metalhatscats.com/contact" target="_blank" rel="noreferrer">${t.homeCollaborationLink} <span aria-hidden="true">↗</span></a></article><article><p class="eyebrow">04 · ${t.homeAppsEyebrow}</p><h2>${t.homeAppsTitle}</h2><p>${t.homeAppsDetail}</p><nav class="home-store-links" aria-label="${t.homeAppsEyebrow}"><a href="${STORE_LINKS.googlePlay}" target="_blank" rel="noreferrer">Google Play <span aria-hidden="true">↗</span></a><a href="${STORE_LINKS.appStore}" target="_blank" rel="noreferrer">App Store <span aria-hidden="true">↗</span></a></nav></article></section>`;
  const structuredData = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Metkagram", url: SITE_URL, inLanguage: ["en", "ru"] },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Metkagram", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: `${SITE_URL}/${locale}/`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }
  ];
  return layout({ locale, pathname, title: locale === "en" ? "Metkagram — grammar markup for reusable language patterns" : "Metkagram — фразы с понятной разметкой", description: t.statementDetail, body, structuredData });
}

export function explorePage(locale, content) {
  const t = ui[locale];
  const pathname = `/${locale}/explore/`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">${t.navExplore}</p><h1>${t.exploreTitle}</h1><p class="lede">${t.exploreIntro}</p></section>
  <section class="language-planes section-pad ruled">${Object.values(targetMeta).map((target) => `<article><p class="language-code">${target.flag}</p><h2>${t[target.key]} <span>${target.native}</span></h2><ul>${collectionKeys.map((key) => `<li><a href="/${locale}/explore/${target.key}/${key}/"><span>${t[key]}</span><strong>${content.collections[target.key][key].documents.length}</strong></a></li>`).join("")}<li><a href="/${locale}/explore/${target.key}/annotation-rules/"><span>${t.rules}</span><span aria-hidden="true">↗</span></a></li></ul></article>`).join("")}</section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Explore English & German language patterns — Metkagram" : "Подборки английских и немецких фраз — Metkagram", description: t.exploreIntro, body, structuredData: [breadcrumbJson(pathname, t.navExplore, locale)] });
}

export function languageHub(locale, targetKey, content) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = `/${locale}/explore/${targetKey}/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: pathname, label: t[targetKey] }])}<section class="page-head section-pad compact"><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${t[targetKey]} — ${t.collections.toLowerCase()}</h1>${languageTabs(locale, targetKey)}</section><section class="entry-list section-pad ruled">${collectionKeys.map((key, index) => `<a href="/${locale}/explore/${targetKey}/${key}/"><span class="entry-index">0${index + 1}</span><strong>${t[key]}</strong><span>${content.collections[targetKey][key].documents.length} ${t.sets}</span><span aria-hidden="true">↗</span></a>`).join("")}<a href="/${locale}/explore/${targetKey}/annotation-rules/"><span class="entry-index">04</span><strong>${t.rules}</strong><span>${t.notation}</span><span aria-hidden="true">↗</span></a></section>`;
  return layout({ locale, pathname, title: locale === "en" ? `${t[targetKey]} language patterns and dialogues — Metkagram` : `${t[targetKey]}: коллекции языковых паттернов — Metkagram`, description: t.exploreIntro, body, structuredData: [breadcrumbJson(pathname, t[targetKey], locale)] });
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
  <section class="collection-tools section-pad ruled"><div class="collection-toolbar"><div><p class="eyebrow">${t.allItems}</p><output class="result-count" data-collection-count aria-live="polite">${t.visibleSets} ${collection.documents.length} ${t.of} ${collection.documents.length} ${t.sets}</output></div><label class="search-field">${t.search}<input type="search" data-collection-search autocomplete="off"></label></div></section>
  <section class="document-index section-pad" data-collection-list>${collection.documents.map((doc, index) => `<a href="${itemUrl(locale, targetKey, collectionKey, doc)}" data-search-text="${escapeHtml(doc.title.toLowerCase())}"><span class="document-number">${String(index + 1).padStart(3, "0")}</span><span><strong>${escapeHtml(doc.title)}</strong><small>${doc.annotations.length} ${t.sentences}</small></span><span aria-hidden="true">↗</span></a>`).join("")}<p class="empty-state" data-empty-state hidden>${t.noResults}</p></section>`;
  const itemList = collection.documents.map((doc, index) => ({ "@type": "ListItem", position: index + 1, name: doc.title, url: `${SITE_URL}${itemUrl(locale, targetKey, collectionKey, doc)}` }));
  return layout({ locale, pathname, title: locale === "en" ? `${t[collectionKey]} in ${t[targetKey]} — ${collection.documents.length} annotated sets | Metkagram` : `${t[collectionKey]}: ${t[targetKey]} — ${collection.documents.length} наборов | Metkagram`, description: locale === "en" ? `${collection.documents.length} ${t[collectionKey].toLowerCase()} sets in ${t[targetKey]}, with ${totalSentences.toLocaleString("en-US")} annotated sentences to read and reuse.` : `${collection.documents.length} наборов ${t[collectionKey].toLowerCase()} на ${t[targetKey].toLowerCase()}: ${totalSentences.toLocaleString("ru-RU")} аннотированных предложений для чтения и практики.`, body, structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: itemList }] });
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

function renderAnnotation(annotation, locale, targetKey, index) {
  const t = ui[locale];
  const tokens = flattenSpan(annotation.text_span).map((token, tokenIndex) => {
    if (token.tag === "tag") {
      const tag = token.text.trim();
      const rule = tagRule(locale, targetKey, tag, token.extra);
      const tooltipId = `tag-rule-${index + 1}-${tag.replaceAll(/[^a-z0-9]/gi, "") || "mark"}-${tokenIndex + 1}`;
      return `<button class="grammar-tag tag-trigger ${tokenClass(tag)}" type="button" aria-expanded="false" aria-describedby="${tooltipId}" data-tag-trigger>${escapeHtml(tag)}${token.extra ? `<small>${escapeHtml(token.extra)}</small>` : ""}<span class="tag-tooltip" id="${tooltipId}" role="tooltip"><strong>${escapeHtml(rule.title)}</strong><span>${escapeHtml(rule.description)}</span><small><b>${t.tagRuleUse}</b> ${escapeHtml(rule.use)}</small></span></button>`;
    }
    return escapeHtml(token.text);
  }).join("");
  const translation = locale === "ru" ? annotation.translations?.ru || annotation.translated_text : annotation.translations?.en;
  return `<article class="annotation-row" id="sentence-${index + 1}"><span class="line-number">${String(index + 1).padStart(2, "0")}</span><div><p class="annotated-line">${tokens || escapeHtml(annotation.original_text)}</p><details data-annotation-details><summary>${t.openExplanation}</summary><div class="annotation-explanation"><p class="plain-sentence">${escapeHtml(annotation.original_text)}</p>${translation || annotation.chunkList ? `<dl class="annotation-notes">${translation ? `<div><dt>${t.translation}</dt><dd>${escapeHtml(translation)}</dd></div>` : ""}${annotation.chunkList ? `<div><dt>${t.patterns}</dt><dd>${escapeHtml(annotation.chunkList)}</dd></div>` : ""}</dl>` : ""}</div></details></div></article>`;
}

export function documentPage(locale, targetKey, collectionKey, document) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = itemUrl(locale, targetKey, collectionKey, document);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: `/${locale}/explore/${targetKey}/${collectionKey}/`, label: t[collectionKey] }, { href: pathname, label: document.title }])}
  <article class="document-page"><header class="document-head section-pad"><p class="eyebrow">${target.flag} · ${t[collectionKey]}</p><h1>${escapeHtml(document.title)}</h1><div class="document-context"><p>${t.documentContains} <strong>${document.annotations.length}</strong> ${t.sentences}.</p><p class="document-guide">${t.readingGuide}</p></div>${document.version ? `<p class="version">${t.updated}: ${escapeHtml(document.version)}</p>` : ""}</header><section class="annotation-controls section-pad" data-annotation-controls data-reading-copy="${escapeHtml(t.annotationModeReading)}" data-study-copy="${escapeHtml(t.annotationModeStudyActive)}" aria-label="${t.annotationModeLabel}"><div><p class="eyebrow">${t.annotationModeLabel}</p><p data-annotation-mode-copy>${t.annotationModeReading}</p></div><div class="segmented annotation-mode-switch" role="group" aria-label="${t.annotationModeLabel}"><button type="button" data-annotation-mode="reading" aria-pressed="true">${t.annotationModeReadingButton}</button><button type="button" data-annotation-mode="study" aria-pressed="false">${t.annotationModeStudyButton}</button></div></section><div class="annotation-sheet section-pad">${document.annotations.map((annotation, index) => renderAnnotation(annotation, locale, targetKey, index)).join("")}</div></article>`;
  const learningResource = { "@context": "https://schema.org", "@type": "LearningResource", name: document.title, url: `${SITE_URL}${pathname}`, inLanguage: target.dataKey, educationalLevel: "Intermediate to advanced", learningResourceType: collectionLabel(locale, collectionKey), isAccessibleForFree: true };
  return layout({ locale, pathname, title: locale === "en" ? `${document.title}: ${document.annotations.length} annotated sentences | Metkagram` : `${document.title}: ${document.annotations.length} аннотированных предложений | Metkagram`, description: locale === "en" ? `${document.title}: read ${document.annotations.length} annotated ${target.native} sentences, then open grammar explanations only when you need them.` : `${document.title}: ${document.annotations.length} аннотированных предложений на ${target.native} с объяснениями по запросу.`, body, type: "article", structuredData: [breadcrumbJson(pathname, document.title, locale), learningResource] });
}

const rules = {
  english: [
    ["S", "Subject", "The main actor or receiver in the sentence."], ["S*", "Subject, emphasized", "A subject highlighted in a trainer prompt."], ["st", "State", "A condition or state."], ["st*", "Passive state", "A state used in passive constructions."], ["v2", "Second verb", "A secondary verb paired with a helper."], ["p2", "Predicate", "Predicate detail connected to the subject."], ["vI", "Infinitive", "A verb in infinitive form."], ["vP", "Participle", "A participle used in a compound tense."], ["Vp", "Participle, alternate", "Alternate participle notation."], ["Hr", "Result helper", "A helper showing a completed result."], ["Hst", "State helper", "A helper emphasizing an ongoing state."], ["pA", "Placeholder A", "A structural placeholder in a rule."], ["pS", "Placeholder S", "A secondary structural placeholder."], ["Hf", "Future helper", "A helper projecting action into the future."], ["V", "Main verb", "The primary action or state."]
  ],
  german: [
    ["S", "Subject (Subjekt)", "The person or thing taking part in the sentence."], ["S*", "Emphasised subject", "A subject brought forward for emphasis."], ["st", "State (Zustand)", "A condition or state."], ["st*", "Passive state", "A state marker used in passive constructions."], ["v2", "Second verb", "A verb element in second position."], ["vI", "Infinitive", "A verb in infinitive form."], ["/→", "Accusative", "The direct object: whom or what?"], ["\\→", "Dative", "The indirect object: to or for whom?"], ["\\?", "Genitive", "Possession or belonging: whose?"], ["←…", "Inversion", "A change from the usual word order."], ["vP", "Participle", "A participle used in a compound tense."], ["Vp", "Participle, alternate", "Alternate participle notation."], ["Hr", "Result helper", "A helper verb marking a completed result."], ["Hst", "State helper", "A helper verb marking a change of state."], ["Hf", "Future helper", "A helper verb pointing forward in time."], ["V", "Main verb", "The central verb of the statement."], ["M", "Modal verb", "A modal verb for ability, permission or obligation."]
  ]
};

const ruleCopyRu = {
  english: {
    S: ["Подлежащее", "Тот, кто действует, или то, о чём говорится в предложении."], "S*": ["Выделенное подлежащее", "Подлежащее, на которое в задании нужно обратить особое внимание."], st: ["Состояние", "Состояние или условие."], "st*": ["Пассивное состояние", "Состояние в пассивной конструкции."], v2: ["Второй глагол", "Дополнительный глагол рядом со служебным."], p2: ["Сказуемое", "Часть сказуемого, связанная с подлежащим."], vI: ["Инфинитив", "Глагол в начальной форме."], vP: ["Причастие", "Причастная форма в составном времени."], Vp: ["Причастие, вариант", "Альтернативная запись причастной формы."], Hr: ["Служебный глагол результата", "Помогает показать завершённый результат."], Hst: ["Служебный глагол состояния", "Подчёркивает продолжающееся состояние."], pA: ["Переменная A", "Место для элемента конструкции в правиле."], pS: ["Переменная S", "Дополнительное место для элемента конструкции."], Hf: ["Служебный глагол будущего", "Переносит действие в будущее."], V: ["Главный глагол", "Основное действие или состояние в предложении."]
  },
  german: {
    S: ["Подлежащее (Subjekt)", "Тот, кто действует, или то, о чём говорится в предложении."], "S*": ["Выделенное подлежащее", "Подлежащее, на которое нужно обратить особое внимание."], st: ["Состояние (Zustand)", "Состояние или условие."], "st*": ["Пассивное состояние", "Маркер состояния в пассивной конструкции."], v2: ["Второй глагол", "Часть глагольной конструкции на второй позиции."], vI: ["Инфинитив", "Глагол в начальной форме."], "/→": ["Винительный падеж", "Прямое дополнение: кого или что?"], "\\→": ["Дательный падеж", "Косвенное дополнение: кому или чему?"], "\\?": ["Родительный падеж", "Принадлежность: чей?"], "←…": ["Инверсия", "Изменение привычного порядка слов."], vP: ["Причастие", "Причастная форма в составном времени."], Vp: ["Причастие, вариант", "Альтернативная запись причастной формы."], Hr: ["Служебный глагол результата", "Показывает завершённый результат."], Hst: ["Служебный глагол состояния", "Показывает изменение состояния."], Hf: ["Служебный глагол будущего", "Указывает на будущее время."], V: ["Главный глагол", "Главный глагол высказывания."], M: ["Модальный глагол", "Передаёт возможность, разрешение или необходимость."]
  }
};

function ruleCopy(locale, targetKey, rule) {
  const [tag, title, description] = rule;
  const translated = locale === "ru" ? ruleCopyRu[targetKey]?.[tag] : null;
  return { tag, title: translated?.[0] || title, description: translated?.[1] || description };
}

function tagRule(locale, targetKey, tag, extra) {
  const rule = rules[targetKey].find(([key]) => key === tag) || rules[targetKey].find(([key]) => key.toLowerCase() === tag.toLowerCase());
  const fallback = extra || ui[locale].notation;
  if (!rule) return { title: fallback, description: ui[locale].tagRuleFallback, use: ui[locale].tagRuleFallbackUse };
  const { title, description } = ruleCopy(locale, targetKey, rule);
  const useByClass = {
    subject: ui[locale].tagRuleSubjectUse,
    verb: ui[locale].tagRuleVerbUse,
    object: ui[locale].tagRuleObjectUse,
    helper: ui[locale].tagRuleHelperUse
  };
  return { title, description, use: useByClass[tokenClass(tag)] };
}

export function rulesPage(locale, targetKey) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = `/${locale}/explore/${targetKey}/annotation-rules/`;
  const guide = locale === "ru"
    ? targetKey === "english"
      ? { title: "Как читать разметку английских фраз", intro: "Сначала прочитайте фразу как обычно. Теги не заменяют грамматику — они лишь подсказывают, куда посмотреть.", label: "Сначала фраза, потом разметка", sample: [["S", "Мы"], ["V", "учим"], ["p2", "языковые модели"], ["Hf", "и будем применять их"]] }
      : { title: "Как читать разметку немецких фраз", intro: "Сначала прочитайте фразу целиком. Теги помогают заметить порядок слов, падеж и форму глагола без длинных правил.", label: "Сначала фраза, потом разметка", sample: [["S", "Wir"], ["V", "lernen"], ["/→", "die Muster"], ["Hf", "und werden sie benutzen"]] }
    : targetKey === "english"
      ? { title: "How to read English tags", intro: "Read the sentence normally first. Tags do not replace grammar; they simply point your attention to a useful part of the structure.", label: "Sentence first, tags second", sample: [["S", "We"], ["V", "learn"], ["p2", "language patterns"], ["Hf", "and will use them"]] }
      : { title: "How to read German tags", intro: "Read the whole sentence first. Tags make word order, case and verb form easier to notice without turning the page into a rulebook.", label: "Sentence first, tags second", sample: [["S", "Wir"], ["V", "lernen"], ["/→", "die Muster"], ["Hf", "und werden sie benutzen"]] };
  const groups = ["subject", "verb", "object", "helper"].map((kind) => ({ kind, entries: rules[targetKey].filter(([tag]) => tokenClass(tag) === kind) })).filter((group) => group.entries.length);
  const groupCopy = locale === "ru"
    ? { subject: ["Кто или что", "Кому принадлежит действие или состояние."], verb: ["Действие и форма", "Что происходит и в какой форме стоит глагол."], object: ["Детали конструкции", "Падеж, состояние, дополнение и другие опоры фразы."], helper: ["Служебные глаголы", "Как меняются время, результат или состояние действия."] }
    : { subject: ["Who or what", "The person or thing the sentence is about."], verb: ["Action and form", "What happens and which verb form carries it."], object: ["Sentence details", "Case, state, predicate detail and other structural cues."], helper: ["Helper verbs", "How tense, result or state changes the main verb."] };
  const sample = guide.sample.map(([tag, text]) => `<span><b class="grammar-tag ${tokenClass(tag)}">${escapeHtml(tag)}</b>${escapeHtml(text)}</span>`).join(" ");
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: pathname, label: t.rules }])}<section class="rules-hero section-pad"><div><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${guide.title}</h1><p class="lede">${guide.intro}</p>${languageTabs(locale, targetKey, "annotation-rules/")}</div><figure class="rules-sample"><figcaption>${guide.label}</figcaption><p>${sample}</p></figure></section><section class="rules-catalogue section-pad ruled">${groups.map(({ kind, entries }, index) => `<section class="rule-group rule-group-${kind}"><header><span>0${index + 1}</span><h2>${groupCopy[kind][0]}</h2><p>${groupCopy[kind][1]}</p></header><div>${entries.map((rule) => { const item = ruleCopy(locale, targetKey, rule); return `<article><span class="grammar-tag ${kind}">${escapeHtml(item.tag)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><small><b>${t.tagRuleUse}</b> ${escapeHtml({ subject: t.tagRuleSubjectUse, verb: t.tagRuleVerbUse, object: t.tagRuleObjectUse, helper: t.tagRuleHelperUse }[kind])}</small></div></article>`; }).join("")}</div></section>`).join("")}</section>`;
  return layout({ locale, pathname, title: `${t.rules}: ${t[targetKey]} — Metkagram`, description: locale === "en" ? `A plain-language guide to the ${t[targetKey]} grammar marks used in Metkagram sentences.` : `Понятный справочник по обозначениям грамматики ${t[targetKey].toLowerCase()} в предложениях Metkagram.`, body, structuredData: [breadcrumbJson(pathname, t.rules, locale)] });
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
  return layout({ locale, pathname, title: `${title} — B2–C1 pattern | Metkagram`, description: locale === "en" ? `${primary.formula}: a B2–C1 language pattern with a clear example, translation and active-recall review.` : `${title}: речевая модель B2–C1 с примером, переводом и повторением.`, body, type: "article", structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: title, identifier: pattern.id, educationalLevel: "B2–C1", teaches: pattern.formulas || pattern.langs.map((lang) => lang.formula), inLanguage: pattern.langs.map((lang) => lang.lang), url: `${SITE_URL}${pathname}` }] });
}

export function practicePage(locale, patterns, studySets) {
  const t = ui[locale];
  const pathname = `/${locale}/practice/`;
  const categories = [...new Set(patterns.map((pattern) => pattern.group_id))].sort();
  const setCards = studySets.sets.map((set) => {
    const size = patterns.filter((pattern) => pattern.set_id === set.id).length;
    const title = locale === "ru" ? set.title_ru : set.title_en;
    return `<a href="/${locale}/practice/set/${set.id.toLowerCase()}/" class="study-set" data-study-set-card="${set.id}"><span>${escapeHtml(set.id)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(locale === "ru" ? `${size} полных паттернов B2–C1` : `${size} complete B2–C1 patterns`)}</p></div><strong data-set-progress="${set.id}">0%</strong></a>`;
  }).join("");
  const paths = studySets.learningPaths.map((pathItem) => {
    const names = pathItem.set_ids.map((id) => {
      const set = studySets.sets.find((item) => item.id === id);
      return escapeHtml(locale === "ru" ? set?.title_ru : set?.title_en);
    }).join(" · ");
    return `<li><strong>${escapeHtml(locale === "ru" ? pathItem.title_ru : pathItem.title_en)}</strong><span>${names}</span></li>`;
  }).join("");
  const body = `<section class="page-head section-pad practice-intro"><p class="eyebrow">B2–C1 · ${patterns.length.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${t.patterns.toLowerCase()}</p><h1>${t.practiceTitle}</h1><p class="lede">${t.practiceIntro}</p><div class="practice-status" data-practice-status><a href="/${locale}/review/">${t.dueReviews}: <b data-practice-due>—</b></a><a href="#all-patterns">${t.allPatterns} <b>${patterns.length.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</b></a><span>${t.continueLearning}: <b data-practice-continue>—</b></span></div></section><section class="study-dashboard section-pad ruled"><div><p class="eyebrow">01 · ${t.studySets}</p><h2>${t.studySets}</h2></div><div class="study-set-grid">${setCards}</div><aside><p class="eyebrow">02 · ${t.learningPaths}</p><ol class="learning-paths">${paths}</ol></aside></section><section id="all-patterns" class="practice-tools section-pad ruled"><div class="filter-field"><p class="filter-label">${t.chooseTarget}</p><div class="segmented" aria-label="${t.chooseTarget}"><button type="button" data-language-filter="en" aria-pressed="true">EN · ${t.english}</button><button type="button" data-language-filter="de" aria-pressed="true">DE · ${t.german}</button></div></div><label>${t.category}<select data-category-filter><option value="">${t.allCategories}</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label><label>${t.search}<input type="search" data-pattern-search></label><output class="result-count practice-count" data-pattern-count aria-live="polite">${t.visibleSets} ${patterns.length} ${t.patterns.toLowerCase()}</output></section><section class="pattern-index section-pad" data-pattern-list>${patterns.map((pattern, index) => `<a href="/${locale}/practice/${pattern.id.toLowerCase()}/" data-language="${pattern.langs.map((lang) => lang.lang).join(" ")}" data-category="${escapeHtml(pattern.group_id)}" data-search-text="${escapeHtml(`${pattern.id} ${pattern.title_ru} ${pattern.formulas?.join(" ") || ""}`.toLowerCase())}"><span class="document-number">${String(index + 1).padStart(4, "0")}</span><span><strong>${escapeHtml(patternTitle(pattern, locale))}</strong><small>${escapeHtml(pattern.id)} · ${escapeHtml(pattern.set_id)} · ${pattern.langs.map((lang) => lang.lang.toUpperCase()).join(" / ")}</small></span><span aria-hidden="true">↗</span></a>`).join("")}<p class="empty-state" data-empty-state hidden>${t.noResults}</p></section>`;
  return layout({ locale, pathname, title: `${t.practiceTitle} — ${patterns.length.toLocaleString()} B2–C1 patterns | Metkagram`, description: t.practiceIntro, body, structuredData: [breadcrumbJson(pathname, t.practiceTitle, locale), { "@context": "https://schema.org", "@type": "ItemList", name: t.practiceTitle, numberOfItems: patterns.length }] });
}

export function studySetPage(locale, set, patterns) {
  const t = ui[locale];
  const title = locale === "ru" ? set.title_ru : set.title_en;
  const pathname = `/${locale}/practice/set/${set.id.toLowerCase()}/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/practice/`, label: t.navPractice }, { href: pathname, label: title }])}<section class="page-head section-pad compact"><p class="eyebrow">B2–C1 · ${escapeHtml(set.id)} · ${patterns.length} ${t.patterns.toLowerCase()}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(set.description)}</p></section><section class="review-workspace section-pad ruled" data-study-workspace data-study-set="${escapeHtml(set.id)}"><p class="review-counter" data-review-counter></p><article data-review-card><p>${t.answerPrompt}</p><h2 data-review-title></h2><div data-review-answer hidden><p class="formula" data-review-formula></p><p data-review-example></p><p class="translation" data-review-translation></p></div><div class="review-actions"><button type="button" data-reveal>${t.reveal}</button><button type="button" data-grade="0" hidden>${t.hard}</button><button type="button" data-grade="1" hidden>${t.good}</button><button type="button" data-grade="2" hidden>${t.easy}</button></div></article><p class="empty-state" data-review-empty hidden>${t.queueEmpty}</p></section>`;
  return layout({ locale, pathname, title: `${title} — ${patterns.length} B2–C1 patterns | Metkagram`, description: set.description, body, structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: title, educationalLevel: "B2–C1", numberOfItems: patterns.length }] });
}

export function reviewPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/review/`;
  const body = `<section class="page-head section-pad compact"><p class="eyebrow">SRS · active recall</p><h1>${t.reviewTitle}</h1><p class="lede">${t.reviewIntro}</p></section><section class="review-workspace section-pad ruled" data-review-workspace><p class="review-counter" data-review-counter></p><article data-review-card><p>${t.answerPrompt}</p><h2 data-review-title></h2><div data-review-answer hidden><p class="formula" data-review-formula></p><p data-review-example></p><p class="translation" data-review-translation></p></div><div class="review-actions"><button type="button" data-reveal>${t.reveal}</button><button type="button" data-grade="0" hidden>${t.hard}</button><button type="button" data-grade="1" hidden>${t.good}</button><button type="button" data-grade="2" hidden>${t.easy}</button></div></article><p class="empty-state" data-review-empty hidden>${t.queueEmpty}</p></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Review due language patterns — Metkagram" : "Повторить речевые модели — Metkagram", description: t.reviewIntro, body, structuredData: [breadcrumbJson(pathname, t.reviewTitle, locale)] });
}

export function progressPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/progress/`;
  const body = `<section class="page-head section-pad compact"><p class="eyebrow">SRS · local-first</p><h1>${t.progressTitle}</h1><p class="lede">${t.progressIntro}</p></section><section class="progress-grid section-pad ruled" data-progress-page><div class="stats-block"><article><strong data-stat-due>0</strong><span>${t.dueNow}</span></article><article><strong data-stat-reviewed>0</strong><span>${t.reviewed}</span></article><article><strong data-stat-reviews>0</strong><span>${t.totalReviews}</span></article></div><div class="sync-block"><label>${t.syncCode}<input data-sync-code placeholder="${t.syncPlaceholder}" pattern="[a-zA-Z0-9_-]{3,64}"></label><div class="button-row"><button type="button" data-save-code>${t.saveCode}</button><button type="button" data-sync-now>${t.syncNow}</button></div><output data-sync-status aria-live="polite">${t.syncIdle}</output></div><div class="transfer-block"><h2>${t.migration}</h2><div class="button-row"><button type="button" data-export-progress>${t.export}</button><label class="button-label">${t.import}<input type="file" accept="application/json" data-import-progress></label></div><output data-import-status aria-live="polite"></output><a class="text-link" href="https://metalhatscats.com/ru/metkax/transfer-progress">${t.oldTransfer} ↗</a></div><div class="progress-table-wrap"><table><thead><tr><th>${t.patterns}</th><th>${t.reviewed}</th><th>${t.currentInterval}</th><th>${t.dueNow}</th></tr></thead><tbody data-progress-rows></tbody></table><p data-progress-empty>${t.statsEmpty}</p></div></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Your language learning progress — Metkagram" : "Ваш прогресс в изучении языка — Metkagram", description: t.progressIntro, body, structuredData: [breadcrumbJson(pathname, t.progressTitle, locale)] });
}

export function methodPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/method/`;
  const c = ru ? {
    eyebrow: "Metkagram · метод", title: "Фраза остаётся живой. Структура становится видимой.", intro: "Ноу-хау Metkagram — компактная функциональная разметка внутри естественной фразы: тег стоит рядом именно с тем словом или отрезком, который объясняет.", loop: "Полный учебный цикл", before: "До и после разметки", variation: "Вариация B2–C1", original: "В чём ноу-хау Metkagram?", evidence: "На чём основана логика", limits: "Ограничения", sources: "Проверяемые источники", data: "Машиночитаемый размеченный корпус", recall: "Сначала вспомните конструкцию. Затем откройте ответ.", stages: ["Фраза", "Сигнал", "Структура", "Паттерн", "Вариация", "Извлечение", "Интервальное повторение"], stageText: ["Прочитайте целое осмысленное предложение.", "Заметьте минимальный тег рядом со словом.", "Свяжите тег с точным фрагментом фразы.", "Выделите готовый кусок, который можно повторить.", "Сравните его в вопросе, отрицании, другом времени и контексте.", "Попробуйте восстановить конструкцию до подсказки.", "Вернитесь к ней позже, когда она снова станет нужна."], originalText: "Оригинальность не в том, что Metkagram изобрёл лингвистическую разметку, цвет, карточки или интервальное повторение. Она в их связке: компактный тег прикреплён к живой фразе, за ним следуют объяснение, перевод, формула, вариации, активное извлечение, возвращение по интервалам и открытый размеченный набор данных.", evidenceText: ["Выборочный сигнал может поддержать внимание к одной функционально важной детали, не требуя разбирать всё предложение сразу.", "Разметка внутри осмысленного входного материала согласуется с подходом focus on form: форма остаётся внутри смысла.", "Один короткий тег рядом со словом спроектирован так, чтобы не создавать отдельный экран правил и лишнее переключение внимания.", "Фраза и готовый кусок могут поддержать контекстное кодирование и перенос в новые ситуации.", "Попытка вспомнить до ответа может поддержать долговременный доступ к модели.", "Возвращение через интервалы спроектировано для долгого удержания, а не бесконечного перечитывания.", "Систематическая вариация помогает увидеть, что меняется, а что остаётся переносимой конструкцией."], limitsText: "Эти механизмы поддерживают логику дизайна, но не доказывают, что один цветной тег сам по себе обучает языку. Метки не заменяют чтение, разговор, обратную связь, словарную работу или практику."
  } : {
    eyebrow: "Metkagram · method", title: "The sentence stays readable. Its structure becomes inspectable.", intro: "Metkagram’s project know-how is inline functional annotation: a compact tag sits directly beside the word or span whose function it explains.", loop: "The complete learning loop", before: "Before and after annotation", variation: "B2–C1 variation", original: "What is original about Metkagram?", evidence: "What informs the design", limits: "Limits", sources: "Verified sources", data: "A machine-readable annotated dataset", recall: "Try to retrieve the pattern before revealing the answer.", stages: ["Sentence", "Signal", "Structure", "Pattern", "Variation", "Recall", "Spaced review"], stageText: ["Read one complete, meaningful sentence.", "Notice a minimal tag beside a word or span.", "Connect the tag to the exact part it describes.", "Identify a reusable chunk or structural pattern.", "Compare it across pronouns, questions, negatives, tenses and contexts.", "Attempt to retrieve it before the answer is shown.", "Return to it later through spaced review."], originalText: "Metkagram does not claim to have invented linguistic annotation, colour coding, retrieval practice or spaced repetition. Its original contribution is their integrated system: compact tags attached to natural sentences, progressive explanations and translations, chunks and formulas, systematic variation, active recall, spaced review, and a machine-readable annotated dataset.", evidenceText: ["A selective visual cue can support attention to one functionally relevant detail without asking the learner to parse every part at once.", "Inline annotation in meaningful input is consistent with focus on form: the form remains inside a sentence with meaning.", "A short tag beside its word is designed to reduce split attention between a rule screen and the sentence.", "A sentence and its reusable chunk can support contextual encoding and later transfer to a new situation.", "Attempting retrieval before feedback can support later access to a pattern.", "Spaced return is designed for long-term retention rather than endless rereading.", "Systematic variation helps learners compare what changes and what remains reusable."], limitsText: "These mechanisms support the design logic; they do not prove that a coloured tag alone teaches a language. Tags do not replace reading, conversation, feedback, vocabulary work or practice."
  };
  const tagInfo = ru ? { S: ["Подлежащее", "Кто действует или о ком говорится."], V: ["Главный глагол", "Основное действие или состояние."], vI: ["Инфинитив", "Глагол в начальной форме."], M: ["Модальный глагол", "Показывает возможность, просьбу или необходимость."], v2: ["Второй глагол", "Глагольная форма после служебного или модального глагола."], Hr: ["Служебный глагол результата", "Связывает действие с завершённым опытом или результатом."] } : { S: ["Subject", "Who acts or who the sentence is about."], V: ["Main verb", "The primary action or state."], vI: ["Infinitive", "A verb in its base form."], M: ["Modal verb", "Signals possibility, a request, or necessity."], v2: ["Second verb", "The verb form following a helper or modal."], Hr: ["Result helper", "Connects an action to completed experience or result."] };
  let methodTagIndex = 0;
  const tag = (kind, label, text) => { const id = `method-tag-${++methodTagIndex}`; const [title, description] = tagInfo[label]; return `<span class="method-token"><button class="grammar-tag tag-trigger ${kind}" type="button" aria-expanded="false" aria-describedby="${id}" data-tag-trigger>${label}<span class="tag-tooltip" id="${id}" role="tooltip"><strong>${title}</strong><span>${description}</span></span></button>${text}</span>`; };
  const examples = [
    `<p>${tag("subject", "S", "I")} ${tag("verb", "V", "want")} ${tag("verb", "vI", "to develop")} more effective study habits.</p>`,
    `<p>${tag("helper", "M", "Can")} ${tag("subject", "S", "you")} ${tag("verb", "v2", "help")}?</p>`,
    `<p>${tag("helper", "Hr", "Have")} ${tag("subject", "S", "you")} ${tag("verb", "v2", "tried")} spaced repetition?</p>`
  ];
  const sources = [
    ["https://pmc.ncbi.nlm.nih.gov/articles/PMC3390154/", "Posner & Rothbart (2007) · Research on attention networks"],
    ["https://pmc.ncbi.nlm.nih.gov/articles/PMC5002427/", "Loewen (2015) · Introduction to instructed second language acquisition"],
    ["https://pubmed.ncbi.nlm.nih.gov/33006925/", "Karpicke (2020) · Practicing retrieval facilitates learning"],
    ["https://pubmed.ncbi.nlm.nih.gov/30670661/", "Tabibian et al. (2019) · Enhancing human learning via spaced repetition optimization"]
  ];
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ui[locale].home }, { href: pathname, label: ui[locale].navMethod }])}<article class="method-page"><section class="method-hero section-pad"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p></div><div class="method-sentence" aria-label="Annotated sentence examples">${examples.join("")}</div></section><section class="method-loop section-pad ruled"><div><p class="eyebrow">01 · ${c.loop}</p><h2>Sentence → Signal → Structure → Pattern → Variation → Recall</h2></div><ol>${c.stages.map((stage, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${stage}</strong><p>${c.stageText[index]}</p></li>`).join("")}</ol></section><section class="method-compare section-pad ruled"><div><p class="eyebrow">02 · ${c.before}</p><h2>${ru ? "Сначала смысл, затем опора" : "Meaning first, cue second"}</h2></div><div class="method-compare-lines"><p>I want to develop more effective study habits.</p><p>${tag("subject", "S", "I")} ${tag("verb", "V", "want")} ${tag("verb", "vI", "to develop")} more effective study habits.</p><small>${c.recall}</small></div></section><section class="method-compare section-pad ruled"><div><p class="eyebrow">03 · ${c.variation}</p><h2>${ru ? "Одна схема — новые ситуации" : "One structure, new situations"}</h2></div><div class="method-compare-lines"><p><strong>If + Past Simple, would + V</strong></p><p>If I had more time, I would start a side project.</p><p>Wenn ich mehr Zeit hätte, würde ich ein Nebenprojekt starten.</p><small>${ru ? "Вопрос, отрицание, другое лицо и время меняют фразу, но помогают увидеть переносимую схему." : "Questions, negatives, people and tenses change the sentence while making the reusable structure visible."}</small></div></section><section class="method-original section-pad ruled"><p class="eyebrow">04 · ${c.original}</p><h2>${c.original}</h2><p class="lede">${c.originalText}</p><p class="method-data">${c.data}</p></section><section class="method-evidence section-pad ruled"><div><p class="eyebrow">05 · ${c.evidence}</p><h2>${ru ? "Исследования объясняют логику, а не обещают результат." : "Research informs the logic; it does not promise the outcome."}</h2></div><div class="method-evidence-grid">${c.evidenceText.map((text, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><p>${text}</p></article>`).join("")}</div></section><section class="method-boundary section-pad ruled"><div><p class="eyebrow">06 · ${c.limits}</p><h2>${c.limits}</h2></div><p class="lede">${c.limitsText}</p></section><section class="method-sources section-pad ruled"><div><p class="eyebrow">07 · ${c.sources}</p><h2>${c.sources}</h2><p class="lede">${ru ? "Названия, авторы, годы и ссылки приведены для различения результатов исследований и интерпретации Metkagram." : "Titles, authors, years and links distinguish research findings from Metkagram’s design interpretation."}</p></div><ol>${sources.map(([href, label], index) => `<li><a href="${href}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, "0")}</span>${label}<b aria-hidden="true">↗</b></a></li>`).join("")}</ol></section></article>`;
  const structuredData = { "@context": "https://schema.org", "@type": "LearningResource", name: c.title, learningResourceType: "Language learning method", educationalLevel: "B2–C1", inLanguage: locale, teaches: ["Inline functional annotation", "Reusable language patterns", "Active recall", "Spaced review"], isAccessibleForFree: true, url: `${SITE_URL}${pathname}` };
  return layout({ locale, pathname, title: ru ? "Как работает метод Metkagram" : "How the Metkagram method works", description: c.intro, body, structuredData: [breadcrumbJson(pathname, c.title, locale), structuredData] });
}

function legalSections(locale, kind) {
  const en = locale === "en";
  if (kind === "privacy") {
    return en ? {
      eyebrow: "Metkagram · legal",
      title: "Privacy Policy",
      intro: "How the Metkagram website and its legacy mobile apps handle information.",
      updated: "Last updated: 14 July 2026 · Legacy policy first published: 16 April 2023",
      sections: [
        ["Scope", "This policy applies to the Metkagram website, its learning-progress tools and the Android and iOS applications listed below. It describes the current public website and preserves the relevant terms for the legacy mobile apps."],
        ["Information on the website", "The public website does not require an account. It does not use advertising trackers. Your review progress and an optional sync code are stored in your browser. If you choose to synchronise, the code and the progress record are sent to the Metkagram compatibility service hosted by MetalHatsCats solely to perform that sync."],
        ["Legacy mobile apps", "The mobile apps may use the information needed to provide their features, support a user account where available, process a purchase through the relevant app store, and maintain or secure the service. The apps may rely on platform, cloud, analytics or sign-in services; those providers process data under their own policies."],
        ["Sharing and security", "We do not sell personal information. Information may be processed by service providers that help operate the apps, by app stores when you install or purchase, or where disclosure is required by law. Reasonable safeguards are used, but no online service can promise absolute security."],
        ["Your choices", "You can clear local website data in your browser, export or remove your local review record, and manage app permissions or purchases in the relevant store. For requests concerning the legacy apps or this policy, use the MetalHatsCats contact page."],
        ["Children and changes", "The service is not directed to children under 13. We may update this policy when the service changes; the date above indicates the current version."]
      ]
    } : {
      eyebrow: "Metkagram · правовая информация",
      title: "Политика конфиденциальности",
      intro: "Как сайт Metkagram и прежние мобильные приложения работают с информацией.",
      updated: "Обновлено: 14 июля 2026 · Исходная политика опубликована: 16 апреля 2023",
      sections: [
        ["Область действия", "Политика относится к сайту Metkagram, инструментам прогресса и приложениям для Android и iOS, ссылки на которые приведены ниже. В ней описан текущий публичный сайт и сохранены применимые условия для прежних мобильных приложений."],
        ["Информация на сайте", "Публичный сайт не требует учётной записи и не использует рекламные трекеры. Прогресс повторения и необязательный код синхронизации хранятся в браузере. Если вы запускаете синхронизацию, код и запись прогресса передаются в сервис совместимости Metkagram на MetalHatsCats только для выполнения этой синхронизации."],
        ["Прежние мобильные приложения", "Мобильные приложения могут использовать данные, необходимые для работы функций, поддержки учётной записи, если она доступна, обработки покупки через соответствующий магазин и защиты сервиса. Приложения могут использовать платформенные, облачные, аналитические или сервисы входа; такие поставщики обрабатывают данные по собственным правилам."],
        ["Передача и защита", "Мы не продаём персональные данные. Информация может обрабатываться поставщиками, которые помогают работе приложений, магазинами приложений при установке или покупке, а также в случаях, предусмотренных законом. Используются разумные меры защиты, но ни один онлайн-сервис не может гарантировать абсолютную безопасность."],
        ["Ваш выбор", "Вы можете очистить локальные данные сайта в браузере, экспортировать или удалить локальную запись прогресса, а также управлять разрешениями и покупками в соответствующем магазине. По вопросам о прежних приложениях и этой политике используйте страницу контактов MetalHatsCats."],
        ["Дети и изменения", "Сервис не предназначен для детей младше 13 лет. Мы можем обновлять политику при изменении сервиса; дата выше обозначает текущую версию."]
      ]
    };
  }
  return en ? {
    eyebrow: "Metkagram · legal",
    title: "Terms of Use",
    intro: "Terms for using the Metkagram website, learning materials and legacy mobile apps.",
    updated: "Last updated: 14 July 2026 · Legacy terms first published: 16 April 2023",
    sections: [
      ["Acceptance and scope", "By using Metkagram, you agree to these terms and the Privacy Policy. They apply to the public website, its learning materials, and the Android and iOS applications listed below."],
      ["Educational use", "Metkagram provides language-learning materials and practice tools. They are offered for general educational use, not as professional, academic-certification or language-assessment advice. Use your own judgement when applying any material."],
      ["Content and acceptable use", "The website materials are available for personal, educational and other non-commercial use with Metkagram attribution under the licence shown on the About page. Do not misuse the service, interfere with its availability, attempt unauthorised access, or redistribute material beyond the applicable licence."],
      ["Mobile stores and purchases", "The legacy Android and iOS applications are distributed by Google Play and the App Store. Installations, purchases, refunds, subscriptions and device permissions are also subject to the applicable store's terms and policies."],
      ["Availability and liability", "The service is provided as available and may change, pause or end. To the extent permitted by law, Metkagram provides no warranty that materials or services will always be available, error-free or suitable for a particular purpose, and is not liable for indirect or consequential loss arising from their use."],
      ["Changes and contact", "We may update these terms when the service changes. Continuing to use the service after a revised version is published means you accept it. Questions about these terms or the legacy apps can be sent through MetalHatsCats."]
    ]
  } : {
    eyebrow: "Metkagram · правовая информация",
    title: "Условия использования",
    intro: "Условия использования сайта Metkagram, учебных материалов и прежних мобильных приложений.",
    updated: "Обновлено: 14 июля 2026 · Исходные условия опубликованы: 16 апреля 2023",
    sections: [
      ["Принятие и область действия", "Пользуясь Metkagram, вы принимаете эти условия и Политику конфиденциальности. Они относятся к публичному сайту, учебным материалам и приложениям для Android и iOS, ссылки на которые приведены ниже."],
      ["Учебное использование", "Metkagram предлагает материалы и инструменты для изучения языка. Они предназначены для общего обучения, а не для профессиональной консультации, академической сертификации или официальной языковой оценки. Применяйте материалы с собственным суждением."],
      ["Материалы и допустимое использование", "Материалы сайта доступны для личного, учебного и другого некоммерческого использования с указанием Metkagram на условиях лицензии со страницы «О проекте». Нельзя злоупотреблять сервисом, мешать его работе, пытаться получить несанкционированный доступ или распространять материалы за пределами применимой лицензии."],
      ["Магазины приложений и покупки", "Прежние приложения для Android и iOS распространяются через Google Play и App Store. Установка, покупки, возвраты, подписки и разрешения устройства также регулируются правилами соответствующего магазина."],
      ["Доступность и ответственность", "Сервис предоставляется по мере доступности и может изменяться, приостанавливаться или завершаться. В пределах, разрешённых законом, Metkagram не гарантирует постоянную доступность, отсутствие ошибок или пригодность материалов для конкретной цели и не отвечает за косвенные убытки, связанные с их использованием."],
      ["Изменения и контакт", "Мы можем обновлять условия при изменении сервиса. Продолжая пользоваться сервисом после публикации новой версии, вы принимаете её. Вопросы об условиях и прежних приложениях можно направить через MetalHatsCats."]
    ]
  };
}

function storeLinks(locale) {
  const en = locale === "en";
  return `<div class="store-links"><a class="primary-link" href="${STORE_LINKS.googlePlay}" target="_blank" rel="noreferrer">Google Play <span aria-hidden="true">↗</span></a><a class="primary-link store-link-secondary" href="${STORE_LINKS.appStore}" target="_blank" rel="noreferrer">App Store <span aria-hidden="true">↗</span></a><a class="text-link" href="/${locale}/legal/privacy/">${en ? "Privacy Policy" : "Политика конфиденциальности"} <span aria-hidden="true">→</span></a></div>`;
}

export function appsPage(locale) {
  const en = locale === "en";
  const pathname = `/${locale}/apps/`;
  const title = en ? "Metkagram mobile apps for grammar practice" : "Мобильные приложения Metkagram для грамматики";
  const intro = en ? "The original Metkagram mobile apps remain available in their stores. Use the web workspace for reading annotated sentences and the apps for the original flashcard and drill experience." : "Оригинальные мобильные приложения Metkagram остаются в магазинах. Для чтения фраз с разметкой используйте веб-версию, а для карточек и упражнений — приложения.";
  const body = `<section class="app-hero section-pad"><p class="eyebrow">Metkagram · mobile apps</p><h1>${en ? "The original practice apps." : "Оригинальные приложения для практики."}</h1><p class="lede">${intro}</p>${storeLinks(locale)}</section><section class="app-details section-pad ruled"><div><p class="eyebrow">${en ? "What they contain" : "Что внутри"}</p><h2>${en ? "A focused grammar practice tool." : "Инструмент для целенаправленной практики грамматики."}</h2></div><div class="app-feature-list"><article><span>01</span><h3>${en ? "Flashcards" : "Карточки"}</h3><p>${en ? "Short sessions built around recurring grammar choices." : "Короткие сессии вокруг повторяющихся грамматических выборов."}</p></article><article><span>02</span><h3>${en ? "Minimal pairs" : "Минимальные пары"}</h3><p>${en ? "Compare nearby structures and make the contrast visible." : "Сопоставляйте близкие конструкции и замечайте разницу."}</p></article><article><span>03</span><h3>${en ? "Spaced return" : "Возврат через интервалы"}</h3><p>${en ? "Return to patterns over time instead of endlessly rereading them." : "Возвращайтесь к моделям через время, а не перечитывайте их бесконечно."}</p></article></div></section><section class="app-trust section-pad ruled"><div><p class="eyebrow">${en ? "Status & policies" : "Статус и правила"}</p><h2>${en ? "Mobile history, clear links." : "История приложений и понятные ссылки."}</h2></div><div><p class="lede">${en ? "The applications are maintained as part of Metkagram's product history and remain subject to the policies below and the terms of the relevant store." : "Приложения остаются частью истории продукта Metkagram и регулируются правилами ниже и условиями соответствующего магазина."}</p><p class="legal-inline-links"><a href="/${locale}/legal/privacy/">${en ? "Privacy Policy" : "Политика конфиденциальности"}</a><a href="/${locale}/legal/terms/">${en ? "Terms of Use" : "Условия использования"}</a></p></div></section>`;
  return layout({ locale, pathname, title, description: intro, body, structuredData: [breadcrumbJson(pathname, en ? "Mobile apps" : "Мобильные приложения", locale), { "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE_URL}${pathname}`, isPartOf: { "@id": `${SITE_URL}/#website` }, mainEntity: { "@id": `${SITE_URL}/#mobile-application` } }] });
}

export function legalPage(locale, kind) {
  const t = legalSections(locale, kind);
  const pathname = `/${locale}/legal/${kind}/`;
  const otherKind = kind === "privacy" ? "terms" : "privacy";
  const otherLabel = locale === "en" ? (otherKind === "privacy" ? "Privacy Policy" : "Terms of Use") : (otherKind === "privacy" ? "Политика конфиденциальности" : "Условия использования");
  const body = `<section class="legal-head section-pad"><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1><p class="lede">${t.intro}</p><p class="legal-updated">${t.updated}</p></section><section class="legal-layout section-pad ruled"><nav class="legal-toc" aria-label="${locale === "en" ? "On this page" : "На странице"}"><p class="eyebrow">${locale === "en" ? "On this page" : "На странице"}</p><ol>${t.sections.map(([heading], index) => `<li><a href="#legal-${index + 1}">${String(index + 1).padStart(2, "0")} · ${heading}</a></li>`).join("")}</ol></nav><article class="legal-document">${t.sections.map(([heading, text], index) => `<section id="legal-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span><h2>${heading}</h2><p>${text}</p></section>`).join("")}</article></section><section class="legal-related section-pad ruled"><p class="eyebrow">${locale === "en" ? "Related" : "Связанные страницы"}</p><nav><a href="/${locale}/apps/">${locale === "en" ? "Mobile apps" : "Мобильные приложения"} <span aria-hidden="true">→</span></a><a href="/${locale}/legal/${otherKind}/">${otherLabel} <span aria-hidden="true">→</span></a><a href="https://metalhatscats.com/contact">${locale === "en" ? "Contact MetalHatsCats" : "Связаться с MetalHatsCats"} <span aria-hidden="true">↗</span></a></nav></section>`;
  return layout({ locale, pathname, title: `${t.title} — Metkagram`, description: t.intro, body, structuredData: [breadcrumbJson(pathname, t.title, locale), { "@context": "https://schema.org", "@type": "WebPage", name: t.title, url: `${SITE_URL}${pathname}`, dateModified: "2026-07-14", inLanguage: locale, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#mobile-application` } }] });
}

export function aboutPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/about/`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">M: · project notes</p><h1>${t.aboutTitle}</h1><p class="lede">${t.aboutIntro}</p></section><section class="about-sections section-pad ruled"><article id="license"><h2>${t.license}</h2><p>${locale === "ru" ? "Материалы проекта доступны бесплатно для личного, учебного и другого некоммерческого использования с указанием Metkagram. Для коммерческого использования требуется отдельное разрешение." : "Project materials are free for personal, educational, and other non-commercial use with Metkagram attribution. Commercial use requires separate permission."}</p><a href="/LICENSE">CC BY-NC 4.0 →</a></article><article id="privacy"><h2>${t.privacy}</h2><p>${t.privacyText}</p></article><article><h2>${t.source}</h2><p>${t.connected}</p><a href="https://github.com/metkagram/metkagram.github.io">GitHub ↗</a></article></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "About Metkagram grammar markup" : "О разметке грамматики Metkagram", description: t.aboutIntro, body, structuredData: [breadcrumbJson(pathname, t.aboutTitle, locale), { "@context": "https://schema.org", "@type": "Organization", name: "Metkagram", url: SITE_URL, sameAs: ["https://github.com/metkagram"] }] });
}

export function roadmapPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/roadmap/`;
  const items = [[t.roadmapNow, t.roadmapNowDetail], [t.roadmapNext, t.roadmapNextDetail], [t.roadmapLater, t.roadmapLaterDetail]];
  const body = `<section class="page-head section-pad"><p class="eyebrow">M: · public notes</p><h1>${t.roadmapTitle}</h1><p class="lede">${t.roadmapIntro}</p></section><section class="roadmap-grid section-pad ruled">${items.map(([label, detail], index) => `<article><span>0${index + 1}</span><h2>${label}</h2><p>${detail}</p></article>`).join("")}</section><section class="changelog section-pad ruled" id="changelog"><p class="eyebrow">${t.changelog}</p><h2>${t.changelogTitle}</h2><p class="lede">${t.changelogIntro}</p><article><time datetime="2026-07">${t.changelogCurrent}</time><p>${t.changelogCurrentDetail}</p></article></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Metkagram roadmap and changelog" : "Планы и изменения Metkagram", description: `${t.roadmapIntro} ${t.changelogIntro}`, body, structuredData: [breadcrumbJson(pathname, t.roadmap, locale)] });
}

export function historyPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/history/`;
  const chapters = [["01", t.historyMobileTitle, t.historyMobileDetail], ["02", t.historyIdeaTitle, t.historyIdeaDetail], ["03", t.historyWebTitle, t.historyWebDetail]];
  const body = `<section class="history-head section-pad"><p class="eyebrow">${t.historyEyebrow}</p><h1>${t.historyTitle}</h1><p class="lede">${t.historyIntro}</p></section><section class="history-timeline section-pad ruled">${chapters.map(([index, title, detail]) => `<article><span>${index}</span><div><h2>${title}</h2><p>${detail}</p></div></article>`).join("")}</section><section class="history-sources section-pad ruled"><p class="eyebrow">${t.historySources}</p><nav><a href="https://metalhatscats.com/products/metkagram">${t.historyProductSource} ↗</a><a href="https://play.google.com/store/apps/details?id=app.metkagram.android">${t.historyGoogleSource} ↗</a><a href="https://apps.apple.com/co/app/tarjetas-gram%C3%A1tica-metkagram/id6502211918">${t.historyAppleSource} ↗</a></nav></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "The history of Metkagram" : "История Metkagram", description: t.historyIntro, body, structuredData: [breadcrumbJson(pathname, t.history, locale), { "@context": "https://schema.org", "@type": "AboutPage", name: t.historyTitle, url: `${SITE_URL}${pathname}` }] });
}

const API_URL = `${SITE_URL}/api/v1`;

export function aiPage(locale, content, counts, apiRoutes) {
  const t = ui[locale];
  const en = locale === "en";
  const pathname = `/${locale}/ai/`;
  const title = en ? "Metkagram for AI & Developers" : "Metkagram для ИИ и разработчиков";
  const intro = en
    ? "A static, versioned, machine-readable API for patterns, study sets, annotated sentences and search. Every response includes provenance and attribution."
    : "Статическое версионированное машиночитаемое API для паттернов, наборов, аннотированных предложений и поиска. Каждый ответ содержит происхождение и атрибуцию.";

  const endpointRows = [
    ["GET", `${API_URL}/index.json`, en ? "API index" : "Индекс API", true],
    ["GET", `${API_URL}/patterns.json`, en ? "All patterns" : "Все паттерны", true],
    ["GET", `${API_URL}/patterns/index.json`, en ? "Paginated summaries" : "Постраничные сводки", true],
    ["GET", `${API_URL}/patterns/{id}.json`, en ? "Single pattern" : "Один паттерн", false],
    ["GET", `${API_URL}/sets.json`, en ? "Study sets" : "Учебные наборы", true],
    ["GET", `${API_URL}/sets/{id}.json`, en ? "Set with patterns" : "Набор с паттернами", false],
    ["GET", `${API_URL}/categories.json`, en ? "Categories" : "Категории", true],
    ["GET", `${API_URL}/categories/{id}.json`, en ? "Patterns in a category" : "Паттерны в категории", false],
    ["GET", `${API_URL}/languages.json`, en ? "Languages" : "Языки", true],
    ["GET", `${API_URL}/subsets/language/{en|de}.json`, en ? "Language subset" : "Подмножество по языку", false],
    ["GET", `${API_URL}/annotations/{target}/{collection}.json`, en ? "Annotated documents" : "Аннотированные документы", false],
    ["GET", `${API_URL}/search-index.json`, en ? "Static search index" : "Индекс поиска", true],
    ["GET", `${API_URL}/openapi.json`, en ? "OpenAPI spec" : "Спецификация OpenAPI", true],
    ["GET", `${API_URL}/mcp-server.json`, en ? "MCP tool spec" : "Спецификация инструментов MCP", true],
    ["GET", `${API_URL}/attribution.json`, en ? "Attribution policy" : "Политика атрибуции", true],
  ].map(([method, url, desc, linked]) => `<tr><td><code>${method}</code></td><td><code>${linked ? `<a href="${url}">${url}</a>` : escapeHtml(url)}</code></td><td>${desc}</td></tr>`).join("");

  const datasets = [
    { id: "patterns", label: en ? "Advanced patterns" : "Продвинутые паттерны", count: counts.advancedPatterns, url: `${API_URL}/patterns.json`, download: `${API_URL}/download/full-patterns.json`, schema: `${API_URL}/schemas/pattern.json` },
    { id: "sets", label: en ? "Study sets" : "Учебные наборы", count: content.studySets.sets.length, url: `${API_URL}/sets.json`, schema: `${API_URL}/schemas/set.json` },
    { id: "annotations", label: en ? "Annotated documents" : "Аннотированные документы", count: counts.annotatedDocuments, url: `${API_URL}/annotations/en/dialogues.json`, schema: `${API_URL}/schemas/document.json` },
  ].map((ds) => `<article class="dataset-card"><h3>${ds.label}</h3><p>${en ? "Records" : "Записей"}: <strong>${ds.count.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</strong></p><nav><a href="${ds.url}">${en ? "API" : "API"}</a>${ds.download ? `<a href="${ds.download}">${en ? "Download" : "Скачать"}</a>` : ""}${ds.schema ? `<a href="${ds.schema}">${en ? "Schema" : "Схема"}</a>` : ""}</nav></article>`).join("");

  const attributionText = ATTRIBUTION.attribution_text;
  const citeWeb = `${attributionText}. Available at {canonical_url}.`;
  const citeAcademic = `Metkagram (${new Date().getFullYear()}). B2–C1 English and German language patterns. ${SITE_URL}. ${ATTRIBUTION.license}.`;
  const citeAi = "This answer uses data from Metkagram (https://metkagram.github.io/). See the source page for the full pattern and attribution.";

  const agentExamples = [
    ["ChatGPT / Claude / Gemini", `${API_URL}/patterns/index.json`, en ? "Fetch summaries, then retrieve /patterns/{id}.json for details." : "Загрузите сводки, затем получите /patterns/{id}.json для деталей."],
    ["Codex & custom agents", `${API_URL}/openapi.json`, en ? "Generate clients from the OpenAPI spec." : "Генерируйте клиенты из спецификации OpenAPI."],
    ["MCP clients", `${API_URL}/mcp-server.json`, en ? "Resolve tool calls by fetching the static URLs in the spec." : "Разрешайте вызовы инструментов, загружая статические URL из спецификации."],
  ].map(([tool, url, desc]) => `<tr><td>${tool}</td><td><code><a href="${url}">${url}</a></code></td><td>${desc}</td></tr>`).join("");

  const mcpCode = `// MCP tool call resolved statically
const tool = "metkagram_get_pattern";
const id = "C1OP001";
const response = await fetch(\`https://metkagram.github.io/api/v1/patterns/\${id.toLowerCase()}.json\`);
const { provenance, data } = await response.json();
// Always include provenance.canonical_url and provenance.attribution_text in your output.`;

  const body = `<section class="page-head section-pad"><p class="eyebrow">${t.forAiDevelopers}</p><h1>${title}</h1><p class="lede">${intro}</p><div class="ai-status"><a href="${API_URL}/index.json"><span>API index</span><code>${API_URL}/index.json</code></a><a href="${API_URL}/openapi.json"><span>OpenAPI</span><code>${API_URL}/openapi.json</code></a><a href="${API_URL}/mcp-server.json"><span>MCP</span><code>${API_URL}/mcp-server.json</code></a></div></section>

<section class="ai-section section-pad ruled" id="datasets"><div><p class="eyebrow">01 · ${t.aiDatasets}</p><h2>${t.aiDatasets}</h2></div><div class="dataset-grid">${datasets}</div></section>

<section class="ai-section section-pad ruled" id="endpoints"><div><p class="eyebrow">02 · ${t.aiEndpoints}</p><h2>${t.aiEndpoints}</h2></div><div class="table-wrap"><table class="endpoint-table"><thead><tr><th>${en ? "Method" : "Метод"}</th><th>${en ? "URL" : "URL"}</th><th>${en ? "Description" : "Описание"}</th></tr></thead><tbody>${endpointRows}</tbody></table></div></section>

<section class="ai-section section-pad ruled" id="attribution"><div><p class="eyebrow">03 · ${t.aiAttribution}</p><h2>${t.aiAttribution}</h2></div><div class="ai-columns"><article><h3>${en ? "Required attribution" : "Обязательная атрибуция"}</h3><ul><li>${en ? "Keep the name" : "Сохраняйте название"} <strong>Metkagram</strong>.</li><li>${en ? "Link to" : "Ссылка на"} <a href="${SITE_URL}">${SITE_URL}</a>.</li><li>${en ? "Credit" : "Указывайте"} <a href="${ATTRIBUTION.creator_url}">${ATTRIBUTION.creator}</a> ${en ? "and" : "и"} <a href="${ATTRIBUTION.maintainer_url}">${ATTRIBUTION.maintainer}</a>.</li><li>${en ? "State the dataset version" : "Указывайте версию датасета"}: <code>${getDatasetVersion()}</code>.</li><li>${en ? "Link back to the canonical page for every record shown." : "Давайте обратную ссылку на каноническую страницу каждой показанной записи."}</li></ul></article><article><h3>${en ? "Copy-paste citations" : "Готовые цитаты"}</h3><dl class="citation-list"><div><dt>${en ? "Web / app" : "Веб / приложение"}</dt><dd><code>${citeWeb}</code></dd></div><div><dt>${en ? "Academic" : "Академическая"}</dt><dd><code>${citeAcademic}</code></dd></div><div><dt>${en ? "AI-generated answer" : "Ответ ИИ"}</dt><dd><code>${citeAi}</code></dd></div></dl></article></div><p class="legal-note"><a href="${API_URL}/attribution.json">${en ? "Machine-readable attribution policy" : "Машиночитаемая политика атрибуции"}</a> · <a href="/LICENSE">CC BY-NC 4.0</a></p></section>

<section class="ai-section section-pad ruled" id="agents"><div><p class="eyebrow">04 · ${t.aiAgents}</p><h2>${t.aiAgents}</h2></div><div class="table-wrap"><table class="endpoint-table"><thead><tr><th>${en ? "Tool" : "Инструмент"}</th><th>${en ? "Entry point" : "Точка входа"}</th><th>${en ? "How to use" : "Как использовать"}</th></tr></thead><tbody>${agentExamples}</tbody></table></div></section>

<section class="ai-section section-pad ruled" id="mcp"><div><p class="eyebrow">05 · ${t.aiMcp}</p><h2>${t.aiMcp}</h2></div><p class="lede">${en ? "No backend server is required. The MCP specification maps tool names to static URLs. Your client fetches the JSON directly from GitHub Pages." : "Бэкенд-сервер не требуется. Спецификация MCP сопоставляет имена инструментов со статическими URL. Ваш клиент загружает JSON напрямую с GitHub Pages."}</p><pre class="code-block"><code>${escapeHtml(mcpCode)}</code></pre><p><a href="${API_URL}/mcp-server.json">${en ? "Download MCP server specification" : "Скачать спецификацию MCP"}</a></p></section>

<section class="ai-section section-pad ruled" id="downloads"><div><p class="eyebrow">06 · ${t.aiDownloads}</p><h2>${t.aiDownloads}</h2></div><nav class="download-list"><a href="${API_URL}/download/full-patterns.json">${en ? "Full patterns JSON" : "Все паттерны JSON"}</a><a href="${API_URL}/patterns.json">${en ? "Patterns API response" : "API-ответ паттернов"}</a><a href="${API_URL}/sets.json">${en ? "Study sets JSON" : "Учебные наборы JSON"}</a><a href="${API_URL}/search-index.json">${en ? "Search index JSON" : "Поисковый индекс JSON"}</a><a href="${API_URL}/openapi.json">${en ? "OpenAPI JSON" : "OpenAPI JSON"}</a><a href="${API_URL}/mcp-server.json">${en ? "MCP spec JSON" : "MCP JSON"}</a></nav></section>

<section class="ai-section section-pad ruled" id="collaborate"><div><p class="eyebrow">07 · ${t.aiCollaborate}</p><h2>${t.aiCollaborate}</h2></div><p class="lede">${en ? "We welcome research, teaching, content and language-data collaborations that keep attribution intact." : "Мы приветствуем исследовательские, образовательные, контентные и языковые проекты с сохранением атрибуции."}</p><nav class="download-list"><a href="${ATTRIBUTION.contact_url}">${en ? "Contact MetalHatsCats" : "Связаться с MetalHatsCats"}</a><a href="${ATTRIBUTION.source_repository}">${en ? "GitHub repository" : "Репозиторий GitHub"}</a></nav></section>`;

  const structuredData = [
    breadcrumbJson(pathname, title, locale),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: `${SITE_URL}${pathname}`,
      inLanguage: locale,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: {
        "@type": "Dataset",
        name: "Metkagram language patterns and annotations",
        url: `${API_URL}/index.json`,
        license: ATTRIBUTION.license_url,
        creator: { "@type": "Organization", name: ATTRIBUTION.creator, url: ATTRIBUTION.creator_url, sameAs: [ATTRIBUTION.source_repository] },
        maintainer: { "@type": "Organization", name: ATTRIBUTION.maintainer, url: ATTRIBUTION.maintainer_url },
        publisher: { "@id": `${SITE_URL}/#organization` },
        version: getDatasetVersion(),
        datePublished: ATTRIBUTION.release_date || getDatasetVersion().split("+")[1],
        distribution: [
          { "@type": "DataDownload", contentUrl: `${API_URL}/patterns.json`, encodingFormat: "application/json" },
          { "@type": "DataDownload", contentUrl: `${API_URL}/sets.json`, encodingFormat: "application/json" },
        ],
      },
    },
    { "@context": "https://schema.org", "@type": "LearningResource", name: title, educationalLevel: "B2–C1", inLanguage: ["en", "de", "ru"], url: `${SITE_URL}${pathname}`, isPartOf: { "@id": `${SITE_URL}/#website` } },
    { "@context": "https://schema.org", "@type": "CreativeWork", name: "Metkagram API documentation", url: `${SITE_URL}${pathname}`, creator: { "@type": "Organization", name: ATTRIBUTION.creator, url: ATTRIBUTION.creator_url }, license: ATTRIBUTION.license_url },
  ];

  return layout({ locale, pathname, title: `${title} — Metkagram`, description: intro, body, structuredData });
}

export function gatewayPage() {
  const body = `<section class="gateway"><header class="gateway-header"><a class="wordmark" href="/ru/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-light.svg" width="800" height="200" alt="Metkagram"></a><p>Phrase-first language practice</p></header><div class="gateway-stage"><div class="gateway-copy"><p class="eyebrow">Metkagram</p><h1>Language lives<br>in phrases.</h1><p class="lede">Read one complete thought. Let its structure become clear. Use it again when you need it.</p><nav aria-label="Choose interface language"><a href="/ru/" lang="ru"><strong>Русский</strong><span>Открыть главную <i aria-hidden="true">→</i></span></a><a href="/en/" lang="en"><strong>English</strong><span>Open home <i aria-hidden="true">→</i></span></a></nav></div><figure class="gateway-sentence" aria-label="A sentence read one word at a time"><figcaption>READ IT AS ONE THOUGHT</figcaption><p aria-label="I want to make this phrase mine."><span style="--delay: 0s">I</span><span style="--delay: .55s">want</span><span style="--delay: 1.1s">to</span><span style="--delay: 1.65s">make</span><span style="--delay: 2.2s">this</span><span style="--delay: 2.75s">phrase</span><span style="--delay: 3.3s">mine.</span></p><small>01 / 01</small></figure></div><footer><span>Metkagram · B2–C1</span><a href="https://github.com/metkagram/metkagram.github.io">GitHub</a><a href="/llms.txt">llms.txt</a></footer></section>`;
  return layout({ locale: "en", pathname: "/", title: "Metkagram — grammar markup for reusable language patterns", description: "Read phrases, notice their structure and reuse language patterns.", body, root: true, bodyClass: "gateway-body", structuredData: [{ "@context": "https://schema.org", "@type": "WebSite", name: "Metkagram", url: SITE_URL, inLanguage: ["en", "ru"] }] });
}

export function notFoundPage(locale = "en") {
  const t = ui[locale];
  return layout({ locale, pathname: "/404.html", notFound: true, title: `${t.notFound} — Metkagram`, description: t.notFoundText, body: `<section class="page-head section-pad"><p class="eyebrow">404</p><h1>${t.notFound}</h1><p class="lede">${t.notFoundText}</p><a class="text-link" href="/${locale}/">← ${t.home}</a></section>` });
}
