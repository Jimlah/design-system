/**
 * The leads board's data, and the arithmetic over it.
 *
 * **Every number the page shows is computed from this file, which is what makes the page an
 * example rather than a picture of one.** The stat cards count the rows the table is drawing, and
 * each card's sparkline and its percentage come from the *same* series — so the arrow can never
 * contradict the line beside it. The tabs filter the same array the table renders. Nothing here
 * touches the DOM, so all of it is asserted as arithmetic in `DashboardEmail.browser.test.tsx`
 * rather than through a browser.
 *
 * The split follows `board.ts`'s: what a filter keeps, what a score is made of, and what the
 * header adds up to are this page's own rules, and they are the part that should not need a mouse
 * to test. What is left in `DashboardEmail.tsx` is the part that genuinely needs a DOM — React
 * Aria's collections, its focus handling, and the morph between the three sizes of the lead card.
 */

/** The six states a lead moves through, in the order the pipeline visits them. */
export type LeadStatus =
  | 'New'
  | 'Open'
  | 'In progress'
  | 'Qualified'
  | 'Pending'
  | 'Hot'

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  status: LeadStatus
  /** The person who owns the lead. `ME` is the signed-in user, so "Assigned to me" can mean it. */
  manager: string
  source: string
  /** Out of ten. The table draws it as ten segments and an `n/10` pill. */
  score: number
  /** ISO, so "overdue" is a comparison rather than a string shape. Formatted by `formatDay`. */
  created: string
  /** ISO. */
  due: string
  phone: string
  location: string
  /** The close rate on this lead, as a percentage. */
  rate: number
  /** On the Favourite view. A field rather than a second array, so one row cannot live in two lists. */
  favourite: boolean
}

/** The signed-in user. One name, so "Assigned to me" and the sidebar footer cannot disagree. */
export const ME = 'Aiden Hudson'

/**
 * Twelve leads, the shape of a small pipeline.
 *
 * **The two dates are ISO and the display form is derived**, which is the one thing here that looks
 * like more work than it is: a `Dec 08, 2025` string cannot be compared, and the Overdue tab and
 * the lead's Due field are both comparisons. One source of truth, two readings.
 */
export const LEADS: Lead[] = [
  {
    id: 'lead-01',
    name: 'Jake Thompson',
    company: 'Nordicsoft',
    email: 'jt@nordicsoft.io',
    status: 'Hot',
    manager: 'Jacob Müller',
    source: 'Website',
    score: 9,
    created: '2026-10-08',
    due: '2027-05-30',
    phone: '(555) 123-0401',
    location: 'New York, NY',
    rate: 6.2,
    favourite: true,
  },
  {
    id: 'lead-02',
    name: 'Ethan Wilson',
    company: 'Travel Ventures',
    email: 'ethan@travelventures.com',
    status: 'Open',
    manager: 'Olivia Davis',
    source: 'LinkedIn',
    score: 4,
    created: '2026-10-07',
    due: '2026-11-18',
    phone: '(555) 214-8890',
    location: 'Austin, TX',
    rate: 3.4,
    favourite: false,
  },
  {
    id: 'lead-03',
    name: 'Isabella Hernandez',
    company: 'Design Studios',
    email: 'isabella@designstudios.net',
    status: 'New',
    manager: 'Liam Johnson',
    source: 'X',
    score: 4,
    created: '2026-10-06',
    due: '2027-01-02',
    phone: '(555) 330-1177',
    location: 'Portland, OR',
    rate: 2.8,
    favourite: false,
  },
  {
    id: 'lead-04',
    name: 'William Lee',
    company: 'AI Dynamics',
    email: 'w.lee@aidynamics.com',
    status: 'Hot',
    manager: 'James Smith',
    source: 'Facebook',
    score: 7,
    created: '2026-10-05',
    due: '2026-09-11',
    phone: '(555) 908-4412',
    location: 'San Jose, CA',
    rate: 7.5,
    favourite: true,
  },
  {
    id: 'lead-05',
    name: 'Sophia Martinez',
    company: 'EcoTech Solutions',
    email: 'sophia@ecotech.io',
    status: 'Qualified',
    manager: 'Olivia Davis',
    source: 'Instagram',
    score: 6,
    created: '2026-10-04',
    due: '2026-10-02',
    phone: '(555) 771-2093',
    location: 'Denver, CO',
    rate: 5.1,
    favourite: false,
  },
  {
    id: 'lead-06',
    name: 'Ava Clark',
    company: 'Smart Homes Inc.',
    email: 'ava@smarthomes.com',
    status: 'In progress',
    manager: 'Noah Garcia',
    source: 'Website',
    score: 3,
    created: '2026-10-03',
    due: '2026-12-30',
    phone: '(555) 662-3348',
    location: 'Seattle, WA',
    rate: 1.9,
    favourite: false,
  },
  {
    id: 'lead-07',
    name: 'Lily Walker',
    company: 'Foodie Connect',
    email: 'walker@foodieconnect.com',
    status: 'New',
    manager: 'Zoe Lewis',
    source: 'Instagram',
    score: 6,
    created: '2026-10-02',
    due: '2027-05-14',
    phone: '(555) 118-7756',
    location: 'Chicago, IL',
    rate: 4.6,
    favourite: false,
  },
  {
    id: 'lead-08',
    name: 'James Young',
    company: 'Fashion Trends',
    email: 'jyoung@fashiontrends.com',
    status: 'Pending',
    manager: 'Olivia Hall',
    source: 'LinkedIn',
    score: 4,
    created: '2026-10-01',
    due: '2026-10-05',
    phone: '(555) 449-6620',
    location: 'Miami, FL',
    rate: 2.2,
    favourite: false,
  },
  {
    id: 'lead-09',
    name: 'Mason Allen',
    company: 'Virtual Reality Co.',
    email: 'mason@vrco.io',
    status: 'Qualified',
    manager: 'Emily King',
    source: 'Facebook',
    score: 8,
    created: '2026-09-30',
    due: '2027-04-02',
    phone: '(555) 502-9918',
    location: 'Boston, MA',
    rate: 8.3,
    favourite: true,
  },
  {
    id: 'lead-10',
    name: 'Jack Robinson',
    company: 'Gaming Hub',
    email: 'jack@gaminghub.gg',
    status: 'New',
    manager: 'Mia Brown',
    source: 'X',
    score: 4,
    created: '2026-09-29',
    due: '2027-06-21',
    phone: '(555) 887-1204',
    location: 'Las Vegas, NV',
    rate: 3.1,
    favourite: false,
  },
  {
    id: 'lead-11',
    name: 'David Ramirez',
    company: 'InnoGate Logistics',
    email: 'd.ramirez@innogate.com',
    status: 'New',
    manager: 'Mia Brown',
    source: 'X',
    score: 4,
    created: '2026-09-28',
    due: '2027-05-08',
    phone: '(555) 623-4471',
    location: 'Atlanta, GA',
    rate: 2.5,
    favourite: false,
  },
  {
    id: 'lead-12',
    name: 'Chloe Bennett',
    company: 'Northwind Retail',
    email: 'chloe@northwind.co',
    status: 'In progress',
    manager: 'Jacob Müller',
    source: 'Website',
    score: 6,
    created: '2026-09-27',
    due: '2026-11-09',
    phone: '(555) 291-8830',
    location: 'Minneapolis, MN',
    rate: 4.9,
    favourite: false,
  },
]

/** The tabs above the table. `id` is what the route and the tests speak in. */
export const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'favourite', label: 'Favourite' },
  { id: 'new', label: 'New' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'hot', label: 'Hot' },
] as const

export type ViewId = (typeof VIEWS)[number]['id']

/**
 * Whether a lead is past its due date.
 *
 * The comparison is on the ISO strings, which sort lexicographically exactly as they sort in time,
 * so there is no date parsing here to get wrong. `today` is a parameter rather than
 * `new Date()` for the same reason `TaskBoard` takes one: a page whose Overdue count
 * changes at midnight is a page no test can hold still.
 */
export function isOverdue(lead: Lead, today: string) {
  return lead.due < today
}

/**
 * The rows a view keeps, in order.
 *
 * A filter narrows the screen and nothing else: it never reorders the rows, so switching tabs does
 * not move a lead that is in both. The header's count is `leadsInView(...).length`, which is why
 * the tab labels above the title can never disagree with the table.
 */
export function leadsInView(
  leads: Lead[],
  view: ViewId,
  today: string,
): Lead[] {
  switch (view) {
    case 'favourite':
      return leads.filter((lead) => lead.favourite)
    case 'new':
      return leads.filter((lead) => lead.status === 'New')
    case 'assigned':
      return leads.filter((lead) => lead.manager === ME)
    case 'overdue':
      return leads.filter((lead) => isOverdue(lead, today))
    case 'hot':
      return leads.filter((lead) => lead.status === 'Hot')
    default:
      return leads
  }
}

/** Case-insensitive over everything a person would type to find a row. */
export function matchesQuery(lead: Lead, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    lead.name.toLowerCase().includes(needle) ||
    lead.company.toLowerCase().includes(needle) ||
    lead.email.toLowerCase().includes(needle) ||
    lead.manager.toLowerCase().includes(needle)
  )
}

/** The two filters above the table compose, and this is the one place they meet. */
export function visibleLeads(
  leads: Lead[],
  view: ViewId,
  query: string,
  today: string,
) {
  return leadsInView(leads, view, today).filter((lead) =>
    matchesQuery(lead, query),
  )
}

/* ---------------------------------------------------------------------------
   The score
   ------------------------------------------------------------------------ */

/** How many segments the score meter is drawn with. The pill beside it says `n/10`. */
export const SCORE_SEGMENTS = 10

/**
 * What a segment's position means, which is **not** the same as what the score is.
 *
 * The ramp runs cool-to-hot across the *meter*, not across the value: segment 1 is always the
 * leftmost and always reads as danger, whether or not it is lit. That is what makes two rows'
 * meters comparable at a glance — the colour says where on the scale a segment sits, and the count
 * of lit segments says how far along the row got. Colouring by value instead would make a 3/10 row
 * and a 7/10 row's first three segments different colours, and the columns would stop lining up.
 */
export function segmentTone(
  index: number,
): 'destructive' | 'warning' | 'success' {
  if (index < 3) return 'destructive'
  if (index < 7) return 'warning'
  return 'success'
}

/** Is segment `index` lit? */
export function segmentLit(score: number, index: number) {
  return index < Math.round(score)
}

/** The pill's text. */
export function scoreLabel(score: number) {
  return Math.round(score) + '/' + SCORE_SEGMENTS
}

/* ---------------------------------------------------------------------------
   The header
   ------------------------------------------------------------------------ */

export interface Stat {
  id: string
  label: string
  /** The headline figure, always a count over the rows the table is drawing. */
  value: number
  /** The series the sparkline draws, oldest first. */
  series: number[]
  /** Percent change across `series`, rounded to one decimal. Derived, never typed. */
  delta: number
  /** The direction the arrow points. */
  up: boolean
}

/**
 * What a series says it did, as a percentage.
 *
 * **The sparkline and the arrow read the same array**, so a line that falls can never be drawn
 * beside an arrow that climbs. The first value is the baseline; a series that starts at zero has no
 * percentage to report and says 0 rather than dividing by it.
 */
export function seriesDelta(series: number[]) {
  const first = series[0]
  const last = series[series.length - 1]
  if (!first) return 0
  return Math.round(((last - first) / first) * 1000) / 10
}

/**
 * The four cards above the table.
 *
 * The headline figures are counts over `leads` — so the numbers move when the data does, and
 * the page cannot show a total its own table disagrees with. The series are fixtures: history is
 * not in the table, and inventing it from twelve rows would be the same lie told with more code.
 */
export function leadStats(leads: Lead[]): Stat[] {
  const count = (status: LeadStatus) =>
    leads.filter((lead) => lead.status === status).length

  const series: Record<string, number[]> = {
    new: [31, 34, 33, 36, 35, 38, 37, 40, 39, 42],
    qualified: [15, 16, 15, 17, 16, 18, 17, 18, 19, 18],
    response: [2.6, 2.4, 2.5, 2.2, 2.3, 2.1, 2.0, 1.9, 1.85, 1.8],
    hot: [11, 10, 11, 9, 10, 9, 10, 8, 9, 9],
  }

  const cards: Omit<Stat, 'delta' | 'up'>[] = [
    { id: 'new', label: 'New Leads', value: count('New'), series: series.new },
    {
      id: 'qualified',
      label: 'Qualified Leads',
      value: count('Qualified'),
      series: series.qualified,
    },
    {
      id: 'response',
      label: 'In Play',
      value: count('In progress') + count('Pending'),
      series: series.response,
    },
    { id: 'hot', label: 'Hot Leads', value: count('Hot'), series: series.hot },
  ]

  return cards.map((card) => {
    const delta = seriesDelta(card.series)
    return { ...card, delta, up: delta >= 0 }
  })
}

/** `+12%`, `+4.2%`, `-2%` — the sign is always drawn, because an arrow is not the only cue. */
export function formatDelta(delta: number) {
  const sign = delta > 0 ? '+' : ''
  return sign + (Number.isInteger(delta) ? delta : delta.toFixed(1)) + '%'
}

/* ---------------------------------------------------------------------------
   Dates
   ------------------------------------------------------------------------ */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * `2025-12-08` as `Dec 08, 2025`.
 *
 * **Written out rather than handed to `Intl`**, and that is a server-render decision: the page
 * is prerendered, and a formatter whose output depends on the ICU build behind it is a hydration
 * mismatch waiting for a different machine. Six lines of arithmetic cannot drift.
 */
export function formatDay(iso: string) {
  const [year, month, day] = iso.split('-')
  return MONTHS[Number(month) - 1] + ' ' + day + ', ' + year
}

/* ---------------------------------------------------------------------------
   The sidebar
   ------------------------------------------------------------------------ */

export interface NavLeaf {
  id: string
  label: string
  /** The mark beside it: a coloured square for a workspace, nothing for a plain destination. */
  tone?: 'primary' | 'warning' | 'success'
  count?: number
}

export interface NavBranch {
  id: string
  label: string
  items: NavLeaf[]
}

/**
 * The sidebar's tree, as data.
 *
 * `Nav` draws it, so the levels, the counts and the current row all come from React Aria's own
 * navigation tree rather than from hand-written indentation.
 */
export const NAV_BRANCHES: NavBranch[] = [
  {
    id: 'sales',
    label: 'Sales operations',
    items: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'leads', label: 'Leads' },
      { id: 'orders', label: 'Orders' },
      { id: 'customers', label: 'Customers' },
      { id: 'messages', label: 'Messages', count: 4 },
    ],
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    items: [
      { id: 'sales-ws', label: 'Sales', tone: 'primary' },
      { id: 'account', label: 'Account Management', tone: 'warning' },
      { id: 'support-ws', label: 'Support & Success', tone: 'success' },
      { id: 'productivity', label: 'Productivity' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { id: 'feedback', label: 'Feedback', count: 1 },
      { id: 'help', label: 'Help Center' },
      { id: 'settings', label: 'Settings' },
    ],
  },
]

/** The teammates beside the "Share access" button. Four faces and a remainder. */
export const TEAMMATES = [
  'Jacob Müller',
  'Olivia Davis',
  'Liam Johnson',
  'James Smith',
]

/**
 * The three tabs of the lead card.
 *
 * Only `info` has a body: Notes and Deals are the tabs the design draws and this page has no
 * data for, so they say so rather than inventing a list.
 */
export const LEAD_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'notes', label: 'Notes' },
  { id: 'deals', label: 'Deals' },
] as const

/**
 * The lead card's "…" menu, in the three groups the reference draws.
 *
 * **The reference's `Assign manager` carries a submenu and this one does not.** A chevron that opens
 * nothing is worse than no chevron, and this system has no styled submenu to open — so the item is a
 * plain action and the arrow is gone, which is the honest half of the reference rather than both.
 */
export const LEAD_ACTIONS: {
  group: string
  items: { id: string; label: string }[]
}[] = [
  {
    group: 'pipeline',
    items: [
      { id: 'qualify', label: 'Mark as qualified' },
      { id: 'pipeline', label: 'Add to pipeline' },
    ],
  },
  {
    group: 'record',
    items: [
      { id: 'priority', label: 'Set priority' },
      { id: 'status', label: 'Edit status' },
      { id: 'manager', label: 'Assign manager' },
    ],
  },
  { group: 'close', items: [{ id: 'archive', label: 'Archive lead' }] },
]

/** The people "Assign manager" can hand a lead to. */
export const MANAGERS = [
  'Jacob Müller',
  'Olivia Davis',
  'Liam Johnson',
  'James Smith',
  'Noah Garcia',
  'Zoe Lewis',
]

/** The four things the selection bar can do, in the order the reference draws them. */
export const SELECTION_ACTIONS = [
  { id: 'edit', label: 'Edit' },
  { id: 'assign', label: 'Assign to' },
  { id: 'delete', label: 'Delete' },
] as const
