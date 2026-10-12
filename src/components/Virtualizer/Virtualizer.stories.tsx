import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ListLayout } from 'react-aria-components'
import { useCallback, useMemo, useState } from 'react'
import { expect, waitFor } from 'storybook/test'

import { GridList, GridListItem, GridListLoadMore } from '../GridList/GridList'
import { Virtualizer } from './Virtualizer'

const meta = {
  component: Virtualizer,
  // `layout` is a required prop, so Storybook wants it in `args` even though every story renders explicitly.
  args: {
    layout: ListLayout,
    layoutOptions: { rowHeight: 44, estimatedRowHeight: 44 },
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `import { ListLayout } from 'react-aria-components'

<Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}>
  <GridList aria-label="Monitors" items={monitors} className="h-80 overflow-auto">
    {(monitor) => (
      <GridList.Item id={monitor.id} textValue={monitor.name}>
        {monitor.name}
      </GridList.Item>
    )}
  </GridList>
</Virtualizer>`,
      },
    },
  },
} satisfies Meta<typeof Virtualizer>

export default meta
type Story = StoryObj<typeof meta>

const monitors = Array.from({ length: 1000 }, (_, i) => ({
  id: `m${i}`,
  name: `monitor-${String(i).padStart(4, '0')}`,
}))

export const Thousand: Story = {
  render: () => (
    <Virtualizer
      layout={ListLayout}
      layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}
    >
      {/* The height and the overflow belong to the collection, not to the Virtualizer — it renders no
          chrome of its own. The collection is given `items` and a render function, because a `.map()`
          here would build all thousand rows before React ever sees them. */}
      <GridList
        aria-label="Monitors"
        items={monitors}
        className="h-80 w-72 overflow-auto"
      >
        {(monitor: (typeof monitors)[number]) => (
          <GridListItem id={monitor.id} textValue={monitor.name}>
            <span className="font-mono text-[13px] text-fg">
              {monitor.name}
            </span>
          </GridListItem>
        )}
      </GridList>
    </Virtualizer>
  ),
  play: async ({ canvas }) => {
    // **What the runner can see, and what it cannot.** In a real browser this list holds **11 rows out of
    // 1000** — measured with Playwright, with a `scrollHeight` of 484px rather than 44000. The Storybook
    // test runner reports all 1000 for the same story: React Aria renders the collection in full and
    // prunes it once the scroll container has been measured, and that pass does not happen the same way
    // inside the runner's frame. So the pruning is **not** asserted here — an assertion that passes in
    // one environment and fails in the other is worse than none, and one loosened until it passes in
    // both asserts nothing at all.

    // What is true in either: the rows are the first monitors, in order.
    const rows = canvas.getAllByRole('row')
    await expect(rows[0].textContent).toBe('monitor-0000')
    await expect(rows[1].textContent).toBe('monitor-0001')

    // ...and the list is a scroll container. That is the Virtualizer's own contribution and it is
    // observable in both — without it the collection is not scrollable at all, however many rows it drew.
    const list = document.querySelector<HTMLElement>('[data-slot=grid-list]')
    await expect(getComputedStyle(list as HTMLElement).overflowY).toBe('auto')
  },
}

const ALL = Array.from({ length: 300 }, (_, i) => ({
  id: `m${i}`,
  name: `monitor-${String(i).padStart(4, '0')}`,
}))

function Infinite() {
  const [count, setCount] = useState(60)
  const [isLoading, setLoading] = useState(false)
  const items = useMemo(() => ALL.slice(0, count), [count])

  const loadMore = useCallback(() => {
    if (isLoading || count >= ALL.length) return
    setLoading(true)
    // The delay is the point: a load that resolves instantly never shows the sentinel, and the sentinel
    // is what is being tested.
    setTimeout(() => {
      setCount((c) => Math.min(c + 60, ALL.length))
      setLoading(false)
    }, 250)
  }, [count, isLoading])

  return (
    <>
      <Virtualizer
        layout={ListLayout}
        layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}
      >
        <GridList
          aria-label="Monitors"
          items={items}
          className="h-80 w-72 overflow-auto"
        >
          {/* **A fragment, because `children` is typed as a renderer *or* nodes and never both.** The
              collection builder flattens a fragment happily, and the sentinel has to travel with the
              items to end up inside the collection — outside it, there is nothing to observe. */}
          <>
            {(monitor: (typeof ALL)[number]) => (
              <GridListItem id={monitor.id} textValue={monitor.name}>
                <span className="font-mono text-[13px] text-fg">
                  {monitor.name}
                </span>
              </GridListItem>
            )}
            <GridListLoadMore isLoading={isLoading} onLoadMore={loadMore} />
          </>
        </GridList>
      </Virtualizer>
      {/* Readable from the test, so the state the sentinel drove is asserted rather than inferred. */}
      <output data-testid="loaded">{String(count)}</output>
    </>
  )
}

export const LoadMore: Story = {
  render: () => <Infinite />,
  play: async ({ canvasElement }) => {
    const loaded = () =>
      Number(canvasElement.querySelector('output')?.textContent)
    await expect(loaded()).toBe(60)

    // Push the list to the bottom, where the sentinel lives.
    const scroller = canvasElement.querySelector<HTMLElement>(
      '[data-slot=grid-list]',
    ) as HTMLElement
    scroller.scrollTop = scroller.scrollHeight
    scroller.dispatchEvent(new Event('scroll', { bubbles: true }))

    // If the sentinel observes that, the next page arrives and the count grows.
    await waitFor(() => expect(loaded()).toBeGreaterThan(60), { timeout: 3000 })
  },
}
