import fs from "node:fs";
import path from "node:path";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const DIST = path.resolve("dist");
const SOCIAL_PREVIEW = `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`;
const SOCIAL_ALT = "Metkagram — annotated language patterns for English and German";

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function ensureMeta(html, attribute, name, content) {
  if (html.includes(`<meta ${attribute}="${name}"`)) return html;
  return html.replace("</head>", `  <meta ${attribute}="${name}" content="${content}">\n</head>`);
}

function normalizeSocial(html, canonical, locale) {
  const title = html.match(/<meta property="og:title" content="([^"]+)">/)?.[1]
    || html.match(/<title>([^<]+)<\/title>/)?.[1]
    || "Metkagram";
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "Metkagram language patterns";
  const fields = [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "Metkagram"],
    ["property", "og:locale", locale === "ru" ? "ru_RU" : "en_US"],
    ["property", "og:locale:alternate", locale === "ru" ? "en_US" : "ru_RU"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", canonical],
    ["property", "og:image", SOCIAL_PREVIEW],
    ["property", "og:image:type", "image/png"],
    ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"],
    ["property", "og:image:alt", SOCIAL_ALT],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", SOCIAL_PREVIEW],
    ["name", "twitter:image:alt", SOCIAL_ALT]
  ];
  for (const [attribute, name, content] of fields) html = ensureMeta(html, attribute, name, content);
  return html;
}

function typesOf(node) {
  return Array.isArray(node?.["@type"]) ? node["@type"] : node?.["@type"] ? [node["@type"]] : [];
}

function normalizeJsonLd(html, canonical) {
  const expression = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const records = [...html.matchAll(expression)].map((match) => {
    try {
      return { data: JSON.parse(match[1]), remove: false };
    } catch {
      return { data: null, original: match[0], remove: false };
    }
  });
  const unsupported = new Set(["FAQPage", "MobileApplication", "SoftwareApplication"]);

  for (const record of records) {
    if (!record.data) continue;
    if (typesOf(record.data).some((type) => unsupported.has(type))) record.remove = true;
    if (Array.isArray(record.data["@graph"])) {
      record.data["@graph"] = record.data["@graph"].filter((node) => !typesOf(node).some((type) => unsupported.has(type)) && node?.["@id"] !== `${SITE_URL}/#mobile-application`);
    }
  }

  const active = records.filter((record) => record.data && !record.remove).map((record) => record.data);
  const nodes = active.flatMap((block) => [block, ...(Array.isArray(block["@graph"]) ? block["@graph"] : [])]);
  const page = nodes.find((node) => node?.["@id"] === `${canonical}#webpage`);
  const primaryTypes = ["LearningResource", "Dataset", "DataCatalog"];
  if (page) {
    const pagePrimaryType = primaryTypes.find((type) => typesOf(page).includes(type));
    let extractedPrimary;
    if (pagePrimaryType) {
      extractedPrimary = { ...page, "@type": pagePrimaryType };
      for (const key of ["@id", "isPartOf", "primaryImageOfPage", "breadcrumb", "mainEntity", "publisher"]) delete extractedPrimary[key];
      page["@type"] = "WebPage";
      delete page.mainEntityOfPage;
      for (const key of ["identifier", "learningResourceType", "educationalLevel", "teaches", "isAccessibleForFree", "audience", "educationalAlignment", "hasPart", "numberOfItems"]) delete page[key];
    }
    page.publisher ||= { "@id": `${SITE_URL}/#organization` };
    const separatePrimary = nodes.find((node) => node !== page && primaryTypes.some((type) => typesOf(node).includes(type)) && node.url === canonical);
    if (extractedPrimary && !separatePrimary) {
      const record = { data: extractedPrimary, remove: false, appended: true };
      records.push(record);
      active.push(extractedPrimary);
      nodes.push(extractedPrimary);
    }
  }

  const breadcrumb = nodes.find((node) => typesOf(node).includes("BreadcrumbList"));
  if (breadcrumb) {
    breadcrumb["@id"] ||= `${canonical}#breadcrumb`;
    breadcrumb.itemListElement = (breadcrumb.itemListElement || []).filter((item) => {
      try {
        const route = new URL(item.item).pathname;
        return !/^\/(?:en|ru)\/legal\/$/.test(route) && !/^\/(?:en|ru)\/practice\/(?:patterns|sets)\/$/.test(route);
      } catch {
        return true;
      }
    }).map((item, index) => ({ ...item, position: index + 1 }));
    if (page) page.breadcrumb = { "@id": breadcrumb["@id"] };
  }

  const primary = nodes.find((node) => node !== page && primaryTypes.some((type) => typesOf(node).includes(type)) && node.url === canonical);
  if (primary) {
    const type = primaryTypes.find((candidate) => typesOf(primary).includes(candidate));
    const suffix = type.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    primary["@id"] = `${canonical}#${suffix}`;
    primary.mainEntityOfPage ||= { "@id": `${canonical}#webpage` };
    primary.publisher ||= { "@id": `${SITE_URL}/#organization` };
    if (page) page.mainEntity = { "@id": primary["@id"] };
  }

  for (const node of nodes) {
    if (typesOf(node).includes("LearningResource") && node.isPartOf?.["@type"] === "LearningResource" && node.isPartOf.url) {
      node.isPartOf["@id"] ||= `${node.isPartOf.url}#learning-resource`;
    }
  }

  let index = 0;
  const normalized = html.replace(expression, () => {
    const record = records[index++];
    if (!record.data) return record.original;
    if (record.remove) return "";
    return `<script type="application/ld+json">${JSON.stringify(record.data).replaceAll("<", "\\u003c")}</script>`;
  });
  const appended = records.filter((record) => record.appended).map((record) => `<script type="application/ld+json">${JSON.stringify(record.data).replaceAll("<", "\\u003c")}</script>`).join("\n");
  return appended ? normalized.replace("</head>", `  ${appended}\n</head>`) : normalized;
}

if (!fs.existsSync(path.join(DIST, "sitemap.xml"))) throw new Error("dist/sitemap.xml is missing; run the base build first");

const files = htmlFiles(DIST);
const indexableCanonicals = new Set();
let changed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('http-equiv="refresh"')) continue;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)">/)?.[1] || "";
  if (!canonical || robots.startsWith("noindex")) continue;
  indexableCanonicals.add(canonical);
  const locale = new URL(canonical).pathname.startsWith("/ru/") ? "ru" : "en";
  const before = html;
  html = normalizeSocial(html, canonical, locale);
  html = normalizeJsonLd(html, canonical);
  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

const sitemapFile = path.join(DIST, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapFile, "utf8");
let sitemapAdded = 0;
for (const canonical of [...indexableCanonicals].sort()) {
  if (sitemap.includes(`<loc>${canonical}</loc>`)) continue;
  sitemap = sitemap.replace("</urlset>", `  <url><loc>${canonical}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  sitemapAdded += 1;
}
fs.writeFileSync(sitemapFile, sitemap);

process.stdout.write(`SEO graph normalization: ${changed} HTML files updated, ${sitemapAdded} sitemap URLs added.\n`);
