import { setTimeout as delay } from "node:timers/promises";
import {
  buildProductionContract,
  formatProductionFailures,
  productionRouteList,
  validateProductionSnapshot,
} from "../src/production-contract.mjs";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isJsonRoute(route) {
  return route.endsWith(".json");
}

function indexDenied(value = "") {
  const controls = String(value).replace(/\b(?:robots|googlebot|bingbot)\s*:\s*/gi, "");
  return /(?:^|[,;\s])(?:noindex|none)(?=$|[,;\s])/i.test(controls);
}

function metaAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
    const name = match[1].toLowerCase();
    if (!(name in attributes)) attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

// Transport evidence is deliberately separate from the generated-artifact release contract.
// Only sampled HTML that the current sitemap actually publishes is required to be indexable.
export function validateSearchTransport(snapshot, contract = buildProductionContract()) {
  const failures = [];
  const sitemap = snapshot[contract.routes.sitemap]?.text || "";
  const published = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim().replaceAll("&amp;", "&")));
  const cohort = productionRouteList(contract).filter((route) => route.endsWith("/") && published.has(new URL(route, contract.canonicalOrigin).href));
  if (!cohort.length) failures.push({ route: contract.routes.sitemap, message: "no sampled sitemap HTML cohort; Search transport coverage unresolved" });
  for (const route of cohort) {
    const record = snapshot[route];
    const fail = (message) => failures.push({ route, message });
    if (!record?.headers) { fail("missing observed HTTP headers; Search transport unresolved"); continue; }
    if (!/^text\/html(?:\s*;|$)/i.test(record.headers["content-type"] || "")) fail("sitemap HTML response has missing or non-HTML content-type");
    if (indexDenied(record.headers["x-robots-tag"])) fail("X-Robots-Tag denies indexing of sampled sitemap HTML");
    if (!record.requestedUrl || record.finalUrl !== record.requestedUrl) fail("canonical GET redirected or final URL evidence is missing");
    const html = String(record.text || "").replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const attributes = metaAttributes(match[0]);
      const name = String(attributes.name || "").toLowerCase();
      if (["robots", "googlebot", "bingbot"].includes(name) && indexDenied(attributes.content)) fail(`${name} meta denies indexing of sampled sitemap HTML`);
    }
  }
  return failures;
}

export async function fetchProductionSnapshot({
  baseUrl,
  contract = buildProductionContract(),
  fetchImpl = globalThis.fetch,
  cacheBust = "",
} = {}) {
  if (!baseUrl) throw new Error("Production smoke needs a baseUrl");
  if (typeof fetchImpl !== "function") throw new Error("Production smoke needs fetch support");
  const base = new URL(baseUrl);
  const snapshot = {};

  await Promise.all(productionRouteList(contract).map(async (route) => {
    const url = new URL(route, base);
    // Explicit diagnostic callers may request a cache-busted probe; the release smoke
    // below tests canonical URLs without adding a query that Google would not request.
    if (cacheBust) url.searchParams.set("__metkagram_smoke", cacheBust);
    const requestedUrl = url.toString();
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
          "user-agent": "metkagram-production-smoke/1.1",
        },
        signal: AbortSignal.timeout(15_000),
      });
      const text = await response.text();
      let json = null;
      if (isJsonRoute(route) && response.ok) {
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }
      snapshot[route] = {
        status: response.status,
        requestedUrl,
        finalUrl: response.url,
        method: "GET",
        headers: {
          "content-type": response.headers.get("content-type") || "",
          "x-robots-tag": response.headers.get("x-robots-tag") || "",
        },
        text,
        json,
      };
    } catch (error) {
      snapshot[route] = {
        status: 0,
        requestedUrl,
        finalUrl: url.toString(),
        method: "GET",
        headers: null,
        text: "",
        json: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));

  return snapshot;
}

export async function runProductionSmoke({
  baseUrl,
  attempts = 6,
  retryDelayMs = 4_000,
  fetchImpl = globalThis.fetch,
  expectedSha = "manual",
  log = console,
} = {}) {
  const contract = buildProductionContract();
  let lastFailures = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const snapshot = await fetchProductionSnapshot({ baseUrl, contract, fetchImpl });
    const failures = [...validateProductionSnapshot(snapshot, contract), ...validateSearchTransport(snapshot, contract)];
    if (!failures.length) {
      log.log(`Production smoke passed: ${productionRouteList(contract).length} bounded canonical GET routes; release ${contract.release.releaseDate}; dataset ${contract.datasetVersion}; ${contract.counts.advancedPatterns} patterns / ${contract.counts.sets} sets. HTTP/meta indexing restrictions checked only on sampled sitemap HTML. Source hint ${expectedSha} is not embedded deployed-SHA verification; Google indexing and ranking remain unmeasured.`);
      return { ok: true, attempt, contract, snapshot, failures: [] };
    }

    lastFailures = failures;
    if (attempt < attempts) {
      log.warn(`Production smoke attempt ${attempt}/${attempts} still sees ${failures.length} contract mismatch(es); retrying after Pages propagation.`);
      await delay(retryDelayMs);
    }
  }

  const message = formatProductionFailures(lastFailures);
  throw new Error(`Production release contract failed after ${attempts} attempt(s):\n${message}`);
}

const direct = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (direct) {
  const contract = buildProductionContract();
  const baseUrl = argValue("--base-url") || process.env.METKAGRAM_PRODUCTION_URL || contract.canonicalOrigin;
  const attempts = positiveInt(argValue("--attempts") || process.env.METKAGRAM_SMOKE_ATTEMPTS, 6);
  const retryDelayMs = positiveInt(argValue("--retry-ms") || process.env.METKAGRAM_SMOKE_RETRY_MS, 4_000);
  const expectedSha = process.env.EXPECTED_GITHUB_SHA || "manual";
  await runProductionSmoke({ baseUrl, attempts, retryDelayMs, expectedSha });
}
