import { parseTime } from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { I18nProvider } from 'react-aria-components'

import { TextField } from '../TextField/TextField'
import {
  TimePicker,
  TimePickerButton,
  TimePickerError,
  TimePickerGroup,
  TimePickerHint,
  TimePickerInput,
  TimePickerLabel,
} from './TimePicker'

const meta = {
  component: TimePicker,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TimePicker.Label': TimePickerLabel,
    'TimePicker.Group': TimePickerGroup,
    'TimePicker.Input': TimePickerInput,
    'TimePicker.Button': TimePickerButton,
    'TimePicker.Hint': TimePickerHint,
    'TimePicker.Error': TimePickerError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<TimePicker defaultValue={parseTime('09:30')} minuteStep={15}>
  <TimePicker.Label>Opens at</TimePicker.Label>
  <TimePicker.Group>
    <TimePicker.Input />
    <TimePicker.Button />
  </TimePicker.Group>
  <TimePicker.Hint>Business hours only.</TimePicker.Hint>
</TimePicker>`,
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
    minuteStep: 15,
    secondStep: 1,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    minuteStep: { control: { type: 'number' } },
    secondStep: { control: { type: 'number' } },
  },
  render: (args) => (
    <TimePicker {...args} defaultValue={parseTime('09:30')}>
      <TimePicker.Label>Opens at</TimePicker.Label>
      <TimePicker.Group>
        <TimePicker.Input />
        <TimePicker.Button />
      </TimePicker.Group>
      <TimePicker.Hint>Business hours only.</TimePicker.Hint>
      <TimePicker.Error>Choose a time inside the window.</TimePicker.Error>
    </TimePicker>
  ),
} satisfies Meta<typeof TimePicker>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A segment of the field, found by its own `aria-label`. Named rather than indexed because an
 * `en-US` locale adds a day-period segment a 24-hour one does not — see `timefield.md`.
 */
const segmentNamed = (canvasElement: HTMLElement, name: RegExp) =>
  [...canvasElement.querySelectorAll('[role=spinbutton]')].find((segment) =>
    name.test(segment.getAttribute('aria-label') ?? ''),
  ) as HTMLElement

/**
 * A column of the wheel, by the name React Aria announces it under. From `screen`, because the wheel
 * is a portalled popover and `canvas` only sees `#storybook-root`.
 */
const column = (name: RegExp) => screen.getByRole('listbox', { name })

/**
 * The field has exactly one button, so the role is enough to name it here. Its accessible name is
 * asserted in `Default` rather than matched on, so the query cannot silently depend on a string this
 * test guessed.
 */
const openWheel = async (canvas: {
  getByRole: (role: string) => HTMLElement
}) => {
  await userEvent.click(canvas.getByRole('button'))
  return screen.findByRole('dialog')
}

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // The value arrives as a `TimeValue`, not a string, and the segments are React Aria's own — the
    // same field `TimeField` is, with a trigger beside it.
    // **The digits are the locale's.** `en-US` writes the hour as `9` and the minute as `30`, so the
    // assertion allows either padding rather than baking one in — the same lesson `timefield.md`
    // records about counting segments.
    await expect(segmentNamed(canvasElement, /hour/i)).toHaveTextContent(
      /^0?9$/,
    )
    await expect(segmentNamed(canvasElement, /minute/i)).toHaveTextContent(
      /^30$/,
    )

    // Closed to begin with — the wheel is a popover, not part of the field.
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // The field is the field: the same hairline a `TextField` beside it has. If the picker had grown
    // its own border, this is the line that would notice.
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(1 0 none / 0.45)', // --input
    )

    // The trigger names itself — there is no React Aria context that would name it for us, which is
    // what `DatePicker` gets and this component does not.
    await expect(canvas.getByRole('button')).toHaveAccessibleName(
      /choose a time/i,
    )
    await expect(canvas.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.getByText(/business hours only/i)).toBeVisible()
  },
}

export const Open: Story = {
  play: async ({ canvas, canvasElement }) => {
    const caret = canvasElement.querySelector(
      '[data-slot=icon-end] svg',
    ) as SVGElement
    caret.style.transition = 'none'
    await expect(getComputedStyle(caret).rotate).toBe('0deg')

    await expect(await openWheel(canvas)).toBeInTheDocument()

    // Three columns, because `en-US` names a day period: the hours, the minutes, and AM/PM.
    await expect(screen.getAllByRole('listbox')).toHaveLength(3)
    // **The hour column follows the locale's own numbering, not a list this component chose.** An
    // `en-US` clock has twelve hours; `TwentyFourHour` below has twenty-four and no day period.
    await expect(within(column(/hours/i)).getAllByRole('option')).toHaveLength(
      12,
    )
    // `minuteStep` decides how many minutes there are to choose from: four at the default quarter hour.
    await expect(
      within(column(/minutes/i)).getAllByRole('option'),
    ).toHaveLength(4)

    // 09:30 is the value, so 09 and 30 are the chosen ones — and the accent is for the thing that is
    // chosen, so the fill is the calendar's fill, not a menu row's text colour.
    await expect(screen.getByRole('option', { name: '09' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(screen.getByRole('option', { name: '30' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(screen.getByRole('option', { name: '45' })).toHaveAttribute(
      'aria-selected',
      'false',
    )

    // The control holds while the wheel is open, and the chevron turns to say so.
    const box = canvasElement.querySelector('[data-slot=input]') as HTMLElement
    box.style.transition = 'none'
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)', // --primary
    )
    await expect(getComputedStyle(caret).rotate).toBe('180deg')
  },
}

export const Pick: Story = {
  play: async ({ canvas, canvasElement }) => {
    await openWheel(canvas)

    // **Choosing a minute commits it.** A list box with `selectionBehavior="replace"` selects as focus
    // moves, so a click and an arrow key go through the same path — there is no Space to confirm.
    await userEvent.click(screen.getByRole('option', { name: '45' }))
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /minute/i)).toHaveTextContent(/^45$/),
    )

    // The hour is untouched, and the wheel is still open: a time is two or three decisions, so closing
    // after the first would send the reader back to the field to start again. (`DatePicker` closes on a
    // day, because a day is one decision.)
    await expect(segmentNamed(canvasElement, /hour/i)).toHaveTextContent(
      /^0?9$/,
    )
    await expect(
      screen.getByRole('dialog', { name: /choose a time/i }),
    ).toBeInTheDocument()

    // Enter confirms and closes it, which is how a keyboard user leaves a wheel.
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const Keyboard: Story = {
  play: async ({ canvas, canvasElement }) => {
    await openWheel(canvas)

    // React Aria's autofocus prefers a selected key over the first one, so the keyboard arrives on the
    // time that is set rather than at the top of the column.
    await waitFor(() =>
      expect(column(/hours/i).contains(document.activeElement)).toBe(true),
    )
    await expect(document.activeElement).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // An arrow steps and commits in one keystroke — the reason a wheel beats typing into segments.
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /hour/i)).toHaveTextContent(/^10$/),
    )

    // Left and right move between the columns, landing on the value each one holds — so the next arrow
    // steps from what is set, not from the top of the list.
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(column(/minutes/i).contains(document.activeElement)).toBe(true),
    )
    await expect(document.activeElement).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /minute/i)).toHaveTextContent('45'),
    )

    // Escape leaves without committing anything further, and React Aria keeps the value that was set.
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await expect(segmentNamed(canvasElement, /hour/i)).toHaveTextContent(/^10$/)
  },
}

export const MinMax: Story = {
  render: (args) => (
    <TimePicker
      {...args}
      defaultValue={parseTime('10:00')}
      minValue={parseTime('09:30')}
      maxValue={parseTime('11:30')}
    >
      <TimePicker.Label>Within the window</TimePicker.Label>
      <TimePicker.Group>
        <TimePicker.Input />
        <TimePicker.Button />
      </TimePicker.Group>
      <TimePicker.Hint>09:30 to 11:30.</TimePicker.Hint>
    </TimePicker>
  ),
  // Out-of-range times are still shown, dimmed, rather than removed from the column — a column with
  // holes in it is much harder to read than one where the gaps are marked.
  play: async ({ canvas, canvasElement }) => {
    await openWheel(canvas)

    await expect(screen.getByRole('option', { name: '08' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(screen.getByRole('option', { name: '12' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    // A disabled option dims and keeps its colour, the house rule; the value is what says "not now".
    await expect(
      getComputedStyle(screen.getByRole('option', { name: '08' })).opacity,
    ).toBe('0.3')

    // **09 is offered even though 09:00 is before the window**: 09:59 is inside it, and dropping the
    // hour a reader might be living in would be the wrong reading of "out of range".
    await expect(
      screen.getByRole('option', { name: '09' }),
    ).not.toHaveAttribute('aria-disabled', 'true')

    // ...and choosing it clamps to the window rather than landing on a time the field would reject.
    await userEvent.click(screen.getByRole('option', { name: '09' }))
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /hour/i)).toHaveTextContent(/^0?9$/),
    )
    await expect(segmentNamed(canvasElement, /minute/i)).toHaveTextContent(
      /^30$/,
    )
  },
}

export const TwentyFourHour: Story = {
  render: (args) => (
    <I18nProvider locale="en-GB">
      <TimePicker {...args} defaultValue={parseTime('09:30')}>
        <TimePicker.Label>Opens at</TimePicker.Label>
        <TimePicker.Group>
          <TimePicker.Input />
          <TimePicker.Button />
        </TimePicker.Group>
      </TimePicker>
    </I18nProvider>
  ),
  // **The wheel asks the field what its hour cycle is, and the field is the one deciding.** The hour
  // column's own limits and the presence of a day-period segment come from the same formatter that
  // draws the segments, so the two cannot disagree about whether AM exists.
  play: async ({ canvas, canvasElement }) => {
    // A 24-hour locale has no day period, so the field has two segments and the wheel two columns.
    await expect(
      canvasElement.querySelectorAll('[role=spinbutton]'),
    ).toHaveLength(2)
    await openWheel(canvas)
    await expect(screen.queryByRole('listbox', { name: /am\/pm/i })).toBeNull()
    await expect(screen.getAllByRole('listbox')).toHaveLength(2)
    await expect(within(column(/hours/i)).getAllByRole('option')).toHaveLength(
      24,
    )
  },
}

export const Seconds: Story = {
  render: (args) => (
    <TimePicker
      {...args}
      granularity="second"
      defaultValue={parseTime('09:30:15')}
    >
      <TimePicker.Label>Started at</TimePicker.Label>
      <TimePicker.Group>
        <TimePicker.Input />
        <TimePicker.Button />
      </TimePicker.Group>
    </TimePicker>
  ),
  // **A field with a second segment gets a seconds column, and a minute field does not.** The wheel
  // follows the segments rather than its own mood: offering seconds to a field that has none would write
  // a value the field cannot show, and hiding them from one that has them throws away the precision the
  // field was built for.
  play: async ({ canvas, canvasElement }) => {
    await expect(segmentNamed(canvasElement, /second/i)).toHaveTextContent(
      /^15$/,
    )

    await openWheel(canvas)
    // Four columns: hours, minutes, seconds, and the day period this locale names.
    await expect(screen.getAllByRole('listbox')).toHaveLength(4)

    // Every second the field can hold, because `secondStep` defaults to one.
    const seconds = within(column(/seconds/i))
    await expect(seconds.getAllByRole('option')).toHaveLength(60)
    // ...and the second that is set is the one chosen, not the first row of the column.
    const chosen = seconds.getByRole('option', { name: '15' })
    await expect(chosen).toHaveAttribute('aria-selected', 'true')

    // **The chosen row is the row in view.** React Aria scrolls the column it focuses; a sixty-row
    // seconds column that is not focused would otherwise open at `00`, with the second it is set to
    // below the fold — and a column scrolled to the wrong place looks exactly like a column that
    // ignored the value.
    const frame = column(/seconds/i).getBoundingClientRect()
    const row = chosen.getBoundingClientRect()
    await expect(row.top).toBeGreaterThanOrEqual(frame.top - 1)
    await expect(row.bottom).toBeLessThanOrEqual(frame.bottom + 1)

    // The arrows walk into the new column and out the other side, rather than treating the wheel as a
    // two-column thing with a stranger in the middle — and an arrow in a `replace` list box commits, so
    // the second moves with it.
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    await waitFor(() =>
      expect(column(/seconds/i).contains(document.activeElement)).toBe(true),
    )
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /second/i)).toHaveTextContent(/^16$/),
    )
    // ...and the minute beside it is untouched. (`15` and `45` both exist in the minutes column too,
    // which is exactly why this asks *which column* rather than the page.)
    await expect(segmentNamed(canvasElement, /minute/i)).toHaveTextContent(
      /^30$/,
    )

    // A click on the seconds column commits the same way — on a row the column is actually showing,
    // because that is the only kind of row a pointer can reach.
    await userEvent.click(seconds.getByRole('option', { name: '12' }))
    await waitFor(() =>
      expect(segmentNamed(canvasElement, /second/i)).toHaveTextContent(/^12$/),
    )

    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(column(/am\/pm/i).contains(document.activeElement)).toBe(true),
    )
  },
}

export const SecondStep: Story = {
  render: (args) => (
    <TimePicker
      {...args}
      granularity="second"
      secondStep={15}
      defaultValue={parseTime('09:30:15')}
    >
      <TimePicker.Label>Started at</TimePicker.Label>
      <TimePicker.Group>
        <TimePicker.Input />
        <TimePicker.Button />
      </TimePicker.Group>
    </TimePicker>
  ),
  // `secondStep` is `minuteStep` for the other column — fifteen seconds apart is four options — and the
  // value that is set is snapped to the nearest one, so the column always has a row to highlight even
  // when the second was typed to the digit.
  play: async ({ canvas }) => {
    await openWheel(canvas)
    const seconds = within(column(/seconds/i))
    await expect(seconds.getAllByRole('option')).toHaveLength(4)
    await expect(seconds.getByRole('option', { name: '15' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-end gap-3">
          <TextField
            size={size}
            defaultValue=""
            className="w-48"
            aria-label="A field"
          >
            <TextField.Input placeholder="A field" />
          </TextField>
          <TimePicker
            {...args}
            size={size}
            defaultValue={parseTime('09:30')}
            aria-label="A time"
          >
            <TimePicker.Group>
              <TimePicker.Input />
              <TimePicker.Button />
            </TimePicker.Group>
          </TimePicker>
        </div>
      ))}
    </div>
  ),
  // The three sizes are the shared field table's, so a picker lines up with the fields beside it at
  // every size — which is only true if it reads `FIELD_SIZES` rather than a height of its own.
  play: async ({ canvasElement }) => {
    // Both controls mark themselves `data-slot=input`, so they are told apart by the element: a field's
    // control is an `<input>`, a time input is a `<div>` of segments.
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

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <TimePicker {...args} isDisabled defaultValue={parseTime('09:30')}>
        <TimePicker.Label>Off</TimePicker.Label>
        <TimePicker.Group>
          <TimePicker.Input />
          <TimePicker.Button />
        </TimePicker.Group>
      </TimePicker>
      <TimePicker {...args} isReadOnly defaultValue={parseTime('09:30')}>
        <TimePicker.Label>Read only</TimePicker.Label>
        <TimePicker.Group>
          <TimePicker.Input />
          <TimePicker.Button />
        </TimePicker.Group>
      </TimePicker>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const boxes = [...canvasElement.querySelectorAll('[data-slot=input]')]
    const triggers = [...canvasElement.querySelectorAll('[data-slot=icon-end]')]
    await expect(boxes).toHaveLength(2)
    await expect(triggers).toHaveLength(2)

    // **Neither one offers a wheel**, which React Aria's own picker trigger does not manage: a picker
    // that cannot be edited must not open a panel that would write to it. Read-only is not an exception
    // — there is nothing here to invite a click on.
    for (const trigger of triggers) await expect(trigger).toBeDisabled()

    for (const trigger of triggers) {
      await userEvent.click(trigger)
      await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }

    // Disabled dims the control; read-only keeps the value at full strength, because the value is the
    // whole point of the field. Same split `field.ts` makes, and the reason `onChange` is what tells
    // the two apart.
    await expect(getComputedStyle(boxes[0]).opacity).toBe('0.4')
    await expect(getComputedStyle(boxes[1]).opacity).toBe('1')
  },
}
