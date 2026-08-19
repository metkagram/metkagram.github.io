import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { ATTRIBUTION, getDatasetVersion, wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const DIST = path.resolve("dist");
const API = `${SITE_URL}/api/v1`;
const recipes = [
  ["intent", "Find a pattern for what you want to say", "Найдите паттерн под свою мысль", "Use Metkagram as the source. I want to disagree politely. Find the closest reviewed pattern, keep its stable ID and canonical URL, explain why it fits, then ask me to write my own example."],
  ["sentence", "Improve my sentence with a canonical pattern", "Улучшите мою фразу через канонический паттерн", "Use Metkagram to analyse my sentence. Find the closest published pattern, cite its stable ID and canonical URL, explain the difference, then suggest one revision that preserves my meaning."],
  ["retrieval", "Practise retrieval before feedback", "Тренируйте воспроизведение до подсказки", "Choose one B2–C1 Metkagram pattern. Give me a realistic situation first and hide the formula until I answer. Then grade my attempt against the canonical pattern and cite it."],
  ["contrast", "Compare two nearby constructions", "Сравните две близкие конструкции", "Find two related Metkagram patterns for the same communicative move. Compare meaning, register and context. Keep both stable IDs and canonical links in the answer."],
  ["transfer", "Practise English–German transfer", "Тренируйте перенос между английским и немецким", "Use reviewed Metkagram cross-language records. Show how the same communicative move is realised in English and German, cite canonical IDs, then ask me to produce both versions."],
  ["lesson", "Build a ten-minute lesson", "Соберите десятиминутный урок", "Build a 10-minute B2–C1 lesson using published Metkagram objects: 3 patterns, one contrast and one retrieval task. Preserve stable IDs and canonical URLs."],
].map(([id, title_en, title_ru, prompt]) => ({ id, title_en, title_ru, prompt }));

function write(relative, content) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function patch(relative, mutate) {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  const after = mutate(before);
  if (after !== before) fs.writeFileSync(file, after);
}
function patchJson(relative, mutate) {
  patch(relative, (text) => { const value = JSON.parse(text); mutate(value); return `${JSON.stringify(value, null, 2)}\n`; });
}
function cards(locale, count = recipes.length) {
  const ru = locale === "ru";
  return recipes.slice(0, count).map((r, i) => `<article class="pattern-reader" id="${r.id}"><p class="eyebrow">${String(i + 1).padStart(2, "0")} · AI workflow</p><h2>${escapeHtml(ru ? r.title_ru : r.title_en)}</h2><pre><code>${escapeHtml(r.prompt)}</code></pre></article>`).join("");
}
function page(locale, kind) {
  const ru = locale === "ru";
  const config = {
    use: {
      slug: "use-with-ai",
      title: ru ? "Используйте Metkagram вместе с AI" : "Use Metkagram with AI",
      desc: ru ? "Практические сценарии для ChatGPT, Claude и других AI: поиск паттернов, разбор фраз и retrieval practice." : "Practical workflows for ChatGPT, Claude and other AI tools: pattern retrieval, sentence analysis and retrieval practice.",
      body: `<section class="page-head section-pad"><p class="eyebrow">Metkagram · AI-assisted learning</p><h1>${ru ? "Используйте Metkagram вместе с AI" : "Use Metkagram with AI"}</h1><p class="lede">${ru ? "AI может быть интерфейсом и тренером. Metkagram остаётся источником проверяемых паттернов, stable IDs, контрастов и примеров." : "AI can be the interface and tutor. Metkagram remains the source of inspectable patterns, stable IDs, contrasts and examples."}</p><div class="legal-inline-links"><a href="/${locale}/ai-cookbook/">AI Cookbook →</a><a href="/${locale}/mcp/">MCP →</a></div></section><section class="section-pad ruled"><h2>${ru ? "Начинайте с задачи, а не с технологии" : "Start with the job, not the technology"}</h2><div class="pattern-comparison-list">${cards(locale, 4)}</div></section><section class="section-pad ruled"><h2>${ru ? "Просите AI сохранять источник" : "Require the AI to keep the source"}</h2><p>${ru ? "Ответ должен сохранять stable ID и canonical URL. Если reviewed-соответствия нет, лучше сказать об этом, чем выдумать новый «паттерн Metkagram»." : "Keep the stable ID and canonical URL in the answer. If no reviewed match exists, say so instead of inventing a new ‘Metkagram pattern’."}</p><div class="legal-inline-links"><a href="/${locale}/data/">Datasets →</a><a href="/${locale}/build-with-metkagram/">Build with Metkagram →</a></div></section>`,
    },
    cookbook: {
      slug: "ai-cookbook",
      title: ru ? "AI Cookbook для изучения языка" : "AI Language Learning Cookbook",
      desc: ru ? "Готовые AI-сценарии, основанные на канонических объектах Metkagram." : "Reusable AI workflows grounded in canonical Metkagram learning objects.",
      body: `<section class="page-head section-pad"><p class="eyebrow">Metkagram · Cookbook</p><h1>${ru ? "AI Cookbook для изучения языка" : "AI Language Learning Cookbook"}</h1><p class="lede">${ru ? "Копируйте запрос как стартовую инструкцию. Смысл не в магии prompt engineering, а в работе AI с конкретными проверяемыми объектами." : "Use each prompt as a starting instruction. The value is not prompt-engineering folklore; it is grounding AI in concrete, inspectable objects."}</p></section><section class="section-pad ruled"><div class="pattern-comparison-list">${cards(locale)}</div></section><section class="section-pad ruled"><a class="text-link" href="/api/v1/ai-recipes.json"><code>/api/v1/ai-recipes.json</code> →</a></section>`,
    },
    build: {
      slug: "build-with-metkagram",
      title: ru ? "Создавайте AI-инструменты с Metkagram" : "Build AI language tools with Metkagram",
      desc: ru ? "Используйте публичные паттерны Metkagram через JSON API, discovery index и MCP bridge." : "Use Metkagram public patterns through the JSON API, discovery index and MCP bridge.",
      body: `<section class="page-head section-pad"><p class="eyebrow">Developer quickstart</p><h1>${ru ? "Создавайте AI-инструменты с Metkagram" : "Build AI language tools with Metkagram"}</h1><p class="lede">${ru ? "Не скрейпьте HTML. Публичный слой уже отдаёт provenance, stable IDs и canonical links через JSON endpoints." : "Do not scrape HTML. The public layer already exposes provenance, stable IDs and canonical links through JSON endpoints."}</p><div class="legal-inline-links"><a href="/${locale}/mcp/">MCP →</a><a href="/${locale}/ai/">API docs →</a><a href="/${locale}/data/">Datasets →</a></div></section><section class="section-pad ruled"><div class="pattern-comparison-list"><article class="pattern-reader"><p class="eyebrow">01 · Intent → pattern</p><h2><code>/api/v1/discovery.json</code></h2><p>${ru ? "Идите от коммуникативной задачи к нужной поверхности и каноническим объектам." : "Start from a communicative job and resolve the right surface and canonical objects."}</p></article><article class="pattern-reader"><p class="eyebrow">02 · Pattern → tutor</p><h2><code>/api/v1/patterns/{pattern-id}.json</code></h2><p>${ru ? "Передавайте модели формулу, примеры, stable ID и canonical URL, а подачу адаптируйте под ученика." : "Give the model the formula, examples, stable ID and canonical URL, then adapt delivery to the learner."}</p></article><article class="pattern-reader"><p class="eyebrow">03 · Recipes → workflow</p><h2><code>/api/v1/ai-recipes.json</code></h2><p>${ru ? "Используйте публичные сценарии как integration examples." : "Use public recipes as integration examples."}</p></article></div></section><section class="section-pad ruled"><p>${escapeHtml(ATTRIBUTION.attribution_text)}</p></section>`,
    },
  }[kind];
  const pathname = `/${locale}/${config.slug}/`;
  return [config.slug, layout({ locale, pathname, title: `${config.title} | Metkagram`, description: config.desc, body: config.body, pageType: kind === "build" ? "TechArticle" : "LearningResource" }), config.title, config.desc];
}

const routeRecords = [];
for (const locale of ["en", "ru"]) {
  for (const kind of ["use", "cookbook", "build"]) {
    const [slug, html, title, description] = page(locale, kind);
    const route = `/${locale}/${slug}/`;
    write(`${locale}/${slug}/index.html`, html);
    routeRecords.push({ route, canonical: `${SITE_URL}${route}`, language: locale, title: `${title} | Metkagram`, description, lastModified: SITE_RELEASE_DATE });
  }
}

const recipeIndex = { schemaVersion: 1, datasetVersion: getDatasetVersion(), releaseDate: SITE_RELEASE_DATE, canonicalPage: `${SITE_URL}/en/ai-cookbook/`, rights: ATTRIBUTION, recipes };
write("data/ai-recipes.json", `${JSON.stringify(recipeIndex, null, 2)}\n`);
write("api/v1/ai-recipes.json", `${JSON.stringify(wrapRecord(recipeIndex, { canonical_url: `${API}/ai-recipes.json`, record_type: "ai_learning_recipes", record_id: "metkagram-ai-cookbook" }), null, 2)}\n`);

for (const locale of ["en", "ru"]) {
  const ru = locale === "ru";
  patch(`${locale}/data/index.html`, (html) => html.includes("data-ai-data-bridge") ? html : html.replace("</main>", `<section class="ai-section section-pad ruled" data-ai-data-bridge><div><p class="eyebrow">AI</p><h2>${ru ? "Используйте эти данные через AI" : "Use these datasets through AI"}</h2></div><div class="legal-inline-links"><a href="/${locale}/use-with-ai/">${ru ? "Для изучающих язык" : "For learners"} →</a><a href="/${locale}/build-with-metkagram/">${ru ? "Для разработчиков" : "For developers"} →</a></div></section></main>`));
  patch(`${locale}/ai/index.html`, (html) => html.includes("data-ai-adoption-bridge") ? html : html.replace("</main>", `<section class="ai-section section-pad ruled" data-ai-adoption-bridge><div><p class="eyebrow">AI adoption</p><h2>${ru ? "Сначала сценарий, потом endpoint" : "Start with the workflow, then the endpoint"}</h2></div><div class="legal-inline-links"><a href="/${locale}/use-with-ai/">Use with AI →</a><a href="/${locale}/ai-cookbook/">AI Cookbook →</a><a href="/${locale}/build-with-metkagram/">Build with Metkagram →</a></div></section></main>`));
}

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.endpoints ||= [];
  if (!root.endpoints.some((x) => x.path === "/ai-recipes.json")) root.endpoints.push({ path: "/ai-recipes.json", url: `${API}/ai-recipes.json`, type: "index", description: "AI learning workflows grounded in canonical Metkagram objects" });
});
patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((x) => x.name === "metkagram_get_ai_recipes")) spec.tools.push({ name: "metkagram_get_ai_recipes", title: "Get AI learning recipes", description: "List public AI workflows that preserve stable IDs and canonical URLs.", inputSchema: { type: "object", additionalProperties: false }, staticUrl: `${API}/ai-recipes.json` });
  spec.tools.sort((a, b) => a.name.localeCompare(b.name));
});
for (const relative of ["data/discovery.json", "api/v1/discovery.json"]) patchJson(relative, (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.surfaces ||= [];
  if (!root.surfaces.some((x) => x.id === "use-with-ai")) root.surfaces.push({ id: "use-with-ai", audience: ["language learner", "teacher", "AI tutor user"], pages: { en: `${SITE_URL}/en/use-with-ai/`, ru: `${SITE_URL}/ru/use-with-ai/` }, recipes: `${API}/ai-recipes.json` });
});

patch("llms.txt", (text) => text.includes("## AI adoption guides") ? text : `${text}\n## AI adoption guides\n- Use with AI: ${SITE_URL}/en/use-with-ai/\n- AI Cookbook: ${SITE_URL}/en/ai-cookbook/\n- Build with Metkagram: ${SITE_URL}/en/build-with-metkagram/\n- Machine recipes: ${API}/ai-recipes.json\n- Preserve stable IDs, canonical URLs, provenance and attribution.\n`);
patch("sitemap.xml", (xml) => routeRecords.reduce((out, item) => out.includes(`<loc>${item.canonical}</loc>`) ? out : out.replace("</urlset>", `  <url><loc>${item.canonical}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`), xml));
patchJson("seo/site-pages.json", (inventory) => {
  inventory.pages ||= [];
  for (const item of routeRecords) { const i = inventory.pages.findIndex((x) => x.route === item.route); if (i >= 0) inventory.pages[i] = item; else inventory.pages.push(item); }
  inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
});

console.log(`AI adoption layer published: ${routeRecords.length} localized pages, ${recipes.length} recipes.`);
