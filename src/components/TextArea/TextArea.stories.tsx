import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import {
  TextArea,
  TextAreaFieldError,
  TextAreaHint,
  TextAreaInput,
  TextAreaLabel,
} from './TextArea'

const meta = {
  component: TextArea,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TextArea.Label': TextAreaLabel,
    'TextArea.Input': TextAreaInput,
    'TextArea.Hint': TextAreaHint,
    'TextArea.Error': TextAreaFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<TextArea defaultValue="" isRequired>
  <TextArea.Label>Notes</TextArea.Label>
  <TextArea.Input rows={4} placeholder="What changed?" />
  <TextArea.Hint>Markdown is fine.</TextArea.Hint>
  <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
</TextArea>`,
      },
    },
    layout: 'centered',
  },
  args: { isDisabled: false, isInvalid: false, isRequired: false },
  argTypes: {
    isDisabled: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
  },
  render: (args) => (
    <TextArea {...args} className="w-80" defaultValue="">
      <TextArea.Label>Notes</TextArea.Label>
      <TextArea.Input placeholder="What changed?" />
      <TextArea.Hint>Markdown is fine.</TextArea.Hint>
    </TextArea>
  ),
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: /notes/i })
    await expect(area.tagName).toBe('TEXTAREA')
    await expect(area).toHaveAttribute('placeholder', 'What changed?')

    // The sheet's `.ds-textarea`, measured rather than trusted.
    const style = getComputedStyle(area)
    await expect(style.minHeight).toBe('92px')
    await expect(style.paddingTop).toBe('12px')
    await expect(style.paddingInlineStart).toBe('14px')
    await expect(style.borderTopLeftRadius).toBe('0px')

    // The type is read from the field root, which is where the field sets it — `14px` and the sheet's
    // `1.5`, so 21px. On the control itself it cannot be read here: **Storybook's own preview CSS
    // forces `input, textarea, select { font-size: max(16px, 1rem) }`**, to stop iOS zooming a form
    // on focus. That rule is unlayered, so it beats every Tailwind utility, and the control reads
    // 16px/24px under the test runner while being 14px/21px in the app. The first version of this
    // story asserted 21px on the control, and could not have passed.
    // The parent, not `closest('[data-rac]')`: React Aria puts `data-rac` on *every* element it
    // renders, so the closest one is the textarea itself, and the assertion would be about the very
    // element it was written to avoid.
    const root = area.parentElement as HTMLElement
    await expect(getComputedStyle(root).fontSize).toBe('14px')
    await expect(getComputedStyle(root).lineHeight).toBe('21px')
  },
}

export const Rows: Story = {
  render: (args) => (
    <TextArea {...args} className="w-80">
      <TextArea.Label>Notes</TextArea.Label>
      <TextArea.Input rows={6} />
    </TextArea>
  ),
  // **`rows` is passed through, but it is no longer the height.** The control grows with what is
  // typed (`field-sizing: content`), so its floor is the field's 92px minimum and its ceiling is
  // twelve lines. The attribute stays because it is the native one — and because it is what sizes
  // the box before any of this CSS is parsed. `resize: none` follows: a box that already fits its
  // content has nothing for a drag handle to do.
  play: async ({ canvas }) => {
    const area = canvas.getByRole<HTMLTextAreaElement>('textbox', {
      name: /notes/i,
    })
    await expect(area.rows).toBe(6)
    await expect(getComputedStyle(area).resize).toBe('none')

    // The floor is the field's own minimum, not a fixed height of its own.
    const empty = area.getBoundingClientRect().height
    await expect(empty).toBe(92)

    // Four lines is past the 92px floor (3 × 24px of line box plus 24px of padding), so the box
    // has to have grown — nothing measured the text to make that happen.
    await userEvent.click(area)
    await userEvent.type(
      area,
      'First line{Enter}Second line{Enter}Third line{Enter}Fourth line',
    )
    await expect(area.getBoundingClientRect().height).toBeGreaterThan(empty)

    // And twelve lines is the ceiling: past it the control scrolls rather than growing.
    await userEvent.paste(
      Array.from({ length: 20 }, (_, i) => `Line ${i}`).join('\n'),
    )
    await expect(area.scrollHeight).toBeGreaterThan(area.clientHeight)
  },
}

export const Multiline: Story = {
  // Enter is a new line here, where in a single-line field it submits the form. That is the whole
  // difference between the two, and worth pinning.
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: /notes/i })
    await userEvent.click(area)
    await userEvent.type(area, 'First line{Enter}Second line')
    await expect(area).toHaveValue('First line\nSecond line')
  },
}

export const Focus: Story = {
  // Focus is the border and only the border, as it is on every other field here — and read straight
  // after focusing it would be read mid-transition, so the transition is frozen first.
  play: async ({ canvas }) => {
    const area = canvas.getByRole<HTMLTextAreaElement>('textbox', {
      name: /notes/i,
    })
    area.style.transition = 'none'
    await userEvent.click(area)
    await expect(area).toHaveAttribute('data-focused')
    await expect(getComputedStyle(area).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(area).outlineStyle).toBe('none')
  },
}

export const Error: Story = {
  args: { isInvalid: true },
  render: (args) => (
    <TextArea {...args} className="w-80">
      <TextArea.Label>Notes</TextArea.Label>
      <TextArea.Input />
      <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
    </TextArea>
  ),
  // The failure reaches assistive tech as the control's description, and the border goes red — the
  // same split every field here uses.
  play: async ({ canvas }) => {
    const area = canvas.getByRole<HTMLTextAreaElement>('textbox', {
      name: /notes/i,
    })
    await expect(area).toHaveAttribute('aria-invalid', 'true')

    const message = canvas.getByText(/under 500 characters/i)
    await expect(message).toBeVisible()
    await expect(area.getAttribute('aria-describedby')?.split(' ')).toContain(
      message.id,
    )

    area.style.transition = 'none'
    await expect(getComputedStyle(area).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
  },
}

export const Required: Story = {
  args: { isRequired: true },
  // The marker is drawn from the field's own `data-required`, so it cannot drift out of sync with
  // the prop — and the native attribute is what carries it.
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: /notes/i })
    await expect(area).toBeRequired()
  },
}

export const ReadOnly: Story = {
  args: { isReadOnly: true },
  // Read-only keeps its value at full strength: a dimmed textarea is the one place the text someone
  // came to read becomes the text they cannot. It signals itself through the hairline instead.
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: /notes/i })
    // `readonly` *is* a valid attribute on a textarea, so unlike a checkbox this one really is set
    // — and it is the native attribute, not `aria-readonly`.
    await expect(area).toHaveAttribute('readonly')
    await expect(getComputedStyle(area).opacity).toBe('1')
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: /notes/i })
    await expect(area).toBeDisabled()
    await expect(getComputedStyle(area).opacity).toBe('0.4')
  },
}
