/**
 * Checks a built site's SEO the way a crawler reads it.
 *
 *   DEPLOY_BASE=/design-system/ npm run build && npm run seo
 *
 * **It runs against `dist/client`, not the source, and that is the whole point.** The tags are
 * assembled from every matched route's `head`, and the one thing that went wrong here — the root
 * route's canonical sitting beside a page's own — was invisible in the source and unmissable in the
 * output: the sign-in page shipped with two canonicals pointing at different addresses, which tells a
 * search engine that the page is a copy of the landing page.
 *
 * What it asserts, and why each one earns its place:
 *
 * - **Every prerendered page is in `sitemap.xml`, and every entry in it is a prerendered page.** A
 *   route that ships without a line in the sitemap is a page nothing points a crawler at; a line with
 *   no page behind it is a 404 offered to one. Neither direction is visible on its own.
 * - **Exactly one title, description, canonical and `og:url` per page.** TanStack Router dedupes
 *   `meta` across the matched routes but *appends* `links`, so a second canonical is exactly what a
 *   shared helper produces by accident.
 * - **The canonical and `og:url` agree, both are absolute, and no two pages claim the same URL.**
 * - **The card image is the size the tags say it is.** An unfurler crops or letterboxes a card whose
 *   real dimensions disagree with `og:image:width`, silently and differently in each product.
 * - **`robots.txt` names the sitemap**, and everything the head references exists in the build.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const OUT = 'dist/client'
const BASE = process.env.DEPLOY_BASE ?? '/'

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

/** Every prerendered page, as a path relative to the site root — `''` for the landing page. */
function prerenderedPages() {
  const pages = []
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory())
        walk(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)
      else if (entry.name === 'index.html') pages.push(prefix)
    }
  }
  walk(OUT, '')
  return pages.sort()
}

const all = (haystack, pattern) =>
  [...haystack.matchAll(pattern)].map((m) => m[1])
const meta = (head, attribute, value) =>
  all(
    head,
    new RegExp(`<meta[^>]*${attribute}="${value}"[^>]*content="([^"]*)"`, 'g'),
  )

/** The path a URL points at below the deployed base — `/design-system/login/` and `login/` both give `login/`. */
function relativePathFrom(url) {
  const { pathname } = new URL(url)
  check(
    pathname.startsWith(BASE),
    `${url} is not below the deployed base ${BASE}`,
  )
  return pathname.slice(BASE.length)
}

const pages = prerenderedPages()
check(
  pages.length > 0,
  `No prerendered pages under ${OUT}/ — build with DEPLOY_BASE set`,
)

const claimed = new Map()

for (const page of pages) {
  const file = `${OUT}/${page}index.html`
  const head = readFileSync(file, 'utf8').split('</head>')[0]

  const titles = all(head, /<title[^>]*>([\s\S]*?)<\/title>/g)
  const descriptions = meta(head, 'name', 'description')
  const canonical = all(head, /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/g)
  const ogUrls = meta(head, 'property', 'og:url')
  const ogImages = meta(head, 'property', 'og:image')

  for (const [label, values] of [
    ['title', titles],
    ['description', descriptions],
    ['canonical', canonical],
    ['og:url', ogUrls],
    ['og:image', ogImages],
  ]) {
    check(
      values.length === 1,
      `${page || '/'} has ${values.length} ${label} tags, expected 1`,
    )
    check(Boolean(values[0]?.trim()), `${page || '/'} has an empty ${label}`)
  }

  const url = canonical[0]
  if (url) {
    check(
      url.startsWith('https://'),
      `${page || '/'} canonical is not absolute: ${url}`,
    )
    check(
      url === ogUrls[0],
      `${page || '/'} canonical and og:url disagree: ${url} vs ${ogUrls[0]}`,
    )
    const claimedBy = claimed.get(url)
    check(
      !claimedBy,
      `${page || '/'} and ${claimedBy} both claim ${url} as canonical`,
    )
    claimed.set(url, page || '/')

    // The canonical a page offers has to be the address the page is actually served at.
    check(
      relativePathFrom(url) === page,
      `${page || '/'} canonical points at ${url}, which is not its own address`,
    )
  }

  // The card has to exist, and be the size the tags promise.
  const image = ogImages[0]
  if (image) {
    const path = relativePathFrom(image)
    check(
      existsSync(`${OUT}/${path}`),
      `${page || '/'} og:image ${image} is not in the build`,
    )
    if (path.endsWith('.png')) {
      const png = readFileSync(`${OUT}/${path}`)
      const width = png.readUInt32BE(16)
      const height = png.readUInt32BE(20)
      check(
        String(width) === meta(head, 'property', 'og:image:width')[0] &&
          String(height) === meta(head, 'property', 'og:image:height')[0],
        `${page || '/'} og.png is ${width}×${height}, but the tags say ${meta(head, 'property', 'og:image:width')[0]}×${meta(head, 'property', 'og:image:height')[0]}`,
      )
    }
  }

  for (const href of all(
    head,
    /<link[^>]*rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g,
  )) {
    check(
      existsSync(`${OUT}/${relativePathFrom(new URL(href, 'https://x').href)}`),
      `${page || '/'} references ${href}, which is not in the build`,
    )
  }
}

// --- the sitemap and robots, checked in both directions -----------------------------
/**
 * Pages the deploy assembles rather than the app prerendering: Storybook, which the Pages workflow
 * copies in after `vp build`. It belongs in the sitemap — it is this site's documentation — but there
 * is no `index.html` behind it under `dist/client` while this runs, so it is declared here rather
 * than found. Anything else unexpected in the sitemap still fails.
 */
const ASSEMBLED_BY_DEPLOY = ['storybook/']

const sitemapPath = `${OUT}/sitemap.xml`
check(existsSync(sitemapPath), 'sitemap.xml is missing from the build')
if (existsSync(sitemapPath)) {
  const locs = all(readFileSync(sitemapPath, 'utf8'), /<loc>([^<]+)<\/loc>/g)
  check(locs.length > 0, 'sitemap.xml lists no pages')

  for (const loc of locs) {
    check(loc.startsWith('https://'), `sitemap entry is not absolute: ${loc}`)
  }

  const listed = locs.map(relativePathFrom)
  const expected = [...pages, ...ASSEMBLED_BY_DEPLOY]
  const missing = pages.filter((page) => !listed.includes(page))
  const unexpected = listed.filter((page) => !expected.includes(page))

  check(missing.length === 0, `sitemap.xml is missing: ${missing.join(', ')}`)
  check(
    unexpected.length === 0,
    `sitemap.xml lists pages that are not served: ${unexpected.join(', ')}`,
  )
}

check(existsSync(`${OUT}/robots.txt`), 'robots.txt is missing from the build')
if (existsSync(`${OUT}/robots.txt`)) {
  const robots = readFileSync(`${OUT}/robots.txt`, 'utf8')
  check(
    /^Sitemap:\s*https:\/\/\S+$/m.test(robots),
    'robots.txt does not name an absolute sitemap URL',
  )
}

// --- the report --------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`SEO check failed (${failures.length}):`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log(
  `SEO check passed: ${pages.length} page${pages.length === 1 ? '' : 's'} (${pages.map((p) => p || '/').join(', ')}), one title/canonical/og:url each, sitemap and robots agree.`,
)
