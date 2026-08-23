import { collectionKeys, collectionLabel, targetMeta, ui } from "./i18n.mjs";
import { ATTRIBUTION, getDatasetVersion } from "./provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "./site.mjs";
import { patternPath, studySetPath } from "./seo-slugs.mjs";
import { legacyAnnotationToCanonical, patternToCanonicalCards, renderCanonicalText } from "./annotation-schema.mjs";

export { SITE_URL };

export const STORE_LINKS = {
  googlePlay: "https://play.google.com/store/apps/details?id=app.metkagram.android",
  appStore: "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918"
};

function metkagramEntityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Metkagram",
        url: SITE_URL,
        description: "Metkagram publishes annotated English and German phrases, reusable language patterns and machine-readable language data.",
        logo: {
          "@type": "ImageObject",
          "@id": `${SITE_URL}/#logo`,
          url: `${SITE_URL}/assets/icons/metkagram-icon-512x512.png`,
          contentUrl: `${SITE_URL}/assets/icons/metkagram-icon-512x512.png`,
          width: 512,
          height: 512
        },
        email: ATTRIBUTION.contact_email,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "project enquiries",
          email: ATTRIBUTION.contact_email,
          url: `${SITE_URL}/en/contact/`,
          availableLanguage: ["English", "Russian"]
        },
        sameAs: ["https://github.com/metkagram/metkagram.github.io"]
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Metkagram",
        alternateName: "Metkagram Language Pattern Library",
        description: "Annotated English and German phrases, reusable B2–C1 language patterns and machine-readable learning data.",
        url: SITE_URL,
        inLanguage: ["en", "ru"],
        publisher: { "@id": `${SITE_URL}/#organization` }
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

function identifiedMetaTitle(label, id) {
  const stableId = String(id).slice(0, 12);
  const suffix = ` · ${stableId} | Metkagram`;
  return `${conciseMeta(label, 68 - suffix.length)}${suffix}`;
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

function nativeLanguageCopy(locale) {
  return locale === "ru"
    ? { label: "Язык поддержки", english: "Английский", russian: "Русский", other: "Другой язык", default: "по умолчанию", otherNotice: "Переводы и объяснения на вашем языке пока не добавлены. Английский остаётся языком поддержки." }
    : { label: "Support language", english: "English", russian: "Russian", other: "Another language", default: "default", otherNotice: "Translations and explanations in your language are not available yet. English remains the support language." };
}

function nativeLanguageControl(locale) {
  const copy = nativeLanguageCopy(locale);
  return `<details class="native-language-control" data-native-language-control><summary><span>${copy.label}</span><strong data-native-language-summary>${copy.english}</strong></summary><div><label>${copy.label}<select data-native-language-select><option value="en">${copy.english} · ${copy.default}</option><option value="ru">${copy.russian}</option><option value="other">${copy.other}</option></select></label><p data-native-other-notice hidden>${copy.otherNotice}</p></div></details>`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

function breadcrumbJson(pathname, title, locale) {
  const t = ui[locale];
  const parts = slugPath(pathname).split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", position: 1, name: t.home, item: `${SITE_URL}/${locale}/` }];
  for (let index = 1; index < parts.length; index += 1) {
    const structuralRoute = parts[index] === "legal" || (parts[index - 1] === "practice" && ["patterns", "sets"].includes(parts[index]));
    if (index < parts.length - 1 && structuralRoute) continue;
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: index === parts.length - 1 ? title : parts[index].replaceAll("-", " "),
      item: `${SITE_URL}/${parts.slice(0, index + 1).join("/")}/`
    });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function prepareStructuredData(structuredData, canonical, pageEntity) {
  const entities = structuredData.map((entity) => ({ ...entity }));
  const breadcrumb = entities.find((entity) => entity?.["@type"] === "BreadcrumbList");
  if (breadcrumb) {
    breadcrumb["@id"] ||= `${canonical}#breadcrumb`;
    pageEntity.breadcrumb = { "@id": breadcrumb["@id"] };
  }

  const primary = entities.find((entity) => ["LearningResource", "Dataset", "DataCatalog"].includes(entity?.["@type"]) && entity.url === canonical);
  if (primary) {
    const suffix = primary["@type"].replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    primary["@id"] ||= `${canonical}#${suffix}`;
    primary.mainEntityOfPage ||= { "@id": `${canonical}#webpage` };
    primary.publisher ||= { "@id": `${SITE_URL}/#organization` };
    pageEntity.mainEntity = { "@id": primary["@id"] };
  }
  return entities;
}

function header(locale, pathname) {
  const t = ui[locale];
  const isHome = slugPath(pathname) === `/${locale}/`;
  const nav = [
    [locale === "ru" ? "Разметка" : "Annotations", `/${locale}/explore/`],
    [locale === "ru" ? "Паттерны" : "Patterns", `/${locale}/practice/`],
    [t.navMethod, `/${locale}/method/`],
    [locale === "ru" ? "Для ИИ" : "For AI", `/${locale}/ai/`]
  ];
  return `<a class="skip-link" href="#content">${t.skip}</a>
  <header class="site-header${isHome ? " site-header--studio" : ""}">
    <a class="wordmark" href="/${locale}/" aria-label="Metkagram"><span class="wordmark-name" aria-hidden="true">Metka</span><img src="/assets/logo/metkagram-logo-${isHome ? "light" : "dark"}.svg" width="800" height="200" alt="Metkagram"></a>
    <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav">${t.menu}</button>
    <nav id="site-nav" class="site-nav" aria-label="Primary">
      ${nav.map(([label, href]) => `<a href="${href}"${slugPath(pathname).startsWith(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <div class="header-preferences"><div class="locale-switch" aria-label="${t.chooseInterface}">
      <a href="${equivalentLocalePath(pathname, "en")}" lang="en"${locale === "en" ? ' aria-current="page"' : ""}>EN</a>
      <span aria-hidden="true">/</span>
      <a href="${equivalentLocalePath(pathname, "ru")}" lang="ru"${locale === "ru" ? ' aria-current="page"' : ""}>RU</a>
    </div></div>
  </header>`;
}

function footer(locale, compact = false) {
  const t = ui[locale];
  if (compact) return `<footer class="site-footer site-footer--studio">
    <span>${locale === "ru" ? "СТУДИЯ РАЗМЕТКИ" : "ANNOTATION STUDIO"}</span>
    <nav aria-label="${locale === "ru" ? "Путь по Metkagram" : "Metkagram workflow"}"><a href="/${locale}/explore/">${locale === "ru" ? "РАЗМЕТИТЬ" : "MARK"}</a><i aria-hidden="true">›</i><a href="/${locale}/practice/">${locale === "ru" ? "ПАТТЕРН" : "PATTERN"}</a><i aria-hidden="true">›</i><a href="/${locale}/method/">${locale === "ru" ? "ПРИМЕНИТЬ" : "APPLY"}</a></nav>
    <nav class="studio-footer-meta" aria-label="${locale === "ru" ? "О проекте" : "About Metkagram"}"><a href="/${locale}/about/">${t.navAbout}</a><a href="/${locale}/contact/">METKAGRAM ©</a></nav>
  </footer>`;
  return `<footer class="site-footer site-footer--index">
    <div class="footer-brand"><a class="footer-mark" href="/${locale}/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-dark.svg" width="800" height="200" alt="Metkagram"></a><p>${locale === "ru" ? "Фразы, паттерны, осознанная практика." : "Phrases, patterns, deliberate practice."}</p></div>
    <nav class="footer-links" aria-label="${locale === "ru" ? "Навигация в подвале" : "Footer navigation"}"><a href="/${locale}/explore/">${t.navExplore}</a><a href="/${locale}/practice/">${t.navPractice}</a><a href="/${locale}/method/">${t.navMethod}</a><a href="/${locale}/research/">${locale === "ru" ? "Исследования" : "Research"}</a><a href="/${locale}/about/">${t.navAbout}</a><a href="/${locale}/ai/">${t.forAiDevelopers}</a><a href="/${locale}/ideas/">${locale === "ru" ? "Идеи и партнёрства" : "Ideas & partnerships"}</a><a href="/${locale}/contact/">${locale === "ru" ? "Контакты" : "Contact"}</a></nav>
    <p class="footer-languages"><strong>EN · DE</strong><span>${locale === "ru" ? "Паттерны B2–C1" : "B2–C1 patterns"}</span></p>
    <div class="footer-bottom"><p>${t.connected}</p><nav aria-label="${locale === "ru" ? "Юридическая информация" : "Legal information"}"><a href="/${locale}/legal/privacy/">${t.privacy}</a><a href="/${locale}/legal/terms/">${t.terms}</a><a href="https://github.com/metkagram/metkagram.github.io">${t.source}</a></nav></div>
  </footer>`;
}

export function layout({ locale = "en", pathname, title, description, body, type = "website", pageType = "WebPage", structuredData = [], root = false, notFound = false, bodyClass = "", dateModified = SITE_RELEASE_DATE }) {
  const metaTitle = conciseMeta(title, 68);
  const metaDescription = conciseMeta(description, 155);
  const canonicalPath = notFound ? "/404.html" : slugPath(pathname);
  const canonical = `${SITE_URL}${canonicalPath}`;
  const robots = notFound ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const pageEntity = {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": `${canonical}#webpage`,
    name: metaTitle,
    description: metaDescription,
    url: canonical,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`,
      width: 1200,
      height: 630
    },
    dateModified
  };
  pageEntity.publisher = { "@id": `${SITE_URL}/#organization` };
  const connectedStructuredData = prepareStructuredData(structuredData, canonical, pageEntity);
  const supportPreference = body.includes("data-native-translation")
    ? `<aside class="context-language-preference section-pad" aria-label="${escapeHtml(nativeLanguageCopy(locale).label)}"><p>${locale === "ru" ? "Перевод и пояснения" : "Translation and explanations"}</p>${nativeLanguageControl(locale)}</aside>`
    : "";
  const alternates = notFound ? "" : root
    ? `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/"><link rel="alternate" hreflang="en" href="${SITE_URL}/en/"><link rel="alternate" hreflang="ru" href="${SITE_URL}/ru/">`
    : `<link rel="alternate" hreflang="en" href="${SITE_URL}${equivalentLocalePath(pathname, "en")}"><link rel="alternate" hreflang="ru" href="${SITE_URL}${equivalentLocalePath(pathname, "ru")}"><link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`;
  const pageActions = body.includes("data-share-bar") ? "" : shareBar(locale, pathname, title);
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="${robots}">
  <meta name="author" content="Metkagram">
  <meta name="theme-color" content="#FFC400">
  <meta name="color-scheme" content="light">
  <meta name="google-site-verification" content="NVjLGEd7e79H41hAX7li-wqcvb5KLEPmDwml8uLge6g">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:locale" content="${locale === "ru" ? "ru_RU" : "en_US"}">
  <meta property="og:locale:alternate" content="${locale === "ru" ? "en_US" : "ru_RU"}">
  <meta property="og:title" content="${escapeHtml(metaTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Metkagram — annotated language patterns for English and German">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png">
  <meta name="twitter:image:alt" content="Metkagram — annotated language patterns for English and German">
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/icons/metkagram-mark.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/icons/metkagram-icon-180x180.png">
  <link rel="manifest" href="/assets/web/site.webmanifest">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta name="metkagram-sync-endpoint" content="https://metalhatscats.com/api/metkax/srs">
  ${[metkagramEntityGraph(), pageEntity, ...connectedStructuredData].map(jsonLd).join("\n")}
</head>
<body class="${escapeHtml(bodyClass)}" data-locale="${locale}">
  ${root ? "" : header(locale, pathname)}
  <main id="content">${supportPreference}${body}</main>
  ${pageActions}
  ${root ? "" : footer(locale, bodyClass.split(/\s+/).includes("home-studio"))}
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

export function breadcrumbs(locale, items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item, index) => `${index ? '<span aria-hidden="true">/</span>' : ""}<a href="${item.href}"${index === items.length - 1 ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`).join("")}</nav>`;
}

function shareBar(locale, pathname, title) {
  const t = ui[locale];
  const url = `${SITE_URL}${slugPath(pathname)}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedShareText = encodeURIComponent(`${title} ${url}`);
  return `<aside class="share-bar section-pad" data-share-bar data-share-url="${escapeHtml(url)}" data-share-title="${escapeHtml(title)}" data-share-copied="${escapeHtml(t.shareCopied)}" aria-label="${escapeHtml(t.shareTitle)}"><span class="share-label">${escapeHtml(t.shareTitle)}</span><div class="share-actions"><button type="button" class="share-button share-button-native" data-native-share hidden>${escapeHtml(t.shareNative)}</button><a class="share-button" href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.shareTelegram)}</a><a class="share-button" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.shareLinkedIn)}</a><a class="share-button" href="https://wa.me/?text=${encodedShareText}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.shareWhatsApp)}</a><a class="share-button" href="https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.shareX)}</a><button type="button" class="share-button" data-copy-link>${escapeHtml(t.shareCopy)}</button><button type="button" class="share-button" data-print-page>${escapeHtml(t.printPage)}</button></div><output class="share-feedback" data-share-feedback aria-live="polite"></output></aside>`;
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
  const pathname = `/${locale}/`;
  const ru = locale === "ru";
  const copy = ru ? {
    eyebrow: "СТУДИЯ РАЗМЕТКИ",
    title: ["Разметить.", "Найти.", "Применить."],
    intro: "Разметьте фразу. Найдите паттерн. Перенесите его в следующую фразу.",
    action: "Исследовать паттерны",
    library: "Библиотека паттернов",
    scopeTitle: "Что опубликовано сейчас",
    scope: "Английские и немецкие фразы с разметкой, большой каталог моделей B2–C1, сеты Thinking in Language и ограниченный французский Frame-only пилот без заявлений о французской разметке или интерфейсе.",
    rights: "Повторное использование регулируется текущими условиями Metkagram. Существенное повторное использование, распространение, обучение моделей и коммерческая интеграция требуют отдельного согласования.",
    audiences: [
      ["Изучать язык", "Читайте живые фразы и замечайте, как устроена речь.", `/${locale}/explore/`],
      ["Анализировать структуру", "Сравнивайте роли слов и повторяющиеся конструкции.", `/${locale}/method/`],
      ["Работать с данными", "Подключайте чистые паттерны к агентам и инструментам.", `/${locale}/ai/`],
      ["Предложить идею", "Обсудите пилот, исследование или партнёрство с командой.", `/${locale}/ideas/`]
    ]
  } : {
    eyebrow: "ANNOTATION STUDIO",
    title: ["Mark.", "Find.", "Reuse."],
    intro: "Mark a phrase. Find the pattern. Carry it into the next sentence.",
    action: "Explore patterns",
    library: "Pattern library",
    scopeTitle: "What is published now",
    scope: "Annotated English and German sentences, a large B2–C1 pattern catalogue, Thinking in Language sets, and a bounded French Frame-only pilot without French annotation or interface claims.",
    rights: "Current reuse follows the Metkagram licensing terms. Substantial reuse, redistribution, model training and commercial integration require scoped permission.",
    audiences: [
      ["Learn a language", "Read real phrases and see how language fits together.", `/${locale}/explore/`],
      ["Analyse structure", "Compare word roles and recurring constructions.", `/${locale}/method/`],
      ["Build with data", "Connect clean patterns to agents and language tools.", `/${locale}/ai/`],
      ["Propose an idea", "Discuss a pilot, study, or partnership with the team.", `/${locale}/ideas/`]
    ]
  };
  const tag = (kind, label) => `<span class="grammar-tag ${kind}">${label}</span>`;
  const slips = ru ? [
    ["S", "Мне трудно сосредоточиться, когда всё отвлекает."],
    ["V", "Когда я составляю план, работать становится легче."],
    ["p2", "Дайте мне один ясный следующий шаг."]
  ] : [
    ["S", "It’s hard to focus with everything pulling at me."],
    ["V", "When I plan it out, things feel lighter."],
    ["p2", "Give me one clear next step."]
  ];
  const patterns = ru ? [
    ["S", "Формулировка трудности", "Мне трудно [V], когда [p2]."],
    ["V", "Осознание изменения", "Когда я [V], [S] становится [p2]."],
    ["p2", "Триггер прогресса", "Дайте мне [p2], и я [V]."]
  ] : [
    ["S", "Struggle statement", "It’s hard to [V] with [p2]."],
    ["V", "Value realization", "When I [V], [S] feels [p2]."],
    ["p2", "Progress trigger", "Give me [p2] and I’ll [V]."]
  ];
  const tokenRow = [tag("subject", "S"), tag("verb", "V"), tag("object", "p2"), tag("helper", "Hf")].join("");
  const body = `<section class="studio-home studio-home-v2" aria-labelledby="home-title"><div class="studio-hero-v2"><div class="studio-manifest"><p class="eyebrow">${copy.eyebrow}</p><h1 id="home-title"><span>${copy.title[0]}</span><span>${copy.title[1]}</span><mark>${copy.title[2]}</mark></h1><p>${copy.intro}</p><a class="studio-primary-action" href="/${locale}/practice/">${copy.action}<span aria-hidden="true">↗</span></a></div><div class="studio-flow" aria-label="${ru ? "От размеченных фраз к паттернам" : "From annotated phrases to reusable patterns"}"><div class="studio-slips">${slips.map(([code, sentence], index) => `<article class="studio-slip studio-slip-${index + 1}"><header><span class="studio-slip-code">${code}</span><span class="studio-slip-index">0${index + 1}</span></header><p>${sentence}</p><div class="studio-slip-tags" aria-label="${ru ? "Метки фразы" : "Sentence tags"}">${tokenRow}</div></article>`).join("")}</div><section class="studio-pattern-sheet"><p class="eyebrow">${copy.library}</p>${patterns.map(([code, title, formula]) => `<article><span class="studio-pattern-code">${code}</span><div><strong>${title}</strong><code>${formula}</code></div></article>`).join("")}<a href="/${locale}/practice/">${ru ? "Открыть индекс" : "Open the index"} <span aria-hidden="true">→</span></a></section></div></div><nav class="studio-audiences" aria-label="${ru ? "Для кого Metkagram" : "Ways to use Metkagram"}">${copy.audiences.map(([title, detail, href], index) => `<a href="${href}"><span>0${index + 1}</span><strong>${title}</strong><small>${detail}</small><b aria-hidden="true">→</b></a>`).join("")}</nav><section class="ai-section section-pad ruled" data-current-capabilities><div><p class="eyebrow">${ru ? "Границы продукта" : "Product boundary"}</p><h2>${copy.scopeTitle}</h2></div><div><p>${copy.scope}</p><p>${copy.rights}</p><div class="legal-inline-links"><a href="/${locale}/practice/language/french/">${ru ? "Французский пилот" : "French pilot"} →</a><a href="/${locale}/licensing/">${ru ? "Права и лицензирование" : "Rights and licensing"} →</a></div></div></section></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Language Annotation & Pattern Library | Metkagram" : "Библиотека разметки и языковых паттернов | Metkagram", description: t.statementDetail, body, bodyClass: "home-studio" });
}

export function explorePage(locale, content) {
  const t = ui[locale];
  const pathname = `/${locale}/explore/`;
  const body = `<section class="studio-route studio-route--explore"><div class="studio-route-backdrop" aria-hidden="true"></div><div class="studio-route-board"><section class="page-head section-pad"><p class="eyebrow">${t.navExplore}</p><h1>${t.exploreTitle}</h1><p class="lede">${t.exploreIntro}</p></section>
  <section class="language-planes section-pad ruled">${Object.values(targetMeta).map((target) => `<article><p class="language-code">${target.flag}</p><h2>${t[target.key]} <span>${locale === "ru" ? "Разметка и паттерны" : "Annotation and patterns"} · ${target.native}</span></h2><ul>${collectionKeys.map((key) => `<li><a href="/${locale}/explore/${target.key}/${key}/"><span>${t[key]}</span><strong>${content.collections[target.key][key].documents.length}</strong></a></li>`).join("")}<li><a href="/${locale}/explore/${target.key}/annotation-rules/"><span>${t.rules}</span><span aria-hidden="true">↗</span></a></li></ul></article>`).join("")}</section></div></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Annotated English & German Phrases | Metkagram" : "Размеченные фразы на английском и немецком | Metkagram", description: t.exploreIntro, body, structuredData: [breadcrumbJson(pathname, t.navExplore, locale)], bodyClass: "studio-route-body" });
}

export function languageHub(locale, targetKey, content) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = `/${locale}/explore/${targetKey}/`;
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: pathname, label: t[targetKey] }])}<section class="page-head section-pad compact"><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${t[targetKey]} — ${t.collections.toLowerCase()}</h1>${languageTabs(locale, targetKey)}</section><section class="entry-list section-pad ruled">${collectionKeys.map((key, index) => `<a href="/${locale}/explore/${targetKey}/${key}/"><span class="entry-index">0${index + 1}</span><strong>${t[key]}</strong><span>${content.collections[targetKey][key].documents.length} ${t.sets}</span><span aria-hidden="true">↗</span></a>`).join("")}<a href="/${locale}/explore/${targetKey}/annotation-rules/"><span class="entry-index">04</span><strong>${t.rules}</strong><span>${t.notation}</span><span aria-hidden="true">↗</span></a></section>`;
  const description = locale === "en"
    ? `Browse ${target.native} dialogues, annotated patterns and reference sets, with grammar marks kept beside each phrase.`
    : `Диалоги, паттерны и справочные наборы на ${target.native}: грамматическая разметка остаётся рядом с каждой фразой.`;
  return layout({ locale, pathname, title: locale === "en" ? `${t[targetKey]} language patterns and dialogues — Metkagram` : `${t[targetKey]}: коллекции языковых паттернов — Metkagram`, description, body, structuredData: [breadcrumbJson(pathname, t[targetKey], locale)] });
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

function germanGender(span, targetKey) {
  if (targetKey !== "german") return null;
  return ["feminine", "masculine", "neuter"].includes(span.gender) ? span.gender : null;
}

function renderTaggedSpan(span, text, locale, targetKey, tooltipId) {
  const t = ui[locale];
  const tag = span.label;
  const gender = germanGender(span, targetKey);
  const renderedText = gender
    ? `<span class="gender-mark gender-${gender}" data-gender="${gender}">${escapeHtml(text)}</span>`
    : escapeHtml(text);
  if (gender && (span.role === "gender" || tag === "Gender")) {
    return `<span class="annotated-token gender-only" aria-label="${escapeHtml(`${text.trim()}, ${gender} gender`)}">${renderedText}</span>`;
  }
  const isPast = targetKey === "german" && String(span.tense || span.role || "").toLowerCase() === "past";
  const rule = tagRule(locale, targetKey, tag, span.role);
  const pastLabel = isPast ? `${tag}, past tense` : tag;
  return `<span class="annotated-token ${tokenClass(tag)}"><button class="grammar-tag tag-trigger ${tokenClass(tag)}${isPast ? " tense-past" : ""}" type="button" aria-label="${escapeHtml(pastLabel)}" aria-expanded="false" aria-describedby="${tooltipId}" data-tag-trigger>${escapeHtml(tag)}<span class="tag-tooltip" id="${tooltipId}" role="tooltip"><strong>${escapeHtml(rule.title)}</strong><span>${escapeHtml(rule.description)}</span><small><b>${t.tagRuleUse}</b> ${escapeHtml(rule.use)}</small></span></button>&nbsp;${renderedText}</span>`;
}

function renderAnnotation(annotation, locale, targetKey, index) {
  const t = ui[locale];
  const lineNumber = String(index + 1).padStart(2, "0");
  const reviewOff = locale === "ru" ? "Отметить повторённым" : "Mark as repeated";
  const reviewOn = locale === "ru" ? "Повторено" : "Reviewed";
  const canonical = legacyAnnotationToCanonical(annotation, { language: targetMeta[targetKey].dataKey, dataset: "site" });
  const tokens = renderCanonicalText(canonical, (span, text) => {
      const tooltipId = `tag-rule-${index + 1}-${span.id}`;
      return renderTaggedSpan(span, text, locale, targetKey, tooltipId);
  });
  const russianTranslation = annotation.translations?.ru || annotation.translated_text;
  return `<article class="annotation-row" id="sentence-${index + 1}" data-review-card><button class="annotation-review-toggle" type="button" aria-pressed="false" aria-label="${reviewOff}" data-review-toggle data-review-id="sentence-${index + 1}" data-review-off="${reviewOff}" data-review-on="${reviewOn}">${lineNumber} · ${reviewOff}</button><span class="line-number">${lineNumber}</span><div><p class="annotated-line">${tokens || escapeHtml(annotation.original_text)}</p><details data-annotation-details><summary>${t.openExplanation}</summary><div class="annotation-explanation"><p class="plain-sentence">${escapeHtml(annotation.original_text)}</p>${russianTranslation || annotation.chunkList ? `<dl class="annotation-notes">${russianTranslation ? `<div data-native-translation hidden><dt>${t.translation}</dt><dd lang="ru">${escapeHtml(russianTranslation)}</dd></div>` : ""}${annotation.chunkList ? `<div><dt>${t.patterns}</dt><dd>${escapeHtml(annotation.chunkList)}</dd></div>` : ""}</dl>` : ""}</div></details></div></article>`;
}

export function documentPage(locale, targetKey, collectionKey, document) {
  const t = ui[locale];
  const target = targetMeta[targetKey];
  const pathname = itemUrl(locale, targetKey, collectionKey, document);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: `/${locale}/explore/${targetKey}/${collectionKey}/`, label: t[collectionKey] }, { href: pathname, label: document.title }])}
  <article class="document-page"><header class="document-head section-pad"><p class="eyebrow">${target.flag} · ${t[collectionKey]}</p><h1>${escapeHtml(document.title)}</h1><div class="document-context"><p>${t.documentContains} <strong>${document.annotations.length}</strong> ${t.sentences}.</p><p class="document-guide">${t.readingGuide}</p></div>${document.version ? `<p class="version">${t.updated}: ${escapeHtml(document.version)}</p>` : ""}</header><section class="annotation-controls section-pad" data-annotation-controls data-reading-copy="${escapeHtml(t.annotationModeReading)}" data-study-copy="${escapeHtml(t.annotationModeStudyActive)}" aria-label="${t.annotationModeLabel}"><div class="annotation-controls-copy"><span class="annotation-session-count" aria-hidden="true">01—${String(document.annotations.length).padStart(2, "0")}</span><div><p class="eyebrow">${t.annotationModeLabel}</p><p data-annotation-mode-copy>${t.annotationModeReading}</p></div></div><div class="segmented annotation-mode-switch" role="group" aria-label="${t.annotationModeLabel}"><button type="button" data-annotation-mode="reading" aria-pressed="true">${t.annotationModeReadingButton}</button><button type="button" data-annotation-mode="study" aria-pressed="false">${t.annotationModeStudyButton}</button></div></section><div class="annotation-sheet section-pad">${document.annotations.map((annotation, index) => renderAnnotation(annotation, locale, targetKey, index)).join("")}</div>${shareBar(locale, pathname, document.title)}</article>`;
  const learningResource = { "@context": "https://schema.org", "@type": "LearningResource", name: document.title, identifier: document.id, url: `${SITE_URL}${pathname}`, inLanguage: target.dataKey, educationalLevel: "Intermediate to advanced", learningResourceType: collectionLabel(locale, collectionKey), isAccessibleForFree: true };
  const metaTitle = identifiedMetaTitle(document.title, document.id);
  const metaDescription = locale === "en"
    ? `${document.title} (${document.id.slice(0, 8)}): read ${document.annotations.length} annotated ${target.native} sentences and open grammar explanations when needed.`
    : `${document.title} (${document.id.slice(0, 8)}): ${document.annotations.length} аннотированных предложений на ${target.native} с объяснениями по запросу.`;
  return layout({ locale, pathname, title: metaTitle, description: metaDescription, body, type: "article", structuredData: [breadcrumbJson(pathname, document.title, locale), learningResource] });
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
      ? { title: "Как читать разметку английских фраз", intro: "Сначала прочитайте фразу как обычно. Теги не заменяют грамматику — они лишь подсказывают, куда посмотреть.", research: "Это не декоративные ярлыки, а компактная исследовательская схема аннотации: функциональные роли размечаются на уровне токена, сохраняются в машиночитаемом корпусе и могут использоваться в NLP-задачах, анализе данных и учебных экспериментах.", label: "Сначала фраза, потом разметка", sample: [["S", "Мы"], ["V", "учим"], ["p2", "языковые модели"], ["Hf", "и будем применять их"]] }
      : { title: "Как читать разметку немецких фраз", intro: "Сначала прочитайте фразу целиком. Теги помогают заметить порядок слов, падеж и форму глагола без длинных правил.", research: "Это не декоративные ярлыки, а компактная исследовательская схема аннотации: функциональные роли размечаются на уровне токена, сохраняются в машиночитаемом корпусе и могут использоваться в NLP-задачах, анализе данных и учебных экспериментах.", label: "Сначала фраза, потом разметка", sample: [["S", "Wir"], ["V", "lernen"], ["/→", "die Muster"], ["Hf", "und werden sie benutzen"]] }
    : targetKey === "english"
      ? { title: "How to read English tags", intro: "Read the sentence normally first. Tags do not replace grammar; they simply point your attention to a useful part of the structure.", research: "These are not decorative labels. They form a compact research-oriented annotation scheme: functional roles are marked at token level, preserved in a machine-readable corpus, and ready for NLP work, data analysis and learning experiments.", label: "Sentence first, tags second", sample: [["S", "We"], ["V", "learn"], ["p2", "language patterns"], ["Hf", "and will use them"]] }
      : { title: "How to read German tags", intro: "Read the whole sentence first. Tags make word order, case and verb form easier to notice without turning the page into a rulebook.", research: "These are not decorative labels. They form a compact research-oriented annotation scheme: functional roles are marked at token level, preserved in a machine-readable corpus, and ready for NLP work, data analysis and learning experiments.", label: "Sentence first, tags second", sample: [["S", "Wir"], ["V", "lernen"], ["/→", "die Muster"], ["Hf", "und werden sie benutzen"]] };
  const groups = ["subject", "verb", "object", "helper"].map((kind) => ({ kind, entries: rules[targetKey].filter(([tag]) => tokenClass(tag) === kind) })).filter((group) => group.entries.length);
  const groupCopy = locale === "ru"
    ? { subject: ["Кто или что", "Кому принадлежит действие или состояние."], verb: ["Действие и форма", "Что происходит и в какой форме стоит глагол."], object: ["Детали конструкции", "Падеж, состояние, дополнение и другие опоры фразы."], helper: ["Служебные глаголы", "Как меняются время, результат или состояние действия."] }
    : { subject: ["Who or what", "The person or thing the sentence is about."], verb: ["Action and form", "What happens and which verb form carries it."], object: ["Sentence details", "Case, state, predicate detail and other structural cues."], helper: ["Helper verbs", "How tense, result or state changes the main verb."] };
  const sample = guide.sample.map(([tag, text]) => `<span><b class="grammar-tag ${tokenClass(tag)}">${escapeHtml(tag)}</b>&nbsp;${escapeHtml(text)}</span>`).join(" ");
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/explore/`, label: t.navExplore }, { href: `/${locale}/explore/${targetKey}/`, label: t[targetKey] }, { href: pathname, label: t.rules }])}<section class="rules-hero section-pad"><div><p class="eyebrow">${target.flag} · ${target.native}</p><h1>${guide.title}</h1><p class="lede">${guide.intro}</p><p>${guide.research}</p>${languageTabs(locale, targetKey, "annotation-rules/")}</div><figure class="rules-sample"><figcaption>${guide.label}</figcaption><p>${sample}</p></figure></section><section class="rules-catalogue section-pad ruled">${groups.map(({ kind, entries }, index) => `<section class="rule-group rule-group-${kind}"><header><span>0${index + 1}</span><h2>${groupCopy[kind][0]}</h2><p>${groupCopy[kind][1]}</p></header><div>${entries.map((rule) => { const item = ruleCopy(locale, targetKey, rule); return `<article><span class="grammar-tag ${kind}">${escapeHtml(item.tag)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><small><b>${t.tagRuleUse}</b> ${escapeHtml({ subject: t.tagRuleSubjectUse, verb: t.tagRuleVerbUse, object: t.tagRuleObjectUse, helper: t.tagRuleHelperUse }[kind])}</small></div></article>`; }).join("")}</div></section>`).join("")}</section>`;
  return layout({ locale, pathname, title: `${t.rules}: ${t[targetKey]} — Metkagram`, description: locale === "en" ? `A plain-language guide to the ${t[targetKey]} grammar marks used in Metkagram sentences.` : `Понятный справочник по обозначениям грамматики ${t[targetKey].toLowerCase()} в предложениях Metkagram.`, body, structuredData: [breadcrumbJson(pathname, t.rules, locale)] });
}

function markdownStrong(text = "") {
  return escapeHtml(text).replaceAll(/\*\*(.+?)\*\*/g, "<mark>$1</mark>");
}

export function patternTitle(pattern, locale, targetLanguage = "en") {
  if (locale === "ru") return pattern.title_ru;
  return pattern.langs.find((lang) => lang.lang === targetLanguage)?.formula || pattern.formulas?.[0] || pattern.id;
}

export function patternPage(locale, pattern, serviceAnnotations = {}) {
  const t = ui[locale];
  const primary = pattern.langs[0];
  const title = patternTitle(pattern, locale, primary.lang);
  const pathname = patternPath(locale, pattern);
  const cards = new Map(patternToCanonicalCards(pattern, serviceAnnotations).map((card) => [card.language, card]));
  const languages = new Map(pattern.langs.map((lang) => [lang.lang, { ...lang, card: cards.get(lang.lang) }]));
  const english = languages.get("en");
  const german = languages.get("de");
  const renderSentence = (language, item, label) => {
    if (!language || !item) return "";
    const targetKey = language.lang === "en" ? "english" : "german";
    return `<div class="pattern-comparison-language" lang="${language.lang}" data-target-language="${language.lang}"><span class="language-code">${label}</span><p>${renderCanonicalText(item, (span, text) => renderTaggedSpan(span, text, locale, targetKey, `pattern-${pattern.id}-${language.lang}-${item.id}-${span.id}`))}</p></div>`;
  };
  const renderTranslation = (translation) => translation ? `<div class="pattern-comparison-translation" data-native-translation hidden><span class="language-code">RU · ${t.translation}</span><p lang="ru">${escapeHtml(translation)}</p></div>` : "";
  const primaryCard = `<section class="pattern-reference-card"><header class="learning-section-label"><span aria-hidden="true">01</span><p class="eyebrow">${t.patternStepFormula}</p></header><div class="pattern-formulas"><div><span class="language-code">EN · ${t.english}</span><code>${escapeHtml(english?.formula || "")}</code></div><div><span class="language-code">DE · ${t.german}</span><code>${escapeHtml(german?.formula || "")}</code></div></div><article class="pattern-comparison-card pattern-primary-example"><header class="learning-section-label example-card-head"><span aria-hidden="true">02</span><p class="eyebrow">${t.patternStepAnchor}</p></header><div class="pattern-comparison-sentences">${renderSentence(english, english?.card, "EN · " + t.english)}${renderSentence(german, german?.card, "DE · " + t.german)}</div>${renderTranslation(english?.translation || german?.translation)}</article></section>`;
  const variationCount = Math.max(english?.card?.examples?.length || 0, german?.card?.examples?.length || 0);
  const variations = variationCount ? `<section class="pattern-variations" aria-label="${t.examples}"><h2><span><b aria-hidden="true">03</b>${t.patternStepVariations}</span><small>${variationCount} · ${t.examples.toLowerCase()}</small></h2><ol class="pattern-comparison-list">${Array.from({ length: variationCount }, (_, index) => {
    const englishExample = english?.card?.examples?.[index];
    const germanExample = german?.card?.examples?.[index];
    return `<li class="pattern-comparison-card"><div class="pattern-comparison-sentences">${renderSentence(english, englishExample, "EN · " + t.english)}${renderSentence(german, germanExample, "DE · " + t.german)}</div>${renderTranslation(englishExample?.translation || germanExample?.translation)}</li>`;
  }).join("")}</ol></section>` : "";
  const russianDescription = pattern.metaphor_ru ? `<div class="native-pattern-description" data-native-translation hidden><p class="eyebrow">${t.explanation}</p><p class="lede" lang="ru">${escapeHtml(pattern.metaphor_ru)}</p></div>` : "";
  const body = `<article class="pattern-page section-pad" data-pattern-id="${escapeHtml(pattern.id)}">${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/practice/`, label: t.navPractice }, { href: pathname, label: title }])}<header class="pattern-page-head"><p class="eyebrow">B2–C1 · ${escapeHtml(pattern.group_id)} · ${escapeHtml(pattern.id)}</p><h1>${escapeHtml(title)}</h1>${russianDescription}</header><div class="pattern-comparison">${primaryCard}${variations}</div></article>`;
  const metaTitle = identifiedMetaTitle(title, pattern.id);
  const metaDescription = locale === "en"
    ? `Pattern ${pattern.id}: ${primary.formula}. Study this B2–C1 structure with English and German examples.`
    : `Паттерн ${pattern.id}: ${title}. Модель B2–C1 с примерами на английском и немецком.`;
  return layout({ locale, pathname, title: metaTitle, description: metaDescription, body, type: "article", bodyClass: "pattern-reader-body", structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: title, identifier: pattern.id, educationalLevel: "B2–C1", teaches: pattern.formulas || pattern.langs.map((lang) => lang.formula), inLanguage: pattern.langs.map((lang) => lang.lang), url: `${SITE_URL}${pathname}` }] });
}

export function practicePage(locale, patterns, studySets) {
  const t = ui[locale];
  const pathname = `/${locale}/practice/`;
  const ru = locale === "ru";
  const patternCount = patterns.length.toLocaleString(ru ? "ru-RU" : "en-US");
  const categories = [...new Set(patterns.map((pattern) => pattern.group_id))].sort();
  const entryCopy = ru
    ? { label: "Начните здесь", title: "Что вы хотите сказать?", detail: "Выберите реальную речевую задачу — например, вежливо не согласиться, сравнить варианты или объяснить причину.", action: "Выбрать намерение", secondaryLabel: "Другие способы поиска", atlas: "Атлас паттернов", frames: "Логические каркасы", paths: "Учебные маршруты", search: "Поиск по всем паттернам", agent: "Подключить к агенту" }
    : { label: "Start here", title: "What do you want to say?", detail: "Choose a real communication goal—such as disagreeing politely, comparing options, or explaining a cause.", action: "Choose an intent", secondaryLabel: "Other ways to explore", atlas: "Pattern Atlas", frames: "Reasoning Frames", paths: "Learning paths", search: "Search all patterns", agent: "Connect an agent" };
  const body = `<section class="page-head section-pad practice-intro"><p class="eyebrow">B2–C1 · ${patternCount} ${t.patterns.toLowerCase()}</p><h1>${t.practiceTitle}</h1><p class="lede">${t.practiceIntro}</p><nav class="practice-entry" data-practice-entry aria-label="${escapeHtml(entryCopy.title)}"><a class="practice-entry-primary" href="#intent-discovery"><span class="eyebrow">${entryCopy.label}</span><strong>${entryCopy.title}</strong><small>${entryCopy.detail}</small><b>${entryCopy.action} <span aria-hidden="true">→</span></b></a><div class="practice-entry-secondary"><p>${entryCopy.secondaryLabel}</p><a href="#pattern-atlas">${entryCopy.atlas}</a><a href="#reasoning-frames">${entryCopy.frames}</a><a href="#learning-paths">${entryCopy.paths}</a><a href="#all-patterns">${entryCopy.search} · ${patternCount}</a></div></nav><a class="practice-agent-link" href="/${locale}/ai/#connectors">${entryCopy.agent} →</a></section><section id="all-patterns" class="practice-tools section-pad ruled"><div class="filter-field"><p class="filter-label">${t.chooseTarget}</p><div class="segmented" aria-label="${t.chooseTarget}"><button type="button" data-language-filter="en" aria-pressed="true">EN · ${t.english}</button><button type="button" data-language-filter="de" aria-pressed="true">DE · ${t.german}</button></div></div><label>${t.category}<select data-category-filter><option value="">${t.allCategories}</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label><label>${t.search}<input type="search" data-pattern-search></label><output class="result-count practice-count" data-pattern-count aria-live="polite">${t.visibleSets} ${patterns.length} ${t.patterns.toLowerCase()}</output></section><section class="pattern-index section-pad" data-pattern-list>${patterns.map((pattern, index) => `<a href="${patternPath(locale, pattern)}" data-pattern-id="${escapeHtml(pattern.id)}" data-language="${pattern.langs.map((lang) => lang.lang).join(" ")}" data-category="${escapeHtml(pattern.group_id)}" data-search-text="${escapeHtml(`${pattern.id} ${pattern.title_ru} ${pattern.formulas?.join(" ") || ""}`.toLowerCase())}"><span class="document-number">${String(index + 1).padStart(4, "0")}</span><span><strong>${escapeHtml(patternTitle(pattern, locale))}</strong><small>${escapeHtml(pattern.id)} · ${escapeHtml(pattern.set_id)} · ${pattern.langs.map((lang) => lang.lang.toUpperCase()).join(" / ")}</small></span><span aria-hidden="true">↗</span></a>`).join("")}<p class="empty-state" data-empty-state hidden>${t.noResults}</p></section>`;
  return layout({ locale, pathname, title: `${t.practiceTitle} — ${patterns.length.toLocaleString()} B2–C1 patterns | Metkagram`, description: t.practiceIntro, body, structuredData: [breadcrumbJson(pathname, t.practiceTitle, locale), { "@context": "https://schema.org", "@type": "ItemList", name: t.practiceTitle, numberOfItems: patterns.length }] });
}

export function studySetPage(locale, set, patterns) {
  const t = ui[locale];
  const title = locale === "ru" ? set.title_ru : set.title_en;
  const description = locale === "ru" ? set.description_ru || set.description : set.description;
  const pathname = studySetPath(locale, set);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: t.home }, { href: `/${locale}/practice/`, label: t.navPractice }, { href: pathname, label: title }])}<section class="page-head section-pad compact study-set-head"><p class="eyebrow">B2–C1 · ${escapeHtml(set.id)} · ${patterns.length} ${t.patterns.toLowerCase()}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(description)}</p></section><section class="pattern-index section-pad ruled">${patterns.map((pattern, index) => `<a href="${patternPath(locale, pattern)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(patternTitle(pattern, locale))}</strong><small>${escapeHtml(pattern.id)} · ${escapeHtml(pattern.langs.map((lang) => lang.formula).join(" / "))}</small></span><span aria-hidden="true">↗</span></a>`).join("")}</section>${shareBar(locale, pathname, title)}`;
  return layout({ locale, pathname, title: `${title} — ${patterns.length} B2–C1 patterns | Metkagram`, description, body, structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "LearningResource", name: title, identifier: set.id, description, url: `${SITE_URL}${pathname}`, learningResourceType: locale === "ru" ? "Тематический сет языковых паттернов" : "Language pattern topic set", educationalLevel: "B2–C1", inLanguage: ["en", "de"], teaches: patterns.slice(0, 12).map((pattern) => pattern.langs.find((lang) => lang.lang === "en")?.formula || pattern.id), isAccessibleForFree: true, numberOfItems: patterns.length }] });
}

export function methodPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/method/`;
  const c = ru ? {
    eyebrow: "Metkagram · метод разметки", title: "Паттерн внутри фразы.", intro: "Короткие метки показывают роль слова, не разрушая контекст. Так фраза превращается в повторяемый паттерн для учёбы, сравнения языков и машинного анализа.", loop: "От фразы к паттерну", before: "Фраза до и после разметки", variation: "Паттерн в новых контекстах", original: "Единая система разметки", evidence: "Принципы метода", limits: "Границы метода", sources: "Проверяемые источники", data: "Открытый корпус с функциональной разметкой на уровне слов", recall: "Сначала восстановите паттерн, затем откройте подсказку.", stages: ["Фраза", "Метка", "Структура", "Паттерн", "Вариация", "Воспроизведение", "Повторение"], stageText: ["Прочитайте фразу целиком.", "Заметьте короткую метку рядом со словом.", "Свяжите метку с нужным фрагментом.", "Выделите повторяемый грамматический паттерн.", "Сравните его в другом лице, времени и контексте.", "Восстановите паттерн без подсказки.", "Вернитесь к нему через подходящий интервал."], originalText: "Metkagram объединяет функциональную разметку, живые фразы, переводы, формулы и системные вариации. Получается открытая библиотека для учёбы и NLP-анализа: в ней можно прослеживать роли слов, сравнивать паттерны между английским и немецким и строить воспроизводимые эксперименты.", evidenceText: ["Короткая визуальная метка направляет внимание на одну важную деталь.", "Разметка остаётся внутри осмысленной фразы и не отделяет форму от содержания.", "Токеновая схема понятна человеку и пригодна для вычислительного анализа.", "Метка рядом со словом снижает необходимость переключаться между фразой и правилом.", "Целая фраза помогает запомнить паттерн в контексте и перенести его в новую ситуацию.", "Попытка вспомнить до подсказки укрепляет доступ к паттерну.", "Интервалы и вариации показывают, что в структуре меняется, а что остаётся постоянным."], limitsText: "Разметка помогает увидеть структуру, но не заменяет чтение, разговор, обратную связь, словарную работу и регулярную практику."
  } : {
    eyebrow: "Metkagram · annotation method", title: "The pattern inside the sentence.", intro: "Compact functional tags reveal the role of a word without breaking the context. Each sentence becomes a reusable pattern for learning, cross-language comparison and machine analysis.", loop: "From sentence to pattern", before: "Before and after annotation", variation: "A pattern across contexts", original: "One coherent annotation system", evidence: "Principles behind the method", limits: "Method boundaries", sources: "Verified sources", data: "An open, machine-readable corpus with token-level functional annotation", recall: "Retrieve the pattern first, then reveal the cue.", stages: ["Sentence", "Tag", "Structure", "Pattern", "Variation", "Recall", "Spaced review"], stageText: ["Read one complete, meaningful sentence.", "Notice a compact tag beside a word or span.", "Connect the tag to the exact part it describes.", "Identify the reusable grammatical pattern.", "Compare it across people, questions, negatives, tenses and contexts.", "Retrieve the pattern before revealing the cue.", "Return to it later through spaced review."], originalText: "Metkagram combines token-level functional annotation with natural sentences, translations, formulas and systematic variation. The result is an open English–German library for learning and NLP analysis: word roles remain traceable, patterns can be compared across languages, and reproducible experiments can use the same structured evidence.", evidenceText: ["A selective visual tag directs attention to one functionally relevant detail.", "Inline annotation keeps form inside a meaningful sentence.", "A token-level scheme stays readable for people and usable for computational analysis.", "A short tag beside its word reduces switching between the sentence and a separate rule.", "A complete sentence supports contextual encoding and transfer to a new situation.", "Retrieving a pattern before feedback can strengthen later access to it.", "Spaced return and systematic variation reveal what changes and what stays reusable."], limitsText: "Annotation makes structure easier to see, but it does not replace reading, conversation, feedback, vocabulary work or regular practice."
  };
  const tagInfo = ru ? { S: ["Подлежащее", "Кто действует или о ком говорится."], V: ["Главный глагол", "Основное действие или состояние."], vI: ["Инфинитив", "Глагол в начальной форме."], M: ["Модальный глагол", "Показывает возможность, просьбу или необходимость."], v2: ["Второй глагол", "Глагольная форма после служебного или модального глагола."], Hr: ["Служебный глагол результата", "Связывает действие с завершённым опытом или результатом."] } : { S: ["Subject", "Who acts or who the sentence is about."], V: ["Main verb", "The primary action or state."], vI: ["Infinitive", "A verb in its base form."], M: ["Modal verb", "Signals possibility, a request, or necessity."], v2: ["Second verb", "The verb form following a helper or modal."], Hr: ["Result helper", "Connects an action to completed experience or result."] };
  let methodTagIndex = 0;
  const tag = (kind, label, text) => { const id = `method-tag-${++methodTagIndex}`; const [title, description] = tagInfo[label]; return `<span class="method-token"><button class="grammar-tag tag-trigger ${kind}" type="button" aria-expanded="false" aria-describedby="${id}" data-tag-trigger>${label}<span class="tag-tooltip" id="${id}" role="tooltip"><strong>${title}</strong><span>${description}</span></span></button>&nbsp;${text}</span>`; };
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
  const loopFormula = ru ? "Фраза → Метка → Структура → Паттерн → Вариация → Воспроизведение" : "Sentence → Tag → Structure → Pattern → Variation → Recall";
  const methodNav = (ru ? ["Процесс", "Разметка", "Вариации", "Система", "Принципы", "Границы", "Источники"] : ["Process", "Annotation", "Variations", "System", "Principles", "Boundaries", "Sources"])
    .map((label, index) => `<a href="#method-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${label}</strong></a>`).join("");
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ui[locale].home }, { href: pathname, label: ui[locale].navMethod }])}<section class="studio-route studio-route--method"><div class="studio-route-backdrop" aria-hidden="true"></div><article class="method-page studio-route-board"><section class="method-hero section-pad"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p></div><div class="method-sentence" aria-label="Annotated sentence examples"><p class="method-sentence-label">${ru ? "Живая разметка" : "Live annotation"}</p>${examples.join("")}</div></section><nav class="method-index" aria-label="${ru ? "Разделы метода" : "Method sections"}">${methodNav}</nav><section class="method-loop section-pad ruled" id="method-1"><div><p class="eyebrow">01 · ${c.loop}</p><h2>${loopFormula}</h2></div><ol>${c.stages.map((stage, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${stage}</strong><p>${c.stageText[index]}</p></li>`).join("")}</ol></section><section class="method-compare section-pad ruled" id="method-2"><div><p class="eyebrow">02 · ${c.before}</p><h2>${ru ? "Сначала смысл, затем метка" : "Meaning first, tag second"}</h2></div><div class="method-compare-lines"><p>I want to develop more effective study habits.</p><p>${tag("subject", "S", "I")} ${tag("verb", "V", "want")} ${tag("verb", "vI", "to develop")} more effective study habits.</p><small>${c.recall}</small></div></section><section class="method-compare section-pad ruled" id="method-3"><div><p class="eyebrow">03 · ${c.variation}</p><h2>${ru ? "Один паттерн — новые ситуации" : "One pattern, new situations"}</h2></div><div class="method-compare-lines"><p><strong>If + Past Simple, would + V</strong></p><p>If I had more time, I would start a side project.</p><p>Wenn ich mehr Zeit hätte, würde ich ein Nebenprojekt starten.</p><small>${ru ? "Вопрос, отрицание, другое лицо и время меняют фразу, но сохраняют узнаваемый паттерн." : "Questions, negatives, people and tenses change the sentence while preserving a recognisable pattern."}</small></div></section><section class="method-original section-pad ruled" id="method-4"><p class="eyebrow">04 · ${c.original}</p><h2>${c.original}</h2><p class="lede">${c.originalText}</p><p class="method-data">${c.data}</p></section><section class="method-evidence section-pad ruled" id="method-5"><div><p class="eyebrow">05 · ${c.evidence}</p><h2>${ru ? "Исследования объясняют принципы, а не обещают результат." : "Research explains the principles; it does not promise an outcome."}</h2></div><div class="method-evidence-grid">${c.evidenceText.map((text, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><p>${text}</p></article>`).join("")}</div></section><section class="method-boundary section-pad ruled" id="method-6"><div><p class="eyebrow">06 · ${c.limits}</p><h2>${c.limits}</h2></div><p class="lede">${c.limitsText}</p></section><section class="method-sources section-pad ruled" id="method-7"><div><p class="eyebrow">07 · ${c.sources}</p><h2>${c.sources}</h2><p class="lede">${ru ? "Названия, авторы, годы и ссылки отделяют результаты исследований от интерпретации Metkagram." : "Titles, authors, dates and links separate research findings from Metkagram’s interpretation."}</p></div><ol>${sources.map(([href, label], index) => `<li><a href="${href}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, "0")}</span>${label}<b aria-hidden="true">↗</b></a></li>`).join("")}</ol></section>${shareBar(locale, pathname, c.title)}</article></section>`;
  const structuredData = { "@context": "https://schema.org", "@type": "LearningResource", name: c.title, learningResourceType: "Language learning method", educationalLevel: "B2–C1", inLanguage: locale, teaches: ["Inline functional annotation", "Reusable language patterns", "Active recall", "Spaced review"], isAccessibleForFree: true, url: `${SITE_URL}${pathname}` };
  return layout({ locale, pathname, title: ru ? "Как работает метод Metkagram" : "How the Metkagram method works", description: c.intro, body, structuredData: [breadcrumbJson(pathname, c.title, locale), structuredData], bodyClass: "studio-route-body" });
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
        ["Scope", "This policy applies to the Metkagram website and the Android and iOS applications listed below. It describes the current public website and preserves the relevant terms for the legacy mobile apps."],
        ["Information on the website", "The public website does not require an account and does not use advertising trackers. It serves public language datasets, documentation and a read-only agent connector."],
        ["Legacy mobile apps", "The mobile apps may use the information needed to provide their features, support a user account where available, process a purchase through the relevant app store, and maintain or secure the service. The apps may rely on platform, cloud, analytics or sign-in services; those providers process data under their own policies."],
        ["Sharing and security", "We do not sell personal information. Information may be processed by service providers that help operate the apps, by app stores when you install or purchase, or where disclosure is required by law. Reasonable safeguards are used, but no online service can promise absolute security."],
        ["Your choices", "You can clear local website data in your browser and manage app permissions or purchases in the relevant store. For requests concerning the legacy apps or this policy, use the MetalHatsCats contact page."],
        ["Children and changes", "The service is not directed to children under 13. We may update this policy when the service changes; the date above indicates the current version."]
      ]
    } : {
      eyebrow: "Metkagram · правовая информация",
      title: "Политика конфиденциальности",
      intro: "Как сайт Metkagram и прежние мобильные приложения работают с информацией.",
      updated: "Обновлено: 14 июля 2026 · Исходная политика опубликована: 16 апреля 2023",
      sections: [
        ["Область действия", "Политика относится к сайту Metkagram и приложениям для Android и iOS, ссылки на которые приведены ниже. В ней описан текущий публичный сайт и сохранены применимые условия для прежних мобильных приложений."],
        ["Информация на сайте", "Публичный сайт не требует учётной записи и не использует рекламные трекеры. Он публикует языковые датасеты, документацию и read-only коннектор для агентов."],
        ["Прежние мобильные приложения", "Мобильные приложения могут использовать данные, необходимые для работы функций, поддержки учётной записи, если она доступна, обработки покупки через соответствующий магазин и защиты сервиса. Приложения могут использовать платформенные, облачные, аналитические или сервисы входа; такие поставщики обрабатывают данные по собственным правилам."],
        ["Передача и защита", "Мы не продаём персональные данные. Информация может обрабатываться поставщиками, которые помогают работе приложений, магазинами приложений при установке или покупке, а также в случаях, предусмотренных законом. Используются разумные меры защиты, но ни один онлайн-сервис не может гарантировать абсолютную безопасность."],
        ["Ваш выбор", "Вы можете очистить локальные данные сайта в браузере, а также управлять разрешениями и покупками в соответствующем магазине. По вопросам о прежних приложениях и этой политике используйте страницу контактов MetalHatsCats."],
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
  const title = en ? "Metkagram mobile apps for grammar practice" : "Мобильные приложения Metkagram";
  const intro = en ? "The original Metkagram mobile apps remain available in their stores. Use the web workspace for reading annotated sentences and the apps for the original flashcard and drill experience." : "Читайте фразы с разметкой на сайте, а карточки и упражнения открывайте в приложениях.";
  const body = `<section class="app-hero section-pad"><p class="eyebrow">Metkagram · mobile apps</p><h1>${en ? "The original practice apps." : "Приложения для практики."}</h1><p class="lede">${intro}</p>${storeLinks(locale)}</section><section class="app-details section-pad ruled"><div><p class="eyebrow">${en ? "What they contain" : "Что внутри"}</p><h2>${en ? "A focused grammar practice tool." : "Грамматическая практика без лишнего."}</h2></div><div class="app-feature-list"><article><span>01</span><h3>${en ? "Flashcards" : "Карточки"}</h3><p>${en ? "Short sessions built around recurring grammar choices." : "Короткие занятия на повторяющихся конструкциях."}</p></article><article><span>02</span><h3>${en ? "Minimal pairs" : "Минимальные пары"}</h3><p>${en ? "Compare nearby structures and make the contrast visible." : "Сравнивайте близкие конструкции и замечайте разницу."}</p></article><article><span>03</span><h3>${en ? "Spaced return" : "Повторение"}</h3><p>${en ? "Return to patterns over time instead of endlessly rereading them." : "Возвращайтесь к моделям через подходящие интервалы."}</p></article></div></section><section class="app-trust section-pad ruled"><div><p class="eyebrow">${en ? "Status & policies" : "Статус и правила"}</p><h2>${en ? "Mobile history, clear links." : "Условия и конфиденциальность."}</h2></div><div><p class="lede">${en ? "The applications are maintained as part of Metkagram's product history and remain subject to the policies below and the terms of the relevant store." : "Для приложений действуют правила Metkagram и условия соответствующего магазина."}</p><p class="legal-inline-links"><a href="/${locale}/legal/privacy/">${en ? "Privacy Policy" : "Политика конфиденциальности"}</a><a href="/${locale}/legal/terms/">${en ? "Terms of Use" : "Условия использования"}</a></p></div></section>`;
  return layout({ locale, pathname, title, description: intro, body, structuredData: [breadcrumbJson(pathname, en ? "Mobile apps" : "Мобильные приложения", locale)] });
}

export function legalPage(locale, kind) {
  const t = legalSections(locale, kind);
  const pathname = `/${locale}/legal/${kind}/`;
  const otherKind = kind === "privacy" ? "terms" : "privacy";
  const otherLabel = locale === "en" ? (otherKind === "privacy" ? "Privacy Policy" : "Terms of Use") : (otherKind === "privacy" ? "Политика конфиденциальности" : "Условия использования");
  const body = `<section class="legal-head section-pad"><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1><p class="lede">${t.intro}</p><p class="legal-updated">${t.updated}</p></section><section class="legal-layout section-pad ruled"><nav class="legal-toc" aria-label="${locale === "en" ? "On this page" : "На странице"}"><p class="eyebrow">${locale === "en" ? "On this page" : "На странице"}</p><ol>${t.sections.map(([heading], index) => `<li><a href="#legal-${index + 1}">${String(index + 1).padStart(2, "0")} · ${heading}</a></li>`).join("")}</ol></nav><article class="legal-document">${t.sections.map(([heading, text], index) => `<section id="legal-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span><h2>${heading}</h2><p>${text}</p></section>`).join("")}</article></section><section class="legal-related section-pad ruled"><p class="eyebrow">${locale === "en" ? "Related" : "Связанные страницы"}</p><nav><a href="/${locale}/apps/">${locale === "en" ? "Mobile apps" : "Мобильные приложения"} <span aria-hidden="true">→</span></a><a href="/${locale}/legal/${otherKind}/">${otherLabel} <span aria-hidden="true">→</span></a><a href="${ATTRIBUTION.contact_url}" target="_blank" rel="noreferrer">${locale === "en" ? "Contact MetalHatsCats" : "Связаться с MetalHatsCats"} <span aria-hidden="true">↗</span></a></nav></section>`;
  return layout({ locale, pathname, title: `${t.title} — Metkagram`, description: t.intro, body, structuredData: [breadcrumbJson(pathname, t.title, locale)] });
}

export function aboutPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/about/`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">M: · project notes</p><h1>${t.aboutTitle}</h1><p class="lede">${t.aboutIntro}</p></section><section class="about-sections section-pad ruled"><article id="license"><h2>${t.license}</h2><p>${locale === "ru" ? "Материалы проекта доступны бесплатно для личного, учебного и другого некоммерческого использования с указанием Metkagram. Для коммерческого использования требуется отдельное разрешение." : "Project materials are free for personal, educational, and other non-commercial use with Metkagram attribution. Commercial use requires separate permission."}</p><a href="/LICENSE">CC BY-NC 4.0 →</a></article><article id="privacy"><h2>${t.privacy}</h2><p>${t.privacyText}</p></article><article><h2>${t.source}</h2><p>${t.connected}</p><a href="https://github.com/metkagram/metkagram.github.io">GitHub ↗</a></article></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "About Metkagram grammar markup" : "О разметке грамматики Metkagram", description: t.aboutIntro, body, structuredData: [breadcrumbJson(pathname, t.aboutTitle, locale), { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Metkagram", url: SITE_URL, sameAs: ["https://github.com/metkagram/metkagram.github.io"] }] });
}

export function roadmapPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/roadmap/`;
  const items = [[t.roadmapNow, t.roadmapNowDetail], [t.roadmapNext, t.roadmapNextDetail], [t.roadmapLater, t.roadmapLaterDetail]];
  const body = `<section class="page-head section-pad"><p class="eyebrow">M: · public notes</p><h1>${t.roadmapTitle}</h1><p class="lede">${t.roadmapIntro}</p></section><section class="roadmap-grid section-pad ruled">${items.map(([label, detail], index) => `<article><span>0${index + 1}</span><h2>${label}</h2><p>${detail}</p></article>`).join("")}</section><section class="changelog section-pad ruled" id="changelog"><p class="eyebrow">${t.changelog}</p><h2>${t.changelogTitle}</h2><p class="lede">${t.changelogIntro}</p><article><time datetime="2026-07">${t.changelogCurrent}</time><p>${t.changelogCurrentDetail}</p></article></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "Metkagram roadmap and changelog" : "Планы и изменения Metkagram", description: `${t.roadmapIntro} ${t.changelogIntro}`, body: `${body}${shareBar(locale, pathname, t.roadmapTitle)}`, structuredData: [breadcrumbJson(pathname, t.roadmap, locale)] });
}

function projectMetrics(counts, locale) {
  const ru = locale === "ru";
  return [
    ["01", counts.advancedPatterns.toLocaleString(ru ? "ru-RU" : "en-US"), ru ? "паттернов B2–C1" : "reusable B2–C1 patterns"],
    ["02", counts.annotatedSentences.toLocaleString(ru ? "ru-RU" : "en-US"), ru ? "аннотированных предложений" : "annotated sentences"],
    ["03", counts.annotatedDocuments.toLocaleString(ru ? "ru-RU" : "en-US"), ru ? "наборов документов" : "curated document sets"],
    ["04", "EN · DE", ru ? "языки изучения" : "learning languages"]
  ];
}

export function researchPage(locale, counts) {
  const ru = locale === "ru";
  const pathname = `/${locale}/research/`;
  const c = ru ? {
    eyebrow: "Metkagram · исследовательская программа",
    title: "Измерять метод, а не только описывать его.",
    intro: "Metkagram ведёт открытую прикладную программу исследований на пересечении изучения второго языка, извлечения из памяти и функциональной разметки. Здесь зафиксированы гипотезы до получения результатов, чтобы будущие выводы можно было проверить.",
    status: "Статус · протоколы подготовлены, заявления об эффекте не сделаны",
    questionsTitle: "Вопросы исследования",
    questions: [
      ["Сигнал и внимание", "Помогает ли минимальная функциональная метка быстрее заметить структуру, чем та же фраза без разметки?", "Точность определения роли и время до правильного ответа."],
      ["Паттерн и перенос", "Помогают ли параллельные вариации применять конструкцию в новом контексте лучше, чем объяснение правила?", "Точность на новых, ранее не показанных примерах."],
      ["Извлечение и сохранение", "Улучшает ли попытка вспомнить конструкцию до подсказки отсроченное воспроизведение?", "Результат немедленной и отсроченной проверки."],
      ["Разметка и качество данных", "Может ли единая токеновая схема одновременно поддерживать обучение и воспроизводимый NLP-анализ?", "Согласие разметчиков, валидность офсетов и полнота данных."]
    ],
    protocolTitle: "Минимальный воспроизводимый протокол",
    protocol: ["Заранее зарегистрировать гипотезу, первичный показатель и критерий исключения.", "Сравнивать одну переменную за раз: разметка, вариация или извлечение.", "Использовать новые примеры для проверки переноса, а не только знакомые фразы.", "Публиковать нулевые и отрицательные результаты вместе с положительными.", "Сохранять анонимность участников и собирать только необходимые данные.", "Версионировать стимулы, схему разметки и аналитический код."],
    assetsTitle: "Что уже готово для исследования",
    assetsIntro: "Статический корпус, каноническая схема и публичные маршруты делают стимулы проверяемыми и воспроизводимыми.",
    claimsTitle: "Граница доказательств",
    claims: "Metkagram пока не заявляет, что его интерфейс превосходит другие методы обучения. Исследования внимания, focus on form, извлечения и интервального повторения объясняют проектные решения; эффект конкретной реализации должен измеряться отдельно.",
    collaborateTitle: "Предложить исследование",
    collaborate: "Мы открыты к preregistered-пилотам, корпусным исследованиям, проверке качества аннотаций и совместным студенческим проектам."
  } : {
    eyebrow: "Metkagram · internal research programme",
    title: "Measure the method, not just describe it.",
    intro: "Metkagram maintains an applied research programme at the intersection of second-language learning, retrieval practice and functional annotation. Hypotheses are recorded before results exist, so future claims can be tested rather than retrofitted.",
    status: "Status · protocols prepared, no efficacy claim made",
    questionsTitle: "Research questions",
    questions: [
      ["Cue and attention", "Does a minimal functional tag help learners identify structure faster than the same sentence without annotation?", "Role-identification accuracy and time to a correct answer."],
      ["Pattern and transfer", "Do parallel variations support use in a new context better than a rule explanation alone?", "Accuracy on unseen, structurally matched examples."],
      ["Retrieval and retention", "Does attempting the pattern before revealing it improve delayed recall?", "Immediate and delayed cued-production scores."],
      ["Annotation and data quality", "Can one token-level scheme serve learning and reproducible NLP analysis at the same time?", "Annotator agreement, offset validity and record completeness."]
    ],
    protocolTitle: "Minimum reproducible protocol",
    protocol: ["Pre-register the hypothesis, primary outcome and exclusion criteria.", "Vary one mechanism at a time: annotation, variation or retrieval.", "Measure transfer with unseen examples, not only the phrases used in practice.", "Publish null and negative findings alongside positive results.", "Protect participant privacy and collect only the data the study needs.", "Version the stimuli, annotation schema and analysis code."],
    assetsTitle: "Research-ready assets",
    assetsIntro: "A static corpus, canonical schema and public routes make learning stimuli inspectable and reproducible.",
    claimsTitle: "Evidence boundary",
    claims: "Metkagram does not yet claim that its interface outperforms another learning method. Research on attention, focus on form, retrieval and spacing informs the design; the effect of this specific implementation must be measured separately.",
    collaborateTitle: "Propose a study",
    collaborate: "We welcome preregistered pilots, corpus studies, annotation-quality reviews and supervised student research."
  };
  const metrics = projectMetrics(counts, locale);
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ui[locale].home }, { href: `/${locale}/method/`, label: ui[locale].navMethod }, { href: pathname, label: ru ? "Исследования" : "Research" }])}<article class="research-page"><section class="research-hero section-pad"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p><p class="research-status">${c.status}</p></div><dl class="project-metrics">${metrics.map(([, value, label]) => `<div><dt>${value}</dt><dd>${label}</dd></div>`).join("")}</dl></section><section class="research-questions section-pad ruled"><div><p class="eyebrow">01 · ${c.questionsTitle}</p><h2>${c.questionsTitle}</h2></div><ol>${c.questions.map(([title, question, measure], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${question}</p><small><b>${ru ? "Основной показатель" : "Primary measure"}:</b> ${measure}</small></div></li>`).join("")}</ol></section><section class="research-protocol section-pad ruled"><div><p class="eyebrow">02 · ${c.protocolTitle}</p><h2>${c.protocolTitle}</h2></div><ol>${c.protocol.map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${item}</li>`).join("")}</ol></section><section class="research-assets section-pad ruled"><div><p class="eyebrow">03 · ${c.assetsTitle}</p><h2>${c.assetsTitle}</h2><p>${c.assetsIntro}</p></div><nav class="research-links"><a href="/${locale}/method/"><strong>${ru ? "Основания метода" : "Method and references"}</strong><span>${ru ? "Логика, ограничения и первичные источники" : "Design logic, limitations and primary sources"} →</span></a><a href="/${locale}/ai/"><strong>${ru ? "Датасеты и API" : "Datasets and API"}</strong><span>${ru ? "Версионированные данные и происхождение записей" : "Versioned data with record-level provenance"} →</span></a><a href="/data/schema.json"><strong>${ru ? "Схема данных" : "Data schema"}</strong><span>${ru ? "Машиночитаемые контракты" : "Machine-readable contracts"} →</span></a></nav></section><section class="research-boundary section-pad ruled"><div><p class="eyebrow">04 · ${c.claimsTitle}</p><h2>${c.claimsTitle}</h2></div><p class="lede">${c.claims}</p></section><section class="research-collaborate section-pad ruled"><div><p class="eyebrow">05 · ${c.collaborateTitle}</p><h2>${c.collaborateTitle}</h2></div><div><p class="lede">${c.collaborate}</p><a class="primary-link" href="/${locale}/support/">${ru ? "Обсудить исследование" : "Discuss a research partnership"} <span aria-hidden="true">→</span></a></div></section></article>`;
  const title = ru ? "Исследовательская программа Metkagram" : "Metkagram research programme for language learning";
  const structuredData = [
    breadcrumbJson(pathname, ru ? "Исследования" : "Research", locale),
    {
      "@context": "https://schema.org",
      "@type": "ResearchProject",
      name: title,
      description: c.intro,
      url: `${SITE_URL}${pathname}`,
      funder: [],
      memberOf: { "@id": `${SITE_URL}/#organization` },
      about: ["second-language learning", "retrieval practice", "functional language annotation", "natural language processing"]
    }
  ];
  return layout({ locale, pathname, title: `${title} | Metkagram`, description: c.intro, body: `${body}${shareBar(locale, pathname, title)}`, pageType: "AboutPage", structuredData });
}

export function ideasPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/ideas/`;
  const c = ru ? {
    eyebrow: "Metkagram · идеи и партнёрства",
    title: "Принесите идею, которую можно проверить.",
    intro: "Если вы видите полезный сценарий для Metkagram, предложите его. Это может быть учебный формат, исследовательский вопрос, новый язык, набор данных или интеграция — начнём с небольшого результата, а не с абстрактного сотрудничества.",
    action: "Предложить идею",
    signalLabel: "Хорошее начало",
    signalTitle: "Одна проблема. Один следующий шаг. Один критерий успеха.",
    ideasTitle: "Где идея может помочь",
    ideas: [
      ["Учебный сценарий", "Конкретная задача учащегося, преподавателя или автора курса, где фразы и паттерны могут сократить путь к применению."],
      ["Исследовательский вопрос", "Гипотеза о разметке, извлечении из памяти или переносе паттернов, которую можно проверить на ясной метрике."],
      ["Язык или контент", "Новая коллекция, язык, набор примеров или редакторская проверка, повышающая качество открытого корпуса."],
      ["Инструмент или интеграция", "Сценарий для Pattern Lens, API, ИИ-агента или учебного продукта с прозрачным происхождением данных."]
    ],
    partnershipsTitle: "Как можно работать вместе",
    partnerships: [
      ["Разбор идеи", "Коротко сопоставим задачу с тем, что уже есть в Metkagram, и определим полезный следующий шаг."],
      ["Ограниченный пилот", "Зафиксируем аудиторию, результат, срок, границы лицензии и критерий успеха до начала работы."],
      ["Исследование или обучение", "Проведём воспроизводимый эксперимент, учебный модуль или проверку качества с явной атрибуцией."],
      ["Данные и технологии", "Проверим интеграцию, экспорт, инструменты качества или новый интерфейс без передачи закрытых данных учащихся."]
    ],
    briefTitle: "Что прислать",
    briefIntro: "Не нужен готовый проектный документ. Достаточно трёх коротких пунктов.",
    brief: [
      ["01", "Контекст", "Кто столкнулся с задачей и что сейчас не работает?"],
      ["02", "Идея", "Какой небольшой результат стоит попробовать получить вместе?"],
      ["03", "Сигнал", "По чему мы поймём, что пилот оказался полезным?"]
    ],
    boundariesTitle: "Границы сотрудничества",
    boundaries: "Основные учебные материалы остаются доступными бесплатно. Партнёры не управляют выводами исследований и редакционными решениями; вклад, лицензия и происхождение данных обозначаются прозрачно.",
    detailsLink: "Форматы партнёрства и финансирования",
    researchLink: "Исследовательская программа",
    roadmapLink: "Открытая дорожная карта"
  } : {
    eyebrow: "Metkagram · ideas and partnerships",
    title: "Bring an idea we can test.",
    intro: "If you see a useful direction for Metkagram, propose it. It might be a learning format, research question, new language, dataset, or integration—we will start with a small outcome instead of a vague collaboration.",
    action: "Propose an idea",
    signalLabel: "A useful starting point",
    signalTitle: "One problem. One next step. One success signal.",
    ideasTitle: "Where an idea can help",
    ideas: [
      ["Learning scenario", "A concrete learner, teacher, or course-author problem where phrases and patterns could shorten the path to use."],
      ["Research question", "A hypothesis about annotation, retrieval, or pattern transfer that can be tested against a clear measure."],
      ["Language or content", "A new collection, language, example set, or editorial review that improves the quality of the open corpus."],
      ["Tool or integration", "A Pattern Lens, API, AI-agent, or learning-product workflow with transparent data provenance."]
    ],
    partnershipsTitle: "Ways to work together",
    partnerships: [
      ["Idea review", "We will match the problem against what already exists in Metkagram and identify a useful next step."],
      ["Bounded pilot", "We will agree on the audience, outcome, time frame, licence boundaries, and success criterion before work begins."],
      ["Research or teaching", "Run a reproducible study, learning module, or quality review with explicit attribution."],
      ["Data and technology", "Test an integration, export, quality tool, or interface without exchanging learner-private data."]
    ],
    briefTitle: "What to send",
    briefIntro: "You do not need a finished project brief. Three short points are enough.",
    brief: [
      ["01", "Context", "Who has the problem, and what is not working today?"],
      ["02", "Idea", "What small outcome should we try to produce together?"],
      ["03", "Signal", "How will we know that the pilot was useful?"]
    ],
    boundariesTitle: "Collaboration boundaries",
    boundaries: "Core learning materials remain free to access. Partners do not control research findings or editorial decisions; contributions, licence terms, and data provenance are made explicit.",
    detailsLink: "Partnership and funding formats",
    researchLink: "Research programme",
    roadmapLink: "Open roadmap"
  };
  const body = `<article class="ideas-page"><section class="ideas-hero section-pad"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p><a class="primary-link" href="/${locale}/contact/">${c.action} <span aria-hidden="true">→</span></a></div><aside class="ideas-signal"><span>${c.signalLabel}</span><strong>${c.signalTitle}</strong></aside></section><section class="ideas-section section-pad ruled" aria-labelledby="ideas-title"><div><p class="eyebrow">01 · ${c.ideasTitle}</p><h2 id="ideas-title">${c.ideasTitle}</h2></div><div class="ideas-card-grid">${c.ideas.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${detail}</p></article>`).join("")}</div></section><section class="ideas-section section-pad ruled" aria-labelledby="partnerships-title"><div><p class="eyebrow">02 · ${c.partnershipsTitle}</p><h2 id="partnerships-title">${c.partnershipsTitle}</h2></div><div class="ideas-card-grid ideas-card-grid--partnerships">${c.partnerships.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${detail}</p></article>`).join("")}</div></section><section class="ideas-brief section-pad ruled"><div><p class="eyebrow">03 · ${c.briefTitle}</p><h2>${c.briefTitle}</h2><p>${c.briefIntro}</p></div><ol>${c.brief.map(([index, title, detail]) => `<li><span>${index}</span><div><h3>${title}</h3><p>${detail}</p></div></li>`).join("")}</ol></section><section class="ideas-boundaries section-pad ruled"><div><p class="eyebrow">04 · ${c.boundariesTitle}</p><h2>${c.boundariesTitle}</h2></div><div><p class="lede">${c.boundaries}</p><nav class="download-list"><a href="/${locale}/support/">${c.detailsLink} →</a><a href="/${locale}/research/">${c.researchLink} →</a><a href="/${locale}/roadmap/">${c.roadmapLink} →</a></nav></div></section></article>`;
  const title = ru ? "Идеи и партнёрства с Metkagram" : "Ideas and partnerships with Metkagram";
  return layout({ locale, pathname, title, description: c.intro, body: `${body}${shareBar(locale, pathname, title)}`, pageType: "AboutPage", structuredData: [breadcrumbJson(pathname, title, locale), { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Metkagram", url: SITE_URL, email: ATTRIBUTION.contact_email }] });
}

export function supportPage(locale, counts) {
  const ru = locale === "ru";
  const pathname = `/${locale}/support/`;
  const c = ru ? {
    eyebrow: "Metkagram · партнёрство и финансирование", title: "Помогите превратить открытый языковой корпус в проверяемую учебную систему.", intro: "Metkagram уже объединяет размеченный контент, повторно используемые паттерны, статический API и приложения. Мы ищем инвесторов и партнёров для проверки метода, редакционного масштабирования и выхода на новые языки — без ложных заявлений о достигнутой аудитории.", snapshotTitle: "Проект сегодня", thesisTitle: "Почему проект может масштабироваться", thesis: [["Структурированный актив", "Ценность хранится не в отдельных страницах, а в версионированном корпусе, схеме разметки и связях между предложениями, паттернами и наборами."], ["Два канала продукта", "Один и тот же материал работает как учебный интерфейс для людей и как машиночитаемый набор данных для агентов и исследователей."], ["Статическая экономика", "Основной сайт работает без runtime-бэкенда: публикация воспроизводима, обслуживание недорого, а контент остаётся доступным офлайн и на GitHub Pages."], ["Локализация по контракту", "Новые языки добавляются через единые поля, валидаторы и fallback на английский, а не через копирование интерфейса вручную."]], prioritiesTitle: "На что пойдёт следующий ресурс", priorities: [["01", "Проверка метода", "Пилотное исследование с заранее зарегистрированными гипотезами, контрольными условиями и открытым отчётом."], ["02", "Редакционное качество", "Лингвистическая проверка корпуса, согласие разметчиков и исправление слабых или искусственных примеров."], ["03", "Новые языки", "Локализационный pipeline, языковые правила и первый дополнительный целевой язык после English и German."], ["04", "Удержание учащихся", "Личные маршруты, активное извлечение и измеримые циклы возвращения к паттернам."]], modelsTitle: "Форматы участия", ways: [["Инвестиционный разговор", "Обсудить финансирование этапа, показатели успеха, структуру сделки и границы открытой части проекта."], ["Исследовательское партнёрство", "Провести учебный или NLP-эксперимент на корпусе с воспроизводимой методикой и явной атрибуцией."], ["Контент и экспертиза", "Помочь с редактурой, лингвистической проверкой, сценариями использования или новыми языковыми коллекциями."], ["Технологическое партнёрство", "Поддержать API, агентские интеграции, инструменты качества данных, доступность или хостинг."]], promiseTitle: "Что остаётся защищённым", promise: ["Основные учебные материалы остаются доступными бесплатно.", "Спонсоры не получают права менять результаты исследований, разметку или рекомендации под свои интересы.", "Партнёрства и вклад обозначаются прозрачно; данные сохраняют происхождение и атрибуцию.", "Показатели аудитории, эффекта и выручки публикуются только тогда, когда их можно подтвердить."], contactTitle: "Начнём с конкретного предложения", contact: "Откройте контакты Metkagram и выберите email или LinkedIn. Укажите, кто вы, какой ресурс или компетенцию предлагаете и какой результат хотите получить — в ответ мы предложим подходящий этап, артефакт и показатель успеха.", contactLink: "Обсудить инвестиции или партнёрство", sourceLink: "Проверить открытый репозиторий"
  } : {
    eyebrow: "Metkagram · partnerships and funding", title: "Turn an open language corpus into a testable learning system.", intro: "Metkagram already combines annotated content, reusable patterns, a static API and mobile apps. We are looking for investors and partners to validate the method, scale editorial quality and expand to new languages—without inventing traction claims.", snapshotTitle: "Project snapshot", thesisTitle: "Why this can compound", thesis: [["Structured asset", "Value lives beyond individual pages in a versioned corpus, annotation schema and links between sentences, patterns and study sets."], ["Two product surfaces", "The same material works as a learning interface for people and as machine-readable data for agents and researchers."], ["Static economics", "The core site needs no runtime backend: publication is reproducible, maintenance stays lean, and content remains available on GitHub Pages."], ["Localization by contract", "New languages can enter through shared fields, validators and English fallback rules instead of copied interfaces."]], prioritiesTitle: "What the next resources unlock", priorities: [["01", "Method validation", "A preregistered pilot with comparison conditions, defined outcomes and a public report."], ["02", "Editorial quality", "Linguistic review, inter-annotator agreement and correction of weak or artificial examples."], ["03", "New languages", "A localization pipeline, language-specific rules and the first target language beyond English and German."], ["04", "Learner retention", "Personal paths, active retrieval and measurable return loops around useful patterns."]], modelsTitle: "Ways to participate", ways: [["Investment conversation", "Discuss milestone funding, success measures, deal structure and the boundary of the open project."], ["Research partnership", "Run a learning or NLP experiment on the corpus with a reproducible approach and clear attribution."], ["Content and expertise", "Contribute editorial work, linguistic review, use cases or new language collections."], ["Technology partnership", "Support API access, agent integrations, data-quality tooling, accessibility or hosting."]], promiseTitle: "What stays protected", promise: ["Core learning materials remain free to access.", "Sponsors do not receive the right to alter research findings, annotations or recommendations for their own interests.", "Partnerships and contributions are acknowledged transparently; data keeps its provenance and attribution.", "Audience, efficacy and revenue metrics are published only when they can be verified."], contactTitle: "Start with a concrete proposal", contact: "Open Metkagram contact options and choose email or LinkedIn. Tell us who you are, the resource or expertise you can contribute and the outcome you want; we will reply with a suitable milestone, artifact and measure of success.", contactLink: "Discuss investment or partnership", sourceLink: "Inspect the open repository"
  };
  const metrics = projectMetrics(counts, locale);
  const body = `<section class="partner-hero section-pad"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p><a class="primary-link" href="/${locale}/contact/">${c.contactLink} <span aria-hidden="true">→</span></a></div><dl class="project-metrics" aria-label="${c.snapshotTitle}">${metrics.map(([, value, label]) => `<div><dt>${value}</dt><dd>${label}</dd></div>`).join("")}</dl></section><section class="partner-thesis section-pad ruled"><div><p class="eyebrow">01 · ${c.thesisTitle}</p><h2>${c.thesisTitle}</h2></div><div>${c.thesis.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${detail}</p></div></article>`).join("")}</div></section><section class="partner-priorities section-pad ruled"><div><p class="eyebrow">02 · ${c.prioritiesTitle}</p><h2>${c.prioritiesTitle}</h2></div><ol>${c.priorities.map(([index, title, detail]) => `<li><span>${index}</span><div><h3>${title}</h3><p>${detail}</p></div></li>`).join("")}</ol></section><section class="support-ways section-pad ruled"><div><p class="eyebrow">03 · ${c.modelsTitle}</p><h2>${c.modelsTitle}</h2></div><div>${c.ways.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${detail}</p></div></article>`).join("")}</div></section><section class="support-promise section-pad ruled"><div><p class="eyebrow">04 · ${c.promiseTitle}</p><h2>${c.promiseTitle}</h2></div><ul>${c.promise.map((item) => `<li>${item}</li>`).join("")}</ul></section><section class="support-contact section-pad ruled"><div><p class="eyebrow">05 · ${c.contactTitle}</p><h2>${c.contactTitle}</h2></div><div><p class="lede">${c.contact}</p><nav class="download-list"><a href="/${locale}/contact/">${ru ? "Открыть контакты" : "Open contact options"} →</a><a href="${ATTRIBUTION.contact_url}" target="_blank" rel="noreferrer">${ru ? "LinkedIn MetalHatsCats" : "MetalHatsCats on LinkedIn"} ↗</a><a href="/${locale}/research/">${ru ? "Открыть исследовательскую программу" : "Read the research programme"} →</a><a href="${ATTRIBUTION.source_repository}">${c.sourceLink} ↗</a></nav></div></section>`;
  const title = ru ? "Партнёрство и инвестиции в Metkagram" : "Partner with Metkagram: investment, research and language data";
  return layout({ locale, pathname, title, description: c.intro, body: `${body}${shareBar(locale, pathname, c.title)}`, pageType: "AboutPage", structuredData: [breadcrumbJson(pathname, c.title, locale), { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Metkagram", url: SITE_URL, knowsAbout: ["Language learning", "Functional language annotation", "Natural language processing", "Open educational data"] }] });
}

export function contactPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/contact/`;
  const c = ru ? {
    eyebrow: "Metkagram · контакты", title: "Начнём с ясного вопроса.", intro: "Напишите о задаче, которая стоит перед вами: обучение, исследование, язык, данные или агентская интеграция. Мы подскажем подходящую точку входа в Metkagram.", channelsTitle: "Выберите удобный канал", emailTitle: "Написать по email", emailDetail: "Лучший путь для конкретного запроса, партнёрства или предложения. Откроется ваше почтовое приложение.", emailAction: "Открыть письмо", linkedinTitle: "Написать в LinkedIn", linkedinDetail: "Подходит для первого профессионального контакта с командой MetalHatsCats.", linkedinAction: "Открыть LinkedIn", preparationTitle: "Чтобы ответ был полезным", preparation: [["01", "Контекст", "Коротко опишите, кто вы и какую задачу решаете."], ["02", "Нужный результат", "Укажите, что хотите обсудить: изучение языка, данные, исследование, партнёрство или AI‑интеграцию."], ["03", "Следующий шаг", "Добавьте ссылку, срок или удобный формат разговора, если они уже известны."]], note: "Не добавляйте в письмо приватные данные учащихся или ключи доступа."
  } : {
    eyebrow: "Metkagram · contact", title: "Start with a clear question.", intro: "Tell us about the work in front of you: learning, research, language, data, or an agent integration. We will point you to the right place to begin with Metkagram.", channelsTitle: "Choose the channel that fits", emailTitle: "Write by email", emailDetail: "Best for a specific question, partnership, or proposal. It opens your email app.", emailAction: "Open an email", linkedinTitle: "Message on LinkedIn", linkedinDetail: "A good route for a first professional conversation with the MetalHatsCats team.", linkedinAction: "Open LinkedIn", preparationTitle: "Help us give a useful answer", preparation: [["01", "Context", "Briefly say who you are and what you are trying to do."], ["02", "Desired outcome", "Name the topic: language learning, data, research, partnership, or an AI integration."], ["03", "Next step", "Add a link, time frame, or preferred conversation format if you already have one."],], note: "Please do not include learner-private data or access keys in your message."
  };
  const subject = encodeURIComponent(ru ? "Запрос по Metkagram" : "Metkagram inquiry");
  const body = `<article class="contact-page"><section class="contact-hero section-pad"><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="lede">${c.intro}</p></section><section class="contact-channels section-pad ruled" aria-labelledby="contact-channels-title"><div><p class="eyebrow">01 · ${c.channelsTitle}</p><h2 id="contact-channels-title">${c.channelsTitle}</h2></div><div class="contact-channel-grid"><a class="contact-channel contact-channel--email" href="mailto:${ATTRIBUTION.contact_email}?subject=${subject}"><span class="contact-channel-index">01</span><h3>${c.emailTitle}</h3><p>${c.emailDetail}</p><strong>${ATTRIBUTION.contact_email} <i aria-hidden="true">→</i></strong><small>${c.emailAction}</small></a><a class="contact-channel contact-channel--linkedin" href="${ATTRIBUTION.contact_url}" target="_blank" rel="noreferrer"><span class="contact-channel-index">02</span><h3>${c.linkedinTitle}</h3><p>${c.linkedinDetail}</p><strong>MetalHatsCats <i aria-hidden="true">↗</i></strong><small>${c.linkedinAction}</small></a></div></section><section class="contact-preparation section-pad ruled"><div><p class="eyebrow">02 · ${c.preparationTitle}</p><h2>${c.preparationTitle}</h2></div><ol>${c.preparation.map(([index, title, detail]) => `<li><span>${index}</span><div><h3>${title}</h3><p>${detail}</p></div></li>`).join("")}</ol><p class="contact-note">${c.note}</p></section></article>`;
  return layout({ locale, pathname, title: ru ? "Контакты Metkagram" : "Contact Metkagram", description: c.intro, body: `${body}${shareBar(locale, pathname, ru ? "Контакты Metkagram" : "Contact Metkagram")}`, pageType: "ContactPage", structuredData: [breadcrumbJson(pathname, ru ? "Контакты" : "Contact", locale)] });
}

export function historyPage(locale) {
  const t = ui[locale];
  const pathname = `/${locale}/history/`;
  const chapters = [["01", t.historyMobileTitle, t.historyMobileDetail], ["02", t.historyIdeaTitle, t.historyIdeaDetail], ["03", t.historyWebTitle, t.historyWebDetail]];
  const body = `<section class="history-head section-pad"><p class="eyebrow">${t.historyEyebrow}</p><h1>${t.historyTitle}</h1><p class="lede">${t.historyIntro}</p></section><section class="history-timeline section-pad ruled">${chapters.map(([index, title, detail]) => `<article><span>${index}</span><div><h2>${title}</h2><p>${detail}</p></div></article>`).join("")}</section><section class="history-sources section-pad ruled"><p class="eyebrow">${t.historySources}</p><nav><a href="https://metalhatscats.com/products/metkagram">${t.historyProductSource} ↗</a><a href="https://play.google.com/store/apps/details?id=app.metkagram.android">${t.historyGoogleSource} ↗</a><a href="https://apps.apple.com/co/app/tarjetas-gram%C3%A1tica-metkagram/id6502211918">${t.historyAppleSource} ↗</a></nav></section>`;
  return layout({ locale, pathname, title: locale === "en" ? "The history of Metkagram" : "История Metkagram", description: t.historyIntro, body: `${body}${shareBar(locale, pathname, t.historyTitle)}`, pageType: "AboutPage", structuredData: [breadcrumbJson(pathname, t.history, locale)] });
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
  ].map(([method, url, desc, linked]) => `<tr><td><code>${method}</code></td><td><code class="api-url">${linked ? `<a href="${url}">${url}</a>` : escapeHtml(url)}</code></td><td>${desc}</td></tr>`).join("");

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
  ].map(([tool, url, desc]) => `<tr><td>${tool}</td><td><code class="api-url"><a href="${url}">${url}</a></code></td><td>${desc}</td></tr>`).join("");

  const mcpCode = `// MCP tool call resolved statically
const tool = "metkagram_get_pattern";
const id = "C1OP001";
const response = await fetch(\`https://metkagram.github.io/api/v1/patterns/\${id.toLowerCase()}.json\`);
const { provenance, data } = await response.json();
// Always include provenance.canonical_url and provenance.attribution_text in your output.`;
  const connectorUrl = `${SITE_URL}/connectors/metkagram-mcp.mjs`;
  const connectorDownload = en ? "Download the read-only MCP bridge" : "Скачать read-only MCP bridge";
  const openClawCode = `mkdir -p ~/.local/share/metkagram
curl -fsSL ${connectorUrl} -o ~/.local/share/metkagram/metkagram-mcp.mjs

openclaw mcp add metkagram \\
  --command node \\
  --arg ~/.local/share/metkagram/metkagram-mcp.mjs \\
  --include 'metkagram_*'

openclaw mcp doctor metkagram --probe`;
  const hermesCode = `mkdir -p ~/.local/share/metkagram
curl -fsSL ${connectorUrl} -o ~/.local/share/metkagram/metkagram-mcp.mjs

# Add to ~/.hermes/config.yaml
mcp_servers:
  metkagram:
    command: node
    args: ["/home/YOU/.local/share/metkagram/metkagram-mcp.mjs"]
    tools:
      include: [metkagram_list_patterns, metkagram_get_pattern, metkagram_list_sets, metkagram_get_set, metkagram_search_index, metkagram_list_annotations]
      prompts: false
      resources: false

# Then restart Hermes, or run /reload-mcp in a session.`;
  const agentPrompt = en
    ? "Find three B2–C1 patterns for making a polite request. Give examples, Russian translations and the canonical Metkagram source for each."
    : "Найди три паттерна B2–C1 для вежливой просьбы. Дай примеры, переводы на русский и канонический источник Metkagram для каждого.";

  const body = `<section class="page-head section-pad ai-page-head"><p class="eyebrow">${t.forAiDevelopers}</p><h1>${title}</h1><p class="lede">${intro}</p><div class="ai-status" aria-label="API entry points"><a href="${API_URL}/index.json"><span>API index</span><code>${API_URL}/index.json</code></a><a href="${API_URL}/openapi.json"><span>OpenAPI</span><code>${API_URL}/openapi.json</code></a><a href="${API_URL}/mcp-server.json"><span>MCP</span><code>${API_URL}/mcp-server.json</code></a></div></section>

<section class="ai-section section-pad ruled" id="datasets"><div><p class="eyebrow">01 · ${t.aiDatasets}</p><h2>${t.aiDatasets}</h2></div><div class="dataset-grid">${datasets}</div></section>

<section class="ai-section section-pad ruled" id="endpoints"><div><p class="eyebrow">02 · ${t.aiEndpoints}</p><h2>${t.aiEndpoints}</h2></div><div class="table-wrap"><table class="endpoint-table"><thead><tr><th>${en ? "Method" : "Метод"}</th><th>${en ? "URL" : "URL"}</th><th>${en ? "Description" : "Описание"}</th></tr></thead><tbody>${endpointRows}</tbody></table></div></section>

<section class="ai-section section-pad ruled" id="attribution"><div><p class="eyebrow">03 · ${t.aiAttribution}</p><h2>${t.aiAttribution}</h2></div><div class="ai-columns"><article><h3>${en ? "Required attribution" : "Обязательная атрибуция"}</h3><ul><li>${en ? "Keep the name" : "Сохраняйте название"} <strong>Metkagram</strong>.</li><li>${en ? "Link to" : "Ссылка на"} <a href="${SITE_URL}">${SITE_URL}</a>.</li><li>${en ? "Credit" : "Указывайте"} <a href="${ATTRIBUTION.creator_url}">${ATTRIBUTION.creator}</a> ${en ? "and" : "и"} <a href="${ATTRIBUTION.maintainer_url}">${ATTRIBUTION.maintainer}</a>.</li><li>${en ? "State the dataset version" : "Указывайте версию датасета"}: <code>${getDatasetVersion()}</code>.</li><li>${en ? "Link back to the canonical page for every record shown." : "Давайте обратную ссылку на каноническую страницу каждой показанной записи."}</li></ul></article><article><h3>${en ? "Copy-paste citations" : "Готовые цитаты"}</h3><dl class="citation-list"><div><dt>${en ? "Web / app" : "Веб / приложение"}</dt><dd><code>${citeWeb}</code></dd></div><div><dt>${en ? "Academic" : "Академическая"}</dt><dd><code>${citeAcademic}</code></dd></div><div><dt>${en ? "AI-generated answer" : "Ответ ИИ"}</dt><dd><code>${citeAi}</code></dd></div></dl></article></div><p class="legal-note"><a href="${API_URL}/attribution.json">${en ? "Machine-readable attribution policy" : "Машиночитаемая политика атрибуции"}</a> · <a href="/LICENSE">CC BY-NC 4.0</a></p></section>

<section class="ai-section section-pad ruled" id="agents"><div><p class="eyebrow">04 · ${t.aiAgents}</p><h2>${t.aiAgents}</h2></div><div class="table-wrap"><table class="endpoint-table"><thead><tr><th>${en ? "Tool" : "Инструмент"}</th><th>${en ? "Entry point" : "Точка входа"}</th><th>${en ? "How to use" : "Как использовать"}</th></tr></thead><tbody>${agentExamples}</tbody></table></div></section>

<section class="ai-section section-pad ruled" id="mcp"><div><p class="eyebrow">05 · ${t.aiMcp}</p><h2>${t.aiMcp}</h2></div><p class="lede">${en ? "No backend server is required. The MCP specification maps tool names to static URLs. Your client fetches the JSON directly from GitHub Pages." : "Бэкенд-сервер не требуется. Спецификация MCP сопоставляет имена инструментов со статическими URL. Ваш клиент загружает JSON напрямую с GitHub Pages."}</p><pre class="code-block"><code>${escapeHtml(mcpCode)}</code></pre><p><a href="${API_URL}/mcp-server.json">${en ? "Download MCP server specification" : "Скачать спецификацию MCP"}</a></p></section>

<section class="ai-section section-pad ruled" id="connectors"><div><p class="eyebrow">06 · ${en ? "Agent connectors" : "Коннекторы для агентов"}</p><h2>${en ? "Connect Metkagram to OpenClaw or Hermes" : "Подключите Metkagram к OpenClaw или Hermes"}</h2></div><p class="lede">${en ? "Use the included read-only stdio bridge. It turns the public static API into MCP tools, requires Node.js 18+ and no API key, and always returns the dataset provenance." : "Используйте встроенный read-only bridge для stdio. Он превращает публичный статический API в MCP-инструменты, требует Node.js 18+ и не требует API-ключа; каждый ответ сохраняет происхождение данных."}</p><div class="ai-columns"><article><h3>OpenClaw</h3><ol><li>${en ? "Download the bridge and register it as a local MCP server." : "Скачайте bridge и зарегистрируйте его как локальный MCP-сервер."}</li><li>${en ? "Use the probe to confirm that the six read-only tools are visible." : "Проверьте через probe, что доступны шесть read-only инструментов."}</li></ol><pre class="code-block"><code>${escapeHtml(openClawCode)}</code></pre><p><a href="https://docs.openclaw.ai/cli/mcp">${en ? "OpenClaw MCP reference" : "Справка OpenClaw MCP"} ↗</a></p></article><article><h3>Hermes</h3><ol><li>${en ? "Download the same bridge, then add the shown block to the MCP configuration." : "Скачайте тот же bridge и добавьте показанный блок в конфигурацию MCP."}</li><li>${en ? "Replace /home/YOU with the absolute path on the machine running Hermes." : "Замените /home/YOU на абсолютный путь на машине, где работает Hermes."}</li></ol><pre class="code-block"><code>${escapeHtml(hermesCode)}</code></pre><p><a href="https://hermes.dhuar.com/en/user-guide/features/mcp/">${en ? "Hermes MCP reference" : "Справка Hermes MCP"} ↗</a></p></article></div><p class="legal-note">${en ? "The connector exposes only read operations. Preserve Metkagram attribution and the canonical URL when an agent presents a record." : "Коннектор открывает только read-операции. Когда агент показывает запись, сохраните атрибуцию Metkagram и канонический URL."}</p><nav class="download-list"><a href="${connectorUrl}">${connectorDownload}</a><a href="${API_URL}/mcp-server.json">${en ? "Inspect tool specification" : "Посмотреть спецификацию инструментов"}</a></nav><h3>${en ? "Try it" : "Попробуйте"}</h3><pre class="code-block"><code>${escapeHtml(agentPrompt)}</code></pre></section>

<section class="ai-section section-pad ruled" id="downloads"><div><p class="eyebrow">07 · ${t.aiDownloads}</p><h2>${t.aiDownloads}</h2></div><nav class="download-list"><a href="${API_URL}/download/full-patterns.json">${en ? "Full patterns JSON" : "Все паттерны JSON"}</a><a href="${API_URL}/patterns.json">${en ? "Patterns API response" : "API-ответ паттернов"}</a><a href="${API_URL}/sets.json">${en ? "Study sets JSON" : "Учебные наборы JSON"}</a><a href="${API_URL}/search-index.json">${en ? "Search index JSON" : "Поисковый индекс JSON"}</a><a href="${API_URL}/openapi.json">${en ? "OpenAPI JSON" : "OpenAPI JSON"}</a><a href="${API_URL}/mcp-server.json">${en ? "MCP spec JSON" : "MCP JSON"}</a></nav></section>

<section class="ai-section section-pad ruled" id="collaborate"><div><p class="eyebrow">08 · ${t.aiCollaborate}</p><h2>${t.aiCollaborate}</h2></div><p class="lede">${en ? "We welcome research, teaching, content and language-data collaborations that keep attribution intact." : "Мы приветствуем исследовательские, образовательные, контентные и языковые проекты с сохранением атрибуции."}</p><nav class="download-list"><a href="${ATTRIBUTION.contact_url}" target="_blank" rel="noreferrer">${en ? "Contact MetalHatsCats" : "Связаться с MetalHatsCats"}</a><a href="${ATTRIBUTION.source_repository}">${en ? "GitHub repository" : "Репозиторий GitHub"}</a></nav></section>`;

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

  return layout({ locale, pathname, title: `${title} — Metkagram`, description: intro, body: `${body}${shareBar(locale, pathname, title)}`, structuredData });
}

export function gatewayPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Metkagram</title>
  <meta name="description" content="Phrase-first language annotation and reusable patterns for deliberate practice.">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${SITE_URL}/en/">
  <link rel="alternate" hreflang="en" href="${SITE_URL}/en/">
  <link rel="alternate" hreflang="ru" href="${SITE_URL}/ru/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/">
  <script>
    const preferredLocale = (navigator.languages || [navigator.language || "en"])
      .some((language) => String(language).toLowerCase().startsWith("ru")) ? "ru" : "en";
    location.replace("/" + preferredLocale + "/");
  </script>
  <meta http-equiv="refresh" content="0;url=/en/">
</head>
<body>
  <p><a href="/en/">Open Metkagram</a> · <a href="/ru/" lang="ru">Открыть Metkagram</a></p>
</body>
</html>`;
}

export function notFoundPage(locale = "en") {
  const t = ui[locale];
  return layout({ locale, pathname: "/404.html", notFound: true, title: `${t.notFound} — Metkagram`, description: t.notFoundText, body: `<section class="page-head section-pad"><p class="eyebrow">404</p><h1>${t.notFound}</h1><p class="lede">${t.notFoundText}</p><a class="text-link" href="/${locale}/">← ${t.home}</a></section>` });
}
