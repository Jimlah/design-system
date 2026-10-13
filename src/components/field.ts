/**
 * The field anatomy, shared by every control that wears it — `TextField`,
 * `SearchField`, and the textarea, select, checkbox and radio still to come.
 *
 * The styling lives here, and so does the one piece of field *state* React Aria
 * leaves to us: the validation context `Slider` — the one field it does not treat
 * as a field — publishes for its own `Error` slot. See
 * `FieldValidationContext` at the bottom of this file.
 *
 * Each component defines its own slot components, thin as they are, so that its
 * docs and manifest describe its own API rather than pointing at another
 * component's.
 */
import { createContext } from 'react'

/**
 * The three control sizes. `size` is set once on the field and travels as two
 * custom properties rather than through React context: the control, and any
 * affix inside it, are ordinary descendants of the field, so inheritance already
 * does the work. It also means a one-off override is just a utility on the
 * element rather than a new prop.
 */
export type FieldSize = 'sm' | 'md' | 'lg'

export const FIELD_SIZES: Record<FieldSize, string> = {
  sm: '[--field-control-h:2.25rem] [--field-control-text:0.8125rem]', // 36px / 13px
  md: '[--field-control-h:2.75rem] [--field-control-text:0.875rem]', // 44px / 14px
  lg: '[--field-control-h:3.25rem] [--field-control-text:0.9375rem]', // 52px / 15px
}

/**
 * The sheet's `.ds-field`: legend, control, then the hint that explains it.
 *
 * The `font-size` here is what the control and any affix inherit. It sits on the
 * field rather than on the input so it still reaches an affix, which is the
 * input's sibling — a `cap`-sized icon would otherwise match the page's font
 * instead of the field's.
 *
 * The two border properties are published here for the same reason `Checkbox`
 * publishes its own: read-only lives on the field root, while the border it changes
 * is on the input, and a group variant cannot win that cascade — see the note on
 * `INPUT`. Declaring them here means the input only reads them, and the ordinary
 * cascade decides, because `[data-readonly]` plainly outranks the bare declaration.
 */
export const FIELD = [
  'group flex flex-col gap-2 [font-size:var(--field-control-text)]',
  '[--field-border:var(--color-input)]',
  '[--field-hover:var(--color-border)]',
  // Read-only is not disabled: the value is the whole point of the field, so it
  // keeps full-strength text. Only the affordances go — a quieter hairline, and no
  // brightening on hover — because there is nothing here to invite a click on.
  'data-[readonly]:[--field-border:var(--color-border-soft)]',
  'data-[readonly]:[--field-hover:var(--color-border-soft)]',
].join(' ')

/**
 * The sheet's `.ds-affix` wrapper. `Group` exists for one case: an affix is
 * positioned against the control, but the field also holds the legend and the
 * hint, so an affix anchored to the field would centre on all three.
 * Wrapping the control gives the affix the right box — and it stays opt-in, so a
 * plain field has no extra element at all.
 *
 * The two `:has()` rules are here for the same reason: the room an affix needs is
 * padding on the input, and the group is what can see both of them. The input
 * itself never has to know it has neighbours.
 */
export const GROUP = [
  'relative flex w-full',
  'has-[[data-slot=icon-start]]:[&>[data-slot=input]]:ps-10.5', // 42px, per the sheet's search field
  'has-[[data-slot=icon-end]]:[&>[data-slot=input]]:pe-14', // 56px, per the sheet's trailing unit
].join(' ')

/**
 * The sheet's `.ds-field-legend`: 12px, uppercase, letterspaced, white 70%.
 *
 * The required marker is drawn from the field's own `data-required`, so the label
 * never has to be told and the asterisk cannot drift out of sync with
 * `isRequired`. The input already carries the native `required`, so this is the
 * visual half of the same fact.
 */
export const LABEL = [
  'text-[12px] uppercase tracking-[0.04em] text-muted-foreground',
  "group-data-[required]:after:ms-1 group-data-[required]:after:text-destructive group-data-[required]:after:content-['*']",
].join(' ')

/**
 * The sheet's `.ds-input`.
 *
 * The resting hairline is what identifies the control. The sheet gives
 * `.ds-input` a transparent border and leaves the panel-2 fill to do the job, but
 * that fill is 1.23:1 on the dark page and 1.17:1 on the light one, so the field is
 * nearly invisible as a boundary in both. `--input` is the smallest
 * hairline that clears the 3:1 a control boundary needs on each.
 *
 * Hover has to *strengthen* it rather than replace it: the sheet's hover is white
 * at 25%, which is now weaker than the resting line and would erase it.
 *
 * `outline-none` on focus suppresses the *browser's* ring, which is what the
 * sheet's `.ds-input:focus { outline: none }` is really doing. Chrome gives a
 * focused text input its `:focus-visible` ring at `outline-style: auto` regardless
 * of React Aria's attribute, so leaving it alone means a blue UA ring on a teal
 * system. Focus is then the border alone — adding the shared 3px-offset ring here
 * would draw two parallel teal hairlines with a gap, which reads as a fault.
 * `Button` can carry that ring because the edge it repeats is a solid fill.
 */
export const INPUT = [
  // **The corner is a token now, and `rounded-md` is the control step of its scale.** Pulse's own
  // `--radius` is `0`, so the sheet's square field is unchanged here; a theme that sets a radius
  // moves every control in the library at once. See the radius note in `docs/theming.md`.
  'w-full font-mono rounded-md border border-(--field-border)',
  'h-(--field-control-h) px-3.5',
  'bg-muted text-foreground placeholder:text-foreground/35',
  'transition-[border-color,background-color] duration-(--duration-fast) ease-pulse',
  // Focus and invalid stay literal, so they outrank the published border and always
  // win — including on a read-only field, which is still focusable and still the
  // field the caret should be able to reach.
  'data-[hovered]:not-data-[focused]:border-(--field-hover)',
  'data-[focused]:outline-none data-[focused]:border-primary',
  'data-[invalid]:not-data-[focused]:border-destructive',
  // The browser already knows when someone has left a field invalid, so the state needs no
  // "touched" class and no blur listener — it only needed a rule. Same line in `TextArea`.
  'user-invalid:not-data-[focused]:border-destructive',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  // Read-only gets the cursor and nothing else that dims it. `opacity` here would
  // take the *value* down with it — at 40% the text measures 3.42:1, under the 4.5:1
  // body text needs, so the one thing the user came to read becomes the thing they
  // cannot.
  'group-data-[readonly]:cursor-not-allowed',
].join(' ')

/** The sheet's `.ds-hint`: 12px, tighter tracking, white 55%. */
export const HINT = 'text-[12px] tracking-[-0.5px] text-foreground/55'

/**
 * The sheet paints its error state yellow, because the original design had only
 * two accents and yellow was the nearest thing to a warning it owned. That does
 * not carry over here: `--warning` is this system's `secondary` button, so
 * errors would be the same colour as a secondary action. The error state uses
 * `--destructive`, the danger hue, and keeps the sheet's flex so an icon can be
 * dropped in front of the message.
 */
export const ERROR =
  'flex items-center gap-1.5 text-[12px] tracking-[-0.5px] text-destructive'

/**
 * The sheet's `.ds-affix__unit` and `.ds-affix__icon`: pinned to the control's
 * box, vertically centred, and never a click target — the affix is decoration, and
 * a pointer-events-owning overlay would swallow clicks meant for the field. Sized
 * in `cap` like `Button.Icon`, so one icon works at every field `size`.
 */
export const ICON = [
  'absolute inset-y-0 z-10 grid place-items-center pointer-events-none',
  'text-foreground/70',
  '[&>svg]:block [&>svg]:h-[1.5cap] [&>svg]:w-auto [&>svg]:shrink-0',
].join(' ')

/** The sheet insets both affixes 14px from their edge. */
export const ICON_POSITIONS = {
  start: 'start-3.5',
  end: 'end-3.5',
} as const

export type IconPosition = keyof typeof ICON_POSITIONS

/**
 * The invalid state of a control React Aria does not treat as a field, published by that control
 * itself.
 *
 * **Every other field here reads its invalid state from React Aria.** `TextField`, `Select`,
 * `Switch` and the rest are handed `isInvalid`, and React Aria publishes the
 * `FieldErrorContext` their `Error` slot renders from. `Slider` is left out of that anatomy:
 * `useSlider` takes no `isInvalid` at all, and a slider *thumb*'s is deprecated with no
 * replacement — which is why this component's docs never showed a `FieldError`. (`TokenField` is
 * left out for the same reason and stays out: its message can be neither rendered nor reached. See
 * docs/components/tokenfield.md.)
 *
 * So `Slider` publishes the context itself, from an `isInvalid` prop the caller owns. That is
 * exactly what an integration binding a slider to a form has: a value it validated and a failure it
 * has to report. What it is *not* is React Aria's form validation — the `validationErrors` a
 * `Form` carries are keyed by field name and read by React Aria's own fields, and a slider never
 * sees them.
 *
 * **`errorId` is minted by the control, not by the slot**, because the message and the element it
 * describes are two different slots and only the control can own the name they share.
 */
export const FieldValidationContext = createContext<FieldValidation | null>(
  null,
)

export interface FieldValidation {
  /** Whether the control's value is invalid. */
  isInvalid: boolean
  /** The id the control's error message wears, so the control is described by the message. */
  errorId: string
}

/**
 * The `ValidityState` of a field nothing is wrong with — React Aria's own shape for "there is no
 * native input to ask", which is the situation for a slider.
 *
 * It is never read: `FieldError` looks only at `isInvalid` and `validationErrors`, and the
 * rest travels to a render-function child that never asks. It is here because React Aria types the
 * context as a `ValidationResult`, and a field that claims to be valid should carry a valid
 * object rather than a cast.
 */
export const VALID: ValidityState = {
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: true,
  valueMissing: false,
}
