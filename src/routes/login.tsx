import { createFileRoute } from '@tanstack/react-router'

// The body lives in src/examples/Login.tsx: a route file with extra exports cannot be code-split, and
// the page belongs with the examples rather than with the library's components.
import { Login } from '../examples/Login'

export const Route = createFileRoute('/login')({ component: Login })
