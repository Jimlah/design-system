import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import {
  ProgressBar,
  ProgressFill,
  ProgressHeader,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from './ProgressBar'

const meta = {
  component: ProgressBar,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'ProgressBar.Label': ProgressLabel,
    'ProgressBar.Header': ProgressHeader,
    'ProgressBar.Value': ProgressValue,
    'ProgressBar.Track': ProgressTrack,
    'ProgressBar.Fill': ProgressFill,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<ProgressBar value={72} className="w-72">
  <ProgressBar.Label>Uptime</ProgressBar.Label>
  <ProgressBar.Track>
    <ProgressBar.Fill />
  </ProgressBar.Track>
</ProgressBar>`,
      },
    },
    layout: 'centered',
  },
  args: { value: 72, isIndeterminate: false },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    isIndeterminate: { control: 'boolean' },
  },
  render: (args) => (
    <ProgressBar {...args} className="w-72">
      <ProgressBar.Header>
        <ProgressBar.Label>Uptime</ProgressBar.Label>
        <ProgressBar.Value />
      </ProgressBar.Header>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  ),
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // The name comes from the label slot: `ProgressBar.Label`'s id is what the widget points at with
    // `aria-labelledby`, because React Aria omits `label` and its own `Label` child is only a caption.
    const bar = canvas.getByRole('progressbar', { name: 'Uptime' })
    await expect(bar).toHaveAttribute('aria-valuenow', '72')

    // `ProgressBar.Value` with no children renders the reading React Aria formatted.
    const reading = canvas.getByText('72%')
    await expect(reading).toBeVisible()
    await expect(getComputedStyle(reading).fontSize).toBe('12px')

    const track = canvasElement.querySelector('.h-1') as HTMLElement
    const fill = canvasElement.querySelector('[data-slot=fill]') as HTMLElement
    // Measured, not read off a token: the bar is 72% of the rail, which is the only claim that
    // matters about a progress bar and the one a wrong width would break.
    const ratio =
      fill.getBoundingClientRect().width / track.getBoundingClientRect().width
    await expect(Math.round(ratio * 100)).toBe(72)
  },
}

export const Indeterminate: Story = {
  args: { isIndeterminate: true, value: undefined },
  // "We do not know how far along this is" is not the same as "it has not started". React Aria
  // renders the difference as the **absence** of `aria-valuenow`, which is what a screen reader
  // reads — so the assertion is about what is missing, not about a value of zero.
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uptime' })
    await expect(bar).not.toHaveAttribute('aria-valuenow')

    // The rail fills, because there is no fraction to draw, and pulses so it reads as moving.
    const fill = canvasElement.querySelector('[data-slot=fill]') as HTMLElement
    await expect(getComputedStyle(fill).width).toBe(
      getComputedStyle(fill.parentElement as HTMLElement).width,
    )
    await expect(getComputedStyle(fill).animationName).toBe('pulse')
  },
}

export const Complete: Story = {
  args: { value: 100 },
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uptime' })
    await expect(bar).toHaveAttribute('aria-valuenow', '100')
    await expect(canvas.getByText('100%')).toBeVisible()

    const track = canvasElement.querySelector('.h-1') as HTMLElement
    const fill = canvasElement.querySelector('[data-slot=fill]') as HTMLElement
    await expect(Math.round(fill.getBoundingClientRect().width)).toBe(
      Math.round(track.getBoundingClientRect().width),
    )
  },
}

export const CustomFormat: Story = {
  args: {
    value: 3.4,
    maxValue: 8,
    formatOptions: {
      style: 'unit',
      unit: 'gigabyte',
      maximumFractionDigits: 1,
    },
  },
  render: (args) => (
    <ProgressBar {...args} className="w-72">
      <ProgressBar.Header>
        <ProgressBar.Label>Backup</ProgressBar.Label>
        <ProgressBar.Value />
      </ProgressBar.Header>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  ),
  // `formatOptions` is how the reading is written without the bar knowing anything about bytes — the
  // same prop the number field formats money with, and the slot renders whatever it produces.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3.4 GB')).toBeVisible()
    await expect(
      canvas.getByRole('progressbar', { name: 'Backup' }),
    ).toHaveAttribute('aria-valuenow', '3.4')
  },
}

export const Restyle: Story = {
  render: (args) => (
    <ProgressBar {...args} className="w-72">
      <ProgressBar.Header>
        <ProgressBar.Label>Rolling out</ProgressBar.Label>
      </ProgressBar.Header>
      {/* A taller rail. It is a slot, so it can be restyled without the component having an opinion
          about its height. */}
      <ProgressBar.Track className="h-2">
        <ProgressBar.Fill />
      </ProgressBar.Track>
      {/* ...and a reading that says something else, because the slot renders what it is given. */}
      <ProgressBar.Value className="text-foreground/45">
        {args.value} of 100
      </ProgressBar.Value>
    </ProgressBar>
  ),
  play: async ({ canvas, canvasElement }) => {
    const track = canvasElement.querySelector('.h-2') as HTMLElement
    await expect(getComputedStyle(track).height).toBe('8px')

    await expect(canvas.getByText('72 of 100')).toBeVisible()
    await expect(canvas.queryByText('72%')).not.toBeInTheDocument()

    // ...and the name still comes from the label slot, not from the reading.
    await expect(
      canvas.getByRole('progressbar', { name: 'Rolling out' }),
    ).toBeInTheDocument()
  },
}
