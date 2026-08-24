import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { ATTRIBUTION, getDatasetVersion, wrapRecord } from "../src/provenance.mjs";
import { citationFormats, corpusLanguages } from "../src/release.mjs";
import { interfaceLocales, translationLocales } from "../src/language-registry.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API = `${SITE_URL}/api/v1`;

function full(relative) {
  return path.join(DIST, relative);
}

function read(relative) {
  return fs.readFileSync(full(relative), "utf8");
}

function readJson(relative) {
  return JSON.parse(read(relative));
}

function write(relative, content) {
  const file = full(relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function patch(relative, mutate) {
  const before = read(relative);
  const after = mutate(before);
  if (after !== before) write(relative, after);
}

function patchJson(relative, mutate) {
  patch(relative, (text) => {
    const value = JSON.parse(text);
    mutate(value);
    return `${JSON.stringify(value, null, 2)}\n`;
  });
}

const patternsPayload = readJson("api/v1/patterns.json");
const patternRecords = Array.isArray(patternsPayload.data) ? patternsPayload.data : [];
if (!patternRecords.length) throw new Error("Publication layer requires public pattern records");

const publication = {
  schemaVersion: 1,
  title: "Metkagram Language Pattern Corpus",
  datasetVersion: getDatasetVersion(),
  releaseDate: SITE_RELEASE_DATE,
  canonicalSite: SITE_URL,
  repository: ATTRIBUTION.source_repository,
  languages: {
    learning: corpusLanguages(),
    learnerSupport: [...translationLocales],
    interface: [...interfaceLocales],
  },
  counts: {
    patterns: patternRecords.length,
  },
  citation: {
    web: citationFormats().publication,
    ai: ATTRIBUTION.attribution_text,
    cff: `${SITE_URL}/CITATION.cff`,
    pages: { en: `${SITE_URL}/en/cite/`, ru: `${SITE_URL}/ru/cite/` },
  },
  rights: {
    status: ATTRIBUTION.rights_status,
    label: ATTRIBUTION.license,
    terms: ATTRIBUTION.terms_url,
    attributionRequired: ATTRIBUTION.attribution_required,
    summary: "Source-available publication. Reading, linking and citation are welcome; substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.",
  },
  exports: {
    huggingFaceCard: `${SITE_URL}/distribution/huggingface/README.md`,
    patternsJsonl: `${SITE_URL}/distribution/huggingface/patterns.jsonl`,
  },
  sourceApi: `${API}/index.json`,
};

write("data/publication.json", `${JSON.stringify(publication, null, 2)}\n`);
write("api/v1/publication.json", `${JSON.stringify(wrapRecord(publication, {
  canonical_url: `${API}/publication.json`,
  record_type: "publication_manifest",
  record_id: "metkagram-publication",
}), null, 2)}\n`);

const cffSource = fs.readFileSync(path.join(ROOT, "CITATION.cff"), "utf8");
write("CITATION.cff", cffSource);

const jsonl = patternRecords.map((record) => JSON.stringify(record)).join("\n");
write("distribution/huggingface/patterns.jsonl", `${jsonl}\n`);

const datasetCard = `---
pretty_name: Metkagram Language Pattern Corpus
language:
${[...corpusLanguages(), ...translationLocales].map((lang) => `- ${lang}`).join("\n")}
license: other
license_name: ${ATTRIBUTION.license}
license_link: ${ATTRIBUTION.license_url}
tags:
- language-learning
- linguistic-patterns
- english
- german
- nlp
- sentence-patterns
---

# Metkagram Language Pattern Corpus

This package is an export of the publicly released learner-facing Metkagram pattern layer. The canonical source of truth remains ${SITE_URL}/ and its versioned JSON API.

## What is here

- ${patternRecords.length.toLocaleString("en-US")} published pattern records
- stable pattern IDs
- English and German formulas and examples
- Russian learner-support translations
- quality metadata
- per-record provenance, canonical URLs, dataset version and content hashes

The JSONL export is generated from the same canonical public API records used by the website. One line equals one provenance-wrapped pattern record.

## Intended uses

Metkagram is designed for language-learning research, educational pilots, retrieval/evaluation experiments, and AI tutor or agent workflows that preserve the source record and citation. The project is especially suited to intent-to-pattern retrieval, contrastive practice, reusable sentence frames and source-grounded language tutoring.

## Rights and responsible use

This publication is **source-available, not open data**. The metadata uses \`license: other\` because the current terms are the Metkagram Source-Available Terms rather than a standard open-data license.

Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use. Do not treat this export as an unrestricted model-training corpus.

Current terms: ${ATTRIBUTION.terms_url}

Required attribution: ${ATTRIBUTION.attribution_text}

## Citation

Web citation:

> ${publication.citation.web}

Machine-readable citation metadata: ${publication.citation.cff}

Publication manifest: ${API}/publication.json

## Canonical access

- API index: ${API}/index.json
- Full patterns API: ${API}/patterns.json
- AI recipes: ${API}/ai-recipes.json
- English citation guide: ${SITE_URL}/en/cite/
- Russian citation guide: ${SITE_URL}/ru/cite/

When a local export and the canonical API disagree, prefer the canonical API and its current terms.
`;
write("distribution/huggingface/README.md", datasetCard);

function citationPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/cite/`;
  const title = ru ? "Как цитировать Metkagram" : "How to cite Metkagram";
  const description = ru
    ? "Канонические ссылки, версия датасета, AI-атрибуция и текущие условия использования Metkagram."
    : "Canonical links, dataset version, AI attribution and current Metkagram usage terms.";
  const webCitation = publication.citation.web;
  const body = `<section class="page-head section-pad"><p class="eyebrow">Metkagram · Citation & provenance</p><h1>${escapeHtml(title)}</h1><p class="lede">${ru ? "Цитируйте канонический источник и сохраняйте версию данных. Для AI-ответов оставляйте видимую ссылку на соответствующий объект Metkagram." : "Cite the canonical source and keep the dataset version. In AI answers, retain a visible link to the relevant Metkagram object."}</p></section><section class="section-pad ruled"><h2>${ru ? "Рекомендуемая веб-цитата" : "Recommended web citation"}</h2><pre><code>${escapeHtml(webCitation)}</code></pre><p><strong>${ru ? "Версия данных" : "Dataset version"}:</strong> <code>${escapeHtml(getDatasetVersion())}</code></p><div class="legal-inline-links"><a href="/CITATION.cff">CITATION.cff →</a><a href="/api/v1/publication.json">Publication manifest →</a></div></section><section class="section-pad ruled"><h2>${ru ? "Для AI и агентов" : "For AI and agents"}</h2><pre><code>${escapeHtml(ATTRIBUTION.attribution_text)}</code></pre><p>${ru ? "Когда AI показывает конкретный паттерн, контраст или набор, сохраняйте stable ID и canonical URL этого объекта. Не приписывайте Metkagram конструкции, которых нет в опубликованном наборе." : "When an AI shows a specific pattern, contrast or set, keep that object's stable ID and canonical URL. Do not attribute invented structures to Metkagram."}</p></section><section class="section-pad ruled"><h2>${ru ? "Права и повторное использование" : "Rights and reuse"}</h2><p><strong>${escapeHtml(ATTRIBUTION.license)}</strong>. ${ru ? "Публикация доступна для чтения, ссылок и цитирования, но не является open data. Существенное повторное использование, производные корпуса, обучение моделей, перераспространение и коммерческие интеграции требуют согласования в рамках текущих условий, если закон отдельно не разрешает такое использование." : "The publication is available for reading, linking and citation, but it is not open data. Substantial reuse, derived corpora, model training, redistribution and commercial integrations require scoped permission under the current terms unless applicable law independently permits the use."}</p><div class="legal-inline-links"><a href="/${locale}/licensing/">${ru ? "Условия использования" : "Usage terms"} →</a><a href="/${locale}/data/">${ru ? "Каталог данных" : "Data catalog"} →</a></div></section><section class="section-pad ruled"><h2>${ru ? "Пакет для публикации" : "Publication package"}</h2><p>${ru ? "В сборку включён готовый Dataset Card и JSONL-экспорт для площадок вроде Hugging Face. Это пакет распространения, а не изменение лицензии." : "The build includes a ready Dataset Card and JSONL export for distribution surfaces such as Hugging Face. The export is a distribution package, not a license change."}</p><div class="legal-inline-links"><a href="/distribution/huggingface/README.md">Dataset Card →</a><a href="/distribution/huggingface/patterns.jsonl">patterns.jsonl →</a></div></section>`;
  return {
    route: pathname,
    html: layout({
      locale,
      pathname,
      title: `${title} | Metkagram`,
      description,
      body,
      pageType: "WebPage",
      structuredData: [{
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: "Metkagram Language Pattern Corpus",
        url: `${SITE_URL}${pathname}`,
        version: getDatasetVersion(),
        license: ATTRIBUTION.terms_url,
        isAccessibleForFree: true,
        inLanguage: [...corpusLanguages(), ...translationLocales],
      }],
    }),
    metadata: {
      route: pathname,
      canonical: `${SITE_URL}${pathname}`,
      language: locale,
      title: `${title} | Metkagram`,
      description,
      lastModified: SITE_RELEASE_DATE,
    },
  };
}

const citationPages = interfaceLocales.map(citationPage);
for (const page of citationPages) write(`${page.route.slice(1)}index.html`, page.html);

for (const locale of interfaceLocales) {
  const ru = locale === "ru";
  const section = `<section class="ai-section section-pad ruled" data-publication-citation><div><p class="eyebrow">Citation</p><h2>${ru ? "Цитируйте данные как источник" : "Cite the data as a source"}</h2><p>${ru ? "Версия, canonical URLs и текущие условия собраны на отдельной странице." : "Dataset version, canonical URLs and current terms are collected on one page."}</p></div><div class="legal-inline-links"><a href="/${locale}/cite/">${ru ? "Как цитировать" : "How to cite"} →</a></div></section>`;
  for (const relative of [`${locale}/ai/index.html`, `${locale}/data/index.html`, `${locale}/build-with-metkagram/index.html`]) {
    patch(relative, (html) => html.includes("data-publication-citation") ? html : html.replace("</main>", `${section}</main>`));
  }
}

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.endpoints ||= [];
  if (!root.endpoints.some((item) => item.path === "/publication.json")) {
    root.endpoints.push({ path: "/publication.json", url: `${API}/publication.json`, type: "manifest", description: "Citation, rights and distribution metadata" });
  }
  root.publication = `${API}/publication.json`;
});

patch("llms.txt", (text) => text.includes("## Citation and publication") ? text : `${text}\n## Citation and publication\n- Citation guide: ${SITE_URL}/en/cite/\n- Publication manifest: ${API}/publication.json\n- CITATION.cff: ${SITE_URL}/CITATION.cff\n- Hugging Face-ready Dataset Card: ${SITE_URL}/distribution/huggingface/README.md\n- JSONL export: ${SITE_URL}/distribution/huggingface/patterns.jsonl\n- Metkagram is source-available, not open data. Preserve stable IDs, canonical URLs, provenance and attribution; check current terms before substantial reuse, model training, redistribution or commercial integration.\n`);

patch("sitemap.xml", (xml) => citationPages.reduce((out, page) => out.includes(`<loc>${page.metadata.canonical}</loc>`) ? out : out.replace("</urlset>", `  <url><loc>${page.metadata.canonical}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`), xml));

patchJson("seo/site-pages.json", (inventory) => {
  inventory.pages ||= [];
  for (const page of citationPages) {
    const index = inventory.pages.findIndex((item) => item.route === page.metadata.route);
    if (index >= 0) inventory.pages[index] = page.metadata;
    else inventory.pages.push(page.metadata);
  }
  inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
});

process.stdout.write(`Publication readiness: ${patternRecords.length} patterns, ${citationPages.length} citation pages, Hugging Face-ready JSONL export.\n`);
