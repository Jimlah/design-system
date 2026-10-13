import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Examples } from './Examples'
import { EXAMPLES } from './exampleList'

/**
 * The examples index's own test.
 *
 * **What this page can get wrong is drifting out of step with the pages it lists**, and that is what is
 * asserted: every entry has a unique path and a real summary and a link built from `BASE_URL`, and the
 * page draws one card per entry. Whether a path is a route the app serves is not something this file
 * can answer — that is the router's, and `npm run seo` checks the deployed pages against the sitemap
 * for exactly that. This holds the list itself to account.
 */
test('every example is listed once, with somewhere to go', async () => {
  await render(<Examples />)
  await vi.waitFor(() => {
    expect(
      document.querySelectorAll('[data-slot="example-card"]'),
    ).toHaveLength(EXAMPLES.length)
  })

  const paths = EXAMPLES.map((example) => example.path)
  expect(new Set(paths).size).toBe(paths.length)

  for (const example of EXAMPLES) {
    expect(example.title.length).toBeGreaterThan(0)
    expect(example.summary.length).toBeGreaterThan(20)
    expect(example.shows.length).toBeGreaterThan(0)
    // The entry that names a page with no path is the landing page, and its address is the root.
    expect(example.path).not.toMatch(/^\//)
  }

  // **Every link is built from BASE_URL**, because on Pages this whole app is mounted under a
  // repository subpath and a link written "/board/" would leave the site.
  const hrefs = [
    ...document.querySelectorAll<HTMLAnchorElement>('a[href]'),
  ].map((anchor) => anchor.getAttribute('href') ?? '')
  for (const path of paths) {
    expect(hrefs).toContain(import.meta.env.BASE_URL + (path ? path + '/' : ''))
  }

  // The page this session's work added is on the list, and so is every other worked example.
  expect(paths).toContain('dashboard-email')
  expect(paths).toContain('board')
  expect(paths).toContain('create')
  expect(paths).toContain('login')
})
