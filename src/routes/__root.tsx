import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

/** Assets live beside the app, so their addresses move with the base path the same way the pages do. */
const BASE = import.meta.env.BASE_URL

export const Route = createRootRoute({
  // Chrome that is the same on every page, and nothing that belongs to one: a page's title,
  // description and canonical come from its own route's `pageHead()`. The reason is in src/seo.ts —
  // `links` are appended rather than deduped, so a canonical here would sit beside a route's own and
  // point the search engine at the wrong page.
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        // Lets the browser paint the right canvas before the stylesheet loads,
        // so a dark page never flashes white. Pulse is dark-first, so this says
        // `dark`; add `light` here the day the app grows a persisted theme
        // preference, and it will match whatever `data-theme` resolves to.
        name: 'color-scheme',
        content: 'dark',
      },
      {
        // The colour of the browser's own chrome on mobile, which is painted before any stylesheet
        // is parsed — so it is one of the two values in this repo written out rather than read from a
        // token (the other being what `npm run icons` generates, which reads them). It mirrors the
        // dark `--background`: `#000000` rather than the panel tint, because that is the canvas the
        // page sits on rather than the surface on top of it.
        name: 'theme-color',
        content: '#000000',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // Both are generated from the tokens by `npm run icons`, so neither invents a colour.
      // The SVG is the one browsers prefer; the PNG is what iOS uses for a home-screen icon, and
      // what the unfurlers that cannot read an SVG favicon fall back to.
      {
        rel: 'icon',
        href: `${BASE}favicon.svg`,
        type: 'image/svg+xml',
      },
      {
        rel: 'apple-touch-icon',
        href: `${BASE}apple-touch-icon.png`,
        sizes: '180x180',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
