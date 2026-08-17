# H1 cue-utility pilot

Status: protocol frozen before outcome data collection.

Study ID: `H1-CUE-UTILITY-V1`

This is an exploratory interface pilot, not a language-learning efficacy trial.

## Question

Does inline Metkagram functional notation help adult B1–B2 English learners identify a requested sentence role faster or more accurately than the same sentence shown without notation, while preserving sentence comprehension?

The pilot tests cue utility in the interface. It does not test whether the notation improves long-term learning, retention or transfer.

## Hypothesis

Compared with the clean condition, the tagged condition will support faster and/or more accurate identification of the requested structural role.

A useful result must not come with a material loss in sentence-comprehension accuracy or an unacceptable increase in perceived visual load.

## Design

- Population: adults aged 18+ learning English, target analysis band CEFR B1–B2.
- Assignment: one browser session is randomly assigned to `clean` or `tagged` with approximately equal probability.
- Design: between-participant condition, same eight stimuli in a session-specific random order.
- Clean condition: identical selectable sentence chunks without functional labels.
- Tagged condition: the same chunks with compact functional labels visible inline.
- Task 1: select the chunk carrying a requested role (`subject`, `main verb`, or `helper verb`).
- Task 2: answer one true/false meaning-comprehension statement about the sentence.
- End-of-session rating: perceived visual load on a five-point scale.

The chunk boundaries are identical across conditions so the manipulated variable is the visible functional label rather than segmentation.

## Outcomes

Co-primary descriptive outcomes:

1. role-identification accuracy across eight trials;
2. response time in milliseconds for role identification, reported for correct responses and with participant-level medians.

Secondary outcomes:

- confidence after each structural selection;
- perceived visual load at the end of the session.

Guardrail outcome:

- comprehension accuracy.

## Pilot sample rationale

Target: at least 40 eligible completed sessions, approximately 20 per condition.

This is a feasibility and signal-estimation target, not a powered confirmatory sample. The purpose is to estimate direction, task usability, timing variance, ceiling/floor effects and whether a larger preregistered study is worth running.

If the target is not reached, the result can still be reported as a smaller exploratory pilot with the actual sample clearly stated.

## Eligibility and exclusions

Primary analysis includes sessions that:

- confirm age 18+ and voluntary participation;
- report English level B1 or B2;
- complete at least 6 of the 8 structural trials;
- do not have a participant-level median structural response time below 250 ms.

C1+ and other self-reported levels may be retained for exploratory inspection but are not part of the predefined B1–B2 target analysis.

Do not add or remove exclusions after looking at condition outcomes without documenting the change as post hoc.

## Analysis plan

Report both conditions separately and the between-condition difference.

For role identification:

- completed eligible sessions;
- mean participant accuracy;
- median participant accuracy;
- difference in percentage points.

For response time:

- participant median response time on correct structural trials;
- group median of participant medians;
- between-condition difference.

For comprehension:

- mean participant comprehension accuracy;
- difference in percentage points as a guardrail.

For confidence and visual load:

- descriptive distributions and condition medians.

For uncertainty, use a participant-level bootstrap for condition differences when enough sessions are available. Report the resampling method and interval. Do not turn this pilot into a confirmatory claim by adding a convenient p-value after seeing the data.

Also report results by target role (`subject`, `main_verb`, `helper`) because an overall mean may hide that the notation is useful for one role and redundant for another.

## Interpretation rules

The pilot supports further study when the tagged condition shows a practically useful accuracy and/or speed signal without a concerning comprehension penalty, and the task does not show severe ceiling effects.

A speed benefit with identical accuracy is potentially useful.

An accuracy benefit with slower responses may still be useful, but the trade-off must be explicit.

A structure benefit paired with lower comprehension is not an automatic win.

A null or negative result should be retained and used to change the interface or hypothesis.

## Data handling

The experiment does not automatically send responses to Metkagram or a third party.

A session is stored only in the participant's browser until the participant explicitly exports a JSON or CSV file. The exported record contains:

- study and stimulus versions;
- random condition;
- anonymous random session ID;
- self-reported CEFR band;
- trial order;
- selected chunks;
- correctness;
- response times;
- confidence;
- comprehension responses;
- visual-load rating;
- browser language and coarse device class.

It does not request a name, email address, account, precise location or free-text demographic profile.

Researchers collecting exported files outside the website are responsible for their own consent, storage and institutional requirements.

## Stimulus source

The frozen public stimulus file is:

`data/research/h1-cue-utility-v1.json`

Any change to wording, role labels, answers or outcome definitions requires a new study version before further data are mixed with version `1.0.0`.

## Reporting boundary

Acceptable language before a larger controlled study:

> In an exploratory cue-utility pilot, Metkagram tested whether inline functional labels changed structural-role identification speed and accuracy.

Do not describe this pilot as evidence that Metkagram improves English proficiency, retention or transfer.
