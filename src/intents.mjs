export const intentTaxonomy = [
  {
    "id": "disagree-politely",
    "move": "Challenge",
    "title_en": "Disagree politely",
    "title_ru": "Вежливо не согласиться",
    "description_en": "Push back on a claim without turning the sentence into a confrontation.",
    "description_ru": "Возразить против утверждения, не превращая фразу в конфронтацию.",
    "queries_en": [
      "disagree politely",
      "push back",
      "challenge a claim",
      "question a claim"
    ],
    "queries_ru": [
      "вежливо не согласиться",
      "возразить",
      "оспорить утверждение"
    ],
    "signals_en": [
      "tactful",
      "soften disagreement",
      "push back",
      "too strong",
      "not fully supported",
      "confrontational",
      "respectfully challenge",
      "temper conclusion",
      "cooperative tone",
      "adversarial"
    ],
    "signals_ru": [
      "мягко",
      "вежливо",
      "возразить",
      "слишком уверенный",
      "слишком сильный вывод",
      "тактично",
      "без конфронтации"
    ],
    "pattern_priority": [
      "CLF058",
      "CLF055",
      "CLF066"
    ]
  },
  {
    "id": "question-an-assumption",
    "move": "Challenge",
    "title_en": "Question an assumption",
    "title_ru": "Поставить предположение под вопрос",
    "description_en": "Make the hidden assumption explicit and challenge whether it is justified.",
    "description_ru": "Сделать скрытое предположение явным и проверить, действительно ли оно обосновано.",
    "queries_en": [
      "question an assumption",
      "challenge an assumption",
      "hidden assumption"
    ],
    "queries_ru": [
      "оспорить предположение",
      "проверить предположение",
      "скрытое предположение"
    ],
    "signals_en": [
      "assumption",
      "premise",
      "assumes",
      "hidden assumption",
      "take for granted",
      "unstated premise",
      "guaranteed assumption"
    ],
    "signals_ru": [
      "предположение",
      "допущение",
      "скрытая предпосылка",
      "исходит из",
      "принимает как данность",
      "неявное допущение"
    ],
    "pattern_priority": [
      "CLF066",
      "CLF058",
      "CLF055"
    ]
  },
  {
    "id": "correct-an-assumption",
    "move": "Reframe",
    "title_en": "Correct an assumption",
    "title_ru": "Исправить предположение",
    "description_en": "Replace a mistaken interpretation with the distinction you actually want to make.",
    "description_ru": "Заменить ошибочную интерпретацию тем различием, которое вы действительно хотите провести.",
    "queries_en": [
      "correct an assumption",
      "reframe",
      "it is not that",
      "what I mean"
    ],
    "queries_ru": [
      "исправить предположение",
      "переопределить мысль",
      "уточнить что я имею в виду"
    ],
    "signals_en": [
      "real issue",
      "actual problem",
      "mistaken interpretation",
      "actually",
      "not the problem",
      "blame the wrong thing",
      "correction"
    ],
    "signals_ru": [
      "дело не в",
      "на самом деле",
      "реальная проблема",
      "неверная интерпретация",
      "ошибочно считают",
      "поправить трактовку"
    ],
    "pattern_priority": [
      "CLF061",
      "CLF062",
      "CLF050"
    ]
  },
  {
    "id": "clarify-what-you-mean",
    "move": "Reframe",
    "title_en": "Clarify what you really mean",
    "title_ru": "Уточнить, что вы действительно имеете в виду",
    "description_en": "Narrow or redirect an interpretation before continuing the argument.",
    "description_ru": "Сузить или перенаправить интерпретацию, прежде чем продолжать аргумент.",
    "queries_en": [
      "clarify what I mean",
      "restate",
      "reframe an idea",
      "not x but y"
    ],
    "queries_ru": [
      "уточнить мысль",
      "переформулировать",
      "не x а y"
    ],
    "signals_en": [
      "make clear",
      "clarify",
      "what I mean",
      "my concern",
      "do not mean",
      "restate",
      "redirect interpretation",
      "my point"
    ],
    "signals_ru": [
      "уточнить",
      "имею в виду",
      "я не против",
      "речь о",
      "прояснить",
      "моя мысль"
    ],
    "pattern_priority": [
      "CLF062",
      "CLF061",
      "CLF050"
    ]
  },
  {
    "id": "set-a-condition",
    "move": "Condition",
    "title_en": "Set a condition",
    "title_ru": "Задать условие",
    "description_en": "State what has to be true before a result, decision, or action can follow.",
    "description_ru": "Сказать, что должно быть выполнено до результата, решения или действия.",
    "queries_en": [
      "set a condition",
      "only if",
      "provided that",
      "condition for"
    ],
    "queries_ru": [
      "задать условие",
      "только если",
      "при условии что"
    ],
    "signals_en": [
      "only after",
      "only if",
      "provided that",
      "as long as",
      "condition",
      "may proceed",
      "proceed only",
      "once active"
    ],
    "signals_ru": [
      "только если",
      "только при",
      "при условии",
      "возможен только",
      "условие",
      "после того как"
    ],
    "pattern_priority": [
      "CLF044",
      "CLF045",
      "CLF043"
    ]
  },
  {
    "id": "state-a-prerequisite",
    "move": "Condition",
    "title_en": "State a prerequisite",
    "title_ru": "Назвать необходимое условие",
    "description_en": "Explain what must happen first or what is necessary before something else becomes possible.",
    "description_ru": "Объяснить, что должно произойти сначала или что необходимо для следующего шага.",
    "queries_en": [
      "prerequisite",
      "must happen first",
      "necessary condition",
      "without x cannot"
    ],
    "queries_ru": [
      "необходимое условие",
      "должно произойти сначала",
      "без x невозможно"
    ],
    "signals_en": [
      "before",
      "first",
      "prerequisite",
      "has to be clear",
      "must happen first",
      "need first",
      "cannot until"
    ],
    "signals_ru": [
      "сначала",
      "до того как",
      "необходимо сначала",
      "предварительно",
      "без этого нельзя",
      "прежде чем"
    ],
    "pattern_priority": [
      "CLF043",
      "CLF045",
      "CLF044"
    ]
  },
  {
    "id": "explain-a-cause",
    "move": "Cause",
    "title_en": "Explain a cause",
    "title_ru": "Объяснить причину",
    "description_en": "Connect an outcome to the factor that produced or enabled it.",
    "description_ru": "Связать результат с фактором, который его вызвал или сделал возможным.",
    "queries_en": [
      "explain a cause",
      "because of",
      "due to",
      "caused by"
    ],
    "queries_ru": [
      "объяснить причину",
      "из-за",
      "вызвано"
    ],
    "signals_en": [
      "came from",
      "caused by",
      "because of",
      "due to",
      "several factors",
      "resulted from",
      "produced by",
      "mix of",
      "combination of"
    ],
    "signals_ru": [
      "вызвано",
      "из-за",
      "причина",
      "сочетание факторов",
      "произошло из-за",
      "результат нескольких причин"
    ],
    "pattern_priority": [
      "CLF060",
      "CLF068",
      "CLF059"
    ]
  },
  {
    "id": "connect-cause-and-effect",
    "move": "Cause",
    "title_en": "Connect cause and effect",
    "title_ru": "Связать причину и следствие",
    "description_en": "Show how one factor changes what follows instead of merely listing two events.",
    "description_ru": "Показать, как один фактор меняет последствие, а не просто перечислить два события.",
    "queries_en": [
      "cause and effect",
      "leads to",
      "results in",
      "therefore because"
    ],
    "queries_ru": [
      "причина и следствие",
      "приводит к",
      "в результате"
    ],
    "signals_en": [
      "leads to",
      "then produces",
      "in turn",
      "causal chain",
      "results in",
      "downstream",
      "triggers"
    ],
    "signals_ru": [
      "приводит к",
      "затем",
      "цепочка",
      "в результате",
      "вызывает",
      "далее приводит"
    ],
    "pattern_priority": [
      "CLF059",
      "CLF068",
      "CLF060"
    ]
  },
  {
    "id": "draw-a-conclusion",
    "move": "Infer",
    "title_en": "Draw a conclusion",
    "title_ru": "Сделать вывод",
    "description_en": "Move from evidence or observations to a conclusion without presenting it as a raw fact.",
    "description_ru": "Перейти от наблюдений или данных к выводу, не выдавая его за исходный факт.",
    "queries_en": [
      "draw a conclusion",
      "infer",
      "this suggests",
      "therefore"
    ],
    "queries_ru": [
      "сделать вывод",
      "это указывает на",
      "следовательно"
    ],
    "signals_en": [
      "points to",
      "suggests",
      "conclusion",
      "infer",
      "does not prove",
      "evidence indicates",
      "cautious inference",
      "same direction"
    ],
    "signals_ru": [
      "сделать вывод",
      "указывает",
      "следовательно",
      "не доказывает",
      "из наблюдений",
      "осторожный вывод"
    ],
    "pattern_priority": [
      "CLF051",
      "CLF052",
      "CLF053"
    ]
  },
  {
    "id": "offer-a-likely-explanation",
    "move": "Infer",
    "title_en": "Offer a likely explanation",
    "title_ru": "Предложить вероятное объяснение",
    "description_en": "Present the best-supported interpretation while keeping the inference visible.",
    "description_ru": "Предложить наиболее обоснованную интерпретацию, сохраняя видимой её вероятностную природу.",
    "queries_en": [
      "likely explanation",
      "probably means",
      "best explanation",
      "suggests that"
    ],
    "queries_ru": [
      "вероятное объяснение",
      "скорее всего означает",
      "похоже что"
    ],
    "signals_en": [
      "most plausible",
      "most likely",
      "likely explanation",
      "best explanation",
      "probably",
      "fits the evidence best",
      "interpretation"
    ],
    "signals_ru": [
      "наиболее вероятное",
      "скорее всего",
      "похоже",
      "вероятное объяснение",
      "лучшая интерпретация"
    ],
    "pattern_priority": [
      "CLF053",
      "CLF052",
      "CLF051"
    ]
  },
  {
    "id": "compare-alternatives",
    "move": "Compare",
    "title_en": "Compare alternatives",
    "title_ru": "Сравнить альтернативы",
    "description_en": "Put two options on the same dimension so the contrast becomes useful for a decision.",
    "description_ru": "Поставить два варианта на одну шкалу, чтобы сравнение помогало принять решение.",
    "queries_en": [
      "compare alternatives",
      "compare options",
      "whereas",
      "compared with"
    ],
    "queries_ru": [
      "сравнить альтернативы",
      "сравнить варианты",
      "в отличие от"
    ],
    "signals_en": [
      "compare options",
      "compare alternatives",
      "same criterion",
      "two options",
      "side by side",
      "evaluate designs",
      "compare designs"
    ],
    "signals_ru": [
      "сопоставить",
      "два варианта",
      "по одному критерию",
      "сравнить варианты",
      "чтобы выбрать",
      "поставить рядом"
    ],
    "pattern_priority": [
      "CLF064",
      "CLF054",
      "CLF063"
    ]
  },
  {
    "id": "show-a-difference",
    "move": "Compare",
    "title_en": "Show a meaningful difference",
    "title_ru": "Показать существенное различие",
    "description_en": "Highlight the dimension on which two cases differ rather than saying only that they are different.",
    "description_ru": "Показать, по какому именно параметру различаются два случая.",
    "queries_en": [
      "show a difference",
      "contrast",
      "unlike",
      "difference between"
    ],
    "queries_ru": [
      "показать различие",
      "противопоставить",
      "разница между"
    ],
    "signals_en": [
      "contrast",
      "difference",
      "whereas",
      "unlike",
      "differ",
      "one favors",
      "other favors",
      "stand out"
    ],
    "signals_ru": [
      "показать отличие",
      "отличаются",
      "различие",
      "противопоставить",
      "в отличие",
      "один подход другой"
    ],
    "pattern_priority": [
      "CLF063",
      "CLF064",
      "CLF054"
    ]
  },
  {
    "id": "qualify-a-claim",
    "move": "Limit",
    "title_en": "Qualify a claim",
    "title_ru": "Ограничить утверждение",
    "description_en": "Make a statement more precise by showing where it applies and where it does not.",
    "description_ru": "Сделать утверждение точнее, показав границы его применимости.",
    "queries_en": [
      "qualify a claim",
      "limit a claim",
      "not always",
      "only to the extent"
    ],
    "queries_ru": [
      "ограничить утверждение",
      "уточнить границы",
      "не всегда"
    ],
    "signals_en": [
      "narrow the claim",
      "works for",
      "but not",
      "scope",
      "qualify",
      "not always",
      "generalized",
      "applies only"
    ],
    "signals_ru": [
      "ограничить утверждение",
      "верно для",
      "но не для",
      "границы применимости",
      "не всегда",
      "обобщать"
    ],
    "pattern_priority": [
      "CLF065",
      "CLF041",
      "CLF042"
    ]
  },
  {
    "id": "show-something-is-not-enough",
    "move": "Limit",
    "title_en": "Show that something is not enough",
    "title_ru": "Показать, что чего-то недостаточно",
    "description_en": "Separate what is necessary from what is sufficient for the result you care about.",
    "description_ru": "Разделить то, что необходимо, и то, чего действительно достаточно для результата.",
    "queries_en": [
      "not enough",
      "necessary but not sufficient",
      "insufficient",
      "alone is not enough"
    ],
    "queries_ru": [
      "недостаточно",
      "необходимо но недостаточно",
      "самого по себе мало"
    ],
    "signals_en": [
      "not enough",
      "cannot establish",
      "alone",
      "necessary but not sufficient",
      "one test",
      "insufficient",
      "by itself",
      "cannot justify"
    ],
    "signals_ru": [
      "недостаточно",
      "одного мало",
      "самого по себе",
      "не хватает",
      "необходимо но недостаточно",
      "одного совпадения"
    ],
    "pattern_priority": [
      "CLF041",
      "CLF042",
      "CLF065"
    ]
  },
  {
    "id": "choose-between-options",
    "move": "Decide",
    "title_en": "Choose between options",
    "title_ru": "Выбрать между вариантами",
    "description_en": "Frame alternatives so a decision follows from explicit criteria rather than preference alone.",
    "description_ru": "Сформулировать альтернативы так, чтобы решение опиралось на явные критерии, а не только на предпочтение.",
    "queries_en": [
      "choose between options",
      "decide between",
      "trade off",
      "best option"
    ],
    "queries_ru": [
      "выбрать между вариантами",
      "принять решение",
      "компромисс"
    ],
    "signals_en": [
      "decide between",
      "trade-off",
      "tradeoff",
      "choose between",
      "must pick",
      "pick either",
      "drive the choice",
      "best option"
    ],
    "signals_ru": [
      "выбрать между",
      "компромисс",
      "принять решение",
      "выбор",
      "либо",
      "критерий выбора"
    ],
    "pattern_priority": [
      "CLF046",
      "CLF047",
      "CLF049",
      "CLF048"
    ]
  },
  {
    "id": "state-a-decision",
    "move": "Decide",
    "title_en": "State a decision and rationale",
    "title_ru": "Сформулировать решение и основание",
    "description_en": "Say what you decided while keeping the reason or criterion visible.",
    "description_ru": "Сказать, какое решение принято, сохраняя видимым основание или критерий.",
    "queries_en": [
      "state a decision",
      "we decided",
      "decision because",
      "rationale"
    ],
    "queries_ru": [
      "сформулировать решение",
      "мы решили",
      "обоснование решения"
    ],
    "signals_en": [
      "we chose",
      "we decided",
      "already selected",
      "state the choice",
      "reason behind it",
      "rationale",
      "decision made"
    ],
    "signals_ru": [
      "принятое решение",
      "мы выбрали",
      "мы решили",
      "уже выбрали",
      "объяснить основание",
      "обоснование решения"
    ],
    "pattern_priority": [
      "CLF069",
      "CLF049",
      "CLF048",
      "CLF047",
      "CLF046"
    ]
  },
  {
    "id": "test-an-idea",
    "move": "Test",
    "title_en": "Test whether an idea holds",
    "title_ru": "Проверить, выдерживает ли идея проверку",
    "description_en": "Turn a claim into something that can be checked against a case, condition, or counterexample.",
    "description_ru": "Превратить утверждение в то, что можно проверить на примере, условии или контрпримере.",
    "queries_en": [
      "test an idea",
      "check whether",
      "does this hold",
      "counterexample"
    ],
    "queries_ru": [
      "проверить идею",
      "проверить ли это верно",
      "контрпример"
    ],
    "signals_en": [
      "if the hypothesis",
      "observable result",
      "expect",
      "testable prediction",
      "if true",
      "check hypothesis",
      "prediction",
      "visible if",
      "claim were correct"
    ],
    "signals_ru": [
      "гипотеза",
      "проверяемое предсказание",
      "если верно",
      "ожидаемый результат",
      "проверить идею",
      "что увидим"
    ],
    "pattern_priority": [
      "CLF056",
      "CLF067",
      "CLF057"
    ]
  },
  {
    "id": "ask-what-would-change-the-conclusion",
    "move": "Test",
    "title_en": "Ask what would change the conclusion",
    "title_ru": "Спросить, что изменило бы вывод",
    "description_en": "Identify the evidence or condition that would make you revise the current conclusion.",
    "description_ru": "Определить данные или условие, при которых текущий вывод пришлось бы пересмотреть.",
    "queries_en": [
      "what would change the conclusion",
      "what evidence would change",
      "falsify",
      "under what condition"
    ],
    "queries_ru": [
      "что изменило бы вывод",
      "какие данные изменят мнение",
      "при каком условии"
    ],
    "signals_en": [
      "what evidence",
      "revise conclusion",
      "change my mind",
      "what would change",
      "reconsider",
      "force us to reconsider",
      "falsify"
    ],
    "signals_ru": [
      "что изменит вывод",
      "при каких данных",
      "пересмотреть вывод",
      "изменить мнение",
      "что заставит пересмотреть",
      "опровергнуть"
    ],
    "pattern_priority": [
      "CLF070",
      "CLF057",
      "CLF067",
      "CLF056"
    ]
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
    ...(intent.queries_ru || []),
    ...(intent.signals_en || []),
    ...(intent.signals_ru || [])
  ].join(" ").toLowerCase();
}
