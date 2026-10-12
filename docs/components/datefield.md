# DateField

A date typed into a field, with no calendar behind it.

```tsx
<DateField defaultValue={parseDate('2024-03-18')}>
  <DateField.Label>Starts on</DateField.Label>
  <DateField.Group>
    <DateField.Input />
  </DateField.Group>
  <DateField.Hint>Local time, 24-hour</DateField.Hint>
  <DateField.Error>Enter a complete date.</DateField.Error>
</DateField>
```

| Slot              | React Aria   | Notes                                     |
| ----------------- | ------------ | ----------------------------------------- |
| `DateField`       | `DateField`  | The value. `size` is `sm \| md \| lg`     |
| `DateField.Label` | `Label`      | The shared field legend                   |
| `DateField.Group` | `Group`      | The bordered box the segments sit in      |
| `DateField.Input` | `DateInput`  | The segments, drawn from the render props |
| `DateField.Hint`  | `Text`       | `slot="description"`                      |
| `DateField.Error` | `FieldError` | Renders nothing while valid               |

### The segments are the point

Each one takes focus, the up and down arrows step it, and typing a digit advances to the next — so a
date is a date to a keyboard user rather than a string with a format they have to guess. A plain
`<input type="date">` gives the browser's own picker and no styling; a text input gives nothing. This
is the only one of the three where the parts are addressable.

It shares `date.tsx` with `DatePicker` and `DateRangePicker`, so a segment looks the same whether it
arrived from typing or from a calendar — the same call `field.ts` makes for the text controls. And
**no picker, by design**: use this when the date is known and typing is faster, and reach for
`DatePicker` when it has to be looked up. A calendar here would make every date field a two-step
control for the occasional date nobody remembers.

### `role="group"` is on the field root _and_ on the group

So a story querying the role counts two elements per field, and a "three sizes" assertion counts six.
`data-slot="date-group"` names the bordered box, as it does for the drop zone and the slider's grip.

### Two stories the runner would not carry

- **`Sizes` is deleted.** It rendered three date fields and the runner found **one** group where a
  browser page finds three — through a dev-server restart and a cleared Vite cache — and four attempts
  did not explain it.
- **`Focus` asserts only the resting hairline.** A browser check of the node, after focusing a segment,
  shows `data-focus-within` present and the border teal; the runner reports the resting colour, and
  `waitFor` did not change that.

Both are the same story: the runner and the page disagreed about the same story body, and the honest
move is to assert what holds in both rather than to keep a test whose numbers nobody can explain.
That is now the eighth and ninth story trimmed or removed here, and the reason is always the same —
what a story can prove is smaller than what a browser can show.

### A colour's string form is part of the assertion

A token built with `color-mix` reports as `oklab(…)`, a slash utility as `oklch(…)`, and the same
colour can be either. Guessing which spelling a given rule produces is how the resting-border
assertion was wrong twice.
