# ColorSwatchPicker

A row of preset colours, one of which is chosen.

```tsx
<ColorSwatchPicker aria-label="Label colour" defaultValue="#71FFF6">
  <ColorSwatchPicker.Item color="#71FFF6" />
  <ColorSwatchPicker.Item color="#FAD14F" />
  <ColorSwatchPicker.Item color="#FF9A8B" />
</ColorSwatchPicker>
```

| Slot                     | React Aria              | Notes                                  |
| ------------------------ | ----------------------- | -------------------------------------- |
| `ColorSwatchPicker`      | `ColorSwatchPicker`     | The set. `layout`, `value`, `onChange` |
| `ColorSwatchPicker.Item` | `ColorSwatchPickerItem` | One preset. `color` is required        |

It is a `listbox` named by its `aria-label`, and each square inside is an `option` — so a story queries
those roles rather than reaching for the component's own hooks.

## This is the half of the colour set that fits this design language

A palette of colours the system already has, not a spectrum. `ColorArea`, `ColorWheel` and
`ColorSlider` are for picking _any_ colour and would need a gradient Pulse does not contain; a picker
over five semantic accents is a decision someone can actually make.

**The palette is the consumer's**, deliberately. A swatch needs a concrete colour value, and this
system's colours are `light-dark()` pairs resolved by CSS — there is no token a swatch can be handed. So
the picker arranges presets; which presets is the application's business, exactly as `TagGroup` arranges
chips it is given. `ColorField` is the other half: for a colour already known, that needs typing.

## The ring is `--color-fg`, and this is the one place the accent cannot be used

Everywhere else a selected or current thing takes teal — a `Nav` item, a `Table` row, a `ToggleButton`.
**Here teal is one of the _choices_.** A teal ring around the teal swatch says nothing, and the same is
true of yellow, green and red. A marker that shares a colour with an option cannot say "this one", so the
ring is the text colour, which inverts with the theme (white on the dark page, near-black on the light)
and contrasts with all five swatches.

It is an `outline` at a **2px offset**, so it sits outside the square and the colour keeps its full 24px;
an inset border would eat a fifth of a swatch and change the colour it exists to show.

## The ring must be a transparent outline at rest — never `outline-none`

`outline-none` sets Tailwind's shared `--tw-outline-style` custom property, and every `outline-<width>`
utility reads that **same property back**. So once it is `none`, no ring on that element can ever draw
again — not even from a `data-[selected]:` variant, because the variant changes the width while the style
is still read from the variable.

The symptom is precise and quiet: the element reports `outline-width: 2px` with `outline-style: none`,
and looks perfectly styled. `Radio`, `Checkbox` and `Switch` already draw their rings as a transparent
outline at rest for exactly this reason, which is why theirs work. This component did not, and its first
two attempts drew nothing.
