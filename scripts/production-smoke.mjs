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

export async function fetchProductionSnapshot({
  baseUrl,
  contract = buildProductionContract(),
  fetchImpl = globalThis.fetch,
  cacheBust = "smoke",
} = {}) {
  if (!baseUrl) throw new Error("Production smoke needs a baseUrl");
  if (typeof fetchImpl !== "function") throw new Error("Production smoke needs fetch support");
  const base = new URL(baseUrl);
  const snapshot = {};

  await Promise.all(productionRouteList(contract).map(async (route) => {
    const url = new URL(route, base);
    url.searchParams.set("__metkagram_smoke", cacheBust);
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
          "user-agent": "metkagram-production-smoke/1.0",
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
        finalUrl: response.url,
        text,
        json,
      };
    } catch (error) {
      snapshot[route] = {
        status: 0,
        finalUrl: url.toString(),
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
    const cacheBust = `${expectedSha}-${attempt}-${Date.now()}`;
    const snapshot = await fetchProductionSnapshot({ baseUrl, contract, fetchImpl, cacheBust });
    const failures = validateProductionSnapshot(snapshot, contract);
    if (!failures.length) {
      log.log(`Production smoke passed: ${productionRouteList(contract).length} routes; release ${contract.release.releaseDate}; dataset ${contract.datasetVersion}; ${contract.counts.advancedPatterns} patterns / ${contract.counts.sets} sets.`);
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
