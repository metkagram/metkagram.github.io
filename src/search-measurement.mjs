const CORE_ROUTE_TYPES = new Set(["atlas_index", "atlas_topic", "study_set", "pattern", "editorial", "developer_data"]);
const ACTION_ORDER = { improve: 0, expand: 1, consolidate: 2, noindex: 3, observe: 4 };

function finiteNumber(value, field, minimum = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) throw new Error(`${field} must be a finite number >= ${minimum}`);
  return number;
}

function optionalBoolean(value, field) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean when provided`);
  return value;
}

export function normalizeRoute(value) {
  if (!value) throw new Error("url is required");
  if (value.startsWith("/")) return value.endsWith("/") ? value : `${value}/`;
  const parsed = new URL(value);
  if (parsed.hostname !== "metkagram.github.io") throw new Error(`unexpected Search Console host: ${parsed.hostname}`);
  return parsed.pathname.endsWith("/") || parsed.pathname.includes(".") ? parsed.pathname : `${parsed.pathname}/`;
}

export function classifyRoute(route) {
  const path = normalizeRoute(route);
  if (/^\/(en|ru)\/patterns\/$/.test(path)) return "atlas_index";
  if (/^\/(en|ru)\/patterns\/[^/]+\/$/.test(path)) return "atlas_topic";
  if (/^\/(en|ru)\/practice\/(set\/[^/]+|sets\/[^/]+)\/$/.test(path)) return "study_set";
  if (/^\/(en|ru)\/practice\/patterns\/[^/]+\/$/.test(path)) return "pattern";
  if (/^\/(en|ru)\/practice\/(?!set\/|sets\/|intents\/|language\/|activity\/|exports\/|routes\/)[^/]+\/$/.test(path)) return "pattern";
  if (/^\/(en|ru)\/(research|method|glossary|roadmap|history)\/$/.test(path)) return "editorial";
  if (/^\/(en|ru)\/(ai|mcp|data|evals|cite|licensing)(\/|$)/.test(path)) return "developer_data";
  if (/^\/(en|ru)\/(apps|legal)(\/|$)/.test(path)) return "utility";
  if (/^\/(en|ru)\/(support|about)\/$/.test(path)) return "editorial";
  return "other";
}

export function normalizeSearchRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("each search row must be an object");
  for (const key of Object.keys(row)) {
    if (/quer(y|ies)/i.test(key)) throw new Error(`raw query fields are not allowed in aggregate search input: ${key}`);
  }

  const route = normalizeRoute(row.url || row.route);
  const clicks = finiteNumber(row.clicks ?? 0, "clicks");
  const impressions = finiteNumber(row.impressions ?? 0, "impressions");
  const ctr = row.ctr === undefined || row.ctr === null
    ? (impressions > 0 ? clicks / impressions : 0)
    : finiteNumber(row.ctr, "ctr");
  if (ctr > 1) throw new Error("ctr must be a decimal ratio between 0 and 1, not a percentage value");
  const position = row.position === undefined || row.position === null ? null : finiteNumber(row.position, "position");
  const ageDays = row.age_days === undefined || row.age_days === null ? null : finiteNumber(row.age_days, "age_days");
  const crawled = optionalBoolean(row.crawled, "crawled");
  const indexed = optionalBoolean(row.indexed, "indexed");

  return {
    route,
    route_type: classifyRoute(route),
    clicks,
    impressions,
    ctr,
    position,
    crawled,
    indexed,
    age_days: ageDays,
    consolidation_group: row.consolidation_group || null,
    indexing_review_allowed: row.indexing_review_allowed === true
  };
}

export function recommendSearchAction(input) {
  const row = normalizeSearchRow(input);
  const age = row.age_days ?? 0;

  if (row.indexing_review_allowed && age >= 180 && row.impressions === 0 && row.clicks === 0 && row.indexed === true) {
    return {
      ...row,
      action: "noindex",
      automatic: false,
      rationale: "Explicit indexing review was allowed; this page is at least 180 days old, indexed, and has no recorded non-brand impressions. Review purpose and internal-link value before changing robots directives."
    };
  }

  if (row.consolidation_group && age >= 180 && row.impressions < 10 && row.clicks === 0) {
    return {
      ...row,
      action: "consolidate",
      automatic: false,
      rationale: `This older low-signal page belongs to explicit consolidation group ${row.consolidation_group}. Compare intent and canonical content manually; do not delete a useful learning object merely because search demand is low.`
    };
  }

  if (row.impressions >= 100 && row.clicks >= 3 && row.ctr >= 0.03) {
    return {
      ...row,
      action: "expand",
      automatic: false,
      rationale: "The page already earns meaningful non-brand visibility and clicks. Prefer deeper reviewed examples, contrasts, routes or adjacent Atlas coverage over keyword variants."
    };
  }

  const positionOpportunity = row.position !== null && row.position > 7 && row.position <= 30;
  if (row.impressions >= 50 && (row.clicks === 0 || row.ctr < 0.025 || positionOpportunity)) {
    return {
      ...row,
      action: "improve",
      automatic: false,
      rationale: "The page is being shown but under-converts or sits within a plausible ranking-improvement range. Review title, description, intent match, internal links and above-the-fold usefulness before adding more pages."
    };
  }

  return {
    ...row,
    action: "observe",
    automatic: false,
    rationale: CORE_ROUTE_TYPES.has(row.route_type)
      ? "Insufficient evidence for a search-driven content change. Keep the learner-facing object and collect more aggregate data."
      : "Insufficient evidence for a search-driven change. Review only when the page has a clear product or indexing problem."
  };
}

function summarizeRows(rows) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const crawledRows = rows.filter((row) => row.crawled === true);
  const indexedRows = rows.filter((row) => row.indexed === true);
  return {
    pages: rows.length,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    crawled_known: crawledRows.length,
    indexed_known: indexedRows.length,
    indexed_to_crawled_ratio: crawledRows.length > 0 ? indexedRows.length / crawledRows.length : null
  };
}

function groupRecommendationsByRouteType(recommendations) {
  const grouped = {};
  for (const routeType of [...new Set(recommendations.map((row) => row.route_type))].sort()) {
    grouped[routeType] = recommendations
      .filter((row) => row.route_type === routeType)
      .map((row) => ({
        route: row.route,
        action: row.action,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        position: row.position,
        rationale: row.rationale
      }));
  }
  return grouped;
}

export function buildSearchMeasurementReport(payload) {
  if (!payload || typeof payload !== "object") throw new Error("search measurement payload is required");
  if (payload.schemaVersion !== 1) throw new Error("search measurement schemaVersion must be 1");
  if (payload.scope !== "non_brand") throw new Error("scope must be non_brand; filter branded queries before exporting page aggregates");
  if (!payload.period?.start || !payload.period?.end) throw new Error("period.start and period.end are required");
  if (!Array.isArray(payload.rows)) throw new Error("rows must be an array");

  const recommendations = payload.rows.map(recommendSearchAction).sort((a, b) => {
    const actionDelta = ACTION_ORDER[a.action] - ACTION_ORDER[b.action];
    if (actionDelta !== 0) return actionDelta;
    return b.impressions - a.impressions || b.clicks - a.clicks || a.route.localeCompare(b.route);
  });

  const byRouteType = {};
  for (const routeType of [...new Set(recommendations.map((row) => row.route_type))].sort()) {
    byRouteType[routeType] = summarizeRows(recommendations.filter((row) => row.route_type === routeType));
  }

  const actionCounts = Object.fromEntries(["expand", "improve", "consolidate", "noindex", "observe"].map((action) => [
    action,
    recommendations.filter((row) => row.action === action).length
  ]));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: payload.source || "search-console-page-aggregate",
    scope: payload.scope,
    period: payload.period,
    evidenceBoundary: "Aggregate page-level discovery data supports editorial prioritisation only. Recommendations are not automatic SEO actions and do not justify deleting useful learning content.",
    totals: summarizeRows(recommendations),
    actionCounts,
    byRouteType,
    recommendationsByRouteType: groupRecommendationsByRouteType(recommendations),
    recommendations
  };
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

export function renderSearchMeasurementMarkdown(report) {
  const lines = [
    "# Search measurement report",
    "",
    `Period: ${report.period.start} → ${report.period.end}`,
    `Scope: ${report.scope}`,
    "",
    `Evidence boundary: ${report.evidenceBoundary}`,
    "",
    "## Route-type summary",
    "",
    "| Route type | Pages | Impressions | Clicks | CTR | Indexed / crawled |",
    "|---|---:|---:|---:|---:|---:|"
  ];

  for (const [routeType, summary] of Object.entries(report.byRouteType)) {
    lines.push(`| ${routeType} | ${summary.pages} | ${summary.impressions} | ${summary.clicks} | ${percent(summary.ctr)} | ${summary.indexed_to_crawled_ratio === null ? "n/a" : percent(summary.indexed_to_crawled_ratio)} |`);
  }

  lines.push("", "## Actionable opportunities by route type", "");
  for (const [routeType, items] of Object.entries(report.recommendationsByRouteType)) {
    const actionable = items.filter((item) => item.action !== "observe");
    lines.push(`### ${routeType} (${actionable.length} actionable)`, "");
    if (!actionable.length) {
      lines.push("No search-driven action candidate in this aggregate export.", "");
      continue;
    }
    for (const item of actionable) {
      lines.push(`- **${item.action}** \`${item.route}\` — ${item.impressions} impressions · ${item.clicks} clicks · ${percent(item.ctr)} CTR. ${item.rationale}`);
    }
    lines.push("");
  }

  lines.push("## Decision queue", "");
  for (const action of ["improve", "expand", "consolidate", "noindex", "observe"]) {
    const items = report.recommendations.filter((row) => row.action === action);
    lines.push(`### ${action} (${items.length})`, "");
    if (!items.length) {
      lines.push("No candidates in this aggregate export.", "");
      continue;
    }
    for (const item of items) {
      const metrics = `${item.impressions} impressions · ${item.clicks} clicks · ${percent(item.ctr)} CTR${item.position === null ? "" : ` · position ${item.position.toFixed(1)}`}`;
      lines.push(`- \`${item.route}\` — ${metrics}. ${item.rationale}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}
