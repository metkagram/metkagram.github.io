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
      title: "Spacing is a parameter to test",
      text: "A long-term vocabulary study found that expanding and equal spacing produced similar final recall, while the learning experience during practice differed. Metkagram can therefore treat review timing as an experiment and optimise it for useful access, not for loyalty to one fixed schedule.",
      source: "Kang et al. (2014) · Retrieval practice over the long term",
      href: "https://pubmed.ncbi.nlm.nih.gov/24744260/"
    },
    {
      title: "Report results by pattern family",
      text: "A large study of captions and textual enhancement found clear learning effects for some targets but not for every grammar structure. If Metkagram tests the method, results should be shown by pattern family as well as in total. One average score can hide where the method helps and where it does not.",
      source: "Investigating textual enhancement and captions in L2 grammar and vocabulary (2020)",
      href: "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/investigating-textual-enhancement-and-captions-in-l2-grammar-and-vocabulary/EF080D9AC64C7E2BFFB90AC799C38C69"
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
    ["R06 · Annotation agreement", "Give the same sentence sample to two independent annotators using the same guide.", "Agreement by label, span boundary errors and adjudicated corrections.", "Revise weak labels before expanding the corpus."]
  ];

  return `<section id="experiment-queue" class="research-questions section-pad ruled" data-research-enhancement="experiments"><div><p class="eyebrow">Experiment queue</p><h2>Small tests that can change the product</h2><p>Each test changes one main mechanism. Transfer means using the same structure correctly in a new example, not repeating a sentence from memory.</p></div><ol>${experiments.map(([title, comparison, measure, decision], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p><b>Compare:</b> ${comparison}</p><p><b>Measure:</b> ${measure}</p><small><b>Product decision:</b> ${decision}</small></div></li>`).join("")}</ol></section>`;
}

function decisionSection() {
  const decisions = [
    "If extra tags improve structure detection but reduce sentence comprehension, use fewer tags by default.",
    "If sentence-first reading improves meaning and later form recall, keep explanations closed until after the first read.",
    "If varied examples improve transfer, require every published pattern to cover meaningful structural variation, not cosmetic rewrites.",
    "If different proficiency groups need different example order, build separate paths instead of one universal sequence.",
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
html = insertBefore(html, '<section class="research-boundary', decisionSection());
html = html.replace(
  '<nav class="research-links">',
  '<nav class="research-links"><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/RESEARCH_NOTES.md"><strong>Living research notes</strong><span>Evidence log, experiment IDs and decision rules →</span></a>'
);

fs.writeFileSync(researchFile, html);
console.log("Enhanced /en/research/ with evidence notes, experiments and decision rules.");
