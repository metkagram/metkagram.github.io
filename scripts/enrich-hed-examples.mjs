import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "advanced-patterns.json");
const patterns = JSON.parse(fs.readFileSync(file, "utf8"));

function context(sentence, start, end) {
  const match = sentence.match(new RegExp(`${start}(.+?)${end}`));
  if (!match) throw new Error(`Cannot extract context from: ${sentence}`);
  return match[1];
}

const frames = {
  en: (value, verb) => [
    [`**It would be premature to conclude that ${value} ${verb} settled**, since key evidence is still missing.`, "Было бы преждевременно считать вопрос окончательно решённым: важной информации пока не хватает."],
    [`We should not yet treat **${value} as a settled matter**.`, "Мы не должны пока считать этот вопрос окончательно решённым."],
    [`Before making a final decision, we need to establish whether **${value} ${verb} actually settled**.`, "Прежде чем принимать окончательное решение, нужно выяснить, действительно ли вопрос уже решён."],
    [`The available information calls for caution; **it would be premature to conclude that ${value} ${verb} settled**.`, "Имеющаяся информация требует осторожности: было бы преждевременно считать вопрос окончательно решённым."],
    [`We can revisit the question when the remaining evidence is available; for now, **it would be premature to conclude that ${value} ${verb} settled**.`, "Мы сможем вернуться к вопросу, когда появится недостающая информация; пока же было бы преждевременно считать его окончательно решённым."],
    [`Even if the current position looks encouraging, **it would be premature to conclude that ${value} ${verb} settled**.`, "Даже если текущая ситуация выглядит обнадёживающе, было бы преждевременно считать вопрос окончательно решённым."],
    [`At this stage, **we cannot say that ${value} ${verb} settled**.`, "На этом этапе нельзя утверждать, что вопрос окончательно решён."],
    [`The evidence does not yet justify the claim that **${value} ${verb} settled**.`, "Данных пока недостаточно, чтобы утверждать, что вопрос окончательно решён."],
    [`Until the review is complete, **${value} should remain open to revision**.`, "Пока проверка не завершена, вопрос должен оставаться открытым для пересмотра."],
    [`Rather than presenting ${value} as final, we should describe it as **provisional**.`, "Вместо окончательного вывода стоит назвать текущий статус предварительным."],
    [`One promising update does not mean **${value} ${verb} settled**.`, "Одна обнадёживающая новость ещё не означает, что вопрос окончательно решён."],
    [`Let’s distinguish a working assumption from a final conclusion: **${value} ${verb} not settled yet**.`, "Важно отличать рабочее предположение от окончательного вывода: вопрос ещё не решён."]
  ],
  de: (value, accusative, verb, modal) => [
    [`**Es wäre verfrüht, daraus zu schließen, dass ${value} abschließend geklärt ${verb}**, weil noch wichtige Informationen fehlen.`, "Было бы преждевременно считать вопрос окончательно решённым: важной информации пока не хватает."],
    [`Wir sollten **${accusative} noch nicht als abschließend geklärt** behandeln.`, "Мы не должны пока считать этот вопрос окончательно решённым."],
    [`Bevor wir eine endgültige Entscheidung treffen, müssen wir klären, ob **${value} tatsächlich abschließend geklärt ${verb}**.`, "Прежде чем принимать окончательное решение, нужно выяснить, действительно ли вопрос уже решён."],
    [`Die vorliegenden Informationen mahnen zur Vorsicht; **es wäre verfrüht, daraus zu schließen, dass ${value} abschließend geklärt ${verb}**.`, "Имеющаяся информация требует осторожности: было бы преждевременно считать вопрос окончательно решённым."],
    [`Wir können die Frage erneut prüfen, wenn die fehlenden Informationen vorliegen; bis dahin **wäre es verfrüht, daraus zu schließen, dass ${value} abschließend geklärt ${verb}**.`, "Мы сможем вернуться к вопросу, когда появится недостающая информация; пока же было бы преждевременно считать его окончательно решённым."],
    [`Auch wenn der aktuelle Stand ermutigend ist, **wäre es verfrüht, daraus zu schließen, dass ${value} abschließend geklärt ${verb}**.`, "Даже если текущая ситуация выглядит обнадёживающе, было бы преждевременно считать вопрос окончательно решённым."],
    [`Zum jetzigen Zeitpunkt können wir nicht sagen, dass **${value} abschließend geklärt ${verb}**.`, "На этом этапе нельзя утверждать, что вопрос окончательно решён."],
    [`Die Belege reichen noch nicht aus, um zu behaupten, dass **${value} abschließend geklärt ${verb}**.`, "Данных пока недостаточно, чтобы утверждать, что вопрос окончательно решён."],
    [`Bis die Prüfung abgeschlossen ist, **${modal} ${value} offenbleiben**.`, "Пока проверка не завершена, вопрос должен оставаться открытым для пересмотра."],
    [`Statt ${accusative} als endgültig darzustellen, sollten wir den Stand als **vorläufig** bezeichnen.`, "Вместо окончательного вывода стоит назвать текущий статус предварительным."],
    [`Eine positive Entwicklung bedeutet noch nicht, dass **${value} abschließend geklärt ${verb}**.`, "Одна обнадёживающая новость ещё не означает, что вопрос окончательно решён."],
    [`Wir sollten zwischen einer Arbeitshypothese und einer endgültigen Schlussfolgerung unterscheiden: **${value} ${verb} noch nicht abschließend geklärt**.`, "Важно отличать рабочее предположение от окончательного вывода: вопрос ещё не решён."]
  ]
};

for (const pattern of patterns.filter((item) => item.set_id === "HED")) {
  const ruContext = pattern.title_ru.startsWith("Не спешить с выводами: ")
    ? pattern.title_ru.slice("Не спешить с выводами: ".length)
    : context(pattern.langs[0].translation, "Было бы преждевременно заключать, что ", " окончательно решён");
  pattern.title_ru = `Не спешить с выводами: ${ruContext}`;
  pattern.metaphor_ru = "Речевая задача: не выдавать промежуточные данные за окончательный вывод.";
  for (const lang of pattern.langs) {
    const englishMatch = lang.example.match(/^It would be premature to conclude that (.+?) (?:is|are) settled\.$/);
    const germanMatch = lang.example.match(/^Es wäre verfrüht, daraus zu schließen, dass (.+?) abschließend geklärt (?:ist|sind)\.$/);
    let value = lang.lang === "en"
      ? englishMatch?.[1]
      : germanMatch?.[1];
    if (!value) throw new Error(`Cannot extract context from: ${lang.example}`);
    if (lang.lang === "de") {
      value = value.replace(/^einen neuen /, "ein neuer ").replace(/^einen /, "ein ");
      lang.formula = lang.formula.replace(/\[(?:einen|eine|ein|das|die) (.+?)\]/, "[$1]");
    }
    const accusative = value.replace(/^ein neuer /, "einen neuen ").replace(/^ein /, "einen ");
    const verb = /findings|results/.test(value) ? "are" : "is";
    const deVerb = /^(die Forschungsergebnisse|die ersten Ergebnisse)/.test(value) ? "sind" : "ist";
    const deModal = deVerb === "sind" ? "sollten" : "sollte";
    lang.example = lang.lang === "en"
      ? `It would be premature to conclude that ${value} ${verb} settled.`
      : `Es wäre verfrüht, daraus zu schließen, dass ${value} abschließend geklärt ${deVerb}.`;
    lang.translation = "Было бы преждевременно считать вопрос окончательно решённым.";
    lang.examples = lang.lang === "en"
      ? frames.en(value, verb).map(([text, translation_ru]) => ({ text, translation_ru }))
      : frames.de(value, accusative, deVerb, deModal).map(([text, translation_ru]) => ({ text, translation_ru }));
  }
}

fs.writeFileSync(file, `${JSON.stringify(patterns, null, 2)}\n`);
