const SYNTHETIC_DESCRIPTION = /^Речевая задача:/u;

const SLOT_NAMES = ["X", "Y", "Z", "A", "B"];

function compact(value = "") {
  return String(value).replaceAll(/\s+/g, " ").trim();
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

function editorialUse(formula = "") {
  const value = patternFrameTitle(formula).toLowerCase();
  const rules = [
    [/rests on the assumption/u, "Показывает, на каком допущении держится аргумент. Полезно, когда нужно сделать предпосылку явной и проверить, выдерживает ли её вывод."],
    [/would recommend checking whether/u, "Мягко предлагает сначала проверить условие или факт, а уже затем принимать решение. Звучит менее категорично, чем прямой совет."],
    [/one strength is that/u, "Выделяет конкретную сильную сторону и связывает положительную оценку с наблюдаемым фактом."],
    [/before we continue, can we clarify whether/u, "Помогает остановить обсуждение на важной неопределённости и прояснить её до следующего шага."],
    [/could you confirm whether/u, "Вежливо просит подтвердить факт или условие. Подходит для рабочих уточнений и дальнейших действий."],
    [/(available evidence|evidence suggests|what evidence|evidence would)/u, "Связывает утверждение с данными и помогает отделить наблюдение от вывода."],
    [/(premature to conclude|not convinced|should not assume)/u, "Смягчает вывод и удерживает нужную степень уверенности, когда данных недостаточно для категоричного утверждения."],
    [/(realistic chance|how likely|probable|possible that)/u, "Позволяет говорить о вероятности и неопределённости без ложной точности."],
    [/(compared with|which option|would it be better|stronger if)/u, "Помогает сопоставить варианты по явному критерию, а не просто объявить один из них лучше."],
    [/(because \[|explains why|consequence follows)/u, "Делает связь причины и следствия явной, чтобы ход рассуждения было легче проверить."],
    [/(compromise|concession)/u, "Открывает пространство для компромисса и формулирует условие, вокруг которого можно договариваться."],
    [/(i am writing to|by friday|the next step|before we decide)/u, "Организует рабочую коммуникацию вокруг следующего действия, срока или нужного уточнения."],
    [/looking back/u, "Помогает рассказать о прошлом событии и показать, почему оно изменило дальнейший ход ситуации."],
    [/(even so|that said|although|despite the fact|even if)/u, "Признаёт один аргумент, но сохраняет основной тезис и делает контраст явным."],
    [/(had \[x\]|if \[x\]|what would happen if)/u, "Помогает рассуждать о возможном или альтернативном сценарии и его последствиях."],
    [/(is being reviewed|is being |was .*ed before)/u, "Ставит в центр процесс или результат, а не исполнителя; подходит для формального и нейтрального стиля."],
    [/(stressed that|did .* ask|according to the report)/u, "Передаёт чужую позицию или вопрос, сохраняя дистанцию между источником сообщения и говорящим."],
    [/(have been .* since|since the first)/u, "Показывает длительность процесса и связывает его с точкой начала."],
    [/(would you|could you|would it be possible|would you mind|please let us know)/u, "Смягчает просьбу или вопрос и оставляет собеседнику пространство для ответа."],
    [/(i am concerned|it is reassuring|frustrating if|i am glad)/u, "Выражает реакцию через ситуацию или факт, не превращая её в личное обвинение."],
    [/(to sum up|overall,|the main point|taken together)/u, "Сводит несколько пунктов к аккуратному выводу без лишнего усиления."],
    [/(for example|to illustrate|specific example|one case is)/u, "Переводит абстрактную мысль в конкретный пример, который легче обсудить и проверить."],
    [/(our aim|the purpose|success would mean|trying to achieve)/u, "Делает цель явной и связывает обсуждение с ожидаемым результатом."],
    [/(there is a risk|reduce the risk|contingency plan)/u, "Называет риск и подводит к соразмерной мере предосторожности вместо расплывчатой тревоги."]
  ];
  return rules.find(([pattern]) => pattern.test(value))?.[1] || "";
}

export function patternFrameDescription(pattern, set = null) {
  const english = pattern?.langs?.find((language) => language.lang === "en") || pattern?.langs?.[0] || {};
  const specific = editorialUse(english.formula || "");
  if (specific) return specific;

  const setTitle = set?.title_ru || pattern?.set_id || pattern?.group_id || "речевая задача";
  const setDescription = compact(set?.description_ru || "");
  if (setDescription) return `Каркас для задачи «${setTitle}». ${setDescription}`;
  return `Каркас для задачи «${setTitle}»: оставляет содержание в слотах, а устойчивую речевую конструкцию — для повторного использования.`;
}

export function needsPatternEditorialCopy(pattern) {
  if (!pattern || typeof pattern !== "object") return false;
  if (SYNTHETIC_DESCRIPTION.test(String(pattern.metaphor_ru || ""))) return true;
  return /^(C1|FUN|QST)/u.test(String(pattern.id || "")) && (pattern.langs || []).some((language) => compact(language.translation) === compact(pattern.title_ru));
}

export function applyPatternEditorialCopy(pattern, set = null) {
  if (!needsPatternEditorialCopy(pattern)) return pattern;
  const english = pattern.langs?.find((language) => language.lang === "en") || pattern.langs?.[0] || {};
  return {
    ...pattern,
    title_ru: patternFrameTitle(english.formula || pattern.title_ru || pattern.id),
    metaphor_ru: patternFrameDescription(pattern, set)
  };
}
