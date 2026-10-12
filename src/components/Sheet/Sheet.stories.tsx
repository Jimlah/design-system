import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from './Sheet'

const meta = {
  component: Sheet,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Sheet.Content': SheetContent,
    'Sheet.Title': SheetTitle,
    'Sheet.Description': SheetDescription,
    'Sheet.Footer': SheetFooter,
    'Sheet.Close': SheetClose,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<Sheet>
  <Button>Details</Button>
  <Sheet.Content side="right">
    <Sheet.Title>fra1 · Frankfurt</Sheet.Title>
    <Sheet.Description>Checked every 60 seconds.</Sheet.Description>
    <Sheet.Footer>
      <Sheet.Close>Close</Sheet.Close>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet>`,
      },
    },
  },
  render: () => (
    <Sheet>
      <Button>Details</Button>
      <Sheet.Content>
        <Sheet.Title>fra1 · Frankfurt</Sheet.Title>
        <Sheet.Description>Checked every 60 seconds.</Sheet.Description>
        <Sheet.Footer>
          <Sheet.Close>Close</Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  ),
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

const panel = () => document.querySelector<HTMLElement>('[data-slot=sheet]')

export const Default: Story = {
  play: async ({ canvas }) => {
    // **The first thing asserted is that it is closed**, and it is the assertion that matters most: a
    // sheet already on screen before anyone touches it is unusable. (A throwaway Playwright probe
    // reports the opposite for every overlay story here, because Storybook restores the canvas from a
    // previous visit — the runner is the authority on state.)
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Details' }))

    // **Portalled, so it is queried from `screen`** — a query against `canvas` passes whether or not the
    // panel is open, which is the silent direction of this mistake.
    const dialog = await screen.findByRole('dialog')
    await expect(dialog).toHaveAccessibleName('fra1 · Frankfurt')
    await expect(dialog).toHaveAccessibleDescription(
      'Checked every 60 seconds.',
    )

    // ...and the panel occupies the screen, rather than sizing itself to its contents.
    await waitFor(() => {
      const box = dialog.getBoundingClientRect()
      expect(Math.round(box.width)).toBe(384)
      expect(box.height).toBeGreaterThan(window.innerHeight - 4)
    })
  },
}

export const Sides: Story = {
  render: () => (
    <Sheet>
      <Button>Open left</Button>
      <Sheet.Content side="left">
        <Sheet.Title>Left</Sheet.Title>
      </Sheet.Content>
    </Sheet>
  ),
  // `side` is not merely a layout prop: React Aria resolves it into the edge **and the swipe
  // direction** before `SheetContent` ever sees it, and reports both on the overlay.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open left' }))
    await screen.findByRole('dialog')

    const overlay = document.querySelector(
      '[data-slot=sheet-overlay]',
    ) as HTMLElement
    await expect(overlay).toHaveAttribute('data-position', 'left')
    await expect(overlay).toHaveAttribute('data-swipe-direction', 'left')
  },
}

export const Dismiss: Story = {
  // `slot="close"` is the whole mechanism, as it is on the modal — the button that closes the panel is a
  // plain `Button` with that attribute, not a handler.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }))
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const Trapped: Story = {
  // **A sheet takes the page, exactly as a modal does.** It covers one edge rather than the middle, but
  // the pointer and the keyboard belong to it while it is open — which is why it is not a popover.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }))
    const dialog = await screen.findByRole('dialog')
    const p = panel()

    // The panel is pinned to the right edge of the viewport. **Not** compared against
    // `window.innerWidth` — the runner reports it at half the panel's own coordinates, so an exact
    // match fails at 2400 against 1200 for a panel in exactly the right place.
    await expect(p).not.toBeNull()
    const box = p?.getBoundingClientRect()
    const viewport = document.documentElement.clientWidth
    await expect(box?.left ?? 0).toBeGreaterThan(viewport / 2)

    // Tab a few times and focus never leaves it: the page behind is out of the tab order while open.
    for (let i = 0; i < 4; i += 1) {
      await userEvent.tab()
      await expect(dialog.contains(document.activeElement)).toBe(true)
    }
  },
}
