import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CalendarDateTime, DateFormatter, Time } from '@internationalized/date'
import {
  Button as AriaButton,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  Dialog as AriaDialog,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Text as AriaText,
  TimeField as AriaTimeField,
  TimeFieldStateContext,
  useLocale,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  DateInputProps as AriaDateInputProps,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  LabelProps as AriaLabelProps,
  ListBoxProps as AriaListBoxProps,
  TextProps as AriaTextProps,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
} from 'react-aria-components'

import { DATE_ROOT, DATE_SEGMENT, DATE_TRIGGER, DateCaret } from '../date'
import { ERROR, FIELD_SIZES, GROUP, HINT, INPUT, LABEL } from '../field'
import type { FieldSize } from '../field'
import { POPOVER } from '../popover'

/**
 * The wheel opens on the surface everything here opens on — `popover.ts`'s, not a copy — and at least
 * as wide as the field it belongs to, so a picker in a form column does not open a panel narrower
 * than the control that produced it.
 */
const WHEEL_POPOVER = `${POPOVER} w-fit p-2`

/**
 * One column of the wheel. A list of options with no panel of its own — the popover above it is the
 * panel — which is why this does not reuse the library's `ListBox`: a column here is a scroller of
 * centred digits, and a list box on the page is a bordered stack of left-aligned rows.
 *
 * The focus ring is declared transparent rather than removed with `outline-none`: that utility writes
 * the shared `--tw-outline-style`, and no ring on this element could draw afterwards. Nothing is lost
 * by it — a column is focused through an option, and an option conveys focus with a background, the
 * way a menu row does.
 */
const WHEEL_COLUMN = [
  'flex max-h-52 w-12 flex-col overflow-y-auto overscroll-contain p-1',
  'outline-2 -outline-offset-2 outline-transparent',
].join(' ')

/**
 * One time in a column.
 *
 * **The hover and focus washes are qualified with `not-data-[selected]`**, so a chosen time keeps the
 * accent fill under the pointer and under the keyboard. Written without it, the two rules set the same
 * property with the same specificity and which one wins is decided by the order Tailwind happens to
 * emit them in — a coin toss the source cannot show you. This is the reading that is meant either way:
 * a hovered option is a candidate, and a hovered *chosen* option is still the choice.
 */
const WHEEL_OPTION = [
  'flex h-7 w-full shrink-0 items-center justify-center rounded-md',
  'text-[13px] text-foreground/75 tabular-nums cursor-pointer select-none',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[hovered]:not-data-[selected]:bg-foreground/7',
  'data-[hovered]:not-data-[selected]:text-foreground',
  'data-[pressed]:not-data-[selected]:bg-foreground/12',
  'data-[focus-visible]:not-data-[selected]:bg-foreground/7',
  'data-[focus-visible]:not-data-[selected]:text-foreground',
  'data-[selected]:bg-primary data-[selected]:text-ink',
  // Disabled dims and does not recolour, the house rule every control follows — and this is where it
  // matters most: an hour outside `minValue`/`maxValue` is the only thing telling a reader the window
  // they can choose from.
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30',
].join(' ')

/** A segment of the time, from React Aria's own render prop rather than re-declared. */
type Segment = Parameters<NonNullable<AriaDateInputProps['children']>>[0]

export interface TimePickerProps<T extends TimeValue> extends Omit<
  AriaTimeFieldProps<T>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'granularity'
  | 'placeholderValue'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Sizes the control the same way a field is sized, through the shared tokens. */
  size?: FieldSize
  /** The time. Controlled. */
  value?: AriaTimeFieldProps<T>['value']
  /** The time it starts at, for uncontrolled use. */
  defaultValue?: AriaTimeFieldProps<T>['defaultValue']
  /** Called with the time, or `null` when the field is cleared. */
  onChange?: AriaTimeFieldProps<T>['onChange']
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaTimeFieldProps<T>['isDisabled']
  /** Keeps the value readable but uneditable. */
  isReadOnly?: AriaTimeFieldProps<T>['isReadOnly']
  /** Marks it required. */
  isRequired?: AriaTimeFieldProps<T>['isRequired']
  /** Marks it invalid from the outside. */
  isInvalid?: AriaTimeFieldProps<T>['isInvalid']
  /** The earliest and latest times that may be chosen. The wheel dims what lies outside them. */
  minValue?: AriaTimeFieldProps<T>['minValue']
  maxValue?: AriaTimeFieldProps<T>['maxValue']
  /** How many segments there are — `hour`, `minute`, `second`. An `en-US` locale adds a day period of its own. */
  granularity?: AriaTimeFieldProps<T>['granularity']
  /**
   * What an empty field shows, and therefore which time the wheel opens on. It is published because
   * the wheel has to agree with the segments: with the default the two both point at midnight, and a
   * picker whose wheel points somewhere other than its own placeholder is a picker that lies.
   */
  placeholderValue?: AriaTimeFieldProps<T>['placeholderValue']
  /**
   * How far apart the minutes in the wheel are, in minutes. Defaults to 15 — the quarter hour a
   * schedule is usually made of — and is rounded to a whole positive number, so a column is never empty.
   * `minuteStep` decides the column; `granularity` decides whether there is one to step in.
   */
  minuteStep?: number
  /**
   * How far apart the seconds in the wheel are, in seconds, when the field has a second segment at
   * all. Defaults to 1 — every second the field can hold — and is rounded the same way `minuteStep` is.
   * There is no column when there is no second segment for it to agree with.
   */
  secondStep?: number
  /**
   * Whether Left and Right wrap around from the last column to the first. Off by default: a wheel that
   * wraps makes the end of a row indistinguishable from its beginning.
   */
  shouldWrapColumns?: boolean
  className?: string
  /**
   * `TimePicker.Label`, `TimePicker.Group` — the input and the trigger with it — then the hint and the
   * error. The wheel is drawn for you, and there is no slot to pass for it.
   */
  children?: React.ReactNode
}

export interface TimePickerLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface TimePickerGroupProps extends Omit<
  AriaGroupProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface TimePickerInputProps extends Omit<
  AriaDateInputProps,
  'children' | 'className'
> {
  className?: string
  /** How to draw each segment. Optional — the segments are drawn for you. */
  children?: (segment: Segment) => React.ReactElement
}

export interface TimePickerButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface TimePickerHintProps extends Omit<AriaTextProps, 'className'> {
  className?: string
  children?: React.ReactNode
}

export interface TimePickerErrorProps extends Omit<
  AriaFieldErrorProps,
  'className'
> {
  className?: string
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

/**
 * What the popover and the wheel need that only the root knows: something React Aria keeps to itself.
 *
 * **`TimeFieldState` is not enough, and that is the one place this component cannot lean on it.**
 * React Aria publishes the field's state through `TimeFieldStateContext`, and it carries the value, the
 * segments and the validation — but not `minValue`, `maxValue` or `placeholderValue`, which it consumed
 * when it built that state. So the three are passed down here instead of being read back off the state,
 * and the wheel can dim and anchor against the same window the field is validating against.
 *
 * The open state and the group's ref live here for the same reason React Aria's own `DatePicker` keeps
 * them: the trigger is inside the group, the panel is beside it, and only the root is the parent of both.
 */
interface TimePickerInner {
  isOpen: boolean
  setOpen: (open: boolean) => void
  /** The bordered box, which is what the popover is positioned and sized against. */
  groupRef: React.RefObject<HTMLDivElement | null>
  /** The trigger's id, which names the dialog it opens. */
  triggerId: string
  minuteStep: number
  secondStep: number
  shouldWrapColumns: boolean
  minValue?: TimeValue | null
  maxValue?: TimeValue | null
  placeholderValue?: TimeValue | null
  isDisabled?: boolean
  isReadOnly?: boolean
}

const TimePickerContext = createContext<TimePickerInner | null>(null)

/**
 * The legend. Use it as `TimePicker.Label`.
 *
 * Exported as `TimePickerLabel` only so tooling can resolve it; consume the compound form
 * `TimePicker.Label`.
 */
export function TimePickerLabel({
  className,
  children,
  ...props
}: TimePickerLabelProps) {
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
 * Wraps the segments and the trigger. Use it as `TimePicker.Group`; it is what leaves room for the
 * chevron, through the same `data-slot` rules a field's affixes use.
 *
 * Exported as `TimePickerGroup` only so tooling can resolve it; consume the compound form
 * `TimePicker.Group`.
 */
export function TimePickerGroup({
  className,
  children,
  ...props
}: TimePickerGroupProps) {
  const picker = useContext(TimePickerContext)

  return (
    <AriaGroup
      // The ref goes to the box the popover is anchored to — React Aria merges it with the one it
      // publishes through `GroupContext`, so the field keeps its own.
      ref={picker?.groupRef}
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The time itself, as editable segments. Use it as `TimePicker.Input`.
 *
 * Exported as `TimePickerInput` only so tooling can resolve it; consume the compound form
 * `TimePicker.Input`.
 */
export function TimePickerInput({
  className,
  children,
  ...props
}: TimePickerInputProps) {
  return (
    <AriaDateInput
      data-slot="input"
      className={[INPUT, 'flex items-center gap-0', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ??
        ((segment: Segment) => (
          <AriaDateSegment segment={segment} className={DATE_SEGMENT} />
        ))}
    </AriaDateInput>
  )
}

/**
 * The chevron that opens the wheel. Use it as `TimePicker.Button`, inside a `TimePicker.Group`.
 *
 * **It is disabled with the field**, which React Aria's own picker trigger is not: a picker that
 * cannot be edited must not offer a wheel that would write to it.
 *
 * Exported as `TimePickerButton` only so tooling can resolve it; consume the compound form
 * `TimePicker.Button`.
 */
export function TimePickerButton({
  className,
  children,
  ...props
}: TimePickerButtonProps) {
  const picker = useContext(TimePickerContext)
  const isDisabled = picker?.isDisabled || picker?.isReadOnly

  return (
    <AriaButton
      {...props}
      data-slot="icon-end"
      id={picker?.triggerId}
      aria-label={props['aria-label'] ?? 'Choose a time'}
      aria-haspopup="dialog"
      aria-expanded={picker?.isOpen}
      isDisabled={isDisabled}
      onPress={() => picker?.setOpen(!picker.isOpen)}
      className={[
        DATE_TRIGGER,
        // The trigger is outside the input, so it does not inherit the input's dimming.
        'data-[disabled]:opacity-40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children ?? <DateCaret />}
    </AriaButton>
  )
}

/**
 * The guidance under the control. Use it as `TimePicker.Hint`.
 *
 * Exported as `TimePickerHint` only so tooling can resolve it; consume the compound form
 * `TimePicker.Hint`.
 */
export function TimePickerHint({
  className,
  children,
  ...props
}: TimePickerHintProps) {
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
 * The message shown when the picker is `isInvalid`. Use it as `TimePicker.Error`.
 *
 * Exported as `TimePickerError` only so tooling can resolve it; consume the compound form
 * `TimePicker.Error`.
 */
export function TimePickerError({ className, ...props }: TimePickerErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

interface WheelOption {
  id: string
  label: string
}

/**
 * The two day-period labels, spelled the way the field's own day-period segment spells them.
 *
 * **Hardcoding AM and PM would put the wheel at odds with the field beside it.** `en-US` renders a
 * morning as `AM`, and the same component in `ja-JP` renders `午前` in the segment directly above the
 * wheel — one component, two words for the same thing. So the labels come from the same formatter the
 * field uses, and in a 24-hour locale there is no day period to name and both are empty strings.
 *
 * `Intl` formats a JavaScript `Date`, not a calendar value, so an hour is asked for by way of a plain
 * date at that hour — which is what `@internationalized/date` does internally for the same question.
 */
function useDayPeriodLabels(locale: string) {
  return useMemo(() => {
    const formatter = new DateFormatter(locale, { hour: 'numeric' })
    const label = (hour: number) =>
      formatter
        .formatToParts(new Date(2020, 0, 1, hour))
        .find((part) => part.type === 'dayPeriod')?.value ?? ''

    return { am: label(9), pm: label(21) }
  }, [locale])
}

/**
 * One column: a list box whose options are the times it offers.
 *
 * **The behaviour is React Aria's, not a re-implementation of it.** `selectionBehavior="replace"` is what
 * makes the arrows commit as they move — pressing `ArrowDown` in the minutes column changes the value
 * without a Space to confirm it — and `autoFocus` is what lands the keyboard on the value already
 * chosen when the wheel opens, because React Aria's autofocus prefers a selected key over the first one.
 * `disabledKeys` then keeps the arrows off everything outside `minValue`/`maxValue`, and React Aria
 * scrolls the focused option into view on its own.
 */
function WheelColumn({
  columnRef,
  label,
  items,
  selectedKey,
  disabledKeys,
  autoFocus,
  onSelect,
}: {
  columnRef: React.RefObject<HTMLDivElement | null>
  label: string
  items: WheelOption[]
  selectedKey: string
  disabledKeys?: string[]
  autoFocus?: AriaListBoxProps<WheelOption>['autoFocus']
  onSelect: (key: string) => void
}) {
  return (
    <AriaListBox
      ref={columnRef}
      data-slot="time-column"
      aria-label={label}
      className={WHEEL_COLUMN}
      items={items}
      selectionMode="single"
      selectionBehavior="replace"
      disallowEmptySelection
      selectedKeys={[selectedKey]}
      disabledKeys={disabledKeys}
      autoFocus={autoFocus}
      onSelectionChange={(keys) => {
        if (keys === 'all') return
        const key = keys.values().next().value
        if (key != null) onSelect(String(key))
      }}
    >
      {(item: WheelOption) => (
        <AriaListBoxItem
          id={item.id}
          textValue={item.label}
          className={WHEEL_OPTION}
        >
          {item.label}
        </AriaListBoxItem>
      )}
    </AriaListBox>
  )
}

/**
 * The wheel: hours, minutes, then — **only where the field has them** — seconds and a day period.
 *
 * **Every column follows a segment, and that is the rule rather than a coincidence.** A field built with
 * `granularity="second"` has a second segment, so its wheel has a seconds column; a minute field has
 * neither and gets neither, and a 24-hour locale has no day period to name. The alternative — offering
 * seconds whenever the component feels like it — is how a wheel ends up changing a value the field does
 * not show, or hiding one it does.
 *
 * Columns rather than a spinner, because a spinner is a gesture and this is a form control: each column
 * can be read, typed into and reached with the arrow keys, and each is a real list box with a roving tab
 * index.
 *
 * **Picking does not close it, and that is the one place this differs from `DatePicker`.** A day is one
 * decision, so choosing one closes the calendar; a time is two, three or four, and closing after the
 * hour would send the reader back to the field to start again. Enter and Escape close it, and Escape is
 * React Aria's own.
 */
function TimePickerWheel() {
  const picker = useContext(TimePickerContext)
  const timeState = useContext(TimeFieldStateContext)
  const { locale, direction } = useLocale()
  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const secondsRef = useRef<HTMLDivElement>(null)
  const periodRef = useRef<HTMLDivElement>(null)
  const dayPeriods = useDayPeriodLabels(locale)

  /**
   * **The column that opens the wheel scrolls itself; the others have to be brought along.**
   * React Aria scrolls the option it focuses into view, and only the hours column is focused when the
   * wheel opens — so a seconds column of sixty would open at `00` with the second that is actually set
   * somewhere below the fold, and a five-minute step would do the same to the minutes. `block: 'nearest'`
   * moves that column and nothing else, and it is a layout effect so the list is never *seen* in the
   * wrong place. It cannot run on the server: the wheel only exists inside an open popover.
   */
  const shownInColumns = useRef('')
  useLayoutEffect(() => {
    if (picker?.isOpen !== true) return
    const columns = [hoursRef, minutesRef, secondsRef, periodRef]
    // **React Aria builds the collection a commit after the popover mounts**, so on the first pass there
    // is nothing to scroll to. This runs on every render and only gives up while the rows are missing —
    // the same retry React Aria's own autofocus does.
    if (
      !columns.some((column) =>
        column.current?.querySelector('[data-selected]'),
      )
    ) {
      return
    }

    // What the wheel is showing, as one string. Position the columns when that changes — the wheel
    // opening, or the time moving under it — and never while the reader is scrolling a column they are
    // browsing, because browsing changes no value and so changes none of this.
    const signature = columns
      .map(
        (column) =>
          column.current?.querySelector('[data-selected]')?.textContent ?? '',
      )
      .join('|')
    if (signature === shownInColumns.current) return

    for (const column of columns) {
      column.current
        ?.querySelector('[data-selected]')
        ?.scrollIntoView({ block: 'nearest' })
    }
    shownInColumns.current = signature
  })

  if (picker == null || timeState == null) return null

  const {
    minuteStep,
    secondStep,
    shouldWrapColumns,
    minValue,
    maxValue,
    placeholderValue,
  } = picker

  /** The hour is 1–12 where the locale names a day period, and 0–23 where it does not. */
  const hourSegment = timeState.segments.find((s) => s.type === 'hour')
  const usesDayPeriod = timeState.segments.some((s) => s.type === 'dayPeriod')
  const usesSeconds = timeState.segments.some((s) => s.type === 'second')
  const firstHour = hourSegment?.minValue ?? (usesDayPeriod ? 1 : 0)
  const lastHour = hourSegment?.maxValue ?? (usesDayPeriod ? 12 : 23)

  /**
   * **An empty field shows its placeholder, and `timeValue` is `null` until a segment is filled** — the
   * declaration says `Time`, and React Stately computes it from the value, which is null while the field
   * is empty. So the declaration is widened here once rather than trusted. Falling back to the
   * *placeholder* and not to a time of this component's choosing is what keeps the wheel's highlight on
   * the same time the segments are showing.
   */
  const value = timeState.timeValue as Time | null
  const shown = value ?? placeholderValue ?? new Time(0, 0)
  const isPm = shown.hour >= 12
  const displayHour = usesDayPeriod ? shown.hour % 12 || 12 : shown.hour

  const minuteInterval = Math.max(1, Math.round(minuteStep))
  const minuteValues = Array.from(
    { length: Math.ceil(60 / minuteInterval) },
    (_, i) => i * minuteInterval,
  )
  const secondInterval = Math.max(1, Math.round(secondStep))
  const secondValues = Array.from(
    { length: Math.ceil(60 / secondInterval) },
    (_, i) => i * secondInterval,
  )

  /**
   * Snapped, so the selected key is always one of the options: a value typed as 09:32 with a step of
   * 15 highlights 30, and the arrows then step from there.
   */
  const snap = (values: number[], to: number) =>
    values.reduce((prev, current) =>
      Math.abs(current - to) < Math.abs(prev - to) ? current : prev,
    )

  const displayMinute = snap(minuteValues, shown.minute)
  const displaySecond = snap(secondValues, shown.second)

  const hours: WheelOption[] = Array.from(
    { length: lastHour - firstHour + 1 },
    (_, i) => firstHour + i,
  ).map((hour) => ({ id: String(hour), label: String(hour).padStart(2, '0') }))

  const minutes: WheelOption[] = minuteValues.map((minute) => ({
    id: String(minute),
    label: String(minute).padStart(2, '0'),
  }))

  const seconds: WheelOption[] = secondValues.map((second) => ({
    id: String(second),
    label: String(second).padStart(2, '0'),
  }))

  const periods: WheelOption[] = [
    { id: 'am', label: dayPeriods.am },
    { id: 'pm', label: dayPeriods.pm },
  ]

  /**
   * Whether a whole span of the clock is outside the window. An hour is only removed from the column
   * when *every* minute in it is out of range — with `minValue` at 09:30 the 09 row still has 09:59 in
   * it, and a picker that dropped the hour the reader is currently living in would be unusable.
   */
  const spanIsOutOfRange = (start: Time, end: Time) =>
    (minValue != null && end.compare(minValue) < 0) ||
    (maxValue != null && start.compare(maxValue) > 0)

  // The end of an hour or a day period is its last millisecond, not its last minute: a field with a
  // second segment holds 09:59:59, and a span that stopped at 09:59:00 would call it out of range.
  const hourIsOutOfRange = (hour: number) =>
    spanIsOutOfRange(new Time(hour, 0), new Time(hour, 59, 59, 999))

  const timeIsOutOfRange = (hour: number, minute: number, second: number) => {
    const candidate = new Time(hour, minute, second)
    return (
      (minValue != null && candidate.compare(minValue) < 0) ||
      (maxValue != null && candidate.compare(maxValue) > 0)
    )
  }

  /** The 24-hour value of a displayed hour in the period currently chosen. */
  const to24Hour = (hour: number, pm: boolean) => {
    if (!usesDayPeriod) return hour
    if (hour === 12) return pm ? 12 : 0
    return pm ? hour + 12 : hour
  }

  /**
   * **Committing goes through a `CalendarDateTime`, because a bare `Time` cannot be committed at all.**
   * React Aria types `setValue` for a date field, and takes every plain value it is given through
   * `toCalendar` — which asks the value for its calendar, and a `Time` has none. A `CalendarDateTime`
   * carrying the field's own date is the shape the state is already holding, and `useTimeFieldState`
   * maps what it emits back through `toTime`, so a consumer's `onChange` still receives a `Time`.
   *
   * The clamp is what makes arrow-scrubbing across a boundary usable: with `minValue` at 09:30, hour 09
   * is offered — 09:59 is inside the window — so choosing it at minute 15 lands on 09:30 rather than on
   * a time the field would reject.
   */
  const commit = (hour24: number, minute: number, second: number) => {
    const wanted = new Time(hour24, minute, second, shown.millisecond)
    const below = minValue != null && wanted.compare(minValue) < 0
    const above = maxValue != null && wanted.compare(maxValue) > 0
    let chosen = wanted
    if (below) {
      chosen = new Time(minValue.hour, minValue.minute, minValue.second)
    } else if (above) {
      chosen = new Time(maxValue.hour, maxValue.minute, maxValue.second)
    }

    // The state carries a date even for a time field — React Stately converts a time into a
    // `CalendarDateTime` before it stores it — so the fallback below is defensive rather than real.
    const carried = timeState.value
    const date = carried != null && 'day' in carried ? carried : null

    timeState.setValue(
      new CalendarDateTime(
        date?.year ?? 2000,
        date?.month ?? 1,
        date?.day ?? 1,
        chosen.hour,
        chosen.minute,
        chosen.second,
        chosen.millisecond,
      ),
    )
  }

  const hoursAreDisabled = hours
    .filter((hour) => hourIsOutOfRange(to24Hour(Number(hour.id), isPm)))
    .map((hour) => hour.id)

  const minutesAreDisabled = minutes
    .filter((minute) =>
      timeIsOutOfRange(shown.hour, Number(minute.id), shown.second),
    )
    .map((minute) => minute.id)

  const secondsAreDisabled = usesSeconds
    ? seconds
        .filter((second) =>
          timeIsOutOfRange(shown.hour, shown.minute, Number(second.id)),
        )
        .map((second) => second.id)
    : []

  const periodsAreDisabled = periods
    .filter((period) =>
      spanIsOutOfRange(
        new Time(period.id === 'am' ? 0 : 12, 0),
        new Time(period.id === 'am' ? 11 : 23, 59, 59, 999),
      ),
    )
    .map((period) => period.id)

  /** Move the keyboard to the adjacent column, landing on the value that column already holds. */
  const moveColumn = (step: 1 | -1) => {
    const columns = [
      hoursRef,
      minutesRef,
      ...(usesSeconds ? [secondsRef] : []),
      ...(usesDayPeriod ? [periodRef] : []),
    ]
    const index = columns.findIndex((column) =>
      column.current?.contains(document.activeElement),
    )
    if (index === -1) return

    const target = index + step
    const next = shouldWrapColumns
      ? (target + columns.length) % columns.length
      : Math.max(0, Math.min(columns.length - 1, target))
    if (next === index) return

    const column = columns[next].current
    if (column == null) return
    // The option holding the roving tab index is the column's own focus position — React Aria keeps it
    // on the item, not on the list — so this lands on the time that column already has, and a screen
    // reader announces the new list and the value in one keystroke.
    const option =
      column.querySelector<HTMLElement>('[role="option"][tabindex="0"]') ??
      column.querySelector<HTMLElement>(
        '[role="option"][aria-selected="true"]:not([aria-disabled="true"])',
      ) ??
      column.querySelector<HTMLElement>(
        '[role="option"]:not([aria-disabled="true"])',
      )
    ;(option ?? column).focus()
  }

  return (
    <div
      data-slot="time-wheel"
      role="group"
      aria-label="Time selector"
      className="flex gap-1"
      onKeyDownCapture={(e) => {
        // Enter confirms and closes. Captured rather than bubbled, because the option under the
        // keyboard handles Enter itself first — and by now it has nothing left to do: the value was
        // committed when the arrows moved focus onto it.
        if (e.key !== 'Enter') return
        e.preventDefault()
        e.stopPropagation()
        picker.setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        e.preventDefault()
        moveColumn(e.key === forward ? 1 : -1)
      }}
    >
      <WheelColumn
        columnRef={hoursRef}
        label="Hours"
        items={hours}
        selectedKey={String(displayHour)}
        disabledKeys={hoursAreDisabled}
        autoFocus
        onSelect={(key) =>
          commit(to24Hour(Number(key), isPm), shown.minute, shown.second)
        }
      />
      <WheelColumn
        columnRef={minutesRef}
        label="Minutes"
        items={minutes}
        selectedKey={String(displayMinute)}
        disabledKeys={minutesAreDisabled}
        onSelect={(key) => commit(shown.hour, Number(key), shown.second)}
      />
      {usesSeconds && (
        <WheelColumn
          columnRef={secondsRef}
          label="Seconds"
          items={seconds}
          selectedKey={String(displaySecond)}
          disabledKeys={secondsAreDisabled}
          onSelect={(key) => commit(shown.hour, shown.minute, Number(key))}
        />
      )}
      {usesDayPeriod && (
        <WheelColumn
          columnRef={periodRef}
          label="AM/PM"
          items={periods}
          selectedKey={isPm ? 'pm' : 'am'}
          disabledKeys={periodsAreDisabled}
          onSelect={(key) =>
            commit(
              to24Hour(displayHour, key === 'pm'),
              shown.minute,
              shown.second,
            )
          }
        />
      )}
    </div>
  )
}

/**
 * The wheel, on its surface, in a dialog. What it needs from the root is the state the trigger toggles
 * and the box to open against.
 *
 * **Internal.** `TimePicker` draws one itself; it is not a published slot.
 */
function TimePickerPopover() {
  const picker = useContext(TimePickerContext)

  return (
    <AriaPopover
      data-slot="dropdown"
      triggerRef={picker?.groupRef}
      placement="bottom start"
      isOpen={picker?.isOpen}
      onOpenChange={picker?.setOpen}
      className={WHEEL_POPOVER}
    >
      {/* The trigger names the dialog, which is React Aria's own convention for a triggered overlay —
          and the reason the wheel needs no title of its own. */}
      <AriaDialog
        aria-labelledby={picker?.triggerId}
        className="outline-2 -outline-offset-2 outline-transparent"
      >
        <TimePickerWheel />
      </AriaDialog>
    </AriaPopover>
  )
}

/**
 * Styled element. Not exported — `TimePicker` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function TimePickerRoot<T extends TimeValue>({
  ref,
  size = 'md',
  className,
  children,
  minuteStep = 15,
  secondStep = 1,
  shouldWrapColumns = false,
  placeholderValue,
  ...props
}: TimePickerProps<T>) {
  const [isOpen, setOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()

  const inner: TimePickerInner = {
    isOpen,
    setOpen,
    groupRef,
    triggerId,
    minuteStep,
    secondStep,
    shouldWrapColumns,
    minValue: props.minValue,
    maxValue: props.maxValue,
    placeholderValue,
    isDisabled: props.isDisabled,
    isReadOnly: props.isReadOnly,
  }

  return (
    <TimePickerContext.Provider value={inner}>
      <AriaTimeField
        {...props}
        ref={ref}
        placeholderValue={placeholderValue}
        // `data-open` is the field's, not the popover's: what the accent marks while the wheel is open
        // is the control the wheel belongs to. React Aria's own `DatePicker` publishes the same
        // attribute, and React Aria passes `data-*` through to this element.
        data-open={isOpen || undefined}
        className={[DATE_ROOT, FIELD_SIZES[size], 'w-fit', className]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
        <TimePickerPopover />
      </AriaTimeField>
    </TimePickerContext.Provider>
  )
}

/**
 * A time, typed or chosen — the second component here with no sheet to copy, after the date picker, so
 * it follows the sheet's *language* rather than its markup: square, mono, the field's own hairline and
 * focus, and the accent kept for the time that is chosen.
 *
 * ```tsx
 * <TimePicker defaultValue={parseTime('09:30')} minuteStep={15}>
 *   <TimePicker.Label>Opens at</TimePicker.Label>
 *   <TimePicker.Group>
 *     <TimePicker.Input />
 *     <TimePicker.Button />
 *   </TimePicker.Group>
 *   <TimePicker.Hint>Business hours only.</TimePicker.Hint>
 * </TimePicker>
 * ```
 *
 * **The wheel is drawn for you, and picking does not close it.** A time is two, three or four decisions
 * — hour, minute, and then seconds or a day period if the field has them — so the panel stays open while
 * they are made, and Enter or Escape closes it. Columns rather than a clock face: each one is a React
 * Aria list box, which is what gives it its roving tab index, its typeahead and its `data-disabled`
 * options, and each one follows a segment of the field, so the wheel can neither offer a unit the field
 * does not show nor hide one it does.
 *
 * **It is `TimeField` with a picker attached.** The segments, the anatomy and the validation are the
 * field's — `TimePicker` wraps React Aria's `TimeField`, so the label, the hint, the error and the native
 * form behaviour are the ones a `TimeField` already has. What this adds is the trigger, the panel and the
 * wheel; what it does not add is a second way to type a time.
 *
 * The value is a `TimeValue`, not a string — `parseTime` reads an ISO time, and `onChange` hands back the
 * same shape. `minValue` and `maxValue` are the window: the wheel dims every hour and minute outside it
 * and clamps a choice that would land outside it, rather than hiding them, because a column with holes in
 * it is harder to read than one where the gaps are marked.
 */
export const TimePicker = Object.assign(TimePickerRoot, {
  Label: TimePickerLabel,
  Group: TimePickerGroup,
  Input: TimePickerInput,
  Button: TimePickerButton,
  Hint: TimePickerHint,
  Error: TimePickerError,
})
