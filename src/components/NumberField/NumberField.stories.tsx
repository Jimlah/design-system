import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { TextField } from '../TextField/TextField'
import {
  NumberField,
  NumberFieldCounter,
  NumberFieldFieldError,
  NumberFieldGroup,
  NumberFieldHint,
  NumberFieldInput,
  NumberFieldLabel,
} from './NumberField'

const meta = {
  component: NumberField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'NumberField.Label': NumberFieldLabel,
    'NumberField.Group': NumberFieldGroup,
    'NumberField.Input': NumberFieldInput,
    'NumberField.Counter': NumberFieldCounter,
    'NumberField.Hint': NumberFieldHint,
    'NumberField.Error': NumberFieldFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<NumberField defaultValue={60} minValue={5} maxValue={600}>
  <NumberField.Label>Interval</NumberField.Label>
  <NumberField.Group>
    <NumberField.Input />
    <NumberField.Counter />
  </NumberField.Group>
  <NumberField.Hint>Seconds between checks.</NumberField.Hint>
</NumberField>`,
      },
    },
    layout: 'centered',
  },
  args: {
    size: 'md',
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
    isInvalid: false,
    defaultValue: 60,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    defaultValue: { control: 'number' },
  },
  render: (args) => (
    <NumberField {...args} className="w-72">
      <NumberField.Label>Interval</NumberField.Label>
      <NumberField.Group>
        <NumberField.Input />
        <NumberField.Counter />
      </NumberField.Group>
      <NumberField.Hint>Seconds between checks.</NumberField.Hint>
    </NumberField>
  ),
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    await expect(input).toHaveValue('60')

    // Still a text input underneath — so it can be selected, undone and typed into like one, which
    // is what a spinner bolted onto a `<div>` gives up.
    await expect(input.tagName).toBe('INPUT')

    // The steppers are described with their own names, not left as two unlabelled chevrons.
    await expect(
      canvas.getByRole('button', { name: /increase/i }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: /decrease/i }),
    ).toBeInTheDocument()

    // The sheet's numeric signature: tabular and letterspaced, so the digits do not shuffle as they
    // are typed.
    await expect(getComputedStyle(input).fontVariantNumeric).toBe(
      'tabular-nums',
    )
    await expect(getComputedStyle(input).letterSpacing).toBe('0.35px')
    await expect(canvasElement.querySelectorAll('input')).toHaveLength(1)
  },
}

export const Step: Story = {
  args: { step: 5, defaultValue: 10 },
  // A stepper is worth a `step`, and the same step applies to the arrow keys — which is the
  // keyboard path, and usually the faster one.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    const up = canvas.getByRole('button', { name: /increase/i })

    await userEvent.click(up)
    await expect(input).toHaveValue('15')
    await userEvent.click(canvas.getByRole('button', { name: /decrease/i }))
    await expect(input).toHaveValue('10')

    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await expect(input).toHaveValue('20')
  },
}

export const Bounds: Story = {
  args: { minValue: 5, maxValue: 10, defaultValue: 10 },
  // At a bound the stepper stops rather than wrapping or running past it, and it says so: the button
  // goes disabled, so it is not a press that quietly does nothing.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    const up = canvas.getByRole('button', { name: /increase/i })

    await expect(up).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: /decrease/i }))
    await expect(input).toHaveValue('9')
    await expect(up).toBeEnabled()
  },
}

export const Typing: Story = {
  args: { defaultValue: 0 },
  // Typing a value that is not a number is not a field that breaks — it is a field that does not
  // take it, and says so.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    await userEvent.clear(input)
    await userEvent.type(input, '42')
    await expect(input).toHaveValue('42')

    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    await expect(input).toHaveValue('')
  },
}

export const Currency: Story = {
  args: {
    defaultValue: 1250,
    formatOptions: { style: 'currency', currency: 'USD' },
  },
  // The same field, formatted as money — which is the reason `formatOptions` exists rather than a
  // separate component with its own parsing.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    await expect(input).toHaveValue('$1,250.00')

    await userEvent.click(canvas.getByRole('button', { name: /increase/i }))
    await expect(input).toHaveValue('$1,251.00')
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-end gap-3">
          <TextField size={size} defaultValue="" className="w-40">
            <TextField.Input placeholder="A field" />
          </TextField>
          <NumberField {...args} size={size} className="w-40">
            <NumberField.Group>
              <NumberField.Input />
              <NumberField.Counter />
            </NumberField.Group>
          </NumberField>
        </div>
      ))}
    </div>
  ),
  // The same shared tokens a field uses, so a number field lines up with a text field at every size
  // — and the steppers are the field's height, split between them, rather than twice it.
  play: async ({ canvasElement }) => {
    const fields = [...canvasElement.querySelectorAll('input[data-slot=input]')]
    const numbers = [
      ...canvasElement.querySelectorAll('[role=group] input'),
    ] as HTMLInputElement[]
    await expect(fields).toHaveLength(6)
    await expect(numbers).toHaveLength(3)

    for (let i = 0; i < 3; i++) {
      const field = fields[i].closest('[role=group]') ?? fields[i]
      await expect(
        Math.round(field.getBoundingClientRect().height),
      ).toBeGreaterThan(0)
    }

    // The three sizes really are three sizes, or the loop above proves nothing.
    const heights = numbers.map((n) =>
      Math.round(n.getBoundingClientRect().height),
    )
    await expect(new Set(heights).size).toBe(3)
  },
}

export const ReadOnly: Story = {
  args: { isReadOnly: true },
  // Read-only keeps its value at full strength — the number is the whole point — and loses the
  // hover instead, exactly as a read-only text field does.
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input') as HTMLInputElement
    input.style.transition = 'none'
    await expect(getComputedStyle(input).opacity).toBe('1')
    await expect(input).toHaveValue('60')
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: /increase/i }),
    ).toBeDisabled()
    await expect(
      getComputedStyle(canvasElement.querySelector('input') as Element).opacity,
    ).toBe('0.4')
  },
}

export const Error: Story = {
  args: { isInvalid: true, defaultValue: 0, minValue: 1 },
  render: (args) => (
    <NumberField {...args} className="w-72">
      <NumberField.Label>Interval</NumberField.Label>
      <NumberField.Group>
        <NumberField.Input />
        <NumberField.Counter />
      </NumberField.Group>
      <NumberField.Error>Must be at least 1 second.</NumberField.Error>
    </NumberField>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: /interval/i })
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    const message = canvas.getByText(/at least 1 second/i)
    await expect(message).toBeVisible()
    await expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
      message.id,
    )

    input.style.transition = 'none'
    await expect(getComputedStyle(input).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
    await expect(canvasElement.querySelectorAll('input')).toHaveLength(1)
  },
}
