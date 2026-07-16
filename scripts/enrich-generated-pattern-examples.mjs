import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "advanced-patterns.json");
const patterns = JSON.parse(fs.readFileSync(file, "utf8"));

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

function contextIndex(pattern) {
  const index = contexts.findIndex(([, ru]) => pattern.title_ru.includes(ru));
  if (index < 0) throw new Error(`Cannot find a source context for ${pattern.id}`);
  return index;
}

function exampleFor(lang, sourceContext, context, translation) {
  const original = lang.lang === "en" ? sourceContext[0] : sourceContext[2];
  const replacement = lang.lang === "en" ? context[0] : context[2];
  const formula = lang.formula
    .replace(`[${original}]`, replacement)
    .replaceAll("[claim]", "the benefits outweigh the short-term cost")
    .replaceAll("[Behauptung]", "die Vorteile die kurzfristigen Kosten überwiegen");
  return { text: `**${formula}**`, translation_ru: translation };
}

let changed = 0;
for (const pattern of patterns.filter((item) => /^C1[A-Z]+\d+$/.test(item.id))) {
  const origin = contextIndex(pattern);
  const sourceContext = contexts[origin];
  for (const lang of pattern.langs) {
    const examples = Array.from({ length: 8 }, (_, offset) => {
      const context = contexts[(origin + offset) % contexts.length];
      const translation = lang.translation.replace(sourceContext[1], context[1]);
      return exampleFor(lang, sourceContext, context, translation);
    });
    lang.examples = examples;
  }
  changed += 1;
}

fs.writeFileSync(file, `${JSON.stringify(patterns, null, 2)}\n`);
console.log(`Added eight contextual examples in English and German to ${changed} generated patterns.`);
