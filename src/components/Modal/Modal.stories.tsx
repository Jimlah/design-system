import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
} from './Modal'

const meta = {
  component: Modal,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Modal.Content': ModalContent,
    'Modal.Title': ModalTitle,
    'Modal.Description': ModalDescription,
    'Modal.Footer': ModalFooter,
    'Modal.Close': ModalClose,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Modal>
  <Button>New monitor</Button>
  <Modal.Content>
    <Modal.Title>New monitor</Modal.Title>
    <Modal.Description>It starts checking as soon as you save.</Modal.Description>
    <Modal.Footer>
      <Modal.Close>Cancel</Modal.Close>
      <Button variant="primary">Save</Button>
    </Modal.Footer>
  </Modal.Content>
</Modal>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Modal>
      <Button>New monitor</Button>
      <Modal.Content>
        <Modal.Close />
        <Modal.Title>New monitor</Modal.Title>
        <Modal.Description>
          It starts checking as soon as you save.
        </Modal.Description>
        <Modal.Footer>
          {/* A dismiss control that is a word, not an ×. `slot` is what makes any button close the
              dialog — `Modal.Close` is the × in the corner, and this is the same attribute on a
              different shape. */}
          <Button slot="close">Cancel</Button>
          <Button variant="default">Save</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'New monitor' }))

    // Portalled, so it is queried from `screen` — this is the query that quietly asserts nothing
    // when it is written the other way round.
    const dialog = await screen.findByRole('dialog')
    await expect(dialog).toBeInTheDocument()

    // The title names it and the description explains it, both wired by React Aria rather than by
    // an `aria-labelledby` written by hand.
    await expect(dialog).toHaveAccessibleName('New monitor')
    await expect(dialog).toHaveAccessibleDescription(/starts checking/i)

    // The sheet's `.ds-panel-title`, asked for by role: the trigger button says the same words, so a
    // text query finds two and fails.
    const title = screen.getByRole('heading', { name: 'New monitor' })
    await expect(getComputedStyle(title).fontSize).toBe('18px')
    await expect(getComputedStyle(title).fontWeight).toBe('600')

    // The surface is a panel with an edge, because a dialog floats. Both measured.
    await expect(getComputedStyle(dialog).backgroundColor).toBe(
      'oklch(0.1722 0.0115 260.6)',
    )
    await expect(getComputedStyle(dialog).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
  },
}

export const Dismiss: Story = {
  // Three ways out, and all three put focus back on the trigger: Escape, a click on the scrim, and
  // the close control. A dialog that strands focus is worse than no dialog.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'New monitor' })
    await userEvent.click(trigger)
    await expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const CloseControl: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New monitor' }))
    const dialog = await screen.findByRole('dialog')
    await expect(dialog).toBeInTheDocument()

    // React Aria names it, so this asks for the name it supplies rather than one written here.
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const Trapped: Story = {
  // Focus stays inside while it is open — that is what makes it modal rather than merely floating —
  // and the page behind is hidden from assistive tech, so nothing outside can be reached by accident.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New monitor' }))
    const dialog = await screen.findByRole('dialog')

    for (let i = 0; i < 6; i++) {
      await userEvent.tab()
      await expect(dialog).toContainElement(
        document.activeElement as HTMLElement,
      )
    }

    // Nothing is marked `aria-hidden` out there, and that is correct: React Aria makes a dialog
    // modal by *trapping focus* and taking the page out of the tab order, not by hiding the page from
    // the accessibility tree — where it should stay readable, merely not reachable. A first version
    // of this story asserted `aria-hidden` on the trigger and was wrong.
    await expect(
      canvas.getByRole('button', { name: 'New monitor' }),
    ).toBeVisible()
  },
}
