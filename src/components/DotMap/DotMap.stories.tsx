import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import { DotMap, fitDots } from './DotMap'
import { WORLD_DOTS } from './worldDots'
import type { MapDot } from './worldDots'

/** Four places with something to say, in the world data's own coordinates. */
const ORIGINS: MapDot[] = [
  [134.5, 250.5, 1, 'sfo1 · 482k'],
  [292.5, 243.5, 1, 'fra1 · 1.2m'],
  [397.5, 250.5, 1, 'sin1 · 96k'],
  [226.5, 144.7, 1, 'arn1 · 12k'],
]

const meta = {
  component: DotMap,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `import { WORLD_DOTS } from './worldDots'

<DotMap
  dots={[...WORLD_DOTS, [292.5, 243.5, 1, 'fra1 · 1.2m']]}
  label="Request origins, last hour"
/>`,
      },
    },
  },
} satisfies Meta<typeof DotMap>

export default meta
type Story = StoryObj<typeof meta>

/**
 * What actually got painted: the number of opaque pixels, and how the colour is distributed between them.
 *
 * **Counting *distinct* colours would be a weak check.** The dots sit on fractional coordinates — the
 * replica draws them at `x - 1.3`, and so does this — so every edge is antialiased and the bitmap holds
 * hundreds of near-unique shades. "More than one colour" would pass for a map painted in a single fill.
 * What matters is that the two fills each cover a real share of the drawing.
 */
function painted(element: HTMLCanvasElement) {
  const context = element.getContext('2d')!
  const { data } = context.getImageData(0, 0, element.width, element.height)
  const counts = new Map<string, number>()
  let opaque = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    opaque += 1
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const ranked = [...counts.values()].sort((a, b) => b - a)
  return { opaque, top: ranked[0] ?? 0, second: ranked[1] ?? 0 }
}

export const World: Story = {
  args: { dots: WORLD_DOTS, label: 'Request origins, last hour' },
  play: async ({ canvas }) => {
    const element = canvas.getByRole<HTMLCanvasElement>('img', {
      name: /request origins/i,
    })
    await expect(element.tagName).toBe('CANVAS')

    const box = element.getBoundingClientRect()
    await expect(Math.round(box.width)).toBe(528)
    await expect(Math.round(box.height)).toBe(380)

    // **The bitmap is the box times the device pixel ratio.** These are two different sizes on a canvas:
    // the attributes are what gets drawn into, the CSS box is what is shown. Setting only one is the
    // classic canvas mistake — a bitmap left at CSS size is blurred on a retina display, and a CSS size
    // left unset stretches the bitmap.
    const dpr = window.devicePixelRatio || 1
    await expect(element.width).toBe(Math.round(528 * dpr))
    await expect(element.height).toBe(Math.round(380 * dpr))

    // **The geometry, checked directly.** With the drawing on a canvas there are no dots in the DOM to
    // read back, so the fitting is a pure function and is asserted as one: every fitted point has to land
    // inside the box. The data's own range reaches `y 401` in a box 380 tall, so this fails loudly if the
    // fit is dropped.
    const fitted = fitDots(WORLD_DOTS, 528, 380)
    await expect(fitted).toHaveLength(WORLD_DOTS.length)
    for (const dot of fitted) {
      await expect(dot[0]).toBeGreaterThanOrEqual(0)
      await expect(dot[1]).toBeGreaterThanOrEqual(0)
      await expect(dot[0]).toBeLessThanOrEqual(528)
      await expect(dot[1]).toBeLessThanOrEqual(380)
    }

    // **And it painted something, in two colours.** This is the assertion the canvas version makes possible
    // and the SVG version could not: reading the pixels back. Two distinct colours is the accent and the
    // plain fill, which also proves the `color-mix()` expressions resolved — a canvas cannot use `var()`,
    // so a failure there would paint every dot the same fallback colour and still look like a map.
    const ink = painted(element)
    await expect(ink.opaque).toBeGreaterThan(1000)

    // **The accent flag reached the right dots, checked by sampling their centres.** Counting how much of
    // the bitmap is the accent colour under-counts badly — the dots sit on fractional coordinates, so every
    // edge is antialiased and 69 small marks are spread across hundreds of shades. Reading the pixel at each
    // fitted dot's own centre is exact, and it is the check that would catch a run where every dot came out
    // the same colour: a canvas cannot use `var()`, so a failure to resolve the `color-mix()` expressions
    // would paint one fallback everywhere and still look like a map.
    const context = element.getContext('2d')!
    const at = (x: number, y: number) => {
      const [r, g, b, a] = context.getImageData(
        Math.round(x * dpr),
        Math.round(y * dpr),
        1,
        1,
      ).data
      return `${r},${g},${b},${a}`
    }
    const counts = (wanted: boolean) => {
      const seen = new Map<string, number>()
      for (const dot of fitted) {
        if ((dot[2] === 1) !== wanted) continue
        const colour = at(dot[0], dot[1])
        seen.set(colour, (seen.get(colour) ?? 0) + 1)
      }
      return [...seen.entries()].sort((a, b) => b[1] - a[1])
    }
    const [plainColour] = counts(false)[0]
    const accents = counts(true)
    const accentColour = accents[0][0]
    await expect(accentColour).not.toBe(plainColour)

    // **Classified by which reference a sample is closer to, not by matching a shade exactly.** A 2.6px
    // square at a fractional position straddles the sampled pixel, so its centre can be a blend — and
    // counting only the exact shade left 33 of 69 accents and 407 of 800 plains. Comparing against the two
    // modal colours handles the blends, and the claim it tests is the one that matters: the flag decides
    // the colour.
    const rgb = (value: string) => value.split(',').map(Number)
    const near = (value: string, reference: string) => {
      const [r1, g1, b1] = rgb(value)
      const [r2, g2, b2] = rgb(reference)
      return Math.hypot(r1 - r2, g1 - g2, b1 - b2)
    }
    const classified = (wanted: boolean, asAccent: boolean) =>
      fitted.filter((dot) => {
        if ((dot[2] === 1) !== wanted) return false
        const colour = at(dot[0], dot[1])
        const closerToAccent =
          near(colour, accentColour) < near(colour, plainColour)
        return closerToAccent === asAccent
      }).length

    await expect(classified(true, true)).toBeGreaterThan(60)
    await expect(classified(false, false)).toBeGreaterThan(750)
  },
}

export const Unfitted: Story = {
  args: { dots: WORLD_DOTS, fit: false, label: 'Raw coordinates' },
  // `fit={false}` for coordinates already in the box's units. The dataset is **not**: its range reaches
  // `y 401` in a 380-tall box, so the southern edge falls outside the bitmap and is simply not drawn —
  // silently, because a canvas does not report a point outside itself.
  play: async ({ canvas }) => {
    const beyond = WORLD_DOTS.filter((dot) => dot[1] > 380)
    await expect(beyond.length).toBeGreaterThan(0)

    const element = canvas.getByRole<HTMLCanvasElement>('img', {
      name: /raw coordinates/i,
    })
    await expect(painted(element).opaque).toBeGreaterThan(1000)
  },
}

export const Origins: Story = {
  args: {
    dots: [...WORLD_DOTS, ...ORIGINS],
    // **`fit={false}`, so the coordinates below are the ones on screen.** With the fit on, every dot is
    // rescaled and `292.5` no longer means what the data says it means — the first version of this test
    // aimed at the raw coordinate, missed, and reported "no readout". The component was right.
    fit: false,
    label: 'Request origins, last hour',
  },
  // **The readout is opt-in through the data.** The replica's map has no tooltip because `GEO_DOTS` is bare
  // geometry — no values, nothing to say. Give a dot a fourth element and it becomes hoverable; unlabelled
  // dots stay inert, so a pointer over the ocean finds nothing.
  play: async ({ canvas }) => {
    const element = canvas.getByRole<HTMLCanvasElement>('img', {
      name: /request origins/i,
    })
    // The readout is a sibling of the canvas inside the wrapper, which is where the pointer handling lives.
    const wrapper = document.querySelector('[data-slot=dot-map]') as HTMLElement

    // Ocean: a bare map has no readout to show.
    await userEvent.pointer({ target: element, coords: { x: 20, y: 20 } })
    await expect(
      wrapper.querySelector('[data-slot=dot-map-tooltip]'),
    ).toBeNull()

    // Now a labelled dot. The pointer is measured from the canvas's rendered box and the drawing is
    // stretched to it, so the conversion is the same one the component does.
    const box = element.getBoundingClientRect()
    await userEvent.pointer({
      target: element,
      coords: { x: (292.5 / 528) * box.width, y: (243.5 / 380) * box.height },
    })
    const shown = await waitFor(() => {
      const node = wrapper.querySelector('[data-slot=dot-map-tooltip]')
      if (!node) throw new Error('no readout')
      return node
    })
    await expect(shown.textContent.trim()).toBe('fra1 · 1.2m')
    await expect(shown).toHaveAttribute('aria-hidden', 'true')

    // Leaving takes it away rather than stranding it on the last dot.
    await userEvent.unhover(element)
    await expect(
      wrapper.querySelector('[data-slot=dot-map-tooltip]'),
    ).toBeNull()
  },
}
