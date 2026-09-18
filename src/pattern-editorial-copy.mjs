const SYNTHETIC_DESCRIPTION = /^Речевая задача:/u;
const SYNTHETIC_ID = /^(C1|FUN|QST)/u;
const FIXED_CONTEXT_RU = "команде нужен ещё день для решения";

const SLOT_NAMES = ["X", "Y", "Z", "A", "B"];

const C1_RU_TITLES = {
  AGR: "У … есть сильные стороны, хотя я расставил(а) бы акценты иначе",
  ARG: "Аргумент в пользу … основан на предположении, что …",
  CAU: "Если упустить …, последствия становится сложнее контролировать",
  CLR: "Если точнее сформулировать …, вопрос сводится к приоритетам",
  CMP: "По сравнению с альтернативой … предлагает более устойчивое решение",
  CND: "Если бы … рассмотрели раньше, задержки, возможно, удалось бы избежать",
  DGR: "… не только тщательно подготовили, но и ясно представили",
  EVD: "Имеющиеся данные указывают на … как на значимый фактор",
  HED: "Было бы преждевременно делать окончательный вывод о …",
  LNK: "Тем не менее … следует рассматривать в более широком контексте",
  MOD: "Чтобы … удалось реализовать, всем нужно понимать ограничения",
  NEG: "Можем ли мы взять … за основу рабочего компромисса?",
  OPI: "После тщательного рассмотрения я считаю, что … заслуживает большего внимания",
  PRB: "Есть реальная вероятность, что … изменит результат",
  PRO: "Я пишу, чтобы пояснить, как … влияет на следующие шаги",
  PSV: "… рассматривается до объявления решения",
  QNN: "Что могло бы помешать справедливому внедрению …?",
  REP: "Она подчеркнула, что … нельзя рассматривать как изолированную проблему",
  STO: "Оглядываясь назад, именно с … ситуация начала меняться",
  TAS: "Мы отслеживаем … с момента появления первых тревожных сигналов"
};

const RU_TITLE_OVERRIDES = {
  GFB019: "Предостережение: лучше не делать",
  GFC005: "Условие с инверсией в начале",
  GFC006: "Гипотетическое будущее с инверсией",
  GFC007: "Нереальное условие в прошлом с инверсией",
  GFC012: "Условие «при условии, что»",
  GFC013: "Условие «если бы не»",
  GFC014: "Подразумеваемое условие «иначе»",
  GFE006: "Несколько объектов как множественное число",
  GFE007: "Количество объектов как единственное число",
  GFE011: "Почти нет неисчисляемого ресурса",
  GFE012: "Немного неисчисляемого ресурса есть",
  GFE013: "Слишком мало исчисляемых объектов",
  GFE014: "Несколько исчисляемых объектов есть",
  GFE017: "Ни один из двух вариантов",
  GFE018: "Добавочное подлежащее не меняет согласование",
  GFF001: "Только после события: инверсия",
  GFF002: "Только после действия: инверсия",
  GFF003: "Только таким способом: инверсия",
  GFF008: "Не успело одно произойти, как случилось другое",
  GFF009: "Едва одно произошло, как случилось другое",
  GFG001: "Принадлежность в относительном придаточном",
  GFG002: "Предлог перед относительным местоимением о человеке",
  GFG003: "Предлог перед относительным местоимением о предмете",
  GFG004: "Комментарий ко всему предыдущему событию",
  GFG013: "Придаточное после предлога",
  GFG014: "Придаточное «ли» как подлежащее",
  GFG018: "Описание способа действия",
  GFH012: "Неожиданный результат после действия",
  GFI001: "Помнить о прошлом действии",
  GFI002: "Не забыть выполнить действие",
  GFI003: "Прекратить действие",
  GFI004: "Остановиться, чтобы сделать другое действие",
  GFI005: "Попробовать способ",
  GFI006: "Попытаться достичь цели",
  GFI007: "Сожалеть о совершённом",
  GFI008: "С сожалением сообщить плохую новость",
  GFI009: "Действие влечёт определённое следствие",
  GFI010: "Намереваться что-то сделать",
  GFI011: "Продолжать то же действие",
  GFI012: "Перейти к следующему действию",
  GFI019: "Отдельный активный участник в сопутствующей конструкции",
  GFI020: "Завершённое состояние в сопутствующей конструкции",
  GFJ003: "Событийный пассив",
  GFJ010: "Пассив после глагола принуждения",
  GFJ012: "Разрешение на действие",
  GFJ019: "Действие, которое нужно выполнить над объектом",
  GFK003: "Косвенный специальный вопрос без инверсии",
  GFK011: "Передача вывода о прошлом",
  GFK013: "Рекомендация с базовой формой глагола",
  GFK015: "Требование с неизменяемой формой глагола",
  GFL002: "Вопросительный хвостик после неопределённого лица",
  GFL003: "Особый вопросительный хвостик после формы «я есть»",
  GFL004: "Вопросительный хвостик после предложения сделать что-то вместе",
  GFL005: "Вопросительный хвостик после просьбы",
  GFL006: "Положительный хвостик после слова с отрицательным смыслом",
  GFL007: "Безличное «там» сохраняется в хвостике",
  GFL010: "Вопрос к подлежащему без вспомогательного глагола",
  GFL011: "Вопрос к дополнению со вспомогательным глаголом прошлого времени",
  GFL013: "Утвердительное присоединение «я тоже»",
  GFL014: "Отрицательное присоединение «я тоже не»",
  GFL015: "Замена целого утверждения коротким подтверждением",
  GFL016: "Краткий ответ «надеюсь, нет»",
  GFL017: "Замена повторного действия короткой формой",
  GFL018: "Опущенный инфинитив с сохранённой частицей",
  GFL019: "Краткое условие «если да»",
  GFL020: "Краткое условие «если нет»",
  GFM001: "Один из моих знакомых или объектов",
  GFM002: "Ещё один или другой объект",
  GFM003: "Другие объекты",
  GFM004: "Оставшийся из двух объектов",
  GFM006: "Усиление с исчисляемым существительным в единственном числе",
  GFM007: "Усиление с неисчисляемым или множественным существительным",
  GFM008: "Слишком высокая степень признака перед существительным",
  GFM009: "Сравнение с необычным порядком артикля",
  GFM010: "Восклицание с существительным",
  GFM014: "Замена повторяющегося существительного",
  GFM015: "Замена существительного в сравнении",
  GFM016: "Количество перед притяжательной формой",
  GFM018: "Любой представитель класса",
  GFM019: "Приблизительное количество перед числом",
  GFM020: "Любая из двух сторон",
  GFN001: "Уступка перед целым придаточным",
  GFN003: "Сокращённая уступительная конструкция",
  GFN004: "Сопоставление двух контрастных утверждений",
  GFN008: "Признак вынесен в начало уступительной конструкции",
  GFN013: "Цель с другим исполнителем",
  GFN017: "Нереальное сравнение",
  GFO001: "Отсутствие необходимости",
  GFO002: "Возможность выполнить действие над объектом",
  GFO003: "Необходимость выполнить действие",
  GFO004: "Обязанность исполнителя",
  GFO005: "Действие, которое стоит выполнить",
  GFO006: "Пассив с получателем",
  GFO007: "Передача чужих сведений",
  GFO008: "Передача заявления самого человека",
  GFO009: "Осторожное предположение о вероятности",
  GFO010: "Уступка с модальным оттенком",
  GFO011: "Зависимость от того, выполняется ли условие",
  GFO012: "Исключение из условия",
  GFO013: "Дополнительная усиливающая причина",
  GFO014: "Причина, усиливающая оценку",
  GFO015: "Ожидание определённого события",
  GFO016: "Главное зависит от ответа на вопрос",
  GFO018: "Совершённое каузативное действие",
  GFO020: "Причастная конструкция для предстоящей задачи",
  XPRTRN001: "Причина и следствие через результат",
  XPRRTR006: "Длительность до настоящего момента",
  XPRRTR007: "Будущее значение в условной части без формы будущего времени",
  XPRRTR008: "Степень перед обычным глаголом",
  XPRRTR009: "«Чувствовать себя» без возвратного местоимения",
  LEX379: "Неявное и явное",
  FUNPRM011: "Мы не уполномочены продолжать, если только не …",
  QSTQYN001: "Вы знаете, верно ли, что …?",
  QSTQFRM011: "Мы рассмотрели, верно ли, что …?"
};

const EDITORIAL_USE_RULES = [
  {
    match: /rests on the assumption/u,
    ru: "Показывает, на каком допущении держится аргумент. Полезно, когда нужно сделать предпосылку явной и проверить, выдерживает ли её вывод.",
    en: "Makes the assumption behind an argument explicit so you can examine whether the conclusion really depends on it."
  },
  {
    match: /would recommend checking whether/u,
    ru: "Мягко предлагает сначала проверить условие или факт, а уже затем принимать решение. Звучит менее категорично, чем прямой совет.",
    en: "Recommends checking a condition or fact before acting, with a softer tone than a direct instruction."
  },
  {
    match: /one strength is that/u,
    ru: "Выделяет конкретную сильную сторону и связывает положительную оценку с наблюдаемым фактом.",
    en: "Highlights a concrete strength and ties the positive evaluation to an observable point."
  },
  {
    match: /before we continue, can we clarify whether/u,
    ru: "Помогает остановить обсуждение на важной неопределённости и прояснить её до следующего шага.",
    en: "Pauses the discussion at an important uncertainty and resolves it before the conversation moves on."
  },
  {
    match: /could you confirm whether/u,
    ru: "Вежливо просит подтвердить факт или условие. Подходит для рабочих уточнений и дальнейших действий.",
    en: "Politely asks someone to confirm a fact or condition, especially before a follow-up action."
  },
  {
    match: /(available evidence|evidence suggests|what evidence|evidence would)/u,
    ru: "Связывает утверждение с данными и помогает отделить наблюдение от вывода.",
    en: "Connects a claim to evidence and helps keep observation separate from inference."
  },
  {
    match: /(premature to conclude|not convinced|should not assume)/u,
    ru: "Смягчает вывод и удерживает нужную степень уверенности, когда данных недостаточно для категоричного утверждения.",
    en: "Keeps a conclusion proportionate when the available evidence does not justify certainty."
  },
  {
    match: /(realistic chance|how likely|probable|possible that)/u,
    ru: "Позволяет говорить о вероятности и неопределённости без ложной точности.",
    en: "Expresses likelihood and uncertainty without pretending to have more precision than the evidence supports."
  },
  {
    match: /(compared with|which option|would it be better|stronger if)/u,
    ru: "Помогает сопоставить варианты по явному критерию, а не просто объявить один из них лучше.",
    en: "Compares alternatives against an explicit criterion instead of simply declaring one better."
  },
  {
    match: /(because \[|explains why|consequence follows)/u,
    ru: "Делает связь причины и следствия явной, чтобы ход рассуждения было легче проверить.",
    en: "Makes a cause-and-effect link explicit so the reasoning is easier to inspect."
  },
  {
    match: /(compromise|concession)/u,
    ru: "Открывает пространство для компромисса и формулирует условие, вокруг которого можно договариваться.",
    en: "Creates room for a workable compromise by making the negotiable condition explicit."
  },
  {
    match: /(i am writing to|by friday|the next step|before we decide)/u,
    ru: "Организует рабочую коммуникацию вокруг следующего действия, срока или нужного уточнения.",
    en: "Organises professional communication around a next action, deadline, or clarification."
  },
  {
    match: /looking back/u,
    ru: "Помогает рассказать о прошлом событии и показать, почему оно изменило дальнейший ход ситуации.",
    en: "Looks back on an event and shows why it changed what happened next."
  },
  {
    match: /(even so|that said|although|despite the fact|even if)/u,
    ru: "Признаёт один аргумент, но сохраняет основной тезис и делает контраст явным.",
    en: "Acknowledges one point while keeping the main claim and contrast clear."
  },
  {
    match: /(had \[x\]|if \[x\]|what would happen if)/u,
    ru: "Помогает рассуждать о возможном или альтернативном сценарии и его последствиях.",
    en: "Explores a possible or counterfactual scenario and the consequences that would follow."
  },
  {
    match: /(is being reviewed|is being |was .*ed before)/u,
    ru: "Ставит в центр процесс или результат, а не исполнителя; подходит для формального и нейтрального стиля.",
    en: "Keeps the focus on a process or result rather than the actor, which suits formal and neutral contexts."
  },
  {
    match: /(stressed that|did .* ask|according to the report)/u,
    ru: "Передаёт чужую позицию или вопрос, сохраняя дистанцию между источником сообщения и говорящим.",
    en: "Reports someone else's position or question while keeping the source distinct from the current speaker."
  },
  {
    match: /(have been .* since|since the first)/u,
    ru: "Показывает длительность процесса и связывает его с точкой начала.",
    en: "Shows that a process has continued over time and links it to a clear starting point."
  },
  {
    match: /(would you|could you|would it be possible|would you mind|please let us know)/u,
    ru: "Смягчает просьбу или вопрос и оставляет собеседнику пространство для ответа.",
    en: "Softens a request or question while leaving the other person room to respond."
  },
  {
    match: /(i am concerned|it is reassuring|frustrating if|i am glad)/u,
    ru: "Выражает реакцию через ситуацию или факт, не превращая её в личное обвинение.",
    en: "Expresses a reaction to a situation without turning it into a personal accusation."
  },
  {
    match: /(to sum up|overall,|the main point|taken together)/u,
    ru: "Сводит несколько пунктов к аккуратному выводу без лишнего усиления.",
    en: "Brings several points together into a proportionate conclusion."
  },
  {
    match: /(for example|to illustrate|specific example|one case is)/u,
    ru: "Переводит абстрактную мысль в конкретный пример, который легче обсудить и проверить.",
    en: "Turns an abstract point into a concrete example that is easier to discuss and test."
  },
  {
    match: /(our aim|the purpose|success would mean|trying to achieve)/u,
    ru: "Делает цель явной и связывает обсуждение с ожидаемым результатом.",
    en: "Makes the goal explicit and connects the discussion to the intended outcome."
  },
  {
    match: /(there is a risk|reduce the risk|contingency plan)/u,
    ru: "Называет риск и подводит к соразмерной мере предосторожности вместо расплывчатой тревоги.",
    en: "Names the risk and links it to a proportionate precaution instead of vague concern."
  }
];

function compact(value = "") {
  return String(value).replaceAll(/\s+/g, " ").trim();
}

function trimStatementTitle(value = "") {
  const title = compact(value);
  if (title.endsWith("...") || title.endsWith("…")) return title;
  return title.replace(/\.$/u, "");
}

export function patternFrameTitle(formula = "") {
  let slot = 0;
  return compact(formula)
    .replaceAll(/\[[^\]]+\]/g, () => {
      const label = SLOT_NAMES[slot] || `X${slot + 1}`;
      slot += 1;
      return `[${label}]`;
    })
    .replaceAll("{c}", () => {
      const label = SLOT_NAMES[slot] || `X${slot + 1}`;
      slot += 1;
      return `[${label}]`;
    })
    .replace(/\.$/u, "");
}

function editorialUse(pattern) {
  const english = pattern?.langs?.find((language) => language.lang === "en") || pattern?.langs?.[0] || {};
  const value = patternFrameTitle(english.formula || "").toLowerCase();
  return EDITORIAL_USE_RULES.find((rule) => rule.match.test(value)) || null;
}

function syntheticRussianTitle(pattern) {
  const id = String(pattern?.id || "");
  if (RU_TITLE_OVERRIDES[id]) return RU_TITLE_OVERRIDES[id];
  if (id.startsWith("C1")) return C1_RU_TITLES[pattern.set_id] || trimStatementTitle(pattern.title_ru);
  if (id.startsWith("FUN") || id.startsWith("QST")) {
    return trimStatementTitle(String(pattern.title_ru || "").replaceAll(FIXED_CONTEXT_RU, "…"));
  }
  return null;
}

export function patternFrameTitleRu(pattern) {
  const override = RU_TITLE_OVERRIDES[String(pattern?.id || "")];
  if (override) return override;
  const synthetic = syntheticRussianTitle(pattern);
  if (synthetic) return synthetic;
  return trimStatementTitle(pattern?.title_ru || "");
}

export function patternFrameDescription(pattern, set = null) {
  const use = editorialUse(pattern);
  if (use) return use.ru;

  const existing = compact(pattern?.metaphor_ru || "");
  if (existing && !SYNTHETIC_DESCRIPTION.test(existing)) return existing;

  const setTitle = set?.title_ru || pattern?.set_id || pattern?.group_id || "речевая задача";
  const setDescription = compact(set?.description_ru || "");
  if (setDescription) return `Каркас из раздела «${setTitle}». ${setDescription}`;
  return `Речевой каркас из раздела «${setTitle}»: устойчивую часть можно повторно использовать с новым содержанием.`;
}

export function patternFrameDescriptionEn(pattern, set = null) {
  const use = editorialUse(pattern);
  if (use) return use.en;

  const setTitle = set?.title_en || set?.title || pattern?.set_id || pattern?.group_id || "this communication task";
  const setDescription = compact(set?.description || "");
  if (setDescription) return `A reusable frame from “${setTitle}”. ${setDescription}`;
  return `A reusable language frame for ${setTitle}, with the stable structure separated from the content you substitute.`;
}

export function needsPatternEditorialCopy(pattern) {
  if (!pattern || typeof pattern !== "object") return false;
  const id = String(pattern.id || "");
  if (SYNTHETIC_ID.test(id)) return true;
  if (RU_TITLE_OVERRIDES[id]) return true;
  if (SYNTHETIC_DESCRIPTION.test(String(pattern.metaphor_ru || ""))) return true;
  return false;
}

export function applyPatternEditorialCopy(pattern, set = null) {
  const english = pattern?.langs?.find((language) => language.lang === "en") || pattern?.langs?.[0] || {};
  const titleEn = patternFrameTitle(english.formula || pattern?.title_en || pattern?.id || "");
  const titleRu = patternFrameTitleRu(pattern);
  const descriptionRu = patternFrameDescription(pattern, set);
  const descriptionEn = patternFrameDescriptionEn(pattern, set);

  return {
    ...pattern,
    title_en: titleEn,
    title_ru: titleRu,
    description_en: descriptionEn,
    description_ru: descriptionRu,
    metaphor_ru: descriptionRu
  };
}
