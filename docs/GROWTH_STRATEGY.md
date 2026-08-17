# Metkagram growth strategy

Status: working strategy for organic search, AI discovery, research distribution and partnerships.

## 1. Positioning

Metkagram should not compete as another generic language-learning app or another grammar blog. Its strongest asset is the structured layer underneath the interface:

**sentence → inline functional annotation → reusable pattern → variation → communicative intent → study set → related pattern → provenance**

The growth thesis is therefore:

> Become the most useful open reference layer for advanced reusable language patterns, first for English and German, then for additional languages where the same annotation and pattern contracts can be maintained.

This is a narrower claim than “learn a language with Metkagram”, but it is much easier to make distinctive, indexable, citable and useful to teachers, learners, researchers and AI tutors.

## 2. Search opportunity

The technical SEO baseline is already strong: static HTML, canonical URLs, hreflang, structured data, sitemap, robots, quality metadata and a machine-readable API. The remaining bottleneck is semantic discovery.

Thousands of individual pattern pages are useful once a learner reaches them, but a learner usually does not search for an internal pattern ID or study-set code. They search for a job:

- how to disagree politely;
- C1 hedging phrases;
- how to qualify an opinion;
- advanced conditionals;
- phrases for comparing options;
- professional English for decisions;
- indirect questions;
- German word order in subordinate clauses.

The site must bridge that language to canonical Metkagram records without manufacturing one page per query variation.

### Pattern Atlas

`data/discovery-topics.json` is the first editorial discovery layer. It maps a deliberately small set of real learner goals to existing validated study sets. The build publishes:

- `/en/patterns/` and `/ru/patterns/`;
- one useful topic page per curated communication goal;
- direct links from topic → study set → canonical pattern;
- visible examples drawn from the validated pattern corpus;
- related-topic links;
- `LearningResource` and `ItemList` structured data;
- sitemap and SEO inventory entries.

This layer must remain curated. Do not generate thousands of “keyword pages”. Add a topic only when it represents a genuine learner task and can support a substantial, coherent collection.

## 3. The database that can become the moat

The long-term asset should be a **Language Pattern Knowledge Graph**, not a larger flat JSON file.

### Core entities

1. `Pattern`
   - stable ID;
   - formulas by language;
   - primary example and variations;
   - CEFR range;
   - study set;
   - quality status;
   - provenance.

2. `CommunicativeIntent`
   - what the learner is trying to do;
   - e.g. correct an assumption, hedge a claim, propose a compromise, request clarification.

3. `Construction`
   - linguistic structure independent of one example;
   - conditional, cleft, inversion, reporting structure, governed complement, etc.

4. `Register`
   - conversational, neutral, professional, academic, formal, emphatic;
   - confidence should be stored when register is inferred rather than reviewed.

5. `Contrast`
   - pattern A vs pattern B;
   - difference in meaning, register, strength or syntax;
   - example pair showing the difference.

6. `ErrorCluster`
   - a recurring learner mistake or confusion;
   - wrong or awkward form;
   - likely intended meaning;
   - corrective pattern(s);
   - explanation and evidence status.

7. `Topic`
   - editorial discovery hub such as argumentation, hedging or advanced questions;
   - connects search intent to stable study sets rather than to fabricated pages.

8. `Example`
   - sentence;
   - language;
   - translation;
   - annotation spans;
   - source/provenance;
   - quality review state.

9. `Source`
   - origin, license, version and review history;
   - required for research and external reuse.

### High-value edges

- Pattern `PERFORMS` CommunicativeIntent
- Pattern `USES` Construction
- Pattern `HAS_REGISTER` Register
- Pattern `CONTRASTS_WITH` Pattern
- ErrorCluster `CORRECTED_BY` Pattern
- Topic `CONTAINS` StudySet
- StudySet `CONTAINS` Pattern
- Pattern `ILLUSTRATED_BY` Example
- Example `ANNOTATED_WITH` canonical spans
- Pattern `RELATED_TO` Pattern with an explicit relation reason

### Why this matters

The graph can power five products from the same data:

1. human search and navigation;
2. “what do I say here?” intent discovery;
3. “why is this wrong?” error-to-pattern correction;
4. teacher/research datasets;
5. AI tutor and agent retrieval through API/MCP.

The difficult-to-copy asset is not the HTML. It is the reviewed relationship data between intention, form, examples, contrasts, errors and provenance.

## 4. Next data products

### 4.1 Query-to-pattern map

Create a privacy-safe table built from Search Console queries and internal search terms:

`query_cluster → intent → topic → set → canonical patterns → impressions → clicks → helpfulness signal`

Do not use raw personal queries as public data. Cluster and aggregate them. This becomes the evidence for which topic pages deserve expansion.

### 4.2 Contrast library

Publish high-value “A vs B” comparisons only when the distinction is pedagogically real:

- direct claim vs hedged claim;
- because vs reason/result frames;
- normal conditional vs inverted conditional;
- direct question vs indirect question;
- English word order vs German word order for matched functions.

A contrast page should contain a concise distinction, paired examples, the reusable formulas and canonical pattern links. This format is naturally useful for search and AI answers because it resolves ambiguity instead of merely listing phrases.

### 4.3 Error-to-pattern library

Teachers and learners repeatedly encounter the same errors. Build a reviewed error taxonomy and map each error to the smallest corrective pattern. This can become one of the strongest acquisition loops because the search intent is immediate and concrete.

Never auto-publish unreviewed “wrong English” at scale. Error records need editorial state and provenance.

### 4.4 Pattern evidence records

For high-value patterns, add:

- corpus/example evidence;
- register note;
- common confusion;
- minimal contrast;
- reasoning move;
- reviewed explanation;
- last review date.

This turns a pattern page from a card into a reference object worth citing.

## 5. Content strategy

### Priority 1: own advanced functional language

The strongest wedge is B2–C1 language used to perform a reasoning or communication move, not generic vocabulary lists.

Priority clusters:

- argumentation and evidence;
- opinions and hedging;
- agreement/disagreement;
- clarification and reformulation;
- conditionals and counterfactuals;
- comparison and evaluation;
- professional communication;
- advanced questions;
- reported speech and attribution;
- modality and recommendation;
- connectors and complex clauses;
- German word order/cases with English parallels.

### Priority 2: answer, then expose the system

A landing page should satisfy the visitor before asking them to understand Metkagram. Use this sequence:

1. clear answer to the communication problem;
2. several strong pattern examples;
3. visible formula and contrast;
4. variation;
5. link to the study set and related patterns;
6. explanation of the annotation method only when it helps.

### Priority 3: visual assets that earn links

Metkagram has an advantage a normal grammar blog does not: the sentence can be visibly annotated. Turn reviewed patterns into stable shareable visual cards that link to the canonical page. Useful targets include teacher slides, social posts, course notes and research presentations.

Do not create decorative images just to satisfy an SEO checklist. Each image should teach the relation already present in the text.

## 6. AI and recommendation discovery

AI discovery should be treated as retrieval quality, not as a separate folklore industry.

The site already exposes structured datasets, provenance, OpenAPI, MCP and `llms.txt`. Keep those for agents and developers, but do not treat an AI text file as a ranking shortcut.

The important improvements are:

- canonical records with meaningful visible text;
- strong internal graph links;
- explicit provenance;
- stable IDs and URLs;
- concise descriptions of when each surface should be used;
- topic/intent metadata that lets an agent choose a useful record rather than dump a pattern list.

## 7. Distribution beyond Google

### Dataset distribution

Create versioned releases for research/data communities when licensing permits:

- Hugging Face dataset card and loader-friendly export;
- GitHub Releases with checksums and a compact changelog;
- research repositories such as Zenodo for citeable snapshots where appropriate;
- carefully selected derived datasets rather than an uncontrolled mirror of protected project assets.

Every distribution should preserve Metkagram attribution, canonical URLs, version and license boundaries.

### Teacher distribution

Build exports that reduce work for teachers:

- printable pattern cards;
- CSV/TSV decks;
- Anki-compatible export;
- H5P-compatible practice packages or a documented conversion path;
- small embeddable pattern cards with canonical attribution.

Distribution works when Metkagram becomes a useful component inside a teacher's existing workflow, not when teachers are asked to adopt another complete platform.

### Agent distribution

Publish small reference examples for AI tutors and agent developers:

- retrieve by communicative intent;
- retrieve a canonical pattern;
- retrieve related patterns;
- preserve provenance in generated answers;
- abstain when no reviewed match exists.

## 8. Partnership engine

Partnerships should be offered as concrete packages, not “we are open to collaboration”.

### A. Universities and applied linguistics groups

Offer:

- a preregistered annotation/learning pilot;
- corpus-quality study;
- student project around error taxonomy or pattern transfer;
- citeable frozen dataset snapshot.

What Metkagram receives: independent validation, expert review, publications/citations and a better corpus.

### B. Teachers, language schools and advanced-English creators

Offer:

- a co-curated B2–C1 topic pack;
- embeddable/printable cards;
- a teacher review badge with named contribution;
- referral traffic to the teacher's course/profile where appropriate.

What Metkagram receives: distribution, real learner language, review and backlinks that come from useful material rather than link schemes.

### C. LMS / learning-content ecosystem

High-fit integration directions include H5P/LMS packages and Anki-compatible exports. The objective is to let a Metkagram study set travel into tools learners already use.

### D. Open language-data projects

Explore interoperability with sentence/corpus projects only under compatible licenses and explicit provenance. External corpora should be used as evidence or augmentation, not silently absorbed into Metkagram's protected corpus.

### E. AI tutor and agent projects

Offer a tiny, read-only integration surface:

- intent discovery;
- pattern retrieval;
- related-pattern retrieval;
- canonical citation.

The pitch is “give your tutor a reviewed language-pattern layer”, not “replace your tutor”.

## 9. Search operations

### Crawl and indexing

- Keep the canonical sitemap complete.
- Track indexing by page type: topic hubs, study sets, individual patterns, annotated documents.
- Add IndexNow only as a crawl-notification channel for participating engines; it does not guarantee indexing.
- Submit only changed/new/deleted URLs, not the entire corpus on every build.

### Search Console measurement

Measure separately:

- non-brand impressions;
- clicks;
- CTR;
- indexed/crawled ratio by route type;
- queries that reach a topic hub versus an individual pattern;
- AI-search visibility when the corresponding Search Console reporting is available to the property;
- pages with impressions but poor engagement;
- pages that are crawled repeatedly but never receive impressions.

Do not optimize around average position alone.

## 10. Growth loop

The intended loop is:

**real learner query → topic/intention cluster → useful hub → canonical pattern → save/share/use → aggregated signal → editorial improvement → stronger graph → more search/agent retrieval**

The crucial word is **editorial**. Automation should find gaps and propose mappings. Reviewed relationships are what get published.

## 11. 90-day execution order

### Now

- publish Pattern Atlas;
- expose it from Practice;
- keep topic count deliberately small;
- verify sitemap, canonicals and internal links in CI;
- add the discovery topic dataset to the public build.

### Next 30 days

- connect Google Search Console and Bing Webmaster Tools if not already connected;
- baseline indexed route counts by type;
- identify 20–30 non-brand query clusters with impressions;
- expand only the Atlas topics that have both learner value and evidence of demand;
- add 10–20 reviewed contrast records.

### Days 31–60

- build the first ErrorCluster schema and a small reviewed pilot;
- publish an Anki/CSV export for one high-quality topic pack;
- prepare one research outreach package and one teacher outreach package;
- publish a versioned dataset release outside the site with canonical attribution.

### Days 61–90

- evaluate topic hubs versus raw pattern pages;
- strengthen the best-performing hubs with reviewed explanations and contrasts;
- noindex or consolidate low-value pages only when Search Console and quality data justify it;
- start one external pilot with a teacher, university group or AI-tutor project;
- publish the first evidence-backed growth report.

## 12. Guardrails

- Never manufacture efficacy claims.
- Never generate search pages solely because a query exists.
- Never change timestamps to simulate freshness.
- Never hide keyword text from users.
- Do not add structured data that is not represented in visible content.
- Do not copy external sentences without compatible licensing and provenance.
- Protect the canonical corpus and attribution even when creating easy exports.
- Prefer 20 strong topic/reference pages to 20,000 near-duplicates.

The goal is not “more SEO pages”. The goal is to make the structured work already present in Metkagram legible to learners, search engines, teachers, researchers and agents.
