# EN/DE annotation refresh — 19 September 2026

Completed locally on `codex/annotation-refresh-20260919`, based on GitHub main
`f16953f1b15f76799c81f0e877bb3898f6107499`. No commit, push, merge or deployment was performed.

## Corpus and results

The cleaned corpus remains **948 Patterns in 109 study sets**.
Retired duplicate IDs were not restored. The source Pattern shards, set taxonomy,
translations, IDs, aliases and URLs were preserved. All 72 showcase documents
were compared with the base revision after excluding the new generated annotation
field; their original content is exactly unchanged.

| Current source | English | German | Total |
| --- | ---: | ---: | ---: |
| Practice examples, including primary sentences | 5688 | 5688 | 11376 |
| Public showcase sentences | 573 | 396 | 969 |
| Refreshed annotation records | 6261 | 6084 | 12345 |

- Stale source-text annotations replaced: **512**.
- Missing Practice records generated: **180**.
- Existing raw records marked pending rebuilt: **1800**.
- Remaining pending records / rebuild ledger entries: **0 / 0**.
- Source binding now covers exact text, language and editorial formula.
- Examples with target-pattern emphasis: **8046 / 11376**.
- Sentences with predicate emphasis: **12285 / 12345**.
- Predicate groups: **26209**, including **3448** discontinuous German groups.
- Full-corpus schema, source, language, span and emphasis alignment errors: **0**.
- Source sentences rewritten for parser convenience: **0**. Confirmed content corrections: **0**; uncertain formula/example relationships remain in review.

Baseline categories are reported separately, not summed as a count of unique failures.
Missing old source hashes were a provenance gap, not evidence of changed text.

## Rule and heuristic corrections

The baseline contained **4051 German p2 marks** unsupported by
the German vocabulary and **1135 English Hf marks** attached to
forms of have/be rather than future helpers. The refreshed generator uses the
existing language-specific case, tense/helper and participle labels and validates
labels by language. English M was already used by the legacy engine and Method
page; its omitted English rule-catalogue entry was aligned with those sources.
No generic H tag was introduced for do-support.

The private engine now uses lemmas, morphology and dependencies with the editorial
formula: variable slots are not literal text, grammatical slot names are not
lexical anchors, and inflection/alternatives and German verb movement are handled
without inventing a different Frame. Predicate grouping includes auxiliaries,
particles, infinitives, reflexives and formula-supported lexical complements.
Discontinuous elements retain their original sentence order.

The 2026-09-19.8 correction makes `S` and German case Marks begin at the
article or other left edge of the nominal unit rather than at its parser head.
Ellipted coordinated German objects inherit the first object's case. Attributive
participles are no longer rendered as sentence predicates, and a nested gender
Mark is omitted when it would cross the flat enclosing nominal Mark. Target and
predicate emphasis may safely nest inside a grammatical Mark, so a tag is
rendered once before the phrase rather than repeated around an emphasized word.

Three exact-source German imperative parser corrections cover
`LEX346:de:6`, `LEX383:de:6` and `GFI005:de:primary`; tests verify that an
unrelated noun use of Stelle is untouched. The corrections change annotation,
not valid source sentences.

The existing renderer and grammatical tooltips remain in use. Optional emphasis
segments add a marker-like target layer and weaker predicate underlining. Grammar
marks are visually quieter. Tooltip IDs are unique per rendered sentence, hidden
tooltips no longer expand page width, and open tooltips stay within the viewport.

## Review queue and evidence limits

**3390 records require review**, with these reasons:

| Reason | Records |
| --- | ---: |
| Editorial target not confidently located | 3255 |
| Competing target matches | 59 |
| Insufficient fixed anchors | 16 |
| No predicate located | 60 |

The first three groups total **3330 uncertain Practice targets**. The remaining
60 are showcase records; many are short conversational fragments. No predicate
is fabricated to satisfy a coverage target. The review file contains source keys,
languages, exact text, formulas and reasons. Uncertain target emphasis is omitted.
Structural validation is not independent linguistic review or evidence of learning
efficacy. Intentional error/correction teaching examples remain source material.

- [Review queue](annotation-refresh-review.json)
- [Full-corpus validation](annotation-refresh-validation.json)
- [Before-refresh baseline](annotation-refresh-baseline.json)
- [Research, schema and reproduction note](../docs/ANNOTATION_REFRESH.md)

## Verification

- Private annotation suite: **34 passed**. Covers changed-source regeneration,
  EN complex auxiliaries/passive/phrasal verbs, DE modal/Perfekt/passive/Satzklammer,
  separable verbs, reflexives, lexical predicates, ambiguous matches, imperative
  corrections and UTF-16 offsets.
- `node scripts/annotation-refresh-audit.mjs`: **0 errors across all 12345 records**.
- `npm run verify`: **complete staged build passed; 379 tests passed**.
- `npm run test:e2e`: **25 passed, 1 expected skip** (the mobile-only navigation
  assertion is skipped in the desktop project).
- Whole-corpus renderer text preservation, source/formula drift, wrong language,
  invalid/overlapping/stale spans, rule vocabulary and public/private boundary
  checks passed. Established ID/URL preservation fixtures were not regenerated.
- Desktop 1440×1000 and mobile 390×844 were inspected. Target/predicate emphasis,
  line wrapping and grammar help were checked; neither viewport has horizontal
  document overflow. Screenshots are local under `output/playwright/`.

## Reproduction

spaCy **3.8.7**; English **en_core_web_trf 3.8.0**; German
**de_dep_news_trf 3.8.0**; private heuristic revision **2026-09-19.8**.
The Python 3.11 environment and pinned refresh requirements are in the private
research core. Public generation is `npm run annotations:practice`; it uses the
local batch API and does not publish the annotation engine.

Implementation fingerprints:

- Public generator SHA-256: `0195c311f717766bd14bacd90710be4193abd815fcd7d4bfe777d81efc98a48d`
- Private emphasis/rule implementation SHA-256: `39d7fd56e38da8c7565fd7c07ed5e1f2fb3636ad4d512d8e0916b26f8851775a`
- Private API SHA-256: `f5183b0f4964095e79f111fa4625e079437400feae84d8e62b34c6600c7473eb`

Both the public site worktree and the sibling private research-core worktree have
local changes. Deployment and human resolution of the review queue are separate
from this completed automated refresh.
