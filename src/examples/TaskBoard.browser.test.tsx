import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { TaskBoard } from './TaskBoard'
import type { TaskBoardProps } from './TaskBoard'
import {
  COLUMNS,
  SEED_TASKS,
  boardStats,
  copyOf,
  decodeBoard,
  dueLabel,
  encodeBoard,
  fetchBoard,
  footAnchor,
  matchesFilter,
  newTask,
  nextTaskId,
  stepDrop,
  tasksInColumn,
} from './board'
import type { BoardFilter } from './board'

/**
 * The task board example's own tests, in Vitest's browser mode rather than as a story.
 *
 * The page is an example — it shows the components doing a job and is published nowhere — so it gets a
 * browser test, like the sign-in page and the theme builder. What is held to account is the split the
 * page is built on: **the board's arithmetic is tested as arithmetic, and only the part that needs a
 * DOM is driven through one.** A drop handler is not something a test can simulate, so what a drop
 * *means* lives in `board.ts` and is asserted directly; the interactions asserted here are the ones a
 * person's events can actually reach — the menu, the sheet and its date picker, the composer, the
 * filter, the load.
 *
 * The board's data is React Aria's `useAsyncList`, so every render below starts with a fetch: the
 * helper waits for the board rather than assuming it, which is also the first thing one test asserts.
 *
 * The real drag is the one thing in this file that is **not** asserted, and the reason is recorded in
 * `docs/board.md`: `userEvent` cannot drive React Aria's drag, so a real mouse drag was run in a browser
 * against the same handlers, and the outcome is what that doc records.
 */

/** A fixed day, so '3d late' is a fact of the fixture rather than of the calendar. */
const TODAY = '2026-10-12'

/** The board with no memory, which is what every test but the persistence ones wants. */
const board = () => (
  <TaskBoard initialTasks={SEED_TASKS} today={TODAY} storageKey={null} />
)

/** The board once its list has arrived — which every render now waits for. */
async function renderBoard(props: Partial<TaskBoardProps> = {}) {
  const screen = await render(
    <TaskBoard
      initialTasks={SEED_TASKS}
      today={TODAY}
      storageKey={null}
      {...props}
    />,
  )
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[role=grid]')).toHaveLength(4)
  })
  return screen
}

const filter = (over: Partial<BoardFilter> = {}): BoardFilter => ({
  query: '',
  assignee: 'all',
  priority: 'all',
  tag: 'all',
  ...over,
})

function columnGrid(name: string): HTMLElement {
  const grid = [...document.querySelectorAll('[role=grid]')].find(
    (node) => node.getAttribute('aria-label') === name,
  )
  if (grid === undefined) throw new Error('No grid named ' + name)
  return grid as HTMLElement
}

function rowFor(id: string): HTMLElement {
  const row = [...document.querySelectorAll('[role=row]')].find((node) =>
    node.textContent.includes(id),
  )
  if (row === undefined) throw new Error('No row for ' + id)
  return row as HTMLElement
}

/** The cards of a column that are selected right now. */
function selectedIn(column: string): HTMLElement[] {
  return [
    ...columnGrid(column).querySelectorAll<HTMLElement>('[role=row]'),
  ].filter((row) => row.getAttribute('aria-selected') === 'true')
}

test('the board is fetched: what this browser stored, or the sprint it starts with', async () => {
  // The load is a real async boundary with no server behind it, so the two things worth holding it to
  // are that it reads what is there and that it does not fall over what is not.
  const signal = new AbortController().signal
  const stored = SEED_TASKS.map((task) =>
    task.id === 'PL-1043' ? { ...task, column: 'done' as const } : task,
  )
  const key = 'pulse.test.fetch'
  window.localStorage.setItem(key, encodeBoard(stored))

  const loaded = await fetchBoard(signal, key, SEED_TASKS)
  expect(loaded.find((task) => task.id === 'PL-1043')?.column).toBe('done')

  // Nothing stored, nothing remembered, or nothing readable: the sprint the page starts with.
  window.localStorage.setItem(key, 'not a board')
  expect(await fetchBoard(signal, key, SEED_TASKS)).toEqual(SEED_TASKS)
  expect(await fetchBoard(signal, null, SEED_TASKS)).toEqual(SEED_TASKS)

  // And an abandoned request does not wait out the beat it was asked for.
  const abandoned = new AbortController()
  abandoned.abort()
  const started = Date.now()
  await fetchBoard(abandoned.signal, null, SEED_TASKS)
  expect(Date.now() - started).toBeLessThan(150)
})

test('a drop names a card, and the foot of a column names one too', () => {
  // A drop against a card is the card — React Aria reports the side as well, and the list moves by key.
  // A drop into a column's own space has no card, so it names that column's last one...
  expect(footAnchor(SEED_TASKS, 'review')).toBe('PL-1051')
  // ...and an empty column names the board's last card, which is the same place in the order. **This is
  // the assertion that would have caught a card being undraggable into an empty column**: asked with the
  // empty column's own list there is nothing to name, and this returns null, which the board refuses.
  const emptied = SEED_TASKS.filter((task) => task.column !== 'review')
  expect(footAnchor(emptied, 'review')).toBe('PL-1054')
  expect(footAnchor(emptied, 'review')).toBe(emptied[emptied.length - 1]?.id)
  // An empty board has nothing to land against, and that is the one drop with nowhere to go.
  expect(footAnchor([], 'review')).toBeNull()
  expect(tasksInColumn(SEED_TASKS, 'backlog')).toHaveLength(4)

  // **A step is the drag's twin inside a column, and its ends are null rather than a move.** "Up" and
  // "down" name the card to land against, which is the same before/after a drop reports — so the menu
  // and the pointer take exactly the same path through the list.
  expect(stepDrop(SEED_TASKS, 'PL-1041', 'up')).toBeNull()
  expect(stepDrop(SEED_TASKS, 'PL-1041', 'down')).toEqual({
    anchor: 'PL-1042',
    side: 'after',
  })
  expect(stepDrop(SEED_TASKS, 'PL-1043', 'up')).toEqual({
    anchor: 'PL-1042',
    side: 'before',
  })
  expect(stepDrop(SEED_TASKS, 'PL-1044', 'down')).toBeNull()
  // The ends are per column, not per board: the first card of the *last* column can still move up...
  expect(stepDrop(SEED_TASKS, 'PL-1052', 'up')).toBeNull()
  expect(stepDrop(SEED_TASKS, 'PL-1053', 'up')).not.toBeNull()
  // ...and the last card of a column is the last one in it, not the last one on the board.
  expect(stepDrop(SEED_TASKS, 'PL-1051', 'down')).toBeNull()
  expect(stepDrop(SEED_TASKS, 'PL-1054', 'down')).toBeNull()
  expect(stepDrop(SEED_TASKS, 'PL-9999', 'up')).toBeNull()

  // What the board makes when something new arrives: the next number nobody is using, the defaults a
  // card added at the foot of a column should carry, and a copy that can be told from its original.
  expect(nextTaskId(SEED_TASKS)).toBe('PL-1055')
  const added = newTask(SEED_TASKS, 'backlog', '  Trimmed  ')
  expect(added.id).toBe('PL-1055')
  expect(added.title).toBe('Trimmed')
  expect(added.column).toBe('backlog')
  expect(added.priority).toBe('normal')
  expect(added.subtasks).toEqual({ done: 0, total: 0 })
  const original = SEED_TASKS[0]
  expect(copyOf(original, 'PL-1056').title).toBe(
    'Retire the legacy metrics shipper (copy)',
  )
  expect(copyOf(original, 'PL-1056').id).toBe('PL-1056')
})

test('a stored board is read back, and anything unreadable is not', () => {
  // A board written down and read back: the order is the order it was saved in.
  const stored = [SEED_TASKS[2], SEED_TASKS[0]]
  const restored = decodeBoard(encodeBoard(stored))
  expect(restored?.map((task) => task.id)).toEqual(['PL-1043', 'PL-1041'])

  // A payload that is not a board at all is no board: the page seeds rather than opening empty.
  expect(decodeBoard('{')).toBeNull()
  expect(decodeBoard('null')).toBeNull()
  expect(decodeBoard('{"tasks":"nope"}')).toBeNull()
  expect(decodeBoard(null)).toBeNull()

  // A task in a column that does not exist is dropped rather than rendered nowhere, a second task
  // whose id was already seen is dropped rather than shadowing the first, and a missing field takes
  // the default a new task would have had.
  const salvaged = decodeBoard(
    JSON.stringify({
      tasks: [
        { id: 'PL-1', title: 'Kept', column: 'backlog' },
        { id: 'PL-2', title: 'Gone', column: 'nowhere' },
        { id: 'PL-1', title: 'Shadow', column: 'done' },
        { title: 'No id', column: 'done' },
      ],
    }),
  )
  expect(salvaged?.map((task) => task.title)).toEqual(['Kept'])
  expect(salvaged?.[0]?.priority).toBe('normal')
  expect(salvaged?.[0]?.subtasks).toEqual({ done: 0, total: 0 })
})

test('a filter narrows the screen without moving the board', () => {
  const hidden = filter({ assignee: 'ada' })
  const incident = SEED_TASKS[2]

  // PL-1041 is Dara's, and the drop that would land beside it is still computed against the column
  // rather than against the rows on screen — which is the whole reason a filter may hide a card.
  expect(matchesFilter(SEED_TASKS[0], hidden)).toBe(false)
  expect(footAnchor(SEED_TASKS, 'backlog')).toBe('PL-1044')

  // The query reaches the id, the title, the description and the tags, because a search box that
  // only reads titles is a search box that lies about what it searched.
  expect(matchesFilter(incident, filter({ query: 'latency' }))).toBe(true)
  expect(matchesFilter(incident, filter({ query: 'PL-1043' }))).toBe(true)
  expect(matchesFilter(incident, filter({ query: 'incident' }))).toBe(true)
  expect(matchesFilter(incident, filter({ query: 'nothing' }))).toBe(false)
  expect(matchesFilter(incident, filter({ tag: 'cost' }))).toBe(false)
})

test('the summary counts what is late, what is over its limit, and what a new id would be', () => {
  const stats = boardStats(SEED_TASKS, TODAY)
  expect(stats.total).toBe(14)
  expect(stats.open).toBe(11)
  expect(stats.done).toBe(3)
  // PL-1043 and PL-1051 are past their date and still open; PL-1048 is due today, which is not late.
  expect(stats.late).toBe(2)
  // Nothing is over a limit in the seed, and a limit is policed against the column it belongs to:
  // moving one more card into review is what takes its three past the three it allows.
  expect(stats.overLimit).toEqual([])
  const crowded = SEED_TASKS.map((task) =>
    task.id === 'PL-1041' ? { ...task, column: 'review' as const } : task,
  )
  expect(boardStats(crowded, TODAY).overLimit).toEqual(['review'])

  // The same day said three ways: late, today, and one far enough out to be written as a date.
  expect(dueLabel('2026-10-09', TODAY)).toEqual({
    text: '3d late',
    late: true,
    soon: false,
  })
  expect(dueLabel('2026-10-12', TODAY)).toEqual({
    text: 'Today',
    late: false,
    soon: true,
  })
  expect(dueLabel('2026-10-14', TODAY).text).toBe('In 2d')
  expect(dueLabel('2026-11-03', TODAY).text).toBe('11/03')
})

test('the board arrives: a loading state first, and then the sprint', async () => {
  const screen = await render(board())

  // The list starts empty and loading, and the page says so rather than drawing an empty sprint —
  // which is the whole reason the data layer is the library's list and not an array that is there
  // from the first render.
  // Named by its own label, which is the accessible name React Aria wires from the slot — an
  // `aria-label` beside a `Label` is the fallback, not the name.
  const loading = screen.getByRole('progressbar', {
    name: /loading the sprint/i,
  })
  await expect.element(loading).toBeVisible()
  expect(document.querySelectorAll('[role=grid]')).toHaveLength(0)

  await vi.waitFor(() => {
    expect(document.querySelectorAll('[role=grid]')).toHaveLength(4)
  })
  // The loading state leaves with the board: the progressbar is gone, and only the sprint's own
  // remaining bar is left.
  expect(loading.query()).toBeNull()
  await expect
    .element(screen.getByText('Retire the legacy metrics shipper'))
    .toBeVisible()
})

test('the board is four labelled columns of cards', async () => {
  const screen = await renderBoard()

  // One grid per column, named by the column, because a collection nobody can name is a collection
  // a screen reader announces as nothing in particular.
  for (const column of COLUMNS) {
    await expect
      .element(screen.getByRole('grid', { name: column.title }))
      .toBeVisible()
  }
  expect(document.querySelectorAll('[role=grid]')).toHaveLength(4)

  // A card is a row, named by its id and its title, in the column's own order.
  const backlog = tasksInColumn(SEED_TASKS, 'backlog')
  const rows = [...columnGrid('Backlog').querySelectorAll('[role=row]')]
  expect(rows).toHaveLength(backlog.length)
  expect(rows[0]?.textContent.includes(backlog[0].id)).toBe(true)

  // The column says how many it holds, and how many it is allowed. The seed is under every limit,
  // so this is the quiet reading rather than the warning.
  await expect
    .element(screen.getByRole('heading', { name: 'In progress' }))
    .toBeVisible()
  expect(columnGrid('In progress').getAttribute('aria-label')).toBe(
    'In progress',
  )
  expect(
    document.getElementById('column-progress')?.parentElement?.textContent,
  ).toContain('4 / 4')
})

test("a card's menu moves it, and the board says so", async () => {
  const screen = await renderBoard()

  // The menu is the board's keyboard path to a move: a drag needs a pointer or a drag session, and
  // this needs neither. It goes through the same list move a drop does, at the foot of the column
  // the menu names.
  await screen.getByRole('button', { name: 'Actions for PL-1041' }).click()
  await screen.getByRole('menuitem', { name: 'In review' }).click()

  await expect
    .element(screen.getByText('PL-1041 moved to In review.'))
    .toBeVisible()
  await vi.waitFor(() => {
    expect(columnGrid('In review').textContent).toContain('PL-1041')
  })

  // The claim is the card being *gone* from where it was and *there* where it went. A menu that
  // reports a move without making one is exactly the trap TagGroup's remove button fell into.
  expect(columnGrid('Backlog').textContent).not.toContain('PL-1041')
  expect(tasksInColumn(SEED_TASKS, 'backlog')).toHaveLength(4)
})

test('the menu moves a card one place inside its own column', async () => {
  const screen = await renderBoard()

  // The first card has nothing above it, and the menu says so rather than moving it nowhere. This is
  // the path that works when a drag cannot: a same-column drop in the middle of a card is dead in
  // React Aria, and this is the board's answer to it.
  await screen.getByRole('button', { name: 'Actions for PL-1041' }).click()
  await expect
    .element(screen.getByRole('menuitem', { name: 'Move up' }))
    .toBeDisabled()
  await expect
    .element(screen.getByRole('menuitem', { name: 'Move down' }))
    .not.toBeDisabled()
  await screen.getByRole('menuitem', { name: 'Move down' }).click()

  // It reordered rather than moved, and the board says which it was.
  await expect
    .element(screen.getByText('PL-1041 moved within Backlog.'))
    .toBeVisible()
  await vi.waitFor(() => {
    expect(
      [...columnGrid('Backlog').querySelectorAll('[role=row]')].map(
        (row) => row.textContent.match(/PL-\d+/)?.[0],
      ),
    ).toEqual(['PL-1042', 'PL-1041', 'PL-1043', 'PL-1044'])
  })
  // Nothing left the column, and no other column heard about it.
  expect(tasksInColumn(SEED_TASKS, 'backlog')).toHaveLength(4)
  expect(columnGrid('In progress').textContent).not.toContain('PL-1041')
})

test('the sheet edits a card, and the card wears the change', async () => {
  const screen = await renderBoard()

  await screen.getByRole('button', { name: 'Open PL-1041' }).click()
  await expect
    .element(screen.getByRole('dialog', { name: 'PL-1041' }))
    .toBeVisible()

  // The field is reached by its label, which is the whole reason the field anatomy exists.
  await screen.getByLabelText('Title').fill('Retire the metrics shipper')
  // Through userEvent rather than a hit-testing click: the sheet slides in, and a click that waits
  // for the element to stop moving loses that race on a loaded machine.
  await userEvent.click(screen.getByRole('button', { name: 'Save' }).element())

  await expect.element(screen.getByText('PL-1041 saved.')).toBeVisible()
  await expect
    .element(screen.getByText('Retire the metrics shipper'))
    .toBeVisible()
  await vi.waitFor(() => {
    expect(screen.getByRole('dialog', { name: 'PL-1041' }).query()).toBeNull()
  })

  // **The card is the surface, so a change that was never saved leaves it alone.** The draft is a
  // copy of the task; the sheet is only the way in to editing it.
  await screen.getByRole('button', { name: 'Open PL-1042' }).click()
  await expect
    .element(screen.getByRole('dialog', { name: 'PL-1042' }))
    .toBeVisible()
  await screen.getByLabelText('Title').fill('Never saved')
  // **Dismissed with Escape rather than by clicking the footer's Cancel, which is a flaky click and
  // was one.** The panel scrolls — eight fields do not fit a 96-wide sheet at this height — so the
  // footer is below the fold, and a hit-testing click waits for an element that is out of the viewport
  // and still moving as the panel slides in. Escape is the dismissal a keyboard would use anyway, and
  // the claim is about the draft: a change nobody saved leaves the card alone.
  await userEvent.keyboard('{Escape}')
  await expect
    .element(screen.getByText('Alert routing rules for the on-call rota'))
    .toBeVisible()
  expect(document.body.textContent).not.toContain('Never saved')
})

test('the due date is a date picker, and what it picks is what the card wears', async () => {
  const screen = await renderBoard()

  // PL-1042 is due 2026-10-20, so the calendar opens on a month this test can name whatever the day
  // it actually runs on — the value pins it, not the clock.
  await screen.getByRole('button', { name: 'Open PL-1042' }).click()
  await expect
    .element(screen.getByRole('dialog', { name: 'PL-1042' }))
    .toBeVisible()

  // The field's own caret, named by the component. A picker is the one field a person can use without
  // knowing what this locale's date format is.
  // userEvent again, for the same reason as the Save press: the caret lives inside a panel that is
  // still sliding in, and a hit-testing click waits for that element to stop moving.
  await userEvent.click(
    screen.getByRole('button', { name: /calendar/i }).element(),
  )
  await vi.waitFor(() => {
    expect(
      screen.getByRole('heading', { name: /october 2026/i }).query(),
    ).not.toBeNull()
  })

  // Days are named by their whole date, and choosing one writes back into the field.
  await userEvent.click(
    screen.getByRole('button', { name: /october 15, 2026/i }).element(),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Save' }).element())

  await expect.element(screen.getByText('PL-1042 saved.')).toBeVisible()
  // 2026-10-15 against a board whose today is 2026-10-12: three days out, and the card says so.
  await vi.waitFor(() => {
    expect(rowFor('PL-1042').textContent).toContain('In 3d')
  })
})

test('the composer adds a card to its own column', async () => {
  const screen = await renderBoard()

  await screen
    .getByRole('textbox', { name: 'New task in Backlog' })
    .fill('Write the board up')
  await screen.getByRole('button', { name: 'Add to Backlog' }).click()

  await expect
    .element(screen.getByText('PL-1055 added to Backlog.'))
    .toBeVisible()
  await vi.waitFor(() => {
    expect(columnGrid('Backlog').textContent).toContain('Write the board up')
  })
  expect(columnGrid('In progress').textContent).not.toContain(
    'Write the board up',
  )

  // An empty field adds nothing, and says so by not offering the press at all.
  await expect
    .element(screen.getByRole('button', { name: 'Add to Backlog' }))
    .toBeDisabled()
})

test('the filter hides cards without emptying their columns', async () => {
  const screen = await renderBoard()

  await screen.getByRole('searchbox', { name: 'Search tasks' }).fill('latency')
  await vi.waitFor(() => {
    expect(columnGrid('Backlog').textContent).not.toContain('Retire the legacy')
  })
  expect(columnGrid('Backlog').textContent).toContain('Query latency spike')
  // The column still holds four, and says so: the filter narrowed the screen, not the board.
  expect(
    document.getElementById('column-backlog')?.parentElement?.textContent,
  ).toContain('1 of 4')

  await screen.getByRole('searchbox', { name: 'Search tasks' }).fill('')
  await vi.waitFor(() => {
    expect(columnGrid('Backlog').textContent).toContain('Retire the legacy')
  })
})

test('the board reads a stored board and writes down what changes', async () => {
  const key = 'pulse.test.board'
  const stored = SEED_TASKS.map((task) =>
    task.id === 'PL-1043' ? { ...task, column: 'done' as const } : task,
  )
  window.localStorage.setItem(key, encodeBoard(stored))

  const screen = await renderBoard({ storageKey: key })

  // What the browser had is what opens, not the seed: the read is the list's own load.
  expect(columnGrid('Done').textContent).toContain('PL-1043')
  expect(columnGrid('Backlog').textContent).not.toContain('PL-1043')

  // ...and the next change is written back, so the board a reader returns to is the one they left.
  await screen.getByRole('button', { name: 'Actions for PL-1041' }).click()
  await screen.getByRole('menuitem', { name: 'Done' }).click()
  await vi.waitFor(() => {
    const written = decodeBoard(window.localStorage.getItem(key))
    expect(written?.find((task) => task.id === 'PL-1041')?.column).toBe('done')
  })
})

test('a stored payload that is not a board opens the sprint instead of an empty page', async () => {
  const key = 'pulse.test.garbage'
  window.localStorage.setItem(key, 'this is not json')

  const screen = await renderBoard({ storageKey: key })
  await expect
    .element(screen.getByText('Retire the legacy metrics shipper'))
    .toBeVisible()
  expect(document.querySelectorAll('[role=row]')).toHaveLength(14)
})

test('every draggable card offers the drag button a keyboard needs', async () => {
  await renderBoard()

  // **React Aria warns, in the console, that a draggable collection must contain one of these.** It
  // is the only way in for a keyboard or a screen reader, and it is deliberately untouchable by a
  // pointer — the row is what a mouse drags — so what a test can hold it to is that it is there, and
  // named, and reachable by focus without a pointer anywhere near it.
  const grip = rowFor('PL-1041').querySelector<HTMLElement>('[slot=drag]')
  expect(grip).not.toBeNull()
  expect(grip?.getAttribute('aria-label')).toMatch(/^Drag PL-1041/)
  expect(getComputedStyle(grip as HTMLElement).pointerEvents).toBe('none')

  grip?.focus()
  expect(document.activeElement).toBe(grip)
})

test('cards are selected by clicking them, and a column by the select-all gesture', async () => {
  const screen = await renderBoard()

  // **A click toggles, and that is the whole of the pointer story.** Shift and a click does not extend
  // a range here — React Aria 1.22 has no shift-click range on a collection, which the two measured
  // rows below are: the ones clicked, and nothing between them. A run is built by clicking each card,
  // which is what the page's own footer says.
  await userEvent.click(screen.getByRole('row', { name: /PL-1041/ }).element())
  await userEvent.click(screen.getByRole('row', { name: /PL-1043/ }).element())
  await vi.waitFor(() => {
    expect(
      selectedIn('Backlog').map((row) => row.textContent.slice(0, 7)),
    ).toEqual(['PL-1041', 'PL-1043'])
  })

  // ...and the whole column, by the platform's select-all gesture. Both modifiers are sent, because
  // the claim here is about the board rather than about which key this machine's platform uses.
  await userEvent.keyboard('{Control>}a{/Control}')
  await userEvent.keyboard('{Meta>}a{/Meta}')
  await vi.waitFor(() => expect(selectedIn('Backlog')).toHaveLength(4))

  // The selection is the column's own: a grid list does not reach into its neighbours.
  expect(selectedIn('In progress')).toHaveLength(0)
})

test('a run is extended by holding Shift and walking the column', async () => {
  const screen = await renderBoard()

  // The keyboard half of the same idea, and the one place a range really is a range: the arrows move
  // the focused card, and Shift takes the span between where it started and where it is now.
  await userEvent.click(screen.getByRole('row', { name: /PL-1041/ }).element())
  await vi.waitFor(() => expect(selectedIn('Backlog')).toHaveLength(1))

  await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
  await vi.waitFor(() => {
    expect(
      selectedIn('Backlog').map((row) => row.textContent.slice(0, 7)),
    ).toEqual(['PL-1041', 'PL-1042', 'PL-1043'])
  })
})

test('a card carries the design system, not a row with text in it', async () => {
  const screen = await renderBoard()

  const card = rowFor('PL-1043')
  // Priority, tags, assignee, due date and subtask progress are all on the card, and every one of
  // them is the component the library publishes for that job rather than a coloured span.
  expect(card.textContent).toContain('PL-1043')
  expect(card.textContent).toContain('Urgent')
  expect(card.textContent).toContain('#incident')
  expect(card.textContent).toContain('1d late')
  expect(card.textContent).toContain('2/3')
  expect(card.querySelector('[role=img]')).not.toBeNull()
  expect(card.querySelector('[role=progressbar]')).not.toBeNull()

  // The panel is the library's: a card is one of the sheet's surfaces, with its own background and
  // its hairline, rather than the page's.
  const background = getComputedStyle(card).backgroundColor
  expect(background).not.toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(card).borderTopWidth).toBe('1px')
  await expect
    .element(screen.getByRole('button', { name: 'Actions for PL-1043' }))
    .toBeVisible()
})

test('undo puts a moved card back where it came from', async () => {
  const screen = await renderBoard()

  await screen.getByRole('button', { name: 'Actions for PL-1042' }).click()
  await screen.getByRole('menuitem', { name: 'Done' }).click()
  await expect.element(screen.getByText('PL-1042 moved to Done.')).toBeVisible()
  await vi.waitFor(() => {
    expect(columnGrid('Done').textContent).toContain('PL-1042')
  })

  // Undo is not a second way of setting the items: it puts the board back where the list reads from
  // and fetches it again, which is the same path the page took to open — so it is waited for, not
  // read on the next line.
  await screen.getByRole('button', { name: 'Undo' }).click()
  await expect.element(screen.getByText('Undone.')).toBeVisible()
  await vi.waitFor(() => {
    expect(columnGrid('Backlog').textContent).toContain('PL-1042')
  })
  expect(columnGrid('Done').textContent).not.toContain('PL-1042')
})

test('the arrow keys move between the cards of a column', async () => {
  await renderBoard()

  const first = rowFor('PL-1041')
  first.focus()
  expect(document.activeElement).toBe(first)

  await userEvent.keyboard('{ArrowDown}')
  await vi.waitFor(() => {
    const focused = document.activeElement as HTMLElement | null
    expect(focused?.textContent ?? '').toContain('PL-1042')
  })
})
