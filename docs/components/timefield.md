# TimeField

A time typed into a field — `DateField`'s sibling.

```tsx
<TimeField defaultValue={parseTime('09:30')}>
  <TimeField.Label>Opens at</TimeField.Label>
  <TimeField.Group>
    <TimeField.Input />
  </TimeField.Group>
  <TimeField.Error>Enter a time.</TimeField.Error>
</TimeField>
```

| Slot              | React Aria   | Notes                                     |
| ----------------- | ------------ | ----------------------------------------- |
| `TimeField`       | `TimeField`  | The value. `size`, and `granularity`      |
| `TimeField.Label` | `Label`      | The shared field legend                   |
| `TimeField.Group` | `Group`      | The bordered box the segments sit in      |
| `TimeField.Input` | `DateInput`  | The segments, drawn from the render props |
| `TimeField.Hint`  | `Text`       | `slot="description"`                      |
| `TimeField.Error` | `FieldError` | Renders nothing while valid               |

**It is `DateField` with hours and minutes instead of days.** Same slots, same `date.tsx` segments,
same field anatomy, and the same reason to exist: the segments are real, individually editable fields,
so the arrows step one of them and typing a digit advances to the next.

The two are kept as **separate compound components** rather than one with a flag, for the reason
`TextField` and `SearchField` are: Storybook derives the docs import line from the subcomponent's
value, so a shared slot would be documented under the wrong component's name. The constants they share
are the thing that must not drift — `date.tsx` and `field.ts` — and neither component owns those.

**A time field is narrow on purpose.** Two digits per segment, so the box is as wide as its contents
and no wider; stretched across a form column it reads as an empty text field rather than a filled one.

### An en-US locale adds a day-period segment

**Segments must be found by name, not by count.** `09:30` renders **three** segments in `en-US` —
hour, minute, and a day period (AM/PM) — so a "two segments" assertion counts three and fails against a
component that is working. Counting segments bakes the locale into the test.

`granularity` decides how many there are, so the same component covers a schedule and a stopwatch; both
stories look the segments up by `aria-label` instead.
