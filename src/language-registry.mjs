// Canonical language capability registry.
//
// Language roles are deliberately independent:
// - interface: navigation and explanatory UI can be rendered in this locale;
// - learning: the language can be studied as a target language;
// - translation: learner-facing translations can be requested in this locale;
// - annotation: reviewed Metkagram sentence annotation exists for this language.
//
// Do not infer one role from another. A future target language may have Frames and
// translations before it has an annotation profile or a localized interface.

export const languageRegistry = Object.freeze({
  en: Object.freeze({
    code: "en",
    slug: "english",
    nativeName: "English",
    direction: "ltr",
    roles: Object.freeze({ interface: true, learning: true, translation: false, annotation: true }),
  }),
  de: Object.freeze({
    code: "de",
    slug: "german",
    nativeName: "Deutsch",
    direction: "ltr",
    roles: Object.freeze({ interface: false, learning: true, translation: false, annotation: true }),
  }),
  ru: Object.freeze({
    code: "ru",
    slug: "russian",
    nativeName: "Русский",
    direction: "ltr",
    roles: Object.freeze({ interface: true, learning: false, translation: true, annotation: false }),
  }),
});

function codesFor(role) {
  return Object.values(languageRegistry)
    .filter((language) => language.roles[role])
    .map((language) => language.code);
}

export const interfaceLocales = Object.freeze(codesFor("interface"));
export const learningLanguages = Object.freeze(codesFor("learning"));
export const translationLocales = Object.freeze(codesFor("translation"));
export const annotationLanguages = Object.freeze(codesFor("annotation"));

export function getLanguage(code) {
  return languageRegistry[code] || null;
}

export function getLanguageBySlug(slug) {
  return Object.values(languageRegistry).find((language) => language.slug === slug) || null;
}

// Compatibility helper for the current dataset while translations migrate from
// translation_ru to translations: { ru: "...", ... }.
export function getTranslation(record, locale) {
  if (!record || !locale) return null;
  return record.translations?.[locale] ?? record[`translation_${locale}`] ?? null;
}

export function publicLanguageMatrix() {
  return {
    schemaVersion: 1,
    interfaceLocales,
    learningLanguages,
    translationLocales,
    annotationLanguages,
    languages: Object.fromEntries(Object.entries(languageRegistry).map(([code, language]) => [code, {
      code: language.code,
      slug: language.slug,
      nativeName: language.nativeName,
      direction: language.direction,
      roles: language.roles,
    }])),
  };
}
