# Theming

Pulse's colours live in one place: the `@theme` block in `src/styles.css`. Each entry becomes both a
CSS custom property on `:root` and a Tailwind utility, and each holds **both themes** as a
`light-dark()` pair, so switching themes means switching `color-scheme` and never redefining a token.

On top of that sits a **shadcn-compatible semantic layer**: a second, role-based naming for the same
values, so a component copied out of [shadcn/ui](https://ui.shadcn.com/docs/theming) — or a consumer's
code written against its tokens — speaks in `bg-primary` and `border-border` rather than in this
palette's `bg-teal` and `border-line`.

## What it is, and what it is not

It is a **translation layer, not a second theme:**

- **Every value is a `var()` onto a Pulse token.** No colour is declared twice, and `light-dark()`
  still resolves per element against `color-scheme`.
- **There is deliberately no `.dark` block of token values.** `.dark` carries `color-scheme: dark`
  and nothing else, as the name a shadcn theme provider toggles.
- **`--radius` is `0`**, because the sheet squares off its buttons and inputs.

## The shape

Two steps, and the middle hop is the point:

```css
:root {
  --primary: var(--color-teal);
  --primary-foreground: var(--color-ink);
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

With `inline`, `bg-primary` compiles to `background-color: var(--primary)` — so a consumer setting
`--primary` at any scope retints the component. Under a plain `@theme`, Tailwind writes the value
through an intermediate `--color-primary` on `:root`; the override still works, but the utility no
longer reads the variable directly. `inline` is the form shadcn documents and the form whose intent is
legible.

The `@theme inline` block is also what publishes the utilities: `bg-background`, `text-foreground`,
`border-border`, `ring-ring`, `bg-primary`, `bg-muted`, `bg-sidebar`, and the rest.

## Why not a `.dark` block

shadcn themes by redefining every variable inside `.dark`. Adopting that here would mean:

- hand-writing a second value per accent, which is exactly what `light-dark()` was adopted to remove;
- breaking the derivations — `--color-fg-muted` and the four `--color-line*` values are
  `color-mix()` off `--color-fg`, and they need no per-theme tuning _because_ they follow one value;
- fighting the Storybook Theme toolbar and `[data-theme]`, which set `color-scheme` only.

So `.dark` is an alias, not a theme:

```css
[data-theme='dark'],
.dark {
  color-scheme: dark;
}
```

It is grouped before `[data-theme='light']` deliberately: equal specificity, so the later rule wins if
an element somehow carries both.

## The mapping

| shadcn token                                     | Pulse source                            | Grounded in                                         |
| ------------------------------------------------ | --------------------------------------- | --------------------------------------------------- |
| `background` / `foreground`                      | `--color-base` / `--color-fg`           | the `body` and the page shell                       |
| `card` / `card-foreground`                       | `--color-panel` / `--color-fg`          | `Table`, `Modal`, `Nav`                             |
| `popover` / `popover-foreground`                 | `--color-panel` / `--color-fg`          | `popover.ts`, `Menu`, `Select`, `Tooltip`           |
| `primary` / `primary-foreground`                 | `--color-teal` / `--color-ink`          | `Button`'s `COLORS.primary`                         |
| `secondary` / `secondary-foreground`             | `--color-neutral` / `--color-ink`       | the lowest-emphasis filled button                   |
| `muted` / `muted-foreground`                     | `--color-panel-2` / `--color-fg-muted`  | field fills in `field.ts`                           |
| `accent` / `accent-foreground`                   | `--color-panel-2` / `--color-fg`        | `hover:bg-panel-2` on a `Table` row                 |
| `destructive` / `destructive-foreground`         | `--color-red` / `--color-ink`           | `Button`'s `COLORS.danger`                          |
| `warning` / `warning-foreground`                 | `--color-yellow` / `--color-ink`        | the sheet's `selected-yellow`                       |
| `success` / `success-foreground`                 | `--color-green` / `--color-ink`         | `Button`'s `COLORS.success`                         |
| `border`                                         | `--color-line`                          | the row rule; see below                             |
| `input`                                          | `--color-line-control`                  | the measured 3:1 boundary of an interactive control |
| `ring`                                           | `--color-teal`                          | the `outline-teal` focus ring                       |
| `chart-1` … `chart-5`                            | `bar`, `teal`, `yellow`, `green`, `red` | `BarChart`, `Sparkline`, `FlatLine`                 |
| `sidebar` / `sidebar-foreground`                 | `--color-panel` / `--color-fg`          | `Nav`'s own classes                                 |
| `sidebar-primary` / `sidebar-primary-foreground` | `--color-teal` / `--color-ink`          | `data-[current]:text-teal`                          |
| `sidebar-accent` / `sidebar-accent-foreground`   | `--color-panel-2` / `--color-fg`        | the hovered nav row                                 |
| `sidebar-border`                                 | `--color-line-soft`                     | `border-e border-line-soft` on the nav              |
| `sidebar-ring`                                   | `--color-teal`                          | the same focus ring                                 |
| `radius`                                         | `0`                                     | square corners                                      |

Three mappings are lossy, and each is a decision rather than an oversight:

| shadcn wants                                    | Pulse gives                          | Why it cannot be exact                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three surfaces: `background`, `card`, `popover` | Two: `--color-base`, `--color-panel` | `card` and `popover` both take `--color-panel`, because Modal, Popover, Menu, Tooltip, Table and Nav all draw on it. Making them differ needs a new surface token here, not an alias. |
| One `--border`                                  | Three hairlines                      | It takes `--color-line` (62%). Components default to `--color-line-strong` (40%) for a panel boundary and `--color-line` for a row rule, so no single choice matches both.            |
| `--secondary`                                   | `--color-neutral`, not the yellow    | shadcn defines it as the lower-emphasis fill, which is this system's neutral button. Yellow is a selected/attention colour and becomes `--warning` instead.                           |

`--warning`, `--success` and `--destructive-foreground` are **extensions, not inventions**: shadcn has
no success token, and its own "adding new tokens" example is the `--warning` pair. It leaves
`destructive-foreground` out to write `text-white`, which this system's rule — a fill carries `ink`, and
`ink` inverts with the fills — forbids.

## Radius

`--radius: 0` collapses shadcn's derived scale to zero:

```css
@theme inline {
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}
```

Overriding Tailwind's default `--radius-*` scale is safe here, and that was measured rather than
assumed: **no component uses `rounded-sm`…`rounded-4xl`** — only `rounded-none`, `rounded-full` and
`rounded-[2px]` appear across `src/components` — and `rounded-full` is not derived from `--radius`, so
the checkbox, the radio, the switch and the avatar keep their radii.

## What it costs

`build-registry.mjs` walks **every** `@theme` at-rule and every top-level rule, so the layer rides into
all 56 registry items with no generator change. The measured price:

|                                 | before | after  |
| ------------------------------- | ------ | ------ |
| theme tokens in `cssVars.theme` | 19     | 62     |
| `public/r/theme.json`           | 4.2 KB | 8.1 KB |
| `registry.json`                 | 453 KB | 689 KB |

That is the same duplication [registry.md](./registry.md) already argues for — an item installs correctly
from any address, offline — one level larger. The `:root` block of Pulse-named values reaches consumers
under `@layer base`; the `@theme inline` mapping reaches them as `cssVars.theme`, which the CLI writes
back **inside `@theme inline`** — measured against 4.21.4, see [registry.md](./registry.md) — so a consumer
gets the same inlined form this file uses rather than an extra `var()` hop.

The six inert `--color-color-*` extras the CLI leaves beside the derived tokens stay at six. That
heuristic fires on any `cssVars` value containing `--color-`, and the values this layer adds are
`var(--primary)` and its siblings — checked against the payload, the set of matching keys is unchanged.

## Using it

```tsx
// Either naming reaches the same colour, in both themes.
<div className="bg-panel text-fg" />
<div className="bg-card text-card-foreground" />
```

Overriding a role retints every component that uses it, in one place:

```css
:root {
  --primary: var(--color-yellow);
}
```

## Verifying it

The utilities are generated on demand, so they do not appear in a build that never uses them — an
absence in `dist` proves nothing. Compile the stylesheet and ask for them:

```js
import { compile } from '@tailwindcss/node'
import { readFileSync } from 'node:fs'

const compiler = await compile(readFileSync('src/styles.css', 'utf8'), {
  base: process.cwd(),
  onDependency() {},
})
const out = compiler.build([
  'bg-primary',
  'border-border',
  'ring-ring',
  'rounded-lg',
])
// .bg-primary    { background-color: var(--primary); }
// .border-border { border-color: var(--border); }
// .ring-ring     { --tw-ring-color: var(--ring); }
// .rounded-lg    { border-radius: var(--radius); }
```
