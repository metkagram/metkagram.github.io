# Corpus quality audit and preservation contract

The audit measures the effective corpus returned by `loadContent()`: canonical
pattern shards, merged reasoning frames, practice-extension sets and quality
overrides. It does not mistake the base shard directory for the whole curriculum.

## Run

```sh
node scripts/audit-corpus.mjs
node scripts/audit-corpus.mjs --check-preservation-only
node --test tests/corpus-audit.test.mjs tests/curriculum-preservation.test.mjs
```

Default reports are `dist/data/quality/corpus-audit.json` and
`dist/data/quality/corpus-audit.md`. To keep standalone reports outside a build:

```sh
node scripts/audit-corpus.mjs --json reports/corpus-audit.json --markdown reports/corpus-audit.md
```

`--baseline PATH` selects a preservation baseline. The default is
`data/curriculum-preservation.json`. There is deliberately no refresh or overwrite
option. `--check-preservation-only` writes no files and is suitable for the
validation stage. Report generation belongs to a stage that is allowed to write
derived files, before any read-only build audit.

A preservation failure exits with status 1. Language diagnostics remain review
candidates and do not fail a build automatically. The audit never rewrites
content or promotes a record to a human-reviewed status.

## What the numbers mean

Each set has separate English and German record counts and candidate-family
counts. A candidate signature normalizes Unicode, removes bold markers, replaces
the contents of each non-nested square-bracket slot with `[slot]`, collapses
whitespace and lowercases. It preserves words and punctuation outside slots.

For example, `I need [a budget].` and `I need [more people].` share a signature.
`I might need [a budget].` has another signature. Each JSON family includes the
exact signature and every stable member ID. Global language counts deduplicate
signatures across sets, so they need not equal the sum of per-set counts.

This is an editorial inspection aid. Different slot restrictions can matter,
identical signatures do not prove grammatical equivalence, and multiple
signatures do not prove meaningful instructional diversity. Correcting agreement
outside a slot can itself change the signature count. Do not advertise these
counts as verified distinct constructions or as evidence of learning efficacy.

The `content_sha256` fingerprint covers sorted set identities and audited textual
fields of effective records. It is deterministic and has no generated timestamp;
it is not a hash of every repository file or every metadata field.

## Narrow review diagnostics

| Code | Scope | Important limitation |
|---|---|---|
| `EN_PLURAL_AGREEMENT_CANDIDATE` | A small explicit list of plural nouns immediately followed by selected singular verbs | Check the full sentence and intended subject; this is not an English parser |
| `DE_ARTICLE_CASE_CANDIDATE` | The specific `wie einen Förderantrag/Plan … die nächsten Schritte beeinflusst` scaffold | German word order alone does not establish case; inspect roles |
| `DE_PLURAL_AGREEMENT_CANDIDATE` | The `Forschungsergebnisse des Teams … beeinflusst` scaffold | Does not detect German agreement generally |
| `RU_LATIN_SPAN_CANDIDATE` | At least four Latin-script words, including two lowercase-leading words, in a Russian title, note or translation | Intentional English quotations are also candidates; short names/acronyms are excluded |
| `UNBALANCED_SLOT_CANDIDATE` | Unmatched square brackets | Review the intended notation |
| `NESTED_SLOT_CANDIDATE` | Nested square brackets | Signature normalization does not parse nested slots |
| `EMPTY_SLOT_CANDIDATE` | An empty square-bracket slot | It may be intentional, so inspect before editing |

Each finding includes `pattern_id`, `set_id`, `language`, `source_language`, an
exact field path, complete field text, matched text, explanation and
`status: requires_review`. Russian translations retain the source language of
their English or German example. The report counts affected fields and affected
records separately. Ten repetitions of a phrase are ten field-level candidates,
not ten independently established language errors.

Zero candidates means these narrow checks found nothing. It does not mean a
record is natural, accurate, human-reviewed, CEFR-validated or effective.

## Permanent preservation baseline

The checked-in baseline was created from an isolated `git archive` of commit
`b194e9c741d65d6515aa71b5dc614044b859b1e2`, using that revision's `loadContent()`
and `data/seo-slugs.json`. It protects all **94 sets and 3,530 effective records**
that existed before these improvements, including extension sets and merged
reasoning records. It was not captured from a partially edited worktree.

Protected fields are:

- Every existing set ID and public set slug.
- Every existing pattern ID and its membership in the original set.
- Every existing full public pattern slug, including its stable ID suffix.

Editorial text, examples, descriptions and metadata may improve. New sets and
records may be added. Existing records may not be removed, silently reassigned,
or given different URLs. Equal overall or per-set counts cannot hide replacements
or membership swaps. The preservation tests also verify the actual canonical and
legacy route functions for both interface locales.

Do not regenerate this historical baseline to make a content change pass. It is
not a frozen full-record hash: useful corrections are expressly allowed. Future
protection of additional published identities should be a separate reviewed
extension that retains this original contract.

## Initial diagnostic checkpoint

Running this audit against the isolated original revision produces:

| Diagnostic | Candidate fields |
|---|---:|
| English plural agreement | 83 |
| German article/case scaffold | 20 |
| German plural agreement scaffold | 10 |
| Russian Latin spans | 804 |
| **Total** | **917** |

These candidates affect 109 records. The original signature count is 630 for
each target language. This is a reproducible starting checkpoint for these
particular diagnostics, not a rating of the entire corpus. Rerun on the current
revision to inspect changes; do not equate fewer candidates with completed
editorial review.

After the PRO/ARG editorial repairs in this branch, these diagnostics report
67 candidate fields in 52 records (63 English plural agreement, 4 Russian Latin
spans). There are 631 candidate signatures per language. See
`IMPROVEMENT_LOOP_2026-09.md` for the product decision and the next review loop.

The historical `scripts/expand-patterns.mjs` bootstrap refuses to run when this
preservation baseline exists. It used to regenerate the old mechanical text and
rewrite memberships. Edit canonical shards, prepare any annotation changes privately, and validate
the released sidecar instead of using that bootstrap on the established curriculum.
