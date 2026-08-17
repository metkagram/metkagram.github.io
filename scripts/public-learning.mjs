import fs from "node:fs";
import path from "node:path";
import { loadContent, contentCounts } from "../src/content.mjs";
import { collectionKeys, targetMeta } from "../src/i18n.mjs";
import { intentById } from "../src/intents.mjs";
import { getDatasetVersion } from "../src/provenance.mjs";
import {
  classifyReasoningSentence,
  PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE,
  PUBLIC_LEARNING_STRENGTHS,
  PUBLIC_LEARNING_STRENGTH_RANK,
  validatePublicLearningRules
} from "../src/public-learning.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TARGET_KEY = { en: "english", de: "german" };
const BASE_URL = "https://metkagram.github.io";
const QUALITY_BENCHMARK = path.join(ROOT, "data", "evaluation", "public-learning-links.json");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function localized(locale, en, ru) {
  return locale === "ru" ? ru : en;
}

function patternFormula(pattern, language) {
  return pattern?.langs?.find((item) => item.lang === language)?.formula || pattern?.langs?.[0]?.formula || pattern?.id || "";
}

function intentTitle(intent, locale) {
  return locale === "ru" ? intent?.title_ru : intent?.title_en;
}

function relationSort(a, b) {
  return PUBLIC_LEARNING_STRENGTH_RANK[b.strength] - PUBLIC_LEARNING_STRENGTH_RANK[a.strength]
    || a.sentence.localeCompare(b.sentence)
    || a.pattern_id.localeCompare(b.pattern_id);
}

export function buildPublicLearningGraph(content) {
  const publicPatternIds = new Set(content.advancedPatterns.map((pattern) => pattern.id));
  validatePublicLearningRules(publicPatternIds);
  const patternById = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  const documents = {};
  const patternLinks = new Map(content.advancedPatterns.map((pattern) => [pattern.id, []]));
  const intentLinks = new Map([...intentById.keys()].map((id) => [id, []]));
  const linkedSentenceKeys = new Set();
  const linkedDocumentKeys = new Set();
  const coveredMoves = new Set();
  const coveredIntents = new Set();
  const coveredPatterns = new Set();
  let relationCount = 0;

  for (const target of Object.values(targetMeta)) {
    const language = target.dataKey;
    for (const collection of collectionKeys) {
      for (const document of content.collections[target.key][collection].documents) {
        const key = `${language}:${collection}:${document.id}`;
        const sentenceLinks = [];
        document.annotations.forEach((annotation, annotationIndex) => {
          const links = classifyReasoningSentence(annotation.original_text, language);
          for (const link of links) {
            const relation = {
              ...link,
              sentence_index: annotationIndex + 1,
              sentence: annotation.original_text,
              document_id: document.id,
              document_title: document.title,
              language,
              target_key: TARGET_KEY[language],
              collection,
              path: `/explore/${TARGET_KEY[language]}/${collection}/${document.id}/`
            };
            sentenceLinks.push(relation);
            patternLinks.get(link.pattern_id)?.push(relation);
            intentLinks.get(link.intent_id)?.push(relation);
            relationCount += 1;
            linkedSentenceKeys.add(`${key}:${annotationIndex + 1}`);
            linkedDocumentKeys.add(key);
            coveredMoves.add(link.reasoning_move);
            coveredIntents.add(link.intent_id);
            coveredPatterns.add(link.pattern_id);
          }
        });
        documents[key] = {
          id: document.id,
          title: document.title,
          language,
          target_key: TARGET_KEY[language],
          collection,
          path: `/explore/${TARGET_KEY[language]}/${collection}/${document.id}/`,
          sentence_links: sentenceLinks.sort(relationSort),
          reasoning_moves: [...new Set(sentenceLinks.map((item) => item.reasoning_move))].sort(),
          intent_ids: [...new Set(sentenceLinks.map((item) => item.intent_id))].sort(),
          pattern_ids: [...new Set(sentenceLinks.map((item) => item.pattern_id))].sort()
        };
      }
    }
  }

  const patterns = Object.fromEntries(content.advancedPatterns.map((pattern) => [
    pattern.id,
    {
      id: pattern.id,
      reasoning_move: pattern.reasoning?.move || null,
      sentence_examples: (patternLinks.get(pattern.id) || []).sort(relationSort).slice(0, 12)
    }
  ]));

  const intents = Object.fromEntries([...intentById.entries()].map(([id, intent]) => [
    id,
    {
      id,
      reasoning_move: intent.move,
      sentence_examples: (intentLinks.get(id) || []).sort(relationSort).slice(0, 12)
    }
  ]));

  const counts = contentCounts(content);
  return {
    schemaVersion: 2,
    version: getDatasetVersion(),
    purpose: "Reviewed public learning links from real annotated sentences to reasoning intents and recommended frames.",
    evidenceLimit: "A link means that a visible cue supports the same reasoning move or communicative intent. It is a deterministic pedagogical connection, not a probability estimate and not a claim that the source sentence is semantically or syntactically equivalent to the recommended frame.",
    rules: {
      maximumLinksPerSentence: PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE,
      relationStrengths: PUBLIC_LEARNING_STRENGTHS,
      relationScopes: ["frame_structure", "reasoning_move", "intent_prompt"],
      ranking: "direct > supported > prompt, then editorial rule priority",
      scorePolicy: "No probability or confidence percentage is published. Relation strength is categorical and editorial."
    },
    sourceCounts: {
      annotatedDocuments: counts.annotatedDocuments,
      annotatedSentences: counts.annotatedSentences,
      publicReasoningFrames: content.advancedPatterns.length,
      intents: intentById.size
    },
    relationCounts: {
      connectedDocumentCount: linkedDocumentKeys.size,
      connectedSentenceCount: linkedSentenceKeys.size,
      relationCount,
      coveredReasoningMoveCount: coveredMoves.size,
      coveredIntentCount: coveredIntents.size,
      coveredPatternCount: coveredPatterns.size
    },
    coverage: {
      reasoningMoves: [...coveredMoves].sort(),
      intents: [...coveredIntents].sort(),
      patterns: [...coveredPatterns].sort()
    },
    documents,
    patterns,
    intents,
    patternById
  };
}

function stylesheet(html) {
  if (html.includes("/assets/connectivity.css")) return html;
  return html.replace("</head>", '  <link rel="stylesheet" href="/assets/connectivity.css">\n</head>');
}

function relationBlock(locale, relation, patternById) {
  const intent = intentById.get(relation.intent_id);
  const pattern = patternById.get(relation.pattern_id);
  const strength = localized(
    locale,
    relation.strength === "direct" ? "direct structural cue" : relation.strength === "prompt" ? "communicative prompt" : "supported reasoning cue",
    relation.strength === "direct" ? "прямой структурный сигнал" : relation.strength === "prompt" ? "коммуникативная задача" : "поддержанный логический сигнал"
  );
  return `<div class="sentence-reasoning-link" data-reasoning-move="${escapeHtml(relation.reasoning_move)}" data-intent="${escapeHtml(relation.intent_id)}" data-pattern="${escapeHtml(relation.pattern_id)}" data-strength="${escapeHtml(relation.strength)}"><p><strong>${escapeHtml(relation.reasoning_move)}</strong> · <a href="/${locale}/practice/intents/#intent-${escapeHtml(relation.intent_id)}">${escapeHtml(intentTitle(intent, locale))}</a> → <a href="/${locale}/practice/${relation.pattern_id.toLowerCase()}/#reasoning-move">${escapeHtml(patternFormula(pattern, relation.language))}</a></p><small>${escapeHtml(strength)} · ${escapeHtml(relation.evidence)}</small></div>`;
}

function injectSentenceLinks(html, locale, documentRelation, patternById) {
  let result = html;
  const bySentence = new Map();
  for (const relation of documentRelation.sentence_links) {
    if (!bySentence.has(relation.sentence_index)) bySentence.set(relation.sentence_index, []);
    bySentence.get(relation.sentence_index).push(relation);
  }
  for (const [sentenceIndex, relations] of bySentence) {
    const startMarker = `<article class="annotation-row" id="sentence-${sentenceIndex}">`;
    const start = result.indexOf(startMarker);
    if (start < 0) continue;
    const end = result.indexOf("</article>", start);
    if (end < 0) continue;
    const row = result.slice(start, end + 10);
    if (row.includes('data-public-learning="sentence"')) continue;
    const block = `<div class="sentence-reasoning-links" data-public-learning="sentence"><p class="sentence-reasoning-kicker">${localized(locale, "Reasoning connection", "Логическая связь")}</p>${relations.map((relation) => relationBlock(locale, relation, patternById)).join("")}</div>`;
    const updated = row.includes("</details>") ? row.replace("</details>", `${block}</details>`) : row.replace("</div></article>", `${block}</div></article>`);
    result = `${result.slice(0, start)}${updated}${result.slice(end + 10)}`;
  }
  return result;
}

function documentSummary(locale, relation) {
  const counts = new Map();
  for (const link of relation.sentence_links) {
    const key = `${link.reasoning_move}:${link.intent_id}`;
    if (!counts.has(key)) counts.set(key, { move: link.reasoning_move, intent_id: link.intent_id, count: 0 });
    counts.get(key).count += 1;
  }
  const cards = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.move.localeCompare(b.move))
    .slice(0, 8)
    .map((item) => {
      const intent = intentById.get(item.intent_id);
      return `<a href="/${locale}/practice/intents/#intent-${escapeHtml(item.intent_id)}"><span class="document-number">${String(item.count).padStart(2, "0")}</span><span><strong>${escapeHtml(item.move)}</strong><small>${escapeHtml(intentTitle(intent, locale))}</small></span><span aria-hidden="true">→</span></a>`;
    }).join("");
  return `<section class="section-pad ruled connectivity-section" data-public-learning="document-summary"><p class="eyebrow">${localized(locale, "Reasoning in context", "Логика в контексте")}</p><h2>${localized(locale, "Move from a real sentence to a reusable frame", "От реального предложения к переиспользуемому каркасу")}</h2><p>${localized(locale, "These reviewed links are based on visible reasoning cues. They suggest a next frame to practise; they do not claim that the source sentence and frame mean exactly the same thing.", "Эти проверенные связи строятся по видимым логическим сигналам. Они предлагают следующий каркас для практики, но не утверждают, что исходное предложение и каркас полностью эквивалентны.")}</p><div class="pattern-index connectivity-index">${cards}</div></section>`;
}

function enhanceDocument(html, locale, relation, patternById) {
  if (!relation?.sentence_links?.length) return html;
  let result = injectSentenceLinks(html, locale, relation, patternById);
  if (!result.includes('data-public-learning="document-summary"')) {
    const section = documentSummary(locale, relation);
    const marker = '<aside class="share-bar';
    result = result.includes(marker) ? result.replace(marker, `${section}${marker}`) : result.replace("</article></main>", `${section}</article></main>`);
  }
  return stylesheet(result);
}

function corpusExampleCard(locale, relation) {
  return `<a href="/${locale}${relation.path}#sentence-${relation.sentence_index}"><span class="document-number">${relation.language.toUpperCase()}</span><span><strong>${escapeHtml(relation.document_title)}</strong><small>${escapeHtml(relation.sentence)}</small></span><span aria-hidden="true">→</span></a>`;
}

function enhancePattern(html, locale, patternId, graph) {
  const examples = graph.patterns[patternId]?.sentence_examples || [];
  if (!examples.length || html.includes('data-public-learning="pattern-corpus"')) return html;
  const section = `<section class="section-pad ruled connectivity-section" data-public-learning="pattern-corpus"><p class="eyebrow">${localized(locale, "Public corpus examples", "Примеры из публичного корпуса")}</p><h2>${localized(locale, "See this reasoning move in real sentences", "Посмотрите эту логическую операцию в реальных предложениях")}</h2><p>${localized(locale, "The source sentence contains a reviewed cue that points toward this frame. Treat it as a bridge for practice, not as an equivalence claim.", "В исходном предложении есть проверенный сигнал, который ведёт к этому каркасу. Используйте связь как мост для практики, а не как утверждение об эквивалентности.")}</p><div class="pattern-index connectivity-index">${examples.slice(0, 6).map((item) => corpusExampleCard(locale, item)).join("")}</div></section>`;
  const marker = '<aside class="share-bar';
  const result = html.includes(marker) ? html.replace(marker, `${section}${marker}`) : html.replace("</article></main>", `${section}</article></main>`);
  return stylesheet(result);
}

function enhanceIntentPage(html, locale, graph) {
  let result = html;
  for (const [intentId, relation] of Object.entries(graph.intents)) {
    if (!relation.sentence_examples.length) continue;
    const startMarker = `<article id="intent-${intentId}"`;
    const start = result.indexOf(startMarker);
    if (start < 0) continue;
    const end = result.indexOf("</article>", start);
    if (end < 0) continue;
    const article = result.slice(start, end + 10);
    if (article.includes('data-public-learning="intent-corpus"')) continue;
    const block = `<div class="intent-corpus-examples" data-public-learning="intent-corpus"><p class="eyebrow">${localized(locale, "From the reviewed public corpus", "Из проверенного публичного корпуса")}</p><div class="pattern-index connectivity-index">${relation.sentence_examples.slice(0, 3).map((item) => corpusExampleCard(locale, item)).join("")}</div></div>`;
    const updated = article.replace("</article>", `${block}</article>`);
    result = `${result.slice(0, start)}${updated}${result.slice(end + 10)}`;
  }
  return stylesheet(result);
}

function serializableGraph(graph) {
  const output = { ...graph };
  delete output.patternById;
  return output;
}

function writeJson(relativePath, value) {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function countValues(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function buildQualityReport(graph) {
  const benchmark = JSON.parse(fs.readFileSync(QUALITY_BENCHMARK, "utf8"));
  const positiveResults = benchmark.positive_cases.map((item) => {
    const links = classifyReasoningSentence(item.sentence, item.language);
    const passed = links.some((link) =>
      link.reasoning_move === item.expected_move
      && link.intent_id === item.expected_intent
      && link.pattern_id === item.expected_pattern
    );
    return { id: item.id, passed };
  });
  const negativeResults = benchmark.negative_cases.map((item) => {
    const links = classifyReasoningSentence(item.sentence, item.language);
    return { id: item.id, passed: links.length === 0, emittedRules: links.map((link) => link.rule_id) };
  });

  const relations = Object.values(graph.documents).flatMap((document) => document.sentence_links);
  const positivePassed = positiveResults.filter((item) => item.passed).length;
  const negativePassed = negativeResults.filter((item) => item.passed).length;

  return {
    schemaVersion: 1,
    graphSchemaVersion: graph.schemaVersion,
    version: graph.version,
    purpose: "Precision-oriented editorial audit of the public sentence-to-reasoning connection layer.",
    evidenceLimit: "Positive and negative controls are curated regression examples from the public corpus. Their pass rates are not statistical precision, recall, or evidence of learning efficacy.",
    benchmark: {
      schemaVersion: benchmark.schemaVersion,
      positiveCases: positiveResults.length,
      positivePassed,
      negativeCases: negativeResults.length,
      negativePassed,
      positivePassRate: positiveResults.length ? positivePassed / positiveResults.length : 0,
      negativeControlPassRate: negativeResults.length ? negativePassed / negativeResults.length : 0,
      gatePassed: positivePassed === positiveResults.length && negativePassed === negativeResults.length
    },
    relationCounts: graph.relationCounts,
    distribution: {
      byStrength: countValues(relations.map((item) => item.strength)),
      byScope: countValues(relations.map((item) => item.scope)),
      byLanguage: countValues(relations.map((item) => item.language)),
      byRule: countValues(relations.map((item) => item.rule_id))
    },
    suppressedBroadMappings: [
      "ordinary if/wenn condition -> only-if prerequisite",
      "generic wenn ... würde hypothetical -> hypothesis test",
      "prefer X to Y -> decision",
      "assumption noun/phrase -> challenge without a challenge cue",
      "decision question -> stated decision",
      "generic what-if scenario -> hypothesis test"
    ],
    positiveResults,
    negativeResults
  };
}

function patchCatalog(graph, quality) {
  const catalogPath = path.join(DIST, "data", "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  catalog.publicLearningConnections = {
    ...graph.relationCounts,
    dataset: `${BASE_URL}/data/learning-connections.json`,
    qualityReport: `${BASE_URL}/data/learning-connections-quality.json`,
    evidenceLimit: graph.evidenceLimit
  };
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

  const projectPath = path.join(DIST, "project.json");
  const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
  project.publicLearningConnections = {
    linkedSentences: graph.relationCounts.connectedSentenceCount,
    relations: graph.relationCounts.relationCount,
    coveredReasoningMoves: graph.relationCounts.coveredReasoningMoveCount,
    dataset: `${BASE_URL}/data/learning-connections.json`,
    qualityReport: `${BASE_URL}/data/learning-connections-quality.json`,
    qualityGatePassed: quality.benchmark.gatePassed
  };
  fs.writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);

  const llmsPath = path.join(DIST, "llms.txt");
  let llms = fs.readFileSync(llmsPath, "utf8");
  if (!llms.includes("/data/learning-connections.json")) {
    llms = `${llms.trimEnd()}\n\n## Public learning connections\n- ${BASE_URL}/data/learning-connections.json — reviewed cue-based links from published annotated sentences to reasoning intents and recommended frames; pedagogical links, not semantic-equivalence claims.\n`;
  }
  if (!llms.includes("/data/learning-connections-quality.json")) {
    llms = `${llms.trimEnd()}\n- ${BASE_URL}/data/learning-connections-quality.json — precision-oriented positive/negative-control audit for the public learning links; editorial regression evidence, not statistical precision or learning-efficacy evidence.\n`;
  }
  fs.writeFileSync(llmsPath, llms);
}

function updateHtml(content, graph) {
  const patternById = graph.patternById;
  for (const locale of ["en", "ru"]) {
    for (const target of Object.values(targetMeta)) {
      const language = target.dataKey;
      for (const collection of collectionKeys) {
        for (const document of content.collections[target.key][collection].documents) {
          const key = `${language}:${collection}:${document.id}`;
          const file = path.join(DIST, locale, "explore", target.key, collection, document.id, "index.html");
          const current = fs.readFileSync(file, "utf8");
          fs.writeFileSync(file, enhanceDocument(current, locale, graph.documents[key], patternById));
        }
      }
    }

    for (const pattern of content.advancedPatterns) {
      const file = path.join(DIST, locale, "practice", pattern.id.toLowerCase(), "index.html");
      const current = fs.readFileSync(file, "utf8");
      fs.writeFileSync(file, enhancePattern(current, locale, pattern.id, graph));
    }

    const intentsFile = path.join(DIST, locale, "practice", "intents", "index.html");
    const intentsHtml = fs.readFileSync(intentsFile, "utf8");
    fs.writeFileSync(intentsFile, enhanceIntentPage(intentsHtml, locale, graph));
  }
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the base static build first");
  const content = loadContent();
  const graph = buildPublicLearningGraph(content);
  const quality = buildQualityReport(graph);
  if (!quality.benchmark.gatePassed) throw new Error("Public learning quality benchmark failed");
  writeJson("data/learning-connections.json", serializableGraph(graph));
  writeJson("data/learning-connections-quality.json", quality);
  patchCatalog(graph, quality);
  updateHtml(content, graph);
  process.stdout.write(`Public learning: ${graph.relationCounts.connectedSentenceCount} sentences, ${graph.relationCounts.relationCount} links, ${graph.relationCounts.connectedDocumentCount} documents, ${graph.relationCounts.coveredReasoningMoveCount} reasoning moves.\n`);
  process.stdout.write(`Public learning quality: ${quality.benchmark.positivePassed}/${quality.benchmark.positiveCases} positive controls, ${quality.benchmark.negativePassed}/${quality.benchmark.negativeCases} negative controls.\n`);
}

main();
