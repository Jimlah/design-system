import { parseDate } from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent } from 'storybook/test'

import { TextField } from '../TextField/TextField'
import {
  DatePicker,
  DatePickerButton,
  DatePickerFieldError,
  DatePickerGroup,
  DatePickerHint,
  DatePickerInput,
  DatePickerLabel,
} from './DatePicker'

const meta = {
  component: DatePicker,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'DatePicker.Label': DatePickerLabel,
    'DatePicker.Group': DatePickerGroup,
    'DatePicker.Input': DatePickerInput,
    'DatePicker.Button': DatePickerButton,
    'DatePicker.Hint': DatePickerHint,
    'DatePicker.Error': DatePickerFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<DatePicker defaultValue={parseDate('2026-10-11')}>
  <DatePicker.Label>Starts</DatePicker.Label>
  <DatePicker.Group>
    <DatePicker.Input />
    <DatePicker.Button />
  </DatePicker.Group>
  <DatePicker.Hint>Your local time.</DatePicker.Hint>
</DatePicker>`,
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
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
  },
  render: (args) => (
    <DatePicker
      {...args}
      defaultValue={parseDate('2026-10-11')}
      className="w-72"
    >
      <DatePicker.Label>Starts</DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input />
        <DatePicker.Button />
      </DatePicker.Group>
      <DatePicker.Hint>Your local time.</DatePicker.Hint>
    </DatePicker>
  ),
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

/** The segments React Aria renders: a month, a day and a year, in the locale's own order. */
const segmentsOf = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll('[role=spinbutton]')].map(
    (s) => s.textContent,
  )

/**
 * React Aria names the calendar button itself — "Calendar", from the field's own context — so
 * there is nothing for us to pass and nothing that can drift out of step with the label.
 */
const openCalendar = async (canvas: {
  getByRole: (role: string) => HTMLElement
}) => {
  // The field has exactly one button, so the role is enough to name it here. Its accessible name
  // is React Aria's own "Calendar", derived from the field's context — asserted rather than
  // matched on, so the query cannot silently depend on a string we did not write.
  const trigger = canvas.getByRole('button')
  await userEvent.click(trigger)
  return screen.findByRole('dialog')
}

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // The value arrives as a `DateValue`, not a string, and React Aria lays the segments out in
    // the locale's order rather than a format the code picked.
    await expect(segmentsOf(canvasElement)).toEqual(['10', '11', '2026'])
    await expect(
      canvasElement.querySelectorAll('[role=spinbutton]'),
    ).toHaveLength(3)

    // The field is the field: the same hairline, height and focus a `TextField` beside it has.
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(1 0 none / 0.45)', // --color-line-control
    )

    // Closed to begin with — the calendar is a popover, not part of the field.
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(canvas.getByText(/your local time/i)).toBeVisible()
  },
}

export const Open: Story = {
  play: async ({ canvas, canvasElement }) => {
    const caret = canvasElement.querySelector(
      '[data-slot=icon-end] svg',
    ) as SVGElement
    caret.style.transition = 'none'
    await expect(getComputedStyle(caret).rotate).toBe('0deg')

    const trigger = canvas.getByRole('button')
    await expect(trigger).toHaveAccessibleName(/calendar/i)
    await openCalendar(canvas)

    // The month is drawn whole — heading, arrows, weekday row and days — from one slot.
    // Asked for by role, not by text: React Aria renders the heading twice — once for the
    // accessibility tree and once for the eye — and only the accessible one survives a role query.
    await expect(
      screen.getByRole('heading', { name: /october 2026/i }),
    ).toBeVisible()
    await expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(27)
    await expect(
      screen.getByRole('button', { name: /previous month/i }),
    ).toBeInTheDocument()
    await expect(
      screen.getByRole('button', { name: /next month/i }),
    ).toBeInTheDocument()
    await expect(screen.getAllByText('S').length).toBeGreaterThan(0)

    // The caret turns and the border holds while it is open, as everywhere else here.
    await expect(getComputedStyle(caret).rotate).toBe('180deg')
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    box.style.transition = 'none'
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}

export const Pick: Story = {
  play: async ({ canvas, canvasElement }) => {
    await openCalendar(canvas)

    // The day that is already chosen carries the accent as a fill with ink on it — the same pair
    // the sheet uses for a checked box.
    // Days are named by their whole date, so "the 20th" is asked for as a date rather than a
    // number — and the chosen one carries the accent as a fill, with ink on it.
    const chosen = screen
      .getByRole('button', { name: /october 11, 2026/i })
      .closest('[role=gridcell]')
    await expect(chosen).toHaveAttribute('aria-selected', 'true')
    await expect(
      getComputedStyle(
        screen.getByRole('button', { name: /october 11, 2026/i }),
      ).backgroundColor,
    ).toBe('oklch(0.9198 0.1236 189.5)')

    await userEvent.click(
      screen.getByRole('button', { name: /october 20, 2026/i }),
    )
    // Picking writes back into the segments and closes the calendar.
    await expect(segmentsOf(canvasElement)).toEqual(['10', '20', '2026'])
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const Typing: Story = {
  // A date picker that can only be clicked is a date picker nobody can fill in from the keyboard
  // at speed. The segments take arrow keys and digits.
  play: async ({ canvasElement }) => {
    const [month, , year] = canvasElement.querySelectorAll('[role=spinbutton]')

    await userEvent.click(month)
    await expect(month).toHaveAttribute('data-focused', 'true')
    await userEvent.keyboard('{ArrowUp}')
    await expect(segmentsOf(canvasElement)).toEqual(['11', '11', '2026'])

    await userEvent.click(year)
    await userEvent.keyboard('2027')
    await expect(segmentsOf(canvasElement)).toEqual(['11', '11', '2027'])

    // Leaving a segment behind drops the one being edited, rather than leaving it lit.
    await userEvent.tab()
    await expect(month).not.toHaveAttribute('data-focused', 'true')
  },
}

export const MinMax: Story = {
  render: (args) => (
    <DatePicker
      {...args}
      defaultValue={parseDate('2026-10-11')}
      minValue={parseDate('2026-10-05')}
      maxValue={parseDate('2026-10-20')}
      className="w-72"
    >
      <DatePicker.Label>Within the window</DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input />
        <DatePicker.Button />
      </DatePicker.Group>
    </DatePicker>
  ),
  // Out-of-range days are still shown, dimmed and struck through, rather than removed from the
  // grid — a month with holes in it is much harder to read than one where the gaps are marked.
  play: async ({ canvas }) => {
    await openCalendar(canvas)
    // A day before the minimum: still in the grid, dimmed and struck through rather than removed.
    const tooEarly = screen.getByRole('button', { name: /october 4, 2026/i })
    await expect(tooEarly).toHaveAttribute('aria-disabled', 'true')
    // The strike is drawn on the cell, where the unavailable state lands — the button inside it
    // only carries the label, and reports `text-decoration: none` of its own.
    const cell = screen
      .getByRole('button', { name: /october 4, 2026/i })
      .closest('[data-slot=cell]')
    await expect(cell).toBeInstanceOf(HTMLElement)
    await expect(getComputedStyle(cell as HTMLElement).textDecorationLine).toBe(
      'line-through',
    )

    // ...and a day inside the window is left alone, or the assertion above would pass on a
    // calendar that had disabled everything.
    const inside = screen.getByRole('button', { name: /october 11, 2026/i })
    await expect(inside).not.toHaveAttribute('aria-disabled', 'true')
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-end gap-3">
          <TextField size={size} defaultValue="" className="w-48">
            <TextField.Input placeholder="A field" />
          </TextField>
          <DatePicker
            {...args}
            size={size}
            defaultValue={parseDate('2026-10-11')}
            className="w-48"
          >
            <DatePicker.Group>
              <DatePicker.Input />
              <DatePicker.Button />
            </DatePicker.Group>
          </DatePicker>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Both components mark their control `data-slot=input`, so they are told apart by the element
    // rather than by the attribute: a field's control is an `<input>`, a date input is a `<div>`
    // of segments.
    const fields = [...canvasElement.querySelectorAll('input[data-slot=input]')]
    const pickers = [...canvasElement.querySelectorAll('div[data-slot=input]')]
    await expect(fields).toHaveLength(3)
    await expect(pickers).toHaveLength(3)
    for (let i = 0; i < 3; i++) {
      await expect(getComputedStyle(pickers[i]).height).toBe(
        getComputedStyle(fields[i]).height,
      )
    }
    await expect(getComputedStyle(pickers[0]).height).not.toBe(
      getComputedStyle(pickers[1]).height,
    )
  },
}

export const Error: Story = {
  args: { isInvalid: true },
  render: (args) => (
    <DatePicker
      {...args}
      defaultValue={parseDate('2026-10-11')}
      className="w-72"
    >
      <DatePicker.Label>Starts</DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input />
        <DatePicker.Button />
      </DatePicker.Group>
      <DatePicker.Error>That date has already passed.</DatePicker.Error>
    </DatePicker>
  ),
  play: async ({ canvas, canvasElement }) => {
    const message = canvas.getByText(/already passed/i)
    await expect(message).toBeVisible()

    // The date input is a group of segments, so the error is attached to the group — and the
    // border turns red on the input itself, where the field's own `--field-border` is read.
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    box.style.transition = 'none'
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
    // The message is wired to the group, not to the segments: the date input itself is
    // `role=presentation`, and the group is what a screen reader lands on here.
    await expect(
      canvasElement
        .querySelector('[role=group]')
        ?.getAttribute('aria-describedby'),
    ).toContain(message.id)
  },
}

export const Required: Story = {
  args: { isRequired: true },
  // The meta's render carries a value, so an empty one is its own render rather than an arg.
  render: (args) => (
    <DatePicker {...args} className="w-72">
      <DatePicker.Label>Starts</DatePicker.Label>
      <DatePicker.Group>
        <DatePicker.Input />
        <DatePicker.Button />
      </DatePicker.Group>
    </DatePicker>
  ),
  play: async ({ canvas, canvasElement }) => {
    // Nothing chosen, so every segment shows its placeholder rather than a zero.
    await expect(segmentsOf(canvasElement)).toEqual(['mm', 'dd', 'yyyy'])
    const label = canvas.getByText(/^starts$/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
  },
}

export const ReadOnly: Story = {
  args: { isReadOnly: true },
  // Read-only keeps its value at full strength — the date is the whole point — and signals itself
  // through the hairline instead, exactly as a read-only field does.
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    box.style.transition = 'none'
    await expect(getComputedStyle(box).opacity).toBe('1')
    const segment = canvasElement.querySelector(
      '[role=spinbutton]',
    ) as HTMLElement
    await expect(getComputedStyle(segment).color).toBe('oklch(1 0 none)')
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('button', { name: /starts/i })).toBeDisabled()
    await expect(
      getComputedStyle(
        canvasElement.querySelector('[data-slot=input]') as Element,
      ).opacity,
    ).toBe('0.4')
  },
}
