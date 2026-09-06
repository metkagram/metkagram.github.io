import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE_AI = path.join(ROOT, "ai");
const SOURCE_LOCALES = path.join(SOURCE_AI, "llms");
const SOURCE_GRAPH = path.join(ROOT, "knowledge", "graph.json");
const TARGET_GRAPH = path.join(DIST, "knowledge", "graph.json");
const ROOT_LLMS = path.join(DIST, "llms.txt");
const AGENT_ROUTING_LOCALES = new Set(["en", "ru", "de", "fr"]);

const DISCOVERY_LINKS = [
  '<link rel="describedby" type="application/json" href="/ai/site-profile.json" title="Agent-Ready Web Profile">',
  '<link rel="describedby" type="application/json" href="/ai/ai-search-profile.json" title="Metkagram AI Search & Citation Profile">',
  '<link rel="describedby" type="application/json" href="/ai/locales.json" title="Metkagram agent locale manifest">',
  '<link rel="describedby" type="application/ld+json" href="/knowledge/graph.json" title="Metkagram entity knowledge graph">',
];

function htmlFiles(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith(".html")) result.push(file);
  }
  return result;
}

function copySourceEntry(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function publishMachineSurfaces() {
  fs.mkdirSync(path.join(DIST, "ai"), { recursive: true });
  for (const entry of fs.readdirSync(SOURCE_AI, { withFileTypes: true })) {
    if (entry.name === "llms") continue;
    copySourceEntry(path.join(SOURCE_AI, entry.name), path.join(DIST, "ai", entry.name));
  }

  for (const entry of fs.readdirSync(SOURCE_LOCALES, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".txt")) continue;
    const locale = entry.name.slice(0, -4);
    const target = path.join(DIST, locale, "llms.txt");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(SOURCE_LOCALES, entry.name), target);
  }

  fs.mkdirSync(path.dirname(TARGET_GRAPH), { recursive: true });
  fs.copyFileSync(SOURCE_GRAPH, TARGET_GRAPH);
}

function patchCanonicalLlms() {
  if (!fs.existsSync(ROOT_LLMS)) throw new Error("Canonical dist/llms.txt must exist before ARWP publication");
  let text = fs.readFileSync(ROOT_LLMS, "utf8");
  text = text.replace(
    "> A bilingual, static, AI-ready language-notation workspace for English and German B2–C1 patterns and annotated sentences.",
    "> A multilingual, static, agent-discoverable language-learning and NLP knowledge site. English and German are established learning languages; French is a bounded Frame-only pilot; English and Russian are interface languages.",
  );
  if (!text.includes("## Agent discovery")) {
    text += [
      "",
      "## Agent discovery",
      "",
      "- Agent-Ready Web Profile: https://metkagram.github.io/ai/site-profile.json",
      "- Locale manifest: https://metkagram.github.io/ai/locales.json",
      "- AI Search & Citation Profile: https://metkagram.github.io/ai/ai-search-profile.json",
      "- Entity knowledge graph: https://metkagram.github.io/knowledge/graph.json",
      "- Russian agent routing: https://metkagram.github.io/ru/llms.txt",
      "- German agent routing: https://metkagram.github.io/de/llms.txt",
      "- French agent routing: https://metkagram.github.io/fr/llms.txt",
      "- Language capability contract: https://metkagram.github.io/data/languages.json",
      "",
      "Localized llms.txt files are routing surfaces, not claims that every locale has a complete interface, annotation system or equivalent learning corpus.",
      "",
    ].join("\n");
  }
  fs.writeFileSync(ROOT_LLMS, text);
}

function localeLlmsLink(html) {
  const declaredLanguage = html.match(/<html lang="([^"]+)"/)?.[1]?.toLowerCase() || "en";
  const language = declaredLanguage.split("-")[0];
  const locale = AGENT_ROUTING_LOCALES.has(language) ? language : "en";
  const href = locale === "en" ? "/llms.txt" : `/${locale}/llms.txt`;
  return `<link rel="describedby" type="text/plain" href="${href}" hreflang="${locale}" title="Metkagram agent routing">`;
}

publishMachineSurfaces();
patchCanonicalLlms();

let changed = 0;
for (const file of htmlFiles(DIST)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) continue;
  const desired = [...DISCOVERY_LINKS, localeLlmsLink(html)];
  const missing = desired.filter((link) => {
    const href = link.match(/href="([^"]+)"/)?.[1];
    return href && !html.includes(`href="${href}"`);
  });
  if (!missing.length) continue;
  html = html.replace("</head>", `${missing.join("\n")}\n</head>`);
  fs.writeFileSync(file, html);
  changed += 1;
}

console.log(`Published ARWP profiles, localized routing and knowledge graph; advertised discovery from ${changed} HTML files.`);
