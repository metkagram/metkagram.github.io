import { collectionKeys, targetMeta } from "./i18n.mjs";
import { wrapList } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";

const API_URL = `${SITE_URL}/api/v1`;

function patternPageUrl(id, locale = "en") {
  return `${SITE_URL}/${locale}/practice/${id.toLowerCase()}/`;
}

function setPageUrl(id, locale = "en") {
  return `${SITE_URL}/${locale}/practice/set/${id.toLowerCase()}/`;
}

function documentPageUrl(targetKey, collectionKey, id, locale = "en") {
  return `${SITE_URL}/${locale}/explore/${targetKey}/${collectionKey}/${id}/`;
}

function patternSummary(pattern) {
  return {
    id: pattern.id,
    title_ru: pattern.title_ru,
    group_id: pattern.group_id,
    set_id: pattern.set_id,
    formulas: pattern.formulas || pattern.langs.map((lang) => lang.formula),
    languages: pattern.langs.map((lang) => lang.lang),
    reasoning_move: pattern.reasoning?.move || null,
    quality: pattern.quality || null,
    canonical_url: patternPageUrl(pattern.id),
    api_url: `${API_URL}/patterns/${pattern.id.toLowerCase()}.json`,
  };
}

export function buildCompleteSearchIndex(content) {
  const patterns = content.advancedPatterns.map(patternSummary);
  const sets = content.studySets.sets.map((set) => {
    const setPatterns = content.advancedPatterns.filter((pattern) => pattern.set_id === set.id);
    return {
      id: set.id,
      title_en: set.title_en,
      title_ru: set.title_ru,
      description: set.description,
      level: set.level,
      path: set.path,
      pattern_count: setPatterns.length,
      canonical_url: setPageUrl(set.id),
      api_url: `${API_URL}/sets/${set.id.toLowerCase()}.json`,
    };
  });
  const groups = [...new Set(content.advancedPatterns.map((pattern) => pattern.group_id))].sort();
  const categories = groups.map((groupId) => {
    const groupPatterns = content.advancedPatterns.filter((pattern) => pattern.group_id === groupId);
    return {
      id: groupId,
      pattern_count: groupPatterns.length,
      set_ids: [...new Set(groupPatterns.map((pattern) => pattern.set_id))].sort(),
      api_url: `${API_URL}/categories/${groupId.toLowerCase()}.json`,
    };
  });
  const documents = [];
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      for (const document of content.collections[target.key][collectionKey].documents) {
        documents.push({
          id: document.id,
          title: document.title,
          language: document.language,
          target_language: target.dataKey,
          collection: collectionKey,
          annotation_count: document.annotations.length,
          canonical_url: documentPageUrl(target.key, collectionKey, document.id),
          api_url: `${API_URL}/annotations/${target.dataKey}/${collectionKey}/${document.id}.json`,
        });
      }
    }
  }
  const data = { patterns, sets, categories, documents };
  return `${JSON.stringify(wrapList(data, { canonical_url: `${API_URL}/search-index.json`, record_type: "search_index" }), null, 2)}\n`;
}
