import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Slider } from './Slider'

const meta = {
  component: Slider,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Slider.Header': Slider.Header,
    'Slider.Label': Slider.Label,
    'Slider.Value': Slider.Value,
    'Slider.Track': Slider.Track,
    'Slider.Fill': Slider.Fill,
    'Slider.Thumb': Slider.Thumb,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Slider defaultValue={[20, 80]}>
  <Slider.Track>
    <Slider.Fill />
    <Slider.Thumb index={0} label="From" />
    <Slider.Thumb index={1} label="To" />
  </Slider.Track>
</Slider>`,
      },
    },
    layout: 'centered',
  },
  args: { defaultValue: 60, minValue: 0, maxValue: 100, size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
  render: (args) => (
    <Slider {...args}>
      <Slider.Header>
        <Slider.Label>Alert threshold</Slider.Label>
        <Slider.Value />
      </Slider.Header>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  ),
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // `Slider.Label` names the rail — React Aria wires it, so there is no `label` prop to drift out
    // of sync with it. The name is what makes the control usable with a screen reader at all.
    const slider = canvas.getByRole('slider', { name: 'Alert threshold' })
    await expect(slider).toHaveValue('60')

    // The reading is an `<output>` that formats itself.
    await expect(canvas.getByText('60')).toBeVisible()
  },
}

export const ThumbPosition: Story = {
  args: { defaultValue: 25 },
  // **Where the thumb is** is the whole claim a slider makes, and the one a broken layout keeps
  // while every behavioural assertion still passes — the lesson the number field's steppers taught.
  // So this measures the handle against the rail rather than trusting the percentage it was given.
  play: async ({ canvas, canvasElement }) => {
    const slider = canvas.getByRole('slider', { name: 'Alert threshold' })
    await expect(slider).toHaveValue('25')

    const track = canvasElement.querySelector('[data-slot=fill]')
      ?.parentElement as HTMLElement
    const thumb = canvasElement.querySelector(
      '[data-slot=thumb]',
    ) as HTMLElement
    const rail = track.getBoundingClientRect()
    const handle = thumb.getBoundingClientRect()
    const centre = handle.left + handle.width / 2 - rail.left
    // A thumb at 25% sits a quarter along the rail, to within its own half-width of slack.
    const ratio = centre / rail.width
    await expect(Math.abs(ratio - 0.25)).toBeLessThan(0.08)

    // **Square, and this is the assertion that says so.** What stood here was `radius < width / 2`, which
    // is true of every rectangle ever drawn — it caught a fully round thumb and proved nothing about
    // squareness, while its comment claimed the handle "is square, like every other control here".
    // Meanwhile the handle was a 10×24 bar. Compare the two sides instead.
    await expect(Math.abs(handle.width - handle.height)).toBeLessThanOrEqual(1)
    await expect(parseFloat(getComputedStyle(thumb).borderTopLeftRadius)).toBe(
      0,
    )
  },
}

export const Range: Story = {
  args: { defaultValue: [20, 80] },
  render: (args) => (
    <Slider {...args}>
      <Slider.Header>
        <Slider.Label>Latency window</Slider.Label>
      </Slider.Header>
      <Slider.Track>
        {/* One fill, between the two handles: React Aria draws the segment the range covers. */}
        <Slider.Fill />
        <Slider.Thumb index={0} label="From" />
        <Slider.Thumb index={1} label="To" />
      </Slider.Track>
    </Slider>
  ),
  // Two handles are two sliders, and each needs its own name — "From" and "To" rather than two
  // anonymous rails a screen reader cannot tell apart.
  //
  // **React Aria prepends the group's label to each handle's name**, so the accessible name is
  // "From Latency window" rather than "From". That is the right answer — a screen reader crossing a
  // form hears which window and which end of it — so the query is a prefix match rather than a name
  // invented to make the assertion pass.
  play: async ({ canvas, canvasElement }) => {
    const from = canvas.getByRole('slider', { name: /^From/ })
    const to = canvas.getByRole('slider', { name: /^To/ })
    await expect(from).toHaveValue('20')
    await expect(to).toHaveValue('80')

    // The fill is the segment between them, not the run from the start: 60% of the rail.
    const fill = canvasElement.querySelector('[data-slot=fill]') as HTMLElement
    const rail = fill.parentElement?.getBoundingClientRect() as DOMRect
    const ratio = fill.getBoundingClientRect().width / rail.width
    await expect(Math.abs(ratio - 0.6)).toBeLessThan(0.05)
  },
}

export const Keyboard: Story = {
  // The reason to use this rather than a `div`: the arrow keys step, Home and End reach the ends,
  // and each press is announced with the value it produced.
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider', { name: 'Alert threshold' })
    slider.focus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(slider).toHaveValue('61')
    await expect(canvas.getByText('61')).toBeVisible()

    await userEvent.keyboard('{Home}')
    await expect(slider).toHaveValue('0')

    await userEvent.keyboard('{End}')
    await expect(slider).toHaveValue('100')
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Slider key={size} {...args} size={size} defaultValue={40}>
          <Slider.Header>
            <Slider.Label>{size}</Slider.Label>
            <Slider.Value />
          </Slider.Header>
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      ))}
    </div>
  ),
  // The rail thickens with the size, so the thing being aimed at grows with the type beside it.
  // All three are still one rail, and all three still put the handle at 40%.
  play: async ({ canvas, canvasElement }) => {
    const rails = [...canvasElement.querySelectorAll('[data-slot=fill]')].map(
      (f) => f.parentElement as HTMLElement,
    )
    const heights = rails.map((r) =>
      Math.round(r.getBoundingClientRect().height),
    )
    await expect(new Set(heights).size).toBe(3)

    // ...and the **handles** grow too, which is the half that first went unchecked: `size` reached
    // the rail while `size-(--slider-thumb)` silently produced nothing on the handle, so three rails
    // of different thickness all carried an identical grip. Checking one end of a two-ended decision
    // is how that survives a passing suite.
    const grips = [...canvasElement.querySelectorAll('[data-slot=thumb]')].map(
      (t) => t.getBoundingClientRect(),
    )
    await expect(new Set(grips.map((g) => Math.round(g.height))).size).toBe(3)
    // **Square at every size — and this assertion is why it was not.** It required
    // `height > width`, with the note that "that proportion is what makes it a grip", so a *test* held the
    // handle to being a tall narrow bar while the docs said it was square and a reader said twice that it
    // looked wrong. The rule this system actually has is that every control but two is square, and a
    // slider handle is not one of the exceptions.
    for (const g of grips)
      await expect(Math.abs(g.height - g.width)).toBeLessThanOrEqual(1)

    for (const name of ['sm', 'md', 'lg']) {
      await expect(canvas.getByRole('slider', { name })).toHaveValue('40')
    }
  },
}

export const Vertical: Story = {
  args: { orientation: 'vertical', defaultValue: 70 },
  // A vertical rail is the same rail turned: the fill runs bottom-up and the handle moves along the
  // other axis. Drawn with `h-1 w-full` alone it would be a 1px line across a tall column.
  play: async ({ canvas, canvasElement }) => {
    const slider = canvas.getByRole('slider', { name: 'Alert threshold' })
    await expect(slider).toHaveAttribute('aria-orientation', 'vertical')

    const rail = canvasElement.querySelector('[data-slot=fill]')
      ?.parentElement as HTMLElement
    const box = rail.getBoundingClientRect()
    await expect(box.height).toBeGreaterThan(box.width)
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  // Disabled dims and stops responding, without being removed: a slider that vanishes leaves a
  // layout with a hole in it and no explanation.
  play: async ({ canvas, canvasElement }) => {
    const slider = canvas.getByRole('slider', { name: 'Alert threshold' })
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(slider).toHaveValue('60')

    // The handle is dimmed by a variable the slider publishes, because `data-disabled` lives on the
    // root — the same shape as `Checkbox`'s indicator. React Aria also renders an inner wrapper
    // around the input, so the handle is found by its slot rather than by walking up from the input.
    const thumb = canvasElement.querySelector(
      '[data-slot=thumb]',
    ) as HTMLElement
    await expect(getComputedStyle(thumb).opacity).toBe('0.3')
  },
}
