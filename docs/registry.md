# Component registry

Every component here is published as a [shadcn registry](https://ui.shadcn.com/docs/registry), so
another project installs it with `npx shadcn add` instead of copying it out of this one.

- **Catalogue** — `registry.json`, generated, at the root. This is also what a GitHub registry
  address reads (`npx shadcn add Jimlah/design-system/button`).
- **Served items** — `public/r/<name>.json`, built from the catalogue, committed, and copied into
  `dist/client` by `vp build`.
- **Rebuild after changing a component** — `npm run registry:build`.
- **What is not in it** — `Home.tsx`, the app's landing page; the stories and tests; and
  `src/examples/`, which holds page bodies shown to _readers_ rather than components shipped to
  _consumers_.

## Consuming it

```bash
npx shadcn@latest registry add @pulse=https://jimlah.github.io/design-system/r/{name}.json
npx shadcn@latest add @pulse/button     # one component, and everything it imports
npx shadcn@latest add @pulse/pulse      # the whole library: 54 components and the theme
npx shadcn@latest add @pulse/theme      # the tokens and Overpass Mono on their own
```

The same items are reachable by address, which is both what the Pages deployment serves and what the
repository publishes:

```bash
npx shadcn@latest add https://jimlah.github.io/design-system/r/button.json
npx shadcn@latest add Jimlah/design-system/button
```

In development, `npm run dev` serves the built registry at
<http://localhost:3000/r/registry.json> (the catalogue) and `/r/button.json` (an item).
`npm run registry:build` is what puts them there.

## What is in it

56 items: the `theme`, one `pulse` bundle, and one item per component.

| Item                      | Type             | What it is                                                      |
| ------------------------- | ---------------- | --------------------------------------------------------------- |
| `theme`                   | `registry:theme` | The tokens, the reset they are drawn against, and Overpass Mono |
| `pulse`                   | `registry:block` | All 54 components in one item, with the theme                   |
| `button`, `text-field`, … | `registry:ui`    | One component, self-contained                                   |

Item names are the kebab-case component names (`text-field`, `color-swatch-picker`), so
`@pulse/text-field` is `src/components/TextField`. Each item carries its component's doc file in
`docs` and its opening line in `description`, both read from `docs/components/<name>.md`.

## The item shape, and why

### Every item carries the theme

A component installed on its own still has to render, and Pulse's utilities (`bg-teal`,
`text-fg-muted`, `border-line-strong`) are Tailwind theme variables, so an item without the token
block paints an empty box. The `@theme` token block and the `@layer base` reset therefore travel
**inside every item**, not only in `theme`.

That is duplication in the generated files, and it is deliberate. The alternative is a
`registryDependencies` entry pointing at `theme`, and every form of one fails somewhere:

| Dependency form            | What happens                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"./theme.json"`           | Resolves against the **consumer's** working directory, not the item's URL — measured: `ENOENT <consumer>/theme.json` while adding `http://localhost:4321/pilot-c.json` |
| `"theme"` (bare)           | Resolves against the built-in `@shadcn` registry — a bare name means shadcn/ui's item of that name, never a sibling here                                               |
| `"@pulse/theme"`           | Works only once the consumer has registered the `@pulse` namespace; adding by URL without it throws `Registry @pulse was not found`                                    |
| `"https://…/r/theme.json"` | Works, but makes installing anything depend on the deployment being live and current — including from a local checkout                                                 |

The duplicated token block costs bytes in generated JSON and buys the one property worth having:
**an item installs correctly from any address, offline, with no namespace registered.** The
generator reads that block out of `src/styles.css` with PostCSS, so it cannot drift from the
stylesheet it distributes.

### Shared recipes are bundled, not depended on

`field.ts`, `date.tsx`, `optionList.ts`, `popover.ts`, `progress.ts`, `link.ts`,
`segment.ts`, `loadMore.tsx` and `chartTooltip.ts` are shared class recipes, and `Select`
imports `SearchField`, `Table` imports `Checkbox`, `Tree` imports `Nav`. For the same reason,
each item lists **every file it transitively imports** in its own `files` array. The CLI dedupes by
target inside one `add` — measured: adding two items that both carry `@ui/pulse/field.ts` wrote
three files, once each.

### The file layout is the source layout

Every file targets `@ui/pulse/<the same path under src/components>`, so
`src/components/Select/Select.tsx` lands at `<aliases.ui>/pulse/Select/Select.tsx` and its
`import … from '../SearchField/SearchField'` still resolves. Nothing rewrites the imports, because
nothing needs to: `@ui/` is the consumer's own alias, so one target works whether they import with
`@/`, `#` or a package export.

### The font rides on `theme` and `pulse`

Overpass Mono arrives through `@fontsource/overpass-mono`, as four weight imports — its
`index.css` alone carries weight 400, and the reset sets `font-synthesis: none`, so a 500 label
would otherwise render at 400 with no synthesis to hide it. It is deliberately **not** on the
component items: adding a `Button` should not also install a font package — `@fontsource/overpass-mono`
is 638 KB unpacked across the five weights. Until `theme` is added, `--font-mono` falls back to
the monospace stack.

## What is generated, and how

`registry.json` is written by `scripts/build-registry.mjs`, which reads:

- the components on disk — a directory with an entry file named after it — and each one's imports;
- `src/styles.css` — the `@theme` block and the reset after it, through PostCSS;
- `docs/components/<name>.md` — the title, the one-liner and the full `docs` payload.

```bash
npm run registry        # registry.json only — offline, no CLI needed
npm run registry:build  # registry.json, then public/r/<name>.json via the shadcn CLI
```

`public/r` is committed, as it is in the official
[registry template](https://github.com/shadcn-ui/registry-template), so a fresh checkout serves the
registry in `npm run dev` with no build step. Two guards keep it honest: the `checks` job
regenerates `registry.json` and fails on a diff, and the Pages workflow rebuilds `public/r` before
the app, so the deployed registry always matches the commit it was published from.

The CLI is **not** a dependency. `shadcn` pulls 232 packages and seven high-severity advisories into
the lockfile for a build step that runs in CI, so `registry:build` invokes `npx shadcn@4` instead
— pinned to the major, and measured against 4.21.4, the version every claim in this file was checked
with.

## What the CLI writes into a consumer's stylesheet

Two behaviours are worth knowing before reading a generated `public/r` item. Both were measured
with 4.21.4 by installing into a scratch project and reading the result.

**`cssVars.theme` lands inside `@theme inline`.** Tailwind still emits every variable on
`:root` — checked by compiling the consumer's stylesheet — so `var(--color-line-control)` works
from the component recipes as well as from a utility.

**Six `--color-color-*` variables appear beside the real ones.** The CLI's `update-theme` plugin
appends `--color-<key>: var(--<key>)` for any `cssVars` value it reads as a colour, and its test
is `value.includes("--color-")` — which every derived token here matches, because they are
`color-mix(in oklch, var(--color-fg) …)`. The result is six inert extras, one per derived token:

```css
--color-color-line-control: var(--color-line-control);
```

They are left in place on purpose. The way to avoid them is to key those tokens without the
`color-` prefix and let that same heuristic add it back — which would make `text-fg-muted` and
`border-line-strong` depend on an undocumented internal regex. If that regex changed, the utilities
would silently stop being generated and components would paint nothing. Six unused custom properties
are the cheaper failure.

## How this was verified

Against shadcn 4.21.4, in a scratch consumer whose `components.json` points `aliases.ui` at
`@/components/ui`:

- `add <url>/r/theme.json`, `add <url>/r/text-field.json` and `add <url>/r/pulse.json` (64
  files) each completed, and `add @pulse/text-field` through a registered namespace wrote
  `pulse/TextField/TextField.tsx` and `pulse/field.ts`.
- `list` and `search` against `/r/registry.json` reported all 56 items.
- `tsc --noEmit` over the installed tree was clean — which is what proves the relative imports
  survived the move.
- Compiling the consumer's stylesheet with Tailwind v4 produced `.bg-teal`, `.text-fg-muted`,
  `.border-line-strong` and `.ease-pulse`, with `--color-teal` on `:root` and the Overpass
  Mono `@font-face` rules loaded.

Re-run any of it by building the registry and serving `public/r` on a static server:
`npx shadcn@latest add http://localhost:4321/r/button.json`.
