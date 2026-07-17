import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patternsFile = path.join(root, "data", "advanced-patterns.json");
const setsFile = path.join(root, "data", "study-sets.json");
const patterns = JSON.parse(fs.readFileSync(patternsFile, "utf8"));
const studySets = JSON.parse(fs.readFileSync(setsFile, "utf8"));

const contexts = [
  ["the team was reviewing the new policy", "das Team die neue Regelung prüfte", "команда проверяла новую политику"],
  ["the partners needed a clear decision", "die Partner eine klare Entscheidung brauchten", "партнёрам требовалось ясное решение"],
  ["the pilot was entering its final phase", "das Pilotprojekt in seine letzte Phase ging", "пилотный проект входил в заключительную фазу"],
  ["the available evidence was still incomplete", "die verfügbaren Belege noch unvollständig waren", "доступные данные всё ещё были неполными"],
  ["the timetable had changed at short notice", "der Zeitplan kurzfristig geändert worden war", "расписание изменили в последний момент"],
  ["the reviewers were comparing two alternatives", "die Gutachter zwei Alternativen verglichen", "эксперты сравнивали две альтернативы"],
  ["the participants were waiting for an explanation", "die Teilnehmenden auf eine Erklärung warteten", "участники ждали объяснения"],
  ["the revised process was being introduced", "das überarbeitete Verfahren eingeführt wurde", "обновлённый процесс внедряли"]
];

const sets = [
  {
    id: "DET", title_en: "Determiners and quantifiers", title_ru: "Определители и квантификаторы", description: "Make reference, quantity and scope precise.", description_ru: "Точно обозначайте предмет, количество и охват.",
    frames: [
      ["A careful choice of article makes the reference clear", "Eine sorgfältige Artikelwahl macht den Bezug eindeutig", "Точный выбор артикля делает отсылку понятной"],
      ["The information is detailed enough to support the conclusion", "Die Informationen sind detailliert genug, um die Schlussfolgerung zu stützen", "Информация достаточно подробна, чтобы подтвердить вывод"],
      ["Only a few of the objections concern the central issue", "Nur wenige der Einwände betreffen die zentrale Frage", "Лишь немногие возражения касаются главного вопроса"],
      ["Each of the alternatives has a practical advantage", "Jede der Alternativen hat einen praktischen Vorteil", "У каждой альтернативы есть практическое преимущество"],
      ["Neither proposal offers a complete solution", "Keiner der beiden Vorschläge bietet eine vollständige Lösung", "Ни одно из предложений не даёт полного решения"],
      ["Much of the progress depends on preparation", "Ein großer Teil des Fortschritts hängt von der Vorbereitung ab", "Большая часть прогресса зависит от подготовки"],
      ["Another explanation deserves consideration", "Eine weitere Erklärung verdient Beachtung", "Другое объяснение заслуживает рассмотрения"],
      ["The same principle applies to both cases", "Derselbe Grundsatz gilt für beide Fälle", "Один и тот же принцип действует в обоих случаях"]
    ]
  },
  {
    id: "INF", title_en: "Verb complements and non-finite clauses", title_ru: "Инфинитив, герундий и неличные конструкции", description: "Choose verb complements and condensed clauses accurately.", description_ru: "Точно выбирайте дополнения глагола и свёрнутые конструкции.",
    frames: [
      ["She agreed to revise the outline", "Sie erklärte sich bereit, den Entwurf zu überarbeiten", "Она согласилась доработать план"],
      ["We avoided making a premature promise", "Wir vermieden es, ein vorschnelles Versprechen zu geben", "Мы избежали поспешного обещания"],
      ["Having considered the alternatives, the committee chose to wait", "Nachdem der Ausschuss die Alternativen geprüft hatte, entschied er sich zu warten", "Рассмотрев альтернативы, комитет решил подождать"],
      ["The report is difficult to interpret without further data", "Der Bericht ist ohne weitere Daten schwer zu interpretieren", "Отчёт трудно интерпретировать без дополнительных данных"],
      ["To clarify the issue, the team scheduled a meeting", "Um die Frage zu klären, setzte das Team ein Treffen an", "Чтобы прояснить вопрос, команда назначила встречу"],
      ["They were expected to respond by Friday", "Von ihnen wurde erwartet, bis Freitag zu antworten", "От них ожидали ответа к пятнице"],
      ["Instead of postponing the decision, we revised the plan", "Statt die Entscheidung zu verschieben, überarbeiteten wir den Plan", "Вместо переноса решения мы пересмотрели план"],
      ["The manager let the team test the new process", "Die Leitung ließ das Team den neuen Prozess testen", "Руководитель дал команде протестировать новый процесс"]
    ]
  },
  {
    id: "SUB", title_en: "Subordinate and complement clauses", title_ru: "Придаточные и изъяснительные конструкции", description: "Build multi-clause reasoning with clear dependencies.", description_ru: "Стройте сложные высказывания с ясными зависимостями.",
    frames: [
      ["Although the evidence is limited, the trend is consistent", "Obwohl die Belege begrenzt sind, ist der Trend eindeutig", "Хотя данные ограничены, тенденция остаётся устойчивой"],
      ["Once the review has finished, we can publish the results", "Nachdem die Prüfung abgeschlossen ist, können wir die Ergebnisse veröffentlichen", "Когда проверка завершится, мы сможем опубликовать результаты"],
      ["The question is whether the change will last", "Die Frage ist, ob die Änderung Bestand haben wird", "Вопрос в том, сохранится ли это изменение"],
      ["What matters is that everyone understands the reason", "Entscheidend ist, dass alle den Grund verstehen", "Главное, чтобы все понимали причину"],
      ["Whereas the first option saves time, the second reduces risk", "Während die erste Option Zeit spart, verringert die zweite das Risiko", "Первая альтернатива экономит время, а вторая снижает риск"],
      ["The team acted as if the deadline were fixed", "Das Team handelte, als ob der Termin feststünde", "Команда действовала так, будто срок был окончательным"],
      ["Provided that the data remain secure, the pilot may continue", "Vorausgesetzt, dass die Daten sicher bleiben, kann das Pilotprojekt fortgesetzt werden", "При условии сохранности данных пилот можно продолжить"],
      ["The result depends on how the evidence is interpreted", "Das Ergebnis hängt davon ab, wie die Belege ausgelegt werden", "Результат зависит от того, как интерпретируют данные"]
    ]
  },
  {
    id: "FCS", title_en: "Focus, inversion and emphasis", title_ru: "Фокус, инверсия и эмфаза", description: "Bring the key part of a message into focus.", description_ru: "Выделяйте ключевую часть сообщения.",
    frames: [
      ["Rarely have we seen such a clear improvement", "Selten haben wir eine so deutliche Verbesserung gesehen", "Мы редко видели столь явное улучшение"],
      ["Only after the review did the problem become visible", "Erst nach der Prüfung wurde das Problem sichtbar", "Лишь после проверки проблема стала заметна"],
      ["What the proposal needs is a realistic timetable", "Was der Vorschlag braucht, ist ein realistischer Zeitplan", "Предложению нужен реалистичный график"],
      ["It was the lack of evidence that changed the decision", "Es war der Mangel an Belegen, der die Entscheidung veränderte", "Именно нехватка данных изменила решение"],
      ["Not only did the team identify the risk, but it also reduced it", "Das Team erkannte nicht nur das Risiko, sondern verringerte es auch", "Команда не только выявила риск, но и снизила его"],
      ["Under no circumstances should the data be shared", "Unter keinen Umständen dürfen die Daten weitergegeben werden", "Данные нельзя передавать ни при каких обстоятельствах"],
      ["The point I want to stress is the need for patience", "Was ich betonen möchte, ist die Notwendigkeit von Geduld", "Я хочу подчеркнуть необходимость терпения"],
      ["So important was the timing that the launch was delayed", "Der Zeitpunkt war so wichtig, dass der Start verschoben wurde", "Сроки были настолько важны, что запуск перенесли"]
    ]
  },
  {
    id: "REL", title_en: "Relative and participial clauses", title_ru: "Относительные и причастные конструкции", description: "Add precise information without losing the main clause.", description_ru: "Добавляйте точную информацию, сохраняя главную мысль.",
    frames: [
      ["The report, which was revised yesterday, now needs approval", "Der Bericht, der gestern überarbeitet wurde, benötigt nun eine Genehmigung", "Отчёт, который вчера доработали, теперь требует утверждения"],
      ["People working on the pilot need clear guidance", "Die Personen, die am Pilotprojekt arbeiten, brauchen klare Orientierung", "Людям, работающим над пилотом, нужны ясные ориентиры"],
      ["The concerns raised by the reviewers were addressed", "Die von den Gutachtern geäußerten Bedenken wurden berücksichtigt", "Замечания экспертов были учтены"],
      ["The colleague whose proposal we adopted will lead the next phase", "Die Kollegin, deren Vorschlag wir übernommen haben, wird die nächste Phase leiten", "Коллега, чьё предложение мы приняли, возглавит следующий этап"],
      ["This is the principle by which we assess the options", "Dies ist der Grundsatz, nach dem wir die Optionen bewerten", "Это принцип, по которому мы оцениваем варианты"],
      ["The team found a solution that could be implemented quickly", "Das Team fand eine Lösung, die schnell umgesetzt werden konnte", "Команда нашла решение, которое можно быстро внедрить"],
      ["Having been informed of the change, the partners adjusted their plans", "Nachdem die Partner über die Änderung informiert worden waren, passten sie ihre Pläne an", "Узнав об изменении, партнёры скорректировали свои планы"],
      ["The document contains a section outlining the main risks", "Das Dokument enthält einen Abschnitt, der die Hauptrisiken darlegt", "Документ содержит раздел с основными рисками"]
    ]
  },
  {
    id: "PRP", title_en: "Prepositions and governed complements", title_ru: "Предлоги и управление", description: "Use the complements that verbs, nouns and adjectives require.", description_ru: "Используйте дополнения, которые требуют глаголы, существительные и прилагательные.",
    frames: [
      ["She insisted on discussing the issue openly", "Sie bestand darauf, die Frage offen zu besprechen", "Она настояла на открытом обсуждении вопроса"],
      ["The outcome depends on how carefully we prepare", "Das Ergebnis hängt davon ab, wie sorgfältig wir uns vorbereiten", "Результат зависит от того, насколько тщательно мы подготовимся"],
      ["We succeeded in reaching an agreement", "Es gelang uns, eine Einigung zu erzielen", "Нам удалось достичь соглашения"],
      ["They objected to changing the terms at short notice", "Sie wandten sich dagegen, die Bedingungen kurzfristig zu ändern", "Они возразили против изменения условий в последний момент"],
      ["The proposal differs from the earlier version in one respect", "Der Vorschlag unterscheidet sich in einem Punkt von der früheren Fassung", "Предложение отличается от предыдущей версии в одном аспекте"],
      ["He is responsible for ensuring that the data are accurate", "Er ist dafür verantwortlich, dass die Daten korrekt sind", "Он отвечает за точность данных"],
      ["We need to focus on what can be improved", "Wir müssen uns auf das konzentrieren, was verbessert werden kann", "Нам нужно сосредоточиться на том, что можно улучшить"],
      ["The decision resulted in a more transparent process", "Die Entscheidung führte zu einem transparenteren Verfahren", "Решение привело к более прозрачному процессу"]
    ]
  },
  {
    id: "WOR", title_en: "Word order and verb position", title_ru: "Порядок слов и позиция глагола", description: "Control sentence structure across statements, questions and clauses.", description_ru: "Управляйте структурой утверждений, вопросов и придаточных.",
    frames: [
      ["The team has already sent the revised draft to the partners", "Das Team hat den überarbeiteten Entwurf bereits an die Partner geschickt", "Команда уже отправила партнёрам обновлённый черновик"],
      ["Because the evidence was incomplete, we postponed the decision", "Weil die Belege unvollständig waren, verschoben wir die Entscheidung", "Поскольку данных не хватало, мы отложили решение"],
      ["She said that the report had been checked twice", "Sie sagte, dass der Bericht zweimal geprüft worden sei", "Она сказала, что отчёт проверили дважды"],
      ["We will discuss the proposal tomorrow in the meeting", "Wir werden den Vorschlag morgen in der Sitzung besprechen", "Завтра мы обсудим предложение на встрече"],
      ["Had we known the risk, we would have acted earlier", "Hätten wir das Risiko gekannt, hätten wir früher gehandelt", "Если бы мы знали о риске, мы бы действовали раньше"],
      ["The question is why the process has become so slow", "Die Frage ist, warum das Verfahren so langsam geworden ist", "Вопрос в том, почему процесс стал таким медленным"],
      ["Before the meeting ends, the chair will summarise the decision", "Bevor die Sitzung endet, wird die Leitung die Entscheidung zusammenfassen", "До конца встречи ведущий подведёт итог решения"],
      ["The team wants to know whether the plan can still work", "Das Team möchte wissen, ob der Plan noch funktionieren kann", "Команда хочет понять, может ли план ещё сработать"]
    ]
  },
  {
    id: "CAS", title_en: "Cases and nominal agreement", title_ru: "Падежи и согласование в именной группе", description: "Keep roles and agreement clear inside the noun phrase.", description_ru: "Сохраняйте ясность ролей и согласования в именной группе.",
    frames: [
      ["She gave the new colleague a detailed explanation", "Sie gab der neuen Kollegin eine ausführliche Erklärung", "Она дала новой коллеге подробное объяснение"],
      ["The committee considered the proposal carefully", "Der Ausschuss prüfte den Vorschlag sorgfältig", "Комитет внимательно рассмотрел предложение"],
      ["We spoke with the person responsible for the archive", "Wir sprachen mit der Person, die für das Archiv verantwortlich ist", "Мы поговорили с человеком, ответственным за архив"],
      ["The success of the project depends on reliable coordination", "Der Erfolg des Projekts hängt von einer verlässlichen Koordination ab", "Успех проекта зависит от надёжной координации"],
      ["They informed the participants about the revised procedure", "Sie informierten die Teilnehmenden über das überarbeitete Verfahren", "Они сообщили участникам об обновлённой процедуре"],
      ["The manager thanked the team for its work", "Die Leitung dankte dem Team für seine Arbeit", "Руководитель поблагодарил команду за работу"],
      ["This decision affects everyone involved", "Diese Entscheidung betrifft alle Beteiligten", "Это решение касается всех участников"],
      ["The proposal was developed with the support of the advisers", "Der Vorschlag wurde mit Unterstützung der Berater entwickelt", "Предложение разработали при поддержке консультантов"]
    ]
  },
  {
    id: "ADJ", title_en: "Adjectives and comparison", title_ru: "Прилагательные и сравнение", description: "Describe, compare and qualify with accurate noun phrases.", description_ru: "Точно описывайте, сравнивайте и уточняйте именные группы.",
    frames: [
      ["A more transparent process would be easier to explain", "Ein transparenteres Verfahren wäre leichter zu erklären", "Более прозрачный процесс было бы легче объяснить"],
      ["The most useful option is not always the fastest one", "Die nützlichste Option ist nicht immer die schnellste", "Самый полезный вариант не всегда самый быстрый"],
      ["We need a reliable method for complex cases", "Wir brauchen eine verlässliche Methode für komplexe Fälle", "Нам нужен надёжный метод для сложных случаев"],
      ["The revised plan contains several important changes", "Der überarbeitete Plan enthält mehrere wichtige Änderungen", "Обновлённый план содержит несколько важных изменений"],
      ["Her explanation was clearer than the original note", "Ihre Erklärung war klarer als die ursprüngliche Notiz", "Её объяснение было яснее исходной заметки"],
      ["Such a small change can have significant effects", "Eine so kleine Änderung kann erhebliche Auswirkungen haben", "Такое небольшое изменение может иметь значительные последствия"],
      ["They chose the least risky alternative", "Sie wählten die am wenigsten riskante Alternative", "Они выбрали наименее рискованную альтернативу"],
      ["The data provide a more complete picture of the situation", "Die Daten vermitteln ein vollständigeres Bild der Situation", "Данные дают более полную картину ситуации"]
    ]
  },
  {
    id: "KON", title_en: "Mood, modality and reported stance", title_ru: "Наклонение, модальность и передача позиции", description: "Express possibility, recommendation and reported judgement precisely.", description_ru: "Точно выражайте возможность, рекомендацию и переданную позицию.",
    frames: [
      ["If the evidence were stronger, we could decide today", "Wenn die Belege überzeugender wären, könnten wir heute entscheiden", "Если бы данные были убедительнее, мы могли бы решить сегодня"],
      ["I wish the process were less complicated", "Ich wünschte, das Verfahren wäre weniger kompliziert", "Хотелось бы, чтобы процесс был менее сложным"],
      ["She said she would review the material later", "Sie sagte, sie werde das Material später prüfen", "Она сказала, что позже проверит материал"],
      ["The chair recommended that the team reconsider the timetable", "Die Leitung empfahl dem Team, den Zeitplan noch einmal zu prüfen", "Ведущий рекомендовал команде ещё раз рассмотреть график"],
      ["It is essential that every participant be informed", "Es ist entscheidend, dass alle Teilnehmenden informiert werden", "Крайне важно, чтобы все участники были проинформированы"],
      ["Had the team acted earlier, the delay might have been avoided", "Hätte das Team früher gehandelt, hätte die Verzögerung vielleicht vermieden werden können", "Если бы команда действовала раньше, задержки можно было бы избежать"],
      ["He seems to have misunderstood the instruction", "Er scheint die Anweisung missverstanden zu haben", "Похоже, он неверно понял инструкцию"],
      ["The report is said to contain a useful recommendation", "Der Bericht soll eine hilfreiche Empfehlung enthalten", "Говорят, что в отчёте есть полезная рекомендация"]
    ]
  }
];

function sentence(base, context, lang) {
  const suffix = lang === "en"
    ? ` in a situation where ${context}.`
    : lang === "de"
      ? ` in einem Zusammenhang, in dem ${context}.`
      : ` в ситуации, где ${context}.`;
  return `${base}${suffix}`;
}

const existingIds = new Set(patterns.map((pattern) => pattern.id));
for (const set of sets) {
  if (studySets.sets.some((item) => item.id === set.id)) throw new Error(`Study set ${set.id} already exists`);
  studySets.sets.push({ id: set.id, title_en: set.title_en, title_ru: set.title_ru, description: set.description, description_ru: set.description_ru, level: "B2–C1", path: set.id });
  set.frames.forEach(([enBase, deBase, ruBase], frameIndex) => {
    for (let focusIndex = 0; focusIndex < 5; focusIndex += 1) {
      const id = `GRM${set.id}${String(frameIndex * 5 + focusIndex + 1).padStart(3, "0")}`;
      if (existingIds.has(id)) throw new Error(`Pattern ${id} already exists`);
      const focus = contexts[focusIndex];
      const langs = ["en", "de"].map((lang) => {
        const base = lang === "en" ? enBase : deBase;
        const example = sentence(base, focus[lang === "en" ? 0 : 1], lang);
        return {
          lang,
          formula: `${base} [${lang === "en" ? focus[0] : focus[1]}]`,
          example,
          translation: sentence(ruBase, focus[2], "ru"),
          examples: contexts.map((context) => ({
            text: `**${sentence(base, context[lang === "en" ? 0 : 1], lang)}**`,
            translation_ru: sentence(ruBase, context[2], "ru")
          }))
        };
      });
      patterns.push({
        id, group_id: set.id, set_id: set.id,
        title_ru: ruBase,
        metaphor_ru: `Грамматическая задача: выбрать конструкцию «${ruBase.toLowerCase()}» в живом контексте.`,
        langs,
        formulas: langs.map((lang) => lang.formula),
        gen: { status: "curated", iterations: 1, lastGeneratedAt: "2026-07-17T00:00:00.000Z", languages: ["en", "de"], notes: `Grammar pattern: ${set.title_en}.` }
      });
      existingIds.add(id);
    }
  });
}

studySets.learningPaths.push({ id: "C1-GRAMMAR", title_en: "Grammar in use", title_ru: "Грамматика в речи", set_ids: sets.map((set) => set.id) });
fs.writeFileSync(patternsFile, `${JSON.stringify(patterns, null, 2)}\n`);
fs.writeFileSync(setsFile, `${JSON.stringify(studySets, null, 2)}\n`);
console.log(`Added ${sets.length * 40} grammatical patterns across ${sets.length} study sets.`);
