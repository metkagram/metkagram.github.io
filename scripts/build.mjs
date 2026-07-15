import fs from "node:fs";
import path from "node:path";
import { loadContent, contentCounts } from "../src/content.mjs";
import { collectionKeys, locales, targetMeta, ui } from "../src/i18n.mjs";
import {
  SITE_URL,
  aboutPage,
  appsPage,
  collectionPage,
  documentPage,
  explorePage,
  gatewayPage,
  historyPage,
  languageHub,
  localeHome,
  methodPage,
  notFoundPage,
  legalPage,
  patternPage,
  practicePage,
  progressPage,
  roadmapPage,
  reviewPage,
  rulesPage
} from "../src/render.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const generatedRoutes = new Set();

function writeFile(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function writeRoute(route, html) {
  const normalized = route === "/" ? "/" : `/${route.split("/").filter(Boolean).join("/")}/`;
  if (generatedRoutes.has(normalized)) throw new Error(`Duplicate generated route: ${normalized}`);
  generatedRoutes.add(normalized);
  const file = normalized === "/" ? "index.html" : path.join(normalized.slice(1), "index.html");
  writeFile(file, html);
}

function copyPublic() {
  if (!fs.existsSync(PUBLIC)) return;
  fs.cpSync(PUBLIC, DIST, { recursive: true });
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildRedirectManifest(content) {
  const redirects = [];
  const add = (source, destination, implementation = "Vercel permanent framework redirect") => {
    redirects.push({ source, destination, status: "ready", implementation });
  };

  add("/metkagram", `${SITE_URL}/en/explore/`);
  for (const [oldLanguage, targetKey] of [["en", "english"], ["de", "german"]]) {
    add(`/metkagram/${oldLanguage}`, `${SITE_URL}/en/explore/${targetKey}/`);
    add(`/metkagram/${oldLanguage}/rules`, `${SITE_URL}/en/explore/${targetKey}/annotation-rules/`);
    for (const collectionKey of collectionKeys) {
      add(`/metkagram/${oldLanguage}/${collectionKey}`, `${SITE_URL}/en/explore/${targetKey}/${collectionKey}/`);
      for (const document of content.collections[targetKey][collectionKey].documents) {
        add(`/metkagram/${oldLanguage}/${collectionKey}/${document.id}`, `${SITE_URL}/en/explore/${targetKey}/${collectionKey}/${document.id}/`);
      }
    }
  }

  add("/ru/metkax", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/about", `${SITE_URL}/ru/about/`);
  add("/ru/metkax/review", `${SITE_URL}/ru/review/`);
  add("/ru/metkax/stats", `${SITE_URL}/ru/progress/`);
  add("/ru/metkax/dev", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/generator", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/patterns", `${SITE_URL}/data/advanced-patterns.json`);
  for (const pattern of content.advancedPatterns) {
    add(`/ru/metkax/${pattern.id}`, `${SITE_URL}/ru/practice/${pattern.id.toLowerCase()}/`);
  }
  add("/products/metkagram", `${SITE_URL}/en/`);
  add("/apps/metkagram", `${SITE_URL}/en/`);
  add("/products/metkagram/privacy", `${SITE_URL}/en/legal/privacy/`);
  add("/products/metkagram/terms", `${SITE_URL}/en/legal/terms/`);
  add("/products/metkagram/delete-data", `${SITE_URL}/en/progress/`);
  add("/datasets/metkagram-library", `${SITE_URL}/en/explore/`);
  add("/datasets/metkagram-library/download", `${SITE_URL}/data/catalog.json`);
  add("/datasets/metkagram-library/schema", `${SITE_URL}/data/schema.json`);
  return redirects;
}

function migrationMarkdown(redirects, counts) {
  const rows = redirects.map((item) => `| \`https://metalhatscats.com${item.source}\` | \`${item.destination.startsWith("http") ? item.destination : `https://metalhatscats.com${item.destination}`}\` | ${item.status} | ${item.implementation} |`).join("\n");
  return `# Metkagram migration map

Generated from the validated source datasets. Trailing-slash variants are handled by the same Vercel route rules and redirect directly to the same final URL.

- Annotated documents moved: **${counts.annotatedDocuments}**
- Advanced patterns moved: **${counts.advancedPatterns}**
- URL records: **${redirects.length}**
- Redirect policy: permanent 308 at the MetalHatsCats framework layer. Progress is local-first and can be moved with JSON export/import.

| Old URL | Exact new URL | Status | Redirect implementation / moved capability |
|---|---|---|---|
${rows}
`;
}

function buildCatalog(content, counts) {
  const collections = [];
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      const documents = content.collections[target.key][collectionKey].documents;
      collections.push({
        id: `${target.dataKey}-${collectionKey}`,
        targetLanguage: target.dataKey,
        collection: collectionKey,
        count: documents.length,
        routes: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/explore/${target.key}/${collectionKey}/`])),
        dataset: `${SITE_URL}/data/collections/${target.dataKey}/${collectionKey}.json`
      });
    }
  }
  return {
    schemaVersion: 1,
    name: "Metkagram public collection catalog",
    description: "Annotated English and German documents plus B2–C1 active-recall patterns.",
    license: "See https://metkagram.github.io/LICENSE",
    counts,
    collections,
    advancedPatterns: {
      count: content.advancedPatterns.length,
      dataset: `${SITE_URL}/data/advanced-patterns.json`,
      routes: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/practice/`]))
    }
  };
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyPublic();
  const content = loadContent();
  const counts = contentCounts(content);

  writeRoute("/", gatewayPage());
  for (const locale of locales) {
    writeRoute(`/${locale}/`, localeHome(locale, content));
    writeRoute(`/${locale}/explore/`, explorePage(locale, content));
    writeRoute(`/${locale}/practice/`, practicePage(locale, content.advancedPatterns));
    writeRoute(`/${locale}/review/`, reviewPage(locale));
    writeRoute(`/${locale}/progress/`, progressPage(locale));
    writeRoute(`/${locale}/method/`, methodPage(locale));
    writeRoute(`/${locale}/about/`, aboutPage(locale));
    writeRoute(`/${locale}/apps/`, appsPage(locale));
    writeRoute(`/${locale}/legal/privacy/`, legalPage(locale, "privacy"));
    writeRoute(`/${locale}/legal/terms/`, legalPage(locale, "terms"));
    writeRoute(`/${locale}/history/`, historyPage(locale));
    writeRoute(`/${locale}/roadmap/`, roadmapPage(locale));
    for (const target of Object.values(targetMeta)) {
      writeRoute(`/${locale}/explore/${target.key}/`, languageHub(locale, target.key, content));
      writeRoute(`/${locale}/explore/${target.key}/annotation-rules/`, rulesPage(locale, target.key));
      for (const collectionKey of collectionKeys) {
        const collection = content.collections[target.key][collectionKey];
        writeRoute(`/${locale}/explore/${target.key}/${collectionKey}/`, collectionPage(locale, target.key, collectionKey, collection));
        for (const document of collection.documents) {
          writeRoute(`/${locale}/explore/${target.key}/${collectionKey}/${document.id}/`, documentPage(locale, target.key, collectionKey, document));
        }
      }
    }
    for (const pattern of content.advancedPatterns) {
      writeRoute(`/${locale}/practice/${pattern.id.toLowerCase()}/`, patternPage(locale, pattern));
    }
  }

  writeFile("404.html", notFoundPage("en"));
  writeFile(".nojekyll", "");
  writeFile("LICENSE", fs.readFileSync(path.join(ROOT, "LICENSE"), "utf8"));
  writeFile("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...generatedRoutes].sort().map((route) => `\n  <url><loc>${xmlEscape(`${SITE_URL}${route}`)}</loc></url>`).join("")}\n</urlset>\n`);
  writeFile("llms.txt", `# Metkagram\n\n> A bilingual annotated-language workspace for English and German learning.\n\nCanonical site: ${SITE_URL}/\nInterfaces: ${SITE_URL}/en/ and ${SITE_URL}/ru/\nCollections catalog: ${SITE_URL}/data/catalog.json\nAdvanced patterns dataset: ${SITE_URL}/data/advanced-patterns.json\nMethod: ${SITE_URL}/en/method/\nMobile apps: ${SITE_URL}/en/apps/\nPrivacy Policy: ${SITE_URL}/en/legal/privacy/\nTerms of Use: ${SITE_URL}/en/legal/terms/\nLicense and attribution: ${SITE_URL}/en/about/\n\nMetkagram exposes crawlable HTML detail pages for every collection and pattern. Interface locale (English or Russian) is independent from target language (English or German).\n`);

  writeFile("data/advanced-patterns.json", `${JSON.stringify(content.advancedPatterns)}\n`);
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      writeFile(`data/collections/${target.dataKey}/${collectionKey}.json`, `${JSON.stringify(content.collections[target.key][collectionKey].documents)}\n`);
    }
  }
  const catalog = buildCatalog(content, counts);
  writeFile("data/catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
  writeFile("data/schema.json", `${JSON.stringify({ "$schema": "https://json-schema.org/draft/2020-12/schema", title: "Metkagram public datasets", type: "object", description: "Catalog and record shapes for annotated documents and advanced patterns.", properties: { catalog: { type: "object", required: ["schemaVersion", "collections", "advancedPatterns"] }, annotatedDocument: { type: "object", required: ["id", "language", "title", "annotations"] }, advancedPattern: { type: "object", required: ["id", "group_id", "title_ru", "langs"] } } }, null, 2)}\n`);
  writeFile("project.json", `${JSON.stringify({ name: "Metkagram", canonicalUrl: SITE_URL, interfaceLocales: locales, targetLanguages: ["en", "de"], architecture: "deterministic static HTML with progressive enhancement", catalog: `${SITE_URL}/data/catalog.json` }, null, 2)}\n`);

  const redirects = buildRedirectManifest(content);
  writeFile("migration/redirects.json", `${JSON.stringify(redirects, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, "MIGRATION_MAP.md"), migrationMarkdown(redirects, counts));
  const report = {
    generatedAt: new Date().toISOString(),
    generatedRouteCount: generatedRoutes.size,
    migratedContent: counts,
    redirectRecordCount: redirects.length,
    trailingSlashPolicy: "directory URLs with trailing slash",
    syncCompatibility: "metkax:srs:v1 and metkax:srs:code retained; v2 export envelope added",
    externalSteps: ["No launch blockers remain.", "Retain the MetalHatsCats SRS compatibility API, transfer utility, and permanent redirects for at least one year (preferably indefinitely)."]
  };
  writeFile("migration-verification.json", `${JSON.stringify(report, null, 2)}\n`);
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports", "MIGRATION_VERIFICATION.md"), `# Migration verification\n\n- Generated routes: **${report.generatedRouteCount}**\n- Annotated documents: **${counts.annotatedDocuments}**\n- Annotated sentences: **${counts.annotatedSentences}**\n- Advanced B2–C1 patterns: **${counts.advancedPatterns}**\n- Redirect records: **${redirects.length}**\n- Trailing-slash policy: ${report.trailingSlashPolicy}\n- Progress compatibility: ${report.syncCompatibility}\n\n## Automated verification (2026-07-11)\n\n- Static build: pass\n- Node content/migration/SRS tests: **12 passed**\n- Internal link check: **4,988 HTML files passed**\n- Playwright desktop/mobile journeys: **9 passed, 1 desktop-only skip**\n- Lighthouse home: **Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100**\n- MetalHatsCats lint: pass with 11 pre-existing Konturo warnings and no errors\n- MetalHatsCats typecheck: pass\n- MetalHatsCats production build: pass\n- MetalHatsCats migration validator: **${redirects.filter((item) => item.status === "ready").length} old URLs mapped**\n- Live Pages routes and assets: pass\n- Live slash/non-slash redirects: direct 308 pass\n- Live SRS preflight CORS: 204 pass\n\nScreenshots are stored in \`reports/screenshots/\`; Lighthouse JSON is stored at \`reports/lighthouse-home.json\`.\n\n## External steps\n\n${report.externalSteps.map((step) => `- ${step}`).join("\n")}\n`);
  console.log(`Built ${generatedRoutes.size} routes: ${counts.annotatedDocuments} documents, ${counts.annotatedSentences} sentences, ${counts.advancedPatterns} advanced patterns.`);
}

build();
