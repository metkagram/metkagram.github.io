# Metkagram research notes

Status: living evidence log and experiment backlog. Updated 17 August 2026.

Metkagram uses research from second-language learning, memory and language annotation to create testable questions. A related study can support a design hypothesis, but it does not prove that the Metkagram interface improves learning. Product-specific effects must be measured directly.

## Working rule

For every important design idea, keep four parts separate:

1. **Source finding** — what an outside study actually found.
2. **Metkagram interpretation** — why the finding may matter here.
3. **Experiment** — what comparison can test the idea inside Metkagram.
4. **Decision** — what we will change if the result supports or rejects the hypothesis.

This prevents a common research mistake: turning evidence about a nearby mechanism into an efficacy claim about the product.

## Evidence notes

| Topic | Source finding | Metkagram interpretation | Next test |
|---|---|---|---|
| Visual input enhancement | Lee & Huang (2008) reported a small average grammar-learning benefit, with a possible cost to meaning processing. | More visual markup is not automatically better. Minimal annotation should be tested against fuller markup. | R01 Tag density |
| Context before extra help | A 2025 study on phrasal verbs found stronger learning when definitions followed reading rather than coming before it; typographic enhancement also supported contextual learning. | Keep the sentence readable first, then reveal extra explanation when useful. | R02 Progressive reveal |
| Input distribution | Pulido (2024) found that balanced and strongly repeated input can interact with learner characteristics and task conditions. | One example order may not be best for every learner. | R04 Pattern order |
| Retrieval spacing | Kang et al. (2014) found similar final recall for expanding and equal spacing in a long-term vocabulary task, although the practice experience differed. | Review timing should be treated as a parameter to test, not as a fixed doctrine. | R05 Recall and later spacing tests |
| Target-specific effects | A 2020 study of captions and textual enhancement found different learning effects across grammar and vocabulary targets. | Report Metkagram results by pattern family, not only as one total score. | All learning experiments |

## Source registry

- Lee, S. K., & Huang, H. T. (2008). *Visual input enhancement and grammar learning: A meta-analytic review.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/visual-input-enhancement-and-grammar-learning-a-metaanalytic-review/B9D0C50B09928C20C94548B37B29A042
- *Contextual learning and retention of phrasal verbs* (2025). Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/contextual-learning-and-retention-of-phrasal-verbs/128F4CAA5D71E7146B0F579E919AF794
- Pulido, M. F. (2024). *Optimizing the input for learning of L2-specific constructions: The roles of Zipfian and balanced input, explicit rules, and working memory.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/optimizing-the-input-for-learning-of-l2specific-constructions-the-roles-of-zipfian-and-balanced-input-explicit-rules-and-working-memory/89BEAAAE58A0D8DD11FCEC7D5837BF18
- Kang, S. H. K. et al. (2014). *Retrieval practice over the long term: Should spacing be expanding or equal-interval?* Psychonomic Bulletin & Review. https://pubmed.ncbi.nlm.nih.gov/24744260/
- *Investigating textual enhancement and captions in L2 grammar and vocabulary* (2020). Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/investigating-textual-enhancement-and-captions-in-l2-grammar-and-vocabulary/EF080D9AC64C7E2BFFB90AC799C38C69

## Experiment queue

### R01 — Tag density

**Question:** How much visible annotation is useful before it becomes visual load?

- Compare: clean sentence vs one target tag vs fuller markup.
- Primary outcome: correct role identification.
- Guardrail: sentence-comprehension accuracy.
- Secondary outcomes: response time and perceived visual load.
- Product decision: default annotation density.

### R02 — Progressive reveal

**Question:** Should the learner see the sentence before the annotation?

- Compare: tags visible immediately vs tags revealed after the first read.
- Primary outcome: delayed recall of the target form.
- Guardrail: sentence comprehension.
- Product decision: default reading interaction.

### R03 — Variation and transfer

**Question:** Do varied examples help learners use a pattern in a new context?

- Compare: repeated examples from one context vs examples that vary person, tense and situation.
- Primary outcome: production accuracy on unseen, structurally matched examples.
- Product decision: minimum variation requirements for a published pattern.

### R04 — Pattern order

**Question:** Should common forms be repeated strongly at the start or distributed more evenly?

- Compare: a balanced sequence vs a sequence with a strongly repeated early form.
- Primary outcome: learning speed and later transfer.
- Report separately by proficiency band.
- Product decision: one common path vs several learning paths.

### R05 — Recall before feedback

**Question:** Does attempting a pattern before seeing the answer improve later access?

- Compare: rereading vs recall-before-feedback.
- Primary outcome: delayed cued production.
- Secondary outcome: immediate accuracy during practice.
- Product decision: where active recall belongs in Pattern Practice.

### R06 — Annotation agreement

**Question:** Is the annotation scheme clear enough for two people to apply independently?

- Compare: two independent annotations of the same stratified sample.
- Primary outcome: agreement by label.
- Secondary outcomes: span-boundary disagreement and adjudication rate.
- Product decision: revise weak labels before expanding the corpus.

## Product decision rules

- If more tags improve role detection but reduce sentence comprehension, show fewer tags by default.
- If reading before annotation improves meaning and later form recall, use progressive reveal.
- If varied examples improve transfer, require meaningful variation before a pattern is published.
- If different proficiency groups benefit from different ordering, create separate learning paths.
- If annotator agreement is weak for a label, revise the label and guide before generating more data.
- Keep small, mixed and negative results in the public research record. They define the limits of the method.

## Minimum reporting standard

For learning studies, report the predefined comparison, sample rationale, exclusions, primary outcome, effect estimate with uncertainty, unseen transfer items, comprehension guardrail and null findings. For annotation studies, report agreement by label and boundary separately.

Do not collect participant data through the public website without explicit study consent and an approved data-handling plan.
