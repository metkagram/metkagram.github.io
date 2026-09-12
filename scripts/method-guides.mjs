import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout } from "../src/render.mjs";
import {
  METHOD_GUIDE_CATEGORIES,
  METHOD_GUIDE_COUNT,
  METHOD_GUIDE_LOCALES,
  loadMethodGuides,
} from "../src/method-guides.mjs";
import { SITE_URL } from "../src/site.mjs";

const DIST = path.resolve("dist");
const { guides, sources } = loadMethodGuides();
const guideById = new Map(guides.map((guide) => [guide.id, guide]));
const sourceById = new Map(sources.map((source) => [source.id, source]));

const COPY = {
  en: {
    eyebrow: "Mark–Frame Method",
    hubTitle: "How Metkagram Turns Sentences into Reusable Language",
    hubDescription: "A research-aware guide to the Metkagram Mark–Frame Method: visual Marks, annotated reading, sentence Frames, communicative Moves, retrieval, spacing and transfer.",
    hubIntro: "Metkagram starts with meaningful language and tries to make reusable structure easier to see, compare, retrieve and reuse. This guide collection explains the method, a practical annotated-reading path, the research traditions that inform its design, the pattern sets built on top of it and the boundaries of what the project can currently claim.",
    count: `${METHOD_GUIDE_COUNT} guides · ${METHOD_GUIDE_COUNT * METHOD_GUIDE_LOCALES.length} localized articles`,
    researchLabel: "Research context",
    evidenceLabel: "Evidence boundary",
    evidence: "The studies cited here concern component mechanisms or adjacent language-learning research. They do not establish a learning outcome for the complete Metkagram method.",
    takeaway: "Keep this",
    related: "Continue with",
    back: "All method guides",
    open: "Read guide",
    methodLink: "Explore the full method guide",
    methodPreviewTitle: "Explore the method beyond the overview",
    methodPreviewText: "Focused guides connect the Mark–Frame workflow to annotated reading, practical pattern study, learning research, cross-language transfer and honest comparisons with other study formats.",
    sourceNote: "Metkagram separates product design, research rationale, hypotheses and direct evidence. Sources below support the research context described on this page, not an efficacy claim for the complete product.",
    categories: {
      foundations: ["Method foundations", "Start with the objects: Marks, Frames, Moves, Contrasts and the complete learning loop."],
      "learning-science": ["Learning science around the method", "See how noticing, formulaic language, retrieval, spacing and variation inform the design without becoming product-level proof."],
      "annotated-reading": ["Annotated reading", "Read the sentence first, use selective Marks to inspect structure, then fade the support and reuse the Frame without the cue."],
      practice: ["How to practise", "Turn a real sentence or focused set into a short repeatable learning routine."],
      transfer: ["Transfer and multilingual reuse", "Move a Frame into speech, new contexts and other languages without reducing everything to literal translation."],
      comparisons: ["Useful comparisons", "Understand where Frames differ from flashcards, grammar apps, isolated words and generated AI tutoring."],
    },
  },
  ru: {
    eyebrow: "Метод Mark–Frame",
    hubTitle: "Как Metkagram превращает предложения в повторно используемый язык",
    hubDescription: "Исследовательский гид по Metkagram Mark–Frame Method: визуальные Marks, чтение с разметкой, sentence Frames, Moves, retrieval, spacing и transfer.",
    hubIntro: "Metkagram начинает с осмысленного языка и старается сделать повторяемую структуру видимой, сравнимой, доступной из памяти и пригодной для новой ситуации. Этот кластер объясняет сам метод, отдельную траекторию чтения с разметкой, исследовательские традиции вокруг дизайна, практические сеты и границы того, что проект сейчас может утверждать.",
    count: `${METHOD_GUIDE_COUNT} тем · ${METHOD_GUIDE_COUNT * METHOD_GUIDE_LOCALES.length} локализованных статей`,
    researchLabel: "Исследовательский контекст",
    evidenceLabel: "Граница доказательности",
    evidence: "Приведённые исследования относятся к отдельным механизмам или соседним направлениям изучения языка. Они не устанавливают учебный эффект полного метода Metkagram.",
    takeaway: "Что оставить с собой",
    related: "Что читать дальше",
    back: "Все статьи о методе",
    open: "Читать",
    methodLink: "Открыть полный гид по методу",
    methodPreviewTitle: "Метод глубже одной обзорной страницы",
    methodPreviewText: "Сфокусированные темы связывают Mark–Frame workflow с чтением по разметке, практикой паттернов, исследованиями обучения, межъязыковым переносом и честным сравнением других форматов.",
    sourceNote: "Metkagram разделяет дизайн продукта, исследовательское обоснование, гипотезы и прямые доказательства. Источники ниже поддерживают исследовательский контекст страницы, а не claim об эффективности всего продукта.",
    categories: {
      foundations: ["Основа метода", "Начните с объектов метода: Marks, Frames, Moves, Contrasts и полного учебного цикла."],
      "learning-science": ["Наука об обучении вокруг метода", "Разбираем noticing, formulaic language, retrieval, spacing и variation без превращения исследований компонентов в доказательство всего продукта."],
      "annotated-reading": ["Чтение с разметкой", "Сначала читаем предложение, затем используем выборочные Marks, чтобы увидеть структуру, после чего убираем подсказку и используем Frame самостоятельно."],
      practice: ["Как практиковаться", "Превращаем реальное предложение или фокусный сет в короткий повторяемый учебный цикл."],
      transfer: ["Transfer и многоязычный reuse", "Переносим Frame в речь, новые контексты и другие языки без сведения всего к буквальному переводу."],
      comparisons: ["Полезные сравнения", "Смотрим, чем Frames отличаются от flashcards, grammar apps, отдельных слов и генеративных AI-тьюторов."],
    },
  },
};

function route(locale, guide) {
  return `/${locale}/method/guides/${guide.slug}/`;
}

function hubRoute(locale) {
  return `/${locale}/method/guides/`;
}

function writeRoute(pathname, html) {
  const directory = path.join(DIST, pathname.replace(/^\//, ""));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), html);
}

function withStyles(html) {
  if (html.includes('href="/assets/method-guides.css"')) return html;
  return html.replace("</head>", '  <link rel="stylesheet" href="/assets/method-guides.css">\n</head>');
}

function sourceList(guide) {
  return guide.source_ids.map((id) => sourceById.get(id)).filter(Boolean);
}

function renderSources(locale, guide) {
  const c = COPY[locale];
  const items = sourceList(guide).map((source) => `<li><a href="${escapeHtml(source.url)}" rel="external noopener">${escapeHtml(source.authors)} (${escapeHtml(source.year)}) · ${escapeHtml(source.title)}</a>${source.venue ? `<span>${escapeHtml(source.venue)}</span>` : ""}</li>`).join("");
  return `<aside class="guide-research" aria-labelledby="research-${guide.id}">
    <p class="eyebrow">${escapeHtml(c.researchLabel)}</p>
    <h2 id="research-${guide.id}">${escapeHtml(c.researchLabel)}</h2>
    <p>${escapeHtml(c.sourceNote)}</p>
    <ul>${items}</ul>
  </aside>`;
}

function renderArticle(locale, guide) {
  const c = COPY[locale];
  const copy = guide.locales[locale];
  const sections = copy.sections.map((section) => `<section class="guide-section">
    <h2>${escapeHtml(section.heading)}</h2>
    ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    ${Array.isArray(section.bullets) && section.bullets.length ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    ${section.example ? `<div class="guide-example">${escapeHtml(section.example)}</div>` : ""}
  </section>`).join("");
  const related = guide.related.map((id) => guideById.get(id)).filter(Boolean).map((item) => `<a class="guide-related-card" href="${route(locale, item)}"><span>${escapeHtml(COPY[locale].categories[item.category][0])}</span><strong>${escapeHtml(item.locales[locale].title)}</strong></a>`).join("");
  const body = `<main id="content" class="method-guide-page">
    <section class="guide-hero section-pad">
      <a class="guide-back" href="${hubRoute(locale)}">← ${escapeHtml(c.back)}</a>
      <p class="eyebrow">${escapeHtml(c.categories[guide.category][0])}</p>
      <h1>${escapeHtml(copy.title)}</h1>
      <p class="guide-lede">${escapeHtml(copy.intro)}</p>
    </section>
    <article class="guide-layout section-pad">
      <div class="guide-prose">
        ${sections}
        <aside class="guide-takeaway"><span>${escapeHtml(c.takeaway)}</span><p>${escapeHtml(copy.takeaway)}</p></aside>
        <aside class="guide-evidence"><strong>${escapeHtml(c.evidenceLabel)}</strong><p>${escapeHtml(c.evidence)}</p></aside>
        ${renderSources(locale, guide)}
      </div>
      <aside class="guide-side" aria-label="${escapeHtml(c.related)}">
        <p class="eyebrow">${escapeHtml(c.related)}</p>
        ${related}
      </aside>
    </article>
  </main>`;

  return withStyles(layout({
    locale,
    pathname: route(locale, guide),
    title: copy.title,
    description: copy.description,
    body,
    type: "article",
    pageType: "Article",
    bodyClass: "method-guide-document",
  }));
}

function renderHub(locale) {
  const c = COPY[locale];
  const categorySections = METHOD_GUIDE_CATEGORIES.map((category) => {
    const [label, description] = c.categories[category];
    const cards = guides.filter((guide) => guide.category === category).map((guide) => `<a class="guide-card" href="${route(locale, guide)}">
      <span>${escapeHtml(label)}</span>
      <h3>${escapeHtml(guide.locales[locale].title)}</h3>
      <p>${escapeHtml(guide.locales[locale].description)}</p>
      <b>${escapeHtml(c.open)} →</b>
    </a>`).join("");
    return `<section id="${category}" class="guide-cluster-section section-pad">
      <header><p class="eyebrow">${escapeHtml(label)}</p><h2>${escapeHtml(label)}</h2><p>${escapeHtml(description)}</p></header>
      <div class="guide-grid">${cards}</div>
    </section>`;
  }).join("");

  const body = `<main id="content" class="method-guide-hub">
    <section class="guide-hero guide-hub-hero section-pad">
      <p class="eyebrow">${escapeHtml(c.eyebrow)}</p>
      <h1>${escapeHtml(c.hubTitle)}</h1>
      <p class="guide-lede">${escapeHtml(c.hubIntro)}</p>
      <p class="guide-count">${escapeHtml(c.count)}</p>
      <nav class="guide-category-nav" aria-label="${escapeHtml(c.hubTitle)}">${METHOD_GUIDE_CATEGORIES.map((category) => `<a href="#${category}">${escapeHtml(c.categories[category][0])}</a>`).join("")}</nav>
    </section>
    <section class="guide-evidence guide-hub-evidence section-pad"><strong>${escapeHtml(c.evidenceLabel)}</strong><p>${escapeHtml(c.evidence)}</p></section>
    ${categorySections}
  </main>`;

  return withStyles(layout({
    locale,
    pathname: hubRoute(locale),
    title: c.hubTitle,
    description: c.hubDescription,
    body,
    pageType: "CollectionPage",
    bodyClass: "method-guide-index",
  }));
}

function enhanceMethodPage(locale) {
  const relative = path.join(locale, "method", "index.html");
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) throw new Error(`Method page missing before guide enhancement: ${relative}`);
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('id="method-guide-cluster"')) return;
  const c = COPY[locale];
  const featuredIds = ["method-overview", "visual-marks", "annotated-reading-overview", "retrieval-practice", "topic-sets", "evidence-boundary"];
  const featured = featuredIds.map((id) => guideById.get(id)).map((guide) => `<a href="${route(locale, guide)}"><strong>${escapeHtml(guide.locales[locale].title)}</strong><span>${escapeHtml(guide.locales[locale].description)}</span></a>`).join("");
  const section = `<section id="method-guide-cluster" class="method-guide-preview section-pad"><p class="eyebrow">${escapeHtml(c.eyebrow)}</p><h2>${escapeHtml(c.methodPreviewTitle)}</h2><p>${escapeHtml(c.methodPreviewText)}</p><div>${featured}</div><a class="method-guide-preview-all" href="${hubRoute(locale)}">${escapeHtml(c.methodLink)} →</a></section>`;
  if (!html.includes("</main>")) throw new Error(`Method page has no </main> marker: ${relative}`);
  html = html.replace("</main>", `${section}</main>`);
  html = withStyles(html);
  fs.writeFileSync(file, html);
}

for (const locale of METHOD_GUIDE_LOCALES) {
  writeRoute(hubRoute(locale), renderHub(locale));
  for (const guide of guides) writeRoute(route(locale, guide), renderArticle(locale, guide));
  enhanceMethodPage(locale);
}

const exportPayload = {
  schema_version: "1.0.0",
  canonical_hub: `${SITE_URL}/en/method/guides/`,
  localized_page_count: guides.length * METHOD_GUIDE_LOCALES.length,
  guide_count: guides.length,
  evidence_boundary: "Research sources support component mechanisms or adjacent research context; Metkagram currently makes no efficacy claim for the complete method.",
  guides: guides.map((guide) => ({
    id: guide.id,
    slug: guide.slug,
    category: guide.category,
    source_ids: guide.source_ids,
    related: guide.related,
    routes: Object.fromEntries(METHOD_GUIDE_LOCALES.map((locale) => [locale, route(locale, guide)])),
    titles: Object.fromEntries(METHOD_GUIDE_LOCALES.map((locale) => [locale, guide.locales[locale].title])),
  })),
  sources,
};
fs.mkdirSync(path.join(DIST, "data"), { recursive: true });
fs.writeFileSync(path.join(DIST, "data", "method-guides.json"), `${JSON.stringify(exportPayload, null, 2)}\n`);

process.stdout.write(`Method guide cluster: ${guides.length} concepts, ${guides.length * METHOD_GUIDE_LOCALES.length} localized article pages, ${METHOD_GUIDE_LOCALES.length} hubs.\n`);
