import {
  RangeCalendar as AriaRangeCalendar,
  CalendarCell as AriaCalendarCell,
  RangeCalendarStateContext,
} from 'react-aria-components'
import type {
  CalendarCellProps as AriaCalendarCellProps,
  DateValue,
  RangeCalendarProps as AriaRangeCalendarProps,
} from 'react-aria-components'

import { useContext } from 'react'
import type { ReactNode } from 'react'

import {
  DATE_CELL,
  DATE_HEADING,
  DateCalendarChrome,
  useVisibleRangeLabel,
} from '../date'

export interface RangeCalendarProps extends Omit<
  AriaRangeCalendarProps<DateValue>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isReadOnly'
  | 'minValue'
  | 'maxValue'
  | 'allowsNonContiguousRanges'
> {
  /** The range as `{ start, end }`. Controlled. */
  value?: AriaRangeCalendarProps<DateValue>['value']
  /** The range it starts with, for uncontrolled use. */
  defaultValue?: AriaRangeCalendarProps<DateValue>['defaultValue']
  /** Called with the range as its ends move. */
  onChange?: AriaRangeCalendarProps<DateValue>['onChange']
  /** Disables the whole grid. */
  isDisabled?: AriaRangeCalendarProps<DateValue>['isDisabled']
  /** Shows it without letting a day be chosen. */
  isReadOnly?: AriaRangeCalendarProps<DateValue>['isReadOnly']
  /** The earliest selectable day. */
  minValue?: AriaRangeCalendarProps<DateValue>['minValue']
  /** The latest selectable day. */
  maxValue?: AriaRangeCalendarProps<DateValue>['maxValue']
  /** Lets the range skip days inside it, for a set of visits rather than a span. */
  allowsNonContiguousRanges?: AriaRangeCalendarProps<DateValue>['allowsNonContiguousRanges']

  /** How many months are on screen at once. A range shows two by default. */
  months?: number
  className?: string
  /** Overrides the whole grid. Rarely wanted — the chrome below is the sheet's own. */
  children?: ReactNode
}

export interface RangeCalendarHeadingProps {
  className?: string
  children?: ReactNode
}

export interface RangeCalendarCellProps extends Omit<
  AriaCalendarCellProps,
  'className'
> {
  className?: string
}

/**
 * The month's name. Use it as `RangeCalendar.Heading` when you are building your own grid.
 *
 * **It is `aria-hidden`, because React Aria renders its own heading for assistive tech just above
 * it** — and that one is correct for any number of visible months. This is the copy the eye reads.
 *
 * Exported as `RangeCalendarHeading` only so tooling can resolve it; consume the compound form
 * `RangeCalendar.Heading`.
 */
export function RangeCalendarHeading({
  className,
  children,
}: RangeCalendarHeadingProps) {
  // **A range calendar has its own state context.** `CalendarStateContext` is provided too, but it
  // carries no `visibleRange`, so the heading rendered empty — a blank caption above a correct grid.
  const state = useContext(RangeCalendarStateContext)
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
 * One day. Use it as `RangeCalendar.Cell` when you are building your own grid.
 *
 * Exported as `RangeCalendarCell` only so tooling can resolve it; consume the compound form
 * `RangeCalendar.Cell`.
 */
export function RangeCalendarCell({
  className,
  ...props
}: RangeCalendarCellProps) {
  return (
    <AriaCalendarCell
      data-slot="cell"
      className={[DATE_CELL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Two months at once, with a span of days between them.
 *
 * ```tsx
 * <RangeCalendar aria-label="Range" />
 * <RangeCalendar aria-label="Range" defaultValue={{ start, end }} />
 * ```
 *
 * **`DateRangePicker` is this inside a popover**, and the three date components share one set of
 * segments, one chrome and one day cell — so a day looks the same wherever it is drawn. Reach for
 * this when the range *is* the screen: a retention window, an incident's span, an availability view.
 *
 * **A range is two endpoints and everything between them**, which is more state than a single date:
 * the first click sets where it starts and the calendar waits, the second sets where it ends, and a
 * third starts over. `CalendarCell` renders `data-selection-start` and `data-selection-end` on the
 * two ends, so the ends and the days between them can be styled differently — the span is what makes
 * a range readable at a glance rather than two loose dates.
 *
 * **The default is two months.** A range that crosses a month boundary is the normal case, not the
 * exception, and a single month makes the user page back and forth to see what they just selected.
 */
function RangeCalendarRoot({
  months = 2,
  className,
  children,
  ...props
}: RangeCalendarProps) {
  return (
    <AriaRangeCalendar
      className={className}
      {...props}
      visibleDuration={{ months }}
    >
      {children ?? (
        <DateCalendarChrome
          Heading={RangeCalendarHeading}
          Cell={RangeCalendarCell}
          months={months}
        />
      )}
    </AriaRangeCalendar>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const RangeCalendar = Object.assign(RangeCalendarRoot, {
  Heading: RangeCalendarHeading,
  Cell: RangeCalendarCell,
})
