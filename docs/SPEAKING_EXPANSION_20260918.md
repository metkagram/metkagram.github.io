# Speaking expansion: 18 September 2026

## Delivered content

100 additive lexical-grammatical practice frames in ten study sets: 40 question frames and 60 statement/complement frames. Each has five distinct scenarios aligned in English, German and Russian: 500 scenarios, 1,500 sentence versions. The primary sentence is the first scenario, not an additional sixth example.

The canonical catalogue grows from 930 to 1,030 patterns and from 109 to 119 study sets. These are patterns and topic sets respectively, not interchangeable counts.

| Set | Practice focus | Patterns |
| --- | --- | ---: |
| SQA | Questions about experience and time | 10 |
| SQB | Questions about causes and explanations | 10 |
| SQC | Questions about choices and limits | 10 |
| SQD | Clarifying and challenging assumptions | 10 |
| SVA | Verbs and their prepositions | 10 |
| SVB | Infinitives and -ing complements | 10 |
| SAD | Attitudes, capacity and entitlement | 10 |
| SNC | Noun-based frames for precision | 10 |
| SPH | Phrasal verbs in real situations | 10 |
| SHB | Habits, adjustment and interpretation | 10 |

## Editorial choices

Titles describe reusable constructions rather than fabricated example sentences. Specific EN/RU usage notes are preserved ahead of generic renderer heuristics. Examples vary participants, settings, vocabulary and, where the construction permits, tense, aspect, polarity and sentence form. Fixed-tense questions retain their teaching target. No filler follow-up sentences were appended.

The English focus is a mix of grammatical mechanics and lexical complements, not a claim to introduce 100 wholly new grammar rules. German provides natural equivalents: a single English frame may require more than one German construction. In particular, neutral tend to and negatively coloured prone to can share German neigen; the distinction is taught in the usage notes. Matching meanings does not establish a formally reviewed Bridge.

## Checks and preservation

All 200 new language example sets pass the existing stricter C1 diversity rule, including at least 30 vocabulary tokens, at least 14 variable tokens and the original similarity limits. IDs, complete translations, five unique scenarios, schema membership and placeholder-normalized formula collisions are checked. No existing normalized formula was duplicated. These checks are not proof of semantic uniqueness or linguistic perfection.

Preservation checks confirm all 930 established pattern routes, all 95 established shard files and all 11196 established raw annotation records are unchanged. The original 630-pattern frozen fixture remains frozen; the earlier 300 GF additions remain explicit, and their limited example-enrichment ledger is not extended.

Run the focused checks with:

```sh
node --test tests/speaking-expansion.test.mjs tests/pattern-shards.test.mjs tests/practice-annotations.test.mjs tests/pattern-editorial-copy.test.mjs tests/pattern-example-enrichment.test.mjs
```

## Existing quality debt

Before these additions, the corpus-wide diversity rule already reports 460 established patterns / 861 language records below its floor, including the explicitly tracked undersized GF sets. This batch neither changes those examples nor relaxes the gate. A full repository verification can therefore remain red even when the new content and its integration pass. The workflow captures baseline and changed-revision results separately; do not report a green full verification without checking its actual result.

## Annotation and review status

The 1,200 annotation references (primary plus five variations in each language) are explicitly pending local annotation. They contain empty spans, text hashes and generator none; existing dependency annotations are untouched. Run the normal local parser pipeline later instead of treating plain text as reviewed Marks.

The examples are original AI-authored text with a revision pass and deterministic checks, not copied teaching material and not independently reviewed by native speakers. B2–C1 is an editorial learning target, not a measured learner outcome. Eligibility and entitlement examples are illustrative statements under named fictional rules, not legal guidance. Existing project licensing remains unchanged.
