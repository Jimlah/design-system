import { createFileRoute } from '@tanstack/react-router'

// The body lives in src/components/Login.tsx for the same two reasons the landing page's does: a
// route file with extra exports cannot be code-split, and Storybook's components manifest can only
// resolve a component that is imported from a non-route module.
import { Login } from '../components/Login'

export const Route = createFileRoute('/login')({ component: Login })
