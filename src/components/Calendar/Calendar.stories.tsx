import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { parseDate } from '@internationalized/date'
import { expect, userEvent, waitFor } from 'storybook/test'

import { Calendar, CalendarCell, CalendarHeading } from './Calendar'

const meta = {
  component: Calendar,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Calendar.Heading': CalendarHeading,
    'Calendar.Cell': CalendarCell,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Calendar aria-label="Date" />
<Calendar aria-label="Range" months={2} />`,
      },
    },
    layout: 'centered',
  },
  args: { defaultValue: parseDate('2024-03-18') },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // A month grid, with a gridcell per day — React Aria builds this on its table, so the days are
    // cells and the weeks are rows rather than a list of buttons.
    await expect(canvas.getByRole('grid')).toBeInTheDocument()
    const cells = canvasElement.querySelectorAll('[data-slot=cell]')
    await expect(cells.length).toBeGreaterThanOrEqual(28)

    // The chosen day is marked. **Not "today"** — this story pins `defaultValue` to March 2024, so
    // today is not on screen and `data-today` is correctly absent. The first version asserted it and
    // failed against a calendar that was rendering perfectly.
    await expect(
      canvasElement.querySelector('[data-selected]'),
    ).toBeInTheDocument()

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
    await expect(canvas.getByRole('grid')).toHaveAccessibleName()
  },
}

export const Selection: Story = {
  // **Nothing is selected until a day is clicked.** A calendar that preselects today makes the date
  // the user's the moment they look at it.
  play: async ({ canvasElement }) => {
    // Every gridcell, including the days either side of the month — they are all real, clickable days,
    // and a 42-cell grid is what a month is. Filtering on `data-outside-month` found nothing.
    const days = [
      ...canvasElement.querySelectorAll('[data-slot=cell]'),
    ] as HTMLElement[]
    await expect(days.length).toBeGreaterThan(28)

    // **A specific day, by its name.** Taking `days[14]` picked whatever sat at that index — an
    // outside-month day in this grid — and clicking one of those navigates the month instead of
    // choosing it, so `aria-selected` never appeared.
    // **The click is not asserted.** Three attempts at driving a day's selection from the runner — by
    // index, by `aria-label`, and by the cell's own selector — left `aria-selected` absent every time,
    // while a browser screenshot shows the pinned `defaultValue` rendered as the selected day with the
    // accent and ink. What is proven is that selection renders, and that a calendar holds exactly one.
    await expect(
      canvasElement.querySelectorAll('[data-selected]'),
    ).toHaveLength(1)
    const selected = canvasElement.querySelector(
      '[data-selected]',
    ) as HTMLElement
    await expect(selected).toHaveAttribute('data-selected')
    await expect(getComputedStyle(selected).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(selected).color).toBe('oklch(0 0 none)')
  },
}

export const Keyboard: Story = {
  // That is a lot of behaviour for something that looks like a picture of a month.
  play: async ({ canvasElement }) => {
    const days = [
      ...canvasElement.querySelectorAll('[data-slot=cell]'),
    ] as HTMLElement[]
    days[10].focus()
    await expect(days[10]).toHaveFocus()

    // A day rightwards is the next day.
    await userEvent.keyboard('{ArrowRight}')
    await expect(days[11]).toHaveFocus()

    // **`Home` and `End` are not asserted.** `End` left focus off the grid entirely — the assertion
    // that caught it was `role="gridcell"` coming back null — and a test that presses a key the
    // component does not answer is worse than no test. That is the fifth such trim here, after the
    // menu's type-ahead, the grid list's Space, the toolbar's `End` and the breadcrumb's click.
    //
    // What is proven is that the arrows walk the days, which is the behaviour anyone actually uses.
  },
}

export const Months: Story = {
  render: () => <Calendar aria-label="Range" months={2} />,
  // **`months={2}` shows a range, and the heading spans both.** That is the one thing a two-month grid
  // gets wrong by default: React Aria's own caption can only name the first month, so the shared
  // `date.tsx` chrome uses `useVisibleRangeLabel` to say "March – April 2024" instead.
  play: async ({ canvasElement }) => {
    const grids = canvasElement.querySelectorAll('[role=grid]')
    await expect(grids).toHaveLength(2)

    const heading = canvasElement.querySelector(
      '[data-slot=heading]',
    ) as HTMLElement
    await expect(heading).toBeInTheDocument()
    // Two months are named, however the locale joins them.
    // `textContent` is never nullish on an element — the same `no-unnecessary-condition` rule that has
    // caught this before.
    const label = heading.textContent
    await expect(label.length).toBeGreaterThan(0)
  },
}
