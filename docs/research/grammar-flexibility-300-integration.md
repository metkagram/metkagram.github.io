# Grammar flexibility integration

Machine-checked canonical loader totals (2026-09-18):

```json
{
  "patterns": 930,
  "study_sets": 109,
  "new_patterns": 300,
  "new_language_examples": 1800,
  "new_example_pairs": 900,
  "new_pending_annotations": 1800
}
```

The 300 additions contain English and German formulas, three aligned example scenarios, Russian translations and Russian grammatical explanations. CEFR B2/C1 labels are editorial practice targets, not examination certification.

## Annotation status

New examples are text-only records with empty spans and explicit `validation.status: pending`, `needs_rebuild: true`, `generator: none`, and a SHA-256 fingerprint of the current text. These are NOT completed parser annotations or human-reviewed Marks. Existing annotation records are preserved without modification. The canonical card export retains pending status. Run the local annotation pipeline to replace pending records with real annotations; reject stale fingerprints after text edits. The compressed export record count includes both completed and pending records and must not be presented as the count of annotated sentences.

## Verification repairs

The similarity tokenizer retains one-letter grammatical words, preserving the difference between `few` and `a few`. The agreement detector recognizes irrealis `were` immediately after `as if` or `as though`, without ignoring genuine agreement errors. Positive and negative regression fixtures cover these corrections.

Obsolete tests still demanded thousands of physically deleted contextual duplicates and exactly 94 sets. Current tests instead check exact canonical membership, all 300 expected additions, the unchanged frozen SHA-256 identity/URL mapping for the 630 established patterns, retired-alias resolution and additive set preservation. Historical duplicate detection remains covered by explicit synthetic fixtures, not restored duplicate pages. No quality baseline, threshold or frozen identity fixture is rewritten.

## Remaining editorial work

Expand the new patterns to the requested 5–7 examples per language. This merge does not claim that requirement is complete.

This report is committed only after the full build and test suite succeeds. Existing SEO slugs, including historical alias names, are checked for preservation during integration.

## Concurrent main reconciliation

Upstream revision `a504a8ccb09ba060aa65479f96b654e2676ef6dd` independently normalized established example counts and pruned obsolete annotation records. This merge preserves every remaining upstream annotation exactly and adds only the 1,800 new pending records.

```json
{
  "patterns": 930,
  "study_sets": 109,
  "preserved_current_main_annotations": 9396,
  "new_pending_annotations": 1800
}
```

The upstream 5–7 additional-example requirement remains the default. Because the owner expressly approved merging this expansion after being told it has three total examples per language, its exact 300 IDs are recorded in `data/quality/pending-example-enrichment.json` as unfinished editorial work. Only the disclosed two-additional-plus-primary count and EN/DE records are allowed; unrelated IDs, languages and arbitrary undersized counts remain rejected. No examples are duplicated or fabricated to satisfy the count. All retained pattern identity and route baselines remain unchanged.
