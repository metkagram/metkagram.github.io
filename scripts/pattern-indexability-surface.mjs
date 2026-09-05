import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { patternPath, patternUrl } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const REPORT_FILE = path.join(DIST, "data", "quality", "pattern-indexability.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(relative, value) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function patchJson(relative, mutate) {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) return;
  const value = readJson(file);
  mutate(value);
  writeJson(relative, value);
}

function routeFile(route) {
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patchRobots(file, item) {
  let html = fs.readFileSync(file, "utf8");
  const expected = item.indexable ? "index,follow" : "noindex,follow";
  if (!item.indexable) {
    if (/<meta name="robots" content="[^"]*">/.test(html)) {
      html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">');
    } else {
      html = html.replace("</head>", '  <meta name="robots" content="noindex,follow">\n</head>');
    }
  }
  const reasonMeta = `<meta name="metkagram-indexability" content="${item.indexable ? "indexable" : "noindex"}:${item.reason}">`;
  if (!html.includes('name="metkagram-indexability"')) html = html.replace("</head>", `  ${reasonMeta}\n</head>`);
  if (!html.includes(`content="${expected}`) && item.indexable) {
    throw new Error(`Indexability surface expected ${item.pattern_id} to remain indexable, but page robots disagree.`);
  }
  fs.writeFileSync(file, html);
}

function patchCrawlerSurfaces(content, report) {
  const decisions = new Map(report.items.map((item) => [item.pattern_id, item]));
  const sitemapFile = path.join(DIST, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapFile, "utf8");
  const inventoryFile = path.join(DIST, "seo", "site-pages.json");
  const inventory = readJson(inventoryFile);
  const noindexRoutes = new Set();

  for (const pattern of content.advancedPatterns) {
    const item = decisions.get(pattern.id);
    if (!item) throw new Error(`Pattern indexability report is missing ${pattern.id}.`);
    for (const locale of ["en", "ru"]) {
      const route = patternPath(locale, pattern);
      const file = routeFile(route);
      if (!fs.existsSync(file)) throw new Error(`Pattern indexability cannot find canonical route ${route}.`);
      patchRobots(file, item);
      if (!item.indexable) {
        noindexRoutes.add(route);
        const url = patternUrl(locale, pattern);
        const expression = new RegExp(`\\s*<url><loc>${escapeRegExp(url)}</loc><lastmod>[^<]+</lastmod></url>`, "g");
        sitemap = sitemap.replace(expression, "");
      }
    }
  }

  inventory.pages = inventory.pages.filter((page) => !noindexRoutes.has(page.route));
  inventory.pageCount = inventory.pages.length;
  fs.writeFileSync(inventoryFile, `${JSON.stringify(inventory, null, 2)}\n`);
  fs.writeFileSync(sitemapFile, sitemap);
  return noindexRoutes;
}

function publishApi(report) {
  writeJson("api/v1/pattern-indexability.json", wrapRecord(report, {
    canonical_url: `${SITE_URL}/api/v1/pattern-indexability.json`,
    record_type: "pattern_indexability_policy",
    record_id: "metkagram-pattern-indexability-v1",
  }));

  patchJson("api/v1/index.json", (value) => {
    const root = value.data && typeof value.data === "object" ? value.data : value;
    root.counts = { ...(root.counts || {}), indexablePatterns: report.counts.indexable, noindexPatterns: report.counts.noindex };
    root.endpoints ||= [];
    if (!root.endpoints.some((item) => item.path === "/pattern-indexability.json")) {
      root.endpoints.push({
        path: "/pattern-indexability.json",
        url: `${SITE_URL}/api/v1/pattern-indexability.json`,
        type: "collection",
        description: "Editorial search-indexability decisions for stable Pattern pages; noindex does not remove content or API access.",
      });
    }
  });

  patchJson("api/v1/openapi.json", (spec) => {
    spec.paths ||= {};
    spec.paths["/pattern-indexability.json"] = {
      get: {
        summary: "Get Pattern search-indexability decisions",
        operationId: "pattern_indexability_json",
        responses: { "200": { description: "Editorial Pattern indexability policy and decisions" } },
      },
    };
  });

  patchJson("api/v1/mcp-server.json", (spec) => {
    spec.tools ||= [];
    if (!spec.tools.some((tool) => tool.name === "metkagram_get_pattern_indexability")) {
      spec.tools.push({
        name: "metkagram_get_pattern_indexability",
        title: "Get Metkagram Pattern indexability",
        description: "Inspect which stable Pattern pages are promoted to search and why. noindex records remain available through their canonical Pattern routes and API records.",
        staticUrl: `${SITE_URL}/api/v1/pattern-indexability.json`,
        inputSchema: { type: "object", additionalProperties: false },
      });
      spec.tools.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  patchJson("data/catalog.json", (catalog) => {
    catalog.patternIndexability = {
      policyVersion: report.policyVersion,
      counts: report.counts,
      data: `${SITE_URL}/data/quality/pattern-indexability.json`,
      api: `${SITE_URL}/api/v1/pattern-indexability.json`,
      note: "Search promotion only. Stable Pattern records, routes, study-set membership and APIs remain available when noindex.",
    };
  });

  for (const item of report.items) {
    patchJson(`api/v1/patterns/${item.pattern_id.toLowerCase()}.json`, (value) => {
      const root = value.data && typeof value.data === "object" ? value.data : value;
      root.search_indexability = {
        policy_version: report.policyVersion,
        indexable: item.indexable,
        robots: item.robots,
        reason: item.reason,
        canonical_frame_family_id: item.canonical_frame_family_id,
        canonical_frame_role: item.canonical_frame_role,
      };
    });
  }
}

function patchLlms(report) {
  const file = path.join(DIST, "llms.txt");
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("## Pattern search indexability")) {
    text += `\n## Pattern search indexability\n- Policy: ${SITE_URL}/data/quality/pattern-indexability.json\n- Indexable Pattern records: ${report.counts.indexable}\n- noindex Pattern records: ${report.counts.noindex}\n- noindex means search-promotion is withheld; the stable Pattern route, study-set membership and API record remain available.\n- Automated similarity alone never causes noindex. Explicit reviewed Frame-family relations and quality/editorial gates drive the policy.\n`;
  }
  fs.writeFileSync(file, text);
}

function main() {
  if (!fs.existsSync(REPORT_FILE)) throw new Error("Pattern indexability report is missing; run the derive stage first.");
  const report = readJson(REPORT_FILE);
  const content = loadContent();
  if (report.counts.total !== content.advancedPatterns.length) throw new Error("Pattern indexability report does not cover the current corpus.");
  const noindexRoutes = patchCrawlerSurfaces(content, report);
  publishApi(report);
  patchLlms(report);
  console.log(`Pattern indexability surface: ${report.counts.indexable} Patterns promoted; ${report.counts.noindex} Patterns / ${noindexRoutes.size} localized routes noindex.`);
}

main();
