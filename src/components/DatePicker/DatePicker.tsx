import { useContext } from 'react'
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarStateContext,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Popover as AriaPopover,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  CalendarCellProps as AriaCalendarCellProps,
  CalendarGridProps as AriaCalendarGridProps,
  CalendarHeadingProps as AriaCalendarHeadingProps,
  CalendarProps as AriaCalendarProps,
  DateInputProps as AriaDateInputProps,
  DatePickerProps as AriaDatePickerProps,
  DateSegmentProps as AriaDateSegmentProps,
  DateValue,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  LabelProps as AriaLabelProps,
  PopoverProps as AriaPopoverProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import {
  DATE_HEADING,
  DATE_MENU,
  DATE_ROOT,
  DATE_SEGMENT,
  DATE_TRIGGER,
  DATE_CELL,
  DateCalendarChrome,
  DateCaret,
  useVisibleRangeLabel,
} from '../date'
import {
  ERROR,
  FIELD_SIZES,
  GROUP,
  HINT,
  ICON,
  ICON_POSITIONS,
  INPUT,
  LABEL,
} from '../field'
import type { FieldSize, IconPosition } from '../field'

/**
 * The sheet has no date picker in it, so this is the first component here that was not copied
 * from one — which means the rules it follows are the sheet's *language* rather than its markup:
 * square, mono, the field's own hairline and focus, the select's menu surface, and the accent
 * reserved for the thing that is chosen.
 */

/** The sheet's `.ds-select-menu`, the same surface a select's list opens on. */

/**
 * A segment of the date — the month, the day, the year. It takes the field's text colour and its
 * placeholder weight, and marks the segment being edited with the same faint wash the sheet puts
 * behind a hovered option rather than with the accent: a field's focus is a teal *border*, and
 * filling it in here would say "chosen" about a segment that is only being typed.
 */

/**
 * A day. Square, like everything else here, and the chosen one is a teal fill carrying `ink` —
 * the same pair the sheet uses for a checked box and a selected row.
 *
 * Outside the month, unavailable and today are three different things and get three different
 * treatments: dimmed, dimmed *and* struck through, and outlined in the accent without being
 * filled. Leaving today looking exactly like the rest is the usual way a calendar makes someone
 * ask what today is.
 */

/**
 * A segment of a date — a month, a day, a year. Taken from React Aria's own render prop rather
 * than re-declared, so it cannot drift from the signature it has to match.
 */
type Segment = Parameters<NonNullable<AriaDateInputProps['children']>>[0]

export interface DatePickerProps<T extends DateValue> extends Omit<
  AriaDatePickerProps<T>,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'children'
  | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Sizes the control the same way a field is sized, through the shared tokens. */
  size?: FieldSize
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaDatePickerProps<T>['isDisabled']
  isReadOnly?: AriaDatePickerProps<T>['isReadOnly']
  isRequired?: AriaDatePickerProps<T>['isRequired']
  isInvalid?: AriaDatePickerProps<T>['isInvalid']
  /** The value. `onChange` gives a `DateValue`, not a string. */
  value?: AriaDatePickerProps<T>['value']
  defaultValue?: AriaDatePickerProps<T>['defaultValue']
  onChange?: AriaDatePickerProps<T>['onChange']
  /** The earliest and latest days that may be chosen. */
  minValue?: AriaDatePickerProps<T>['minValue']
  maxValue?: AriaDatePickerProps<T>['maxValue']
  className?: string
  /**
   * `DatePicker.Label`, `DatePicker.Group`, then the hint and error. The calendar is drawn for
   * you, and there is no slot to pass for it.
   */
  children?: React.ReactNode
}

export interface DatePickerLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface DatePickerGroupProps extends Omit<
  AriaGroupProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DatePickerInputProps extends Omit<
  AriaDateInputProps,
  'children' | 'className'
> {
  className?: string
  /**
   * How to draw each segment. Optional — the segments are drawn for you — and it is a render
   * prop rather than children, because that is what React Aria's date input takes: it calls this
   * once per segment with the segment itself.
   */
  children?: (segment: Segment) => React.ReactElement
}

export interface DatePickerSegmentProps extends Omit<
  AriaDateSegmentProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DatePickerButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DatePickerPopoverProps extends Omit<
  AriaPopoverProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DatePickerCalendarProps extends Omit<
  AriaCalendarProps<DateValue>,
  'children' | 'className'
> {
  className?: string
  /** The calendar's contents. Optional — the whole month is drawn for you. */
  children?: React.ReactElement | React.ReactElement[]
}

export interface DatePickerHeadingProps extends AriaCalendarHeadingProps {
  children?: React.ReactNode
}

export interface DatePickerGridProps extends Omit<
  AriaCalendarGridProps,
  'children' | 'className'
> {
  className?: string
  /** The grid's rows — usually a header and a body. */
  children?: React.ReactElement | React.ReactElement[]
}

export interface DatePickerCellProps extends Omit<
  AriaCalendarCellProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DatePickerIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  position?: IconPosition
  className?: string
  children?: React.ReactNode
}

export interface DatePickerHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface DatePickerFieldErrorProps extends AriaFieldErrorProps {
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

/**
 * The legend. Use it as `DatePicker.Label`.
 *
 * Exported as `DatePickerLabel` only so tooling can resolve it; consume the compound form
 * `DatePicker.Label`.
 */
export function DatePickerLabel({
  className,
  children,
  ...props
}: DatePickerLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaLabel>
  )
}

/**
 * Wraps the segments and the button. Use it as `DatePicker.Group`; it is what leaves room for the
 * chevron, through the same `data-slot` rules a field's affixes use.
 *
 * Exported as `DatePickerGroup` only so tooling can resolve it; consume the compound form
 * `DatePicker.Group`.
 */
export function DatePickerGroup({
  className,
  children,
  ...props
}: DatePickerGroupProps) {
  return (
    <AriaGroup
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The date itself, as editable segments. Use it as `DatePicker.Input`; the field's hairline,
 * height and focus come from the shared anatomy, so it lines up with a `TextField` beside it.
 *
 * Exported as `DatePickerInput` only so tooling can resolve it; consume the compound form
 * `DatePicker.Input`.
 */
export function DatePickerInput({
  className,
  children,
  ...props
}: DatePickerInputProps) {
  return (
    <AriaDateInput
      data-slot="input"
      className={[INPUT, 'flex items-center', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ??
        ((segment: Segment) => (
          <DatePickerSegment key={segment.type} segment={segment} />
        ))}
    </AriaDateInput>
  )
}

/**
 * One segment of the date. Input` draws them for you.
 *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerSegment({
  className,
  children,
  ...props
}: DatePickerSegmentProps) {
  return (
    <AriaDateSegment
      className={[DATE_SEGMENT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaDateSegment>
  )
}

/**
 * The chevron that opens the calendar. Use it as `DatePicker.Button`, inside a
 * `DatePicker.Group`.
 *
 * Exported as `DatePickerButton` only so tooling can resolve it; consume the compound form
 * `DatePicker.Button`.
 */
export function DatePickerButton({
  className,
  children,
  ...props
}: DatePickerButtonProps) {
  return (
    <AriaButton
      data-slot="icon-end"
      className={[DATE_TRIGGER, className].filter(Boolean).join(' ')}
      {...props}
    >
      <DateCaret />
    </AriaButton>
  )
}

/**
 * An affix at either end of the control. Group`.
 *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerIcon({
  position = 'start',
  className,
  children,
  ...props
}: DatePickerIconProps) {
  return (
    <span
      data-slot={position === 'start' ? 'icon-start' : 'icon-end'}
      aria-hidden="true"
      className={[ICON, ICON_POSITIONS[position], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ?? (
        <svg viewBox="0 0 16 16" fill="none" className="h-full w-auto">
          <rect
            x="1.75"
            y="3.25"
            width="12.5"
            height="11"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M1.75 6.75h12.5M5.25 1.75v3M10.75 1.75v3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  )
}

/**
 * The calendar surface. *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerPopover({
  className,
  children,
  ...props
}: DatePickerPopoverProps) {
  return (
    <AriaPopover
      data-slot="dropdown"
      className={[DATE_MENU, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaPopover>
  )
}

/**
 * The month heading, between the arrows. *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerHeading({
  className,
  children,
  ...props
}: DatePickerHeadingProps) {
  const state = useContext(CalendarStateContext)
  const label = useVisibleRangeLabel(state?.visibleRange ?? null)

  return (
    // `aria-hidden`, because React Aria renders its own heading for assistive tech just above
    // this one — and that one is correct for any number of visible months. This is the copy the
    // eye reads, and React Aria's would otherwise be the one the eye reads instead, captioning a
    // two-month calendar with only its first month.
    <h2
      data-slot="heading"
      aria-hidden="true"
      className={[DATE_HEADING, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? label}
    </h2>
  )
}

/**
 * The month grid. *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerGrid({
  className,
  children,
  ...props
}: DatePickerGridProps) {
  return (
    <AriaCalendarGrid
      className={[className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCalendarGrid>
  )
}

/**
 * One day. *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerCell({
  className,
  children,
  ...props
}: DatePickerCellProps) {
  return (
    <AriaCalendarCell
      data-slot="cell"
      className={[DATE_CELL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCalendarCell>
  )
}

/**
 * The calendar, drawn whole: the month and its arrows, the weekday row, and the days.
 *
 * React Aria builds a calendar from a grid, a header and a body of render props — six elements
 * and two callbacks before a single day appears. None of that is a decision the consumer is
 * making, so it is drawn here whole and none of its parts is published.
 *
 * **Internal.** `DatePicker` draws one itself; it is not a published slot.
 */
export function DatePickerCalendar({
  className,
  children,
  ...props
}: DatePickerCalendarProps) {
  return (
    <AriaCalendar className={[className].filter(Boolean).join(' ')} {...props}>
      {children ?? (
        <DateCalendarChrome Heading={DatePickerHeading} Cell={DatePickerCell} />
      )}
    </AriaCalendar>
  )
}

/**
 * The guidance under the control. Use it as `DatePicker.Hint`.
 *
 * Exported as `DatePickerHint` only so tooling can resolve it; consume the compound form
 * `DatePicker.Hint`.
 */
export function DatePickerHint({
  className,
  children,
  ...props
}: DatePickerHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaText>
  )
}

/**
 * The message shown when the picker is `isInvalid`. Use it as `DatePicker.Error`.
 *
 * Exported as `DatePickerFieldError` only so tooling can resolve it; consume the compound form
 * `DatePicker.Error`.
 */
export function DatePickerFieldError({
  className,
  ...props
}: DatePickerFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Styled element. Not exported — `DatePicker` below is the public symbol, and docgen reads the
 * JSDoc from the *exported* declaration, not this one.
 */
function DatePickerRoot<T extends DateValue>({
  ref,
  size = 'md',
  className,
  children,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker
      ref={ref}
      className={[DATE_ROOT, FIELD_SIZES[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {/* A picker without a calendar is not a picker, so one is always drawn. It used to be skippable by
          passing a `Popover` of your own; that slot is gone, so the branch went with it. */}
      <DatePickerPopover>
        <DatePickerCalendar />
      </DatePickerPopover>
    </AriaDatePicker>
  )
}

/**
 * A date, typed or picked — the first component here with no sheet to copy, so it follows the
 * sheet's *language* rather than its markup: square, mono, the field's own hairline and focus, the
 * select's menu surface, and the accent kept for the day that is chosen.
 *
 * ```tsx
 * <DatePicker defaultValue={parseDate('2026-10-11')}>
 *   <DatePicker.Label>Starts</DatePicker.Label>
 *   <DatePicker.Group>
 *     <DatePicker.Input />
 *     <DatePicker.Button />
 *   </DatePicker.Group>
 *   <DatePicker.Hint>Your local time.</DatePicker.Hint>
 * </DatePicker>
 * ```
 *
 * **The calendar is drawn for you.** A picker without one is not a picker, so `DatePicker` opens
 * the same popover and month a `Select` opens its list on, and the field is the whole of the API
 * in the common case. **It is not replaceable**: the popover and the month it opens are internal, so the
 * field is the whole published surface. (`Select` does publish `Select.Popover`; this does not.)
 *
 * The value is a `DateValue`, not a string — `parseDate` reads an ISO date, and `onChange` hands
 * back the same shape. That is what keeps the field locale-aware: the segments, the month name
 * and the order they appear in all follow the locale rather than a format the code chose.
 *
 * **The calendar's parts are internal.** `DatePicker` draws the whole month itself, arrows and weekdays
 * included — React Aria builds one from six elements and two render props, and rearranging them is not a
 * decision a consumer of this component makes. What it publishes is the field's anatomy and nothing else:
 * `Label`, `Group`, `Input`, `Button`, `Hint`, `Error`. A component that offers every internal part as a
 * slot documents a surface nobody uses and cannot change without breaking people.
 */
export const DatePicker = Object.assign(DatePickerRoot, {
  Label: DatePickerLabel,
  Group: DatePickerGroup,
  Input: DatePickerInput,
  Button: DatePickerButton,
  Hint: DatePickerHint,
  Error: DatePickerFieldError,
})
