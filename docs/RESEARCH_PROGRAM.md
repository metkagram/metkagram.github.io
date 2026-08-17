# Metkagram research programme

Status: H1 cue-utility pilot implemented; no product-efficacy claim has been made and no H1 outcome is reported yet.

Metkagram combines sentence-first reading, minimal functional annotation, reusable pattern variation and delayed retrieval. Research on attention, focus on form, retrieval practice and spacing informs those decisions, but it does not prove that the Metkagram interface itself improves learning. That implementation-specific question must be tested directly.

## Hypothesis register

| ID | Predefined hypothesis | Comparison | Primary outcome |
|---|---|---|---|
| H1 | A minimal functional tag improves structural-role identification. | Annotated sentence vs the same sentence without annotation. | Correct role identification and response time. |
| H2 | Parallel pattern variations improve transfer to an unseen context. | Pattern plus variations vs rule explanation alone. | Accuracy on structurally matched, unseen production items. |
| H3 | Attempting retrieval before feedback improves delayed access. | Retrieval-first vs study-first exposure. | Delayed cued-production score. |
| H4 | One canonical token-level scheme can support both learning and computational analysis. | Independent human annotations on the same records. | Agreement, valid offsets and record completeness. |

The hypotheses are directional, but a study may use a non-inferiority design where appropriate. Any change to a primary outcome must be recorded before data inspection.

## Minimum study protocol

1. Register the hypothesis, comparison, primary outcome, sample rationale and exclusion criteria before collecting outcome data.
2. Change one mechanism at a time: annotation, variation, retrieval or spacing.
3. Use unseen examples for transfer tests. Familiar practice sentences measure memory for the material, not transfer.
4. Record target language, CEFR band, prior proficiency and relevant accessibility needs only when needed for the study.
5. Version every stimulus against a canonical record ID and dataset version.
6. Publish null and negative findings with positive findings.
7. Collect only necessary participant data and keep personal information outside the public language corpus.

## First pilot: H1 cue utility

The first implemented pilot tests H1 because it isolates the distinctive interface mechanism with a short, low-risk task.

- Study ID: `H1-CUE-UTILITY-V1`.
- Participants: adult English learners; B1–B2 is the predefined primary analysis band.
- Conditions: clean sentence; the same sentence with compact Metkagram functional tags.
- Task: select the subject, main verb or helper in eight English sentences, then answer a meaning-comprehension check.
- Co-primary descriptive outcomes: correct role identification and response time.
- Secondary outcomes: confidence and perceived visual load.
- Guardrail: sentence-comprehension accuracy.
- Assignment: approximately 50/50 random between-session assignment to `clean` or `tagged`.
- Data handling: browser-local storage only; export is explicit and participant-controlled.
- Reporting: condition estimates, uncertainty, exclusions, role-level breakdowns and null/negative findings.

The pilot is intentionally described as a **cue-utility** test. Because the tagged condition visibly exposes functional labels, it can show whether the notation is useful and efficient in the interface, but it cannot establish learning, retention or transfer.

The frozen protocol is in [`RESEARCH_PILOT_H1.md`](RESEARCH_PILOT_H1.md). Frozen stimuli are in `data/research/h1-cue-utility-v1.json`. The public experiment is generated at `/en/research/pilot-h1/` and `/ru/research/pilot-h1/`.

## Annotation-quality programme

The corpus should be evaluated separately from the learning interface.

- Sample records by language, collection, annotation type and difficulty.
- Give annotators the same versioned guide and hide the existing label during review.
- Report agreement by label, not only a single aggregate score.
- Track boundary disagreements separately from role disagreements.
- Convert adjudicated corrections into regression fixtures.
- Never use model output as its own quality reference.

## Evidence boundary

Metkagram may accurately say that its design is informed by established mechanisms and that its data is structured for reproducible analysis. It must not claim improved proficiency, retention or transfer until a suitable comparison study supports that claim.

The public research page is generated at `/en/research/`. Method references and the distinction between source findings and Metkagram interpretation are published at `/en/method/`.
