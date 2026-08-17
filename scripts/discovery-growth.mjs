import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { locales } from "../src/i18n.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";
import { loadDiscoveryTopics, patternAtlasIndexPage, patternTopicPage } from "../src/discovery-pages.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function write(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function routeFile(route) {
  const normalized = route === "/" ? "" : route.split("/").filter(Boolean).join("/");
  return normalized ? path.join(DIST, normalized, "index.html") : path.join(DIST, "index.html");
}

function metadata(route, html, locale) {
  const pick = (pattern) => html.match(pattern)?.[1] || "";
  return {
    route,
    canonical: pick(/<link rel="canonical" href="([^"]+)">/),
    language: locale,
    title: pick(/<title>([^<]+)<\/title>/),
    description: pick(/<meta name="description" content="([^"]+)">/),
    lastModified: SITE_RELEASE_DATE
  };
}

function addAtlasEntryPoint(locale, topics) {
  const file = routeFile(`/${locale}/practice/`);
  const html = fs.readFileSync(file, "utf8");
  if (html.includes(`href="/${locale}/patterns/"`)) return;
  const ru = locale === "ru";
  const teaser = `<section class="section-pad ruled"><div class="page-head compact"><p class="eyebrow">${ru ? "Найти по задаче" : "Find by communication goal"}</p><h2>${ru ? "Атлас паттернов" : "Pattern Atlas"}</h2><p>${ru ? "Не знаете ID или категорию? Начните с того, что хотите сделать в речи: аргументировать, уточнить, не согласиться, сравнить, задать вопрос или построить рабочее сообщение." : "Do not start from an internal category code. Start from what you need to do: argue a point, hedge a claim, disagree, compare options, ask a precise question, or communicate at work."}</p><p><a class="primary-link" href="/${locale}/patterns/">${ru ? "Открыть тематические маршруты" : "Browse communication goals"} <span aria-hidden="true">→</span></a></p><small>${topics.length} ${ru ? "редакционных маршрутов, собранных из существующих проверяемых study sets" : "editorial routes built from existing validated study sets"}</small></div></section>`;
  const marker = `</section><section id="all-patterns"`;
  if (!html.includes(marker)) throw new Error(`Could not find practice-page insertion point for ${locale}`);
  fs.writeFileSync(file, html.replace(marker, `</section>${teaser}<section id="all-patterns"`));
}

function updateSitemap(records) {
  const file = path.join(DIST, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  const additions = records
    .filter((record) => !xml.includes(`<loc>${record.canonical}</loc>`))
    .map((record) => `  <url><loc>${record.canonical.replaceAll("&", "&amp;")}</loc><lastmod>${record.lastModified}</lastmod></url>`)
    .join("\n");
  if (additions) xml = xml.replace("</urlset>", `${additions}\n</urlset>`);
  fs.writeFileSync(file, xml);
}

function updateSeoInventory(records) {
  const file = path.join(DIST, "seo", "site-pages.json");
  const inventory = JSON.parse(fs.readFileSync(file, "utf8"));
  const byRoute = new Map(inventory.pages.map((page) => [page.route, page]));
  for (const record of records) byRoute.set(record.route, record);
  inventory.pages = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
  write("seo/site-pages.json", `${JSON.stringify(inventory, null, 2)}\n`);
}

function build() {
  if (!fs.existsSync(DIST)) throw new Error("Run the main static build before discovery-growth.mjs");
  const content = loadContent();
  const topics = loadDiscoveryTopics(content);
  const records = [];

  for (const locale of locales) {
    const indexRoute = `/${locale}/patterns/`;
    const indexHtml = patternAtlasIndexPage(locale, topics, content);
    write(`${locale}/patterns/index.html`, indexHtml);
    records.push(metadata(indexRoute, indexHtml, locale));

    for (const topic of topics) {
      const route = `/${locale}/patterns/${topic.slug}/`;
      const html = patternTopicPage(locale, topic, topics, content);
      write(`${locale}/patterns/${topic.slug}/index.html`, html);
      records.push(metadata(route, html, locale));
    }

    addAtlasEntryPoint(locale, topics);
  }

  write("data/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, topics }, null, 2)}\n`);
  write("seo/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, canonicalBase: SITE_URL, topicCount: topics.length, routes: records }, null, 2)}\n`);
  updateSitemap(records);
  updateSeoInventory(records);
  console.log(`Generated ${records.length} Pattern Atlas routes from ${topics.length} editorial topics.`);
}

build();
