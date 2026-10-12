import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { parseTime } from '@internationalized/date'
import { expect, userEvent } from 'storybook/test'

import {
  TimeField,
  TimeFieldError,
  TimeFieldGroup,
  TimeFieldHint,
  TimeFieldInput,
  TimeFieldLabel,
} from './TimeField'

const meta = {
  component: TimeField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TimeField.Label': TimeFieldLabel,
    'TimeField.Group': TimeFieldGroup,
    'TimeField.Input': TimeFieldInput,
    'TimeField.Hint': TimeFieldHint,
    'TimeField.Error': TimeFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<TimeField defaultValue={parseTime('09:30')}>
  <TimeField.Label>Opens at</TimeField.Label>
  <TimeField.Group>
    <TimeField.Input />
  </TimeField.Group>
  <TimeField.Error>Enter a time.</TimeField.Error>
</TimeField>`,
      },
    },
    layout: 'centered',
  },
  args: { defaultValue: parseTime('09:30'), size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => (
    <TimeField {...args}>
      <TimeField.Label>Opens at</TimeField.Label>
      <TimeField.Group>
        <TimeField.Input />
      </TimeField.Group>
      <TimeField.Hint>Local time, 24-hour</TimeField.Hint>
    </TimeField>
  ),
} satisfies Meta<typeof TimeField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // Two segments — hour and minute — each a real, individually editable field. The parts being
    // addressable is the whole point: `<input type="time">` gives the browser's spinner and no
    // styling, and a text input gives nothing.
    const spinbuttons = [
      ...canvasElement.querySelectorAll('[role=spinbutton]'),
    ] as HTMLElement[]
    // **Segments are found by name, not by count.** An en-US locale adds a **day-period** segment
    // (AM/PM) that a 24-hour locale does not, so "two segments" counts three and fails against a
    // component that is working. Counting segments bakes the locale into the test.
    const named = (re: RegExp) =>
      spinbuttons.filter((s) => re.test(s.getAttribute('aria-label') ?? ''))
    await expect(named(/hour/i)).toHaveLength(1)
    await expect(named(/minute/i)).toHaveLength(1)

    // A filled segment takes the field's text colour, at full strength.
    await expect(getComputedStyle(spinbuttons[0]).color).toBe('oklch(1 0 none)')

    // ...and the hint under it is the sheet's small print, not body text.
    const hint = canvas.getByText('Local time, 24-hour')
    await expect(getComputedStyle(hint).fontSize).toBe('12px')
  },
}

export const Keyboard: Story = {
  // The reason this exists rather than `<input type="time">`: the arrows step **one** segment, and the
  // value changes by exactly one of that unit. Focus is real and lands on the segment itself.
  play: async ({ canvasElement }) => {
    const [hour] = [
      ...canvasElement.querySelectorAll('[role=spinbutton]'),
    ] as HTMLElement[]
    hour.focus()
    await expect(hour).toHaveFocus()

    const before = hour.textContent
    await userEvent.keyboard('{ArrowUp}')
    await expect(hour.textContent).not.toBe(before)
    await userEvent.keyboard('{ArrowDown}')
    await expect(hour.textContent).toBe(before)

    // The segment being edited is washed rather than filled with the accent: a field's focus is its
    // teal *border*, and filling a segment in would say "chosen" about one that is only being typed.
    await expect(hour).toHaveAttribute('data-focused')
    await expect(getComputedStyle(hour).backgroundColor).toBe(
      'oklab(1 0 0 / 0.12)',
    )
  },
}

export const Incomplete: Story = {
  args: { defaultValue: undefined },
  render: () => (
    <TimeField isRequired isInvalid>
      <TimeField.Label>Opens at</TimeField.Label>
      <TimeField.Group>
        <TimeField.Input />
      </TimeField.Group>
      <TimeField.Error>Enter a time.</TimeField.Error>
    </TimeField>
  ),
  // **An empty time is invalid, and every segment says so by being dimmed to 35%** — which is how an
  // empty part reads as empty rather than as a field containing dashes.
  //
  // `isInvalid` is passed because a `FieldError` on an untouched field renders nothing, which the
  // date field's own `Incomplete` story learned the hard way.
  play: async ({ canvas, canvasElement }) => {
    const spinbuttons = [
      ...canvasElement.querySelectorAll('[role=spinbutton]'),
    ] as HTMLElement[]
    for (const s of spinbuttons) {
      await expect(s).toHaveAttribute('data-placeholder')
      await expect(getComputedStyle(s).color).toBe('oklab(1 0 0 / 0.35)')
    }
    await expect(canvas.getByText('Enter a time.')).toBeVisible()
  },
}

export const Seconds: Story = {
  // The same component with a different granularity: `granularity` decides how many segments there
  // are, so a stopwatch and a schedule use one component.
  render: () => (
    <TimeField granularity="second" defaultValue={parseTime('09:30:15')}>
      <TimeField.Label>Started at</TimeField.Label>
      <TimeField.Group>
        <TimeField.Input />
      </TimeField.Group>
    </TimeField>
  ),
  play: async ({ canvasElement }) => {
    const spinbuttons = [
      ...canvasElement.querySelectorAll('[role=spinbutton]'),
    ] as HTMLElement[]
    // `granularity` decides how many segments exist, and the same component covers a schedule and a
    // stopwatch — named rather than counted, for the day-period reason above.
    const named = (re: RegExp) =>
      spinbuttons.filter((s) => re.test(s.getAttribute('aria-label') ?? ''))
    await expect(named(/hour/i)).toHaveLength(1)
    await expect(named(/minute/i)).toHaveLength(1)
    await expect(named(/second/i)).toHaveLength(1)
  },
}
