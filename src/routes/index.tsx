import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The landing page is this site's case for using the library, and it lives in src/examples/ rather
// than here for the reasons AGENTS.md gives: a route file with an extra export cannot be code-split,
// and a page that uses the library instead of documenting it is not a component — so it has no story,
// and it is not in the registry.
import { Pulse } from '../examples/Pulse'

export const Route = createFileRoute('/')({
  // The landing page is the site, so it takes the site's own defaults: `Pulse` and its tagline as the
  // title, and the description every other page falls back to.
  head: () => pageHead(),
  component: Pulse,
})
