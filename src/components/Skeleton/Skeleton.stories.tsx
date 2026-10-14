import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import { Skeleton, useIsSkeleton } from './Skeleton'

const meta = {
  component: Skeleton,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'centered' },
  args: { isLoading: true },
  argTypes: {
    isLoading: {
      control: 'boolean',
      description:
        'Whether the content is still being fetched. False renders the children as they are.',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-[26rem]">
      <Skeleton {...args}>
        <Card>
          <Card.Header>
            <Card.Title>Uptime</Card.Title>
            <Card.Description>api-gateway · last 24 hours</Card.Description>
          </Card.Header>
          <Card.Content>
            Every monitor answered inside its window. The two that did not are
            listed below, with the minute they went quiet.
          </Card.Content>
        </Card>
      </Skeleton>
    </div>
  ),
  // Mock content inside the real component, which is how the React Spectrum docs draw one: the
  // placeholder is laid out by the markup it stands in for, so nothing moves when the data lands.
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector(
      '[data-slot="skeleton"]',
    ) as HTMLElement
    await expect(skeleton).not.toBeNull()
    const card = skeleton.firstElementChild as HTMLElement

    // **The box is the card's box.** The content is `visibility: hidden` rather than removed, so it
    // still sets the height — this equality is the entire promise a skeleton makes.
    await expect(Math.round(skeleton.getBoundingClientRect().height)).toBe(
      Math.round(card.getBoundingClientRect().height),
    )
    await expect(getComputedStyle(card).visibility).toBe('hidden')
    await expect(getComputedStyle(skeleton).visibility).toBe('visible')

    // The shimmer is a gradient three times the box's width, so the sweep has room to travel.
    const style = getComputedStyle(skeleton)
    await expect(style.backgroundImage).toContain('linear-gradient')
    await expect(style.backgroundSize).toBe('300% 100%')

    // Nothing in a placeholder is reachable: the subtree is `inert`, which is also how React
    // Spectrum disables the form components inside a skeleton.
    await expect(skeleton.hasAttribute('inert')).toBe(true)
  },
}

export const Lines: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-56" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  ),
  // A bare placeholder is sized by the caller rather than by hidden content — the granularity is
  // the caller's choice, and this is the other end of it from the wrapped card above.
  play: async ({ canvasElement }) => {
    const bars = [
      ...canvasElement.querySelectorAll('[data-slot="skeleton"]'),
    ] as HTMLElement[]
    await expect(bars).toHaveLength(6)

    const box = (index: number) => bars[index].getBoundingClientRect()
    await expect(box(0).height).toBe(16)
    await expect(box(0).width).toBe(160)
    await expect(box(3).width).toBe(40)
    await expect(box(3).height).toBe(40)
    // The avatar is the round one: `rounded-full` is a pill, whatever the radius token says.
    await expect(
      parseFloat(getComputedStyle(bars[3]).borderTopLeftRadius),
    ).toBeGreaterThan(100)
    await expect(getComputedStyle(bars[0]).borderTopLeftRadius).toBe('0px')

    // Each box carries the shimmer and its own sweep — six placeholders, six animations, all of
    // them at the same point in the same cycle.
    for (const bar of bars) {
      await expect(getComputedStyle(bar).backgroundImage).toContain(
        'linear-gradient',
      )
      await expect(bar.getAnimations()).toHaveLength(1)
    }
    const starts = bars.map((bar) => bar.getAnimations()[0].startTime)
    await expect(starts.every((start) => start === 0)).toBe(true)
  },
}

export const Loaded: Story = {
  render: () => (
    <div className="w-[26rem]">
      <Skeleton isLoading={false}>
        <Card>
          <Card.Header>
            <Card.Title>Uptime</Card.Title>
            <Card.Description>api-gateway · last 24 hours</Card.Description>
          </Card.Header>
          <Card.Content>
            Every monitor answered inside its window.
            <div className="pt-3">
              <Button variant="outline">Retry</Button>
            </div>
          </Card.Content>
        </Card>
      </Skeleton>
    </div>
  ),
  // When there is nothing to wait for, this component renders no element of its own: the card is
  // the story root's child, its text is visible, and the button inside it can be reached again.
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="skeleton"]'),
    ).toBeNull()

    const text = canvas.getByText('Every monitor answered inside its window.')
    await expect(getComputedStyle(text).visibility).toBe('visible')

    const button = canvas.getByRole('button', { name: 'Retry' })
    await expect(button.closest('[data-slot="skeleton"]')).toBeNull()
    button.focus()
    await expect(document.activeElement).toBe(button)
  },
}

export const Synchronized: Story = {
  render: () => (
    <div className="flex w-[36rem] gap-6">
      <Skeleton className="h-24 flex-1" />
      <Skeleton className="h-24 flex-1" />
    </div>
  ),
  // **The reason the shimmer is a Web Animation and not a CSS keyframe.** A keyframe starts when its
  // element mounts, so two placeholders that appeared a second apart sweep out of step and read as
  // two things loading rather than one screen. Every skeleton sets `startTime` to 0 instead — React
  // Spectrum's own technique — so they share a clock.
  play: async ({ canvasElement }) => {
    const [first, second] = [
      ...canvasElement.querySelectorAll('[data-slot="skeleton"]'),
    ] as HTMLElement[]

    const animations = [first, second].map((box) => box.getAnimations())
    for (const [animation] of animations) {
      const timing = animation.effect?.getTiming()
      await expect(timing?.duration).toBe(2000)
      await expect(timing?.iterations).toBe(Infinity)
      await expect(animation.startTime).toBe(0)
    }
  },
}

/**
 * A consumer's own component, opting in the way every React Spectrum component does — the hook is
 * the only way something outside this library can tell that it is inside a placeholder.
 */
function Uptime({ percent }: { percent: number }) {
  if (useIsSkeleton()) {
    // Nothing under a skeleton is visible, so there is no point measuring a chart into one.
    return <div data-slot="uptime-placeholder" className="h-6 w-24" />
  }
  return (
    <div data-slot="uptime" className="text-[13px] text-foreground">
      {percent}%
    </div>
  )
}

export const OptIn: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Skeleton>
        <Uptime percent={99.98} />
      </Skeleton>
      <Uptime percent={99.98} />
    </div>
  ),
  // Inside the skeleton the component drew its placeholder; outside it, the reading. The hook
  // reports the ancestor it is actually under, not a global that happens to be true.
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector(
        '[data-slot="skeleton"] [data-slot="uptime-placeholder"]',
      ),
    ).not.toBeNull()
    await expect(
      canvasElement.querySelector('[data-slot="uptime"]'),
    ).not.toBeNull()
    await expect(
      canvasElement.querySelector(
        '[data-slot="skeleton"] [data-slot="uptime"]',
      ),
    ).toBeNull()
  },
}
