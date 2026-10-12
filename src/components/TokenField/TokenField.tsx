import {
  Label as AriaLabel,
  Text as AriaText,
  Token as AriaToken,
  TokenField as AriaTokenField,
  TokenInput as AriaTokenInput,
} from 'react-aria-components'
import type {
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
  TokenFieldProps as AriaTokenFieldProps,
  TokenInputProps as AriaTokenInputProps,
  TokenProps as AriaTokenProps,
} from 'react-aria-components'

import type { ReactNode } from 'react'

import { CHIP } from '../TagGroup/TagGroup'
import { FIELD, HINT, INPUT, LABEL } from '../field'

/**
 * The chip a token wears: the tag's box with none of the tag's behaviour.
 *
 * Composed from `CHIP` rather than from `TAG_CHIP`, because a token is not pressable, not focusable
 * and not hoverable — it is a piece of the *value* with a box round it. Writing it as `TAG_CHIP` plus a
 * `cursor-text` override would be two plain utilities at the same specificity, which ties and is
 * decided by Tailwind's source order rather than by intent.
 */
export const TOKEN_CHIP = [
  CHIP,
  'cursor-text select-none',
  'border-input bg-muted text-foreground',
].join(' ')

export interface TokenFieldProps extends Omit<
  AriaTokenFieldProps,
  'children' | 'className' | 'value' | 'defaultValue' | 'onChange'
> {
  /** The value. Controlled, so pass `onChange` with it. */
  value?: AriaTokenFieldProps['value']
  /** What it starts with, as a `TokenFieldValue`. Uncontrolled. */
  defaultValue?: AriaTokenFieldProps['defaultValue']
  /** Called with the whole `TokenFieldValue`, whose `segments` are the text and the tokens in order. */
  onChange?: AriaTokenFieldProps['onChange']
  className?: string
  children?: ReactNode
}

export interface TokenFieldLabelProps extends Omit<
  AriaLabelProps,
  'className'
> {
  className?: string
}

export interface TokenFieldInputProps extends Omit<
  AriaTokenInputProps,
  'children' | 'className'
> {
  className?: string
  /**
   * Overrides how a **token** is drawn. It is called once per token segment and never for text —
   * React Aria renders a text segment as the bare string it is, which is what makes the result one
   * editable sentence rather than a row of boxes. So the sentence's own type and colour belong on
   * `TokenField.Input`, not on a slot.
   */
  children?: AriaTokenInputProps['children']
}

export interface TokenFieldTokenProps extends Omit<
  AriaTokenProps,
  'className'
> {
  className?: string
}

export interface TokenFieldHintProps extends Omit<AriaTextProps, 'className'> {
  className?: string
}

/** The field's name. Use it as `TokenField.Label`. */
export function TokenFieldLabel({ className, ...props }: TokenFieldLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/** One token. Use it as `TokenField.Token` — only inside `TokenField.Input`, which is what tells it which segment it is. */
export function TokenFieldToken({ className, ...props }: TokenFieldTokenProps) {
  return (
    <AriaToken
      data-slot="token"
      className={[TOKEN_CHIP, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The typing surface, and the place the tokens are drawn. Use it as `TokenField.Input`.
 *
 * **It is a `role="textbox"` container, not an `<input>`.** There is no `placeholder` — a text field's
 * placeholder belongs to its input element, and this element has none to put it on. What stands in for
 * it is the *first text segment*: React Aria keeps one at the end of the value, so passing
 * `new TokenFieldValue(['#ops on call'])` and styling that leading text faintly is how this component
 * shows its invitation.
 */
export function TokenFieldInput({
  className,
  children,
  ...props
}: TokenFieldInputProps) {
  return (
    <AriaTokenInput
      data-slot="token-input"
      className={[INPUT, 'flex flex-wrap items-center gap-1.5 py-2', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ??
        ((segment) => (
          <AriaToken
            key={`t-${String(segment.value)}-${segment.text}`}
            data-slot="token"
            className={TOKEN_CHIP}
          >
            {segment.text}
          </AriaToken>
        ))}
    </AriaTokenInput>
  )
}

/** A line under the field. Use it as `TokenField.Hint`. */
export function TokenFieldHint({ className, ...props }: TokenFieldHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

function TokenFieldRoot({ className, children, ...props }: TokenFieldProps) {
  return (
    <AriaTokenField
      className={[FIELD, 'w-full', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTokenField>
  )
}

/**
 * Text with tokens inside it — a notification target, an alert's audience.
 *
 * ```tsx
 * <TokenField defaultValue={new TokenFieldValue([{ type: 'token', text: '#ops', value: 'ops' }, ' and '])}>
 *   <TokenField.Label>Notify</TokenField.Label>
 *   <TokenField.Input />
 *   <TokenField.Hint>Backspace removes the token before the caret.</TokenField.Hint>
 * </TokenField>
 * ```
 *
 * **A token is part of the value, not a chip beside it.** That is the distinction from `TagGroup`,
 * which is a set of chips you edit as a set; here the tokens are words inside a sentence the user is
 * writing, in order, and React Aria puts the caret between them. `TagGroup` answers "which labels
 * apply"; this answers "who hears about it, and what do you want to say".
 *
 * **React Aria owns the keyboard, and that is most of the component.** Backspace at a token's edge
 * removes it; arrow keys step through tokens as single characters; typing filters the tokens that
 * remain. None of that is implemented here.
 *
 * **There is no `placeholder`.** A text field's placeholder belongs to its input element, and this
 * container has none — see `TokenField.Input` for what stands in for it.
 *
 * **There is no invalid state either**, and so no `TokenField.Error`. React Aria 1.22's token field
 * takes `isDisabled`, `isReadOnly` and `allowsNewlines` and no validation props at all; an error slot
 * here would render and never be wired to anything, which is worse than not having one.
 */
export const TokenField = Object.assign(TokenFieldRoot, {
  Label: TokenFieldLabel,
  Input: TokenFieldInput,
  Token: TokenFieldToken,
  Hint: TokenFieldHint,
})
