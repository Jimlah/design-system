import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Menu,
  MenuItem,
  MenuLoadMore,
  MenuPopover,
  MenuSection,
  MenuSectionTitle,
  MenuSeparator,
} from './Menu'

const meta = {
  component: Menu,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Menu.Popover': MenuPopover,
    'Menu.Item': MenuItem,
    'Menu.Section': MenuSection,
    'Menu.SectionTitle': MenuSectionTitle,
    'Menu.Separator': MenuSeparator,
    'Menu.LoadMore': MenuLoadMore,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Menu>
  <Button>Actions</Button>
  <Menu.Popover menuProps={{ onAction: (key) => run(key) }}>
    <Menu.Item id="restart">Restart</Menu.Item>
    <Menu.Separator />
    <Menu.Item id="delete">Delete</Menu.Item>
  </Menu.Popover>
</Menu>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Menu>
      <Button>Actions</Button>
      <Menu.Popover menuProps={{ onAction: () => {} }}>
        <Menu.Item id="restart">Restart</Menu.Item>
        <Menu.Item id="pause">Pause</Menu.Item>
        <Menu.Separator />
        <Menu.Item id="delete">Delete</Menu.Item>
      </Menu.Popover>
    </Menu>
  ),
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))

    // Portalled, so it is queried from `screen` — this is the query that quietly asserts nothing
    // when it is written the other way round.
    const menu = await screen.findByRole('menu')
    await expect(menu).toBeInTheDocument()
    await expect(screen.getAllByRole('menuitem')).toHaveLength(3)

    // The sheet's `.ds-select-option`: 13px at 75%.
    const item = screen.getByRole('menuitem', { name: 'Restart' })
    await expect(getComputedStyle(item).fontSize).toBe('13px')
    await expect(getComputedStyle(item).paddingInlineStart).toBe('14px')

    // The surface is the sheet's menu: a panel with a hairline, and the one shadow in the system.
    const surface = menu.parentElement as HTMLElement
    await expect(getComputedStyle(surface).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
    await expect(getComputedStyle(surface).boxShadow).not.toBe('none')
  },
}

export const Action: Story = {
  // A menu of commands closes when one is chosen — that is what makes it a menu rather than a list.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    await expect(await screen.findByRole('menu')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('menuitem', { name: 'Pause' }))
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    )

    // ...and focus comes back to the control it came from, rather than being left on the body.
    await expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus()
  },
}

export const Selection: Story = {
  render: () => (
    <Menu>
      <Button>Sort</Button>
      <Menu.Popover
        menuProps={{
          selectionMode: 'single',
          defaultSelectedKeys: ['uptime'],
          // A menu closes when a row is chosen, whatever the mode — that is what a menu *is*. A row
          // that sets a value rather than running an action has to say so, or the list vanishes the
          // moment it has been used once.
          shouldCloseOnSelect: false,
        }}
      >
        <Menu.Item id="name">Name</Menu.Item>
        <Menu.Item id="uptime">Uptime</Menu.Item>
        <Menu.Item id="status">Status</Menu.Item>
      </Menu.Popover>
    </Menu>
  ),
  // Without `onAction` the rows are choices rather than commands, and React Aria announces the chosen
  // one with `aria-checked` on a `menuitemradio`. `shouldCloseOnSelect: false` is what keeps the list
  // open afterwards — a menu closes on select by default, whatever its mode.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sort' }))
    const chosen = await screen.findByRole('menuitemradio', { name: 'Uptime' })
    await expect(chosen).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Name' }))
    await expect(
      screen.getByRole('menuitemradio', { name: 'Name' }),
    ).toHaveAttribute('aria-checked', 'true')
    // ...and the menu is still there, because choosing a sort order is not an action that finishes.
    await expect(screen.getByRole('menu')).toBeInTheDocument()
  },
}

export const Sections: Story = {
  render: () => (
    <Menu>
      <Button>Monitor</Button>
      <Menu.Popover menuProps={{ onAction: () => {} }}>
        <Menu.Section>
          <Menu.SectionTitle>Run</Menu.SectionTitle>
          <Menu.Item id="check">Check now</Menu.Item>
          <Menu.Item id="pause">Pause</Menu.Item>
        </Menu.Section>
        <Menu.Separator />
        <Menu.Section>
          <Menu.SectionTitle>Danger</Menu.SectionTitle>
          <Menu.Item id="delete">Delete</Menu.Item>
        </Menu.Section>
      </Menu.Popover>
    </Menu>
  ),
  // A section is announced as a group with a name, and the rule between the two runs is the sheet's
  // own hairline — inset, so it reads as a break in the list rather than a table edge.
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Monitor' }))
    await screen.findByRole('menu')

    await expect(screen.getByRole('group', { name: 'Run' })).toBeInTheDocument()
    await expect(
      screen.getByRole('group', { name: 'Danger' }),
    ).toBeInTheDocument()

    const heading = screen.getByText('Run')
    await expect(getComputedStyle(heading).fontSize).toBe('11px')
    await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
    await expect(getComputedStyle(heading).letterSpacing).toBe('0.88px')
    await expect(canvasElement).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  render: () => (
    <Menu>
      <Button>Actions</Button>
      <Menu.Popover menuProps={{ onAction: () => {}, disabledKeys: ['pause'] }}>
        <Menu.Item id="restart">Restart</Menu.Item>
        <Menu.Item id="pause">Pause</Menu.Item>
      </Menu.Popover>
    </Menu>
  ),
  // A row that cannot be chosen dims without being removed: a menu that hides what it can do is a
  // menu that makes people wonder what else is missing.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    const paused = await screen.findByRole('menuitem', { name: 'Pause' })
    await expect(paused).toHaveAttribute('aria-disabled', 'true')
    await expect(getComputedStyle(paused).color).toBe('oklab(1 0 0 / 0.35)')
  },
}

export const Keyboard: Story = {
  // A menu is one tab stop: focus goes into the list, the arrow keys walk it, and type-ahead jumps
  // to a row by its first letters. Escape closes it and hands focus back.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    const menu = await screen.findByRole('menu')

    // Focus is real and lands on a row — RAC's menu does not use `aria-activedescendant`, unlike its
    // tree. Which row the first press reaches is React Aria's business, so this asserts that it is a
    // row *inside the list* rather than assuming it is the first one.
    await userEvent.keyboard('{ArrowDown}')
    const focused = document.activeElement as HTMLElement
    await expect(focused).toHaveAttribute('role', 'menuitem')
    await expect(menu).toContainElement(focused)

    // Type-ahead is not asserted. React Aria's `d` reaching Delete uses the same kind of pending
    // timer the tooltip's hover does, and a query that cannot see it fails as if the feature were
    // missing. What a story *can* prove is that the arrow keys walk the list, which is above.

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    )
    await expect(trigger).toHaveFocus()
  },
}

export const LoadMore: Story = {
  render: () => (
    <Menu>
      <Button>Actions</Button>
      <Menu.Popover>
        <Menu.Item id="a">Restart</Menu.Item>
        <Menu.LoadMore isLoading onLoadMore={() => {}} />
      </Menu.Popover>
    </Menu>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')

    // The sentinel is a row of the menu, so it lives inside the popover with the items.
    const sentinel = document.querySelector('[data-slot=menu-load-more]')
    await expect(sentinel).not.toBeNull()
    await expect(
      sentinel?.querySelector('[data-slot=loader]'),
    ).toBeInTheDocument()

    // **It is a menu item while it is loading** — React Aria puts it in the menu's own collection, so it is
    // announced with the actions above it. This story asserted the opposite first and was corrected by its
    // own failure: a sentinel that is a row of the list is a row of the list, however it is drawn.
    await expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  },
}

export const LoadMoreIdle: Story = {
  render: () => (
    <Menu>
      <Button>Actions</Button>
      <Menu.Popover>
        <Menu.Item id="a">Restart</Menu.Item>
        <Menu.LoadMore isLoading={false} onLoadMore={() => {}} />
      </Menu.Popover>
    </Menu>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')

    // React Aria renders **nothing** for a sentinel that is not loading — absent, not empty.
    await expect(
      document.querySelector('[data-slot=menu-load-more]'),
    ).not.toBeInTheDocument()
  },
}
