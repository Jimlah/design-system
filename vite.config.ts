import { defineConfig, lazyPlugins } from 'vite-plus'
import type { Connect, Plugin } from 'vite-plus'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, statSync } from 'node:fs'
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from 'vite-plus/test/browser-playwright'

// `import.meta.dirname` (Node 20.11+) keeps Vite's native config loader happy;
// the `__dirname` fallback it replaced is unsupported by that loader.
const dirname = import.meta.dirname

/**
 * **Set only by the Pages workflow**, which serves this at a repository subpath:
 * `https://jimlah.github.io/design-system/`. Everything absolute in the built app has to know that,
 * so it arrives as one variable and defaults to nothing at all.
 *
 * When it is set the build is also a **static one** (`spa.enabled`), because Pages is a file server
 * with no Node behind it. Left unset — every developer build, `vite preview`, and the SSR check this
 * app exists to run — the build is unchanged: TanStack Start still renders the routes on the server.
 */
const DEPLOY_BASE = process.env.DEPLOY_BASE
const isDeployBuild = DEPLOY_BASE !== undefined

const STORYBOOK_BASE = '/storybook'
const STORYBOOK_STATIC_DIR = path.join(dirname, 'storybook-static')

/** Enough of the build's file types to serve them with a type the browser accepts. */
const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

/**
 * Serves the Storybook build at `/storybook/`, so the component index on the Home
 * page can open the real docs. It could not before: those links read
 * `/?path=/docs/components-button--docs`, where the *query* is Storybook's but the
 * *path* is the app's own root, so they landed back on the landing page.
 *
 * **This serves the built Storybook rather than proxying the dev server on :6006,
 * and that is a measurement, not a preference.** Proxying was tried first and does
 * not work: Storybook's dev server hands the preview iframe a module graph of
 * *root-absolute* URLs — `/vite-inject-mocker-entry.js`, `/@vite/client`,
 * `/@id/__x00__virtual:/@storybook/builder-vite/vite-app.js` — and every import
 * below those is root-absolute as well. Reached through `/storybook/` they resolve
 * against this app instead: the manager paints, the story tree fills in, and the
 * canvas sits on a spinner forever behind 404s. Only the manager's own assets are
 * relative (`./sb-manager/runtime.js`), so the one thing that breaks is the preview
 * — the half that matters.
 *
 * A Storybook *build* is relative throughout, deliberately, so that it can sit under
 * any prefix. So `storybook-static/` drops straight into a subpath with no rewriting
 * and no second server, and the same middleware serves it in `vite preview`. The
 * trade is freshness: this is the last `npm run build-storybook`, and the live,
 * always-current Storybook stays on :6006.
 */
function storybookBuild(): Plugin {
  const serve: Connect.NextHandleFunction = (request, response, next) => {
    const { pathname, search } = new URL(request.url ?? '/', 'http://localhost')

    // `/storybook` with no trailing slash is the one URL relative paths get wrong:
    // the browser would resolve Storybook's `./sb-manager/…` against the app root.
    // Send it to `/storybook/` first, carrying any `?path=` along.
    if (pathname === STORYBOOK_BASE) {
      response.writeHead(302, { location: `${STORYBOOK_BASE}/${search}` })
      response.end()
      return
    }
    if (!pathname.startsWith(`${STORYBOOK_BASE}/`)) {
      next()
      return
    }

    const relativePath = decodeURIComponent(
      pathname.slice(STORYBOOK_BASE.length),
    )
    const resolved = path.resolve(STORYBOOK_STATIC_DIR, `.${relativePath}`)
    // Resolve, then re-check the prefix. The URL parser above has already folded away
    // `..` — it normalises `%2e%2e` too, so those requests never arrive here — but it
    // leaves `%2e%2e%2f` alone, and that one decodes into a real traversal. Measured:
    // `/storybook/%2e%2e%2fpackage.json` reaches this line and gets the 403.
    if (
      resolved !== STORYBOOK_STATIC_DIR &&
      !resolved.startsWith(`${STORYBOOK_STATIC_DIR}${path.sep}`)
    ) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      response.end('Forbidden')
      return
    }
    const file = relativePath.endsWith('/')
      ? path.join(resolved, 'index.html')
      : resolved

    const stats = statSync(file, { throwIfNoEntry: false })
    if (!stats?.isFile()) {
      // A checkout with no build in it is the likely reason to be here, and it is
      // worth a sentence rather than a bare 404.
      const hasBuild = statSync(STORYBOOK_STATIC_DIR, {
        throwIfNoEntry: false,
      })?.isDirectory()
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
      response.end(
        hasBuild
          ? `<p>No Storybook file at <code>${relativePath}</code>.</p>`
          : '<p>No <code>storybook-static/</code> build found. Run ' +
              '<code>npm run build-storybook</code>, then reload.</p>',
      )
      return
    }

    response.writeHead(200, {
      'content-type':
        CONTENT_TYPES[path.extname(file).toLowerCase()] ??
        'application/octet-stream',
      'content-length': stats.size,
      // The build is regenerated in place, so a chunk cached from before a rebuild
      // is a real failure mode and revalidating it is nearly free.
      'cache-control': 'no-cache',
    })
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(file).pipe(response)
  }

  return {
    name: 'storybook-build',
    configureServer: (server) => {
      server.middlewares.use(serve)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(serve)
    },
  }
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  // Oxlint and Oxfmt, the two tools Vite+ bundles, configured in one place. The rule list is
  // `@tanstack/eslint-config`'s, carried over by `vp migrate` and checked against the package's
  // own source. See AGENTS.md, "Local lint rules".
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'import'],
    // Oxlint's default `correctness` category, downgraded to warnings so that only the rules
    // named below are a gate. `vp migrate` sets this; without it Oxlint's own defaults would
    // fail the run on rules this project never opted into.
    categories: {
      correctness: 'warn',
    },
    options: {
      // tsgolint on the TypeScript Go toolchain: `vp check` type-checks through this.
      typeAware: true,
      typeCheck: true,
    },
    env: {
      builtin: true,
    },
    jsPlugins: [
      // Vite+'s own hygiene rules, which keep imports on `vite-plus` now that it owns the
      // toolchain. The specifier is Vite+'s, so the rule always matches the bundled Oxlint.
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      // Ours, not a dependency — the same constraint no published plugin can state.
      { name: 'pulse', specifier: './lint-rules/enforce-required-children.js' },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',

      // **The requirement list is declared once, and `ignore` is the exception list.** A file
      // that is exempt from one parent is named in the rule's own options rather than in a
      // second config entry that restates the map — that entry would go stale the day a third
      // parent is added, silently. `ignore` is additive, so adding a parent touches one object.
      //
      // `Table.Selection` is the one exception: it renders `<Checkbox slot="selection">` with an
      // `Indicator` and deliberately no `Text`, because the row it sits in is its label and React
      // Aria creates and drives that checkbox through the slot. It is a `Checkbox` exception, not
      // a `Table` one — the `Radio` requirement still applies in that file.
      'pulse/enforce-required-children': [
        'error',
        {
          rules: {
            Radio: ['Indicator', 'Text'],
            Checkbox: ['Indicator', 'Text'],
            // A `TextField` renders exactly the children it is given too, so without its `Input`
            // there is no field to type in — it is a label and a hint with nothing between them.
            TextField: ['Input'],
            // **A `NumberField` is never a bare input.** The `Counter` is the stepper and this
            // system always renders it, so both are required — which also makes the `Group`
            // unconditional for every `NumberField`, because `groups` fires whenever both members
            // are present and they always are.
            NumberField: ['Input', 'Counter'],
            // A `SearchField` is never a bare label either. Its `Icon` stays optional — an icon
            // with no input is a decoration, and the `Group` is only required for the pair.
            SearchField: ['Input'],
            // A `DatePicker` is the input and the calendar trigger, always both — a picker
            // without its `Button` cannot open a calendar, which is the whole component.
            DatePicker: ['Input', 'Button'],
            // The same pair, and the same reason: a range picker without its `Button` cannot
            // open a calendar.
            DateRangePicker: ['Input', 'Button'],
          },
          ignore: {
            Checkbox: ['src/components/Table/Table.tsx'],
          },
          // **The `Group` is required only when `Input` *and* `Icon` are both rendered**, and then
          // both must be inside it. Either one alone is fine on its own — `Input` alone is a good
          // field, `Icon` alone is a decoration — and it is the pair that needs somewhere to be
          // positioned relative to each other.
          groups: {
            TextField: { container: 'Group', members: ['Input', 'Icon'] },
            // `SearchField` has the same pair. `NumberField` has no `Icon` slot — its second member
            // is the `Counter`, the stepper — so the container argument is the same and the member
            // is not.
            SearchField: { container: 'Group', members: ['Input', 'Icon'] },
            NumberField: { container: 'Group', members: ['Input', 'Counter'] },
            DatePicker: { container: 'Group', members: ['Input', 'Button'] },
            DateRangePicker: {
              container: 'Group',
              members: ['Input', 'Button'],
            },
          },
        },
      ],
    },
    overrides: [
      {
        // What `@tanstack/eslint-config` scoped its rules to. Its second entry, for `**/*.vue`,
        // is dropped: there is no Vue here, and an override that matches no file is a rule that
        // is silently not running.
        files: ['**/*.{js,ts,tsx}'],
        env: {
          es2020: true,
          browser: true,
        },
        rules: {
          // `@tanstack/eslint-config`'s javascript set. `no-octal` is missing on purpose — Oxlint
          // does not implement it, and it is superseded by strict mode.
          'for-direction': 'error',
          'no-async-promise-executor': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'error',
          'no-compare-neg-zero': 'error',
          'no-cond-assign': 'error',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'error',
          'no-delete-var': 'error',
          'no-dupe-else-if': 'error',
          'no-duplicate-case': 'error',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-ex-assign': 'error',
          'no-extra-boolean-cast': 'error',
          'no-fallthrough': 'error',
          'no-global-assign': 'error',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-loss-of-precision': 'error',
          'no-misleading-character-class': 'error',
          'no-nonoctal-decimal-escape': 'error',
          'no-regex-spaces': 'error',
          'no-self-assign': 'error',
          'no-shadow': 'warn',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-unsafe-finally': 'error',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-labels': 'error',
          'no-unused-private-class-members': 'error',
          'no-useless-backreference': 'error',
          'no-useless-catch': 'error',
          'no-useless-escape': 'error',
          'no-var': 'error',
          'no-with': 'error',
          'prefer-const': 'error',
          'require-yield': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',

          // Its typescript-eslint set. `naming-convention` is missing on purpose — Oxlint does
          // not implement it; the selector it configured here was `typeParameter` only.
          'typescript/ban-ts-comment': [
            'error',
            {
              'ts-expect-error': false,
              'ts-ignore': 'allow-with-description',
            },
          ],
          'typescript/consistent-type-imports': [
            'error',
            {
              prefer: 'type-imports',
            },
          ],
          'typescript/method-signature-style': ['error', 'property'],
          'typescript/no-duplicate-enum-values': 'error',
          'typescript/no-extra-non-null-assertion': 'error',
          'typescript/no-for-in-array': 'error',
          'typescript/no-inferrable-types': [
            'error',
            {
              ignoreParameters: true,
            },
          ],
          'typescript/no-misused-new': 'error',
          'typescript/no-namespace': 'error',
          'typescript/no-non-null-asserted-optional-chain': 'error',
          'typescript/no-unnecessary-condition': 'error',
          'typescript/no-unnecessary-type-assertion': 'error',
          'typescript/no-unsafe-function-type': 'error',
          'typescript/no-wrapper-object-types': 'error',
          'typescript/prefer-as-const': 'error',
          'typescript/prefer-for-of': 'warn',
          'typescript/triple-slash-reference': 'error',

          // Its import set. `import/order` is missing on purpose — Oxlint does not implement it,
          // and this project turned it off anyway.
          'import/consistent-type-specifier-style': [
            'error',
            'prefer-top-level',
          ],
          'import/first': 'error',
          'import/newline-after-import': 'error',
          'import/no-commonjs': 'error',
          'import/no-duplicates': 'error',

          // `node/prefer-node-protocol`'s equivalent. The node plugin is not part of this set;
          // `unicorn` states the same rule, so the coverage is kept rather than lost.
          'unicorn/prefer-node-protocol': 'error',

          // Turned off in `eslint.config.js`, and off here for the same reasons. `sort-imports`
          // fights the formatter; `require-await` fires on every async stub; `array-type` wants
          // `Array<T>` everywhere and this library reads better with `T[]`. `@stylistic/spaced-comment`
          // is the one rule with no Oxlint equivalent at all.
          'sort-imports': 'off',
          'typescript/require-await': 'off',
          'typescript/array-type': 'off',
        },
      },
    ],
    ignorePatterns: [
      '**/.nx/**',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/snap/**',
      '**/vite.config.*.timestamp-*.*',
      // Build output — not source. Never lint compiled bundles.
      // The local lint rules are lint configuration, not app source: they are not part of any
      // tsconfig, so the typed-lint project service reports "file was not found in any of the
      // provided project(s)". `// @ts-check` at the top of each gives them editor type checking
      // instead.
      'lint-rules/**',
      'storybook-static/**',
      'dist/**',
      '.tanstack/**',
    ],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'storybook-static',
      'dist',
      '.tanstack',
      // Both are generated — `registry.json` by scripts/build-registry.mjs and `public/r` by the
      // shadcn CLI — so formatting either one would be undone by the next build. See docs/registry.md.
      'registry.json',
      'public/r',
    ],
  },
  resolve: {
    tsconfigPaths: true,
  },
  // `/design-system/` under Pages; `/` everywhere else. Vite rewrites every asset URL and injects the
  // same value as `import.meta.env.BASE_URL`, which is what the router's basepath and the Home page's
  // Storybook links read — so the subpath is stated once, here, and nowhere else.
  base: DEPLOY_BASE ?? '/',
  plugins: lazyPlugins(() => [
    devtools(),
    tailwindcss(),
    tanstackStart(
      // A deploy build is **prerendered**, not left as an empty SPA shell: the landing page then
      // arrives as real HTML instead of blank-before-JavaScript, which is what a document should do.
      // Everything else — every developer build, `vite preview`, and the SSR pass this app exists to
      // run — is untouched.
      //
      // `crawlLinks` stays off: the app has one route, and the links out of the component index point
      // at the Storybook build, which is a directory of files copied in beside this output rather
      // than a route this build serves — so crawling found them, 404'd, and failed the build.
      isDeployBuild ? { prerender: { enabled: true, crawlLinks: false } } : {},
    ),
    viteReact(),
    storybookBuild(),
  ]),
  test: {
    // **Two entries, one run.** Both projects are Vitest browser mode on the same Chromium through
    // the same provider, and `vp test` reports them together — the split is not two test setups a
    // reader has to keep in their head, it is the only shape the tools allow.
    //
    // They cannot be merged into one project, and that was measured rather than assumed: merging
    // them leaves `include` to the Storybook addon, which builds its file list from the Storybook
    // index and offers no file-level `include` (its options are `configDir`, `tags`, `storybookUrl`,
    // `storybookScript`, `disableAddonDocs` and `initialGlobals`). Merged, the component test is
    // dropped *silently* — 55 files and 311 tests instead of 56 and 315, with nothing failing.
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
      {
        // **Component tests, in Vitest's own browser mode** — https://vitest.dev/guide/browser/ —
        // where the file is an ordinary test rather than a story: a contract stated directly, with
        // no docs page or curated snippet in the way. Same browser, same provider, same command.
        extends: true,
        test: {
          name: 'components',
          include: ['src/**/*.browser.test.tsx'],
          // The app's real stylesheet, so a computed style means what it means in the app. Stories
          // get it from `.storybook/preview.tsx`; a test file has nowhere else to put it, and
          // without it every colour and size assertion would read the UA defaults instead.
          setupFiles: ['./src/browserTestSetup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
})
export default config
