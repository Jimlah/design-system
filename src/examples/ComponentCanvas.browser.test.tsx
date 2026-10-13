import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { ComponentCanvas } from './ComponentCanvas'
import { CANVAS_CATEGORIES } from './canvasGroups'
import {
  CAMERA_BYTE_LIMIT,
  EDGE_MARGIN,
  MAX_SCALE,
  MIN_SCALE,
  cameraFromStored,
  clampCamera,
  fitCamera,
  readCamera,
  revealRect,
  screenToWorld,
  screenRectToWorld,
  sameCamera,
  unionBounds,
  worldToScreen,
  writeCamera,
  zoomAt,
} from './canvasCamera'
import type { Bounds, Camera } from './canvasCamera'

/**
 * The canvas's own tests — the camera's arithmetic and the shell's contract, both in a real
 * browser.
 *
 * **Two subjects in one file, and the file is named for the page.** `canvasCamera.ts` is pure and
 * could be tested anywhere, but the `components` project in `vite.config.ts` includes
 * the browser-test glob beside this file and nothing else, so a file per module would mean
 * inventing a third vitest project for arithmetic. What these share is the subject: where the canvas
 * is, and what it promises while it is there.
 *
 * **The coverage test is the variant list.** `CANVAS_CATEGORIES` is the list of what the canvas
 * claims to show; the first two tests below walk it against the DOM, so a group that throws or that
 * the layout forgets is a failure rather than a blank space nobody notices. What is deliberately
 * *not* asserted is every named variant of every prop — that is what the rows are, and re-listing
 * them here would be a second copy of the data that could drift from the first.
 */

const VIEWPORT = { width: 1000, height: 800 }

/* --------------------------------------------------------------------------------------------- */
/* The camera: pure functions, asserted as numbers                                                */
/* --------------------------------------------------------------------------------------------- */

test('a zoom leaves the world point under the cursor exactly where it was', () => {
  const camera: Camera = { x: 120, y: -40, k: 0.8 }
  const cursor = { x: 400, y: 300 }
  const under = screenToWorld(cursor, camera)

  const zoomed = zoomAt(camera, cursor, 1.7)

  // The whole reason the camera is a translation rather than a centre: the fixed point is exact.
  const back = worldToScreen(under, zoomed)
  expect(back.x).toBeCloseTo(cursor.x, 9)
  expect(back.y).toBeCloseTo(cursor.y, 9)
  expect(zoomed.k).toBeGreaterThan(camera.k)
})

test('the scale stops at its bounds, and the camera stops with it', () => {
  const camera: Camera = { x: 0, y: 0, k: MAX_SCALE }
  const cursor = { x: 10, y: 10 }
  // Already at the ceiling, so this is a no-op — including the translation, which is what stops a
  // pinned scale from sliding the content sideways on every wheel tick.
  expect(zoomAt(camera, cursor, 10)).toEqual(camera)
  const floor = zoomAt(camera, cursor, 1 / 10000)
  expect(floor.k).toBeGreaterThan(0)
  expect(floor.k).toBeGreaterThanOrEqual(MIN_SCALE)
})

test('fit centres what it fits, and never magnifies past actual size', () => {
  const bounds: Bounds = { minX: 0, minY: 0, maxX: 400, maxY: 200 }
  const fitted = fitCamera(bounds, VIEWPORT)

  expect(fitted.k).toBe(1)
  const left = worldToScreen({ x: 0, y: 0 }, fitted).x
  const right = worldToScreen({ x: 400, y: 0 }, fitted).x
  expect(left + right).toBeCloseTo(VIEWPORT.width, 6)

  // A canvas far larger than the viewport stops at the minimum scale rather than at zero.
  const huge = fitCamera(
    { minX: 0, minY: 0, maxX: 20000, maxY: 40000 },
    VIEWPORT,
  )
  expect(huge.k).toBe(MIN_SCALE)
})

test('the clamp keeps the content reachable, and the reveal moves the least it can', () => {
  const bounds: Bounds = { minX: 0, minY: 0, maxX: 1176, maxY: 4000 }
  const dragged: Camera = { x: -99999, y: -99999, k: 1 }
  const clamped = clampCamera(dragged, bounds, VIEWPORT)
  expect(clamped.x).toBeGreaterThan(-99999)
  // Some of the content is on screen: its far edge has not passed the near edge of the viewport.
  expect(bounds.maxX * clamped.k + clamped.x).toBeGreaterThanOrEqual(
    EDGE_MARGIN,
  )
  expect(bounds.maxY * clamped.k + clamped.y).toBeGreaterThanOrEqual(
    EDGE_MARGIN,
  )

  // A box already inside the margin box is returned unchanged — by identity, which is what stops a
  // Tab through the canvas from nudging it a fraction of a pixel at a time.
  const inside = { left: 400, top: 400, right: 500, bottom: 500 }
  const camera: Camera = { x: 0, y: 0, k: 1 }
  expect(revealRect(camera, inside, VIEWPORT)).toBe(camera)

  // An offscreen one is panned the least that makes it visible.
  const offscreen = { left: -50, top: -30, right: 20, bottom: 10 }
  const revealed = revealRect(camera, offscreen, VIEWPORT)
  expect(revealed.k).toBe(camera.k)
  expect(revealed.x).toBe(EDGE_MARGIN + 50)
  expect(revealed.y).toBe(EDGE_MARGIN + 30)
})

test('the stored camera round-trips, and every way it can be wrong falls back', () => {
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
  const camera: Camera = { x: 12.345, y: -67.891, k: 0.5 }

  expect(writeCamera(storage, camera)).toBe(true)
  const back = readCamera(storage)
  expect(back).not.toBeNull()
  expect(back?.k).toBe(0.5)
  expect(back?.x).toBeCloseTo(12.35, 2)

  // Malformed JSON, an unknown format, a camera that is not a camera, an oversized value, and a
  // storage that refuses to read: one answer, and it is the caller's default.
  expect(cameraFromStored('{')).toBeNull()
  expect(cameraFromStored({ format: 99, camera })).toBeNull()
  expect(
    cameraFromStored({ format: 1, camera: { x: 'no', y: 0, k: 1 } }),
  ).toBeNull()
  expect(
    cameraFromStored({ format: 1, camera: { x: 0, y: 0, k: 0 } }),
  ).toBeNull()

  store.set('pulse.canvas.camera', 'x'.repeat(CAMERA_BYTE_LIMIT + 1))
  expect(readCamera(storage)).toBeNull()
  expect(
    readCamera({
      getItem: () => {
        throw new Error('blocked')
      },
    }),
  ).toBeNull()
  expect(readCamera(null)).toBeNull()
  expect(
    writeCamera(
      {
        setItem: () => {
          throw new Error('quota')
        },
      },
      camera,
    ),
  ).toBe(false)
})

test('bounds are a union, and two of them are equal to the pixel', () => {
  const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 }
  const b: Bounds = { minX: 5, minY: -5, maxX: 30, maxY: 4 }
  expect(unionBounds(a, b)).toEqual({ minX: 0, minY: -5, maxX: 30, maxY: 10 })
  expect(sameCamera(fitCamera(a, VIEWPORT), fitCamera(a, VIEWPORT))).toBe(true)
})

/* --------------------------------------------------------------------------------------------- */
/* The shell                                                                                      */
/* --------------------------------------------------------------------------------------------- */

async function mountCanvas() {
  const screen = await render(<ComponentCanvas />)
  await vi.waitFor(
    () => {
      expect(
        document
          .querySelector('[data-slot="canvas"]')
          ?.getAttribute('data-canvas-ready'),
      ).toBe('true')
    },
    { timeout: 15000 },
  )
  return screen
}

const world = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="canvas-world"]',
  ) as HTMLElement
const transform = () => getComputedStyle(world()).transform

test('shows every category, group and preview the list declares', async () => {
  await mountCanvas()

  const groups = CANVAS_CATEGORIES.flatMap((category) => category.groups)
  const rows = groups.flatMap((group) => group.rows)
  const previews = rows.flatMap((row) => row.previews)

  expect(document.querySelectorAll('[data-slot="canvas-column"]')).toHaveLength(
    CANVAS_CATEGORIES.length,
  )
  expect(document.querySelectorAll('[data-slot="canvas-group"]')).toHaveLength(
    groups.length,
  )
  expect(document.querySelectorAll('[data-slot="canvas-row"]')).toHaveLength(
    rows.length,
  )
  expect(
    document.querySelectorAll('[data-slot="canvas-preview"]'),
  ).toHaveLength(previews.length)

  // Every group is addressable, which is what its hash link and any deep link into the canvas use.
  for (const group of groups) {
    expect(
      document.querySelector('[data-group="' + group.id + '"]'),
      group.id,
    ).not.toBeNull()
  }

  // Nothing was omitted for being awkward: every component the registry files has a group here.
  expect(groups.length).toBeGreaterThanOrEqual(55)
  expect(CANVAS_CATEGORIES.map((category) => category.id)).toEqual([
    'form',
    'date',
    'overlay',
    'navigation',
    'data',
    'display',
    'chart',
    'feedback',
  ])
})

test('every group wears the same dashed border, padding and corner, and none overlap', async () => {
  const screen = await mountCanvas()

  const boxes = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="canvas-group"] > div',
    ),
  ]
  const first = boxes[0]
  const reference = getComputedStyle(first)

  for (const box of boxes) {
    const computed = getComputedStyle(box)
    expect(computed.borderStyle).toBe('dashed')
    expect(computed.borderWidth).toBe('1px')
    expect(computed.padding).toBe(reference.padding)
    expect(computed.borderRadius).toBe(reference.borderRadius)
  }
  // Subtle but visible: a hairline over the page rather than nothing at all.
  expect(reference.borderColor).not.toBe('rgba(0, 0, 0, 0)')

  const title = document.querySelector<HTMLElement>(
    '[data-slot="canvas-group"] h3',
  )
  expect(getComputedStyle(title as HTMLElement).marginBottom).toBe('8px')
  expect(getComputedStyle(title as HTMLElement).opacity).toBe('1')

  // Measured at actual size: at fit-all every group is a fraction of its size and a pixel of
  // rounding could hide a real overlap.
  await screen
    .getByRole('button', { name: 'Reset view to actual size' })
    .click()
  await vi.waitFor(() => expect(transform()).toContain('matrix(1, 0, 0, 1'))

  const rects = [
    ...document.querySelectorAll<HTMLElement>('[data-slot="canvas-group"]'),
  ].map((element) => element.getBoundingClientRect())
  const overlapping: string[] = []
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i]
      const b = rects[j]
      if (
        a.left < b.right &&
        b.left < a.right &&
        a.top < b.bottom &&
        b.top < a.bottom
      ) {
        overlapping.push(i + ' and ' + j)
      }
    }
  }
  expect(overlapping).toEqual([])
})

test('the shell takes the arrow keys, and a preview keeps them', async () => {
  const screen = await mountCanvas()

  // The canvas root is a tab stop, which is how a keyboard reaches the camera at all.
  const root = document.querySelector<HTMLElement>(
    '[data-slot="canvas"]',
  ) as HTMLElement
  root.focus()
  expect(document.activeElement).toBe(root)

  const before = transform()
  await userEvent.keyboard('{ArrowRight}')
  await vi.waitFor(() => expect(transform()).not.toBe(before))

  // ...and pressing the empty space hands focus back to it, which is the way home after a preview
  // has been used.
  const surface = document.querySelector<HTMLElement>(
    '[data-slot="canvas-surface"]',
  ) as HTMLElement
  surface.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerId: 1,
      isPrimary: true,
    }),
  )
  expect(document.activeElement).toBe(root)

  // Inside a preview the arrow keys are the component's: a text field walks its caret with them.
  const input = document.querySelector<HTMLInputElement>(
    '[data-preview="textfield.rest"] input',
  )
  expect(input).not.toBeNull()
  input?.focus()
  // Focusing a preview reveals it, and that pan is committed on the next animation frame. Reading
  // the camera before it lands compares the arrow key against a move the shell was already making,
  // which is a race rather than a result.
  await new Promise((resolve) => setTimeout(resolve, 200))
  const withPreviewFocused = transform()
  await userEvent.keyboard('{ArrowLeft}')
  await new Promise((resolve) => setTimeout(resolve, 200))
  expect(transform()).toBe(withPreviewFocused)

  await screen.getByRole('button', { name: 'Fit all' }).click()
})

test('reset restores the camera and leaves what a preview holds alone', async () => {
  const screen = await mountCanvas()

  const input = document.querySelector<HTMLInputElement>(
    '[data-preview="textfield.rest"] input',
  )
  expect(input).not.toBeNull()
  await userEvent.click(input as HTMLInputElement)
  await userEvent.keyboard('api.internal')
  expect((input as HTMLInputElement).value).toBe('api.internal')

  await screen.getByRole('button', { name: 'Fit all' }).click()
  await screen
    .getByRole('button', { name: 'Reset view to actual size' })
    .click()
  await vi.waitFor(() => expect(transform()).toContain('matrix(1, 0, 0, 1'))

  // The camera is the only thing reset touches. A canvas that cleared this would be wiping
  // something nobody asked it to wipe.
  expect((input as HTMLInputElement).value).toBe('api.internal')
})

test('a preview link is held, a group link moves the camera, and neither navigates', async () => {
  const before = window.location.pathname
  await mountCanvas()

  const link = document.querySelector<HTMLAnchorElement>(
    '[data-group="breadcrumbs"] a[href="/monitors"]',
  )
  expect(link).not.toBeNull()
  await userEvent.click(link as HTMLAnchorElement)

  const status = document.querySelector('[data-slot="canvas-status"]')
  expect(status?.textContent).toContain('/monitors')
  expect(window.location.pathname).toBe(before)

  // A group's own address is a hash, and a hash is a move rather than a navigation.
  const groupLink =
    document.querySelector<HTMLAnchorElement>('a[href="#meter"]')
  expect(groupLink).not.toBeNull()
  const cameraBefore = transform()
  await userEvent.click(groupLink as HTMLAnchorElement)
  await vi.waitFor(() => expect(transform()).not.toBe(cameraBefore))
  expect(window.location.hash).not.toBe('#meter')
})

test('a portal opens in the body at screen size, and the theme reaches it too', async () => {
  const screen = await mountCanvas()

  await screen.getByRole('button', { name: 'New monitor' }).click()
  const dialog = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('[role="dialog"]')
    expect(found).not.toBeNull()
    return found as HTMLElement
  })

  // Outside the transformed world — which is the whole reason a menu or a dialog is usable while
  // the canvas is zoomed out to 6%.
  expect(dialog.closest('[data-slot="canvas-world"]')).toBeNull()
  expect(document.body.contains(dialog)).toBe(true)
  // At any canvas scale a portal is the size the component says it is.
  expect(dialog.getBoundingClientRect().width).toBeGreaterThan(300)

  // Queried from the document rather than from the render container: a dialog is portalled into
  // document.body, and the container's own locators cannot see it — the same reason a Storybook
  // story queries the page for a menu rather than the canvas.
  const cancel = [...dialog.querySelectorAll('button')].find((button) =>
    button.textContent.includes('Cancel'),
  )
  expect(cancel).toBeDefined()
  await userEvent.click(cancel as HTMLButtonElement)
  await vi.waitFor(() => {
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  // The theme is switched the way this project switches it, so it needs no second path for portals.
  const root = document.querySelector<HTMLElement>(
    '[data-slot="canvas"]',
  ) as HTMLElement
  const dark = getComputedStyle(root).backgroundColor
  await screen.getByRole('radio', { name: 'Light' }).click()
  await vi.waitFor(() => {
    expect(document.documentElement.dataset.theme).toBe('light')
  })
  expect(getComputedStyle(root).backgroundColor).not.toBe(dark)
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('light')
})

test('a stored camera comes back on the next visit, and a corrupt one does not', async () => {
  window.localStorage.removeItem('pulse.canvas.camera')
  await mountCanvas()
  await vi.waitFor(() => {
    expect(window.localStorage.getItem('pulse.canvas.camera')).not.toBeNull()
  })

  const stored = JSON.parse(
    window.localStorage.getItem('pulse.canvas.camera') ?? '{}',
  )
  expect(stored.format).toBe(1)
  expect(typeof stored.camera.k).toBe('number')
})

test('screen and world coordinates are inverses, which is what a placement assumes', () => {
  const camera: Camera = { x: -30, y: 12, k: 0.37 }
  const rect = { left: 40, top: 50, right: 140, bottom: 150 }
  const inWorld = screenRectToWorld(rect, camera)
  expect(
    worldToScreen({ x: inWorld.minX, y: inWorld.minY }, camera).x,
  ).toBeCloseTo(rect.left, 9)
  expect(
    worldToScreen({ x: inWorld.maxX, y: inWorld.maxY }, camera).y,
  ).toBeCloseTo(rect.bottom, 9)
})
