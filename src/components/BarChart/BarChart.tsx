import { useId, useRef, useState } from 'react'

import { CHART_TOOLTIP } from '../chartTooltip'

/**
 * A histogram — a row of bars over a dot-grid zone, with one of them allowed to be the current one.
 *
 * ```tsx
 * <BarChart
 *   values={[12, 30, 18, 44, 26, 9]}
 *   labels={['00', '04', '08', '12', '16', '20']}
 *   highlightIndex={3}
 *   label="Requests per four hours"
 * />
 * ```
 *
 * **Copied from `drawBars` in `pulse-replica/js/system.js`**, which draws exactly four things:
 *
 * 1. a **dot-grid zone** across the whole plotting area — `rgba(255,255,255,.15)` dots, radius `1`, on a
 *    `7.7px` pitch. That is a *lighter* texture than the sparkline's `.32`/`0.9`: a bar chart is busy
 *    enough without the background competing with it;
 * 2. a **baseline rule** — a 1px rule at `rgba(255,255,255,.34)`, which is what makes the bars sit on
 *    something instead of floating;
 * 3. the **bars**, each `--c-bar` grey, except the one the caller flags, which is drawn in the accent;
 * 4. the **axis row** below, labels absolutely positioned under the bar they name — the replica's
 *    `.dash-axis`, a 24px relative row with each label placed by percentage.
 *
 * **`highlightIndex` is the replica's `b[3]` flag**, and it is the reason this is a monitoring chart rather
 * than a plotting library: the interesting bar is the one the page is about — the current hour, the
 * breached window, the monitor you clicked — and a colour that says which one costs nothing.
 *
 * **Grey rather than accent for the rest, deliberately.** `.ds-tag` and the segmented control spend the
 * accent on the thing that is *chosen*; a histogram is the same idea at chart scale. A chart in which
 * everything is teal has stopped saying which bar matters.
 *
 * **The hover readout is the replica's `place()`.** `dashboard.html` keeps a `.dash-tip--chart` panel
 * (`#pc-tip`) and `system.js` positions it on `pointermove` with a hit rule rather than a per-bar event: a
 * bar whose x-range contains the pointer, with 2 units of slack, wins outright; otherwise the nearest bar
 * within 14 units is used; otherwise nothing happens. That tolerance is what makes the readout feel attached
 * to the chart rather than to a rectangle — a pointer just past a bar's edge still reads it.
 *
 * **It is `aria-hidden`, deliberately.** A readout that exists only under a pointer is not available to a
 * keyboard, so announcing it would claim an affordance the component cannot keep. The values belong in a
 * `Table` beside the chart — the boundary `Sparkline` and `FlatLine` record too.
 * **The drawing is a picture; the numbers belong beside it.** The `<svg>` is `role="img"` with one
 * `label`, so a screen reader hears "Requests per four hours" and not the series — a chart cannot be read
 * out through `role="img"` and this component does not pretend otherwise. Where the values are the point,
 * render them as a table next to it; `Table` is already here, and `Sparkline`'s docs record the same
 * boundary.
 */
export interface BarChartProps {
  /** One bar per value, oldest first. */
  values: number[]
  /** One per value, under its bar. A bar with no label simply gets none. */
  labels?: string[]
  /** The bar the page is about. It is drawn in the accent; every other bar is `--chart-1`. */
  highlightIndex?: number
  /** Width in user units **and** rendered px. A `className` can stretch it. */
  width?: number
  /** Height in user units and rendered px, excluding the axis row. */
  height?: number
  /** What this chart is, for a screen reader. It is the only text the drawing has. */
  label: string
  className?: string
}

/** The gap between bars, in user units — the replica's own spacing is in its data, so this is the one
 *  number not copied from it. */
const GAP = 2

export function BarChart({
  values,
  labels,
  highlightIndex,
  width = 720,
  height = 256,
  label,
  className,
}: BarChartProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  // `<pattern>` ids are document-global: a fixed one means the second chart on a page paints the first
  // one's dots and loses its own zone when that one unmounts.
  const patternId = `bar-chart-dots-${useId()}`
  const max = Math.max(...values, 0)
  // A series of zeroes has no range to scale into. Dividing by one draws nothing rather than a `NaN`
  // rect, which the browser reports as no error at all.
  const span = max || 1
  const slot = values.length ? width / values.length : width
  const barWidth = Math.max(1, slot - GAP)
  const baseline = height

  return (
    <div
      ref={wrapper}
      data-slot="bar-chart"
      className={['relative flex flex-col', className]
        .filter(Boolean)
        .join(' ')}
      onPointerMove={(event) => {
        const box = wrapper.current?.getBoundingClientRect()
        if (!box || !values.length || box.width === 0) return
        // The pointer in the chart's own user units, which is what the bars are laid out in — the replica
        // converts the same way, and without it a stretched chart reads the wrong bar.
        const x = ((event.clientX - box.left) / box.width) * width
        let nearest: number | null = null
        let nearestDistance = Infinity
        for (let index = 0; index < values.length; index += 1) {
          const start = index * slot + GAP / 2
          if (x >= start - 2 && x <= start + barWidth + 2) {
            nearest = index
            nearestDistance = 0
            break
          }
          const distance = Math.abs(x - (start + barWidth / 2))
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearest = index
          }
        }
        setHovered(nearestDistance <= 14 ? nearest : null)
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <svg
        data-slot="bar-chart-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="block"
      >
        <defs>
          <pattern
            id={patternId}
            width="7.7"
            height="7.7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.15)" />
          </pattern>
        </defs>
        <rect
          data-slot="bar-chart-zone"
          x="0"
          y="0"
          width={width}
          height={baseline}
          fill={`url(#${patternId})`}
        />
        <rect
          data-slot="bar-chart-baseline"
          x="0"
          y={baseline - 1}
          width={width}
          height="1"
          fill="rgba(255,255,255,0.34)"
        />
        {values.map((value, index) => {
          const barHeight = (value / span) * (baseline - 2)
          return (
            <rect
              key={index}
              data-slot="bar-chart-bar"
              data-highlighted={index === highlightIndex ? 'true' : undefined}
              x={index * slot + GAP / 2}
              y={baseline - 1 - barHeight}
              width={barWidth}
              height={barHeight}
              fill={
                index === highlightIndex
                  ? 'var(--color-primary)'
                  : 'var(--color-chart-1)'
              }
            />
          )
        })}
      </svg>
      {hovered !== null ? (
        <div
          data-slot="bar-chart-tooltip"
          aria-hidden="true"
          className={`${CHART_TOOLTIP} -top-1`}
          style={{ left: `${((hovered + 0.5) / values.length) * 100}%` }}
        >
          {labels?.[hovered] ? `${labels[hovered]} · ` : ''}
          {values[hovered]}
        </div>
      ) : null}
      {labels ? (
        // The replica's `.dash-axis`: a relative row with each label placed under the centre of its bar,
        // so it stays aligned when the chart stretches.
        <div data-slot="bar-chart-axis" className="relative mt-2 h-4">
          {labels.map((text, index) => (
            <span
              key={index}
              data-slot="bar-chart-axis-label"
              className="absolute top-0 -translate-x-1/2 font-mono text-[11px] tracking-[0.04em] text-foreground/70 uppercase"
              style={{ left: `${((index + 0.5) / labels.length) * 100}%` }}
            >
              {text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
