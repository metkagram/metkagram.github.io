import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const researchFile = path.join(ROOT, "dist", "en", "research", "index.html");

function insertBefore(html, marker, block) {
  const index = html.indexOf(marker);
  if (index < 0) throw new Error(`Research enhancement marker not found: ${marker}`);
  return `${html.slice(0, index)}${block}${html.slice(index)}`;
}

function evidenceSection() {
  const sources = [
    {
      title: "Keep visual cues small",
      text: "A meta-analysis of visual input enhancement found a small average benefit for grammar learning, but it also found a possible cost for processing meaning. For Metkagram, this is a reason to test one useful tag against full markup instead of assuming that more highlighting is better.",
      source: "Lee &amp; Huang (2008) · Visual input enhancement and grammar learning",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/visual-input-enhancement-and-grammar-learning-a-metaanalytic-review/B9D0C50B09928C20C94548B37B29A042"
    },
    {
      title: "Read for meaning before opening more help",
      text: "A 2025 study on phrasal verbs found stronger learning when definitions came after reading rather than before it, and typographic enhancement supported contextual learning. This suggests a useful Metkagram test: keep the sentence readable first, then reveal the tag or explanation when the learner needs it.",
      source: "Contextual learning and retention of phrasal verbs (2025)",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/contextual-learning-and-retention-of-phrasal-verbs/128F4CAA5D71E7146B0F579E919AF794"
    },
    {
      title: "Pattern order may not work the same for everyone",
      text: "Research on learning second-language constructions shows that balanced and strongly repeated input can work differently depending on the learner and the task. Metkagram should test how examples are ordered instead of treating one sequence as correct for every learner.",
      source: "Pulido (2024) · Optimizing input for L2-specific constructions",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/optimizing-the-input-for-learning-of-l2specific-constructions-the-roles-of-zipfian-and-balanced-input-explicit-rules-and-working-memory/89BEAAAE58A0D8DD11FCEC7D5837BF18"
    },
    {
      title: "Spacing matters, but the schedule is still a design choice",
      text: "A 2025 online replication found that spaced study sessions outperformed massed study on a delayed L2 vocabulary test. Earlier work also shows that different spaced schedules can end with similar final recall. Metkagram should test the gap between sessions instead of copying one universal SRS rule.",
      source: "Rogers, Nakata &amp; Chiu (2025) · Optimizing distributed practice online",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/optimizing-distributed-practice-online/C833408A4C3BAD939CA39EA734423BB7"
    },
    {
      title: "Report results by pattern family",
      text: "A large study of captions and textual enhancement found clear learning effects for some targets but not for every grammar structure. If Metkagram tests the method, results should be shown by pattern family as well as in total. One average score can hide where the method helps and where it does not.",
      source: "Investigating textual enhancement and captions in L2 grammar and vocabulary (2020)",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/investigating-textual-enhancement-and-captions-in-l2-grammar-and-vocabulary/EF080D9AC64C7E2BFFB90AC799C38C69"
    },
    {
      title: "A cue must be noticeable enough to be processed",
      text: "A 2026 artificial-language study found sensitivity to morphosyntactic violations only in the high-salience condition. This does not tell us the correct Metkagram colour or tag strength, but it gives a direct reason to test salience instead of treating visual emphasis as decoration.",
      source: "Fernández Santos et al. (2026) · Morphological salience in initial L2 learning",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effect-of-morphological-salience-and-novel-phonology-in-the-initial-stage-of-second-language-learning/82DBA3596AAD367CC09993CD6FBD41D3"
    },
    {
      title: "Build larger patterns from smaller chunks",
      text: "A 2026 study of multi-word expressions found that L2 learners had difficulty binding relatively large chunks and argued for gradual binding of smaller units into larger ones. Metkagram can test whether a stable short chunk should appear before the full reusable frame.",
      source: "Wei, Wang &amp; MacWhinney (2026) · Chunking multi-word expressions",
      href: "https://www.cambridge.org/core/journals/applied-psycholinguistics/article/chunking-words-into-multiword-expressions-exploring-chunking-ability-in-immediate-recall-among-second-language-learners-of-chinese/8BCA3A1376B0250BD7920263EA1954D9"
    },
    {
      title: "Practice may need to change as a pattern becomes a skill",
      text: "A 2025 study found evidence consistent with declarative, procedural and automatic stages in deliberate L2 skill learning. Early performance related more to declarative learning ability, while procedural ability became more important later. A learner who understands a pattern may therefore need a different task from a learner trying to use it quickly.",
      source: "Maie &amp; Godfroid (2025) · Three-stage model of L2 skill acquisition",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/testing-the-threestage-model-of-second-language-skill-acquisition/DF879921EDE594E795CBD8C18A87E86E"
    },
    {
      title: "More feedback is not always better feedback",
      text: "A 2025 experiment with semi-open-ended language questions found that concise immediate correct-response feedback worked better than more elaborate feedback in that task and also supported confidence judgments. Metkagram should keep detailed explanations available without forcing them after every attempt.",
      source: "From belief to evidence (2025) · Immediate feedback complexity",
      href: "https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1654809/full"
    },
    {
      title: "Visual notation needs a non-visual path",
      text: "A 2026 study with visually impaired and sighted learners found short-term benefits from aural input enhancement, with results moderated by proficiency and not maintained at delayed testing. The direct target was vocabulary, not grammar, but the accessibility lesson is useful: important Metkagram cues should never depend on colour alone.",
      source: "Badri, Graham &amp; Zhang (2026) · Aural cues for visually impaired learners",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/bridging-barriers/E488EF8F78D99080C3D319F9262B45F0"
    }
  ];

  return `<section id="evidence-notes" class="research-questions section-pad ruled" data-research-enhancement="evidence"><div><p class="eyebrow">Evidence notes</p><h2>What outside research tells us</h2><p>These studies inform questions for Metkagram. They do not prove that the Metkagram interface works better than another method.</p></div><ol>${sources.map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${item.title}</h3><p>${item.text}</p><small><b>Source:</b> ${item.source} · <a href="${item.href}">Open paper</a></small></div></li>`).join("")}</ol></section>`;
}

function experimentSection() {
  const experiments = [
    ["R01 · Tag density", "Compare a clean sentence, one target tag and fuller markup.", "Role accuracy, sentence comprehension and response time.", "Choose the default amount of visible annotation."],
    ["R02 · Progressive reveal", "Compare tags shown immediately with tags revealed after the learner reads the sentence.", "Meaning comprehension and delayed recall of the target form.", "Decide whether the interface should be sentence-first by default."],
    ["R03 · Variation and transfer", "Compare repeated examples from one context with examples that change person, tense and situation.", "Production accuracy on a new sentence that was never shown in practice.", "Set a minimum diversity rule for published pattern examples."],
    ["R04 · Pattern order", "Compare a balanced sequence with a sequence that repeats one common form more strongly at the start.", "Learning speed and transfer, reported by proficiency band.", "Decide whether pattern sets need different learning paths."],
    ["R05 · Recall before feedback", "Compare rereading with an attempt to produce the pattern before the answer appears.", "Immediate and delayed cued production.", "Decide where active recall belongs in Pattern Practice."],
    ["R06 · Annotation agreement", "Give the same sentence sample to two independent annotators using the same guide.", "Agreement by label, span boundary errors and adjudicated corrections.", "Revise weak labels before expanding the corpus."],
    ["R07 · Salience strength", "Compare no cue, a restrained cue and a strong cue for one target grammar role.", "Detection of the target form, sentence comprehension and visual-load rating.", "Set evidence-based contrast and emphasis rules for tags."],
    ["R08 · Progressive chunking", "Compare the full pattern from the start with small chunk → larger chunk → full frame.", "Immediate and delayed production, including where errors occur inside the pattern.", "Decide whether Pattern Practice should grow chunks in stages."],
    ["R09 · Stage-aware practice", "Compare one repeated task format with a path from explanation to recognition to timed production.", "Accuracy and response speed across repeated sessions.", "Change the task when a pattern is accurate but still slow, if the data supports it."],
    ["R10 · Feedback depth", "Compare correct answer only, a short explanation and a detailed explanation.", "Accuracy on the next unseen item, delayed accuracy, confidence and feedback time.", "Choose the default feedback depth and keep extra detail optional when possible."],
    ["R11 · Cue modality", "Compare the same target role through a visual tag, an accessible text label and an optional aural cue.", "Role identification, later recall and usability reports.", "Make important notation understandable without colour alone."],
    ["R12 · Review gap", "Compare massed practice with two or more spaced schedules.", "Delayed production after a fixed retention interval, practice accuracy and review completion.", "Tune review intervals from Metkagram evidence instead of copying one SRS schedule."]
  ];

  return `<section id="experiment-queue" class="research-questions section-pad ruled" data-research-enhancement="experiments"><div><p class="eyebrow">Experiment queue</p><h2>Small tests that can change the product</h2><p>Each test changes one main mechanism. Transfer means using the same structure correctly in a new example, not repeating a sentence from memory.</p></div><ol>${experiments.map(([title, comparison, measure, decision], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p><b>Compare:</b> ${comparison}</p><p><b>Measure:</b> ${measure}</p><small><b>Product decision:</b> ${decision}</small></div></li>`).join("")}</ol></section>`;
}

function measurementSection() {
  const notes = [
    ["Measure transfer, not only memory", "Use unseen production items so a learner must apply the structure in a new sentence."],
    ["Separate accuracy from speed", "A learner can know a rule and still use it too slowly for fluent speech. Track response time only where the task makes timing meaningful."],
    ["Use web experiments carefully", "A 2024 study found that web-based elicited imitation can provide useful morphosyntactic measurement comparable to a lab version, which makes small remote pilots realistic."],
    ["Keep comprehension as a guardrail", "Whenever annotation strength changes, test whether the learner still understands the sentence. Noticing grammar at the cost of meaning is not a useful win."],
    ["Automate scoring only after calibration", "Recent NLP work shows that automated L2 error analysis can agree strongly with human ratings, but context-dependent errors remain difficult. Human checks should stay in the validation loop."]
  ];
  return `<section id="research-measurement" class="research-questions section-pad ruled" data-research-enhancement="measurement"><div><p class="eyebrow">Measurement</p><h2>How we should know if an idea works</h2><p>A research page is more useful when it also defines what counts as evidence.</p></div><ol>${notes.map(([title, text], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join("")}</ol></section>`;
}

function decisionSection() {
  const decisions = [
    "If extra tags improve structure detection but reduce sentence comprehension, use fewer tags by default.",
    "If sentence-first reading improves meaning and later form recall, keep explanations closed until after the first read.",
    "If varied examples improve transfer, require every published pattern to cover meaningful structural variation, not cosmetic rewrites.",
    "If different proficiency groups need different example order, build separate paths instead of one universal sequence.",
    "If stronger salience improves noticing without harming comprehension, use it only for the target role instead of highlighting the whole sentence.",
    "If progressive chunking improves full-pattern production, add chunk growth as a practice mode.",
    "If staged practice improves speed after accuracy is already high, change the task instead of simply adding more repetitions.",
    "If concise feedback works as well as or better than long explanations, keep the default feedback short and make detail optional.",
    "If an important cue cannot be understood without colour, redesign it.",
    "If annotation agreement is weak for a label, revise the label and guide before adding more data.",
    "If a result is small, mixed or negative, keep it in the research record. A useful method should be allowed to discover its own limits."
  ];

  return `<section id="research-decisions" class="research-protocol section-pad ruled" data-research-enhancement="decisions"><div><p class="eyebrow">Decision rules</p><h2>How evidence can change Metkagram</h2><p>Research is useful only when it can change the design.</p></div><ol>${decisions.map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${item}</li>`).join("")}</ol></section>`;
}

if (!fs.existsSync(researchFile)) throw new Error(`Research page was not generated: ${researchFile}`);

let html = fs.readFileSync(researchFile, "utf8");
if (html.includes('data-research-enhancement="evidence"')) {
  console.log("Research page already enhanced.");
  process.exit(0);
}

html = insertBefore(html, '<section class="research-protocol', evidenceSection());
html = insertBefore(html, '<section class="research-assets', experimentSection());
html = insertBefore(html, '<section class="research-boundary', measurementSection());
html = insertBefore(html, '<section class="research-boundary', decisionSection());
html = html.replace(
  '<nav class="research-links">',
  '<nav class="research-links"><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/RESEARCH_NOTES.md"><strong>Living research notes</strong><span>Evidence log, experiment IDs and decision rules →</span></a>'
);

fs.writeFileSync(researchFile, html);
console.log("Enhanced /en/research/ with evidence notes, experiments, measurement rules and product decisions.");
