# Pattern indexability policy

Status: canonical editorial contract for standalone Pattern search promotion.

## Core distinction

Metkagram separates **content validity** from **search indexability**.

A Pattern can remain a valid, useful member of a study set and still be a poor standalone search landing page. `noindex,follow` therefore means only that Metkagram does not ask search engines to promote that Pattern URL independently.

It does **not** mean:

- delete the Pattern;
- remove it from a study set;
- break its stable Pattern ID;
- remove its EN/RU canonical route;
- remove its API record;
- remove it from Lens, Atlas, Map, Contrasts, Choice, Routes or Bridge;
- treat it as linguistically wrong.

## Current decision order

`src/pattern-indexability.mjs` applies a deterministic policy to every canonical Pattern record.

### 1. Explicit canonical Frame contextual variant

If a Pattern belongs to an explicit reviewed-pilot Frame family and is not that family's representative Pattern, its standalone page is `noindex,follow`.

The Pattern stays available as a contextual realization of the reusable canonical Frame.

Only explicit families in `data/frame-families.json` can trigger this decision. The automated Frame quality audit cannot silently create a family or deindex a Pattern.

### 2. Existing technical quality gate

The current content quality layer already checks whether translations are complete, examples are sufficiently diverse and variations are internally valid. A Pattern that fails that existing technical gate is not promoted as a standalone search page.

### 3. Editorial status gate

A technically complete Pattern is still not promoted when its editorial status is generated, unknown or otherwise outside the approved reviewed/curated states.

This prevents new generated corpus volume from becoming indexable merely because a valid JSON record exists.

### 4. Severe high-confidence quality finding

A high-severity **and** high-confidence finding from the deterministic corpus audit blocks standalone search promotion until reviewed.

Lower-confidence heuristics remain review signals only. In particular, automated duplicate or similarity candidates do not cause `noindex` by themselves.

### 5. Reviewed standalone or representative Pattern

A Pattern that passes the gates remains indexable. An explicit canonical Frame representative is kept as the searchable Pattern landing page for its pilot family.

## Crawler behavior

For `noindex` Pattern pages:

- the canonical HTML file remains published;
- the page keeps its stable self-canonical URL;
- robots becomes `noindex,follow`;
- the URL is removed from `sitemap.xml`;
- the route is removed from the indexable SEO inventory;
- legacy Pattern-ID redirects still point to the canonical Pattern route;
- the individual Pattern API record exposes the same indexability decision and reason.

For indexable Pattern pages, existing crawler behavior remains unchanged.

## Machine-readable policy

The build publishes:

- `/data/quality/pattern-indexability.json`;
- `/api/v1/pattern-indexability.json`;
- `search_indexability` metadata on every individual Pattern API record.

The report includes aggregate indexable/noindex counts and counts by decision reason.

## Relationship to the corpus audit

The corpus-wide audit in `docs`/`dist/data/quality/frame-audit.*` is intentionally broader than search policy. It finds candidates for editorial work across the entire corpus.

Search indexability consumes only bounded, high-confidence parts of that evidence. The current 90%+ duplicate/variant candidate signal is **not** a mandate to deindex 90%+ of the corpus. Family review must happen first.

This makes the progression explicit:

**audit candidate → editorial Frame-family review → canonical Frame/Variant relation → search indexability decision**

## Relationship to study-set preservation

The permanent study-set preservation policy remains stronger than search optimisation. Weak search performance or `noindex` status cannot delete an established set or Pattern record.

Search decisions are reversible metadata. Curriculum preservation is a product invariant.
