# NumberField

The sheet has no number field — only a number's _typography_, in `.ds-num`, `.ds-num-sm` and
`.ds-num-alt`. So the field is the shared anatomy every control here uses, and the sheet supplies
the type.

```tsx
<NumberField defaultValue={60} minValue={5} maxValue={600}>
  <NumberField.Label>Interval</NumberField.Label>
  <NumberField.Group>
    <NumberField.Input />
    <NumberField.Counter />
  </NumberField.Group>
  <NumberField.Hint>Seconds between checks.</NumberField.Hint>
</NumberField>
```

| Slot                  | React Aria    | Notes                                                |
| --------------------- | ------------- | ---------------------------------------------------- |
| `NumberField`         | `NumberField` | Owns the value. `size` is `sm \| md \| lg`           |
| `NumberField.Label`   | `Label`       | The sheet's `.ds-field-legend`                       |
| `NumberField.Group`   | `Group`       | The field, with the counter inside its trailing edge |
| `NumberField.Input`   | `Input`       | A text input underneath — see below                  |
| `NumberField.Counter` | two `Button`s | Both steppers, stacked. `+` on top                   |
| `NumberField.Hint`    | `Text`        | `slot="description"`                                 |
| `NumberField.Error`   | `FieldError`  | Renders nothing while valid                          |

### The sheet's numbers, without the sheet's yellow

Its figures are letterspaced and, being mono, already tabular — which is what makes a column of
them line up. The input takes both, so the digits do not shuffle sideways as they are typed.

The **yellow stays with the readouts**. `.ds-num` is an accent because a number in the sheet's
dashboard _is_ the point of the row; a number being typed is one value among the others on a form,
and a field that shouts is one nobody can read beside its neighbours. Same call as the table's
numeric column.

### One slot, not two

They are **one control** — two halves of a single column, which is how a spinner is read — so they
are `NumberField.Counter` rather than `.Increment` and `.Decrement`. Splitting them invited a
consumer to lay them out side by side, which is a different and worse thing: a wide, short pair is
not the shape anyone recognises a spinner by, and the two halves stop reading as one unit.

Stacked, `+` on top, the unit is a column the height of the field, and each half takes an equal
share of it at every size. A hairline runs between the halves and down the unit's leading edge —
the same divider the sheet draws between an input and its affix.

### It is the sheet's affix, and it has to be _inside_ the field

The sheet gives a field with a trailing affix room on that side and a hairline between them —
`.ds-input--unit` and `.ds-unit` — which is what this is: a 32px column positioned over the input's
trailing padding. `data-slot="counter"` is what asks the `Group` for the room, through a rule
`NumberField` owns (`COUNTER_GUTTER`) rather than one `field.ts` has to know about, because a text
field has no use for a counter.

Put them _after_ the input in the flex row instead and they land **outside the border**, because the
shared `INPUT` is `w-full` and `width` is `width`: the later class in Tailwind's order wins, not the
later class in the author's, so a `flex-1` on the input does not have the last word. This is the trap
`field.ts` avoids everywhere else by positioning affixes, and the first version of this component
walked straight into it.

`slot="increment"` and `slot="decrement"` are written by the component for the same reason
`Table.Selection` writes `slot="selection"`: the one attribute that makes it work is the one nobody
remembers, and getting it wrong still renders.

### The tests passed while the layout was wrong

Nine stories were green — value, stepping, bounds, typing, currency, sizes, read-only, disabled,
error — and the steppers were still rendering _outside_ the field. Every one of those asserts
behaviour; not one of them asserted **where the buttons were**. A suite that passes is not a
rendered check, and this is the second time that has been worth saying here.

If a component's shape is the thing you are unsure about, look at it. `Layout`-shaped assertions are
worth adding when a control is composed of parts whose positions are the point.

### Still a text input underneath

React Aria keeps it one, so it can be typed into, selected and undone like any other field while the
parsing and formatting happen around it. That is most of what a spinner bolted onto a `div` gives
up, and it is why `Typing` can assert that `abc` leaves the field **empty** rather than broken — an
empty number is a real state, which is why `onChange` hands back `number | null` and not a zero it
did not mean.

`formatOptions` is the other half of it: the same field is a money field when it needs to be, and
`Currency` is the story that pins it.

### Two props worth knowing

- **`step`** applies to the steppers _and_ to the arrow keys, which is usually the faster path.
- **`isWheelDisabled`** is worth turning on inside anything scrollable. A wheel meant for the page
  silently editing a number as it goes past is a small trap with no undo.
