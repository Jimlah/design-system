import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import { SharedElement, SharedElementTransition } from './SharedElement'

const meta = {
  component: SharedElement,
  // `name` is required, so Storybook wants it in `args` even though the story renders explicitly.
  args: { name: 'marker' },
  // **No `subcomponents`.** `SharedElementTransition` is not a slot of `SharedElement` — it is the scope
  // the element has to live in, and the two are documented together rather than nested.
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<SharedElementTransition>
  {atTop ? (
    <header><SharedElement name="marker" className="size-2 bg-primary" /></header>
  ) : (
    <footer><SharedElement name="marker" className="size-2 bg-primary" /></footer>
  )}
</SharedElementTransition>`,
      },
    },
  },
} satisfies Meta<typeof SharedElement>

export default meta
type Story = StoryObj<typeof meta>

function Moving() {
  const [atTop, setAtTop] = useState(true)
  const marker = <SharedElement name="marker" className="size-2 bg-primary" />
  return (
    <SharedElementTransition>
      <div className="flex w-56 flex-col items-start gap-3">
        <div data-slot="top" className="flex h-8 items-center">
          {atTop ? marker : null}
        </div>
        <div data-slot="bottom" className="flex h-8 items-center">
          {atTop ? null : marker}
        </div>
        <Button onPress={() => setAtTop((v) => !v)}>Move</Button>
      </div>
    </SharedElementTransition>
  )
}

export const Default: Story = {
  render: () => <Moving />,
  play: async () => {
    const marker = () => document.querySelector('[data-slot=shared-element]')

    // It starts in one place...
    await expect(marker()).not.toBeNull()
    await expect(marker()?.parentElement?.getAttribute('data-slot')).toBe('top')

    // ...and **the same `name` rendered elsewhere is the same element that moved**, which is the whole
    // contract: React Aria animates it from where it was to where it goes rather than replacing it.
    await userEvent.click(screen.getByRole('button', { name: 'Move' }))

    await expect(marker()?.parentElement?.getAttribute('data-slot')).toBe(
      'bottom',
    )
    await expect(marker()).not.toBeNull()
  },
}
