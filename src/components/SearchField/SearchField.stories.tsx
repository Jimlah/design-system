import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import {
  SearchField,
  SearchFieldError,
  SearchFieldGroup,
  SearchFieldHint,
  SearchFieldIcon,
  SearchFieldInput,
  SearchFieldLabel,
} from './SearchField'

const meta = {
  component: SearchField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'SearchField.Label': SearchFieldLabel,
    'SearchField.Group': SearchFieldGroup,
    'SearchField.Input': SearchFieldInput,
    'SearchField.Icon': SearchFieldIcon,
    'SearchField.Hint': SearchFieldHint,
    'SearchField.Error': SearchFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<SearchField onSubmit={(term) => filter(term)}>
  <SearchField.Label>Search monitors</SearchField.Label>
  <SearchField.Group>
    <SearchField.Icon />
    <SearchField.Input placeholder="Filter by name or URL…" />
  </SearchField.Group>
  <SearchField.Hint>12 of 24 monitors match</SearchField.Hint>
  <SearchField.Error>Enter at least two characters.</SearchField.Error>
</SearchField>`,
      },
    },
    layout: 'centered',
  },
  args: { size: 'md' },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Height and type size of the control.',
    },
    isDisabled: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
  },
  render: (args) => (
    <SearchField {...args} className="w-80">
      <SearchField.Label>Search monitors</SearchField.Label>
      <SearchField.Group>
        <SearchField.Icon />
        <SearchField.Input placeholder="Filter by name or URL…" />
      </SearchField.Group>
      <SearchField.Hint>12 of 24 monitors match</SearchField.Hint>
    </SearchField>
  ),
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

/** The sheet's own monitor list, so the live-count copy is honest. */
const MONITORS = [
  'api.example.com',
  'api.staging.example.com',
  'web.example.com',
  'web.staging.example.com',
  'cdn.example.com',
  'cdn-edge.example.com',
  'db-primary.internal',
  'db-replica.internal',
  'cache-01.internal',
  'cache-02.internal',
  'queue.internal',
  'worker-01.internal',
  'worker-02.internal',
  'metrics.internal',
  'logs.internal',
  'auth.example.com',
  'billing.example.com',
  'search.example.com',
  'media.example.com',
  'static.example.com',
  'status.example.com',
  'docs.example.com',
  'admin.example.com',
  'checkout.example.com',
]

export const Default: Story = {
  play: async ({ canvas }) => {
    // Queried by its label, so this only resolves if `SearchField.Label` is
    // associated with the control.
    const input = canvas.getByLabelText(/search monitors/i)

    // `SearchField` rather than a styled `TextField`: React Aria gives the input
    // the search semantics and reports whether it is empty.
    await expect(input).toHaveAttribute('type', 'search')
    await expect(input.closest('[data-empty]')).not.toBeNull()

    const styles = getComputedStyle(input)
    await expect(styles.height).toBe('44px') // md
    await expect(styles.borderRadius).toBe('0px')
    await expect(styles.fontFamily).toContain('Overpass Mono')
    // The resting hairline, so the control is identifiable on either page.
    await expect(styles.borderTopColor).not.toBe('rgba(0, 0, 0, 0)')

    // The hint is described-by, and here it doubles as the result count.
    const describedBy = input.getAttribute('aria-describedby') ?? ''
    const hint = canvas.getByText(/12 of 24 monitors match/i)
    await expect(describedBy.split(' ')).toContain(hint.id)
  },
}

export const Icon: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <SearchField {...args}>
        <SearchField.Label>Default magnifier</SearchField.Label>
        <SearchField.Group>
          <SearchField.Icon />
          <SearchField.Input placeholder="Filter by name or URL…" />
        </SearchField.Group>
      </SearchField>
      <SearchField {...args}>
        <SearchField.Label>Replaced glyph</SearchField.Label>
        <SearchField.Group>
          <SearchField.Icon>{Filter}</SearchField.Icon>
          <SearchField.Input placeholder="Funnels only" />
        </SearchField.Group>
      </SearchField>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/default magnifier/i)
    const control = input.closest('[data-slot=control]') as HTMLElement
    const icon = control.querySelector('[data-slot=icon-start]') as HTMLElement

    // The magnifier needs no children — an empty tag draws the sheet's glyph.
    await expect(icon.querySelector('svg')).not.toBeNull()
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expect(getComputedStyle(icon).pointerEvents).toBe('none')

    // `Group` is what gives the affix the control's box rather than the field's,
    // which also holds the label and hint.
    const field = input.getBoundingClientRect()
    const affix = icon.getBoundingClientRect()
    await expect(Math.round(affix.top)).toBe(Math.round(field.top))
    await expect(Math.round(affix.height)).toBe(Math.round(field.height))
    await expect(Math.round(affix.left)).toBe(Math.round(field.left + 14))
    // ...and the input makes room for it, worked out by `:has()` in the group.
    await expect(getComputedStyle(input).paddingInlineStart).toBe('42px')
  },
}

export const Filtering: Story = {
  // The sheet's hint is a live count. This is the whole component doing its job:
  // a controlled value driving a result list, and the hint reporting it.
  render: (args) => {
    const [query, setQuery] = useState('')
    const matches = MONITORS.filter((monitor) =>
      monitor.toLowerCase().includes(query.trim().toLowerCase()),
    )
    return (
      <SearchField
        {...args}
        className="w-80"
        value={query}
        onChange={setQuery}
        onSubmit={(term) => console.log('submitted', term)}
      >
        <SearchField.Label>Search monitors</SearchField.Label>
        <SearchField.Group>
          <SearchField.Icon />
          <SearchField.Input placeholder="Filter by name or URL…" />
        </SearchField.Group>
        <SearchField.Hint>
          {matches.length} of {MONITORS.length} monitors match
        </SearchField.Hint>
      </SearchField>
    )
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/search monitors/i)

    await expect(canvas.getByText(/24 of 24 monitors match/i)).toBeVisible()
    await userEvent.type(input, 'api')
    await expect(canvas.getByText(/2 of 24 monitors match/i)).toBeVisible()
    // `data-empty` comes from React Aria, so a clear affordance can hang off it
    // without tracking the value a second time.
    await expect(input.closest('[data-empty]')).toBeNull()
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-5">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SearchField {...args} key={size} size={size}>
          <SearchField.Label>{size}</SearchField.Label>
          <SearchField.Group>
            <SearchField.Icon />
            <SearchField.Input placeholder="Filter by name or URL…" />
          </SearchField.Group>
        </SearchField>
      ))}
    </div>
  ),
  // The sheet's three heights: 36 / 44 / 52px.
  play: async ({ canvas }) => {
    for (const [size, height] of [
      ['sm', '36px'],
      ['md', '44px'],
      ['lg', '52px'],
    ] as const) {
      const input = canvas.getByLabelText(size)
      await expect(getComputedStyle(input).height).toBe(height)
    }
  },
}

export const Error: Story = {
  render: (args) => (
    <SearchField {...args} className="w-80" defaultValue="x" isInvalid>
      <SearchField.Label>Search monitors</SearchField.Label>
      <SearchField.Group>
        <SearchField.Icon />
        <SearchField.Input />
      </SearchField.Group>
      <SearchField.Error>Enter at least two characters.</SearchField.Error>
    </SearchField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/search monitors/i)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(getComputedStyle(input).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
    await expect(
      canvas.getByText(/enter at least two characters/i),
    ).toBeVisible()
  },
}

export const Disabled: Story = {
  render: (args) => (
    <SearchField {...args} className="w-80" isDisabled>
      <SearchField.Label>Search monitors</SearchField.Label>
      <SearchField.Group>
        <SearchField.Icon />
        <SearchField.Input placeholder="Filter by name or URL…" />
      </SearchField.Group>
    </SearchField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/search monitors/i)
    await expect(input).toBeDisabled()
    await expect(getComputedStyle(input).opacity).toBe('0.4')
  },
}

/** A funnel, to prove `SearchField.Icon` takes any glyph. */
const Filter = (
  <svg viewBox="0 0 16 16" fill="none">
    <path
      d="M1.5 2.5h13L9.5 8.5v5l-3-1.5v-3.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)
