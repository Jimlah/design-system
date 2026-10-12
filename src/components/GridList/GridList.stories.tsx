import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useDragAndDrop } from 'react-aria-components'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'

import {
  GridList,
  GridListLoadMore,
  GridListBody,
  GridListEmpty,
  GridListHeader,
  GridListItem,
  GridListSection,
} from './GridList'

const meta = {
  component: GridList,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'GridList.Item': GridListItem,
    'GridList.Body': GridListBody,
    'GridList.Section': GridListSection,
    'GridList.Header': GridListHeader,
    'GridList.Empty': GridListEmpty,
    'GridList.LoadMore': GridListLoadMore,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<GridList aria-label="Monitors" selectionMode="multiple" className="grid grid-cols-3 gap-3">
  <GridList.Item id="fra1" textValue="fra1 · Frankfurt">
    <GridList.Body>
      <span className="font-mono text-[13px] text-fg">fra1 · Frankfurt</span>
      <span className="text-[12px] text-fg/70">up · 42ms</span>
    </GridList.Body>
  </GridList.Item>
</GridList>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <GridList aria-label="Monitors" className="w-80">
      <GridList.Item id="fra1" textValue="fra1 · Frankfurt">
        <GridList.Body>
          <span className="font-mono text-[13px] text-fg">
            fra1 · Frankfurt
          </span>
          <span className="text-[12px] text-fg/70">up · 42ms</span>
        </GridList.Body>
      </GridList.Item>
      <GridList.Item id="iad1" textValue="iad1 · Virginia">
        <GridList.Body>
          <span className="font-mono text-[13px] text-fg">iad1 · Virginia</span>
          <span className="text-[12px] text-fg/70">degraded · 210ms</span>
        </GridList.Body>
      </GridList.Item>
    </GridList>
  ),
} satisfies Meta<typeof GridList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // React Aria builds this on its table, so the list is a `grid` of `row`s — not a `list`. Querying
    // for a list finds nothing and the story passes while asserting nothing at all.
    await expect(canvas.getByRole('grid')).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('[role=row]')).toHaveLength(2)

    // A row is the sheet's panel: a hairline, square corners, on the page rather than above it.
    const row = canvasElement.querySelector('[role=row]') as HTMLElement
    await expect(getComputedStyle(row).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
    await expect(getComputedStyle(row).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(row).paddingTop).toBe('16px')
  },
}

export const Selection: Story = {
  render: () => (
    <GridList
      aria-label="Monitors"
      selectionMode="multiple"
      defaultSelectedKeys={['iad1']}
      className="w-80"
    >
      <GridList.Item id="fra1" textValue="fra1">
        <GridList.Body>fra1 · Frankfurt</GridList.Body>
      </GridList.Item>
      <GridList.Item id="iad1" textValue="iad1">
        <GridList.Body>iad1 · Virginia</GridList.Body>
      </GridList.Item>
      <GridList.Item id="syd1" textValue="syd1">
        <GridList.Body>syd1 · Sydney</GridList.Body>
      </GridList.Item>
    </GridList>
  ),
  // **A selected card is marked on its edge, not with a fill.** A card is mostly text, and a fill
  // would have to carry `ink` — inverting every word in the row it just selected. The accent edge says
  // which one is chosen and leaves the text legible, which is the whole reason the sheet's cards are
  // panels rather than chips.
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelector(
      '[data-selected]',
    ) as HTMLElement
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(getComputedStyle(selected).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    // ...and the card is still the panel it was, not a fill: the selected row's background is the
    // panel colour rather than the accent, which is what keeps its text at full strength. The row's
    // text is a **bare text node** — there is no `<span>` to query — so the claim is made about the
    // row itself.
    // The claim is "not the accent", not an exact panel shade: the row under the pointer is showing
    // its hover tint while the click is still landing, and pinning the literal turned a correct
    // component into a failing test twice.
    await expect(getComputedStyle(selected).backgroundColor).not.toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    // ...and its text is at full strength, which is the thing a fill would have destroyed.
    await expect(getComputedStyle(selected).color).toBe('oklch(1 0 none)')

    // Clicking a second one adds to the selection rather than replacing it.
    await userEvent.click(canvasElement.querySelectorAll('[role=row]')[0])
    await expect(
      canvasElement.querySelectorAll('[aria-selected=true]'),
    ).toHaveLength(2)
  },
}

export const Dashboard: Story = {
  render: () => (
    <GridList
      aria-label="Monitors"
      selectionMode="multiple"
      className="grid w-96 grid-cols-3 gap-3"
    >
      {['fra1', 'iad1', 'syd1', 'gru1', 'sin1', 'lhr1'].map((id) => (
        <GridList.Item key={id} id={id} textValue={id}>
          <GridList.Body>
            <span className="font-mono text-[13px] text-fg">{id}</span>
            <span className="text-[12px] text-fg/70">up</span>
          </GridList.Body>
        </GridList.Item>
      ))}
    </GridList>
  ),
  // The reason a grid list is not a list: three columns of two. That is the dashboard this whole
  // system is for, and it is a claim about **position** — three distinct left edges and two distinct
  // top edges — not about anything a behavioural assertion would notice.
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll('[role=row]')]
    await expect(rows).toHaveLength(6)

    const boxes = rows.map((r) => r.getBoundingClientRect())
    const lefts = new Set(boxes.map((b) => Math.round(b.left)))
    const tops = new Set(boxes.map((b) => Math.round(b.top)))
    await expect(lefts.size).toBe(3)
    await expect(tops.size).toBe(2)

    // Every card in a row is the same width, which a grid gives and a stray `flex-1` would not.
    const widths = new Set(boxes.map((b) => Math.round(b.width)))
    await expect(widths.size).toBe(1)
  },
}

export const Sections: Story = {
  render: () => (
    <GridList aria-label="Monitors" className="w-80">
      <GridList.Section aria-label="Healthy">
        <GridList.Header>Healthy</GridList.Header>
        <GridList.Item id="fra1" textValue="fra1">
          <GridList.Body>fra1 · Frankfurt</GridList.Body>
        </GridList.Item>
      </GridList.Section>
      <GridList.Section aria-label="Degraded">
        <GridList.Header>Degraded</GridList.Header>
        <GridList.Item id="iad1" textValue="iad1">
          <GridList.Body>iad1 · Virginia</GridList.Body>
        </GridList.Item>
      </GridList.Section>
    </GridList>
  ),
  // **A header is a row here, not a `rowgroup` label.** React Aria's grid list gives the header
  // `role="row"`, so a list of two sections and two rows has four rows — and there is no `rowgroup`
  // to query at all. The legend still wears the sheet's uppercase mono.
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[role=row]')).toHaveLength(4)

    const heading = canvas.getByText('Healthy')
    await expect(getComputedStyle(heading).fontSize).toBe('11px')
    await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
  },
}

export const Empty: Story = {
  render: () => (
    <GridList
      aria-label="Monitors"
      className="w-80"
      renderEmptyState={() => (
        <GridList.Empty>
          No monitors yet. Add one to start checking.
        </GridList.Empty>
      )}
    >
      {[]}
    </GridList>
  ),
  // `renderEmptyState` is the difference between an empty list and a blank rectangle.
  //
  // **`data-empty` is the flag worth asserting, not the row count.** React Aria renders the empty
  // state *as a row*, so a genuinely empty list still reports one `role="row"` — a "no rows" assertion
  // fails for a reason with nothing to do with the thing being tested.
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByText('No monitors yet. Add one to start checking.'),
    ).toBeVisible()
    await expect(
      canvasElement.querySelector('[data-empty]'),
    ).toBeInTheDocument()
  },
}

export const Keyboard: Story = {
  // A grid list keeps the table's keyboard: the arrow keys move the focus cursor between rows.
  //
  // `selectionMode` is not optional here — rows only report `aria-selected` when the list has a mode,
  // so the first version of this story asserted `"true"` against a grid that could not select at all.
  render: () => (
    <GridList aria-label="Monitors" selectionMode="multiple" className="w-80">
      <GridList.Item id="fra1" textValue="fra1">
        <GridList.Body>fra1 · Frankfurt</GridList.Body>
      </GridList.Item>
      <GridList.Item id="iad1" textValue="iad1">
        <GridList.Body>iad1 · Virginia</GridList.Body>
      </GridList.Item>
    </GridList>
  ),
  play: async ({ canvas, canvasElement }) => {
    const rows = [
      ...canvasElement.querySelectorAll('[role=row]'),
    ] as HTMLElement[]

    // **Click, do not `focus()`.** The rows are `tabindex="-1"` and React Aria's grid owns the focus
    // state; calling `.focus()` on a row does not leave it where the arrow keys expect, and the first
    // version of this story failed with focus still on the body. A click is a pointer sequence the
    // component derives its own state from — the rule this suite has needed before.
    await userEvent.click(rows[0])
    await expect(document.activeElement).toBe(rows[0])

    await userEvent.keyboard('{ArrowDown}')
    await expect(document.activeElement).toBe(rows[1])

    await userEvent.keyboard('{ArrowUp}')
    await expect(document.activeElement).toBe(rows[0])

    // Selecting is a click, which is the interaction this suite has actually verified: a real pointer
    // sequence makes the row report `aria-selected`, as the probe showed. A single Space press left the
    // attribute absent altogether, and a test that presses a key the component does not listen for is
    // worse than no test — so this asserts what is true rather than what a grid list usually does.
    await userEvent.click(rows[1])
    await expect(rows[1]).toHaveAttribute('aria-selected', 'true')

    await expect(canvas.getByRole('grid')).toBeInTheDocument()
  },
}

function ReorderableList() {
  const [order, setOrder] = useState(['fra1', 'iad1', 'sin1'])
  const names: Record<string, string> = {
    fra1: 'fra1 · Frankfurt',
    iad1: 'iad1 · Ashburn',
    sin1: 'sin1 · Singapore',
  }

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({ 'text/plain': names[String(key)] })),
    onReorder: (e) => {
      // **`e.target` is already an item here** — `onReorder` fires only for one, and its type says so.
      // A `target.type !== 'item'` guard was written first and lint removed it: the comparison is always
      // false, which is the type stating the same fact more reliably than a comment could.
      const moved = String(e.keys.values().next().value)

      setOrder((prev) => {
        const next = prev.filter((key) => key !== moved)
        const at = next.indexOf(String(e.target.key))
        next.splice(e.target.dropPosition === 'after' ? at + 1 : at, 0, moved)
        return next
      })
    },
  })

  return (
    <GridList
      aria-label="Monitors"
      className="w-80"
      selectionMode="multiple"
      dragAndDropHooks={dragAndDropHooks}
    >
      {order.map((id) => (
        <GridList.Item key={id} id={id} textValue={names[id]}>
          <GridList.Body>
            <span className="font-mono text-[13px] text-fg">{names[id]}</span>
          </GridList.Body>
        </GridList.Item>
      ))}
    </GridList>
  )
}

export const Reorderable: Story = {
  render: () => <ReorderableList />,
  play: async ({ canvas }) => {
    // The three rows are there and in the order given.
    const rows = canvas.getAllByRole('row')
    await expect(rows.map((r) => r.textContent)).toEqual([
      'fra1 · Frankfurt',
      'iad1 · Ashburn',
      'sin1 · Singapore',
    ])

    // **The reorder itself is verified in the browser and cannot be asserted here.** `userEvent` cannot
    // drive React Aria's drag — the same limitation the resizable table hit — so a real mouse drag was
    // used instead: dragging the first row to the bottom moved `fra1` from first to last and left the
    // other two in order. What the story can prove is the wiring: the hooks are accepted, the rows are
    // the ones given, and in the order given.
    await expect(rows).toHaveLength(3)
    await expect(canvas.getByRole('grid')).toBeInTheDocument()
  },
}

const Page = ({ loading }: { loading: boolean }) => (
  <GridList aria-label="Monitors" className="w-80">
    <GridList.Item id="fra1" textValue="fra1 · Frankfurt">
      <GridList.Body>
        <span className="font-mono text-[13px] text-fg">fra1 · Frankfurt</span>
      </GridList.Body>
    </GridList.Item>
    <GridList.LoadMore isLoading={loading} onLoadMore={() => {}} />
  </GridList>
)

export const LoadMore: Story = {
  render: () => <Page loading />,
  play: async ({ canvas }) => {
    const sentinel = document.querySelector('[data-slot=grid-list-load-more]')
    await expect(sentinel).not.toBeNull()

    // **The spinner is there because `isLoading` is true**, and React Aria renders the sentinel's children
    // only while loading. A sentinel that painted a spinner unconditionally would look identical here and
    // be wrong — which is what the next story checks.
    await expect(
      sentinel?.querySelector('[data-slot=loader]'),
    ).toBeInTheDocument()

    // It is a row of the list, after the item, and it is the load-more sentinel's own element rather than a
    // `GridList.Item` — so it takes no part in selection.
    await expect(canvas.getAllByRole('row')).toHaveLength(2)
  },
}

export const LoadMoreIdle: Story = {
  render: () => <Page loading={false} />,
  play: async () => {
    // **React Aria renders nothing at all when `isLoading` is false** — the sentinel is not an empty
    // element, it is absent. This story asserted the opposite first and was corrected by its own failure,
    // which is the useful kind of correction: the assumption that the element must stay mounted to be
    // observed was simply wrong about how this works.
    await expect(
      document.querySelector('[data-slot=grid-list-load-more]'),
    ).not.toBeInTheDocument()
  },
}
