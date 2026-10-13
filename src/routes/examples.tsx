import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/Examples.tsx, like every other worked example here: a route file
// with extra exports cannot be code-split.
import { Examples } from '../examples/Examples'

export const Route = createFileRoute('/examples')({
  // The index of the worked examples, and a page a search should land on: someone looking for what
  // this design system looks like doing a real job is looking for exactly this.
  head: () =>
    pageHead({
      title: 'Examples',
      path: 'examples',
      description:
        'Pages built out of this design system, each doing one job end to end: a leads dashboard, a task board, a theme builder and a sign-in page.',
    }),
  component: Examples,
})
