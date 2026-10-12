import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import { Nav, NavCount, NavHeader, NavItem, NavLabel, NavSection } from './Nav'

const meta = {
  component: Nav,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Nav.Item': NavItem,
    'Nav.Label': NavLabel,
    'Nav.Section': NavSection,
    'Nav.Header': NavHeader,
    'Nav.Count': NavCount,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Nav aria-label="Primary" selectedRoute="/monitors/fra1">
  <Nav.Item href="/" textValue="Overview">
    <Nav.Label>Overview</Nav.Label>
  </Nav.Item>
  <Nav.Item href="/monitors" textValue="Monitors">
    <Nav.Label>
      Monitors <Nav.Count>12</Nav.Count>
    </Nav.Label>
    <Nav.Item href="/monitors/fra1" textValue="fra1">
      <Nav.Label>fra1 · Frankfurt</Nav.Label>
    </Nav.Item>
  </Nav.Item>
  <Nav.Section>
    <Nav.Header>Account</Nav.Header>
    <Nav.Item href="/settings" textValue="Settings">
      <Nav.Label>Settings</Nav.Label>
    </Nav.Item>
  </Nav.Section>
</Nav>`,
      },
    },
    layout: 'fullscreen',
  },
  args: { 'aria-label': 'Primary', selectedRoute: '/monitors/fra1' },
  render: (args) => (
    <Nav {...args}>
      <Nav.Item href="/" textValue="Overview">
        <Nav.Label>Overview</Nav.Label>
      </Nav.Item>
      <Nav.Item href="/monitors" textValue="Monitors">
        <Nav.Label>
          Monitors <Nav.Count>12</Nav.Count>
        </Nav.Label>
        <Nav.Item href="/monitors/fra1" textValue="fra1">
          <Nav.Label>fra1 · Frankfurt</Nav.Label>
        </Nav.Item>
        <Nav.Item href="/monitors/iad1" textValue="iad1">
          <Nav.Label>iad1 · Virginia</Nav.Label>
        </Nav.Item>
      </Nav.Item>
      <Nav.Item href="/alerts" textValue="Alerts">
        <Nav.Label>
          Alerts <Nav.Count>3</Nav.Count>
        </Nav.Label>
      </Nav.Item>
      <Nav.Section>
        <Nav.Header>Account</Nav.Header>
        <Nav.Item href="/settings" textValue="Settings">
          <Nav.Label>Settings</Nav.Label>
        </Nav.Item>
      </Nav.Section>
    </Nav>
  ),
} satisfies Meta<typeof Nav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // It is navigation, so it is a nav landmark — and a page lists every nav by its label, which is
    // why the label matters even though the prop is optional.
    // React Aria builds a sidebar from a tree, and a tree is a `treegrid` — the same shape as its
    // table. The landmark is the grid, the items are its rows, and the row is what carries the
    // state; the anchor inside it is what makes the item a destination rather than a widget.
    const grid = canvas.getByRole('treegrid')
    await expect(grid).toBeInTheDocument()
    await expect(grid).toHaveAttribute('aria-label', 'Primary')

    // The items are the sheet's `.ds-link-caps`: 14px, -1%, uppercase.
    const overview = canvas.getByRole('link', { name: 'Overview' })
    await expect(getComputedStyle(overview).fontSize).toBe('14px')
    await expect(getComputedStyle(overview).letterSpacing).toBe('-0.14px')
    await expect(getComputedStyle(overview).textTransform).toBe('uppercase')
  },
}

export const Current: Story = {
  // `selectedRoute` is the whole of "where am I": one string, matched against every `href`. The
  // current item takes the accent — the sheet's own `[aria-current="page"]` rule — and its parent
  // comes up to full strength and goes no further, because two items in the accent would stop
  // saying which one you are on.
  play: async ({ canvas }) => {
    const teal = 'oklch(0.9198 0.1236 189.5)'
    const parent = canvas.getByRole('row', { name: /Monitors/ })

    // The subtree is closed, so the current route is not rendered yet — but its parent is already
    // marked as an ancestor of it, which is exactly what lets a tree show you where you are inside
    // a branch you have not opened.
    await expect(parent).toHaveAttribute('data-current-ancestor')
    await expect(parent).not.toHaveAttribute('data-current')
    await expect(getComputedStyle(parent).color).not.toBe(teal)

    // An unrelated item is neither.
    const other = canvas.getByRole('row', { name: /Overview/ })
    await expect(other).not.toHaveAttribute('data-current-ancestor')

    // Opening the branch is a press on its disclosure button — React Aria requires a real one, and
    // names it itself, so this asks for the name it supplies rather than one written here.
    const chevron = canvas.getByRole('button', { name: /expand/i })
    await userEvent.click(chevron)
    const current = await canvas.findByRole('row', { name: /fra1/ })
    await expect(current).toHaveAttribute('data-current')
    await expect(getComputedStyle(current).color).toBe(teal)
    await expect(current).toHaveAttribute('data-level', '2')
  },
}

export const Nesting: Story = {
  // The nesting *is* the hierarchy: a `Nav.Item` inside a `Nav.Item` is its child, and the
  // indentation follows the depth React Aria reports rather than anything written by hand.
  play: async ({ canvas }) => {
    const row = (name: RegExp) => canvas.getByRole('row', { name })
    const pad = (name: RegExp) => getComputedStyle(row(name)).paddingInlineStart

    await expect(row(/Overview/)).toHaveAttribute('data-level', '1')
    await expect(row(/Monitors/)).toHaveAttribute('data-level', '1')
    await expect(pad(/Overview/)).toBe('18px')
    await expect(pad(/Monitors/)).toBe('18px')

    // A parent says it has children, and a leaf does not — and only the parent carries a disclosure
    // button, because a control that cannot do anything is a control that lies.
    await expect(row(/Monitors/)).toHaveAttribute('data-has-child-items')
    await expect(row(/Overview/)).not.toHaveAttribute('data-has-child-items')
    await expect(canvas.getByRole('button', { name: /expand/i })).toBeVisible()

    // Opening the branch steps the child in, and React Aria reports the depth it stepped to.
    await userEvent.click(canvas.getByRole('button', { name: /expand/i }))
    const child = await canvas.findByRole('row', { name: /fra1/ })
    await expect(child).toHaveAttribute('data-level', '2')
    await expect(getComputedStyle(child).paddingInlineStart).toBe('30px')
  },
}

export const Sections: Story = {
  // The group heading is the sheet's field legend and is quieter than what it heads: a group name is
  // there to be found and then ignored, not to compete with the destinations under it.
  play: async ({ canvas }) => {
    const heading = canvas.getByText('Account')
    await expect(getComputedStyle(heading).fontSize).toBe('12px')
    await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
    await expect(getComputedStyle(heading).letterSpacing).toBe('0.48px')

    const item = canvas.getByRole('row', { name: /Settings/ })
    await expect(getComputedStyle(heading).color).not.toBe(
      getComputedStyle(item).color,
    )
  },
}

export const Counts: Story = {
  // Pushed to the trailing edge, so the numbers form a column down the side rather than trailing
  // each label at whatever length it happens to be — the whole reason a sidebar carries counts.
  play: async ({ canvas, canvasElement }) => {
    const counts = [...canvasElement.querySelectorAll('[data-slot=count]')]
    await expect(counts).toHaveLength(2)

    const edges = counts.map((c) => Math.round(c.getBoundingClientRect().right))
    await expect(new Set(edges).size).toBe(1)

    // The sheet's `.ds-count`: 11px in the selected-yellow.
    await expect(getComputedStyle(counts[0]).fontSize).toBe('11px')
    await expect(getComputedStyle(counts[0]).color).toBe(
      'oklch(0.8733 0.1505 91.2)',
    )

    // The label still reads as its text, not as its text plus a number.
    await expect(
      canvas.getByRole('row', { name: /Alerts/ }).textContent,
    ).toContain('3')
  },
}

export const Hover: Story = {
  // A hover is a pointer sequence, not an attribute to set by hand.
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /Overview/ })
    // The row transitions its colour, so a read straight after the hover returns the value it is
    // on the way *from* — the same trap as the indicator and the knob.
    row.style.transition = 'none'
    // **The rest reading is taken with the pointer deliberately off the row.** The story used to
    // assume the row was not already hovered when it began, and on CI it was: `before` came back as
    // the hovered colour, so the comparison below was `oklch(1 0 none)` against itself. The mechanism
    // did not reproduce on a developer machine — a probe with two stories sharing a page carried no
    // hover from one to the next — which is the same shape as the transition races this suite has
    // already been bitten by: a window that is shut locally and open on a slower runner. Clearing the
    // hover explicitly removes the assumption either way, and a hover that does not change the colour
    // still fails.
    await userEvent.unhover(row)
    const before = getComputedStyle(row).color
    await userEvent.hover(row)
    // **Waited for, because the state is React Aria's and it lands on the next commit.**
    // `userEvent.hover` fires the pointer sequence; `data-hovered` is derived from it by a
    // re-render, so a read on the very next line races that commit — and loses on a slower
    // runner, where the attribute is simply not there yet. See the testing rules in AGENTS.md.
    await waitFor(() => expect(row).toHaveAttribute('data-hovered'))
    await expect(getComputedStyle(row).color).not.toBe(before)
  },
}

export const Keyboard: Story = {
  // Every item is a real link with a real destination — middle-click, open in a new tab, the status
  // bar, and a name a screen reader can announce — and each one can take focus.
  //
  // What is *not* asserted here is the Tab order. The tree keeps a virtual focus: the grid is
  // `tabindex="-1"` and its rows carry none, so the links inside it are the only things a keyboard
  // can reach — but driving Tab from the test runner did not land on them, and I would rather say
  // that than write a test that quietly asserts something else. The `links` here are in document
  // order, which is the order Tab walks them.
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link')
    await expect(links).toHaveLength(4)

    for (const link of links) {
      await expect(link).toHaveAttribute('href')
      link.focus()
      await expect(link).toHaveFocus()
    }

    // The disclosure is a real button with a name React Aria supplies, so the branch can be opened
    // without a pointer.
    await expect(
      canvas.getByRole('button', { name: /expand/i }),
    ).toBeInTheDocument()
  },
}
