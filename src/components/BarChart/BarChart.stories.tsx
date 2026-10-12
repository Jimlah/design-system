import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import { BarChart } from './BarChart'

const VALUES = [12, 30, 18, 44, 26, 9]
const LABELS = ['00', '04', '08', '12', '16', '20']

const meta = {
  component: BarChart,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      source: {
        code: `<BarChart
  values={[12, 30, 18, 44, 26, 9]}
  labels={['00', '04', '08', '12', '16', '20']}
  highlightIndex={3}
  label="Requests per four hours"
/>`,
      },
    },
  },
} satisfies Meta<typeof BarChart>

export default meta
type Story = StoryObj<typeof meta>

/** Every bar's geometry, read back off the element it was drawn on. */
const bars = (svg: Element) =>
  [...svg.querySelectorAll('[data-slot=bar-chart-bar]')].map((bar) => ({
    x: Number(bar.getAttribute('x')),
    y: Number(bar.getAttribute('y')),
    width: Number(bar.getAttribute('width')),
    height: Number(bar.getAttribute('height')),
    fill: getComputedStyle(bar).fill,
    highlighted: bar.getAttribute('data-highlighted') === 'true',
  }))

export const Default: Story = {
  args: { values: VALUES, labels: LABELS, label: 'Requests per four hours' },
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /requests per four hours/i })
    // **It has a box.** A `<svg>` with a viewBox and no size collapses to nothing; that is how the
    // Sparkline shipped invisible, so it is the first thing checked here too.
    const box = svg.getBoundingClientRect()
    await expect(Math.round(box.width)).toBe(720)
    await expect(Math.round(box.height)).toBe(256)

    const drawn = bars(svg)
    await expect(drawn).toHaveLength(VALUES.length)

    // **The tallest value is the tallest bar.** SVG y grows downward, so the peak (44, index 3) must have
    // the smallest y — and the shortest (9, index 5) the largest. A chart can have the right number of
    // rectangles and still draw the wrong one tall.
    await expect(drawn[3].height).toBeGreaterThan(drawn[0].height)
    await expect(drawn[5].height).toBeLessThan(drawn[1].height)

    // **Every bar stands on the baseline**, which is the 1px rule at the bottom of the plotting area.
    for (const bar of drawn) {
      await expect(Math.round(bar.y + bar.height)).toBe(255)
    }

    // ...and none of them is wider than the slot it was given.
    await expect(drawn[0].width).toBeLessThanOrEqual(720 / VALUES.length)

    // **The dot zone actually paints.** The `<pattern>` carried a hardcoded id while the rect referenced
    // `patternId` — so the fill pointed at a definition that did not exist and the texture rendered as
    // nothing at all, silently, because an SVG resolves a broken `url(#…)` to transparent rather than to an
    // error. Every assertion in this file passed. This one checks that the id the rect asks for is the id
    // the pattern defines.
    const zone = svg.querySelector(
      '[data-slot=bar-chart-zone]',
    ) as SVGRectElement
    const reference = zone.getAttribute('fill')!.replace(/^url\(#|\)$/g, '')
    await expect(svg.querySelector(`pattern[id="${reference}"]`)).not.toBeNull()

    // The axis is the replica's `.dash-axis`: one label per bar, under it, in order.
    const axis = [...canvas.getAllByText(/^\d\d$/)].map((node) =>
      node.textContent.trim(),
    )
    await expect(axis).toEqual(LABELS)
  },
}

export const Highlighted: Story = {
  args: {
    values: VALUES,
    labels: LABELS,
    highlightIndex: 3,
    label: 'Requests per four hours',
  },
  // **One bar in the accent, the rest grey.** This is the replica's `b[3]` flag and the whole reason the
  // chart is a monitoring chart: the interesting bar is the one the page is about.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /requests/i })
    const drawn = bars(svg)

    const accent = drawn.filter(
      (bar) => bar.fill === 'oklch(0.9198 0.1236 189.5)',
    )
    await expect(accent).toHaveLength(1)
    await expect(drawn[3].highlighted).toBe(true)
    await expect(drawn[3].fill).toBe('oklch(0.9198 0.1236 189.5)')

    // The others are `--chart-1`, a mid grey that does **not** invert with the theme. A chart in which
    // every bar is teal has stopped saying which one matters.
    await expect(drawn[0].fill).not.toBe(drawn[3].fill)
    await expect(new Set(drawn.map((bar) => bar.fill)).size).toBe(2)
  },
}

export const Zeroes: Story = {
  args: {
    values: [0, 0, 0, 0],
    labels: ['00', '04', '08', '12'],
    label: 'Nothing happened',
  },
  // A series with no range has nothing to scale into. The failure shape is a `NaN` in the height
  // attribute, which draws nothing and reports no error — so it is checked rather than assumed.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /nothing happened/i })
    const drawn = bars(svg)
    await expect(drawn).toHaveLength(4)
    for (const bar of drawn) {
      await expect(Number.isFinite(bar.height)).toBe(true)
      await expect(Number.isFinite(bar.y)).toBe(true)
    }
    await expect(
      svg.querySelectorAll('[data-slot=bar-chart-bar]'),
    ).toHaveLength(4)
  },
}

export const WithoutAxis: Story = {
  args: { values: VALUES, label: 'No labels given' },
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /no labels given/i })
    await expect(bars(svg)).toHaveLength(6)
    // No `labels` means no axis row at all, rather than an empty one taking up its 24px.
    await expect(
      document.querySelector('[data-slot=bar-chart-axis]'),
    ).toBeNull()
  },
}

export const Readout: Story = {
  args: { values: VALUES, labels: LABELS, label: 'Requests per four hours' },
  // **The readout follows the pointer to the bar under it.** `system.js` does this on `pointermove` with a
  // tolerance rather than a per-bar event, so a pointer just past a bar's edge still reads that bar — and
  // the replica measures the pointer in the chart's own units, which is what keeps it right when the drawing
  // is stretched.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /requests per four hours/i })
    const wrapper = svg.closest('[data-slot=bar-chart]') as HTMLElement

    await expect(
      wrapper.querySelector('[data-slot=bar-chart-tooltip]'),
    ).toBeNull()

    // The peak is index 3 of six, so its centre sits at 3.5/6 of the width — and 44 is its value.
    // **The coordinate is a fraction of the wrapper, not of the drawing.** `userEvent.pointer` measures
    // from the target's own box, and the wrapper is a block flex container — it is as wide as the story's
    // padding allows, not 720px. The first version of this used 720 and landed on the third bar, which is
    // exactly the mistake the component's own conversion exists to avoid.
    const wrapperWidth = wrapper.getBoundingClientRect().width
    await userEvent.pointer({
      target: wrapper,
      coords: { x: (3.5 / 6) * wrapperWidth, y: 120 },
    })
    // **Queried by slot, not by text.** The readout renders its label and its value as two adjacent text
    // nodes, so `getByText('12 · 44')` cannot match across them — which is what this assertion said first.
    const readout = await waitFor(() => {
      const node = wrapper.querySelector('[data-slot=bar-chart-tooltip]')
      if (!node) throw new Error('no readout')
      return node as HTMLElement
    })
    await expect(readout.textContent.trim()).toBe('12 · 44')

    await expect(readout).toHaveAttribute('aria-hidden', 'true')

    // Leaving the chart takes it away rather than leaving it stuck on the last bar.
    await userEvent.unhover(wrapper)
    await expect(
      wrapper.querySelector('[data-slot=bar-chart-tooltip]'),
    ).toBeNull()
  },
}
