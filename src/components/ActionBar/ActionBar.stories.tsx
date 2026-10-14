import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import type { Key, Selection } from 'react-aria-components'

import { Button } from '../Button/Button'
import { Table } from '../Table/Table'
import { ActionBar } from './ActionBar'

const MONITORS = [
  { id: 'fra1', name: 'fra1 · Frankfurt', status: 'Up' },
  { id: 'iad1', name: 'iad1 · Ashburn', status: 'Degraded' },
  { id: 'sin1', name: 'sin1 · Singapore', status: 'Up' },
]

const meta = {
  component: ActionBar,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `const [selected, setSelected] = useState<Selection>(new Set(['fra1', 'iad1']))

<Table
  aria-label="Monitors"
  selectionMode="multiple"
  selectedKeys={selected}
  onSelectionChange={setSelected}
>
  …
</Table>

<ActionBar
  selectedItemCount={selected === 'all' ? 'all' : selected.size}
  onClearSelection={() => setSelected(new Set())}
>
  <Button size="sm" variant="ghost" color="neutral">Restart</Button>
  <Button size="sm" variant="ghost" color="neutral">Drain</Button>
  <Button size="sm" variant="ghost" color="danger">Take down</Button>
</ActionBar>`,
      },
    },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ActionBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A page with rows and the bar over it: **the wiring a caller writes, in one place.** The table owns
 * the selection and reports it; the bar only reads it, which is why the count is derived here rather
 * than remembered inside the component.
 *
 * The probe is the accent itself, painted at zero size. The emphasized story compares the bar's
 * boundary against **this element's** colour rather than against a token value typed into a test, so
 * the assertion still holds in either theme and fails if `data-[emphasized]:border-primary` stops
 * outranking the surface's own `border-border-strong` — which is the one thing about the emphasized
 * style that CSS order could silently take away.
 */
function Fleet({
  initial = [],
  emphasized = false,
}: {
  initial?: string[] | 'all'
  emphasized?: boolean
}) {
  const [selected, setSelected] = useState<Selection>(
    initial === 'all' ? 'all' : new Set<Key>(initial),
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

      <ActionBar
        selectedItemCount={selected === 'all' ? 'all' : selected.size}
        onClearSelection={() => setSelected(new Set())}
        isEmphasized={emphasized}
      >
        <Button size="sm" variant="ghost" color="neutral">
          Restart
        </Button>
        <Button size="sm" variant="ghost" color="neutral">
          Drain
        </Button>
        <Button size="sm" variant="ghost" color="danger">
          Take down
        </Button>
      </ActionBar>

      <span
        data-slot="accent-probe"
        aria-hidden="true"
        className="hidden border border-primary"
      />
    </div>
  )
}

/**
 * Two rows chosen, and the bar over the page with what can be done to them.
 *
 * **This story is meant to be used, so it has no `play`, and that is a rule here rather than an
 * oversight** — a `play` runs when a story is *viewed*, so one that selected rows would be a machine
 * and a person fighting over the same table. Its coverage is in `ActionBar.browser.test.tsx`, where
 * nothing runs unless it is asked to: choosing a row brings the bar up with the right count, the
 * header's select-all makes it "All selected", clearing is proven by the rows being unchecked, and
 * Escape works from inside the bar and not from the page.
 */
export const Default: Story = {
  render: () => <Fleet initial={['fra1', 'iad1']} />,
}

export const AllSelected: Story = {
  render: () => <Fleet initial="all" />,
  play: async ({ canvas }) => {
    // **`'all'` is a different sentence from a large number**, which is why the count takes the union
    // rather than a number: "412 selected" and "everything selected" are different facts about a
    // filter, and only the caller knows which one it is.
    await expect(canvas.getByRole('status')).toHaveTextContent('All selected')
    await expect(
      canvas.getByRole('button', { name: /clear selection/i }),
    ).toBeInTheDocument()
  },
}

export const Hidden: Story = {
  // The control for the story above: with **nothing** selected there is no bar at all — not an empty
  // one, and not an invisible one whose controls are still in the tab order. The table is the story.
  render: () => <Fleet />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('toolbar')).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: /clear selection/i }),
    ).not.toBeInTheDocument()
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(
      MONITORS.length + 1,
    )
  },
}

export const Emphasized: Story = {
  render: () => <Fleet initial={['fra1']} emphasized />,
  // Emphasis is the **accent on the bar's own boundary and count**, not a repaint of the controls
  // inside it — see the note on the component for why the Spectrum treatment cannot be ported
  // literally. What this checks is that the variant wins: two border-colour utilities on one element
  // are decided by the order Tailwind emits them, not by the order they are written.
  play: async ({ canvas, canvasElement }) => {
    const bar = canvasElement.querySelector('[data-slot=action-bar]') as Element
    const probe = canvasElement.querySelector(
      '[data-slot=accent-probe]',
    ) as Element
    await expect(bar).toHaveAttribute('data-emphasized', 'true')

    const accent = getComputedStyle(probe).borderTopColor
    await expect(getComputedStyle(bar).borderTopColor).toBe(accent)
    await expect(getComputedStyle(canvas.getByRole('status')).color).toBe(
      accent,
    )
  },
}

export const Keyboard: Story = {
  // **What the toolbar buys a bar of buttons.** The bar is one tab stop and the arrow keys walk it, so
  // four actions cost a keyboard user one press of Tab rather than four — the same claim
  // `Toolbar`'s own Keyboard story makes, and the reason this wraps React Aria's toolbar rather than
  // reaching for a `div` with a `role` on it.
  render: () => <Fleet initial={['fra1', 'iad1']} />,
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('toolbar', { name: /selection actions/i })
    const controls = [
      ...canvasElement.querySelectorAll('button'),
    ] as HTMLElement[]
    // The clear control, then the three actions — the roving tabindex lives on the controls, not on
    // the bar, so the entry point is the first of them.
    await expect(controls).toHaveLength(4)
    controls[0].focus()

    await userEvent.keyboard('{ArrowRight}')
    const first = document.activeElement as HTMLElement
    await expect(first).not.toBe(controls[0])
    await expect(bar).toContainElement(first)

    await userEvent.keyboard('{ArrowRight}')
    const second = document.activeElement as HTMLElement
    await expect(second).not.toBe(first)
    await expect(bar).toContainElement(second)

    // **Escape is not pressed here on purpose.** It clears the selection, so a play that pressed it
    // would hand the next reader a page with no bar on it and nothing left to try. Its contract — that
    // it clears from inside the bar and not from the page — is one of the browser tests, where state
    // can be owned without a story's arrival being the casualty.
  },
}
