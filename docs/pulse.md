# Pulse

The landing page: the page that argues for this library, rather than indexing it.

- **The page** — `src/examples/Pulse.tsx`, served by `src/routes/index.tsx` at `/`.
- **Its own stylesheet** — `src/examples/pulse.css`: the shapes, the tints, the entrance and the one
  scaled control. Nothing else in the page is raw CSS.
- **The pictures** — `public/pulse/`: screenshots of this app's own pages, taken from a running
  build, plus one clip of the canvas driven by its own camera.
- **The tests** — `src/examples/Pulse.browser.test.tsx`, four of them, in Vitest's browser mode. They
  hold the page to the four claims it is built on: the theme attribute lands on the page's own root and
  on nothing above it, the token table carries both readings, the accordion keeps exactly one layer
  open, and the install command is composed from the field and the choice rather than written twice.

**It replaced a page rather than joining one.** The old landing page was the library's index: every
component, doing its actual job, and the proof that they render through the server. It was a good
inventory and a poor argument — fifty-eight components in a grid say nothing about whether any of them
is worth installing — so it was removed, and the reference it carried is the documentation, which is a
page per component with its props, its stories and its decisions. A design system's own site has two
jobs and they are not the same one: this page is the case for using the thing; the docs are the manual.

The page is a page of claims, each with its evidence beside it — no section without a claim, and no
claim without something on the page that shows it.

## The direction, and what was drawn

Built to a direction dealt by the `design-taste-frontend` skill (one motif, seed 1812102663), with the
palette and the typeface kept from the brand: it may not invent a colour or a face, and it does not.
Every value on the page resolves from `src/styles.css`.

**The motif is a bar, and it comes from the subject.** Pulse's own chart mark — the replica's histogram
bar, the one mark in this system that is a measured value rather than a surface that carries text,
which is what its comment beside `--chart-1` in `src/styles.css` says — runs the page at four scales:
the hero stage (a bar the height of the screen's lower half, running off the right edge), the tab cut
out of every folder band and index card, the shape of the primary button, and the footer's five
letters. It is the right motif for a page whose whole argument is measurement.

**The one live thing is the theme.** `ToggleButtonGroup`, scaled to fill the second screen with five
layers of the real component — the transform keeps its 1px boundary, its shared dividers and its 13px
labels in proportion, because it is the component and not a drawing of one. Choosing a segment sets
`data-theme` on **this page's own root**, so the whole page below it flips, nothing is redeclared, and
nothing outside the page is touched. It is the same claim the sheet makes in one line: a token is a
`light-dark()` pair, and a theme is an attribute.

Two adjustments to the drawn sheet, both recorded: the section blueprints' sticky folder stack is kept,
and the direction's "shutter" move is on the hero stage rather than the hero image, because the hero's
image is a real interface fragment rather than a photograph.

## The pictures, and where they came from

Every picture is a screenshot of this repository's own pages, taken with Playwright's Chromium from
a running dev server at 1600×1000: `board`, `board` in the light theme, `dashboard-email`, `create`,
`login`, `canvas`, and Storybook's Accordion docs page. The clip is the canvas with the page's own
camera driven through its own wheel gestures — wheel pans, ctrl+wheel zooms — recorded and encoded as
H.264. There is no stock photograph anywhere on the page, and nothing stands in for the product.

Two things worth knowing before replacing them:

- `playwright-core/driver/…/ffmpeg` as shipped by ms-playwright is a stripped build with libvpx and the
  webm muxer only: it fails on `-movflags`. Use a full ffmpeg for H.264 in an MP4.
- The canvas page's default camera is a fit of a 10,880 × 13,123 px plane, which renders at a scale of
  0.05 and photographs as a smear. The captured still uses the page's own stored camera.

## What the measuring and the looking changed

Three things were wrong in the first build, and two of them the meter found while the third only a
picture did:

- **The folder bands' names were buried.** The names sat in the band's body, and a sticky band covers the
  one above it: `inspect.mjs` failed the page with "Large text lies under another element" for three of
  the five. The name now lives in the tab, which is the strip the next band never reaches — which is also
  what a folder does.
- **The accordion showed one panel and no stages.** The open panel's `flex-basis: auto` based it on its
  own content, which is wider than the row, so there was no free space for the four panels at
  `basis: 0` to grow into and they collapsed to nothing. Measured in the browser as four panels of width
  `0px` at the row's right edge. Every panel now has its basis pinned, and the five stages are 5.8 : 1 : 1
  : 1 : 1 of the row.
- **The phone gave its first screen away.** The header wrapped to three rows — wordmark, links, then the
  action alone on the third — so the headline started a quarter of the way down. The links now take a
  row of their own below the wordmark and the action, and the hero's interface fragment keeps its true
  620px width and is cropped by the stage instead of wrapping a token name over three lines.

## The numbers on the page

They are all the repository's own, and nothing is invented: there are no customers to quote and no
logos to borrow, which is why the proof section is measurements instead. 58 components and 332
published props are counted in `AGENTS.md`; 60 registry items is `registry.json`; 4.5:1, 3:1 and the
45% control boundary are the contrast measurements the token sheet records; `0`, `120ms`, `160ms` and
`200ms` are the values themselves.

**Two things on the page are quotations rather than derivations, and both need a reader's eye when the
sheet moves:**

- The token table on the first screen quotes five values from `:root` verbatim. A browser cannot be asked
  for a token's two columns — `getComputedStyle` resolves the theme in force and discards the other
  one — so the values are written out, and `src/styles.css` remains the source of truth.
- The folder bands' descriptions summarise what each example page does, in the README's words.
