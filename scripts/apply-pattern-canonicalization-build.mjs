import fs from "node:fs";

const file = "scripts/build.mjs";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing expected build.mjs fragment:\n${before}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Expected exactly one build.mjs fragment:\n${before}`);
  source = source.replace(before, after);
}

replaceOnce(
  'import { ANNOTATION_SCHEMA_VERSION, cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";\n',
  'import { ANNOTATION_SCHEMA_VERSION, cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";\nimport { canonicalPracticePatterns, loadPatternAliases, patternAliasEntries } from "../src/pattern-aliases.mjs";\n',
);

replaceOnce(
  '  const content = loadContent();\n  const patternAnnotations = loadPatternAnnotations(content);\n',
  '  const content = loadContent();\n  const patternAliases = loadPatternAliases();\n  const practicePatterns = canonicalPracticePatterns(content.advancedPatterns, patternAliases);\n  const publishedContent = { ...content, advancedPatterns: practicePatterns };\n  const patternAliasRecords = patternAliasEntries(patternAliases);\n  const patternAnnotations = loadPatternAnnotations(content);\n',
);

replaceOnce(
  '  const counts = contentCounts(content);\n  const api = buildApi(content, counts);\n  api.files["/api/v1/search-index.json"] = buildCompleteSearchIndex(content);\n',
  '  const counts = contentCounts(publishedContent);\n  const api = buildApi(content, contentCounts(content));\n  api.files["/api/v1/search-index.json"] = buildCompleteSearchIndex(publishedContent);\n',
);

replaceOnce('    writeRoute(`/${locale}/`, localeHome(locale, content));\n', '    writeRoute(`/${locale}/`, localeHome(locale, publishedContent));\n');
replaceOnce('    writeRoute(`/${locale}/explore/`, explorePage(locale, content));\n', '    writeRoute(`/${locale}/explore/`, explorePage(locale, publishedContent));\n');
replaceOnce('    writeRoute(`/${locale}/practice/`, practicePage(locale, content.advancedPatterns, content.studySets));\n', '    writeRoute(`/${locale}/practice/`, practicePage(locale, practicePatterns, content.studySets));\n');

replaceOnce(
  '    for (const pattern of content.advancedPatterns) {\n      const patternHtml = patternPage(locale, pattern, patternAnnotations);\n      writeRoute(patternPath(locale, pattern), patternHtml, pattern.gen?.lastGeneratedAt || SITE_RELEASE_DATE);\n      writeLegacyRedirect(legacyPatternPath(locale, pattern), patternPath(locale, pattern), patternHtml);\n    }\n',
  '    const canonicalPatternHtml = new Map();\n    const canonicalPatternById = new Map(practicePatterns.map((pattern) => [pattern.id, pattern]));\n    for (const pattern of practicePatterns) {\n      const patternHtml = patternPage(locale, pattern, patternAnnotations);\n      canonicalPatternHtml.set(pattern.id, patternHtml);\n      writeRoute(patternPath(locale, pattern), patternHtml, pattern.gen?.lastGeneratedAt || SITE_RELEASE_DATE);\n      writeLegacyRedirect(legacyPatternPath(locale, pattern), patternPath(locale, pattern), patternHtml);\n    }\n    for (const alias of patternAliasRecords) {\n      const canonicalPattern = canonicalPatternById.get(alias.canonical_id);\n      const canonicalHtml = canonicalPatternHtml.get(alias.canonical_id);\n      if (!canonicalPattern || !canonicalHtml) throw new Error(`Pattern alias ${alias.alias_id} points to missing canonical ${alias.canonical_id}`);\n      const destination = patternPath(locale, canonicalPattern);\n      writeLegacyRedirect(patternPath(locale, alias.alias_id), destination, canonicalHtml);\n      writeLegacyRedirect(legacyPatternPath(locale, alias.alias_id), destination, canonicalHtml);\n    }\n',
);

replaceOnce(
  '      const setHtml = studySetPage(locale, set, content.advancedPatterns.filter((pattern) => pattern.set_id === set.id));\n',
  '      const setHtml = studySetPage(locale, set, practicePatterns.filter((pattern) => pattern.set_id === set.id));\n',
);
replaceOnce('    writeRoute(`/${locale}/ai/`, aiPage(locale, content, counts, api.routes));\n', '    writeRoute(`/${locale}/ai/`, aiPage(locale, publishedContent, counts, api.routes));\n');
replaceOnce('  writeFile("llms.txt", buildLlmsTxt(content, counts));\n', '  writeFile("llms.txt", buildLlmsTxt(publishedContent, counts));\n');
replaceOnce('  writeFile("data/advanced-patterns.json", `${JSON.stringify(content.advancedPatterns)}\\n`);\n', '  writeFile("data/advanced-patterns.json", `${JSON.stringify(practicePatterns)}\\n`);\n  writeFile("data/pattern-aliases.json", `${JSON.stringify(patternAliases, null, 2)}\\n`);\n');
replaceOnce('  writeFile("data/quality-report.json", `${JSON.stringify(buildQualityReport(content), null, 2)}\\n`);\n', '  writeFile("data/quality-report.json", `${JSON.stringify(buildQualityReport(publishedContent), null, 2)}\\n`);\n');
replaceOnce('  writeFile("data/reasoning-frames/index.json", `${JSON.stringify(buildReasoningIndex(content), null, 2)}\\n`);\n', '  writeFile("data/reasoning-frames/index.json", `${JSON.stringify(buildReasoningIndex(publishedContent), null, 2)}\\n`);\n');
replaceOnce('  const catalog = buildCatalog(content, counts);\n', '  const catalog = buildCatalog(publishedContent, counts);\n');

fs.writeFileSync(file, source);
console.log("Applied structural Pattern canonicalization to scripts/build.mjs.");
