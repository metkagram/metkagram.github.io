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

function loadPartnershipOpportunities() {
  const file = path.join(ROOT, "data", "partnership-opportunities.json");
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.opportunities) || !payload.opportunities.length) {
    throw new Error("data/partnership-opportunities.json must contain schemaVersion 1 and opportunities");
  }
  return payload.opportunities;
}

function addAtlasEntryPoint(locale, topics) {
  const file = routeFile(`/${locale}/practice/`);
  const html = fs.readFileSync(file, "utf8");
  if (html.includes(`href="/${locale}/patterns/"`)) return;
  const ru = locale === "ru";
  const teaser = `<details id="pattern-atlas" class="practice-secondary-path ruled" data-practice-secondary="atlas"><summary><span>${ru ? "Углублённый поиск" : "Deeper exploration"}</span><strong>${ru ? "Атлас паттернов" : "Pattern Atlas"}</strong><small>${ru ? "Тематические маршруты по коммуникативной задаче" : "Editorial routes organised by communication goal"}</small></summary><div class="practice-secondary-body section-pad"><p>${ru ? "Не знаете ID или категорию? Начните с того, что хотите сделать в речи: аргументировать, уточнить, не согласиться, сравнить, задать вопрос или построить рабочее сообщение." : "Do not start from an internal category code. Start from what you need to do: argue a point, hedge a claim, disagree, compare options, ask a precise question, or communicate at work."}</p><p><a class="primary-link" href="/${locale}/patterns/">${ru ? "Открыть тематические маршруты" : "Browse communication goals"} <span aria-hidden="true">→</span></a></p><small>${topics.length} ${ru ? "редакционных маршрутов, собранных из существующих проверяемых study sets" : "editorial routes built from existing validated study sets"}</small></div></details>`;
  const marker = `<section id="all-patterns"`;
  if (!html.includes(marker)) throw new Error(`Could not find practice-page insertion point for ${locale}`);
  fs.writeFileSync(file, html.replace(marker, `${teaser}<section id="all-patterns"`));
}

function addPartnershipPilots(locale, opportunities) {
  const file = routeFile(`/${locale}/support/`);
  const html = fs.readFileSync(file, "utf8");
  if (html.includes('id="partnership-pilots"')) return;
  const ru = locale === "ru";
  const section = `<section id="partnership-pilots" class="research-questions section-pad ruled"><div><p class="eyebrow">06 · ${ru ? "Конкретные пилоты" : "Concrete pilot packages"}</p><h2>${ru ? "Партнёрство должно начинаться с результата" : "Start with a small outcome, not a vague collaboration"}</h2><p>${ru ? "Каждый формат ниже можно запустить как ограниченный пилот с понятными артефактами, границами лицензии и критерием успеха." : "Each format below can start as a bounded pilot with explicit deliverables, license boundaries and a success criterion."}</p></div><ol>${opportunities.map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${ru ? item.title_ru : item.title_en}</h3><p><b>${ru ? "Для кого" : "For"}:</b> ${ru ? item.audience_ru : item.audience_en}</p><p>${ru ? item.offer_ru : item.offer_en}</p><small><b>${ru ? "Результат" : "Pilot outcome"}:</b> ${ru ? item.outcome_ru : item.outcome_en}</small></div></li>`).join("")}</ol></section>`;
  const closingArticle = html.lastIndexOf("</article>");
  if (closingArticle < 0) throw new Error(`Could not find support-page article boundary for ${locale}`);
  fs.writeFileSync(file, `${html.slice(0, closingArticle)}${section}${html.slice(closingArticle)}`);
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

function updateMachineDiscovery(topics, opportunities) {
  const catalogFile = path.join(DIST, "data", "catalog.json");
  if (fs.existsSync(catalogFile)) {
    const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
    catalog.patternAtlas = {
      description: "Editorial routes from real learner communication goals to validated Metkagram study sets and canonical patterns.",
      topicCount: topics.length,
      dataset: `${SITE_URL}/data/discovery-topics.json`,
      pages: { en: `${SITE_URL}/en/patterns/`, ru: `${SITE_URL}/ru/patterns/` }
    };
    catalog.partnershipOpportunities = {
      description: "Bounded research, teaching, learning-tool and AI-tutor pilot packages.",
      count: opportunities.length,
      dataset: `${SITE_URL}/data/partnership-opportunities.json`,
      pages: { en: `${SITE_URL}/en/support/#partnership-pilots`, ru: `${SITE_URL}/ru/support/#partnership-pilots` }
    };
    write("data/catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
  }

  const llmsFile = path.join(DIST, "llms.txt");
  if (fs.existsSync(llmsFile)) {
    let text = fs.readFileSync(llmsFile, "utf8");
    if (!text.includes("## Pattern Atlas")) {
      text += `\n## Pattern Atlas\n- Human-first topic index: ${SITE_URL}/en/patterns/\n- Russian topic index: ${SITE_URL}/ru/patterns/\n- Curated topic map: ${SITE_URL}/data/discovery-topics.json\n- Use Pattern Atlas when the learner knows the communication goal but not a Metkagram ID or grammar label. Prefer the narrowest matching topic, then cite the canonical study-set or pattern URL.\n`;
    }
    if (!text.includes("## Partnership pilots")) {
      text += `\n## Partnership pilots\n- Public collaboration packages: ${SITE_URL}/en/support/#partnership-pilots\n- Machine-readable pilot list: ${SITE_URL}/data/partnership-opportunities.json\n- Treat these as proposed bounded pilots, not as evidence of existing partners or traction.\n`;
    }
    fs.writeFileSync(llmsFile, text);
  }
}

function build() {
  if (!fs.existsSync(DIST)) throw new Error("Run the main static build before discovery-growth.mjs");
  const content = loadContent();
  const topics = loadDiscoveryTopics(content);
  const opportunities = loadPartnershipOpportunities();
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
    addPartnershipPilots(locale, opportunities);
  }

  write("data/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, topics }, null, 2)}\n`);
  write("data/partnership-opportunities.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, opportunities }, null, 2)}\n`);
  write("seo/discovery-topics.json", `${JSON.stringify({ schemaVersion: 1, generatedAt: SITE_RELEASE_DATE, canonicalBase: SITE_URL, topicCount: topics.length, routes: records }, null, 2)}\n`);
  updateSitemap(records);
  updateSeoInventory(records);
  updateMachineDiscovery(topics, opportunities);
  console.log(`Generated ${records.length} Pattern Atlas routes from ${topics.length} editorial topics and published ${opportunities.length} partnership pilots.`);
}

build();
