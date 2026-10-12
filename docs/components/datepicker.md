# DatePicker

**The first component here with nothing to copy.** The sheet has no date picker in it — no
`.ds-date`, no calendar — so this follows the sheet's _language_ rather than its markup: square,
mono, the field's own hairline and focus, the select's menu surface, and the accent kept for the
day that is chosen. Where the sheet was silent, this is an invention, and it says so.

```tsx
<DatePicker defaultValue={parseDate('2026-10-11')}>
  <DatePicker.Label>Starts</DatePicker.Label>
  <DatePicker.Group>
    <DatePicker.Input />
    <DatePicker.Button />
  </DatePicker.Group>
  <DatePicker.Hint>Your local time.</DatePicker.Hint>
</DatePicker>
```

| Slot                | React Aria   | Notes                                      |
| ------------------- | ------------ | ------------------------------------------ |
| `DatePicker`        | `DatePicker` | Owns the value. `size` is `sm \| md \| lg` |
| `DatePicker.Label`  | `Label`      | The sheet's `.ds-field-legend`             |
| `DatePicker.Group`  | `Group`      | Leaves room for the chevron                |
| `DatePicker.Input`  | `DateInput`  | The date as segments                       |
| `DatePicker.Button` | `Button`     | The chevron                                |
| `DatePicker.Hint`   | `Text`       | `slot="description"`                       |
| `DatePicker.Error`  | `FieldError` | Renders nothing while valid                |

### The calendar is drawn for you

A picker without a calendar is not a picker, so `DatePicker` renders the popover and the whole
month itself and the field is the entire API. **The calendar is not replaceable** — the popover and the
month it opens are internal, so unlike `Select.Popover` there is nothing to pass in its place.

The reason is the same one that shaped `Select.AutoComplete`: React Aria builds a calendar from a
grid, a header, a body and two render props — six elements before a single day appears — and not
one of those is a decision the consumer is making. The calendar's own parts are internal for the same
reason: a slot that exists only so it can be taken apart publishes a surface nobody uses, and the `Pieces`
story that exercised it has been removed with them.

### The value is a `DateValue`, not a string

`defaultValue={parseDate('2026-10-11')}` and `onChange` hands back the same shape. That is what
keeps the field locale-aware: the segments, the month name and the order they appear in all
follow the locale rather than a format the code chose.

### What the calendar had to decide

Three states that are easy to collapse into one, and should not be:

| State                        | Treatment                              |
| ---------------------------- | -------------------------------------- |
| outside the month            | dimmed                                 |
| today                        | outlined in the accent, **not** filled |
| out of `minValue`/`maxValue` | dimmed _and_ struck through            |
| chosen                       | filled with the accent, carrying `ink` |

Leaving today looking exactly like every other day is the usual way a calendar makes someone
ask what today is. Out-of-range days stay in the grid rather than being removed — a month with
holes in it is much harder to read than one where the gaps are marked. And the chosen day is the
same pair the sheet uses for a checked box: an accent fill with `ink` on it.

A focused segment is **not** given that fill. A field's focus is a teal _border_ here, so filling
a segment in the accent would say "chosen" about a segment that is only being typed; it gets the
same faint wash the sheet puts behind a hovered option.

### Four things this cost, all worth writing down

- **`data-unavailable` and `data-disabled` are different attributes.** A day outside
  `minValue`/`maxValue` is `unavailable`; a day in a wholly disabled calendar is `disabled`. Both
  need the treatment, and styling only one leaves the other looking perfectly selectable.
- **The strike-through is on the cell, not on the button inside it.** The inner `role=button`
  reports `text-decoration: none` of its own, so asking it whether the day is struck out always
  says no. The cell carries `data-slot="cell"` so the test can address the right box.
- **React Aria renders the month heading twice** — once for the accessibility tree and once for
  the eye — so `getByText(/october 2026/)` finds two and fails. Ask for it by role: the duplicate
  is `aria-hidden`, so a role query sees one.
- **A story named `Error` shadows the global.** `new Error(…)` inside `DatePicker.stories.tsx`
  resolves to the story export, and TypeScript reports it as "not constructable" rather than as
  a name collision. Assert with `toBeInstanceOf` instead.

React Aria names the calendar button itself — "Calendar", from the field's context — so there is
nothing to pass and nothing to drift. `getByRole('button')` alone, then assert the name, rather
than matching on a string we did not write.
