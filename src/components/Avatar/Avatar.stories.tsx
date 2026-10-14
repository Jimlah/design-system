import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Card } from '../Card/Card'
import { Avatar, AvatarGroup } from './Avatar'

/** A real, loadable image with no network involved. */
const IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%2371FFF6'/%3E%3C/svg%3E"

const meta = {
  component: Avatar,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: { 'Avatar.Group': AvatarGroup },
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

/* ==========================================================================
   Avatar.Group — several of them
   ========================================================================== */

/** The face boxes of one group, in the order they are stacked. */
const faceBoxes = (group: HTMLElement) =>
  [...group.querySelectorAll<HTMLElement>('[data-slot=avatar]')].map((node) =>
    node.getBoundingClientRect(),
  )

/** How far each face steps past the one before it: the avatar's width less the overlap. */
const step = (group: HTMLElement) => {
  const boxes = faceBoxes(group)
  return Math.round(boxes[1].left - boxes[0].left)
}

/**
 * The colour of the ring that cuts a face out of the one behind it.
 *
 * **From the painted shadow, not from `--tw-ring-color`.** That property holds the token *expression* —
 * `light-dark(oklch(100% 0 none), oklch(0% 0 none))` — because an unregistered custom property is not
 * resolved at computed-value time. The box-shadow is, so the layer carrying the ring's 2px spread is what
 * the browser is actually painting, and it is that colour which has to equal the surface's.
 */
const ringColour = (node: Element) =>
  (
    getComputedStyle(node)
      .boxShadow.split(', ')
      .find((layer) => layer.includes('2px')) ?? ''
  )
    .replace(' 0px 0px 0px 2px', '')
    .trim()

export const Group: Story = {
  args: { alt: 'Ada Lovelace' },
  parameters: {
    docs: {
      source: {
        code: `<Avatar.Group label="4 teammates">
  <Avatar alt="Ada Lovelace" src="/ada.png" />
  <Avatar alt="Grace Hopper" src="/grace.png" />
  <Avatar alt="Karen Spärck Jones" />
</Avatar.Group>`,
      },
    },
  },
  render: () => (
    <Avatar.Group label="4 teammates">
      {TEAM.map((name, index) => (
        // The first has a picture and the rest have initials, which is what a real stack looks like —
        // and both are the same box, so the ring and the overlap do not care which it is.
        <Avatar key={name} alt={name} src={index === 0 ? IMAGE : undefined} />
      ))}
    </Avatar.Group>
  ),
  play: async ({ canvas, canvasElement }) => {
    // **The group is a real `role="group"` with a name**, which is the whole of what React Aria's `Group`
    // buys here: a screen reader says "4 teammates, group" and then the four names inside it.
    const group = canvas.getByRole('group', { name: '4 teammates' })
    await expect(group).toHaveAttribute('data-slot', 'avatar-group')

    // Four faces, each still its own picture with its own name.
    const faces = canvas.getAllByRole('img')
    await expect(faces).toHaveLength(4)
    await expect(
      canvas.getByRole('img', { name: 'Grace Hopper' }),
    ).toBeVisible()

    // **The overlap, measured rather than asserted by class.** A quarter of a 24px avatar is covered, so
    // the second face starts 18px along — and every size below moves that number with it.
    await expect(step(group)).toBe(18)

    // ...and the cut-out ring is the page the group is standing on, not a colour of its own.
    await expect(ringColour(faces[0])).toBe(
      getComputedStyle(document.body).backgroundColor,
    )
    // The ring follows the avatar's own radius, which this system squares off.
    await expect(
      parseFloat(getComputedStyle(faces[0]).borderTopLeftRadius),
    ).toBe(0)

    await expect(
      canvasElement.querySelectorAll('[data-slot=avatar-group]'),
    ).toHaveLength(1)
  },
}

export const GroupSizes: Story = {
  args: { alt: 'Ada Lovelace' },
  parameters: {
    docs: {
      source: {
        code: `<Avatar.Group size="lg" label="3 teammates">…</Avatar.Group>
<Avatar.Group size="sm">
  <Avatar alt="Ada Lovelace" size="lg" />
  <Avatar alt="Grace Hopper" />
</Avatar.Group>`,
      },
    },
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Avatar.Group key={size} size={size} label={size}>
          {TEAM.slice(0, 3).map((name) => (
            <Avatar key={name} alt={name} />
          ))}
        </Avatar.Group>
      ))}
      {/* An avatar that names its own size is the exception, and it keeps it — a group sizes its
          children by default, it does not overrule them. */}
      <Avatar.Group size="sm" label="one of these is not like the others">
        <Avatar alt="Ada Lovelace" size="lg" />
        <Avatar alt="Grace Hopper" />
      </Avatar.Group>
    </div>
  ),
  // **Three sizes that are three sizes**, and three overlaps that follow them: the overlap is a quarter
  // of the avatar, so 24px steps 18, 32 steps 24 and 40 steps 30.
  play: async ({ canvas }) => {
    const widths = ['sm', 'md', 'lg'].map(
      (size) =>
        canvas
          .getByRole('group', { name: size })
          .querySelector('[data-slot=avatar]') as HTMLElement,
    )
    await expect(
      widths.map((node) => Math.round(node.getBoundingClientRect().width)),
    ).toEqual([24, 32, 40])

    const steps = ['sm', 'md', 'lg'].map((size) =>
      step(canvas.getByRole('group', { name: size })),
    )
    await expect(steps).toEqual([18, 24, 30])

    // The exception, checked: 40px inside a group that is handing out 24.
    const mixed = canvas.getByRole('group', {
      name: 'one of these is not like the others',
    })
    const own = [...mixed.querySelectorAll<HTMLElement>('[data-slot=avatar]')]
    await expect(
      own.map((node) => Math.round(node.getBoundingClientRect().width)),
    ).toEqual([40, 24])
  },
}

export const GroupLabel: Story = {
  args: { alt: 'Ada Lovelace' },
  parameters: {
    docs: {
      source: {
        code: `<Avatar.Group label="4 teammates">…</Avatar.Group>
<Avatar.Group label="4 teammates" aria-label="People on this board">…</Avatar.Group>`,
      },
    },
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Avatar.Group label="4 teammates">
        {TEAM.map((name) => (
          <Avatar key={name} alt={name} />
        ))}
      </Avatar.Group>
      {/* `aria-label` is the caller's name and wins over the visible one, which is what a group whose
          visible text is not a good name — a count, an abbreviation — needs. */}
      <Avatar.Group label="4 teammates" aria-label="People on this board">
        {TEAM.map((name) => (
          <Avatar key={name} alt={name} />
        ))}
      </Avatar.Group>
    </div>
  ),
  play: async ({ canvas }) => {
    // Found by its name, which is the label's own text: the label names the group rather than sitting
    // beside it unconnected.
    const named = canvas.getByRole('group', { name: '4 teammates' })
    await expect(named).toHaveTextContent('4 teammates')
    // ...and the name really came from that text, not from a hardcoded string.
    const label = named.querySelector(
      '[data-slot=avatar-group-label]',
    ) as HTMLElement
    await expect(label.id).not.toBe('')
    await expect(named.getAttribute('aria-labelledby')).toBe(label.id)

    // **The label sits after the stack, clear of it.** It is a child of the same flex row, so it is one
    // class away from inheriting the overlap the faces wear — measured, and it did.
    const faces = [...named.querySelectorAll<HTMLElement>('[data-slot=avatar]')]
    const lastFace = faces.at(-1) as HTMLElement
    await expect(
      label.getBoundingClientRect().left >=
        lastFace.getBoundingClientRect().right,
    ).toBe(true)

    const overridden = canvas.getByRole('group', {
      name: 'People on this board',
    })
    await expect(overridden).toBeInTheDocument()
    // The visible label is still there — it is overridden as a name, not hidden.
    await expect(overridden).toHaveTextContent('4 teammates')
  },
}

export const GroupOverflow: Story = {
  args: { alt: 'Ada Lovelace' },
  parameters: {
    docs: {
      source: {
        code: `<Avatar.Group label="5 teammates" max={3}>…</Avatar.Group>
<Avatar.Group label="8 teammates" max={3} overflowCount={5}>…</Avatar.Group>`,
      },
    },
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {/* Five faces, three of them shown. */}
      <Avatar.Group label="5 teammates" max={3}>
        {[...TEAM, 'Katherine Johnson'].map((name) => (
          <Avatar key={name} alt={name} />
        ))}
      </Avatar.Group>
      {/* Four faces and a set of five the page has not loaded: the counter says the caller's number
          rather than counting the children, which is the case for any list that arrives a page at a
          time. */}
      <Avatar.Group label="8 teammates" max={3} overflowCount={5}>
        {TEAM.map((name) => (
          <Avatar key={name} alt={name} />
        ))}
      </Avatar.Group>
      {/* A fragment is looked through rather than counted as one child — the same stack, written the
          other way round. */}
      <Avatar.Group label="fragment" max={2}>
        <>
          {[...TEAM, 'Katherine Johnson'].map((name) => (
            <Avatar key={name} alt={name} />
          ))}
        </>
      </Avatar.Group>
    </div>
  ),
  play: async ({ canvas }) => {
    // **The faces are gone, not hidden**: three avatars in the DOM and a counter, and the two that were
    // left out are nowhere in the accessibility tree either.
    const trimmed = canvas.getByRole('group', { name: '5 teammates' })
    await expect(trimmed.querySelectorAll('[data-slot=avatar]')).toHaveLength(3)
    await expect(
      trimmed.querySelector('[data-slot=avatar-group-overflow]'),
    ).toHaveTextContent('+2')
    await expect(
      canvas.queryByRole('img', { name: 'Katherine Johnson' }),
    ).not.toBeInTheDocument()

    // The counter is named for what it means rather than for the characters it draws.
    const counter = trimmed.querySelector(
      '[data-slot=avatar-group-overflow]',
    ) as HTMLElement
    await expect(counter.getAttribute('aria-label')).toBe('2 more')
    await expect(counter.getAttribute('role')).toBe('img')
    // It is the avatar's own box, so the stack stays one height.
    await expect(Math.round(counter.getBoundingClientRect().height)).toBe(24)

    // The caller's number, when the children are not the whole group.
    await expect(
      canvas
        .getByRole('group', { name: '8 teammates' })
        .querySelector('[data-slot=avatar-group-overflow]'),
    ).toHaveTextContent('+5')

    // ...and the fragment was flattened: two faces shown, three counted.
    const nested = canvas.getByRole('group', { name: 'fragment' })
    await expect(nested.querySelectorAll('[data-slot=avatar]')).toHaveLength(2)
    await expect(
      nested.querySelector('[data-slot=avatar-group-overflow]'),
    ).toHaveTextContent('+3')
  },
}

export const GroupOnPanel: Story = {
  args: { alt: 'Ada Lovelace' },
  parameters: {
    docs: {
      source: {
        code: `<Avatar.Group label="3 on call" className="[--avatar-ring:var(--color-card)]">
  …
</Avatar.Group>`,
      },
    },
  },
  render: () => (
    <Card className="w-80">
      <Card.Header>
        <Card.Title>On call</Card.Title>
      </Card.Header>
      <Card.Content>
        {/* **The ring is the surface the stack stands on**, so on a panel it is the panel's colour and
            not the page's — one custom property, declared by the caller, which is why this is possible
            without a second component. */}
        <Avatar.Group
          label="3 on call"
          className="[--avatar-ring:var(--color-card)]"
        >
          {TEAM.slice(0, 3).map((name) => (
            <Avatar key={name} alt={name} />
          ))}
        </Avatar.Group>
      </Card.Content>
    </Card>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot=card]') as HTMLElement
    const face = canvas
      .getByRole('group', { name: '3 on call' })
      .querySelector('[data-slot=avatar]') as Element

    // The panel's colour, and not the page's — which is the whole point of the property.
    await expect(ringColour(face)).toBe(getComputedStyle(card).backgroundColor)
    await expect(ringColour(face)).not.toBe(
      getComputedStyle(document.body).backgroundColor,
    )
  },
} /** Four teammates' names, and a fifth when a counter is the point. */
const TEAM = [
  'Ada Lovelace',
  'Grace Hopper',
  'Karen Spärck Jones',
  'Mary Jackson',
]
