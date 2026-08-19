import fs from "node:fs";
import path from "node:path";
import { escapeHtml, layout, SITE_URL } from "../src/render.mjs";
import { ATTRIBUTION, getDatasetVersion, wrapRecord } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API = `${SITE_URL}/api/v1`;
const BENCHMARK_ID = "reasoning-routing-v1";

function full(relative) { return path.join(DIST, relative); }
function read(relative) { return fs.readFileSync(full(relative), "utf8"); }
function readJson(relative) { return JSON.parse(read(relative)); }
function write(relative, content) {
  const file = full(relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function patch(relative, mutate) {
  const before = read(relative);
  const after = mutate(before);
  if (after !== before) write(relative, after);
}
function patchJson(relative, mutate) {
  patch(relative, (text) => { const value = JSON.parse(text); mutate(value); return `${JSON.stringify(value, null, 2)}\n`; });
}
function percent(value) { return `${Math.round(Number(value || 0) * 100)}%`; }

const benchmark = readJson("data/reasoning-benchmark.json");
const report = readJson("data/reasoning-evaluation.json");
const cases = Array.isArray(benchmark.cases) ? benchmark.cases : [];
if (!cases.length) throw new Error("Public benchmark requires reasoning benchmark cases");

const localeCounts = Object.fromEntries([...new Set(cases.map((item) => item.locale))].sort().map((locale) => [locale, cases.filter((item) => item.locale === locale).length]));
const splitCounts = Object.fromEntries([...new Set(cases.map((item) => item.split))].sort().map((split) => [split, cases.filter((item) => item.split === split).length]));

const manifest = {
  schemaVersion: 1,
  id: BENCHMARK_ID,
  title: "Metkagram Intent-to-Pattern Retrieval Benchmark",
  datasetVersion: getDatasetVersion(),
  releaseDate: SITE_RELEASE_DATE,
  caseCount: cases.length,
  locales: localeCounts,
  splits: splitCounts,
  task: "Route a natural-language communicative goal to a Metkagram intent, reasoning move and up to three canonical pattern IDs.",
  metrics: {
    intentTop1: "Expected intent is ranked first.",
    moveTop1: "Expected reasoning move is ranked first.",
    patternHitAt3: "At least one editorially acceptable canonical pattern appears in the first three pattern results.",
  },
  bundledBaseline: {
    type: "deterministic editorial resolver",
    pass: report.pass,
    metrics: report.metrics,
    report: `${SITE_URL}/data/reasoning-evaluation.json`,
  },
  assets: {
    benchmarkJson: `${SITE_URL}/data/reasoning-benchmark.json`,
    tasksJsonl: `${SITE_URL}/evals/reasoning-routing/tasks.jsonl`,
    baselineReport: `${SITE_URL}/data/reasoning-evaluation.json`,
    protocol: `${SITE_URL}/evals/reasoning-routing/README.md`,
    pages: { en: `${SITE_URL}/en/evals/`, ru: `${SITE_URL}/ru/evals/` },
  },
  limitations: [
    "The cases, taxonomy, acceptable answers and bundled resolver are maintained by the same project.",
    "The bundled score is an internal editorial regression signal, not independent external validation.",
    "The benchmark does not measure learning efficacy, general writing quality or overall language-model capability.",
    "Public gold labels make the suite reproducible but unsuitable as a hidden leaderboard test without an independently held-out extension.",
  ],
  reportingRequirements: [
    "Record the benchmark dataset version and run date.",
    "Record the system/model version and prompt or retrieval configuration.",
    "State whether the system had access to the Metkagram taxonomy, API or corpus.",
    "Report intent top-1, move top-1 and pattern hit@3 together, plus misses or abstentions.",
  ],
  rights: {
    label: ATTRIBUTION.license,
    terms: ATTRIBUTION.terms_url,
    attribution: ATTRIBUTION.attribution_text,
  },
};

write("data/benchmark-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
write("api/v1/evals/reasoning-routing.json", `${JSON.stringify(wrapRecord(manifest, {
  canonical_url: `${API}/evals/reasoning-routing.json`,
  record_type: "retrieval_benchmark_manifest",
  record_id: BENCHMARK_ID,
}), null, 2)}\n`);
write("evals/reasoning-routing/tasks.jsonl", `${cases.map((item) => JSON.stringify(item)).join("\n")}\n`);

const protocol = `# Metkagram Intent-to-Pattern Retrieval Benchmark\n\nThis is a public editorial regression benchmark, not an independent model leaderboard or a language-learning efficacy study.\n\n## Task\n\nGiven only the natural-language query, return a ranked intent, one reasoning move, and up to three canonical Metkagram pattern IDs.\n\n## Metrics\n\n- intent top-1 accuracy\n- move top-1 accuracy\n- pattern hit@3 against the editorially acceptable pattern set\n\n## Current public suite\n\n- cases: ${cases.length}\n- locales: ${Object.entries(localeCounts).map(([key, value]) => `${key}=${value}`).join(", ")}\n- dataset version: ${getDatasetVersion()}\n\n## Reproducibility\n\nReport the benchmark version, run date, system/model version, prompt or retrieval configuration, and whether the evaluated system had access to the Metkagram taxonomy/API/corpus. Report all three metrics and misses or abstentions.\n\nThe bundled deterministic resolver currently reports: intent top-1 ${percent(report.metrics?.intent_top1_accuracy)}, move top-1 ${percent(report.metrics?.move_top1_accuracy)}, pattern hit@3 ${percent(report.metrics?.pattern_hit_at3)}. This is an internal consistency signal because the benchmark and resolver are curated inside the same project.\n\nCanonical benchmark JSON: ${SITE_URL}/data/reasoning-benchmark.json\n\nBaseline report: ${SITE_URL}/data/reasoning-evaluation.json\n\nCurrent terms: ${ATTRIBUTION.terms_url}\n`;
write("evals/reasoning-routing/README.md", protocol);

function benchmarkPage(locale) {
  const ru = locale === "ru";
  const pathname = `/${locale}/evals/`;
  const title = ru ? "Benchmark поиска языковых паттернов" : "Language Pattern Retrieval Benchmark";
  const description = ru
    ? "Публичный 54-кейсный benchmark Metkagram для воспроизводимой оценки intent-to-pattern retrieval с явными ограничениями."
    : "A public 54-case Metkagram benchmark for reproducible intent-to-pattern retrieval evaluation with explicit limitations.";
  const stats = `<div class="stat-grid"><article><strong>${cases.length}</strong><span>${ru ? "кейсов" : "cases"}</span></article><article><strong>${percent(report.metrics?.intent_top1_accuracy)}</strong><span>intent top-1</span></article><article><strong>${percent(report.metrics?.move_top1_accuracy)}</strong><span>move top-1</span></article><article><strong>${percent(report.metrics?.pattern_hit_at3)}</strong><span>pattern hit@3</span></article></div>`;
  const body = `<section class="page-head section-pad"><p class="eyebrow">Metkagram · Evaluation</p><h1>${escapeHtml(title)}</h1><p class="lede">${ru ? "Проверяем узкую вещь: может ли система по естественной коммуникативной задаче найти правильное намерение, логический ход и допустимый канонический паттерн Metkagram." : "The benchmark tests one narrow job: can a system map a natural communicative goal to the intended Metkagram intent, reasoning move and an acceptable canonical pattern?"}</p>${stats}<p><small>${ru ? "Показанные результаты относятся к встроенному deterministic resolver и являются внутренним regression-сигналом, а не независимой оценкой модели или доказательством эффективности обучения." : "The displayed results belong to the bundled deterministic resolver and are an internal regression signal, not an independent model evaluation or evidence of learning efficacy."}</small></p></section><section class="section-pad ruled"><h2>${ru ? "Что получает система" : "What the system receives"}</h2><p>${ru ? "Только естественный запрос. В ответ она должна ранжировать intent, определить reasoning move и вернуть до трёх canonical pattern IDs." : "Only the natural-language query. The system should rank an intent, identify the reasoning move and return up to three canonical pattern IDs."}</p><div class="legal-inline-links"><a href="/data/reasoning-benchmark.json">Benchmark JSON →</a><a href="/evals/reasoning-routing/tasks.jsonl">tasks.jsonl →</a></div></section><section class="section-pad ruled"><h2>${ru ? "Метрики" : "Metrics"}</h2><div class="pattern-comparison-list"><article class="pattern-reader"><h3>Intent top-1</h3><p>${ru ? "Ожидаемый intent стоит первым." : "The expected intent is ranked first."}</p></article><article class="pattern-reader"><h3>Move top-1</h3><p>${ru ? "Ожидаемый reasoning move стоит первым." : "The expected reasoning move is ranked first."}</p></article><article class="pattern-reader"><h3>Pattern hit@3</h3><p>${ru ? "Хотя бы один редакционно допустимый паттерн попал в первые три результата." : "At least one editorially acceptable pattern is present in the first three results."}</p></article></div></section><section class="section-pad ruled"><h2>${ru ? "Как публиковать результаты" : "How to report a run"}</h2><ol><li>${ru ? "Зафиксируйте dataset version и дату запуска." : "Record the dataset version and run date."}</li><li>${ru ? "Укажите модель/систему, версию и prompt/retrieval configuration." : "Name the system/model, version and prompt/retrieval configuration."}</li><li>${ru ? "Скажите, был ли доступ к taxonomy, API или corpus Metkagram." : "State whether the system had access to the Metkagram taxonomy, API or corpus."}</li><li>${ru ? "Покажите все три метрики и misses/abstentions." : "Report all three metrics and misses/abstentions."}</li></ol><div class="legal-inline-links"><a href="/evals/reasoning-routing/README.md">Protocol →</a><a href="/data/reasoning-evaluation.json">Bundled baseline report →</a><a href="/api/v1/evals/reasoning-routing.json">Machine manifest →</a></div></section><section class="section-pad ruled"><h2>${ru ? "Ограничения" : "Limitations"}</h2><p>${ru ? "Gold labels публичны, а benchmark и встроенный resolver поддерживаются одним проектом. Это удобно для воспроизводимости и регрессии, но плохо подходит для громких заявлений о превосходстве над LLM. Для внешней валидации нужен независимо составленный held-out набор." : "Gold labels are public, and both the benchmark and bundled resolver are maintained by the same project. That is useful for reproducibility and regression testing, but unsuitable for grand claims about outperforming LLMs. External validation needs an independently authored held-out set."}</p></section>`;
  return {
    route: pathname,
    html: layout({
      locale,
      pathname,
      title: `${title} | Metkagram`,
      description,
      body,
      pageType: "TechArticle",
      structuredData: [{
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Metkagram Intent-to-Pattern Retrieval Benchmark",
        description,
        url: `${SITE_URL}${pathname}`,
        version: getDatasetVersion(),
        license: ATTRIBUTION.terms_url,
        distribution: [
          { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE_URL}/data/reasoning-benchmark.json` },
          { "@type": "DataDownload", encodingFormat: "application/x-ndjson", contentUrl: `${SITE_URL}/evals/reasoning-routing/tasks.jsonl` },
        ],
      }],
    }),
    metadata: { route: pathname, canonical: `${SITE_URL}${pathname}`, language: locale, title: `${title} | Metkagram`, description, lastModified: SITE_RELEASE_DATE },
  };
}

const pages = ["en", "ru"].map(benchmarkPage);
for (const page of pages) write(`${page.route.slice(1)}index.html`, page.html);

for (const locale of ["en", "ru"]) {
  const ru = locale === "ru";
  const section = `<section class="ai-section section-pad ruled" data-public-benchmark><div><p class="eyebrow">Evaluation</p><h2>${ru ? "Проверьте retrieval на публичном benchmark" : "Test retrieval on the public benchmark"}</h2><p>${ru ? "54 естественных кейса, открытые gold labels и явный scoring protocol." : "54 natural-language cases, public gold labels and an explicit scoring protocol."}</p></div><div class="legal-inline-links"><a href="/${locale}/evals/">Benchmark →</a></div></section>`;
  for (const relative of [`${locale}/research/index.html`, `${locale}/data/index.html`, `${locale}/build-with-metkagram/index.html`]) {
    patch(relative, (html) => html.includes("data-public-benchmark") ? html : html.replace("</main>", `${section}</main>`));
  }
}

patchJson("data/catalog.json", (catalog) => {
  catalog.publicBenchmark = {
    id: BENCHMARK_ID,
    cases: cases.length,
    locales: localeCounts,
    pages: manifest.assets.pages,
    benchmark: manifest.assets.benchmarkJson,
    report: manifest.assets.baselineReport,
    scope: "internal editorial regression; public reproducibility asset; not independent validation",
  };
});

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.endpoints ||= [];
  if (!root.endpoints.some((item) => item.path === "/evals/reasoning-routing.json")) {
    root.endpoints.push({ path: "/evals/reasoning-routing.json", url: `${API}/evals/reasoning-routing.json`, type: "benchmark", description: "Intent-to-pattern retrieval benchmark manifest" });
  }
});

patch("llms.txt", (text) => text.includes("## Public retrieval benchmark") ? text : `${text}\n## Public retrieval benchmark\n- Benchmark page: ${SITE_URL}/en/evals/\n- Cases: ${SITE_URL}/data/reasoning-benchmark.json\n- JSONL tasks: ${SITE_URL}/evals/reasoning-routing/tasks.jsonl\n- Baseline report: ${SITE_URL}/data/reasoning-evaluation.json\n- Machine manifest: ${API}/evals/reasoning-routing.json\n- This is an internal editorial regression benchmark with public gold labels, not independent external validation or evidence of learning efficacy.\n`);

patch("sitemap.xml", (xml) => pages.reduce((out, page) => out.includes(`<loc>${page.metadata.canonical}</loc>`) ? out : out.replace("</urlset>", `  <url><loc>${page.metadata.canonical}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`), xml));
patchJson("seo/site-pages.json", (inventory) => {
  inventory.pages ||= [];
  for (const page of pages) {
    const index = inventory.pages.findIndex((item) => item.route === page.metadata.route);
    if (index >= 0) inventory.pages[index] = page.metadata;
    else inventory.pages.push(page.metadata);
  }
  inventory.pages.sort((a, b) => a.route.localeCompare(b.route));
  inventory.pageCount = inventory.pages.length;
});

process.stdout.write(`Public benchmark: ${cases.length} cases, intent top-1 ${percent(report.metrics?.intent_top1_accuracy)}, move top-1 ${percent(report.metrics?.move_top1_accuracy)}, pattern hit@3 ${percent(report.metrics?.pattern_hit_at3)}.\n`);
