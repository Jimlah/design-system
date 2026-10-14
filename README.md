Welcome to your new TanStack Start app!

# Storybook & Design System

This app hosts the design system, developed and documented with Storybook 10 using the
`@storybook/tanstack-react` framework.

```bash
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static build into storybook-static/
```

The Storybook **build** is also served by the app at <http://localhost:3000/storybook/>, in
`npm run dev` and in `vite preview` alike, so the component index on the Home page opens real
docs instead of linking back to `/`. That route serves `storybook-static/` — the last
`npm run build-storybook` — while `:6006` stays the live, always-current one. The dev server
itself cannot be mounted under a prefix: it hands its preview iframe a module graph of
root-absolute URLs, which would resolve against this app instead. See `storybookBuild()` in
`vite.config.ts`.

## Create a theme

`/create` is a theme builder for this system, in the shape of
[shadcn's](https://ui.shadcn.com/create): pick a base colour, an accent hue, a monospace family and a
`color-scheme`, watch the library's real components repaint, and copy the token block that results —
or the link that carries the theme. The rules it derives from, why it has no radius control, and the
two library defects building it surfaced are in [docs/create.md](./docs/create.md).

## A task board

`/board` is a worked example of the components doing one job end to end: four columns of cards you can
drag between them, each card a `GridList` row holding a sheet's worth of detail — priority, tags,
assignee, due date, subtask progress — with a sheet down the edge to edit it, a menu to move, copy or
delete it without a pointer, a filter, an undo, and local storage so the board is where you left it.

It is a page rather than a component, so it has no story and is not in the registry; its tests are the
`components` project's, like the sign-in page's. The board's data is React Aria's `useAsyncList` — a load
that arrives, a loading state, and list operations for every change — while the board's own decisions
live as plain functions in `src/examples/board.ts` and only the DOM in `src/examples/TaskBoard.tsx`. What
that split bought, what React Aria's drag and drop does and does not do in this shape, and the bugs each
of them cost are written up in [docs/board.md](./docs/board.md).

## Hosted: landing page and documentation

<https://jimlah.github.io/design-system/> is the same pair, published to GitHub Pages by
`.github/workflows/pages.yml` — the landing page at the root, the documentation at
`/design-system/storybook/`. No server is involved, so the app is built twice: normally it is
server-rendered, and with `DEPLOY_BASE` set (as the workflow sets it) the routes are **prerendered**
to real HTML and every URL is prefixed for the repository subpath. That one variable becomes Vite's
`base`, the router's `basepath` in `src/router.tsx`, and the prefix on the Home page's Storybook
links, which is why the subpath is written down once. Assemble and check a deploy locally with:

```bash
DEPLOY_BASE=/design-system/ npx vp build
npm run build-storybook
mkdir -p site && cp -R dist/client/. site/ && cp -R storybook-static site/storybook
cp dist/client/index.html site/404.html   # one route: unknown paths get this app, not GitHub's 404
```

Stories are colocated with their component as `*.stories.tsx` and are runnable as tests
with Vitest 5 + Playwright, through Vite+:

```bash
npm test
```

Shared configuration lives in `.storybook/`:

- `main.ts` — frameworks, addons, and `features.componentsManifest` (required by the MCP docs tools)
- `preview.tsx` — global setup; imports `src/styles.css` so stories get the app's real
  Tailwind styles. Put shared decorators and providers here rather than in individual stories.

TanStack Router ignores colocated stories under `src/routes` via `routeFileIgnorePattern`
in `tsr.config.json`.

## Storybook MCP server

`@storybook/addon-mcp` serves an MCP endpoint at `http://localhost:6006/mcp` while the
Storybook dev server runs. It is registered for project scope in `.mcp.json`,
`opencode.json`, `.vscode/mcp.json`, and `.cursor/mcp.json`. See `AGENTS.md` for the
agent instructions. To register another client:

```bash
npx mcp-add --name "design-system-sb-mcp" --type http --url "http://localhost:6006/mcp" --scope project
```

## Component registry

Every component is published as a [shadcn registry](https://ui.shadcn.com/docs/registry), so another
project installs it instead of copying it out of this one.

```bash
npx shadcn@latest registry add @pulse=https://jimlah.github.io/design-system/r/{name}.json
npx shadcn@latest add @pulse/button     # one component, and everything it imports
npx shadcn@latest add @pulse/text-field
npx shadcn@latest add @pulse/pulse      # the whole library: 57 components and the theme
npx shadcn@latest add @pulse/theme      # the tokens and Overpass Mono on their own
```

The same items install by address — the JSON the deployment serves, or the repository itself:

```bash
npx shadcn@latest add https://jimlah.github.io/design-system/r/button.json
npx shadcn@latest add Jimlah/design-system/button
```

`npm run dev` serves the catalogue at <http://localhost:3000/r/registry.json>, and every item beside
it. `registry.json` is generated — from the components, `src/styles.css` and `docs/components` —
and `public/r` is built from it. Rebuild both after changing a component:

```bash
npm run registry:build
```

See [docs/registry.md](./docs/registry.md) for the item design, what is generated, and the CLI
behaviour it is built around.

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting, formatting and types

The toolchain is [Vite+](https://viteplus.dev/) — one `vp` CLI over Vite, Vitest, Oxlint and
Oxfmt, all of it configured in `vite.config.ts`. ESLint and Prettier are gone: the rules they
used to run are carried over in that config's `lint` and `fmt` blocks, and the one rule this
project wrote itself is an Oxlint plugin in `lint-rules/` (see AGENTS.md).

```bash
npm run lint     # vp lint  — Oxlint
npm run format   # vp fmt . && vp lint --fix
npm run check    # vp check — Oxfmt, Oxlint and a type check in one pass
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
