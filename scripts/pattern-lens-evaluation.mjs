import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../src/content.mjs";
import { rankLensPatterns } from "../src/pattern-lens-ranking.mjs";
import { getDatasetVersion } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const CASES_FILE = path.join(ROOT, "data", "evaluation", "pattern-lens-cases.json");
const REPORT_FILE = path.join(DIST, "data", "pattern-lens-evaluation.json");

function ratio(value, total) {
  return total ? Number((value / total).toFixed(4)) : 0;
}

function evaluateCase(patterns, item) {
  const matches = rankLensPatterns(patterns, item.sentence, item.language, 6);
  const expectedRank = matches.findIndex((match) => match.id === item.expected_pattern);
  const expected = expectedRank >= 0 ? matches[expectedRank] : null;
  const moveRank = matches.findIndex((match) => match.reasoning_move === item.expected_move);
  return {
    id: item.id,
    language: item.language,
    sentence: item.sentence,
    expected_pattern: item.expected_pattern,
    expected_move: item.expected_move,
    expected_rank: expectedRank >= 0 ? expectedRank + 1 : null,
    move_rank: moveRank >= 0 ? moveRank + 1 : null,
    expected_evidence: expected?.evidence_type || null,
    expected_literal_hits: expected?.hits || [],
    expected_reasoning: expected?.reasoning_match || null,
    top_results: matches.slice(0, 3).map((match) => ({
      id: match.id,
      reasoning_move: match.reasoning_move,
      score: match.score,
      evidence_type: match.evidence_type,
      hits: match.hits,
      reasoning_match: match.reasoning_match
        ? {
            intent_id: match.reasoning_match.intent_id,
            strength: match.reasoning_match.strength,
            evidence: match.reasoning_match.evidence,
          }
        : null,
    })),
  };
}

function metrics(results) {
  const total = results.length;
  const top1 = results.filter((item) => item.expected_rank === 1).length;
  const hit3 = results.filter((item) => item.expected_rank && item.expected_rank <= 3).length;
  const hit6 = results.filter((item) => item.expected_rank && item.expected_rank <= 6).length;
  const move3 = results.filter((item) => item.move_rank && item.move_rank <= 3).length;
  const reasoningExpected = results.filter((item) => item.expected_reasoning).length;
  const literalExpected = results.filter((item) => item.expected_literal_hits.length).length;
  const bothExpected = results.filter((item) => item.expected_reasoning && item.expected_literal_hits.length).length;
  return {
    cases: total,
    expected_pattern_top_1: ratio(top1, total),
    expected_pattern_hit_at_3: ratio(hit3, total),
    expected_pattern_hit_at_6: ratio(hit6, total),
    expected_move_hit_at_3: ratio(move3, total),
    expected_pattern_with_reasoning_evidence: ratio(reasoningExpected, total),
    expected_pattern_with_literal_evidence: ratio(literalExpected, total),
    expected_pattern_with_both_signals: ratio(bothExpected, total),
  };
}

function patchResearch(locale, report) {
  const file = path.join(DIST, locale, "research", "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-pattern-lens-evaluation")) return;
  const pct = (value) => `${Math.round(value * 100)}%`;
  const caveat = locale === "ru"
    ? "Это инженерный regression benchmark по уже опубликованным positive controls, а не независимое доказательство качества метода, статистической precision/recall или эффективности обучения."
    : "This is an engineering regression benchmark over already published positive controls, not independent evidence for method quality, statistical precision/recall, or learning efficacy.";
  const body = locale === "ru"
    ? `На ${report.metrics.cases} проверенных EN/DE фразах из ограниченного public corpus ожидаемый паттерн попадает в top-3 в ${pct(report.metrics.expected_pattern_hit_at_3)} случаев. Lens объединяет буквальные части формулы с категориальными reasoning cues.`
    : `Across ${report.metrics.cases} reviewed EN/DE sentences from the bounded public corpus, the expected pattern appears in the top 3 in ${pct(report.metrics.expected_pattern_hit_at_3)} of cases. Lens combines literal formula evidence with categorical reasoning cues.`;
  const block = `<section class="section-pad ruled" data-pattern-lens-evaluation><p class="eyebrow">Pattern Lens · evaluation</p><h2>Pattern Lens: retrieval regression</h2><p class="lede">${body}</p><p>${caveat}</p><p><a href="/data/pattern-lens-evaluation.json">Machine-readable report →</a></p></section>`;
  html = html.replace("</main>", `${block}</main>`);
  fs.writeFileSync(file, html);
}

function patchDiscovery(report) {
  const apiIndex = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(apiIndex)) {
    const value = JSON.parse(fs.readFileSync(apiIndex, "utf8"));
    value.pattern_lens_evaluation = `${SITE_URL}/data/pattern-lens-evaluation.json`;
    value.endpoints ||= [];
    if (!value.endpoints.some((item) => item.url === `${SITE_URL}/data/pattern-lens-evaluation.json`)) {
      value.endpoints.push({ path: "/data/pattern-lens-evaluation.json", url: `${SITE_URL}/data/pattern-lens-evaluation.json`, type: "evaluation", description: "Pattern Lens retrieval regression report" });
    }
    fs.writeFileSync(apiIndex, `${JSON.stringify(value, null, 2)}\n`);
  }

  const manifest = path.join(DIST, "api", "v1", "teaching-manifest.json");
  if (fs.existsSync(manifest)) {
    const value = JSON.parse(fs.readFileSync(manifest, "utf8"));
    value.evaluation = {
      report: `${SITE_URL}/data/pattern-lens-evaluation.json`,
      primary_metric: "expected_pattern_hit_at_3",
      value: report.metrics.expected_pattern_hit_at_3,
      evidence_limit: report.evidence_limit,
    };
    fs.writeFileSync(manifest, `${JSON.stringify(value, null, 2)}\n`);
  }

  const llms = path.join(DIST, "llms.txt");
  if (fs.existsSync(llms)) {
    let text = fs.readFileSync(llms, "utf8");
    if (!text.includes("Pattern Lens evaluation:")) {
      text += `\n- Pattern Lens evaluation: ${SITE_URL}/data/pattern-lens-evaluation.json (curated retrieval regression; not statistical precision/recall or learning-efficacy evidence)\n`;
      fs.writeFileSync(llms, text);
    }
  }
}

export function evaluatePatternLens() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the site build first.");
  const fixture = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
  const content = loadContent();
  const results = fixture.cases.map((item) => evaluateCase(content.advancedPatterns, item));
  const summary = metrics(results);
  const report = {
    schema_version: 2,
    dataset_version: getDatasetVersion(),
    release_date: SITE_RELEASE_DATE,
    purpose: fixture.purpose,
    primary_metric: fixture.primaryMetric,
    evidence_limit: fixture.scope,
    architecture: "hybrid deterministic retrieval: literal reusable-formula evidence + reviewed categorical public reasoning cues",
    reasoning_strength_policy: "direct > supported > prompt; categorical editorial evidence, not probability",
    thresholds: {
      expected_pattern_hit_at_3: 0.95,
      expected_move_hit_at_3: 0.95,
    },
    metrics: summary,
    cases: results,
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  patchResearch("en", report);
  patchResearch("ru", report);
  patchDiscovery(report);

  if (summary.expected_pattern_hit_at_3 < report.thresholds.expected_pattern_hit_at_3) {
    throw new Error(`Pattern Lens expected-pattern hit@3 ${summary.expected_pattern_hit_at_3} is below ${report.thresholds.expected_pattern_hit_at_3}`);
  }
  if (summary.expected_move_hit_at_3 < report.thresholds.expected_move_hit_at_3) {
    throw new Error(`Pattern Lens expected-move hit@3 ${summary.expected_move_hit_at_3} is below ${report.thresholds.expected_move_hit_at_3}`);
  }

  console.log(`Pattern Lens evaluation: ${summary.cases} cases; pattern hit@3 ${Math.round(summary.expected_pattern_hit_at_3 * 100)}%; move hit@3 ${Math.round(summary.expected_move_hit_at_3 * 100)}%.`);
  return report;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) evaluatePatternLens();
