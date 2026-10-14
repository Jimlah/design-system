import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'
import { useState } from 'react'
import type { Key, Selection } from 'react-aria-components'

import { Button } from '../Button/Button'
import { Table } from '../Table/Table'
import { ActionBar } from './ActionBar'

/**
 * The ActionBar's contract with a collection, in Vitest's browser mode.
 *
 * **It is here rather than in the `play` of a story, and the story that shows the wiring is the reason.**
 * A story's `play` runs when the story is *viewed* — measured in this repo's dev server, in the static
 * build and with every addon but the framework removed — so a play that selected rows and then cleared
 * them would be a machine working the same table the reader opened, and it would leave them looking at a
 * page with no bar on it. `Default` is meant to be used, so it carries no play and its coverage is here,
 * where nothing runs unless it is asked to — the arrangement `Form.browser.test.tsx` records at length.
 *
 * What is held to account is the split the component is built on:
 *
 * - **The bar reports and the collection decides.** `onClearSelection` is a request, not an action, so
 *   "clearing works" is only proven by the *rows* — the same lesson `TagGroup`'s remove button taught,
 *   where a story passed a callback that removed nothing and the test counted buttons.
 * - **`0` is not a very small bar.** Nothing selected means nothing rendered, controls and all.
 * - **Escape belongs to the bar while the bar has focus** — and, it turns out, to the collection while
 *   the collection has focus: React Aria's `useSelectableCollection` defaults
 *   `escapeKeyBehavior` to `'clearSelection'`, so a table already clears its own selection on Escape
 *   and the bar is saying the same thing in the second place a keyboard user ends up. This test is about
 *   the scoping of the *bar's* handler, so the page focus it contrasts with is a button that is not a
 *   collection at all.
 */

const MONITORS = [
  { id: 'fra1', name: 'fra1 · Frankfurt', status: 'Up' },
  { id: 'iad1', name: 'iad1 · Ashburn', status: 'Degraded' },
  { id: 'sin1', name: 'sin1 · Singapore', status: 'Up' },
]

/** The wiring a caller writes: the table owns the selection, the bar reads it. */
function Fleet() {
  const [selected, setSelected] = useState<Selection>(
    new Set<Key>(['fra1', 'iad1']),
  )

  return (
    <div className="p-8">
      <Table
        aria-label="Monitors"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        className="w-[36rem]"
      >
        <Table.Header>
          <Table.Column width={48}>
            <Table.Selection />
          </Table.Column>
          <Table.Column isRowHeader>Monitor</Table.Column>
          <Table.Column>Status</Table.Column>
        </Table.Header>
        <Table.Body>
          {MONITORS.map((monitor) => (
            <Table.Row key={monitor.id} id={monitor.id}>
              <Table.Cell>
                <Table.Selection />
              </Table.Cell>
              <Table.Cell>{monitor.name}</Table.Cell>
              <Table.Cell>{monitor.status}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Somewhere else on the page for focus to be: the contrast the Escape test needs is a control
          that is *not* a collection, since React Aria's own collections answer Escape themselves. */}
      <Button size="sm" variant="outline">
        Refresh
      </Button>

      <ActionBar
        selectedItemCount={selected === 'all' ? 'all' : selected.size}
        onClearSelection={() => setSelected(new Set())}
      >
        <Button size="sm" variant="ghost" color="neutral">
          Restart
        </Button>
        <Button size="sm" variant="ghost" color="danger">
          Take down
        </Button>
      </ActionBar>
    </div>
  )
}

/** The table's row checkboxes, in row order; the header's select-all is found separately. */
const boxes = () =>
  document.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]')

const headerBox = () =>
  document.querySelector<HTMLInputElement>('thead input[type="checkbox"]')

const bar = () => document.querySelector('[data-slot=action-bar]')

/** The count, read from the live region rather than from a class, because that is what it is for. */
const count = () =>
  document.querySelector('[data-slot=count]')?.textContent ?? ''

test('the bar arrives with the selection, floats, and its count follows the rows', async () => {
  const screen = await render(<Fleet />)

  // The bar is the toolbar it says it is, with the name it says it has, and it is *floating* — a bar
  // that sat in the flow would push the page around every time a row was chosen.
  await expect
    .element(screen.getByRole('toolbar', { name: /selection actions/i }))
    .toBeVisible()
  expect(bar()).not.toBeNull()
  expect(getComputedStyle(bar() as Element).position).toBe('fixed')

  // Two rows were already chosen, and the count is a polite live region: the bar appearing is
  // otherwise a purely visual event, and this is the page's only statement of what is selected.
  expect(count()).toBe('2 selected')
  expect(
    document.querySelector('[data-slot=count]')?.getAttribute('role'),
  ).toBe('status')

  // **The header's select-all is not three rows, it is `'all'`** — a different sentence, which is why
  // `selectedItemCount` takes the union rather than a number. It is clicked while the selection is
  // partial: the same control *toggles*, so pressing it with every row already chosen empties the
  // selection instead, which is React Aria's behaviour rather than a defect and is what the next
  // assertion is careful to step around.
  await userEvent.click(headerBox() as HTMLInputElement)
  await vi.waitFor(() => expect(count()).toBe('All selected'))

  // ...and leaving `'all'` resolves to a concrete set: one row's own checkbox, unchecked, is one row
  // fewer rather than the end of the selection.
  await userEvent.click(boxes()[2])
  await vi.waitFor(() => expect(count()).toBe('2 selected'))
  expect([...boxes()].map((box) => box.checked)).toEqual([true, true, false])
})

test('clearing is proven by the rows, not by the request being made', async () => {
  const screen = await render(<Fleet />)
  await expect
    .element(screen.getByRole('toolbar', { name: /selection actions/i }))
    .toBeVisible()
  expect([...boxes()].filter((box) => box.checked).length).toBe(2)

  await screen.getByRole('button', { name: /clear selection/i }).click()

  // **The thing being gone.** The bar reports `onClearSelection`; whether anything is cleared is the
  // table's answer, so both halves are asserted: nothing selected, and no bar.
  await vi.waitFor(() => expect(bar()).toBeNull())
  expect([...boxes()].filter((box) => box.checked).length).toBe(0)
  // The header's box goes back to plain off rather than staying mixed, which is the visible trace of
  // a selection that really emptied.
  expect(headerBox()?.indeterminate).toBe(false)
  expect(headerBox()?.checked).toBe(false)
})

test('Escape clears from inside the bar, and leaves the page alone from outside it', async () => {
  const screen = await render(<Fleet />)
  await expect
    .element(screen.getByRole('toolbar', { name: /selection actions/i }))
    .toBeVisible()

  // Focus on the page, beside the bar: the bar's handler is on the bar's own element, so a key pressed
  // out here clears nothing.
  await screen.getByRole('button', { name: 'Refresh' }).click()
  await userEvent.keyboard('{Escape}')
  expect(count()).toBe('2 selected')
  expect(bar()).not.toBeNull()

  // From inside the bar it does clear — and the rows go with it, which is the half that matters.
  const clear = screen.getByRole('button', { name: /clear selection/i })
  await expect.element(clear).toBeVisible()
  clear.element().focus()
  await userEvent.keyboard('{Escape}')

  await vi.waitFor(() => expect(bar()).toBeNull())
  expect([...boxes()].filter((box) => box.checked).length).toBe(0)
})
