import {
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  SearchField as AriaSearchField,
  Text as AriaText,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  InputProps as AriaInputProps,
  LabelProps as AriaLabelProps,
  SearchFieldProps as AriaSearchFieldProps,
  TextProps as AriaTextProps,
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

/**
 * The sheet's own magnifier, traced from `.ds-affix--search` in `components.html`
 * — same `viewBox`, same radii, same 1.5 stroke. It carries no width or height so
 * `SearchField.Icon` can size it in `cap` and have it track the field's `size`.
 */
const Magnifier = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.8" cy="6.8" r="5.1" stroke="currentColor" strokeWidth="1.5" />
    <line
      x1="10.7"
      y1="10.7"
      x2="14.6"
      y2="14.6"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

export interface SearchFieldProps extends Omit<
  AriaSearchFieldProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onClear'
  | 'onSubmit'
  | 'children'
  | 'className'
  | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Height and type size of the control, inherited by anything inside it. */
  size?: FieldSize
  /** Disables the whole field. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaSearchFieldProps['isDisabled']
  /** Makes the value readable but not editable. Styles like disabled. */
  isReadOnly?: AriaSearchFieldProps['isReadOnly']
  isRequired?: AriaSearchFieldProps['isRequired']
  /** Puts the field in its error state and reveals `SearchField.Error`. */
  isInvalid?: AriaSearchFieldProps['isInvalid']
  /**
   * The field owns its value, so these live here and not on `SearchField.Input`.
   * React Aria's `onChange` takes the string directly, not an event.
   */
  value?: AriaSearchFieldProps['value']
  defaultValue?: AriaSearchFieldProps['defaultValue']
  onChange?: AriaSearchFieldProps['onChange']
  /** Fires on Enter, and when the clear affordance is used. */
  onSubmit?: AriaSearchFieldProps['onSubmit']
  onClear?: AriaSearchFieldProps['onClear']
  className?: string
  children?: React.ReactNode
}

export interface SearchFieldLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

/**
 * `value`, `defaultValue`, `onChange` and `onSubmit` are omitted on purpose:
 * React Aria's field is the single source of truth for the value, so accepting
 * them here would silently do nothing. They belong on `SearchField`.
 */
export interface SearchFieldInputProps extends Omit<
  AriaInputProps,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'children'
> {
  className?: string
}

export interface SearchFieldGroupProps extends AriaGroupProps {
  children?: React.ReactNode
}

export interface SearchFieldHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface SearchFieldErrorProps extends AriaFieldErrorProps {
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

export interface SearchFieldIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Which edge to pin the magnifier to. `start` matches the sheet; a prop rather
   * than document order, unlike `Button.Icon`, because this is absolutely
   * positioned and markup order cannot decide.
   */
  position?: IconPosition
  /** Defaults to the sheet's magnifier; pass a glyph to replace it. */
  children?: React.ReactNode
}

/**
 * Layout slot for a `SearchField` label. Use it as `SearchField.Label`.
 *
 * Exported as `SearchFieldLabel` only so tooling can resolve it; consume the
 * compound form `SearchField.Label`.
 */
export function SearchFieldLabel({
  className,
  children,
  ...props
}: SearchFieldLabelProps) {
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
 * Wraps the control so the magnifier has a box to sit in. Use it as
 * `SearchField.Group`, and put `SearchField.Icon` inside it beside
 * `SearchField.Input`.
 *
 * Exported as `SearchFieldGroup` only so tooling can resolve it; consume the
 * compound form `SearchField.Group`.
 */
export function SearchFieldGroup({
  className,
  children,
  ...props
}: SearchFieldGroupProps) {
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
 * The search control. Use it as `SearchField.Input`. Inherits its height and type
 * size from `SearchField`.
 *
 * Exported as `SearchFieldInput` only so tooling can resolve it; consume the
 * compound form `SearchField.Input`.
 */
export function SearchFieldInput({
  className,
  ...props
}: SearchFieldInputProps) {
  return (
    <AriaInput
      data-slot="input"
      className={[INPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The magnifier, pinned inside the control. Use it as `SearchField.Icon`. It
 * defaults to the glyph the sheet draws, so the common case needs no markup:
 * `<SearchField.Icon />`.
 *
 * Exported as `SearchFieldIcon` only so tooling can resolve it; consume the
 * compound form `SearchField.Icon`.
 */
export function SearchFieldIcon({
  position = 'start',
  className,
  children,
  ...props
}: SearchFieldIconProps) {
  return (
    <span
      data-slot={position === 'start' ? 'icon-start' : 'icon-end'}
      aria-hidden="true"
      className={[ICON, ICON_POSITIONS[position], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ?? Magnifier}
    </span>
  )
}

/**
 * The guidance under the control — the sheet uses it for the live result count.
 * Use it as `SearchField.Hint`. React Aria wires it to the input's
 * `aria-describedby`, so it is read out with the field rather than announced on
 * its own.
 *
 * Exported as `SearchFieldHint` only so tooling can resolve it; consume the
 * compound form `SearchField.Hint`.
 */
export function SearchFieldHint({
  className,
  children,
  ...props
}: SearchFieldHintProps) {
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
 * The message shown when the field is `isInvalid`. Use it as `SearchField.Error`.
 * React Aria renders nothing while the field is valid, so it is always safe to
 * include.
 *
 * Exported as `SearchFieldError` only so tooling can resolve it; consume the
 * compound form `SearchField.Error`.
 */
export function SearchFieldError({
  className,
  ...props
}: SearchFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Styled element. Not exported — `SearchField` below is the public symbol, and
 * docgen reads the JSDoc from the *exported* declaration, not this one.
 */
function SearchFieldRoot({
  ref,
  size = 'md',
  className,
  children,
  isDisabled,
  isReadOnly,
  isRequired,
  isInvalid,
  ...rest
}: SearchFieldProps) {
  return (
    <AriaSearchField
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
    </AriaSearchField>
  )
}

/**
 * A search control — the sheet's `.ds-affix--search`. Same field anatomy as
 * `TextField`, but on React Aria's `SearchField`, so the input has the searchbox
 * role, submits on Enter, and reports whether it is empty.
 *
 * ```tsx
 * <SearchField onSubmit={(term) => filter(term)}>
 *   <SearchField.Label>Search monitors</SearchField.Label>
 *   <SearchField.Group>
 *     <SearchField.Icon />
 *     <SearchField.Input placeholder="Filter by name or URL…" />
 *   </SearchField.Group>
 *   <SearchField.Hint>12 of 24 monitors match</SearchField.Hint>
 *   <SearchField.Error>Enter at least two characters.</SearchField.Error>
 * </SearchField>
 * ```
 *
 * `SearchField.Icon` draws the sheet's magnifier by default, so the usual case is
 * an empty tag. Reach for `TextField` instead when the field is not a search.
 */
export const SearchField = Object.assign(SearchFieldRoot, {
  Label: SearchFieldLabel,
  Group: SearchFieldGroup,
  Input: SearchFieldInput,
  Icon: SearchFieldIcon,
  Hint: SearchFieldHint,
  Error: SearchFieldError,
})
