# RangeCalendar

> **The caption joins its months itself, and the reason is server rendering.** `Intl#formatRange` leaves
> the range separator's spaces to the runtime's own ICU, and the two runtimes on either side of an SSR
> are not the same ICU: measured, `en-GB` came out as `March<U+2009>–<U+2009>April 2024` on this app's
> dev server and `March<U+0020>–<U+0020>April 2024` in Chrome — the same words with different
> whitespace, which was enough for React to throw the tree away and re-render it on every load of a page
> with a two-month calendar on it. `date.tsx` formats each month and joins them, so the caption is this
> component's typography rather than the environment's.
>
> React Aria's **own accessible name** for the grid is still a `formatRange` string, so an SSR'd
> two-month calendar still logs one _attribute_ mismatch — that `aria-label` — when the two ICUs
> disagree. React does not patch attributes, so the server's version, thin spaces and all, is what stays
> in the DOM. It is upstream, it is invisible, and it is written down here rather than hidden.

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
