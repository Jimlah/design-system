/**
 * Every page in this repo that is an *example* rather than a component, in one list.
 *
 * **A worked example is not an API, which is why none of them has a story.** The rule in
 * `AGENTS.md` is that a story is what publishes a page into the components manifest this project's
 * MCP tools serve, and a page published there would be advertised as part of the library's API. So
 * the examples live outside Storybook, and until now the only way to find one was to already know its
 * address — the landing page linked two of them from a toolbar, which is not an index and does not
 * scale past the third.
 *
 * This is that index. It is data rather than markup for the same reason `leads.ts` is: the list is the
 * kind of thing that goes stale quietly, so `Examples.browser.test.tsx` walks it and checks that every
 * entry it names is a route the app actually serves.
 */

export interface Example {
  /** The route's path, below the deploy base. Also the key. */
  path: string
  title: string
  /** One sentence: what a reader sees, not what they learn. */
  summary: string
  /** What it is worth reading for. */
  shows: string[]
}

export const EXAMPLES: Example[] = [
  {
    path: 'canvas',
    title: 'Component canvas',
    summary:
      'Every component in the library on one plane you can pan and zoom, grouped by kind and laid out as one-prop-at-a-time comparisons.',
    shows: ['every component in the library'],
  },
  {
    path: 'dashboard-email',
    title: 'Leads dashboard',
    summary:
      'A sales page: a workspace sidebar, four headline figures, and a table of leads that opens a row into a card and the card into the full record.',
    shows: ['Table', 'Tabs', 'Nav', 'Modal', 'Menu', 'Sparkline', 'Avatar'],
  },
  {
    path: 'assistant',
    title: 'Assistant',
    summary:
      'A conversation streamed into these components, with one tool whose result is drawn as a chart and a row of chips, and a panel that decides where the requests go.',
    shows: ['BarChart', 'TagGroup', 'Sheet', 'TextArea', 'Skeleton'],
  },
  {
    path: 'board',
    title: 'Task board',
    summary:
      'Four columns of cards dragged between them, with a sheet for the detail behind each one.',
    shows: ['GridList', 'Sheet', 'DatePicker', 'Select', 'TagGroup', 'Toast'],
  },
  {
    path: 'create',
    title: 'Theme builder',
    summary:
      'Pick a base colour, an accent hue, a corner and a typeface, and watch the real components repaint around you.',
    shows: ['ColorField', 'ColorSwatchPicker', 'Select', 'TextField'],
  },
  {
    path: 'login',
    title: 'Sign in',
    summary:
      'One form, doing the whole job: two fields, a validation message each, and a button that says it is working.',
    shows: ['Form', 'TextField', 'Checkbox', 'Button'],
  },
  {
    path: '',
    title: 'The landing page',
    summary:
      'Every component in the library with its stories, used at length rather than lined up in boxes.',
    shows: ['all 42 components'],
  },
]
