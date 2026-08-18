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
  const findings = [
    [
      "The notation is functional, not just grammatical",
      "Metkagram marks what a learner needs to notice inside a sentence: subject, main verb, helper, secondary verb form, case, word order and morphology. This is different from showing a full POS or dependency parse.",
      "Current examples include S / S*, V, vI, v2, vP / Vp, Hf / Hr / Hst, M, German case arrows and gender signals."
    ],
    [
      "Text-first spans are the right foundation",
      "The canonical schema keeps the original sentence separate from annotation spans. A tag points to exact text offsets instead of becoming part of the sentence. The same record can therefore support a learner view, research inspection, accessibility and NLP export.",
      "Keep this principle in every future schema version."
    ],
    [
      "Schema 1.0 mixes several layers",
      "Syntax, morphology, construction structure and learner-facing notation are currently compressed into a small set of types. The broad function fallback can represent very different things, while the display code groups some of the same marks differently.",
      "The next schema should separate semantic meaning from visual styling."
    ],
    [
      "Legacy migration is useful but deliberately lossy",
      "The converter normally attaches a visual mark to the next meaningful token. That works for many simple subject and verb tags, but case, inversion and phrase-level signals can have a wider scope. Some legacy marks such as H, st and st* also need clearer semantic mapping.",
      "Preserve the original label and add explicit migration tests for difficult constructions."
    ],
    [
      "A better model is layered",
      "Schema 2.0 should keep compact surface labels while storing independent layers underneath: syntax, morphology, construction, pedagogy and provenance. The same word may be a subject, feminine and part of a reusable pattern without forcing those facts into one label.",
      "Rich data underneath does not require a visually busy learner interface."
    ],
    [
      "Ten rules define the annotation contract",
      "Text is the source of truth; annotate the smallest useful span; never hide meaning only in colour; separate Metkagram marks from NLP labels; preserve legacy labels; allow layered annotation; record uncertainty; derive visuals from semantics; mark reusable structure, not bold text; and test every rule on unseen sentences.",
      "These rules turn visual notation into a reproducible annotation protocol."
    ],
    [
      "The method now creates testable research questions",
      "The next experiments should measure annotation agreement, legacy-signal preservation, layered annotation quality, minimal learner views and human versus rule/model annotation. A strong notation system should be able to discover where its own rules fail.",
      "Start with small reviewed samples before expanding or auto-labelling the corpus."
    ]
  ];

  return `<section id="annotation-system-audit" class="research-questions section-pad ruled" data-annotation-analysis="v1"><div><p class="eyebrow">Annotation system audit</p><h2>From visual grammar marks to a research annotation protocol</h2><p>Metkagram already has more than a visual tag style. Its old cards contain a domain-specific notation, and the current code is converting that notation into machine-readable spans. This audit asks what should stay, what is ambiguous, and how the method can become a stronger research asset without making the learner view heavier.</p><p><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/ANNOTATION_SYSTEM_ANALYSIS.md"><strong>Read the full technical analysis →</strong></a></p></div><ol>${findings.map(([title, text, action], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${title}</h3><p>${text}</p><small><b>Direction:</b> ${action}</small></div></li>`).join("")}</ol></section>`;
}

if (!fs.existsSync(researchFile)) throw new Error(`Research page was not generated: ${researchFile}`);

let html = fs.readFileSync(researchFile, "utf8");
if (html.includes('data-annotation-analysis="v1"')) {
  console.log("Annotation system audit already published in Research.");
  process.exit(0);
}

const preferredMarker = '<section id="experiment-queue"';
const fallbackMarker = '<section class="research-assets';
const marker = html.includes(preferredMarker) ? preferredMarker : fallbackMarker;
html = insertBefore(html, marker, annotationAuditSection());

fs.writeFileSync(researchFile, html);
console.log("Published annotation system audit in /en/research/.");
