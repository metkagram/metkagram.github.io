import { MetkagramSampleLanguage } from "./sampleDocuments";

export const englishAllowedTags = [
  "S",
  "S*",
  "st",
  "st*",
  "v2",
  "p2",
  "vI",
  "vP",
  "Vp",
  "Hr",
  "Hst",
  "pA",
  "pS",
  "Hf",
  "V",
] as const;

export const germanAllowedTags = [
  "S",
  "S*",
  "st",
  "st*",
  "v2",
  "vI",
  "/→",
  "\\→",
  "\\?",
  "←...",
  "vP",
  "Vp",
  "Hr",
  "Hst",
  "Hf",
  "V",
  "M",
] as const;

const englishTagSet = new Set<string>(englishAllowedTags);
const germanTagSet = new Set<string>(germanAllowedTags);

export const getAllowedTagSet = (language: string) => {
  if (language.toLowerCase().startsWith("de")) {
    return germanTagSet;
  }

  return englishTagSet;
};

export type TagRule = {
  tag: string;
  title: string;
  description: string;
  extra?: string;
};

export const tagRules: Record<MetkagramSampleLanguage, TagRule[]> = {
  en: [
    {
      tag: "S",
      title: "Subject",
      description: "Marks the subject — the main actor or receiver in the sentence.",
    },
    {
      tag: "S*",
      title: "Subject (highlighted)",
      description: "Subject tag with emphasis, usually used in trainer prompts.",
    },
    {
      tag: "st",
      title: "State",
      description: "Indicates a condition or state in the sentence.",
    },
    {
      tag: "st*",
      title: "Passive state",
      description: "State marker used for passive voice or emphasized conditions.",
    },
    {
      tag: "v2",
      title: "Second verb",
      description: "Secondary verb that pairs with a helper verb to add detail.",
    },
    {
      tag: "p2",
      title: "Predicate",
      description: "Predicate details that connect back to the main subject.",
    },
    {
      tag: "vI",
      title: "Infinitive verb",
      description: "Verb in infinitive form, showing intent or potential action.",
    },
    {
      tag: "vP",
      title: "Verb participle",
      description: "Participle element that works with helpers to form tenses.",
    },
    {
      tag: "Vp",
      title: "Verb participle (alt.)",
      description: "Alternative participle marker used in some templates.",
    },
    {
      tag: "Hr",
      title: "Result helper",
      description: "Helper verb showing completed actions or achievements.",
    },
    {
      tag: "Hst",
      title: "State helper",
      description: "Helper verb emphasizing ongoing states or conditions.",
    },
    {
      tag: "pA",
      title: "Placeholder (A)",
      description: "Layout placeholder used inside certain rule renderings.",
    },
    {
      tag: "pS",
      title: "Placeholder (S)",
      description: "Secondary placeholder used by the TagShaped factory.",
    },
    {
      tag: "Hf",
      title: "Future helper",
      description: "Helper verb that projects an action into the future.",
    },
    {
      tag: "V",
      title: "Main verb",
      description: "Primary verb showing the action or state.",
    },
  ],
  de: [
    {
      tag: "S",
      title: "Subjekt",
      description: "Markiert das Subjekt — die handelnde oder betroffene Person.",
    },
    {
      tag: "S*",
      title: "Subjekt (betont)",
      description: "Variante des Subjekts mit zusätzlicher Hervorhebung.",
    },
    {
      tag: "st",
      title: "Zustand",
      description: "Kennzeichnet Zustände oder Bedingungen.",
    },
    {
      tag: "st*",
      title: "Passiver Zustand",
      description: "Zustandsmarker für Passivkonstruktionen.",
    },
    {
      tag: "v2",
      title: "Zweites Verb",
      description: "Verbteile, die im Deutschen oft an zweiter Position stehen.",
    },
    {
      tag: "vI",
      title: "Infinitiv",
      description: "Infinitiver Verbteil, der Absichten oder Möglichkeiten zeigt.",
    },
    {
      tag: "/→",
      title: "Akkusativ",
      description: "Markiert das direkte Objekt (wen/was?).",
    },
    {
      tag: "\\→",
      title: "Dativ",
      description: "Markiert das indirekte Objekt (wem/wofür?).",
    },
    {
      tag: "\\?",
      title: "Genitiv",
      description: "Kennzeichnet Besitz oder Zugehörigkeit (wessen?).",
    },
    {
      tag: "←...",
      title: "Inversion",
      description: "Zeigt Satzumstellungen, z. B. nach Konjunktionen.",
    },
    {
      tag: "vP",
      title: "Partizip",
      description: "Partizipiale Verbteile für zusammengesetzte Zeiten.",
    },
    {
      tag: "Vp",
      title: "Partizip (alt.)",
      description: "Alternative Partizip-Notation für bestimmte Regeln.",
    },
    {
      tag: "Hr",
      title: "Hilfsverb Resultat",
      description: "Hilfsverb, das ein abgeschlossenes Ergebnis hervorhebt.",
    },
    {
      tag: "Hst",
      title: "Hilfsverb Zustand",
      description: "Hilfsverb für Zustandsveränderungen mit „sein“. ",
    },
    {
      tag: "Hf",
      title: "Hilfsverb Zukunft",
      description: "Hilfsverb wie „werden“, das in die Zukunft verweist.",
    },
    {
      tag: "V",
      title: "Hauptverb",
      description: "Das grundlegende Verb der Aussage.",
    },
    {
      tag: "M",
      title: "Modalverb",
      description: "Modalverben wie „können“ oder „müssen“ für Fähigkeit oder Pflicht.",
    },
  ],
};
