import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import {
  Meter,
  MeterFill,
  MeterHeader,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from './Meter'

const meta = {
  component: Meter,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Meter.Label': MeterLabel,
    'Meter.Header': MeterHeader,
    'Meter.Value': MeterValue,
    'Meter.Track': MeterTrack,
    'Meter.Fill': MeterFill,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Meter value={82} tone={82 > 80 ? 'danger' : 'success'} className="w-72">
  <Meter.Header>
    <Meter.Label>Disk</Meter.Label>
    <Meter.Value />
  </Meter.Header>
  <Meter.Track>
    <Meter.Fill />
  </Meter.Track>
</Meter>`,
      },
    },
    layout: 'centered',
  },
  args: { value: 82, tone: 'success' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'success', 'warning', 'danger', 'neutral'],
    },
  },
  render: (args) => (
    <Meter {...args} className="w-72">
      <Meter.Header>
        <Meter.Label>Disk</Meter.Label>
        <Meter.Value />
      </Meter.Header>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  ),
} satisfies Meta<typeof Meter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // A meter, not a progress bar: React Aria gives it `role="meter"`, so the reading reaches a
    // screen reader as a number rather than as a bar filling up. The name comes from the label slot.
    const meter = canvas.getByRole('meter', { name: 'Disk' })
    await expect(meter).toHaveAttribute('aria-valuenow', '82')
    await expect(canvas.getByText('82%')).toBeVisible()

    const fill = canvasElement.querySelector('[data-slot=fill]') as HTMLElement
    await expect(getComputedStyle(fill).backgroundColor).toBe(
      'oklch(0.9198 0.1236 145)',
    )
  },
}

export const Tones: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-5">
      {(['accent', 'success', 'warning', 'danger', 'neutral'] as const).map(
        (tone) => (
          <Meter key={tone} {...args} tone={tone}>
            <Meter.Header>
              <Meter.Label>{tone}</Meter.Label>
              <Meter.Value />
            </Meter.Header>
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        ),
      )}
    </div>
  ),
  // Five tones and five different fills: a meter's colour is the whole message, so none of them may
  // be the same colour as another.
  play: async ({ canvasElement }) => {
    const fills = [...canvasElement.querySelectorAll('[data-slot=fill]')].map(
      (f) => getComputedStyle(f).backgroundColor,
    )
    await expect(fills).toHaveLength(5)
    await expect(new Set(fills).size).toBe(5)

    // ...and each is named by its own label, so five meters on a page are five different things.
    await expect(
      canvasElement.querySelectorAll('[role=meter][aria-labelledby]'),
    ).toHaveLength(5)
  },
}

export const Threshold: Story = {
  // The caller decides what the reading means, because only the caller knows which direction is the
  // bad one: 80% of a disk used is a warning, 80% of a disk free is not.
  render: (args) => (
    <div className="flex w-72 flex-col gap-5">
      {[30, 65, 92].map((value) => (
        <Meter
          key={value}
          {...args}
          value={value}
          tone={value > 80 ? 'danger' : value > 50 ? 'warning' : 'success'}
        >
          <Meter.Header>
            <Meter.Label>Volume · {value}%</Meter.Label>
            <Meter.Value />
          </Meter.Header>
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      ))}
    </div>
  ),
  // Three readings, three tones, and the fills really do differ — which is what the component
  // declines to guess and the caller gets to say.
  play: async ({ canvasElement }) => {
    const fills = [...canvasElement.querySelectorAll('[data-slot=fill]')].map(
      (f) => getComputedStyle(f).backgroundColor,
    )
    await expect(new Set(fills).size).toBe(3)

    const meters = canvasElement.querySelectorAll('[role=meter]')
    await expect(meters).toHaveLength(3)
    await expect(meters[2]).toHaveAttribute('aria-valuenow', '92')
  },
}
