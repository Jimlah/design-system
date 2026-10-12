import { parseDate } from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent } from 'storybook/test'

import { TextField } from '../TextField/TextField'
import {
  DateRangePicker,
  DateRangePickerButton,
  DateRangePickerFieldError,
  DateRangePickerGroup,
  DateRangePickerHint,
  DateRangePickerInput,
  DateRangePickerLabel,
} from './DateRangePicker'

const RANGE = {
  start: parseDate('2026-10-11'),
  end: parseDate('2026-10-20'),
}

const meta = {
  component: DateRangePicker,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'DateRangePicker.Label': DateRangePickerLabel,
    'DateRangePicker.Group': DateRangePickerGroup,
    'DateRangePicker.Input': DateRangePickerInput,
    'DateRangePicker.Button': DateRangePickerButton,
    'DateRangePicker.Hint': DateRangePickerHint,
    'DateRangePicker.Error': DateRangePickerFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  defaultValue={{ start: parseDate('2026-10-11'), end: parseDate('2026-10-20') }}
>
  <DateRangePicker.Label>Window</DateRangePicker.Label>
  <DateRangePicker.Group>
    <DateRangePicker.Input />
    <DateRangePicker.Button />
  </DateRangePicker.Group>
  <DateRangePicker.Hint>Your local time.</DateRangePicker.Hint>
</DateRangePicker>`,
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
    <DateRangePicker {...args} defaultValue={RANGE} className="w-80">
      <DateRangePicker.Label>Window</DateRangePicker.Label>
      <DateRangePicker.Group>
        <DateRangePicker.Input />
        <DateRangePicker.Button />
      </DateRangePicker.Group>
      <DateRangePicker.Hint>Your local time.</DateRangePicker.Hint>
    </DateRangePicker>
  ),
} satisfies Meta<typeof DateRangePicker>

export default meta
type Story = StoryObj<typeof meta>

/** Six segments: a month, day and year for each end, in the locale's order. */
const segmentsOf = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll('[role=spinbutton]')].map(
    (s) => s.textContent,
  )

/** The field has exactly one button — the chevron React Aria names "Calendar" itself. */
const openCalendar = async (canvas: {
  getByRole: (role: string) => HTMLElement
}) => {
  await userEvent.click(canvas.getByRole('button'))
  return screen.findByRole('dialog')
}

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // One slot draws both ends, so the pairing cannot be got wrong and there is no seam down the
    // middle of the control — the field's hairline is drawn once around both.
    await expect(segmentsOf(canvasElement)).toEqual([
      '10',
      '11',
      '2026',
      '10',
      '20',
      '2026',
    ])
    await expect(
      canvasElement.querySelectorAll('[data-slot=input]'),
    ).toHaveLength(1)
    await expect(canvas.getByText('–')).toBeInTheDocument()
    await expect(canvas.getByText(/your local time/i)).toBeVisible()
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const Open: Story = {
  play: async ({ canvas, canvasElement }) => {
    const caret = canvasElement.querySelector(
      '[data-slot=icon-end] svg',
    ) as SVGElement
    caret.style.transition = 'none'
    await expect(getComputedStyle(caret).rotate).toBe('0deg')

    await openCalendar(canvas)

    // Asked for by role: React Aria renders the heading twice, and the duplicate is aria-hidden.
    await expect(
      // Both months are one heading now that the picker always shows two.
      screen.getByRole('heading', { name: /october to november 2026/i }),
    ).toBeVisible()
    // The ends carry the accent whole, and everything between them takes it as a wash — which is
    // the whole difference from two unrelated picks.
    // A range calendar renders more than one node carrying a day's name, so the day is asked for
    // and then resolved to the cell that carries the styling.
    const cellOf = (name: RegExp) => {
      const button = screen.getAllByRole('button', { name })[0]
      const cell = button.closest('[data-slot=cell]')
      if (!(cell instanceof HTMLElement)) throw new TypeError('not a cell')
      return cell
    }
    const start = cellOf(/october 11, 2026/i)
    const end = cellOf(/october 20, 2026/i)
    const middle = cellOf(/october 15, 2026/i)
    const outside = cellOf(/october 25, 2026/i)

    await expect(getComputedStyle(start).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(end).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    // A wash, not the accent: the same hue at a fifth, so it cannot be mistaken for an end.
    await expect(getComputedStyle(middle).backgroundColor).not.toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(middle).backgroundColor).not.toBe(
      getComputedStyle(outside).backgroundColor,
    )

    await expect(getComputedStyle(caret).rotate).toBe('180deg')
  },
}

export const Pick: Story = {
  play: async ({ canvas, canvasElement }) => {
    await openCalendar(canvas)

    // Choosing a start inside the existing range begins a new one — the first click moves the
    // start, the second sets the end.
    await userEvent.click(
      screen.getByRole('button', { name: /october 5, 2026/i }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /october 8, 2026/i }),
    )

    await expect(segmentsOf(canvasElement)).toEqual([
      '10',
      '5',
      '2026',
      '10',
      '8',
      '2026',
    ])
    // Picking both ends closes the calendar.
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const TwoMonths: Story = {
  render: (args) => (
    // A range's two ends are rarely in the same month, so the picker always shows two. The assertion below
    // is a day in the second month, because a heading can span two months above a single grid.
    <DateRangePicker {...args} defaultValue={RANGE} className="w-80">
      <DateRangePicker.Label>Window</DateRangePicker.Label>
      <DateRangePicker.Group>
        <DateRangePicker.Input />
        <DateRangePicker.Button />
      </DateRangePicker.Group>
    </DateRangePicker>
  ),
  play: async ({ canvas }) => {
    await openCalendar(canvas)
    // Two months are announced as one heading spanning both, not as two separate months.
    const heading = screen.getAllByRole('heading')[0]
    await expect(heading).toHaveTextContent(/october/i)
    await expect(heading).toHaveTextContent(/november/i)
    // A November day is offered even though the range is entirely in October — being able to
    // click into the next month is the whole reason for the prop.
    await expect(
      screen.getAllByRole('button', { name: /november 5, 2026/i }).length,
    ).toBeGreaterThan(0)
  },
}

export const MinMax: Story = {
  render: (args) => (
    <DateRangePicker
      {...args}
      defaultValue={RANGE}
      minValue={parseDate('2026-10-05')}
      maxValue={parseDate('2026-10-25')}
      className="w-80"
    >
      <DateRangePicker.Label>Within the window</DateRangePicker.Label>
      <DateRangePicker.Group>
        <DateRangePicker.Input />
        <DateRangePicker.Button />
      </DateRangePicker.Group>
    </DateRangePicker>
  ),
  play: async ({ canvas }) => {
    await openCalendar(canvas)
    const tooEarly = screen.getByRole('button', { name: /october 4, 2026/i })
    await expect(tooEarly).toHaveAttribute('aria-disabled', 'true')

    // The strike is drawn on the cell, where the state lands — the button inside it reports
    // `text-decoration: none` of its own.
    const cell = tooEarly.closest('[data-slot=cell]')
    await expect(cell).toBeInstanceOf(HTMLElement)
    await expect(getComputedStyle(cell as HTMLElement).textDecorationLine).toBe(
      'line-through',
    )
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
          <DateRangePicker
            {...args}
            size={size}
            defaultValue={RANGE}
            className="w-56"
          >
            <DateRangePicker.Group>
              <DateRangePicker.Input />
              <DateRangePicker.Button />
            </DateRangePicker.Group>
          </DateRangePicker>
        </div>
      ))}
    </div>
  ),
  // The same shared tokens a field uses, so a range picker lines up with one at every size — and
  // with the single `DatePicker` too, which is what sharing the anatomy buys.
  play: async ({ canvasElement }) => {
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
    <DateRangePicker {...args} defaultValue={RANGE} className="w-80">
      <DateRangePicker.Label>Window</DateRangePicker.Label>
      <DateRangePicker.Group>
        <DateRangePicker.Input />
        <DateRangePicker.Button />
      </DateRangePicker.Group>
      <DateRangePicker.Error>
        The end cannot precede the start.
      </DateRangePicker.Error>
    </DateRangePicker>
  ),
  play: async ({ canvas, canvasElement }) => {
    const message = canvas.getByText(/cannot precede/i)
    await expect(message).toBeVisible()

    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    box.style.transition = 'none'
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
    // Wired to the group, because the two date inputs are `role=presentation`.
    await expect(
      canvasElement
        .querySelector('[role=group]')
        ?.getAttribute('aria-describedby'),
    ).toContain(message.id)
  },
}

export const Required: Story = {
  args: { isRequired: true },
  render: (args) => (
    <DateRangePicker {...args} className="w-80">
      <DateRangePicker.Label>Window</DateRangePicker.Label>
      <DateRangePicker.Group>
        <DateRangePicker.Input />
        <DateRangePicker.Button />
      </DateRangePicker.Group>
    </DateRangePicker>
  ),
  play: async ({ canvas, canvasElement }) => {
    // Nothing chosen, so both ends show their placeholders.
    await expect(segmentsOf(canvasElement)).toEqual([
      'mm',
      'dd',
      'yyyy',
      'mm',
      'dd',
      'yyyy',
    ])
    const label = canvas.getByText(/^window$/i)
    await expect(getComputedStyle(label, '::after').content).toContain('*')
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('button')).toBeDisabled()
    await expect(
      getComputedStyle(
        canvasElement.querySelector('[data-slot=input]') as Element,
      ).opacity,
    ).toBe('0.4')
  },
}
