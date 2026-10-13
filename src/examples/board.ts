/**
 * The task board's model: the columns, the people, and the tasks, plus every operation the board
 * performs on them as a pure function.
 *
 * **Why the state is not in the component.** A board is one of the few places where the interesting
 * behaviour is arithmetic rather than interaction — what "drop this card between those two" *means*,
 * which cards a filter keeps, whether a column is over its limit — and arithmetic can be tested
 * directly, in the browser, with no drag to simulate. Everything below is a plain function over
 * `Task[]`, so the page keeps the part that genuinely needs a DOM (React Aria's collection and its
 * focus handling) and nothing else.
 *
 * Task order **is** array order: the tasks in a column are the tasks in that column in the order they
 * appear in the array. Reordering is a splice, which is the whole reason a drop target is expressed as
 * "before this id, or at the end".
 */

/** A column of the board. `wip` is the limit the column is policed against, or none. */
export const COLUMNS = [
  { id: 'backlog', title: 'Backlog', note: 'Unplanned work', wip: null },
  { id: 'progress', title: 'In progress', note: 'Being worked on', wip: 4 },
  { id: 'review', title: 'In review', note: 'Waiting on a reviewer', wip: 3 },
  { id: 'done', title: 'Done', note: 'Shipped this cycle', wip: null },
] as const

export type Column = (typeof COLUMNS)[number]
export type ColumnId = Column['id']

/** How urgent a task is. The order here is the order the filter offers them in, most urgent first. */
export const PRIORITIES = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Low' },
] as const

export type Priority = (typeof PRIORITIES)[number]['id']

/** Everyone a task can be assigned to. */
export const MEMBERS = [
  { id: 'ada', name: 'Ada Okonkwo', role: 'Platform' },
  { id: 'bo', name: 'Bo Lindqvist', role: 'Design' },
  { id: 'chen', name: 'Chen Wei', role: 'Data' },
  { id: 'dara', name: 'Dara Nwosu', role: 'Reliability' },
  { id: 'elif', name: 'Elif Kaya', role: 'Frontend' },
] as const

export type Member = (typeof MEMBERS)[number]
export type MemberId = Member['id']

export interface Task {
  /** Stable across edits and moves — the whole board keys off this. */
  id: string
  title: string
  description: string
  column: ColumnId
  priority: Priority
  tags: string[]
  /** A member id, or unassigned. */
  assignee: MemberId | null
  /** An ISO `YYYY-MM-DD` date, or none. Kept as a string so the board needs no time zone. */
  due: string | null
  points: number
  comments: number
  /** Subtasks finished and subtasks total, for the card's own progress bar. */
  subtasks: { done: number; total: number }
}

/** A date the board can point at without a clock of its own, overridable so tests stay stable. */
export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/** How many days `iso` is from `today`: negative is late, 0 is today, 1 is tomorrow. */
export function daysUntil(iso: string, today: string): number {
  const from = Date.parse(`${today}T00:00:00Z`)
  const to = Date.parse(`${iso}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

/**
 * A due date as a person would say it. `late` and `soon` are what the card colours itself by, so the
 * text and the treatment can never disagree about whether a date has passed.
 */
export function dueLabel(
  iso: string,
  today: string,
): { text: string; late: boolean; soon: boolean } {
  const days = daysUntil(iso, today)
  if (days === 0) return { text: 'Today', late: false, soon: true }
  if (days === 1) return { text: 'Tomorrow', late: false, soon: true }
  if (days < 0) {
    const late = Math.abs(days)
    return { text: `${late}d late`, late: true, soon: false }
  }
  if (days <= 7) return { text: `In ${days}d`, late: false, soon: false }
  return { text: iso.slice(5).replace('-', '/'), late: false, soon: false }
}

export function columnOf(id: ColumnId): Column {
  return COLUMNS.find((column) => column.id === id) ?? COLUMNS[0]
}

export function memberOf(id: MemberId | null): Member | null {
  return MEMBERS.find((member) => member.id === id) ?? null
}

/** The tasks in one column, in board order. */
export function tasksInColumn(tasks: Task[], column: ColumnId): Task[] {
  return tasks.filter((task) => task.column === column)
}

/**
 * The card a drop at the **foot of a column** goes after, or `null` when there is nothing to go after.
 *
 * A drop into a column's own space has no card to name, so it is expressed as "after the last card of
 * that column" — and when the column is empty, after the last card of the *board*, which is the same
 * place in the order the board renders. **It is a key rather than an index on purpose**: an index is a
 * position on screen, so it would land in the wrong place the moment a filter hid the card in between,
 * and the list the board is built on moves cards by key.
 */
/**
 * A drop, as the card it lands against and which side of it — the board's whole vocabulary for *where*.
 *
 * A drop is *not* an index, and that is the point: an index is a position on screen, so a filter that
 * hides one card would move the drop out from under the pointer, while a key survives it. The list the
 * board is built on moves cards by key, so this is also the shape it takes.
 */
export interface Drop {
  anchor: string | null
  side: 'before' | 'after'
}

/**
 * Where a card goes when it is moved **one place up or down inside its own column** — the keyboard and
 * menu twin of the drag, which React Aria cannot reach across a card's middle (see docs/board.md).
 *
 * `null` when the card is already at that end, which is also how a menu item knows to disable itself:
 * "up" against the first card and "down" against the last are not moves, they are the absence of one.
 */
export function stepDrop(
  tasks: Task[],
  id: string,
  direction: 'up' | 'down',
): Drop | null {
  const task = tasks.find((entry) => entry.id === id)
  if (task === undefined) return null
  const inColumn = tasksInColumn(tasks, task.column)
  const position = inColumn.findIndex((entry) => entry.id === id)
  if (position === -1) return null
  if (direction === 'up') {
    return position === 0
      ? null
      : { anchor: inColumn[position - 1].id, side: 'before' }
  }
  return position >= inColumn.length - 1
    ? null
    : { anchor: inColumn[position + 1].id, side: 'after' }
}
export function footAnchor(tasks: Task[], column: ColumnId): string | null {
  const inColumn = tasksInColumn(tasks, column)
  if (inColumn.length > 0) return inColumn[inColumn.length - 1]?.id ?? null
  return tasks[tasks.length - 1]?.id ?? null
}

/** The highest task number in use, so a new task never collides with one already on the board. */
export function nextTaskId(tasks: Task[]): string {
  const highest = tasks.reduce((max, task) => {
    const number = Number.parseInt(task.id.replace(/^\D+/, ''), 10)
    return Number.isNaN(number) ? max : Math.max(max, number)
  }, 1000)
  return `PL-${highest + 1}`
}

/**
 * A new task in a column, with the defaults a card added at the foot of a column should carry.
 *
 * **It builds the task and stops there.** The board it goes on is React Aria's `useAsyncList`, whose
 * `insertAfter`/`append` are what put it there — the same split as everywhere else in this file: the
 * decisions are here, the order is the list's.
 */
export function newTask(
  tasks: Task[],
  column: ColumnId,
  title: string,
  id: string = nextTaskId(tasks),
): Task {
  return {
    id,
    title: title.trim(),
    description: '',
    column,
    priority: 'normal',
    tags: [],
    assignee: null,
    due: null,
    points: 1,
    comments: 0,
    subtasks: { done: 0, total: 0 },
  }
}

/** A copy of a task, with a fresh id, named so the original and the copy can be told apart. */
export function copyOf(task: Task, id: string): Task {
  return { ...task, id, title: `${task.title} (copy)` }
}

/** How long the board's load takes. A beat, so the loading state is something a reader can see. */
export const LOAD_MS = 220

/**
 * The board as a fetch would return it: what this browser stored, or the sprint the page starts with.
 *
 * **This is the `load` function of the board's `useAsyncList`, and it is a real async boundary even
 * though there is no server.** What the page needs from its data is what a request gives it — something
 * that arrives later, can be re-fetched, and has a state in between — so the board is built on that
 * shape from the start, and an application that later points it at an API changes this function and
 * nothing else. The beat is deliberate for the same reason: a fetch that resolves in the same tick has
 * no loading state to render, and this page renders one.
 */
export async function fetchBoard(
  signal: AbortSignal,
  storageKey: string | null,
  fallback: Task[],
): Promise<Task[]> {
  await beat(signal, LOAD_MS)
  if (storageKey === null) return fallback
  return decodeBoard(window.localStorage.getItem(storageKey)) ?? fallback
}

/** Waits, unless the request is abandoned first — which is what a signal is for. */
function beat(signal: AbortSignal, ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, ms)
    signal.addEventListener('abort', finish, { once: true })
  })
}

/** What the board is filtered by. `all` is every value that is not chosen. */
export interface BoardFilter {
  query: string
  assignee: MemberId | 'all'
  priority: Priority | 'all'
  /** A tag, or `'all'` for every tag. The sentinel is inside `string` on purpose: it is the id of the
   * select's "every tag" option, and a second type for it would be a union whose second member is a
   * string that already exists. */
  tag: string
}

export const EMPTY_FILTER: BoardFilter = {
  query: '',
  assignee: 'all',
  priority: 'all',
  tag: 'all',
}

export function isFiltered(filter: BoardFilter): boolean {
  return (
    filter.query.trim() !== '' ||
    filter.assignee !== 'all' ||
    filter.priority !== 'all' ||
    filter.tag !== 'all'
  )
}

/**
 * Whether a task survives the filter.
 *
 * **A filter narrows what is on screen; it never empties a column of the board's state.** The card a
 * filter hides is still there, still in its column, and still where a drop will leave it — the
 * alternative, moving hidden cards around to match what is visible, is how a filter silently
 * rearranges work.
 */
export function matchesFilter(task: Task, filter: BoardFilter): boolean {
  if (filter.assignee !== 'all' && task.assignee !== filter.assignee)
    return false
  if (filter.priority !== 'all' && task.priority !== filter.priority)
    return false
  if (filter.tag !== 'all' && !task.tags.includes(filter.tag)) return false
  const query = filter.query.trim().toLowerCase()
  if (query === '') return true
  const haystack = `${task.id} ${task.title} ${task.description} ${task.tags.join(' ')}`
  return haystack.toLowerCase().includes(query)
}

/** Every tag in use, so the filter offers what the board actually has rather than a fixed list. */
export function allTags(tasks: Task[]): string[] {
  return [...new Set(tasks.flatMap((task) => task.tags))].sort()
}

export interface BoardStats {
  total: number
  open: number
  done: number
  late: number
  byColumn: Record<ColumnId, number>
  overLimit: ColumnId[]
}

/**
 * The numbers the header shows. `late` counts open tasks past their due date, using the same
 * `daysUntil` the cards colour themselves by.
 */
export function boardStats(tasks: Task[], today: string): BoardStats {
  const count = (id: ColumnId) => tasksInColumn(tasks, id).length
  const byColumn = Object.fromEntries(
    COLUMNS.map((column) => [column.id, count(column.id)]),
  ) as Record<ColumnId, number>
  const done = count('done')
  const open = tasks.length - done
  const late = tasks.filter(
    (task) =>
      task.column !== 'done' &&
      task.due !== null &&
      daysUntil(task.due, today) < 0,
  ).length

  return {
    total: tasks.length,
    open,
    done,
    late,
    byColumn,
    overLimit: COLUMNS.filter(
      (column) => column.wip !== null && count(column.id) > column.wip,
    ).map((column) => column.id),
  }
}

/* ------------------------------------------------------------------------------------------------
 * Persistence
 *
 * The board is a page with no server behind it, so what it remembers it remembers in `localStorage`.
 * `decodeBoard` is written to trust nothing: what is in that key is whatever a previous version of
 * this page, another tab, or a person with devtools put there. Every field is checked, a task that
 * fails is dropped rather than half-loaded, and an unusable payload returns `null` so the caller
 * seeds a fresh board instead of starting empty.
 * ---------------------------------------------------------------------------------------------- */

export const STORAGE_KEY = 'pulse.task-board.v1'

export function encodeBoard(tasks: Task[]): string {
  return JSON.stringify({ version: 1, tasks })
}

const isColumn = (value: unknown): value is ColumnId =>
  COLUMNS.some((column) => column.id === value)

const isPriority = (value: unknown): value is Priority =>
  PRIORITIES.some((priority) => priority.id === value)

const isMember = (value: unknown): value is MemberId =>
  MEMBERS.some((member) => member.id === value)

function reviveTask(value: unknown): Task | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id === '') return null
  if (typeof raw.title !== 'string') return null
  if (!isColumn(raw.column)) return null
  const subtasks =
    typeof raw.subtasks === 'object' && raw.subtasks !== null
      ? (raw.subtasks as Record<string, unknown>)
      : {}
  const total =
    typeof subtasks.total === 'number' ? Math.max(0, subtasks.total) : 0
  const done =
    typeof subtasks.done === 'number' ? Math.max(0, subtasks.done) : 0
  return {
    id: raw.id,
    title: raw.title,
    description: typeof raw.description === 'string' ? raw.description : '',
    column: raw.column,
    priority: isPriority(raw.priority) ? raw.priority : 'normal',
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    assignee: isMember(raw.assignee) ? raw.assignee : null,
    due:
      typeof raw.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.due)
        ? raw.due
        : null,
    points: typeof raw.points === 'number' && raw.points > 0 ? raw.points : 1,
    comments:
      typeof raw.comments === 'number' && raw.comments >= 0 ? raw.comments : 0,
    subtasks: { done: Math.min(done, total), total },
  }
}

/** The board in a stored payload, or `null` if the payload cannot be read at all. */
export function decodeBoard(raw: string | null | undefined): Task[] | null {
  if (typeof raw !== 'string' || raw === '') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const tasks = (parsed as { tasks?: unknown }).tasks
  if (!Array.isArray(tasks)) return null

  const seen = new Set<string>()
  const revived: Task[] = []
  for (const value of tasks) {
    const task = reviveTask(value)
    // **A duplicate id is the one corruption a board cannot survive.** Every drop target, every
    // selected key and every edit is keyed by it, so the second one is dropped rather than merged.
    if (task && !seen.has(task.id)) {
      seen.add(task.id)
      revived.push(task)
    }
  }
  return revived
}

/**
 * The board this page opens with: one sprint's worth of work, four columns, five people, and enough
 * variety in priority, tags and due dates that every part of a card is doing something.
 */
export const SEED_TASKS: Task[] = [
  {
    id: 'PL-1041',
    title: 'Retire the legacy metrics shipper',
    description:
      'The old sidecar still runs on three hosts. Cut them over and delete the manifest.',
    column: 'backlog',
    priority: 'low',
    tags: ['infra', 'tech-debt'],
    assignee: 'dara',
    due: null,
    points: 5,
    comments: 2,
    subtasks: { done: 1, total: 6 },
  },
  {
    id: 'PL-1042',
    title: 'Alert routing rules for the on-call rota',
    description:
      'Page the right engineer: severity, service ownership, and quiet hours.',
    column: 'backlog',
    priority: 'high',
    tags: ['alerts', 'ops'],
    assignee: 'ada',
    due: '2026-10-20',
    points: 3,
    comments: 5,
    subtasks: { done: 0, total: 4 },
  },
  {
    id: 'PL-1043',
    title: 'Query latency spike after the 15:00 deploy',
    description:
      'p99 went from 180ms to 1.2s and stayed there. Suspect the new connection pool.',
    column: 'backlog',
    priority: 'urgent',
    tags: ['incident', 'data'],
    assignee: 'chen',
    due: '2026-10-11',
    points: 2,
    comments: 9,
    subtasks: { done: 2, total: 3 },
  },
  {
    id: 'PL-1044',
    title: 'Trim the retention window on raw events',
    description: 'Ninety days is not being read by anything after fourteen.',
    column: 'backlog',
    priority: 'normal',
    tags: ['cost'],
    assignee: null,
    due: null,
    points: 1,
    comments: 0,
    subtasks: { done: 0, total: 0 },
  },
  {
    id: 'PL-1045',
    title: 'Board: drag a card between columns',
    description:
      'Pointer drag and the keyboard path both, with the drop mark showing where it lands.',
    column: 'progress',
    priority: 'high',
    tags: ['frontend', 'board'],
    assignee: 'elif',
    due: '2026-10-13',
    points: 5,
    comments: 4,
    subtasks: { done: 4, total: 7 },
  },
  {
    id: 'PL-1046',
    title: 'Sampling rules on the ingest pipeline',
    description:
      'Keep the tail, drop the routine reads: 1 in 20 is still a full picture.',
    column: 'progress',
    priority: 'normal',
    tags: ['data'],
    assignee: 'chen',
    due: '2026-10-16',
    points: 3,
    comments: 1,
    subtasks: { done: 1, total: 5 },
  },
  {
    id: 'PL-1047',
    title: 'Dark theme audit across the dashboards',
    description: 'Four panels still paint their own greys instead of a token.',
    column: 'progress',
    priority: 'normal',
    tags: ['design', 'tokens'],
    assignee: 'bo',
    due: '2026-10-14',
    points: 2,
    comments: 3,
    subtasks: { done: 3, total: 4 },
  },
  {
    id: 'PL-1048',
    title: 'Rate limiter for the public status endpoint',
    description:
      'One scraper was 40% of last week traffic. 60 requests a minute per key.',
    column: 'progress',
    priority: 'high',
    tags: ['api', 'ops'],
    assignee: 'dara',
    due: '2026-10-12',
    points: 3,
    comments: 2,
    subtasks: { done: 0, total: 3 },
  },
  {
    id: 'PL-1049',
    title: 'Synthetic checks from three regions',
    description:
      'A monitor that only watches one network tells you about that network.',
    column: 'review',
    priority: 'high',
    tags: ['monitoring'],
    assignee: 'ada',
    due: '2026-10-13',
    points: 5,
    comments: 6,
    subtasks: { done: 5, total: 5 },
  },
  {
    id: 'PL-1050',
    title: 'Empty states for every list on the console',
    description:
      'A new account sees six blank panels and no idea whether that is right.',
    column: 'review',
    priority: 'normal',
    tags: ['design', 'frontend'],
    assignee: 'bo',
    due: '2026-10-15',
    points: 3,
    comments: 2,
    subtasks: { done: 2, total: 3 },
  },
  {
    id: 'PL-1051',
    title: 'Audit log retention for compliance',
    description: 'Read access to an audit log has to be provable for a year.',
    column: 'review',
    priority: 'urgent',
    tags: ['compliance', 'infra'],
    assignee: 'dara',
    due: '2026-10-10',
    points: 5,
    comments: 7,
    subtasks: { done: 4, total: 6 },
  },
  {
    id: 'PL-1052',
    title: 'Sparklines in the fleet table',
    description:
      'Forty rows of numbers, and the shape is what anyone actually reads.',
    column: 'done',
    priority: 'normal',
    tags: ['frontend', 'charts'],
    assignee: 'elif',
    due: '2026-10-09',
    points: 2,
    comments: 1,
    subtasks: { done: 3, total: 3 },
  },
  {
    id: 'PL-1053',
    title: 'Ship the token package to consumers',
    description:
      'One install, every utility resolves, no second block of values.',
    column: 'done',
    priority: 'high',
    tags: ['tokens', 'registry'],
    assignee: 'bo',
    due: '2026-10-08',
    points: 3,
    comments: 4,
    subtasks: { done: 5, total: 5 },
  },
  {
    id: 'PL-1054',
    title: 'Rotate the ingest certificates',
    description: 'Done a week early, before the expiry window opened.',
    column: 'done',
    priority: 'low',
    tags: ['infra'],
    assignee: 'ada',
    due: '2026-10-07',
    points: 1,
    comments: 0,
    subtasks: { done: 0, total: 0 },
  },
]
