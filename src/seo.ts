/**
 * How the site describes itself to anything that is not a browser.
 *
 * Search engines, the unfurler in a chat app, and the link preview on a social timeline all read the
 * same handful of tags. **Every route returns this, and the root route deliberately does not** — the
 * root carries the chrome that is the same everywhere (charset, viewport, `theme-color`, the
 * stylesheet, the icons) and nothing that belongs to a page.
 *
 * That split is not tidiness; it is the one thing about this that measured wrong. TanStack Router
 * dedupes `meta` across the matched routes, so a child's `title` and `og:title` replace the root's —
 * but it **appends** `links`, so a canonical on the root and a canonical on a child both render. The
 * login page shipped with two canonicals pointing at different addresses, which tells a search engine
 * that the page it is reading is a copy of the landing page. A route that forgets its head now has no
 * title rather than a wrong one, which is at least visible.
 *
 * ```tsx
 * // in a route
 * head: () => pageHead({ title: 'Sign in', path: 'login', description: '…' }),
 * ```
 */

/**
 * The origin, without the path GitHub Pages serves this repo from. The path comes from
 * `import.meta.env.BASE_URL`, which the deploy build sets to `/design-system/` and a local build
 * leaves as `/`. So the artefact that gets published carries the published address, and a local one
 * carries a local one — which is the right difference, because the CI build is an SSR check rather
 * than a deployment.
 */
const ORIGIN = 'https://jimlah.github.io'

export const SITE = {
  name: 'Pulse',
  tagline: 'A dark monitoring design language',
  /**
   * The description every page falls back to, and the one a search result will show. It deliberately
   * carries **no component count**: the number changes whenever a component lands, and a stale number
   * in a search result is worse than no number at all. The landing page reads its count from the same
   * generated index the registry does, so the page can be exact where a description cannot.
   */
  description:
    'Pulse is a dark-first monitoring design language: accessible React components built on React Aria, the tokens every one of them derives from, and a registry that installs them into another project.',
  /** The published address, base path and trailing slash included. */
  url: `${ORIGIN}${import.meta.env.BASE_URL}`,
} as const

export interface PageHeadOptions {
  /** The page's own title, without the site name — that is appended here so it is written once. */
  title?: string
  description?: string
  /** The path below the site root, e.g. `login`. The trailing slash is added here, not by callers. */
  path?: string
}

/**
 * The `head` a route returns: title, description, canonical and the card tags.
 *
 * **Non-root paths get a trailing slash, and that is not cosmetic.** GitHub Pages serves a directory
 * at `/login/` and answers `/login` with a redirect to it, so a canonical without the slash points at
 * a URL that redirects — a weaker signal than pointing at the page itself. Adding it here means no
 * caller can get it wrong.
 */
export function pageHead({
  title,
  description = SITE.description,
  path = '',
}: PageHeadOptions = {}) {
  const fullTitle = title
    ? `${title} — ${SITE.name}`
    : `${SITE.name} — ${SITE.tagline}`
  const url = `${SITE.url}${path && !path.endsWith('/') ? `${path}/` : path}`
  const image = `${SITE.url}og.png`

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      /**
       * `max-image-preview:large` is what lets a result show the card image at full width rather than
       * a thumbnail, and it is the only part of this worth stating: `index, follow` is already the
       * default for a page with no directives at all.
       */
      { name: 'robots', content: 'index, follow, max-image-preview:large' },

      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE.name },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: `${SITE.name} — ${SITE.tagline}` },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
