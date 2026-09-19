# Annotation refresh: evidence and implementation contract

The current source sentences and their language-specific formulas are authoritative.
The refresh covers all public EN/DE Practice examples and the 72-document public
showcase. It does not export the private document corpus. The existing grammatical
labels and renderer remain authoritative; emphasis is supplementary span metadata.

## Research-informed design

- Lee and Huang's [2008 meta-analysis](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/visual-input-enhancement-and-grammar-learning-a-metaanalytic-review/B9D0C50B09928C20C94548B37B29A042)
  examines visual input enhancement. Highlighting alone must not be presented as
  proof of acquisition. Our design uses restrained emphasis alongside the existing
  retrieval workflow; B2–C1 learning efficacy still requires a learner study.
- Boers et al.'s [2006 experiment](https://journals.sagepub.com/doi/10.1191/1362168806lr195oa)
  investigates noticing formulaic sequences and perceived oral proficiency.
  Design inference: emphasize the reusable lexical/constructional frame, leave its
  variable slots readable, and preserve the whole sentence for meaning.
- IDS describes [Satzklammer](https://grammis.ids-mannheim.de/terms/view/542) and
  [Infinitkomplexe](https://grammis.ids-mannheim.de/systematische-grammatik/811).
  A German predicate may be discontinuous. Preserve word order and group its
  components by metadata; never highlight the entire intervening field as a verb.

Visual priority: target frame (strongest), predicate unit (secondary), existing
grammar marks (subtle). No extra badges, syntax rainbow or replacement renderer.
Parser analysis supports the editorial formula and never substitutes a new target.
Ambiguous matches must produce review items, not confident emphasis.

## Initial inspection

The original environment contained spaCy 3.8.7 with `en_core_web_sm` 3.8.0 and
`de_core_news_sm` 3.8.0. Its interpreter symlink pointed to a removed Xcode path.
The refresh uses a private Python 3.11 environment, spaCy 3.8.7,
`en_core_web_trf` 3.8.0 and `de_dep_news_trf` 3.8.0. Both models have trained
dependency parsers; generation rejects tokenizer-only fallback. The stronger
models were installed after the small models missed ordinary finite predicates.
The private service is under the sibling Metkagram repository's
`research_core/source/annotation_service/`; keep linguistic implementation there.

The old service maps all EN `aux` to `Hf` despite that label meaning future helper,
and maps DE objects to `p2`, absent from the German vocabulary. It also assumes
Python character offsets are UTF-16 offsets. These are annotation errors, not
reasons to rewrite correct source sentences.

One pre-existing vocabulary inconsistency also needed alignment: the English
legacy engine (`enSpanBuilder.enVerbAuxilary` / `enVerbModal`) and the public
Method page already use `M` for English modals, but the English allowed-label
list and rule catalogue omitted it. The refresh retains that existing `M` meaning
and adds its missing catalogue entry. It does not invent a modal tag or label
English modals as main lexical verbs. Do-support receives predicate emphasis
without inventing the legacy engine's unlisted generic `H` label.

`reports/annotation-refresh-baseline.json` records the original state at
`f16953f1b`: 948 Patterns, 109 study sets, 5,688 Practice records per language,
573 EN and 396 DE showcase sentences. The earlier redesign branch predates the
cleansing and is not the source of this refresh.

`node scripts/annotation-refresh-audit.mjs` validates the complete refreshed corpus
and exports current work into ignored `.tmp/annotation-refresh/work.json`.
Source SHA-256 covers the
language, exact clean sentence and formula, so formula-only changes invalidate
target emphasis. Missing old hashes are recorded separately from stale text.

## Reproduction and boundaries

In the private service directory, install `requirements-refresh.txt` into `.venv`
and run `.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8080`.
Model overrides are `METKAGRAM_SPACY_EN_MODEL` and `METKAGRAM_SPACY_DE_MODEL`.
The private `tests/test_learning_emphasis.py` exercises complex predicates,
discontinuous German frames, inflection, ambiguous matches and UTF-16 offsets.

In the public site checkout:

```sh
npm run annotations:practice
node scripts/annotation-refresh-audit.mjs
npm run verify
npm run test:e2e
```

The generator batches current source sentences, validates the entire result before
replacing files, refreshes the existing Practice sidecar, and attaches a canonical
annotation to each public showcase sentence. It retains the legacy showcase data,
IDs, source text and translations. Canonical exports and page rendering consume
the same refreshed records. Successfully rebuilt records clear the pending ledger.

The optional `emphasis` field groups exact UTF-16 segments as `target` or
`predicate`; it does not add grammatical tags. Multiple segments retain sentence
order. Target emphasis wins where layers overlap. The original renderer still
renders grammar Marks and their existing tooltips.

The private implementation distinguishes formula variables from literal anchors,
matches inflected lemmas, recognizes editorial alternatives, and uses dependency
relations for German verb movement, auxiliary chains, particles and reflexives.
It abstains when multiple targets compete or the editorial target cannot be
located. This is bounded automated annotation, not independent linguistic review.
Unresolved cases remain inspectable in `reports/annotation-refresh-review.json`.

Three reviewed German imperative repairs are bound to exact source sentences
(`LEX346:de:6`, `LEX383:de:6`, `GFI005:de:primary`). They correct the parser's
noun analysis of the initial imperative and its separable particle where present.
They do not rewrite valid German or generalize to unrelated noun uses.

The final corpus audit is `reports/annotation-refresh-validation.json`.
Build and browser completion must be checked separately from corpus generation.
