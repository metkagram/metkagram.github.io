// Historical corpus cleanup for generic follow-up sentences that were once
// appended to short examples purely to reach a word-count target. These
// sentences are not part of the language pattern and create repetitive,
// misleading examples, so they must never appear in canonical pattern data.

export const GENERATED_FOLLOW_UPS = {
  en: [
    "The team will discuss it before deciding how to proceed.",
    "Everyone can return to this point at the next meeting.",
    "The wider context will matter when the next decision is made.",
    "It will be useful to revisit this before the final plan is agreed.",
    "The answer will help the team decide how to proceed.",
    "Everyone can use the answer to prepare for the next meeting.",
    "The answer will clarify what should happen next.",
    "This point will be easier to discuss once the answer is clear.",
    "This gives the team a clearer basis for the next decision.",
    "That way, everyone can prepare for the next step with confidence.",
    "The detail matters before anyone commits to a final plan.",
    "It makes the situation easier to explain to a new colleague.",
    "The answer would help the team plan the next step.",
    "That answer would make the next decision easier to discuss.",
    "The answer would give everyone a clearer picture of the situation.",
    "That information would help the group prepare for the conversation.",
    "The detail will make the situation easier to explain.",
    "That context will help everyone understand what happens next.",
    "It gives the team a useful point to discuss at the meeting.",
    "That makes the next decision easier to prepare for."
  ],
  de: [
    "Das Team wird darüber sprechen, bevor es das weitere Vorgehen festlegt.",
    "Alle können bei der nächsten Besprechung auf diesen Punkt zurückkommen.",
    "Der weitere Kontext wird wichtig sein, wenn die nächste Entscheidung getroffen wird.",
    "Es wird nützlich sein, diesen Punkt vor dem endgültigen Plan noch einmal aufzugreifen.",
    "Die Antwort wird dem Team helfen, das weitere Vorgehen festzulegen.",
    "Alle können die Antwort zur Vorbereitung auf die nächste Besprechung nutzen.",
    "Die Antwort wird klären, was als Nächstes passieren soll.",
    "Dieser Punkt wird leichter zu besprechen sein, wenn die Antwort klar ist.",
    "So hat das Team eine klarere Grundlage für die nächste Entscheidung.",
    "Dadurch können sich alle sicherer auf den nächsten Schritt vorbereiten.",
    "Dieses Detail ist wichtig, bevor jemand einem endgültigen Plan zustimmt.",
    "Damit lässt sich die Situation einer neuen Kollegin oder einem neuen Kollegen leichter erklären.",
    "Die Antwort würde dem Team helfen, den nächsten Schritt zu planen.",
    "Diese Antwort würde die nächste Entscheidung leichter besprechbar machen.",
    "Die Antwort würde allen ein klareres Bild der Situation geben.",
    "Diese Information würde der Gruppe bei der Vorbereitung auf das Gespräch helfen.",
    "Dieses Detail wird die Situation leichter erklärbar machen.",
    "Dieser Kontext wird allen helfen zu verstehen, was als Nächstes passiert.",
    "Das gibt dem Team einen nützlichen Punkt für die Besprechung.",
    "Dadurch lässt sich die nächste Entscheidung leichter vorbereiten."
  ],
  ru: [
    "Команда обсудит это, прежде чем определит дальнейшие действия.",
    "Все смогут вернуться к этому пункту на следующей встрече.",
    "Более широкий контекст будет важен при принятии следующего решения.",
    "Будет полезно вернуться к этому пункту до согласования окончательного плана.",
    "Ответ поможет команде определить дальнейшие действия.",
    "Все смогут использовать ответ, чтобы подготовиться к следующей встрече.",
    "Ответ прояснит, что должно произойти дальше.",
    "Этот пункт будет легче обсудить, когда ответ станет понятен.",
    "Так у команды будет более ясная основа для следующего решения.",
    "Так каждый сможет увереннее подготовиться к следующему шагу.",
    "Эта деталь важна, прежде чем кто-то согласится на окончательный план.",
    "Такую ситуацию легче объяснить новому коллеге.",
    "Ответ помог бы команде спланировать следующий шаг.",
    "С таким ответом следующее решение будет легче обсудить.",
    "Ответ дал бы всем более ясную картину ситуации.",
    "Эта информация помогла бы группе подготовиться к разговору.",
    "Эта деталь поможет легче объяснить ситуацию.",
    "Этот контекст поможет всем понять, что будет дальше.",
    "У команды появится полезный пункт для обсуждения на встрече.",
    "Так будет легче подготовиться к следующему решению."
  ]
};

const suffixesByLanguage = Object.fromEntries(
  Object.entries(GENERATED_FOLLOW_UPS).map(([language, suffixes]) => [
    language,
    [...new Set(suffixes)].sort((a, b) => b.length - a.length)
  ])
);

export function stripGeneratedFollowUp(value, language) {
  if (typeof value !== "string" || !value) return { value, removed: 0 };
  const suffixes = suffixesByLanguage[language] || [];
  let next = value.trimEnd();
  let removed = 0;

  while (next) {
    const suffix = suffixes.find((candidate) => next === candidate || next.endsWith(` ${candidate}`));
    if (!suffix) break;
    next = next === suffix ? "" : next.slice(0, -suffix.length).trimEnd();
    removed += 1;
  }

  return { value: next, removed };
}

export function hasGeneratedFollowUp(value, language) {
  if (typeof value !== "string" || !value) return false;
  return (suffixesByLanguage[language] || []).some((suffix) => value === suffix || value.endsWith(` ${suffix}`));
}

function cleanField(target, key, language) {
  if (!target || typeof target[key] !== "string") return 0;
  const result = stripGeneratedFollowUp(target[key], language);
  target[key] = result.value;
  return result.removed;
}

export function cleanPatternGeneratedFollowUps(pattern) {
  let removed = 0;
  for (const language of pattern?.langs || []) {
    removed += cleanField(language, "example", language.lang);
    removed += cleanField(language, "translation", "ru");
    removed += cleanField(language, "translation_ru", "ru");

    for (const example of language.examples || []) {
      removed += cleanField(example, "text", language.lang);
      removed += cleanField(example, "translation_ru", "ru");
      removed += cleanField(example, "translation", "ru");
    }
  }
  return removed;
}
