# ColorField

A colour typed into a field, with a square showing what it is.

```tsx
<ColorField defaultValue={parseColor('#71FFF6')}>
  <ColorField.Label>Label colour</ColorField.Label>
  <ColorField.Control>
    <ColorField.Swatch />
    <ColorField.Input />
  </ColorField.Control>
  <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
  <ColorField.Error>That is not a colour.</ColorField.Error>
</ColorField>
```

| Slot                 | React Aria   | Notes                                      |
| -------------------- | ------------ | ------------------------------------------ |
| `ColorField`         | `ColorField` | The value. `channel`, `colorSpace`         |
| `ColorField.Label`   | `Label`      | The shared field legend                    |
| `ColorField.Control` | —            | The row the swatch and the input share     |
| `ColorField.Swatch`  | —            | The current colour as a square             |
| `ColorField.Input`   | `Input`      | The control — a text field that parses hex |
| `ColorField.Hint`    | `Text`       | `slot="description"`                       |
| `ColorField.Error`   | `FieldError` | Renders nothing while valid                |

**It is a text field whose value happens to be a colour**, which is why it wears `field.ts`'s whole
anatomy and inherits every rule that file already establishes — the read-only behaviour, the resting
boundary, the focus-wins-over-invalid order. A field that looked like a native `<input type="color">`
swatch would be the one control here with a different shape.

**The square is a swatch, not the control.** The control is the text: a colour is something people
paste, and typing one is faster than dragging a picker to the value already in hand.

## Why there is a `.Control` slot

`ColorField`'s children are the **whole column**, not a row — its own element is the field, exactly as
`TextField`'s is, so the legend, the control and the hint are its direct children. The swatch and the
input _are_ a row, so they need one element between them and the column.

Getting this wrong is what cost this component a round: without `.Control` the hint rendered **beside**
the input, and four restructurings did not fix it because the cause was not where it looked. The
`Layout` story now asserts the three tops in order, which is the assertion that would have caught it
on the first run.

## `colorValue`, not `value`

`useColorFieldState` gives `{ inputValue, colorValue, setColorValue, setInputValue, commit, increment,
decrement, validate }` — **there is no `value`**. `.Swatch` reads `colorValue` so it cannot disagree
with what is in the input, the arrangement `Meter.Fill` and `Nav.Label` use.

An empty field paints **nothing**: a black square would claim there was a value, and there is not —
the same distinction a progress bar draws between "unknown" and "zero".

## `colorSpace` is not free-form

`colorSpace="oklch"` is a **type error** — the accepted `ColorSpace` values do not include it, even
though an `oklch(...)` _value_ parses and renders correctly. So a colour field can hold this system's
tokens but cannot offer their notation as a typing mode. Worth knowing before promising it.

## This is not a colour picker

`ColorArea`, `ColorWheel` and `ColorSlider` exist in React Aria for that, and they would need a
spectrum this design language does not have — Pulse's palette is four semantic accents, not a
gradient. A field is the honest half of the colour set to build here.
