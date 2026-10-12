import {
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Text as AriaText,
  TimeField as AriaTimeField,
} from 'react-aria-components'
import type {
  DateInputProps as AriaDateInputProps,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
} from 'react-aria-components'

import { DATE_SEGMENT } from '../date'
import { FIELD_SIZES, INPUT, LABEL, HINT, ERROR } from '../field'
import type { FieldSize } from '../field'

/**
 * A segment, derived from what React Aria's `DateInput` hands its render function rather than
 * re-declared — the same type `DateField` uses, because a time's segments are a date's segments.
 */
type Segment = Parameters<NonNullable<AriaDateInputProps['children']>>[0]

export interface TimeFieldProps<T extends TimeValue> extends Omit<
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
> {
  /** The time. Controlled. */
  value?: AriaTimeFieldProps<T>['value']
  /** The time it starts at, for uncontrolled use. */
  defaultValue?: AriaTimeFieldProps<T>['defaultValue']
  /** Called with the time, or `null` when the field is cleared. */
  onChange?: AriaTimeFieldProps<T>['onChange']
  /** Disables the field. */
  isDisabled?: AriaTimeFieldProps<T>['isDisabled']
  /** Keeps the value readable but uneditable. */
  isReadOnly?: AriaTimeFieldProps<T>['isReadOnly']
  /** Marks it required. */
  isRequired?: AriaTimeFieldProps<T>['isRequired']
  /** Marks it invalid from the outside. */
  isInvalid?: AriaTimeFieldProps<T>['isInvalid']
  /** How many segments there are — `hour`, `minute`, `second`. An `en-US` locale adds a day period of its own. */
  granularity?: AriaTimeFieldProps<T>['granularity']

  /** `sm | md | lg`, from the shared field table. */
  size?: FieldSize
  className?: string
  children?: React.ReactNode
}

export interface TimeFieldLabelProps extends Omit<AriaLabelProps, 'className'> {
  className?: string
}

export interface TimeFieldGroupProps extends Omit<AriaGroupProps, 'className'> {
  className?: string
}

export interface TimeFieldInputProps extends Omit<
  AriaDateInputProps,
  'children' | 'className'
> {
  className?: string
}

export interface TimeFieldHintProps extends Omit<AriaTextProps, 'className'> {
  className?: string
}

export interface TimeFieldErrorProps extends Omit<
  AriaFieldErrorProps,
  'className'
> {
  className?: string
}

const GROUP = [
  'flex w-fit items-center',
  'border border-(--field-border) bg-card',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[focus-within]:border-primary',
  'data-[invalid]:border-destructive',
  'data-[disabled]:opacity-40',
].join(' ')

/**
 * A time typed into a field.
 *
 * ```tsx
 * <TimeField defaultValue={parseTime('09:30')}>
 *   <TimeField.Label>Opens at</TimeField.Label>
 *   <TimeField.Group>
 *     <TimeField.Input />
 *   </TimeField.Group>
 *   <TimeField.Error>Enter a time.</TimeField.Error>
 * </TimeField>
 * ```
 *
 * **It is `DateField` with hours and minutes instead of days.** Same slots, same `date.tsx` segments,
 * same field anatomy — and the same reason to exist: the segments are real, individually editable
 * fields, so the arrows step one of them and typing a digit advances to the next. `<input type="time">`
 * gives the browser's own spinner and no styling; a text input gives nothing at all.
 *
 * The two are kept as **separate compound components** rather than one with a flag, for the reason
 * `TextField` and `SearchField` are: Storybook derives the docs import line from the subcomponent's
 * value, so a shared slot would be documented under the wrong component's name, and one JSDoc cannot
 * describe two compound forms. The constants they share are the thing that must not drift — and they
 * are `date.tsx` and `field.ts`, which neither component owns.
 *
 * **A time field is narrow on purpose.** Hours, minutes and optionally seconds are two digits each,
 * so the box is as wide as its contents and no wider — a time field stretched across a form column
 * reads as an empty text field rather than as a filled one.
 */
function TimeFieldRoot<T extends TimeValue>({
  size = 'md',
  className,
  children,
  ...props
}: TimeFieldProps<T>) {
  return (
    <AriaTimeField
      className={[
        FIELD_SIZES[size],
        '[--field-border:var(--color-input)]',
        '[--field-hover:var(--color-foreground)]',
        'flex w-fit flex-col gap-2',
        'data-[disabled]:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaTimeField>
  )
}

/**
 * What the time is. Use it as `TimeField.Label`.
 *
 * Exported as `TimeFieldLabel` only so tooling can resolve it; consume the compound form
 * `TimeField.Label`.
 */
export function TimeFieldLabel({ className, ...props }: TimeFieldLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The bordered box the segments sit in. Use it as `TimeField.Group`.
 *
 * Exported as `TimeFieldGroup` only so tooling can resolve it; consume the compound form
 * `TimeField.Group`.
 */
export function TimeFieldGroup({
  className,
  children,
  ...props
}: TimeFieldGroupProps) {
  return (
    <AriaGroup
      data-slot="time-group"
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The segments. Use it as `TimeField.Input` — with no children it draws every segment of the time
 * from the render props, in the order the locale puts them.
 *
 * Exported as `TimeFieldInput` only so tooling can resolve it; consume the compound form
 * `TimeField.Input`.
 */
export function TimeFieldInput({ className, ...props }: TimeFieldInputProps) {
  return (
    <AriaDateInput
      className={[INPUT, 'flex w-auto items-center gap-0', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {(segment: Segment) => (
        <AriaDateSegment segment={segment} className={DATE_SEGMENT} />
      )}
    </AriaDateInput>
  )
}

/**
 * A line of help under the field. Use it as `TimeField.Hint`.
 *
 * Exported as `TimeFieldHint` only so tooling can resolve it; consume the compound form
 * `TimeField.Hint`.
 */
export function TimeFieldHint({ className, ...props }: TimeFieldHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The message shown while the field is invalid. Use it as `TimeField.Error`.
 *
 * Exported as `TimeFieldError` only so tooling can resolve it; consume the compound form
 * `TimeField.Error`.
 */
export function TimeFieldError({ className, ...props }: TimeFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A time typed into a field. The compound form is the public symbol; the root is named apart because a
 * plain `function` decorated with `Object.assign` leaves TypeScript unaware of the slots.
 */
export const TimeField = Object.assign(TimeFieldRoot, {
  Label: TimeFieldLabel,
  Group: TimeFieldGroup,
  Input: TimeFieldInput,
  Hint: TimeFieldHint,
  Error: TimeFieldError,
})
