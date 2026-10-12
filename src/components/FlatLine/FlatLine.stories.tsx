import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { FlatLine } from './FlatLine'

const meta = {
  component: FlatLine,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<FlatLine label="fra1 uptime, 100%" />
<FlatLine height={52} lineY={6} label="iad1 uptime, 100%" />`,
      },
    },
  },
} satisfies Meta<typeof FlatLine>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'fra1 uptime, 100%' },
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /fra1 uptime, 100%/i })

    // **It has a box**, which is the assertion the Sparkline lacked when it shipped invisible.
    const box = svg.getBoundingClientRect()
    await expect(Math.round(box.width)).toBe(300)
    await expect(Math.round(box.height)).toBe(84)

    const rule = svg.querySelector(
      '[data-slot=flat-line-rule]',
    ) as SVGRectElement
    const zone = svg.querySelector(
      '[data-slot=flat-line-zone]',
    ) as SVGRectElement

    // **The rule is at the top, not through the middle.** That is the entire difference between this and
    // a flat sparkline: at 100% the line belongs at the best end of the box. Its own 1px half sits above
    // `lineY`, so `y = lineY - 1`.
    await expect(Number(rule.getAttribute('y'))).toBe(0)
    await expect(Number(rule.getAttribute('height'))).toBe(2)
    await expect(Number(rule.getAttribute('y'))).toBeLessThan(8)

    // ...and it is the accent, at the token rather than the replica's literal hex.
    await expect(getComputedStyle(rule).fill).toBe('oklch(0.9198 0.1236 189.5)')

    // The texture begins **below** the rule, with the replica's five-unit gap, so the two never share an
    // edge — the rule reads as a line *over* a zone rather than as the top of a filled area.
    await expect(Number(zone.getAttribute('y'))).toBe(6)
    await expect(
      Number(zone.getAttribute('y')) + Number(zone.getAttribute('height')),
    ).toBe(84)
  },
}

export const Short: Story = {
  args: { height: 52, lineY: 6, label: 'iad1 uptime, 100%' },
  // The sheet draws this one at `306×52` in a row and passes `y=6` — 11.5% down, where the 84-tall one is
  // 1.2% down. `lineY` is a distance rather than a fraction precisely because those two disagree.
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: /iad1 uptime, 100%/i })
    await expect(Math.round(svg.getBoundingClientRect().height)).toBe(52)

    const rule = svg.querySelector(
      '[data-slot=flat-line-rule]',
    ) as SVGRectElement
    await expect(Number(rule.getAttribute('y'))).toBe(5)
    // Still near the top rather than proportional to the box, which is the point of the pixel value.
    await expect(Number(rule.getAttribute('y'))).toBeLessThan(8)
  },
}

export const BesideASparkline: Story = {
  args: { label: 'fra1 uptime, 100%' },
  render: () => (
    <div className="flex w-96 flex-col gap-3 border border-border-strong bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="w-12 font-mono text-[12px] text-foreground uppercase">
          fra1
        </span>
        <FlatLine label="fra1 uptime, 100%" className="h-[52px] w-full" />
        <span className="font-mono text-[12px] text-primary">100%</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 font-mono text-[12px] text-foreground uppercase">
          iad1
        </span>
        <FlatLine
          height={52}
          lineY={6}
          label="iad1 uptime, 100%"
          className="h-[52px] w-full"
        />
        <span className="font-mono text-[12px] text-primary">100%</span>
      </div>
    </div>
  ),
  // The context it exists for: two monitors that never went down, in a column. `preserveAspectRatio="none"`
  // is what lets the 300-unit drawing fill the row, and `non-scaling-stroke` is not needed here because the
  // rule is a `rect` rather than a stroked path — its height is in user units and stretches with the box.
  play: async ({ canvas }) => {
    const lines = canvas.getAllByRole('img')
    await expect(lines).toHaveLength(2)
    for (const line of lines) {
      await expect(Math.round(line.getBoundingClientRect().height)).toBe(52)
    }
  },
}
