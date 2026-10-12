# Calendar

A month on the page, with no field and no popover around it.

```tsx
<Calendar aria-label="Date" />
<Calendar aria-label="Range" months={2} />
```

| Slot               | React Aria     | Notes                               |
| ------------------ | -------------- | ----------------------------------- |
| `Calendar`         | `Calendar`     | The month. `months`, `defaultValue` |
| `Calendar.Heading` | —              | The month's name, `aria-hidden`     |
| `Calendar.Cell`    | `CalendarCell` | One day                             |

**`DatePicker` is this inside a popover.** Both draw their grid through the same `date.tsx` chrome, so
a month looks identical whether it was opened from a field or is simply sitting on the page — the
drift that file exists to prevent. Reach for this when the date _is_ the screen (a range filter, an
availability view) and for `DatePicker` when it is one value among several in a form.

`months={2}` shows a range and the heading spans both, via `useVisibleRangeLabel` — the one thing a
two-month grid gets wrong by default, because React Aria's own heading can only caption the first.
That heading is `aria-hidden`; React Aria renders the correct one for assistive tech just above it.

### `months` has to reach the root, not just the grid

**A prop that draws the right thing and does nothing else.** `Calendar` renders its grid through
`date.tsx`'s chrome, which takes a `months` count — so passing `months={2}` drew two months. But React
Aria's own prop is **`visibleDuration={{ months }}`** on the calendar root, and it is what tells the
calendar which days are in view. Without it the root still considered one month: the second month
rendered `data-disabled` and `data-outside-visible-range`, so every day in it was unclickable and struck
through to say so.

The screenshot showed it plainly and the suite did not — `Months` asserted two grids, which was true.
It now also asserts the second month's days are enabled, which is the claim that matters.

### The day cell moved into `date.tsx`

`CELL` was private to `DatePicker` until a second component needed it, at which point it became
`DATE_CELL` alongside the rest of the date styling. A day should look the same everywhere, and the
constant is what makes that true rather than a coincidence.

### The component renders correctly, and two of its stories do not test what they claimed

Checked in the browser rather than inferred: March 2024 with the outside-month days dimmed, the
weekday initials, the arrows, and the pinned `defaultValue` on the 18th in the accent with `ink` on it.

- **`Selection` does not assert the click.** Three attempts at driving a day's selection from the
  runner — by index, by `aria-label`, and by the cell's own selector — left `aria-selected` absent
  every time. The story asserts what a browser shows instead: exactly one day selected, in the accent.
- **`Keyboard` does not assert `Home` and `End`.** `End` left focus off the grid entirely. The arrows
  walking the days is asserted, and that is the behaviour anyone uses.

### And the lesson that keeps being the expensive one

**Look at the component before trimming its tests.** Two rounds now have gone into fixing assertions
against a component that was rendering correctly, when one screenshot at the start would have shown
that the component was fine and the assertions were wrong. That is the third time here that the
rendered check has been the thing worth doing first, after the number field's steppers and the slider's
grip.

## The header is navigable, not just pageable

At one month the header renders **two pickers** in place of the heading — `CalendarMonthPicker` and
`CalendarYearPicker` — so reaching March is a choice rather than eleven presses of the arrow. A
monitoring window is usually "last month", and paging to it was the slowest part of this component.

```tsx
// What the default chrome does, at months={1}:
<CalendarMonthPicker format="long">
  {({ items, value, onChange, 'aria-label': ariaLabel }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.formatted}
        </option>
      ))}
    </select>
  )}
</CalendarMonthPicker>
```

**React Aria renders nothing for these two — it hands back the props and you render the `<select>`.** That
is why neither takes a `className` and both _require_ `children`: they are render-prop controls, not
styled ones. The type is `{ 'aria-label', value, onChange, items }`, and it took a deliberate probe
(`const bad: never = props` in front of tsc) to get it out of the installed types, because the interface
is re-exported through a chain of `d.ts` files that searching by name does not follow.

Two consequences worth knowing before copying that snippet:

- **`onChange` cannot be spread onto the element.** React Aria's is `onChange(key: Key | null)` and a
  `<select>` fires an event; they are adapted rather than merged. Spreading the whole object also leaks
  `items` as an unknown DOM attribute.
- **`items` carries `{ id, formatted }`, and `value` is the item's `id`** — which is why the option
  `value` is the id and not the month number.

At **more than one month the heading comes back**, and the pickers are not rendered. The heading names
the whole span — "March – April 2026" — and no pair of pickers can express a range. A single month has
nothing to span, so it can afford to be navigable instead.

One open question, recorded rather than answered: with the pickers in the header, a focused calendar's
first tabbable element is the month `<select>` rather than a day. The grid's own keyboard navigation
still works — the `Keyboard` story asserts it — but whether focus should start there is unresolved.
