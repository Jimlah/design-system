# ColorSwatch

A colour, shown as a square.

```tsx
<ColorSwatch color={parseColor('#71FFF6')} />
```

**It is a picture of a colour, not a control.** For choosing one, `ColorSwatchPicker` is a row of these
that can be picked; for typing one, `ColorField` is a field. This is what you reach for when a value
already exists and simply needs to be _seen_ — a monitor's label colour in a table row, a legend beside
a chart.

## The wrapper is `aria-hidden`, and it has to be a wrapper

React Aria renders its own swatch as **`role="img"`** and drops an `aria-hidden` written on it, so a
purely decorative square announced itself as an unnamed image — noise before the text that actually
says which colour it is. Putting the attribute on an element _around_ it hides the whole subtree, which
is what a picture of a colour should be. That was found by asserting the attribute and getting `null`
back from a component that looked correct.

## `SWATCH` is shared

The class list is exported, and `ColorSwatchPicker.Item` composes it rather than repeating it — a
swatch has to look the same whether it is being shown or being picked, the same rule `field.ts`,
`date.tsx` and `popover.ts` exist for. The square is 24px, square-cornered, and carries
`--input` on its edge so a near-black swatch on the dark page is still a swatch.
