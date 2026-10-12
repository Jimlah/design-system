import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { Separator } from './Separator'

const meta = {
  component: Separator,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'centered' },
  args: { variant: 'hair', orientation: 'horizontal' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['hair', 'soft', 'strong', 'dashed', 'dotted'],
      description: "Which of the sheet's dividers this is.",
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
  render: (args) => (
    <div className="w-72 py-4">
      <Separator {...args} />
    </div>
  ),
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // A horizontal rule is an `<hr>` — a real thematic break, not a painted div — and it takes the
  // sheet's `.ds-div-hair`, which is `--color-fg` at 40%.
  play: async ({ canvas }) => {
    const rule = canvas.getByRole('separator')
    await expect(rule.tagName).toBe('HR')

    const style = getComputedStyle(rule)
    await expect(style.height).toBe('1px')
    await expect(style.backgroundColor).toBe('oklch(1 0 none / 0.62)')
    // A separator that has a border of its own would be two rules in one element.
    await expect(style.borderTopWidth).toBe('0px')
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6 py-4">
      {(['hair', 'soft', 'strong', 'dashed', 'dotted'] as const).map(
        (variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.06em] text-fg/45">
              {variant}
            </span>
            <Separator variant={variant} />
          </div>
        ),
      )}
    </div>
  ),
  // Five dividers, and the two drawn as borders really are borders: a 1px fill cannot be dashed, so
  // `dashed` and `dotted` have no background and a 1px top border instead.
  play: async ({ canvasElement }) => {
    const rules = [...canvasElement.querySelectorAll('[role=separator]')]
    await expect(rules).toHaveLength(5)

    const [hair, soft, strong, dashed, dotted] = rules.map((r) =>
      getComputedStyle(r),
    )
    await expect(hair.backgroundColor).toBe('oklch(1 0 none / 0.62)')
    await expect(soft.backgroundColor).toBe('oklch(1 0 none / 0.3)')
    await expect(strong.backgroundColor).toBe('oklch(1 0 none)')

    await expect(dashed.borderTopStyle).toBe('dashed')
    await expect(dotted.borderTopStyle).toBe('dotted')
    await expect(dashed.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(dashed.borderTopWidth).toBe('1px')
  },
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-16 items-stretch gap-5">
      <span className="self-center text-[13px] text-fg/70">Uptime</span>
      <Separator orientation="vertical" />
      <span className="self-center text-[13px] text-fg/70">Latency</span>
    </div>
  ),
  // A vertical separator is a `<div role="separator">` rather than an `<hr>`, which is a horizontal
  // rule by definition — React Aria makes that call, and it is why this component does not set the
  // element itself. It stretches to the row it divides, as the sheet's `.ds-div-vhair` does.
  play: async ({ canvasElement }) => {
    const rule = canvasElement.querySelector('[role=separator]') as HTMLElement
    await expect(rule.tagName).toBe('DIV')
    await expect(rule).toHaveAttribute('aria-orientation', 'vertical')

    const style = getComputedStyle(rule)
    await expect(style.width).toBe('1px')
    await expect(style.alignSelf).toBe('stretch')
    // ...and it is the height of the row, not a hairline floating in the middle of it.
    await expect(rule.getBoundingClientRect().height).toBe(64)
  },
}

export const VerticalDashed: Story = {
  render: () => (
    <div className="flex h-16 items-stretch gap-5">
      <span className="self-center text-[13px] text-fg/70">Before</span>
      <Separator orientation="vertical" variant="dashed" />
      <span className="self-center text-[13px] text-fg/70">After</span>
    </div>
  ),
  // The dashed rule turns with the separator. A vertical one drawn with `border-t` would paint a
  // horizontal line across a 1px column and be invisible, which is the sort of thing that looks
  // like it works in a screenshot of the wrong element.
  play: async ({ canvasElement }) => {
    const rule = canvasElement.querySelector('[role=separator]') as HTMLElement
    const style = getComputedStyle(rule)
    await expect(style.borderInlineStartStyle).toBe('dashed')
    // The rule really is on the leading edge: `border-dashed` sets a style on every side, so asking
    // about the style alone would pass even if the line were drawn across the top.
    await expect(style.borderInlineStartWidth).toBe('1px')
    await expect(style.borderTopWidth).toBe('0px')
    await expect(rule.getBoundingClientRect().height).toBe(64)
  },
}

export const Decorative: Story = {
  render: () => (
    <div className="w-72 py-4">
      <Separator />
    </div>
  ),
  // A rule between two panels separates nothing anyone needs to hear about, so the default is
  // decorative — it is in the DOM and out of the accessibility tree.
  play: async ({ canvas, canvasElement }) => {
    const rule = canvas.getByRole('separator')
    await expect(rule).not.toHaveAttribute('aria-hidden')
    await expect(
      canvasElement.querySelectorAll('[role=separator]'),
    ).toHaveLength(1)
  },
}
