import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The page body lives in src/components/Home.tsx rather than here so it can be
// imported by its story. Exporting it from this route file instead would stop
// TanStack Router from code-splitting the route, and Storybook's components
// manifest also needs it to be imported from a non-route module.
import { Home } from '../components/Home'

export const Route = createFileRoute('/')({
  // The landing page is the site, so it takes the site's own defaults: `Pulse` and its tagline as a
  // title, and the description every other page falls back to.
  head: () => pageHead(),
  component: Home,
})
