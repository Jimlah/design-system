# Pulse

**A dark-first monitoring design language**, as a working library: 58 accessible React components,
the design tokens every one of them derives from, and a registry that installs them into another
project instead of asking you to copy them out of this one.

## See it

Everything below is published to GitHub Pages — no server, no build step, just open a link:

|                                |                                                          |
| ------------------------------ | -------------------------------------------------------- |
| **The design system**          | <https://jimlah.github.io/design-system/>                |
| **Documentation** (Storybook)  | <https://jimlah.github.io/design-system/storybook/>      |
| The whole library on one plane | <https://jimlah.github.io/design-system/canvas/>         |
| Theme builder                  | <https://jimlah.github.io/design-system/create/>         |
| A worked example: a task board | <https://jimlah.github.io/design-system/board/>          |
| The registry, as JSON          | <https://jimlah.github.io/design-system/r/registry.json> |

The landing page is the entry point and carries a live index of every component; the **documentation
is the reference** — one page per component, with its props, its stories and the decisions behind it.
Search for a component and the docs are where you should land.

## What this is, and the rules it holds itself to

The system is **Pulse** — a dark monitoring design language, replicated in `../pulse-replica/` — and
this repository is where it became a library. Three things define it:

- **Behaviour is React Aria's.** Every interactive component wraps a
  [React Aria Components](https://react-aria.adobe.com/) primitive rather than a native element, so
  keyboard handling, focus management and screen-reader semantics are not re-invented here. The
  components are compound and style off React Aria's `data-*` attributes — `data-[hovered]`,
  `data-[disabled]`, `data-[selected]` — never off CSS pseudo-classes.
- **The tokens are the single source of truth.** They live in `src/styles.css` in shadcn's shape:
  values in `:root`, one `@theme inline` block turning them into utilities. Every colour is `oklch()`
  and every hover, tint or translucent variant is derived with `color-mix(in oklch, …)`, so nothing
  hardcodes a second hex. Each token holds **both themes** in one `light-dark(light, dark)` value, and
  a theme is switched by setting `color-scheme` — never by redefining a token.
- **The components are installable.** Every one is published as a
  [shadcn registry](https://ui.shadcn.com/docs/registry) item, generated from the same sources as the
  documentation, so what you install is what you read about.

The rules that keep it coherent — the field anatomy, the radius scale, what `disabled` means, how a
story is written and tested — are in [`AGENTS.md`](./AGENTS.md), which is the file to read before
changing a component. The reasoning behind them is beside each component in
[`docs/components/`](./docs/components/).

## Run it locally

```bash
npm install
npm run dev          # the site, on http://localhost:3000
npm run storybook    # the docs, on http://localhost:6006
npm test             # the whole suite — Vitest 5 + Playwright, in real Chromium
npm run check        # Oxfmt, Oxlint and a type check in one pass
npm run build        # the production build
```

**The stories are the tests.** Each `*.stories.tsx` sits beside its component and its `play` function
runs in a real browser, so the component suite _is_ the stories — there is no second copy of the
assertions. The pages' tests are the one exception, and the reason is in `AGENTS.md`: a `play` runs
when a story is _viewed_, and a page someone is meant to operate by hand cannot have one, so those are
`*.browser.test.tsx` under the `components` project, where nothing runs unless it is asked to.

## The site

The landing page, the docs and the registry are one app, built with
[TanStack Start](https://tanstack.com/start) and [Tailwind CSS v4](https://tailwindcss.com/). Routes
are files in `src/routes/`:

| Route                          | What it is                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                            | The landing page: a live component index, and the components doing their actual jobs                                                                        |
| `/canvas/`                     | Every component on one plane, grouped by kind, with a camera you can drive                                                                                  |
| `/storybook/`                  | The documentation — the built Storybook, served by this app                                                                                                 |
| `/create/`                     | A theme builder in the shape of [shadcn's](https://ui.shadcn.com/create): pick colours, watch the real components repaint, copy the token block or the link |
| `/board/`                      | A worked example end to end: drag cards between four columns, each a sheet's worth of detail, with undo and local storage                                   |
| `/examples/`                   | The index of the worked examples, each doing one job end to end                                                                                             |
| `/login/`, `/dashboard-email/` | Two more pages built the same way: a sign-in page, and a leads dashboard                                                                                    |

Pages live in `src/examples/` and are tested by `*.browser.test.tsx` under the `components` project.
They are **not** components: they have no story and are not in the registry, because a story is what
publishes something as part of this library's API. See [`docs/create.md`](./docs/create.md) and
[`docs/board.md`](./docs/board.md) for what each of those two cost to build.

A local `npm run dev` serves the docs at <http://localhost:3000/storybook/> too — the last
`npm run build-storybook` — so the landing page's component links open real documentation instead of
linking back to `/`. The Storybook _dev server_ cannot be mounted under a prefix (it hands its preview
iframe a module graph of root-absolute URLs), so `:6006` stays the live, always-current one; see
`storybookBuild()` in [`vite.config.ts`](./vite.config.ts).

## Install a component

```bash
npx shadcn@latest registry add @pulse=https://jimlah.github.io/design-system/r/{name}.json
npx shadcn@latest add @pulse/button       # one component, and everything it imports
npx shadcn@latest add @pulse/time-picker
npx shadcn@latest add @pulse/theme        # the tokens and Overpass Mono on their own
npx shadcn@latest add @pulse/pulse        # the whole library: 58 components and the theme
```

The same items install by address — the JSON the deployment serves, or the repository itself:

```bash
npx shadcn@latest add https://jimlah.github.io/design-system/r/button.json
npx shadcn@latest add Jimlah/design-system/button
```

`registry.json` is **generated** — from `src/components`, `src/styles.css` and `docs/components` — and
`public/r` is built from it, so neither can drift from the code it describes. Rebuild both after
changing a component:

```bash
npm run registry:build
```

[`docs/registry.md`](./docs/registry.md) covers the item design, what is generated, and the CLI
behaviour it is built around.

## Documentation

- **[`docs/components/`](./docs/components/)** — one file per component (one covers a pair, because
  `Checkbox` and `Radio` share an anatomy): the React Aria behaviour it depends on, the decisions
  taken, and the mistakes already made there so they are not made again.
- **[`AGENTS.md`](./AGENTS.md)** — the cross-cutting rules: compound components, the curated prop
  surface, the local lint rule, how stories are written and tested, SEO and the token table.
- **[`docs/theming.md`](./docs/theming.md)** — the token architecture and the radius scale.
- **Storybook MCP** — `@storybook/addon-mcp` serves an MCP endpoint at `http://localhost:6006/mcp`
  while the Storybook dev server runs, already registered in `.mcp.json`, `opencode.json`,
  `.vscode/mcp.json` and `.cursor/mcp.json`. It is what lets an agent read the component manifest
  instead of guessing at props.

## Deploying

`.github/workflows/ci.yml` runs the checks, the build and the whole story suite on every push;
`.github/workflows/pages.yml` publishes to GitHub Pages at
<https://jimlah.github.io/design-system/>. GitHub Pages has no server behind it, so the app is built
twice: normally it is server-rendered, and with `DEPLOY_BASE` set the routes are **prerendered** to
real HTML and every URL is prefixed for the repository subpath. That one variable becomes Vite's
`base`, the router's `basepath`, and the prefix on the landing page's Storybook links — which is why
the subpath is written down once. `npm run seo` checks a built site in that shape: one title,
description, canonical and `og:url` per page, the sitemap and the prerendered pages agreeing in both
directions. Assemble a deploy locally with:

```bash
DEPLOY_BASE=/design-system/ npx vp build
npm run build-storybook
mkdir -p site && cp -R dist/client/. site/ && cp -R storybook-static site/storybook
cp dist/client/index.html site/404.html   # unknown paths get this app, not GitHub's 404
```

## Layout

|                   |                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------ |
| `src/components/` | The library — one directory per component, with its story and its browser test       |
| `src/styles.css`  | The tokens: both themes, and the `@theme inline` block that makes them utilities     |
| `src/examples/`   | The pages that use the library rather than document it                               |
| `src/routes/`     | One thin file per route; the page bodies live in `src/components` or `src/examples`  |
| `docs/`           | The decisions, beside the component docs                                             |
| `scripts/`        | The generators: the registry, the icons, the DotMap's world dots and the SEO check   |
| `lint-rules/`     | The one lint rule this project wrote, loaded as an Oxlint plugin                     |
| `.storybook/`     | Frameworks, addons, `features.componentsManifest`, and the global styles stories get |

The toolchain is [Vite+](https://viteplus.dev/): one `vp` CLI over Vite, Vitest, Oxlint and Oxfmt,
configured entirely in `vite.config.ts`. ESLint and Prettier are gone — their rules were carried over
into that config's `lint` and `fmt` blocks, and everything is pinned so a developer's machine and CI
agree.
