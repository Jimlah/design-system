import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/DashboardEmail.tsx, like the sign-in page, the theme builder and the
// task board: a route file with extra exports cannot be code-split, and this page is a worked example
// of the components being used rather than one of them.
import { DashboardEmail } from '../examples/DashboardEmail'

export const Route = createFileRoute('/dashboard-email')({
  // A page of its own, and indexed as one: someone looking for what these components look like doing
  // a real job is looking for exactly this.
  head: () =>
    pageHead({
      title: 'Leads dashboard',
      path: 'dashboard-email',
      description:
        'A sales dashboard built from this design system: a workspace sidebar, headline figures with sparklines, a filterable leads table, and a lead that opens out of its row into a card and then into the full record.',
    }),
  component: DashboardEmail,
})
