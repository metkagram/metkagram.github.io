# Spoken-practice handoff

Metkagram can project a small canonical language task into an external speaking/rehearsal tool without becoming a speech engine or exporting a second copy of the corpus.

The contract is intentionally provider-neutral. Ptichi may be an owner-authorized first consumer, but no Ptichi-specific transport, scoring model, acoustic target or product promise belongs in the Metkagram schema.

## Product boundary

Metkagram owns the language reference:

`Mark → Frame → Move → Contrast → Choice → Route → Bridge`

A rehearsal consumer owns capture, playback, delivery feedback, speech evidence and local session state.

The handoff therefore contains only:

- a stable source object type, ID and canonical/API URL;
- dataset/release identity, source hash and provenance;
- independent practice language, interface locale, support-translation locale and optional Bridge language;
- bounded semantic references such as Move, Pattern/Frame, Contrast, Choice and ordered Route step IDs;
- one communicative job, production prompt, optional self-check and changed-context transfer prompt;
- current rights/attribution references and a narrow cache scope.

The published `1.0.0` contract does **not** contain copied Pattern examples, full Route instructions, audio, transcripts, ASR output, prosody labels or pronunciation/speech scores.

## Visual learning projection

A follow-up compatible contract extension is tracked in #130 because the Metkagram learning object is not only a prompt. When a reviewed example exists, the useful source experience may include:

- Pattern/Frame identity or formula;
- the original learning-language sentence;
- structured visual Marks / annotation spans;
- a learner-support translation with an explicit locale;
- stable example/annotation identity;
- a versioned display profile.

Current public source data already contains the raw ingredients for reviewed examples, including `original_text`, structured `text_span` annotation data and `translations`. An authorized consumer should receive a bounded structured projection of that material rather than scrape Metkagram HTML or reverse-engineer site CSS.

The visual extension must remain small and versioned. Prefer a safe display AST / normalized span model over arbitrary HTML/CSS/JavaScript.

The intended consumer rendering boundary is:

```text
Pattern / Frame
→ annotated sentence with Metkagram Marks
→ learner-support translation
→ external spoken-practice controls
```

The consumer may reproduce the visual hierarchy with its own typography and interaction system. Semantic visual parity matters more than pixel-perfect cloning.

### Visual degradation

The visual layer is an enhancement to a valid practice task:

- reviewed annotation available and supported → render the annotated sentence;
- annotation absent/unsupported → render the plain source sentence;
- support translation available → render it with its explicit locale;
- translation unavailable → say so rather than generate one;
- visual-rendering failure must not become a speech-analysis failure.

### Visual marks are not speech truth

A visual Mark, grammar tag, syntactic grouping or annotation boundary remains linguistic/learning context. It does not automatically establish:

- a pause or thought-group target;
- pitch or energy movement;
- pronunciation quality;
- an acoustic score;
- any other speech intervention.

The rehearsal consumer remains responsible for its own validated speech/evidence model.

## Public static resources

After the normal production build:

- schema: `/api/v1/schemas/spoken-practice-handoff.json`
- reference handoffs: `/api/v1/spoken-practice-handoffs.json`
- direct Choice lookup: `/api/v1/choices/{id}.json`
- direct Route lookup: `/api/v1/routes/{id}.json`
- existing direct Pattern lookup: `/api/v1/patterns/{id}.json`

The three current reference fixtures deliberately cover Pattern, Choice and Route task projections. They are examples of the transport boundary, not a new dataset to mirror or bulk-sync. #130 owns the additional annotated-example visual fixture and the schema/versioning decision required to publish it safely.

## Projection rule

A consumer should work from meaning rather than simply read the displayed model aloud:

1. resolve the canonical Metkagram object;
2. keep the communicative job / Move visible;
3. when available, use the annotated example + translation for noticing and understanding;
4. ask the learner to retrieve or construct wording rather than repeatedly reading the model;
5. rehearse externally;
6. change the context or wording and produce again;
7. return to the canonical Metkagram object when language structure needs inspection.

If a referenced object or requested learning language cannot be resolved, the projection fails explicitly. It must not invent a Metkagram ID, translation, Frame, speech target or Bridge.

## Rights and caching

Publishing the schema does not change Metkagram's source-available licensing terms. Current rights metadata and attribution travel with every generated handoff.

A legitimate authorized integration may cache one user-requested immutable handoff snapshot where its permission allows that use. A visual projection may include only the bounded reviewed example material explicitly authorized by the handoff contract; it is not permission to bulk-copy annotations, examples or translations.

This contract does not grant permission to bulk-copy, mirror, repackage or redistribute the underlying Metkagram corpus. Public third-party use remains governed by the current licensing terms and any separately granted permission.

## Delivery state

M0 and M1 remain intentionally static:

- versioned schema;
- deterministic reviewed fixtures;
- build-time validation;
- static handoff/API projection;
- direct read-only Choice and Route retrieval for consumers;
- no account, callback, webhook or backend.

Current task projection `1.0.0` is published. The visual annotated-example extension is **planned/in development under #130**, not yet part of the published handoff schema.

There is no public `Practice aloud` CTA until a real consumer path exists and can fail honestly. A future consumer adapter should translate this contract at the edge rather than add provider-specific fields to canonical Metkagram data.
