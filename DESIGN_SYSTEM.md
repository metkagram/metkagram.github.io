# Design system

## Visual thesis

Metkagram is a precise grammar-markup workspace: part quiet reading surface, part structured pattern explorer. The sentence is the main visual object. Interface chrome stays quiet enough for grammar roles, translations and reusable patterns to remain primary.

## Brand assets

- Use `/public/assets/logo/metkagram-logo-light.svg` on paper and white surfaces.
- Use `/public/assets/logo/metkagram-logo-dark.svg` only on dark surfaces.
- Use `/public/assets/icons/metkagram-mark.svg` for compact app/icon contexts.
- Use `/public/assets/social/metkagram-social-preview-1200x630.png` for Open Graph and social cards.
- Preserve the logo’s yellow tag, angle-bracket construction and clear space. Do not recreate the lockup with text or CSS.

## Foundations

- **Surface**: brand off-white `#F7F7F3`, deep paper `#EDEDE7`, white reading surface `#FFFFFF`.
- **Ink**: brand black `#111111`; secondary copy `#5F5F5A`.
- **Accent**: brand yellow `#FFC400` is reserved for the logo tag, a primary hover accent and subject markup.
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
