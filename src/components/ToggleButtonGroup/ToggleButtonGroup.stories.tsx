import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent } from 'storybook/test'

import { ToggleButtonGroup, ToggleButtonGroupButton } from './ToggleButtonGroup'

const meta = {
  component: ToggleButtonGroup,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: { 'ToggleButtonGroup.Button': ToggleButtonGroupButton },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<ToggleButtonGroup selectionMode="single" defaultSelectedKeys={[\`24h\`]}>
  <ToggleButtonGroup.Button id="1h">1h</ToggleButtonGroup.Button>
  <ToggleButtonGroup.Button id="24h">24h</ToggleButtonGroup.Button>
  <ToggleButtonGroup.Button id="7d">7d</ToggleButtonGroup.Button>
</ToggleButtonGroup>`,
      },
    },
  },
} satisfies Meta<typeof ToggleButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

const Range = ({
  mode = 'single',
  keys = ['24h'],
}: {
  mode?: 'single' | 'multiple'
  keys?: string[]
}) => (
  <ToggleButtonGroup
    aria-label="Time range"
    selectionMode={mode}
    defaultSelectedKeys={keys}
  >
    <ToggleButtonGroup.Button id="1h">1h</ToggleButtonGroup.Button>
    <ToggleButtonGroup.Button id="24h">24h</ToggleButtonGroup.Button>
    <ToggleButtonGroup.Button id="7d">7d</ToggleButtonGroup.Button>
  </ToggleButtonGroup>
)

export const Default: Story = {
  render: () => <Range />,
  play: async () => {
    // **A single-selection group is a radio group**, not a row of buttons — that is React Aria's
    // decision, and it is what the arrow keys below depend on.
    const group = screen.getByRole('radiogroup')
    const segments = screen.getAllByRole('radio')
    await expect(segments).toHaveLength(3)

    // The current segment is **filled**, where a tab row would carry an indicator underneath. There is
    // no panel below a segment for an indicator to point at, so the state has to be in the segment.
    const current = screen.getByRole('radio', { name: '24h' })
    await expect(current).toHaveAttribute('data-selected')
    await expect(getComputedStyle(current).backgroundColor).not.toBe(
      getComputedStyle(segments[0]).backgroundColor,
    )
    await expect(group).toHaveAttribute('data-orientation', 'horizontal')
  },
}

export const Selection: Story = {
  render: () => <Range />,
  play: async () => {
    const before = screen.getByRole('radio', { name: '24h' })
    await userEvent.click(screen.getByRole('radio', { name: '7d' }))

    await expect(screen.getByRole('radio', { name: '7d' })).toHaveAttribute(
      'data-selected',
    )
    await expect(before).not.toHaveAttribute('data-selected')
  },
}

export const Keyboard: Story = {
  render: () => <Range />,
  // The arrow keys **move focus without carrying the selection** — that is React Aria's model for this
  // group, and the reason this doc says so rather than the tidier thing it used to say. What the group
  // must not do is lose the selection on the way: React Aria's own default lets the arrow keys clear it,
  // leaving the control showing no current value, and the first assertion below is what pins the fix.
  play: async () => {
    const current = screen.getByRole('radio', { name: '24h' })
    await userEvent.click(current)

    await userEvent.keyboard('{ArrowRight}')
    await expect(screen.getByRole('radio', { name: '7d' })).toHaveFocus()
    await expect(current).toHaveAttribute('data-selected')

    // Activation is explicit.
    await userEvent.keyboard('{Enter}')
    await expect(screen.getByRole('radio', { name: '7d' })).toHaveAttribute(
      'data-selected',
    )
  },
}

export const Multiple: Story = {
  render: () => <Range mode="multiple" keys={['1h', '7d']} />,
  play: async () => {
    // In `multiple` mode it stops being a radio group: every segment is its own switch, tabbed into
    // individually, and more than one can be on at once.
    await expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()

    const on = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('data-selected') !== null)
    await expect(on).toHaveLength(2)
  },
}

export const Disabled: Story = {
  // A group has no `disabledKeys` — the prop does not exist. A segment that cannot be turned on is
  // disabled on itself, which is also how a single unavailable option is expressed.
  render: () => (
    <ToggleButtonGroup
      aria-label="Time range"
      selectionMode="single"
      defaultSelectedKeys={['24h']}
    >
      <ToggleButtonGroup.Button id="1h">1h</ToggleButtonGroup.Button>
      <ToggleButtonGroup.Button id="24h">24h</ToggleButtonGroup.Button>
      <ToggleButtonGroup.Button id="7d" isDisabled>
        7d
      </ToggleButtonGroup.Button>
    </ToggleButtonGroup>
  ),
  play: async () => {
    const off = screen.getByRole('radio', { name: '7d' })
    await expect(off).toHaveAttribute('data-disabled')
    // The dim is the house rule for disabled: 30% opacity, colour untouched — so a disabled segment
    // still looks like the segment it is.
    await expect(Number(getComputedStyle(off).opacity)).toBeLessThan(0.5)
  },
}
