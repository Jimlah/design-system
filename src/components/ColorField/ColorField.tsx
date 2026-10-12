import {
  ColorField as AriaColorField,
  ColorFieldStateContext,
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ColorFieldProps as AriaColorFieldProps,
  FieldErrorProps as AriaFieldErrorProps,
  InputProps as AriaInputProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { useContext } from 'react'
import type { ReactNode } from 'react'

import { ERROR, FIELD, GROUP, HINT, INPUT, LABEL } from '../field'

export interface ColorFieldProps extends Omit<
  AriaColorFieldProps,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isInvalid'
  | 'isRequired'
  | 'isReadOnly'
  | 'channel'
> {
  /** The colour as a `Color` — or a string it can parse. Controlled. */
  value?: AriaColorFieldProps['value']
  /** The colour it starts at, for uncontrolled use. */
  defaultValue?: AriaColorFieldProps['defaultValue']
  /** Called with the parsed colour, or `null` when the text is not one. */
  onChange?: AriaColorFieldProps['onChange']
  /** Disables the field. */
  isDisabled?: AriaColorFieldProps['isDisabled']
  /** Marks the field invalid from the outside, for a server's answer. */
  isInvalid?: AriaColorFieldProps['isInvalid']
  /** Marks it required and draws the label's marker. */
  isRequired?: AriaColorFieldProps['isRequired']
  /** Keeps the value readable and selectable but uneditable — and does not dim it. */
  isReadOnly?: AriaColorFieldProps['isReadOnly']
  /** Edits one channel rather than the whole hex value. */
  channel?: AriaColorFieldProps['channel']

  className?: string
  children?: ReactNode
}

export interface ColorFieldLabelProps extends Omit<
  AriaLabelProps,
  'className'
> {
  className?: string
}

export interface ColorFieldControlProps {
  className?: string
  children?: ReactNode
}

export interface ColorFieldSwatchProps {
  className?: string
}

export interface ColorFieldInputProps extends Omit<
  AriaInputProps,
  'className'
> {
  className?: string
}

export interface ColorFieldHintProps extends Omit<AriaTextProps, 'className'> {
  className?: string
}

export interface ColorFieldErrorProps extends Omit<
  AriaFieldErrorProps,
  'className'
> {
  className?: string
}

/**
 * The legend. Use it as `ColorField.Label`.
 *
 * Exported as `ColorFieldLabel` only so tooling can resolve it; consume the compound form
 * `ColorField.Label`.
 */
export function ColorFieldLabel({ className, ...props }: ColorFieldLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The row the swatch and the input share. Use it as `ColorField.Control`.
 *
 * **`ColorField`'s children are the whole column**, not a row — its own element is the field, exactly as
 * `TextField`'s is, and the legend, the control and the hint are its direct children. The swatch and the
 * input *are* a row, so they need one element between them and the column. Without it the hint renders
 * beside the input.
 *
 * Exported as `ColorFieldControl` only so tooling can resolve it; consume the compound form
 * `ColorField.Control`.
 */
export function ColorFieldControl({
  className,
  children,
}: ColorFieldControlProps) {
  return (
    <div
      data-slot="color-control"
      className={[GROUP, 'items-center gap-2', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

/**
 * The colour the field currently holds, as a square. Use it as `ColorField.Swatch`.
 *
 * **It reads the field's own state** rather than being handed a colour, so it cannot drift from the
 * value in the input — the arrangement `Meter.Fill` and `Nav.Label` use. The state property is
 * **`colorValue`**, not `value`; there is no `value` on a `ColorFieldState`.
 *
 * An empty field paints **nothing**: a black square would claim there was a value, and there is not —
 * the same distinction a progress bar draws between "unknown" and "zero".
 *
 * Exported as `ColorFieldSwatch` only so tooling can resolve it; consume the compound form
 * `ColorField.Swatch`.
 */
export function ColorFieldSwatch({ className }: ColorFieldSwatchProps) {
  const state = useContext(ColorFieldStateContext)
  const color = state?.colorValue?.toString('hex')

  return (
    <span
      data-slot="swatch"
      aria-hidden="true"
      className={['size-6 shrink-0 border border-line-control', className]
        .filter(Boolean)
        .join(' ')}
      style={color ? { background: color } : undefined}
    />
  )
}

/**
 * The control. Use it as `ColorField.Input`.
 *
 * It keeps the shared `INPUT` — the same height, type and hairline — because a colour field is a text
 * field that happens to parse what you type as a colour: the hex digits are real segments you can step
 * and select, exactly as a date field's are.
 *
 * Exported as `ColorFieldInput` only so tooling can resolve it; consume the compound form
 * `ColorField.Input`.
 */
export function ColorFieldInput({ className, ...props }: ColorFieldInputProps) {
  return (
    <AriaInput
      data-slot="input"
      className={[INPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The guidance under the control. Use it as `ColorField.Hint`.
 *
 * Exported as `ColorFieldHint` only so tooling can resolve it; consume the compound form
 * `ColorField.Hint`.
 */
export function ColorFieldHint({ className, ...props }: ColorFieldHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The error, which renders nothing while the field is valid. Use it as `ColorField.Error`.
 *
 * Exported as `ColorFieldError` only so tooling can resolve it; consume the compound form
 * `ColorField.Error`.
 */
export function ColorFieldError({ className, ...props }: ColorFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A colour typed into a field, with a square showing what it is.
 *
 * ```tsx
 * <ColorField defaultValue={parseColor('#71FFF6')}>
 *   <ColorField.Label>Label colour</ColorField.Label>
 *   <ColorField.Control>
 *     <ColorField.Swatch />
 *     <ColorField.Input />
 *   </ColorField.Control>
 *   <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
 *   <ColorField.Error>That is not a colour.</ColorField.Error>
 * </ColorField>
 * ```
 *
 * **It is a text field whose value happens to be a colour**, which is why it wears `field.ts`'s whole
 * anatomy — the legend, the hairline, the hint column, the error — and inherits every rule that file
 * already establishes, including the read-only behaviour and the resting boundary. A field that looked
 * like a native `<input type="color">` swatch would be the one control here with a different shape.
 *
 * **The square is a swatch, not the control.** The control is the text: a colour is something people
 * paste, and typing one is faster than dragging a picker to the value already in hand.
 *
 * **This is not a colour picker.** `ColorArea`, `ColorWheel` and `ColorSlider` exist for that and would
 * need a spectrum this design language does not have — Pulse's palette is four semantic accents, not a
 * gradient. A field is the honest half of the colour set to build here.
 */
function ColorFieldRoot({ className, children, ...props }: ColorFieldProps) {
  return (
    <AriaColorField
      data-slot="color-field"
      className={[FIELD, 'w-fit', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaColorField>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const ColorField = Object.assign(ColorFieldRoot, {
  Label: ColorFieldLabel,
  Control: ColorFieldControl,
  Swatch: ColorFieldSwatch,
  Input: ColorFieldInput,
  Hint: ColorFieldHint,
  Error: ColorFieldError,
})
