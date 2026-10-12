import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { parseColor } from 'react-aria-components'
import { expect, waitFor } from 'storybook/test'

import { ColorSwatch } from './ColorSwatch'

const meta = {
  component: ColorSwatch,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<ColorSwatch color={parseColor('#71FFF6')} />`,
      },
    },
  },
  args: { color: parseColor('#71FFF6') },
} satisfies Meta<typeof ColorSwatch>

export default meta
type Story = StoryObj<typeof meta>

/** The five the system has, which is the whole palette a swatch is ever asked to show here. */
const PALETTE = ['#71FFF6', '#FAD14F', '#B0FBB1', '#FF9A8B', '#BFBFBF']

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const swatch = canvasElement.querySelector(
      '[data-slot=swatch]',
    ) as HTMLElement
    await expect(swatch).toBeInTheDocument()

    // **The one claim a swatch makes is the colour it paints.** Measuring it is the only assertion
    // that would notice the render prop failing and a blank square rendering instead.
    // **`waitFor`, because React Aria writes the colour in an effect.** Reading it synchronously
    // reported the swatch as transparent against a component that paints correctly — the same
    // runner-versus-page gap that has cost stories here before.
    await waitFor(() =>
      expect(getComputedStyle(swatch).backgroundColor).toBe(
        'rgb(113, 255, 246)',
      ),
    )

    // Square, 24px, and carrying the control boundary — a near-black swatch on the dark page is still
    // a swatch because of that hairline.
    const box = swatch.getBoundingClientRect()
    await expect(Math.round(box.width)).toBe(24)
    await expect(Math.round(box.height)).toBe(24)
    await expect(getComputedStyle(swatch).borderTopStyle).toBe('solid')

    // It is a picture, not a control: nothing to name, nothing to announce. The attribute is on the
    // wrapper because React Aria's own swatch is `role="img"` and keeps it off — see the component.
    await expect(swatch.parentElement).toHaveAttribute('aria-hidden', 'true')
  },
}

export const Palette: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {PALETTE.map((c) => (
        <ColorSwatch key={c} color={parseColor(c)} />
      ))}
    </div>
  ),
  // Five colours in, five distinct colours out. A swatch slot that silently painted one colour for all
  // of them is exactly the failure the `Meter`'s `tone` story caught in its first version.
  play: async ({ canvasElement }) => {
    const swatches = [
      ...canvasElement.querySelectorAll('[data-slot=swatch]'),
    ] as HTMLElement[]
    await expect(swatches).toHaveLength(PALETTE.length)

    await waitFor(() => {
      const painted = swatches.map((s) => getComputedStyle(s).backgroundColor)
      expect(new Set(painted).size).toBe(PALETTE.length)
    })
  },
}
