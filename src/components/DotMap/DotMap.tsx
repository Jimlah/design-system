import { useEffect, useRef, useState } from 'react'

import { CHART_TOOLTIP } from '../chartTooltip'
import type { MapDot } from './worldDots'

/**
 * A world map drawn as dots on a `<canvas>`, with the ones that matter in the accent.
 *
 * ```tsx
 * import { WORLD_DOTS } from './worldDots'
 * <DotMap dots={WORLD_DOTS} label="Request origins, last hour" />
 * ```
 *
 * **The drawing is `drawMap` from `pulse-replica/js/system.js`.** Every point is a `2.6×2.6` square
 * centred on its coordinate, filled either near-white or with a dimmer teal. The replica builds those as
 * `<rect>` elements inside an `<svg>`; this draws the same squares with `fillRect`, because ~850 DOM nodes
 * for one picture is the cost the canvas exists to avoid. The replica's staggered fade-in is not copied —
 * a page-level flourish rather than a property of the map.
 *
 * **Canvas costs three things SVG gave for free, and each is handled rather than ignored:**
 *
 * 1. **A canvas cannot read `var()` or `color-mix()`.** `fillStyle` needs a concrete colour, so the two
 *    fills are resolved by assigning them to the element's own `color` and reading back what the browser
 *    computed — which is what makes `light-dark()` and the `color-mix` derivations work here at all. The
 *    canvas has no text, so using its `color` as the probe changes nothing on screen.
 * 2. **A canvas has to be redrawn when the theme changes.** The tokens are CSS, so flipping `data-theme`
 *    changes what they resolve to without touching this component. A `MutationObserver` on the document
 *    element redraws; without it the map keeps the colours of whichever theme was active when it mounted.
 * 3. **The readout cannot be a `<foreignObject>`**, because there is no SVG. It is an HTML panel in a
 *    wrapper around the canvas, positioned by percentage exactly as `BarChart`'s is.
 *
 * **The device pixel ratio is applied, not assumed.** The canvas's `width`/`height` attributes are its
 * *bitmap* size while its CSS size is the box, so a retina display draws a blurry map unless the bitmap is
 * scaled up and the context scaled back down. `width`/`height` here are user units and CSS pixels; the
 * bitmap is `dpr ×` that.
 *
 * **The map is fitted to its box by default, and the replica's caller is why.** The data's range is about
 * `x 81–482`, `y 144–401` — 401 tall — while the zone `dashboard.html` gives it is `528×380`. The comment
 * there says the dots are *"scaled ~0.93 into a 528×380 zone, centered"*, and that scaling lives in the
 * page, not in `drawMap`. `fitDots` is exported because that is now the geometry worth testing directly:
 * with the drawing on a canvas there are no longer any dots in the DOM to inspect.
 *
 * **Two colours, both derived.** The replica writes `#5be4dc` for an accented dot and
 * `rgba(255,255,255,.85)` for the rest. The first is the accent about 12% toward ink — a small dot at full
 * accent is a glare. The second is `--color-fg` at 85%: white on the dark theme, near-black on the light
 * one, which is the behaviour a map on a white page needs and the replica never had to consider.
 *
 * **The readout is opt-in through the data.** The replica's `GEO_DOTS` is bare geometry with no values, so
 * its map has no tooltip and could not have one. Give a dot a fourth element and it becomes hoverable: the
 * map finds the nearest labelled dot within 10 units of the pointer. Unlabelled dots are skipped, so a
 * pointer over the ocean finds nothing rather than the nearest coastline fragment. It is `aria-hidden` for
 * the same reason the chart's is — it exists only under a pointer, so announcing it would claim an
 * affordance this cannot keep.
 */
export interface DotMapProps {
  /** Dot centres. `[x, y]` for a plain dot, `[x, y, 1]` for one in the accent, `[x, y, 1, label]`. */
  dots: MapDot[]
  /** Width in user units **and** CSS pixels. */
  width?: number
  /** Height in user units and CSS pixels. */
  height?: number
  /** Scale and centre the points into the box. Off for coordinates already in the box's units. */
  fit?: boolean
  /** What this map shows, for a screen reader. It is the drawing's only text. */
  label: string
  className?: string
}

/** The replica's dot: a 2.6-unit square, which is what makes the coastline read at a distance. */
const DOT = 2.6
/** Breathing room when fitting, in user units, so an edge dot is not half outside the box. */
const PAD = 3
/** How close the pointer must be to a labelled dot, in user units. */
const HIT_RADIUS = 10

/** The two fills, written the way the design system expresses them. Resolved before use — see above. */
const FILL_ACCENT =
  'color-mix(in oklch, var(--color-teal) 88%, var(--color-ink))'
const FILL_PLAIN = 'color-mix(in oklch, var(--color-fg) 85%, transparent)'

/**
 * Scale and centre a set of points into a box, keeping each dot's accent flag and label.
 *
 * **Exported because it is the part of this component that can be tested.** While the map was an SVG, the
 * stories could read every `<rect>` back out of the DOM and check where it landed; a canvas has no such
 * elements, so the geometry moved into a pure function and is asserted directly instead of through pixels.
 */
export function fitDots(
  dots: MapDot[],
  width: number,
  height: number,
  pad: number = PAD,
): MapDot[] {
  if (!dots.length) return dots
  const xs = dots.map((d) => d[0])
  const ys = dots.map((d) => d[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const scale = Math.min(
    (width - pad * 2) / (maxX - minX || 1),
    (height - pad * 2) / (maxY - minY || 1),
  )
  const offsetX = (width - (maxX - minX) * scale) / 2
  const offsetY = (height - (maxY - minY) * scale) / 2
  return dots.map(
    (d) =>
      [
        (d[0] - minX) * scale + offsetX,
        (d[1] - minY) * scale + offsetY,
        ...d.slice(2),
      ] as MapDot,
  )
}

export function DotMap({
  dots,
  width = 528,
  height = 380,
  fit = true,
  label,
  className,
}: DotMapProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<MapDot | null>(null)
  const draw = fit ? fitDots(dots, width, height) : dots

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const context = element.getContext('2d')
    if (!context) return

    const paint = () => {
      // The bitmap is dpr × the box, and the context is scaled back so everything below draws in user
      // units. Without both halves a retina display gets a quarter-resolution map.
      const dpr = window.devicePixelRatio || 1
      element.width = Math.round(width * dpr)
      element.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      // A canvas cannot use `var()` or `color-mix()`. Assigning the expression to the element's own
      // `color` and reading it back lets the browser do the computation — which is what keeps
      // `light-dark()` and the token derivations working here. The canvas has no text to recolour.
      const resolve = (expression: string) => {
        element.style.color = expression
        const computed = getComputedStyle(element).color
        element.style.color = ''
        return computed || '#888'
      }
      const accent = resolve(FILL_ACCENT)
      const plain = resolve(FILL_PLAIN)

      for (const dot of draw) {
        context.fillStyle = dot[2] === 1 ? accent : plain
        context.fillRect(dot[0] - DOT / 2, dot[1] - DOT / 2, DOT, DOT)
      }
    }

    paint()
    // The tokens are CSS, so a theme switch changes what they resolve to without touching this component.
    // Observing the document element is what stops the map keeping the theme it mounted in.
    const observer = new MutationObserver(paint)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    })
    return () => observer.disconnect()
  }, [draw, width, height])

  return (
    <div
      data-slot="dot-map"
      className={['relative', className].filter(Boolean).join(' ')}
      style={{ width, height }}
      onPointerMove={(event) => {
        const box = canvas.current?.getBoundingClientRect()
        if (!box || box.width === 0) return
        // The pointer in the drawing's own units. Each axis is converted against its own dimension,
        // because the canvas stretches to its box independently of its bitmap.
        const x = ((event.clientX - box.left) / box.width) * width
        const y = ((event.clientY - box.top) / box.height) * height
        let nearest: MapDot | null = null
        let nearestDistance = Infinity
        for (const dot of draw) {
          if (typeof dot[3] !== 'string') continue
          const distance = Math.hypot(dot[0] - x, dot[1] - y)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearest = dot
          }
        }
        setHovered(nearestDistance <= HIT_RADIUS ? nearest : null)
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <canvas
        ref={canvas}
        data-slot="dot-map-canvas"
        role="img"
        aria-label={label}
        className="block size-full"
      />
      {hovered ? (
        <div
          data-slot="dot-map-tooltip"
          aria-hidden="true"
          className={`${CHART_TOOLTIP} -top-2 w-max`}
          style={{
            left: `${(hovered[0] / width) * 100}%`,
            top: `${(hovered[1] / height) * 100}%`,
          }}
        >
          {hovered[3]}
        </div>
      ) : null}
    </div>
  )
}
