import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
} from 'react-aria-components'
import type {
  SwitchButtonProps as AriaSwitchButtonProps,
  SwitchFieldProps as AriaSwitchFieldProps,
} from 'react-aria-components'

/**
 * The sheet's `.ds-switch`.
 *
 * React Aria splits a switch in two: `SwitchField` is the wrapper that owns the value
 * and provides the validation and help-text contexts, and `SwitchButton` is the
 * `<label>` you actually click. The `<label>` is therefore the control root, which is
 * where every state lands — `data-selected`, `data-hovered`, `data-focus-visible` and
 * the rest all sit on it, exactly as they do on `Checkbox` and `Radio`.
 *
 * So the same rule applies: publish the state here as custom properties and let the
 * track read them, rather than reaching a child through a group variant. A group
 * variant sorts at the same specificity as a plain utility, so it would silently lose
 * to the track's own resting edge. See the longer note in `Checkbox.tsx`.
 *
 * The four edge rules are deliberately built so that no two can match at once: hover
 * excludes invalid and read-only, and invalid is one step more specific than selected.
 * That leaves the cascade decided by specificity rather than by source order, which is
 * the only way it stays predictable when Tailwind sorts these for us.
 */
const CONTROL = [
  'inline-flex items-center gap-2.5 cursor-pointer select-none',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
  // Read-only keeps its state at full strength, as a read-only field does: the
  // position of the knob is the content, and the only affordance it loses is the
  // hover, which is dropped on it below.
  'data-[readonly]:cursor-not-allowed',
  // rest
  '[--switch-edge:var(--color-line-control)]',
  '[--switch-fill:transparent]',
  '[--switch-knob:var(--color-fg-muted)]',
  '[--switch-knob-x:0px]',
  '[--switch-ring:transparent]',
  'data-[selected]:[--switch-fill:var(--color-teal)]',
  'data-[selected]:[--switch-knob:var(--color-ink)]',
  'data-[selected]:[--switch-knob-x:20px]',
  'data-[selected]:[--switch-edge:var(--color-teal)]',
  // Invalid is a failure the user has to see, so it outranks the selected fill.
  'data-[invalid]:not-data-[disabled]:[--switch-edge:var(--color-red)]',
  // Hover only brightens the edge — the fill stays put, which is the sheet's own
  // pair: a selected switch keeps its teal and gains a white rim, rather than
  // inverting the way a checked checkbox does.
  'data-[hovered]:not-data-[invalid]:not-data-[readonly]:[--switch-edge:var(--color-fg)]',
  // The ring is drawn on the track, because the control is a 1x1 hidden input.
  'data-[focus-visible]:[--switch-ring:var(--color-teal)]',
].join(' ')

/**
 * The sheet's `.ds-switch-track`: 40x20, fully rounded, a transparent fill and a
 * hairline edge. `--color-line-control` rather than the sheet's 40% white, for the
 * same reason the inputs use it — a control boundary needs 3:1 on *both* pages, and
 * 40% measures 2.85:1 on the light one.
 */
const TRACK = [
  'relative h-5 w-10 flex-none rounded-full',
  'border border-(--switch-edge) bg-(--switch-fill)',
  // Transparent at rest rather than `outline-none`, so the ring fades in with the
  // track's own colours instead of switching on and off.
  'outline-1 outline-offset-[3px] outline-(--switch-ring)',
  'transition-[background-color,border-color,outline-color] duration-[160ms] ease-pulse',
].join(' ')

/**
 * The sheet's `.ds-switch-knob`: 14px, inset 2px. The sheet's `translate: 20px` is
 * exactly the track's inner width minus the knob and both insets — 40 - 2 (border) -
 * 2 - 14 - 2 = 20 — so the off and on positions are symmetric, not eyeballed.
 *
 * The travel is the whole state, so under `prefers-reduced-motion` it still moves;
 * only the animation goes. Sliding the knob is not decoration.
 */
const KNOB = [
  'absolute top-0.5 left-0.5 size-3.5 rounded-full',
  'bg-(--switch-knob) translate-x-(--switch-knob-x)',
  'transition-[translate,background-color] duration-[160ms] ease-pulse',
  'motion-reduce:transition-none',
].join(' ')

/**
 * The sheet shares `.ds-check-label` between the selection controls, so the switch
 * takes the same 13px at 80% rather than inventing a third label style.
 */
const TEXT = 'text-[13px] text-fg/80'

/**
 * The wrapper `SwitchField` renders. It stretches to its container by default, so it
 * is held to its content instead — the label inside is what carries the hit area, and
 * a stretched wrapper would put the click target out of step with what is drawn.
 */
const FIELD = 'flex w-fit flex-col gap-2'

export interface SwitchProps extends Omit<
  AriaSwitchFieldProps,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'children'
  | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaSwitchFieldProps['isDisabled']
  /** Makes the state visible but not changeable. */
  isReadOnly?: AriaSwitchFieldProps['isReadOnly']
  isRequired?: AriaSwitchFieldProps['isRequired']
  isInvalid?: AriaSwitchFieldProps['isInvalid']
  /** The switch owns its state, so it lives here. `onChange(boolean)`. */
  isSelected?: AriaSwitchFieldProps['isSelected']
  defaultSelected?: AriaSwitchFieldProps['defaultSelected']
  onChange?: AriaSwitchFieldProps['onChange']
  /** The name the state is submitted under. */
  name?: AriaSwitchFieldProps['name']
  /** The value submitted while the switch is on. */
  value?: AriaSwitchFieldProps['value']
  /**
   * Layout for the wrapper. The control's own styling is internal, as a field's is —
   * so reach for this to place the switch, not to restyle it.
   */
  className?: string
  /** `Switch.Indicator` and `Switch.Text`, in that order. */
  children?: React.ReactNode
}

export interface SwitchIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
}

export interface SwitchTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

/**
 * The track and its knob. Use it as `Switch.Indicator`, inside a `Switch`.
 *
 * Exported as `SwitchIndicator` only so tooling can resolve it; consume the compound
 * form `Switch.Indicator`.
 */
export function SwitchIndicator({ className, ...props }: SwitchIndicatorProps) {
  return (
    <span
      data-slot="indicator"
      aria-hidden="true"
      className={[TRACK, className].filter(Boolean).join(' ')}
      {...props}
    >
      <span data-slot="knob" className={KNOB} />
    </span>
  )
}

/**
 * The label of a switch. Use it as `Switch.Text`, beside `Switch.Indicator`. A bare
 * text child renders too, just without the label styling.
 *
 * Exported as `SwitchText` only so tooling can resolve it; consume the compound form
 * `Switch.Text`.
 */
export function SwitchText({ className, children, ...props }: SwitchTextProps) {
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
 * The clickable half — a `<label>` wrapping the hidden input. Styled element, not
 * exported: `Switch` below is the public symbol, and docgen reads the JSDoc from the
 * exported declaration, not this one.
 *
 * It exists as a separate element only because React Aria requires it to nest inside
 * `SwitchField`, which is what supplies the value. A consumer never writes it.
 */
function SwitchButton({
  className,
  children,
  ...props
}: AriaSwitchButtonProps) {
  return (
    <AriaSwitchButton
      className={[CONTROL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaSwitchButton>
  )
}

/**
 * A switch — the sheet's `.ds-switch`. An on/off setting, unlike a checkbox, which is
 * one choice among several: the state reads from which side the knob sits on, and the
 * change takes effect at once rather than on submit.
 *
 * ```tsx
 * <Switch defaultSelected>
 *   <Switch.Indicator />
 *   <Switch.Text>Auto-retry failed checks</Switch.Text>
 * </Switch>
 * ```
 *
 * The slots are explicit, like `Checkbox.Indicator` and `Checkbox.Text`: `Switch`
 * draws the track and slides the knob for you, and `Switch.Text` the label. A bare
 * text child still renders, it just misses the label styling.
 *
 * Built on `SwitchField` + `SwitchButton`, which is the pair React Aria now points at —
 * `Switch` itself is deprecated in 1.22. `SwitchField` is the wrapper that owns the
 * value, so the label it renders is the control root and every state lands on it.
 */
export const Switch = Object.assign(
  function Switch({ ref, className, children, ...props }: SwitchProps) {
    return (
      <AriaSwitchField
        ref={ref}
        className={[FIELD, className].filter(Boolean).join(' ')}
        {...props}
      >
        <SwitchButton>{children}</SwitchButton>
      </AriaSwitchField>
    )
  },
  { Indicator: SwitchIndicator, Text: SwitchText },
)
