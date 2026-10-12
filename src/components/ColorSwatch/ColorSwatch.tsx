import { ColorSwatch as AriaColorSwatch } from 'react-aria-components'
import type { ColorSwatchProps as AriaColorSwatchProps } from 'react-aria-components'

export interface ColorSwatchProps extends Omit<
  AriaColorSwatchProps,
  'className' | 'style' | 'children'
> {
  /** The colour to show. */
  color: AriaColorSwatchProps['color']
  className?: string
}

/**
 * The square a colour is shown in.
 *
 * **Shared, because a swatch is a swatch wherever it appears** — as a field's preview, as one entry in
 * a `ColorSwatchPicker`, or on its own beside a monitor's name. The picker imports this constant rather
 * than repeating it, the same call `field.ts` and `popover.ts` make.
 *
 * The colour is painted from React Aria's render prop, not from a token, because it *is* a colour —
 * arbitrary by definition. Everything around it still comes from the system: square corners, and a
 * control boundary on the edge so a near-black swatch on the dark page is still a swatch.
 */
export const SWATCH = [
  'size-6 shrink-0 rounded-none',
  'border border-input',
].join(' ')

/**
 * A colour, shown as a square.
 *
 * ```tsx
 * <ColorSwatch color={parseColor('#71FFF6')} />
 * ```
 *
 * **It is a picture of a colour, not a control.** For choosing one, `ColorSwatchPicker` is a row of
 * these that can be picked; for typing one, `ColorField` is a field. This is what you reach for when a
 * value already exists and simply needs to be *seen* — a monitor's label colour in a table row, a
 * legend beside a chart.
 *
 * **The wrapper is `aria-hidden`, and it has to be a wrapper.** React Aria renders its swatch as
 * `role="img"` and drops an `aria-hidden` written on it, so a purely decorative square announced itself
 * as an unnamed image — noise before the text that actually says which colour it is. Putting the
 * attribute on an element *around* it hides the whole subtree, which is what a picture of a colour
 * should be.
 */
export function ColorSwatch({ color, className }: ColorSwatchProps) {
  return (
    <span aria-hidden="true">
      <AriaColorSwatch
        data-slot="swatch"
        className={[SWATCH, className].filter(Boolean).join(' ')}
        style={({ color: c }) => ({ background: c.toString('css') })}
        color={color}
      />
    </span>
  )
}
