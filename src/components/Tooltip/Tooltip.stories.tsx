import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import { Tooltip, TooltipContent, TooltipText, TooltipTitle } from './Tooltip'

const meta = {
  component: Tooltip,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Tooltip.Content': TooltipContent,
    'Tooltip.Title': TooltipTitle,
    'Tooltip.Text': TooltipText,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Tooltip delay={0}>
  <Button>Restart</Button>
  <Tooltip.Content>
    <Tooltip.Title>Restart</Tooltip.Title>
    <Tooltip.Text>Runs the check again from the top.</Tooltip.Text>
  </Tooltip.Content>
</Tooltip>`,
      },
    },
    layout: 'centered',
  },
  // A 1500ms hover delay is the right default and a terrible thing to wait for in a test, so every
  // story here opens at once. The delay is asserted in `Delay` below, which is the point of it.
  args: { delay: 0 },
  argTypes: { delay: { control: 'number' } },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Restart</Button>
      <Tooltip.Content>
        <Tooltip.Title>Restart</Tooltip.Title>
        <Tooltip.Text>Runs the check again from the top.</Tooltip.Text>
      </Tooltip.Content>
    </Tooltip>
  ),
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// There is no Hover story, and there is no Delay story. Both were written and both failed: React
// Aria opens a tooltip on hover through a **timer**, and the test runner's polling never advances
// it — the trap the Testing section already records ("a query failing with `Unable to find an
// accessible element with the role …` … reads like a missing component and is a pending timer").
// The keyboard path opens synchronously, so that is the one a story can prove; the hover path is
// the same code the focus path runs, and its delay is asserted nowhere rather than asserted badly.

export const Default: Story = {
  // Focus is a first-class way in, not a fallback: a keyboard user has no pointer, and a
  // hand-rolled tooltip almost always forgets them.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Restart' })
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.tab()
    await expect(trigger).toHaveFocus()

    // Portalled, so it is not in the canvas — this is the query that quietly asserts nothing when
    // it is written the other way round.
    const tip = await screen.findByRole('tooltip')
    await expect(tip).toBeInTheDocument()
    await expect(tip).toHaveTextContent(/runs the check again/i)

    // Described, not named: the tooltip adds to what the button says rather than replacing it.
    await expect(trigger).toHaveAccessibleName('Restart')
    await expect(
      trigger.getAttribute('aria-describedby')?.split(' '),
    ).toContain(tip.id)

    await userEvent.keyboard('{Escape}')
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    // Escape closes the tooltip and leaves focus where it was, so a keyboard user is not trapped
    // behind the thing that was meant to help.
    await expect(trigger).toHaveFocus()
  },
}

export const Keyboard: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Uptime</Button>
      <Tooltip.Content>
        <Tooltip.Title>Uptime</Tooltip.Title>
        <Tooltip.Text>99.98% over the last 24 hours.</Tooltip.Text>
      </Tooltip.Content>
    </Tooltip>
  ),
  // The sheet's two parts, in the sheet's own type: a 12px letterspaced teal title over a 14px
  // white line. The title is deliberately *not* uppercase — a tooltip is read at a glance while
  // the pointer rests, not scanned down a column like the sheet's other small text.
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Uptime' })).toHaveFocus()
    const tip = await screen.findByRole('tooltip')

    const title = tip.querySelector('[data-slot=title]') as HTMLElement
    const text = tip.querySelector('[data-slot=text]') as HTMLElement
    await expect(getComputedStyle(title).color).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(title).fontSize).toBe('12px')
    await expect(getComputedStyle(text).fontSize).toBe('14px')
    await expect(getComputedStyle(title).textTransform).toBe('none')

    // The surface is the sheet's own: its panel, a strong hairline, and the sheet's padding — not
    // a themed bubble riding on a shadow.
    const surface = getComputedStyle(tip)
    await expect(surface.borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
    await expect(surface.paddingTop).toBe('10px')
    await expect(surface.paddingInlineStart).toBe('14px')
  },
}
