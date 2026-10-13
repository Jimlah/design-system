import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Nav, NavCount, NavHeader, NavItem, NavLabel, NavSection } from './Nav'

/**
 * **This system ships no icon set, and that is deliberate** — an icon is content, and every page that
 * needs one draws the ones it uses (`src/examples/dashboardIcons.tsx` makes the argument at length).
 * A story about a sidebar needs a handful, so here are five, on the same 16-unit grid and in the same
 * 1.4px stroke, taking `currentColor` and never a hue of their own — which is what lets the row
 * colour the glyph: white at rest, the accent when it is where you are.
 */
function Glyph({
  children,
  className = 'size-4',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const IconGrid = () => (
  <Glyph>
    <rect x="2.6" y="2.6" width="4.4" height="4.4" />
    <rect x="9" y="2.6" width="4.4" height="4.4" />
    <rect x="2.6" y="9" width="4.4" height="4.4" />
    <rect x="9" y="9" width="4.4" height="4.4" />
  </Glyph>
)

const IconChat = () => (
  <Glyph>
    <path d="M2.6 4.7a2.1 2.1 0 0 1 2.1-2.1h6.6a2.1 2.1 0 0 1 2.1 2.1v4a2.1 2.1 0 0 1-2.1 2.1H6.4l-3 2.6v-2.6h-.8a2.1 2.1 0 0 1-2.1-2.1v-4Z" />
  </Glyph>
)

const IconCalendar = () => (
  <Glyph>
    <rect x="2.4" y="3.6" width="11.2" height="10" rx="1.4" />
    <path d="M2.4 7.2h11.2M5.6 2.2v2.6M10.4 2.2v2.6" />
  </Glyph>
)

const IconTasks = () => (
  <Glyph>
    <path d="M6.4 4.3h7M6.4 8h7M6.4 11.7h7" />
    <path d="M2.7 4.3h.01M2.7 8h.01M2.7 11.7h.01" strokeWidth={2} />
  </Glyph>
)

const IconActivity = () => (
  <Glyph>
    <path d="M1.8 8.4h2.8l1.8-4.6 2.6 8.4 1.7-3.8h3.5" />
  </Glyph>
)

const IconBell = () => (
  <Glyph>
    <path d="M8 2.3a3.5 3.5 0 0 0-3.5 3.5c0 2.9-1.1 3.9-1.1 3.9h9.2s-1.1-1-1.1-3.9A3.5 3.5 0 0 0 8 2.3Z" />
    <path d="M6.6 11.9a1.6 1.6 0 0 0 2.8 0" />
  </Glyph>
)

const IconSettings = () => (
  <Glyph>
    <circle cx="8" cy="8" r="2.1" />
    <path d="M8 1.9v2.2M8 11.9v2.2M1.9 8h2.2M11.9 8h2.2M3.7 3.7l1.6 1.6M10.7 10.7l1.6 1.6M12.3 3.7l-1.6 1.6M5.3 10.7l-1.6 1.6" />
  </Glyph>
)

/**
 * The four states of a task list, as a **shape in the icon column** — a mark, like the icon it stands
 * in for, and in one of the system's four semantic fills rather than a hue picked here: the accent for
 * what is moving, the selected-yellow for what is waiting, the danger salmon for a bug, the success
 * green for done. Colour alone would say nothing to a reader who cannot tell teal from green, which is
 * why the shapes differ too.
 */
const MarkerDot = () => <span className="size-1.5 rounded-full bg-primary" />

const MarkerPause = () => (
  <span className="flex gap-[2px]">
    <span className="h-2 w-[3px] bg-warning" />
    <span className="h-2 w-[3px] bg-warning" />
  </span>
)

const MarkerBug = () => <span className="size-2 rounded-[1px] bg-destructive" />

const MarkerDone = () => (
  <svg
    viewBox="0 0 16 16"
    className="size-3 text-success"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 8.6 6.2 12 13 4.4" />
  </svg>
)

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
  <Nav.Item href="/" textValue="Overview" icon={<IconGrid />}>
    <Nav.Label>Overview</Nav.Label>
  </Nav.Item>
  <Nav.Item href="/monitors" textValue="Monitors" icon={<IconActivity />}>
    <Nav.Label>
      Monitors <Nav.Count>12</Nav.Count>
    </Nav.Label>
    <Nav.Item href="/monitors/fra1" textValue="fra1">
      <Nav.Label>fra1 · Frankfurt</Nav.Label>
    </Nav.Item>
  </Nav.Item>
  <Nav.Section>
    <Nav.Header>Account</Nav.Header>
    <Nav.Item href="/settings" textValue="Settings" icon={<IconSettings />}>
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
      <Nav.Item href="/" textValue="Overview" icon={<IconGrid />}>
        <Nav.Label>Overview</Nav.Label>
      </Nav.Item>
      <Nav.Item href="/monitors" textValue="Monitors" icon={<IconActivity />}>
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
      <Nav.Item href="/alerts" textValue="Alerts" icon={<IconBell />}>
        <Nav.Label>
          Alerts <Nav.Count>3</Nav.Count>
        </Nav.Label>
      </Nav.Item>
      <Nav.Section>
        <Nav.Header>Account</Nav.Header>
        <Nav.Item href="/settings" textValue="Settings" icon={<IconSettings />}>
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

export const Icons: Story = {
  // **The leading column is a column, not a property of the rows that happen to have an icon.** One
  // item here has a glyph and one does not, and the two labels still start on the same edge: the box
  // is reserved on every row, so the column down the panel means something.
  //
  // The glyph itself is decoration. It is `aria-hidden`, and the link is still named for its label —
  // a sidebar where the icon is the name would read as "image" all the way down.
  render: (args) => (
    <Nav {...args}>
      <Nav.Item href="/" textValue="Dashboard" icon={<IconGrid />}>
        <Nav.Label>Dashboard</Nav.Label>
      </Nav.Item>
      <Nav.Item href="/reports" textValue="Reports">
        <Nav.Label>Reports</Nav.Label>
      </Nav.Item>
    </Nav>
  ),
  play: async ({ canvas }) => {
    const link = (name: string) => canvas.getByRole('link', { name })
    const text = (name: string) => link(name).querySelector('[data-slot=text]')!
    const icon = (name: string) => link(name).querySelector('[data-slot=icon]')!
    // Where the label starts, measured from the row's own edge rather than from the page's, so the
    // number below is the row's padding and its columns and nothing else.
    const offset = (name: string) =>
      Math.round(
        text(name).getBoundingClientRect().left -
          canvas
            .getByRole('row', { name: new RegExp(name) })
            .getBoundingClientRect().left,
      )

    // 18px of row padding, the 16px box and the 8px gap: the label starts at 42 whether or not the
    // row has a glyph in the box. **Asserted as a number, not as an equality between the two rows**,
    // which is how the first version of this test managed to compare zero with zero — the slot was
    // `display: contents` then, and a contents element has no box to measure.
    await expect(offset('Dashboard')).toBe(42)
    await expect(offset('Reports')).toBe(42)

    // The row without a glyph owns the box just the same, and owns nothing else.
    await expect(icon('Reports')).toBeEmptyDOMElement()
    await expect(icon('Dashboard')).not.toBeEmptyDOMElement()
    await expect(getComputedStyle(icon('Dashboard')).width).toBe('16px')

    // The name is the label, not the glyph.
    await expect(icon('Dashboard')).toHaveAttribute('aria-hidden', 'true')
    await expect(
      canvas.getByRole('link', { name: 'Dashboard' }),
    ).toBeInTheDocument()
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

    // **And the row is washed, at the same value a hover uses.** The accent is one word at the far
    // end of a line that now starts with a glyph; the wash is what says "this row" at a glance.
    // Read as the exact declaration rather than as "not transparent", so that a change to the
    // wash has to be a change to this test as well.
    await expect(getComputedStyle(current).backgroundColor).toBe(
      'oklab(1 0 0 / 0.05)',
    )
    await expect(getComputedStyle(other).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}

export const Nesting: Story = {
  // The nesting *is* the hierarchy: a `Nav.Item` inside a `Nav.Item` is its child, and the
  // indentation follows the depth React Aria reports rather than anything written by hand.
  //
  // A branch is also followed down the page by a hairline at its parent's icon column. Indentation
  // alone is a measurement the eye has to take against the panel edge; the line is one it can
  // follow, and it is drawn by the rows themselves — React Aria renders a nested item as a sibling
  // row, so there is no group element to hang it from.
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

    // A top-level row has no branch above it, so it draws no line.
    await expect(getComputedStyle(row(/Monitors/), '::before').content).toBe(
      'none',
    )

    // Opening the branch steps the child in, and React Aria reports the depth it stepped to.
    await userEvent.click(canvas.getByRole('button', { name: /expand/i }))
    const child = await canvas.findByRole('row', { name: /fra1/ })
    await expect(child).toHaveAttribute('data-level', '2')
    await expect(getComputedStyle(child).paddingInlineStart).toBe('30px')
    // …under a 1px line at the parent's icon column: the icon box runs 18px to 34px, so the centre
    // is 26px, and the line is drawn a pixel to its left of it so it reads as the box's edge.
    await expect(getComputedStyle(child, '::before').width).toBe('1px')
  },
}

export const Sections: Story = {
  // The group heading is the sheet's field legend and is quieter than what it heads: a group name is
  // there to be found and then ignored, not to compete with the destinations under it.
  //
  // The group is also **divided from the one above it**. Without the line the last row of one group
  // and the first row of the next sit exactly as close as two rows inside either, so the stack of
  // groups the sidebar is made of has no visible seams.
  play: async ({ canvas, canvasElement }) => {
    const heading = canvas.getByText('Account')
    await expect(getComputedStyle(heading).fontSize).toBe('12px')
    await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
    await expect(getComputedStyle(heading).letterSpacing).toBe('0.48px')

    const item = canvas.getByRole('row', { name: /Settings/ })
    await expect(getComputedStyle(heading).color).not.toBe(
      getComputedStyle(item).color,
    )

    const section = canvasElement.querySelector('[data-slot=section]')!
    await expect(getComputedStyle(section).borderTopWidth).toBe('1px')
  },
}

export const Counts: Story = {
  // Pushed to the trailing edge, so the numbers form a column down the side rather than trailing
  // each label at whatever length it happens to be — the whole reason a sidebar carries counts.
  //
  // **The column holds across rows with and without a disclosure**, which is what the trailing
  // reservation is for: a count rides its anchor's trailing edge, and the disclosure is 16px of the
  // row that a parent spends and a leaf does not.
  play: async ({ canvas, canvasElement }) => {
    const counts = [...canvasElement.querySelectorAll('[data-slot=count]')]
    await expect(counts).toHaveLength(2)

    const edges = counts.map((c) => Math.round(c.getBoundingClientRect().right))
    await expect(new Set(edges).size).toBe(1)
    await expect(canvas.getByRole('row', { name: /Monitors/ })).toHaveAttribute(
      'data-has-child-items',
    )
    await expect(
      canvas.getByRole('row', { name: /Alerts/ }),
    ).not.toHaveAttribute('data-has-child-items')

    // The sheet's `.ds-count` is 11px; its colour is the one place this sidebar departs from the
    // sheet. There the count sits in a top bar beside the one chosen thing; here every counted row
    // would carry the selected-yellow, and two yellow numbers become the loudest thing on a surface
    // whose labels are 70% white. Quiet, and tabular so the column does not jitter.
    await expect(getComputedStyle(counts[0]).fontSize).toBe('11px')
    await expect(getComputedStyle(counts[0]).color).toBe('oklab(1 0 0 / 0.45)')
    await expect(getComputedStyle(counts[0]).fontVariantNumeric).toBe(
      'tabular-nums',
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

/**
 * The whole arrangement: the page's own destinations, then the collections under them, with the one
 * you are inside already open and the row you are on washed.
 *
 * This is a sidebar of a task manager — Dashboard, Chat, Calendar, then **Tasks** as an expandable
 * parent whose children are states rather than pages, each marked with the shape that says which.
 * Nothing here is a new component: a section is `Nav.Section`, the branch is a `Nav.Item` inside a
 * `Nav.Item`, the counts are `Nav.Count`, and the shapes are the story's own markup in the icon slot.
 */
export const Structure: Story = {
  args: {
    'aria-label': 'Primary',
    selectedRoute: '/tasks/bugs',
    defaultExpandedKeys: ['tasks'],
  },
  render: (args) => (
    <Nav {...args}>
      <Nav.Item href="/" textValue="Dashboard" icon={<IconGrid />}>
        <Nav.Label>Dashboard</Nav.Label>
      </Nav.Item>
      <Nav.Item href="/chat" textValue="Chat" icon={<IconChat />}>
        <Nav.Label>
          Chat <Nav.Count>99+</Nav.Count>
        </Nav.Label>
      </Nav.Item>
      <Nav.Item href="/calendar" textValue="Calendar" icon={<IconCalendar />}>
        <Nav.Label>Calendar</Nav.Label>
      </Nav.Item>
      <Nav.Section>
        <Nav.Item
          id="tasks"
          href="/tasks"
          textValue="Tasks"
          icon={<IconTasks />}
        >
          <Nav.Label>Tasks</Nav.Label>
          <Nav.Item
            href="/tasks/in-progress"
            textValue="In progress"
            icon={<MarkerDot />}
          >
            <Nav.Label>In progress</Nav.Label>
          </Nav.Item>
          <Nav.Item
            href="/tasks/paused"
            textValue="Paused"
            icon={<MarkerPause />}
          >
            <Nav.Label>Paused</Nav.Label>
          </Nav.Item>
          <Nav.Item href="/tasks/bugs" textValue="Bugs" icon={<MarkerBug />}>
            <Nav.Label>
              Bugs <Nav.Count>12</Nav.Count>
            </Nav.Label>
          </Nav.Item>
          <Nav.Item href="/tasks/done" textValue="Done" icon={<MarkerDone />}>
            <Nav.Label>Done</Nav.Label>
          </Nav.Item>
        </Nav.Item>
      </Nav.Section>
    </Nav>
  ),
  play: async ({ canvas, canvasElement }) => {
    // The branch you are inside is open before anyone touches it: `defaultExpandedKeys` is the
    // consumer's state, and a sidebar of collections opens the one the current page lives in.
    const tasks = canvas.getByRole('row', { name: /Tasks/ })
    await expect(tasks).toHaveAttribute('aria-expanded', 'true')

    // The group's own edge separates it from the destinations above.
    const section = canvasElement.querySelector('[data-slot=section]')!
    await expect(getComputedStyle(section).borderTopWidth).toBe('1px')

    // The row you are on is washed and accented, and it is the only one that is either.
    const bugs = canvas.getByRole('row', { name: /Bugs/ })
    await expect(bugs).toHaveAttribute('data-current')
    await expect(getComputedStyle(bugs).backgroundColor).toBe(
      'oklab(1 0 0 / 0.05)',
    )
    await expect(getComputedStyle(bugs).color).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    const others = canvas
      .getAllByRole('row')
      .filter((row) => row !== bugs && row !== tasks)
    for (const row of others) {
      // **Rested, one row at a time.** A row under the pointer wears the *same* wash the current row
      // does, so a pointer left where an earlier story put it — which is a different place on CI than
      // on this machine — makes one of these rows read as current. The pointer is taken off each row
      // before its colour is read, the idiom this file's hover story and `Breadcrumbs` already use.
      await userEvent.unhover(row)
      await expect(getComputedStyle(row).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
    }

    // A child row is stepped in and follows its parent's icon column down the page.
    await expect(bugs).toHaveAttribute('data-level', '2')
    await expect(getComputedStyle(bugs, '::before').width).toBe('1px')

    // The count column reaches the nested row too, so the numbers stack down the side whichever
    // level they are on.
    const count = canvasElement.querySelector('[data-slot=count]')!
    await expect(Math.round(count.getBoundingClientRect().right)).toBe(
      Math.round(
        bugs.querySelector('[data-slot=count]')!.getBoundingClientRect().right,
      ),
    )
  },
}

/**
 * **The rail: the same tree at 64px.** Labels have nowhere to go, so they fold away rather than
 * vanish — the text keeps its place in the markup and in the accessibility tree at zero width, which
 * is what leaves the link named and the item typeable. Each label also becomes its item's tooltip,
 * a count becomes the dot on the icon's shoulder, and the row is 44px of the 64px column, so the wash
 * the pointer paints is the square the icon sits in rather than a bar across the panel.
 *
 * Two things this story deliberately does not do. It has no toggle — `isCollapsed` is a prop, and the
 * control that flips it belongs beside the sidebar where the consumer can reach it. And it does not
 * hover anything: the tooltip and the corner disclosure that appear on hover and on focus are
 * `Nav.browser.test.tsx`'s business, because a `play` runs when the story is *viewed* and a pointer
 * left resting on a rail is what the next reader arrives to.
 */
export const Rail: Story = {
  args: {
    'aria-label': 'Primary',
    selectedRoute: '/tasks/bugs',
    isCollapsed: true,
    defaultExpandedKeys: ['tasks'],
  },
  render: (args) => (
    <Nav {...args}>
      <Nav.Item href="/" textValue="Dashboard" icon={<IconGrid />}>
        <Nav.Label>Dashboard</Nav.Label>
      </Nav.Item>
      <Nav.Item href="/chat" textValue="Chat" icon={<IconChat />}>
        <Nav.Label>
          Chat <Nav.Count>99+</Nav.Count>
        </Nav.Label>
      </Nav.Item>
      <Nav.Item href="/calendar" textValue="Calendar" icon={<IconCalendar />}>
        <Nav.Label>Calendar</Nav.Label>
      </Nav.Item>
      <Nav.Section>
        <Nav.Item
          id="tasks"
          href="/tasks"
          textValue="Tasks"
          icon={<IconTasks />}
        >
          <Nav.Label>Tasks</Nav.Label>
          <Nav.Item href="/tasks/bugs" textValue="Bugs" icon={<MarkerBug />}>
            <Nav.Label>
              Bugs <Nav.Count>12</Nav.Count>
            </Nav.Label>
          </Nav.Item>
        </Nav.Item>
      </Nav.Section>
      <Nav.Item href="/settings" textValue="Settings" icon={<IconSettings />}>
        <Nav.Label>Settings</Nav.Label>
      </Nav.Item>
    </Nav>
  ),
  play: async ({ canvas, canvasElement }) => {
    // The panel is an icon column.
    await expect(getComputedStyle(canvas.getByRole('treegrid')).width).toBe(
      '64px',
    )

    // **A label is folded, not deleted.** The link is still named, and what it is named by is still
    // in the markup — at zero width, which is what the rail shows in its place.
    const dashboard = canvas.getByRole('link', { name: 'Dashboard' })
    await expect(
      getComputedStyle(dashboard.querySelector('[data-slot=text]')!).width,
    ).toBe('0px')

    // The icon is the row: a 40px box, which is what a finger hits.
    await expect(
      getComputedStyle(dashboard.querySelector('[data-slot=icon]')!).width,
    ).toBe('40px')

    // …and the row is the column less its own margins, so the wash is a square around the icon
    // rather than a bar across the panel: 64px of panel, less the 1px hairline it is bordered with —
    // the border is inside the width, which is why this is 43 and not 44 — less 10px either side.
    const row = canvas.getByRole('row', { name: /Dashboard/ })
    await expect(getComputedStyle(row).width).toBe('43px')
    await expect(getComputedStyle(row).height).toBe('48px')

    // A count has no room for digits, so it becomes the dot on the icon's shoulder. The number is
    // still inside it — clipped by a 6px circle, and still read out.
    const dots = [...canvasElement.querySelectorAll('[data-slot=count]')]
    await expect(dots).toHaveLength(2)
    for (const dot of dots) {
      await expect(getComputedStyle(dot).width).toBe('6px')
      await expect(getComputedStyle(dot).height).toBe('6px')
      await expect(dot.textContent).toBeTruthy()
    }
    await expect(
      canvas.getByRole('row', { name: /Chat/ }).textContent,
    ).toContain('99+')

    // **The disclosure is quiet, not gone.** It keeps its name and its place in the corner, and it
    // comes out when the row is pointed at or focused — which is `Nav.browser.test.tsx`'s business,
    // because that is the part a reader operates. Its name is React Aria's and follows the state, so
    // this asks for it by the row it belongs to.
    const chevron = canvas.getByRole('button', { name: /Tasks/ })
    await expect(getComputedStyle(chevron).opacity).toBe('0')
    await expect(chevron).toBeInTheDocument()

    // Nothing is open on the surface at rest.
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  },
}
