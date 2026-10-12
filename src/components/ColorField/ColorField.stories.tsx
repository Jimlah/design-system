import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { parseColor } from 'react-aria-components'
import { expect } from 'storybook/test'

import {
  ColorField,
  ColorFieldControl,
  ColorFieldError,
  ColorFieldHint,
  ColorFieldInput,
  ColorFieldLabel,
  ColorFieldSwatch,
} from './ColorField'

const meta = {
  component: ColorField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'ColorField.Label': ColorFieldLabel,
    'ColorField.Control': ColorFieldControl,
    'ColorField.Swatch': ColorFieldSwatch,
    'ColorField.Input': ColorFieldInput,
    'ColorField.Hint': ColorFieldHint,
    'ColorField.Error': ColorFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<ColorField defaultValue={parseColor('#71FFF6')}>
  <ColorField.Label>Label colour</ColorField.Label>
  <ColorField.Control>
    <ColorField.Swatch />
    <ColorField.Input />
  </ColorField.Control>
  <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
  <ColorField.Error>That is not a colour.</ColorField.Error>
</ColorField>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <ColorField defaultValue={parseColor('#71FFF6')}>
      <ColorField.Label>Label colour</ColorField.Label>
      <ColorField.Control>
        <ColorField.Swatch />
        <ColorField.Input />
      </ColorField.Control>
      <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
    </ColorField>
  ),
} satisfies Meta<typeof ColorField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Label colour')).toBeInTheDocument()
    const input = canvas.getByRole('textbox')
    await expect(input).toHaveValue('#71FFF6')

    // **The swatch reads the field's own state**, so it cannot disagree with what is in the input.
    const swatch = canvasElement.querySelector(
      '[data-slot=swatch]',
    ) as HTMLElement
    await expect(getComputedStyle(swatch).backgroundColor).toBe(
      'rgb(113, 255, 246)',
    )
  },
}

export const Layout: Story = {
  /**
   * **The one claim a field makes that a behavioural test cannot.** A legend, a control and a hint are
   * a *column*: if they are not, they are not a field, and every previous story about values or errors
   * would pass anyway.
   *
   * This is written because the first attempt at this component shipped the hint *beside* the input
   * through four restructurings, with a green suite throughout. Measuring the three tops is the
   * assertion that would have caught it on the first run.
   */
  play: async ({ canvas, canvasElement }) => {
    const label = canvas.getByText('Label colour')
    const control = canvasElement.querySelector(
      '[data-slot=color-control]',
    ) as HTMLElement
    const hint = canvas.getByText('Hex, rgb() or oklch().')
    const top = (el: Element) => Math.round(el.getBoundingClientRect().top)

    // The legend is above the control...
    await expect(top(label)).toBeLessThan(top(control))
    // ...and the hint is below it.
    await expect(top(hint)).toBeGreaterThan(top(control))
  },
}

export const Error: Story = {
  render: () => (
    <ColorField defaultValue={null} isInvalid>
      <ColorField.Label>Label colour</ColorField.Label>
      <ColorField.Control>
        <ColorField.Swatch />
        <ColorField.Input />
      </ColorField.Control>
      <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
      <ColorField.Error>That is not a colour.</ColorField.Error>
    </ColorField>
  ),
  // The field's own error slot, reached through the input's `aria-describedby` — which is also what a
  // screen reader reads, and a query that cannot land on the wrong node.
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox')
    const describedBy = input.getAttribute('aria-describedby')
    await expect(describedBy).toBeTruthy()

    const described = describedBy
      ?.split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
    await expect(described).toContain('That is not a colour.')

    // An empty colour field paints no square at all.
    const swatch = canvasElement.querySelector(
      '[data-slot=swatch]',
    ) as HTMLElement
    await expect(getComputedStyle(swatch).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}
