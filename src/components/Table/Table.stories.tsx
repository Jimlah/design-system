import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, within } from 'storybook/test'
import { User } from '@react-aria/test-utils'

import {
  TableFooter,
  TableLoadMore,
  TableResizable,
  TableResizer,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TableSelection,
} from './Table'

const FLEET = [
  { id: 'fra1', name: 'fra1 · Frankfurt', status: 'Up', uptime: '99.98%' },
  { id: 'iad1', name: 'iad1 · Virginia', status: 'Degraded', uptime: '98.10%' },
  {
    id: 'sfo1',
    name: 'sfo1 · San Francisco',
    status: 'Down',
    uptime: '91.44%',
  },
]

const meta = {
  component: Table,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Table.Selection': TableSelection,
    'Table.Header': TableHeader,
    'Table.Column': TableColumn,
    'Table.Body': TableBody,
    'Table.Row': TableRow,
    'Table.Cell': TableCell,
    'Table.Resizable': TableResizable,
    'Table.Resizer': TableResizer,
    'Table.Footer': TableFooter,
    'Table.LoadMore': TableLoadMore,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Table aria-label="Monitors">
  <Table.Header>
    <Table.Column isRowHeader>Monitor</Table.Column>
    <Table.Column>Status</Table.Column>
    <Table.Column>Uptime</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row id="fra1">
      <Table.Cell>fra1 · Frankfurt</Table.Cell>
      <Table.Cell>Up</Table.Cell>
      <Table.Cell>99.98%</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>`,
      },
    },
    layout: 'centered',
  },
  args: { disabledKeys: [] },
  argTypes: { disabledKeys: { control: 'object' } },
  render: (args) => (
    <Table {...args} aria-label="Monitors" className="w-[36rem]">
      <Table.Header>
        <Table.Column isRowHeader>Monitor</Table.Column>
        <Table.Column>Status</Table.Column>
        <Table.Column>Uptime</Table.Column>
      </Table.Header>
      <Table.Body>
        {FLEET.map((m) => (
          <Table.Row key={m.id} id={m.id}>
            <Table.Cell>{m.name}</Table.Cell>
            <Table.Cell>{m.status}</Table.Cell>
            <Table.Cell>{m.uptime}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // A table is a table, but React Aria gives it the grid roles rather than the table ones, so it
    // is navigable with the arrow keys: `grid` on the element, `gridcell` on the cells.
    await expect(canvas.getByRole('grid')).toBeInTheDocument()
    await expect(canvas.getAllByRole('row')).toHaveLength(4)
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(3)
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(3)
    await expect(canvas.getAllByRole('gridcell')).toHaveLength(6)

    // The column marked `isRowHeader` is the row's own name, so it carries full strength while
    // every other cell sits at 75%. Asked for by role, so it cannot disagree with the markup.
    const name = canvas.getByRole('rowheader', { name: /fra1/i })
    await expect(getComputedStyle(name).color).toBe('oklch(1 0 none)')
    const status = canvas.getByRole('gridcell', { name: 'Up' })
    await expect(getComputedStyle(status).color).not.toBe('oklch(1 0 none)')

    // The sheet's `.ds-row`: a panel surface with a hairline under it. The last row has none,
    // because `.ds-rows` closes the stack with a softer line.
    // The sheet's `.ds-row` is a panel surface — opaque, and standing off the page rather than
    // being it. Asserted as "not transparent" so the token can change without editing the test.
    const row = canvas.getByRole('row', { name: /fra1/i })
    row.style.transition = 'none'
    await expect(getComputedStyle(row).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    const rows = canvas.getAllByRole('row').slice(1)
    await expect(getComputedStyle(rows[0]).borderBottomWidth).toBe('1px')
    await expect(getComputedStyle(rows[2]).borderBottomWidth).toBe('0px')

    await expect(canvasElement.querySelectorAll('table')).toHaveLength(1)
  },
}

// There is no Hover story, and that is deliberate. React Aria sets `data-hovered` on a row, but
// wires it to pointer *enter*, which does not bubble — so hovering a cell does not shade its row,
// and `user-event` fires its events on the target alone. The native `:hover` is no better: it
// responds to real input only, which a synthetic event is not. So a row's hover cannot be driven
// from a story either way, and a story that asserts something else would be worse than none.
// The row's hover is the native pseudo-class in the component, matching the sheet's
// `.ds-row--hover:hover`.

export const Empty: Story = {
  render: (args) => (
    <Table {...args} aria-label="Monitors" className="w-[36rem]">
      <Table.Header>
        <Table.Column isRowHeader>Monitor</Table.Column>
        <Table.Column>Status</Table.Column>
        <Table.Column>Uptime</Table.Column>
      </Table.Header>
      <Table.Body
        renderEmptyState={() => (
          <span
            data-slot="empty"
            className="block bg-card px-5 py-6 text-center text-[13px] text-foreground/55"
          >
            No monitors match that filter
          </span>
        )}
      >
        {[]}
      </Table.Body>
    </Table>
  ),
  // A table with nothing in it reads as a table that failed, so the empty state is worth writing —
  // and React Aria renders it in place of the body rather than beside it.
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/no monitors match/i)).toBeVisible()
    // The headings stay — the table still says what it is about — and the message takes the whole
    // row React Aria gives it, spanning every column.
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(3)
    await expect(canvas.queryAllByRole('gridcell')).toHaveLength(0)
  },
}

export const Selection: Story = {
  args: { selectionMode: 'multiple', defaultSelectedKeys: ['fra1'] },
  render: (args) => (
    <Table {...args} aria-label="Monitors" className="w-[38rem]">
      <Table.Header>
        <Table.Column width={48}>
          <Table.Selection />
        </Table.Column>
        <Table.Column isRowHeader>Monitor</Table.Column>
        <Table.Column>Status</Table.Column>
        <Table.Column>Uptime</Table.Column>
      </Table.Header>
      <Table.Body>
        {MONITORS.map((m) => (
          <Table.Row key={m.id} id={m.id}>
            <Table.Cell>
              <Table.Selection />
            </Table.Cell>
            <Table.Cell>{m.name}</Table.Cell>
            <Table.Cell>{m.status}</Table.Cell>
            <Table.Cell>{m.uptime}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
  // The header checkbox is not told anything: React Aria finds it by its `slot="selection"` and
  // drives it. With one of three rows chosen it reports `mixed` — the indeterminate state — which
  // is the difference between "select all" and "you have selected some of this".
  play: async ({ canvas, canvasElement }) => {
    // **The pattern tester, instead of this story re-deriving the mechanics.** `@react-aria/test-utils`
    // knows a Table: which element is the select-all box, how a press reaches React Aria's selection,
    // and what the collection now holds as selected. `getSelectedRows()` is the table's own answer,
    // which is more than a row of `checked` flags read back off the inputs can say. See the testing
    // rules in AGENTS.md.
    const ariaUser = new User({ interactionType: 'mouse' })
    const table = ariaUser.createTester('Table', { root: canvasElement })
    await expect(table.getRows()).toHaveLength(MONITORS.length)

    // The generic form rather than a cast: `getByRole` is generic over the element it returns.
    const header = canvas.getByRole<HTMLInputElement>('checkbox', {
      name: /select all/i,
    })
    const rowOf = (name: RegExp) =>
      canvas.getByRole<HTMLInputElement>('checkbox', { name })

    // The state lives in the DOM *property*, not in the markup: a native checkbox reports "mixed"
    // through `indeterminate`, and no attribute says so. Asserting on `aria-checked` finds nothing.
    await expect(header.indeterminate).toBe(true)
    await expect(header.checked).toBe(false)
    await expect(rowOf(/fra1/i).checked).toBe(true)
    await expect(rowOf(/iad1/i).checked).toBe(false)
    // ...and the collection agrees with the boxes, which the boxes alone cannot show.
    await expect(table.getSelectedRows()).toHaveLength(1)
    await expect(table.getSelectedRows()[0]).toHaveTextContent(/fra1/i)

    // Selecting everything leaves it plainly checked, with no trace of the mixed state.
    await table.toggleSelectAll()
    await expect(header.indeterminate).toBe(false)
    await expect(header.checked).toBe(true)
    await expect(rowOf(/iad1/i).checked).toBe(true)
    await expect(table.getSelectedRows()).toHaveLength(MONITORS.length)

    // ...and clearing it empties every row.
    await table.toggleSelectAll()
    await expect(header.checked).toBe(false)
    await expect(rowOf(/fra1/i).checked).toBe(false)
    await expect(table.getSelectedRows()).toHaveLength(0)
  },
}

export const Keyboard: Story = {
  // A table is one tab stop and the arrow keys move a cell at a time, which is what makes a wide
  // table navigable without tabbing through every cell in it.
  play: async ({ canvas }) => {
    // A specific cell is clicked rather than the row, because that is where focus lands — React
    // Aria focuses the cell you clicked, and the arrow keys move from *there*. Clicking is used
    // instead of Tab so the story does not depend on where the document's tab order starts.
    const name = canvas.getByRole('rowheader', { name: /fra1/i })
    await userEvent.click(name)
    await expect(name).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('gridcell', { name: 'Up' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('gridcell', { name: 'Degraded' }),
    ).toHaveFocus()
  },
}

export const DisabledRow: Story = {
  // A table has no `isDisabled` of its own: disabling one row is a far more common thing to want
  // than disabling all of them, so React Aria's model is the per-row one.
  args: { disabledKeys: ['iad1'] },
  play: async ({ canvas, canvasElement }) => {
    const row = canvas.getByRole('row', { name: /iad1/i })
    await expect(row).toHaveAttribute('data-disabled', 'true')
    await expect(getComputedStyle(row).opacity).toBe('0.4')

    // The others are untouched, and the table is still a table.
    await expect(
      canvas.getByRole('row', { name: /fra1/i }),
    ).not.toHaveAttribute('data-disabled')
    await expect(canvasElement.querySelectorAll('table')).toHaveLength(1)
  },
}

export const Resizable: Story = {
  render: () => (
    // **A `Table.Resizer` throws without `Table.Resizable`** — React Aria's own message is "Wrap your
    // <Table> in a <ResizableTableContainer> to enable column resizing" — so the two are one feature.
    <TableResizable>
      <Table aria-label="Monitors">
        <Table.Header>
          <Table.Column isRowHeader defaultWidth={220} minWidth={140}>
            Monitor
            <Table.Resizer aria-label="Resize Monitor column" />
          </Table.Column>
          <Table.Column defaultWidth={140}>
            Status
            <Table.Resizer aria-label="Resize Status column" />
          </Table.Column>
          <Table.Column defaultWidth={120}>Uptime</Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row id="fra1">
            <Table.Cell>fra1 · Frankfurt</Table.Cell>
            <Table.Cell>Up</Table.Cell>
            <Table.Cell>99.98%</Table.Cell>
          </Table.Row>
          <Table.Row id="iad1">
            <Table.Cell>iad1 · Ashburn</Table.Cell>
            <Table.Cell>Degraded</Table.Cell>
            <Table.Cell>97.10%</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </TableResizable>
  ),
  play: async () => {
    const grip = document.querySelector('[data-slot=column-resizer]')
    await expect(grip).not.toBeNull()
    const column = grip?.closest('th') as HTMLElement

    // **The ring here is a regression test, and it is checked at rest on purpose.** This column's class
    // list used to carry `outline-none`, which sets Tailwind's shared `--tw-outline-style` — the very
    // property every `outline-<width>` utility reads back — so the focus ring below it could never draw,
    // while the element happily reported `outline-width: 1px`. A transparent outline at rest computes as
    // `solid` with a transparent colour; `none` is the failure.
    const ring = getComputedStyle(column)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe('rgba(0, 0, 0, 0)')

    // **The column is resizable, and its width comes from `defaultWidth`.** 220 is asserted rather than
    // `> 0` so that a `defaultWidth` that silently stopped applying fails here.
    await expect(column.getBoundingClientRect().width).toBe(220)

    // The grip's accessible name and its keyboard control both live on the `type="range"` input React Aria
    // renders inside it — the wrapper carries only `role="presentation"`. That input is what makes a column
    // resizable without a mouse, so the label is asserted where a screen reader would actually find it.
    const control = grip?.querySelector('input')
    await expect(control).toHaveAttribute('type', 'range')
    await expect(control).toHaveAttribute('aria-label', 'Resize Monitor column')
    await expect(grip).toHaveAttribute('data-resizable-direction')
  },
}

const MONITORS = [
  { id: 'fra1', name: 'fra1 · Frankfurt', status: 'Up', uptime: '99.98%' },
  { id: 'iad1', name: 'iad1 · Ashburn', status: 'Degraded', uptime: '97.10%' },
  { id: 'sin1', name: 'sin1 · Singapore', status: 'Up', uptime: '99.91%' },
]

export const Footer: Story = {
  render: () => (
    <Table aria-label="Monitors">
      <Table.Header>
        <Table.Column isRowHeader>Monitor</Table.Column>
        <Table.Column>Status</Table.Column>
        <Table.Column>Uptime</Table.Column>
      </Table.Header>
      <Table.Body>
        {MONITORS.map((m) => (
          <Table.Row key={m.id} id={m.id}>
            <Table.Cell>{m.name}</Table.Cell>
            <Table.Cell>{m.status}</Table.Cell>
            <Table.Cell>{m.uptime}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell>Fleet</Table.Cell>
          <Table.Cell>3 monitors</Table.Cell>
          <Table.Cell>98.99%</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  ),
  play: async ({ canvas, canvasElement }) => {
    // **It is a `<tfoot>`, and that is the assertion worth making.** A footer drawn as a last body row
    // looks identical and is not one: assistive tech and any CSS keyed on the structure see the
    // difference, and only this check does.
    const foot = canvas.getByText('Fleet').closest('tfoot')
    await expect(foot).not.toBeNull()
    await expect(foot).toHaveAttribute('data-slot', 'table-footer')

    // The totals are its own row, in the same columns as the data above.
    await expect(
      within(foot as HTMLElement).getByText('98.99%'),
    ).toBeInTheDocument()

    // **It comes after the body, not inside it.** A `tfoot` placed before `tbody` is legal HTML and
    // renders last anyway, which is exactly the kind of thing a source-reading test would miss.
    const groups = [
      ...canvasElement.querySelectorAll('thead, tbody, tfoot'),
    ].map((g) => g.tagName)
    await expect(groups).toEqual(['THEAD', 'TBODY', 'TFOOT'])
  },
}

const PageTable = ({ loading }: { loading: boolean }) => (
  <Table aria-label="Monitors">
    <Table.Header>
      <Table.Column isRowHeader>Monitor</Table.Column>
      <Table.Column>Status</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="fra1">
        <Table.Cell>fra1 · Frankfurt</Table.Cell>
        <Table.Cell>Up</Table.Cell>
      </Table.Row>
      {/* The sentinel is a row, so it lives with the rows. */}
      <Table.LoadMore isLoading={loading} onLoadMore={() => {}} />
    </Table.Body>
  </Table>
)

export const LoadMore: Story = {
  render: () => <PageTable loading />,
  play: async ({ canvasElement }) => {
    const sentinel = canvasElement.querySelector('[data-slot=table-load-more]')
    await expect(sentinel).not.toBeNull()
    await expect(
      sentinel?.querySelector('[data-slot=loader]'),
    ).toBeInTheDocument()
  },
}

export const LoadMoreIdle: Story = {
  render: () => <PageTable loading={false} />,
  play: async ({ canvasElement }) => {
    // The same behaviour `GridList.LoadMore` records: React Aria renders **nothing** for the sentinel when
    // it is not loading, so "no spinner" is not the assertion — "no element" is.
    await expect(
      canvasElement.querySelector('[data-slot=table-load-more]'),
    ).not.toBeInTheDocument()
  },
}
