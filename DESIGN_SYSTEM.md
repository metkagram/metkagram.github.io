# Metkagram design system

Version 2.0 · 22 August 2026

## 1. Brand idea

Metkagram is an annotation studio and a reusable pattern library for language learning, analysis and AI agents. The interface feels like a working table: graphite underneath, marked yellow sheets above it, black ink, precise rules and small technical labels.

The visual promise is **Mark what matters.** Every screen must make one of three actions clear: learn, analyse or reuse.

| English | Русский |
|---|---|
| Annotation Library | Библиотека разметки |
| Pattern Library | Библиотека паттернов |
| Mark language. Find patterns. Reuse knowledge. | Размечайте язык. Находите паттерны. Переиспользуйте знания. |
| For learners, researchers and AI agents | Для изучающих языки, исследователей и ИИ-агентов |

Use “annotation” for marked source material and “pattern” for a reusable structure extracted from examples. Never use them as synonyms.

## 2. Non-negotiable principles

1. The annotation is the product. Decoration never hides a sentence, tag or pattern.
2. Yellow is the only strong brand accent. Graphite replaces cobalt blue.
3. Large yellow planes are working sheets, not generic backgrounds.
4. Prefer rows, indexes, rules and labels to floating rounded cards.
5. Every color-coded mark also has a visible text label.
6. English and Russian interfaces preserve meaning, not word-for-word translation.
7. The existing Metka `<gram>` logo is never redrawn with HTML or CSS.

## 3. Brand assets

- Light surfaces: `/assets/logo/metkagram-logo-light.svg`
- Dark surfaces: `/assets/logo/metkagram-logo-dark.svg`
- Compact mark: `/assets/icons/metkagram-mark.svg`
- Social preview: `/assets/social/metkagram-social-preview-1200x630.png`

Keep clear space equal to at least half the yellow tag height. Do not stretch, rotate, recolor, outline or add a shadow. On dark backgrounds “Metka” remains clearly visible in white.

## 4. Color system

| Token | Value | Role |
|---|---:|---|
| `--ink` | `#111111` | Primary text, borders, controls |
| `--brand` | `#FFC400` | Primary accent and annotation sheet |
| `--brand-warm` | `#FFCA08` | Large yellow planes |
| `--paper` | `#FFFDF5` | Reading surfaces |
| `--studio-stage` | `#55575B` | Main graphite stage |
| `--studio-stage-deep` | `#3F4246` | Hover, footer, deep structure |
| `--studio-stage-pale` | `#DEDDD8` | Quiet page background |
| `--studio-shadow` | `#222426` | Hard shadows and depth |
| `--muted` | `#65645F` | Secondary copy |

Graphite is neutral infrastructure. Do not introduce another saturated interface color. Yellow may occupy a large area only when it is the primary working surface; elsewhere use it for a rule, tag, selection or CTA.

### Semantic annotation colors

| Role | Token | Value | Required label |
|---|---|---:|---|
| Subject | `--subject` | `#F2C84B` | `S` |
| Verb | `--verb` | `#EF7F61` | `V` |
| Object / predicate | `--object` | `#65A9A6` | `p2` or explicit role |
| Helper | `--helper` | `#9281C5` | `Hf` or explicit role |

Semantic colors belong inside annotation content. They are not navigation or marketing colors.

## 5. Materials and generated backdrops

The texture set is deliberately quiet and text-free. These assets are decorative; use an empty `alt` when rendered as `<img>`.

| Asset | Use | Do not use |
|---|---|---|
| `/assets/images/studio-texture-graphite.jpg` | Main stage, route backdrop, Pattern Lens | Behind long body copy without a paper surface |
| `/assets/images/studio-texture-yellow.jpg` | Hero board, highlighted method or promo sheet | Full-page background or footer |
| `/assets/images/studio-texture-black.jpg` | Footer, evidence interlude, system diagram | Large reading areas |

Use `background-size: cover`; never tile. Keep type on a solid or sufficiently opaque surface. Texture should be felt before it is consciously noticed. Avoid stacking texture, gradients and noise in one region.

## 6. Typography

- Reading: Inter with system sans-serif fallbacks.
- Technical labels: IBM Plex Mono with monospace fallbacks.
- Display headings: heavy sans-serif, tight leading, sentence case or short all-caps statements.

| Element | Desktop | Mobile | Rule |
|---|---|---|---|
| Home H1 | `clamp(4rem, 9vw, 8.8rem)` | `clamp(2.8rem, 15vw, 5rem)` | Maximum 3 lines desktop, 4 mobile |
| Route H1 | `clamp(2.5rem, 5.5vw, 5.8rem)` | `clamp(2.2rem, 11vw, 3.6rem)` | Prefer 1–3 lines |
| Section H2 | `clamp(1.6rem, 3vw, 3rem)` | `1.55–2.2rem` | State an idea, not a category |
| Body | `1–1.125rem` | `1rem` | Line height `1.55–1.7`, max 68 characters |
| Label | `.68–.78rem` | same | Mono, uppercase, tracked |

Avoid one-word giant headings. If the heading says only “Method” or “Explore,” add the outcome the visitor gets.

## 7. Layout and rhythm

- Maximum content width: `82rem`; reading width: `42–48rem`.
- Base spacing: `.375, .625, 1, 1.5, 2.5, 4.5rem`.
- Page gutters: `clamp(1.25rem, 4vw, 4rem)`.
- Use one-pixel rules to align unrelated blocks into one system.
- Hard shadows offset `.25–.6rem`; never blur shadows on editorial sheets.
- Corners stay square or restrained. Do not round every container.

Breakpoints: `860px` for structural collapse, `720px` for navigation and two-column sheets, `520px` for compact labels and controls.

## 8. Core compositions

### Home: studio stage

Graphite fills the viewport. One rotated yellow sheet carries the promise, legend and visible pattern samples. Navigation stays black. The first screen explains the product without a generic app mockup.

### Explore: library gateway

Lead with what can be found and reused. Use an indexed list, clear language labels and counts. Keep filters quieter than results.

### Method: annotated editorial

Begin with a compact numbered index linked to real sections. Alternate explanation, live annotation and evidence. Every claim connects to a visible example or practice step.

### Reference and legal pages

Use pale graphite outside a paper reading column. No oversized hero. Keep headings compact and navigation predictable.

## 9. Components

- **Header:** real logo, no duplicate wordmark; primary routes first, language switch last.
- **Yellow board:** one dominant thought, annotation cues and hard graphite shadow.
- **Index row:** number, outcome-led title, optional count, arrow; entire row is clickable.
- **Annotation tag:** code plus shape/underline; never color alone.
- **Pattern row:** source form, reusable structure and language/context metadata.
- **Primary action:** yellow on black/graphite or black on yellow; clear verb and outcome.
- **Secondary action:** paper or transparent, one-pixel border, no low-contrast text.
- **Share bar:** graphite, white text, compact group. LinkedIn, Telegram, X, copy link and print; no VK.
- **Footer:** compact black archive strip with logo, grouped routes, contact and legal links. Avoid a second sitemap-sized page.

Buttons use a one-pixel lift or hard-shadow change. Hover must not change layout. Focus uses a visible 3px outline with offset.

## 10. Language and content rules

Write the benefit first, then the mechanism. Prefer “Find reusable sentence structures” to “Explore our innovative ecosystem.” Avoid “platform,” “solution,” “seamless” and unsupported claims such as “best.”

| English term | Russian term |
|---|---|
| annotation | разметка |
| annotated sentence | размеченное предложение |
| pattern | паттерн |
| topic set | тематический сет |
| learning path | учебный маршрут |
| reusable structure | переиспользуемая структура |
| grammar role | грамматическая роль |
| source sentence | исходное предложение |
| helper | служебный элемент |
| pattern match | совпадение с паттерном |
| learning loop | учебный цикл |
| AI agent | ИИ-агент |

Do not transliterate “annotation” in Russian. Keep “паттерн” because it is a product-level reusable structure; explain it once in introductory copy.

## 11. Motion and interaction

- Motion clarifies hierarchy: sheet entry, row focus, annotation reveal.
- Default duration: `120–220ms`; ease-out for entry, linear only for progress.
- Native `<details>` is preferred for annotation explanations.
- Search and filters update results without reload and announce result count.
- `prefers-reduced-motion` removes transitions, rotation changes and smooth scrolling.

## 12. Accessibility

- Maintain WCAG AA contrast for body text and controls.
- Color is never the only semantic cue.
- Minimum pointer target is 44×44px where space permits.
- Keep logical heading order and one H1 per page.
- Inputs have persistent labels; placeholder text is an example, not a label.
- Language-specific content uses the correct `lang` attribute.
- Test keyboard order, visible focus, 200% zoom and widths 390, 768, 1280 and 1536px.

## 13. Release checklist

- [ ] H1 communicates an outcome and fits the defined line limit.
- [ ] Page uses graphite, yellow, paper and ink for interface structure.
- [ ] Annotation roles have both color and text/shape labels.
- [ ] No content sits directly on a detailed texture.
- [ ] Primary and secondary actions are visually distinct.
- [ ] EN and RU terminology matches this glossary.
- [ ] Internal routes return 200 and language switching preserves context.
- [ ] Keyboard, reduced motion, mobile overflow and contrast are checked.
- [ ] `npm run build` and `npm test` pass before publishing.

This file and `public/assets/styles.css` are the source of truth. Add a visual token here before using it on a page.
