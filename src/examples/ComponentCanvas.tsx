import { useCallback, useEffect, useRef, useState } from 'react'
import { I18nProvider } from 'react-aria-components'
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react'

import { Button } from '../components/Button/Button'
import { ToggleButtonGroup } from '../components/ToggleButtonGroup/ToggleButtonGroup'
import { VisuallyHidden } from '../components/VisuallyHidden/VisuallyHidden'
import {
  EDGE_MARGIN,
  EMPTY_BOUNDS,
  FIT_MAX_SCALE,
  IDENTITY_CAMERA,
  KEY_PAN_STEP,
  KEY_PAN_STEP_FAST,
  WHEEL_ZOOM_STEP,
  cameraTransform,
  clampCamera,
  fitCamera,
  readCamera,
  resetCamera,
  revealRect,
  sameBounds,
  sameCamera,
  screenRectToWorld,
  unionBounds,
  writeCamera,
  zoomAt,
} from './canvasCamera'
import type { Bounds, Camera, Point, Size } from './canvasCamera'
import { CANVAS_CATEGORIES } from './canvasGroups'
import type { CanvasCategory, CanvasSpan } from './canvasGroups'

/**
 * The component canvas — a page that holds this library's components as they really behave, on a
 * plane you can pan and zoom.
 *
 * **It wraps components; it does not change them.** Nothing under src/components knows this page
 * exists, no preview reaches a network or a real account, and the whole of the canvas's behaviour
 * lives in this file, canvasCamera.ts beside it and the data in canvasGroups.tsx. The shell and the
 * sample data are separate files on purpose: adding a component to the canvas never touches the
 * camera, and reading the camera never means reading a preview.
 *
 * Four decisions worth keeping, because each one answers a question this shape of page asks:
 *
 * - **Groups are laid out by the browser, not by coordinates.** A column is a flex column of
 *   groups and its x is a multiple of a constant width; a group's y is wherever the one above it
 *   ended. So groups cannot overlap — not because something checks, but because nothing computes a
 *   position that could. What *is* measured is the columns' real bounding boxes, which is where the
 *   world's extent comes from and what fit-all fits.
 * - **The pan surface is behind the world, not over it.** Empty space is a sibling element that the
 *   world's own pointer-events: none lets through, so a drag that starts between two groups pans the
 *   canvas and a drag that starts on a button is a button. The alternative — one handler on the root
 *   that inspects the event target — has to be right about every component in the library, forever.
 * - **Portals stay where the library puts them.** Nothing here wraps a preview in an overlay
 *   container or moves a portal root, so a menu, a popover, a dialog and a toast render in
 *   document.body at screen coordinates, positioned by React Aria against the trigger's real
 *   getBoundingClientRect() — which already accounts for the canvas transform.
 * - **The theme is switched the way this project switches it**: data-theme on the document element,
 *   which moves color-scheme and re-resolves every light-dark() in src/styles.css for the canvas and
 *   for every portal at once. No value is redefined and no component is told about it.
 */

/**
 * A row is 12 units wide and a slot spans 4, 6 or 12 of them — a third, a half, or all of it.
 *
 * **Every slot in a group is the same width, and that is what makes a row a comparison rather than
 * a display.** Hold the width, the data and the theme still and the only thing that changes across a
 * row is the prop the row is named for; let the slots size themselves and a size comparison also
 * compares widths, which is the one thing it must not do.
 */
const GROUP_INNER = 1128
const GROUP_PADDING = 24
const GROUP_WIDTH = GROUP_INNER + GROUP_PADDING * 2
const COLUMN_GAP = 96
const GROUP_GAP = 72
const ROW_GAP = 28
const SLOT_GAP = 24

const SLOT_WIDTH: Record<CanvasSpan, number> = {
  narrow: (GROUP_INNER - SLOT_GAP * 2) / 3,
  medium: (GROUP_INNER - SLOT_GAP) / 2,
  wide: GROUP_INNER,
}

/** The two themes the project's API offers, plus the one that follows the OS. */
type CanvasTheme = 'dark' | 'light' | 'system'

interface Gesture {
  /** Pinch is a pan and a zoom at once; the only difference is how many pointers are down. */
  kind: 'pan' | 'pinch'
  /**
   * The camera as it was when the gesture began. **Every frame is computed from this and not from
   * the previous frame**, so a dropped frame cannot accumulate drift and a slow drag and a fast one
   * end in the same place.
   */
  origin: Camera
  start: Point
  distance: number
}

/** The viewport, in the screen coordinates the camera module speaks. */
function viewportOf(element: HTMLElement): Size {
  return { width: element.clientWidth, height: element.clientHeight }
}

function pointOf(event: PointerEvent): Point {
  return { x: event.clientX, y: event.clientY }
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpointOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Whether a wheel event belongs to something inside the canvas rather than to the canvas.
 *
 * Two cases, and they are one rule — *someone else has this gesture*. A preview with a scrollable
 * region keeps the wheel until that region is at its end, which is what makes a table's body
 * scrollable inside the plane you are panning. And anything that has already called
 * preventDefault() has claimed the event: React Aria's number field does exactly that while it is
 * focused, and taking the gesture from under a control that is using it is how a canvas breaks a
 * component it promised not to touch.
 */
function wheelBelongsInside(
  target: Element | null,
  deltaX: number,
  deltaY: number,
): boolean {
  let node: Element | null = target
  while (node instanceof HTMLElement) {
    if (canScroll(node, deltaX, deltaY)) return true
    node = node.parentElement
  }
  return false
}

function canScroll(
  element: HTMLElement,
  deltaX: number,
  deltaY: number,
): boolean {
  const style = getComputedStyle(element)
  if (
    /(auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight
  ) {
    if (deltaY < 0 && element.scrollTop > 0) return true
    if (
      deltaY > 0 &&
      element.scrollTop + element.clientHeight < element.scrollHeight
    )
      return true
  }
  if (
    /(auto|scroll|overlay)/.test(style.overflowX) &&
    element.scrollWidth > element.clientWidth
  ) {
    if (deltaX < 0 && element.scrollLeft > 0) return true
    if (
      deltaX > 0 &&
      element.scrollLeft + element.clientWidth < element.scrollWidth
    )
      return true
  }
  return false
}

/** Reads the camera from this browser's storage, or nothing where there is none to read. */
function readStoredCamera(): Camera | null {
  try {
    return readCamera(window.localStorage)
  } catch {
    // A blocked origin, or a privacy mode that refuses the property read itself.
    return null
  }
}

export function ComponentCanvas() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const worldRef = useRef<HTMLDivElement | null>(null)

  /**
   * The camera is held twice: cameraRef is the value the last commit put on screen, and camera is
   * the state the DOM and the buttons read. A gesture takes hold of the ref when the pointer goes
   * down and computes every frame from it, so nothing has to be re-derived from the DOM mid-drag.
   */
  const cameraRef = useRef<Camera>(IDENTITY_CAMERA)
  const boundsRef = useRef<Bounds>(EMPTY_BOUNDS)
  const viewportRef = useRef<Size>({ width: 0, height: 0 })
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<Gesture | null>(null)
  const frameRef = useRef<number | null>(null)
  const pendingRef = useRef<Camera | null>(null)
  const settledRef = useRef(false)
  const statusTimerRef = useRef<number | null>(null)

  const [camera, setCameraState] = useState<Camera>(IDENTITY_CAMERA)
  const [bounds, setBounds] = useState<Bounds>(EMPTY_BOUNDS)
  const [ready, setReady] = useState(false)
  const [theme, setTheme] = useState<CanvasTheme>('dark')
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    boundsRef.current = bounds
  }, [bounds])

  // --- remembering the camera -----------------------------------------------------------------
  //
  // **Only the camera is stored, and only after it has settled.** Nothing here writes a preview's
  // state: a canvas that came back with a form half filled in would be showing something nobody
  // typed this session, and reset is defined to restore the camera and nothing else.
  //
  // The 250ms delay is what makes a drag cost one write rather than sixty. Every camera change
  // clears the pending timer, so only the value the gesture ended on reaches storage — which is
  // also what keeps a quota error from being hit by a pan.
  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      try {
        writeCamera(window.localStorage, camera)
      } catch {
        // Storage refused — a blocked origin, or a private window. The next visit starts at the
        // default camera, which is a worse outcome than remembering it and not a failure.
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [camera, ready])

  // --- committing a camera -------------------------------------------------------------------
  //
  // **A gesture commits at most once per animation frame.** A trackpad emits wheel events far
  // faster than the compositor presents them and a high-frequency pointer reports at 1000Hz;
  // setting state on each one re-renders the whole canvas several times per frame. So a gesture
  // writes the newest camera into a ref and asks for the next frame, and the frame draws whatever
  // the newest value is by then. Nothing is lost: the intermediate values were never worth
  // drawing, and every one of them was superseded before it could have been.
  const commit = useCallback((next: Camera) => {
    pendingRef.current = next
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const value = pendingRef.current
      pendingRef.current = null
      if (value) setCameraState(value)
    })
  }, [])

  const applyClamped = useCallback(
    (next: Camera) => {
      commit(clampCamera(next, boundsRef.current, viewportRef.current))
    },
    [commit],
  )

  /** Fits a named group in the viewport. This is what a group's own address means. */
  const moveToGroup = useCallback(
    (id: string) => {
      const world = worldRef.current
      if (!world || !id) return
      const group = world.querySelector<HTMLElement>(
        '[data-group="' + id + '"]',
      )
      if (!group) return
      const target = screenRectToWorld(
        group.getBoundingClientRect(),
        cameraRef.current,
      )
      applyClamped(
        fitCamera(target, viewportRef.current, EDGE_MARGIN, FIT_MAX_SCALE),
      )
    },
    [applyClamped],
  )

  /** Ends a gesture, keeping whatever it had already asked for, and hands back every capture. */
  const abortGesture = useCallback(() => {
    const surface = surfaceRef.current
    for (const pointerId of pointersRef.current.keys()) {
      // The capture may already be gone — lostpointercapture arrives after pointerup for the same
      // id — and releasing one that is not held throws.
      try {
        surface?.releasePointerCapture(pointerId)
      } catch {
        // Already released. Nothing to undo.
      }
    }
    pointersRef.current.clear()
    gestureRef.current = null
    const value = pendingRef.current
    pendingRef.current = null
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    if (value) setCameraState(value)
  }, [])

  // --- measuring -----------------------------------------------------------------------------
  //
  // What is measured is each column's real bounding box, converted back out of the transform. The
  // title, the dashed border and the group padding are all inside it, which is the point: the
  // world's extent has to be the extent of what is drawn, not of a box reserved for it.
  //
  // **Nothing about the layout depends on this.** The measurement is the world's bounds, and bounds
  // are read only by fit-all, by the clamp and by a hash link — none of which moves a group. That is
  // why a re-measure cannot start a layout loop, and why a form growing by its own error message
  // does not move the canvas.
  useEffect(() => {
    const root = rootRef.current
    const world = worldRef.current
    if (!root || !world) return

    let frame: number | null = null

    const measure = () => {
      frame = null
      const current = cameraRef.current
      let next = EMPTY_BOUNDS
      for (const column of world.querySelectorAll<HTMLElement>(
        '[data-slot="canvas-column"]',
      )) {
        next = unionBounds(
          next,
          screenRectToWorld(column.getBoundingClientRect(), current),
        )
      }
      boundsRef.current = next
      setBounds((previous) => (sameBounds(previous, next) ? previous : next))
      setReady(true)

      // The first camera is chosen after the first measurement, and never again. Re-fitting on
      // every re-measure would move the canvas under whoever was using it.
      if (settledRef.current) return
      settledRef.current = true
      const viewport = viewportOf(root)
      viewportRef.current = viewport
      const stored = readStoredCamera()
      const initial = stored
        ? clampCamera(stored, next, viewport)
        : clampCamera(fitCamera(next, viewport), next, viewport)
      cameraRef.current = initial
      setCameraState(initial)
    }

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(world)
    for (const column of world.querySelectorAll<HTMLElement>(
      '[data-slot="canvas-column"]',
    )) {
      observer.observe(column)
    }
    measure()

    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  // --- the viewport --------------------------------------------------------------------------
  //
  // A resize changes what is reachable, so the camera is re-clamped — but only when the clamp
  // actually moves it, which is why the result is compared rather than assigned. Re-clamping
  // unconditionally would re-render the canvas on every pixel of a window drag for no reason.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let frame: number | null = null
    const observer = new ResizeObserver(() => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        viewportRef.current = viewportOf(root)
        const next = clampCamera(
          cameraRef.current,
          boundsRef.current,
          viewportRef.current,
        )
        if (!sameCamera(next, cameraRef.current)) commit(next)
      })
    })
    observer.observe(root)
    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [commit])

  // --- pan and pinch -------------------------------------------------------------------------
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    /** Starts a gesture from the pointers that are down, from wherever the camera is now. */
    const restart = () => {
      const points = [...pointersRef.current.values()]
      if (points.length === 0) {
        gestureRef.current = null
        return
      }
      // A pointer count change starts a new gesture: the finger left after a pinch lifts must
      // drag from where the content is, not jump back to where the pinch began.
      const origin = cameraRef.current
      if (points.length === 1) {
        gestureRef.current = {
          kind: 'pan',
          origin,
          start: points[0],
          distance: 1,
        }
      } else {
        gestureRef.current = {
          kind: 'pinch',
          origin,
          start: midpointOf(points[0], points[1]),
          distance: Math.max(distanceBetween(points[0], points[1]), 1),
        }
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      // **The empty space is the shell's handle, so pressing it takes focus.** Without this, the
      // camera keys are unreachable the moment a pointer has been anywhere near a preview: the
      // handler below deliberately ignores anything inside one, and a click on a button leaves focus
      // on that button. Pressing the canvas itself is the way back, and it is the same gesture a
      // person already makes to start a pan. No focus ring is drawn — it is not a keyboard focus.
      rootRef.current?.focus({ preventScroll: true })
      // A capture can be refused — a pointer that is already gone, or a synthetic event with no
      // active pointer behind it — and a throw here would leave the gesture half-started with the
      // pointer still in the map.
      try {
        surface.setPointerCapture(event.pointerId)
      } catch {
        // Without the capture the drag still works; it just stops at the edge of the surface.
      }
      pointersRef.current.set(event.pointerId, pointOf(event))
      restart()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) return
      pointersRef.current.set(event.pointerId, pointOf(event))
      const gesture = gestureRef.current
      if (!gesture) return
      const points = [...pointersRef.current.values()]
      if (points.length === 1 && gesture.kind === 'pan') {
        const point = points[0]
        applyClamped({
          k: gesture.origin.k,
          x: gesture.origin.x + (point.x - gesture.start.x),
          y: gesture.origin.y + (point.y - gesture.start.y),
        })
        return
      }
      if (points.length >= 2 && gesture.kind === 'pinch') {
        const distance = Math.max(distanceBetween(points[0], points[1]), 1)
        const midpoint = midpointOf(points[0], points[1])
        const zoomed = zoomAt(
          gesture.origin,
          gesture.start,
          distance / gesture.distance,
        )
        // The midpoint travels as well as spreads, and a pinch that ignored it would fight the
        // fingers it is anchored to.
        applyClamped({
          k: zoomed.k,
          x: zoomed.x + (midpoint.x - gesture.start.x),
          y: zoomed.y + (midpoint.y - gesture.start.y),
        })
      }
    }

    const onPointerEnd = (event: PointerEvent) => {
      pointersRef.current.delete(event.pointerId)
      try {
        surface.releasePointerCapture(event.pointerId)
      } catch {
        // The browser released it first.
      }
      restart()
    }

    surface.addEventListener('pointerdown', onPointerDown)
    surface.addEventListener('pointermove', onPointerMove)
    surface.addEventListener('pointerup', onPointerEnd)
    surface.addEventListener('pointercancel', onPointerEnd)
    surface.addEventListener('lostpointercapture', onPointerEnd)

    // A window that goes away mid-gesture never delivers the pointerup, so the pointer would stay
    // in the map and the next drag would behave as if a second finger were still down. The same is
    // true of a tab that is hidden — the events stop, the state does not.
    const onBlur = () => abortGesture()
    const onVisibility = () => {
      if (document.hidden) abortGesture()
    }
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      surface.removeEventListener('pointerdown', onPointerDown)
      surface.removeEventListener('pointermove', onPointerMove)
      surface.removeEventListener('pointerup', onPointerEnd)
      surface.removeEventListener('pointercancel', onPointerEnd)
      surface.removeEventListener('lostpointercapture', onPointerEnd)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      abortGesture()
    }
  }, [abortGesture, applyClamped])

  // --- the wheel -----------------------------------------------------------------------------
  useEffect(() => {
    const root = rootRef.current
    const surface = surfaceRef.current
    if (!root || !surface) return

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented) return
      const target = event.target instanceof Element ? event.target : null
      if (
        event.target !== surface &&
        wheelBelongsInside(target, event.deltaX, event.deltaY)
      ) {
        return
      }
      // Non-passive, because the whole point is that the page underneath does not move as well.
      event.preventDefault()
      const rect = root.getBoundingClientRect()
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      const current = cameraRef.current
      // A trackpad pinch arrives as a wheel event with ctrlKey — every browser does this, and it is
      // also exactly what a real Ctrl+wheel means, so one branch covers both.
      if (event.ctrlKey || event.metaKey) {
        const factor = event.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP
        applyClamped(zoomAt(current, point, factor))
      } else {
        applyClamped({
          k: current.k,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        })
      }
    }

    // On the root rather than on the surface: a wheel over a preview that cannot scroll should still
    // pan the canvas, and the surface is behind the previews.
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [applyClamped])

  // --- keyboard ------------------------------------------------------------------------------
  //
  // **Every key here belongs to the shell and stops at its edge.** The handler is on the canvas
  // root and returns immediately for anything inside a preview: React Aria's own arrow keys, its
  // Escape and a text field's Home are the component's, and a canvas that took them would be a
  // canvas whose previews do not work. The chrome keeps its arrows too — a toggle group walks with
  // them — and only Escape reaches the canvas from there, because Escape is the gesture's.
  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = event.target
      if (
        target instanceof Element &&
        target.closest('[data-slot="canvas-preview"]')
      )
        return
      const inChrome =
        target instanceof Element &&
        target.closest('[data-slot="canvas-chrome"]') !== null
      if (inChrome && event.key !== 'Escape') return

      const current = cameraRef.current
      const step = event.shiftKey ? KEY_PAN_STEP_FAST : KEY_PAN_STEP
      const centre = {
        x: viewportRef.current.width / 2,
        y: viewportRef.current.height / 2,
      }
      switch (event.key) {
        case 'ArrowLeft':
          applyClamped({ k: current.k, x: current.x + step, y: current.y })
          break
        case 'ArrowRight':
          applyClamped({ k: current.k, x: current.x - step, y: current.y })
          break
        case 'ArrowUp':
          applyClamped({ k: current.k, x: current.x, y: current.y + step })
          break
        case 'ArrowDown':
          applyClamped({ k: current.k, x: current.x, y: current.y - step })
          break
        case '+':
        case '=':
          applyClamped(zoomAt(current, centre, WHEEL_ZOOM_STEP))
          break
        case '-':
        case '_':
          applyClamped(zoomAt(current, centre, 1 / WHEEL_ZOOM_STEP))
          break
        case '0':
          applyClamped(resetCamera(boundsRef.current))
          break
        case 'f':
        case 'F':
          applyClamped(fitCamera(boundsRef.current, viewportRef.current))
          break
        case ' ':
          // Space is the hold-to-pan of every drawing tool. **It only counts with the shell itself
          // focused**, so a Space that is a Space — the one that presses a button, or scrolls — is
          // never taken from a control.
          if (target === rootRef.current) {
            event.preventDefault()
            setSpaceHeld(true)
          }
          return
        case 'Escape':
          abortGesture()
          setSpaceHeld(false)
          return
        default:
          return
      }
      event.preventDefault()
    },
    [abortGesture, applyClamped],
  )

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpaceHeld(false)
    }
    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }, [])

  // --- revealing focus -----------------------------------------------------------------------
  //
  // Tab moves through the canvas in DOM order, which is every group in the library. Without this a
  // keyboard user tabs into a group that is off screen and has no way to know where they are. The
  // pan is the least that makes the focused box visible, so it does not lurch, and the chrome is
  // exempt because it is pinned to the viewport and is never off screen.
  const onFocusIn = useCallback(
    (event: ReactFocusEvent<HTMLDivElement>) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest('[data-slot="canvas-chrome"]')) return
      if (target.closest('[data-slot="canvas-column"]') === null) return
      const viewport = viewportRef.current
      if (viewport.width === 0 || viewport.height === 0) return
      const next = revealRect(
        cameraRef.current,
        target.getBoundingClientRect(),
        viewport,
      )
      if (sameCamera(next, cameraRef.current)) return
      applyClamped(next)
    },
    [applyClamped],
  )

  // --- the theme -----------------------------------------------------------------------------
  //
  // The project's own API: data-theme moves color-scheme and nothing else, so every light-dark() in
  // the stylesheet re-resolves for the canvas and for the portals in document.body together. The
  // value that was there is put back on the way out, because this attribute is global: leaving it
  // behind would repaint pages that never asked for a light theme.
  useEffect(() => {
    const element = document.documentElement
    const previous = element.dataset.theme
    return () => {
      if (previous === undefined) delete element.dataset.theme
      else element.dataset.theme = previous
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // --- preview navigation --------------------------------------------------------------------
  //
  // **A preview's links are part of the demonstration, so they must not navigate this page away.**
  // A breadcrumb, a sidebar row and a tag with an href are all real anchors — which is the point of
  // them — and the first click in this canvas would otherwise leave it. So a primary click on an
  // anchor inside the canvas is caught in the capture phase: a hash that names a group moves the
  // camera to that group, and anything else is held, with the address it would have gone to shown in
  // the canvas's status line. Modifier-clicks are untouched, so open-in-a-new-tab and the status bar
  // still show where a link really goes.
  //
  // **An anchor inside a portal is not reachable this way.** A menu or a dialog is in document.body,
  // outside the canvas, and nothing can attribute a node there back to the preview that opened it.
  // The canvas therefore renders no portalled content with an href at all, and a consumer's own
  // would navigate normally. That limit is in the report rather than patched over: rewriting a
  // portalled node is the one thing this page promises not to do.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const root = rootRef.current
      const target = event.target instanceof Element ? event.target : null
      const anchor = target?.closest('a[href]')
      if (!root || !anchor || !root.contains(anchor)) return
      const href = anchor.getAttribute('href') ?? ''
      event.preventDefault()
      if (href.startsWith('#')) {
        moveToGroup(href.slice(1))
        return
      }
      setStatus('Held ' + href + ' — the canvas does not navigate away.')
      if (statusTimerRef.current !== null)
        window.clearTimeout(statusTimerRef.current)
      statusTimerRef.current = window.setTimeout(() => setStatus(''), 4000)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (statusTimerRef.current !== null)
        window.clearTimeout(statusTimerRef.current)
    }
  }, [moveToGroup])

  // A hash is a group's address, so arriving with one lands on that group rather than at the top of
  // a page that does not scroll. It is read once the first measurement has happened, because that
  // is when the groups are where they will stay.
  useEffect(() => {
    if (!ready) return
    const jump = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (id) moveToGroup(id)
    }
    jump()
    window.addEventListener('hashchange', jump)
    return () => window.removeEventListener('hashchange', jump)
  }, [moveToGroup, ready])

  const fitAll = useCallback(() => {
    applyClamped(fitCamera(boundsRef.current, viewportRef.current))
  }, [applyClamped])

  const resetView = useCallback(() => {
    applyClamped(resetCamera(boundsRef.current))
  }, [applyClamped])

  return (
    <div
      ref={rootRef}
      data-slot="canvas"
      data-canvas-ready={ready ? 'true' : 'false'}
      data-canvas-space={spaceHeld ? 'held' : 'idle'}
      role="region"
      aria-label="Component canvas"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight + - 0 F Space Escape"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={onFocusIn}
      className="fixed inset-0 overflow-hidden bg-background text-foreground outline-2 outline-transparent outline-offset-[-2px] focus-visible:outline-ring"
    >
      <VisuallyHidden>
        Every component in this library, grouped by kind, on a plane you can
        move around. With the canvas itself focused the arrow keys pan, plus and
        minus zoom, 0 returns to actual size and F fits everything in view;
        holding Space turns any drag into a pan. The components inside respond
        to the pointer and the keyboard as they normally do.
      </VisuallyHidden>

      {/*
        The pan surface. It is behind the world and larger than it, so the empty space between
        groups is a thing that can be grabbed and a component is not. touch-action: none is the
        surface's own and is never put on interactive content; select-none likewise, because
        user-select is inherited and the canvas is not allowed to stop a text field being selected.
      */}
      <div
        ref={surfaceRef}
        data-slot="canvas-surface"
        aria-hidden="true"
        className="absolute inset-0 touch-none bg-background select-none"
        style={{ cursor: spaceHeld ? 'grabbing' : 'grab' }}
      />

      <div
        ref={worldRef}
        data-slot="canvas-world"
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{
          transform: cameraTransform(camera),
          // Hidden for the one frame between the first paint and the first measurement. The
          // alternative is a frame at the identity transform and then a jump to wherever the
          // canvas was left; both values are set in the same commit, so nothing is ever drawn in
          // the wrong place.
          visibility: ready ? undefined : 'hidden',
        }}
      >
        {/*
          **The canvas pins its locale to a 24-hour one, and hydration is why.** A 12-hour locale
          puts an AM/PM separator in every time field, and its width is drawn differently by the two
          ICU versions in play: measured on this page, Node rendered that separator as U+202F
          (narrow no-break space) and Chromium as U+0020, so every date and time field in the canvas
          was a hydration mismatch and React threw the server's markup away and re-rendered the whole
          tree. A locale whose clock is 24-hour has no such separator, so both sides agree — and the
          canvas reads `09:30` rather than `9:30 AM`, which is what this library's own copy does
          anyway. It renders no DOM and changes no component.
        */}
        <I18nProvider locale="en-GB">
          {CANVAS_CATEGORIES.map((category, index) => (
            <CanvasColumn
              key={category.id}
              category={category}
              left={index * (GROUP_WIDTH + COLUMN_GAP)}
            />
          ))}
        </I18nProvider>
      </div>

      <header
        data-slot="canvas-chrome"
        className="absolute top-0 right-0 flex flex-wrap items-center justify-end gap-3 p-4"
      >
        <ToggleButtonGroup
          aria-label="Theme"
          selectionMode="single"
          selectedKeys={new Set([theme])}
          onSelectionChange={(keys) => {
            const next = [...keys][0]
            if (next === 'dark' || next === 'light' || next === 'system') {
              setTheme(next)
            }
          }}
        >
          <ToggleButtonGroup.Button id="dark">Dark</ToggleButtonGroup.Button>
          <ToggleButtonGroup.Button id="light">Light</ToggleButtonGroup.Button>
          <ToggleButtonGroup.Button id="system">
            System
          </ToggleButtonGroup.Button>
        </ToggleButtonGroup>
        <Button variant="icon" aria-label="Fit all" onPress={fitAll}>
          <FitAllIcon />
        </Button>
        <Button
          variant="icon"
          aria-label="Reset view to actual size"
          onPress={resetView}
        >
          <ActualSizeIcon />
        </Button>
        <p
          data-slot="canvas-status"
          role="status"
          className="m-0 max-w-[36ch] text-[12px] leading-[1.5] text-muted-foreground"
        >
          {status}
        </p>
      </header>
    </div>
  )
}

function CanvasColumn({
  category,
  left,
}: {
  category: CanvasCategory
  left: number
}) {
  return (
    <section
      data-slot="canvas-column"
      data-category={category.id}
      aria-label={category.title}
      className="absolute top-0 flex flex-col"
      style={{ left, width: GROUP_WIDTH }}
    >
      <h2 className="m-0 mb-8 font-mono text-[13px] tracking-[0.08em] text-foreground uppercase">
        {category.title}
      </h2>
      <div className="flex flex-col" style={{ gap: GROUP_GAP }}>
        {category.groups.map((group) => (
          <section
            key={group.id}
            data-slot="canvas-group"
            data-group={group.id}
            aria-labelledby={'group-' + group.id}
            className="pointer-events-none flex flex-col"
          >
            {/*
              The title is eight pixels above the border and takes the muted text colour with no
              opacity of its own, so one class works in both themes. It is also the group's
              address: the canvas does not scroll, so the only way to link to a group is a hash
              that moves the camera to it, and that is what this href means.
            */}
            <h3
              id={'group-' + group.id}
              className="pointer-events-auto m-0 mb-2 w-fit font-mono text-[12px] tracking-[0.06em] text-muted-foreground uppercase"
            >
              <a
                href={'#' + group.id}
                className="text-inherit no-underline hover:underline"
              >
                {group.title}
              </a>
            </h3>
            <div
              className="rounded-xl border border-dashed border-muted-foreground/25"
              style={{ padding: GROUP_PADDING }}
            >
              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {group.rows.map((row) => (
                  <div
                    key={row.axis}
                    data-slot="canvas-row"
                    role="group"
                    aria-label={group.title + ' — ' + row.axis}
                    className="flex flex-col"
                  >
                    <p className="m-0 mb-3 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                      {row.axis}
                    </p>
                    <div
                      className="flex flex-wrap items-start"
                      style={{ gap: SLOT_GAP }}
                    >
                      {row.previews.map((preview) => (
                        <div
                          key={preview.key}
                          data-slot="canvas-preview"
                          data-preview={group.id + '.' + preview.key}
                          role="group"
                          aria-label={preview.label}
                          className="pointer-events-auto flex flex-none flex-col"
                          style={{
                            width: SLOT_WIDTH[preview.span ?? 'narrow'],
                          }}
                        >
                          <preview.Component />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

/*
  The two camera controls, drawn here rather than taken from a set, for the reason
  dashboardIcons.tsx gives: this system ships no icon set, an icon is content. Same geometry as
  every other glyph in this repo — a 16-unit grid in a 1.4 stroke of currentColor.
*/

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Four corners reaching outward: everything in view. */
function FitAllIcon() {
  return (
    <Glyph>
      <path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" />
      <rect x="5.5" y="5.5" width="5" height="5" rx="1" />
    </Glyph>
  )
}

/** A frame closing on itself: actual size. */
function ActualSizeIcon() {
  return (
    <Glyph>
      <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
      <path d="M6.5 6.5h3v3h-3z" />
    </Glyph>
  )
}
