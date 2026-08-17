import fs from "node:fs";
import path from "node:path";
import { loadContent, contentCounts } from "../src/content.mjs";
import { collectionKeys, targetMeta } from "../src/i18n.mjs";
import { getDatasetVersion } from "../src/provenance.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TARGET_KEY = { en: "english", de: "german" };
const META = {
  en: new Set("past simple present perfect continuous noun verb adjective adverb infinitive gerund participle clause modal subject object pronoun article comparative superlative auxiliary possessive question tag phrase singular plural countable uncountable base form tense future condition conditional preposition conjunction relative active passive".split(" ")),
  de: new Set("konjunktiv akkusativ dativ nominativ genitiv infinitiv verb substantiv adjektiv adverb nebensatz hauptsatz partizip präsens perfekt präteritum futur modalverb artikel pronomen komparativ superlativ satz frage plural singular".split(" "))
};
const PLACEHOLDERS = new Set("x y z v n adj adv sb sth someone somebody something".split(" "));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replaceAll("’", "'")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .match(/[\p{L}]+(?:'[\p{L}]+)?/gu)?.join(" ") || "";
}

function tokenize(value = "") {
  return normalize(value).split(" ").filter(Boolean);
}

function formulaAnchors(formula, language) {
  const meta = META[language] || new Set();
  const raw = tokenize(formula);
  const anchors = [];
  const phrases = [];
  let phrase = [];
  for (const token of raw) {
    const excluded = meta.has(token) || PLACEHOLDERS.has(token) || (token.length === 1 && token !== "i");
    if (excluded) {
      if (phrase.length >= 3) phrases.push(phrase.join(" "));
      phrase = [];
      continue;
    }
    if (!anchors.includes(token)) anchors.push(token);
    phrase.push(token);
  }
  if (phrase.length >= 3) phrases.push(phrase.join(" "));
  return { anchors, phrases };
}

function buildPatternProfiles(patterns) {
  const rawByLanguage = { en: [], de: [] };
  for (const pattern of patterns.filter((item) => item.quality?.indexable !== false)) {
    for (const language of pattern.langs) {
      const parsed = formulaAnchors(language.formula, language.lang);
      rawByLanguage[language.lang].push({ pattern, language, ...parsed });
    }
  }

  const profiles = { en: new Map(), de: new Map() };
  const inverted = { en: new Map(), de: new Map() };
  for (const language of ["en", "de"]) {
    const documentFrequency = new Map();
    for (const profile of rawByLanguage[language]) {
      for (const token of new Set(profile.anchors)) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
    const population = rawByLanguage[language].length;
    for (const profile of rawByLanguage[language]) {
      const weighted = [...new Set(profile.anchors)]
        .map((token) => ({ token, weight: Math.log((population + 1) / ((documentFrequency.get(token) || 0) + 1)) + 1 }))
        .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token));
      let selected = weighted.filter((item) => item.weight >= 1.7).slice(0, 8);
      if (!selected.length) selected = weighted.slice(0, 3);
      if (profile.anchors.length <= 2) selected = weighted;
      const complete = { ...profile, selected };
      profiles[language].set(profile.pattern.id, complete);
      for (const item of selected) {
        if (!inverted[language].has(item.token)) inverted[language].set(item.token, new Set());
        inverted[language].get(item.token).add(profile.pattern.id);
      }
    }
  }
  return { profiles, inverted };
}

function scoreSentence(text, language, index) {
  const normalized = normalize(text);
  const sentenceTokens = new Set(tokenize(text));
  const candidates = new Set();
  for (const token of sentenceTokens) {
    for (const id of index.inverted[language].get(token) || []) candidates.add(id);
  }
  const matches = [];
  for (const id of candidates) {
    const profile = index.profiles[language].get(id);
    if (!profile?.selected.length) continue;
    const matched = profile.selected.filter((item) => sentenceTokens.has(item.token));
    if (matched.length < 2) continue;
    const countCoverage = matched.length / profile.selected.length;
    const matchedWeight = matched.reduce((sum, item) => sum + item.weight, 0);
    const totalWeight = profile.selected.reduce((sum, item) => sum + item.weight, 0) || 1;
    const weightCoverage = matchedWeight / totalWeight;
    const phraseLength = Math.max(0, ...profile.phrases.filter((phrase) => normalized.includes(phrase)).map((phrase) => phrase.split(" ").length));
    if (!phraseLength && (countCoverage < 0.75 || weightCoverage < 0.7)) continue;
    const score = countCoverage * 5 + weightCoverage * 7 + phraseLength * 2 + matchedWeight * 0.25 + (profile.selected.length <= 4 ? 1 : 0);
    matches.push({
      pattern_id: id,
      score: Number(score.toFixed(2)),
      formula: profile.language.formula,
      reasoning_move: profile.pattern.reasoning?.move || null
    });
  }
  return matches.sort((a, b) => b.score - a.score || a.pattern_id.localeCompare(b.pattern_id));
}

function relatedPatterns(pattern, index) {
  const move = pattern.reasoning?.move;
  if (move) {
    return [...index.profiles.en.values()]
      .filter((profile) => profile.pattern.id !== pattern.id && profile.pattern.reasoning?.move === move)
      .map((profile) => profile.pattern.id)
      .sort()
      .slice(0, 4);
  }
  const source = index.profiles.en.get(pattern.id);
  if (!source) return [];
  const sourceTokens = new Set(source.selected.map((item) => item.token));
  return [...index.profiles.en.values()]
    .filter((profile) => profile.pattern.id !== pattern.id && profile.pattern.set_id === pattern.set_id)
    .map((profile) => {
      const other = new Set(profile.selected.map((item) => item.token));
      const intersection = [...sourceTokens].filter((token) => other.has(token)).length;
      const union = new Set([...sourceTokens, ...other]).size || 1;
      return { id: profile.pattern.id, score: intersection / union + (profile.pattern.group_id === pattern.group_id ? 0.2 : 0) };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((item) => item.id);
}

function buildGraph(content) {
  const index = buildPatternProfiles(content.advancedPatterns);
  const documents = {};
  const patternDocuments = new Map(content.advancedPatterns.map((pattern) => [pattern.id, []]));
  let connectedDocumentCount = 0;
  let connectedSentenceCount = 0;

  for (const target of Object.values(targetMeta)) {
    const language = target.dataKey;
    for (const collection of collectionKeys) {
      for (const document of content.collections[target.key][collection].documents) {
        const byPattern = new Map();
        const sentenceLinks = [];
        document.annotations.forEach((annotation, annotationIndex) => {
          const best = scoreSentence(annotation.original_text, language, index)[0];
          if (!best || best.score < 12.5) return;
          const relation = {
            ...best,
            sentence_index: annotationIndex + 1,
            sentence: annotation.original_text
          };
          const previous = byPattern.get(best.pattern_id);
          if (!previous || relation.score > previous.score) byPattern.set(best.pattern_id, relation);
          if (best.score >= 13.5) sentenceLinks.push(relation);
        });
        const patterns = [...byPattern.values()]
          .sort((a, b) => b.score - a.score || a.pattern_id.localeCompare(b.pattern_id))
          .slice(0, 5);
        if (patterns.length) connectedDocumentCount += 1;
        connectedSentenceCount += sentenceLinks.length;
        const key = `${language}:${collection}:${document.id}`;
        documents[key] = {
          id: document.id,
          title: document.title,
          language,
          target_key: TARGET_KEY[language],
          collection,
          path: `/explore/${TARGET_KEY[language]}/${collection}/${document.id}/`,
          patterns,
          sentence_links: sentenceLinks
        };
        for (const relation of patterns) {
          patternDocuments.get(relation.pattern_id)?.push({
            document_id: document.id,
            title: document.title,
            language,
            target_key: TARGET_KEY[language],
            collection,
            path: `/explore/${TARGET_KEY[language]}/${collection}/${document.id}/`,
            sentence_index: relation.sentence_index,
            sentence: relation.sentence,
            score: relation.score
          });
        }
      }
    }
  }

  const patterns = {};
  const patternById = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  for (const pattern of content.advancedPatterns) {
    const documentsForPattern = (patternDocuments.get(pattern.id) || [])
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 4);
    patterns[pattern.id] = {
      id: pattern.id,
      set_id: pattern.set_id,
      group_id: pattern.group_id,
      reasoning_move: pattern.reasoning?.move || null,
      related_patterns: relatedPatterns(pattern, index),
      documents: documentsForPattern
    };
  }

  const reasoningMap = new Map();
  for (const pattern of content.advancedPatterns.filter((item) => item.reasoning?.move)) {
    const move = pattern.reasoning.move;
    if (!reasoningMap.has(move)) reasoningMap.set(move, []);
    reasoningMap.get(move).push(pattern);
  }
  const reasoningMoves = [...reasoningMap.entries()]
    .map(([move, movePatterns]) => {
      const first = movePatterns[0];
      return {
        move,
        count: movePatterns.length,
        representative_pattern_id: first.id,
        what_it_does_en: first.reasoning.what_it_does_en || "",
        what_it_does_ru: first.reasoning.what_it_does_ru || "",
        pattern_ids: movePatterns.map((pattern) => pattern.id).sort()
      };
    })
    .sort((a, b) => a.move.localeCompare(b.move));

  const counts = contentCounts(content);
  return {
    schemaVersion: 1,
    version: getDatasetVersion(),
    purpose: "Deterministic links between annotated sentences, reusable patterns, and reasoning moves. Relations are structural suggestions, not semantic-equivalence claims.",
    sourceCounts: { ...counts, reasoningFrames: reasoningMoves.reduce((sum, move) => sum + move.count, 0) },
    relationCounts: {
      connectedDocumentCount,
      connectedSentenceCount,
      reasoningMoveCount: reasoningMoves.length
    },
    reasoningMoves,
    documents,
    patterns,
    patternById
  };
}

function stylesheet(html) {
  if (html.includes("/assets/connectivity.css")) return html;
  return html.replace("</head>", "  <link rel=\"stylesheet\" href=\"/assets/connectivity.css\">\n</head>");
}

function localized(locale, en, ru) {
  return locale === "ru" ? ru : en;
}

function patternLabel(pattern, locale, language = "en") {
  if (!pattern) return "";
  if (locale === "ru") return pattern.title_ru;
  return pattern.langs.find((item) => item.lang === language)?.formula || pattern.id;
}

function enhancePractice(html, locale, graph, patternById) {
  const marker = '<section id="all-patterns" class="practice-tools';
  if (!html.includes(marker) || html.includes('data-connectivity="reasoning-nav"')) return html;
  const cards = graph.reasoningMoves.map((move) => {
    const pattern = patternById.get(move.representative_pattern_id);
    const description = locale === "ru" ? move.what_it_does_ru : move.what_it_does_en;
    return `<a href="/${locale}/practice/${move.representative_pattern_id.toLowerCase()}/#reasoning-move"><span class="document-number">${String(move.count).padStart(2, "0")}</span><span><strong>${escapeHtml(move.move)}</strong><small>${escapeHtml(description)}</small></span><span aria-hidden="true">→</span></a>`;
  }).join("");
  const section = `<section class="section-pad ruled connectivity-section" data-connectivity="reasoning-nav"><p class="eyebrow">${localized(locale, "Reasoning frames", "Логические каркасы")}</p><h2>${localized(locale, "Start from the move you want to make", "Начните с операции, которую хотите выразить")}</h2><p class="lede">${localized(locale, "Choose a reasoning operation first, then learn sentence frames that perform it in English and German.", "Сначала выберите логическую операцию, затем изучайте английские и немецкие каркасы, которые её выполняют.")}</p><div class="pattern-index connectivity-index">${cards}</div></section>`;
  return stylesheet(html.replace(marker, `${section}${marker}`));
}

function enhancePattern(html, locale, pattern, graph, patternById) {
  const relation = graph.patterns[pattern.id];
  if (!relation || html.includes('data-connectivity="pattern"')) return html;
  const sections = [];
  if (pattern.reasoning?.move) {
    const r = pattern.reasoning;
    const details = [
      [localized(locale, "What it does", "Что делает"), locale === "ru" ? r.what_it_does_ru : r.what_it_does_en],
      [localized(locale, "When to use it", "Когда использовать"), locale === "ru" ? r.when_to_use_ru : r.when_to_use_en],
      [localized(locale, "Common mistake", "Типичная ошибка"), locale === "ru" ? r.common_mistake_ru : r.common_mistake_en]
    ].filter(([, value]) => value);
    sections.push(`<section id="reasoning-move" class="section-pad ruled connectivity-section reasoning-move"><p class="eyebrow">${localized(locale, "Reasoning move", "Логическая операция")} · ${escapeHtml(r.move)}</p><h2>${escapeHtml(r.move)}</h2><div class="connectivity-notes">${details.map(([label, value]) => `<div><strong>${escapeHtml(label)}</strong><p>${escapeHtml(value)}</p></div>`).join("")}</div></section>`);
  }
  if (relation.documents.length) {
    const cards = relation.documents.slice(0, 3).map((document) => `<a href="/${locale}${document.path}#sentence-${document.sentence_index}"><span class="document-number">${document.language.toUpperCase()}</span><span><strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.sentence)}</small></span><span aria-hidden="true">→</span></a>`).join("");
    sections.push(`<section class="section-pad ruled connectivity-section"><p class="eyebrow">${localized(locale, "Annotated language", "Размеченные предложения")}</p><h2>${localized(locale, "See this structure in context", "Посмотрите структуру в контексте")}</h2><p>${localized(locale, "These links are deterministic structural matches from the annotated corpus, not claims that the sentences mean exactly the same thing.", "Это детерминированные структурные совпадения из размеченного корпуса, а не утверждение о полном совпадении смысла.")}</p><div class="pattern-index connectivity-index">${cards}</div></section>`);
  }
  if (relation.related_patterns.length) {
    const cards = relation.related_patterns.map((id) => {
      const related = patternById.get(id);
      return `<a href="/${locale}/practice/${id.toLowerCase()}/"><span class="document-number">${escapeHtml(id)}</span><span><strong>${escapeHtml(patternLabel(related, locale))}</strong><small>${escapeHtml(related?.reasoning?.move || related?.set_id || "")}</small></span><span aria-hidden="true">→</span></a>`;
    }).join("");
    sections.push(`<section class="section-pad ruled connectivity-section"><p class="eyebrow">${localized(locale, "Pattern graph", "Граф паттернов")}</p><h2>${localized(locale, "Continue with nearby patterns", "Продолжите с близкими паттернами")}</h2><div class="pattern-index connectivity-index">${cards}</div></section>`);
  }
  if (!sections.length) return html;
  const marker = "</article></main>";
  const position = html.lastIndexOf(marker);
  if (position < 0) throw new Error(`Cannot inject pattern connectivity for ${pattern.id}`);
  const enhanced = `${html.slice(0, position)}<div data-connectivity="pattern">${sections.join("")}</div>${html.slice(position)}`;
  return stylesheet(enhanced);
}

function injectSentenceLink(html, locale, relation, patternById) {
  const pattern = patternById.get(relation.pattern_id);
  if (!pattern) return html;
  const startMarker = `<article class="annotation-row" id="sentence-${relation.sentence_index}">`;
  const start = html.indexOf(startMarker);
  if (start < 0) return html;
  const end = html.indexOf("</article>", start);
  if (end < 0) return html;
  const row = html.slice(start, end + 10);
  if (row.includes("sentence-pattern-link")) return html;
  const note = `<p class="sentence-pattern-link"><strong>${localized(locale, "Reusable pattern", "Переиспользуемый паттерн")}:</strong> <a href="/${locale}/practice/${relation.pattern_id.toLowerCase()}/">${escapeHtml(patternLabel(pattern, locale, relation.formula?.startsWith("Wenn") ? "de" : "en"))}</a></p>`;
  const updatedRow = row.replace("</details>", `${note}</details>`);
  return `${html.slice(0, start)}${updatedRow}${html.slice(end + 10)}`;
}

function enhanceDocument(html, locale, relation, patternById) {
  if (!relation || html.includes('data-connectivity="document"')) return html;
  let enhanced = html;
  for (const sentenceRelation of relation.sentence_links) enhanced = injectSentenceLink(enhanced, locale, sentenceRelation, patternById);
  if (relation.patterns.length) {
    const cards = relation.patterns.map((item) => {
      const pattern = patternById.get(item.pattern_id);
      return `<a href="/${locale}/practice/${item.pattern_id.toLowerCase()}/"><span class="document-number">${escapeHtml(item.pattern_id)}</span><span><strong>${escapeHtml(patternLabel(pattern, locale, relation.language))}</strong><small>${escapeHtml(item.sentence)}</small></span><span aria-hidden="true">→</span></a>`;
    }).join("");
    const section = `<section class="section-pad ruled connectivity-section" data-connectivity="document"><p class="eyebrow">${localized(locale, "From sentence to pattern", "От предложения к паттерну")}</p><h2>${localized(locale, "Reusable structures found in this text", "Переиспользуемые структуры в этом тексте")}</h2><p>${localized(locale, "Strong structural matches connect the annotated text to patterns you can practise and reuse.", "Сильные структурные совпадения связывают размеченный текст с паттернами, которые можно тренировать и переиспользовать.")}</p><div class="pattern-index connectivity-index">${cards}</div></section>`;
    const marker = '<aside class="share-bar';
    if (enhanced.includes(marker)) enhanced = enhanced.replace(marker, `${section}${marker}`);
    else enhanced = enhanced.replace("</article></main>", `${section}</article></main>`);
  }
  return stylesheet(enhanced);
}

function writeGraph(graph) {
  const serializable = { ...graph };
  delete serializable.patternById;
  const output = path.join(DIST, "data", "connections.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(serializable, null, 2)}\n`);
}

function updateHtml(content, graph) {
  const patternById = graph.patternById;
  for (const locale of ["en", "ru"]) {
    const practiceFile = path.join(DIST, locale, "practice", "index.html");
    fs.writeFileSync(practiceFile, enhancePractice(fs.readFileSync(practiceFile, "utf8"), locale, graph, patternById));

    for (const pattern of content.advancedPatterns) {
      const file = path.join(DIST, locale, "practice", pattern.id.toLowerCase(), "index.html");
      fs.writeFileSync(file, enhancePattern(fs.readFileSync(file, "utf8"), locale, pattern, graph, patternById));
    }

    for (const target of Object.values(targetMeta)) {
      for (const collection of collectionKeys) {
        for (const document of content.collections[target.key][collection].documents) {
          const key = `${target.dataKey}:${collection}:${document.id}`;
          const file = path.join(DIST, locale, "explore", target.key, collection, document.id, "index.html");
          fs.writeFileSync(file, enhanceDocument(fs.readFileSync(file, "utf8"), locale, graph.documents[key], patternById));
        }
      }
    }
  }
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the base static build first");
  const content = loadContent();
  const graph = buildGraph(content);
  writeGraph(graph);
  updateHtml(content, graph);
  process.stdout.write(`Connectivity: ${graph.relationCounts.connectedDocumentCount} documents, ${graph.relationCounts.connectedSentenceCount} sentence links, ${graph.relationCounts.reasoningMoveCount} reasoning moves.\n`);
}

main();
