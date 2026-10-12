# Create

Something like [shadcn's `/create`](https://ui.shadcn.com/create), for this design system: a page
that builds a theme, shows the real components wearing it, and hands back the token block that
would make it permanent.

- **The page** — `src/examples/Create.tsx`, served by `src/routes/create.tsx` at `/create`.
- **The engine** — `src/examples/createTheme.ts`: the rules the stylesheet follows, and the block
  they produce.
- **The tests** — `src/examples/Create.browser.test.tsx`, eleven of them, in Vitest's browser mode,
  because a claim about a computed colour or a corner is only a claim a real browser can settle.

It is an example rather than a component, like `Login`: it shows the library being used, it is
published in no registry item, and it has no story — a story is what puts a component into the
manifest the MCP tools serve, and this page is not part of the library's API.

## The four questions

shadcn asks for a component library, icons, a base colour, a theme, fonts and a radius. Two of those
have no answer here, and the page says why instead of offering a control that moves nothing:

| shadcn asks       | here                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Component library | React Aria, already: there is one, and it is the reason the components behave as they do.          |
| Icons             | Not a token. Nothing in the library renders an icon of its own beyond the handful it draws inline. |
| **Base colour**   | A neutral ramp: four surfaces, and a tint on the panels.                                           |
| **Theme**         | The accent hue. Everything else that carries it is a reference to it.                              |
| **Radius**        | The base of the corner scale: a control is `rounded-md` (0.8 of it), a surface `rounded-xl` (1.4). |
| **Fonts**         | The one monospace family the whole system is set in.                                               |

A theme is therefore `{ base, hue, radius, font, mode }`, and `mode` is not a token: it is the
`color-scheme` the page is shown under, because that is what switching a theme means here.

**The radius control exists because the components were changed to make it mean something.** Pulse's
own `--radius` is `0` — the sheet squares its buttons and inputs, and that is still what the library
looks like by default — but the recipes now read the scale rather than saying `rounded-none`, so one
number moves every corner at once: buttons, fields, selects, chips, calendars, cards, popovers, menus,
dialogs, toasts and grid items. That is what makes the page useful to a _different_ design system,
which is the point of the control. Some corners stay literal on purpose — the checkbox's 2px, the
radio's circle, the switch's pill, the table's collapsed grid, the edge-anchored sheet, and the
slider's grip — and the page lists them rather than pretending it can reach them. See
[theming.md](./theming.md#radius).

## The showcase, one card per area

The preview is not one screen. A design system is read one control at a time — that is what its docs
pages are — and a single dense screen proves only that the parts coexist, so the preview is a card per
area, each holding the real components doing their own job:

| Card              | What it shows                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Actions           | five button variants, five meanings, a toolbar of toggles, a segmented control                   |
| Fields            | `TextField`, `TextArea`, `SearchField`, `NumberField`, `TokenField` — one anatomy, five controls |
| Choices           | a checkbox group, a radio group, a switch, a slider                                              |
| Colour            | `ColorField`, `ColorSwatchPicker`, and the palette as swatches                                   |
| Pickers           | `Select` with its filter scope, `ComboBox`, `ListBox`                                            |
| Dates and times   | `DateField`, `TimeField`, `DatePicker`                                                           |
| Calendar / Ranges | a month on the page, and two months as one range with the field that feeds it                    |
| Overlays          | `Popover` with its arrow, `Modal`, `Sheet`, `Menu`, `Tooltip`                                    |
| Data              | the hairline row stack, with a sparkline inside a cell                                           |
| Grid / Tree       | selectable cards, and a hierarchy that expands in place                                          |
| Navigation        | a tab row over its panel, and `Nav` as the sidebar                                               |
| Feedback          | `ProgressBar`, a toned `Meter`, and a toast wired to a button                                    |
| Charts            | `Sparkline`, `FlatLine`, `BarChart`                                                              |
| Map               | `DotMap`, six hundred dots and one accent                                                        |
| Content           | `Accordion`, the avatars beside it, and all five hairline strengths                              |
| Form              | a real form: two fields, a legend, actions                                                       |
| Files             | `DropZone` with the file picker a keyboard needs                                                 |
| Type / Tokens     | the type scale, and the fills and hairlines as the theme resolves them                           |

That is fifty of the library's fifty-four components rendering at once, which is also the cheapest way
to see a theme: twenty corners, eight fills and five hairlines in one view.

**The locale is pinned to `en-GB` around the preview**, and that is a hydration fix rather than a
preference — see the calendar note below. The sheet's own `09:30` is a 24-hour clock anyway.

## The rules, because a table of hexes would be a different page

The point of asking three questions is that the stylesheet already answers the rest, so this is
arithmetic over sRGB gamut rather than a palette:

- **Light column** — `L 55%`, with the largest chroma sRGB can hold at that hue and lightness,
  less 2%. The sheet does the same: its teal is 0.0931 against a 0.0952 ceiling, its yellow 0.1103
  against 0.1125.
- **Dark column** — the shared chroma, `0.1236`, at the highest lightness at or below 92% that still
  holds it. Teal peaks at 91.98% and stays there; red cannot hold it above 78.5% and is deepened until
  it can, which is exactly the sheet's own account of why danger is not luminous.

Measured against the stylesheet, the derivation lands on `oklch(55% 0.0933 189.5)` and
`oklch(91.95% 0.1236 189.5)` where the sheet records `0.0931` and `91.98%` — two ten-thousandths of
chroma and three hundredths of a percent of lightness. The test asserts that agreement, and it also
sweeps the whole hue circle asserting what the two rules exist for: white clears 4.5:1 on every light
fill, black clears 7:1 on every dark one.

**The dark rule is a scan, not a bisection**, and that is a measurement. The largest chroma sRGB can
hold at a fixed hue peaks and falls away on both sides rather than decreasing monotonically, so the
answer is the top of a band. For teal the peak sits _at_ the target — 0.123259 at L 92%, 0.123611 at
L 91.98% — so a bisection that started by testing 92% would conclude the hue cannot hold the chroma
at all and walk the wrong way.

## Why the theme is applied at `:root` and not on the preview

Everything in this library paints through `var(--color-*)`: `Button`'s colour table is
`[--btn:var(--color-primary)]`, and 80 such references exist across the components. `--color-primary`
is declared on `:root`, where its own `var(--primary)` is substituted there and then inherited as a
computed value. A preview element that sets `--primary` therefore retints every utility compiled from
`@theme inline` — which does read the variable on the element — and leaves every button teal.

The page applies the generated block on `:root` instead, as a consumer pastes it, and the whole page
wears it. It is also what shadcn's own create page does. The alias table is never retyped here, which
is the property that keeps it from going stale.

## What building this found

Six things, and all six are fixed in the library rather than worked around in the page. The last
three were found by _rendering_ fifty components rather than reading about them, which is the
argument for a page like this one:

1. **`--font-mono` was inert.** `@theme inline` writes a theme entry's value straight into the utility,
   and for a colour that value is a `var()` that still reads the element — but for the font it was the
   family itself, so `.font-mono` carried `'Overpass Mono', …` as a literal and no token could change it,
   in this repo or in a consumer's. The family is now `:root`'s `--type-mono`, and the theme block maps
   `--font-mono` to it. See [theming.md](./theming.md).
2. **`Breadcrumbs` hid the page you are on.** The item carried `data-[disabled]:hidden`, and React
   Aria marks the _current_ crumb `data-disabled` as well as `data-current` — so the last step of every
   trail in this repo was invisible, the landing page's included. The `Current` story asserted the
   step's `aria-current`, its colour and that it is not a link, and never that it could be seen, which
   is why it passed. Found by putting a breadcrumb on a new page and looking at it. See
   [breadcrumbs.md](./components/breadcrumbs.md).
3. **`Select.Search` did not exist.** Four doc comments in `Select.tsx` named it, and the story's
   curated snippet — the example a consumer copies — wrote `<Select.Search />`. The search strip belongs
   to `Select.AutoComplete`, which draws it itself. Nothing checked, because a snippet is text: the first
   page that rendered one threw on the spot. See [select.md](./components/select.md).
4. **`BarChart` dropped its `className`.** The `<svg>` carried a hardcoded `block` instead of composing
   the prop, so a chart asked for `w-full` inside a card rendered at its own 720px and ran off the edge of
   it — the same "accepted and ignored" defect the `Sparkline` size had. `Sparkline` and `FlatLine` compose
   theirs, which is what made the odd one visible. A `Stretch` story now says so.
5. **A two-month calendar would not hydrate.** `Intl#formatRange` puts the range separator's spaces in the
   hands of the runtime's ICU, and Node's is not Chrome's: measured, `en-GB` came out as
   `March<U+2009>–<U+2009>April 2024` on the server and `March<U+0020>–<U+0020>April 2024` in the browser.
   The caption is now composed in `date.tsx` — this component's typography — which removed the text
   mismatch. React Aria's own accessible name for the grid is still a `formatRange` string, so one
   **attribute** mismatch remains on an SSR'd two-month calendar: an `aria-label`, invisible, and
   unpatchable by React. It is recorded in [rangecalendar.md](./components/rangecalendar.md) rather than
   hidden.
6. **A `Tag` chip with no `textValue` warns**, in the library's own stories as well as here
   (`A textValue prop is required for <Tag> elements with non-plain text children`). It is not this
   page's doing — the component passes React Aria a render-prop child — and it is still open. Nothing
   renders wrongly; the accessible name is the text, and the warning is noise on every chip that is not
   a link.

## Verifying

```sh
npx vp test --project components src/examples/Create.browser.test.tsx
npm run dev            # then open /create
```

The claims the eleven tests hold to, in order: the derivation reproduces the sheet; the default theme
_is_ the sheet token for token; a swatch is painted the colour the token names (the dark accent comes
back as `rgb(113, 255, 246)`, the sheet's `#71FFF6`); the page wears the block it offers to copy, at
the root; choosing an accent repaints the components; a typeface reaches the utilities; the sheet's own
family is what the default asks for; **a radius reaches a control at 0.8 and a surface at 1.4, and 0 is
square everywhere**; the copy button copies the block on screen; and a theme is a link that survives
being half-typed.

```sh
npx vp test --project components src/examples/Create.browser.test.tsx   # 11
npx vp test --project storybook src/components/Button.stories.tsx      # the same mechanism, one node down
```
