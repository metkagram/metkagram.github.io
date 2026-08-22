import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../src/content.mjs";
import { layout, escapeHtml, SITE_URL } from "../src/render.mjs";
import { getDatasetVersion } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

export function normalizeLensText(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replace(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function extractLiteralSegments(formula = "") {
  return String(formula)
    .replaceAll("**", "")
    .split(/\[[^\]]+\]|\{[^}]+\}|<[^>]+>/g)
    .flatMap((part) => part.split(/\s+(?:\+|\/|\|)\s+|\s*→\s*/g))
    .map((part) => part
      .replace(/^[\s,;:.!?()\-–—+/|]+|[\s,;:.!?()\-–—+/|]+$/g, "")
      .replaceAll(/\s+/g, " ")
      .trim())
    .filter((part) => part.length >= 2 && /[\p{L}\p{N}]/u.test(part));
}

function languageRecord(pattern, language) {
  return pattern.langs?.find((item) => item.lang === language) || null;
}

export function rankPatterns(patterns, text, language = "en", limit = 6) {
  const normalizedText = normalizeLensText(text);
  if (!normalizedText) return [];

  return patterns
    .map((pattern) => {
      const lang = languageRecord(pattern, language);
      if (!lang) return null;
      const segments = extractLiteralSegments(lang.formula);
      const hits = segments.filter((segment) => normalizedText.includes(normalizeLensText(segment)));
      const examples = [lang.example, ...(lang.examples || []).map((item) => item.text)].filter(Boolean);
      const exampleMatch = examples.find((example) => {
        const normalized = normalizeLensText(example);
        return normalized.length >= 8 && (normalizedText.includes(normalized) || normalized.includes(normalizedText));
      });
      const score = hits.reduce((sum, segment) => sum + 2 + Math.min(3, normalizeLensText(segment).length / 10), 0)
        + (exampleMatch ? 10 : 0)
        + (hits.length > 1 ? 2 : 0);
      if (!score) return null;
      return {
        id: pattern.id,
        set_id: pattern.set_id,
        group_id: pattern.group_id,
        reasoning_move: pattern.reasoning?.move || null,
        title_ru: pattern.title_ru,
        formula: lang.formula,
        example: lang.example,
        translation: lang.translation,
        hits,
        score: Number(score.toFixed(3)),
        coverage: segments.length ? Number((hits.length / segments.length).toFixed(3)) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function removeLegacyMobileApplicationSchema(html = "") {
  return String(html).replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data?.["@graph"])) return full;
      const filtered = data["@graph"].filter((item) => {
        const types = Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]];
        return !types.some((type) => ["MobileApplication", "SoftwareApplication"].includes(type));
      });
      if (filtered.length === data["@graph"].length) return full;
      return `<script type="application/ld+json">${JSON.stringify({ ...data, "@graph": filtered }).replaceAll("<", "\\u003c")}</script>`;
    } catch {
      return full;
    }
  });
}

function writeDist(relativePath, content) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content);
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function lensCopy(locale) {
  if (locale === "ru") {
    return {
      title: "Pattern Lens — увидеть структуру в живой фразе | Metkagram",
      description: "Вставьте английскую или немецкую фразу и найдите повторяемые языковые конструкции из публичной библиотеки Metkagram.",
      eyebrow: "Pattern Lens · public preview",
      heading: "Увидеть структуру. Выучить паттерн. Использовать снова.",
      intro: "Вставьте фразу из письма, статьи или ответа ИИ. Metkagram ищет в ней конструкции, которые стоит превратить в учебные объекты.",
      inputLabel: "Фраза или короткий абзац",
      placeholder: "It's not that the solution is wrong; it's that it doesn't scale.",
      analyze: "Найти паттерны",
      english: "English",
      german: "Deutsch",
      resultTitle: "Что здесь можно выучить",
      ready: "Вставьте фразу и запустите поиск — результат появится здесь.",
      empty: "В публичной подборке нет достаточно сильного совпадения. Это нормально: здесь показывается ограниченный research/public corpus, а не полный annotation engine.",
      boundaryTitle: "Что делает этот preview",
      boundary: "Pattern Lens сопоставляет текст с опубликованными Metkagram patterns и визуально выделяет устойчивые части конструкции. Полный parser, spaCy pipeline, lexical rules и закрытый corpus остаются в private research core.",
      library: "Открыть Pattern Library",
      aiTitle: "Для AI tutors",
      ai: "ИИ здесь не заменяет Metkagram. Агент может использовать patterns как учебную программу: выбрать конструкцию, объяснить её под контекст пользователя, проверить попытку и вернуть паттерн на повторение.",
      manifest: "Teaching manifest",
      archivedTitle: "Мобильное приложение стало исследовательским этапом",
      archivedBody: "Раннее мобильное приложение помогло проверить карточки, разметку и повторение, но больше не является активным продуктом. Текущий Metkagram развивается как web-first research and learning project: Pattern Library, visual annotation и Pattern Lens.",
    };
  }
  return {
    title: "Pattern Lens — see reusable structure in real language | Metkagram",
    description: "Paste an English or German sentence and discover reusable learning patterns from the public Metkagram library.",
    eyebrow: "Pattern Lens · public preview",
    heading: "See the structure. Learn the pattern. Reuse it.",
    intro: "Paste a sentence from an email, article, or AI answer. Metkagram looks for structures worth turning into reusable learning objects.",
    inputLabel: "Sentence or short paragraph",
    placeholder: "It's not that the solution is wrong; it's that it doesn't scale.",
    analyze: "Find learning patterns",
    english: "English",
    german: "Deutsch",
    resultTitle: "What is worth learning here",
    ready: "Paste a sentence, then run the search. Your learning patterns will appear here.",
    empty: "No strong match was found in the public showcase. That is expected sometimes: this page uses the bounded public research corpus, not the private full annotation engine.",
    boundaryTitle: "What this preview does",
    boundary: "Pattern Lens matches text against published Metkagram patterns and highlights the stable parts of a construction. The full parser, spaCy pipeline, lexical rules and private corpus remain in the private research core.",
    library: "Open Pattern Library",
    aiTitle: "For AI tutors",
    ai: "AI is the tutor, not the curriculum. An agent can use Metkagram patterns to choose what a learner should practise, explain it in context, check an attempt, and schedule the pattern for return.",
    manifest: "Teaching manifest",
    archivedTitle: "The mobile app became a research stage",
    archivedBody: "The earlier mobile app helped test cards, annotation and repetition, but it is no longer the active product. Metkagram now develops as a web-first research and learning project centred on the Pattern Library, visual annotation and Pattern Lens.",
  };
}

function publicLensPatterns(content) {
  const all = content.advancedPatterns;
  const selected = [];
  const seen = new Set();
  const add = (pattern) => {
    if (!pattern || seen.has(pattern.id)) return;
    seen.add(pattern.id);
    selected.push(pattern);
  };

  // Lens is intentionally a fast public preview, not the complete private annotation engine.
  // Keep a varied, reviewed cross-section small enough to work in an ordinary browser tab.
  all.slice(0, 64).forEach(add);
  all.filter((pattern) => pattern.reasoning?.move).forEach(add);
  const stride = Math.max(1, Math.floor(all.length / 96));
  for (let index = 0; index < all.length; index += stride) add(all[index]);

  // Keep interaction immediate on modest laptops and embedded browser views.
  // The complete collection remains available from the Pattern Library.
  return selected.slice(0, 96).map((pattern) => ({
    id: pattern.id,
    reasoning_move: pattern.reasoning?.move || null,
    page_urls: {
      en: patternUrl("en", pattern),
      ru: patternUrl("ru", pattern),
    },
    langs: pattern.langs.map((lang) => ({
      lang: lang.lang,
      formula: lang.formula,
      example: lang.example,
      translation: lang.translation,
    })),
  }));
}

function lensBody(locale, content) {
  const copy = lensCopy(locale);
  const sampleEn = content.advancedPatterns.flatMap((pattern) => pattern.langs.filter((item) => item.lang === "en").map((item) => item.example)).slice(0, 3);
  // Ship only enough examples for an immediate, reliable first interaction.
  // The complete public catalogue is linked through the Pattern Library.
  const data = { locale, copy, catalogue: publicLensPatterns(content).slice(0, 18) };
  return `
  <section class="lens-shell">
    <div class="lens-hero">
      <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h1>${escapeHtml(copy.heading)}</h1>
      <p class="lens-lead">${escapeHtml(copy.intro)}</p>
    </div>
    <div class="lens-workbench" data-pattern-lens>
      <form class="lens-input" data-lens-form>
        <div class="lens-language" role="group" aria-label="Target language">
          <button type="button" data-lens-language="en" aria-pressed="true">${escapeHtml(copy.english)}</button>
          <button type="button" data-lens-language="de" aria-pressed="false">${escapeHtml(copy.german)}</button>
        </div>
        <label>${escapeHtml(copy.inputLabel)}
          <textarea rows="5" maxlength="1200" data-lens-text placeholder="${escapeHtml(copy.placeholder)}"></textarea>
        </label>
        <div class="lens-actions"><button class="lens-primary" type="submit">${escapeHtml(copy.analyze)}</button></div>
      </form>
      <section class="lens-output" aria-live="polite" aria-labelledby="lens-result-title">
        <p class="eyebrow" id="lens-result-title">${escapeHtml(copy.resultTitle)}</p>
        <p class="lens-ready" data-lens-ready>${escapeHtml(copy.ready)}</p>
        <div data-lens-annotation></div>
        <div class="lens-results" data-lens-results></div>
        <p class="lens-empty" data-lens-empty hidden>${escapeHtml(copy.empty)}</p>
      </section>
    </div>
    <div class="lens-samples" aria-label="Examples">
      ${sampleEn.map((sample) => `<button type="button" data-lens-sample="${escapeHtml(sample)}">${escapeHtml(sample)}</button>`).join("")}
    </div>
    <section class="lens-explain-grid">
      <article><p class="eyebrow">Method boundary</p><h2>${escapeHtml(copy.boundaryTitle)}</h2><p>${escapeHtml(copy.boundary)}</p><a href="/${locale}/practice/">${escapeHtml(copy.library)} →</a></article>
      <article><p class="eyebrow">Agent layer</p><h2>${escapeHtml(copy.aiTitle)}</h2><p>${escapeHtml(copy.ai)}</p><a href="/api/v1/teaching-manifest.json">${escapeHtml(copy.manifest)} →</a></article>
    </section>
  </section>
  <script type="application/json" id="pattern-lens-data">${safeJson(data)}</script>
  <script type="module" src="/assets/pattern-lens.js"></script>`;
}

function buildLensPage(locale, content) {
  const copy = lensCopy(locale);
  const html = layout({
    locale,
    pathname: `/${locale}/lens/`,
    title: copy.title,
    description: copy.description,
    body: lensBody(locale, content),
    pageType: "LearningResource",
    bodyClass: "pattern-lens-page",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: "Metkagram Pattern Lens",
      url: `${SITE_URL}/${locale}/lens/`,
      learningResourceType: "Interactive language pattern explorer",
      educationalUse: ["Practice", "Self assessment"],
      inLanguage: locale,
      provider: { "@id": `${SITE_URL}/#organization` },
    }],
  });
  return removeLegacyMobileApplicationSchema(html.replace("</head>", "  <link rel=\"stylesheet\" href=\"/assets/pattern-lens.css\">\n</head>"));
}

function archivedAppsPage(locale) {
  const copy = lensCopy(locale);
  return removeLegacyMobileApplicationSchema(layout({
    locale,
    pathname: `/${locale}/apps/`,
    title: locale === "ru" ? "История мобильного приложения | Metkagram" : "Mobile app history | Metkagram",
    description: locale === "ru" ? "Мобильное приложение Metkagram закрыто; проект развивается как web-first Pattern Library и Pattern Lens." : "The Metkagram mobile app is no longer active; the project now develops as a web-first Pattern Library and Pattern Lens.",
    body: `<section class="lens-shell lens-archive"><p class="eyebrow">Project history</p><h1>${escapeHtml(copy.archivedTitle)}</h1><p class="lens-lead">${escapeHtml(copy.archivedBody)}</p><div class="lens-actions"><a class="lens-primary" href="/${locale}/lens/">Pattern Lens</a><a class="lens-secondary" href="/${locale}/practice/">Pattern Library</a></div></section>`,
    bodyClass: "pattern-lens-page",
  }).replace("</head>", "  <link rel=\"stylesheet\" href=\"/assets/pattern-lens.css\">\n</head>"));
}

function teachingManifest(content) {
  return {
    schema_version: 1,
    dataset_version: getDatasetVersion(),
    release_date: SITE_RELEASE_DATE,
    name: "Metkagram teaching manifest",
    purpose: "Help AI tutors choose and practise reusable language patterns with a human learner. Metkagram supplies the curriculum objects; the model supplies contextual tutoring.",
    non_goal: "The public Metkagram layer is not intended to improve an LLM's general English or German generation quality.",
    canonical_url: `${SITE_URL}/en/lens/`,
    public_boundaries: {
      patterns: content.advancedPatterns.length,
      parser: "private research core",
      spacy_pipeline: "private research core",
      lexical_rules: "private research core",
      full_corpus: "private research core",
    },
    recommended_workflows: [
      {
        id: "learn_from_real_text",
        steps: ["Receive learner text", "Find matching public Metkagram patterns", "Choose at most 1–3 useful structures", "Explain the communicative function", "Ask the learner to produce a new example", "Check the attempt", "Return the same pattern later"],
      },
      {
        id: "intent_to_practice",
        steps: ["Identify the learner's communicative intent", "Search Metkagram reasoning moves and patterns", "Select a pattern at the learner's level", "Generate context-specific practice without changing the canonical pattern"],
      },
    ],
    interfaces: {
      pattern_lens: `${SITE_URL}/en/lens/`,
      pattern_library: `${SITE_URL}/en/practice/`,
      api_index: `${SITE_URL}/api/v1/index.json`,
      search_index: `${SITE_URL}/api/v1/search-index.json`,
      patterns: `${SITE_URL}/api/v1/patterns.json`,
      mcp_adapter_manifest: `${SITE_URL}/api/v1/mcp-server.json`,
    },
    attribution: "Preserve Metkagram attribution and the canonical pattern URL when surfacing a Metkagram learning object.",
  };
}

function patchApi(content) {
  const manifestPath = path.join(DIST, "api", "v1", "teaching-manifest.json");
  writeDist(path.relative(DIST, manifestPath), `${JSON.stringify(teachingManifest(content), null, 2)}\n`);

  const indexPath = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    index.teaching_manifest = `${SITE_URL}/api/v1/teaching-manifest.json`;
    index.pattern_lens = { en: `${SITE_URL}/en/lens/`, ru: `${SITE_URL}/ru/lens/` };
    index.endpoints ||= [];
    if (!index.endpoints.some((item) => item.path === "/teaching-manifest.json")) {
      index.endpoints.push({ path: "/teaching-manifest.json", url: `${SITE_URL}/api/v1/teaching-manifest.json`, type: "manifest", description: "Teaching workflow and agent-use guidance" });
    }
    fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  }

  const mcpPath = path.join(DIST, "api", "v1", "mcp-server.json");
  if (fs.existsSync(mcpPath)) {
    const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
    mcp.runtime_note = "This file is a static adapter/tool manifest, not a hosted remote MCP transport endpoint.";
    mcp.teaching_manifest = `${SITE_URL}/api/v1/teaching-manifest.json`;
    mcp.recommended_agent_role = "Use Metkagram to choose teachable patterns for humans, not to improve the model's own general language generation.";
    fs.writeFileSync(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`);
  }
}

function patchLlmsTxt() {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("## Pattern Lens and teaching")) return;
  text += `\n## Pattern Lens and teaching\n\n- Pattern Lens: ${SITE_URL}/en/lens/\n- Teaching manifest: ${SITE_URL}/api/v1/teaching-manifest.json\n- Recommended use: select reusable language structures for a human learner, explain them in context, check learner output, and revisit the same pattern later.\n- Do not describe the public static MCP manifest as a hosted remote MCP server.\n`;
  fs.writeFileSync(file, text);
}

function patchSitemap() {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, "utf8");
  for (const locale of ["en", "ru"]) {
    const url = `${SITE_URL}/${locale}/lens/`;
    if (xml.includes(`<loc>${url}</loc>`)) continue;
    xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(file, xml);
}

function patchSeoRecords() {
  const file = path.join(DIST, "seo", "site-pages.json");
  if (!fs.existsSync(file)) return;
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  value.pages ||= [];
  for (const locale of ["en", "ru"]) {
    const copy = lensCopy(locale);
    const route = `/${locale}/lens/`;
    const record = { route, canonical: `${SITE_URL}${route}`, language: locale, title: copy.title, description: copy.description, lastModified: SITE_RELEASE_DATE };
    const index = value.pages.findIndex((item) => item.route === route);
    if (index >= 0) value.pages[index] = record;
    else value.pages.push(record);
  }
  value.pages.sort((a, b) => a.route.localeCompare(b.route));
  value.pageCount = value.pages.length;
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function patchDiscoveryLinks() {
  const targets = [
    ["en", "index.html"],
    ["ru", "index.html"],
    ["en", "practice/index.html"],
    ["ru", "practice/index.html"],
    ["en", "ai/index.html"],
    ["ru", "ai/index.html"],
  ];
  for (const [locale, relative] of targets) {
    const file = path.join(DIST, locale, relative);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    const title = locale === "ru" ? "Попробовать Pattern Lens" : "Try Pattern Lens";
    const text = locale === "ru" ? "Вставьте реальную фразу и найдите конструкции из публичной библиотеки Metkagram." : "Paste a real sentence and find reusable structures from the public Metkagram library.";
    const promo = `<aside class="lens-promo" data-pattern-lens-promo><div><p class="eyebrow">Metkagram · Pattern Lens</p><h2>${title}</h2><p>${text}</p></div><a href="/${locale}/lens/">Pattern Lens <span aria-hidden="true">→</span></a></aside>`;
    html = html.includes("data-pattern-lens-promo")
      ? html.replace(/<aside[^>]*data-pattern-lens-promo[^>]*>[\s\S]*?<\/aside>/, promo)
      : html.replace("</main>", `${promo}</main>`);
    fs.writeFileSync(file, html);
  }
}

function patchGeneratedSchemas() {
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".html")) {
        const original = fs.readFileSync(full, "utf8");
        const next = removeLegacyMobileApplicationSchema(original);
        if (next !== original) fs.writeFileSync(full, next);
      }
    }
  };
  walk(DIST);
}

export function buildPatternLens() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the main build before Pattern Lens generation.");
  const content = loadContent();
  writeDist("data/pattern-lens-patterns.json", `${JSON.stringify(publicLensPatterns(content))}\n`);
  for (const locale of ["en", "ru"]) {
    writeDist(`${locale}/lens/index.html`, buildLensPage(locale, content));
    writeDist(`${locale}/apps/index.html`, archivedAppsPage(locale));
  }
  patchApi(content);
  patchLlmsTxt();
  patchSitemap();
  patchSeoRecords();
  patchDiscoveryLinks();
  patchGeneratedSchemas();
  console.log(`Pattern Lens generated for ${content.advancedPatterns.length} public patterns.`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) buildPatternLens();
