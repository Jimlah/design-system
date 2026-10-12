# Sparkline

A single series over time with no axes and no labels — the shape of the last N readings in a table cell.

```tsx
<Sparkline data={[12, 18, 15, 24, 21, 30]} label="Requests, last 6 hours" />
```

| prop     | default | notes                                                  |
| -------- | ------- | ------------------------------------------------------ |
| `data`   | —       | oldest first, one point per reading                    |
| `width`  | `300`   | user units **and** rendered px; a class can stretch it |
| `height` | `84`    | same                                                   |
| `label`  | —       | required; a sparkline has no other text                |

## This is the replica's own chart

`pulse-replica/js/system.js` draws it in `drawSpark`, and the dashboard uses it at `300×84` in a monitor
row while the sheet uses `306×52`. So the anatomy is copied rather than invented:

- a **teal polyline**, `stroke-width: 2`, round joins and caps;
- over a **dot-grid zone** — `rgba(255,255,255,.32)` dots, radius `0.9`, pitch `7.7px`, drawn as an SVG
  `<pattern>` because a `<rect>` cannot take a CSS background;
- the zone starting 26/84 down and stopping 14/84 short of the bottom, so it reads as a texture behind the
  trend rather than as a filled area chart;
- `preserveAspectRatio="none"`, which is what lets one component serve both sizes.

Two departures from the replica, both deliberate:

- The stroke is `var(--primary)`, not the replica's `#71FFF6`. Same colour in dark, and it follows the
  token into the light theme — the replica is dark-only and can afford a literal.
- `vectorEffect="non-scaling-stroke"` keeps the line 2px when the box is not the viewBox's aspect ratio.
  Without it, stretching a 300×84 drawing into a 300×52 cell squashes the stroke with everything else.

The replica marks its sparklines `aria-hidden`. This one carries `role="img"` and a `label`, because a
monitor's trend is the entire content of the cell and a screen reader is otherwise told nothing.

## The chart tokens it draws from

`system.css` names the pieces for the charts generally, and they are the starting point for the full chart
component:

| token         | value                   | use                      |
| ------------- | ----------------------- | ------------------------ |
| `--c-bar`     | `#686d73`               | histogram bars           |
| `--line`      | `rgba(255,255,255,.62)` | hairline separators      |
| `--line-soft` | `rgba(255,255,255,.30)` | baselines, quiet strokes |
| `--dot`       | `rgba(255,255,255,.20)` | dot-grid texture         |

`.ds-dotgrid` is the same texture as a CSS background — `radial-gradient` dots on a `7.7px 7.7px` grid, with
an `--ink` variant at a heavier weight. The dashboards' chart zone also has a `.dash-axis` row: 24px tall,
labels absolutely positioned at percentages along it, and `.dash-tip--chart` for a tooltip the JS places by
writing `left`/`top`.

## The bug that a passing suite hid

The first version passed `width` and `height` only into the `viewBox`. An inline `<svg>` with a viewBox and no
CSS size **collapses to nothing** in a flex context — so the component drew a perfectly correct path into
invisible space, and a screenshot of its own Default story was an empty page.

Every assertion still passed, because they read the `d` attribute, the stroke colour and the dot zone: all
things about the _drawing_, none about the _box_. It now renders its own width and height, exactly as the
replica writes them on the element, and `Default` asserts the rendered box is 300×84 before it asserts
anything about the path. The same gap as `ToggleButton`'s off state and `TagGroup`'s remove button — **an
assertion about what was built is not an assertion about what is there.**
