# Design system

## Visual thesis

Metkagram is a precise language-notation workspace: part warm paper notebook, part structured data explorer. The sentence is the main visual object. Interface chrome stays quiet enough for grammar roles, translations and reusable patterns to remain primary.

## Foundations

- **Surface**: warm paper `#f2efe6`, deep paper `#e7e1d4`, light working surface `#faf8f1`.
- **Ink**: graphite `#1d211f`; secondary copy `#656963`.
- **Lines**: thin neutral rules create a baseline/grid rhythm without boxing every region.
- **Typography**: Inter for reading and IBM Plex Mono for grammar tags, IDs, counts, controls and technical notation. Both have system fallbacks.
- **Spacing**: six-step scale from `.375rem` through `4.5rem`; page width is capped at `82rem`.
- **Corners**: restrained `.25rem`; content is organized by rules and alignment rather than rounded cards.

## Semantic annotation colors

| Role | Token | Color | Use |
|---|---|---|---|
| Subject | `--subject` | `#f2c84b` | `S`, `S*` and subject underlines |
| Verb | `--verb` | `#ef7f61` | `V`, infinitives and participles |
| Object/predicate | `--object` | `#65a9a6` | predicates, cases and structural objects |
| Helper | `--helper` | `#9281c5` | auxiliary, modal, result and future helpers |

Color is never the only cue: every semantic mark includes a visible grammar tag or label.

## Components

- **Header**: compact wordmark, six utility routes, contextual EN/RU switch.
- **Annotated sentence**: fluid sentence scale, tag labels above functional underlines, compact legend below.
- **Index rows**: number, title, count/context and direct-link arrow; rows replace decorative cards.
- **Annotation sheet**: sentence rows with line numbers and optional disclosure for plain text, translation and chunks.
- **Pattern language planes**: English and German appear as equal columns on desktop and a linear reading order on mobile.
- **Review workspace**: one active card with reveal, then three grading controls.
- **Progress surface**: three exact measures, sync controls, transfer controls and a readable table.

## Interaction

- Annotation explanations use native `<details>` reveal.
- Search and filters update lists without navigation.
- Review transitions update the current card and store feedback immediately.
- Buttons use a one-pixel lift only as affordance.
- `prefers-reduced-motion` removes transitions and smooth scrolling.

## Accessibility

- Focus uses a three-pixel high-contrast outline with offset.
- Navigation, breadcrumbs, filters, disclosures and review controls use semantic elements and labels.
- Mobile content stays dense but readable; interactive targets retain sufficient padding.
- The mobile menu exposes `aria-expanded` and keeps the document order logical.
- Interface languages never mix; source-language learning notes are explicitly marked with `lang` and fallback disclosure.

Dark mode was deliberately deferred. A partial dark mode would reduce the reliability of semantic annotation colors and paper contrast.
