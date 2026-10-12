import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
} from './Popover'

const meta = {
  component: Popover,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Popover.Content': PopoverContent,
    'Popover.Title': PopoverTitle,
    'Popover.Description': PopoverDescription,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Popover>
  <Button>Filters</Button>
  <Popover.Content placement="bottom start">
    <Popover.Title>Filters</Popover.Title>
    <Popover.Description>Applies to this view only.</Popover.Description>
  </Popover.Content>
</Popover>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Popover>
      <Button>Filters</Button>
      <Popover.Content>
        <Popover.Title>Filters</Popover.Title>
        <Popover.Description>Applies to this view only.</Popover.Description>
      </Popover.Content>
    </Popover>
  ),
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))

    // **Portalled, so it is queried from `screen`** — a query against `canvas` passes whether or not
    // the panel is open, which is the silent direction of this mistake.
    const panel = await screen.findByRole('dialog')
    await expect(panel).toHaveAccessibleName('Filters')

    // The description is wired here rather than by React Aria, as it is on the modal.
    await expect(panel).toHaveAccessibleDescription(
      'Applies to this view only.',
    )
  },
}

export const Dismiss: Story = {
  // Escape closes it, and so does a click outside — the two things a non-modal surface still owes the
  // user, because it took neither the pointer nor the keyboard from them.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))
    await expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const DismissOnOutsideClick: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Filters' })
    await userEvent.click(trigger)
    await expect(await screen.findByRole('dialog')).toBeInTheDocument()

    // A click on the page behind closes it — and *lands*, because nothing is intercepting it. Under a
    // modal the same click would hit the scrim and do nothing.
    await userEvent.click(document.body)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const Placement: Story = {
  render: () => (
    <Popover>
      <Button>Filters</Button>
      <Popover.Content placement="bottom start">
        <Popover.Title>Filters</Popover.Title>
        <Popover.Description>Applies to this view only.</Popover.Description>
      </Popover.Content>
    </Popover>
  ),
  // **Placement is a request, not an instruction.** React Aria resolves it against the viewport and
  // reports where the panel actually landed, so what is asserted is that it reports one — not the
  // particular value a `placement="bottom start"` prop asked for.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))
    const panel = await screen.findByRole('dialog')

    const host = panel.closest('[data-placement]') ?? panel
    await expect(host.getAttribute('data-placement')).toBeTruthy()
    await expect(panel).toBeVisible()
  },
}
