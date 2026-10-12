# FlatLine

A series that never varied — a monitor at 100% — as one flat rule near the top of its box.

```tsx
<FlatLine label="fra1 uptime, 100%" />
<FlatLine height={52} lineY={6} label="iad1 uptime, 100%" />
```

| prop     | default | notes                                |
| -------- | ------- | ------------------------------------ |
| `width`  | `300`   | user units **and** rendered px       |
| `height` | `84`    | same                                 |
| `lineY`  | `1`     | distance from the top, in user units |
| `label`  | —       | required; the drawing's only text    |

## It is a separate component because a flat series has no range

`drawFlat` in `pulse-replica/js/system.js` carries the comment **"flat 100% line"**, and it exists as its
own function rather than as a branch inside `drawSpark` — which is the interesting part.

A sparkline scales its data into its box. A series where every value is identical has **no range to scale
into**, so a naive implementation divides by zero, and the well-meaning fallback — draw it through the
middle — says _average_. For an uptime monitor that is exactly wrong: a line that never moved is at 100%,
and 100% is the **top** of the box. The replica's answer is a separate function with an explicit `y`, and
this is that function.

The two call sites are `y=1` in an 84-tall box and `y=6` in a 52-tall one — **1.2% and 11.5%**. Those are
not the same fraction, which is why `lineY` here is a _distance_ and not a proportion: treating it as a
proportion would move the line in one of the two places the replica uses it. `Short` is the story with the
second of those values.

## What it draws

1. a **dot-grid zone** from five units below the rule to the bottom — the `.32` weight, the same as the
   sparkline's, because this sits beside one;
2. the **rule**: 2px of accent, full width, at `lineY - 1` so its own height is centred on `lineY`.

The gap is what keeps the rule reading as a line _over_ a texture rather than as the top edge of a filled
area — the same distinction `Sparkline` makes by starting its zone 26/84 down.

Two lessons carried in from the components either side: the `width`/`height` are **rendered** as well as
declared in the viewBox (the Sparkline shipped invisible for a round by declaring only the viewBox), and
the `<pattern>` id is `useId`-derived (`BarChart` had it hardcoded, and two charts on a page would have
shared the first one's dots).
