import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Avatar } from './Avatar'

/** A real, loadable image with no network involved. */
const IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%2371FFF6'/%3E%3C/svg%3E"

const meta = {
  component: Avatar,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<Avatar alt="Ada Lovelace" src="/ada.png" />
<Avatar alt="Ada Lovelace" />
<Avatar alt="fra1" color="primary" />`,
      },
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { alt: 'Ada Lovelace', src: IMAGE },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Ada Lovelace' })
    await expect(avatar).toHaveAttribute('data-slot', 'avatar')

    // **The picture actually arrived.** An `<img>` in the DOM proves nothing on its own — a 404 leaves one
    // behind — so this checks the decoded dimensions, which are zero for anything that did not load.
    const img = avatar.querySelector('img') as HTMLImageElement
    await waitFor(async () => await expect(img.naturalWidth).toBeGreaterThan(0))

    // The image is decorative and the wrapper carries the name, so it is announced once rather than twice.
    await expect(img).toHaveAttribute('alt', '')
    await expect(avatar.querySelector('[data-slot=avatar-initials]')).toBeNull()
  },
}

export const Initials: Story = {
  args: { alt: 'Ada Lovelace' },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Ada Lovelace' })
    // First and last word: "Ada Lovelace" is AL, not AD.
    await expect(avatar).toHaveTextContent('AL')

    // **Square, and that is a deliberate departure from what an avatar usually is.** The sheet squares off
    // its controls and makes two exceptions; a circle here would be a third, so the radius is checked
    // rather than assumed.
    await expect(parseFloat(getComputedStyle(avatar).borderTopLeftRadius)).toBe(
      0,
    )

    // ...and it is a fill carrying `ink`, the same arrangement as every other filled control.
    await expect(getComputedStyle(avatar).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(avatar).color).not.toBe(
      getComputedStyle(avatar).backgroundColor,
    )
  },
}

export const BrokenImage: Story = {
  // A source that cannot load. This is not an edge case — it is what a dashboard with user-supplied avatar
  // URLs looks like most of the time, and the failure mode of getting it wrong is an empty box.
  args: { alt: 'Grace Hopper', src: '/definitely-not-here.png' },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Grace Hopper' })
    await waitFor(
      async () =>
        await expect(
          avatar.querySelector('[data-slot=avatar-initials]'),
        ).not.toBeNull(),
      // **Not the 1s default.** This waits on a real request having to fail — there is no
      // fallback until the image errors — and a broken-image fallback measured 1.29s from page
      // load in a browser here. Over the default budget the story failed at 1019ms twice in three
      // full-suite runs, which is the timeout expiring and not the component: the `<img>` is gone
      // and the initials are there as soon as it does arrive. Only the waiting changes; both
      // assertions below are the ones that were always there.
      { timeout: 5000 },
    )
    await expect(avatar).toHaveTextContent('GH')
    await expect(avatar.querySelector('img')).toBeNull()
  },
}

export const Names: Story = {
  // `alt` is required, so even a story that renders explicitly needs it in `args`.
  args: { alt: 'Ada Lovelace' },
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar alt="Ada Lovelace" />
      <Avatar alt="Ada B. Lovelace" />
      <Avatar alt="fra1" color="primary" />
      <Avatar alt="  " color="neutral" />
    </div>
  ),
  // The derivation, checked at the edges: a middle name does not change it, a single machine name takes two
  // letters, and a name with no letters at all still has to render something.
  play: async ({ canvas }) => {
    const names = canvas
      .getAllByRole('img')
      .map((node) => node.textContent.trim())
    await expect(names).toEqual(['AL', 'AL', 'FR', '?'])
  },
}

export const Colors: Story = {
  args: { alt: 'primary' },
  render: () => (
    <div className="flex items-center gap-2">
      {(['primary', 'secondary', 'neutral', 'success', 'danger'] as const).map(
        (color) => (
          <Avatar key={color} alt={color} color={color} />
        ),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    const fills = canvas
      .getAllByRole('img')
      .map((node) => getComputedStyle(node).backgroundColor)
    await expect(new Set(fills).size).toBe(5)

    // Every one of them carries `ink`, which is what makes the same fill legible in both themes — and
    // which inverts with the theme, so it is read from the computed style rather than written here.
    for (const node of canvas.getAllByRole('img')) {
      await expect(getComputedStyle(node).color).toBe('oklch(0 0 none)')
    }
  },
}

export const Sizes: Story = {
  args: { alt: 'sm' },
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar alt="sm" size="sm" />
      <Avatar alt="md" size="md" />
      <Avatar alt="lg" size="lg" />
    </div>
  ),
  // Three sizes that are actually three sizes — the `Slider` taught that lesson twice, so it is checked.
  play: async ({ canvas }) => {
    const boxes = canvas
      .getAllByRole('img')
      .map((node) => Math.round(node.getBoundingClientRect().width))
    await expect(boxes).toEqual([24, 32, 40])
  },
}

export const Previewable: Story = {
  // **`isPreviewable` changes the element, not just its style.** Off, this is a `<span role="img">` that the
  // tab order skips; on, it is a real button that opens the avatar large. Both halves are asserted here,
  // because "it opens a modal" and "it is still a picture you cannot press" are different components.
  args: { alt: 'Ada Lovelace', src: IMAGE, isPreviewable: true },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', {
      name: /preview ada lovelace/i,
    })
    await expect(trigger).toHaveAttribute('data-slot', 'avatar')

    // A `span` with a click handler is reachable by mouse and by nothing else. This is what makes it
    // keyboard-operable, and it is the assertion that would fail if the element regressed to a wrapper.
    await expect(trigger.tagName).toBe('BUTTON')

    // Nothing is open until it is pressed. Paired with the assertion below, because `queryByRole` alone
    // passes whether or not the dialog exists.
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(trigger)

    const dialog = await screen.findByRole('dialog')
    // The name is announced once, by the dialog's title.
    await expect(dialog).toHaveAccessibleName('Ada Lovelace')

    // **Large, and measured.** The preview is a different box from the row's avatar — a claim about size
    // that only a measurement can settle.
    const preview = dialog.querySelector(
      '[data-slot=avatar-preview]',
    ) as HTMLElement
    await expect(preview).not.toBeNull()
    await expect(preview.getBoundingClientRect().width).toBeGreaterThan(200)

    // The picture is in the modal too, not just the initials.
    const img = preview.querySelector('img') as HTMLImageElement
    await waitFor(async () => await expect(img.naturalWidth).toBeGreaterThan(0))

    // Closing puts it away again, so the modal is driven by the trigger rather than merely rendered.
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(
      async () =>
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}
