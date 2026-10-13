import {
  FieldError as AriaFieldError,
  Label as AriaLabel,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text as AriaText,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  LabelProps as AriaLabelProps,
  RadioGroupProps as AriaRadioGroupProps,
  RadioProps as AriaRadioProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { ERROR, HINT, LABEL } from '../field'

/**
 * The sheet's `.ds-radio`. The dot is a circle where the checkbox is a 2px-radius
 * square — the two exceptions to this system's `rounded-none`.
 *
 * States are published as custom properties here and read by the indicator, rather
 * than applied to it through a group variant. A group variant sorts at the same
 * specificity as a plain utility, so it silently loses to the indicator's own
 * `border-input`; a property set on this element wins the ordinary cascade.
 * See the longer note in `Checkbox.tsx`.
 *
 * The names are shared with `Checkbox` deliberately, so the two read the same set
 * and neither has to know which it is.
 */
const CONTROL = [
  'group/selection inline-flex items-center gap-2.5',
  'cursor-pointer select-none',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
  // rest
  '[--selection-border:var(--color-input)]',
  '[--selection-mark:0]',
  '[--selection-scale:0.4]',
  '[--selection-ring:transparent]',
  // Hover only brightens the ring; there is nothing to invert, because the centre
  // is empty until the radio is selected.
  'data-[hovered]:[--selection-border:var(--color-foreground)]',
  'data-[selected]:[--selection-border:var(--color-primary)]',
  'data-[selected]:[--selection-mark:1]',
  'data-[selected]:[--selection-scale:1]',
  'data-[focus-visible]:[--selection-ring:var(--color-primary)]',
  // The centre scales in, which is motion, so under reduced motion it stays at
  // full size and cross-fades instead — a fade is not motion and needs no query.
  'motion-reduce:[--selection-scale:1]',
].join(' ')

const DOT = [
  'relative size-[18px] flex-none rounded-full',
  'border border-(--selection-border) bg-transparent',
  'outline-1 outline-offset-[3px] outline-(--selection-ring)',
  'transition-[border-color,outline-color] duration-(--duration-fast) ease-pulse',
].join(' ')

/** The 10px centre, the sheet's `::after` at `inset: 4px`. */
const CENTRE = [
  'absolute inset-[3px] rounded-full bg-primary',
  'opacity-(--selection-mark) scale-(--selection-scale)',
  // **`scale`, not `transform`.** The property this animates is the CSS `scale` at `:62`, and a
  // transition that names `transform` does not cover it — the centre popped in while only the
  // fade ran. The `motion-reduce` rule above keeps it still for anyone who asked for that.
  'transition-[opacity,scale] duration-(--duration-fast) ease-pulse',
].join(' ')

/** The sheet shares `.ds-check-label` between the two controls: 13px, 80%. */
const TEXT = 'text-[13px] text-foreground/80'

/** The sheet's `<fieldset class="stack ds-field">`: legend, controls, hint. */
const GROUP = 'group flex'

export interface RadioProps extends Omit<
  AriaRadioProps,
  'isDisabled' | 'children' | 'className' | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLLabelElement>
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaRadioProps['isDisabled']
  /**
   * Identifies this radio to its `Radio.Group`, which owns the selection. A
   * `Radio` outside a group has no group state to read, so it is always used
   * inside one. `isRequired` and `isInvalid` belong to the group, not here.
   */
  value: AriaRadioProps['value']
  className?: string
  /** `Radio.Indicator` and `Radio.Text`, in that order. */
  children?: React.ReactNode
}

export interface RadioGroupProps extends Omit<
  AriaRadioGroupProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'orientation'
  | 'children'
  | 'className'
  | 'ref'
> {
  ref?: React.Ref<HTMLDivElement>
  isDisabled?: AriaRadioGroupProps['isDisabled']
  isReadOnly?: AriaRadioGroupProps['isReadOnly']
  isRequired?: AriaRadioGroupProps['isRequired']
  isInvalid?: AriaRadioGroupProps['isInvalid']
  /** The group owns the selection: one `value` from its radios. */
  value?: AriaRadioGroupProps['value']
  defaultValue?: AriaRadioGroupProps['defaultValue']
  onChange?: AriaRadioGroupProps['onChange']
  /** Lays the radios in a row instead of the sheet's default column. */
  orientation?: AriaRadioGroupProps['orientation']
  className?: string
  /** `Radio.Label`, the radios, then `Radio.Hint` and `Radio.Error`. */
  children?: React.ReactNode
}

export interface RadioIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
}

export interface RadioTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface RadioLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface RadioHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface RadioFieldErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

/**
 * The dot, with its 10px centre. Use it as `Radio.Indicator`, inside a `Radio`.
 *
 * Exported as `RadioIndicator` only so tooling can resolve it; consume the
 * compound form `Radio.Indicator`.
 */
export function RadioIndicator({ className, ...props }: RadioIndicatorProps) {
  return (
    <span
      data-slot="indicator"
      aria-hidden="true"
      className={[DOT, className].filter(Boolean).join(' ')}
      {...props}
    >
      <span data-slot="centre" className={CENTRE} />
    </span>
  )
}

/**
 * The label of a single radio. Use it as `Radio.Text`, beside `Radio.Indicator`.
 * A bare text child renders too, just without the label styling.
 *
 * Exported as `RadioText` only so tooling can resolve it; consume the compound
 * form `Radio.Text`.
 */
export function RadioText({ className, children, ...props }: RadioTextProps) {
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
 * The legend for the group. Use it as `Radio.Label`, inside `Radio.Group`.
 *
 * Exported as `RadioLabel` only so tooling can resolve it; consume the compound
 * form `Radio.Label`.
 */
export function RadioLabel({ className, children, ...props }: RadioLabelProps) {
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
 * The guidance under the group. Use it as `Radio.Hint`. React Aria wires it to the
 * group's `aria-describedby`.
 *
 * Exported as `RadioHint` only so tooling can resolve it; consume the compound
 * form `Radio.Hint`.
 */
export function RadioHint({ className, children, ...props }: RadioHintProps) {
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
 * The message shown when the group is `isInvalid`. Use it as `Radio.Error`;
 * React Aria renders nothing while the group is valid.
 *
 * Exported as `RadioFieldError` only so tooling can resolve it; consume the
 * compound form `Radio.Error`.
 */
export function RadioFieldError({
  className,
  children,
  ...props
}: RadioFieldErrorProps) {
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
 * The group. Use it as `Radio.Group`. It owns the value, and every radio inside it
 * shares one tab stop, with the arrow keys moving between them.
 *
 * Exported as `RadioGroup` only so tooling can resolve it; consume the compound
 * form `Radio.Group`.
 */
export function RadioGroup({
  ref,
  orientation = 'vertical',
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      ref={ref}
      orientation={orientation}
      className={[
        GROUP,
        // **One direction, chosen — never both.** This used to be a `flex-col` in `GROUP` with a
        // `flex-row` added here for the horizontal case, so the element carried two conflicting
        // utilities and which one won depended on Tailwind's generated order rather than on the class
        // list. The direction is decided in one place now.
        orientation === 'horizontal' ? 'flex-row gap-5' : 'flex-col gap-2.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaRadioGroup>
  )
}

/**
 * Styled element. Not exported — `Radio` below is the public symbol, and docgen
 * reads the JSDoc from the *exported* declaration, not this one.
 */
function RadioControl({ ref, className, children, ...props }: RadioProps) {
  return (
    <AriaRadio
      ref={ref}
      className={[CONTROL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaRadio>
  )
}

/**
 * A radio, and the group it belongs to — the sheet's `.ds-radio`.
 *
 * ```tsx
 * <Radio.Group defaultValue="https">
 *   <Radio.Label>Protocol</Radio.Label>
 *   <Radio value="http">
 *     <Radio.Indicator />
 *     <Radio.Text>HTTP</Radio.Text>
 *   </Radio>
 *   <Radio value="https">
 *     <Radio.Indicator />
 *     <Radio.Text>HTTPS</Radio.Text>
 *   </Radio>
 *   <Radio.Hint>Applies to every check.</Radio.Hint>
 *   <Radio.Error>Choose a protocol.</Radio.Error>
 * </Radio.Group>
 * ```
 *
 * The slots are explicit, like `Button.Icon` and `Button.Text`: `Radio.Indicator`
 * draws the dot and its centre, and `Radio.Text` the label. A bare text child still
 * renders, it just misses the label styling, so a missing slot degrades rather than
 * disappears.
 *
 * `Radio.Group` owns the value. A `Radio` outside one has no group state to read,
 * which is why `isRequired` and `isInvalid` live on the group rather than on the
 * control.
 */
export const Radio = Object.assign(RadioControl, {
  Group: RadioGroup,
  Indicator: RadioIndicator,
  Text: RadioText,
  Label: RadioLabel,
  Hint: RadioHint,
  Error: RadioFieldError,
})
