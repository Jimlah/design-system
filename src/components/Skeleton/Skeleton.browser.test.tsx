import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Button } from '../Button/Button'
import { Skeleton, useIsSkeleton } from './Skeleton'

/**
 * `Skeleton`'s contract, in Vitest's browser mode.
 *
 * The stories document the component and check what the page claims; these check the parts a story
 * cannot reach — a media preference that has to be emulated before the component mounts, an
 * animation that has to be watched being cancelled, and a hook read from outside this library.
 *
 * The stylesheet comes from `src/browserTestSetup.ts`, wired in as `setupFiles`; without it the
 * gradient below would be read off a box that has none.
 */

/** What `window.matchMedia` answers when the reader has asked for less motion. */
function stubReducedMotion(reduced: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => {
    return {
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  })
}

test('the placeholder is the size of the content, and the content is still there', async () => {
  const screen = await render(
    <Skeleton>
      <div style={{ height: 120 }}>Placeholder copy</div>
    </Skeleton>,
  )

  const skeleton = screen.container.querySelector(
    '[data-slot="skeleton"]',
  ) as HTMLElement
  const content = skeleton.firstElementChild as HTMLElement

  // **The whole promise of a skeleton**: the subtree is hidden, not removed, so its boxes still set
  // the height and the page does not move when the real content arrives.
  expect(skeleton.getBoundingClientRect().height).toBe(120)
  expect(content.getBoundingClientRect().height).toBe(120)
  expect(getComputedStyle(content).visibility).toBe('hidden')
  expect(getComputedStyle(skeleton).visibility).toBe('visible')

  // A gradient 300% as wide as the box, so the sweep has somewhere to travel.
  const style = getComputedStyle(skeleton)
  expect(style.backgroundImage).toContain('linear-gradient')
  expect(style.backgroundSize).toBe('300% 100%')
  expect(style.backgroundRepeat).toBe('no-repeat')
})

test('nothing inside a placeholder can be reached', async () => {
  const screen = await render(
    <Skeleton>
      <Button>Retry</Button>
    </Skeleton>,
  )

  const skeleton = screen.container.querySelector(
    '[data-slot="skeleton"]',
  ) as HTMLElement
  // `inert` is what removes the subtree from the tab order and the accessibility tree — the same
  // thing React Spectrum achieves by disabling the form components inside a skeleton.
  expect(skeleton.hasAttribute('inert')).toBe(true)

  const button = skeleton.querySelector('button') as HTMLButtonElement
  button.focus()
  expect(document.activeElement).not.toBe(button)
})

test('isLoading false renders no element of its own', async () => {
  const screen = await render(
    <Skeleton isLoading={false}>
      <Button>Retry</Button>
    </Skeleton>,
  )

  expect(screen.container.querySelector('[data-slot="skeleton"]')).toBeNull()
  const button = screen.getByRole('button', { name: 'Retry' })
  await expect.element(button).toBeInTheDocument()

  // Reachable again, which is the difference between a wrapper that is gone and one that is merely
  // invisible.
  const element = button.element() as HTMLButtonElement
  element.focus()
  expect(document.activeElement).toBe(element)
})

test('every placeholder on the page sweeps on one clock', async () => {
  const screen = await render(
    <>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-40" />
    </>,
  )

  const boxes = [
    ...screen.container.querySelectorAll('[data-slot="skeleton"]'),
  ] as HTMLElement[]
  expect(boxes).toHaveLength(2)

  for (const box of boxes) {
    const animations = box.getAnimations()
    expect(animations).toHaveLength(1)
    const timing = animations[0].effect?.getTiming()
    expect(timing?.duration).toBe(2000)
    expect(timing?.iterations).toBe(Infinity)
    // `startTime` 0 rather than "now": two skeletons that mounted separately are at the same point
    // in the same cycle, which is why this is a Web Animation and not a CSS keyframe.
    expect(animations[0].startTime).toBe(0)
  }
})

test('the sweep stops when the placeholder goes away', async () => {
  const screen = await render(<Skeleton className="h-4 w-40" />)
  const box = screen.container.querySelector(
    '[data-slot="skeleton"]',
  ) as HTMLElement
  const animation = box.getAnimations()[0]
  expect(animation.playState).toBe('running')

  screen.unmount()
  expect(animation.playState).toBe('idle')
})

test('reduced motion leaves a still placeholder rather than none', async () => {
  stubReducedMotion(true)
  try {
    const screen = await render(<Skeleton className="h-4 w-40" />)
    const box = screen.container.querySelector(
      '[data-slot="skeleton"]',
    ) as HTMLElement

    // No animation...
    expect(box.getAnimations()).toHaveLength(0)
    // ...and the placeholder is still there, painted flat. Under reduced motion the state change the
    // reader asked for is removed, not the state itself.
    expect(getComputedStyle(box).backgroundImage).toContain('linear-gradient')
    expect(box.getBoundingClientRect().height).toBe(16)
  } finally {
    vi.unstubAllGlobals()
  }
})

/** A component of a consumer's own, asking whether it is inside a placeholder. */
function Probe() {
  return <span data-slot="probe">{String(useIsSkeleton())}</span>
}

test('useIsSkeleton reports the skeleton above it, and false outside one', async () => {
  const screen = await render(
    <>
      <Skeleton>
        <Probe />
      </Skeleton>
      <Probe />
    </>,
  )

  const inside = screen.container.querySelector(
    '[data-slot="skeleton"] [data-slot="probe"]',
  )
  const outside = [
    ...screen.container.querySelectorAll('[data-slot="probe"]'),
  ].find((probe) => probe.closest('[data-slot="skeleton"]') === null)

  expect(inside?.textContent).toBe('true')
  expect(outside?.textContent).toBe('false')
})
