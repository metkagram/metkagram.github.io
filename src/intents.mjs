export const intentTaxonomy = [
  {
    id: "disagree-politely",
    move: "Challenge",
    title_en: "Disagree politely",
    title_ru: "Вежливо не согласиться",
    description_en: "Push back on a claim without turning the sentence into a confrontation.",
    description_ru: "Возразить против утверждения, не превращая фразу в конфронтацию.",
    queries_en: ["disagree politely", "push back", "challenge a claim", "question a claim"],
    queries_ru: ["вежливо не согласиться", "возразить", "оспорить утверждение"]
  },
  {
    id: "question-an-assumption",
    move: "Challenge",
    title_en: "Question an assumption",
    title_ru: "Поставить предположение под вопрос",
    description_en: "Make the hidden assumption explicit and challenge whether it is justified.",
    description_ru: "Сделать скрытое предположение явным и проверить, действительно ли оно обосновано.",
    queries_en: ["question an assumption", "challenge an assumption", "hidden assumption"],
    queries_ru: ["оспорить предположение", "проверить предположение", "скрытое предположение"]
  },
  {
    id: "correct-an-assumption",
    move: "Reframe",
    title_en: "Correct an assumption",
    title_ru: "Исправить предположение",
    description_en: "Replace a mistaken interpretation with the distinction you actually want to make.",
    description_ru: "Заменить ошибочную интерпретацию тем различием, которое вы действительно хотите провести.",
    queries_en: ["correct an assumption", "reframe", "it is not that", "what I mean"],
    queries_ru: ["исправить предположение", "переопределить мысль", "уточнить что я имею в виду"]
  },
  {
    id: "clarify-what-you-mean",
    move: "Reframe",
    title_en: "Clarify what you really mean",
    title_ru: "Уточнить, что вы действительно имеете в виду",
    description_en: "Narrow or redirect an interpretation before continuing the argument.",
    description_ru: "Сузить или перенаправить интерпретацию, прежде чем продолжать аргумент.",
    queries_en: ["clarify what I mean", "restate", "reframe an idea", "not x but y"],
    queries_ru: ["уточнить мысль", "переформулировать", "не x а y"]
  },
  {
    id: "set-a-condition",
    move: "Condition",
    title_en: "Set a condition",
    title_ru: "Задать условие",
    description_en: "State what has to be true before a result, decision, or action can follow.",
    description_ru: "Сказать, что должно быть выполнено до результата, решения или действия.",
    queries_en: ["set a condition", "only if", "provided that", "condition for"],
    queries_ru: ["задать условие", "только если", "при условии что"]
  },
  {
    id: "state-a-prerequisite",
    move: "Condition",
    title_en: "State a prerequisite",
    title_ru: "Назвать необходимое условие",
    description_en: "Explain what must happen first or what is necessary before something else becomes possible.",
    description_ru: "Объяснить, что должно произойти сначала или что необходимо для следующего шага.",
    queries_en: ["prerequisite", "must happen first", "necessary condition", "without x cannot"],
    queries_ru: ["необходимое условие", "должно произойти сначала", "без x невозможно"]
  },
  {
    id: "explain-a-cause",
    move: "Cause",
    title_en: "Explain a cause",
    title_ru: "Объяснить причину",
    description_en: "Connect an outcome to the factor that produced or enabled it.",
    description_ru: "Связать результат с фактором, который его вызвал или сделал возможным.",
    queries_en: ["explain a cause", "because of", "due to", "caused by"],
    queries_ru: ["объяснить причину", "из-за", "вызвано"]
  },
  {
    id: "connect-cause-and-effect",
    move: "Cause",
    title_en: "Connect cause and effect",
    title_ru: "Связать причину и следствие",
    description_en: "Show how one factor changes what follows instead of merely listing two events.",
    description_ru: "Показать, как один фактор меняет последствие, а не просто перечислить два события.",
    queries_en: ["cause and effect", "leads to", "results in", "therefore because"],
    queries_ru: ["причина и следствие", "приводит к", "в результате"]
  },
  {
    id: "draw-a-conclusion",
    move: "Infer",
    title_en: "Draw a conclusion",
    title_ru: "Сделать вывод",
    description_en: "Move from evidence or observations to a conclusion without presenting it as a raw fact.",
    description_ru: "Перейти от наблюдений или данных к выводу, не выдавая его за исходный факт.",
    queries_en: ["draw a conclusion", "infer", "this suggests", "therefore"],
    queries_ru: ["сделать вывод", "это указывает на", "следовательно"]
  },
  {
    id: "offer-a-likely-explanation",
    move: "Infer",
    title_en: "Offer a likely explanation",
    title_ru: "Предложить вероятное объяснение",
    description_en: "Present the best-supported interpretation while keeping the inference visible.",
    description_ru: "Предложить наиболее обоснованную интерпретацию, сохраняя видимой её вероятностную природу.",
    queries_en: ["likely explanation", "probably means", "best explanation", "suggests that"],
    queries_ru: ["вероятное объяснение", "скорее всего означает", "похоже что"]
  },
  {
    id: "compare-alternatives",
    move: "Compare",
    title_en: "Compare alternatives",
    title_ru: "Сравнить альтернативы",
    description_en: "Put two options on the same dimension so the contrast becomes useful for a decision.",
    description_ru: "Поставить два варианта на одну шкалу, чтобы сравнение помогало принять решение.",
    queries_en: ["compare alternatives", "compare options", "whereas", "compared with"],
    queries_ru: ["сравнить альтернативы", "сравнить варианты", "в отличие от"]
  },
  {
    id: "show-a-difference",
    move: "Compare",
    title_en: "Show a meaningful difference",
    title_ru: "Показать существенное различие",
    description_en: "Highlight the dimension on which two cases differ rather than saying only that they are different.",
    description_ru: "Показать, по какому именно параметру различаются два случая.",
    queries_en: ["show a difference", "contrast", "unlike", "difference between"],
    queries_ru: ["показать различие", "противопоставить", "разница между"]
  },
  {
    id: "qualify-a-claim",
    move: "Limit",
    title_en: "Qualify a claim",
    title_ru: "Ограничить утверждение",
    description_en: "Make a statement more precise by showing where it applies and where it does not.",
    description_ru: "Сделать утверждение точнее, показав границы его применимости.",
    queries_en: ["qualify a claim", "limit a claim", "not always", "only to the extent"],
    queries_ru: ["ограничить утверждение", "уточнить границы", "не всегда"]
  },
  {
    id: "show-something-is-not-enough",
    move: "Limit",
    title_en: "Show that something is not enough",
    title_ru: "Показать, что чего-то недостаточно",
    description_en: "Separate what is necessary from what is sufficient for the result you care about.",
    description_ru: "Разделить то, что необходимо, и то, чего действительно достаточно для результата.",
    queries_en: ["not enough", "necessary but not sufficient", "insufficient", "alone is not enough"],
    queries_ru: ["недостаточно", "необходимо но недостаточно", "самого по себе мало"]
  },
  {
    id: "choose-between-options",
    move: "Decide",
    title_en: "Choose between options",
    title_ru: "Выбрать между вариантами",
    description_en: "Frame alternatives so a decision follows from explicit criteria rather than preference alone.",
    description_ru: "Сформулировать альтернативы так, чтобы решение опиралось на явные критерии, а не только на предпочтение.",
    queries_en: ["choose between options", "decide between", "trade off", "best option"],
    queries_ru: ["выбрать между вариантами", "принять решение", "компромисс"]
  },
  {
    id: "state-a-decision",
    move: "Decide",
    title_en: "State a decision and rationale",
    title_ru: "Сформулировать решение и основание",
    description_en: "Say what you decided while keeping the reason or criterion visible.",
    description_ru: "Сказать, какое решение принято, сохраняя видимым основание или критерий.",
    queries_en: ["state a decision", "we decided", "decision because", "rationale"],
    queries_ru: ["сформулировать решение", "мы решили", "обоснование решения"]
  },
  {
    id: "test-an-idea",
    move: "Test",
    title_en: "Test whether an idea holds",
    title_ru: "Проверить, выдерживает ли идея проверку",
    description_en: "Turn a claim into something that can be checked against a case, condition, or counterexample.",
    description_ru: "Превратить утверждение в то, что можно проверить на примере, условии или контрпримере.",
    queries_en: ["test an idea", "check whether", "does this hold", "counterexample"],
    queries_ru: ["проверить идею", "проверить ли это верно", "контрпример"]
  },
  {
    id: "ask-what-would-change-the-conclusion",
    move: "Test",
    title_en: "Ask what would change the conclusion",
    title_ru: "Спросить, что изменило бы вывод",
    description_en: "Identify the evidence or condition that would make you revise the current conclusion.",
    description_ru: "Определить данные или условие, при которых текущий вывод пришлось бы пересмотреть.",
    queries_en: ["what would change the conclusion", "what evidence would change", "falsify", "under what condition"],
    queries_ru: ["что изменило бы вывод", "какие данные изменят мнение", "при каком условии"]
  }
];

export const intentById = new Map(intentTaxonomy.map((intent) => [intent.id, intent]));

export function intentsForMove(move) {
  return intentTaxonomy.filter((intent) => intent.move === move);
}

export function intentSearchText(intent) {
  return [
    intent.id,
    intent.move,
    intent.title_en,
    intent.title_ru,
    intent.description_en,
    intent.description_ru,
    ...(intent.queries_en || []),
    ...(intent.queries_ru || [])
  ].join(" ").toLowerCase();
}
