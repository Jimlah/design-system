import { useContext } from 'react'
import {
  Button as AriaButton,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  RangeCalendarStateContext,
  DateInput as AriaDateInput,
  DateRangePicker as AriaDateRangePicker,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Popover as AriaPopover,
  RangeCalendar as AriaRangeCalendar,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  CalendarCellProps as AriaCalendarCellProps,
  CalendarGridProps as AriaCalendarGridProps,
  CalendarHeadingProps as AriaCalendarHeadingProps,
  DateInputProps as AriaDateInputProps,
  DateRangePickerProps as AriaDateRangePickerProps,
  DateSegmentProps as AriaDateSegmentProps,
  DateValue,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  LabelProps as AriaLabelProps,
  PopoverProps as AriaPopoverProps,
  RangeCalendarProps as AriaRangeCalendarProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import {
  DATE_HEADING,
  DATE_MENU,
  DATE_ROOT,
  DATE_SEGMENT,
  DATE_TRIGGER,
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

/** A day in a range. */
const CELL = [
  'flex size-8 items-center justify-center rounded-none',
  'text-[13px] text-fg/75 tabular-nums cursor-pointer select-none',
  'transition-colors duration-[120ms] ease-pulse',
  'data-[hovered]:bg-fg/7 data-[hovered]:text-fg',
  'data-[outside-month]:text-fg/30',
  // A day outside `minValue`/`maxValue` is `data-unavailable`; a day in a wholly disabled calendar
  // is `data-disabled`. Both mean the same thing to the eye, so both are marked.
  // Only days outside `minValue`/`maxValue` are struck through. A day either side of the month is
  // `data-disabled` too — React Aria disables everything outside the visible range — so striking
  // on `data-disabled` alone draws a line through the leading and trailing days of every month,
  // which says "unavailable" about a day that is merely in the wrong month.
  'data-[unavailable]:not-data-[outside-month]:text-fg/25',
  'data-[unavailable]:not-data-[outside-month]:line-through',
  'data-[disabled]:not-data-[outside-month]:text-fg/25',
  'data-[disabled]:not-data-[outside-month]:line-through',
  'data-[unavailable]:cursor-not-allowed data-[disabled]:cursor-not-allowed',
  // What a range adds: every day between the two ends is selected, so the ends have to be told
  // apart from the middle. The ends carry the accent whole; the days between take it as a wash.
  //
  // Written as three rules that cannot both match, rather than as an endpoint rule that has to
  // out-specify a wash: stacking two data variants on one utility (`data-[selected][data-selection-start]:`)
  // does not compile, and a single `data-[selection-start]` ties with `data-[selected]` and loses
  // on source order. Excluding the ends from the wash means only ever one rule applies.
  'data-[selection-start]:bg-teal data-[selection-start]:text-ink',
  'data-[selection-end]:bg-teal data-[selection-end]:text-ink',
  'data-[selected]:not-data-[selection-start]:not-data-[selection-end]:bg-teal/20',
  'data-[today]:outline-1 data-[today]:outline-teal',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-[3px]',
  'data-[focus-visible]:outline-teal',
].join(' ')

/** The two date inputs sit inside one control, so the field is drawn once around both. */
const RANGE_INPUT = [
  INPUT,
  'flex items-center',
  // Two of these share a control, so the padding between them is the separator's job, not theirs.
  'border-0',
  // The dim, read from the root — see the note in `date.tsx`.
  'opacity-(--date-control-opacity)',
].join(' ')

const SEPARATOR = 'px-0.5 text-fg/35'

export interface DateRangePickerProps<T extends DateValue> extends Omit<
  AriaDateRangePickerProps<T>,
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
  isDisabled?: AriaDateRangePickerProps<T>['isDisabled']
  isReadOnly?: AriaDateRangePickerProps<T>['isReadOnly']
  isRequired?: AriaDateRangePickerProps<T>['isRequired']
  isInvalid?: AriaDateRangePickerProps<T>['isInvalid']
  /** The value is a `{ start, end }` pair, not a string. */
  value?: AriaDateRangePickerProps<T>['value']
  defaultValue?: AriaDateRangePickerProps<T>['defaultValue']
  onChange?: AriaDateRangePickerProps<T>['onChange']
  minValue?: AriaDateRangePickerProps<T>['minValue']
  maxValue?: AriaDateRangePickerProps<T>['maxValue']
  className?: string
  /** `DateRangePicker.Label`, `DateRangePicker.Group`, then the hint and error. */
  children?: React.ReactNode
}

/**
 * A segment of a date. Taken from React Aria's own render prop rather than re-declared, so it
 * cannot drift from the signature it has to match.
 */
type Segment = Parameters<NonNullable<AriaDateInputProps['children']>>[0]

export interface DateRangePickerLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface DateRangePickerGroupProps extends Omit<
  AriaGroupProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * The pair of dates. Narrower than a `DateInput`'s props on purpose: this is two inputs and one
 * control, so input-level props have no single input to go to. Anything genuinely per-segment
 * belongs on the segment.
 */
export interface DateRangePickerInputProps {
  className?: string
  /** What sits between the two dates. An en dash, by default. */
  separator?: React.ReactNode
  /** How to draw each segment. Optional — the segments are drawn for you. */
  children?: (segment: Segment) => React.ReactElement
}

export interface DateRangePickerSegmentProps extends Omit<
  AriaDateSegmentProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DateRangePickerIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  position?: IconPosition
  className?: string
  children?: React.ReactNode
}

export interface DateRangePickerButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DateRangePickerPopoverProps extends Omit<
  AriaPopoverProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DateRangePickerCalendarProps extends Omit<
  AriaRangeCalendarProps<DateValue>,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactElement | React.ReactElement[]
}

export interface DateRangePickerHeadingProps extends AriaCalendarHeadingProps {
  children?: React.ReactNode
}

export interface DateRangePickerGridProps extends Omit<
  AriaCalendarGridProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactElement | React.ReactElement[]
}

export interface DateRangePickerCellProps extends Omit<
  AriaCalendarCellProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface DateRangePickerHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface DateRangePickerFieldErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

/**
 * The legend. Use it as `DateRangePicker.Label`.
 *
 * Exported as `DateRangePickerLabel` only so tooling can resolve it; consume the compound form
 * `DateRangePicker.Label`.
 */
export function DateRangePickerLabel({
  className,
  children,
  ...props
}: DateRangePickerLabelProps) {
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
 * Wraps the two dates and the button. Use it as `DateRangePicker.Group`.
 *
 * Exported as `DateRangePickerGroup` only so tooling can resolve it; consume the compound form
 * `DateRangePicker.Group`.
 */
export function DateRangePickerGroup({
  className,
  children,
  ...props
}: DateRangePickerGroupProps) {
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
 * Both dates, with the separator between them. Use it as `DateRangePicker.Input`.
 *
 * It is one slot rather than two, because a range *is* one value: the two inputs share a single
 * control, and React Aria still needs to be told which is the start and which the end. Drawing
 * them here means the pairing cannot be got wrong and the field's hairline is drawn once around
 * both, rather than twice with a seam down the middle.
 *
 * Exported as `DateRangePickerInput` only so tooling can resolve it; consume the compound form
 * `DateRangePicker.Input`.
 */
export function DateRangePickerInput({
  className,
  separator,
  children,
}: DateRangePickerInputProps) {
  const segment =
    children ?? ((s: Segment) => <DateRangePickerSegment segment={s} />)

  return (
    <div
      data-slot="input"
      className={[RANGE_INPUT, className].filter(Boolean).join(' ')}
    >
      <AriaDateInput slot="start" className="flex items-center">
        {segment}
      </AriaDateInput>
      <span aria-hidden="true" className={SEPARATOR}>
        {separator ?? '–'}
      </span>
      <AriaDateInput slot="end" className="flex items-center">
        {segment}
      </AriaDateInput>
    </div>
  )
}

/**
 * One segment of a date. Input` draws them for you.
 *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerSegment({
  className,
  children,
  ...props
}: DateRangePickerSegmentProps) {
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
 * An affix at either end of the control. Group`.
 *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerIcon({
  position = 'start',
  className,
  children,
  ...props
}: DateRangePickerIconProps) {
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
 * The chevron that opens the calendar. Use it as `DateRangePicker.Button`, inside a
 * `DateRangePicker.Group`.
 *
 * Exported as `DateRangePickerButton` only so tooling can resolve it; consume the compound form
 * `DateRangePicker.Button`.
 */
export function DateRangePickerButton({
  className,
  children,
  ...props
}: DateRangePickerButtonProps) {
  return (
    <AriaButton
      data-slot="icon-end"
      className={[DATE_TRIGGER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <DateCaret />}
    </AriaButton>
  )
}

/**
 * The calendar surface. Its `placement` is worth setting —
 * a range calendar is wide, and `bottom start` is where it reads best.
 *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerPopover({
  className,
  children,
  ...props
}: DateRangePickerPopoverProps) {
  return (
    <AriaPopover
      className={[DATE_MENU, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaPopover>
  )
}

/**
 * The month heading, between the arrows. *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerHeading({
  className,
  children,
  ...props
}: DateRangePickerHeadingProps) {
  // Read the state rather than letting React Aria caption it: with two months visible its
  // `aria-hidden` visual node names only the first — see the note in `date.tsx`.
  const state = useContext(RangeCalendarStateContext)
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
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerGrid({
  className,
  children,
  ...props
}: DateRangePickerGridProps) {
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
 * One day. Both ends of the
 * range carry the accent whole; the days between them take it as a wash.
 *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerCell({
  className,
  children,
  ...props
}: DateRangePickerCellProps) {
  return (
    <AriaCalendarCell
      data-slot="cell"
      className={[CELL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCalendarCell>
  )
}

/**
 * The range calendar, drawn whole. Set `visibleDuration` to
 * show two months at once, which is what a range usually wants.
 *
 * **Internal.** `DateRangePicker` draws one itself; it is not a published slot.
 */
export function DateRangePickerCalendar({
  className,
  children,
  visibleDuration,
  ...props
}: DateRangePickerCalendarProps) {
  // **Two months, always.** A range's two ends are rarely in the same month, so one month would make the
  // common case a second interaction. Enforced here rather than offered as a prop — there is no range in
  // this system that wants one, and it used to be reachable only through a `Calendar` slot.
  const MONTHS = 2

  return (
    <AriaRangeCalendar
      className={[className].filter(Boolean).join(' ')}
      visibleDuration={{ months: MONTHS }}
      {...props}
    >
      {children ?? (
        <DateCalendarChrome
          Heading={DateRangePickerHeading}
          Cell={DateRangePickerCell}
          months={MONTHS}
        />
      )}
    </AriaRangeCalendar>
  )
}

/**
 * The guidance under the control. Use it as `DateRangePicker.Hint`.
 *
 * Exported as `DateRangePickerHint` only so tooling can resolve it; consume the compound form
 * `DateRangePicker.Hint`.
 */
export function DateRangePickerHint({
  className,
  children,
  ...props
}: DateRangePickerHintProps) {
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
 * The message shown when the picker is `isInvalid`. Use it as `DateRangePicker.Error`.
 *
 * Exported as `DateRangePickerFieldError` only so tooling can resolve it; consume the compound
 * form `DateRangePicker.Error`.
 */
export function DateRangePickerFieldError({
  className,
  children,
  ...props
}: DateRangePickerFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaFieldError>
  )
}

/**
 * Styled element. Not exported — `DateRangePicker` below is the public symbol, and docgen reads
 * the JSDoc from the *exported* declaration, not this one.
 */
function DateRangePickerRoot<T extends DateValue>({
  ref,
  size = 'md',
  className,
  children,
  ...props
}: DateRangePickerProps<T>) {
  return (
    <AriaDateRangePicker
      ref={ref}
      className={[DATE_ROOT, FIELD_SIZES[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {/* A picker without a calendar is not a picker, so one is always drawn. It used to be skippable by
          passing a `Popover` of your own; that slot is gone, so the branch went with it. */}
      <DateRangePickerPopover placement="bottom start">
        <DateRangePickerCalendar />
      </DateRangePickerPopover>
    </AriaDateRangePicker>
  )
}

/**
 * Two dates, as one value — "when does this window start and end". The difference from two
 * `DatePicker`s is not cosmetic: a range has a validity of its own (the end cannot precede the
 * start), one calendar serves both ends, and the days between them are shown as chosen rather
 * than as two unrelated picks.
 *
 * ```tsx
 * <DateRangePicker
 *   defaultValue={{ start: parseDate('2026-10-11'), end: parseDate('2026-10-20') }}
 * >
 *   <DateRangePicker.Label>Window</DateRangePicker.Label>
 *   <DateRangePicker.Group>
 *     <DateRangePicker.Input />
 *     <DateRangePicker.Button />
 *   </DateRangePicker.Group>
 *   <DateRangePicker.Hint>Your local time.</DateRangePicker.Hint>
 * </DateRangePicker>
 * ```
 *
 * Sharing an anatomy with `DatePicker` rather than copying it, the same way the field components
 * share `field.ts`. The one part that genuinely differs is the day: in a range every day between
 * the ends is selected, so the two ends carry the accent whole and the days between take it as a
 * wash. Without that, a range reads as two separate picks that happen to be far apart.
 *
 * The calendar draws **two months**, which is what a range wants: the ends are
 * rarely in the same month, so one month would make the common case a second interaction. It is enforced
 * here rather than offered as a prop, and it used to be reachable only through a `Calendar` slot.
 */
export const DateRangePicker = Object.assign(DateRangePickerRoot, {
  Label: DateRangePickerLabel,
  Group: DateRangePickerGroup,
  Input: DateRangePickerInput,
  Button: DateRangePickerButton,
  Hint: DateRangePickerHint,
  Error: DateRangePickerFieldError,
})
