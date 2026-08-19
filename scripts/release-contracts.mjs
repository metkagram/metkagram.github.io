import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");

function patch(relativePath, mutate) {
  const file = path.join(DIST, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing release page: ${relativePath}`);
  const before = fs.readFileSync(file, "utf8");
  const after = mutate(before);
  if (after === before) throw new Error(`Release contract patch made no change: ${relativePath}`);
  fs.writeFileSync(file, after);
}

function replaceAllKnown(html, replacements) {
  for (const [before, after] of replacements) html = html.replaceAll(before, after);
  return html;
}

patch("en/index.html", (html) => replaceAllKnown(html.replace(
  "</h1><p class=\"home-kicker\">",
  "</h1><!-- Previous public line retained as release-history metadata: See the structure. Use the phrase. --><p class=\"home-kicker\">"
), [
  [
    "Annotated English and German sentences, dialogues, reference collections, a notation guide, and a public catalogue of B2–C1 patterns with examples and variations.",
    "Annotated English and German sentences, a large B2–C1 pattern catalogue, Thinking in Language sets, and a bounded French Frame-only pilot without French annotation or interface claims."
  ],
  [
    "No. The token-level annotation scheme is also an open, machine-readable research resource for NLP-oriented analysis, teaching experiments and language-data work.",
    "No. Selected annotation data and machine-readable pattern and relation datasets also support NLP-oriented analysis, teaching experiments and research. Current reuse follows the Metkagram licensing terms."
  ]
]));

patch("ru/index.html", (html) => replaceAllKnown(html.replace(
  "</h1><p class=\"home-kicker\">",
  "</h1><!-- Предыдущая публичная формулировка сохранена как метаданные истории релиза: Читайте фразы. Замечайте структуру. --><p class=\"home-kicker\">"
), [
  [
    "Английские и немецкие фразы с разметкой, диалоги, справочник и каталог моделей B2–C1 с примерами.",
    "Английские и немецкие фразы с разметкой, большой каталог моделей B2–C1, сеты Thinking in Language и ограниченный французский Frame-only пилот без заявлений о французской разметке или интерфейсе."
  ],
  [
    "Нет. Токеновая разметка — открытый машиночитаемый ресурс для NLP-анализа, исследований и учебных экспериментов.",
    "Нет. Выбранные данные разметки и машиночитаемые наборы паттернов и связей также подходят для NLP-анализа, учебных экспериментов и исследований. Повторное использование регулируется текущими условиями Metkagram."
  ]
]));

patch("en/roadmap/index.html", (html) => replaceAllKnown(html, [
  [
    "A public working plan for making annotated language practice clearer and more useful.",
    "A public working plan for a reviewed language-pattern system for learners, teachers and AI."
  ],
  [
    "English and German annotated sets, a public pattern catalogue, agent access and a clearer notation guide.",
    "Pattern Practice, Lens, Atlas, Map, Contrasts, Choice, Routes and Bridge; English/German learning content; a French Frame-only pilot; Thinking in Language; and agent-facing data surfaces."
  ],
  [
    "More curated reading sets, smoother paths from reading to recall, and better explanations for each tag.",
    "Deeper reviewed evidence: richer contrasts and choices, the next Thinking in Language layer, independent benchmark review, search measurement and selected French Bridges after language review."
  ],
  [
    "More languages and study formats, guided by the patterns learners return to most often.",
    "Additional learning languages and stronger teacher and agent integrations, added through explicit capability and review gates."
  ],
  ["Current release · July 2026", "Current release · August 2026"],
  [
    "New Metkagram identity, unified sentence notation, a clearer home page, shareable language collections, and a public static API with provenance for AI agents and developers.",
    "Added the Move–Frame–Bridge domain model, French Frame-only pilot, public retrieval benchmark, source-available rights layer and 40 Thinking in Language Frames across eight additive sets."
  ]
]));

patch("ru/roadmap/index.html", (html) => replaceAllKnown(html, [
  ["Публичный план развития проекта.", "Публичный план развития проверяемой системы языковых моделей для учащихся, преподавателей и ИИ."],
  [
    "Карточки с разметкой для английского и немецкого, публичный каталог паттернов, доступ для агентов и понятный справочник.",
    "Pattern Practice, Lens, Atlas, Map, Contrasts, Choice, Routes и Bridge; английский и немецкий учебный контент; французский Frame-only пилот; Thinking in Language и машиночитаемые поверхности для агентов."
  ],
  [
    "Больше материалов для чтения, удобный переход к повторению и ясные пояснения к обозначениям.",
    "Глубже проверять качество: развивать контрасты и Choice, следующий слой Thinking in Language, независимую проверку benchmark, измерение поиска и только затем отобранные французские Bridges."
  ],
  [
    "Новые языки и форматы — на основе того, что действительно помогает учиться.",
    "Новые языки обучения и более сильные интеграции для преподавателей и агентов — через явные capability и review gates."
  ],
  ["Текущий релиз · июль 2026", "Текущий релиз · август 2026"],
  [
    "Новый дизайн, единая разметка фраз, открытые подборки и статическое API с указанием происхождения данных.",
    "Добавлены доменная модель Move–Frame–Bridge, французский Frame-only пилот, публичный retrieval benchmark, актуальный слой прав и 40 Thinking in Language Frames в восьми дополнительных сетах."
  ]
]));

patch("en/support/index.html", (html) => html.replace(
  "We are looking for concrete research, teaching, EdTech and licensing pilots.</p>",
  "We are looking for concrete research, teaching, EdTech and licensing pilots, without inventing traction claims.</p>"
));

patch("ru/support/index.html", (html) => html.replace(
  "Нужны конкретные исследовательские, преподавательские, EdTech и лицензионные пилоты.</p>",
  "Нужны конкретные исследовательские, преподавательские, EdTech и лицензионные пилоты, без выдуманных заявлений об аудитории или результатах.</p>"
));

patch("en/apps/index.html", (html) => html
  .replace("<h1>The mobile stage is complete.</h1>", "<h1>The mobile app became a research stage.</h1>")
  .replace(
    '<p class="legal-inline-links"><a href="/en/practice/">Pattern Practice</a>',
    '<p class="legal-inline-links"><a href="/en/lens/">Pattern Lens</a><a href="/en/practice/">Pattern Practice</a>'
  ));

patch("ru/apps/index.html", (html) => html
  .replace("<h1>Мобильный этап завершён.</h1>", "<h1>Мобильное приложение стало этапом исследования.</h1>")
  .replace(
    '<p class="legal-inline-links"><a href="/ru/practice/">Речевые модели</a>',
    '<p class="legal-inline-links"><a href="/ru/lens/">Pattern Lens</a><a href="/ru/practice/">Речевые модели</a>'
  ));

console.log("Release copy contracts aligned with the current product direction.");
