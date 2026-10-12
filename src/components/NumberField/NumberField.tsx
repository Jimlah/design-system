import {
  Button as AriaButton,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  NumberField as AriaNumberField,
  Text as AriaText,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  InputProps as AriaInputProps,
  LabelProps as AriaLabelProps,
  NumberFieldProps as AriaNumberFieldProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { ERROR, FIELD, FIELD_SIZES, GROUP, HINT, INPUT, LABEL } from '../field'
import type { FieldSize } from '../field'

/**
 * The sheet has no number field — only a number's *typography*, in `.ds-num`, `.ds-num-sm` and
 * `.ds-num-alt`. So the field is the shared anatomy every control here uses, and the sheet's
 * contribution is the type: its numbers are letterspaced and, being mono, already tabular, which is
 * what makes a column of figures line up.
 *
 * The yellow stays with the readouts. `.ds-num` is an accent because a number in the sheet's
 * dashboard *is* the point of the row; a number being typed is one value among the others on the
 * form, and a field that shouts is a field nobody can read alongside its neighbours.
 */
const NUMBER_INPUT = [
  INPUT,
  // Tabular and letterspaced, the sheet's numeric signature — so the digits do not shuffle sideways
  // as they are typed, and a column of them lines up.
  'tabular-nums tracking-[0.35px]',
].join(' ')

/**
 * The trailing unit, the way the sheet builds one.
 *
 * It is **inside** the field, not beside it: the sheet's `.ds-input--unit` pads the input on that
 * side and its `.ds-unit` sits over the padding. Putting the buttons *after* the input instead
 * pushes them outside the border, because the shared `INPUT` is `w-full` — the one class a control
 * cannot argue with in a flex row, since both are `width` utilities and Tailwind's order, not the
 * author's, decides between them.
 *
 * `data-slot="counter"` is what asks the Group for the padding, through a rule `NumberField` adds
 * for itself rather than one `field.ts` has to know about. The two halves **stack**, so the unit is
 * a column the height of the field: that is the shape a spinner is read in, and `+` is on top for
 * the same reason it is on every other one.
 */
const COUNTER = [
  'absolute inset-y-0 end-0 z-10 flex w-8 flex-col',
  'border-s border-(--field-border)',
].join(' ')

const STEPPER = [
  'flex flex-1 items-center justify-center',
  'cursor-pointer text-foreground/70',
  'transition-colors duration-[120ms] ease-pulse',
  'data-[hovered]:bg-foreground/5 data-[hovered]:text-foreground',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-[-3px]',
  'data-[focus-visible]:outline-ring',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
].join(' ')

/** The hairline between the two halves — the same divider the sheet draws between an input and its affix. */
const STEPPER_DIVIDE = 'border-b border-(--field-border)'

/** The sheet's caret, at 1.5 stroke, turned to point up and down. */
const ARROW = 'h-1 w-1.5'

function Stepper({ points }: { points: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 10 6" fill="none" aria-hidden="true" className={ARROW}>
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={points === 'up' ? 'rotate(180 5 3)' : undefined}
      />
    </svg>
  )
}

export interface NumberFieldProps extends Omit<
  AriaNumberFieldProps,
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
  isDisabled?: AriaNumberFieldProps['isDisabled']
  isReadOnly?: AriaNumberFieldProps['isReadOnly']
  isRequired?: AriaNumberFieldProps['isRequired']
  isInvalid?: AriaNumberFieldProps['isInvalid']
  /** The value is a number, or `null` for empty. Not a string. */
  value?: AriaNumberFieldProps['value']
  defaultValue?: AriaNumberFieldProps['defaultValue']
  onChange?: AriaNumberFieldProps['onChange']
  /** What one press of a stepper, or one press of an arrow key, is worth. */
  step?: AriaNumberFieldProps['step']
  minValue?: AriaNumberFieldProps['minValue']
  maxValue?: AriaNumberFieldProps['maxValue']
  /** How the value is formatted when the field is not being edited — a currency, a percentage. */
  formatOptions?: AriaNumberFieldProps['formatOptions']
  /**
   * Stops a scroll over the field from changing it. Worth turning on inside anything scrollable,
   * where a wheel meant for the page silently edits a number on the way past.
   */
  isWheelDisabled?: AriaNumberFieldProps['isWheelDisabled']
  className?: string
  /** `NumberField.Label`, `NumberField.Group`, then the hint and error. */
  children?: React.ReactNode
}

export interface NumberFieldLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

/**
 * The room the counter takes. A rule `NumberField` owns rather than one in `field.ts`, because a
 * counter is this component's affix and a text field has no use for it. 36px against the counter's
 * 32, so the value never touches the divider.
 */
const COUNTER_GUTTER = 'has-[[data-slot=counter]]:[&>[data-slot=input]]:pe-9'

export interface NumberFieldGroupProps extends Omit<
  AriaGroupProps,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface NumberFieldInputProps extends Omit<
  AriaInputProps,
  'children' | 'className' | 'value' | 'defaultValue' | 'onChange'
> {
  className?: string
}

export interface NumberFieldCounterProps {
  className?: string
  /** Replaces the pair of arrows. Rarely wanted, and it is two children, not one. */
  children?: React.ReactNode
}

export interface NumberFieldHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface NumberFieldFieldErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

/**
 * The legend. Use it as `NumberField.Label`. The required marker comes from the field's own
 * `data-required`, so it cannot drift out of sync with `isRequired`.
 *
 * Exported as `NumberFieldLabel` only so tooling can resolve it; consume the compound form
 * `NumberField.Label`.
 */
export function NumberFieldLabel({
  className,
  children,
  ...props
}: NumberFieldLabelProps) {
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
 * Wraps the input and its steppers. Use it as `NumberField.Group`.
 *
 * Exported as `NumberFieldGroup` only so tooling can resolve it; consume the compound form
 * `NumberField.Group`.
 */
export function NumberFieldGroup({
  className,
  children,
  ...props
}: NumberFieldGroupProps) {
  return (
    <AriaGroup
      className={[GROUP, COUNTER_GUTTER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The number. Use it as `NumberField.Input`. It is a text input underneath, so it can be typed
 * into, selected and undone like one — React Aria does the parsing and the formatting around it.
 *
 * Exported as `NumberFieldInput` only so tooling can resolve it; consume the compound form
 * `NumberField.Input`.
 */
export function NumberFieldInput({
  className,
  ...props
}: NumberFieldInputProps) {
  return (
    <AriaInput
      data-slot="input"
      className={[NUMBER_INPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The steppers. Use it as `NumberField.Counter`: one slot rather than two, because they are one
 * control — two halves of a single column, which is how a spinner is read. Splitting them into
 * `.Increment` and `.Decrement` invited a consumer to lay them out side by side, which is a
 * different and worse thing.
 *
 * `slot="increment"` and `slot="decrement"` are written here rather than left to the consumer, for
 * the same reason `Table.Selection` writes `slot="selection"`: the one attribute that makes it work
 * is the one nobody remembers, and getting it wrong still renders.
 *
 * Exported as `NumberFieldCounter` only so tooling can resolve it; consume the compound form
 * `NumberField.Counter`.
 */
export function NumberFieldCounter({
  className,
  children,
}: NumberFieldCounterProps) {
  return (
    <div
      data-slot="counter"
      className={[COUNTER, className].filter(Boolean).join(' ')}
    >
      {children ?? (
        <>
          {/* Up on top, the way every other spinner on the platform does it. */}
          <AriaButton
            slot="increment"
            className={`${STEPPER} ${STEPPER_DIVIDE}`}
          >
            <Stepper points="up" />
          </AriaButton>
          <AriaButton slot="decrement" className={STEPPER}>
            <Stepper points="down" />
          </AriaButton>
        </>
      )}
    </div>
  )
}

/**
 * The guidance under the control. Use it as `NumberField.Hint`.
 *
 * Exported as `NumberFieldHint` only so tooling can resolve it; consume the compound form
 * `NumberField.Hint`.
 */
export function NumberFieldHint({
  className,
  children,
  ...props
}: NumberFieldHintProps) {
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
 * The message shown when the field is `isInvalid`. Use it as `NumberField.Error`.
 *
 * Exported as `NumberFieldFieldError` only so tooling can resolve it; consume the compound form
 * `NumberField.Error`.
 */
export function NumberFieldFieldError({
  className,
  children,
  ...props
}: NumberFieldFieldErrorProps) {
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
 * Styled element. Not exported — `NumberField` below is the public symbol, and docgen reads the
 * JSDoc from the *exported* declaration, not this one.
 */
function NumberFieldRoot({
  ref,
  size = 'md',
  className,
  children,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      ref={ref}
      className={[FIELD, FIELD_SIZES[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaNumberField>
  )
}

/**
 * A number — typed, stepped, or scrolled. The sheet has no number field in it, only a number's
 * *typography*, so the field is the shared anatomy and the sheet supplies the type: its numbers are
 * letterspaced and tabular, which is what makes a column of figures line up.
 *
 * ```tsx
 * <NumberField defaultValue={60} minValue={5} maxValue={600}>
 *   <NumberField.Label>Interval</NumberField.Label>
 *   <NumberField.Group>
 *     <NumberField.Input />
 *     <NumberField.Counter />
 *   </NumberField.Group>
 *   <NumberField.Hint>Seconds between checks.</NumberField.Hint>
 * </NumberField>
 * ```
 *
 * **The value is a number, not a string.** `onChange` gives a number or `null` — `null` for empty,
 * which is a real state a field has to be able to hold rather than a zero it did not mean.
 *
 * Two things React Aria does that make this worth not hand-rolling: the field stays a **text input**
 * underneath, so it can be typed, selected and undone like one while the parsing and formatting
 * happen around it; and `formatOptions` is what turns that into a currency or a percentage, so the
 * same field is a money field when it needs to be.
 *
 * `isWheelDisabled` is worth turning on inside anything scrollable — a wheel meant for the page
 * silently editing a number as it goes past is a small trap with no undo.
 */
export const NumberField = Object.assign(NumberFieldRoot, {
  Label: NumberFieldLabel,
  Group: NumberFieldGroup,
  Input: NumberFieldInput,
  Counter: NumberFieldCounter,
  Hint: NumberFieldHint,
  Error: NumberFieldFieldError,
})
