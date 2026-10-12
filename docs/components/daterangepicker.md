# DateRangePicker

Two dates as one value — "when does this window start and end". The difference from two
`DatePicker`s is not cosmetic: a range has a validity of its own (the end cannot precede the
start), one calendar serves both ends, and the days between are shown as chosen rather than as
two unrelated picks.

```tsx
<DateRangePicker
  defaultValue={{
    start: parseDate('2026-10-11'),
    end: parseDate('2026-10-20'),
  }}
>
  <DateRangePicker.Label>Window</DateRangePicker.Label>
  <DateRangePicker.Group>
    <DateRangePicker.Input />
    <DateRangePicker.Button />
  </DateRangePicker.Group>
  <DateRangePicker.Hint>Your local time.</DateRangePicker.Hint>
</DateRangePicker>
```

| Slot                     | React Aria        | Notes                                      |
| ------------------------ | ----------------- | ------------------------------------------ |
| `DateRangePicker`        | `DateRangePicker` | Owns the range. `size` is `sm \| md \| lg` |
| `DateRangePicker.Label`  | `Label`           | The sheet's `.ds-field-legend`             |
| `DateRangePicker.Group`  | `Group`           | Leaves room for the chevron                |
| `DateRangePicker.Input`  | two `DateInput`s  | Both ends _and_ the separator, in one slot |
| `DateRangePicker.Button` | `Button`          | The chevron                                |
| `DateRangePicker.Hint`   | `Text`            | `slot="description"`                       |
| `DateRangePicker.Error`  | `FieldError`      | Renders nothing while valid                |

### One slot for both ends

`DateRangePicker.Input` draws the start input, the separator and the end input. React Aria needs
to be told which is which (`slot="start"` / `slot="end"`), and a consumer writing that by hand can
get it backwards in a way that still renders. Drawing it here also means the field's hairline is
drawn **once around both**, rather than twice with a seam down the middle — the two inputs share
one control, so `DateRangePicker.Input` is a `<div>` carrying the field's shape and the state
that lands on it comes from the root.

Because of that, its props are deliberately narrower than a `DateInput`'s: this is two inputs and
one control, so input-level props have no single input to go to.

### The shared anatomy, and the one part that is not

`src/components/date.tsx` holds everything the two date components do not differ on — the field
root, the caret, the trigger, the menu surface, the segment, the month's arrows, its heading, the
weekday row and the whole calendar chrome — the same split as `field.ts`. The slots are still
defined per component, so Storybook documents `DatePicker.Label` as `DatePicker.Label` rather
than as its neighbour's.

The one part that genuinely differs is the day. In a range **every day between the ends is
selected**, so the ends have to be told apart from the middle: the ends carry the accent whole,
the days between take it as a wash. Without that, a range reads as two separate picks that happen
to be far apart.

### Three rules that cannot both match

The obvious way to write that is an endpoint rule that out-specifies the wash. Both of the
obvious ways fail, and both fail silently:

- **Stacking two data variants does not compile.** `data-[selected][data-selection-start]:bg-teal`
  emits nothing at all — the selector never appears in the stylesheet, so the ends simply keep
  the wash and the day looks like every other day in the range.
- **A single `data-[selection-start]` ties with `data-[selected]`** — both are one variant — and
  loses on source order.

So the three rules are written to be **mutually exclusive** instead, and only ever one applies:

```
data-[selection-start]:bg-teal          the ends, whole
data-[selection-end]:bg-teal
data-[selected]:not-data-[selection-start]:not-data-[selection-end]:bg-teal/20   the middle, washed
```

### The chrome draws one grid per month

A multi-month calendar needs **one `CalendarGrid` per month, each with its own `offset`**. With a
single grid, `visibleDuration={{ months: 2 }}` renders a heading spanning both months above a grid
showing only the first — the heading promising something the grid does not deliver, which is
worse than not offering the prop. `DateCalendarChrome` takes `months` and draws that many.

### The states a range cannot put on its own control

`data-invalid` and `data-disabled` land on the picker's **root**, while the control they should
recolour is the `<div>` wrapping both inputs. So the shared root publishes `--field-border` for
invalid and `--date-control-opacity` for disabled, and the control reads them — the same
arrangement `Select` uses for its trigger, and for the same reason.

## Two months, always

The popover opens on **two months**, and it is not configurable:

```tsx
<DateRangePicker
  defaultValue={{
    start: parseDate('2026-10-11'),
    end: parseDate('2026-10-20'),
  }}
>
  <DateRangePicker.Label>Window</DateRangePicker.Label>
  <DateRangePicker.Group>
    <DateRangePicker.Input />
    <DateRangePicker.Button />
  </DateRangePicker.Group>
</DateRangePicker>
```

A range's two ends are rarely in the same month, so one month would make the common case a second
interaction. It was briefly a `visibleDuration` prop, and before that reachable only through a
`DateRangePicker.Calendar` slot; both are gone. The picker decides.

**Both halves have to agree.** React Aria's calendar and the shared `DateCalendarChrome` each need telling —
the calendar draws the heading, the chrome draws the grids. Handing the duration to only the first produces a
heading reading "October to November 2026" above a single grid of October days. A heading assertion passes
straight through that; the `TwoMonths` story asserts a **day in the second month**, which is what catches it.
