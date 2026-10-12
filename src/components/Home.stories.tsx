import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Home } from './Home'

const meta = {
  component: Home,
  tags: ['ai-generated'],
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The render above already fails if the component throws or fails to mount, so a `toBeVisible` smoke play
// would prove nothing extra. This play proves the shared preview actually loaded the app's global
// stylesheet — which is the one thing a story can check that the app build cannot.
export const CssCheck: Story = {
  play: async ({ canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { name: /pulse/i, level: 1 })
    const wrapper = canvasElement.firstElementChild as HTMLElement

    // `text-[40px]` and `font-semibold` from src/components/Home.tsx — both resolve to nothing if Tailwind
    // or src/styles.css failed to load, which is the only thing this story is for.
    await expect(getComputedStyle(heading).fontSize).toBe('40px')
    await expect(getComputedStyle(heading).fontWeight).toBe('600')

    // `py-10` = 2.5rem.
    await expect(getComputedStyle(wrapper).paddingTop).toBe('40px')

    // ...and real Pulse components rendered, which is the SSR check the page exists for: React Aria ships a
    // `client-only` guard, so a page full of primitives mounting at all is the proof.
    await expect(canvas.getByRole('navigation')).toBeInTheDocument()
    await expect(
      canvas.getByRole('tab', { name: 'Charts' }),
    ).toBeInTheDocument()
  },
}

export const ComponentIndex: Story = {
  // **The index is derived from the filesystem**, which is the whole claim: the previous version of this
  // page argued that a hand-written list "goes stale the first time one is added", and it was right. This
  // asserts the list is populated from real directories rather than typed out — and that the filter built
  // on top of it actually filters.
  play: async ({ canvas }) => {
    // Charts is not the default tab, so the panel has to be opened the way a reader would.
    await userEvent.click(canvas.getByRole('tab', { name: 'Charts' }))
    // `getAllByText`, because every tab panel is in the DOM — React Aria hides inactive panels rather
    // than unmounting them, so `getByText` finds the same entry more than once. The first version of this
    // assertion threw on exactly that.
    await expect(canvas.getAllByText('DotMap').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Sparkline').length).toBeGreaterThan(0)

    // Filter to something in a different group: the Charts panel has nothing to show, and says so rather
    // than going blank.
    const filter = canvas.getByRole('searchbox', { name: /filter/i })
    await userEvent.type(filter, 'button')
    // **Scoped to the index, not the page.** `DotMap` is also a row in the Recent suites table below, so
    // `queryAllByText` finds it whatever the filter does — the first version of this asserted on the whole
    // canvas and failed on a `<td>`. The placeholder is the index's own empty state, which is the check
    // that actually belongs to the filter.
    await expect(canvas.getAllByText(/nothing here/i).length).toBeGreaterThan(0)

    // Clearing brings it back, so the empty state is the filter's doing and not a mount failure.
    await userEvent.clear(filter)
    await expect(canvas.getAllByText('DotMap').length).toBeGreaterThan(0)
  },
}
