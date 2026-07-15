# Metkagram C1 curriculum

Metkagram has two complementary modes.

- **Annotated Language / Аннотированные фразы** keeps grammar visible inside complete English and German sentences.
- **Pattern Practice / Практика паттернов** turns reusable B2–C1 moves into active-recall items, organised in named study sets and two learning paths.

The public curriculum is stored in `data/advanced-patterns.json`; its set catalogue and paths are in `data/study-sets.json`. A pattern is complete only when it includes its stable ID, title, category/set membership, English and German formulas, natural examples, Russian translations, and at least two translated variations for each target language.

## Learning paths

`C1 Communication` covers argumentation, stance, evidence, agreement and disagreement, qualification, probability, clarification, comparison, cause/effect, and negotiation.

`C1 Control` covers professional communication, storytelling, connectors, conditionals, modality, passive and impersonal style, reported speech, tense/aspect, questions/negatives/reference, and German grammar in use.

## Quality gates

The content loader rejects a build when the collection falls below 1,000 patterns; IDs or formulas repeat; any English/German formula, example, Russian translation, or variation is missing; a pattern belongs to an unknown set; a path references an unknown set; or a set has no complete patterns. Existing pattern IDs and detail routes remain unchanged, and the SRS retains the `metkagram:progress:v2` format plus legacy normalization.
