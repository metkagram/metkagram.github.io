import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../src/content.mjs";
import { loadFrameFamilies } from "../src/frame-families.mjs";
import { buildPatternIndexabilityPolicy, INDEXABILITY_POLICY_VERSION } from "../src/indexability-policy.mjs";
import { wrapRecord } from "../src/provenance.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(DIST, relative), "utf8"));
}

function writeJson(relative, value) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patchPatternHtml(record, locale) {
  const route = patternPath(locale, record.pattern_id);
  const file = path.join(DIST, route.slice(1), "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing Pattern page for indexability gate: ${route}`);
  let html = fs.readFileSync(file, "utf8");
  const robots = record.indexable
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,follow";
  if (!/<meta name="robots" content="[^"]+">/.test(html)) throw new Error(`Missing robots meta on ${route}`);
  html = html.replace(/<meta name="robots" content="[^"]+">/, `<meta name="robots" content="${robots}">`);

  const reason = record.indexable ? "indexable" : record.reasons.join(",");
  const policyMeta = `<meta name="metkagram-indexability" content="${record.indexable ? "index" : "noindex"}">\n  <meta name="metkagram-indexability-policy" content="${INDEXABILITY_POLICY_VERSION}">\n  <meta name="metkagram-indexability-reason" content="${reason}">\n  <meta name="metkagram-canonical-pattern" content="${record.canonical_pattern_id}">`;
  html = html.replace(/\s*<meta name="metkagram-indexability"[^>]*>\s*(?:<meta name="metkagram-indexability-policy"[^>]*>\s*)?(?:<meta name="metkagram-indexability-reason"[^>]*>\s*)?(?:<meta name="metkagram-canonical-pattern"[^>]*>\s*)?/g, "\n");
  html = html.replace("</head>", `  ${policyMeta}\n</head>`);
  fs.writeFileSync(file, html);
  return route;
}

function patchSitemap(nonIndexableRoutes) {
  const file = path.join(DIST, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  for (const route of nonIndexableRoutes) {
    const canonical = `${SITE_URL}${route}`;
    const expression = new RegExp(`\\s*<url>\\s*<loc>${escapeRegex(canonical)}<\\/loc>[\\s\\S]*?<\\/url>`, "g");
    xml = xml.replace(expression, "");
  }
  fs.writeFileSync(file, xml);
}

function patchSeoInventory(nonIndexableRoutes) {
  const file = path.join(DIST, "seo", "site-pages.json");
  const inventory = JSON.parse(fs.readFileSync(file, "utf8"));
  const excluded = new Set(nonIndexableRoutes);
  inventory.pages = (inventory.pages || []).filter((page) => !excluded.has(page.route));
  inventory.pageCount = inventory.pages.length;
  inventory.indexabilityPolicy = INDEXABILITY_POLICY_VERSION;
  inventory.nonIndexablePatternRouteCount = nonIndexableRoutes.length;
  fs.writeFileSync(file, `${JSON.stringify(inventory, null, 2)}\n`);
}

function qualitySearchState(record) {
  return {
    policy: INDEXABILITY_POLICY_VERSION,
    indexable: record.indexable,
    robots: record.robots,
    reasons: record.reasons,
    evidence: record.evidence,
    canonical_pattern_id: record.canonical_pattern_id,
    frame_family_id: record.frame_family_id,
  };
}

function patchPatternObject(pattern, decision) {
  if (!pattern || !decision) return;
  pattern.quality ||= {};
  pattern.quality.indexable = decision.indexable;
  pattern.quality.search = qualitySearchState(decision);
}

function patchPatternApi(policy) {
  const decisions = new Map(policy.records.map((record) => [record.pattern_id, record]));
  const fullPath = path.join(DIST, "api", "v1", "patterns.json");
  const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  for (const wrapped of full.data || []) patchPatternObject(wrapped.data, decisions.get(wrapped.data?.id));
  fs.writeFileSync(fullPath, `${JSON.stringify(full, null, 2)}\n`);

  const advancedPath = path.join(DIST, "data", "advanced-patterns.json");
  if (fs.existsSync(advancedPath)) {
    const advanced = JSON.parse(fs.readFileSync(advancedPath, "utf8"));
    for (const pattern of advanced) patchPatternObject(pattern, decisions.get(pattern.id));
    fs.writeFileSync(advancedPath, `${JSON.stringify(advanced, null, 2)}\n`);
  }

  const searchPath = path.join(DIST, "api", "v1", "search-index.json");
  if (fs.existsSync(searchPath)) {
    const search = JSON.parse(fs.readFileSync(searchPath, "utf8"));
    for (const pattern of search.data?.patterns || []) {
      const decision = decisions.get(pattern.id);
      if (!decision) continue;
      pattern.quality ||= {};
      pattern.quality.indexable = decision.indexable;
      pattern.quality.search = qualitySearchState(decision);
    }
    fs.writeFileSync(searchPath, `${JSON.stringify(search, null, 2)}\n`);
  }

  for (const record of policy.records) {
    const file = path.join(DIST, "api", "v1", "patterns", `${record.pattern_id.toLowerCase()}.json`);
    if (!fs.existsSync(file)) continue;
    const payload = JSON.parse(fs.readFileSync(file, "utf8"));
    patchPatternObject(payload.data, record);
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  }
}

function patchQualityReport(policy) {
  const file = path.join(DIST, "data", "quality-report.json");
  if (!fs.existsSync(file)) return;
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  report.indexabilityPolicy = INDEXABILITY_POLICY_VERSION;
  report.indexablePatternCount = policy.summary.indexablePatternCount;
  report.nonIndexablePatternCount = policy.summary.nonIndexablePatternCount;
  report.indexabilityByReason = policy.summary.byReason;
  report.indexabilityByEditorialStatus = policy.summary.byEditorialStatus;
  report.rules ||= {};
  report.rules.searchPromotionRequiresApprovedEditorialStatus = true;
  report.rules.reviewedContextualVariantsIndexable = false;
  report.reviewQueue = policy.records.filter((record) => !record.indexable).map((record) => ({
    id: record.pattern_id,
    set_id: record.set_id,
    status: record.editorial_status,
    indexability_reasons: record.reasons,
    canonical_pattern_id: record.canonical_pattern_id,
  }));
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
}

function patchDiscovery(policy) {
  const wrapped = wrapRecord(policy, {
    canonical_url: `${API_URL}/pattern-indexability.json`,
    record_type: "pattern_indexability_policy",
    record_id: INDEXABILITY_POLICY_VERSION,
  });
  writeJson("api/v1/pattern-indexability.json", wrapped);

  const indexFile = path.join(DIST, "api", "v1", "index.json");
  const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  index.pattern_indexability = `${API_URL}/pattern-indexability.json`;
  index.counts = {
    ...(index.counts || {}),
    indexablePatterns: policy.summary.indexablePatternCount,
    nonIndexablePatterns: policy.summary.nonIndexablePatternCount,
  };
  index.endpoints ||= [];
  if (!index.endpoints.some((item) => item.path === "/pattern-indexability.json")) {
    index.endpoints.push({
      path: "/pattern-indexability.json",
      url: `${API_URL}/pattern-indexability.json`,
      type: "policy",
      description: "Editorial search-promotion decisions and reasons for every stable Pattern ID",
    });
  }
  fs.writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`);

  const catalogFile = path.join(DIST, "data", "catalog.json");
  if (fs.existsSync(catalogFile)) {
    const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
    catalog.patternIndexability = {
      policy: INDEXABILITY_POLICY_VERSION,
      indexablePatternCount: policy.summary.indexablePatternCount,
      nonIndexablePatternCount: policy.summary.nonIndexablePatternCount,
      report: `${SITE_URL}/data/quality/pattern-indexability.json`,
      api: `${API_URL}/pattern-indexability.json`,
    };
    fs.writeFileSync(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`);
  }
}

export function buildPatternIndexability() {
  const content = loadContent();
  const families = loadFrameFamilies(ROOT);
  const audit = readJson("data/quality/frame-audit.json");
  const policy = buildPatternIndexabilityPolicy(content, families, audit);
  writeJson("data/quality/pattern-indexability.json", policy);

  const nonIndexableRoutes = [];
  for (const record of policy.records) {
    for (const locale of ["en", "ru"]) {
      const route = patchPatternHtml(record, locale);
      if (!record.indexable) nonIndexableRoutes.push(route);
    }
  }

  patchSitemap(nonIndexableRoutes);
  patchSeoInventory(nonIndexableRoutes);
  patchPatternApi(policy);
  patchQualityReport(policy);
  patchDiscovery(policy);

  console.log(`Pattern indexability: ${policy.summary.indexablePatternCount}/${policy.summary.patternCount} indexable; ${policy.summary.nonIndexablePatternCount} noindex under ${INDEXABILITY_POLICY_VERSION}.`);
  return policy;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) buildPatternIndexability();
