import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import { ToggleButton } from './ToggleButton'

const meta = {
  component: ToggleButton,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<ToggleButton defaultSelected>24h</ToggleButton>
<ToggleButton isSelected={live} onChange={setLive}>Live</ToggleButton>`,
      },
    },
    layout: 'centered',
  },
  args: { children: '24h', variant: 'default', size: 'md' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'secondary', 'outline', 'ghost', 'text', 'danger'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof ToggleButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: '24h' })

    // **`aria-pressed`, not `aria-checked`.** It is a button that can be on or off, and a screen
    // reader announces it that way; a `role="checkbox"` here would be a control that looks like a
    // button and behaves like a form field.
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    // **The off state has to be legible, and nothing here checked that.** Every assertion in this file
    // examined either the semantics or the *on* state, and the bug lived in exactly the gap: `--btn` is
    // only ever set by `COLORS[color]`, so a toggle that never applied one painted `bg-(--btn)` as
    // nothing while `text-ink` still painted its label — black text on the black page. The Default story
    // rendered an empty box, and these tests passed against it for as long as it existed.
    //
    // The fill is the invariant: `default` is a filled variant, so it must paint.
    await expect(getComputedStyle(toggle).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )

    // And the label must not be the colour of whatever it actually sits on — its **own** fill if it has
    // one, and the page only when it does not. Comparing against the page alone is wrong the moment the
    // button is filled: black on teal is correct and legible, and the first version of this assertion
    // failed on it.
    let el = toggle.parentElement
    let page = 'rgba(0, 0, 0, 0)'
    while (el && page === 'rgba(0, 0, 0, 0)') {
      page = getComputedStyle(el).backgroundColor
      el = el.parentElement
    }
    const own = getComputedStyle(toggle).backgroundColor
    const surface = own === 'rgba(0, 0, 0, 0)' ? page : own
    await expect(getComputedStyle(toggle).color).not.toBe(surface)

    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toHaveAttribute('data-selected')

    // ...and it clicks **off** again, which a radio button cannot and a button-with-a-class cannot
    // either: this is a state the user owns and can undo.
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Selected: Story = {
  args: { defaultSelected: true },
  // **The on-state takes the accent, and it gets there by retargeting the button's own recipe.**
  // `Button` paints `bg-(--btn)`; a selected toggle points `--btn` at the teal, so hover and pressed
  // shade it automatically and no second set of rules has to exist. Asserted on the rendered colour
  // rather than on the variable, because a variable is not what anyone sees.
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: '24h' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    // **Read through `waitFor`, because both of these properties are transitioned.** `Button`'s base
    // carries `transition-[background-color,color,border-color,opacity] duration-(--duration-fast)`, and a read
    // taken while that is still running catches a frame of the animation rather than the colour: CI
    // got the selected fill back as `oklab(0.9198 -0.121905 -0.0203999)` — the same colour as the
    // token, but serialised in the space the animation interpolates in instead of the `oklch` it is
    // authored in. Waiting reads the colour the sheet states, and a genuinely wrong fill still fails
    // one second later.
    await waitFor(() =>
      expect(getComputedStyle(toggle).backgroundColor).toBe(
        'oklch(0.9198 0.1236 189.5)',
      ),
    )

    // `ink` on the fill, because the fill inverts with the theme. Hardcoding black here is the mistake
    // the whole `ink` token exists to prevent.
    await waitFor(() =>
      expect(getComputedStyle(toggle).color).toBe('oklch(0 0 none)'),
    )
  },
}

export const MatchesButton: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ToggleButton>24h</ToggleButton>
      <ToggleButton variant="outline">7d</ToggleButton>
    </div>
  ),
  // A toggle sits beside plain buttons most of the time, so it has to be **the same size as them**.
  // It composes `Button`'s own size table rather than repeating it, and this measures the result —
  // a shared constant that nothing checks is a shared constant that drifts.
  play: async ({ canvas }) => {
    const [a, b] = [
      canvas.getByRole('button', { name: '24h' }),
      canvas.getByRole('button', { name: '7d' }),
    ]
    const ha = a.getBoundingClientRect().height
    const hb = b.getBoundingClientRect().height
    await expect(Math.round(ha)).toBe(Math.round(hb))
    await expect(Math.round(ha)).toBe(44)

    // Square corners, like every control here.
    await expect(getComputedStyle(a).borderTopLeftRadius).toBe('0px')
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ToggleButton key={size} size={size} defaultSelected>
          {size}
        </ToggleButton>
      ))}
    </div>
  ),
  // Three sizes, three heights: `size` has to reach the control. The number field's steppers and the
  // slider's grip both taught that a prop can be accepted and quietly ignored.
  play: async ({ canvas }) => {
    const heights = (['sm', 'md', 'lg'] as const).map((size) =>
      Math.round(
        canvas.getByRole('button', { name: size }).getBoundingClientRect()
          .height,
      ),
    )
    await expect(new Set(heights).size).toBe(3)
    await expect(heights[0]).toBeLessThan(heights[2])
  },
}

export const Disabled: Story = {
  args: { isDisabled: true, defaultSelected: true },
  // Disabled dims and keeps its colour, so a disabled toggle still reads as the one that would be on.
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: '24h' })
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    // The dim is on the button itself, in `Button`'s base, and it applies here without a second rule.
    await expect(getComputedStyle(toggle).opacity).toBe('0.3')
  },
}
