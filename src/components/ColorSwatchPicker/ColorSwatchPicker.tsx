import {
  ColorSwatch as AriaColorSwatch,
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
} from 'react-aria-components'
import type {
  ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps,
  ColorSwatchPickerProps as AriaColorSwatchPickerProps,
} from 'react-aria-components'

import type { ReactNode } from 'react'

import { SWATCH } from '../ColorSwatch/ColorSwatch'

/** How the swatches sit: in a row, or stacked. Chosen in JS, because the layout is a class list. */
const LAYOUTS = {
  grid: 'flex flex-row flex-wrap items-center gap-2',
  stack: 'flex flex-col items-start gap-2',
} as const

/**
 * One preset. Use it as `ColorSwatchPicker.Item`.
 *
 * **The ring is `--foreground`, and this is the one place in the system the accent cannot be used.**
 * Everywhere else a selected or current thing takes teal — a `Nav` item, a `Table` row, a
 * `ToggleButton`. Here teal is one of the *choices*: a teal ring around the teal swatch says nothing, and
 * the same is true of yellow, green and red. A marker that shares a colour with an option cannot say
 * "this one", so the ring is the text colour, which inverts with the theme and contrasts with all five.
 *
 * The ring is drawn with `outline` at a 2px offset, so it sits *outside* the square and the colour keeps
 * its full 24px; an inset border would eat a fifth of a swatch and change the colour it exists to show.
 *
 * **The ring needs a transparent outline at rest, not `outline-none`.** `outline-none` sets Tailwind's
 * shared `--tw-outline-style` custom property, and every `outline-<width>` utility reads that same
 * property back — so once it is `none`, no ring on this element can draw again, not even from a
 * `data-[selected]:` variant. The swatch reported `outline-width: 2px` with `outline-style: none` while
 * looking perfectly styled. `Radio`, `Checkbox` and `Switch` already do it this way, which is why their
 * rings work.
 *
 * Exported as `ColorSwatchPickerItem` only so tooling can resolve it; consume the compound form
 * `ColorSwatchPicker.Item`.
 */
export function ColorSwatchPickerItem({
  className,
  color,
  ...props
}: AriaColorSwatchPickerItemProps) {
  return (
    <AriaColorSwatchPickerItem
      data-slot="swatch-option"
      color={color}
      className={[
        // The square itself is `ColorSwatch`'s, composed rather than repeated — a swatch has to look
        // the same whether it is being shown or being picked.
        SWATCH,
        // **A transparent outline at rest, never `outline-none`.** `outline-none` sets Tailwind's shared
        // `--tw-outline-style` custom property, and every `outline-<width>` utility reads that same
        // property back — so once it is `none`, *no* ring on this element can ever draw again, not even
        // from a `data-[selected]:` variant. The swatch reported `outline-width: 2px` and
        // `outline-style: none` while looking perfectly styled. `Radio`, `Checkbox` and `Switch` already
        // draw their rings this way, which is why theirs work.
        'cursor-pointer outline-2 outline-offset-2 outline-transparent',
        'transition-[outline-color] duration-[120ms] ease-pulse',
        'data-[selected]:outline-foreground',
        'data-[focus-visible]:outline-foreground',
        'data-[hovered]:border-foreground',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <AriaColorSwatch
        className="block size-full"
        style={({ color: c }) => ({ background: c.toString('css') })}
      />
    </AriaColorSwatchPickerItem>
  )
}

export interface ColorSwatchPickerProps extends Omit<
  AriaColorSwatchPickerProps,
  'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'layout'
> {
  /** The chosen colour. Controlled. */
  value?: AriaColorSwatchPickerProps['value']
  /** The colour it starts on. */
  defaultValue?: AriaColorSwatchPickerProps['defaultValue']
  /** Called with the chosen colour. */
  onChange?: AriaColorSwatchPickerProps['onChange']
  /** `grid` puts the swatches in a row, `stack` in a column. */
  layout?: AriaColorSwatchPickerProps['layout']

  className?: string
  children?: ReactNode
}

/**
 * A row of preset colours, one of which is chosen.
 *
 * ```tsx
 * <ColorSwatchPicker aria-label="Label colour" defaultValue="#71FFF6">
 *   <ColorSwatchPicker.Item color="#71FFF6" />
 *   <ColorSwatchPicker.Item color="#FAD14F" />
 *   <ColorSwatchPicker.Item color="#FF9A8B" />
 * </ColorSwatchPicker>
 * ```
 *
 * **This is the other half of the colour set**, and the half that fits this design language: a palette
 * of colours the system already has, not a spectrum. `ColorArea`, `ColorWheel` and `ColorSlider` are for
 * picking *any* colour and would need a gradient Pulse does not contain; a picker over five semantic
 * accents is a decision someone can actually make.
 *
 * **The palette is the consumer's**, deliberately. A swatch needs a concrete colour value, and this
 * system's colours are `light-dark()` pairs resolved by CSS — there is no token a swatch can be handed.
 * So the picker arranges presets; which presets is the application's business, exactly as `TagGroup`
 * arranges chips it is given.
 *
 * Use `ColorField` instead when the colour is already known and needs typing or pasting — this is for
 * choosing from a set the application offers.
 */
function ColorSwatchPickerRoot({
  className,
  children,
  layout = 'grid',
  ...props
}: ColorSwatchPickerProps) {
  return (
    <AriaColorSwatchPicker
      data-slot="swatch-picker"
      className={[LAYOUTS[layout], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaColorSwatchPicker>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const ColorSwatchPicker = Object.assign(ColorSwatchPickerRoot, {
  Item: ColorSwatchPickerItem,
})
