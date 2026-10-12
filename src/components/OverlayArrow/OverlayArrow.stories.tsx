import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import { Popover } from '../Popover/Popover'
import { Tooltip } from '../Tooltip/Tooltip'
import { OverlayArrow } from './OverlayArrow'

const meta = {
  component: OverlayArrow,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<Popover>
  <Popover.Arrow />
  <p className="text-[13px] text-foreground/70">Anchored to the button.</p>
</Popover>`,
      },
    },
  },
} satisfies Meta<typeof OverlayArrow>

export default meta
type Story = StoryObj<typeof meta>

export const PopoverArrow: Story = {
  render: () => (
    <Popover>
      <Button>Details</Button>
      <Popover.Content>
        <Popover.Arrow />
        <p className="text-[13px] text-foreground/70">
          Anchored to the button.
        </p>
      </Popover.Content>
    </Popover>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }))
    await screen.findByRole('dialog')

    const arrow = document.querySelector('[data-slot=overlay-arrow]')
    await expect(arrow).not.toBeNull()

    // React Aria reports which way the marker must point, and it positions the element itself.
    await waitFor(async () => {
      const placement = arrow?.getAttribute('data-placement')
      await expect(['top', 'bottom', 'left', 'right']).toContain(placement)
    })

    // **The claim worth making: the marker meets the panel's edge exactly.** With the overlay below its
    // trigger, the arrow's bottom must land on the panel's top — touching, not overlapping and not adrift.
    // A marker floating in the middle of the panel would be drawn and useless, and would look perfectly
    // plausible in a screenshot; this is the assertion that would not.
    const panel = document.querySelector('[data-slot=popover]') as HTMLElement
    const a = (arrow as HTMLElement).getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    await expect(Math.abs(a.bottom - p.top)).toBeLessThanOrEqual(1)
    await expect(a.left).toBeGreaterThanOrEqual(p.left)
    await expect(a.right).toBeLessThanOrEqual(p.right)

    const shape = document.querySelector(
      '[data-slot=overlay-arrow-shape]',
    ) as HTMLElement
    // **`rotate`, not `transform`.** Tailwind v4 writes the individual `rotate` property rather than a
    // `transform` matrix, so a `rotate-45` leaves `getComputedStyle(el).transform` at `'none'` while the
    // element is visibly rotated. The first version of this assertion checked `transform`, failed, and
    // would have sent someone chasing a rotation that was already applied.
    await expect(getComputedStyle(shape).rotate).toBe('45deg')
    await expect(getComputedStyle(shape).borderTopStyle).toBe('solid')
  },
}

export const TooltipArrow: Story = {
  render: () => (
    <Tooltip>
      <Button>Uptime</Button>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Tooltip.Text>Checked every 60 seconds.</Tooltip.Text>
      </Tooltip.Content>
    </Tooltip>
  ),
  play: async ({ canvas }) => {
    // **Focus, not hover.** A tooltip has to open for a keyboard user with no pointer, so focus is the
    // first-class way in — and it is the route that does not depend on a hover delay. This is the pattern
    // the Tooltip's own stories use.
    const trigger = canvas.getByRole('button', { name: 'Uptime' })
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await screen.findByRole('tooltip')

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot=overlay-arrow]'),
      ).not.toBeNull(),
    )
  },
}
