import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";
import { patternPath, studySetPath, studySetSlug, studySetUrl } from "../src/seo-slugs.mjs";

const DIST = path.join(process.cwd(), "dist");
const LOCALES = ["en", "ru"];
const full = (relative) => path.join(DIST, relative);
const read = (relative) => fs.readFileSync(full(relative), "utf8");
const write = (relative, contents) => {
  const target = full(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compact(value = "", limit = 155) {
  const text = String(value).replaceAll(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit - 1);
  const boundary = slice.lastIndexOf(" ");
  return `${slice.slice(0, boundary > limit * 0.6 ? boundary : slice.length)}…`;
}

function brandedTitle(core) {
  const suffix = " | Metkagram";
  return `${compact(core, 68 - suffix.length).replace(/…$/, "")}${suffix}`;
}

const SEARCH_TITLES_EN = {
  ARG: "Argumentation Phrases for B2–C1 English",
  OPI: "C1 Opinion Phrases and Stance Patterns",
  EVD: "Evidence and Inference Phrases for Advanced English",
  AGR: "Agreement and Disagreement Phrases for B2–C1 English",
  HED: "Hedging Phrases for C1 English",
  CLR: "Clarification and Reformulation Phrases in English",
  PRO: "Professional English Phrases for Meetings and Work",
  NEG: "Negotiation Phrases and Decision Language in English",
  QPOL: "Polite Request Questions in English",
  QWRK: "Workplace Questions in English for B2–C1",
  QACA: "Academic and Research Questions in English",
  QNGT: "Negotiation Questions in English",
  ADV: "Advice and Recommendation Phrases in English",
  FBK: "Feedback Phrases in English for Work",
  PLN: "Planning and Scheduling Phrases in English",
  PRI: "Priorities and Trade-offs Phrases in English",
  TCT: "Polite and Tactful English Phrases",
  RSK: "Risk and Precaution Phrases in English",
  PRS: "Persuasion Phrases in English for B2–C1",
  SUM: "Summary and Conclusion Phrases in English"
};

function searchTitle(locale, set) {
  if (locale === "ru") return brandedTitle(`${set.title_ru}: паттерны B2–C1`);
  return brandedTitle(SEARCH_TITLES_EN[set.id] || `${set.title_en} Patterns for B2–C1 English`);
}

function searchDescription(locale, set, patternCount) {
  if (locale === "ru") {
    return compact(`${set.description_ru || set.description} ${patternCount} моделей B2–C1: английские и немецкие примеры, русские переводы и связанные учебные наборы.`);
  }
  return compact(`${set.description} Study ${patternCount} reusable B2–C1 English patterns with German parallels, examples, Russian translations, and related study sets.`);
}

function replaceMeta(html, title, description) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  const replacements = [
    [/meta name="description" content="[^"]*"/, `meta name="description" content="${escapeHtml(description)}"`],
    [/meta property="og:title" content="[^"]*"/, `meta property="og:title" content="${escapeHtml(title)}"`],
    [/meta property="og:description" content="[^"]*"/, `meta property="og:description" content="${escapeHtml(description)}"`],
    [/meta name="twitter:title" content="[^"]*"/, `meta name="twitter:title" content="${escapeHtml(title)}"`],
    [/meta name="twitter:description" content="[^"]*"/, `meta name="twitter:description" content="${escapeHtml(description)}"`]
  ];
  for (const [pattern, value] of replacements) html = html.replace(pattern, value);
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, payload) => {
    try {
      const data = JSON.parse(payload);
      if (typeof data?.["@id"] === "string" && data["@id"].endsWith("#webpage")) {
        data.name = title;
        data.description = description;
      }
      if (data?.["@type"] === "LearningResource") {
        data.name = title.replace(/ \| Metkagram$/, "");
        data.description = description;
      }
      return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
    } catch {
      return tag;
    }
  });
}

function learningPathFor(content, setId) {
  return content.studySets.learningPaths.find((item) => (item.set_ids || []).includes(setId)) || null;
}

function relatedSets(content, set) {
  const pathItem = learningPathFor(content, set.id);
  if (!pathItem) return [];
  const byId = new Map(content.studySets.sets.map((item) => [item.id, item]));
  const ids = pathItem.set_ids || [];
  const index = ids.indexOf(set.id);
  const ordered = [...ids.slice(index + 1), ...ids.slice(0, index)];
  return ordered.map((id) => byId.get(id)).filter(Boolean).slice(0, 4);
}

function samplePatterns(patterns) {
  const reviewed = patterns.filter((pattern) => pattern.quality?.indexable);
  return (reviewed.length >= 6 ? reviewed : patterns).slice(0, 6);
}

function exampleSection(locale, set, patterns) {
  const ru = locale === "ru";
  const samples = samplePatterns(patterns);
  const items = samples.map((pattern, index) => {
    const en = pattern.langs.find((lang) => lang.lang === "en") || pattern.langs[0];
    const de = pattern.langs.find((lang) => lang.lang === "de");
    const label = ru ? pattern.title_ru : en.formula;
    const detail = ru
      ? `${en.example}${de?.example ? ` · DE: ${de.example}` : ""}`
      : `${en.example}${de?.formula ? ` · German parallel: ${de.formula}` : ""}`;
    return `<a href="${patternPath(locale, pattern)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span><span aria-hidden="true">↗</span></a>`;
  }).join("");

  return `<section id="practice-set-guide" class="page-head section-pad compact ruled"><p class="eyebrow">01 · ${ru ? "Как использовать набор" : "How to use this set"}</p><h2>${ru ? "Сначала смысл, затем форма" : "Start from the communication job"}</h2><p>${escapeHtml(ru ? set.description_ru || set.description : set.description)}</p><p>${ru ? "Просмотрите модель, попробуйте закончить собственную фразу до открытия примера, затем сравните английскую конструкцию с немецкой параллелью. Это превращает список в практику извлечения, а не в чтение справочника." : "Read the frame, try to complete your own sentence before opening an example, then compare the English structure with its German parallel. The point is retrieval and choice, not passive list reading."}</p></section><section class="page-head section-pad compact"><p class="eyebrow">02 · ${ru ? "Примеры" : "Representative patterns"}</p><h2>${ru ? "С чего начать" : "Start with these reusable frames"}</h2><p>${ru ? `Редакционная выборка из ${patterns.length} моделей набора.` : `A compact sample from the ${patterns.length} patterns in this study set.`}</p></section><section class="pattern-index section-pad">${items}</section><section class="page-head section-pad compact ruled"><p class="eyebrow">03 · ${ru ? "Полный набор" : "Complete set"}</p><h2>${ru ? "Все модели" : "Browse every pattern"}</h2><p>${ru ? "Ниже находится полный канонический список. Каждая карточка имеет стабильный ID и отдельный URL." : "The canonical list follows below. Every pattern has a stable ID and its own page for examples, translation, and reuse."}</p></section>`;
}

function relatedSection(locale, content, set) {
  const ru = locale === "ru";
  const related = relatedSets(content, set);
  if (!related.length) return "";
  const pathItem = learningPathFor(content, set.id);
  return `<section class="page-head section-pad compact ruled"><p class="eyebrow">04 · ${ru ? "Куда дальше" : "Continue"}</p><h2>${escapeHtml(ru ? pathItem?.title_ru || "Связанные сеты" : pathItem?.title_en || "Related sets")}</h2><p>${ru ? "Следующий полезный шаг из того же учебного маршрута." : "A useful next step from the same learning path."}</p></section><section class="document-index section-pad">${related.map((item, index) => `<a href="${studySetPath(locale, item)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(ru ? item.title_ru : item.title_en)}</strong><small>${escapeHtml(ru ? item.description_ru || item.description : item.description)}</small></span><span aria-hidden="true">↗</span></a>`).join("")}</section>`;
}

function patchSetPage(locale, content, set, patterns) {
  const relative = `${locale}/practice/sets/${studySetSlug(set)}/index.html`;
  if (!fs.existsSync(full(relative))) throw new Error(`Missing study set page: ${relative}`);
  let html = read(relative);
  const title = searchTitle(locale, set);
  const description = searchDescription(locale, set, patterns.length);
  html = replaceMeta(html, title, description);

  if (!html.includes('id="practice-set-guide"')) {
    const listMarker = '<section class="pattern-index section-pad ruled">';
    if (!html.includes(listMarker)) throw new Error(`Could not locate pattern list in ${relative}`);
    html = html.replace(listMarker, `${exampleSection(locale, set, patterns)}${listMarker}`);
  }
  if (!html.includes('class="practice-related-sets"')) {
    const related = relatedSection(locale, content, set).replace('<section class="page-head', '<section class="practice-related-sets page-head');
    if (related) html = html.replace("</main>", `${related}</main>`);
  }
  write(relative, html);
  return { route: studySetPath(locale, set), title, description, slug: studySetSlug(set) };
}

function patchPracticeIndex(locale, content) {
  const relative = `${locale}/practice/index.html`;
  let html = read(relative);
  if (html.includes('id="learning-paths"')) return;
  const ru = locale === "ru";
  const byId = new Map(content.studySets.sets.map((set) => [set.id, set]));
  const paths = content.studySets.learningPaths.map((pathItem, index) => {
    const links = (pathItem.set_ids || []).map((id) => byId.get(id)).filter(Boolean).map((set) => `<a href="${studySetPath(locale, set)}">${escapeHtml(ru ? set.title_ru : set.title_en)}</a>`).join(" · ");
    return `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(ru ? pathItem.title_ru : pathItem.title_en)}</h3><p>${links}</p></div></li>`;
  }).join("");
  const section = `<section id="learning-paths" class="research-questions section-pad ruled"><div><p class="eyebrow">${ru ? "Учиться по маршруту" : "Study by learning path"}</p><h2>${ru ? "От задачи к набору, от набора к модели" : "From learning goal to set to pattern"}</h2><p>${ru ? `${content.studySets.sets.length} учебных наборов сгруппированы в ${content.studySets.learningPaths.length} маршрутов. Начинайте отсюда, если не знаете ID конкретного паттерна.` : `${content.studySets.sets.length} study sets are grouped into ${content.studySets.learningPaths.length} learning paths. Start here when you know what you want to practise but not a pattern ID.`}</p></div><ol>${paths}</ol></section>`;
  const marker = '<section id="all-patterns"';
  if (!html.includes(marker)) throw new Error(`Could not locate all-patterns section in ${relative}`);
  write(relative, html.replace(marker, `${section}<section id="all-patterns"`));
}

function patchPatternContext(locale, content, pattern, setById) {
  const relative = `${patternPath(locale, pattern).slice(1)}index.html`;
  if (!fs.existsSync(full(relative))) return;
  let html = read(relative);
  if (html.includes('id="pattern-set-context"')) return;
  const set = setById.get(pattern.set_id);
  if (!set) return;
  const ru = locale === "ru";
  const block = `<aside id="pattern-set-context" class="section-pad ruled"><p class="eyebrow">${ru ? "Тематический сет" : "Topic set"}</p><p>${ru ? "Этот паттерн входит в сет" : "This pattern belongs to"} <a href="${studySetPath(locale, set)}"><strong>${escapeHtml(ru ? set.title_ru : set.title_en)}</strong></a>. ${escapeHtml(ru ? set.description_ru || set.description : set.description)}</p></aside>`;
  html = html.replace("</main>", `${block}</main>`);
  write(relative, html);
}

function updateSeoInventory(records) {
  const relative = "seo/site-pages.json";
  const inventory = JSON.parse(read(relative));
  const byRoute = new Map(records.map((record) => [record.route, record]));
  for (const page of inventory.pages || []) {
    const replacement = byRoute.get(page.route);
    if (!replacement) continue;
    page.title = replacement.title;
    page.description = replacement.description;
    page.lastModified = SITE_RELEASE_DATE;
  }
  write(relative, `${JSON.stringify(inventory, null, 2)}\n`);
}

function publishNavigation(content, records) {
  const bySet = new Map(content.studySets.sets.map((set) => [set.id, set]));
  const payload = {
    schemaVersion: 1,
    generatedAt: SITE_RELEASE_DATE,
    canonicalBase: SITE_URL,
    description: "Canonical learning-path and study-set navigation for Metkagram Pattern Practice.",
    learningPaths: content.studySets.learningPaths.map((pathItem) => ({
      id: pathItem.id,
      title_en: pathItem.title_en,
      title_ru: pathItem.title_ru,
      sets: (pathItem.set_ids || []).map((id) => bySet.get(id)).filter(Boolean).map((set) => ({
        id: set.id,
        title_en: set.title_en,
        title_ru: set.title_ru,
        description_en: set.description,
        description_ru: set.description_ru || set.description,
        slug: studySetSlug(set),
        urls: { en: studySetUrl("en", set), ru: studySetUrl("ru", set) }
      }))
    }))
  };
  write("data/practice-navigation.json", `${JSON.stringify(payload, null, 2)}\n`);
  write("seo/practice-sets.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, setCount: content.studySets.sets.length, records }, null, 2)}\n`);

  const llmsRelative = "llms.txt";
  let llms = read(llmsRelative);
  if (!llms.includes("## Pattern Practice navigation")) {
    llms += `\n## Pattern Practice navigation\n- Learning paths and canonical study sets: ${SITE_URL}/data/practice-navigation.json\n- Human Practice hub: ${SITE_URL}/en/practice/\n- Prefer the narrowest matching study-set URL when a learner asks for a specific skill such as hedging, polite requests, feedback, negotiation, questions, or German word order; link to individual pattern pages when a particular frame is relevant.\n`;
    write(llmsRelative, llms);
  }
}

function assertOutput(content) {
  for (const locale of LOCALES) {
    if (!read(`${locale}/practice/index.html`).includes('id="learning-paths"')) throw new Error(`Learning paths missing from ${locale} Practice`);
    for (const set of content.studySets.sets) {
      const html = read(`${locale}/practice/sets/${studySetSlug(set)}/index.html`);
      if (!html.includes('id="practice-set-guide"')) throw new Error(`SEO guide missing for ${locale}/${set.id}`);
    }
  }
  if (!fs.existsSync(full("data/practice-navigation.json"))) throw new Error("Practice navigation dataset was not generated");
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the base build first");
  const content = loadContent();
  const setById = new Map(content.studySets.sets.map((set) => [set.id, set]));
  const records = [];

  for (const locale of LOCALES) {
    patchPracticeIndex(locale, content);
    for (const set of content.studySets.sets) {
      const patterns = content.advancedPatterns.filter((pattern) => pattern.set_id === set.id);
      records.push(patchSetPage(locale, content, set, patterns));
    }
    for (const pattern of content.advancedPatterns) patchPatternContext(locale, content, pattern, setById);
  }

  updateSeoInventory(records);
  publishNavigation(content, records);
  assertOutput(content);
  process.stdout.write(`Practice SEO: ${content.studySets.learningPaths.length} learning paths, ${content.studySets.sets.length} study sets, ${content.advancedPatterns.length} pattern-to-set links.\n`);
}

main();
