import { createFileRoute } from '@tanstack/react-router'

// The page body lives in src/components/Home.tsx rather than here so it can be
// imported by its story. Exporting it from this route file instead would stop
// TanStack Router from code-splitting the route, and Storybook's components
// manifest also needs it to be imported from a non-route module.
import { Home } from '../components/Home'

export const Route = createFileRoute('/')({ component: Home })
