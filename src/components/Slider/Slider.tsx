import {
  FieldError as AriaFieldError,
  FieldErrorContext as AriaFieldErrorContext,
  Label as AriaLabel,
  Slider as AriaSlider,
  SliderFill as AriaSliderFill,
  SliderOutput as AriaSliderOutput,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
} from 'react-aria-components'
import type {
  FieldErrorProps as AriaFieldErrorProps,
  LabelProps as AriaLabelProps,
  SliderFillProps as AriaSliderFillProps,
  SliderOutputProps as AriaSliderOutputProps,
  SliderProps as AriaSliderProps,
  SliderThumbProps as AriaSliderThumbProps,
  SliderTrackProps as AriaSliderTrackProps,
} from 'react-aria-components'

import { useContext, useId } from 'react'

import { ERROR, FIELD_SIZES, FieldValidationContext, VALID } from '../field'
import type { FieldSize } from '../field'
import { FILL, HEADER, TONE, TRACK_WASH } from '../progress'

export interface SliderProps extends Omit<
  AriaSliderProps,
  | 'children'
  | 'className'
  | 'orientation'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'minValue'
  | 'maxValue'
  | 'formatOptions'
> {
  /** The current value, as a single number or one per thumb. Controlled. */
  value?: AriaSliderProps['value']
  /** The value it starts at, for uncontrolled use. */
  defaultValue?: AriaSliderProps['defaultValue']
  /** Called as the handle moves. */
  onChange?: AriaSliderProps['onChange']
  /** Disables the whole rail. */
  isDisabled?: AriaSliderProps['isDisabled']
  /** The bottom of the range. */
  minValue?: AriaSliderProps['minValue']
  /** The top of the range. */
  maxValue?: AriaSliderProps['maxValue']
  /** How the value is written — `{ style: 'percent' }`, for instance. */
  formatOptions?: AriaSliderProps['formatOptions']

  /** `sm | md | lg`. The rail thickens with it, so the target grows with the type. */
  size?: FieldSize
  /** Keep it horizontal or stand it up; the rail and the thumb turn with it. */
  orientation?: AriaSliderProps['orientation']
  /**
   * Whether the value is invalid. **This one is ours, not React Aria's** — a slider is not a field
   * there, so nothing else can tell it. See `Slider.Error`.
   */
  isInvalid?: boolean
  className?: string
  /** A `Slider.Label`, a `Slider.Value`, and a `Slider.Track` of one or more thumbs. */
  children?: React.ReactNode
}

/** The label and the reading on one line, the same slot `ProgressBar` and `Meter` have. */
export interface SliderHeaderProps {
  className?: string
  children?: React.ReactNode
}

export interface SliderLabelProps extends Omit<AriaLabelProps, 'className'> {
  className?: string
}

export interface SliderValueProps extends Omit<
  AriaSliderOutputProps,
  'className' | 'children'
> {
  className?: string
  children?: React.ReactNode
}

export interface SliderTrackProps extends Omit<
  AriaSliderTrackProps,
  'className'
> {
  className?: string
}

export interface SliderFillProps extends Omit<
  AriaSliderFillProps,
  'className'
> {
  className?: string
  tone?: keyof typeof TONE
}

export interface SliderErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

export interface SliderThumbProps extends Omit<
  AriaSliderThumbProps,
  'className'
> {
  className?: string
  /**
   * A name for one handle of a range. The thumb needs it; the handle does not show it.
   *
   * It travels as `aria-label` rather than as an `.sr-only` child, because React Aria's thumb renders
   * no children of its own — a `<span>` passed to it disappeared and both handles of a range came out
   * unnamed, which is exactly what a range must not be.
   */
  label?: string
}

/**
 * The rail. Taller than a progress bar's, because it has to be aimed at: the sheet's 4px bar is a
 * reading, and this is a control.
 *
 * Turned with the slider: `h-1 w-full` lying down, `h-full w-1` standing up. A rail is one dimension
 * short and one long, and which one changes with the orientation — a rule that only ever sets a
 * height paints a 1px line across a vertical slider and looks like a rendering fault.
 */
const RAIL = [
  // **Not `TRACK`, and the difference is the whole of a bug.** That rail clips (`overflow-clip`), which
  // the bar can afford — its fill is the whole drawing. A slider's handle is 20px square on a 4px rail,
  // so the clip painted it as a **4px sliver**: a white notch at the end of the fill instead of a grip.
  //
  // Nothing caught it for as long as the component has existed, because every assertion in the story
  // measures `getBoundingClientRect`, which reports a layout box whether or not an ancestor clips it.
  // The handle measured 20×20 while painting four pixels tall. It took a 3× screenshot of the rendered
  // control — the thing the eye reads — to see it, and an `overflow` assertion now to keep it.
  TRACK_WASH,
  'relative w-full rounded-none',
  // The thickness is a variable the slider publishes per size, so it stays a literal class Tailwind
  // can see — `h-(--slider-rail)` — rather than a value computed at runtime and invisible to it.
  'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-(--slider-rail)',
  'data-[orientation=horizontal]:h-(--slider-rail) data-[orientation=horizontal]:w-full',
].join(' ')

/**
 * The rail's thickness, the grip's width and the grip's height, per `size`.
 *
 * **The first version set `h-1` outright**, so the `size` prop changed the legend's type and nothing
 * else — the `Sizes` story found three identical rails where it expected three different ones. A size
 * that does not reach the control is a size that lies, and this is the same mistake the number
 * field's steppers made one component ago: the prop was accepted and ignored.
 *
 * The handle grows with the rail, because the handle is what has to be hit.
 *
 * **The handle is square, and it is one size rather than two.** It used to be a narrow tall bar — 7×18px
 * at `md`, then 10×24px — and a reader looking at it twice said it still did not look right. They were
 * right, and the reason is proportion: a bar a hairline wide and several rails tall reads as a **cursor**,
 * not as something a hand closes around. Making it taller and narrower to look less like "a bullet sitting
 * on a line" fixed the wrong problem — what made the original square look wrong was its **border** and its
 * `bg-background` fill, a black box showing nothing but its own hairline, not its being square.
 *
 * So it is square again, solid, and larger: `sm`, `md` and `lg` are 14/16/20px against rails of 3/4/6px.
 * Nothing here is taller than it is wide, which is what the `ThumbPosition` story now actually checks.
 */
const RAIL_SIZE: Record<FieldSize, string> = {
  sm: '[--slider-rail:3px] [--slider-thumb:1rem]',
  md: '[--slider-rail:4px] [--slider-thumb:1.25rem]',
  lg: '[--slider-rail:6px] [--slider-thumb:1.5rem]',
}

/**
 * The handle. **Square**, like every other control in this system.
 *
 * A round thumb is what years of iOS sliders have trained everyone to expect, and it is the
 * temptation here. The sheet squares its buttons, its inputs and its fields, and gives only the
 * checkbox and the radio the radius users expect of a *selection* control. A slider handle is not a
 * selection control — it is a grip — so it stays square, and the affordance comes from its size and
 * the focus ring instead. Making it round would quietly add a third exception to a rule that has
 * exactly two.
 */
const THUMB = [
  // **React Aria positions the handle along the rail and expects the *recipe* to centre it in the
  // other axis.** Its inline style is `position:absolute; left: X%; transform: translate(-50%,-50%)`,
  // and that `-50%` assumes the box it translates already starts at the rail's centre — which it does
  // not, because `top` is `auto`. Measured on a 4px rail, the handle sat **10px above it**, hanging
  // over the fill like a tab. React Aria's own docs CSS carries the missing line: `top: 50%` when the
  // rail lies down, `left: 50%` when it stands up. This is that line, taken from the track rather than
  // from the handle, because the orientation is published on the track and not on the thumb.
  'group-data-[orientation=horizontal]:top-1/2',
  'group-data-[orientation=vertical]:left-1/2',
  // **Square, and written as two utilities rather than `size-(--)`** — that form silently produced
  // nothing here, which is how the handle first ended up with no height at all. Both sides read the same
  // variable, so they cannot drift out of square.
  'h-(--slider-thumb) w-(--slider-thumb) shrink-0 rounded-none',
  // No border. The first version was a bordered `bg-background` square, which on the dark page was a black
  // box showing nothing but its own hairline — it read as a rendering artifact sitting on the rail
  // rather than as something to grab. A border also muddies a shape this small, where the border is a
  // fifth of the width.
  //
  // So the handle is a **solid grip** in a token that already exists, and its states move that colour
  // the way every other control here does: quiet at rest, up to full strength on hover, and the
  // accent only while it is actually being dragged. The accent is already spent on the fill; a second
  // accent block beside it would say nothing new.
  // **Full strength, not 70%.** At 70% the handle was a pale grey — measurably lighter than the page
  // but *duller than the teal fill it sits on*, so on the filled half of the rail it receded and a
  // reader said it was hard to see. It is the thing you grab; it should be the loudest mark on the
  // rail, not the quietest. `--slider-mark` is white in this theme, and white reads against both
  // the teal fill and the dark track without a border or a ring.
  //
  // It is a variable rather than a utility because the handle is *also* where the invalid state has
  // to show, and `data-invalid` is on the root — the fourth time a state on a parent travels this
  // way, after `--slider-dim` two lines down.
  'bg-(--slider-mark)',
  'data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-ring',
  'data-[disabled]:cursor-not-allowed',
  // Read from the slider, not from the handle: `data-disabled` is on the **root** while the handle is
  // a descendant, and a `data-[disabled]:` rule on the handle therefore never matches. This is the
  // fourth time this session that a state on a parent had to travel as a custom property — the same
  // shape as `Checkbox`'s indicator and `Select`'s trigger.
  'opacity-(--slider-dim)',
  // Hover is on the browser's pseudo-class rather than `data-hovered`: the handle is a 14px target and
  // the state has to arrive the moment the pointer is over it, which is what `:hover` guarantees.
  'motion-safe:transition-[background-color,scale] motion-safe:duration-(--duration-fast) ease-pulse',
  // **The state signals are scale, not colour.** With the handle already white at rest, hover and drag
  // have nothing left to brighten — so they grow. Dragging used to turn the handle teal, which is the
  // exact colour of the fill underneath it: invisible on the filled half of the rail, the same mistake
  // the resting colour made.
  'hover:scale-105 data-[dragging]:scale-110 active:scale-110',
  // The handle is the target, and 14px is a small one. The padding is on the thumb's own box so the
  // pointer reaches it without moving the rail.
  'before:absolute before:-inset-2 before:content-[""]',
].join(' ')

/**
 * The value, as React Aria formats it — one figure, or a pair for a range.
 *
 * `SliderOutput` is a `<output>`, which is the element for exactly this: the result of a control
 * rather than a control itself. It is `aria-live` for free, so a keyboard user hears the value move
 * as they arrow along the rail.
 */
const OUTPUT = [
  'font-mono text-[13px] tabular-nums text-foreground',
  'data-[disabled]:opacity-30',
].join(' ')

/**
 * A value chosen by dragging a handle along a rail.
 *
 * **The sheet has no slider in it**, so this is an invention. It is the progress bar's drawing made
 * interactive — the same 4px rail, the same accent fill, the same `progress.ts` — because a slider
 * *is* a bar with a handle on it, and two drawings of one idea is exactly the drift that file
 * exists to prevent.
 *
 * ```tsx
 * <Slider defaultValue={60}>
 *   <Slider.Label>Alert threshold</Slider.Label>
 *   <Slider.Value />
 *   <Slider.Track>
 *     <Slider.Fill />
 *     <Slider.Thumb />
 *   </Slider.Track>
 * </Slider>
 * ```
 *
 * A **range** is the same component with two thumbs and an array of values — `Slider.Track` holds as
 * many as you write, and React Aria keeps them from crossing:
 *
 * ```tsx
 * <Slider defaultValue={[20, 80]}>
 *   <Slider.Track>
 *     <Slider.Fill />
 *     <Slider.Thumb index={0} label="From" />
 *     <Slider.Thumb index={1} label="To" />
 *   </Slider.Track>
 * </Slider>
 * ```
 *
 * The keyboard is the reason to use this rather than a `div`: arrow keys step, Page Up and Down jump,
 * Home and End reach the ends, and every one of those is announced with the value it produced. A
 * slider that only responds to a pointer is unusable with a keyboard and invisible to a screen
 * reader, which is most of what a hand-rolled one gets wrong.
 *
 * **A slider is the one field here React Aria does not treat as a field**, so `isInvalid` and
 * `Slider.Error` are this library's own: React Aria gives a slider no validation at all, and a
 * slider bound to a form still has to be able to say what failed. `isInvalid` is what says so, and
 * the thumb carries it to its range input — the element a screen reader reads — as `aria-invalid`
 * plus a reference to the message.
 */
function SliderRoot({
  size = 'md',
  orientation = 'horizontal',
  isInvalid = false,
  className,
  children,
  ...props
}: SliderProps) {
  // **The error's id is minted here, and not in `Slider.Error`.** The message and the thumb that is
  // described by it are two different slots, and only a component above both of them can own the
  // name they share.
  const errorId = useId()

  return (
    // **A slider is not a field in React Aria, so it publishes the field contexts itself.** See
    // `FieldValidationContext`. This is what makes `Slider.Error` possible at all: a
    // `FieldError` renders nothing without a provider, and a `Slider` provides none.
    <AriaFieldErrorContext.Provider
      value={{ isInvalid, validationErrors: [], validationDetails: VALID }}
    >
      <FieldValidationContext.Provider value={{ isInvalid, errorId }}>
        <AriaSlider
          orientation={orientation}
          data-invalid={isInvalid || undefined}
          className={[
            FIELD_SIZES[size],
            RAIL_SIZE[size],
            // Declared on the element that owns the attribute, and read by the handle below it.
            '[--slider-dim:1] data-[disabled]:[--slider-dim:0.3]',
            // The handle's colour, for the same reason: invalid is on the root and the mark is a
            // descendant. The grip is the loudest thing on the rail, so a slider that failed turns
            // the thing you look at — rather than the accent fill, which says how far along it is.
            '[--slider-mark:var(--color-foreground)] data-[invalid]:[--slider-mark:var(--color-destructive)]',
            'flex flex-col gap-2',
            'data-[orientation=horizontal]:w-64',
            'data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-fit',
            'data-[disabled]:cursor-default',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </AriaSlider>
      </FieldValidationContext.Provider>
    </AriaFieldErrorContext.Provider>
  )
}

/** Assigned below; declared after the slots so the compound object can reference them. */

/**
 * What the slider sets. Use it as `Slider.Label` — React Aria wires it to the rail as the slider's
 * accessible name, so there is no `label` prop to keep in sync with it.
 *
 * Exported as `SliderLabel` only so tooling can resolve it; consume the compound form `Slider.Label`.
 */
export function SliderLabel({ className, ...props }: SliderLabelProps) {
  return (
    <AriaLabel
      className={[
        'font-mono text-[11px] uppercase tracking-[0.04em] text-foreground/70',
        'data-[disabled]:opacity-30',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The line above the rail: the label on the left, the reading on the right. Use it as
 * `Slider.Header` — the same slot `ProgressBar` and `Meter` have, for the same reason.
 *
 * Exported as `SliderHeader` only so tooling can resolve it; consume the compound form
 * `Slider.Header`.
 */
export function SliderHeader({ className, children }: SliderHeaderProps) {
  return (
    <div className={[HEADER, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The reading. Use it as `Slider.Value` — an `<output>` that announces itself as the value changes.
 *
 * Exported as `SliderValue` only so tooling can resolve it; consume the compound form `Slider.Value`.
 */
export function SliderValue({ className, ...props }: SliderValueProps) {
  return (
    <AriaSliderOutput
      className={[OUTPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The rail. Use it as `Slider.Track`, around a `Slider.Fill` and one or more `Slider.Thumb`s.
 *
 * Exported as `SliderTrack` only so tooling can resolve it; consume the compound form
 * `Slider.Track`.
 */
export function SliderTrack({ className, ...props }: SliderTrackProps) {
  return (
    <AriaSliderTrack
      data-slot="track"
      className={[
        RAIL,
        // `group` so the handle can read the orientation: React Aria publishes it on the track and not
        // on the thumb, and the thumb needs it to centre itself in the cross axis.
        'group relative flex touch-none items-center',
        'data-[orientation=vertical]:flex-col',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The filled part of the rail — from the start to the thumb, or between the two thumbs of a range.
 * Use it as `Slider.Fill`.
 *
 * Exported as `SliderFill` only so tooling can resolve it; consume the compound form
 * `Slider.Fill`.
 */
export function SliderFill({
  className,
  tone = 'accent',
  ...props
}: SliderFillProps) {
  return (
    <AriaSliderFill
      data-slot="fill"
      className={[FILL, TONE[tone] ?? TONE.accent, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The message shown while the slider is `isInvalid`. Use it as `Slider.Error`.
 *
 * **React Aria's slider is not a field, so this slot is this library's rather than React Aria's.**
 * `Slider` has no `isInvalid` to read and no `FieldError` to render into — the two are the same
 * fact, because a `FieldError` renders only from the context a field publishes. `Slider`
 * publishes that context itself, from the `isInvalid` prop above it, which is what lets a slider
 * bound to a form say what failed instead of only refusing to submit.
 *
 * What that costs is worth stating: the message is **the caller's**. Every other `Error` slot in
 * this library can be left empty and will render whatever React Aria's own validation produced;
 * this one renders its children. That is not a gap to close later — there is no React Aria
 * validation for a slider to surface, and this is the whole of what one can be given.
 *
 * Exported as `SliderError` only so tooling can resolve it; consume the compound form
 * `Slider.Error`.
 */
export function SliderError({
  className,
  children,
  ...props
}: SliderErrorProps) {
  const validation = useContext(FieldValidationContext)
  return (
    <AriaFieldError
      // The id the thumb points its `aria-describedby` at. It belongs to the control rather than
      // to this slot, so that the message and the reference to it cannot drift apart.
      id={validation?.errorId}
      data-slot="error"
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaFieldError>
  )
}

/**
 * A handle. Use it as `Slider.Thumb` — once for a value, twice for a range, with an `index` and a
 * `label` each so a screen reader can tell the two apart.
 *
 * Exported as `SliderThumb` only so tooling can resolve it; consume the compound form
 * `Slider.Thumb`.
 */
export function SliderThumb({ className, label, ...props }: SliderThumbProps) {
  const validation = useContext(FieldValidationContext)
  return (
    <AriaSliderThumb
      // React Aria renders an inner wrapper around the input, so the input's parent is *not* the
      // styled handle. `data-slot` is the hook, as it is on the fill.
      data-slot="thumb"
      aria-label={label}
      // **`isInvalid` is deprecated on a React Aria slider thumb, with no replacement — and it is
      // still the only thing that reaches the range input.** The grip is a picture; the input is
      // what a screen reader reads the value from, and it is what `aria-describedby` has to be
      // put on. Dropping the prop would paint a red message at nobody who cannot see it, so it is
      // used knowingly, and the assertion that keeps it honest is on the input's own attributes.
      isInvalid={validation?.isInvalid || undefined}
      aria-describedby={validation?.isInvalid ? validation.errorId : undefined}
      className={[THUMB, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A slider is a compound because its parts are addressable: the label names it, the value announces
 * it, the track takes the pointer, the fill shows how far, and the thumb is what you drag. A
 * consumer restyling the rail should not have to reach into a component that has an opinion about
 * the thumb.
 */
export const Slider = Object.assign(SliderRoot, {
  Header: SliderHeader,
  Label: SliderLabel,
  Value: SliderValue,
  Track: SliderTrack,
  Fill: SliderFill,
  Thumb: SliderThumb,
  Error: SliderError,
})
