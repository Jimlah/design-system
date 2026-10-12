import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { ColorSwatchPicker, ColorSwatchPickerItem } from './ColorSwatchPicker'

const meta = {
  component: ColorSwatchPicker,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: { 'ColorSwatchPicker.Item': ColorSwatchPickerItem },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<ColorSwatchPicker aria-label="Label colour" defaultValue="#71FFF6">
  <ColorSwatchPicker.Item color="#71FFF6" />
  <ColorSwatchPicker.Item color="#FAD14F" />
  <ColorSwatchPicker.Item color="#FF9A8B" />
</ColorSwatchPicker>`,
      },
    },
  },
} satisfies Meta<typeof ColorSwatchPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The system's palette — the four semantic accents and the sheet grey. */
const PALETTE = ['#71FFF6', '#FAD14F', '#B0FBB1', '#FF9A8B', '#BFBFBF']

const Picker = (props: Record<string, unknown> = {}) => (
  <ColorSwatchPicker
    aria-label="Label colour"
    defaultValue="#71FFF6"
    {...props}
  >
    {PALETTE.map((c) => (
      <ColorSwatchPicker.Item key={c} color={c} />
    ))}
  </ColorSwatchPicker>
)

const items = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-slot=swatch-option]')] as HTMLElement[]

/**
 * **The colour lives on the swatch *inside* the option, not on the option.** React Aria renders the
 * square as a child and leaves the pickable element itself transparent, so reading the background off
 * the option reports `rgba(0, 0, 0, 0)` for a picker that is painting perfectly.
 */
const paintOf = (option: HTMLElement) =>
  getComputedStyle(option.querySelector('[role=img]') as HTMLElement)
    .backgroundColor

export const Default: Story = {
  render: () => <Picker />,
  play: async ({ canvasElement }) => {
    // **Queried by the role the pattern gives**, not by my own hook: the picker is a `listbox` named by
    // its `aria-label`, and each square is an `option` inside it.
    const listbox = screen.getByRole('listbox', { name: 'Label colour' })
    await expect(listbox).toBeInTheDocument()
    await expect(screen.getAllByRole('option')).toHaveLength(PALETTE.length)

    const options = items(canvasElement)
    await expect(options).toHaveLength(PALETTE.length)

    // One is chosen, it is the one the default asked for, and it is painted that colour.
    const selected = options.find(
      (o) => o.getAttribute('aria-selected') === 'true',
    ) as HTMLElement
    await expect(selected).toBeInTheDocument()
    await waitFor(() => expect(paintOf(selected)).toBe('rgb(113, 255, 246)'))
  },
}

export const Selection: Story = {
  render: () => <Picker />,
  // A picker that shows a selection but does not move it is decoration. The click is the assertion.
  play: async ({ canvasElement }) => {
    const options = items(canvasElement)
    const yellow = options[1]
    await userEvent.click(yellow)

    await expect(yellow).toHaveAttribute('aria-selected', 'true')
    // ...and it is the *only* one, because a label colour is one colour.
    await expect(
      canvasElement.querySelectorAll(
        '[data-slot=swatch-option][aria-selected=true]',
      ),
    ).toHaveLength(1)
    await expect(options[0]).toHaveAttribute('aria-selected', 'false')
  },
}

export const Disabled: Story = {
  render: () => (
    <ColorSwatchPicker aria-label="Label colour" defaultValue="#71FFF6">
      <ColorSwatchPicker.Item color="#71FFF6" />
      <ColorSwatchPicker.Item color="#FAD14F" isDisabled />
      <ColorSwatchPicker.Item color="#FF9A8B" />
    </ColorSwatchPicker>
  ),
  // A colour the application will not accept is still shown — dimmed, not removed, so the palette does
  // not silently change shape between one monitor and the next.
  play: async ({ canvasElement }) => {
    const options = items(canvasElement)
    const locked = options[1]
    await expect(locked).toHaveAttribute('data-disabled')

    await userEvent.click(locked)
    await expect(locked).toHaveAttribute('aria-selected', 'false')
    await expect(options[0]).toHaveAttribute('aria-selected', 'true')
  },
}

export const Stacked: Story = {
  render: () => <Picker layout="stack" />,
  // `layout` is a class list chosen in JS rather than a data attribute read in CSS — the lesson the
  // `Calendar`'s `visibleDuration` taught, where a prop that looked right reached nothing.
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector(
      '[data-slot=swatch-picker]',
    ) as HTMLElement
    await expect(getComputedStyle(root).flexDirection).toBe('column')
  },
}
