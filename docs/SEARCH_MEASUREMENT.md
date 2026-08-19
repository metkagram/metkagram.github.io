# Search measurement and content decision loop

Status: local, privacy-safe editorial workflow. No Search Console credentials or raw query rows belong in the public repository.

## Goal

Technical SEO checks answer whether Metkagram pages can be crawled and described. This workflow answers a different question: **which existing surfaces show real discovery signal, which need improvement, and where more content would be justified by evidence rather than page-count intuition?**

The report is intentionally advisory. It never changes pages, deletes study sets, adds `noindex`, or rewrites canonicals automatically.

## 1. Export page-level non-brand data

Use Google Search Console → Performance / Search results for a stable period such as 28 or 90 days.

1. Select clicks, impressions, CTR and average position.
2. Prefer Search Console's **Non-branded** query filter when it is available for the property.
3. If the branded/non-branded filter is unavailable because the property has too little traffic, a query exclusion such as `Query does not contain Metkagram` can be used as a directional fallback. Note that query filtering changes report totals because anonymized queries are omitted when a query filter is active.
4. Switch the table dimension to **Pages** so rows are grouped by canonical page URL.
5. Export the table to CSV/Excel/Sheets.
6. Convert only the page aggregates into the JSON input defined by `data/schemas/search-measurement.schema.json`.

Direct Search Console report exports reflect the active filters and grouping and are limited to the rows available from the report export. For a larger future property, use the Search Console API or bulk export rather than pretending a truncated UI export is complete.

Official references:

- https://support.google.com/webmasters/answer/17010961
- https://support.google.com/webmasters/answer/17011259
- https://support.google.com/webmasters/answer/12919797
- https://support.google.com/webmasters/answer/12919192

## 2. Keep raw queries private

The committed aggregate schema deliberately has no query field. The local reporter rejects fields named `query` or `queries`.

Safe committed material:

- schema definitions;
- synthetic examples;
- route classification logic;
- decision rules;
- documentation and tests.

Keep these local/private:

- raw Search Console exports if they contain queries;
- credentials, tokens or API secrets;
- unfiltered user search terms;
- generated reports from real property data unless intentionally reviewed for publication.

Recommended local paths are ignored by git:

- `data/search-measurement/private/`
- `reports/search-measurement/private/`

## 3. Input format

A minimal input looks like this:

```json
{
  "schemaVersion": 1,
  "source": "search-console-page-aggregate",
  "scope": "non_brand",
  "period": {"start": "2026-05-01", "end": "2026-07-31"},
  "rows": [
    {
      "url": "https://metkagram.github.io/en/patterns/argumentation-and-evidence/",
      "clicks": 4,
      "impressions": 120,
      "ctr": 0.0333,
      "position": 9.8
    }
  ]
}
```

`ctr` is a decimal ratio (`0.0333`, not `3.33`).

Optional fields:

- `crawled` and `indexed` — add only if these states were checked separately; the Performance report itself is not treated as proof of crawl/index state;
- `age_days` — age of the page or current stable route;
- `consolidation_group` — an explicit editor-defined group of genuinely overlapping pages;
- `indexing_review_allowed` — explicit permission to surface a `noindex` candidate. It defaults to false.

## 4. Generate the local report

```bash
node scripts/search-measurement.mjs \
  --input data/search-measurement/private/gsc-2026-q3.json
```

Outputs are written by default to:

- `reports/search-measurement/private/search-opportunities.json`
- `reports/search-measurement/private/search-opportunities.md`

A synthetic committed example is available at `examples/search-measurement.aggregate.example.json`.

## 5. Route types

The reporter classifies page aggregates into product surfaces rather than treating all URLs as equivalent:

- `atlas_index` — Pattern Atlas root;
- `atlas_topic` — one learner-job Atlas topic;
- `study_set` — one Practice study set;
- `pattern` — one canonical learner pattern;
- `editorial` — Method, Research, Glossary, Roadmap, History, Support, About;
- `developer_data` — AI, MCP, Data, Evals, Cite and Licensing pages;
- `utility` — archived app and legal utility pages;
- `other` — anything outside known route contracts.

This matters because a long-tail learning pattern should not be judged by the same demand threshold as an editorial landing page.

## 6. Decision queue

The report emits five states.

### `expand`

The page already has meaningful non-brand visibility and clicks. Expand by improving the reviewed object graph around the successful intent: more examples, a useful Contrast, Choice, Route, Bridge or adjacent Atlas coverage. Do not generate keyword variants of the same page.

### `improve`

The page is shown in search but under-converts or sits in a plausible improvement range. First inspect title/description, intent match, internal links and the actual learner value above the fold.

### `consolidate`

This is surfaced only when an editor explicitly provided a `consolidation_group`, the page is old enough, and aggregate search signal is very low. It means **review overlap**, not delete. Stable useful learning objects may remain separate even when search demand is tiny.

### `noindex`

This is surfaced only when `indexing_review_allowed=true` was explicitly supplied and an older indexed page has no recorded non-brand impressions. It is a manual review candidate, never an automatic directive. Core Practice content should normally keep `indexing_review_allowed=false`.

### `observe`

There is not enough evidence for a search-driven change. Keep the object and collect more data.

## 7. Indexed / crawled ratio

If `crawled` and `indexed` are supplied from a separate index-status review, the report calculates the known indexed-to-crawled ratio by route type. If those fields are absent, the report shows `n/a` rather than inventing coverage from Performance data.

Use this ratio diagnostically: a weak ratio across one route family can justify technical inspection; it is not evidence that the content itself is poor.

## 8. Editorial cadence

A practical cadence for a small project is monthly or once enough impressions have accumulated to make comparison useful.

For each run:

1. keep the date window consistent with the previous run where possible;
2. export non-brand page aggregates;
3. generate the report locally;
4. inspect `improve` before creating new pages;
5. use `expand` to choose where reviewed content depth is justified;
6. treat `consolidate` and `noindex` as manual review queues only;
7. record only the resulting editorial decision in the public backlog, not raw user queries.

The purpose is to make growth evidence-driven without turning search traffic into the sole definition of educational value.
