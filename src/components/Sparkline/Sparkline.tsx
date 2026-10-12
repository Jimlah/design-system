import { useId } from 'react'

/**
 * A single series over time, with no axes and no labels — the shape of the last N readings, sized to sit
 * in a table cell.
 *
 * ```tsx
 * <Sparkline data={[12, 18, 15, 24, 21, 30]} label="Requests, last 6 hours" />
 * ```
 *
 * **This is the replica's own chart, not an invention.** `pulse-replica/js/system.js` draws it in
 * `drawSpark`: a teal polyline with round joins over a **dot-grid zone**, the line inset from the top and
 * the zone stopping short of the bottom so the two do not share an edge. The dashboard uses it at
 * `300×84` in a monitor row and the sheet at `306×52`; both are the same drawing at different sizes, which
 * is why every measurement here is a fraction of the box rather than a pixel value.
 *
 * Three things it inherits from the sheet and one it does not:
 *
 * - The stroke is `var(--color-teal)` rather than the replica's `#71FFF6`. Same colour in the dark theme,
 *   and it follows the token into the light one — the replica is dark-only, so it can afford the literal.
 * - The dots are `rgba(255,255,255,.32)` at a 0.9 radius on a 7.7px pitch, which is `.ds-dotgrid`'s texture
 *   at a heavier weight, drawn as an SVG `<pattern>` because a `<rect>` cannot take a CSS background.
 * - `preserveAspectRatio="none"` so the drawing stretches to whatever box it is given — the replica sets it
 *   for the same reason, and it is what lets one component serve a 300px cell and a 52px one.
 *
 * **It is a picture, not a control.** There is no hover, no tooltip and no focus: the numbers behind it are
 * a chart's job, and this is the thumbnail. The `<svg>` carries `role="img"` and a `label`, because the
 * replica marks its own sparklines `aria-hidden` and a screen reader is then told nothing at all — a
 * monitor's trend is the point of the cell.
 */
export interface SparklineProps {
  /** The series, oldest first. One point per reading. */
  data: number[]
  /** Width in user units. Stretches to the box it is given. */
  width?: number
  /** Height in user units. Stretches to the box it is given. */
  height?: number
  /** What this series is, for a screen reader. A sparkline has no other text. */
  label: string
  className?: string
}

/** Where the dot-grid zone starts, as a fraction of the height — 26/84 in the replica. */
const DOT_TOP = 26 / 84
/** Where it stops, as a fraction — the replica leaves 14/84 clear below it. */
const DOT_BOTTOM = 14 / 84

/** Half the 2px stroke, so a point on the edge of the data range is not clipped by the viewBox. */
const INSET = 1

function toPath(data: number[], width: number, height: number) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  // A flat series has no range to scale into; draw it down the middle rather than dividing by zero.
  const span = max - min || 1
  const usableHeight = height - INSET * 2
  return data
    .map((value, index) => {
      const x =
        data.length === 1
          ? width / 2
          : INSET + (index / (data.length - 1)) * (width - INSET * 2)
      const y = INSET + (1 - (value - min) / span) * usableHeight
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function Sparkline({
  data,
  width = 300,
  height = 84,
  label,
  className,
}: SparklineProps) {
  // `<pattern>` ids are document-global, so two sparklines on a page would otherwise share the first
  // one's dots — and the second would disappear when the first unmounted.
  const id = useId()
  const patternId = `sparkline-dots-${id}`
  const zoneTop = height * DOT_TOP
  const zoneHeight = height - zoneTop - height * DOT_BOTTOM

  return (
    <svg
      data-slot="sparkline"
      // **The width and height are rendered, not only declared in the viewBox.** An inline `<svg>`
      // carrying a viewBox and no CSS size collapses to nothing in a flex context — the first version of
      // this component did exactly that, drew a perfectly correct path into invisible space, and passed
      // its own tests, which checked the `d` attribute and never the box. The replica writes
      // `width="300" height="84"` on the element for the same reason; a `className` can still stretch it,
      // which is what `preserveAspectRatio="none"` is for.
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <pattern
          id={patternId}
          width="7.7"
          height="7.7"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.9" cy="0.9" r="0.9" fill="rgba(255,255,255,0.32)" />
        </pattern>
      </defs>
      <rect
        data-slot="sparkline-zone"
        x="0"
        y={zoneTop}
        width={width}
        height={zoneHeight}
        fill={`url(#${patternId})`}
      />
      <path
        data-slot="sparkline-line"
        d={toPath(data, width, height)}
        fill="none"
        stroke="var(--color-teal)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
