# Theming

The tokens live in one place, `src/styles.css`, in [shadcn's
shape](https://ui.shadcn.com/docs/theming): **the values sit in `:root` and a single
`@theme inline` block turns them into utilities**. Each value holds both themes as
`light-dark(light, dark)`, so switching themes means switching `color-scheme` and never
redefining a token.

## The token set

Pulse's palette used to have names of its own — `--color-teal`, `--color-panel`,
`--color-fg`. Those are gone. The names are shadcn's now, so a component copied out of
shadcn/ui speaks the vocabulary this library does:

| Token                          | Utility                     | Light                          | Dark                 |
| ------------------------------ | --------------------------- | ------------------------------ | -------------------- |
| `--background`                 | `bg-background`             | `oklch(100% 0 none)`           | `oklch(0% 0 none)`   |
| `--foreground`                 | `text-foreground`           | `oklch(18% 0 none)`            | `oklch(100% 0 none)` |
| `--card`                       | `bg-card`                   | `#F7F7F7`                      | `#0D1015`            |
| `--popover`                    | `bg-popover`                | = `--card`                     | = `--card`           |
| `--primary`                    | `bg-primary` `text-primary` | `oklch(55% 0.0931 …)`          | `#71FFF6`            |
| `--secondary`                  | `bg-secondary`              | `oklch(52% 0 none)`            | `#BFBFBF`            |
| `--muted`                      | `bg-muted`                  | `#EDEDED`                      | `#191C20`            |
| `--muted-foreground`           | `text-muted-foreground`     | 70% of `--foreground`          | same rule            |
| `--accent`                     | `bg-accent`                 | = `--muted`                    | = `--muted`          |
| `--destructive`                | `bg-destructive`            | `oklch(55% 0.1236 29)`         | `#FF9A8B`            |
| `--warning`                    | `bg-warning`                | `oklch(55% 0.1103 91.2)`       | `#FAD14F`            |
| `--success`                    | `bg-success`                | `oklch(55% 0.1236 145)`        | `#B0FBB1`            |
| `--border`                     | `border-border`             | `--foreground` at 62%          | same rule            |
| `--input`                      | `border-input`              | `--foreground` at 45%          | same rule            |
| `--ring`                       | `ring-ring`                 | = `--primary`                  | = `--primary`        |
| `--chart-1` … `--chart-5`      | `bg-chart-1` …              | the bar grey, then the accents | same                 |
| `--sidebar` … `--sidebar-ring` | `bg-sidebar` …              | Nav's anatomy                  | same                 |
| `--radius`                     | `rounded-lg` …              | `0`                            | `0`                  |

Three tokens have no shadcn equivalent. They are **extensions**, added the way shadcn's own docs
describe adding a token — one entry in `:root`, one line in `@theme inline` — rather than a
second palette:

- **`--ink`** (`text-ink`, `bg-ink`) — the label colour on a fill. It inverts with the fills:
  black on the luminous dark-theme accents, white on the deep light-theme ones. It pairs with no
  single colour, because a component chooses its fill at runtime and the label has to follow it; it
  is also the anchor a hover or pressed state deepens toward.
- **`--border-strong`** and **`--border-soft`** — shadcn has one border, this system has three
  hairline strengths. `--border` is the row rule, `--border-strong` a panel boundary,
  `--border-soft` the quietest divider.

`--accent`, `--popover` and `--sidebar` point at the same value as the surface they extend,
which is honest rather than tidy: this design language has one subtle fill and one panel, and
shadcn's vocabulary splits each of them into two or three roles.

## Why `@theme inline`, and not `@theme`

Both were measured on this stylesheet.

**`inline` decides where a utility reads its value.** Compiled from a plain `@theme`, a
utility reads a `--color-*` snapshot taken on `:root`; with `inline` it reads the variable on
the element itself. Measured: a subtree setting `--primary: rgb(1, 2, 3)` leaves
`var(--color-primary)` at teal, because that declaration is substituted where it is _declared_,
on `:root`.

**It also decides whether the variable exists at all.** An `@theme inline` entry is **not
emitted** to `:root` unless something references it. Measured: with only `text-foreground` in
play, `--color-foreground` is absent from the output; add one recipe containing
`var(--color-foreground)` and it appears. The components are what keep these variables alive.

**`light-dark()` is not frozen the same way.** A subtree with `color-scheme: light` flips
`var(--primary)`, `var(--foreground)` and every other value, because `light-dark()` resolves
where it is _used_. Theme switching through `color-scheme` therefore works in every scope; only
redefining a _variable_ lower down the tree behaves differently.

## No `.dark` block of values

Pulse is dark-first — the source sheet has no light mode, so dark is the default rather than the OS
setting — and every value carries both themes in one `light-dark()`. shadcn themes by redefining
every variable inside `.dark`; doing that here would mean hand-writing a second value per accent
and losing the derivations, where `--muted-foreground` and the three hairlines are `color-mix()`
off `--foreground` precisely so they need no per-theme tuning.

`.dark` still exists as an alias, carrying `color-scheme` and nothing else, so a shadcn theme
provider's toggle works here unchanged:

```css
[data-theme='dark'],
.dark {
  color-scheme: dark;
}
```

## Radius

`--radius: 0`, because the sheet squares off its buttons and inputs. Overriding Tailwind's
`--radius-*` scale is safe here rather than merely convenient — measured, no component uses
`rounded-sm`…`rounded-4xl`; only `rounded-none`, `rounded-full` and `rounded-[2px]` appear,
and `rounded-full` is not derived from `--radius`, so the checkbox, radio, switch and avatar keep
their radii.

## Type

The family lives in `:root` as `--type-mono`, and the theme block maps the utility to it. That
indirection is a measurement, not tidiness:

```css
:root {
  --type-mono: 'Overpass Mono', ui-monospace, …;
}
@theme {
  --font-mono: var(--type-mono);
}
```

**`@theme inline` writes a theme entry's value straight into the utility it compiles.** Every colour
here survives that because its value _is_ a `var()`, which still reads whichever element the utility
lands on — but for the font the value was the family itself, so `.font-mono` compiled to
`font-family: 'Overpass Mono', ui-monospace, …`. `--font-mono` therefore could not change the typeface
anywhere: not on a subtree, and not in a consumer's `:root` either, because no utility ever read it.
Measured by compiling this sheet with `@tailwindcss/node` — with the family inline, setting
`--font-mono` on a subtree left `.font-mono` at Overpass Mono; with `--type-mono` in `:root`, the utility
compiles to `font-family: var(--type-mono)` and follows the element it is used on.

This is what the [`/create`](./create.md) page needed in order to offer a typeface at all, and it is the
one token a value can move that a variable could not.

## What this costs in the registry

The generator walks every `@theme` at-rule and every top-level rule, so the values and the theme
block both ride into all 56 registry items with no generator change. Because the values are now
plain `var()` references rather than `color-mix(… var(--color-fg) …)`, the CLI's colour
heuristic no longer matches any of them, so the six inert `--color-color-*` properties it used to
add on install are gone with them.

Note that the CLI writes `cssVars.theme` back **inside `@theme inline`** in the consumer,
measured against 4.21.4 — see [registry.md](./registry.md). That is the shape this file already
uses, so a consumer gets the behaviour the components were written against.

## Using it

```tsx
// One vocabulary, role-based, in both themes.
<div className="bg-card text-card-foreground" />
<button className="bg-primary text-ink" />
```

Overriding a role retints every component that uses it:

```css
:root {
  --primary: oklch(0.7 0.2 300);
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
