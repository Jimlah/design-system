import {
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  TextField as AriaTextField,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  InputProps as AriaInputProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
  TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'

import {
  ERROR,
  FIELD,
  FIELD_SIZES,
  GROUP,
  HINT,
  ICON,
  ICON_POSITIONS,
  INPUT,
  LABEL,
} from '../field'
import type { FieldSize, IconPosition } from '../field'

export interface TextFieldProps extends Omit<
  AriaTextFieldProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'children'
  | 'className'
  | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Height and type size of the control, inherited by anything inside it. */
  size?: FieldSize
  /** Disables the whole field. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaTextFieldProps['isDisabled']
  /** Makes the value readable but not editable. Styles like disabled. */
  isReadOnly?: AriaTextFieldProps['isReadOnly']
  isRequired?: AriaTextFieldProps['isRequired']
  /** Puts the field in its error state and reveals `TextField.Error`. */
  isInvalid?: AriaTextFieldProps['isInvalid']
  /**
   * The field owns its value, so these live here and not on `TextField.Input`.
   * React Aria's `onChange` takes the value directly, not an event.
   */
  value?: AriaTextFieldProps['value']
  defaultValue?: AriaTextFieldProps['defaultValue']
  onChange?: AriaTextFieldProps['onChange']
  className?: string
  children?: React.ReactNode
}

export interface TextFieldLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

/**
 * `value`, `defaultValue` and `onChange` are omitted on purpose: React Aria's
 * field is the single source of truth for the value, so accepting them here
 * would silently do nothing. They belong on `TextField`.
 */
export interface TextFieldInputProps extends Omit<
  AriaInputProps,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'children'
> {
  className?: string
}

export interface TextFieldGroupProps extends AriaGroupProps {
  children?: React.ReactNode
}

export interface TextFieldHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface TextFieldErrorProps extends AriaFieldErrorProps {
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

export interface TextFieldIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Which edge to pin the affix to. A prop rather than document order, unlike
   * `Button.Icon`: this is absolutely positioned, so markup order cannot decide.
   */
  position?: IconPosition
  children?: React.ReactNode
}

/**
 * Layout slot for a `TextField` label. Use it as `TextField.Label`.
 *
 * Exported as `TextFieldLabel` only so tooling can resolve it; consume the
 * compound form `TextField.Label`.
 */
export function TextFieldLabel({
  className,
  children,
  ...props
}: TextFieldLabelProps) {
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
 * Wraps the control when it needs an affix. Use it as `TextField.Group`. React
 * Aria's `Group` also carries the field's state — `data-invalid`, `data-disabled`,
 * `data-readonly`, `data-focus-within` — so it is a styling hook as well as a
 * positioning one.
 *
 * Exported as `TextFieldGroup` only so tooling can resolve it; consume the
 * compound form `TextField.Group`.
 */
export function TextFieldGroup({
  className,
  children,
  ...props
}: TextFieldGroupProps) {
  return (
    <AriaGroup
      data-slot="control"
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The text control. Use it as `TextField.Input`. Inherits its height and type
 * size from `TextField`. Wrap it in `TextField.Group` when it needs an affix.
 *
 * Exported as `TextFieldInput` only so tooling can resolve it; consume the
 * compound form `TextField.Input`.
 */
export function TextFieldInput({ className, ...props }: TextFieldInputProps) {
  return (
    <AriaInput
      data-slot="input"
      className={[INPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * An icon pinned inside the control, for a leading status glyph or a trailing
 * marker. Use it as `TextField.Icon`, and place it inside `TextField.Group`
 * beside `TextField.Input` — the group is the box it is positioned against.
 *
 * Exported as `TextFieldIcon` only so tooling can resolve it; consume the
 * compound form `TextField.Icon`.
 */
export function TextFieldIcon({
  position = 'start',
  className,
  children,
  ...props
}: TextFieldIconProps) {
  return (
    <span
      data-slot={position === 'start' ? 'icon-start' : 'icon-end'}
      aria-hidden="true"
      className={[ICON, ICON_POSITIONS[position], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * The guidance under the control. Use it as `TextField.Hint`. React Aria wires it
 * to the input's `aria-describedby`, so it is read out with the field rather than
 * announced on its own.
 *
 * Exported as `TextFieldHint` only so tooling can resolve it; consume the
 * compound form `TextField.Hint`.
 */
export function TextFieldHint({
  className,
  children,
  ...props
}: TextFieldHintProps) {
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
 * The message shown when the field is `isInvalid`. Use it as `TextField.Error`.
 * React Aria renders nothing while the field is valid, so it is always safe to
 * include.
 *
 * Exported as `TextFieldError` only so tooling can resolve it; consume the
 * compound form `TextField.Error`.
 */
export function TextFieldError({ className, ...props }: TextFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Styled element. Not exported — `TextField` below is the public symbol, and
 * docgen reads the JSDoc from the *exported* declaration, not this one.
 */
function TextFieldRoot({
  ref,
  size = 'md',
  className,
  children,
  isDisabled,
  isReadOnly,
  isRequired,
  isInvalid,
  ...rest
}: TextFieldProps) {
  return (
    <AriaTextField
      ref={ref}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isInvalid={isInvalid}
      className={[FIELD, FIELD_SIZES[size], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </AriaTextField>
  )
}

/**
 * A labelled text control with a hint and an error message — the sheet's
 * `.ds-field` and `.ds-input`.
 *
 * ```tsx
 * <TextField defaultValue="" isRequired isInvalid={taken}>
 *   <TextField.Label>Monitor name</TextField.Label>
 *   <TextField.Input placeholder="example.com" />
 *   <TextField.Hint>Lowercase alphanumeric and dashes only</TextField.Hint>
 *   <TextField.Error>That hostname is taken</TextField.Error>
 * </TextField>
 * ```
 *
 * A `TextField` is a `label`, an `Input`, and optionally a `Hint` and an `Error`.
 * The hint and error are announced with the field rather than on their own, and
 * the error is only rendered while the field is invalid.
 *
 * Give the control an icon by wrapping it, so the affix has the control's box to
 * sit in rather than the whole field's:
 *
 * ```tsx
 * <TextField.Label>Find a monitor</TextField.Label>
 * <TextField.Group>
 *   <TextField.Input placeholder="Search" />
 *   <TextField.Icon position="start">{magnifier}</TextField.Icon>
 * </TextField.Group>
 * ```
 *
 * The field owns the value: put `value`/`defaultValue`/`onChange` here, not on
 * `TextField.Input`. For a search control, prefer `SearchField`, which carries
 * the right role and ships the magnifier.
 */
export const TextField = Object.assign(TextFieldRoot, {
  Label: TextFieldLabel,
  Group: TextFieldGroup,
  Input: TextFieldInput,
  Icon: TextFieldIcon,
  Hint: TextFieldHint,
  Error: TextFieldError,
})
