# Auditing Pulse against good-css

A 47-point audit of this repository against [good-css](https://good-css.com/) — the list of modern CSS
techniques, each with the rules under which it works — plus [its skill](https://good-css.com/skills/good-css/SKILL.md)
and the eight reference files behind it. The site exists, in its own words, "for agents to know and reach
for", and this library is written almost entirely in class lists that an agent will extend, so it is the
right yardstick to hold against it.

**Nothing in the source was changed.** The only file this audit adds is this one. Every finding is a
measurement or a quote, and every fix is a concrete line.

## Method, and how to read the evidence

Three kinds of evidence, marked in every finding:

- **measured** — read from a running browser through Playwright, or from the compiled stylesheet at
  `dist/client/assets/styles-*.css`. Numbers are quoted with the state they were taken in.
- **read** — read from source, with the class list or declaration quoted and its file:line given.
- **inferred** — arithmetic or library behaviour not observed end to end. Flagged so nobody acts on it twice.

Surfaces used: the dev app at `http://localhost:3000`, Storybook 10 at `http://localhost:6006` (373 stories),
the built stylesheet, Tailwind 4.3.3 and `react-aria-components` 1.22.1 in `node_modules`. Five subagents each
audited one category of the reference files; every claim below was re-checked in the source, in the compiled
CSS, or in the DOM before it was written down here. Where a finding contradicts a comment in the code, both
are quoted side by side.

**Verdicts.** _Adopted_ — in use and meeting the technique's rules. _Partial_ — in use, but a named case is
missing or a rule is broken. _Missing_ — absent, and a subject exists. _Violated_ — the rule is broken where
the code claims to meet it. _Not applicable_ — no subject in this repository.

## What has since been implemented

The defect fixes and the cheap technique adoptions from [Fix first](#fix-first) and the sections below
are in the tree now, in one commit, with the full suite green (59 files, 337 tests). In summary:

- **Focus.** The dead ring in `Nav`/`Tree` (`outline-none` beside the ring, and `focus:outline-none` on
  the anchor that is the real Tab stop), the date picker's calendar trigger, the Tabs panel, the Modal
  dialog, the Sheet panel and the Popover surface all draw an indicator now, on the transparent-outline
  pattern. The field and option focus treatments were left exactly as their files argue for them.
- **Overlays.** Entry, exit and the toast animation live in one block in `styles.css`; the exit uses RAC's
  `data-exiting`, the entry the mount, and the four dropdowns that carried no slot now carry one so they
  animate too. Modal and Sheet are bounded and scroll (`max-h-[90dvh]` / `min-h-0 overflow-y-auto`), the
  overlay centers safely, and the scrollers contain their overscroll. **The Modal took the weaker of the
  two shapes the finding offered:** it scrolls as one panel rather than pinning the title and footer
  around a `flex-1` body. Nothing is unreachable now, but the footer still leaves the screen with the
  content — a body slot would be the honest fix, and not one this pass can invent without changing
  `Modal.Content`'s API.
- **Motion.** `--duration-fast`/`--duration-base`/`--duration-slow` are tokens now, the moving transitions
  are behind `motion-safe:`, `Radio`'s transition names the property it actually animates, and
  `Checkbox`'s dead `--selection-scale` is read (with a reduced-motion guard).
- **Reset.** `text-rendering: optimizeLegibility` is gone, and pressables carry `touch-action:
  manipulation`.
- **Data and text.** `Table` cells are `tabular-nums wrap-anywhere`; the chart readout is tabular;
  `TextArea` grows with its content (`field-sizing: content`, capped at `12lh`); fields show native
  `user-invalid`; the clipping surfaces are `overflow-clip`.
- **Targets and states.** The small controls have hit areas: the 12px in-field triggers are 24px, the
  TagGroup remove 14 → 26, the Nav chevron 16 → 24, the Modal close 20 → 44, the Toast close 20 → 40. The
  NumberField steppers are the exception and stay at their half of the control (~22px): they are a
  stacked pair inside a 36–52px field, and any expansion tall enough to reach 24 would overlap the other
  one. The rows, tabs, options, cells and links answer a press.
- **Layout and tokens.** The intrinsic grid at Home and on Create's showcase, the aside's parent-set gap,
  `mbs-`/`inset-bs-` in the library's own files, `viewport-fit=cover` with `env(safe-area-inset-*)` on the
  toast and the bottom sheet, and `--text-display` as the system's one fluid size.

**Deliberately not done**, each for the reason the finding gives:

- The [content grid](#7-content-grid-with-breakouts), [subgrid](#9-subgrid-rows-shared-across-cards) and
  [container queries](#11-container-queries-with-container-units) are structural rewrites with no visual
  change today — they want their own commit and a page that needs a breakout.
- The [sliding tab indicator](#37-indicator-that-slides-to-the-active-item) and the
  [clip-path reveal](#41-reveal-with-clip-path) are taste; the fade and the pop are consistent, if plain.
- [`text-box`](#22-label-centered-on-its-letters-with-text-box), `line-clamp` and the
  [full fluid scale](#6-one-fluid-scale-for-type-and-space) have no subject yet (fixed-height labels, no
  multi-line text that needs clamping, a dense UI that wants fixed chrome).
- The option focus wash stays at `foreground/7` (the date segment's is `foreground/12`): both are
  recorded decisions, and the measurement is in
  [finding 24](#24-one-focus-ring-with-focus-visible) for whoever wants to reopen it.
- Create's six dead in-page links (`#alerts`, `#fra1`, `#logs`, `#monitors`, `#runbook`, `#settings`)
  need a content decision about which sections they meant, not a code one.
- [Finding 13](#13-safe-alignment)'s second half — `overflow-x-auto` on the tab strip — was left off on
  purpose. `overflow-x: auto` computes `overflow-y` to `auto` as well, so the strip becomes a scroll
  container in both axes and clips the tabs' 3px-offset focus ring. A strip that scrolls needs padding or
  an inset ring first, which is a change to the tab recipe rather than a utility.

## The list at a glance

| #   | Technique                                        | Verdict        |
| --- | ------------------------------------------------ | -------------- |
| 1   | The reset                                        | Partial        |
| 2   | Logical properties                               | Partial        |
| 3   | OKLCH color                                      | **Adopted**    |
| 4   | One set of color tokens for light and dark       | **Adopted**    |
| 5   | Fluid sizes with `clamp()`                       | Missing        |
| 6   | One fluid scale for type and space               | Missing        |
| 7   | Content grid with breakouts                      | Missing        |
| 8   | Intrinsic grid                                   | Missing        |
| 9   | Subgrid rows shared across cards                 | Missing        |
| 10  | Sidebar that wraps on its own                    | Missing        |
| 11  | Container queries with container units           | Missing        |
| 12  | Stack layers with grid                           | **Adopted**    |
| 13  | Safe alignment                                   | Partial        |
| 14  | `overflow: clip` over `hidden`                   | Partial        |
| 15  | Section spacing that depends on its neighbors    | Not applicable |
| 16  | Space between siblings set by the parent         | **Adopted**    |
| 17  | Push one item away with an auto margin           | Partial        |
| 18  | Concentric nested radius                         | Missing        |
| 19  | Long text that wraps, truncates or clamps        | Partial        |
| 20  | Image box that holds any upload                  | **Adopted**    |
| 21  | Tabular numbers                                  | Partial        |
| 22  | Label centered on its letters with `text-box`    | Missing        |
| 23  | Icon sized by the text beside it                 | Partial        |
| 24  | One focus ring with `:focus-visible`             | **Violated**   |
| 25  | Hover styles only where hover exists             | **Adopted**    |
| 26  | Press feedback                                   | Partial        |
| 27  | Hit area larger than the visual                  | **Violated**   |
| 28  | Whole card clickable from one link               | **Adopted**    |
| 29  | `:has()` for parent and page state               | **Adopted**    |
| 30  | Form feedback with `:user-invalid`               | Missing        |
| 31  | Textarea that grows with its content             | Missing        |
| 32  | Opt-in motion                                    | Partial        |
| 33  | Motion tokens                                    | Partial        |
| 34  | Transition a custom property with `@property`    | Missing        |
| 35  | Shadow change that fades and does not repaint    | Not applicable |
| 36  | Cross-document view transitions                  | Not applicable |
| 37  | Indicator that slides to the active item         | Missing        |
| 38  | Enter and exit transitions from `display: none`  | Missing        |
| 39  | Popover anchored to its trigger                  | **Adopted**    |
| 40  | Accordion that animates its height               | Missing        |
| 41  | Reveal with `clip-path`                          | Missing        |
| 42  | Carousel on native scroll                        | Not applicable |
| 43  | Scroll area between a fixed header and footer    | Missing        |
| 44  | Styles that apply only when a scroller overflows | Missing        |
| 45  | Anchor targets that clear a sticky header        | Not applicable |
| 46  | No rubber-band bounce on desktop                 | Missing        |
| 47  | Content clear of the notch                       | Missing        |

Fourteen are adopted or not applicable. The library is not a CSS beginner writing CSS: it already writes
`oklch()` with `none` as the grey hue, derives every related colour with `color-mix(in oklch, …)`, holds
both themes in one token with `light-dark()`, and never writes `transition: all`. What the audit finds is
the opposite kind of gap: the _interaction_ and _motion_ halves of the list, and the places where a
documented rule is broken by the very class list that states it.

## Fix first

Ranked by severity and certainty, not by the order of the list above. Each is measured; the file:line
leads to the finding below.

1. **The Nav and Tree focus ring is dead, and the sidebar's links have none at all.** `Nav.tsx:65`
   carries `outline-none` in the same class list as `Nav.tsx:83-84`'s `data-[focused]:outline-1` ring,
   so the ring never draws; `Nav.tsx:111` puts `focus:outline-none` on the anchor that is the real Tab
   stop. Measured: Tab into the Nav story gives `outline: none 1px rgb(153, 200, 255)` — the browser's
   default colour over a style of `none` — and a Tree row with `data-focused` computes
   `outline: none 1px oklch(0.9198 0.1236 189.5)`, i.e. the ring's _width and colour are set and the
   style is not_. This is a third instance of the bug AGENTS.md records as fixed in `Table` and
   `GridList` — and the one a keyboard user meets first, because it is the sidebar.
2. **The date picker's calendar button has no focus indicator.** `date.tsx:57` writes
   `data-[focus-visible]:outline-none` and nothing replaces it. Measured: Tab to it gives
   `aria-label="Calendar"`, `:focus-visible` true, 12×12px, `outline: none 1px`, and the field box
   stays at rest.
3. **Hit targets are far under 44px, several under WCAG's 24px minimum.** Measured: the TagGroup
   remove button 14×14 (`size-3.5`, `TagGroup.tsx:103`), the calendar trigger and the ComboBox clear
   button 12×12, NumberField's steppers 31×22.5 and 31×21.5, Modal and Toast close 20×20, the Nav
   chevron 16×16, month arrows 28×28. Only the Slider thumb expands its target (`before:-inset-2`,
   `Slider.tsx:214`), from 20×20 to 36×36 — still under 44.
4. **A tall Sheet cannot be scrolled to its end, and a tall Modal scrolls its footer away.**
   `Sheet.tsx:147` is `flex flex-col p-6` under a layer React Aria pins to `height: 100%`, with no
   overflow anywhere; `Modal.tsx:29` makes the _overlay_ the scroller and the dialog
   (`Modal.tsx:37`) has no `max-h`, so `Modal.Footer` leaves the screen with the content.
5. **Nothing enters or leaves smoothly.** Measured on the Modal: at 0, 40, 120 and 300ms after opening,
   `animation-name: none`, `transition-duration: 0s`, `opacity: 1`, `transform: none`, and no entering
   attribute on the dialog, its `Modal` layer, the overlay or the body. Sheet and Popover the same.
   RAC 1.22.1 _does_ render the hook — `data-entering` and `data-exiting` appear 57 and 63 times in
   `react-aria-components/dist/private` and `Modal.js:119` sets it through `useEnterAnimation` — but no
   rule in this stylesheet uses it. Toast is worse: `Toast.tsx:30-31` says "React Aria puts
   `data-animation="entering" | "exiting"` on the toast", and RAC 1.22.1 emits no such attribute at all
   (`Toast.js` carries `data-hovered`, `data-focused`, `data-focus-visible` and nothing else), so the
   comment promises motion that cannot be hung there.
6. **Reduced motion is honoured in exactly two places.** `Switch.tsx:83` and `Radio.tsx:49`. Unguarded
   motion includes the Slider handle's `scale` (`Slider.tsx:206`, `211`), every rotating caret
   (`Accordion.tsx:81`, `Select.tsx:96`, `ComboBox.tsx:76`, `date.tsx:49`, `popover.ts:64`), and the
   `styles.css` sheet contains no `prefers-reduced-motion` block of its own.
7. **A table column of numbers is not `tabular-nums` and a long cell does not wrap.** Measured on
   `components-table--default`: three numeric cells (`99.98%`, `98.10%`, `91.44%`), every one computing
   `font-variant-numeric: normal`. `Table.tsx:87-94 CELL` has neither `tabular-nums` nor
   `wrap-anywhere`, and RAC applies `table-layout: fixed` only inside a `ResizableTableContainer`, so
   the plain table is auto-layout, where the root's `overflow-wrap: break-word` is ignored.
8. **Press feedback is missing wherever the tap highlight used to be.** The reset removes
   `-webkit-tap-highlight-color` (Tailwind's preflight), and only `Button` (and what composes it) and
   `TagGroup`'s remove control answer with `data-[pressed]`. `Link`, `Tabs`, the Accordion header, Nav
   and Tree rows, Table and GridList rows, menu and option rows, calendar cells and the close buttons
   have no pressed state, so on touch a press is silent.
9. **Two lines of the reset itself.** `styles.css:291` sets `text-rendering: optimizeLegibility`, which
   good-css names in "Left out on purpose"; and the reset never adds `touch-action: manipulation`, the
   rule that lets `click` fire without the double-tap-zoom wait.
10. **The notch and the rubber band.** The app's viewport meta is `width=device-width, initial-scale=1`
    with no `viewport-fit=cover`, and `env(safe-area-inset-*)` appears nowhere, so the toast region
    (measured `bottom: 16px`, `padding-bottom: 0`) and the bottom sheet sit under the home indicator.
    Nothing sets `overscroll-behavior` either, while the app has fixed UI a trackpad stretch drags.
11. **The textarea does not grow.** Measured: `field-sizing: fixed`, `resize: vertical`, height 92px
    before and after twelve lines (`scrollHeight` 312), so the content is clipped until the corner is
    dragged.
12. **Two dead declarations with a real effect.** `Checkbox.tsx:44,55,64` set `--selection-scale` and
    nothing reads it (`Radio.tsx:62` does), so the "scales the centre" the comment at
    `Checkbox.tsx:48` describes never happens; and `Radio.tsx:63` transitions `transform` while the
    property actually animating is `scale`, so the centre pops while only the fade runs.

Everything else is in the sections below: the structural techniques that are simply absent (7–11, 18,
22, 37, 38, 41, 43, 44), and the long tail of partials with a named case missing.

## Foundations

### 1. The reset — Partial

> Start every new project with it. In an existing project add one rule at a time… (the reset also carries
> `button, a, [role="button"] { touch-action: manipulation }` and `user-select: none` on controls.)

**Present, read.** `styles.css:222-241` — `min-width: 0` on `*`, `interpolate-size: allow-keywords`,
`scrollbar-gutter: stable`, `text-wrap: pretty`, `overflow-wrap: break-word`, `font-synthesis: none`;
`:263-268` `text-wrap: balance` on `h1–h4`; `:272-275` `font-size: max(16px, 1rem)` on inputs; `:278-292`
`body` margin, `min-height: 100svh`, the two font-smoothing rules. Tailwind's preflight genuinely carries
the parts the comment at `:216-220` claims it does (`-webkit-tap-highlight-color: transparent`,
`-webkit-text-size-adjust: 100%`, the media element rules) — read in the built sheet.

**Absent, measured.** `touch-action: manipulation` appears nowhere in `src`; the only `touch-*` utilities are
`touch-none` on two drag handles (`Slider.tsx:362`, `Table.tsx:419`), which is a different job. `select-none`
is applied per control — `Button.tsx:101`, `Radio.tsx:33`, `Checkbox.tsx:37`, `Switch.tsx:30`, `Tabs.tsx:37`,
`Accordion.tsx:66`, `Select.tsx:119`, `Tree.tsx:243`, `TagGroup.tsx:50`, `TokenField.tsx:31`, `date.tsx:76` —
and is absent from `Link`, which is right. So the rule lives in eleven places instead of one.

**Broken, measured.** `styles.css:291` `text-rendering: optimizeLegibility` — named in the skill's
"Left out on purpose" list, and live: `getComputedStyle(document.body).textRendering` returns
`"optimizelegibility"`.

**Fix.** Delete `styles.css:291`. Add `:where(button, a, [role="button"]) { touch-action: manipulation }`
to the reset. Leave `select-none` where it is: a reset-wide `user-select` would take the text from links.

### 2. Logical properties — Partial

> Use them in place of every left, right, top and bottom, in spacing, borders, offsets and alignment…
> (`mbs-`, `pe-`, `inset-bs-`; never `mt-`, `pr-` or `top-`.)

**A correction first, measured.** `px-`, `py-`, `mx-` and `my-` are already logical in Tailwind 4 — the built
sheet has `.px-5{padding-inline:…}`, `.py-4{padding-block:…}`, `.mx-1{margin-inline:…}`,
`.my-4{margin-block:…}`. They are not violations, and a count of them reads as one.

**The physical ones that are.** Across 137 `src` files: `mt-` ×56 (`mb-` ×0), `pt-/pb-` ×19
(`pl-/pr-` ×0), `top-/left-/right-/bottom-` ×24, `border-l/r/t/b` ×29. Against 41 logical ones
(`ms-/me-/ps-/pe-/mbs-/mbe-/start-/end-`, of which `mbs-/mbe-` are 0 — every vertical space is physical).
Examples: `Table.tsx:34` `border-collapse border-b border-border-soft text-start`, `Table.tsx:47`,
`Modal.tsx:48` `mt-2`, `Sheet.tsx:201` `mt-auto`, and `Modal.tsx:54` `absolute end-4 top-4` — one line, one
logical and one physical inset. `Toast.tsx:25` `fixed end-4 bottom-4` the same.

**One documented exception, keep it.** `Tabs.tsx:50-53` writes its vertical indicator's block edges
physically on purpose: the strip's rule sets `bottom` physically, and a logical `inset-block` would leave
the two fighting over the same edge. That is a reason, not an oversight.

**Fix.** Convert the library first: `Modal.tsx:48` `mt-2` → `mbs-2`, `Sheet.tsx:201` `mt-auto` →
`mbs-auto`, `Modal.tsx:54` `top-4` → `inset-bs-4`, and the block-end hairlines to the block-axis border
utilities Tailwind 4.3.3 ships (`border-bs` verified present in `node_modules`). The 49 occurrences in
`Home.tsx` and `Create.tsx` are examples, and can follow.

### 3. OKLCH color — Adopted

> Write colors in `oklch()` and derive every related color from a base with `color-mix(in oklch, …)`.
> Never hardcode a second hex or an `rgba()` for a hover, tint or transparent version… Write grays, white
> and black with `none` as the hue.

**Evidence, read.** `styles.css:36-113`. Every neutral is `oklch()` with `none` as its hue — `:36`
`--background: light-dark(oklch(100% 0 none), oklch(0% 0 none))`, plus `:37`, `:69`, `:109`. Every derivative
is a mix: `--muted-foreground` (`:70`), `--border` (`:85`), `--border-strong` (`:88`), `--border-soft`
(`:89`), `--input` (`:99`). Every accent is `oklch()` (`:53-63`).

**The two literals are named and argued, not leaked.** `popover.ts:13`
`shadow-[0_12px_32px_rgba(0,0,0,.7)]`, with `popover.ts:8-9` saying why (a shadow has to darken in both
themes, and a token-derived one hazes); `bg-black/50` at `Modal.tsx:30` and `Sheet.tsx:121`, argued at
`Modal.tsx:20-27` the same way. Neither is a hover, a tint or a translucent version of a token, which is
the thing the rule forbids.

**Fix.** None.

### 4. One set of color tokens for light and dark — Adopted

> Switch themes by setting `color-scheme`. Never redefine the tokens… Add
> `<meta name="color-scheme">` so the browser paints the right background before the CSS loads.

**Evidence, read.** `styles.css:36-37` hold both themes in one value with `light-dark()`. `styles.css:246-261`
sets `color-scheme` and nothing else: `:root` dark, `[data-theme='dark']` and `.dark`, `[data-theme='light']`,
`[data-theme='system']`. There is no second block of values in the 297 lines. `src/routes/__root.tsx:26-31`
carries the `color-scheme` meta as `dark`, deliberately, because Pulse is dark-first — the file says it
must become `light dark` the day a light preference is persisted.

**Fix.** None.

### 5. Fluid sizes with `clamp()` — Missing

> Use it for anything that should grow with the screen… Write the preferred value as `rem + vw`, never
> `vw` alone. Keep both bounds in `rem`… For a font size, keep the maximum at or below 2.5 times the
> minimum… Put fluid values in tokens.

**Measured.** `clamp(` occurs zero times in `src` and zero times in the built sheet. Body type is fixed:
`styles.css:286` `font-size: 14px`. There are fourteen distinct `text-[Npx]` sizes across 141 uses, from 10px
to 56px; the largest is the landing hero, `Home.tsx:219` `text-[40px] leading-[1.05]`.

**And there is no ladder to replace, read.** The 27 breakpoint-prefixed utilities in implementation files
are all grid templates — `Home.tsx:213` `md:grid-cols-[minmax(0,1fr)_320px]` and its siblings — none of them
type or spacing. So nothing here is a breakpoint ladder waiting to collapse; the display sizes simply never
grow, and the chrome is fixed by design.

**Fix.** One token, one consumer: `--text-display: clamp(2rem, 1.5rem + 2.5vw, 2.5rem)` in `:root`, used at
`Home.tsx:219`. Leave the 10–18px chrome fixed — this is a dense monitoring UI and fluid chrome would
fight the density.

### 6. One fluid scale for type and space — Missing

> Use it when a design has more than two or three font sizes… Components use the tokens and never repeat
> the math… Step `n` passes when `(size-wide / size-narrow) × (ratio-wide / ratio-narrow)ⁿ` is 2.5 or less.

**Measured absence.** `styles.css` declares no `--fluid`, `--at-narrow`, `--at-wide`, `--ratio-*` or
`--step-*`. The scale is fourteen literal px values plus Tailwind's own `--spacing: .25rem`.

**Fix.** Worth doing only if the type is meant to grow. Add the six plain-number inputs and
`--step--1…--step--3`, set `body { font-size: var(--step-0) }`, and run the 2.5 check before shipping a
display step: 40px against 14px is already 2.86, so that step wants the `clamp()` route above, not this one.

## Layout

### 7. Content grid with breakouts — Missing

> Use it as the container of every page, whether or not anything on it goes wider than the content. A
> centered `max-width` wrapper is the sign, such as `.container` or Tailwind's `mx-auto max-w-*`.

**Read.** Three pages, three containers: `Home.tsx:205` `<main className="mx-auto max-w-6xl px-8 py-10">`;
`Create.tsx:184` `mx-auto max-w-[1440px] px-6 py-8`; `Login.tsx:82`
`flex min-h-dvh items-center justify-center bg-background px-6 py-16` with a `max-w-sm` inside. No
named-line grid anywhere.

**Fix.** One `.content-grid` — the five tracks with `content`, `breakout` and `full-width` named lines — in
the base layer of `styles.css`, on `main`, with `--content` per page. Be honest about the size of the win:
nothing on any page needs a breakout today, so this is structural with no visual change. It buys the next
band, figure or table wrapper a class with no negative margin.

### 8. Intrinsic grid — Missing

> Use it for any set of equal cards or tiles. It replaces a column count per breakpoint.

**Measured absence.** `repeat(auto-fit…)` and `auto-fill` occur zero times in `src` and zero times in the
built sheet. The sets that qualify: `Home.tsx:413`
`grid gap-px border border-border-strong bg-border-soft sm:grid-cols-3`; `Create.tsx:1282`
`grid gap-6 sm:grid-cols-3`; `Create.tsx:1038` `grid grid-cols-2 gap-3`.

**One trap that matters here.** Home's grid is filtered by the search field, and its 1px gaps are the
parent's `bg-border-soft` showing through — so `auto-fill` would paint the empty tracks as grey blocks.
That one must be `auto-fit`.

**Fix.** `Home.tsx:413` → `grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-px …`, and the
same shape at the two `Create.tsx` sites.

### 9. Subgrid rows shared across cards — Missing

> Use it when cards in a row have parts that should line up, such as title, body and footer, whatever the
> length of their content… The span must equal the number of parts in the card.

**Read.** `Create.tsx:1502` `grid items-start gap-5 xl:grid-cols-2` lays out 21 Showcase cards, and every one
has exactly two parts — a header (`Card.tsx:22`) and a content (`Card.tsx:36`). `items-start` is precisely
what denies the row stretch that subgrid needs, and `subgrid` appears nowhere in `src`.

**Fix.** Drop `items-start` and put `row-span-2 grid grid-rows-subgrid` on each `Card`. Tailwind 4.3.3
ships `grid-rows-subgrid`; the cards' titles would then share one baseline across the row.

### 10. Sidebar that wraps on its own — Missing

> Use it for any pair where one side has an ideal width and the other takes the rest… The wrap point is a
> share of the container, not a length.

**Read.** `Home.tsx:213` `grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]`, and the same shape at
`Home.tsx:669` (280px), `Create.tsx:263` (340px) and `Create.tsx:456` (320px). `minmax(0,1fr)` lets the
main track shrink to zero, and the Toolbar it holds (`Toolbar.tsx:66` `flex items-center gap-1`, no wrap)
is wider than the track from `md` up to roughly 880px.

**Inferred.** The overlap is arithmetic on declared sizes and type, not a rendered measurement. It is worth
one look at 800px before acting; the fix is the same either way.

**Fix.** `flex flex-wrap gap-10` on the pair, `flex-basis: 20rem; flex-grow: 1` on the aside and
`min-inline-size: 50%` on the main column — or a container query, below.

### 11. Container queries with container units — Missing

> Use it for any component that appears in slots of different widths. The component responds to the space
> it is given, where a media query only knows the viewport.

**Measured absence.** `container-type`, `@container`, `cqi`, `cqw` and `cqmin` occur zero times in `src` and
zero times in the built sheet. This is the technique with the strongest case here, because `Card` is
explicitly slot-agnostic — it ships at half width on one page and full width on another, and through the
registry (`public/r/*.json`) into projects whose widths this repository cannot know.

**Fix.** `main { container-type: inline-size }` in the base layer, then key `Card.tsx:25`'s
`has-data-[slot=card-action]:grid-cols-[1fr_auto]` off `@container (width > 24rem)` instead of assuming a
card wide enough for a second column.

### 12. Stack layers with grid — Adopted

> Use it whenever things sit on top of each other, such as text over an image, a badge on a card, or two
> icons that swap.

**Read.** `Modal.tsx:29` `fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4` is the scrim and
the dialog in one grid. `Button.tsx:339` `absolute inset-0 grid place-items-center text-(--btn-fg)` is the
entry's own named exception — the loader must not change the button's width, so it is absolutely
positioned inside it. `Select.tsx:82-97` solves the two-icons-that-swap case deliberately, with one fixed
12×12 flex child rather than a stack. The remaining absolutes (`field.ts:143` affix, `Table.tsx:419`
resizer, `Radio.tsx:61` centre) are all size-neutral, which is what the entry excepts.

**Fix.** None.

### 13. Safe alignment — Partial

> Use it wherever content is centered or end-aligned in a container that can become too small, such as a
> tab row, a toolbar or a vertically centered modal.

**Read, and this is the entry's own example.** `Modal.tsx:29` `grid place-items-center overflow-y-auto p-4`:
with a plain `center`, a dialog taller than the viewport overflows past the block-start edge, where no
scroll can reach it. `-safe` values occur zero times in `src`, and Tailwind 4.3.3 ships
`place-items-center-safe`. Separately, `Tabs.tsx:22-29` — the `Tabs.List` `flex border-b border-border-soft`
— has neither `overflow-x-auto` nor a safe value, and `Home.tsx:399` puts five tabs in it: roughly 440px
needed against roughly 296px at a 360px viewport (inferred from declared padding and type).

**Fix.** `Modal.tsx:29` → `place-items-center-safe`. Add `overflow-x-auto` to the tab strip, and decide
whether the tabs should also scroll into view or wrap.

### 14. `overflow: clip` over `hidden` — Partial

> Use it whenever you want to cut off overflow and do not need scrolling. Keep `hidden` for an element a
> script scrolls, and on an element with `resize`.

**Measured.** Seven `overflow-hidden` and zero `overflow-clip` in `src`, and zero in the built sheet:
`progress.ts:38` `relative h-1 w-full overflow-hidden`, `ListBox.tsx:24`, `Avatar.tsx:114`, `popover.ts:18`,
`Select.tsx:108`, `ComboBox.tsx:96`, `date.tsx:62`. None of the seven is script-scrolled or resizable, and
the scrollers are correctly separate (`optionList.ts:10` and `popover.ts:21`
`max-h-[264px] overflow-auto p-0`, `Table.tsx:390` `overflow-x-auto`, `Create.tsx:467`).

**Why it is worth the seven edits.** `hidden` makes the box a scroll container a script (or a stray focus)
can move; `clip` does not. The measured cost today is zero — which is the argument for doing it before a
consumer finds out.

**Fix.** `overflow-clip` on those seven; leave the `overflow-auto` lists alone.

## Spacing and shape

### 15. Section spacing that depends on its neighbors — Not applicable

> Use it on any page built from reorderable sections, above all in a CMS where an editor decides the order.

**Read.** The pages are hand-ordered JSX: no CMS, no reorderable list, so a pair rule has no subject.
Every boundary is a per-instance `<Separator className="my-12" />` — `Home.tsx:318, 373, 450, 611, 665, 848`.
`:has()` pair rules occur zero times; the four `:has()` uses in the repo are conditional layout
(`field.ts:63-64`, `Card.tsx:25`, `Table.tsx:44`, `NumberField.tsx:136`).

**Fix.** None today. Recorded for the day sections become data.

### 16. Space between siblings set by the parent — Adopted

> The parent sets one space between its children, and no child carries a block margin of its own.

**Read.** `Form.tsx:37` `flex flex-col gap-5`, `Form.tsx:41` `gap-4`, `field.ts:40`
`group flex flex-col gap-2`, `GridList.tsx:116` `gap-1`, `progress.ts:11` `gap-2`, `Toast.tsx:25` `gap-2`,
and no `> * + *` flow rule anywhere — which is what the entry advises for content you control.
One run escapes it: `Home.tsx:285`'s `<aside className="border border-border-strong bg-card p-5">` is not a
flex column, so its blocks are spaced by `my-4` on its Separators (`Home.tsx:295, 305`).

**Fix.** `Home.tsx:285` → `flex flex-col gap-4`, and drop the two `my-4`.

### 17. Push one item away with an auto margin — Partial

> Use it when one item in a flex row or column sits apart from the rest… The container needs free space…
> Write `min-block-size`, never `block-size`.

**Read — both uses are correct.** `Sheet.tsx:201` `[DIALOG_FOOTER, 'mt-auto']` inside `Sheet.tsx:147`'s
flex column, and `Nav.tsx:123` `ms-auto text-[11px] text-warning tabular-nums` inside `Nav.tsx:63`'s flex
row. `justify-between` appears only on genuine two-child rows (`Home.tsx:376`, `Create.tsx:212`,
`Login.tsx:127`).

**The broken half is the container.** React Aria sets the sheet layer's height inline — recorded at
`Sheet.tsx:135-140` — and the panel has no overflow, so `mt-auto` has no free space to claim and content
taller than the viewport overflows where nothing can scroll to it.

**Fix.** `Sheet.tsx:147` → `[SURFACE, 'flex min-h-0 flex-col overflow-y-auto p-6']` (the same change as
fix-first 4).

### 18. Concentric nested radius — Missing

> Use it wherever a rounded element sits inside a padded rounded parent, such as an image in a card or a
> button in an input… Derive the outer radius from the inner one.

**Read.** No `calc(… + pad)` exists. `styles.css:207-213` derives `--radius-md` (0.8 × base) and
`--radius-xl` (1.4 × base) from the same base _independently_, so a padded parent can never be concentric
with its child. Concrete: `Toolbar.tsx:68` `border border-border-strong bg-card rounded-md p-1` holding
`rounded-md` buttons — the same radius 4px apart, so the inner arc sits outside the outer one; and
`Card.tsx:14`'s `rounded-xl` with `p-4` (`Card.tsx:36`) around `rounded-md` controls. `segment.ts:31-36`
shows the unpadded group-corner geometry was reasoned about; the padded case was not.

**Why nobody has seen it.** Pulse's `--radius` is 0 (`styles.css:133`), so every corner is square. The
defect appears the moment `/create` dials the radius — which is the whole point of that page.

**Fix.** On the padded parent: `p-(--toolbar-pad)` and
`[border-radius:calc(var(--radius-md)+var(--toolbar-pad))]`, with the same two lines on `Card`. At
`--radius: 0` nothing renders differently.

## Text and media

### 19. Long text that wraps, truncates or clamps — Partial

> Use it on any text that comes from a user or a CMS… Put the truncation on the element that holds the
> text… Every flex item between the row and the truncated text must be able to shrink… A table with
> automatic layout ignores `break-word`: set `overflow-wrap: anywhere` on the cell.

**Adopted, read.** The reset does its half — `min-width: 0` on everything (`styles.css:222-229`) and
`overflow-wrap: break-word` at `:238`. Truncation sits on the text element: `popover.ts:41`
`ITEM_LABEL = 'truncate'`; `Select.tsx:62` `VALUE = 'min-w-0 flex-1 truncate'` with the count kept
`shrink-0` (`Select.tsx:73`) "so it can never be the part that gets cut"; `Button.tsx:252`'s
`<span data-slot="text" className="truncate">`; `Home.tsx:190` `whitespace-pre-wrap` on the install
commands.

**Broken: the table.** `Table.tsx:87-94 CELL` has no wrapping of its own, and `Table.tsx:34 ROOT` has no
`overflow-x-auto` — only `Table.Resizable` does (`Table.tsx:390`). React Aria applies
`table-layout: fixed` only inside a `ResizableTableContainer`, so the plain table (the Default story and
both of Home's, `Home.tsx:513` and `Home.tsx:618`) is auto layout, where a root-level `break-word` is
ignored when the browser computes a cell's min-content width. A long hostname or URL widens the table or
overflows it. (Inferred from RAC's container-scoped style plus the absent utility — not rendered, because
no fixture has a long string in a cell.)

**Also absent:** `line-clamp` occurs nowhere in `src` or the built sheet. Card.Content, Toast.Text and
GridList names are the multi-line texts; none is long enough today to need a clamp, so this is a missing
capability rather than a broken surface.

**Fix.** `wrap-anywhere` on `CELL` (Tailwind 4.3.3 ships it, and it is the `overflow-wrap: anywhere` the
entry asks for). Decide a clamp separately for `Card.Content` — a card that shows an excerpt should say
how many lines it is.

### 20. Image box that holds any upload — Adopted

> Use it on every image, video or embed whose file you do not control… One axis must be `auto`… Use
> `cover` to crop… A fixed-size image in a flex row needs both sizes, as the avatar has.

**Evidence, read.** `Avatar.tsx:114` `inline-flex shrink-0 items-center justify-center overflow-hidden
rounded-md` plus both sizes from `SIZES` (`size-6/8/10`); `Avatar.tsx:134`
`<img className="size-full object-cover">`; `bg-(--avatar)` (`:119`) paints the box before the file loads;
`onError` falls back to initials, which is the entry's Safari failed-image case, asserted at
`Avatar.stories.tsx:72`. It is the library's only `<img>`, and `DropZone` renders no preview, so nothing
else has a subject.

**Fix.** None.

### 21. Tabular numbers — Partial

> Use it on any number that changes or sits in a column, such as prices, tables, timers and counters…
> The font must ship tabular figures, or nothing changes.

**Measured.** On `components-table--default` the three numeric cells — `99.98%`, `98.10%`, `91.44%` — all
compute `font-variant-numeric: normal`. The column is real story data (`Table.stories.tsx:19-28 FLEET`,
rendered at `:82`), not a fixture, and Home renders a count column the same way (`Home.tsx:629`).

**Declared in seven narrow places instead:** `progress.ts:21`, `NumberField.tsx:36`, `Nav.tsx:123`,
`Slider.tsx:225`, `date.tsx:76`, `date.tsx:123`, `Create.tsx:1438`, with one assertion
(`NumberField.stories.tsx:93`).

**Why it still looks aligned.** `styles.css:285` sets the body font to `var(--font-mono)`, and every family
the theme builder offers is monospace (`examples/createTheme.ts` FONTS). The digits are fixed-advance
whatever the property says — the typeface is providing the technique, and the property is not. That is also
why the gap is invisible today and why a theme with a proportional family would expose it.

**Fix.** `tabular-nums` on `Table.tsx:87 CELL` and `chartTooltip.ts:16`, so the property guarantees the
column regardless of the family.

### 22. Label centered on its letters with `text-box` — Missing

> Use it on single-line labels in buttons, badges and chips, so equal padding looks equal in any font… It
> does nothing on a flex or grid container. A button that is `inline-flex` because it holds an icon needs
> the declaration on the element that wraps the text.

**Measured absence.** `text-box` and `trim-both` occur nowhere in `src` and nowhere in the built sheet.
Every padded single-line label is an inline-flex with `items-center` (`TagGroup.tsx:33-38` CHIP,
`Button.tsx:202-206`, `Avatar.tsx:114`), which is exactly the container the declaration does nothing on.

**Two hazards the library already avoids.** Heights are fixed on buttons (`h-8/h-11/h-[52px]`), so the
"label changes the button's height" effect cannot occur; and nothing sets it on `*`, which the skill names
as a thing never to do.

**Fix.** The hard case is the chip, whose label is a bare text child — an anonymous flex item with no
element to carry the declaration — so `TagGroup.tsx:246` needs a `<span className="[text-box:trim-both
cap_alphabetic]">` wrapper, and `Button.Text` the same. Check the entry's Support line against this
project's browser floor first; this is polish, and it is the one item on the list that a missing feature
degrades rather than breaks.

### 23. Icon sized by the text beside it — Partial

> Use it on every icon that sits next to a label… `block-size: 1cap; inline-size: auto`… Keep
> `flex: none`. Never size an icon in `px`. With `text-box` the trimmed label is `1cap` tall, so
> `align-items: center` lines the icon up with it at both edges.

**The rule verbatim, read.** `Button.tsx:236` `[&>svg]:block [&>svg]:h-[1cap] [&>svg]:w-auto
[&>svg]:shrink-0` — `1cap`, `inline-size: auto`, `flex: none`, and `block` to avoid the inline baseline
gap. `field.ts:145` does the same at `1.5cap` for a set with internal padding, and the spinners are
`size-[1.25cap]` (`Button.tsx:273`, `Select.tsx:189`, `ComboBox.tsx:92`).

**Against the rule.** Icons sized in px inside a label's line: `TagGroup.tsx:258` `size-2` in a 12px chip
(where `1cap` is about 8.6px), `Menu.tsx:137` `size-2.5`, `Nav.tsx:287` `size-1.5`, `Modal.tsx:234` and
`Toast.tsx:214` `size-2.5`. The caret family (`Select.tsx:167`, `ComboBox.tsx:74`, `date.tsx:47`,
`NumberField.tsx:72`), all `h-1.5 w-2.5`, is the sheet's own fixed chevron drawing and is deliberately px.

**And the pair is half-applied.** The rule lines a `1cap` icon up with a _trimmed_ label at both edges;
`Button.Icon` is `items-center` against an untrimmed `Button.Text`, so the icon centres on the line box
(ascent + descent) rather than on the caps. Since 22 is missing, this is the wrong half of the pair.

**Fix.** `TagGroup.tsx:258` `size-2` → `size-[1cap]` first. The centring resolves itself once 22 lands.

## Interaction

### 24. One focus ring with `:focus-visible` — Violated

> Use it as the focus style for every interactive element. Style focus with `:focus-visible` and
> `outline`. Never write `outline: none`.

**What is right, measured.** The app's Tab ring is a real outline — `outline-style: solid` with the accent
colour, 1px at a 3px offset on `Button`, `Link` and the tabs, 2px on the Slider handle and `DropZone`,
inside the row for Table and GridList. There are 74 usages of `data-[focus-visible]` across the implementation files, and the ring works everywhere it is not cancelled.

**What is dead, measured three ways.** These are the same bug AGENTS.md records as fixed in `Table` and
`GridList`: `outline-none` sets Tailwind's shared `--tw-outline-style`, and every `outline-<width>` utility
reads it back, so a ring written beside it can never draw. Compiled:
`.outline-none{--tw-outline-style:none;outline-style:none}` against
`.data-\[focused\]\:outline-1[data-focused]{outline-style:var(--tw-outline-style);outline-width:1px}`.

- **Nav and Tree rows** — `Nav.tsx:65` `'outline-none transition-colors …'` is in the same `NAV_ITEM`
  array as the ring at `Nav.tsx:83-84`, and `Tree.tsx:157` composes `NAV_ITEM`. Measured on a Tree row
  carrying `data-focused`: `outline: none 1px oklch(0.9198 0.1236 189.5)` — width and colour set, style
  `none`, which is the exact signature.
- **The Nav anchor** — `Nav.tsx:111` `NAV_LABEL_LINK = NAV_LABEL + 'focus:outline-none'`. Measured: the
  Tab stop in the Nav story is that anchor, and its computed outline is `none 1px rgb(153, 200, 255)` —
  the browser's default colour over a style of `none`. The comment at `Nav.tsx:78-82` says the anchor is
  "taken out of the tab order"; the DOM disagrees.
- **The date picker's calendar button** — `date.tsx:57` `data-[focus-visible]:outline-none` and nothing
  else in `DATE_TRIGGER`. Measured: `:focus-visible` true, `aria-label="Calendar"`, 12×12px,
  `outline: none 1px`, and the field box unchanged, so nothing anywhere says where focus is.
- **Two containers** — `Tabs.tsx:71 PANEL` (`'pt-[18px] outline-none'`) and `Modal.tsx:40 DIALOG`.
  Measured with the tab panel focused: `role="tabpanel"`, `tabindex="0"`, `:focus-visible` true,
  `outline-style: none`. The dialog behaves the same way when it takes focus on open. A keyboard user
  who tabs into either gets no indication.

**Deliberate, documented, and kept — but worth one more look.** `field.ts:112`, `TextArea.tsx:44` and
`Select.tsx:54` replace the outline with a 1px `border-primary`, argued at `field.ts:92-98` (a field's edge
is the border it repeats; a ring would draw two parallel teal hairlines with a gap). `date.tsx:104`'s
segments take a `bg-foreground/12` wash and `optionList.ts:25`'s options take `bg-foreground/7`. The
option wash is the weakest indicator in the library: measured, it is **1.11:1** against an unfocused row
(compositing the dark card with 7% white gives about 1.2:1), where WCAG 2.4.11 asks for 3:1. The state is
also on the text (75% → 100% white), so it is visible — just faint.

**Fix.** Delete `outline-none` from `NAV_ITEM` (`Nav.tsx:65`) and from `NAV_LABEL_LINK` (`Nav.tsx:111`): the
ring already written there starts drawing. Give `DATE_TRIGGER` the `Table.tsx:52` pattern — a transparent
outline at rest, colour on `data-[focus-visible]`. Replace `PANEL` and `DIALOG`'s `outline-none` the same
way. Then decide the wash: `bg-foreground/15` or a ring on the option and segment, if the 3:1 target is
wanted. "Leave the browser's ring alone" is not a third option here — the measured UA ring is
`rgb(153, 200, 255)`, a blue that belongs to no token.

### 25. Hover styles only where hover exists — Adopted

> Put every `:hover` rule inside `@media (hover: hover) and (pointer: fine)`, so a tap on a touch screen
> does not leave the hover state stuck.

**Measured.** The built sheet contains exactly one `@media (hover:hover)` block, and it holds every
`hover:` rule in the library (`hover:bg-(--tag-hover)`, `hover:bg-muted`, `hover:text-foreground`,
`hover:scale-105` …). `styles.css` writes no `:hover` rule of its own, and no component writes
`[&:hover]`. React Aria's `data-[hovered]` — used by Button, the field, the option list, Nav and Tag —
is only set for hover-capable pointers.

**Fix.** None. `Table.tsx:75`'s native `:hover` is media-gated by the same variant, and its comment says
why it is not `data-[hovered]`.

### 26. Press feedback — Partial

> Give everything pressable an `:active` state. The reset removes the tap highlight, so every pressable
> element needs its own.

**Adopted.** `Button.tsx:192-198` — `data-[pressed]:bg-(--btn-pressed)` and
`data-[pressed]:opacity-60` — inherited by everything that composes Button (`ToggleButton`,
`ToggleButtonGroup`), and `TagGroup.tsx:44`, verified live: the chip background deepens to
`oklch(0.717444 0.096408 189.5)` with `data-pressed` set.

**Missing.** No pressed state in `link.ts:9-15`, `Tabs.tsx:36-65`, `Accordion.tsx:63-74`, the Nav and Tree
rows (`Nav.tsx:62-85`), `Table.tsx:68-80`, `GridList.tsx:105-114`, `optionList.ts:20-32`, `date.tsx:74-95`,
`Modal.tsx:53-60`, `Toast.tsx:43-50` or `NumberField.tsx:58-66`. Because the reset removes
`-webkit-tap-highlight-color`, a press on a Nav row on a touch screen produces nothing at all. And the
library's one scaled press grows (`Slider.tsx:211 active:scale-110`) where press usually shrinks.

**Fix.** One line per shared recipe, derived from the base as the house rule says —
`data-[pressed]:bg-foreground/12` on `NAV_ITEM`, `ROW`, `ITEM` and `OPTION`, and a colour step on `Link`.
Colour, not transform: a row that moves on press shifts the text under the finger.

### 27. Hit area larger than the visual — Violated

> Use it on icon buttons, close buttons and any target that looks smaller than 44px.

**Measured, target by target.** `TagGroup.tsx:103` remove `size-3.5` → **14×14**; `date.tsx:53` calendar
trigger → **12×12**; `ComboBox.tsx:84` clear → **12×12** (and `tabindex="-1"`, so the keyboard cannot reach
it either); `NumberField.tsx:58-59` steppers → **31×22.5** and **31×21.5**; `Modal.tsx:54` and
`Toast.tsx:44` close `size-5` → **20×20**; `Nav.tsx:97` chevron `size-4` → 16×16; `date.tsx:112` month
arrows `size-7` → 28×28. Five of these are under WCAG 2.5.8's 24×24 minimum, not just under the 44px
comfort target.

**One expansion exists**, and it is the pattern to copy: `Slider.tsx:214`
`'before:absolute before:-inset-2 before:content-[""]'` grows a 20×20 thumb to 36×36 — still short of 44.
`getComputedStyle(el, '::before').content` is `none` on every other small control measured.

**Fix.** Give each one the same pseudo-element, sized from both directions so it never shrinks a target
that is already big enough:
`relative after:absolute after:content-[""] after:inset-[min(0px,calc((100%-44px)/2))]`. Start with
`TagGroup`'s 14px remove — the smallest target in the library, on a control that deletes something.

### 28. Whole card clickable from one link — Adopted

> Use it for cards, list rows and tiles where the whole area should navigate… A `::after` on the link
> stretched over the card.

**Measured.** Home's tile grid reaches the same outcome by construction: `Home.tsx:417-434` is a
`<li className="bg-card">` holding one `<Link className="block px-4 py-3">`, and the li and the link
measure identical boxes (45.5 × 361.3, nothing uncovered). No `after:inset-0` overlay and no click handler
on a div exist anywhere in `src`.

**And Card deliberately does not navigate** — `Card.tsx:14` carries no hover state and
`docs/components/card.md` records that as the design.

**Fix.** None. If a card that navigates is ever added, the stretched `::after` is the technique; the block
link only works while the link _is_ the tile.

### 29. `:has()` for parent and page state — Adopted

> Use it wherever a script adds a class to a parent because of what it contains or what state a child is
> in.

**Evidence, read.** `field.ts:63-64` `has-[[data-slot=icon-start]]:[&>[data-slot=input]]:ps-10.5` and its
`icon-end` twin; `Card.tsx:25` `has-data-[slot=card-action]:grid-cols-[1fr_auto]`; `Table.tsx:44`
`has-[[data-slot=selection]]:w-12 …`; `NumberField.tsx:136` the counter's padding. None is nested, and no
script adds a parent class anywhere in the repo for what a child contains.

**The page-lock half is not applicable.** React Aria portals a `role="dialog"` div and locks scrolling with
an inline style, so `html:has(dialog:modal)` cannot match. `styles.css:235` already carries
`scrollbar-gutter: stable`, which is the shift that rule exists to prevent.

**Fix.** None.

### 30. Form feedback with `:user-invalid` — Missing

> Use it for inline form validation, in place of blur listeners and a "touched" class.

**Measured.** `user-invalid` and `user-valid` occur zero times. `Form.tsx:90` sets
`validationBehavior="native"`, so the input really does carry `required` (measured `true` on
`components-textarea--required`) — but after a focus and a blur, `:user-invalid` does not match,
`aria-invalid` is null, `data-invalid` is absent and the border is unchanged at `oklch(1 0 none / .45)`.
The native state exists and the stylesheet never binds to it.

**What the library uses instead:** `field.ts:113` `data-[invalid]:border-destructive` plus the `ERROR`
slot (`field.ts:133`), driven by React Aria's `isInvalid` — a good path, but it only speaks once
something has set that prop or submitted the form.

**Fix.** One utility beside the existing rule: `user-invalid:border-destructive` on `field.ts:113` and
`TextArea.tsx:45`. It needs no touched class and no listener — the browser already knows when the user
has left the field invalid.

### 31. Textarea that grows with its content — Missing

> Use it for any multi-line input… `field-sizing: content` sizes the textarea to its text, so there is no
> auto-grow script and no hidden mirror element.

**Measured.** `field-sizing` occurs nowhere in the repo. On `components-textarea--default` the element
computes `field-sizing: fixed`, `resize: vertical`, height and `min-height` 92px; setting twelve lines of
text left it at 92px with `scrollHeight` 312, so the content is clipped until the user drags the corner.
`TextArea.tsx:36-38` sets `min-h-[92px]` and `resize-y`, and the comment at `TextArea.tsx:215-218` says
height is `rows`.

**Fix.** `field-sizing-content max-h-[12lh] resize-none` on `TextArea.tsx:36`, with the existing 92px
minimum as the floor. `field-sizing` is Chrome 123+, so keep `resize-y` as the fallback until the browser
floor is decided — a textarea that grows is strictly better than one that clips.

## Motion

### 32. Opt-in motion — Partial

> Put a transition that moves or scales something inside `@media (prefers-reduced-motion:
> no-preference)`, so the state still changes and only the animation is left out. Tailwind spells this
> `motion-safe:`.

**Two guards in the whole repository, read.** `Switch.tsx:83` `motion-reduce:transition-none`, and
`Radio.tsx:49` `motion-reduce:[--selection-scale:1]` — with the reasoning written at `Radio.tsx:47-48`:
under reduced motion the centre stays at full size and cross-fades, because a fade is not motion.

**Unguarded, read.** `Slider.tsx:206` `transition-[background-color,scale] duration-150 ease-pulse`,
whose `scale` is the state signal at `:211` (`hover:scale-105 data-[dragging]:scale-110 active:scale-110`);
`Accordion.tsx:81` `transition-[rotate,color]`; and every caret in `Select.tsx:96`, `ComboBox.tsx:76`,
`date.tsx:49` and `popover.ts:64`. `styles.css` has no `prefers-reduced-motion` block of its own, so the
only motion queries in the built sheet are the two the variants above produce.

**Fix.** Prefix the moving transitions with `motion-safe:` —
`motion-safe:transition-[background-color,scale]` at `Slider.tsx:206`,
`motion-safe:transition-[rotate,color]` at `Accordion.tsx:81` and the carets — and leave the
`hover:`/`data-[dragging]:` state _outside_ the query: the state must still change, only the animation
goes. `progress.ts:73` and `ComboBox.tsx:92` already use `motion-safe:animate-*`, so the spelling is
already in the house style.

### 33. Motion tokens — Partial

> Name the easing and the durations once, in tokens, and use them in every transition.

**Measured.** `styles.css:201` declares `--ease-pulse: cubic-bezier(0.4, 0, 0.2, 1)` and that is the only
motion token; the `@theme inline` block defines no `--duration-*`. Durations are literals at about forty sites —
`duration-[120ms]` ×28, `duration-[160ms]` ×6, `duration-150` ×5 and `duration-200` once
(`progress.ts:47`). `Tabs.tsx:45`'s `after:duration-[120ms]` is the one transition carrying no
`ease-pulse`, so the indicator fades on Tailwind's default curve.

**What is right, measured.** No `transition: all` anywhere; every transition names its properties; the
longest is 200ms, which is the right ceiling for this vocabulary.

**Fix, as implemented.** Three durations were declared in `:root` — `--duration-fast: 120ms`,
`--duration-base: 160ms`, `--duration-slow: 200ms` — and read through the variable form of the utility,
`duration-(--duration-fast)`. They are **not** in `@theme inline`, and that is a deliberate difference
from this finding's first wording: Tailwind has no `--duration-*` theme namespace to hang them on, so a
theme key would have produced no utility and no variable; the `var()` form is the one that works. A
component that wants a one-off can still write `duration-[220ms]`. `after:ease-pulse` was appended at
`Tabs.tsx:47`. The five `duration-150`s in
Slider, DateField, GridList and DropZone — had no recorded reason, and are now `duration-(--duration-fast)`.
That retimed five sites from 150ms to 120ms: a 30ms difference nobody can see, taken so the system has one
number instead of two, and recorded here because a silent retime is exactly the kind of change that is
invisible in a diff.

### 34. Transition a custom property with `@property` — Missing

> Use it when one state change should drive several values together, or when a script feeds a number into
> CSS and the result should ease. Register it with a syntax and an `initial-value`.

**Measured absence, and two live consequences.** No `@property` in `src`; the registrations in the built
sheet are Tailwind's own `--tw-*`.

- `Checkbox.tsx:44, 55, 64` declare and set `--selection-scale` (0.4 → 1), and nothing reads it — `MARK`
  at `Checkbox.tsx:88` reads only `opacity-(--selection-mark)` and a fixed `size-[11px]`. The "scales the
  centre" the comment at `:48` promises never happens. `Radio.tsx:62` does read
  `scale-(--selection-scale)`, so the intent is real and only the read is missing.
- `Radio.tsx:63` transitions `[opacity,transform]` while the property in use at `:62` is `scale`. The
  compiled pair is `.scale-\(--selection-scale\){scale:var(…)}` against
  `transition-property: opacity, transform` — the declared transition does not cover the property that
  animates, so the centre pops while only the fade runs.

**Fix.** `Radio.tsx:63` → `transition-[opacity,scale]`. Then either read the value in `Checkbox`'s `MARK`
or delete the three dead declarations. `@property` itself is only needed if a custom property must
interpolate — neither of these needs it once the property named is the property animated.

### 35. Shadow change that fades and does not repaint — Not applicable

> Use it on cards that lift on hover, most of all in a grid of many cards or with a large blur.

**Read.** Nothing changes a shadow on any state. The library has four shadows and all are static literals:
`popover.ts:13`, `Select.tsx:110`, `date.tsx:64`, `ComboBox.tsx:98`, all
`shadow-[0_12px_32px_rgba(0,0,0,.7)]`. `Card.tsx:14` has none, and `docs/components/card.md` records that
as the design. Nothing lifts, so the pseudo-element pair has no subject.

**Fix.** None. If a lift is ever added, use the `::before`/`::after` pair rather than transitioning
`box-shadow`, and keep the one literal shadow in `popover.ts`.

### 36. Cross-document view transitions — Not applicable

> Use it on any multi-page site to crossfade between pages.

**Measured absence, and a premise that does not hold.** `@view-transition` and `view-transition` occur
nowhere. The app is four routes (`__root`, `index`, `create`, `login`) behind TanStack Router, which
intercepts in-app navigation on the client, so `navigation: auto` would fire only on a hard load. An
in-app crossfade would be `document.startViewTransition` around the router — a different technique with a
different risk profile.

**Fix.** None for the rule as written.

### 37. Indicator that slides to the active item — Missing

> Use it for the underline on a tab row or the bar beside a side nav — one indicator that moves, rather
> than one drawn per item.

**Read.** `Tabs.tsx:44-45` draws a per-tab `::after` that fades in place, with
`data-[selected]:after:opacity-100` at `:60`; `anchor-name`, `position-anchor` and `anchor-scope` occur
nowhere. The side-nav case has no bar at all: `Nav.tsx:76` `data-[current]:text-primary` is the entire
current-item cue.

**Fix.** Keep the fade as the fallback and move the bar to the strip's own `::after`, with
`anchor-scope` on the list and `anchor-name` on the selected tab. Judgement: on a strip this dense the fade
may be the better trade, and the technique is invisible to anyone who never sees it fail. The absence is
real; the urgency is low.

## Show and hide

### 38. Enter and exit transitions from `display: none` — Missing

> Use it for dialogs, popovers and anything else toggled with display: put the open state's rule first,
> then `@starting-style`, then the `allow-discrete` transition.

**Measured.** Opening the Modal and sampling at 0, 40, 120 and 300ms gave `animation-name: none`,
`transition-duration: 0s`, `opacity: 1` and `transform: none` at _every_ sample — on the dialog, on its
`Modal` layer, on the overlay and on the body — and no entering attribute survived on any of them. The
Sheet behaves the same, and is gone by 300ms. `Popover`, `Tooltip` and `Toast` carry no transition in their
class lists either. So every floating surface in the library appears and disappears in one frame.

**React Aria is not the blocker for the exit.** `data-entering` and `data-exiting` appear 57 and 63 times
in `node_modules/react-aria-components/dist/private`; `Modal.js:119` sets `data-entering` through
`useEnterAnimation`; `Popover.d.ts` and `Modal.d.ts` document the selectors. `data-exiting` is there when
the overlay leaves, and RAC waits for whatever animation that element is running
(`react-aria/dist/private/utils/animation.mjs`) — which is what made the exit animatable.

**Its `data-entering` companion was not, in the implementation this audit produced.** Sampling a Modal at
0, 40, 120 and 300ms after opening found no `data-entering` on any element — and a MutationObserver over
the whole document, filtered to that attribute, recorded no appearance of it at all, so it is set and
taken off inside one commit. The entry was therefore written for the **mount** rather than the hook, and
measured working (a menu closed and reopened: opacity 0 → 0.65 → 1). The `@starting-style` shape this
entry's rules suggest was tried against the same surfaces and did not run either. A reader who revisits
this with a later RAC should test the hook first: the exit proves the attribute machinery works, and it is
only the entering half that is not observable here.

**And the Toast's hook does not exist.** `Toast.tsx:30-31` says "React Aria puts
`data-animation="entering" | "exiting"` on the toast for the duration of its entry and exit". RAC 1.22.1
emits no such attribute: `Toast.js` carries `data-hovered`, `data-focused` and `data-focus-visible`, and the
string `animation` does not occur in the file at all. The comment promises a hook a future reader cannot
hang anything on, and the decision recorded there ("no keyframes: which way a toast should move is a house
decision") currently has no mechanism at all.

**Fix.** One block in `styles.css` rather than one per component:

```css
[data-entering] {
  opacity: 0;
  translate: 0 0.25rem;
}
@starting-style {
  [data-entering] {
    opacity: 0;
  }
}
[data-exiting] {
  opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
  [data-entering],
  [data-exiting] {
    transition:
      opacity 160ms var(--ease-pulse),
      translate 160ms var(--ease-pulse);
  }
}
```

RAC keeps the node mounted while it exits, so `allow-discrete` is not needed for the overlays. For the
Toast, either animate the region on mount (RAC gives no hook) or correct the comment to say so — a wrong
comment is worse than a missing animation, because the next reader stops looking.

### 39. Popover anchored to its trigger — Adopted

> Use it for dropdown menus and other popovers opened by a click, so the panel is anchored to its trigger
> and flips when it does not fit.

**Read.** `Popover.tsx:86-88` renders React Aria's `Popover`, which positions against the trigger and
flips when it does not fit — the outcome the entry asks for, done by the library's JS rather than by CSS
anchor positioning. The gap between trigger and panel is its `offset` (`Tooltip.tsx:77`, `offset = 10`).
No `@supports` block is needed, because the fallback is not a centred panel the way the pure-CSS version's
would be.

**Fix.** None. The one rule still worth honouring applies to programmatically-opened popovers: pass the
trigger, or the panel has nothing to anchor to.

### 40. Accordion that animates its height — Missing

> Use it for FAQs and any other disclosure… `interpolate-size: allow-keywords` is what makes a transition
> to `auto` possible, and the padding belongs on an element inside.

**Read.** `styles.css:233` declares `interpolate-size: allow-keywords` — the prerequisite — and no height
transition consumes it: the 45 transitions in `src` are colour, opacity, rotate, scale and width.
`Accordion.tsx:96-100 PANEL` already keeps the padding on an inner element and guards it
(`[&[hidden]]:p-0`), so the entry's padding trap is handled. The open row simply snaps; only the item's
background transitions (`Accordion.tsx:52`). The component is RAC's `Disclosure` rather than `<details>`,
so `::details-content` does not apply and the technique has to be written by hand.

**Fix.** `motion-safe:transition-[height] motion-safe:duration-[160ms]` on `PANEL` with `height: 0` and
`[&:not([hidden])]:h-auto` — which is exactly what `interpolate-size` was declared for. One check first:
a height transition needs the panel in the tree, so confirm in the DOM that the closed panel is present
with `[hidden]` and not unmounted; if RAC unmounts it, the animation belongs on the `[data-entering]` block
from 38 instead.

### 41. Reveal with `clip-path` — Missing

> Use it for dropdowns, menus and panels that open over the page and whose height is not known. The
> negative inset must be larger than the shadow's blur plus its offset.

**Measured absence.** No `clip-path` in any class list — the only occurrences in `src` _describe_
`sr-only`'s clip path (`VisuallyHidden.tsx:13-18`). The shared popover surface gets a border and a shadow
and nothing else (`popover.ts:13`, `Select.tsx:110`, `ComboBox.tsx:98`, `date.tsx:64`), so a menu taller
than its trigger appears whole.

**Fix.** If a reveal is wanted, hang it on the same block as 38 —
`[data-entering] { clip-path: inset(0 -3rem 100%) }` transitioning `clip-path`, where `-3rem` (48px)
clears the shared shadow's 12px offset plus 32px blur. Taste, not correctness: the library is consistent
without it, and a moving menu is a matter of house style.

## Scroll and viewport

### 42. Carousel on native scroll — Not applicable

> Use it for any horizontal row of cards — a real scroll container, never a transform.

**Measured absence.** `scroll-snap` and `snap-*` occur zero times in `src` and zero times in the built
sheet; no implementation code calls `scrollBy` or reads `scrollLeft` (only a story does). The single
horizontal scroller is the Resizable table's wrapper, `Table.tsx:390` `w-full overflow-x-auto`.

**Fix.** None. If a card row is ever added, apply the entry's recipe to it, not to the table wrapper — a
table wrapper that snaps would be a bug.

### 43. Scroll area between a fixed header and footer — Missing

> Use it for the body of a modal, a chat list, a drawer or a sidebar. The panel needs a limit, either
> `max-block-size` or a height; with no limit nothing overflows. A header or footer with a set height
> shrinks — give it `flex: none`.

**Read.** `Modal.tsx:29` makes the _overlay_ the scroller (`fixed inset-0 … overflow-y-auto p-4`) and the
dialog (`Modal.tsx:37`) has no `max-h` at all, so a dialog taller than the viewport scrolls its own title
and its footer off the screen — the footer is at `Modal.tsx:50`, `mt-6 flex items-center justify-end gap-3`.
`Sheet.tsx:37-38` caps its layer at `max-h-[80vh]`, but `SheetContent` (`Sheet.tsx:147`) has no overflow of
its own; the only scroller in a sheet is RAC's `[data-sheet-scroll]` (`react-aria-components/dist/private/Sheet.mjs`,
`overflowY: auto`, `overscrollBehaviorY: 'contain'`, `scrollSnapType: 'y mandatory'`), which is the swipe
container, not a body between a fixed title and footer.

**Fix.** `Modal.tsx:37` → `flex max-h-[90dvh] flex-col`, with the body `min-h-0 flex-1 overflow-y-auto
overscroll-contain` and the title and footer `flex-none`; the same shape inside `Sheet.tsx:147`. This is
the one item on the list that is a bug rather than a missing technique: today a long sheet's content cannot
be reached at all.

### 44. Styles that apply only when a scroller overflows — Missing

> Use it on any row that may or may not fit — tabs, a toolbar, a table wrapper. Write
> `animation-timeline` after `animation`, because the shorthand resets the timeline.

**Measured absence.** `animation-timeline`, `scroll-timeline`, `scroll(self…)` and `mask-image` occur zero
times in `src` and are absent from the built sheet. Every named case exists here: the table wrapper
(`Table.tsx:390`), the menus (`optionList.ts:10`, `popover.ts:21`, both `max-h-[264px] overflow-auto p-0`)
and the create page's log pane (`Create.tsx:467`, `max-h-[26rem] overflow-auto`).

**Fix.** Optional and progressive: a fade mask on the table wrapper when it overflows. Firefox loses only
the fade, and nothing else changes. Worth doing on the table, where a clipped column is currently
indistinguishable from a table with nothing more to show.

### 45. Anchor targets that clear a sticky header — Not applicable

> Use it on any page with in-page links and a fixed or sticky header… Keep the offset outside the motion
> query.

**Read.** There is no sticky element (`sticky` occurs zero times in `src`). The fixed ones are the Toast
region, the Modal overlay and the Sheet overlay, none of which is a header. In-page links do exist:
`Home.tsx:207` `#top`, which resolves, and seven in `Create.tsx`.

**Found while checking, and worth a ticket:** six of Create's seven in-page links have no matching `id` in
the file — `#alerts`, `#fra1`, `#logs`, `#monitors`, `#runbook` and `#settings` — so they scroll nowhere.
That is not a good-css item; it is a bug this technique's check turned up, and it is the kind of thing a
layout audit finds and a lint rule cannot.

**Fix.** None for the technique today. When a header becomes sticky, add
`html { scroll-padding-block-start: 5rem }` outside any motion query, sharing the header's height token.

### 46. No rubber-band bounce on desktop — Missing

> Use it on app-like pages with fixed UI… Set it on `html`, because the viewport takes its overscroll
> behaviour from the root element. Give inner scroll containers `overscroll-behavior: contain`.

**Measured absence.** `overscroll` occurs zero times in `src` and is absent from the built sheet, so
nothing sets `html { overscroll-behavior-y }`. The app has fixed UI (`Toast.tsx:25`
`fixed end-4 bottom-4 z-50`, and the modal and sheet overlays) that a trackpad stretch drags with the page.
RAC sets `overscrollBehaviorY: 'contain'` on its own sheet scroller, which covers one case; on the home
page the only scroll container measured besides that is the devtools panel.

**Fix.** `:root { overscroll-behavior-y: none }` with a coarse-pointer escape
(`@media (any-pointer: coarse) { :root { overscroll-behavior-y: auto } }`, since pull-to-refresh on a phone
is a real gesture), plus `overscroll-contain` on the table wrapper and the option lists. Use the `-y`
longhand: `none` on both axes disables swipe-back.

### 47. Content clear of the notch — Missing

> Use it on fixed headers, bottom bars, toasts and sheets in anything that should feel like an app on a
> phone. Without `viewport-fit=cover` every inset is `0px` and the padding does nothing.

**Measured.** `__root.tsx:20-23` sets the viewport meta to `width=device-width, initial-scale=1` with no
`viewport-fit=cover`; `safe-area-inset` and `viewport-fit` occur zero times in `src` and are absent from the
built sheet. The toast region computes `bottom: 16px` and `padding-bottom: 0px` — measured on the running
app — and the sheet's bottom edge is the other surface pinned to the edge of the screen.

**Fix.** Add `viewport-fit=cover` to the meta, then
`padding-block-end: calc(1rem + env(safe-area-inset-bottom, 0px))` on the toast region (`Toast.tsx:25`) and
the sheet's bottom edge. The `0px` fallback is not optional: inside a `calc()` an unsupported `env()`
invalidates the whole declaration.

## Deliberate deviations, recorded

These are argued in the source and are not defects. They are listed so that a later reader — or a later
agent holding the same checklist — does not "fix" them by mistake:

- **A field's focus is its border, not a ring** (`field.ts:92-98`): the border is the edge the control
  repeats, and a 3px-offset ring would draw two parallel teal hairlines with a gap. The rule is still
  broken to the letter (`outline: none` is written, and forced-colors cannot repaint it), which is why it
  is in finding 24 rather than here.
- **An option's focus is a background wash** (`optionList.ts:12-19`): hover and keyboard focus land on the
  same treatment on purpose, a menu being walked by arrow keys as much as by pointer. Measured at about
  1.2:1, which is the part worth revisiting.
- **A date segment's focus is the same wash, fainter** (`date.tsx:97-101`), for the same reason.
- **Table rows use native `:hover`, not `data-[hovered]`** (`Table.tsx:71-74`): RAC wires its attribute to
  pointer _enter_, so a pointer over a cell would not shade its row. The native pseudo-class is
  media-gated by Tailwind's `hover:` variant, so the entry's rule still holds.
- **The scrim and the one shadow are literal** (`Modal.tsx:20-27`, `popover.ts:8-9`): a scrim must darken in
  both themes and no token does; a token-derived shadow hazes.
- **Pulse is dark-first** (`styles.css:243-248`): dark is the default, `data-theme="system"` opts into the
  OS setting, and the `color-scheme` meta says `dark`.
- **The corner is a token set to 0** (`styles.css:126-133`): the sheet squares its controls, and the radius
  scale exists so a theme can move every corner at once.
- **No toast keyframes** (`Toast.tsx:30-33`): which way a toast moves is a house decision — but see
  finding 38, where the hook that comment relies on turns out not to exist in RAC 1.22.1.
- **Tabs writes physical block edges for its vertical indicator** (`Tabs.tsx:50-53`): the strip's rule owns
  `bottom`, and a logical `inset-block` would fight it for the same edge.

## Appendix — reproducing the numbers

Every measurement above can be re-taken with a browser and the file:line it cites. What was done, so the
next round can be cheaper:

- **CSS inventory.** Enumerate every rule in `document.styleSheets` at runtime and count declarations
  (`transition-duration`, `prefers-reduced-motion`, `tabular-nums`, `overflow: clip`, `hover: hover`,
  `@keyframes`). This is how 25, 32 and 33 were confirmed, and how the absences in 11, 14, 22, 41, 44, 46
  and 47 were established as absences rather than as things a grep could not spell.
- **Focus.** Press Tab and read `getComputedStyle(document.activeElement)`'s outline properties; then
  focus a known element and read them again. The failure signature in 24 is `outline-style: none` with a
  non-zero width and a coloured value — the ring is configured and forbidden in the same class list.
- **Motion.** `emulateMedia({ reducedMotion: 'reduce' })`, then compare the set of elements with a non-zero
  transition duration or a running animation against the same set at `no-preference`, scoped to
  `#storybook-root` so Storybook's own UI does not count.
- **Overlays.** Open the surface, then sample computed animation, transition, opacity and transform at 0,
  40, 120 and 300ms, plus every `data-*` attribute up the ancestor chain. The entering hook is visible for
  a frame, so a single late sample reads as "no hook at all" — which is how this finding almost went the
  other way.
- **Targets.** `getBoundingClientRect()` on the control, plus
  `getComputedStyle(el, '::before').content` to see whether an expansion exists.
- **Built sheet.** `dist/client/assets/styles-*.css`. Remember that Tailwind escapes class names: the rule
  is `.duration-\[160ms\]`, so a grep for `duration-[160ms]` returns zero and looks exactly like a
  missing feature. Grep for the declaration (`transition-duration`) instead.
- **Packages.** `react-aria-components` 1.22.1 and `react-aria` 3.53.1 as installed. The animation hooks
  live in `dist/private` and in `react-aria/dist/private/utils/animation.mjs`; the `Toast` component emits
  no animation attribute at all, which is the difference between finding 38 being a missing rule and a
  missing hook.

## Sources

- The whole list: [good-css index](https://good-css.com/index.md) · [llms.txt](https://good-css.com/llms.txt)
- The skill and its references: [SKILL.md](https://good-css.com/skills/good-css/SKILL.md) and the eight
  files under https://good-css.com/skills/good-css/references/ — `foundations`, `layout`,
  `spacing-and-shape`, `text-and-media`, `interaction`, `motion`, `show-and-hide`, `scroll-and-viewport`.
- Specimens for anything that needs to be seen running: https://good-css.com/specimen/<name>.
