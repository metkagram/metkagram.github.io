import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { patternPath, patternUrl, studySetUrl } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const failures = [];
const typeCounts = new Map();

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function capture(html, pattern) {
  return html.match(pattern)?.[1] || "";
}

function metadata(head) {
  return new Map([...head.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]*)">/g)].map((match) => [match[1], match[2]]));
}

function jsonLd(html, relative) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      failures.push(`${relative}: JSON-LD block ${index + 1} does not parse (${error.message})`);
      return null;
    }
  }).filter(Boolean);
}

function topLevelNodes(blocks) {
  return blocks.flatMap((block) => [block, ...(Array.isArray(block?.["@graph"]) ? block["@graph"] : [])]);
}

function typesOf(node) {
  return Array.isArray(node?.["@type"]) ? node["@type"] : node?.["@type"] ? [node["@type"]] : [];
}

function nodeOfType(blocks, type) {
  return topLevelNodes(blocks).find((node) => typesOf(node).includes(type));
}

function localRoute(value) {
  try {
    const url = new URL(value, SITE_URL);
    return url.origin === SITE_URL ? url.pathname : null;
  } catch {
    return null;
  }
}

if (!fs.existsSync(path.join(DIST, "sitemap.xml"))) throw new Error("Run npm run build before npm run seo:audit");

const sitemapUrls = new Set([...fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const sitemapRoutes = new Set([...sitemapUrls].map((url) => new URL(url).pathname));
const inbound = new Map([...sitemapRoutes].map((route) => [route, 0]));
const learningResources = new Map();
const files = htmlFiles(DIST);
let redirects = 0;
let indexablePages = 0;
let jsonLdBlocks = 0;

for (const file of files) {
  const relative = path.relative(DIST, file).replaceAll(path.sep, "/");
  const html = fs.readFileSync(file, "utf8");
  if (html.includes('http-equiv="refresh"')) {
    redirects += 1;
    continue;
  }
  if (/^google[a-z0-9_-]*\.html$/i.test(path.basename(file))) continue;

  const head = html.slice(0, html.indexOf("</head>") + 7);
  const headMeta = metadata(head);
  const canonical = capture(head, /<link rel="canonical" href="([^"]+)">/);
  const robots = headMeta.get("robots") || "";
  if (!canonical || robots.startsWith("noindex")) continue;
  indexablePages += 1;
  const canonicalRoute = localRoute(canonical);
  if (!sitemapUrls.has(canonical)) failures.push(`${relative}: canonical is absent from sitemap (${canonical})`);

  const requiredSocial = [
    ["property", "og:type"], ["property", "og:site_name"], ["property", "og:locale"],
    ["property", "og:title"], ["property", "og:description"], ["property", "og:url"],
    ["property", "og:image"], ["property", "og:image:type"], ["property", "og:image:width"],
    ["property", "og:image:height"], ["property", "og:image:alt"], ["name", "twitter:card"],
    ["name", "twitter:title"], ["name", "twitter:description"], ["name", "twitter:image"],
    ["name", "twitter:image:alt"]
  ];
  for (const [, value] of requiredSocial) if (!headMeta.get(value)) failures.push(`${relative}: missing ${value}`);
  if (headMeta.get("og:url") !== canonical) failures.push(`${relative}: og:url does not equal canonical`);
  if (headMeta.get("og:image") !== headMeta.get("twitter:image")) failures.push(`${relative}: Open Graph and Twitter images differ`);

  const blocks = jsonLd(head, relative);
  jsonLdBlocks += blocks.length;
  const nodes = topLevelNodes(blocks);
  for (const node of nodes) for (const type of typesOf(node)) typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  if (nodes.some((node) => typesOf(node).includes("MobileApplication") || node?.["@id"] === `${SITE_URL}/#mobile-application`)) failures.push(`${relative}: archived mobile app remains in JSON-LD`);
  if (nodes.some((node) => typesOf(node).includes("SoftwareApplication"))) failures.push(`${relative}: unsupported SoftwareApplication remains in JSON-LD`);
  if (nodes.some((node) => typesOf(node).includes("FAQPage"))) failures.push(`${relative}: deprecated FAQPage remains in JSON-LD`);

  const pageNode = nodes.find((node) => node?.["@id"] === `${canonical}#webpage`);
  if (!pageNode) failures.push(`${relative}: missing canonical #webpage entity`);
  else {
    if (pageNode.url !== canonical) failures.push(`${relative}: #webpage URL does not equal canonical`);
    if (pageNode.isPartOf?.["@id"] !== `${SITE_URL}/#website`) failures.push(`${relative}: #webpage is not connected to #website`);
  }

  const breadcrumb = nodeOfType(blocks, "BreadcrumbList");
  if (breadcrumb) {
    if (breadcrumb["@id"] !== `${canonical}#breadcrumb`) failures.push(`${relative}: BreadcrumbList needs a stable canonical @id`);
    if (pageNode?.breadcrumb?.["@id"] !== breadcrumb["@id"]) failures.push(`${relative}: #webpage is not connected to BreadcrumbList`);
    const items = breadcrumb.itemListElement || [];
    if (items.length < 2) failures.push(`${relative}: BreadcrumbList has fewer than two items`);
    items.forEach((item, index) => {
      if (item.position !== index + 1 || !item.name) failures.push(`${relative}: invalid breadcrumb at position ${index + 1}`);
      if (item.item && !sitemapUrls.has(item.item)) failures.push(`${relative}: breadcrumb points outside the sitemap (${item.item})`);
    });
    if (items.at(-1)?.item && items.at(-1).item !== canonical) failures.push(`${relative}: final breadcrumb does not equal canonical`);
  }
  const primaryEntity = nodes.find((node) => ["LearningResource", "Dataset", "DataCatalog"].includes(node?.["@type"]) && node.url === canonical);
  if (primaryEntity) {
    const suffix = primaryEntity["@type"].replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const expectedId = `${canonical}#${suffix}`;
    if (primaryEntity["@id"] !== expectedId) failures.push(`${relative}: primary ${primaryEntity["@type"]} needs stable @id ${expectedId}`);
    if (primaryEntity.mainEntityOfPage?.["@id"] !== `${canonical}#webpage`) failures.push(`${relative}: primary ${primaryEntity["@type"]} is not connected to #webpage`);
    if (pageNode?.mainEntity?.["@id"] !== expectedId) failures.push(`${relative}: #webpage is not connected to primary ${primaryEntity["@type"]}`);
  }
  const learningResource = nodeOfType(blocks, "LearningResource");
  if (canonicalRoute?.includes("/practice/patterns/") && learningResource) {
    learningResources.set(canonicalRoute, {
      id: learningResource["@id"],
      identifier: learningResource.identifier,
      mainEntityOfPage: learningResource.mainEntityOfPage?.["@id"],
      isPartOf: learningResource.isPartOf?.["@id"]
    });
  }

  for (const href of [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])) {
    const target = localRoute(href);
    if (target && inbound.has(target) && target !== canonicalRoute) inbound.set(target, inbound.get(target) + 1);
  }
}

const content = loadContent();
for (const locale of ["en", "ru"]) for (const pattern of content.advancedPatterns) {
  const route = patternPath(locale, pattern);
  const resource = learningResources.get(route);
  const canonical = patternUrl(locale, pattern);
  if (resource?.id !== `${canonical}#learning-resource`) failures.push(`${route}: LearningResource needs a stable @id`);
  if (resource?.identifier !== pattern.id) failures.push(`${route}: LearningResource identifier must be ${pattern.id}`);
  if (resource?.mainEntityOfPage !== `${canonical}#webpage`) failures.push(`${route}: LearningResource is not connected to #webpage`);
  const set = content.studySets.sets.find((item) => item.id === pattern.set_id);
  if (set && resource?.isPartOf !== `${studySetUrl(locale, set)}#learning-resource`) failures.push(`${route}: LearningResource is not connected to study set ${set.id}`);
  if ((inbound.get(route) || 0) < 2) failures.push(`${route}: expected at least two internal inbound links`);
}

const graph = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-graph.json"), "utf8"));
const graphIds = new Set(graph.nodes.map((node) => node.id));
if (graphIds.size !== graph.nodes.length) failures.push("pattern-graph.json: duplicate node IDs");
for (const node of graph.nodes) {
  if (node.canonical_url !== patternUrl("en", node.id)) failures.push(`pattern-graph.json: canonical URL drift for ${node.id}`);
  for (const related of node.related || []) if (!graphIds.has(related.id)) failures.push(`pattern-graph.json: ${node.id} references missing related node ${related.id}`);
}
for (const edge of graph.edges) {
  if (!graphIds.has(edge.source) || !graphIds.has(edge.target)) failures.push(`pattern-graph.json: dangling edge ${edge.source} → ${edge.target}`);
  if (edge.source === edge.target) failures.push(`pattern-graph.json: self edge ${edge.source}`);
}

const summary = {
  htmlFiles: files.length,
  indexablePages,
  redirects,
  jsonLdBlocks,
  structuredDataTypes: Object.fromEntries([...typeCounts].sort(([left], [right]) => left.localeCompare(right))),
  patternGraph: { nodes: graph.nodes.length, edges: graph.edges.length, moves: graph.moves.length },
  failures: failures.length
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error(`SEO graph audit failed with ${failures.length} issue(s):`);
  console.error(failures.slice(0, 100).join("\n"));
  process.exit(1);
}
