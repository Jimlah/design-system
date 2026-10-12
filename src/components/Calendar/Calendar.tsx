import {
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarStateContext,
} from 'react-aria-components'
import type {
  CalendarCellProps as AriaCalendarCellProps,
  CalendarProps as AriaCalendarProps,
  DateValue,
} from 'react-aria-components'

import { useContext } from 'react'
import type { ReactNode } from 'react'

import {
  DATE_CELL,
  DATE_HEADING,
  DateCalendarChrome,
  useVisibleRangeLabel,
} from '../date'

export interface CalendarProps extends Omit<
  AriaCalendarProps<DateValue>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isReadOnly'
  | 'minValue'
  | 'maxValue'
  | 'visibleDuration'
> {
  /** The chosen date. Controlled. */
  value?: AriaCalendarProps<DateValue>['value']
  /** The date it starts on, for uncontrolled use. */
  defaultValue?: AriaCalendarProps<DateValue>['defaultValue']
  /** Called with the chosen date. */
  onChange?: AriaCalendarProps<DateValue>['onChange']
  /** Disables the whole month. */
  isDisabled?: AriaCalendarProps<DateValue>['isDisabled']
  /** Shows the month without letting a day be chosen. */
  isReadOnly?: AriaCalendarProps<DateValue>['isReadOnly']
  /** The earliest selectable day. */
  minValue?: AriaCalendarProps<DateValue>['minValue']
  /** The latest selectable day. */
  maxValue?: AriaCalendarProps<DateValue>['maxValue']
  /** What `months` becomes at the root — the prop that tells the calendar which days are in view. */
  visibleDuration?: AriaCalendarProps<DateValue>['visibleDuration']

  /** How many months are on screen at once. */
  months?: number
  className?: string
  /** Overrides the whole grid. Rarely wanted — the chrome below is the sheet's own. */
  children?: ReactNode
}

export interface CalendarHeadingProps {
  className?: string
  children?: ReactNode
}

export interface CalendarCellProps extends Omit<
  AriaCalendarCellProps,
  'className'
> {
  className?: string
}

/**
 * The month's name. Use it as `Calendar.Heading` when you are building your own grid.
 *
 * **It is `aria-hidden`, because React Aria renders its own heading for assistive tech just above
 * it** — and that one is correct for any number of visible months. This is the copy the eye reads;
 * React Aria's would otherwise be the one the eye reads instead, captioning a two-month calendar
 * with only its first month.
 *
 * Exported as `CalendarHeading` only so tooling can resolve it; consume the compound form
 * `Calendar.Heading`.
 */
export function CalendarHeading({ className, children }: CalendarHeadingProps) {
  const state = useContext(CalendarStateContext)
  const label = useVisibleRangeLabel(state?.visibleRange ?? null)

  return (
    <h2
      data-slot="heading"
      aria-hidden="true"
      className={[DATE_HEADING, className].filter(Boolean).join(' ')}
    >
      {children ?? label}
    </h2>
  )
}

/**
 * One day. Use it as `Calendar.Cell` when you are building your own grid.
 *
 * Exported as `CalendarCell` only so tooling can resolve it; consume the compound form
 * `Calendar.Cell`.
 */
export function CalendarCell({ className, ...props }: CalendarCellProps) {
  return (
    <AriaCalendarCell
      data-slot="cell"
      className={[DATE_CELL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A month on the page, with no field and no popover around it.
 *
 * ```tsx
 * <Calendar aria-label="Date" />
 * <Calendar aria-label="Range" months={2} />
 * ```
 *
 * **`DatePicker` is this inside a popover.** The picker draws the same grid through the same
 * `date.tsx` chrome, so a month looks identical whether it was opened from a field or is simply
 * sitting on the page — the drift that file exists to prevent. Reach for this when the date is the
 * point of the screen (a dashboard's range filter, an availability view) and for `DatePicker` when
 * the date is one value among several in a form.
 *
 * **Nothing is selected until a day is clicked**, and the keyboard is the calendar's own: the arrows
 * walk days, Page Up and Down change month, Home and End reach the ends of a week, and Enter picks.
 * That is a lot of behaviour for something that looks like a picture of a month.
 *
 * `months={2}` shows a range, and the heading spans both — which is the one thing a two-month grid
 * gets wrong by default, because React Aria's own heading can only caption the first.
 */
function CalendarRoot({
  months = 1,
  className,
  children,
  ...props
}: CalendarProps) {
  return (
    <AriaCalendar className={className} {...props} visibleDuration={{ months }}>
      {children ?? (
        <DateCalendarChrome
          Heading={CalendarHeading}
          Cell={CalendarCell}
          months={months}
        />
      )}
    </AriaCalendar>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const Calendar = Object.assign(CalendarRoot, {
  Heading: CalendarHeading,
  Cell: CalendarCell,
})
