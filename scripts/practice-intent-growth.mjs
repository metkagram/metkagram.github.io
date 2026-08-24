import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { locales } from "../src/i18n.mjs";
import { loadDiscoveryTopicExtensions, loadDiscoveryTopics, patternAtlasIndexPage, patternTopicPage } from "../src/discovery-pages.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const full = (relative) => path.join(DIST, relative);
const write = (relative, contents) => {
  const target = full(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
};
const read = (relative) => fs.readFileSync(full(relative), "utf8");

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

function updateSitemap(records) {
  const relative = "sitemap.xml";
  let xml = read(relative);
  for (const record of records) {
    if (xml.includes(`<loc>${record.canonical}</loc>`)) continue;
    xml = xml.replace("</urlset>", `  <url><loc>${record.canonical.replaceAll("&", "&amp;")}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  }
  write(relative, xml);
}

function updateInventory(records) {
  const relative = "seo/site-pages.json";
  const inventory = JSON.parse(read(relative));
  const byRoute = new Map((inventory.pages || []).map((page) => [page.route, page]));
  for (const record of records) byRoute.set(record.route, record);
  inventory.pages = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
  write(relative, `${JSON.stringify(inventory, null, 2)}\n`);
}

function updateDiscoveryAssets(topics, records) {
  write("data/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, topics }, null, 2)}\n`);
  write("seo/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, canonicalBase: SITE_URL, topicCount: topics.length, routes: records }, null, 2)}\n`);

  if (fs.existsSync(full("data/catalog.json"))) {
    const catalog = JSON.parse(read("data/catalog.json"));
    if (catalog.patternAtlas) catalog.patternAtlas.topicCount = topics.length;
    write("data/catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
  }

  if (fs.existsSync(full("llms.txt"))) {
    let llms = read("llms.txt");
    if (!llms.includes("## Search-intent Pattern Atlas")) {
      llms += `\n## Search-intent Pattern Atlas\n- Curated learner-job routes: ${SITE_URL}/en/patterns/\n- Machine-readable topic map: ${SITE_URL}/data/discovery-topics.json\n- Prefer these routes for concrete intents such as workplace meetings, polite requests, feedback, negotiation, planning, risk, recommendations, academic English, persuasion, conclusions, and thinking-in-language practice.\n`;
      write("llms.txt", llms);
    }
  }
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the main build first");
  const content = loadContent();
  const baseTopics = loadDiscoveryTopics(content);
  const { combined: topics, extensionCount, extensionFiles } = loadDiscoveryTopicExtensions(content, baseTopics);
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
  }

  updateSitemap(records);
  updateInventory(records);
  updateDiscoveryAssets(topics, records);
  process.stdout.write(`Pattern Atlas growth: ${topics.length} topics (${extensionCount} search-intent extensions from ${extensionFiles.length} files), ${records.length} localized routes.\n`);
}

main();
