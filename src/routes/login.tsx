import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/Login.tsx: a route file with extra exports cannot be code-split, and
// the page belongs with the examples rather than with the library's components.
import { Login } from '../examples/Login'

export const Route = createFileRoute('/login')({
  // The title says what the page is, and the description says what it demonstrates — because a
  // searcher looking for "react aria sign in form" is looking for exactly this, and the page is
  // indexed on its own rather than only as a corner of the landing page.
  head: () =>
    pageHead({
      title: 'Sign in',
      path: 'login',
      description:
        "An example sign-in page built from Pulse's own form components: labelled fields with hints and error slots, a form that validates on submit, and a button that reports its pending state.",
    }),
  component: Login,
})
