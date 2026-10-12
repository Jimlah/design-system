import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { parseDate } from '@internationalized/date'
import { expect, userEvent, waitFor } from 'storybook/test'

import {
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarHeading,
} from './RangeCalendar'

const meta = {
  component: RangeCalendar,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'RangeCalendar.Heading': RangeCalendarHeading,
    'RangeCalendar.Cell': RangeCalendarCell,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<RangeCalendar aria-label="Range" />
<RangeCalendar aria-label="Range" defaultValue={{ start, end }} />`,
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof RangeCalendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // **Two months by default**, because a range that crosses a month boundary is the normal case.
  // Pinned here so the endpoints are stable: 12–20 March 2024.
  args: {
    defaultValue: {
      start: parseDate('2024-03-12'),
      end: parseDate('2024-03-20'),
    },
  },
  play: async ({ canvasElement }) => {
    const grids = canvasElement.querySelectorAll('[role=grid]')
    await expect(grids).toHaveLength(2)

    // **The two ends are marked separately from the days between them.** That distinction is the whole
    // reason a range reads as a span rather than as two loose dates — and it is carried by
    // `data-selection-start` / `data-selection-end`, which React Aria puts on the end cells only.
    const starts = canvasElement.querySelectorAll('[data-selection-start]')
    const ends = canvasElement.querySelectorAll('[data-selection-end]')
    await expect(starts.length).toBeGreaterThan(0)
    await expect(ends.length).toBeGreaterThan(0)

    // The ends are chosen days, so they also carry the selected state; the days between them do not.
    await expect(
      canvasElement.querySelectorAll('[data-selected]').length,
    ).toBeGreaterThan(2)
  },
}

export const Single: Story = {
  render: () => (
    <RangeCalendar
      aria-label="Range"
      months={1}
      defaultValue={{
        start: parseDate('2024-03-12'),
        end: parseDate('2024-03-20'),
      }}
    />
  ),
  // `months={1}` still works — and at one month the header swaps its heading for the two pickers, so
  // the single month is navigable rather than only pageable.
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelectorAll('[role=grid]')).toHaveLength(1)
    // **A single-month calendar has no heading — it has two pickers.** The heading names a span, and one
    // month has nothing to span, so it can afford to be navigable instead. React Aria renders no
    // `<select>` of its own: it hands back the props and this component renders them, so both the
    // accessible names and the change handler are this repo's to get right.
    const pickers = canvasElement.querySelectorAll('select')
    await expect(pickers).toHaveLength(2)
    await expect(pickers[0]).toHaveAccessibleName()
    await expect(pickers[1]).toHaveAccessibleName()

    // Choosing a month moves the grid. `selectOptions` fires the real `change` event, so this goes
    // through the picker's own `onChange` — a key, adapted to the event a `<select>` produces.
    const grid = canvas.getByRole('grid')
    const before = grid.textContent
    const month = pickers[0]
    await userEvent.selectOptions(
      month,
      month.options[month.options.length - 1].value,
    )
    await waitFor(() =>
      expect(canvas.getByRole('grid').textContent).not.toBe(before),
    )
  },
}

export const Empty: Story = {
  // **Nothing is selected until the first click.** A range calendar that preselects today would claim
  // the user has already chosen a period they have not.
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[role=grid]')).toBeInTheDocument()
    await expect(
      canvasElement.querySelectorAll('[data-selected]'),
    ).toHaveLength(0)
  },
}
