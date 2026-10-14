import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { DashboardEmail } from './DashboardEmail'
import {
  LEADS,
  ME,
  SCORE_SEGMENTS,
  SELECTION_ACTIONS,
  formatDay,
  formatDelta,
  isOverdue,
  leadStats,
  leadsInView,
  matchesQuery,
  scoreLabel,
  segmentLit,
  segmentTone,
  seriesDelta,
  visibleLeads,
} from './leads'
import type { Lead } from './leads'

/**
 * The leads dashboard example's own tests, in Vitest's browser mode rather than as a story.
 *
 * The page is an example — it shows the components doing a job and is published nowhere — so it gets a
 * browser test, like the sign-in page, the theme builder and the task board. What is held to account
 * is the split the page is built on: **the board's arithmetic is tested as arithmetic, and only the
 * part that needs a DOM is driven through one.**
 *
 * Two things are deliberately *not* asserted, and both for the same reason — they are timing, and a
 * test that waits on a 480ms animation is a test that fails on a slow runner:
 *
 * - the size the card is at any moment *during* the morph. What is asserted is the two ends.
 * - the order the staggered contents arrive in. The stagger is a backwards-filled animation over a
 *   delay, so the end state is the element's own stylesheet state — which is what a reader ends up
 *   looking at.
 *
 * The day is fixed, so "overdue" is a fact of the fixture rather than of the calendar the suite runs
 * on.
 */

/** A fixed day, and the one the page's own default is written for. */
const TODAY = '2026-10-12'

const page = () => <DashboardEmail leads={LEADS} today={TODAY} />

/** The row a lead is on. The table is the only one on the page, so this is not ambiguous. */
function rowNamed(name: string): HTMLElement {
  const row = [...document.querySelectorAll<HTMLElement>('tbody tr')].find(
    (node) => node.textContent.includes(name),
  )
  if (row === undefined) throw new Error('No row for ' + name)
  return row
}

/** The card's own element. It is portalled, so it is not inside the render's container. */
const card = () =>
  document.querySelector<HTMLElement>('[data-slot="lead-card"]')

/**
 * The table's data rows.
 *
 * **Counted by their checkboxes rather than by their `tr`s**, and that is not a quirk of this
 * markup: React Aria renders `renderEmptyState` *inside* the body as a row, so a table with nothing
 * to show still has one `tr` in it. Counting `tr`s would make "no results" and "one result"
 * indistinguishable, which is a test that cannot fail on the thing it is about.
 */
const dataRows = () => document.querySelectorAll('tbody input[type="checkbox"]')

async function renderPage() {
  await render(page())
  await vi.waitFor(() => {
    expect(dataRows()).toHaveLength(LEADS.length)
  })
}

/**
 * Open one lead's card, the way a keyboard user does: focus the row, then act on it.
 *
 * **The row is the control, and this is the route to it that survives the harness.** React Aria fires a
 * row action on `Enter` and on a double click; a real Playwright mouse drives both, and both were
 * measured working against this page. `userEvent.dblClick` does not reach it reliably, and a test that
 * drives a synthetic event the component never receives is a test of the synthetic event — so this
 * takes the key, which lands on the same handler the double click reaches.
 *
 * The row's **menu** is not used here for the same reason: its `Open lead` item does call the same
 * code, but under `userEvent` the click that chooses it finishes after the dialog has mounted and the
 * modal reads it as an outside press. That does not reproduce with a real mouse — measured — and it is
 * recorded rather than papered over.
 */
async function openCard(name: string) {
  await renderPage()
  await userEvent.click(rowNamed(name))
  await userEvent.keyboard('{Enter}')
  await vi.waitFor(() => {
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })
}

/* ==========================================================================
   The arithmetic
   ========================================================================== */

test('a view keeps the rows it names, and does not reorder the rest', () => {
  // Every view is a predicate over the same array, so "in this view" is the same rows in the same order
  // the table already had them.
  expect(leadsInView(LEADS, 'all', TODAY)).toEqual(LEADS)
  expect(leadsInView(LEADS, 'hot', TODAY).map((lead) => lead.name)).toEqual([
    'Jake Thompson',
    'William Lee',
  ])
  expect(leadsInView(LEADS, 'favourite', TODAY)).toHaveLength(3)

  // **The one view that needs a date.** The overdue test compares ISO strings, which sort the way they
  // read, so three of the fixture's twelve are past their due date on the day the page is written for
  // — and those three are the whole of the Overdue tab.
  expect(leadsInView(LEADS, 'overdue', TODAY).map((lead) => lead.name)).toEqual(
    ['William Lee', 'Sophia Martinez', 'James Young'],
  )

  // A view nobody has leads in is empty rather than everything: "Assigned to me" is the signed-in user,
  // and no row of the fixture is theirs.
  expect(leadsInView(LEADS, 'assigned', TODAY)).toEqual([])
  expect(LEADS.filter((lead) => lead.manager === ME)).toEqual([])

  // Moving the day moves the answer, which is the whole reason it is a parameter. By June 2027 every
  // lead but one is past its date, and that one is still ahead.
  expect(isOverdue(LEADS[0], '2027-06-01')).toBe(true)
  expect(leadsInView(LEADS, 'overdue', '2027-06-01')).toHaveLength(
    LEADS.filter((lead) => lead.due < '2027-06-01').length,
  )
  expect(leadsInView(LEADS, 'overdue', '2027-06-01').length).toBeGreaterThan(
    leadsInView(LEADS, 'overdue', TODAY).length,
  )
})

test('the search and the view compose, rather than one replacing the other', () => {
  expect(matchesQuery(LEADS[0], '  NORDIC  ')).toBe(true)
  expect(matchesQuery(LEADS[0], 'nordicsoft.io')).toBe(true)
  expect(matchesQuery(LEADS[0], 'Jacob')).toBe(true)
  expect(matchesQuery(LEADS[0], '')).toBe(true)
  expect(matchesQuery(LEADS[0], 'zzz')).toBe(false)

  // Both filters at once. A search inside a view is a search inside that view, not the whole table.
  expect(
    visibleLeads(LEADS, 'new', 'walker', TODAY).map((l) => l.name),
  ).toEqual(['Lily Walker'])
  expect(visibleLeads(LEADS, 'hot', 'walker', TODAY)).toEqual([])
})

test('the arrow and the line are the same number', () => {
  // **This is the assertion the stat card is built around.** The percentage beside a sparkline is the
  // change across the array the sparkline draws, so a falling line cannot carry a rising arrow.
  expect(seriesDelta([15, 18])).toBe(20)
  expect(seriesDelta([2.6, 1.8])).toBe(-30.8)
  expect(seriesDelta([31, 42])).toBe(35.5)
  // A series starting at zero has no percentage to report rather than dividing by it.
  expect(seriesDelta([0, 5])).toBe(0)

  expect(formatDelta(12)).toBe('+12%')
  expect(formatDelta(4.25)).toBe('+4.3%')
  expect(formatDelta(-2)).toBe('-2%')
  expect(formatDelta(0)).toBe('0%')

  for (const stat of leadStats(LEADS)) {
    expect(stat.delta).toBe(seriesDelta(stat.series))
    expect(stat.up).toBe(stat.delta >= 0)
  }
})

test('the headline figures count the rows the table draws', () => {
  // **A stat that is not a count over the data is a stat that can disagree with the table beneath it.**
  // Four New leads in the header is four New rows in the body, or one of the two is lying.
  const stats = leadStats(LEADS)
  const countOf = (status: Lead['status']) =>
    LEADS.filter((lead) => lead.status === status).length
  const valueOf = (id: string) => stats.find((stat) => stat.id === id)?.value

  expect(valueOf('new')).toBe(countOf('New'))
  expect(valueOf('qualified')).toBe(countOf('Qualified'))
  expect(valueOf('hot')).toBe(countOf('Hot'))
  expect(valueOf('response')).toBe(countOf('In progress') + countOf('Pending'))
})

test('a score colours its segments by where they sit, not by the value', () => {
  // The ramp runs along the *meter*, so the first segment is the same colour on a 3/10 row and a 9/10
  // row. Colouring by value would make two rows' meters stop lining up down the column.
  expect([0, 1, 2].map(segmentTone)).toEqual([
    'destructive',
    'destructive',
    'destructive',
  ])
  expect([3, 6].map(segmentTone)).toEqual(['warning', 'warning'])
  expect([7, 9].map(segmentTone)).toEqual(['success', 'success'])

  expect(scoreLabel(9)).toBe('9/' + SCORE_SEGMENTS)
  expect(segmentLit(4, 3)).toBe(true)
  expect(segmentLit(4, 4)).toBe(false)

  // Every meter is drawn with the same ten segments, whatever the score — which is what makes the pill
  // beside it a column rather than a ragged edge.
  for (const lead of LEADS) {
    const lit = Array.from({ length: SCORE_SEGMENTS }, (_, i) =>
      segmentLit(lead.score, i),
    )
    expect(lit.filter(Boolean)).toHaveLength(lead.score)
  }
})

test('a date is written out rather than handed to a formatter', () => {
  // The page is prerendered, so a formatter whose output depends on the ICU build behind it is a
  // hydration mismatch waiting for another machine.
  expect(formatDay('2025-12-08')).toBe('Dec 08, 2025')
  expect(formatDay('2026-01-01')).toBe('Jan 01, 2026')
  expect(formatDay(LEADS[0]?.created ?? '')).toBe('Oct 08, 2026')
})

/* ==========================================================================
   The page
   ========================================================================== */

test('the board draws every lead, and the header counts them', async () => {
  await renderPage()
  expect(document.querySelector('h1')?.textContent).toBe('Leads')
  // The count beside the title is the number of rows below it, not a number of its own.
  expect(document.querySelector('h1 + span')?.textContent).toBe(
    String(LEADS.length),
  )

  // And the row is the lead: name, company, address, status, manager and date all present on it.
  const row = rowNamed('Jake Thompson')
  expect(row.textContent).toContain('Nordicsoft')
  expect(row.textContent).toContain('jt@nordicsoft.io')
  expect(row.textContent).toContain('Hot')
  expect(row.textContent).toContain('Jacob Müller')
  expect(row.textContent).toContain('Oct 08, 2026')
})

test('a tab narrows the table, and the search narrows the view', async () => {
  await renderPage()

  await userEvent.click(
    [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find((tab) =>
      tab.textContent.includes('Hot'),
    ) as HTMLElement,
  )
  await vi.waitFor(() => {
    expect(dataRows()).toHaveLength(2)
  })
  expect(document.querySelector('h1 + span')?.textContent).toBe('2')

  // The search sits inside the view, so searching for a New lead while the Hot tab is on finds nothing
  // — which is the composition working, not a bug in either filter.
  // **The sidebar has a search field too, and it comes first in the document.** Scoped to the main
  // region, this is the one over the table — the first version of this test typed into the sidebar and
  // asserted that nothing happened.
  const input = document.querySelector(
    'main input[type="search"]',
  ) as HTMLInputElement
  expect(input).not.toBeNull()
  await userEvent.type(input, 'walker')
  await vi.waitFor(() => {
    expect(dataRows()).toHaveLength(0)
  })
  expect(document.querySelector('tbody')?.textContent).toContain(
    'No lead matches this view.',
  )
})

test('checking a row raises the bar, and its clear control takes it back down', async () => {
  await renderPage()

  // Nothing is selected, so there is no bar — a mode that is on with nothing in it is a mode that lies.
  // `ActionBar` answers that itself: at zero it renders nothing at all rather than an empty panel.
  expect(document.querySelector('[data-slot="action-bar"]')).toBeNull()

  // React Aria's checkbox is a real input inside a label, so this is what a person actually ticks.
  const boxes = [
    ...document.querySelectorAll<HTMLInputElement>(
      'tbody input[type="checkbox"]',
    ),
  ]
  expect(boxes.length).toBe(LEADS.length)
  await userEvent.click(boxes[0])
  await userEvent.click(boxes[1])

  const bar = document.querySelector('[data-slot="action-bar"]')
  expect(bar).not.toBeNull()
  // The count is the component's sentence now, not the page's — "Selected: 2" was the panel this page
  // used to draw for itself.
  expect(bar?.textContent).toContain('2 selected')

  // ...and the bar is a toolbar with a name, holding the three actions the page offers a checked row.
  const toolbar = bar?.querySelector('[role="toolbar"]')
  expect(toolbar?.getAttribute('aria-label')).toBe('Selection actions')
  for (const label of SELECTION_ACTIONS.map((action) => action.label)) {
    expect(toolbar?.textContent).toContain(label)
  }

  // **Clearing is proven by the rows, not by the bar going away.** The bar reports `onClearSelection`;
  // whether anything was cleared is the table's answer, so both halves are read.
  const clear = [...(bar?.querySelectorAll('button') ?? [])].find(
    (button) => button.getAttribute('aria-label') === 'Clear selection',
  ) as HTMLElement
  await userEvent.click(clear)

  await vi.waitFor(() => {
    expect(document.querySelector('[data-slot="action-bar"]')).toBeNull()
  })
  expect([...boxes].filter((box) => box.checked).length).toBe(0)
})

test('a lead opens out of its row into a card, and the card opens into the record', async () => {
  await openCard('Jake Thompson')

  // The card is the design system's dialog, and its role is what says so rather than a class.
  const dialog = document.querySelector('[role="dialog"]') as HTMLElement
  expect(dialog).not.toBeNull()
  expect(dialog.getAttribute('aria-label')).toBe('Lead overview: Jake Thompson')

  // **The compact card, which is the box the row opened into.** Both sizes are min() expressions so one
  // interpolates into the other; this is the small end of that, read off the element rather than waited
  // for.
  expect(card()?.style.inlineSize).toBe('20rem')

  // The record is in the document but hidden from a reader rather than absent, because the box has to
  // hold still while it grows.
  const compact = document.querySelector('[data-slot="lead-compact"]')
  const full = document.querySelector('[data-slot="lead-full"]')
  expect(compact?.hasAttribute('aria-hidden')).toBe(false)
  expect(full?.hasAttribute('aria-hidden')).toBe(true)
  expect(full?.hasAttribute('inert')).toBe(true)

  await userEvent.click(
    document.querySelector('[aria-label="Expand the lead"]') as HTMLElement,
  )

  // The large end, and the handover: the record is now the half a reader gets, and the compact card is
  // the half they are kept out of.
  await vi.waitFor(() => {
    expect(card()?.style.inlineSize).toBe('21.25rem')
  })
  expect(compact?.hasAttribute('aria-hidden')).toBe(true)
  expect(full?.hasAttribute('aria-hidden')).toBe(false)

  // Every field of the record, in the order the reference draws them.
  const labels = [...(full?.querySelectorAll('.w-20') ?? [])].map(
    (node) => node.textContent,
  )
  expect(labels).toEqual([
    'Status',
    'Phone',
    'Email',
    'Company',
    'Location',
    'Source',
    'Due date',
    'Rate',
  ])
  expect(full?.textContent).toContain('(555) 123-0401')
  expect(full?.textContent).toContain('May 30, 2027')

  // The three tabs, with Info selected. **A tab panel with no id renders nothing**, which this page
  // managed twice before these tests existed — once in the board and once in the card.
  const tabs = [...(full?.querySelectorAll('[role="tab"]') ?? [])].map(
    (tab) => tab.textContent,
  )
  expect(tabs).toEqual(['Info', 'Notes', 'Deals'])
  expect(
    full?.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
  ).toBe('Info')
})

test('the card carries the six actions, and its menu is a menu', async () => {
  await openCard('Jake Thompson')

  await userEvent.click(
    document.querySelector('[aria-label="Lead actions"]') as HTMLElement,
  )
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(6)
  })
  expect(
    [...document.querySelectorAll('[role="menuitem"]')].map(
      (item) => item.textContent,
    ),
  ).toEqual([
    'Mark as qualified',
    'Add to pipeline',
    'Set priority',
    'Edit status',
    'Assign manager',
    'Archive lead',
  ])

  // **The menu takes the Escape, and the card underneath it stays open.** Two overlays are stacked
  // here, and the one on top is the one that answers — which is React Aria's doing and not this page's,
  // so it is worth holding still.
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0)
  })
  expect(document.querySelector('[role="dialog"]')).not.toBeNull()

  // The card's own way out, which is the one a person can see.
  await userEvent.click(
    document.querySelector('[aria-label="Close"]') as HTMLElement,
  )
  await vi.waitFor(() => {
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  // And the board is back, with the row it came from still on it.
  expect(rowNamed('Jake Thompson')).toBeTruthy()
})

test('expanding leaves the keyboard inside the card, not outside it', async () => {
  // **The bug this exists for was invisible and total.** Opening the record makes the compact half
  // inert, and the Expand button that was just pressed lives in it — an inert subtree cannot hold
  // focus, so the browser dropped it to <body>, which is outside the dialog. Measured in a real
  // browser afterwards: the card had no focused element and Escape stopped closing it, for a keyboard
  // user, on the one control they had just used. Nothing in the source shows that.
  await openCard('Jake Thompson')
  await userEvent.click(
    document.querySelector('[aria-label="Expand the lead"]') as HTMLElement,
  )
  await vi.waitFor(() => {
    expect(card()?.style.inlineSize).toBe('21.25rem')
  })

  await vi.waitFor(() => {
    expect(document.activeElement).not.toBe(document.body)
  })
  expect(card()?.contains(document.activeElement)).toBe(true)

  // Which is what makes this next line work: focus inside the dialog is what lets Escape reach it.
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => {
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})

test('Escape closes the card on its own', async () => {
  // Separated from the menu above on purpose: two Escapes in quick succession is a race between the
  // menu's exit and the dialog's key handling, and a test that races is a test that fails in CI on a
  // different file each time. Here there is one overlay and one key.
  await openCard('Jake Thompson')
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => {
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})

test('a row opens the record of the lead it is, not the first one', async () => {
  // The card's own name, its own details and its own data the whole way down, which is the thing a
  // shared "selected lead" gets wrong.
  await openCard('Sophia Martinez')
  expect(
    document.querySelector('[role="dialog"]')?.getAttribute('aria-label'),
  ).toBe('Lead overview: Sophia Martinez')

  await userEvent.click(
    document.querySelector('[aria-label="Expand the lead"]') as HTMLElement,
  )
  await vi.waitFor(() => {
    expect(
      document.querySelector('[data-slot="lead-full"]')?.textContent,
    ).toContain('sophia@ecotech.io')
  })
  expect(
    document.querySelector('[data-slot="lead-full"]')?.textContent,
  ).toContain('EcoTech Solutions')
})
