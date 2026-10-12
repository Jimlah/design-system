import {
  DateField as AriaDateField,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Text as AriaText,
} from 'react-aria-components'
import type {
  DateFieldProps as AriaDateFieldProps,
  DateInputProps as AriaDateInputProps,
  DateValue,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { DATE_SEGMENT } from '../date'
import { FIELD_SIZES, INPUT, LABEL, HINT, ERROR } from '../field'
import type { FieldSize } from '../field'

/**
 * A segment, derived from what React Aria's `DateInput` hands its render function rather than
 * re-declared, so it cannot drift from the signature it has to match.
 */
type Segment = Parameters<NonNullable<AriaDateInputProps['children']>>[0]

export interface DateFieldProps<T extends DateValue> extends Omit<
  AriaDateFieldProps<T>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'minValue'
  | 'maxValue'
> {
  /** The date. Controlled. */
  value?: AriaDateFieldProps<T>['value']
  /** The date it starts at, for uncontrolled use. */
  defaultValue?: AriaDateFieldProps<T>['defaultValue']
  /** Called with the date, or `null` when the field is cleared. */
  onChange?: AriaDateFieldProps<T>['onChange']
  /** Disables the field. */
  isDisabled?: AriaDateFieldProps<T>['isDisabled']
  /** Keeps the value readable but uneditable. */
  isReadOnly?: AriaDateFieldProps<T>['isReadOnly']
  /** Marks it required. */
  isRequired?: AriaDateFieldProps<T>['isRequired']
  /** Marks it invalid from the outside. */
  isInvalid?: AriaDateFieldProps<T>['isInvalid']
  /** The earliest selectable date. */
  minValue?: AriaDateFieldProps<T>['minValue']
  /** The latest selectable date. */
  maxValue?: AriaDateFieldProps<T>['maxValue']

  /** `sm | md | lg`, from the shared field table. */
  size?: FieldSize
  className?: string
  children?: React.ReactNode
}

export interface DateFieldLabelProps extends Omit<AriaLabelProps, 'className'> {
  className?: string
}

export interface DateFieldGroupProps extends Omit<AriaGroupProps, 'className'> {
  className?: string
}

export interface DateFieldInputProps extends Omit<
  AriaDateInputProps,
  'children' | 'className'
> {
  className?: string
}

export interface DateFieldHintProps extends Omit<AriaTextProps, 'className'> {
  className?: string
}

export interface DateFieldErrorProps extends Omit<
  AriaFieldErrorProps,
  'className'
> {
  className?: string
}

/** The bordered box the segments sit in. */
const GROUP = [
  'flex w-fit items-center',
  'border border-(--field-border) bg-panel',
  'transition-colors duration-150 ease-pulse',
  'data-[focus-within]:border-teal',
  'data-[invalid]:border-red',
  'data-[disabled]:opacity-40',
].join(' ')

/**
 * A date typed into a field, with no calendar behind it.
 *
 * ```tsx
 * <DateField defaultValue={parseDate('2024-03-18')}>
 *   <DateField.Label>Starts on</DateField.Label>
 *   <DateField.Group>
 *     <DateField.Input />
 *   </DateField.Group>
 *   <DateField.Error>Choose a date.</DateField.Error>
 * </DateField>
 * ```
 *
 * **The segments are real, individually editable fields, and that is the whole point.** Each one
 * takes focus, the up and down arrows step it, and typing a digit advances to the next — so a date is
 * a date to a keyboard user rather than a string they have to guess the format of. A plain
 * `<input type="date">` gives the browser's own picker and no styling at all; a text input gives
 * nothing. This is the only one of the three where the parts are addressable.
 *
 * It shares `date.tsx` with `DatePicker` and `DateRangePicker`, so a segment looks the same whether
 * it arrived from typing or from a calendar — the same call `field.ts` makes for the text controls.
 *
 * **No picker, by design.** Use this when the date is known and typing it is faster; reach for
 * `DatePicker` when it has to be looked up. Putting a calendar here would make every date field a
 * two-step control for the sake of the occasional date nobody remembers.
 */
function DateFieldRoot<T extends DateValue>({
  size = 'md',
  className,
  children,
  ...props
}: DateFieldProps<T>) {
  return (
    <AriaDateField
      className={[
        FIELD_SIZES[size],
        '[--field-border:var(--color-input)]',
        '[--field-hover:var(--color-foreground)]',
        'flex flex-col gap-2',
        'data-[disabled]:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaDateField>
  )
}

/**
 * What the date is. Use it as `DateField.Label`.
 *
 * Exported as `DateFieldLabel` only so tooling can resolve it; consume the compound form
 * `DateField.Label`.
 */
export function DateFieldLabel({ className, ...props }: DateFieldLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The bordered box the segments sit in. Use it as `DateField.Group`.
 *
 * Exported as `DateFieldGroup` only so tooling can resolve it; consume the compound form
 * `DateField.Group`.
 */
export function DateFieldGroup({
  className,
  children,
  ...props
}: DateFieldGroupProps) {
  return (
    <AriaGroup
      // **`role="group"` is on the field root too**, so a story querying the role matches two elements
      // per field and a "three sizes" assertion counts six. `data-slot` names the bordered box, as it
      // does for the drop zone and the slider's grip.
      data-slot="date-group"
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The segments. Use it as `DateField.Input` — with no children it draws every segment of the date
 * from the render props, in the order the locale puts them.
 *
 * Exported as `DateFieldInput` only so tooling can resolve it; consume the compound form
 * `DateField.Input`.
 */
export function DateFieldInput({ className, ...props }: DateFieldInputProps) {
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
 * A line of help under the field. Use it as `DateField.Hint`.
 *
 * Exported as `DateFieldHint` only so tooling can resolve it; consume the compound form
 * `DateField.Hint`.
 */
export function DateFieldHint({ className, ...props }: DateFieldHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The message shown while the field is invalid — including "incomplete", which for a date is the
 * common case. Use it as `DateField.Error`.
 *
 * Exported as `DateFieldError` only so tooling can resolve it; consume the compound form
 * `DateField.Error`.
 */
export function DateFieldError({ className, ...props }: DateFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A date typed into a field, with no calendar behind it. The compound form is the public symbol; the
 * root is named apart because a plain `function` decorated with `Object.assign` leaves TypeScript
 * unaware of the slots.
 */
export const DateField = Object.assign(DateFieldRoot, {
  Label: DateFieldLabel,
  Group: DateFieldGroup,
  Input: DateFieldInput,
  Hint: DateFieldHint,
  Error: DateFieldError,
})
