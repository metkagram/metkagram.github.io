import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { patternPath, studySetPath, studySetSlug } from "../src/seo-slugs.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const COHORT_ID = "authority-wave-1-2026-09-12";
const LOCALES = ["en", "ru"];
const CURATED_LIMIT = 6;

const COHORT = [
  {
    id: "HED",
    h1_en: "Hedging and qualifying claims in English",
    h1_ru: "Как смягчать и уточнять утверждения на английском",
    when_en: "Use these Frames when evidence is incomplete, a conclusion is provisional, or you need to lower commitment without becoming vague.",
    when_ru: "Используйте эти модели, когда данных пока недостаточно, вывод предварительный или нужно снизить категоричность, не становясь расплывчатым.",
    nearby_en: "If the main problem is your position, compare Opinions and stance. If it is likelihood, compare Probability and prediction.",
    nearby_ru: "Если задача прежде всего в выражении позиции, сравните Opinions and stance. Если речь о вероятности, перейдите к Probability and prediction.",
    nearby: ["OPI", "PRB"]
  },
  {
    id: "ARG",
    h1_en: "Build an argument and test its assumptions",
    h1_ru: "Как строить аргумент и проверять его предпосылки",
    when_en: "Use these Frames when you need to show what a case depends on, connect reasons to a conclusion, or make a hidden assumption visible.",
    when_ru: "Используйте эти модели, когда нужно показать, на чём держится аргумент, связать причины с выводом или сделать скрытую предпосылку явной.",
    nearby_en: "Move to Evidence and inference when the difficult part is support for the claim; move to Cause and effect when the difficult part is the mechanism.",
    nearby_ru: "Переходите к Evidence and inference, если проблема в подтверждении тезиса, и к Cause and effect, если нужно объяснить механизм.",
    nearby: ["EVD", "CAU"]
  },
  {
    id: "PRO",
    h1_en: "Professional English for meetings and work",
    h1_ru: "Профессиональный английский для встреч и работы",
    when_en: "Use these Frames to clarify impact, ownership, status and next steps without burying the action inside a long update.",
    when_ru: "Используйте эти модели, чтобы ясно обозначать влияние, ответственного, статус и следующий шаг, не пряча действие внутри длинного апдейта.",
    nearby_en: "Use Organization and sequencing for structure, Workplace questions for coordination, and Clarification when the message itself is unclear.",
    nearby_ru: "Для структуры используйте Organization and sequencing, для координации — Workplace questions, для неясного сообщения — Clarification.",
    nearby: ["ORG", "QWRK", "CLR"]
  },
  {
    id: "AGR",
    h1_en: "Agree and disagree without derailing the discussion",
    h1_ru: "Как соглашаться и возражать, не ломая разговор",
    when_en: "Use these Frames to acknowledge another view, mark the exact point of agreement, and isolate the part you challenge.",
    when_ru: "Используйте эти модели, чтобы признать чужую позицию, точно обозначить согласие и отделить конкретный пункт, с которым вы спорите.",
    nearby_en: "Use Clarification when the disagreement may be caused by different meanings; use Tact and diplomacy when social friction matters more than the argument itself.",
    nearby_ru: "Используйте Clarification, если спор может быть вызван разным пониманием, и Tact and diplomacy, если важнее снизить социальное напряжение.",
    nearby: ["CLR", "TCT"]
  },
  {
    id: "CLR",
    h1_en: "Clarify and reformulate what you mean",
    h1_ru: "Как уточнять и переформулировать мысль",
    when_en: "Use these Frames to repair an unclear message, restate the key point, or check that two people mean the same thing.",
    when_ru: "Используйте эти модели, чтобы исправить неясную формулировку, перефразировать ключевую мысль или проверить, одинаково ли собеседники понимают сказанное.",
    nearby_en: "Use Agreement and disagreement when the meaning is clear but positions differ; use Clarification questions when you need the other person to supply the missing detail.",
    nearby_ru: "Используйте Agreement and disagreement, когда смысл ясен, но позиции различаются; Clarification questions — когда недостающую деталь должен дать собеседник.",
    nearby: ["AGR", "QCL"]
  },
  {
    id: "CMP",
    h1_en: "Compare options and explain trade-offs",
    h1_ru: "Как сравнивать варианты и объяснять компромиссы",
    when_en: "Use these Frames when two options need explicit criteria rather than a vague better-or-worse judgement.",
    when_ru: "Используйте эти модели, когда два варианта нужно сравнить по явным критериям, а не по расплывчатому «лучше или хуже».",
    nearby_en: "Use Decision language when comparison must end in a choice; use Priorities and trade-offs when the core problem is what to protect or sacrifice.",
    nearby_ru: "Используйте Decision language, когда сравнение должно привести к выбору, и Priorities and trade-offs, когда главное — что сохранить, а чем пожертвовать.",
    nearby: ["DEC", "PRI"]
  },
  {
    id: "CAU",
    h1_en: "Explain causes, effects and consequences",
    h1_ru: "Как объяснять причины, эффекты и последствия",
    when_en: "Use these Frames when you need to distinguish a trigger from a mechanism and explain what follows from it.",
    when_ru: "Используйте эти модели, когда нужно отделить триггер от механизма и показать, какие последствия из него следуют.",
    nearby_en: "Use Cause diagnosis when you are still locating the root cause; use Evidence and inference when the causal claim itself needs support.",
    nearby_ru: "Используйте Cause diagnosis, пока ищете корневую причину, и Evidence and inference, когда нужно подтвердить сам причинный вывод.",
    nearby: ["CDG", "EVD"]
  },
  {
    id: "CND",
    h1_en: "Reason about conditions and alternatives",
    h1_ru: "Как рассуждать об условиях и альтернативах",
    when_en: "Use these Frames to make dependencies explicit: what changes if a condition holds, fails, or turns out differently.",
    when_ru: "Используйте эти модели, чтобы сделать зависимости явными: что изменится, если условие выполнится, не выполнится или окажется другим.",
    nearby_en: "Use Hypothesis testing when the condition is an empirical claim to test; use Decision language when alternatives must lead to a choice.",
    nearby_ru: "Используйте Hypothesis testing, если условие нужно проверить на данных, и Decision language, если альтернативы должны привести к выбору.",
    nearby: ["HYP", "DEC"]
  },
  {
    id: "RQT",
    h1_en: "Make clear requests and follow through",
    h1_ru: "Как формулировать ясные просьбы и доводить их до действия",
    when_en: "Use these Frames when another person needs to know exactly what action, information or response you need next.",
    when_ru: "Используйте эти модели, когда собеседнику нужно точно понять, какое действие, информация или ответ требуются дальше.",
    nearby_en: "Use Polite request questions when the request is naturally phrased as a question; use Tact and diplomacy when face-saving matters most.",
    nearby_ru: "Используйте Polite request questions, когда просьба естественно звучит как вопрос, и Tact and diplomacy, когда важнее всего сохранить такт.",
    nearby: ["QPOL", "TCT"]
  },
  {
    id: "NEG",
    h1_en: "Negotiate proposals, trade-offs and commitments",
    h1_ru: "Как обсуждать предложения, компромиссы и обязательства",
    when_en: "Use these Frames to put an offer on the table, test room for movement, trade one condition for another, and close with a workable commitment.",
    when_ru: "Используйте эти модели, чтобы выдвинуть предложение, проверить пространство для уступок, обменять одно условие на другое и завершить разговор рабочим обязательством.",
    nearby_en: "Use Negotiation questions to open room before stating a position; use Priorities and trade-offs to make the protected constraint explicit.",
    nearby_ru: "Используйте Negotiation questions, чтобы сначала открыть пространство для манёвра, и Priorities and trade-offs, чтобы явно обозначить защищаемое ограничение.",
    nearby: ["QNGT", "PRI"]
  },
  {
    id: "EVD",
    h1_en: "Connect claims to evidence without overclaiming",
    h1_ru: "Как связывать утверждения с данными без лишней уверенности",
    when_en: "Use these Frames when a claim must be anchored to observations, sources or inference while keeping the strength of the conclusion proportional to the evidence.",
    when_ru: "Используйте эти модели, когда вывод нужно привязать к наблюдениям, источникам или логическому выводу и не сделать его сильнее, чем позволяют данные.",
    nearby_en: "Use Argumentation for the whole line of reasoning; use Hedging when the main job is calibrating commitment rather than presenting evidence.",
    nearby_ru: "Используйте Argumentation для всей линии рассуждения, а Hedging — когда главная задача в калибровке уверенности, а не в предъявлении данных.",
    nearby: ["ARG", "HED"]
  },
  {
    id: "UNC",
    h1_en: "Speak about uncertainty, evidence and confidence",
    h1_ru: "Как говорить о неопределённости, данных и уверенности",
    when_en: "Use these Frames when you need to separate what is known, assumed and still uncertain before recommending a next step.",
    when_ru: "Используйте эти модели, когда нужно отделить известное от предположений и неопределённости до рекомендации следующего шага.",
    nearby_en: "Use Hedging to soften or qualify one claim; use Probability and prediction when the question is specifically how likely an outcome is.",
    nearby_ru: "Используйте Hedging для смягчения отдельного утверждения, а Probability and prediction — когда вопрос именно в вероятности результата.",
    nearby: ["HED", "PRB"]
  },
  {
    id: "FRM",
    h1_en: "Frame the problem before proposing a solution",
    h1_ru: "Как сформулировать проблему до предложения решения",
    when_en: "Use these Frames before solution mode: define what is actually wrong, narrow the boundary, and separate the symptom from the problem worth solving.",
    when_ru: "Используйте эти модели до перехода к решениям: определите, что именно не работает, сузьте границы и отделите симптом от проблемы, которую стоит решать.",
    nearby_en: "Use Solutions when the problem is already stable; use Cause questions when the next job is to investigate why it happens.",
    nearby_ru: "Используйте Solutions, когда проблема уже определена, и Cause questions, когда следующий шаг — выяснить, почему она возникает.",
    nearby: ["SOL", "QCAU"]
  },
  {
    id: "DEC",
    h1_en: "Make decisions and explain the trade-off",
    h1_ru: "Как принимать решение и объяснять компромисс",
    when_en: "Use these Frames when options are understood and you need to state the decision rule, threshold, cost of delay or reason for choosing one route.",
    when_ru: "Используйте эти модели, когда варианты уже понятны и нужно обозначить правило решения, порог, цену задержки или причину выбора одного пути.",
    nearby_en: "Use Negotiation when the choice depends on another party; use Priorities and trade-offs when the decision is still about ranking constraints.",
    nearby_ru: "Используйте Negotiation, когда выбор зависит от другой стороны, и Priorities and trade-offs, когда решение всё ещё сводится к ранжированию ограничений.",
    nearby: ["NEG", "PRI"]
  },
  {
    id: "HYP",
    h1_en: "State, test and revise a hypothesis",
    h1_ru: "Как формулировать, проверять и пересматривать гипотезу",
    when_en: "Use these Frames when an explanation is provisional and you need a prediction, discriminating evidence, or a clear reason to revise the claim.",
    when_ru: "Используйте эти модели, когда объяснение предварительное и нужны предсказание, различающие данные или ясное основание пересмотреть гипотезу.",
    nearby_en: "Use Evidence and inference to weigh the observations themselves; use Hypothetical questions when you are exploring a scenario rather than testing a claim.",
    nearby_ru: "Используйте Evidence and inference для оценки самих наблюдений, а Hypothetical questions — когда исследуете сценарий, а не проверяете утверждение.",
    nearby: ["EVD", "QHYP"]
  }
];

function read(relative) {
  return fs.readFileSync(path.join(DIST, relative), "utf8");
}

function write(relative, value) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function readJson(relative) {
  return JSON.parse(read(relative));
}

function writeJson(relative, value) {
  write(relative, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value = "") {
  return String(value).replaceAll("**", "").replaceAll(/\s+/g, " ").trim();
}

function languageRecord(pattern, lang) {
  return pattern.langs?.find((item) => item.lang === lang) || null;
}

function frameSignature(pattern) {
  const formula = clean(languageRecord(pattern, "en")?.formula || pattern.id).toLowerCase();
  return formula
    .replaceAll(/\[[^\]]*\]/g, "[slot]")
    .replaceAll(/[“”‘’]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function selectDistinctFrames(patterns) {
  const selected = [];
  const seen = new Set();
  for (const pattern of patterns.filter((item) => item.quality?.indexable)) {
    const signature = frameSignature(pattern);
    if (seen.has(signature)) continue;
    seen.add(signature);
    selected.push(pattern);
    if (selected.length >= CURATED_LIMIT) break;
  }
  return selected;
}

function localized(locale, config, key) {
  return config[`${key}_${locale}`];
}

function curatedFrames(locale, patterns) {
  const ru = locale === "ru";
  return patterns.map((pattern, index) => {
    const en = languageRecord(pattern, "en");
    const de = languageRecord(pattern, "de");
    const heading = ru ? pattern.title_ru || en?.formula || pattern.id : en?.formula || pattern.id;
    const translation = en?.translation || en?.translation_ru || "";
    const secondary = ru
      ? [en?.formula ? `EN: ${clean(en.formula)}` : "", translation ? `RU: ${clean(translation)}` : ""].filter(Boolean).join(" · ")
      : de?.formula ? `German parallel: ${clean(de.formula)}` : "";
    return `<a data-curated-pattern="${escapeHtml(pattern.id)}" href="${patternPath(locale, pattern)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(heading)}</strong><small>${escapeHtml(clean(en?.example || secondary))}</small>${secondary ? `<small>${escapeHtml(secondary)}</small>` : ""}</span><span aria-hidden="true">↗</span></a>`;
  }).join("");
}

function nearbyLinks(locale, config, setById) {
  const ru = locale === "ru";
  return config.nearby.map((id, index) => {
    const set = setById.get(id);
    if (!set) throw new Error(`Authority cohort ${config.id} references missing nearby set ${id}.`);
    return `<a href="${studySetPath(locale, set)}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(ru ? set.title_ru : set.title_en)}</strong><small>${escapeHtml(ru ? set.description_ru || set.description : set.description)}</small></span><span aria-hidden="true">↗</span></a>`;
  }).join("");
}

function firstRelations(selected, relationIndex) {
  const contrasts = new Map();
  const drills = new Map();
  const packs = new Map();
  for (const pattern of selected) {
    const relations = relationIndex.byPattern?.[pattern.id];
    for (const item of relations?.contrasts || []) contrasts.set(item.id, item);
    for (const item of relations?.drills || []) drills.set(item.id, item);
    for (const item of relations?.packs || []) packs.set(item.id, item);
  }
  return {
    contrast: [...contrasts.values()][0] || null,
    drill: [...drills.values()][0] || null,
    pack: [...packs.values()][0] || null,
  };
}

function continuation(locale, selected, relationIndex) {
  const ru = locale === "ru";
  const relations = firstRelations(selected, relationIndex);
  const links = [
    {
      href: `/${locale}/lens/`,
      title: "Pattern Lens",
      detail: ru ? "Разберите новую фразу и найдите подходящие канонические паттерны." : "Inspect a new sentence and resolve it to canonical Metkagram patterns."
    }
  ];
  if (relations.contrast) links.push({
    href: `/${locale}/contrasts/${relations.contrast.id}/`,
    title: ru ? relations.contrast.title_ru : relations.contrast.title_en,
    detail: ru ? "Проверенное различие между близкими моделями." : "A reviewed distinction between nearby Frames."
  });
  if (relations.drill) links.push({
    href: `/${locale}/clinic/#${relations.drill.id}`,
    title: ru ? relations.drill.scenario_ru : relations.drill.scenario_en,
    detail: ru ? "Сначала выберите модель, затем откройте объяснение." : "Choose the better Frame first, then reveal the explanation."
  });
  if (relations.pack) links.push({
    href: `/${locale}/packs/${relations.pack.id}/`,
    title: ru ? relations.pack.title_ru : relations.pack.title_en,
    detail: ru ? relations.pack.description_ru : relations.pack.description_en
  });
  return links.map((item, index) => `<a href="${item.href}"><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><span aria-hidden="true">↗</span></a>`).join("");
}

function authorityLayer(locale, config, set, selected, relationIndex, setById) {
  const ru = locale === "ru";
  const h1 = localized(locale, config, "h1");
  const when = localized(locale, config, "when");
  const nearby = localized(locale, config, "nearby");
  const setJob = ru ? set.description_ru || set.description : set.description;
  return `<section id="study-set-authority" data-study-set-authority="${COHORT_ID}" class="page-head section-pad compact ruled"><p class="eyebrow">${ru ? "Задача ученика" : "Learner job"} · ${escapeHtml(set.id)}</p><h2>${escapeHtml(setJob)}</h2><p>${escapeHtml(when)}</p></section>
<section id="curated-core-frames" class="page-head section-pad compact ruled"><p class="eyebrow">01 · ${ru ? "Разные модели" : "Distinct core Frames"}</p><h2>${ru ? "Сначала выучите разные речевые ходы" : "Start with genuinely different ways to do the job"}</h2><p>${ru ? `Ниже — ${selected.length} канонических индексируемых моделей после удаления контекстных дублей по структуре формулы.` : `${selected.length} canonical indexable Frames, deduplicated by reusable formula structure rather than contextual noun substitution.`}</p></section><section class="document-index section-pad" data-curated-frame-list>${curatedFrames(locale, selected)}</section>
<section id="when-to-use" class="page-head section-pad compact ruled"><p class="eyebrow">02 · ${ru ? "Когда использовать" : "When to use"}</p><h2>${ru ? "Не путайте соседние речевые задачи" : "Choose the job before the wording"}</h2><p>${escapeHtml(nearby)}</p></section><section class="document-index section-pad" data-nearby-set-list>${nearbyLinks(locale, config, setById)}</section>
<section id="active-retrieval" class="page-head section-pad compact ruled"><p class="eyebrow">03 · ${ru ? "Активное извлечение" : "Active retrieval"}</p><h2>${ru ? "Скажите фразу до того, как откроете ответ" : "Produce one sentence before you reveal a model"}</h2><p>${ru ? `Сформулируйте одну фразу для задачи «${escapeHtml(setJob)}». Затем откройте одну из моделей выше, сравните речевой ход и перепишите свою фразу для другого контекста.` : `Say or write one sentence for this job: “${escapeHtml(setJob)}” Then open one Frame above, compare the language move, and rewrite your sentence for a different context.`}</p></section>
<section id="reviewed-continuation" class="page-head section-pad compact ruled"><p class="eyebrow">04 · ${ru ? "Продолжить" : "Continue with reviewed relations"}</p><h2>${ru ? "От модели к различию, выбору и новой фразе" : "Move from a Frame to a distinction, choice or new sentence"}</h2><p>${ru ? "Показываются только уже опубликованные связи. Отсутствующая связь не выводится и не придумывается." : "Only already-published relations are shown. Missing relations are not inferred or invented."}</p></section><section class="document-index section-pad" data-reviewed-continuation>${continuation(locale, selected, relationIndex)}</section>`;
}

function patchPage(locale, config, set, selected, relationIndex, setById) {
  const relative = `${locale}/practice/sets/${studySetSlug(set)}/index.html`;
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing authoritative study-set page ${relative}.`);
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes('id="practice-set-guide"')) throw new Error(`Missing practice-set guide marker in ${relative}.`);
  if (html.includes("data-study-set-authority")) throw new Error(`Authority layer already present in ${relative}.`);
  const h1 = localized(locale, config, "h1");
  html = html.replace(/<h1>[^<]*<\/h1>/, `<h1>${escapeHtml(h1)}</h1>`);
  const marker = '<section id="practice-set-guide"';
  html = html.replace(marker, `${authorityLayer(locale, config, set, selected, relationIndex, setById)}\n${marker}`);
  fs.writeFileSync(file, html);
}

const content = loadContent();
const setById = new Map(content.studySets.sets.map((set) => [set.id, set]));
const patterns = readJson("data/advanced-patterns.json");
const relationIndex = readJson("data/pattern-relations.json");
const records = [];

for (const config of COHORT) {
  const set = setById.get(config.id);
  if (!set) throw new Error(`Authority cohort references missing set ${config.id}.`);
  const setPatterns = patterns.filter((pattern) => pattern.set_id === config.id);
  const selected = selectDistinctFrames(setPatterns);
  if (!selected.length) throw new Error(`Authority cohort ${config.id} has no finalized indexable Frames.`);
  for (const locale of LOCALES) patchPage(locale, config, set, selected, relationIndex, setById);
  records.push({
    setId: config.id,
    canonicalRoutes: Object.fromEntries(LOCALES.map((locale) => [locale, studySetPath(locale, set)])),
    h1: { en: config.h1_en, ru: config.h1_ru },
    curatedPatternIds: selected.map((pattern) => pattern.id),
    frameSignatures: selected.map(frameSignature),
    indexablePatternCount: setPatterns.filter((pattern) => pattern.quality?.indexable).length,
    totalPatternCount: setPatterns.length,
  });
}

writeJson("data/study-set-authority.json", {
  schemaVersion: 1,
  cohortId: COHORT_ID,
  editorialDate: "2026-09-12",
  releaseDate: SITE_RELEASE_DATE,
  status: "editorial-priority-cohort",
  searchEvidence: {
    state: "unobserved",
    source: "Google Search Console",
    note: "This cohort is an editorial intervention. Search demand and ranking impact require later owner-side evidence and are not inferred from publication."
  },
  selectionPolicy: {
    canonicalUrlsPreserved: true,
    fullInventoryPreserved: true,
    finalizedIndexablePatternsOnly: true,
    contextualFormulaVariantsDeduplicated: true,
    relationLinksRequirePublishedRelations: true,
  },
  cohortSize: records.length,
  records,
});

console.log(`Study-set authority: ${records.length} canonical sets upgraded in ${COHORT_ID}.`);
