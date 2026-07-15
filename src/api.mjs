import { SITE_URL } from "./site.mjs";
import { collectionKeys, targetMeta, ui } from "./i18n.mjs";
import { ATTRIBUTION, getDatasetVersion, getReleaseDate, provenance, stableHash, wrapList, wrapRecord } from "./provenance.mjs";

const API_BASE = "/api/v1";
const API_URL = `${SITE_URL}${API_BASE}`;
const PAGE_SIZE = 100;

function apiPath(path) {
  return `${API_BASE}${path}`;
}

function apiUrl(path) {
  return `${API_URL}${path}`;
}

function patternPageUrl(id, locale = "en") {
  return `${SITE_URL}/${locale}/practice/${id.toLowerCase()}/`;
}

function setPageUrl(id, locale = "en") {
  return `${SITE_URL}/${locale}/practice/set/${id.toLowerCase()}/`;
}

function documentPageUrl(targetKey, collectionKey, id, locale = "en") {
  return `${SITE_URL}/${locale}/explore/${targetKey}/${collectionKey}/${id}/`;
}

function makePagination({ total, page, perPage, pathPrefix }) {
  const totalPages = Math.ceil(total / perPage);
  const pageUrl = (n) => apiUrl(`${pathPrefix}/page/${n}.json`);
  return {
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
    first: pageUrl(1),
    last: pageUrl(totalPages),
    prev: page > 1 ? pageUrl(page - 1) : null,
    next: page < totalPages ? pageUrl(page + 1) : null,
  };
}

function patternSummary(pattern) {
  const en = pattern.langs.find((l) => l.lang === "en");
  const de = pattern.langs.find((l) => l.lang === "de");
  return {
    id: pattern.id,
    title_ru: pattern.title_ru,
    group_id: pattern.group_id,
    set_id: pattern.set_id,
    languages: pattern.langs.map((l) => l.lang),
    formula_en: en?.formula || null,
    formula_de: de?.formula || null,
    canonical_url: patternPageUrl(pattern.id),
    page_urls: { en: patternPageUrl(pattern.id, "en"), ru: patternPageUrl(pattern.id, "ru") },
    api_url: apiUrl(`/patterns/${pattern.id.toLowerCase()}.json`),
  };
}

function patternLanguageRecord(pattern, langKey) {
  const lang = pattern.langs.find((l) => l.lang === langKey);
  if (!lang) return null;
  return {
    id: pattern.id,
    title_ru: pattern.title_ru,
    metaphor_ru: pattern.metaphor_ru,
    group_id: pattern.group_id,
    set_id: pattern.set_id,
    language: langKey,
    formula: lang.formula,
    example: lang.example,
    translation: lang.translation,
    examples: lang.examples,
    canonical_url: patternPageUrl(pattern.id),
  };
}

function buildPatternsApi(patterns, files, routes) {
  const sortedPatterns = [...patterns].sort((a, b) => a.id.localeCompare(b.id));
  const summaries = sortedPatterns.map(patternSummary);

  // Full dataset with per-record provenance
  const fullItems = sortedPatterns.map((pattern) =>
    wrapRecord(pattern, {
      canonical_url: patternPageUrl(pattern.id),
      record_type: "pattern",
      record_id: pattern.id,
    })
  );
  files[apiPath("/patterns.json")] = `${JSON.stringify(
    wrapList(fullItems, { canonical_url: apiUrl("/patterns.json"), record_type: "patterns" }),
    null,
    2
  )}\n`;
  routes.add(apiPath("/patterns.json"));

  // Paginated summaries
  const totalPages = Math.ceil(summaries.length / PAGE_SIZE);
  for (let page = 1; page <= totalPages; page += 1) {
    const slice = summaries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const pagination = makePagination({ total: summaries.length, page, perPage: PAGE_SIZE, pathPrefix: "/patterns" });
    const pageData = wrapList(slice, {
      canonical_url: apiUrl(`/patterns/page/${page}.json`),
      record_type: "pattern_summaries",
      pagination,
    });
    const filePath = page === 1 ? apiPath("/patterns/index.json") : apiPath(`/patterns/page/${page}.json`);
    files[filePath] = `${JSON.stringify(pageData, null, 2)}\n`;
    routes.add(filePath);
  }

  // Individual pattern records
  for (const pattern of sortedPatterns) {
    const record = wrapRecord(pattern, {
      canonical_url: patternPageUrl(pattern.id),
      record_type: "pattern",
      record_id: pattern.id,
    });
    const filePath = apiPath(`/patterns/${pattern.id.toLowerCase()}.json`);
    files[filePath] = `${JSON.stringify(record, null, 2)}\n`;
    routes.add(filePath);
  }

  return summaries;
}

function buildSetsApi(patterns, studySets, files, routes) {
  const setSummaries = studySets.sets.map((set) => {
    const setPatterns = patterns.filter((p) => p.set_id === set.id).sort((a, b) => a.id.localeCompare(b.id));
    return {
      id: set.id,
      title_en: set.title_en,
      title_ru: set.title_ru,
      description: set.description,
      level: set.level,
      path: set.path,
      pattern_count: setPatterns.length,
      learning_path_ids: studySets.learningPaths
        .filter((path) => path.set_ids.includes(set.id))
        .map((path) => path.id),
      canonical_url: setPageUrl(set.id),
      page_urls: { en: setPageUrl(set.id, "en"), ru: setPageUrl(set.id, "ru") },
      api_url: apiUrl(`/sets/${set.id.toLowerCase()}.json`),
    };
  });

  files[apiPath("/sets.json")] = `${JSON.stringify(
    wrapList(setSummaries, { canonical_url: apiUrl("/sets.json"), record_type: "study_sets" }),
    null,
    2
  )}\n`;
  routes.add(apiPath("/sets.json"));

  for (const set of studySets.sets) {
    const setPatterns = patterns
      .filter((p) => p.set_id === set.id)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(patternSummary);
    const record = {
      ...set,
      pattern_count: setPatterns.length,
      patterns: setPatterns,
      canonical_url: setPageUrl(set.id),
      page_urls: { en: setPageUrl(set.id, "en"), ru: setPageUrl(set.id, "ru") },
    };
    const filePath = apiPath(`/sets/${set.id.toLowerCase()}.json`);
    files[filePath] = `${JSON.stringify(
      wrapRecord(record, { canonical_url: setPageUrl(set.id), record_type: "study_set", record_id: set.id }),
      null,
      2
    )}\n`;
    routes.add(filePath);
  }

  return setSummaries;
}

function buildCategoriesApi(patterns, files, routes) {
  const groups = [...new Set(patterns.map((p) => p.group_id))].sort();
  const categories = groups.map((groupId) => {
    const groupPatterns = patterns.filter((p) => p.group_id === groupId);
    return {
      id: groupId,
      pattern_count: groupPatterns.length,
      set_ids: [...new Set(groupPatterns.map((p) => p.set_id))].sort(),
      api_url: apiUrl(`/categories/${groupId.toLowerCase()}.json`),
    };
  });

  files[apiPath("/categories.json")] = `${JSON.stringify(
    wrapList(categories, { canonical_url: apiUrl("/categories.json"), record_type: "categories" }),
    null,
    2
  )}\n`;
  routes.add(apiPath("/categories.json"));

  for (const groupId of groups) {
    const groupPatterns = patterns
      .filter((p) => p.group_id === groupId)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(patternSummary);
    const filePath = apiPath(`/categories/${groupId.toLowerCase()}.json`);
    files[filePath] = `${JSON.stringify(
      wrapList(groupPatterns, { canonical_url: apiUrl(`/categories/${groupId.toLowerCase()}.json`), record_type: "patterns" }),
      null,
      2
    )}\n`;
    routes.add(filePath);
  }

  return categories;
}

function buildLanguagesApi(patterns, studySets, files, routes) {
  const languages = ["en", "de"].map((lang) => {
    const count = patterns.filter((p) => p.langs.some((l) => l.lang === lang)).length;
    return {
      code: lang,
      name: lang === "en" ? "English" : "German",
      pattern_count: count,
      set_count: studySets.sets.length,
      api_url: apiUrl(`/subsets/language/${lang}.json`),
    };
  });

  files[apiPath("/languages.json")] = `${JSON.stringify(
    wrapList(languages, { canonical_url: apiUrl("/languages.json"), record_type: "languages" }),
    null,
    2
  )}\n`;
  routes.add(apiPath("/languages.json"));

  for (const lang of ["en", "de"]) {
    const subset = patterns
      .filter((p) => p.langs.some((l) => l.lang === lang))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => patternLanguageRecord(p, lang))
      .filter(Boolean);
    const filePath = apiPath(`/subsets/language/${lang}.json`);
    files[filePath] = `${JSON.stringify(
      wrapList(subset, { canonical_url: apiUrl(`/subsets/language/${lang}.json`), record_type: "patterns" }),
      null,
      2
    )}\n`;
    routes.add(filePath);
  }

  return languages;
}

function buildSubsetsBySet(patterns, studySets, files, routes) {
  for (const set of studySets.sets) {
    const subset = patterns
      .filter((p) => p.set_id === set.id)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(patternSummary);
    const filePath = apiPath(`/subsets/set/${set.id.toLowerCase()}.json`);
    files[filePath] = `${JSON.stringify(
      wrapList(subset, { canonical_url: apiUrl(`/subsets/set/${set.id.toLowerCase()}.json`), record_type: "patterns" }),
      null,
      2
    )}\n`;
    routes.add(filePath);
  }
}

function buildAnnotationsApi(content, files, routes) {
  const documentSummaries = [];
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      const collection = content.collections[target.key][collectionKey];
      const documents = collection.documents;
      const listItems = documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        language: doc.language,
        annotation_count: doc.annotations.length,
        canonical_url: documentPageUrl(target.key, collectionKey, doc.id),
        api_url: apiUrl(`/annotations/${target.dataKey}/${collectionKey}/${doc.id}.json`),
      }));

      files[apiPath(`/annotations/${target.dataKey}/${collectionKey}.json`)] = `${JSON.stringify(
        wrapList(listItems, {
          canonical_url: apiUrl(`/annotations/${target.dataKey}/${collectionKey}.json`),
          record_type: "annotated_documents",
        }),
        null,
        2
      )}\n`;
      routes.add(apiPath(`/annotations/${target.dataKey}/${collectionKey}.json`));

      for (const doc of documents) {
        const record = wrapRecord(doc, {
          canonical_url: documentPageUrl(target.key, collectionKey, doc.id),
          record_type: "annotated_document",
          record_id: doc.id,
        });
        files[apiPath(`/annotations/${target.dataKey}/${collectionKey}/${doc.id}.json`)] = `${JSON.stringify(record, null, 2)}\n`;
        routes.add(apiPath(`/annotations/${target.dataKey}/${collectionKey}/${doc.id}.json`));
      }

      documentSummaries.push(...listItems);
    }
  }
  return documentSummaries;
}

function buildSearchIndex(patterns, setSummaries, categories, documentSummaries, files, routes) {
  const index = {
    patterns: patterns.map((p) => ({
      id: p.id,
      title_ru: p.title_ru,
      group_id: p.group_id,
      set_id: p.set_id,
      formulas: p.formulas,
      languages: p.langs.map((l) => l.lang),
      canonical_url: patternPageUrl(p.id),
      api_url: apiUrl(`/patterns/${p.id.toLowerCase()}.json`),
    })),
    sets: setSummaries,
    categories,
    documents: documentSummaries.slice(0, 500),
  };
  files[apiPath("/search-index.json")] = `${JSON.stringify(
    wrapList(index, { canonical_url: apiUrl("/search-index.json"), record_type: "search_index" }),
    null,
    2
  )}\n`;
  routes.add(apiPath("/search-index.json"));
}

function buildDownloads(patterns, content, files, routes) {
  files[apiPath("/download/full-patterns.json")] = files[apiPath("/patterns.json")];
  routes.add(apiPath("/download/full-patterns.json"));

  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      const sourcePath = apiPath(`/annotations/${target.dataKey}/${collectionKey}.json`);
      const destPath = apiPath(`/download/annotations-${target.dataKey}-${collectionKey}.json`);
      files[destPath] = files[sourcePath];
      routes.add(destPath);
    }
  }
}

function buildSchemas(files, routes) {
  const provenanceSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: apiUrl("/schemas/provenance.json"),
    title: "Metkagram Provenance",
    type: "object",
    required: [
      "source",
      "source_url",
      "creator",
      "creator_url",
      "license",
      "attribution_required",
      "attribution_text",
      "dataset_version",
      "release_date",
      "canonical_url",
    ],
    properties: {
      source: { type: "string" },
      source_url: { type: "string", format: "uri" },
      source_repository: { type: "string", format: "uri" },
      creator: { type: "string" },
      creator_url: { type: "string", format: "uri" },
      maintainer: { type: "string" },
      maintainer_url: { type: "string", format: "uri" },
      license: { type: "string" },
      license_url: { type: "string", format: "uri" },
      attribution_required: { type: "boolean" },
      attribution_text: { type: "string" },
      attribution_html: { type: "string" },
      dataset_version: { type: "string" },
      release_date: { type: "string", format: "date" },
      canonical_url: { type: "string", format: "uri" },
      record_type: { type: "string" },
      record_id: { type: "string" },
      content_hash: { type: "string" },
    },
  };

  const apiResponseSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: apiUrl("/schemas/api-response.json"),
    title: "Metkagram API Response",
    type: "object",
    required: ["provenance", "data"],
    properties: {
      provenance: { $ref: apiUrl("/schemas/provenance.json") },
      data: {},
      pagination: {
        type: "object",
        required: ["total", "page", "per_page", "total_pages", "first", "last"],
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          per_page: { type: "integer" },
          total_pages: { type: "integer" },
          first: { type: "string", format: "uri" },
          last: { type: "string", format: "uri" },
          prev: { type: ["string", "null"], format: "uri" },
          next: { type: ["string", "null"], format: "uri" },
        },
      },
    },
  };

  const patternSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: apiUrl("/schemas/pattern.json"),
    title: "Metkagram Advanced Pattern",
    type: "object",
    required: ["id", "group_id", "set_id", "title_ru", "langs"],
    properties: {
      id: { type: "string" },
      group_id: { type: "string" },
      set_id: { type: "string" },
      title_ru: { type: "string" },
      metaphor_ru: { type: "string" },
      langs: {
        type: "array",
        items: {
          type: "object",
          required: ["lang", "formula", "example", "translation", "examples"],
          properties: {
            lang: { type: "string", enum: ["en", "de"] },
            formula: { type: "string" },
            example: { type: "string" },
            translation: { type: "string" },
            examples: {
              type: "array",
              items: {
                type: "object",
                required: ["text", "translation_ru"],
                properties: {
                  text: { type: "string" },
                  translation_ru: { type: "string" },
                },
              },
            },
          },
        },
      },
      formulas: { type: "array", items: { type: "string" } },
      gen: { type: "object" },
    },
  };

  const setSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: apiUrl("/schemas/set.json"),
    title: "Metkagram Study Set",
    type: "object",
    required: ["id", "title_en", "title_ru", "description", "level", "path"],
    properties: {
      id: { type: "string" },
      title_en: { type: "string" },
      title_ru: { type: "string" },
      description: { type: "string" },
      level: { type: "string" },
      path: { type: "string" },
      pattern_count: { type: "integer" },
      patterns: { type: "array" },
      canonical_url: { type: "string", format: "uri" },
    },
  };

  const documentSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: apiUrl("/schemas/document.json"),
    title: "Metkagram Annotated Document",
    type: "object",
    required: ["id", "language", "title", "annotations"],
    properties: {
      id: { type: "string" },
      language: { type: "string" },
      title: { type: "string" },
      annotations: { type: "array" },
    },
  };

  const schemas = {
    "/schemas/provenance.json": provenanceSchema,
    "/schemas/api-response.json": apiResponseSchema,
    "/schemas/pattern.json": patternSchema,
    "/schemas/set.json": setSchema,
    "/schemas/document.json": documentSchema,
  };

  for (const [path, schema] of Object.entries(schemas)) {
    files[apiPath(path)] = `${JSON.stringify(schema, null, 2)}\n`;
    routes.add(apiPath(path));
  }
}

function buildOpenApi(endpointPaths, files, routes) {
  const paths = {};
  for (const { path, summary, responseRef, paginated } of endpointPaths) {
    paths[path] = {
      get: {
        summary,
        operationId: path.replace(/\//g, "_").replace(/[{}]/g, "").replace(/^_/, ""),
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  allOf: [{ $ref: apiUrl("/schemas/api-response.json") }].concat(responseRef ? [{ properties: { data: { $ref: responseRef } } }] : []),
                },
              },
            },
          },
        },
      },
    };
    if (paginated) {
      paths[path].get.parameters = [
        { name: "page", in: "query", schema: { type: "integer" }, description: "Page number (static; use /page/{n}.json)" },
      ];
    }
  }

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Metkagram Static API",
      description: "Machine-readable language resources for agents, LLM tools, researchers and learning applications. All endpoints are static JSON files served from GitHub Pages.",
      version: ATTRIBUTION.dataset_version || getDatasetVersion(),
      contact: { name: ATTRIBUTION.maintainer, url: ATTRIBUTION.maintainer_url },
      license: { name: ATTRIBUTION.license, url: ATTRIBUTION.license_url },
    },
    servers: [{ url: API_URL, description: "GitHub Pages production API" }],
    paths,
    components: {
      schemas: {
        Provenance: { $ref: apiUrl("/schemas/provenance.json") },
        ApiResponse: { $ref: apiUrl("/schemas/api-response.json") },
        Pattern: { $ref: apiUrl("/schemas/pattern.json") },
        Set: { $ref: apiUrl("/schemas/set.json") },
        Document: { $ref: apiUrl("/schemas/document.json") },
      },
    },
  };

  files[apiPath("/openapi.json")] = `${JSON.stringify(spec, null, 2)}\n`;
  routes.add(apiPath("/openapi.json"));
}

function buildMcpSpec(patterns, studySets, files, routes) {
  const tools = [
    {
      name: "metkagram_list_patterns",
      description: "List all reusable B2–C1 pattern summaries.",
      inputSchema: { type: "object", properties: { page: { type: "integer", default: 1 } } },
      staticUrl: apiUrl("/patterns/index.json"),
    },
    {
      name: "metkagram_get_pattern",
      description: "Get a single pattern by ID.",
      inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
      staticUrlTemplate: `${apiUrl("/patterns/{id}.json")}`,
    },
    {
      name: "metkagram_list_sets",
      description: "List all study sets.",
      inputSchema: { type: "object" },
      staticUrl: apiUrl("/sets.json"),
    },
    {
      name: "metkagram_get_set",
      description: "Get a study set and its patterns.",
      inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
      staticUrlTemplate: `${apiUrl("/sets/{id}.json")}`,
    },
    {
      name: "metkagram_search_index",
      description: "Download the static search index (patterns, sets, categories).",
      inputSchema: { type: "object" },
      staticUrl: apiUrl("/search-index.json"),
    },
    {
      name: "metkagram_list_annotations",
      description: "List annotated documents for a target language and collection.",
      inputSchema: { type: "object", required: ["target", "collection"], properties: { target: { type: "string", enum: ["en", "de"] }, collection: { type: "string", enum: collectionKeys } } },
      staticUrlTemplate: `${apiUrl("/annotations/{target}/{collection}.json")}`,
    },
  ];

  const spec = {
    name: "metkagram-static-mcp",
    version: getDatasetVersion(),
    description: "MCP-compatible tool specification for the Metkagram static API. No server is required: resolve tool calls by fetching the documented static URLs.",
    attribution: ATTRIBUTION,
    tools,
  };

  files[apiPath("/mcp-server.json")] = `${JSON.stringify(spec, null, 2)}\n`;
  routes.add(apiPath("/mcp-server.json"));
}

function buildAttributionPolicy(files, routes) {
  const policy = {
    ...ATTRIBUTION,
    dataset_version: getDatasetVersion(),
    release_date: getReleaseDate(),
    policy: {
      summary: "Downstream tools must preserve Metkagram attribution.",
      requirements: [
        "Keep the name 'Metkagram' visible or mentioned when data is shown to users.",
        "Link to the canonical source URL https://metkagram.github.io/.",
        "Credit the creator/maintainer and link to the profile URLs provided in this record.",
        "State the dataset version when citing or syncing data.",
        "Provide a visible link back to the relevant Metkagram page for every record shown.",
      ],
      allowed_use: [
        "Personal, educational and non-commercial research.",
        "Integration into free or paid AI/LLM tools that preserve attribution and link back.",
      ],
      commercial_use: "Commercial redistribution or resale requires prior written permission from Metkagram.",
      citation_formats: {
        web: `${ATTRIBUTION.attribution_text}. Available at {canonical_url}.`,
        academic: `Metkagram (${new Date().getFullYear()}). B2–C1 English and German language patterns. ${ATTRIBUTION.source_url}. CC BY-NC 4.0.`,
        ai_answer: "This answer uses data from Metkagram (https://metkagram.github.io/). See the source page for the full pattern and attribution.",
        application: `"${ATTRIBUTION.attribution_text}" with a link to {canonical_url}.`,
      },
    },
  };
  const wrapped = wrapRecord(policy, {
    canonical_url: apiUrl("/attribution.json"),
    record_type: "attribution_policy",
    record_id: "attribution-policy",
  });
  files[apiPath("/attribution.json")] = `${JSON.stringify(wrapped, null, 2)}\n`;
  routes.add(apiPath("/attribution.json"));
}

function buildIndex(apiRoutes, counts, files, routes) {
  const index = {
    ...ATTRIBUTION,
    dataset_version: getDatasetVersion(),
    release_date: getReleaseDate(),
    canonical_url: apiUrl("/index.json"),
    api_version: "v1",
    api_base_url: API_URL,
    documentation: { en: `${SITE_URL}/en/ai/`, ru: `${SITE_URL}/ru/ai/` },
    openapi: apiUrl("/openapi.json"),
    schemas: apiUrl("/schemas/api-response.json"),
    attribution_policy: apiUrl("/attribution.json"),
    mcp_spec: apiUrl("/mcp-server.json"),
    llms_txt: `${SITE_URL}/llms.txt`,
    counts,
    endpoints: [
      { path: "/", url: apiUrl("/index.json"), type: "index", description: "API index and catalog" },
      { path: "/patterns.json", url: apiUrl("/patterns.json"), type: "dataset", description: "All patterns (full records)" },
      { path: "/patterns/index.json", url: apiUrl("/patterns/index.json"), type: "list", description: "Paginated pattern summaries" },
      { path: "/patterns/{id}.json", url: apiUrl("/patterns/{id}.json"), type: "record", description: "Single pattern" },
      { path: "/sets.json", url: apiUrl("/sets.json"), type: "dataset", description: "All study sets" },
      { path: "/sets/{id}.json", url: apiUrl("/sets/{id}.json"), type: "record", description: "Single study set with patterns" },
      { path: "/categories.json", url: apiUrl("/categories.json"), type: "list", description: "Pattern categories" },
      { path: "/categories/{id}.json", url: apiUrl("/categories/{id}.json"), type: "list", description: "Patterns in a category" },
      { path: "/languages.json", url: apiUrl("/languages.json"), type: "list", description: "Target languages and counts" },
      { path: "/subsets/language/{en|de}.json", url: apiUrl("/subsets/language/en.json"), type: "dataset", description: "Language-specific pattern subset" },
      { path: "/subsets/set/{id}.json", url: apiUrl("/subsets/set/arg.json"), type: "dataset", description: "Set-specific pattern subset" },
      { path: "/annotations/{target}/{collection}.json", url: apiUrl("/annotations/en/dialogues.json"), type: "list", description: "Annotated documents in a collection" },
      { path: "/annotations/{target}/{collection}/{id}.json", url: apiUrl("/annotations/en/dialogues/example.json"), type: "record", description: "Single annotated document" },
      { path: "/search-index.json", url: apiUrl("/search-index.json"), type: "index", description: "Static search index" },
      { path: "/download/full-patterns.json", url: apiUrl("/download/full-patterns.json"), type: "download", description: "Downloadable full patterns dataset" },
      { path: "/openapi.json", url: apiUrl("/openapi.json"), type: "schema", description: "OpenAPI specification" },
      { path: "/mcp-server.json", url: apiUrl("/mcp-server.json"), type: "schema", description: "MCP server tool specification" },
    ],
    datasets: [
      { id: "advanced-patterns", label: "Reusable B2–C1 patterns", count: counts.advancedPatterns, url: apiUrl("/patterns.json") },
      { id: "study-sets", label: "Study sets and learning paths", count: counts.sets, url: apiUrl("/sets.json") },
      { id: "annotated-documents", label: "Annotated language documents", count: counts.annotatedDocuments, url: apiUrl("/annotations/en/dialogues.json") },
      { id: "annotated-sentences", label: "Annotated sentences", count: counts.annotatedSentences },
    ],
  };
  files[apiPath("/index.json")] = `${JSON.stringify(index, null, 2)}\n`;
  routes.add(apiPath("/index.json"));
}

function buildCatalog(counts, files, routes) {
  const catalog = {
    ...ATTRIBUTION,
    dataset_version: getDatasetVersion(),
    release_date: getReleaseDate(),
    schema_version: 1,
    datasets: [
      { id: "patterns", title: "Advanced patterns", description: "Reusable B2–C1 English and German grammar patterns with Russian translations.", count: counts.advancedPatterns, download_url: apiUrl("/download/full-patterns.json"), api_url: apiUrl("/patterns.json"), schema_url: apiUrl("/schemas/pattern.json") },
      { id: "sets", title: "Study sets", description: "Named study sets and learning paths.", count: counts.sets, api_url: apiUrl("/sets.json"), schema_url: apiUrl("/schemas/set.json") },
      { id: "annotations", title: "Annotated documents", description: "Sentence-first annotated English and German documents.", count: counts.annotatedDocuments, api_url: apiUrl("/annotations/en/dialogues.json"), schema_url: apiUrl("/schemas/document.json") },
    ],
  };
  files[apiPath("/catalog.json")] = `${JSON.stringify(catalog, null, 2)}\n`;
  routes.add(apiPath("/catalog.json"));
}

export function buildApi(content, counts) {
  const files = {};
  const routes = new Set();

  const patternSummaries = buildPatternsApi(content.advancedPatterns, files, routes);
  const setSummaries = buildSetsApi(content.advancedPatterns, content.studySets, files, routes);
  const categories = buildCategoriesApi(content.advancedPatterns, files, routes);
  const languages = buildLanguagesApi(content.advancedPatterns, content.studySets, files, routes);
  buildSubsetsBySet(content.advancedPatterns, content.studySets, files, routes);
  const documentSummaries = buildAnnotationsApi(content, files, routes);
  buildSearchIndex(content.advancedPatterns, setSummaries, categories, documentSummaries, files, routes);
  buildDownloads(content.advancedPatterns, content, files, routes);
  buildSchemas(files, routes);
  const endpointPaths = [
    { path: "/", summary: "API index", responseRef: null },
    { path: "/catalog.json", summary: "Dataset catalog" },
    { path: "/attribution.json", summary: "Attribution policy" },
    { path: "/patterns.json", summary: "All patterns", responseRef: apiUrl("/schemas/pattern.json") },
    { path: "/patterns/index.json", summary: "Pattern summaries (paginated)", paginated: true },
    { path: "/patterns/{id}.json", summary: "Single pattern" },
    { path: "/sets.json", summary: "Study sets" },
    { path: "/sets/{id}.json", summary: "Single study set" },
    { path: "/categories.json", summary: "Categories" },
    { path: "/categories/{id}.json", summary: "Patterns in category" },
    { path: "/languages.json", summary: "Languages" },
    { path: "/subsets/language/{lang}.json", summary: "Language subset" },
    { path: "/subsets/set/{id}.json", summary: "Set subset" },
    { path: "/annotations/{target}/{collection}.json", summary: "Annotated documents" },
    { path: "/annotations/{target}/{collection}/{id}.json", summary: "Single annotated document" },
    { path: "/search-index.json", summary: "Search index" },
    { path: "/download/full-patterns.json", summary: "Download patterns" },
    { path: "/mcp-server.json", summary: "MCP tool spec" },
  ];
  buildOpenApi(endpointPaths, files, routes);
  buildMcpSpec(content.advancedPatterns, content.studySets, files, routes);
  buildAttributionPolicy(files, routes);

  const apiCounts = {
    advancedPatterns: counts.advancedPatterns,
    annotatedDocuments: counts.annotatedDocuments,
    annotatedSentences: counts.annotatedSentences,
    sets: content.studySets.sets.length,
    learningPaths: content.studySets.learningPaths.length,
    categories: categories.length,
    languages: languages.length,
    apiEndpoints: routes.size,
  };
  buildIndex(routes, apiCounts, files, routes);
  buildCatalog(apiCounts, files, routes);

  return { files, routes: [...routes].sort() };
}

export function buildLlmsTxt(content, counts) {
  const lines = [
    "# Metkagram",
    "",
    "> A bilingual, static, AI-ready language-notation workspace for English and German B2–C1 patterns and annotated sentences.",
    "",
    "## For agents and developers",
    "",
    "Prefer the static API over scraping HTML. Every endpoint includes provenance and attribution.",
    "",
    `- API index: ${API_URL}/index.json`,
    `- OpenAPI: ${API_URL}/openapi.json`,
    `- Attribution policy: ${API_URL}/attribution.json`,
    `- MCP tool spec: ${API_URL}/mcp-server.json`,
    `- Developer docs: ${SITE_URL}/en/ai/`,
    "",
    "## Public datasets",
    "",
    `- Patterns: ${API_URL}/patterns.json (${counts.advancedPatterns} records)`,
    `- Study sets: ${API_URL}/sets.json (${content.studySets.sets.length} sets)`,
    `- Annotated documents: ${API_URL}/annotations/en/dialogues.json and /annotations/de/... (${counts.annotatedDocuments} documents, ${counts.annotatedSentences} sentences)`,
    `- Search index: ${API_URL}/search-index.json`,
    "",
    "## Attribution",
    "",
    `${ATTRIBUTION.attribution_text} Licensed under ${ATTRIBUTION.license}. Creator: ${ATTRIBUTION.creator} (${ATTRIBUTION.creator_url}). Maintainer: ${ATTRIBUTION.maintainer} (${ATTRIBUTION.maintainer_url}). Commercial use requires written permission.`,
    "",
    "## How to cite",
    "",
    'Web page: "Source: Metkagram — https://metkagram.github.io/" with a link to the relevant pattern or document page.',
    `Academic: Metkagram (${new Date().getFullYear()}). B2–C1 English and German language patterns. ${SITE_URL}. ${ATTRIBUTION.license}.`,
    'AI-generated answer: "This answer uses data from Metkagram (https://metkagram.github.io/). See the source page for the full pattern and attribution.',
    "",
    "## Contact",
    "",
    `- ${ATTRIBUTION.contact_url}`,
    `- ${ATTRIBUTION.source_repository}`,
  ];
  return lines.join("\n") + "\n";
}

export function buildRobotsTxt(apiRoutes) {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Allow: /api/v1/",
    "Disallow: /assets/",
    "Disallow: /migration/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    "# AI agents",
    `API index: ${API_URL}/index.json`,
    `OpenAPI: ${API_URL}/openapi.json`,
    `llms.txt: ${SITE_URL}/llms.txt`,
  ];
  return lines.join("\n") + "\n";
}
