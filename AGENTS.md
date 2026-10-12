# AGENTS.md

## Project

TanStack Start (React 19, Vite 8, Tailwind CSS v4, TypeScript) app that hosts this
project's design system. Storybook 10 uses the `@storybook/tanstack-react` framework.

The toolchain is **Vite+** — one `vp` CLI over Vite, Vitest, Oxlint and Oxfmt, all of it
configured in `vite.config.ts`. ESLint and Prettier are gone; their rules live in the `lint`
and `fmt` blocks there, and the one rule that was ours is a plugin in `lint-rules/`. See
[Local lint rules](#local-lint-rules). `vite` is an alias for Vite+'s core, so the app builds
on Rolldown through the same Vite config.

- `npm run dev` — app on http://localhost:3000
- `npm run storybook` — Storybook on http://localhost:6006
- `npm test` — run every story as a test (Playwright/Chromium)
- `npm run lint` — Oxlint
- `npm run check` — Oxfmt, Oxlint and a type check in one pass
- `npx tsc --noEmit` — `tsc` itself, for the type questions tsgolint should not be trusted with

The Storybook dev server must be running before the MCP server below is reachable.

## Storybook MCP

When working on UI components, always use the `design-system-sb-mcp` MCP tools to access
Storybook's component and documentation knowledge before answering or taking any action.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a
  component from a design system (including common-sounding ones like `shadow`, etc.),
  you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `docs-list` to get a list of documented components
- Query `docs-show` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or
  common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for
  creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `test-run`.

Remember: A story name might not reflect the property name correctly, so always verify
properties through documentation or example stories before using them.

The server is registered for project scope in `.mcp.json` (Claude Code), `opencode.json`,
`.vscode/mcp.json`, and `.cursor/mcp.json`. To add another client:

```sh
npx mcp-add --name "design-system-sb-mcp" --type http --url "http://localhost:6006/mcp" --scope project
```

**Restart the dev server after adding or deleting a component or story file.** Tailwind's Vite
plugin does not reliably add a _newly created_ source file to its scan, and Storybook keeps
serving a deleted story from its index. Either way `npm run build` produces the correct CSS while
the running server does not, so tests fail against class names that are perfectly valid — which
reads exactly like a styling bug and is not one. If a new utility seems not to apply, check
`[...document.querySelectorAll('style')].map(s => s.textContent).join('')` for the class before
changing any code, and restart before believing the result.

The same applies in the other direction: `npm test` right after
`storybook dev` starts can race its first build.

## Stories

- Components live in `src/components/` with their story colocated as `src/components/Foo.stories.tsx`.
- **Examples and page bodies are not components, and do not get stories.** `src/examples/` holds pages
  that exist to show the components being _used_ — `Login` and the theme builder, `Create` — and each
  is tested by a `Foo.browser.test.tsx` under the `components` project instead. A story is what carries the docs page
  and what puts a component into the manifest this repo's MCP tools serve, so a story for an example
  would publish a page as part of the library's API. `Home` predates the rule and keeps its story,
  because that story is the app's own SSR-and-CSS check.
- Do **not** export components from files under `src/routes/`. TanStack Router cannot
  code-split route files with extra exports, and Storybook's components manifest cannot
  resolve a component that is not imported from a non-route module. Keep route files thin
  and import the page body from a non-route module — `src/components/` for a library component,
  `src/examples/` for an example page.
- The components manifest is enabled in `.storybook/main.ts` (`features.componentsManifest`),
  which is what makes the `docs-*` tools return anything. If `docs-list` loses an entry,
  check `http://localhost:6006/manifests/components.json` for a per-component `error`.
- `.storybook/preview.tsx` imports `src/styles.css` so stories get the app's real global
  styles (including Tailwind). Add shared decorators/providers there, not per-story.
- TanStack Router ignores any colocated `*.stories.tsx` under `src/routes` via
  `routeFileIgnorePattern` in `tsr.config.json`.

## Testing

Stories are the tests — each `play` function runs in a real browser through the Storybook
test-runner. React Aria's own [testing guidance](https://react-aria.adobe.com/testing) applies
directly, and three of its rules have already caught mistakes here:

- **Query by semantics, not structure.** `getByRole` on the role the ARIA pattern gives, never a
  class or a DOM path. For a portalled surface — a menu, a popover — the query has to come from
  `screen`, because `canvas` only sees `#storybook-root` and the node is not inside it.
  **Getting this wrong is silent in one direction:** `expect(canvas.queryByRole('listbox')).not
  .toBeInTheDocument()` passes whether or not the menu is open, so it quietly asserts nothing.
  Two of those sat in the Select stories until a `toBeInTheDocument` next to them failed.
- **Simulate interactions with `user-event`, never by putting state on the element.** A click is
  a pointer sequence, and the component derives its own state from it. The Hover stories used to
  force `data-hovered` by hand, which asserted that the _styles_ work while skipping the part
  that produces the attribute — the tests passed and the behaviour was untested.
  `await userEvent.hover(el)` reaches the real path, and asserting `data-hovered` afterwards is
  what proves it.
- **That state lands on the next commit, so wait for it — and establish rest rather than assuming
  it.** `userEvent.hover` fires the pointer sequence; the `data-hovered` React Aria derives from it,
  and the colour that follows, arrive with a re-render. Read on the very next line, the assertion
  races that commit and loses on a slower runner, where the attribute is simply absent. CI failed
  five times on exactly this, in a different file each time — `Checkbox`, `Nav`, `Radio`, `Select`
  and `Switch` each asserted `data-hovered` with no `waitFor` anywhere in the file. So wait for the
  state; and where an earlier story in the same page may have left the pointer on the element, clear
  it with `userEvent.unhover` first, or the reading you call "rest" is the hovered colour — which is
  how `Nav`'s hover story and `Breadcrumbs`' current step each failed once.

Two more worth knowing before reaching for them:

- **With fake timers, advance them after interactions.** The symptom is a query failing with
  `Unable to find an accessible element with the role "listbox"` — which reads like a missing
  component and is a pending timer.
- **`@react-aria/test-utils` drives the patterns, and it is adopted here.** `new User({ interactionType })`
  then `createTester('Table' | 'Tabs' | 'RadioGroup' | 'CheckboxGroup' | 'Select' | 'ComboBox' | 'Menu' |
  'ListBox' | 'GridList' | 'Tree' | 'Dialog', { root })` returns a tester that knows which element is
  which and how a press, a key or a long press reaches React Aria, and answers in the pattern's own
  terms — `getSelectedRows()`, `getSelectedTab()`, `getActiveTabpanel()`, `getSelectedRadio()`,
  `getSelectedCheckboxes()`. It is used where the _pattern_ is the subject rather than one control's
  state: `Table`'s selection, `Tabs`'s click, `Radio`'s exclusivity and `Checkbox`'s group. Three
  things to know before reaching for it. `indexOrText` is matched **exactly**, so a tab whose label
  carries a count badge is targeted by index and the assertion is what confirms which one that index
  meant. The tester needs the story's **root element** (`canvasElement`), not `canvas`, because it
  queries the document rather than the root. And the package brings its own requirements —
  `@testing-library/dom@10` and `@testing-library/user-event@14`, both direct devDependencies here
  rather than whatever Storybook happens to hoist. A story about one control's own state still asks
  the DOM directly; the tester is for when the pattern is the point.

## SEO

The site describes itself in one place, `src/seo.ts`. **Every route returns `pageHead()`, and the root
route deliberately does not** — it carries only what is identical on every page (charset, viewport,
`theme-color`, the stylesheet, the icons). That is not tidiness; it is the one thing here that measured
wrong. TanStack Router dedupes `meta` across the matched routes but **appends** `links`, so a canonical
on the root renders _beside_ a page's own: the sign-in page shipped with two, pointing at different
addresses, which tells a search engine that the page is a copy of the landing page. It was invisible in
the source and plain in `dist/client/login/index.html`.

- `npm run icons` regenerates `public/favicon.svg`, `public/apple-touch-icon.png` and `public/og.png`
  from the tokens in `src/styles.css` — no colour is hand-written for them. A favicon is read by
  unfurlers, feed readers and older engines as well as browsers, so the generator converts oklch to hex
  rather than shipping `fill="oklch(…)"` to something entitled not to understand it. The conversion is
  checked against the values this file's own token table records: `#0D1015` and `#71FFF6`.
- `npm run seo` checks a **built** site in the deploy's shape (`DEPLOY_BASE`): one title, description,
  canonical and `og:url` per page; canonicals absolute, unique, and pointing at the address the page is
  actually served at; the sitemap and the prerendered pages agreeing in _both_ directions; and `og.png`
  being the size its tags claim. CI runs it in a second, deploy-shaped build (after the artefact is
  uploaded, so the artefact stays the SSR-shaped one); Pages runs it on the build that goes out, so a
  broken head fails the deploy rather than replacing a working site with a worse one.
- `public/robots.txt` and `public/sitemap.xml` are **hand-kept**, and say so in the file: a crawler
  fetches them before it has anything that could generate them. Adding a route means adding it to both
  — `npm run seo` fails if they disagree with what is actually served.
- `.storybook/manager-head.html` is the same treatment for the docs, which are a real page of this site:
  static description, canonical, card and `theme-color`. **No `<title>` there** — Storybook renders its
  own from the config directory's name before that file is injected, so a second title is one that a
  browser and a crawler both ignore.

## Design tokens

The system is **Pulse** — a dark monitoring design language replicated in
`../pulse-replica/`. Its tokens are the single source of truth and live in `src/styles.css`,
in shadcn's shape: the values sit in `:root` and one `@theme inline` block turns them into
utilities, so never hardcode a hex value or write raw CSS in a component:

Colours are written in `oklch()` and every related value is derived with
`color-mix(in oklch, …)`. Never add a second hex or an `rgba()` for a hover, tint or
translucent version — one base value must drive its whole family.

Each token holds **both themes**, as `light-dark(light, dark)`. There is no second variable
block under a media query or a `.dark` class:

| Token                | Utility                     | Light                 | Dark (the sheet)          |
| -------------------- | --------------------------- | --------------------- | ------------------------- |
| `--background`       | `bg-background`             | `oklch(100% 0 none)`  | `oklch(0% 0 none)`        |
| `--card`             | `bg-card`                   | `#F7F7F7`             | `#0D1015` black-tint1     |
| `--muted`            | `bg-muted`                  | `#EDEDED`             | `#191C20` black-tint2     |
| `--primary`          | `bg-primary` `text-primary` | `oklch(55% 0.0931 …)` | `#71FFF6` action-teal     |
| `--warning`          | `bg-warning`                | `oklch(55% 0.1103 …)` | `#FAD14F` selected-yellow |
| `--success`          | `bg-success`                | `oklch(55% 0.1236 …)` | `#B0FBB1` success         |
| `--destructive`      | `bg-destructive`            | `oklch(55% 0.1236 …)` | `#FF9A8B` danger          |
| `--secondary`        | `bg-secondary`              | `oklch(52% 0 none)`   | `#BFBFBF` the sheet grey  |
| `--ink`              | `text-ink`                  | `oklch(100% 0 none)`  | `oklch(0% 0 none)`        |
| `--foreground`       | `text-foreground`           | `oklch(18% 0 none)`   | `oklch(100% 0 none)`      |
| `--muted-foreground` | `text-muted-foreground`     | 70% of `--foreground` | same rule                 |
| `--border`           | `border-border`             | `--foreground` at 62% | same rule                 |
| `--input`            | `border-input`              | `--foreground` at 45% | same rule                 |
| `--font-mono`        | `font-mono`                 | Overpass Mono         | Overpass Mono             |
| `--ease-pulse`       | `ease-pulse`                | 160ms cubic-bezier    | same                      |

The alphas need no per-theme tuning: an alpha over a dark page and over a light page both
land on a mid grey, so they derive from `--foreground` and follow it.

`--border-strong` (40%) and `--border-soft` (30%) are the two other hairline strengths.

**The names are shadcn's**, so a component copied out of shadcn/ui speaks this library's vocabulary.
Three tokens have no shadcn equivalent and are extensions: `--ink`, because a fill's label colour
follows a fill chosen at runtime, and the two extra borders. There is deliberately no `.dark` block
of values. See [theming.md](./docs/theming.md).

### What the light theme had to solve

The sheet is dark-only, so the light column is an invention, derived from two constraints: a
fill must read against a white page, and white label text on it needs 4.5:1. That fixes every
accent at **L 55%**, and each hue is then as saturated as sRGB allows — which inverts which
hue is limited. In dark, red is the constraint: chroma caps at `0.041` at L 92%, which would
render `#FFDBD7`, an off-white, so red sits at L 78.5%. In light it is **teal** that caps
first, at `0.093` against red's `0.226`. So the four share a chroma in dark and do not in
light; each is simply at its own ceiling.

### Dark and light

```
:root                 { color-scheme: dark }   /* Pulse is dark-first */
[data-theme="dark"]   { color-scheme: dark }
[data-theme="light"]  { color-scheme: light }
[data-theme="system"] { color-scheme: light dark }
```

**Switch themes by setting `color-scheme`, never by redefining a token.** `light-dark()`
resolves per element, so a subtree with its own `color-scheme` flips on its own.

Dark is the default rather than the OS setting, because the design language has no light mode
of its own; `data-theme="system"` opts into tracking the OS. In Storybook the **Theme**
toolbar switches it, and `.storybook/preview.tsx` disables the backgrounds addon so the canvas
takes `--background` from our stylesheet and flips with everything else.

**The docs canvas needs its background set too.** `.docs-story` is transparent, so each story
block on a docs page otherwise lands on Storybook's own light background while our tokens
resolve to this system's dark theme — white text on near-white, so every label in the docs
renders invisible while the same story on its own page looks perfectly correct.
`.storybook/preview-head.html` paints `.docs-story` with `var(--background)`, which keeps it
tied to the token so the Theme toolbar still flips it. Do it there rather than by re-enabling
the backgrounds addon, which would pin a fixed colour again.

`src/routes/__root.tsx` carries `<meta name="color-scheme" content="dark">` so the browser
paints the canvas correctly before the stylesheet loads and a dark page never flashes white.
Add `light` to that list the day the app gains a persisted preference.

House rules that the source sheet enforces and components must preserve:

- **A corner is a token, and Pulse sets it to `0`.** The sheet squares its buttons and inputs, but the
  components read the radius scale rather than squaring themselves off: a control is `rounded-md`
  (0.8 of the base) and a surface `rounded-xl` (1.4 of it). One value moves every corner, `/create`
  dials it, and at `0` nothing looks different from the sheet. The checkbox's `2px`, the radio's
  circle, the switch's pill, the table's collapsed grid, the edge-anchored sheet and the slider's grip
  stay literal. See [theming.md](./docs/theming.md#radius).
- **Uppercase, letterspaced mono labels** — `uppercase tracking-[0.04em]`.
- **A fill carries `ink`, and `ink` inverts with the fills** — black on the luminous
  dark-theme accents, white on the deep light-theme ones. Never hardcode either.
- **Disabled is a state, not a variant**: it dims the control to 30% opacity and leaves its
  colour alone. Flattening every fill to one grey threw away the colour that says what the
  button does — a disabled danger button should still read as danger.

### Loading (`isPending`)

The content keeps its box but stops being painted, and a spinner is centred over it, so the
button does not resize or shift its row when the action starts. RAC supplies the rest: no
native `disabled`, so it stays focusable, presses are blocked, and the state is announced.

Two hiding mechanisms, because they are **not** interchangeable:

| Content             | Mechanism            | Why                                                                                                                               |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Text (bare or slot) | `text-transparent`   | `visibility` would drop it from the accessibility tree — and while loading the label is usually the button's only accessible name |
| Decorative icon     | `visibility: hidden` | carries no text, so no name is lost, and its box still holds the width                                                            |

A bare text child can only be reached by the colour route; no `> *` rule matches a text node.
The spinner then repaints itself in `--btn-fg`, the colour the label would have had, because
the button's own colour is transparent while loading. That differs per variant — ink on a
filled button, the accent on one whose fill is the page — and hardcoding `ink` there paints a
black spinner on the black page for `outline`, `ghost` and `text`.

Slots are addressable by `data-slot`: `icon`, `text`, and `loader` on the spinner overlay.

**Every root now carries a `data-slot`.** All eleven that were missing one — `Accordion`,
`Breadcrumbs`, `Form`, `GridList`, `Link`, `Menu`, `Modal`, `Separator`, `TagGroup`, `ToggleButton`,
`Toolbar` — have it, and it was checked in the DOM rather than in the source. Two of them proved the
point of that check:

- **A slot on an element that renders no DOM lands nowhere.** `Menu` and `Modal` root on
  `MenuTrigger` and `DialogTrigger`, which are context providers with no element of their own, so
  `data-slot` on them was written, type-checked, and did not exist at runtime. The slot belongs on the
  surface a test would actually reach for — the popover, the dialog — not on the wrapper.
- **`data-slot` must not go on the _first_ matching tag, and not on a tag in a comment.** Breadcrumbs'
  root is a `<nav>` landmark this component adds around React Aria's list, and the file's own JSDoc
  quotes that tag. A patch keyed on the first `<nav` hit the **comment**, so the attribute appeared in a
  grep and not in the browser. Remove the tag from prose that describes it, or the next grep lies too.

### A component can work and still be unprovable by the test runner

`Virtualizer` prunes 1000 monitors to the **11 rows** a 320px container can show — `scrollHeight` 484px
rather than 44000, measured with Playwright. The Storybook test runner reports all 1000 for the same
story, because React Aria renders the collection in full and prunes it once the scroll container has been
measured, and that pass does not happen the same way in the runner's frame.

The story therefore asserts the parts that hold in **both** — rows in order, and the list being a scroll
container — and the pruning lives in `docs/components/virtualizer.md` as a browser measurement. Loosening
an assertion until it passes in either environment is how a suite ends up asserting nothing; the honest
move is to say which environment proved what.

Verify with the browser, per component, not with a grep:

```js
document.querySelector('[data-slot="<name>"]') // must be non-null on that component's story
```

For a component whose surface opens — `Menu`, `Modal`, `Sheet` — open it first; the slot is behind the
trigger by design.

`isDisabled` and `isPending` together are coherent but not free. The dim still applies, so it
reads as unavailable, and the cursor defers to disabled (`not-allowed`, not `progress`) since
the spinner already says work is in flight. The rough edge is that `opacity` compounds onto
children, so the spinner dims along with everything else and is faint — most visibly in the
light theme.

### States move the colour, they do not replace it

The sheet declares `hover: #FFF` on its one accent. That does not survive five semantic
colours: a danger button that turns the same white as everything else has stopped meaning
danger. It is barely available anyway — these fills sit at L 92%, leaving 8% of headroom
toward white, so lightening is nearly invisible.

So hover and pressed **deepen the button's own colour**, toward `--ink`:

```
rest → hover 12% toward ink → pressed 22% toward ink
```

Mixing with `--ink` rather than `black` is what makes these recipes work in both
themes: `ink` inverts with the fills, so the same 12% deepens the luminous dark-theme accents
and lightens the deep light-theme ones. Use the same principle for any new state: derive from
the base, never substitute a different colour.

**A shared class list is tested by whichever component tests it first.** `optionList.ts` holds the option
recipe for `ListBox`, `Select`, `ComboBox` and `Menu`. `ListBox`'s own test asserted the opacity of a
disabled option and got `1`: the recipe had no `data-[disabled]` rule at all, so an option that could not be
chosen looked exactly like one that could — in all four. One line fixed four components. Copying that class
list would have hidden the bug in three of them.

**Declare a recipe on the element that sets its base.** A custom property is substituted
where it is _declared_, so a recipe written on `:root` that reads `var(--btn)` finds nothing,
becomes invalid, and silently paints transparent. This is why the recipes live in `Button`'s
BASE class list and not in `styles.css`.

## React Aria Components

Every interactive component wraps a React Aria Components primitive
(`react-aria-components`). Do not hand-roll a native element: RAC is what supplies keyboard
behaviour, focus management, and screen-reader semantics.

```tsx
import { Button as AriaButton } from 'react-aria-components'
import type { ButtonProps as AriaButtonProps } from 'react-aria-components'
```

API differences from a native element, which trip people up constantly:

| Native     | React Aria                           |
| ---------- | ------------------------------------ |
| `disabled` | `isDisabled`                         |
| `onClick`  | `onPress` (mouse + touch + keyboard) |
| —          | `isPending` for async work in flight |

**Style states off RAC's data attributes, not CSS pseudo-classes.** The two "inactive"
states differ in the DOM, which is easy to get wrong:

- `isDisabled` renders **both** the native `disabled` attribute **and** `data-disabled`.
- `isPending` renders only `aria-disabled` + `data-pending`. It stays focusable and has
  **no** native `disabled`, so a `disabled:` utility would never match it.

**A `url(#…)` that resolves to nothing fails silently, and so does the patch that was supposed to fix
it.** `BarChart`'s dot-grid zone referenced a `useId`-derived `<pattern>` id while the pattern element kept
a hardcoded one, so the fill pointed at a definition that did not exist — and an SVG resolves that to
_transparent_, with no error and no visual difference from a zone that was never meant to be there. Every
test passed, because they counted rects and a rect that paints nothing still exists. The fix itself then
silently failed to apply, because it anchored on a single-line tag Prettier had already reflowed. Assert the
**reference** against the **definition**; do not trust the line that was meant to make them match.

**A control that reports is not a control that acts.** React Aria's `onRemove` hands back the keys the
user asked to remove; it does not remove them, because the collection belongs to the caller. `TagGroup`'s
story passed `onRemove={() => {}}` and shipped a remove button that removed nothing — and its test passed,
because it counted the buttons and checked their names instead of pressing one. **A remove control is only
proven by the thing being gone.** When a callback reports rather than acts, the docs have to say so and the
test has to press it.

**A filled variant with no colour paints nothing, silently.** Every `Button` variant paints `bg-(--btn)`,
and `--btn` is set only by `COLORS[color]`. `ToggleButton` composed the base, variants and sizes but not the
table, so an **off** default toggle had no background while `text-ink` still painted its label — black on
black, an empty box that the source cannot show you. Its whole test file passed, because it asserted the
semantics and the _on_ state, and the defect lived in the appearance of the **off** state.

**The browser's default outline is a colour you did not choose.** With no rest outline the UA applies
`outline-style: auto` and draws in its own colour — measured on this repo's own button as
`1px auto rgb(153, 200, 255)`. Declare the ring transparent at rest and colour it on `data-[focus-visible]`,
the same move `Table`'s column and `GridList`'s row needed.

**Two components can be typed identically and not be interchangeable.** `SheetTrigger` extends
`DialogTriggerProps` and renders a `DialogTrigger` — with one difference: it wraps its children in a
`PressResponder` with `isPressed={false}`, which stops the trigger looking stuck while the sheet is open.
The types cannot tell you that; only the source can. When two exports take the same props, read the one
line of JSX that differs.

**A React Aria component may write inline styles that no class can beat.** `SheetContent` renders
its `Dialog` with `style={{ width: '100%', height: '100%' }}` _after_ the props it is handed, so the panel
can never be sized from outside — the size has to go on the layer above it. Inline style outranks every
utility and every variant, so when a class "looks right and does nothing", check the source before
changing the class: `dist/private/<Name>.js.map` carries the original `tsx` in `sourcesContent`.

**Never write `outline-none` on an element that also needs a ring.** It sets Tailwind's shared
`--tw-outline-style` custom property, and every `outline-<width>` utility reads that same property back —
so once it is `none`, no ring on that element can draw again, not even from a `data-[selected]:` variant.
The element reports `outline-width: 2px` with `outline-style: none` and looks perfectly styled. Draw the
ring as a **transparent outline at rest** instead, the way `Radio`, `Checkbox`, `Switch` and
`ColorSwatchPicker` all do, and change only its colour on state.

**This rule was written down and then broken twice in the same repo** — `Table`'s column and `GridList`'s
row each carried `outline-none` beside their ring, so neither could ever draw. A file-level grep for
`outline-none` does not find them, because both utilities are frequently in _different_ class lists in the
same file; the check has to be per element, and the cheapest reliable one is the computed style:

```js
// In the browser, for an element that should have a ring but is not focused:
getComputedStyle(el).outlineStyle // 'solid' with a transparent colour is correct. 'none' is the bug.
```

So use `data-[disabled]:`, `data-[pending]:`, `data-[hovered]:`, `data-[pressed]:`,
`data-[focus-visible]:`. `data-[pressed]` is also strictly better than `:active` because it
covers keyboard Space/Enter.

### Publish a curated prop surface

Define the component's own `ButtonProps` and **re-declare the React Aria props you expose**,
`Omit`-ing them from the inherited type first:

```tsx
export interface ButtonProps extends Omit<
  AriaButtonProps,
  'isDisabled' | 'isPending' | 'onPress' | 'children'
> {
  variant?: 'default' | 'outline' | 'ghost' | 'text' | 'icon'
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'danger'
  /** Disables the button. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaButtonProps['isDisabled']
  // …onPress, isPending, children
}
```

Two reasons, both measured on this repo:

1. Docgen's default `propFilter` drops anything declared under `node_modules`, so inherited
   RAC props disappear from the components manifest. Loosening the filter project-wide fixes
   it but swells every component's prop list (Button went from 3 to **41** props, mostly DOM
   noise). Declaring them locally keeps it at **7**, all of them ours.
2. Storybook's `argTypes` fixes the docs table but **never reaches the manifest**, so it is
   not a substitute — the MCP `docs-show` output ignores it.

### JSDoc goes on the exported symbol

`react-docgen-typescript` reads the description from the **exported** declaration. Writing
the JSDoc above an internal `const ButtonRoot = forwardRef(…)` instead of the exported
`const Button` yields a manifest with an empty description and a docs page with no summary —
silently, with no error.

## Compound components

`Button`, `Button.Icon`, `Button.Text` style APIs are supported via `subcomponents`:

```tsx
import { Button, ButtonIcon, ButtonText } from './Button'

const meta = {
  component: Button,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see rule 1 below.
  subcomponents: { 'Button.Icon': ButtonIcon, 'Button.Text': ButtonText },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof Button>
```

Three rules, all learned the hard way — breaking any one silently corrupts the docs or the
manifest that this project's MCP tools serve:

1. **Pass the named exports, never `Button.Icon`.** The accessor form is not statically
   traceable, so every subcomponent resolves back to `Button` and the agent is told the
   parent's props for all of them. Storybook derives _both_ the props and the import line
   from this value, so you cannot have a tidy `import { Button }` line for a subcomponent
   and correct prop extraction at the same time — the JSDoc says which form to consume.
2. **Keep `reactDocgen: 'react-docgen-typescript'` in `.storybook/main.ts`.** The default
   `react-docgen` cannot follow `Object.assign`-based compound components and resolves
   every export to a single subcomponent.
3. **Compose slots in `render`, not in `args`, and set an explicit `docs.source.code`.**
   Storybook's code panel defaults to a _dynamic_ snippet serialised from the rendered
   element tree, which prints the raw export names (`<ButtonIcon>`) and wraps any fragment
   in `<React.Fragment>`. Curated snippets show the compound API a consumer actually
   writes. `parameters.docs.source.type = 'code'` is the DRY alternative but dumps the
   whole story object, including `play` functions.

This matters because a wrong manifest is worse than no manifest: the agent is instructed
to trust it over its own knowledge, so bad props become confident hallucinations.

### Read the manifest with the right key

`/manifests/components.json` carries the props under **`reactDocgenTypescript`**. There is no
`reactDocgen` key at all, so reading the wrong one returns `{}` for every component and makes the
whole library look like it publishes nothing. That mistake produced a round of confident, wrong notes
here; the table below is the corrected measurement.

```sh
curl -s http://localhost:6006/manifests/components.json \
  | python3 -c "import json,sys; [print(c['name'], sorted((c['reactDocgenTypescript'].get('props') or {}))) for c in json.load(sys.stdin)['components']]"
```

### What the prop surface looked like, and what it looks like now

Sixteen components were publishing only their _own_ props — `className`, `children`, `size` — and none
of the React Aria props they actually expose. **`DropZone` published no `onDrop`**, `Link` no `href`,
`Slider` no `value`, `Menu` no `isOpen`, `Tree` nothing about selection. Across the library the
manifest went from **239 published props to 329**.

| Component      | Before | After | Notable additions                            |
| -------------- | ------ | ----- | -------------------------------------------- |
| `Calendar`     | 3      | 11    | `value`, `onChange`, `visibleDuration`       |
| `ColorField`   | 1      | 9     | `value`, `onChange`, `isInvalid`             |
| `DateField`    | 2      | 11    | `value`, `onChange`, `minValue`              |
| `DropZone`     | 1      | 5     | **`onDrop`**                                 |
| `GridList`     | 2      | 7     | `selectionMode`, `selectedKeys`              |
| `Link`         | 4      | 8     | **`href`**                                   |
| `Menu`         | 1      | 4     | `isOpen`, `onOpenChange`                     |
| `Slider`       | 4      | 11    | **`value`**, **`onChange`**, `formatOptions` |
| `TagGroup`     | 2      | 8     | `selectionMode`, `onRemove`                  |
| `TimeField`    | 2      | 10    | `value`, `granularity`                       |
| `ToggleButton` | 3      | 8     | `isSelected`, `onChange`                     |
| `Tree`         | 1      | 9     | `selectionMode`, `expandedKeys`              |

Final count: **332 props across 42 components**. The three that still publish two or fewer should:
`Home` (a page, no props at all), `ColorSwatch` (`color` genuinely is its only prop) and `Toolbar`
(`orientation` — the bar has nothing else of its own). Nothing is left under-reporting.

**tsc is the correctness check for this work.** Writing `AriaToggleButtonProps['isPending']` when no
such prop exists is a compile error, so the declarations cannot be guessed — which is how React Aria's
lack of `isPending` on a toggle button, and `toast` being required rather than optional, were both
caught rather than shipped.

Known limitation: docgen's default `propFilter` drops props declared under `node_modules`.
For React Aria components that is handled by re-declaring the exposed props locally (see
[Publish a curated prop surface](#publish-a-curated-prop-surface)) rather than by loosening
the filter, which would add ~40 inherited DOM props to every component. Any _other_
inherited prop you genuinely need to publish must be re-declared the same way.

## Local lint rules

`lint-rules/` holds rules that are ours, loaded as an **Oxlint JS plugin** through `lint.jsPlugins` in the
`lint` block of `vite.config.ts` — no dependency, because the published ones cannot express the constraints
this library actually has. Oxlint's plugin API is ESLint's, so the rule below is the one that ran under
ESLint; only the file it lives in, and the block that configures it, moved.

**`pulse/enforce-required-children`** requires named children inside a component, wherever it is used:

```js
'pulse/enforce-required-children': [
  'error',
  { Radio: ['Indicator', 'Text'], Checkbox: ['Indicator', 'Text'] },
]
```

**Why not `eslint-plugin-enforce-children`.** It was evaluated and rejected on its source, for two separate
reasons, and both matter:

1. **It only forbids.** Its message is "only these children are allowed inside <X>" — an allow-list. There is
   no way to state "a `Radio` must contain `Radio.Indicator`", which is the constraint that keeps a control
   visible. A rule that cannot state the requirement cannot find the bug.
2. **It skips member expressions.** Its `getTagName` returns `null` for `<Some.Child>` and the rule returns
   early, so `<Radio.Indicator>` is invisible to it. Every compound here is a member expression, so it would
   report nothing while looking correctly configured. (Its README also contradicts itself — the "valid"
   example puts `<Row>` inside a `<Grid>` configured to allow only `GridItem`.)

**What this rule cannot see, which is where the bug it was written for actually lived:**

- **Examples in markdown or template strings.** `docs.source.code` and `radio.md` both hold `<Radio>` as
  text, not as JSX. `radio.md`'s examples were the ones missing `Radio.Indicator`, and no lint rule can read
  them.
- **Aliased imports** (`import { Radio as R }`). The rule matches on the tag name and the local import name.
- It checks only for parents listed in the config. It now runs over every linted file — an ESLint `files`
  entry used to scope it to `src/**`, and the Vite+ config has no such scope.

**The rule is strict — it does not special-case `slot` or anything else.** `Table.Selection` renders
`<Checkbox slot="selection">` with an `Indicator` and deliberately no `Text`, because the row it sits in is
its label and React Aria creates and drives that checkbox through the slot. That exemption is declared in the
rule's own options, next to the requirement it excepts:

```js
'pulse/enforce-required-children': ['error', {
  rules: {
    Radio: ['Indicator', 'Text'],
    Checkbox: ['Indicator', 'Text'],
    TextField: ['Input'],
    // A `NumberField` is never a bare input: the `Counter` is the stepper and this system always renders it.
    NumberField: ['Input', 'Counter'],
    // A `SearchField` is never a bare label. Its `Icon` stays optional, and the `Group` is only required
    // for the pair — so `Input` alone is a complete search field.
    SearchField: ['Input'],
    // A `DatePicker` is the input and the calendar trigger, always both — without its `Button` it cannot
    // open a calendar, which is the whole component.
    DatePicker: ['Input', 'Button'],
    // Same pair, same reason: a range picker without its `Button` cannot open a calendar.
    DateRangePicker: ['Input', 'Button'],
  },
  // When *every* listed member is present, the container is required and they must be inside it.
  groups: {
    TextField: { container: 'Group', members: ['Input', 'Icon'] },
    SearchField: { container: 'Group', members: ['Input', 'Icon'] },
    // `NumberField` has no `Icon` slot: its second member is the `Counter`, the stepper. Same container,
    // different member — so the rule is stated per component rather than assumed from shape.
    NumberField: { container: 'Group', members: ['Input', 'Counter'] },
    DatePicker: { container: 'Group', members: ['Input', 'Button'] },
    DateRangePicker: { container: 'Group', members: ['Input', 'Button'] },
  },
  ignore: { Checkbox: ['src/components/Table/Table.tsx'] },
}]
```

**`groups` is `all`, not `any`, and that distinction is the whole rule.** A `TextField` with only an `Icon`,
or only an `Input`, does **not** need a `Group`: `Input` alone is a perfectly good field and `Icon` alone is a
decoration. It is the **pair** that needs somewhere to be positioned relative to each other, which is what the
`Group` is for. Requiring the container for either one alone would make the rule wrong about correct code,
which is how a rule gets switched off. Measured, all six:

| `TextField` contains                 | result                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `Group > Input`                      | pass                                                          |
| `Group > Input + Icon`               | pass                                                          |
| `Input + Icon`, no `Group`           | error — needs a `Group`                                       |
| `Group > Input`, `Icon` as a sibling | error — the `Icon` must be inside it                          |
| `Icon` alone                         | only the missing-`Input` error; the group rule does not apply |
| bare `Input`, no `Group`             | pass                                                          |

`SearchField` carries the same pair as `TextField`, and states `Input` in `rules` for the same reason. `NumberField` does not — it has no `Icon` slot at all, and
its second member is the `Counter`. A rule stated by analogy would have been wrong there, so each component
names its own members; the slot lists above are what settled it.

**`NumberField` also states both members in `rules`, so they are required and not merely conditional.** The
two options compose: `rules` says `Input` and `Counter` must be present, and `groups` says that when both are
present they belong inside the `Group`. Since they are always present, the `Group` is required on every
`NumberField` — without that second statement the container would still be optional for a field that lost its
`Counter`. Four controls, all measured:

| `NumberField` contains      | result                                                  |
| --------------------------- | ------------------------------------------------------- |
| `Group > Input + Counter`   | pass                                                    |
| `Input`, no `Counter`       | error — missing `Counter`; the group rule does not fire |
| `Input + Counter`, no Group | error — needs a `Group`                                 |
| `Counter`, no `Input`       | error — missing `Input`                                 |

**The documented `DatePicker` shape is what the rule encodes**, measured against all four cases:

| `DatePicker` contains                   | result                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `Label + Group > Input + Button + Hint` | pass, and this is the shape `datepicker.md` shows      |
| `Input`, no `Button`                    | error — missing `Button`; the group rule does not fire |
| `Button`, no `Input`                    | error — missing `Input`                                |
| `Input + Button`, no `Group`            | error — needs a `Group`                                |

`DateRangePicker` publishes the identical slot list and carries the identical two lines — the slot list was
where that was confirmed, not the name. `ComboBox` also pairs an `Input` with a `Button`; it is **not**
configured, because nothing has asked for it, and adding a component by analogy is the mistake
`NumberField`'s `Counter` would have punished.

**`ignore` exists so the requirement list is declared exactly once.** The first version of this used a second,
file-scoped config entry that restated the map without `Checkbox`. It worked, and it was wrong: the day a
third parent joins `rules`, every such entry has to be found and updated by hand and nothing reports the ones
missed — the same staleness `Home`'s component index is generated to avoid. `ignore` is additive, so adding a
parent touches one object. Patterns are `*`/`**` globs matched against the repo-relative path.

`ignore` is per **parent**, not per file, which is the whole point here: `Radio` is still required in
`Table.tsx`. Turning the rule `'off'` for that file would drop both, and nothing about `Table.Selection`
justifies that.

**Check an exemption with `--print-config` and with a planted violation — not with a passing lint run.** A
config that matches nothing looks exactly like one that works; `npm run lint` is green either way, and a file
path is the easiest thing in the world to get subtly wrong. Both claims above were measured by dropping a bare
`<Radio>` and a bare `<Checkbox>` into the files:

| file                                   | planted result                     |
| -------------------------------------- | ---------------------------------- |
| `src/components/Table/Table.tsx`       | 2 `Radio` errors, **0** `Checkbox` |
| `src/components/Form/Form.stories.tsx` | 2 `Radio` errors, 2 `Checkbox`     |

Two traps in that measurement, both hit while taking it: **the rule only fires where the component is
imported**, so a probe in a file without the import reports nothing and looks like a passing exemption; and a
glob that does not match is indistinguishable from an exact path that does, so the pattern was checked
separately with `src/components/**/Table.*`.

Inline `// oxlint-disable-next-line` and `/* oxlint-disable */ … /* oxlint-enable */` also work — Oxlint reads
the `eslint-disable` spellings too, and both were checked against a planted violation rather than assumed —
and they have one advantage worth knowing: a directive that stops being needed is **reportable**, with
`--report-unused-disable-directives`, where an `ignore` entry that stops being needed is silent. That is the
trade: the exemption is reviewable beside the rule and keeps lint comments out of the component, so it needs
its reason written down, which is why the config carries one.

**A slot one level down still counts, and getting that wrong is silent.** The walker pushed each
`JSXElement` and did not recurse into it, so it only ever saw _direct_ children. `<Radio.Indicator>` is a
direct child, so `Radio` worked; `<TextField.Input>` is written inside `<TextField.Group>` here, so the rule
reported three correct fields as missing their input. It was found by adding `TextField: ['Input']` and
checking a case that must **pass** — the must-flag case alone looked perfect.

That is three bugs in this one traversal, all the same shape: first it walked `openingElement`, which has no
children; then the array branch recursed without pushing, so direct children were dropped; then elements were
pushed without recursing, so nested ones were dropped. Each produced confident, plausible output. The
traversal is the part of a rule like this that is easy to get subtly wrong and hard to notice, so the controls
have to cover the nested form explicitly.

**Write both controls when proving a rule.** The first version of this one flagged _every_ `<Radio>`,
including the correct ones — it recursed from the children array without pushing the element, so direct
children were never collected. Six errors for three elements, one of them right. A rule that flags
everything is as useless as one that flags nothing, and it looks like a passing rule until you check a case
that must be clean. Verify with a must-flag case **and** a must-pass case.

## Components

Every component has one doc file, read on demand. **Read `docs/components/<name>.md` before
changing that component** — each one records the decisions, the React Aria behaviour it depends
on, and the mistakes that were already made there, so they are not made again.

| Component               | Doc                                                                    | What it is                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Accordion`             | [accordion.md](./docs/components/accordion.md)                         | The sheet has no accordion in it — the second component here with nothing to copy, after the date picker — so th… |
| `Avatar`                | [avatar.md](./docs/components/avatar.md)                               | Who something belongs to. Invented — the sheet has nothing person-shaped.                                         |
| `BarChart`              | [barchart.md](./docs/components/barchart.md)                           | A histogram with one bar in the accent. From the replica's `drawBars`.                                            |
| `Breadcrumbs`           | [breadcrumbs.md](./docs/components/breadcrumbs.md)                     | A trail back up the hierarchy, where the last step is the page you are on.                                        |
| `Button`                | [button.md](./docs/components/button.md)                               | The first component, and the one the whole system's state vocabulary came from.                                   |
| `Calendar`              | [calendar.md](./docs/components/calendar.md)                           | A month on the page, with no field and no popover around it.                                                      |
| `Card`                  | [card.md](./docs/components/card.md)                                   | One thing on the page: a title, a body, a row of actions, in the sheet's own panel.                               |
| `Checkbox and Radio`    | [checkbox-and-radio.md](./docs/components/checkbox-and-radio.md)       | Two controls, one anatomy.                                                                                        |
| `ColorField`            | [colorfield.md](./docs/components/colorfield.md)                       | A colour typed into a field, with a square showing what it is.                                                    |
| `ColorSwatch`           | [colorswatch.md](./docs/components/colorswatch.md)                     | A colour, shown as a square — a picture, not a control.                                                           |
| `ColorSwatchPicker`     | [colorswatchpicker.md](./docs/components/colorswatchpicker.md)         | A row of preset colours, one of which is chosen.                                                                  |
| `ComboBox`              | [combobox.md](./docs/components/combobox.md)                           | The sheet has no combobox class of its own — it is the search affix and the select menu put together, which is w… |
| `DateField`             | [datefield.md](./docs/components/datefield.md)                         | A date typed into a field, with no calendar behind it.                                                            |
| `DatePicker`            | [datepicker.md](./docs/components/datepicker.md)                       | A picker without a calendar is not a picker, so DatePicker renders the popover and the whole month itself and th… |
| `DateRangePicker`       | [daterangepicker.md](./docs/components/daterangepicker.md)             | Two dates as one value — "when does this window start and end".                                                   |
| `DropZone`              | [dropzone.md](./docs/components/dropzone.md)                           | A target that accepts files dragged onto it.                                                                      |
| `DotMap`                | [dotmap.md](./docs/components/dotmap.md)                               | A world map of dots, from the replica's `drawMap`. Opt-in readout.                                                |
| `FlatLine`              | [flatline.md](./docs/components/flatline.md)                           | A series that never varied — the replica's "flat 100% line".                                                      |
| `Form`                  | [form.md](./docs/components/form.md)                                   | A group of fields with a button that submits them.                                                                |
| `GridList`              | [gridlist.md](./docs/components/gridlist.md)                           | A selectable list or grid of rows — the dashboard's monitors, a run of results, a set of files.                   |
| `Link`                  | [link.md](./docs/components/link.md)                                   | The sheet's three links — .ds-link-caps, .ds-link-url and .ds-link-viewmore — as variants of one component, beca… |
| `ListBox`               | [listbox.md](./docs/components/listbox.md)                             | A list of options where the choice is a value, not a set of rows.                                                 |
| `Menu`                  | [menu.md](./docs/components/menu.md)                                   | A menu of actions or choices, opened from a control.                                                              |
| `Modal`                 | [modal.md](./docs/components/modal.md)                                 | A dialog over the page: a short task that needs an answer before the page can be used again.                      |
| `Nav`                   | [nav.md](./docs/components/nav.md)                                     | React Aria's NavigationTree — a nested, hierarchical set of links — which is what a sidebar actually is.          |
| `NumberField`           | [numberfield.md](./docs/components/numberfield.md)                     | The sheet has no number field — only a number's _typography_, in .ds-num, .ds-num-sm and .ds-num-alt.             |
| `Popover`               | [popover.md](./docs/components/popover.md)                             | A panel anchored to the thing that opened it, that does not take the page away.                                   |
| `OverlayArrow`          | [overlayarrow.md](./docs/components/overlayarrow.md)                   | The marker pointing from a floating panel back at its trigger. Opt-in.                                            |
| `ProgressBar and Meter` | [progressbar-and-meter.md](./docs/components/progressbar-and-meter.md) | Not a difference in decoration.                                                                                   |
| `RangeCalendar`         | [rangecalendar.md](./docs/components/rangecalendar.md)                 | Two months at once, with a span of days between them.                                                             |
| `SearchField`           | [searchfield.md](./docs/components/searchfield.md)                     | The sheet's .ds-affix--search.                                                                                    |
| `Select`                | [select.md](./docs/components/select.md)                               | The sheet's .ds-select, .ds-select-btn and .ds-select-menu.                                                       |
| `Separator`             | [separator.md](./docs/components/separator.md)                         | The sheet's five dividers, which is why there are five.                                                           |
| `SharedElement`         | [sharedelement.md](./docs/components/sharedelement.md)                 | An element that animates between parents when it moves.                                                           |
| `Sheet`                 | [sheet.md](./docs/components/sheet.md)                                 | A panel that slides in from an edge — a task's details without leaving the page.                                  |
| `Slider`                | [slider.md](./docs/components/slider.md)                               | A value chosen by dragging a handle along a rail.                                                                 |
| `Sparkline`             | [sparkline.md](./docs/components/sparkline.md)                         | A series over time in a table cell. No axes, from the replica's `drawSpark`.                                      |
| `Switch`                | [switch.md](./docs/components/switch.md)                               | The sheet's .ds-switch.                                                                                           |
| `Table`                 | [table.md](./docs/components/table.md)                                 | The sheet's .ds-rows and .ds-row: a panel-coloured stack separated by hairlines, closed by a softer one.          |
| `Tabs`                  | [tabs.md](./docs/components/tabs.md)                                   | The sheet's .ds-tabs and .ds-tabpanel: a row with one hairline under all of it, which the selected tab's indicat… |
| `TagGroup`              | [taggroup.md](./docs/components/taggroup.md)                           | The sheet's .ds-tag: a 12px uppercase chip, in the seven treatments the sheet defines — which is why there are s… |
| `TextArea`              | [textarea.md](./docs/components/textarea.md)                           | The sheet's .ds-textarea: the field anatomy with a control that takes more than one line.                         |
| `TextField`             | [textfield.md](./docs/components/textfield.md)                         | The second component, and the anatomy the rest of the form controls reuse — textarea, select, checkbox and radio… |
| `TimeField`             | [timefield.md](./docs/components/timefield.md)                         | A time typed into a field — DateField's sibling.                                                                  |
| `Toast`                 | [toast.md](./docs/components/toast.md)                                 | The sheet has no toast either — the third component here with nothing to copy, after the date picker and the acc… |
| `ToggleButton`          | [togglebutton.md](./docs/components/togglebutton.md)                   | A button that stays down.                                                                                         |
| `ToggleButtonGroup`     | [togglebuttongroup.md](./docs/components/togglebuttongroup.md)         | A row of buttons where one — or several — is on. A segmented control.                                             |
| `TokenField`            | [tokenfield.md](./docs/components/tokenfield.md)                       | Text with tokens inside it — a notification target, an alert's audience.                                          |
| `Toolbar`               | [toolbar.md](./docs/components/toolbar.md)                             | A bar of controls, walked with the arrow keys.                                                                    |
| `Tooltip`               | [tooltip.md](./docs/components/tooltip.md)                             | The sheet's .ds-tip — a short description attached to the thing it describes, on its own panel rather than on a … |
| `Tree`                  | [tree.md](./docs/components/tree.md)                                   | A hierarchical list of items, expanded and collapsed in place.                                                    |
| `Virtualizer`           | [virtualizer.md](./docs/components/virtualizer.md)                     | Renders only the rows in view.                                                                                    |
| `VisuallyHidden`        | [visuallyhidden.md](./docs/components/visuallyhidden.md)               | Text for screen readers and nobody else.                                                                          |

Two cross-cutting rules apply to all of them and are **not** repeated per component:
[Compound components](#compound-components) — how the slots and the docs are wired — and
[React Aria Components](#react-aria-components) — what every interactive piece wraps, and how to
publish a curated prop surface.

Every component in the index exists in `src/components/`. `Sheet`, `ColorField` and `TokenField` each
carried a "removed" or "not built" verdict for a round and were afterwards built — **a verdict here is
a record, not a prohibition**, and two of the three turned out to have been judged wrongly.

### Checking the library for gaps, rather than trusting this index

This table is what has been built; it is not evidence that nothing is left. The library's own exports are.
`react-aria-components` exports 278 capitalised bindings; this command lists the ones no component here
references, which is the only honest starting point for "is anything missing":

```sh
cat > .diff.mjs <<'EOF'
import * as RAC from 'react-aria-components'
import { readFileSync, readdirSync, statSync } from 'node:fs'
const files = []
const walk = (d) => { for (const e of readdirSync(d)) { const p = `${d}/${e}`
  statSync(p).isDirectory() ? walk(p) : /[.]tsx?$/.test(p) && !/[.]stories[.]/.test(p) && files.push(p) } }
walk('src/components')
const src = files.map(f => readFileSync(f, 'utf8')).join('\n')
for (const k of Object.keys(RAC).filter(k => /^[A-Z]/.test(k)))
  if (!new RegExp(`\\b${k}\\b`).test(src)) console.log(k)
EOF
node .diff.mjs
```

153 of the 278 come back, and **most are not components** — they are contexts (`*Context`, `*StateContext`),
layout objects (`GridLayout`, `ListLayout`, `LayoutInfo`, `Rect`, `Point`, `Size`), collection internals
(`Collection`, `CollectionBuilder`) and behaviours (`Focusable`, `Pressable`, `Keyboard`). Reading the list
is the job; the count is not.

What it did find, and what is still open after `ToggleButtonGroup`:

- **`DropIndicator`** — attempted and **removed**. `GridList` reorders correctly with `dragAndDropHooks`,
  but the indicator was never rendered during a drag even with the right option, so it did nothing and was
  deleted rather than shipped. See `gridlist.md`.

**The load-more sentinel family is complete** — `GridList.LoadMore`, `Table.LoadMore`, `Tree.LoadMore`,
`ListBox.LoadMore` and `Menu.LoadMore`, all on one shared recipe in `loadMore.tsx`. Each draws nothing until
`isLoading`, and React Aria renders nothing at all for it when idle; `GridList`'s carries the end-to-end
proof that `onLoadMore` fires on scroll inside a `Virtualizer`, and the other four are the same machinery.

Still open, and it is one judgement call rather than missing work:

- **`SheetBackdrop`** — attempted and **reverted**. React Aria sets the `Sheet` layer's `position`,
  `top`, `left`, `width` and `height` inline, so that layer is content-sized by the library and a
  backdrop's `inset-0` can only cover the panel rather than the page. Measured in the live DOM, not
  assumed. See `sheet.md`. (`SheetTrigger`, its sibling, **was** worth adopting.)

**A coarse filter hid fifteen more components.** An earlier pass through this list dismissed anything
named `*Context`, `*Layout`, `*State` — which also swept up real exports. Filtering only on "capitalised
and unreferenced" leaves these still to build, and they are not all sub-parts:

- **`CheckboxField` and `RadioField`** — field wrappers around a single selection control, the shape
  `TextField` already provides for text. (`RadioButton` and `CheckboxButton` were on this list and are **not**
  gaps: they are React Aria's internal renderers for `Radio` and `Checkbox`. Passing one as a child renders a
  _second_ hidden input — measured as 6 radios for a group of three. A segmented control here is
  `ToggleButtonGroup`, which is a set of toggles; there is no radio-shaped variant to reach for. See
  `radio.md`.)
- **`SelectionIndicator`** — a shared indicator that slides to the current item, which belongs with
  `SharedElement`.
- **`ComboBoxValue` and `PreviewTrigger`** — a `ComboBox` display part and the drag preview.
- **`ColorPicker`, `ColorThumb`, `ColorWheelTrack`** — the spectrum set, already ruled out with the rest of
  the colour family above.
- **`UNSTABLE_ToastContent` and `UNSTABLE_ToastList`** — marked unstable by the library; `Toast` has its
  own slots and works.
- **`DefaultCollectionRenderer`** — internal, not a component.

The lesson is the one this file keeps relearning: **the filter is part of the measurement.** A check
tight enough to exclude noise is tight enough to hide work.

The React Aria families deliberately not built, and why, so they are not attempted blind:

- **`ColorArea`, `ColorSlider`, `ColorWheel`, `ColorPicker`** — these pick _any_ colour and need a
  spectrum surface. Pulse has no gradient in it; its colours are `light-dark()` pairs resolved by CSS,
  so there is no concrete value to put in a gradient at all. `ColorField` and `ColorSwatchPicker` cover
  the half of the colour set this design language contains.
- **`FileTrigger`** — likewise a behaviour with no surface: it is what the `DropZone` and the file
  picker already do. **`GridList`, `Table` and `Tree`** cover the large-collection cases that do have a
  surface.
