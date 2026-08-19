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

function codesFor(role, registry = languageRegistry) {
  return Object.values(registry)
    .filter((language) => language.roles?.[role])
    .map((language) => language.code);
}

export const interfaceLocales = Object.freeze(codesFor("interface"));
export const learningLanguages = Object.freeze(codesFor("learning"));
export const translationLocales = Object.freeze(codesFor("translation"));
export const annotationLanguages = Object.freeze(codesFor("annotation"));

export function getLanguage(code, registry = languageRegistry) {
  return registry[code] || null;
}

export function getLanguageBySlug(slug, registry = languageRegistry) {
  return Object.values(registry).find((language) => language.slug === slug) || null;
}

export function supportsLanguageRole(code, role, registry = languageRegistry) {
  return Boolean(registry[code]?.roles?.[role]);
}

// Canonical translation helper. New records should use translations: { locale: text }.
// During migration the public corpus also contains translation_ru and, inside
// language-realisation objects, a legacy translation field whose support locale is Russian.
export function normalizeTranslations(record, legacyLocale = "ru") {
  if (!record || typeof record !== "object") return {};
  const result = { ...(record.translations || {}) };
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith("translation_") || !value) continue;
    const locale = key.slice("translation_".length);
    if (locale && result[locale] == null) result[locale] = value;
  }
  if (legacyLocale && record.translation && result[legacyLocale] == null) {
    result[legacyLocale] = record.translation;
  }
  return result;
}

export function getTranslation(record, locale, legacyLocale = "ru") {
  if (!record || !locale) return null;
  return normalizeTranslations(record, legacyLocale)[locale] ?? null;
}

export function publicLanguageMatrix(registry = languageRegistry) {
  return {
    schemaVersion: 1,
    interfaceLocales: codesFor("interface", registry),
    learningLanguages: codesFor("learning", registry),
    translationLocales: codesFor("translation", registry),
    annotationLanguages: codesFor("annotation", registry),
    languages: Object.fromEntries(Object.entries(registry).map(([code, language]) => [code, {
      code: language.code,
      slug: language.slug,
      nativeName: language.nativeName,
      direction: language.direction,
      roles: language.roles,
    }])),
  };
}
