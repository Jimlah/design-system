import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  FieldError as AriaFieldError,
  Label as AriaLabel,
  Text as AriaText,
} from 'react-aria-components'
import type {
  CheckboxGroupProps as AriaCheckboxGroupProps,
  CheckboxProps as AriaCheckboxProps,
  FieldErrorProps as AriaFieldErrorProps,
  LabelProps as AriaLabelProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { ERROR, HINT, LABEL } from '../field'

/**
 * The sheet's `.ds-check`. Note the radius: the sheet squares off its buttons and
 * inputs but gives the selection controls the 2px a checkbox is expected to have,
 * so `rounded-none` is deliberately not applied here.
 *
 * Every state is published as a custom property rather than applied to the
 * indicator directly. The indicator is a child, so a rule reaching it must go
 * through a group variant — and group variants sort at the *same* specificity as a
 * plain utility (Tailwind wraps them in `:where(...)`), leaving the outcome to
 * source order. A `group-data-[hovered]:border-foreground` therefore loses to the
 * indicator's own `border-input`, silently. Publishing a property here means
 * the ordinary cascade decides, because both rules land on this one element and
 * `[data-selected][data-hovered]` plainly outranks `[data-hovered]`.
 *
 * The names are `--selection-*` so that `Radio` can publish the same set and its
 * own indicator can read them without knowing which one it is inside.
 */
const CONTROL = [
  'group/selection inline-flex items-center gap-2.5',
  'cursor-pointer select-none',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
  // rest
  '[--selection-border:var(--color-input)]',
  '[--selection-bg:transparent]',
  '[--selection-mark:0]',
  '[--selection-mark-dash:0]',
  '[--selection-scale:0.4]',
  'motion-reduce:[--selection-scale:1]',
  '[--selection-ring:transparent]',
  // hover strengthens the border...
  'data-[hovered]:[--selection-border:var(--color-foreground)]',
  // ...selected fills it, shows the tick and scales the centre...
  'data-[selected]:[--selection-border:var(--color-primary)]',
  'data-[selected]:[--selection-bg:var(--color-primary)]',
  // Written as an exclusion rather than as a plain `data-[selected]`, because an indeterminate
  // checkbox is usually also a selected one and the two rules would tie on specificity: only one
  // of them may match.
  'data-[selected]:not-data-[indeterminate]:[--selection-mark:1]',
  'data-[selected]:[--selection-scale:1]',
  // ...and a checked control inverts on hover, the sheet's own `:hover` pair.
  'data-[selected]:data-[hovered]:[--selection-border:var(--color-foreground)]',
  'data-[selected]:data-[hovered]:[--selection-bg:var(--color-foreground)]',
  // ...and some-of-the-above fills the same way but shows a dash instead of a tick, which is the
  // whole difference between "all of it" and "some of it".
  'data-[indeterminate]:[--selection-border:var(--color-primary)]',
  'data-[indeterminate]:[--selection-bg:var(--color-primary)]',
  'data-[indeterminate]:[--selection-mark-dash:1]',
  'data-[indeterminate]:[--selection-scale:1]',
  // The ring is drawn on the indicator, because the control is a 1x1 invisible
  // input.
  'data-[focus-visible]:[--selection-ring:var(--color-primary)]',
].join(' ')

const BOX = [
  'grid size-[18px] flex-none place-items-center',
  'rounded-[2px] border border-(--selection-border) bg-(--selection-bg)',
  // A transparent outline rather than `outline-none`, so the ring fades in with
  // everything else instead of switching the outline on and off.
  'outline-1 outline-offset-[3px] outline-(--selection-ring)',
  'transition-[background-color,border-color,outline-color] duration-(--duration-fast) ease-pulse',
].join(' ')

/**
 * The tick is always in the DOM and fades in, as the sheet does — no layout shift
 * when it appears, and nothing to mount. It is sized in `rem` rather than `cap`,
 * because the box is a fixed 18px and does not scale with the type.
 */
const MARK = [
  // Both the tick and the dash sit in the box's single grid cell, so swapping one for the other
  // cannot change the box's size.
  'col-start-1 row-start-1',
  // The tick scales in as the box fills — the value the root publishes and that nothing read
  // until now, so the "scales the centre" the comment above describes never happened.
  'size-[11px] text-ink opacity-(--selection-mark) scale-(--selection-scale)',
  'transition-[opacity,scale] duration-(--duration-fast) ease-pulse',
].join(' ')

/** The dash an indeterminate checkbox shows instead of a tick. */
const DASH = [
  'col-start-1 row-start-1',
  'h-0.5 w-[9px] bg-ink opacity-(--selection-mark-dash)',
  'transition-opacity duration-(--duration-fast) ease-pulse',
].join(' ')

/** The sheet's `.ds-check-label`: 13px, foreground at 80%. */
const TEXT = 'text-[13px] text-foreground/80'

/**
 * The sheet's `<fieldset class="stack ds-field">`: legend, controls, then the
 * hint that explains them.
 *
 * `group` is here for `LABEL`'s required marker, which is drawn from the group's
 * own `data-required`. It is safe next to the controls' `group/selection`: that one
 * is named, so the two cannot be confused.
 */
const GROUP = 'group flex flex-col gap-2.5'

const Tick = (
  <svg
    viewBox="0 0 11 9"
    fill="none"
    aria-hidden="true"
    data-slot="mark"
    className={MARK}
  >
    <path
      d="M1.5 4.5L4.2 7.2L9.5 1.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export interface CheckboxProps extends Omit<
  AriaCheckboxProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'children'
  | 'className'
  | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLLabelElement>
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaCheckboxProps['isDisabled']
  /** Makes the value visible but not changeable. */
  isReadOnly?: AriaCheckboxProps['isReadOnly']
  isRequired?: AriaCheckboxProps['isRequired']
  isInvalid?: AriaCheckboxProps['isInvalid']
  /**
   * The control owns its selection, so these live here rather than on a slot.
   * Outside a `Checkbox.Group` that means `defaultSelected` + `onChange(boolean)`;
   * inside one the group owns it and this is driven by the group's array.
   */
  /**
   * Shows a dash rather than a tick, for a checkbox standing in for a set of which only some are
   * chosen — a table's select-all, usually. It fills like a checked one either way; the mark is
   * what says "some" rather than "all". React Aria renders `data-indeterminate` for it.
   */
  isIndeterminate?: AriaCheckboxProps['isIndeterminate']
  isSelected?: AriaCheckboxProps['isSelected']
  defaultSelected?: AriaCheckboxProps['defaultSelected']
  onChange?: AriaCheckboxProps['onChange']
  /** Identifies this control to its `Checkbox.Group`. */
  value?: AriaCheckboxProps['value']
  className?: string
  /** `Checkbox.Indicator` and `Checkbox.Text`, in that order. */
  children?: React.ReactNode
}

export interface CheckboxGroupProps extends Omit<
  AriaCheckboxGroupProps,
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
  ref?: React.Ref<HTMLDivElement>
  isDisabled?: AriaCheckboxGroupProps['isDisabled']
  isReadOnly?: AriaCheckboxGroupProps['isReadOnly']
  isRequired?: AriaCheckboxGroupProps['isRequired']
  isInvalid?: AriaCheckboxGroupProps['isInvalid']
  /** The group owns the selection: an array of the selected `value`s. */
  value?: AriaCheckboxGroupProps['value']
  defaultValue?: AriaCheckboxGroupProps['defaultValue']
  onChange?: AriaCheckboxGroupProps['onChange']
  className?: string
  /** `Checkbox.Label`, the checkboxes, then `Checkbox.Hint` and `Checkbox.Error`. */
  children?: React.ReactNode
}

export interface CheckboxIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
}

export interface CheckboxTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface CheckboxLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface CheckboxHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface CheckboxFieldErrorProps extends AriaFieldErrorProps {
  /** The message, or a function of the field's validation result. */
  children?: AriaFieldErrorProps['children']
}

/**
 * The box, with its tick — or its dash, when the checkbox is indeterminate. Use it as
 * `Checkbox.Indicator`, inside a `Checkbox`.
 *
 * Exported as `CheckboxIndicator` only so tooling can resolve it; consume the
 * compound form `Checkbox.Indicator`.
 */
export function CheckboxIndicator({
  className,
  ...props
}: CheckboxIndicatorProps) {
  return (
    <span
      data-slot="indicator"
      aria-hidden="true"
      className={[BOX, className].filter(Boolean).join(' ')}
      {...props}
    >
      {Tick}
      <span data-slot="dash" className={DASH} />
    </span>
  )
}

/**
 * The label of a single checkbox. Use it as `Checkbox.Text`, beside
 * `Checkbox.Indicator`. A bare text child renders too, just without the styling.
 *
 * Exported as `CheckboxText` only so tooling can resolve it; consume the compound
 * form `Checkbox.Text`.
 */
export function CheckboxText({
  className,
  children,
  ...props
}: CheckboxTextProps) {
  return (
    <span
      data-slot="text"
      className={[TEXT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * The legend for the group. Use it as `Checkbox.Label`, inside `Checkbox.Group`.
 *
 * Exported as `CheckboxLabel` only so tooling can resolve it; consume the compound
 * form `Checkbox.Label`.
 */
export function CheckboxLabel({
  className,
  children,
  ...props
}: CheckboxLabelProps) {
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
 * The guidance under the group. Use it as `Checkbox.Hint`. React Aria wires it to
 * the group's `aria-describedby`.
 *
 * Exported as `CheckboxHint` only so tooling can resolve it; consume the compound
 * form `Checkbox.Hint`.
 */
export function CheckboxHint({
  className,
  children,
  ...props
}: CheckboxHintProps) {
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
 * The message shown when the group is `isInvalid`. Use it as
 * `Checkbox.Error`; React Aria renders nothing while the group is valid.
 *
 * Exported as `CheckboxFieldError` only so tooling can resolve it; consume the
 * compound form `Checkbox.Error`.
 */
export function CheckboxFieldError({
  className,
  ...props
}: CheckboxFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The group. Use it as `Checkbox.Group`. It owns the value, as an array of the
 * selected `value`s.
 *
 * Exported as `CheckboxGroup` only so tooling can resolve it; consume the compound
 * form `Checkbox.Group`.
 */
export function CheckboxGroup({
  ref,
  className,
  children,
  ...props
}: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      ref={ref}
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCheckboxGroup>
  )
}

/**
 * Styled element. Not exported — `Checkbox` below is the public symbol, and docgen
 * reads the JSDoc from the *exported* declaration, not this one.
 */
function CheckboxControl({
  ref,
  className,
  children,
  ...props
}: CheckboxProps) {
  return (
    <AriaCheckbox
      ref={ref}
      className={[CONTROL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCheckbox>
  )
}

/**
 * A checkbox, and the group it can belong to — the sheet's `.ds-check`.
 *
 * ```tsx
 * <Checkbox.Group defaultValue={['slow']}>
 *   <Checkbox.Label>Alert me when</Checkbox.Label>
 *   <Checkbox value="down">
 *     <Checkbox.Indicator />
 *     <Checkbox.Text>Down</Checkbox.Text>
 *   </Checkbox>
 *   <Checkbox.Hint>Applies to every monitor.</Checkbox.Hint>
 *   <Checkbox.Error>Pick at least one.</Checkbox.Error>
 * </Checkbox.Group>
 * ```
 *
 * The slots are explicit, like `Button.Icon` and `Button.Text`:
 * `Checkbox.Indicator` draws the box and its tick, and `Checkbox.Text` the label. A
 * bare text child still renders, it just misses the label styling, so a missing
 * slot degrades rather than disappears.
 *
 * Alone, a `Checkbox` owns its selection: `defaultSelected` with
 * `onChange(boolean)`. Inside a `Checkbox.Group` the group owns it, as an array,
 * and `value` identifies the control to it.
 */
export const Checkbox = Object.assign(CheckboxControl, {
  Group: CheckboxGroup,
  Indicator: CheckboxIndicator,
  Text: CheckboxText,
  Label: CheckboxLabel,
  Hint: CheckboxHint,
  Error: CheckboxFieldError,
})
