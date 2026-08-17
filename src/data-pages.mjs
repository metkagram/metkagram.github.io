import { ATTRIBUTION, getDatasetVersion } from "./provenance.mjs";
import { breadcrumbs, escapeHtml, layout } from "./render.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "./site.mjs";

const datasets = {
  annotations: {
    titleEn: "Annotated English and German sentences",
    titleRu: "Размеченные предложения на английском и немецком",
    descriptionEn: "Sentence-first language data with inline functional spans, translations, labels and canonical source pages.",
    descriptionRu: "Данные предложений с функциональной разметкой внутри фразы, переводами, метками и каноническими страницами.",
    downloads: ["/data/canonical-annotations.json", "/data/catalog.json"],
    keywords: ["linguistic annotation", "English", "German", "grammar", "functional roles"],
  },
  patterns: {
    titleEn: "Reusable B2–C1 language patterns",
    titleRu: "Переиспользуемые языковые паттерны B2–C1",
    descriptionEn: "English and German reusable structures with formulas, examples, Russian translations, study sets and quality metadata.",
    descriptionRu: "Переиспользуемые структуры английского и немецкого с формулами, примерами, переводами, сетами и метаданными качества.",
    downloads: ["/data/advanced-patterns.json", "/data/study-sets.json", "/data/quality-report.json"],
    keywords: ["language patterns", "B2", "C1", "English", "German"],
  },
  reasoning: {
    titleEn: "Reasoning frames for English and German",
    titleRu: "Логические каркасы для английского и немецкого",
    descriptionEn: "Reusable frames for limiting, conditioning, comparing, reframing, inferring and challenging ideas in English and German.",
    descriptionRu: "Переиспользуемые каркасы для ограничения, условий, сравнения, переопределения, вывода и проверки мыслей на английском и немецком.",
    downloads: ["/data/reasoning-frames/index.json", "/api/v1/search-index.json"],
    keywords: ["reasoning frames", "argumentation", "English", "German", "discourse patterns"],
  },
};

function datasetSchema(locale, key, dataset, counts) {
  const title = locale === "ru" ? dataset.titleRu : dataset.titleEn;
  const description = locale === "ru" ? dataset.descriptionRu : dataset.descriptionEn;
  const pathname = `/${locale}/data/${key}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: title,
    description,
    url: `${SITE_URL}${pathname}`,
    inLanguage: ["en", "de", "ru"],
    keywords: dataset.keywords,
    license: ATTRIBUTION.license_url,
    creator: { "@type": "Organization", name: ATTRIBUTION.creator, url: ATTRIBUTION.creator_url },
    publisher: { "@type": "Organization", name: "Metkagram", url: SITE_URL },
    version: getDatasetVersion(),
    dateModified: SITE_RELEASE_DATE,
    variableMeasured: key === "patterns" ? ["formula", "example", "translation", "study set", "quality"] : key === "reasoning" ? ["reasoning move", "formula", "example", "translation"] : ["sentence span", "functional role", "translation"],
    size: key === "patterns" ? `${counts.advancedPatterns} patterns` : key === "annotations" ? `${counts.annotatedSentences} annotated sentences` : undefined,
    distribution: dataset.downloads.map((href) => ({
      "@type": "DataDownload",
      contentUrl: `${SITE_URL}${href}`,
      encodingFormat: "application/json",
    })),
  };
}

export function dataIndexPage(locale, counts) {
  const ru = locale === "ru";
  const pathname = `/${locale}/data/`;
  const title = ru ? "Открытые языковые данные Metkagram" : "Metkagram open language datasets";
  const description = ru
    ? "Размеченные предложения, языковые паттерны и логические каркасы для английского и немецкого с версионированием и происхождением данных."
    : "Annotated sentences, reusable language patterns and reasoning frames for English and German with versioning and provenance.";
  const cards = Object.entries(datasets).map(([key, dataset]) => {
    const name = ru ? dataset.titleRu : dataset.titleEn;
    const text = ru ? dataset.descriptionRu : dataset.descriptionEn;
    return `<a class="dataset-card" href="/${locale}/data/${key}/"><strong>${escapeHtml(name)}</strong><p>${escapeHtml(text)}</p><span>${ru ? "Открыть набор" : "Open dataset"} →</span></a>`;
  }).join("");
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ru ? "Главная" : "Home" }, { href: pathname, label: ru ? "Данные" : "Data" }])}<section class="page-head section-pad"><p class="eyebrow">${ru ? "Данные" : "Data"} · ${escapeHtml(getDatasetVersion())}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(description)}</p><dl class="project-metrics"><div><dt>${counts.annotatedSentences}</dt><dd>${ru ? "размеченных предложений" : "annotated sentences"}</dd></div><div><dt>${counts.advancedPatterns}</dt><dd>${ru ? "паттернов" : "patterns"}</dd></div></dl></section><section class="ai-section section-pad ruled"><div><p class="eyebrow">01 · ${ru ? "Наборы" : "Datasets"}</p><h2>${ru ? "Выберите слой данных" : "Choose a data layer"}</h2></div><div class="dataset-grid">${cards}</div></section>`;
  return layout({ locale, pathname, title: `${title} | Metkagram`, description, body, structuredData: [{ "@context": "https://schema.org", "@type": "DataCatalog", name: title, url: `${SITE_URL}${pathname}`, dataset: Object.entries(datasets).map(([key, dataset]) => datasetSchema(locale, key, dataset, counts)) }] });
}

export function datasetPage(locale, key, counts) {
  const dataset = datasets[key];
  if (!dataset) throw new Error(`Unknown dataset page: ${key}`);
  const ru = locale === "ru";
  const pathname = `/${locale}/data/${key}/`;
  const title = ru ? dataset.titleRu : dataset.titleEn;
  const description = ru ? dataset.descriptionRu : dataset.descriptionEn;
  const downloads = dataset.downloads.map((href) => `<a href="${href}"><code>${escapeHtml(href)}</code><span>${ru ? "Открыть JSON" : "Open JSON"} →</span></a>`).join("");
  const body = `${breadcrumbs(locale, [{ href: `/${locale}/`, label: ru ? "Главная" : "Home" }, { href: `/${locale}/data/`, label: ru ? "Данные" : "Data" }, { href: pathname, label: title }])}<section class="page-head section-pad"><p class="eyebrow">Dataset · ${escapeHtml(getDatasetVersion())}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(description)}</p></section><section class="ai-section section-pad ruled"><div><p class="eyebrow">01 · ${ru ? "Скачать" : "Downloads"}</p><h2>${ru ? "Канонические файлы" : "Canonical files"}</h2></div><nav class="research-links">${downloads}</nav></section><section class="ai-section section-pad ruled"><div><p class="eyebrow">02 · Provenance</p><h2>${ru ? "Версия и атрибуция" : "Version and attribution"}</h2></div><div><p><strong>${escapeHtml(getDatasetVersion())}</strong></p><p>${escapeHtml(ATTRIBUTION.attribution_text)}</p><p><a href="/${locale}/ai/">${ru ? "API, MCP и правила атрибуции" : "API, MCP and attribution rules"} →</a></p></div></section>`;
  return layout({ locale, pathname, title: `${title} | Metkagram`, description, body, pageType: "CollectionPage", structuredData: [datasetSchema(locale, key, dataset, counts)] });
}

export const datasetKeys = Object.keys(datasets);
