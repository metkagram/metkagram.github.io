import { setTimeout as delay } from "node:timers/promises";

const ROUTES = [
  "/en/",
  "/ru/",
  "/llms.txt",
  "/ru/llms.txt",
  "/de/llms.txt",
  "/fr/llms.txt",
  "/ai/site-profile.json",
  "/ai/locales.json",
  "/ai/ai-search-profile.json",
  "/knowledge/graph.json",
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function addFailure(failures, route, message) {
  failures.push(`${route}: ${message}`);
}

async function fetchSnapshot(baseUrl, cacheBust) {
  const base = new URL(baseUrl);
  const snapshot = {};
  await Promise.all(ROUTES.map(async (route) => {
    const url = new URL(route, base);
    url.searchParams.set("__metkagram_arwp_smoke", cacheBust);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "cache-control": "no-cache", pragma: "no-cache", "user-agent": "metkagram-arwp-smoke/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      const text = await response.text();
      let json = null;
      if (route.endsWith(".json") && response.ok) {
        try { json = JSON.parse(text); } catch { json = null; }
      }
      snapshot[route] = { status: response.status, text, json };
    } catch (error) {
      snapshot[route] = { status: 0, text: "", json: null, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  return snapshot;
}

function validate(snapshot) {
  const failures = [];
  for (const route of ROUTES) {
    if (snapshot[route]?.status !== 200) addFailure(failures, route, `expected HTTP 200, got ${snapshot[route]?.status ?? "missing"}`);
  }

  const profile = snapshot["/ai/site-profile.json"]?.json;
  if (!profile) addFailure(failures, "/ai/site-profile.json", "invalid JSON");
  else {
    if (profile.id !== "metkagram-language-knowledge") addFailure(failures, "/ai/site-profile.json", "unexpected profile id");
    if (profile.extensions?.["io.github.dkharlanau/localized-llms"]?.manifest !== "https://metkagram.github.io/ai/locales.json") addFailure(failures, "/ai/site-profile.json", "localized-llms extension missing");
    if (profile.extensions?.["io.github.dkharlanau/ai-search-profile"]?.knowledgeGraph !== "https://metkagram.github.io/knowledge/graph.json") addFailure(failures, "/ai/site-profile.json", "AI search knowledge graph link missing");
    if (profile.mcp?.servers?.[0]?.readOnly !== true || profile.mcp?.servers?.[0]?.transport !== "stdio") addFailure(failures, "/ai/site-profile.json", "local read-only MCP boundary drift");
  }

  const locales = snapshot["/ai/locales.json"]?.json;
  if (!locales) addFailure(failures, "/ai/locales.json", "invalid JSON");
  else {
    if (JSON.stringify(locales.humanInterfaceLanguages) !== JSON.stringify(["en", "ru"])) addFailure(failures, "/ai/locales.json", "interface locale boundary drift");
    if (JSON.stringify(locales.agentRoutingLanguages) !== JSON.stringify(["en", "ru", "de", "fr"])) addFailure(failures, "/ai/locales.json", "agent routing locale boundary drift");
  }

  const searchProfile = snapshot["/ai/ai-search-profile.json"]?.json;
  if (!searchProfile) addFailure(failures, "/ai/ai-search-profile.json", "invalid JSON");
  else {
    if (searchProfile.surfaces?.knowledgeGraph?.status !== "active") addFailure(failures, "/ai/ai-search-profile.json", "knowledge graph surface is not active");
    if (searchProfile.modules?.localization?.status !== "active") addFailure(failures, "/ai/ai-search-profile.json", "localization module is not active");
    for (const key of ["noRankingClaimsWithoutEvidence", "noFabricatedAdoption", "noReadinessScore"]) {
      if (searchProfile.guardrails?.[key] !== true) addFailure(failures, "/ai/ai-search-profile.json", `${key} guardrail is not enabled`);
    }
  }

  const graph = snapshot["/knowledge/graph.json"]?.json;
  if (!graph) addFailure(failures, "/knowledge/graph.json", "invalid JSON-LD");
  else {
    const ids = new Set((graph["@graph"] || []).map((node) => node["@id"]));
    for (const id of ["https://metkagram.github.io/#website", "https://metkagram.github.io/#project", "https://metkagram.github.io/#practice", "https://metkagram.github.io/#lens", "https://metkagram.github.io/#vocabulary"]) {
      if (!ids.has(id)) addFailure(failures, "/knowledge/graph.json", `missing entity ${id}`);
    }
  }

  const llms = snapshot["/llms.txt"]?.text || "";
  for (const needle of ["## Agent discovery", "/ai/site-profile.json", "/ai/ai-search-profile.json", "/knowledge/graph.json"]) {
    if (!llms.includes(needle)) addFailure(failures, "/llms.txt", `missing ${needle}`);
  }
  if (llms.includes("A bilingual, static, AI-ready")) addFailure(failures, "/llms.txt", "stale bilingual capability description is present");

  for (const route of ["/ru/llms.txt", "/de/llms.txt", "/fr/llms.txt"]) {
    const text = snapshot[route]?.text || "";
    if (!text.includes("https://metkagram.github.io/ai/site-profile.json")) addFailure(failures, route, "site profile routing link missing");
    if (!text.includes("https://metkagram.github.io/data/languages.json")) addFailure(failures, route, "language capability contract missing");
  }

  const homeEn = snapshot["/en/"]?.text || "";
  for (const href of ["/ai/site-profile.json", "/ai/ai-search-profile.json", "/ai/locales.json", "/knowledge/graph.json"]) {
    if (!homeEn.includes(`href="${href}"`)) addFailure(failures, "/en/", `missing discovery link ${href}`);
  }
  if (!homeEn.includes('href="/llms.txt" hreflang="en"')) addFailure(failures, "/en/", "English localized llms discovery link missing");

  const homeRu = snapshot["/ru/"]?.text || "";
  if (!homeRu.includes('href="/ru/llms.txt" hreflang="ru"')) addFailure(failures, "/ru/", "Russian localized llms discovery link missing");

  return failures;
}

export async function runArwpProductionSmoke({ baseUrl, attempts = 6, retryDelayMs = 4_000, expectedSha = "manual", log = console } = {}) {
  if (!baseUrl) throw new Error("ARWP production smoke needs a baseUrl");
  let lastFailures = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const snapshot = await fetchSnapshot(baseUrl, `${expectedSha}-${attempt}-${Date.now()}`);
    const failures = validate(snapshot);
    if (!failures.length) {
      log.log(`ARWP production smoke passed: ${ROUTES.length} discovery routes.`);
      return { ok: true, attempt, failures: [] };
    }
    lastFailures = failures;
    if (attempt < attempts) {
      log.warn(`ARWP production smoke attempt ${attempt}/${attempts} still sees ${failures.length} mismatch(es); retrying after Pages propagation.`);
      await delay(retryDelayMs);
    }
  }
  throw new Error(`ARWP production discovery failed after ${attempts} attempt(s):\n${lastFailures.join("\n")}`);
}

const direct = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (direct) {
  const baseUrl = argValue("--base-url") || process.env.METKAGRAM_PRODUCTION_URL || "https://metkagram.github.io/";
  const attempts = positiveInt(argValue("--attempts") || process.env.METKAGRAM_SMOKE_ATTEMPTS, 6);
  const retryDelayMs = positiveInt(argValue("--retry-ms") || process.env.METKAGRAM_SMOKE_RETRY_MS, 4_000);
  await runArwpProductionSmoke({ baseUrl, attempts, retryDelayMs, expectedSha: process.env.EXPECTED_GITHUB_SHA || "manual" });
}
