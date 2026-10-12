# RangeCalendar

Two months at once, with a span of days between them.

```tsx
<RangeCalendar aria-label="Range" />
<RangeCalendar aria-label="Range" defaultValue={{ start, end }} />
```

| Slot                    | React Aria      | Notes                             |
| ----------------------- | --------------- | --------------------------------- |
| `RangeCalendar`         | `RangeCalendar` | The range. `months` defaults to 2 |
| `RangeCalendar.Heading` | —               | The months' names, `aria-hidden`  |
| `RangeCalendar.Cell`    | `CalendarCell`  | One day, with the ends marked     |

**`DateRangePicker` is this inside a popover.** Same chrome, same `DATE_CELL`, same segments — a day
looks the same wherever it is drawn, which is what `date.tsx` exists for.

**A range is two endpoints and everything between them**, which is more state than a single date: the
first click sets the start and it waits, the second sets the end, a third starts over. `CalendarCell`
puts `data-selection-start` and `data-selection-end` on the ends only, so the ends and the days between
them can be styled apart — the span is what makes a range readable at a glance rather than two loose
dates.

**Two months by default.** A range that crosses a month boundary is the normal case, not the exception,
and one month makes the user page back and forth to see what they just selected.

### A range calendar has its own state context

`RangeCalendarStateContext`, not `CalendarStateContext`. Both are provided, and the wrong one does not
throw — it simply carries no `visibleRange`, so the heading rendered **empty**: a blank caption above a
perfectly correct grid. `DatePicker` uses the first and `DateRangePicker` the second, and the difference
is invisible until the heading is missing.
