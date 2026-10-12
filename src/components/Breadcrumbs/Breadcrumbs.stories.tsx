import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { Breadcrumbs, BreadcrumbsItem } from './Breadcrumbs'

const meta = {
  component: Breadcrumbs,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: { 'Breadcrumbs.Item': BreadcrumbsItem },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Breadcrumbs label="Breadcrumb">
  <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
  <Breadcrumbs.Item href="/monitors/fra1">fra1</Breadcrumbs.Item>
  <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
</Breadcrumbs>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Breadcrumbs label="Breadcrumb">
      <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/monitors/fra1">fra1</Breadcrumbs.Item>
      <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // **React Aria renders the `<ol>` and not the landmark**, so the `<nav>` is this component's own.
    // Without it the trail was a list of links in no landmark at all — invisible to the shortcut a
    // screen reader user reaches navigation with, which is the whole reason a breadcrumb is one.
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(nav.tagName).toBe('NAV')
    await expect(nav.querySelector('ol')).toBeInTheDocument()
    await expect(nav.querySelector('ol')).not.toHaveAttribute('role')
    await expect(canvasElement.querySelectorAll('li')).toHaveLength(3)

    // The step's type is the **caps link's own** — the sheet's `.ds-link-caps`, 14px, uppercase and
    // letterspaced, quiet at 70% until hovered. There is no font size on the item, because one there
    // would lose the cascade to the link's and pretending otherwise made this assertion wrong once.
    const first = canvas.getByRole('link', { name: 'Monitors' })
    await expect(getComputedStyle(first).fontSize).toBe('14px')
    await expect(getComputedStyle(first).textTransform).toBe('uppercase')
    // 14px at the sheet's `-0.01em`, which is the caps link's own tracking.
    await expect(getComputedStyle(first).letterSpacing).toBe('-0.14px')
  },
}

export const Current: Story = {
  // The last step is the page you are on, so it is **not** a link — there is nowhere to go — and it is
  // marked `aria-current="page"` at full strength while the trail above it stays quiet.
  play: async ({ canvas, canvasElement }) => {
    const last = canvasElement.querySelector('li:last-child') as HTMLElement
    await expect(last.querySelector('a')).toBeNull()

    const current = canvas.getByText('Frankfurt')
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(getComputedStyle(current).color).toBe('oklch(1 0 none)')

    // ...and the two above it are real anchors, so middle-click and "open in a new tab" work.
    const links = [...canvasElement.querySelectorAll('a')]
    await expect(links).toHaveLength(2)
    await expect(links[0]).toHaveAttribute('href', '/monitors')
    // The caps link's own resting colour — 70% — wins over the trail's 45%, because the link is the
    // thing the reader is deciding whether to follow. The 45% is only what a step that is neither a
    // link nor the current page would be, and there is no such step in a trail.
    await expect(getComputedStyle(links[0]).color).toBe('oklab(1 0 0 / 0.7)')
  },
}

export const Separator: Story = {
  // The slash belongs to the item, and only between two of them: the last one has nothing after it to
  // separate, and `last:after:content-none` is what stops a trail ending in a stray `/`. That is a
  // pseudo-element and rightly so — a slash carries no text, cannot be pressed, and needs no name,
  // unlike the caret in `Nav` that had to become a real button.
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll('li')]
    const shown = items.map((li) => getComputedStyle(li, '::after').content)
    await expect(shown[0]).toBe('"/"')
    await expect(shown[1]).toBe('"/"')
    await expect(shown[2]).toBe('none')

    // ...and it is drawn in the softest tone the system has, so it reads as punctuation and not as
    // another step.
    await expect(getComputedStyle(items[0], '::after').color).toBe(
      'oklab(1 0 0 / 0.3)',
    )
  },
}

export const Deep: Story = {
  render: () => (
    <Breadcrumbs label="Breadcrumb">
      <Breadcrumbs.Item href="/">Overview</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/orgs">Acme</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/orgs/acme/projects">Projects</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/orgs/acme/projects/pulse">
        Pulse
      </Breadcrumbs.Item>
      <Breadcrumbs.Item href="/orgs/acme/projects/pulse/monitors">
        Monitors
      </Breadcrumbs.Item>
      <Breadcrumbs.Item>fra1 · Frankfurt</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
  // A trail deep enough to be worth having is also long enough to run out of room. **React Aria drops
  // the middle and keeps the ends**, because a trail that wraps to a second line pushes the page down
  // every time a window is resized — which is the sort of thing a breadcrumb exists to avoid.
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll('li')]
    await expect(items).toHaveLength(6)
    await expect(canvasElement.querySelectorAll('a')).toHaveLength(5)

    // The first and the last are always the two that matter: where you came from and where you are.
    await expect(items[0]).toHaveTextContent('Overview')
    await expect(items[5]).toHaveTextContent('fra1 · Frankfurt')
  },
}

export const Wraps: Story = {
  render: () => (
    <div className="w-44">
      <Breadcrumbs label="Breadcrumb">
        <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/monitors/fra1">fra1</Breadcrumbs.Item>
        <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  ),
  // In a container too narrow for the trail, it **wraps** rather than scrolling sideways or clipping.
  // A trail that hides half of itself inside an `overflow: hidden` is a trail nobody can use on a
  // phone — and the steps have to be `shrink-0` for the wrap to happen at all, which the first version
  // of this story found the hard way.
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('ol') as HTMLElement
    await expect(getComputedStyle(list).flexWrap).toBe('wrap')

    const items = [...canvasElement.querySelectorAll('li')]
    // A step keeps its width rather than narrowing, which is what gives `flex-wrap` something to do.
    for (const li of items) {
      await expect(getComputedStyle(li).flexShrink).toBe('0')
    }

    // ...and every link is still reachable, whatever the container did to the wrapping.
    await expect(canvasElement.querySelectorAll('a')).toHaveLength(2)
  },
}

export const Keyboard: Story = {
  // The steps are ordinary links in the tab order, so the trail is walked with Tab like any other run
  // of anchors — no roving tabindex, no arrow keys, nothing to learn.
  play: async ({ canvasElement }) => {
    const links = [...canvasElement.querySelectorAll('a')] as HTMLElement[]
    for (const link of links) {
      link.focus()
      await expect(document.activeElement).toBe(link)
    }
    await expect(links[0].tabIndex).toBe(0)
    await expect(links[1].tabIndex).toBe(0)

    // There is deliberately **no click here**. The steps are real anchors with real `href`s, so clicking
    // one navigates the story's own frame away and takes the browser connection with it — which is how
    // this story spent three runs reporting "Browser connection was closed" and three passes out of six.
    // That the links are reachable is the claim; following them is the browser's job, not the runner's.
  },
}
