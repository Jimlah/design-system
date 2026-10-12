import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent } from 'storybook/test'

import {
  ListBox,
  ListBoxHeader,
  ListBoxItem,
  ListBoxLoadMore,
  ListBoxSection,
} from './ListBox'

const meta = {
  component: ListBox,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'ListBox.Item': ListBoxItem,
    'ListBox.Section': ListBoxSection,
    'ListBox.Header': ListBoxHeader,
    'ListBox.LoadMore': ListBoxLoadMore,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<ListBox aria-label="Region" selectionMode="single" defaultSelectedKeys={['fra']}>
  <ListBox.Item id="fra">Frankfurt</ListBox.Item>
  <ListBox.Item id="iad">Ashburn</ListBox.Item>
  <ListBox.Item id="sin">Singapore</ListBox.Item>
</ListBox>`,
      },
    },
  },
} satisfies Meta<typeof ListBox>

export default meta
type Story = StoryObj<typeof meta>

const Regions = ({ mode = 'single' }: { mode?: 'single' | 'multiple' }) => (
  <ListBox
    aria-label="Region"
    selectionMode={mode}
    defaultSelectedKeys={['fra']}
    className="w-64"
  >
    <ListBox.Item id="fra">Frankfurt</ListBox.Item>
    <ListBox.Item id="iad">Ashburn</ListBox.Item>
    <ListBox.Item id="sin">Singapore</ListBox.Item>
  </ListBox>
)

export const Default: Story = {
  render: () => <Regions />,
  play: async () => {
    // **It is a `listbox` of `option`s**, which is what separates it from `GridList`: a grid list is a set
    // of rows, and a list box exists to produce a value.
    const list = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')
    await expect(options).toHaveLength(3)

    // The current option takes the accent as **text**, not a fill — the sheet's `.ds-select-option`.
    const current = screen.getByRole('option', { name: 'Frankfurt' })
    await expect(current).toHaveAttribute('data-selected')
    await expect(getComputedStyle(current).color).not.toBe(
      getComputedStyle(options[1]).color,
    )

    // It is a list standing on the page, so it draws its own border rather than a popover's.
    await expect(getComputedStyle(list).borderTopWidth).toBe('1px')
  },
}

export const Selection: Story = {
  render: () => <Regions />,
  play: async () => {
    const before = screen.getByRole('option', { name: 'Frankfurt' })
    await userEvent.click(screen.getByRole('option', { name: 'Singapore' }))

    await expect(
      screen.getByRole('option', { name: 'Singapore' }),
    ).toHaveAttribute('data-selected')
    await expect(before).not.toHaveAttribute('data-selected')
  },
}

export const Multiple: Story = {
  render: () => <Regions mode="multiple" />,
  play: async () => {
    // In `multiple` mode it stops being a radio group and every option is its own toggle.
    await expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
  },
}

export const Sections: Story = {
  render: () => (
    <ListBox aria-label="Region" selectionMode="single" className="w-64">
      <ListBox.Section>
        <ListBox.Header>Europe</ListBox.Header>
        <ListBox.Item id="fra">Frankfurt</ListBox.Item>
      </ListBox.Section>
      <ListBox.Section>
        <ListBox.Header>Americas</ListBox.Header>
        <ListBox.Item id="iad">Ashburn</ListBox.Item>
      </ListBox.Section>
    </ListBox>
  ),
  play: async () => {
    // A section is a group of options, and it takes its accessible name from its own header.
    const groups = screen.getAllByRole('group')
    await expect(groups).toHaveLength(2)
    await expect(groups[0]).toHaveAccessibleName('Europe')
  },
}

export const Disabled: Story = {
  render: () => (
    <ListBox
      aria-label="Region"
      selectionMode="single"
      disabledKeys={['sin']}
      className="w-64"
    >
      <ListBox.Item id="fra">Frankfurt</ListBox.Item>
      <ListBox.Item id="sin">Singapore</ListBox.Item>
    </ListBox>
  ),
  play: async () => {
    // `disabledKeys` on the list, rather than `isDisabled` on the item — a list box knows its own keys.
    const off = screen.getByRole('option', { name: 'Singapore' })
    await expect(off).toHaveAttribute('data-disabled')
    // The dim is the house rule for disabled: 30% opacity, colour untouched.
    await expect(Number(getComputedStyle(off).opacity)).toBeLessThan(0.5)
  },
}

export const LoadMore: Story = {
  render: () => (
    <ListBox aria-label="Region" selectionMode="single" className="w-64">
      <ListBox.Item id="fra">Frankfurt</ListBox.Item>
      <ListBox.LoadMore isLoading onLoadMore={() => {}} />
    </ListBox>
  ),
  play: async () => {
    const sentinel = document.querySelector('[data-slot=list-box-load-more]')
    await expect(sentinel).not.toBeNull()
    await expect(
      sentinel?.querySelector('[data-slot=loader]'),
    ).toBeInTheDocument()
  },
}

export const LoadMoreIdle: Story = {
  render: () => (
    <ListBox aria-label="Region" selectionMode="single" className="w-64">
      <ListBox.Item id="fra">Frankfurt</ListBox.Item>
      <ListBox.LoadMore isLoading={false} onLoadMore={() => {}} />
    </ListBox>
  ),
  play: async () => {
    // React Aria renders **nothing** for a sentinel that is not loading — absent, not empty.
    await expect(
      document.querySelector('[data-slot=list-box-load-more]'),
    ).not.toBeInTheDocument()
  },
}
