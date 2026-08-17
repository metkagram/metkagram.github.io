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
| Retrieval spacing | Kang et al. (2014) found similar final recall for expanding and equal spacing in a long-term vocabulary task, although the practice experience differed. A 2025 online replication also found spaced sessions better than massed study on a 10-day delayed vocabulary test. | Spacing matters, but the exact schedule should be tested instead of copied as a fixed rule. | R12 Review gap |
| Target-specific effects | A 2020 study of captions and textual enhancement found different learning effects across grammar and vocabulary targets. | Report Metkagram results by pattern family, not only as one total score. | All learning experiments |
| Morphological salience | Fernández Santos et al. (2026) found sensitivity to morphosyntactic violations only in the high-salience condition of an artificial-language learning task. | A cue may need to be noticeable enough to direct attention. The useful level of salience is still an empirical question. | R07 Salience strength |
| Chunk formation | Wei, Wang & MacWhinney (2026) found that L2 learners face difficulty binding relatively large multi-word expressions and argued for gradual binding of smaller units into larger chunks. | A reusable pattern may be easier to learn when it grows from a small stable chunk into a larger frame. | R08 Progressive chunking |
| Skill stages | Maie & Godfroid (2025) found evidence consistent with declarative, procedural and automatic stages in deliberate L2 skill learning. Early performance related more to declarative ability, with procedural ability becoming more important later. | The same interface may not be optimal from first explanation to fluent production. Practice can change as the pattern becomes more available. | R09 Stage-aware practice |
| Feedback complexity | A 2025 experiment on semi-open-ended language questions found that concise immediate correct-response feedback produced better outcomes than more elaborate feedback in that task and improved learners' judgments of learning. | Explanations should be available, but not necessarily forced after every answer. | R10 Feedback depth |
| Web-based measurement | Kim et al. (2024) found a web-based elicited-imitation task had measurement relationships comparable to a laboratory version for L2 English morphosyntax and proficiency. | A first Metkagram pilot can measure production remotely without pretending a browser test is identical to every lab measure. | Pilot measurement design |
| Accessible cueing | Badri, Graham & Zhang (2026) found short-term benefits from aural input enhancement for vocabulary learning, including visually impaired learners, with effects moderated by proficiency and not maintained at delayed test. | Metkagram notation should not depend on colour or vision alone. Important cues need text and, where useful, an aural equivalent. | R11 Cue modality |
| Automated production analysis | Mizumoto (2025) reported high agreement between an automated L2 error-analysis prototype and human raters, while also noting context-dependent limitations. | Automated scoring can lower research cost, but human checks should remain the reference for validation. | Research infrastructure |

## Source registry

- Lee, S. K., & Huang, H. T. (2008). *Visual input enhancement and grammar learning: A meta-analytic review.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/visual-input-enhancement-and-grammar-learning-a-metaanalytic-review/B9D0C50B09928C20C94548B37B29A042
- *Contextual learning and retention of phrasal verbs* (2025). Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/contextual-learning-and-retention-of-phrasal-verbs/128F4CAA5D71E7146B0F579E919AF794
- Pulido, M. F. (2024). *Optimizing the input for learning of L2-specific constructions: The roles of Zipfian and balanced input, explicit rules, and working memory.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/optimizing-the-input-for-learning-of-l2specific-constructions-the-roles-of-zipfian-and-balanced-input-explicit-rules-and-working-memory/89BEAAAE58A0D8DD11FCEC7D5837BF18
- Kang, S. H. K. et al. (2014). *Retrieval practice over the long term: Should spacing be expanding or equal-interval?* Psychonomic Bulletin & Review. https://pubmed.ncbi.nlm.nih.gov/24744260/
- Rogers, J., Nakata, T., & Chiu, M. M. (2025). *Optimizing distributed practice online: A conceptual replication of Cepeda et al. (2009).* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/optimizing-distributed-practice-online/C833408A4C3BAD939CA39EA734423BB7
- *Investigating textual enhancement and captions in L2 grammar and vocabulary* (2020). Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/investigating-textual-enhancement-and-captions-in-l2-grammar-and-vocabulary/EF080D9AC64C7E2BFFB90AC799C38C69
- Fernández Santos, S., Rebuschat, P., Correia, S., Monaghan, P., & Llompart, M. (2026). *The effect of morphological salience and novel phonology in the initial stage of second language learning.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effect-of-morphological-salience-and-novel-phonology-in-the-initial-stage-of-second-language-learning/82DBA3596AAD367CC09993CD6FBD41D3
- Wei, Y., Wang, J., & MacWhinney, B. (2026). *Chunking words into multi-word expressions: exploring chunking ability in immediate recall among second language learners of Chinese.* Applied Psycholinguistics. https://www.cambridge.org/core/journals/applied-psycholinguistics/article/chunking-words-into-multiword-expressions-exploring-chunking-ability-in-immediate-recall-among-second-language-learners-of-chinese/8BCA3A1376B0250BD7920263EA1954D9
- Maie, R., & Godfroid, A. (2025). *Testing the three-stage model of second language skill acquisition.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/testing-the-threestage-model-of-second-language-skill-acquisition/DF879921EDE594E795CBD8C18A87E86E
- *From belief to evidence: simpler immediate feedback improves language learning and confidence in semi-open-ended questions* (2025). Frontiers in Education. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1654809/full
- Kim, K. M., Liu, X., Isbell, D. R., & Chen, X. (2024). *A comparison of lab- and web-based elicited imitation: Insights from explicit-implicit L2 grammar knowledge and L2 proficiency.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/comparison-of-lab-and-webbased-elicited-imitation-insights-from-explicitimplicit-l2-grammar-knowledge-and-l2-proficiency/1E9151CA630EC7B73C1537787FB10D09
- Badri, A., Graham, S., & Zhang, P. (2026). *Bridging barriers: Aural cues, codeswitching, and proficiency in vocabulary learning for visually impaired learners.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/bridging-barriers/E488EF8F78D99080C3D319F9262B45F0
- Mizumoto, A. (2025). *Automated analysis of common errors in L2 learner production: Prototype web application development.* Studies in Second Language Acquisition. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/automated-analysis-of-common-errors-in-l2-learner-production-prototype-web-application-development/631312E8DD4EB9CE558EFF6FD16C6520

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

### R07 — Salience strength

**Question:** How strong should a visual grammar cue be?

- Compare: no cue vs restrained cue vs high-salience cue for one target role.
- Primary outcome: detection of the target form in unseen sentences.
- Guardrail: sentence comprehension and visual-load rating.
- Product decision: colour, contrast and emphasis rules for tags.

### R08 — Progressive chunking

**Question:** Should a learner build a pattern from a small chunk before seeing the full frame?

- Compare: full pattern from the start vs small stable chunk → larger chunk → full pattern.
- Primary outcome: immediate and delayed production of the full pattern.
- Secondary outcome: error location inside the chunk.
- Product decision: whether Pattern Practice should support progressive chunk growth.

### R09 — Stage-aware practice

**Question:** Should practice change after a pattern becomes accurate but still slow?

- Compare: one fixed task format vs a staged path from explanation to recognition to timed production.
- Primary outcomes: accuracy and response speed over repeated sessions.
- Product decision: introduce explicit learning stages only if they improve transition to fluent use.

### R10 — Feedback depth

**Question:** How much feedback is useful immediately after an error?

- Compare: correct answer only vs short explanation vs detailed explanation.
- Primary outcome: correct use on the next unseen item and delayed post-test.
- Secondary outcome: confidence and time spent on feedback.
- Product decision: default feedback depth and whether explanations stay collapsed.

### R11 — Cue modality

**Question:** Can the same functional cue work without colour or vision?

- Compare: visual tag vs textual accessible label vs optional aural cue, using the same target role.
- Primary outcome: role identification and later pattern recall.
- Guardrail: accessibility and usability reports.
- Product decision: make every important notation cue available through more than colour alone.

### R12 — Review gap

**Question:** What delay between pattern sessions gives useful retention without making practice unnecessarily hard?

- Compare: massed practice with two or more spaced schedules.
- Primary outcome: delayed production after a fixed retention interval.
- Secondary outcomes: practice accuracy and dropout from the review sequence.
- Product decision: tune review intervals from evidence instead of copying one standard SRS schedule.

## Measurement ideas

Learning should be measured with more than recognition accuracy.

- Add unseen production items for transfer.
- Record response time when the task is simple enough for timing to be meaningful.
- Use a short web-based elicited-imitation task as one optional measure of morphosyntactic access.
- Track comprehension as a guardrail whenever visual annotation is manipulated.
- For research-scale production tasks, automated error counts may be used only after calibration against human ratings.
- When possible, separate **knowing the rule**, **using it accurately**, and **using it quickly**.

## Product decision rules

- If more tags improve role detection but reduce sentence comprehension, show fewer tags by default.
- If reading before annotation improves meaning and later form recall, use progressive reveal.
- If varied examples improve transfer, require meaningful variation before a pattern is published.
- If different proficiency groups benefit from different ordering, create separate learning paths.
- If higher salience improves noticing without harming comprehension, keep the stronger cue only for the target role, not the full sentence.
- If progressive chunking improves full-pattern production, add chunk growth as a practice mode.
- If staged practice improves speed after accuracy is already high, change the task rather than simply repeating it.
- If concise feedback works as well as or better than long explanations, keep the default feedback short and make detail optional.
- If an important cue cannot be understood without colour, redesign it.
- If annotator agreement is weak for a label, revise the label and guide before generating more data.
- Keep small, mixed and negative results in the public research record. They define the limits of the method.

## Minimum reporting standard

For learning studies, report the predefined comparison, sample rationale, exclusions, primary outcome, effect estimate with uncertainty, unseen transfer items, comprehension guardrail and null findings. For annotation studies, report agreement by label and boundary separately.

Do not collect participant data through the public website without explicit study consent and an approved data-handling plan.
