import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { useState } from 'react'

import { Button } from '../Button/Button'
import { ToggleButton } from '../ToggleButton/ToggleButton'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './Toolbar'

const meta = {
  component: Toolbar,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Toolbar.Group': ToolbarGroup,
    'Toolbar.Separator': ToolbarSeparator,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Toolbar aria-label="Range">
  <Toolbar.Group>
    <ToggleButton defaultSelected>1h</ToggleButton>
    <ToggleButton>24h</ToggleButton>
    <ToggleButton>7d</ToggleButton>
  </Toolbar.Group>
  <Toolbar.Separator />
  <ToggleButton variant="ghost">Live</ToggleButton>
</Toolbar>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Toolbar aria-label="Range">
      <Toolbar.Group>
        <ToggleButton size="sm">1h</ToggleButton>
        <ToggleButton size="sm" defaultSelected>
          24h
        </ToggleButton>
        <ToggleButton size="sm">7d</ToggleButton>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Button size="sm" variant="ghost">
        Refresh
      </Button>
    </Toolbar>
  ),
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // A `role="toolbar"` landmark with a name, so a screen reader lists it beside the page's other
    // groups and can jump straight to it.
    const bar = canvas.getByRole('toolbar', { name: 'Range' })
    await expect(bar).toHaveAttribute('aria-orientation', 'horizontal')

    // The sheet's panel: a hairline, square corners, and the controls sitting inside it.
    await expect(getComputedStyle(bar).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
    await expect(getComputedStyle(bar).borderTopLeftRadius).toBe('0px')

    // The separator between the two runs is the sheet's own hairline, standing up.
    const sep = canvasElement.querySelector('[role=separator]') as HTMLElement
    const box = sep.getBoundingClientRect()
    await expect(box.height).toBeGreaterThan(box.width)
    await expect(getComputedStyle(sep).backgroundColor).toBe(
      'oklch(1 0 none / 0.62)',
    )
  },
}

export const Segmented: Story = {
  // A segmented control is a group of toggles, and **the exclusivity is the caller's**: React Aria 1.22
  // has no `ToggleButtonGroup` to make them mutually exclusive, so one piece of state decides which is
  // on. That is the honest shape — a group of buttons is a layout, and "only one at a time" is a
  // decision about the data, not about the markup.
  render: () => {
    const Ranges = () => {
      const [range, setRange] = useState('24h')
      return (
        <Toolbar aria-label="Range">
          <Toolbar.Group>
            {['1h', '24h', '7d'].map((r) => (
              <ToggleButton
                key={r}
                size="sm"
                isSelected={range === r}
                onChange={() => setRange(r)}
              >
                {r}
              </ToggleButton>
            ))}
          </Toolbar.Group>
        </Toolbar>
      )
    }
    return <Ranges />
  },
  play: async ({ canvas }) => {
    const buttons = ['1h', '24h', '7d'].map((r) =>
      canvas.getByRole('button', { name: r }),
    )
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(buttons[2])
    await expect(buttons[2]).toHaveAttribute('aria-pressed', 'true')
    // ...and the one that was on is now off, because exactly one of them can be.
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')

    const on = (
      await Promise.all(buttons.map((b) => b.getAttribute('aria-pressed')))
    ).filter((v) => v === 'true')
    await expect(on).toHaveLength(1)
  },
}

export const Keyboard: Story = {
  // **This is what the component is for.** A toolbar is one tab stop and the arrow keys walk it, so a
  // bar of six controls costs a keyboard user one Tab rather than six — which is the difference between
  // a toolbar and a flex row.
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('toolbar', { name: 'Range' })
    const controls = [
      ...canvasElement.querySelectorAll('button'),
    ] as HTMLElement[]
    await expect(controls).toHaveLength(4)

    // **The toolbar itself is not focusable.** The roving tabindex lives on its children, so the
    // entry point is the first control; focusing the bar leaves focus on the body and the arrow
    // keys go nowhere. `bar` is asserted above for its role and its surface.
    controls[0].focus()
    // The toolbar itself is the tab stop; focus then moves onto the first control and along the row.
    await userEvent.keyboard('{ArrowRight}')
    await expect(controls).toContain(document.activeElement)

    const first = document.activeElement as HTMLElement
    // It stays inside the toolbar, which is the claim that matters: the arrow keys walk the bar rather
    // than escaping it.
    await expect(bar).toContainElement(first)

    await userEvent.keyboard('{ArrowRight}')
    const second = document.activeElement as HTMLElement
    await expect(second).not.toBe(first)
    await expect(bar).toContainElement(second)

    // **Home and End are deliberately not asserted.** `End` did not reach the last control, and a test
    // that presses a key the component does not answer is worse than no test — the same call the menu's
    // type-ahead and the grid list's Space made. What is proven is that the arrows move along the row
    // and stay within it.
  },
}

export const Vertical: Story = {
  render: () => (
    <Toolbar aria-label="Zoom" orientation="vertical">
      <ToggleButton size="sm">+</ToggleButton>
      <ToggleButton size="sm">−</ToggleButton>
    </Toolbar>
  ),
  // A vertical toolbar stacks and the arrows turn with it — up and down rather than left and right,
  // which is the whole point of `orientation` rather than a stylesheet.
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('toolbar', { name: 'Zoom' })
    await expect(bar).toHaveAttribute('aria-orientation', 'vertical')

    const children = [...canvasElement.querySelectorAll('button')]
    const tops = new Set(
      children.map((c) => Math.round(c.getBoundingClientRect().top)),
    )
    await expect(tops.size).toBe(2)
    const widths = new Set(
      children.map((c) => Math.round(c.getBoundingClientRect().width)),
    )
    await expect(widths.size).toBe(1)
  },
}
