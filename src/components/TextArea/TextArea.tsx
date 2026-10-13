import {
  FieldError as AriaFieldError,
  Label as AriaLabel,
  Text as AriaText,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
  TextAreaProps as AriaTextAreaProps,
  TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'

import { ERROR, FIELD, FIELD_SIZES, HINT, LABEL } from '../field'

/**
 * The sheet's `.ds-textarea`. It is the field anatomy with a different control in it — the same
 * legend, the same hairline, the same hint and error column as `TextField`, because a textarea is a
 * text field that happens to take more than one line.
 *
 * The differences from `INPUT` are all the sheet's own: `min-height: 92px` rather than a fixed
 * control height, `12px 14px` of padding rather than a centred single line, `line-height: 1.5` so
 * several lines are readable, and `resize: vertical` — never horizontal, which would let a user drag
 * a control out of its own column.
 */
const AREA = [
  // The control step of the radius scale, written again here: the textarea draws its own box rather
  // than composing the shared `INPUT`.
  'w-full font-mono rounded-md border border-(--field-border)',
  // No font-size here. The field root already sets it from `--field-control-text` — the sheet's
  // 14px — and a rule written on the control *lost* to whatever the environment puts on a
  // `textarea`, so the control inherits instead. The same reason the line-height is declared on the
  // root: it is inherited, and the sheet's `1.5 × 14px` is 21px, not the 24px a 16px base gives.
  'min-h-[92px] px-3.5 py-3',
  'bg-muted text-foreground placeholder:text-foreground/35',
  // **The box grows with what is typed.** `field-sizing: content` sizes it to its content, so
  // there is no mirror element and no grow script; `max-h-[12lh]` is the ceiling (twelve lines,
  // after which it scrolls rather than pushing the page down); and `resize-none` takes away a
  // drag handle with nothing left to do. The `min-h` above is the floor, not the height.
  // Chrome 123, Safari 26.2, Firefox 152 — and a browser without it shows the same fixed box it
  // did before, with a scrollbar.
  'field-sizing-content max-h-[12lh] resize-none',
  'transition-[border-color,background-color] duration-(--duration-fast) ease-pulse',
  // Focus and invalid stay literal on the control, exactly as they do on a field, so they outrank
  // the border the root publishes and always win — including on a read-only textarea, which is
  // still focusable and still worth being able to read.
  'data-[hovered]:not-data-[focused]:border-(--field-hover)',
  'data-[focused]:outline-none data-[focused]:border-primary',
  'data-[invalid]:not-data-[focused]:border-destructive',
  // Native validity, which arrives the moment the user leaves the field — no "touched" class and
  // no blur listener, and it fires before any submit. `field.ts`'s `INPUT` carries the same line.
  'user-invalid:not-data-[focused]:border-destructive',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  'group-data-[readonly]:cursor-not-allowed',
].join(' ')

export interface TextAreaProps extends Omit<
  AriaTextFieldProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'children'
  | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  isDisabled?: AriaTextFieldProps['isDisabled']
  isReadOnly?: AriaTextFieldProps['isReadOnly']
  isRequired?: AriaTextFieldProps['isRequired']
  isInvalid?: AriaTextFieldProps['isInvalid']
  /** The value is a string, like any other field's. */
  value?: AriaTextFieldProps['value']
  defaultValue?: AriaTextFieldProps['defaultValue']
  onChange?: AriaTextFieldProps['onChange']
  /** `className` places the field; the control's own styling stays internal. */
  className?: string
  /** `TextArea.Label`, `TextArea.Input`, then the hint and error. */
  children?: React.ReactNode
}

export interface TextAreaLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface TextAreaInputProps extends Omit<
  AriaTextAreaProps,
  'children' | 'className' | 'value' | 'defaultValue' | 'onChange'
> {
  className?: string
}

export interface TextAreaHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface TextAreaFieldErrorProps extends AriaFieldErrorProps {
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

/**
 * The legend. Use it as `TextArea.Label`. The required marker comes from the field's own
 * `data-required`, so it cannot drift out of sync with `isRequired`.
 *
 * Exported as `TextAreaLabel` only so tooling can resolve it; consume the compound form
 * `TextArea.Label`.
 */
export function TextAreaLabel({
  className,
  children,
  ...props
}: TextAreaLabelProps) {
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
 * The control. Use it as `TextArea.Input`. `rows` is the native attribute and the honest way to ask
 * for height; the sheet's `min-height: 92px` is the floor beneath it.
 *
 * Exported as `TextAreaInput` only so tooling can resolve it; consume the compound form
 * `TextArea.Input`.
 */
export function TextAreaInput({ className, ...props }: TextAreaInputProps) {
  return (
    <AriaTextArea
      data-slot="input"
      className={[AREA, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The guidance under the control. Use it as `TextArea.Hint`.
 *
 * Exported as `TextAreaHint` only so tooling can resolve it; consume the compound form
 * `TextArea.Hint`.
 */
export function TextAreaHint({
  className,
  children,
  ...props
}: TextAreaHintProps) {
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
 * The message shown when the field is `isInvalid`. Use it as `TextArea.Error`.
 *
 * Exported as `TextAreaFieldError` only so tooling can resolve it; consume the compound form
 * `TextArea.Error`.
 */
export function TextAreaFieldError({
  className,
  ...props
}: TextAreaFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Styled element. Not exported — `TextArea` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function TextAreaRoot({ className, children, ...props }: TextAreaProps) {
  return (
    <AriaTextField
      // The sheet gives a textarea one size, so `md` is not a choice being made — it is the size the
      // field's own tokens have to be told, because they are what the control inherits its type
      // from. Leaving them unset makes `font-size: var(--field-control-text)` an invalid
      // declaration: it is dropped, and the control quietly inherits 16px from the page.
      className={[FIELD, FIELD_SIZES.md, '[line-height:1.5]', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaTextField>
  )
}

/**
 * The sheet's `.ds-textarea`: the field anatomy with a control that takes more than one line.
 *
 * ```tsx
 * <TextArea defaultValue="" isRequired>
 *   <TextArea.Label>Notes</TextArea.Label>
 *   <TextArea.Input rows={4} placeholder="What changed?" />
 *   <TextArea.Hint>Markdown is fine.</TextArea.Hint>
 *   <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
 * </TextArea>
 * ```
 *
 * The root is React Aria's `TextField`, because that is what owns the value, the label and the
 * validity — the textarea element is only the control inside it, exactly as `Input` is inside a
 * `TextField`. That is why this shares `field.ts` with `TextField` and `SearchField` rather than
 * growing its own anatomy: a legend, a hairline and a hint column do not care how many lines the
 * answer runs to.
 *
 * **There is no `size`.** A field's `size` sets a fixed control height, and a textarea's height is
 * its `rows` — a three-line box and a five-line box are not two sizes of the same thing. The one
 * thing the sheet varies, `.ds-textarea--compact`, is a `min-height`, and `rows` says the same
 * thing without inventing a second vocabulary for it.
 *
 * Its value is a string like any other field's, and every state behaves as it does on a field:
 * disabled dims without recolouring, read-only keeps full-strength text and signals itself through
 * the hairline, and focus turns the border teal and nothing else.
 */
export const TextArea = Object.assign(TextAreaRoot, {
  Label: TextAreaLabel,
  Input: TextAreaInput,
  Hint: TextAreaHint,
  Error: TextAreaFieldError,
})
