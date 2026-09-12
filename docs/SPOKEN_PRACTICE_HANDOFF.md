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

It does **not** contain copied Pattern examples, full Route instructions, audio, transcripts, ASR output, prosody labels or pronunciation/speech scores.

## Public static resources

After the normal production build:

- schema: `/api/v1/schemas/spoken-practice-handoff.json`
- reference handoffs: `/api/v1/spoken-practice-handoffs.json`
- direct Choice lookup: `/api/v1/choices/{id}.json`
- direct Route lookup: `/api/v1/routes/{id}.json`
- existing direct Pattern lookup: `/api/v1/patterns/{id}.json`

The three reference fixtures deliberately cover Pattern, Choice and Route projections. They are examples of the transport boundary, not a new dataset to mirror or bulk-sync.

## Projection rule

A consumer should work from meaning rather than simply read the displayed model aloud:

1. resolve the canonical Metkagram object;
2. keep the communicative job / Move visible;
3. ask the learner to retrieve or construct wording;
4. rehearse externally;
5. change the context or wording and produce again;
6. return to the canonical Metkagram object when language structure needs inspection.

If a referenced object or requested learning language cannot be resolved, the projection fails explicitly. It must not invent a Metkagram ID, translation, Frame, speech target or Bridge.

## Rights and caching

Publishing the schema does not change Metkagram's source-available licensing terms. Current rights metadata and attribution travel with every generated handoff.

A legitimate authorized integration may cache one user-requested immutable handoff snapshot where its permission allows that use. This contract does not grant permission to bulk-copy, mirror, repackage or redistribute the underlying Metkagram corpus. Public third-party use remains governed by the current licensing terms and any separately granted permission.

## Delivery state

M0 and M1 are intentionally static:

- versioned schema;
- deterministic reviewed fixtures;
- build-time validation;
- static handoff/API projection;
- direct read-only Choice and Route retrieval for consumers;
- no account, callback, webhook or backend.

There is no public `Practice aloud` CTA until a real consumer path exists and can fail honestly. A future consumer adapter should translate this contract at the edge rather than add provider-specific fields to canonical Metkagram data.
