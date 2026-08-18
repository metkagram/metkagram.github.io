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

  const interpretation = [
    [
      "The strongest idea is point-of-processing support",
      "A traditional explanation is spatially and mentally separate from the sentence. Inline annotation moves a compact structural clue to the moment and place where the learner is already processing the form. The possible advantage is not the colour or the symbol itself. It is the tighter connection between form, function and context."
    ],
    [
      "The notation can act as temporary external structure",
      "Beginners often cannot reliably segment a sentence into useful functional parts. A small tag can externalise that segmentation for them. With repetition, the learner may begin to perform part of that analysis internally. In this interpretation, Metkagram is scaffolding: useful because it is temporary, not because the learner should depend on it forever."
    ],
    [
      "Repeated tags can compress many examples into one visual grammar",
      "If S, M, V and other marks keep the same meaning across varied sentences, they form a compact visual vocabulary. Instead of learning every sentence independently, the learner gets a stable coordinate system for comparing them. This could make similarities between examples easier to detect and support pattern abstraction."
    ],
    [
      "The real target is a relation, not a label",
      "Knowing that M means modal is not the learning goal. The useful knowledge is relational: where the modal appears, what follows it, what changes in a question or negative, and what remains stable across contexts. Metkagram should therefore design annotations around relations and reusable frames rather than around an ever-growing inventory of tags."
    ],
    [
      "Fading is part of the method, not an optional exercise",
      "If annotation works as scaffolding, cue removal must be designed from the beginning. A strong learning sequence should move from annotated examples to weaker cues, then to plain input and finally production. The method succeeds only when the visual layer becomes unnecessary for the target structure."
    ]
  ];

  const failureModes = [
    ["Attention capture", "Tags may become more visually salient than the language itself. A learner can start reading the markup instead of the sentence."],
    ["Cue dependency", "Performance may look strong while annotations are visible but collapse on ordinary text."],
    ["False simplification", "A compact mark can imply that a linguistic relation is cleaner or more universal than it really is."],
    ["Annotation overload", "Showing every possible role at once can increase cognitive load and destroy the advantage of local cues."],
    ["Inconsistent mapping", "If the same mark behaves differently across examples or languages, the visual vocabulary stops being a reliable learning signal."]
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

  return `<section id="annotation-system-audit" class="research-questions section-pad ruled" data-annotation-analysis="v3"><div><p class="eyebrow">Inline annotation hypothesis</p><h2>What happens when the learner sees the structure inside the sentence?</h2><p>Metkagram's central idea is not to show more grammar. It is to shorten the distance between a grammatical function and the exact words that realise it. The learner reads the sentence and sees a small structural cue at the same location. We treat the learning benefit as a hypothesis to test, not as a proven effect of the interface.</p>${example}<p><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/ANNOTATION_SYSTEM_ANALYSIS.md"><strong>Read the technical annotation analysis →</strong></a></p></div><ol>${mechanism.map(([title, text, direction], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${text}</p><small><b>Why it matters:</b> ${direction}</small></div></li>`).join("")}</ol><div class="research-protocol"><p class="eyebrow">Working interpretation</p><h2>Why this mechanism may be useful</h2><p>Our current interpretation is that the interesting mechanism is not visual decoration. It is temporary structural support placed at the point of perception. Five consequences follow from that idea.</p><ol>${interpretation.map(([title, text], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join("")}</ol><p><strong>Core prediction:</strong> if this interpretation is correct, the best Metkagram interface may show less annotation over time, not more.</p></div><div class="research-protocol"><p class="eyebrow">Failure modes</p><h2>How inline annotation could fail</h2><p>A serious method needs conditions under which its central idea would be weakened or rejected.</p><div>${failureModes.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join("")}</div></div><div class="research-protocol"><p class="eyebrow">Evaluation design</p><h2>How we can test whether inline annotation actually helps</h2><p>A useful first study does not compare Metkagram with "learning nothing". It compares the same information in different locations.</p><div>${evaluation.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join("")}</div><h3>Measure more than immediate accuracy</h3><ul>${measures.map((item) => `<li>${item}</li>`).join("")}</ul><p><strong>Success criterion:</strong> inline annotation is interesting only if it improves noticing or learning while preserving sentence comprehension, and if at least part of the advantage transfers to new sentences after the cue is removed.</p></div></section>`;
}

if (!fs.existsSync(researchFile)) throw new Error(`Research page was not generated: ${researchFile}`);

let html = fs.readFileSync(researchFile, "utf8");
if (html.includes('data-annotation-analysis="v3"')) {
  console.log("Inline annotation research section already published.");
  process.exit(0);
}

const preferredMarker = '<section id="experiment-queue"';
const fallbackMarker = '<section class="research-assets';
const marker = html.includes(preferredMarker) ? preferredMarker : fallbackMarker;
html = insertBefore(html, marker, annotationAuditSection());

fs.writeFileSync(researchFile, html);
console.log("Published inline annotation mechanism, interpretation and evaluation design in /en/research/.");
