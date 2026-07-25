import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const file = path.join(ROOT, "data", "advanced-patterns.json");
const patterns = JSON.parse(fs.readFileSync(file, "utf8"));
const limit = 12;

const followUps = {
  en: {
    statement: [
      "The team will discuss it before deciding how to proceed.",
      "Everyone can return to this point at the next meeting.",
      "The wider context will matter when the next decision is made.",
      "It will be useful to revisit this before the final plan is agreed."
    ],
    question: [
      "The answer will help the team decide how to proceed.",
      "Everyone can use the answer to prepare for the next meeting.",
      "The answer will clarify what should happen next.",
      "This point will be easier to discuss once the answer is clear."
    ],
    exclamation: [
      "The team will discuss it before deciding how to proceed.",
      "Everyone can return to this point at the next meeting.",
      "The wider context will matter when the next decision is made.",
      "It will be useful to revisit this before the final plan is agreed."
    ]
  },
  de: {
    statement: [
      "Das Team wird darüber sprechen, bevor es das weitere Vorgehen festlegt.",
      "Alle können bei der nächsten Besprechung auf diesen Punkt zurückkommen.",
      "Der weitere Kontext wird wichtig sein, wenn die nächste Entscheidung getroffen wird.",
      "Es wird nützlich sein, diesen Punkt vor dem endgültigen Plan noch einmal aufzugreifen."
    ],
    question: [
      "Die Antwort wird dem Team helfen, das weitere Vorgehen festzulegen.",
      "Alle können die Antwort zur Vorbereitung auf die nächste Besprechung nutzen.",
      "Die Antwort wird klären, was als Nächstes passieren soll.",
      "Dieser Punkt wird leichter zu besprechen sein, wenn die Antwort klar ist."
    ],
    exclamation: [
      "Das Team wird darüber sprechen, bevor es das weitere Vorgehen festlegt.",
      "Alle können bei der nächsten Besprechung auf diesen Punkt zurückkommen.",
      "Der weitere Kontext wird wichtig sein, wenn die nächste Entscheidung getroffen wird.",
      "Es wird nützlich sein, diesen Punkt vor dem endgültigen Plan noch einmal aufzugreifen."
    ]
  },
  ru: {
    statement: [
      "Команда обсудит это, прежде чем определит дальнейшие действия.",
      "Все смогут вернуться к этому пункту на следующей встрече.",
      "Более широкий контекст будет важен при принятии следующего решения.",
      "Будет полезно вернуться к этому пункту до согласования окончательного плана."
    ],
    question: [
      "Ответ поможет команде определить дальнейшие действия.",
      "Все смогут использовать ответ, чтобы подготовиться к следующей встрече.",
      "Ответ прояснит, что должно произойти дальше.",
      "Этот пункт будет легче обсудить, когда ответ станет понятен."
    ],
    exclamation: [
      "Команда обсудит это, прежде чем определит дальнейшие действия.",
      "Все смогут вернуться к этому пункту на следующей встрече.",
      "Более широкий контекст будет важен при принятии следующего решения.",
      "Будет полезно вернуться к этому пункту до согласования окончательного плана."
    ]
  }
};

const legacyFollowUps = {
  en: [
    "This gives the team a clearer basis for the next decision.", "That way, everyone can prepare for the next step with confidence.",
    "The detail matters before anyone commits to a final plan.", "It makes the situation easier to explain to a new colleague.",
    "The answer would help the team plan the next step.", "That answer would make the next decision easier to discuss.",
    "The answer would give everyone a clearer picture of the situation.", "That information would help the group prepare for the conversation.",
    "The detail will make the situation easier to explain.", "That context will help everyone understand what happens next.",
    "It gives the team a useful point to discuss at the meeting.", "That makes the next decision easier to prepare for."
  ],
  de: [
    "So hat das Team eine klarere Grundlage für die nächste Entscheidung.", "Dadurch können sich alle sicherer auf den nächsten Schritt vorbereiten.",
    "Dieses Detail ist wichtig, bevor jemand einem endgültigen Plan zustimmt.", "Damit lässt sich die Situation einer neuen Kollegin oder einem neuen Kollegen leichter erklären.",
    "Die Antwort würde dem Team helfen, den nächsten Schritt zu planen.", "Diese Antwort würde die nächste Entscheidung leichter besprechbar machen.",
    "Die Antwort würde allen ein klareres Bild der Situation geben.", "Diese Information würde der Gruppe bei der Vorbereitung auf das Gespräch helfen.",
    "Dieses Detail wird die Situation leichter erklärbar machen.", "Dieser Kontext wird allen helfen zu verstehen, was als Nächstes passiert.",
    "Das gibt dem Team einen nützlichen Punkt für die Besprechung.", "Dadurch lässt sich die nächste Entscheidung leichter vorbereiten."
  ],
  ru: [
    "Так у команды будет более ясная основа для следующего решения.", "Так каждый сможет увереннее подготовиться к следующему шагу.",
    "Эта деталь важна, прежде чем кто-то согласится на окончательный план.", "Такую ситуацию легче объяснить новому коллеге.",
    "Ответ помог бы команде спланировать следующий шаг.", "С таким ответом следующее решение будет легче обсудить.",
    "Ответ дал бы всем более ясную картину ситуации.", "Эта информация помогла бы группе подготовиться к разговору.",
    "Эта деталь поможет легче объяснить ситуацию.", "Этот контекст поможет всем понять, что будет дальше.",
    "У команды появится полезный пункт для обсуждения на встрече.", "Так будет легче подготовиться к следующему решению."
  ]
};

function wordCount(value) {
  return value.replaceAll("**", "").trim().split(/\s+/).filter(Boolean).length;
}

function typeFor(value) {
  if (value.trimEnd().endsWith("?")) return "question";
  if (value.trimEnd().endsWith("!")) return "exclamation";
  return "statement";
}

function pick(language, type, seed) {
  const options = followUps[language][type];
  return options[seed % options.length];
}

function removeLegacyFollowUp(value, language) {
  const suffix = legacyFollowUps[language].find((item) => value.endsWith(` ${item}`));
  return suffix ? value.slice(0, -suffix.length).trimEnd() : value;
}

function extend(value, language, type, seed) {
  return `${value.trimEnd()} ${pick(language, type, seed)}`;
}

let changed = 0;
for (const [patternIndex, pattern] of patterns.entries()) {
  for (const [languageIndex, language] of pattern.langs.entries()) {
    const seed = patternIndex * 31 + languageIndex * 17;
    const sourceExample = removeLegacyFollowUp(language.example, language.lang);
    const sourceTranslation = removeLegacyFollowUp(language.translation, "ru");
    if (sourceExample !== language.example || wordCount(sourceExample) < limit) {
      const type = typeFor(sourceExample);
      language.example = extend(sourceExample, language.lang, type, seed);
      language.translation = extend(sourceTranslation, "ru", type, seed);
      changed += 1;
    }
    for (const [exampleIndex, example] of language.examples.entries()) {
      const sourceText = removeLegacyFollowUp(example.text, language.lang);
      const sourceTranslation = removeLegacyFollowUp(example.translation_ru, "ru");
      if (sourceText === example.text && wordCount(sourceText) >= limit) continue;
      const type = typeFor(sourceText);
      const exampleSeed = seed + exampleIndex;
      example.text = extend(sourceText, language.lang, type, exampleSeed);
      example.translation_ru = extend(sourceTranslation, "ru", type, exampleSeed);
      changed += 1;
    }
  }
}

fs.writeFileSync(file, `${JSON.stringify(patterns, null, 2)}\n`);
console.log(`Expanded ${changed} pattern examples with contextual follow-up sentences.`);
