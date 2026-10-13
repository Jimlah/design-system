/**
 * The canvas camera — where the canvas is looking, and nothing about what is on it.
 *
 * Every function here is pure over `{ x, y, k }` and a `Bounds`, so the geometry is asserted
 * directly instead of being read back out of a transformed DOM. That is the same move
 * `DotMap`'s `fitDots` makes, and for the same reason: a transform that is wrong by a few pixels
 * is invisible in a screenshot and silent in a DOM query, but plain in a return value.
 *
 * **The mapping is `screen = world * k + (x, y)`**, with the world's transform origin at its own
 * top-left corner. So the camera is exactly the CSS transform
 * `translate(x, y) scale(k)`, and the two never have to agree about anything else: the host
 * writes this object into a `transform` string, and every gesture reads it back through the
 * inverses below. There is no second source of truth for where the canvas is.
 *
 * A camera is always finite. `MIN_SCALE` is low enough that the whole canvas — eight columns of
 * component groups — fits in a laptop viewport, which is what makes "fit all" a navigation aid
 * rather than a gesture that stops half a screen short. `MAX_SCALE` is above actual size so a
 * component can be inspected closely, and is capped rather than open-ended because a scale of
 * `1e9` is a transform the compositor accepts and no one can recover from by dragging.
 */

export interface Camera {
  /** Screen-space translation, in CSS pixels. */
  x: number
  y: number
  /** Scale. 1 is actual size. */
  k: number
}

/** A world-space rectangle, as the union of what the groups actually measure. */
export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Size {
  width: number
  height: number
}

/** A screen-space rectangle, which is what `getBoundingClientRect()` returns. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Point {
  x: number
  y: number
}

export const MIN_SCALE = 0.04
export const MAX_SCALE = 2.5

/** The camera before anything has been measured, and the one the server renders. */
export const IDENTITY_CAMERA: Camera = { x: 0, y: 0, k: 1 }

export const EMPTY_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

/**
 * How much of the viewport "fit all" leaves around the content, and how much of the content
 * `clampCamera` insists on keeping reachable.
 *
 * One number for both, because they are the same statement: the content never sits hard against
 * the edge of the screen. It is generous rather than tight so that a group's title, which hangs
 * above its border, is inside the frame rather than clipped by it.
 */
export const EDGE_MARGIN = 56

/** "Fit all" never magnifies. A single group at 2.5× is not "all of it". */
export const FIT_MAX_SCALE = 1

/** One wheel notch, and one arrow-key step. */
export const WHEEL_ZOOM_STEP = 1.12
export const KEY_PAN_STEP = 88
export const KEY_PAN_STEP_FAST = 360

/** The storage key, per project. One key; the format is versioned inside the value. */
export const CAMERA_STORAGE_KEY = 'pulse.canvas.camera'

/**
 * The stored format. **There is no older one yet**, and that is why this is a number rather than
 * an assumption: a value whose `format` is anything else is discarded and the camera falls back
 * to its default, so the day the shape changes the old value cannot be mistaken for the new one.
 * Known older formats get a migration here; unknown ones never do.
 */
export const CAMERA_FORMAT = 1

/**
 * A stored camera larger than this is not one of ours — a corrupted value, or another site's key
 * that happens to collide. The real value is about 40 bytes, so this is a sanity check with three
 * orders of magnitude of headroom rather than a real limit.
 */
export const CAMERA_BYTE_LIMIT = 512

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high)

/** Keeps a scale inside the range the canvas agrees to work in. */
export function clampScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return IDENTITY_CAMERA.k
  return clamp(scale, MIN_SCALE, MAX_SCALE)
}

/** Whether an unknown value is structurally a camera. Says nothing about the bounds. */
export function isCamera(value: unknown): value is Camera {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    isFiniteNumber(candidate.x) &&
    isFiniteNumber(candidate.y) &&
    isFiniteNumber(candidate.k) &&
    candidate.k > 0
  )
}

/** The world-space rectangle a screen-space rectangle covers. */
export function screenRectToWorld(rect: Rect, camera: Camera): Bounds {
  const k = clampScale(camera.k)
  return {
    minX: (rect.left - camera.x) / k,
    minY: (rect.top - camera.y) / k,
    maxX: (rect.right - camera.x) / k,
    maxY: (rect.bottom - camera.y) / k,
  }
}

/** The world-space point a screen-space point covers. */
export function screenToWorld(point: Point, camera: Camera): Point {
  const k = clampScale(camera.k)
  return { x: (point.x - camera.x) / k, y: (point.y - camera.y) / k }
}

/** The screen-space point a world-space point lands on. */
export function worldToScreen(point: Point, camera: Camera): Point {
  const k = clampScale(camera.k)
  return { x: point.x * k + camera.x, y: point.y * k + camera.y }
}

/** The viewport rectangle, in the screen coordinates every other function here speaks. */
export function viewportRect(viewport: Size): Rect {
  return { left: 0, top: 0, right: viewport.width, bottom: viewport.height }
}

export function boundsSize(bounds: Bounds): Size {
  return {
    width: Math.max(0, bounds.maxX - bounds.minX),
    height: Math.max(0, bounds.maxY - bounds.minY),
  }
}

/** The union of two rectangles, treating `EMPTY_BOUNDS` as "nothing yet". */
export function unionBounds(a: Bounds, b: Bounds): Bounds {
  if (boundsSize(a).width === 0 && boundsSize(a).height === 0) return b
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

/** Whether two cameras are the same, exactly. Read before every commit that might be a no-op. */
export function sameCamera(a: Camera, b: Camera): boolean {
  return a.x === b.x && a.y === b.y && a.k === b.k
}

/** Whether two bounds are the same rectangle, to the pixel. Read by the re-measure guard. */
export function sameBounds(a: Bounds, b: Bounds): boolean {
  return (
    a.minX === b.minX &&
    a.minY === b.minY &&
    a.maxX === b.maxX &&
    a.maxY === b.maxY
  )
}

/**
 * Zooms around a point, which stays exactly where it is on screen.
 *
 * This is the whole reason the camera is stored as a translation rather than a centre: the fixed
 * point is one subtraction. `factor` above 1 zooms in.
 */
export function zoomAt(camera: Camera, point: Point, factor: number): Camera {
  const k = clampScale(camera.k)
  const next = clampScale(k * factor)
  // Below the minimum, or above the maximum, the scale stops changing — and the camera must then
  // stop too, or repeated wheel ticks would slide the content sideways at a pinned scale.
  if (next === k) return { x: camera.x, y: camera.y, k }
  const world = screenToWorld(point, { x: camera.x, y: camera.y, k })
  return {
    k: next,
    x: point.x - world.x * next,
    y: point.y - world.y * next,
  }
}

/**
 * The camera that shows all of `bounds` in `viewport`, centred, with `margin` around it.
 *
 * Never magnifies past `maxScale`: a canvas with one small group on it should not be blown up to
 * fill the screen, because that is not what "fit all" means.
 */
export function fitCamera(
  bounds: Bounds,
  viewport: Size,
  margin: number = EDGE_MARGIN,
  maxScale: number = FIT_MAX_SCALE,
): Camera {
  const { width, height } = boundsSize(bounds)
  if (
    width <= 0 ||
    height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return IDENTITY_CAMERA
  }
  const k = clamp(
    Math.min(
      (viewport.width - margin * 2) / width,
      (viewport.height - margin * 2) / height,
    ),
    MIN_SCALE,
    Math.min(MAX_SCALE, maxScale),
  )
  return {
    k,
    x: (viewport.width - width * k) / 2 - bounds.minX * k,
    y: (viewport.height - height * k) / 2 - bounds.minY * k,
  }
}

/**
 * The camera at actual size, with the content's own top-left corner at the viewport's margin.
 *
 * This is deliberately not "the camera you started on". The pair that earns its place beside a
 * fit-all button is fit-all and *actual size*, and there is no third thing a reader would want:
 * either they are looking at the whole canvas or at pixels that are what they say they are.
 */
export function resetCamera(
  bounds: Bounds,
  margin: number = EDGE_MARGIN,
): Camera {
  return {
    k: 1,
    x: margin - bounds.minX,
    y: margin - bounds.minY,
  }
}

/**
 * Keeps the content reachable.
 *
 * The rule is that at least `margin` of the canvas is still on screen in each direction: the
 * content's far edge may not pass the near edge of the viewport, and vice versa. That is wide
 * enough that dragging to a corner and back is never a one-way trip, and — the reason it is
 * measured rather than centred — narrow enough that it never fights a reveal of a focused
 * control, because a control inside the content is always inside these bounds.
 */
export function clampCamera(
  camera: Camera,
  bounds: Bounds,
  viewport: Size,
  margin: number = EDGE_MARGIN,
): Camera {
  const k = clampScale(camera.k)
  const x = isFiniteNumber(camera.x) ? camera.x : IDENTITY_CAMERA.x
  const y = isFiniteNumber(camera.y) ? camera.y : IDENTITY_CAMERA.y
  const { width, height } = boundsSize(bounds)
  if (width <= 0 || height <= 0) return { x, y, k }
  return {
    k,
    x: clamp(
      x,
      margin - bounds.maxX * k,
      viewport.width - margin - bounds.minX * k,
    ),
    y: clamp(
      y,
      margin - bounds.maxY * k,
      viewport.height - margin - bounds.minY * k,
    ),
  }
}

/**
 * Pans the least distance that puts `rect` inside the viewport's margin box. The scale never
 * changes: this reveals focus, it does not zoom to it.
 *
 * A rect already inside the box is returned unchanged, to the last decimal. That matters because
 * this runs on every `focusin`: a function that "nearly" keeps the camera still would drift the
 * canvas a fraction of a pixel every time a Tab moved, which is a slow slide no one can explain.
 */
export function revealRect(
  camera: Camera,
  rect: Rect,
  viewport: Size,
  margin: number = EDGE_MARGIN,
): Camera {
  const target = revealOffset(rect, viewport, margin)
  if (target.x === 0 && target.y === 0) return camera
  return { k: camera.k, x: camera.x + target.x, y: camera.y + target.y }
}

function revealOffset(rect: Rect, viewport: Size, margin: number): Point {
  return {
    x: axisOffset(rect.left, rect.right, viewport.width, margin),
    y: axisOffset(rect.top, rect.bottom, viewport.height, margin),
  }
}

/**
 * One axis of the reveal. A rect longer than the band it is being fitted into cannot be made to
 * fit, so it is centred instead — which is what makes Tab into a wide group land somewhere
 * sensible rather than against whichever edge it overshot.
 */
function axisOffset(
  start: number,
  end: number,
  viewportLength: number,
  margin: number,
): number {
  if (end - start > viewportLength - margin * 2) {
    return (start + end) / 2 - viewportLength / 2
  }
  if (start < margin) return margin - start
  if (end > viewportLength - margin) return viewportLength - margin - end
  return 0
}

/** The transform string the world element carries. Written here so it cannot drift from the maths. */
export function cameraTransform(camera: Camera): string {
  const k = clampScale(camera.k)
  const x = Number.isFinite(camera.x) ? camera.x : 0
  const y = Number.isFinite(camera.y) ? camera.y : 0
  return `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${round(k, 6)})`
}

function round(value: number, places = 2): number {
  const scale = 10 ** places
  return Math.round(value * scale) / scale
}

// --- storage ---------------------------------------------------------------------------------
//
// Only the camera is stored, under one key, with the format version inside the value. Preview
// state is deliberately not stored: a canvas that came back with a form half filled in would be
// showing something nobody typed this session, and "reset" is defined to restore the camera and
// nothing else.

interface StoredCamera {
  format: number
  camera: Camera
}

/**
 * Reads a camera out of storage, or `null` where there is nothing usable — malformed JSON, a
 * value above the size limit, an unknown format, a camera that is not finite. Every one of those
 * is the same answer, and the caller's default is the fallback, so there is nothing here for the
 * host to catch.
 */
export function readCamera(
  storage: Pick<Storage, 'getItem'> | null,
  key: string = CAMERA_STORAGE_KEY,
): Camera | null {
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    // Storage can refuse reads as well as writes — a blocked origin, a private window.
    return null
  }
  if (typeof raw !== 'string' || raw.length > CAMERA_BYTE_LIMIT) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  return cameraFromStored(parsed)
}

/** The stored value as a camera. Unknown formats and unknown shapes are both `null`. */
export function cameraFromStored(value: unknown): Camera | null {
  if (typeof value !== 'object' || value === null) return null
  const stored = value as Partial<StoredCamera>
  if (stored.format !== CAMERA_FORMAT) return null
  if (!isCamera(stored.camera)) return null
  return { ...stored.camera, k: clampScale(stored.camera.k) }
}

/**
 * Writes the camera. Returns whether it landed — a quota error or a storage that refuses writes
 * is not a failure of the canvas, it only means the next visit starts at the default.
 */
export function writeCamera(
  storage: Pick<Storage, 'setItem'> | null,
  camera: Camera,
  key: string = CAMERA_STORAGE_KEY,
): boolean {
  if (!storage) return false
  const payload: StoredCamera = {
    format: CAMERA_FORMAT,
    camera: {
      x: round(camera.x),
      y: round(camera.y),
      k: round(clampScale(camera.k), 6),
    },
  }
  try {
    storage.setItem(key, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

/** Takes the stored camera back out. Used by nothing but the tests of "reset is the camera only". */
export function clearCamera(
  storage: Pick<Storage, 'removeItem'> | null,
  key: string = CAMERA_STORAGE_KEY,
): void {
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // Nothing to do: the next read falls back to the default either way.
  }
}
