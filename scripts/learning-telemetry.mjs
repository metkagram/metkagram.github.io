import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layout, escapeHtml, SITE_URL } from "../src/render.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SCHEMA_SOURCE = path.join(ROOT, "data", "learning-event.schema.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeFile = (relative, content) => {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const writeJson = (relative, value) => writeFile(relative, `${JSON.stringify(value, null, 2)}\n`);

function patchJson(relative, mutate) {
  const target = path.join(DIST, relative);
  if (!fs.existsSync(target)) return;
  const value = readJson(target);
  mutate(value);
  writeJson(relative, value);
}

function copy(locale) {
  return locale === "ru"
    ? {
        title: "Локальная учебная активность | Metkagram",
        description: "Посмотрите и экспортируйте учебные события, которые Metkagram хранит только в этом браузере.",
        eyebrow: "Metkagram · Local activity",
        heading: "Ваш учебный журнал остаётся у вас.",
        intro: "Metkagram может локально записывать несколько действий, чтобы вы видели свой путь по patterns, contrasts, drills и reasoning routes. Эти данные не отправляются на сервер автоматически.",
        note: "Записываются только тип события, stable object ID, локаль, путь страницы, время и случайный ID текущей вкладки. Текст, который вы вставляете в Pattern Lens, не сохраняется.",
        privacy: "Что принципиально не собирается",
        points: ["текст пользователя и содержимое Pattern Lens", "email, имя, IP или постоянный user ID", "cookies для аналитики и cross-site identifiers", "автоматическая отправка событий Metkagram или третьим сторонам"],
        schema: "Открыть схему событий",
      }
    : {
        title: "Local learning activity | Metkagram",
        description: "Inspect and export learning events that Metkagram stores only in this browser.",
        eyebrow: "Metkagram · Local activity",
        heading: "Your learning trail stays with you.",
        intro: "Metkagram can record a small set of learning actions locally so you can inspect your route through patterns, contrasts, drills and reasoning routes. Nothing is uploaded automatically.",
        note: "Only the event type, stable object ID, locale, page path, time and a random current-tab session ID are stored. Text pasted into Pattern Lens is never recorded.",
        privacy: "Deliberately not collected",
        points: ["learner text or Pattern Lens input", "email, name, IP address or persistent user ID", "analytics cookies or cross-site identifiers", "automatic event uploads to Metkagram or third parties"],
        schema: "Open event schema",
      };
}

function activityPage(locale) {
  const t = copy(locale);
  return layout({
    locale,
    pathname: `/${locale}/activity/`,
    title: t.title,
    description: t.description,
    bodyClass: "learning-activity-page",
    pageType: "WebPage",
    body: `<section class="activity-shell"><div class="activity-hero"><p class="eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.heading)}</h1><p class="lede">${escapeHtml(t.intro)}</p></div><div class="activity-note"><strong>Local-first telemetry</strong><p>${escapeHtml(t.note)}</p></div><div data-learning-activity></div><section><h2>${escapeHtml(t.privacy)}</h2><ul class="activity-privacy-list">${t.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul><p><a href="/data/learning-event.schema.json">${escapeHtml(t.schema)} →</a></p></section></section>`,
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: locale === "ru" ? "Локальная учебная активность Metkagram" : "Metkagram local learning activity",
      url: `${SITE_URL}/${locale}/activity/`,
      inLanguage: locale,
      description: t.description,
    }],
  }).replace("</head>", "  <link rel=\"stylesheet\" href=\"/assets/learning-activity.css\">\n</head>")
    .replace("</body>", "  <script src=\"/assets/learning-events.js\"></script>\n  <script src=\"/assets/learning-activity.js\"></script>\n</body>");
}

function injectRuntime() {
  const roots = ["lens", "clinic", "packs", "transfer", "exports"];
  for (const locale of ["en", "ru"]) {
    for (const rootName of roots) {
      const root = path.join(DIST, locale, rootName);
      if (!fs.existsSync(root)) continue;
      const stack = [root];
      while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) stack.push(full);
          else if (entry.isFile() && entry.name === "index.html") {
            let html = fs.readFileSync(full, "utf8");
            if (!html.includes("/assets/learning-events.js")) html = html.replace("</body>", "  <script src=\"/assets/learning-events.js\"></script>\n</body>");
            if (!html.includes("data-learning-activity-bridge")) {
              const label = locale === "ru" ? "Локальная активность" : "Local activity";
              const note = locale === "ru" ? "События остаются в этом браузере." : "Events stay in this browser.";
              const bridge = `<aside data-learning-activity-bridge style="margin:2rem auto;max-width:72rem;padding:1rem 1.1rem;border:1px solid #e1e1db;border-radius:16px"><strong>${label}</strong><p>${note} <a href="/${locale}/activity/">${label} →</a></p></aside>`;
              html = html.replace("</main>", `${bridge}</main>`);
            }
            fs.writeFileSync(full, html);
          }
        }
      }
    }
  }
}

function patchPrivacyPages() {
  for (const locale of ["en", "ru"]) {
    const target = path.join(DIST, locale, "legal", "privacy", "index.html");
    if (!fs.existsSync(target)) continue;
    let html = fs.readFileSync(target, "utf8");
    if (html.includes("data-local-learning-privacy")) continue;
    const title = locale === "ru" ? "Локальная учебная активность" : "Local learning activity";
    const text = locale === "ru"
      ? "Metkagram хранит ограниченный журнал учебных действий только в localStorage этого браузера. Текст Pattern Lens не записывается, события не отправляются автоматически. Пользователь может посмотреть, экспортировать или удалить журнал на странице Local activity."
      : "Metkagram keeps a bounded learning-action log only in this browser's localStorage. Pattern Lens text is not recorded and events are not uploaded automatically. The learner can inspect, export or delete the log on the Local activity page.";
    const section = `<section data-local-learning-privacy><h2>${title}</h2><p>${text}</p><p><a href="/${locale}/activity/">${title} →</a></p></section>`;
    html = html.replace("</main>", `${section}</main>`);
    fs.writeFileSync(target, html);
  }
}

function patchMachineSurfaces(schema) {
  writeJson("data/learning-event.schema.json", schema);
  writeJson("api/v1/learning-event-schema.json", schema);

  patchJson("api/v1/index.json", (index) => {
    index.learning_event_schema = `${SITE_URL}/api/v1/learning-event-schema.json`;
    index.local_learning_activity = { en: `${SITE_URL}/en/activity/`, ru: `${SITE_URL}/ru/activity/` };
    index.endpoints ||= [];
    if (!index.endpoints.some((item) => item.path === "/learning-event-schema.json")) index.endpoints.push({ path: "/learning-event-schema.json", url: `${SITE_URL}/api/v1/learning-event-schema.json`, type: "schema", description: "Schema for privacy-safe browser-local learning events" });
  });

  patchJson("api/v1/mcp-server.json", (mcp) => {
    mcp.local_learning_activity = {
      schema: `${SITE_URL}/api/v1/learning-event-schema.json`,
      note: "Learning events are browser-local and are never available to a remote MCP client unless a learner explicitly exports and provides them.",
    };
    mcp.tools ||= [];
    if (!mcp.tools.some((tool) => tool.name === "metkagram_get_learning_event_schema")) mcp.tools.push({ name: "metkagram_get_learning_event_schema", description: "Read the schema for learner-controlled browser-local activity exports.", method: "GET", url: `${SITE_URL}/api/v1/learning-event-schema.json` });
  });

  patchJson("api/v1/openapi.json", (openapi) => {
    openapi.paths ||= {};
    openapi.paths["/learning-event-schema.json"] = { get: { summary: "Get the local learning event schema", responses: { "200": { description: "JSON Schema for learner-controlled local activity" } } } };
  });
}

function patchDiscovery() {
  const llms = path.join(DIST, "llms.txt");
  if (fs.existsSync(llms)) {
    let text = fs.readFileSync(llms, "utf8");
    if (!text.includes("## Local learning activity")) {
      text += `\n## Local learning activity\n\n- Activity page: ${SITE_URL}/en/activity/\n- Event schema: ${SITE_URL}/api/v1/learning-event-schema.json\n- Events remain in browser localStorage and are not uploaded automatically. Pattern Lens input text is never recorded.\n`;
      fs.writeFileSync(llms, text);
    }
  }

  const sitemap = path.join(DIST, "sitemap.xml");
  if (fs.existsSync(sitemap)) {
    let xml = fs.readFileSync(sitemap, "utf8");
    for (const locale of ["en", "ru"]) {
      const url = `${SITE_URL}/${locale}/activity/`;
      if (!xml.includes(`<loc>${url}</loc>`)) xml = xml.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
    }
    fs.writeFileSync(sitemap, xml);
  }

  patchJson("seo/site-pages.json", (inventory) => {
    inventory.pages ||= [];
    for (const locale of ["en", "ru"]) {
      const t = copy(locale);
      const route = `/${locale}/activity/`;
      const record = { route, canonical: `${SITE_URL}${route}`, language: locale, title: t.title, description: t.description, lastModified: SITE_RELEASE_DATE };
      const index = inventory.pages.findIndex((page) => page.route === route);
      if (index >= 0) inventory.pages[index] = record;
      else inventory.pages.push(record);
    }
    inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
    inventory.pageCount = inventory.pages.length;
  });
}

export function buildLearningTelemetry() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the main build first.");
  const schema = readJson(SCHEMA_SOURCE);
  if (schema?.properties?.event_name?.enum?.length < 6) throw new Error("Learning event schema must define the reviewed event vocabulary.");
  for (const locale of ["en", "ru"]) writeFile(`${locale}/activity/index.html`, activityPage(locale));
  injectRuntime();
  patchPrivacyPages();
  patchMachineSurfaces(schema);
  patchDiscovery();
  console.log(`Privacy-safe learning activity published: ${schema.properties.event_name.enum.length} local-only event types.`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) buildLearningTelemetry();
