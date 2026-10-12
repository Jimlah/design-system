import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'

import { VisuallyHidden } from './VisuallyHidden'

const meta = {
  component: VisuallyHidden,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<VisuallyHidden>Checked every 60 seconds</VisuallyHidden>`,
      },
    },
  },
} satisfies Meta<typeof VisuallyHidden>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <p className="text-[13px] text-fg">
      Uptime
      <VisuallyHidden>— checked every 60 seconds</VisuallyHidden>
    </p>
  ),
  play: async () => {
    const hidden = screen.getByText(/checked every 60 seconds/)

    // **Still in the accessibility tree.** `display: none` and `visibility: hidden` would both take it
    // out, which is the whole reason this component exists rather than a plain hidden element.
    await expect(hidden).toBeVisible()

    // **And it is inline.** React Aria renders a `<div>` by default, which is invalid inside the sentence
    // this component exists to live in — the browser reports "a `<p>` cannot contain a nested `<div>`" and
    // a block box lands in the middle of the text. The first version of this component did that; the
    // console warning was the only evidence, and no assertion was watching for it.
    await expect(hidden.tagName).toBe('SPAN')
    await expect(getComputedStyle(hidden).display).not.toBe('none')
    await expect(getComputedStyle(hidden).visibility).not.toBe('hidden')

    // And out of the layout: a clipped one-pixel box, so it takes no space and cannot be seen.
    const box = hidden.getBoundingClientRect()
    await expect(box.width).toBeLessThanOrEqual(1)
    await expect(box.height).toBeLessThanOrEqual(1)
    await expect(getComputedStyle(hidden).clipPath).not.toBe('none')
  },
}
