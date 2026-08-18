# Metkagram annotation system: analysis and next rules

Status: research note / schema review  
Scope: legacy English and German sentence markup, canonical annotation schema 1.0, and pattern-card annotations.

## Why this matters

Metkagram's most distinctive idea is not simply to colour grammar. It places compact functional signals directly next to the words they describe, while the sentence remains readable.

That gives the project two useful outputs at the same time:

1. a learner can see structure inside a real sentence;
2. the same sentence can become structured data for search, comparison, NLP and experiments.

The current repository already moves in this direction. Legacy `text_span` trees are migrated into text-first records with independent `spans`. This is the right architectural direction because the sentence is now the source of truth and annotation is a layer over it.

## What the current notation encodes

The notation is functional rather than purely part-of-speech based.

| Family | Current marks | Main meaning |
|---|---|---|
| Sentence role | `S`, `S*` | subject / highlighted subject |
| Main verbal structure | `V`, `vI`, `v2`, `vP`, `Vp` | main verb, infinitive, secondary verb, participle variants |
| Helper verbs | `Hf`, `Hr`, `Hst`, `M` | future, result/state helpers and modal verbs |
| State / predicate | `st`, `st*`, `p2`, `pA`, `pS` | state, passive state, predicate or structural placeholders |
| German case | `/→`, `\\→`, `\\?` | accusative, dative and genitive cues |
| German word order | `←…` | inversion / changed word order |
| German morphology | `FEM`, `MASC`, `NEUT` | grammatical gender attached to a surface span |
| Pattern structure | `pattern_part` spans | reusable parts of a B2–C1 pattern card |

The legacy data also contains contextual NLP/dependency labels such as `nsubj`, `ROOT`, `VVFIN`, `aux`, `pobj`, `dobj` and others. Those are useful evidence, but they should not be confused with the learner-facing Metkagram notation.

## Strong parts of the method

### 1. Functional tags are closer to a learner's task

A learner usually needs to answer questions such as:

- Who performs the action?
- Which verb carries the main action?
- Which verb is only helping?
- Which form completes the construction?
- Which object or case does this structure require?

This is more useful for pattern learning than showing a complete linguistic parse.

### 2. Annotation is inline but does not need to become part of the text

The canonical schema stores `text` separately from `spans`. A span points to offsets in the original sentence. This makes it possible to render the same record in different ways: compact tags for learners, richer inspection for researchers, or plain text for accessibility.

### 3. The same model can support English and German

The shared structural roles (`S`, `V`, helpers, secondary verb forms) can stay stable across languages, while German-specific information such as case and gender can be added as features. This is a strong basis for cross-language research.

### 4. Pattern cards and sentence annotations can converge

The current canonical model already supports both sentence records and `pattern_card` records. This can connect the older visual annotation idea with the newer reusable-pattern direction instead of treating them as two unrelated products.

## Problems found in schema 1.0

### A. Different linguistic layers are mixed together

The current `type` values are:

- `subject`
- `verb`
- `helper`
- `function`
- `pattern_part`

`function` is too broad. It can end up representing case, gender or other structural information that has very different semantics.

The display code also groups unknown marks as `object`, while the canonical schema uses `function`. The visual taxonomy and the data taxonomy therefore do not fully describe the same model.

### B. Some legacy marks are not represented explicitly

Legacy data contains marks such as `H`, `st` and `st*`, but the canonical `tagKind()` helper does not give all of them a dedicated semantic category. They fall back to `function`.

This is safe as a migration fallback, but it should not become the long-term definition of the method.

### C. Morphology is only partly normalised

German gender is preserved as `feminine`, `masculine` or `neuter`. Past tense is also preserved. However, the canonical validator currently accepts only `past` as a tense value even though legacy data contains values such as `Pres`.

The better rule is to model tense as a feature with an explicit vocabulary, not as a special case for one value.

### D. Sequential legacy migration can lose structure

The legacy converter uses a pending visual tag and applies it to the next non-empty text token. This works well for many simple `S → word` and `V → word` sequences.

It is weaker for structural marks such as inversion arrows, case cues that conceptually belong to a phrase, or markup where another visual tag appears before a meaningful token. In those cases the visual signal can be narrower than its linguistic scope or can be overwritten during migration.

### E. Overlapping spans are forbidden

Schema 1.0 rejects overlapping spans. That makes rendering simple, but natural language often has layered structure.

For example, the same word can simultaneously be:

- part of the subject phrase;
- feminine;
- nominative;
- part of a reusable construction.

Forcing all of this into one non-overlapping annotation layer loses information.

### F. Provenance and uncertainty are too weak

A research-ready annotation should know how a label was produced. Current records contain some migration metadata, but a mature protocol should make these fields explicit:

- source: manual / rule / spaCy / other model;
- rule or model version;
- confidence where relevant;
- review status;
- annotator or reviewer ID where appropriate;
- disagreement / adjudication state.

## Proposed Annotation Schema 2.0 direction

Do not replace the compact Metkagram marks. Separate their visual form from their semantic meaning.

A span should have independent dimensions such as:

```text
surface label:   Hf
layer:           syntax
role:            auxiliary
function:        future
features:        { tense: present }
source:          legacy_manual
review_status:   reviewed
```

Another span can describe the same surface text on another layer:

```text
surface label:   FEM
layer:           morphology
role:            gender
features:        { gender: feminine }
```

Recommended layers:

1. **syntax** — subject, main verb, auxiliary, modal, complement, predicate;
2. **morphology** — tense, gender, case, voice, verb form;
3. **construction** — reusable chunk, slot, dependency between parts;
4. **pedagogy** — target of attention, optional hint, difficulty;
5. **provenance** — how the annotation was created and reviewed.

The learner does not need to see all these layers. The interface can still show one tiny tag. The richer model exists underneath so the notation remains consistent and testable.

## Proposed annotation contract

These rules should guide new manual or automatic annotations.

### Rule 1. Text is the source of truth

Tags, colours and arrows must never be inserted into the stored sentence itself. Annotation points to exact text offsets.

### Rule 2. Annotate the smallest useful span

Mark only the words needed to express the target function. Do not highlight an entire clause when one helper or one phrase carries the relevant information.

### Rule 3. Semantic meaning must not depend on colour

Colour can reinforce a role, but the role must also exist as a label or machine-readable feature.

### Rule 4. Keep learner notation separate from NLP evidence

`S` is a Metkagram learning mark. `nsubj` is an NLP/dependency label. They can support each other, but they are not the same thing.

### Rule 5. Keep the original label during migration

When legacy notation is normalised, preserve the original mark as provenance. This makes migration reversible and allows researchers to study changes in the notation system.

### Rule 6. Allow more than one layer on the same text

Syntax, morphology and construction membership can overlap. Schema 2.0 should allow layered annotations even if the default learner renderer chooses only one visible mark.

### Rule 7. Prefer explicit uncertainty to a forced label

If a rule or model cannot classify a span reliably, store `needs_review` or an uncertainty value. Incorrect certainty is worse than an incomplete annotation.

### Rule 8. Visual notation is derived from meaning

The semantic role should decide the style. CSS colour classes or arrow shapes should never be the only place where meaning is defined.

### Rule 9. A pattern annotation must describe reuse

For advanced pattern cards, mark the stable functional frame and its variable slots, not simply the words that were bold in one example.

### Rule 10. Every rule must be testable on unseen sentences

If annotators cannot apply the rule consistently to a new sentence, the rule is not precise enough yet.

## Research questions created by this audit

### R06 · Annotation agreement

Give the same English and German samples to two independent annotators. Measure agreement for label, span boundary and feature values. Review every disagreement category.

### R13 · Legacy preservation

Select a stratified sample of legacy records. Compare the original visual structure with schema 1.0 and the proposed schema 2.0. Measure which signals survive migration and which become narrower, broader or lost.

### R14 · Layered annotation

Compare a flat annotation model with syntax + morphology + construction layers. Measure whether the layered model improves consistency and downstream pattern search without making learner rendering more complex.

### R15 · Minimal learner view

Render the same rich annotation record with zero, one and several visible cues. Measure grammar-role detection, sentence comprehension and delayed production. The research data can be rich while the learner view stays intentionally small.

### R16 · Human vs rule/model annotation

For a reviewed sample, compare manual labels with spaCy/rule-generated labels. Report precision by annotation family instead of one total accuracy score.

## Quality audit note

The committed `reports/annotation-migration-report.json` is useful as a historical artifact, but its source totals and final sentence count are internally inconsistent. It should be regenerated before its totals are used as a public corpus statistic. Build-time migration already validates records and should become the authoritative source for future annotation metrics.

## Recommended next implementation steps

1. Freeze schema 1.0 as a migration compatibility format.
2. Write a small schema 2.0 proposal before changing data.
3. Create an explicit mapping table from every legacy Metkagram mark to semantic layer + role + features.
4. Add tests for `H`, `st`, `st*`, case arrows, inversion and multi-layer German spans.
5. Add provenance and review fields to service-produced annotations.
6. Run the annotation-agreement pilot before expanding the corpus.
7. Keep the learner UI selective even if the underlying data becomes richer.

## Main conclusion

The old Metkagram annotation system is more valuable than a collection of coloured grammar cards. It is an early domain-specific notation for turning natural sentences into compact, learner-oriented structural data.

The next step should not be to add more visible tags. It should be to formalise the annotation protocol underneath them. A richer internal schema can make the method easier to test, easier to automate, easier to compare across languages, and safer to evolve while the visible experience stays simple.
