import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/Create.tsx, like the sign-in page: a route file with extra
// exports cannot be code-split, and this page is a worked example of the components being used
// rather than one of them.
import { Create } from '../examples/Create'
import { FONTS } from '../examples/createTheme'

/**
 * The theme a link carries. Every field is optional and every field is a string: what arrives is
 * whatever someone put in the address bar, and `createTheme.ts` decides what it means.
 */
interface CreateSearch {
  base?: string
  /** A number, not a string, and that matters — see below. */
  hue?: string | number
  font?: string
  mode?: string
}

/**
 * The search as this page understands it, with every value left as the router parsed it.
 *
 * **`hue` is passed through untouched, and that is the whole reason this function exists.** TanStack
 * Router parses a search value as JSON, so `?hue=320` arrives as the *number* 320 while `?base=sand`
 * arrives as a string. Two wrong versions of this were measured: narrowing to strings dropped the hue
 * from every shared link (the router then redirected to the URL without it, and the link opened the
 * default theme), and coercing it to a string made the router write it back quoted — `hue=%22320%22` —
 * and redirect to that. `createTheme.ts` accepts either.
 */
function asSearch(search: Record<string, unknown>): CreateSearch {
  const text = (key: string) => {
    const value = search[key]
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : undefined
  }
  const raw = search.hue
  return {
    base: text('base'),
    hue: typeof raw === 'string' || typeof raw === 'number' ? raw : undefined,
    font: text('font'),
    mode: text('mode'),
  }
}

/**
 * The four monospace families this page offers, in one Google Fonts request.
 *
 * They ride on the route rather than on the app: this is the one page where a typeface is the
 * subject, and the other three families cost three stylesheets here instead of a second request
 * on every page of the site. A browser fetches a family only when text actually asks for it.
 *
 * The request is built from `FONTS`, so a family cannot be offered in the controls and missing
 * from the sheet that would render it.
 */
const MONO_FAMILIES =
  'https://fonts.googleapis.com/css2?' +
  FONTS.map((font) => 'family=' + font.google).join('&') +
  '&display=swap'

export const Route = createFileRoute('/create')({
  validateSearch: asSearch,
  // A page of its own, and indexed as one: someone looking for a theme builder for a design
  // system is looking for exactly this.
  head: () => {
    const head = pageHead({
      title: 'Create',
      path: 'create',
      description:
        'Build a Pulse theme: pick a base colour, an accent hue and a monospace family, watch the real components repaint, and copy the token block that results.',
    })
    return {
      ...head,
      links: [...head.links, { rel: 'stylesheet', href: MONO_FAMILIES }],
    }
  },
  component: CreateRoute,
})

/**
 * The route's search is read here and handed to the page as a prop, which is what keeps the theme
 * in the address bar: the same link renders the same theme on the server as in the browser, with
 * nothing to hydrate over.
 */
function CreateRoute() {
  const search = Route.useSearch()
  return <Create preset={search} />
}
