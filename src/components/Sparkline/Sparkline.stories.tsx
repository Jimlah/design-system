import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { Sparkline } from './Sparkline'

const meta = {
  component: Sparkline,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<Sparkline data={[12, 18, 15, 24, 21, 30]} label="Requests, last 6 hours" />`,
      },
    },
  },
} satisfies Meta<typeof Sparkline>

export default meta
type Story = StoryObj<typeof meta>

/** Read the `d` attribute back into the coordinates it encodes. */
function points(svg: SVGElement) {
  const d =
    svg.querySelector('[data-slot=sparkline-line]')?.getAttribute('d') ?? ''
  return d
    .split(/[ML]/)
    .filter(Boolean)
    .map((pair) => pair.trim().split(/\s+/).map(Number))
}

export const Default: Story = {
  args: { data: [12, 18, 15, 24, 21, 30], label: 'Requests, last 6 hours' },
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /requests, last 6 hours/i })
    await expect(svg).toBeInTheDocument()
    await expect(svg).toHaveAttribute('data-slot', 'sparkline')

    // **It occupies a box at all.** This is the assertion whose absence let a component with a correct
    // path render as nothing: `width` and `height` were shaping the viewBox while the element itself had
    // no size, so a screenshot of this story was an empty page and every other check here still passed.
    const box = svg.getBoundingClientRect()
    await expect(Math.round(box.width)).toBe(300)
    await expect(Math.round(box.height)).toBe(84)

    const pts = points(svg as unknown as SVGElement)

    // **One point per reading, and one line between each pair.** A path with the wrong count is a
    // sparkline drawing something other than the series it was handed.
    await expect(pts).toHaveLength(6)

    // **It goes up when the data goes up.** y grows downward in SVG, so the *highest* value must have
    // the *smallest* y — and index 3 (24) is the peak, index 0 (12) the trough. This is the assertion
    // that a path of the right length can still fail; a flat line has six points too.
    await expect(pts[3][1]).toBeLessThan(pts[0][1])

    // **And it stays inside its own box.** `preserveAspectRatio="none"` stretches the drawing, so a
    // point outside the viewBox is not an error the browser reports — it is simply clipped away.
    for (const [x, y] of pts) {
      await expect(x).toBeGreaterThanOrEqual(0)
      await expect(x).toBeLessThanOrEqual(300)
      await expect(y).toBeGreaterThanOrEqual(0)
      await expect(y).toBeLessThanOrEqual(84)
    }

    // The stroke is the token, not the replica's literal hex — the same colour in dark, and one that
    // follows into the light theme.
    const line = svg.querySelector('[data-slot=sparkline-line]') as SVGElement
    await expect(getComputedStyle(line).stroke).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(line.getAttribute('stroke-width')).toBe('2')

    // The dot zone sits under the line and stops short of the bottom, which is what keeps it reading as
    // a texture behind the trend rather than as a filled area chart.
    const zone = svg.querySelector(
      '[data-slot=sparkline-zone]',
    ) as SVGRectElement
    await expect(Number(zone.getAttribute('y'))).toBeGreaterThan(0)
    await expect(
      Number(zone.getAttribute('y')) + Number(zone.getAttribute('height')),
    ).toBeLessThan(84)
  },
}

export const Flat: Story = {
  args: { data: [20, 20, 20, 20], label: 'No change' },
  // A series with no range has nothing to scale into. The shape of the failure is a `NaN` in the `d`
  // attribute, which renders as no line at all and reports no error — so it is checked rather than assumed.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /no change/i })
    const pts = points(svg as unknown as SVGElement)
    await expect(pts).toHaveLength(4)
    for (const [x, y] of pts) {
      await expect(Number.isFinite(x)).toBe(true)
      await expect(Number.isFinite(y)).toBe(true)
    }
    // Flat means one y for every point — drawn down the middle rather than at the top or bottom.
    await expect(new Set(pts.map((p) => p[1])).size).toBe(1)
  },
}

export const InARow: Story = {
  // `data` and `label` are required, so even a story that renders explicitly needs them in `args`.
  args: { data: [8, 14, 11, 19, 17, 26, 22, 31], label: 'fra1 latency' },
  render: () => (
    <div className="flex w-96 items-center gap-4 border border-border-strong bg-card px-4 py-3">
      <span className="font-mono text-[12px] tracking-[0.04em] text-foreground uppercase">
        fra1
      </span>
      <Sparkline
        data={[8, 14, 11, 19, 17, 26, 22, 31]}
        width={300}
        height={52}
        label="fra1 latency"
        className="h-[52px] w-full"
      />
    </div>
  ),
  // The sheet draws this one at `306×52` in a row, so the same component has to work at a third of the
  // table's height. `preserveAspectRatio="none"` is what makes that one component instead of two.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /fra1 latency/i })
    const box = svg.getBoundingClientRect()
    await expect(Math.round(box.height)).toBe(52)
    // `non-scaling-stroke` keeps the line 2px in a box that is not the viewBox's aspect ratio; without
    // it the stroke would be stretched by the same factor as the drawing.
    await expect(
      getComputedStyle(
        svg.querySelector('[data-slot=sparkline-line]') as SVGElement,
      ).strokeWidth,
    ).toBe('2px')
  },
}
