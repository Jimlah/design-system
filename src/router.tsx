import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    // **Where the app is mounted, read from Vite's own `base`.** Pages serves this at
    // `/design-system/`, and without this the client router would treat that prefix as a route it
    // does not have. Trailing slash off, because the router wants `/design-system` — and at the root
    // the value is `/`, which is exactly where it already was.
    basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
