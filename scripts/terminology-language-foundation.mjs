import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { publicLanguageMatrix } from "../src/language-registry.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const methodology = {
  name: "Metkagram Mark–Frame Method",
  shortLine: "See the structure. Keep the Frame. Reuse the Move.",
  coreLoop: ["Sentence", "Mark", "Frame", "Move", "Reuse"],
  practiceLoop: ["Frame", "Contrast", "Choice", "Route / Bridge", "Reuse"],
};

const terminology = [
  {
    id: "mark",
    name: "Mark",
    ru: "Метка",
    definition: "A small visual cue placed directly inside a real sentence to make one structural or functional role easier to notice.",
    definitionRu: "Небольшая визуальная подсказка прямо внутри живой фразы, которая помогает заметить одну структурную или функциональную роль.",
  },
  {
    id: "frame",
    name: "Frame",
    ru: "Каркас",
    definition: "A reusable language structure in one specific language.",
    definitionRu: "Повторно используемая речевая конструкция в одном конкретном языке.",
  },
  {
    id: "move",
    name: "Move",
    ru: "Ход",
    definition: "The communicative or reasoning job a speaker is performing, independent of language.",
    definitionRu: "Коммуникативная или логическая задача говорящего, не привязанная к конкретному языку.",
  },
  {
    id: "contrast",
    name: "Contrast",
    ru: "Контраст",
    definition: "A reviewed distinction between two nearby Frames that should not be treated as interchangeable.",
    definitionRu: "Проверенное различие между двумя близкими каркасами, которые нельзя считать полностью взаимозаменяемыми.",
  },
  {
    id: "choice",
    name: "Choice",
    ru: "Выбор",
    definition: "A short retrieval task: choose between nearby Frames before revealing feedback.",
    definitionRu: "Короткая задача на извлечение из памяти: сначала выбрать между близкими каркасами, затем открыть объяснение.",
  },
  {
    id: "route",
    name: "Route",
    ru: "Маршрут",
    definition: "An ordered learning sequence that combines Frames, Contrasts and Choices around one coherent job.",
    definitionRu: "Упорядоченная учебная последовательность из каркасов, контрастов и выборов для одной целостной задачи.",
  },
  {
    id: "bridge",
    name: "Bridge",
    ru: "Мост",
    definition: "A reviewed cross-language relation between Frames that perform the same or a closely related Move.",
    definitionRu: "Проверенная межъязыковая связь между каркасами, которые выполняют один и тот же или близкий речевой ход.",
  },
];

const surfaceNames = [
  { canonical: "Pattern Practice", legacy: null, job: "Browse and practise canonical patterns." },
  { canonical: "Pattern Lens", legacy: null, job: "Find patterns in real text." },
  { canonical: "Pattern Atlas", legacy: null, job: "Start from a communicative job and discover patterns." },
  { canonical: "Pattern Map", legacy: "Pattern Graph", job: "Inspect reviewed relations between patterns." },
  { canonical: "Pattern Contrasts", legacy: "Contrast Library", job: "Compare nearby patterns." },
  { canonical: "Pattern Choice", legacy: "Pattern Choice Clinic", job: "Choose before feedback." },
  { canonical: "Pattern Routes", legacy: "Reasoning Packs", job: "Follow a short curated learning sequence." },
  { canonical: "Pattern Bridge", legacy: "Cross-language Transfer", job: "Retrieve and compare reviewed cross-language realizations." },
];

const visibleNameReplacements = [
  ["Pattern Choice Clinic", "Pattern Choice"],
  ["Choice Clinic", "Pattern Choice"],
  ["Reasoning Packs", "Pattern Routes"],
  ["Reasoning Pack", "Pattern Route"],
  ["Cross-language Transfer", "Pattern Bridge"],
  ["Pattern Graph", "Pattern Map"],
  ["Contrast Library", "Pattern Contrasts"],
  ["A tag is a small attention cue", "A Mark is a small attention cue"],
  ["Tags make one recurring function easier to spot.", "Marks make one recurring function easier to spot."],
  ["better explanations for each tag.", "better explanations for each Mark."],
  ["для этого тега.", "для этой метки."],
  ["Теги направляют внимание", "Метки направляют внимание"],
  ["Тег показывает направление", "Метка показывает направление"],
  ["Теги не заменяют", "Метки не заменяют"],
  ["один цветной тег сам по себе", "одна цветная метка сама по себе"],
];

function writeFile(relativePath, contents) {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function writeJson(relativePath, value) {
  writeFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function glossaryCopy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "Metkagram · единый словарь",
        title: "Один язык для всей системы",
        intro: "Metkagram использует небольшой набор терминов. Они описывают путь от визуальной метки в живой фразе до повторного использования структуры и переноса между языками.",
        methodTitle: "Metkagram Mark–Frame Method",
        methodText: "Метод начинается с полной фразы: мы замечаем Mark прямо внутри предложения, извлекаем повторяемый Frame, связываем его с Move и возвращаем структуру в активное использование. Более продвинутый слой добавляет Contrast, Choice, Route и Bridge.",
        methodBoundary: "Frame и Move не заявляются как изобретения Metkagram. Проектная методология — это их связка с inline Marks, стабильными учебными объектами, извлечением из памяти и межъязыковым переносом.",
        chainTitle: "Главная цепочка",
        objectsTitle: "Семь объектов Metkagram",
        surfacesTitle: "Названия разделов",
        languageTitle: "Три независимых языка",
        languageText: "Язык интерфейса, изучаемый язык и язык перевода — разные настройки. Поэтому новый язык может появиться в речевых каркасах и переводах ещё до того, как для него будет готова собственная система разметки.",
        translationTitle: "Translation ≠ Bridge",
        translationText: "Перевод помогает понять конкретный пример. Bridge показывает, как тот же речевой Move реализуется в другом языке. Это разные отношения, и Metkagram не должен притворяться, что между языками всегда существует соответствие один к одному.",
        legacy: "Раньше",
        job: "Задача",
      }
    : {
        eyebrow: "Metkagram · shared vocabulary",
        title: "One language for the whole system",
        intro: "Metkagram uses a small set of terms. They describe the path from a visual cue inside real language to reusable structure, active choice and cross-language reuse.",
        methodTitle: "Metkagram Mark–Frame Method",
        methodText: "The method starts with complete language: notice a Mark inside the sentence, extract the reusable Frame, connect it to the Move, then return the structure to active use. The advanced layer adds Contrast, Choice, Route and Bridge.",
        methodBoundary: "Frame and Move are not claimed as Metkagram inventions. The project-specific method is their connection to inline Marks, stable learning objects, retrieval and cross-language reuse.",
        chainTitle: "The core chain",
        objectsTitle: "Seven Metkagram objects",
        surfacesTitle: "Product surface names",
        languageTitle: "Three independent language axes",
        languageText: "Interface locale, learning language and translation locale are separate settings. A new learning language can therefore gain Frames and translations before Metkagram has a dedicated annotation profile or localized interface for it.",
        translationTitle: "Translation ≠ Bridge",
        translationText: "A Translation helps the learner understand one example. A Bridge records how the same Move is realised in another language. They are different relations, and Metkagram should not pretend that languages always line up one-to-one.",
        legacy: "Previously",
        job: "Job",
      };
}

function glossaryPage(locale) {
  const t = glossaryCopy(locale);
  const objectCards = terminology.map((term, index) => {
    const name = locale === "ru" ? `${term.ru} · ${term.name}` : term.name;
    const definition = locale === "ru" ? term.definitionRu : term.definition;
    return `<article class="pattern-reader"><p class="eyebrow">${String(index + 1).padStart(2, "0")}</p><h3>${escapeHtml(name)}</h3><p>${escapeHtml(definition)}</p></article>`;
  }).join("");
  const surfaceRows = surfaceNames.map((surface) => `<tr><th scope="row">${escapeHtml(surface.canonical)}</th><td>${escapeHtml(surface.job)}</td><td>${surface.legacy ? escapeHtml(surface.legacy) : "—"}</td></tr>`).join("");
  const body = `<section class="section-pad"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.title)}</h1><p class="lede">${escapeHtml(t.intro)}</p></section>
<section class="section-pad ruled"><p class="eyebrow">${escapeHtml(methodology.shortLine)}</p><h2>${escapeHtml(t.methodTitle)}</h2><p>${escapeHtml(t.methodText)}</p><p>${escapeHtml(t.methodBoundary)}</p><p><strong>${escapeHtml(methodology.coreLoop.join(" → "))}</strong></p></section>
<section class="section-pad ruled"><p class="eyebrow">${escapeHtml(t.chainTitle)}</p><h2>Mark → Frame → Move → Contrast → Choice → Route → Bridge</h2></section>
<section class="section-pad ruled"><h2>${escapeHtml(t.objectsTitle)}</h2><div class="pattern-comparison-list">${objectCards}</div></section>
<section class="section-pad ruled"><h2>${escapeHtml(t.surfacesTitle)}</h2><div class="table-scroll"><table><thead><tr><th>Metkagram</th><th>${escapeHtml(t.job)}</th><th>${escapeHtml(t.legacy)}</th></tr></thead><tbody>${surfaceRows}</tbody></table></div></section>
<section class="section-pad ruled"><h2>${escapeHtml(t.languageTitle)}</h2><p>${escapeHtml(t.languageText)}</p><h3>${escapeHtml(t.translationTitle)}</h3><p>${escapeHtml(t.translationText)}</p></section>`;
  const pathname = `/${locale}/glossary/`;
  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "Словарь Metkagram | Mark, Frame, Move, Bridge" : "Metkagram glossary | Mark, Frame, Move, Bridge",
    description: t.intro,
    body,
    pageType: "WebPage",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "Metkagram terminology",
      url: `${SITE_URL}${pathname}`,
      inLanguage: locale,
      hasDefinedTerm: terminology.map((term) => ({
        "@type": "DefinedTerm",
        name: term.name,
        description: locale === "ru" ? term.definitionRu : term.definition,
      })),
    }],
  });
}

function walkHtml(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walkHtml(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) result.push(full);
  }
  return result;
}

function patchVisibleTerminology() {
  for (const file of walkHtml(DIST)) {
    const html = fs.readFileSync(file, "utf8");
    let next = html;
    for (const [from, to] of visibleNameReplacements) {
      next = next.replaceAll(from, to);
      next = next.replaceAll(encodeURIComponent(from), encodeURIComponent(to));
    }
    if (next !== html) fs.writeFileSync(file, next);
  }
}

function patchMethodGlossary(locale) {
  const file = path.join(DIST, locale, "method", "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-metkagram-glossary")) return;
  const section = locale === "ru"
    ? `<section class="section-pad ruled" data-metkagram-glossary><p class="eyebrow">Metkagram Mark–Frame Method</p><h2>От метки к повторному использованию</h2><p>Полная фраза → Mark → Frame → Move → повторное использование. Contrast, Choice, Route и Bridge добавляют различение, извлечение из памяти и межъязыковый перенос. Разметка остаётся сильной частью метода, но новый изучаемый язык может появиться до готовности собственной системы аннотаций.</p><a class="text-link" href="/ru/glossary/">Открыть единый словарь <span aria-hidden="true">→</span></a></section>`
    : `<section class="section-pad ruled" data-metkagram-glossary><p class="eyebrow">Metkagram Mark–Frame Method</p><h2>From a visible Mark to reusable language</h2><p>Complete language → Mark → Frame → Move → reuse. Contrast, Choice, Route and Bridge add discrimination, retrieval and cross-language transfer. Annotation remains a strong part of the method, but a new learning language can become useful before its own annotation profile is ready.</p><a class="text-link" href="/en/glossary/">Open the shared vocabulary <span aria-hidden="true">→</span></a></section>`;
  html = html.replace("</main>", `${section}</main>`);
  fs.writeFileSync(file, html);
}

function patchSitemap() {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, "utf8");
  for (const locale of ["en", "ru"]) {
    const url = `${SITE_URL}/${locale}/glossary/`;
    if (!xml.includes(`<loc>${url}</loc>`)) {
      xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
    }
  }
  fs.writeFileSync(file, xml);
}

function patchSeoInventory() {
  const file = path.join(DIST, "seo", "site-pages.json");
  if (!fs.existsSync(file)) return;
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  value.pages ||= [];
  for (const locale of ["en", "ru"]) {
    const route = `/${locale}/glossary/`;
    if (value.pages.some((page) => page.route === route)) continue;
    const t = glossaryCopy(locale);
    value.pages.push({
      route,
      canonical: `${SITE_URL}${route}`,
      language: locale,
      title: locale === "ru" ? "Словарь Metkagram | Mark, Frame, Move, Bridge" : "Metkagram glossary | Mark, Frame, Move, Bridge",
      description: t.intro,
      lastModified: SITE_RELEASE_DATE,
    });
  }
  value.pages.sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  writeJson("seo/site-pages.json", value);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the base build before terminology-language-foundation.mjs.");

  patchVisibleTerminology();
  for (const locale of ["en", "ru"]) {
    writeFile(`${locale}/glossary/index.html`, glossaryPage(locale));
    patchMethodGlossary(locale);
  }

  writeJson("data/languages.json", publicLanguageMatrix());
  writeJson("data/terminology.json", {
    schemaVersion: 1,
    methodology,
    vocabulary: terminology,
    surfaces: surfaceNames,
    canonicalChain: terminology.map((term) => term.name),
  });
  patchSitemap();
  patchSeoInventory();

  console.log(`Terminology foundation: ${terminology.length} canonical objects, ${surfaceNames.length} product surfaces, 2 glossary pages.`);
}

main();
