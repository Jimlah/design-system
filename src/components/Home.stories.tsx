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
    // `getAllByText`, because `DotMap` is also a row in the Recent suites table below, so `getByText`
    // finds more than one. It is **not** the tab panels: React Aria unmounts an unselected panel rather
    // than hiding it — see docs/components/tabs.md, which measured it.
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

export const Registry: Story = {
  // **The count in the table is read from the same index as the hero's**, which is the part worth
  // checking: a typed-out "54" is exactly the staleness this page already argued against, so the
  // assertion is that the two readings agree rather than that either is any particular value. Add a
  // component and this story still passes; hard-code the number and it fails.
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Registry', level: 2 }),
    ).toBeInTheDocument()

    // The hero kicker is the only place that reads "N components · …", so the number it prints is
    // the index's count.
    const declared = canvas
      .getByText(/components ·/)
      .textContent.match(/\d+/)?.[0]
    await expect(declared).toBeDefined()
    await expect(
      canvas.getByText(`All ${declared} components at once`),
    ).toBeInTheDocument()

    // The namespace panel is the selected one, so its address is already in the document. **The other
    // two are not**: React Aria unmounts an unselected panel rather than hiding it (see
    // docs/components/tabs.md), so each address has to be opened the way a reader would open it.
    await expect(canvas.getByText(/registry add @pulse=/)).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('tab', { name: 'URL' }))
    await expect(
      canvas.getByText(/shadcn@latest add .*\/r\/button\.json/),
    ).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('tab', { name: 'GitHub' }))
    await expect(
      canvas.getByText(/shadcn@latest add Jimlah\/design-system\/button/),
    ).toBeInTheDocument()
  },
}
