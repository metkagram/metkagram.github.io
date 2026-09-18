# Contributing to Metkagram

Metkagram currently uses a **proposal-first contribution model**. The repository is public for inspection and transparency, but it is not an open-source contribution commons.

## Before opening a pull request

For substantial changes to source code, datasets, examples, translations, annotation rules, schemas, or research material, contact the project first or open a narrowly scoped proposal. Unsolicited bulk content and large implementation rewrites may be closed without review.

Do not submit material that you do not have the right to provide.

In particular, do not submit:

- copied textbook, course, website, or proprietary corpus content;
- generated translations or examples whose licensing/provenance is unclear;
- private or personal data;
- third-party datasets incompatible with Metkagram's rights model;
- code copied from another project without preserving its applicable license and notices.

## Why proposal-first

Metkagram's annotation system, corpus, and research direction are curated as one research asset. Accepting arbitrary code or data can create unclear ownership, provenance, and publication rights. A proposal-first process keeps those boundaries explicit before work is mixed into the project.

## Contribution terms

A GitHub pull request does not by itself give a contributor ownership of Metkagram's pre-existing code, data, method documentation, notation, or other project assets.

For significant external contributions, Metkagram may require a separate written contributor or collaboration agreement before merge. That agreement can define ownership, licensing, attribution, publication, and relicensing rights for the contribution.

Do not submit a substantial contribution if you are not comfortable discussing those terms before merge.

## Good proposals

Useful proposals explain:

1. the problem or research question;
2. the exact files/data affected;
3. why the change improves learning, NLP quality, reproducibility, or maintainability;
4. the source and rights status of any new content;
5. how the result can be tested;
6. whether publication, commercial use, or external redistribution is expected.

Small bug reports, typo reports, accessibility issues, and factual corrections are welcome as ordinary issues.

## Practice-example editorial standard

A pattern should teach a reusable Frame, not seven cosmetic rewrites of one sentence. For every 5–7 example set:

- keep the target structure recognisable while changing the underlying situation and meaning;
- use materially different domains, participants, nouns, verbs and collocations so practice also expands productive vocabulary;
- vary time reference, polarity, modality or register when the target Frame allows it;
- prefer plausible, specific sentences that a learner could reuse in real speech over synthetic filler;
- keep English and German independently idiomatic and make Russian support text read as natural Russian;
- do not introduce variation that obscures the grammar or discourse feature the pattern is meant to teach.

All canonical English/German example sets are protected by an automated near-clone / variable-vocabulary regression gate, with a stricter lexical-breadth threshold for C1. Bulk context substitution is not an acceptable enrichment strategy. Passing the metric is only a floor: examples should still be specific, interesting enough to say aloud, and useful for expanding productive vocabulary.

## Research collaboration

For experiments, corpus studies, annotation research, model evaluation, or student projects, use [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md) rather than sending a large data/code PR first.

## Licensing

See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md). Public visibility of the repository does not mean that source code, data, or research material may be freely copied, modified, or redistributed.
