# BarChart

> **`className` is composed onto the `svg` now rather than replaced by it.** The element carried a
> hardcoded `block`, so the `className` this component publishes — and documents as the way to
> stretch a chart — reached nothing: a chart asked for `w-full` inside a card still rendered at its own
> 720px and ran past the card's edge. Found on `/create`, where the three drawings share one card;
> `Sparkline` and `FlatLine` already composed theirs, which is what made the one that did not visible.
> The `Stretch` story is what says so now.

A histogram — a row of bars over a dot-grid zone, with one of them allowed to be the current one.

```tsx
<BarChart
  values={[12, 30, 18, 44, 26, 9]}
  labels={['00', '04', '08', '12', '16', '20']}
  highlightIndex={3}
  label="Requests per four hours"
/>
```

| prop             | default | notes                                       |
| ---------------- | ------- | ------------------------------------------- |
| `values`         | —       | one bar each, oldest first                  |
| `labels`         | —       | one per bar, under it; omit for no axis row |
| `highlightIndex` | —       | the bar the page is about                   |
| `width`/`height` | 720/256 | user units **and** rendered px              |
| `label`          | —       | required; the drawing's only text           |

## What `drawBars` actually draws

Copied from `pulse-replica/js/system.js`, which is exactly four things:

1. a **dot-grid zone** across the plotting area — `rgba(255,255,255,.15)` dots, radius `1`, `7.7px` pitch.
   That is a **lighter** texture than the sparkline's `.32`/`0.9`: a bar chart is busy enough without the
   background competing with it.
2. a **baseline rule** — 1px at `rgba(255,255,255,.34)`. This is what makes the bars sit on something
   rather than float.
3. the **bars**, `--chart-1` grey except the flagged one, which is the accent.
4. the **axis row** below: the replica's `.dash-axis`, a relative 24px row with each label absolutely
   positioned under the centre of its bar. Placing them as percentages rather than pixels is what keeps
   them aligned when the chart stretches.

## `highlightIndex` is the replica's `b[3]` flag

This is the reason the component is a _monitoring_ chart rather than a plotting library. The interesting
bar is the one the page is about — the current hour, the breached window, the monitor you clicked — and a
colour that says which one costs nothing.

**Everything else is grey, deliberately.** `.ds-tag` and the segmented control spend the accent on the
thing that is _chosen_; a histogram is the same idea at chart scale, and a chart in which every bar is teal
has stopped saying which bar matters. The `Highlighted` story asserts exactly one accent bar — by counting
fills, not by trusting the prop.

## Two details that were got wrong first

**The `<pattern>` id is `useId`-derived.** The first version hardcoded `bar-chart-dots`. `<pattern>` ids are
document-global, so the second chart on a page would have painted the first one's dots and lost its own
zone the moment that one unmounted. `Sparkline` had already paid for this lesson.

**`--chart-1` is a new token, and it does not invert.** The replica's `--c-bar` is `#686d73` in a
dark-only sheet. Every other colour here is `light-dark(...)` because it carries text; a bar is a _measured
value_, so `ink`'s inversion rule does not apply. It is `oklch(45%)` in light against a white page and
`oklch(52%)` in dark — a mid grey in both.

## A picture, and the numbers belong beside it

The `<svg>` is `role="img"` with one `label`, so a screen reader hears "Requests per four hours" and not the
series. A chart cannot be read out through `role="img"` and this component does not pretend otherwise —
`role="img"` also hides its children from assistive tech, so per-bar `<title>` elements would be ignored.
Where the values are the point, render them as a `Table` next to it. `Sparkline`'s docs record the same
boundary.

## The hover readout, and the assertion that would have caught the zone

`BarChart` shows a value under the pointer, copied from `place()` in `pulse-replica/js/system.js`.
`dashboard.html` keeps a `.dash-tip--chart` panel (`#pc-tip`) and the script positions it on
`pointermove` — **with a tolerance rather than a per-bar event**: a bar whose x-range contains the pointer,
with 2 units of slack, wins outright; otherwise the nearest bar within 14 units is used; otherwise nothing
happens. That tolerance is why the readout feels attached to the chart rather than to a rectangle — a
pointer just past an edge still reads the bar.

The pointer is converted into the drawing's **own user units** before the hit test, exactly as the replica
does. Without that, a stretched chart reads the wrong bar — which is not hypothetical: the first version of
this story's test measured from the wrapper's width while assuming the drawing's 720, and asserted the
fourth bar while pointing at the third.

**It is `aria-hidden`.** A readout that exists only under a pointer is not available to a keyboard, so
announcing it would claim an affordance the component cannot keep. The values belong in a `Table` beside
the chart.

## The dot grid was never painting, and nothing said so

`<pattern id="bar-chart-dots">` kept a **hardcoded** id while the zone referenced `patternId` — a
`useId`-derived value that existed only in the class list. So `fill="url(#bar-chart-dots-…)"` pointed at a
definition that did not exist, and an SVG resolves a broken `url(#…)` to **transparent**: no error, no
warning, no visual difference from a zone that was never meant to be there.

Every assertion passed. They checked the bars, the baseline, the axis and the colours — the zone was checked
only by counting rects, and a rect that paints nothing still exists. There is now an assertion that the id
the zone **asks for** is the id the pattern **defines**, which is the only check that can fail for this.

It was fixed once before and the fix silently did not apply: the patch anchored on a single-line tag that
Prettier had already reflowed. That is the second time in this repo a scripted edit reported success and
changed nothing, and the reason the assertion above exists rather than the line being trusted.

## `drawDemoBars` is covered by this component

The replica has a second histogram function, `drawDemoBars`, and it is worth saying why there is no second
component for it. It draws the same four things as `drawBars` — the dot zone, the baseline rule, the bars,
the accent on one of them — and differs in exactly three numbers:

|             | `drawBars`                       | `drawDemoBars`                     |
| ----------- | -------------------------------- | ---------------------------------- |
| bar width   | fills its slot                   | a fixed `12.5`, on a `w / n` pitch |
| bar height  | `v / max` of the plotting height | the same, with a **6px floor**     |
| zone height | to `baseline`                    | to `h - 1`                         |

Those are parameter choices rather than a different drawing, and the floor is the only one with a
consequence: a bar of zero becomes a visible sliver. For a monitoring histogram that is a real ambiguity —
_no data_ and _zero_ look identical either way — and the axis row is what resolves it here, since it names
every bucket whether or not it drew. `drawBars` allows the flat zero and this follows it.

If a page needs the narrow fixed-width strip, that is `BarChart` with more space between bars than the
default `GAP`; it is not a second component.
