import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import {
  Radio,
  RadioFieldError,
  RadioGroup,
  RadioHint,
  RadioIndicator,
  RadioLabel,
  RadioText,
} from './Radio'

const meta = {
  component: Radio,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Radio.Group': RadioGroup,
    'Radio.Indicator': RadioIndicator,
    'Radio.Text': RadioText,
    'Radio.Label': RadioLabel,
    'Radio.Hint': RadioHint,
    'Radio.Error': RadioFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Radio.Group defaultValue="https">
  <Radio.Label>Protocol</Radio.Label>
  <Radio value="http">
    <Radio.Indicator />
    <Radio.Text>HTTP</Radio.Text>
  </Radio>
  <Radio value="https">
    <Radio.Indicator />
    <Radio.Text>HTTPS</Radio.Text>
  </Radio>
  <Radio.Hint>Applies to every check.</Radio.Hint>
  <Radio.Error>Choose a protocol.</Radio.Error>
</Radio.Group>`,
      },
    },
    layout: 'centered',
  },
  args: { value: 'https' },
  argTypes: { isDisabled: { control: 'boolean' } },
  render: (args) => (
    <Radio.Group defaultValue={args.value} className="w-64">
      <Radio.Label>Protocol</Radio.Label>
      <Radio value="http">
        <Radio.Indicator />
        <Radio.Text>HTTP</Radio.Text>
      </Radio>
      <Radio value="https">
        <Radio.Indicator />
        <Radio.Text>HTTPS</Radio.Text>
      </Radio>
      <Radio value="tcp">
        <Radio.Indicator />
        <Radio.Text>TCP</Radio.Text>
      </Radio>
      <Radio.Hint>Applies to every check.</Radio.Hint>
    </Radio.Group>
  ),
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

const indicatorOf = (input: HTMLElement) =>
  input.closest('label')?.querySelector('[data-slot=indicator]') as HTMLElement
const centreOf = (input: HTMLElement) =>
  indicatorOf(input).querySelector('[data-slot=centre]') as HTMLElement

export const Default: Story = {
  play: async ({ canvas }) => {
    // The group is queried by its label, so this only resolves if `Radio.Label`
    // is associated with `Radio.Group`.
    const group = canvas.getByRole('radiogroup', { name: /protocol/i })
    const https = canvas.getByRole('radio', { name: 'HTTPS' })
    const tcp = canvas.getByRole('radio', { name: 'TCP' })

    await expect(group).toBeInTheDocument()
    await expect(https).toBeChecked()
    await expect(tcp).not.toBeChecked()

    // The sheet's dot: an 18px circle, where the checkbox is a 2px-radius square.
    const dot = indicatorOf(tcp)
    const dotStyles = getComputedStyle(dot)
    await expect(dotStyles.width).toBe('18px')
    await expect(dotStyles.borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
    // Tailwind v4's `rounded-full` is `border-radius: calc(infinity * 1px)`, which
    // Chrome computes to 3.35544e+07px — so "is it a circle" has to be asked as "is
    // the radius at least half the box", not compared against '50%'.
    await expect(parseFloat(dotStyles.borderRadius)).toBeGreaterThanOrEqual(
      parseFloat(dotStyles.width) / 2,
    )

    // The 10px centre is always mounted and scales in, so selecting a radio does
    // not mount an element or shift the row. Both its properties transition, so they
    // are frozen before being read.
    const centre = centreOf(https)
    centre.style.transition = 'none'
    await expect(getComputedStyle(centre).width).toBe('10px')
    await expect(getComputedStyle(centre).opacity).toBe('1')
    // Tailwind v4's `scale-*` sets the standalone `scale` property, not `transform`,
    // so `transform` stays 'none' however the element is scaled.
    await expect(getComputedStyle(centre).scale).toBe('1')
    await expect(getComputedStyle(centreOf(tcp)).opacity).toBe('0')

    // The hint is described-by on the group rather than announced on its own.
    const describedBy = group.getAttribute('aria-describedby') ?? ''
    const hint = canvas.getByText(/applies to every check/i)
    await expect(describedBy.split(' ')).toContain(hint.id)
  },
}

export const ArrowKeys: Story = {
  args: { value: 'http' },
  // Radios in a group share a single tab stop and the arrow keys move between
  // them, which is the behaviour a hand-rolled group always gets wrong.
  play: async ({ canvas }) => {
    const http = canvas.getByRole('radio', { name: 'HTTP' })
    const https = canvas.getByRole('radio', { name: 'HTTPS' })

    await userEvent.tab()
    await expect(http).toHaveFocus()
    // One tab stop, not three.
    await expect(https).not.toHaveFocus()
    await expect(http).toHaveAttribute('tabindex', '0')
    await expect(https).toHaveAttribute('tabindex', '-1')

    await userEvent.keyboard('{ArrowDown}')
    await expect(https).toHaveFocus()
    await expect(https).toBeChecked()
    await expect(http).not.toBeChecked()
    // Arrow navigation selects as it moves, so the centre follows the focus. It
    // transitions, so freeze it before reading.
    const centre = centreOf(https)
    centre.style.transition = 'none'
    await expect(getComputedStyle(centre).opacity).toBe('1')
  },
}

export const Exclusivity: Story = {
  args: { value: 'http' },
  // The difference from a `Checkbox.Group`, stated as a test: picking one turns the
  // previous one off, rather than adding to it.
  play: async ({ canvas }) => {
    const http = canvas.getByRole('radio', { name: 'HTTP' })
    const https = canvas.getByRole('radio', { name: 'HTTPS' })

    await expect(http).toBeChecked()
    await userEvent.click(https)
    await expect(https).toBeChecked()
    await expect(http).not.toBeChecked()
  },
}

export const Horizontal: Story = {
  render: (args) => (
    <Radio.Group
      defaultValue={args.value}
      orientation="horizontal"
      className="w-64"
    >
      <Radio.Label>Protocol</Radio.Label>
      <Radio value="http">
        <Radio.Indicator />
        <Radio.Text>HTTP</Radio.Text>
      </Radio>
      <Radio value="https">
        <Radio.Indicator />
        <Radio.Text>HTTPS</Radio.Text>
      </Radio>
      <Radio value="tcp">
        <Radio.Indicator />
        <Radio.Text>TCP</Radio.Text>
      </Radio>
    </Radio.Group>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: /protocol/i })
    // The orientation is announced, not just laid out — the arrow keys that move
    // within the group differ by axis, so assistive tech needs to know which.
    await expect(group).toHaveAttribute('aria-orientation', 'horizontal')
    await expect(getComputedStyle(group).flexDirection).toBe('row')
  },
}

export const Error: Story = {
  render: (args) => (
    <Radio.Group defaultValue={args.value} isInvalid className="w-64">
      <Radio.Label>Protocol</Radio.Label>
      <Radio value="http">
        <Radio.Indicator />
        <Radio.Text>HTTP</Radio.Text>
      </Radio>
      <Radio value="https">
        <Radio.Indicator />
        <Radio.Text>HTTPS</Radio.Text>
      </Radio>
      <Radio.Error>Choose a protocol to continue.</Radio.Error>
    </Radio.Group>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: /protocol/i })
    await expect(group).toHaveAttribute('aria-invalid', 'true')
    await expect(
      canvas.getByText(/choose a protocol to continue/i),
    ).toBeVisible()
  },
}

export const Required: Story = {
  render: (args) => (
    <Radio.Group defaultValue={args.value} isRequired className="w-64">
      <Radio.Label>Protocol</Radio.Label>
      <Radio value="http">
        <Radio.Indicator />
        <Radio.Text>HTTP</Radio.Text>
      </Radio>
    </Radio.Group>
  ),
  play: async ({ canvas }) => {
    // The marker is the label's `::after`, driven by the group's own
    // `data-required`, so it cannot drift out of sync with the prop.
    const label = canvas.getByText(/protocol/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
    await expect(marker.color).toBe('oklch(0.785 0.1236 29)') // --color-red
  },
}

export const Disabled: Story = {
  render: (args) => (
    <Radio.Group defaultValue={args.value} className="w-64">
      <Radio.Label>Protocol</Radio.Label>
      <Radio value="http">
        <Radio.Indicator />
        <Radio.Text>HTTP</Radio.Text>
      </Radio>
      <Radio value="https" isDisabled>
        <Radio.Indicator />
        <Radio.Text>HTTPS</Radio.Text>
      </Radio>
    </Radio.Group>
  ),
  play: async ({ canvas }) => {
    const https = canvas.getByRole('radio', { name: 'HTTPS' })
    await expect(https).toBeDisabled()
    await expect(
      getComputedStyle(https.closest('label') as HTMLElement).opacity,
    ).toBe('0.35')
  },
}

export const Hover: Story = {
  args: { value: 'tcp' },
  // Hover goes through `user-event`, which fires the pointer events a pointer really
  // fires — the `data-hovered` state React Aria derives from them is then the component's
  // own, not something the test put there. See the testing guidance in AGENTS.md.
  play: async ({ canvas }) => {
    const http = canvas.getByRole('radio', { name: 'HTTP' })
    const indicator = indicatorOf(http)
    // The indicator is what transitions, not the input.
    indicator.style.transition = 'none'

    await userEvent.hover(indicator)
    // **Waited for, because the state is React Aria's and it lands on the next commit.**
    // `userEvent.hover` fires the pointer sequence; `data-hovered` is derived from it by a
    // re-render, so a read on the very next line races that commit — and loses on a slower
    // runner, where the attribute is simply not there yet. See the testing rules in AGENTS.md.
    await waitFor(() =>
      expect(http.closest('label')).toHaveAttribute('data-hovered', 'true'),
    )
    await expect(getComputedStyle(indicator).borderTopColor).toBe(
      'oklch(1 0 none)', // --color-fg
    )
  },
}
