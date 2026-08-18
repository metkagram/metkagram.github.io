import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const researchFile = path.join(ROOT, "dist", "en", "research", "index.html");

function insertBefore(html, marker, block) {
  const index = html.indexOf(marker);
  if (index < 0) throw new Error(`Annotation research marker not found: ${marker}`);
  return `${html.slice(0, index)}${block}${html.slice(index)}`;
}

function annotationAuditSection() {
  const mechanism = [
    [
      "1 · Read the sentence as language",
      "The learner first sees a complete, meaningful sentence. The annotation is not a replacement for the sentence and should not turn reading into a grammar diagram.",
      "Meaning remains the primary task."
    ],
    [
      "2 · Notice one function at its exact location",
      "A compact mark sits directly beside the word or span it describes. S points to the subject, V to the main verb, M to a modal, and v2 or vI to another verb form. The learner does not have to look away from the sentence and map a separate rule back onto the text.",
      "The hypothesis is that local cues can make structure easier to notice with less split attention."
    ],
    [
      "3 · Reuse the same visual vocabulary",
      "When the same marks appear in many different sentences, the learner can start recognising recurring relationships rather than memorising one example. The sentence changes; the functional signal stays stable.",
      "A tag should become a small reusable cue, not extra terminology to memorise."
    ],
    [
      "4 · Compare examples and extract a pattern",
      "Several annotated examples reveal what changes and what stays constant. A learner can move from one sentence to a reusable frame such as subject + modal + verb, or from a German sentence to a visible case or word-order relation.",
      "Annotation is useful when it helps the learner generalise beyond the original sentence."
    ],
    [
      "5 · Remove the cue and ask for production",
      "The annotation should eventually disappear. The learner then has to recognise or produce the structure without the visual support. If performance collapses when the tags are removed, the learner may have learned the cue rather than the language pattern.",
      "The desired outcome is transfer from annotated input to unannotated language."
    ]
  ];

  const evaluation = [
    ["A · Plain sentence", "The same sentence without Metkagram marks."],
    ["B · Inline annotation", "Minimal Metkagram marks placed beside the exact target spans."],
    ["C · Separate explanation", "The sentence plus the same grammar information shown away from the sentence."]
  ];

  const measures = [
    "Structure detection: can the learner identify the target role or relation?",
    "Meaning comprehension: does annotation help without making the sentence harder to understand?",
    "Transfer: can the learner use the same structure in a new, unannotated sentence?",
    "Delayed recall: is the effect still visible after a delay rather than only immediately after exposure?",
    "Response time: after accuracy is established, does the structure become easier to access?"
  ];

  const example = `<figure class="rules-sample"><figcaption>Inline cue, not a separate grammar screen</figcaption><p><span><b class="grammar-tag subject">S</b>I</span> <span><b class="grammar-tag helper">M</b>can</span> <span><b class="grammar-tag verb">v2</b>see</span> the pattern more clearly.</p><p><small>The exact visual form can change. The research question is whether placing a small functional cue beside its target helps the learner notice, generalise and later retrieve the structure.</small></p></figure>`;

  return `<section id="annotation-system-audit" class="research-questions section-pad ruled" data-annotation-analysis="v2"><div><p class="eyebrow">Inline annotation hypothesis</p><h2>What happens when the learner sees the structure inside the sentence?</h2><p>Metkagram's central idea is not to show more grammar. It is to shorten the distance between a grammatical function and the exact words that realise it. The learner reads the sentence and sees a small structural cue at the same location. We treat the learning benefit as a hypothesis to test, not as a proven effect of the interface.</p>${example}<p><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/ANNOTATION_SYSTEM_ANALYSIS.md"><strong>Read the technical annotation analysis →</strong></a></p></div><ol>${mechanism.map(([title, text, direction], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${text}</p><small><b>Why it matters:</b> ${direction}</small></div></li>`).join("")}</ol><div class="research-protocol"><p class="eyebrow">Evaluation design</p><h2>How we can test whether inline annotation actually helps</h2><p>A useful first study does not compare Metkagram with "learning nothing". It compares the same information in different locations.</p><div>${evaluation.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join("")}</div><h3>Measure more than immediate accuracy</h3><ul>${measures.map((item) => `<li>${item}</li>`).join("")}</ul><p><strong>Success criterion:</strong> inline annotation is interesting only if it improves noticing or learning while preserving sentence comprehension, and if at least part of the advantage transfers to new sentences after the cue is removed.</p></div></section>`;
}

if (!fs.existsSync(researchFile)) throw new Error(`Research page was not generated: ${researchFile}`);

let html = fs.readFileSync(researchFile, "utf8");
if (html.includes('data-annotation-analysis="v2"')) {
  console.log("Inline annotation research section already published.");
  process.exit(0);
}

const preferredMarker = '<section id="experiment-queue"';
const fallbackMarker = '<section class="research-assets';
const marker = html.includes(preferredMarker) ? preferredMarker : fallbackMarker;
html = insertBefore(html, marker, annotationAuditSection());

fs.writeFileSync(researchFile, html);
console.log("Published inline annotation mechanism and evaluation design in /en/research/.");
