import { useId } from 'react'

/**
 * A series that never varied — a monitor at 100% — as one flat rule near the top of its box.
 *
 * ```tsx
 * <FlatLine label="fra1 uptime, 100%" />
 * <FlatLine height={52} lineY={6} label="iad1 uptime, 100%" />
 * ```
 *
 * **This is `drawFlat` from `pulse-replica/js/system.js`, whose own comment calls it the "flat 100%
 * line".** A sparkline is a series scaled to its own range, and a series with no range has nothing to
 * scale into — which is why the replica has a *separate function* for this case rather than a branch
 * inside `drawSpark`. That separation is the whole point: drawing a flat series through the middle of
 * the box, as a naive scale would, says "average"; drawing it at the top says "perfect, and it stayed
 * that way", which is what an uptime line at 100% means.
 *
 * It draws two things, in this order:
 *
 * 1. a **dot-grid zone** from five units below the rule to the bottom of the box — the same `.32`
 *    weight as the sparkline's, because this is a sparkline's neighbour;
 * 2. the **rule itself**, 2px of accent, full width.
 *
 * **`lineY` is in user units, not a fraction, and that is deliberate.** The replica draws it at `y=1` in
 * an 84-tall box and at `y=6` in a 52-tall one — 1.2% and 11.5%. Those are not the same fraction, so the
 * value is a distance from the top rather than a proportion, and treating it as a proportion would move
 * the line in one of the two places the replica uses it.
 */
export interface FlatLineProps {
  /** Width in user units **and** rendered px. A `className` can stretch it. */
  width?: number
  /** Height in user units and rendered px. */
  height?: number
  /** Where the rule sits, in user units from the top. The replica's own values are 1 and 6. */
  lineY?: number
  /** What this line says, for a screen reader. It is the drawing's only text. */
  label: string
  className?: string
}

/** How far below the rule the texture starts — the replica's `y + 5`. */
const ZONE_GAP = 5

export function FlatLine({
  width = 300,
  height = 84,
  lineY = 1,
  label,
  className,
}: FlatLineProps) {
  // `<pattern>` ids are document-global, so two of these on a page would otherwise share the first one's
  // dots. `BarChart` and `Sparkline` both learned this the same way.
  const patternId = `flat-line-dots-${useId()}`
  const zoneTop = lineY + ZONE_GAP

  return (
    <svg
      data-slot="flat-line"
      // Rendered as well as declared in the viewBox — a viewBox with no size collapses to nothing, which
      // is how the Sparkline shipped invisible for a round.
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
        data-slot="flat-line-zone"
        x="0"
        y={zoneTop}
        width={width}
        height={Math.max(0, height - zoneTop)}
        fill={`url(#${patternId})`}
      />
      <rect
        data-slot="flat-line-rule"
        x="0"
        y={lineY - 1}
        width={width}
        height="2"
        fill="var(--color-teal)"
      />
    </svg>
  )
}
