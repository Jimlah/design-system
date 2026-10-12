/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import type { Connect, Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, statSync } from 'node:fs'
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

// `import.meta.dirname` (Node 20.11+) keeps Vite's native config loader happy;
// the `__dirname` fallback it replaced is unsupported by that loader.
const dirname = import.meta.dirname

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
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    storybookBuild(),
  ],
  test: {
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
    ],
  },
})
export default config
