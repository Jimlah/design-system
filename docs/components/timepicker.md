# TimePicker

A time, typed or chosen — `TimeField` with a picker attached.

```tsx
<TimePicker defaultValue={parseTime('09:30')} minuteStep={15}>
  <TimePicker.Label>Opens at</TimePicker.Label>
  <TimePicker.Group>
    <TimePicker.Input />
    <TimePicker.Button />
  </TimePicker.Group>
  <TimePicker.Hint>Business hours only.</TimePicker.Hint>
</TimePicker>
```

| Slot                | React Aria   | Notes                                      |
| ------------------- | ------------ | ------------------------------------------ |
| `TimePicker`        | `TimeField`  | Owns the value. `size` is `sm \| md \| lg` |
| `TimePicker.Label`  | `Label`      | The shared field legend                    |
| `TimePicker.Group`  | `Group`      | Leaves room for the chevron                |
| `TimePicker.Input`  | `DateInput`  | The segments, drawn from the render props  |
| `TimePicker.Button` | `Button`     | The chevron that opens the wheel           |
| `TimePicker.Hint`   | `Text`       | `slot="description"`                       |
| `TimePicker.Error`  | `FieldError` | Renders nothing while valid                |

### The wheel is drawn for you, and it stays open

A picker without a wheel is not a picker, so `TimePicker` renders the popover and the three columns
itself, and the field is the entire API — as in `DatePicker`, the popover and its contents are
internal and cannot be replaced.

**Picking does not close it, and that is the one place this differs from `DatePicker`.** A day is one
decision, so choosing one closes the calendar. A time is two, three or four — hour, minute, and then
seconds or a day period if the field has them — and closing after the hour would send the reader back to
the field to start again. Enter and Escape close it; Escape is React Aria's own, and Enter is captured
before the option under the keyboard can consume it, because by then the option has nothing left to do:
the value was committed when the arrows moved focus onto it.

### It is `TimeField`, not a second time field

`TimePicker` wraps React Aria's `TimeField`, so the segments, the label, the hint, the error and the
validation are the field's — the same ones `TimeField` publishes, through the same `field.ts` and
`date.tsx` recipes. What the picker adds is the trigger, the panel and the wheel; what it does not add
is a second way to type a time.

The value is a `TimeValue`, not a string. `parseTime('09:30')` reads an ISO time and `onChange` hands
back the same shape, which is what keeps the segments, the order they appear in and the wheel's own
numbering following the locale rather than a format the code chose.

### Every column follows a segment

**The wheel offers exactly what the field shows, and that is a rule rather than a coincidence.** A
`TimePicker` built with `granularity="second"` has a second segment, so its wheel has a seconds column;
a minute field has neither and gets neither; a 24-hour locale has no day period to name, so there is no
AM/PM column. Offering seconds to a field that cannot show them writes a value nobody can read back, and
hiding them from a field that has them throws away the precision it was built for.

That is why the seconds column appears from `granularity` and not from a prop of its own: the segments
are the field's own answer, read from the `TimeFieldState` React Aria publishes, which is the same state
that draws them. `secondStep` then decides how far apart the seconds in that column are — one by default,
so every second the field can hold — and `minuteStep` does the same for the minutes.

### The wheel asks the field what its hour cycle is

**Nothing here decides between 12-hour and 24-hour time.** The hour column is built from the hour
segment's own `minValue`/`maxValue`, and the day-period column exists only when the field's segments
contain a `dayPeriod` — both read from the `TimeFieldState` React Aria publishes, which is the same
state that draws the segments. An `en-US` clock gets twelve hours and an AM/PM column; `en-GB` gets
twenty-four and none; a locale whose hour runs `0–11` gets that. A second, independent decision about
the hour cycle is how a wheel ends up offering 12 next to a field that has no such segment.

The AM/PM labels come from the same formatter the field uses, so a `ja-JP` field reads `午前` in the
segment and in the wheel. Hardcoded `AM`/`PM` would put the two halves of one component at odds.

### What the columns had to decide

| State                        | Treatment                                |
| ---------------------------- | ---------------------------------------- |
| out of `minValue`/`maxValue` | dimmed to 30%, and skipped by the arrows |
| chosen                       | filled with the accent, carrying `ink`   |
| hovered / focused            | the sheet's faint wash                   |

Out-of-range times stay in the column rather than being removed — a column with holes in it is harder
to read than one where the gaps are marked. A **whole hour** is only dimmed when every minute in it is
outside the window: with `minValue` at `09:30`, hour 09 is offered because 09:59 is inside it, and a
column that dropped the hour a reader is living in would be unusable. Choosing it then **clamps** —
09:00 lands on 09:30 — so arrow-scrubbing across a boundary stays inside the window instead of asking
the field to reject its own value.

The hover and focus washes are qualified with `not-data-[selected]` so a chosen time keeps the accent
under the pointer and under the keyboard. Written without it, the two rules set the same property at the
same specificity, and which one wins is the order Tailwind emits them in — a coin toss the source
cannot show you.

### The behaviour is React Aria's, not a re-implementation

Each column is a React Aria `ListBox`, and the wheel's whole keyboard story is that choice:

- **`selectionBehavior="replace"` commits as focus moves**, so `ArrowDown` changes the value with no
  Space to confirm — the reason a wheel beats typing into segments.
- **`autoFocus` lands on the value that is set**, not on the first row, because React Aria's autofocus
  prefers a selected key. It also scrolls that option into view.
- **`disabledKeys` keeps the arrows off everything outside `minValue`/`maxValue`**, and typeahead
  (`45` in the minutes column) comes free with the collection.
- **Left and right move between the columns**, landing on the value each one holds so the next arrow
  steps from what is set — and the seconds column is part of that walk, not an afterthought beside it.
  The direction follows the locale: in RTL, `ArrowLeft` moves forward. Tab also moves between them,
  because React Aria treats each list as one tab stop.

The wheel is a row of columns rather than a clock face for the same reason: a list box can be read,
typed into and walked with the arrow keys, and its options carry `data-selected` and `data-disabled` for
the eye. There are three of them for a minute field and four when the field holds seconds — which is also
why a seconds wheel is wider than the field it belongs to, and the popover grows to fit the wheel rather
than the trigger.

### Four things this cost, all worth writing down

- **A bare `Time` cannot be committed.** React Aria types `setValue` for a date field and takes every
  plain value through `toCalendar`, which asks the value for its calendar — and `@internationalized/date`'s
  `Time` deliberately has none, so `timeState.setValue(new Time(9, 30))` throws. The wheel commits a
  `CalendarDateTime` carrying the field's own date, and `useTimeFieldState` maps what it emits back
  through `toTime`, so `onChange` still receives a `Time`.
- **`timeValue` is declared non-nullable and is `null` while the field is empty**, because React Stately
  computes it from the value. An empty field opens the wheel on its **placeholder** rather than on a
  time this component picked — the same midnight the segments are showing, or whatever `placeholderValue`
  says. That is why `placeholderValue` is published here and not on `TimeField`.
- **`minValue`, `maxValue` and `placeholderValue` are not on the state.** React Aria consumes all three
  when it builds `TimeFieldState` and does not publish them again, so they travel to the wheel through
  this component's own context rather than being read back off the state.
- **React Aria scrolls the column it focuses, and only that one.** The hours column is autofocused when
  the wheel opens, so it arrives on the value that is set — and a seconds column of sixty opened at `00`
  with the second it was set to somewhere below the fold, which looks exactly like a column that ignored
  the value. The wheel now scrolls every column to its own selected row, on the render _after_ the
  collection exists (React Aria builds it a commit late, which is why its own autofocus retries), and
  again whenever what the wheel is showing changes — but not while a reader is scrolling a column they
  are browsing, because browsing changes no value.

### Form behaviour is the field's

A `TimePicker` carries exactly the form plumbing a `TimeField` has, because it _is_ one — native
constraint validation through `validationBehavior`, the `FieldError` slot, `validate`, and React Aria's
hidden input. It does not add a hidden input of its own, and that is deliberate: React Aria sets the
hidden input's `form` attribute to `''` (`react-aria-components/src/HiddenDateInput.tsx`) so a time
field's value is not submitted with a form. A second, submittable input here would make `TimePicker` and
`TimeField` disagree about the same value.

### The trigger is disabled with the field

React Aria's own `DatePicker` leaves its chevron enabled on a disabled field, and the input dims alone.
Here the trigger dims and disables with it: a picker that cannot be edited must not open a panel that
would write to it. Read-only is not an exception — there is nothing to invite a click on.
