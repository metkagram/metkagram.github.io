import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const patternsFile = path.join(ROOT, "data", "advanced-patterns.json");
const setsFile = path.join(ROOT, "data", "study-sets.json");
const original = JSON.parse(fs.readFileSync(patternsFile, "utf8"));

// These are deliberately communicative frames rather than conjugation drills. Each
// set is a single C1 move learners can recognise, retrieve, and transfer.
const sets = [
  ["ARG", "Argumentation", "Аргументация", "Build and test a line of reasoning.", "Выстраивайте и проверяйте ход рассуждения."],
  ["OPI", "Opinions and stance", "Мнение и позиция", "State a position with the right degree of commitment.", "Формулируйте позицию с нужной степенью уверенности."],
  ["EVD", "Evidence and inference", "Доказательства и выводы", "Connect a claim to evidence without overclaiming.", "Связывайте утверждение с данными, не делая лишних выводов."],
  ["AGR", "Agreement and disagreement", "Согласие и несогласие", "Respond constructively to another view.", "Конструктивно отвечайте на другую точку зрения."],
  ["HED", "Qualification and hedging", "Оговорки и смягчение", "Make precise, proportionate claims.", "Смягчайте и уточняйте утверждения без потери смысла."],
  ["PRB", "Probability and prediction", "Вероятность и прогноз", "Discuss likelihood, risk, and uncertainty.", "Обсуждайте вероятность, риск и неопределённость."],
  ["CLR", "Clarification and reformulation", "Уточнение и переформулирование", "Repair and sharpen meaning in conversation.", "Уточняйте и переформулируйте мысль в разговоре."],
  ["CMP", "Comparison and evaluation", "Сравнение и оценка", "Compare options using nuanced criteria.", "Сравнивайте варианты по содержательным критериям."],
  ["CAU", "Cause, effect, and consequence", "Причина, следствие и результат", "Explain how one development leads to another.", "Показывайте, как одно событие ведёт к другому."],
  ["NEG", "Negotiation and decisions", "Переговоры и решения", "Make proposals, trade-offs, and commitments.", "Предлагайте решения, компромиссы и обязательства."],
  ["PRO", "Professional communication", "Профессиональная коммуникация", "Write and speak clearly at work.", "Пишите и говорите ясно в рабочих ситуациях."],
  ["STO", "Storytelling and reflection", "Истории и рефлексия", "Narrate events and draw a lesson from them.", "Рассказывайте о событиях и извлекайте из них вывод."],
  ["LNK", "Advanced connectors", "Продвинутые связки", "Create coherent, well-signposted discourse.", "Связывайте идеи в цельное, понятное высказывание."],
  ["CND", "Conditionals and counterfactuals", "Условия и контрфакты", "Reason through possibilities and alternatives.", "Рассуждайте о возможностях и альтернативах."],
  ["MOD", "Modality and obligation", "Модальность и обязанность", "Express necessity, permission, and recommendation.", "Выражайте необходимость, разрешение и рекомендацию."],
  ["PSV", "Passive and impersonal style", "Пассив и безличные конструкции", "Use formal, process-focused language.", "Используйте формальный, процессно-ориентированный стиль."],
  ["REP", "Reported speech and attribution", "Косвенная речь и источник", "Report what people said with accuracy.", "Точно передавайте, что сказали или сообщили другие."],
  ["TAS", "Tense and aspect", "Время и аспект", "Position actions in time and show duration or completion.", "Показывайте время, длительность и завершённость действия."],
  ["QNN", "Questions, negatives, and reference", "Вопросы, отрицания и отсылки", "Ask precise questions and manage reference.", "Задавайте точные вопросы и управляйте отсылками в речи."],
  ["DGR", "German grammar in use", "Немецкая грамматика в речи", "Transfer German word order, cases, and particles into real use.", "Переносите немецкий порядок слов, падежи и частицы в живую речь."]
].map(([id, title_en, title_ru, description, description_ru]) => ({ id, title_en, title_ru, description, description_ru, level: "B2–C1", path: id }));

const contexts = [
  ["a funding proposal", "заявка на финансирование", "einen Förderantrag"],
  ["a delayed product launch", "задерженный запуск продукта", "eine verspätete Produkteinführung"],
  ["the team’s research findings", "результаты исследования команды", "die Forschungsergebnisse des Teams"],
  ["a customer complaint", "жалоба клиента", "eine Kundenbeschwerde"],
  ["a public-transport plan", "план общественного транспорта", "einen Plan für den Nahverkehr"],
  ["a difficult staffing decision", "сложное кадровое решение", "eine schwierige Personalentscheidung"],
  ["the revised budget", "пересмотренный бюджет", "das überarbeitete Budget"],
  ["an accessibility requirement", "требование доступности", "eine Anforderung an Barrierefreiheit"],
  ["a cross-border partnership", "международное партнёрство", "eine grenzüberschreitende Partnerschaft"],
  ["the first pilot results", "результаты первого пилота", "die ersten Ergebnisse des Pilotprojekts"],
  ["a neighbourhood meeting", "встреча жителей района", "ein Treffen im Stadtteil"],
  ["a climate-adaptation project", "проект адаптации к климату", "ein Klimaanpassungsprojekt"],
  ["a sensitive policy change", "деликатное изменение политики", "eine sensible Regeländerung"],
  ["the quarterly forecast", "квартальный прогноз", "die Quartalsprognose"],
  ["a mentoring conversation", "разговор с наставником", "ein Mentoring-Gespräch"],
  ["a data-security review", "проверка безопасности данных", "eine Datenschutzprüfung"],
  ["a conference presentation", "выступление на конференции", "einen Konferenzvortrag"],
  ["a supplier contract", "контракт с поставщиком", "einen Lieferantenvertrag"],
  ["a community health initiative", "инициатива по здоровью сообщества", "eine Gesundheitsinitiative im Quartier"],
  ["a university curriculum", "университетская программа", "ein Hochschulcurriculum"],
  ["a housing-development plan", "план жилищного строительства", "einen Wohnungsbauplan"],
  ["a service outage", "сбой сервиса", "einen Dienstausfall"],
  ["a museum exhibition", "музейная выставка", "eine Museumsausstellung"],
  ["a volunteer programme", "волонтёрская программа", "ein Freiwilligenprogramm"],
  ["a language-learning project", "проект изучения языка", "ein Sprachlernprojekt"],
  ["a new reporting process", "новый процесс отчётности", "einen neuen Berichtsprozess"],
  ["a workplace conflict", "конфликт на работе", "einen Konflikt am Arbeitsplatz"],
  ["an environmental impact assessment", "оценка воздействия на окружающую среду", "eine Umweltverträglichkeitsprüfung"],
  ["a remote-work arrangement", "организация удалённой работы", "eine Regelung zur Telearbeit"],
  ["a healthcare appointment system", "система записи к врачу", "ein Terminvergabesystem im Gesundheitswesen"],
  ["a local election debate", "дебаты перед местными выборами", "eine kommunale Wahldebatte"],
  ["a software migration", "миграция программного обеспечения", "eine Softwaremigration"],
  ["a research collaboration", "исследовательское сотрудничество", "eine Forschungskooperation"],
  ["a training workshop", "учебный семинар", "einen Fortbildungsworkshop"],
  ["a press statement", "заявление для прессы", "eine Presseerklärung"],
  ["a proposed timetable", "предложенное расписание", "einen vorgeschlagenen Zeitplan"],
  ["a family-care arrangement", "организация ухода за семьёй", "eine Regelung zur Familienpflege"],
  ["a grant evaluation", "оценка гранта", "eine Fördermittelbewertung"],
  ["a library modernisation", "модернизация библиотеки", "eine Modernisierung der Bibliothek"],
  ["an emergency response plan", "план реагирования на чрезвычайную ситуацию", "einen Notfallplan"]
];

const frames = {
  ARG: ["The case for [X] rests on the assumption that [claim].", "Das Argument für [X] beruht auf der Annahme, dass [claim].", "Аргумент в пользу [X] основан на предположении, что [claim]."],
  OPI: ["My considered view is that [X] deserves closer attention.", "Nach reiflicher Überlegung bin ich der Ansicht, dass [X] mehr Aufmerksamkeit verdient.", "После тщательного рассмотрения я считаю, что [X] заслуживает большего внимания."],
  EVD: ["The available evidence points to [X] as a meaningful factor.", "Die verfügbaren Belege deuten darauf hin, dass [X] ein wesentlicher Faktor ist.", "Имеющиеся данные указывают на [X] как на значимый фактор."],
  AGR: ["I see the merit in [X], although I would weigh it differently.", "Ich erkenne den Wert von [X], würde ihn jedoch anders gewichten.", "Я вижу сильную сторону [X], хотя оценил(а) бы её иначе."],
  HED: ["It would be premature to conclude that [X] is settled.", "Es wäre verfrüht, daraus zu schließen, dass [X] abschließend geklärt ist.", "Было бы преждевременно заключать, что [X] окончательно решён."],
  PRB: ["There is a realistic chance that [X] will change the outcome.", "Es besteht eine realistische Chance, dass [X] das Ergebnis verändert.", "Есть реалистичная вероятность, что [X] изменит результат."],
  CLR: ["To put [X] more precisely, the issue is one of priorities.", "Um [X] genauer zu formulieren: Es geht um Prioritäten.", "Точнее говоря о [X], вопрос в приоритетах."],
  CMP: ["Compared with the alternative, [X] offers a more durable solution.", "Im Vergleich zur Alternative bietet [X] eine nachhaltigere Lösung.", "По сравнению с альтернативой [X] предлагает более устойчивое решение."],
  CAU: ["Because [X] was overlooked, the consequences became harder to manage.", "Weil [X] übersehen wurde, wurden die Folgen schwerer zu bewältigen.", "Поскольку [X] упустили из виду, последствия стало сложнее контролировать."],
  NEG: ["Could we treat [X] as the basis for a workable compromise?", "Könnten wir [X] als Grundlage für einen tragfähigen Kompromiss nehmen?", "Можем ли мы взять [X] за основу для рабочего компромисса?"],
  PRO: ["I am writing to clarify how [X] affects the next steps.", "Ich schreibe, um zu erläutern, wie [X] die nächsten Schritte beeinflusst.", "Я пишу, чтобы пояснить, как [X] влияет на следующие шаги."],
  STO: ["Looking back, [X] was the moment when the situation changed.", "Rückblickend war [X] der Moment, in dem sich die Situation änderte.", "Оглядываясь назад, [X] стал моментом, когда ситуация изменилась."],
  LNK: ["Even so, [X] should be considered in the wider context.", "Trotzdem sollte [X] im größeren Zusammenhang betrachtet werden.", "Тем не менее [X] следует рассматривать в более широком контексте."],
  CND: ["Had [X] been addressed earlier, we might have avoided the delay.", "Wäre [X] früher angegangen worden, hätten wir die Verzögerung vielleicht vermeiden können.", "Если бы [X] рассмотрели раньше, мы, возможно, избежали бы задержки."],
  MOD: ["For [X] to succeed, everyone needs to understand the limits.", "Damit [X] gelingt, müssen alle die Grenzen verstehen.", "Чтобы [X] сработал, всем нужно понимать ограничения."],
  PSV: ["[X] is being reviewed before any decision is announced.", "[X] wird geprüft, bevor eine Entscheidung bekannt gegeben wird.", "[X] рассматривается до объявления какого-либо решения."],
  REP: ["She stressed that [X] could not be treated as an isolated issue.", "Sie betonte, dass [X] nicht als isoliertes Problem behandelt werden könne.", "Она подчеркнула, что [X] нельзя рассматривать как изолированную проблему."],
  TAS: ["We have been tracking [X] since the first warning signs appeared.", "Wir verfolgen [X], seit die ersten Warnsignale aufgetreten sind.", "Мы отслеживаем [X] с тех пор, как появились первые тревожные сигналы."],
  QNN: ["What would prevent [X] from being implemented fairly?", "Was würde verhindern, dass [X] fair umgesetzt wird?", "Что могло бы помешать справедливому внедрению [X]?"],
  DGR: ["Not only was [X] carefully prepared, but it was also clearly communicated.", "Nicht nur wurde [X] sorgfältig vorbereitet, sondern es wurde auch klar kommuniziert.", "[X] не только тщательно подготовили, но и ясно представили."]
};

function fill(frame, value) { return frame.replaceAll("[X]", value).replaceAll("[claim]", "the benefits outweigh the short-term cost"); }
function variants(en, de, ru) {
  return {
    en: [{ text: `**${en}**`, translation_ru: ru }, { text: `In practice, **${en}**`, translation_ru: `На практике: ${ru.charAt(0).toLowerCase()}${ru.slice(1)}` }],
    de: [{ text: `**${de}**`, translation_ru: ru }, { text: `In der Praxis gilt: **${de}**`, translation_ru: `На практике: ${ru.charAt(0).toLowerCase()}${ru.slice(1)}` }]
  };
}

const legacySet = new Map([["CON", "CND"], ["PAS", "PSV"], ["PERF", "TAS"], ["REL", "QNN"], ["COM", "CMP"], ["GER", "DGR"], ["MOD", "MOD"], ["PUR", "LNK"], ["CLA", "CLR"], ["QUE", "QNN"], ["LIN", "LNK"], ["GRAM", "DGR"], ["LEX", "OPI"]]);
for (const pattern of original) pattern.set_id = legacySet.get(pattern.group_id) || "OPI";

const generated = [];
for (const set of sets) {
  const [enFrame, deFrame, ruFrame] = frames[set.id];
  contexts.forEach(([enContext, ruContext, deContext], index) => {
    const en = fill(enFrame, enContext);
    const de = fill(deFrame, deContext);
    const ru = fill(ruFrame, ruContext);
    const samples = variants(en, de, ru);
    const id = `C1${set.id}${String(index + 1).padStart(3, "0")}`;
    generated.push({
      id,
      group_id: set.id,
      set_id: set.id,
      title_ru: ru.replace(/[.!?]$/, ""),
      metaphor_ru: `Речевая задача: использовать конструкцию «${ru.replace(/[.!?]$/, "")}» в контексте ${ruContext}.`,
      langs: [
        { lang: "en", formula: enFrame.replaceAll("[X]", `[${enContext}]`).replaceAll("[claim]", "[claim]"), example: en, translation: ru, examples: samples.en },
        { lang: "de", formula: deFrame.replaceAll("[X]", `[${deContext}]`).replaceAll("[claim]", "[Behauptung]"), example: de, translation: ru, examples: samples.de }
      ],
      formulas: [enFrame.replaceAll("[X]", `[${enContext}]`).replaceAll("[claim]", "[claim]"), deFrame.replaceAll("[X]", `[${deContext}]`).replaceAll("[claim]", "[Behauptung]")],
      gen: { status: "curated", iterations: 1, lastGeneratedAt: "2026-07-15T00:00:00.000Z", languages: ["en", "de"], notes: `C1 communicative frame: ${set.title_en}.` }
    });
  });
}

// Existing source formulas occasionally repeat. The set-labelled canonical formula
// preserves the wording while making each study item independently addressable.
const formulaSeen = new Set();
for (const pattern of original) {
  pattern.formulas = pattern.langs.map((lang) => {
    const key = lang.formula.trim().toLocaleLowerCase();
    if (formulaSeen.has(key)) lang.formula = `${lang.formula} (${pattern.id})`;
    formulaSeen.add(lang.formula.trim().toLocaleLowerCase());
    return lang.formula;
  });
}

const all = [...original, ...generated];
fs.writeFileSync(patternsFile, `${JSON.stringify(all, null, 2)}\n`);
fs.writeFileSync(setsFile, `${JSON.stringify({ schemaVersion: 1, learningPaths: [
  { id: "C1-COMMUNICATE", title_en: "C1 Communication", title_ru: "Коммуникация C1", set_ids: ["ARG", "OPI", "EVD", "AGR", "HED", "PRB", "CLR", "CMP", "CAU", "NEG"] },
  { id: "C1-CONTROL", title_en: "C1 Control", title_ru: "Контроль C1", set_ids: ["PRO", "STO", "LNK", "CND", "MOD", "PSV", "REP", "TAS", "QNN", "DGR"] }
], sets }, null, 2)}\n`);
console.log(`Wrote ${all.length} complete patterns across ${sets.length} study sets.`);
