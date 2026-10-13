import { expect, test, vi } from 'vite-plus/test'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { render } from 'vitest-browser-react'

import { Nav } from './Nav'

/**
 * `Nav`'s rail, in Vitest's browser mode.
 *
 * **These are here rather than in `Nav.stories.tsx`'s `play` functions because the rail is meant to be
 * used.** Storybook runs a `play` when the story is *viewed*, so a play that hovers an icon leaves the
 * tooltip open over the story for the next reader, and one that presses a toggle hands them a rail
 * they did not ask for. The stories show the rail and assert what holds at rest; the three things the
 * rail does **when someone touches it** are here, where nothing runs unless it is asked to.
 *
 * What is claimed, and what each test is really measuring:
 *
 * - **A folded label is still a name and still a tooltip.** The rail is the one place in this system
 *   where the tooltip is the only way to know what a control is, which is why it is worth a test: it
 *   hangs on React Aria's `Link` and not on the plain anchor the wide panel draws, because
 *   `TooltipTrigger` provides its props through the Focusable context rather than by cloning, and a
 *   bare `<a>` never reads them. Get that wrong and the tooltip simply never opens, silently.
 * - **The disclosure is quiet, not gone.** React Aria refuses an expandable item with no expand
 *   button, so the rail's button keeps its place in the tab order and its own accessible name; what
 *   this checks is that it is reachable, that it paints when the row is pointed at, and that it opens
 *   the branch on a press.
 * - **`isCollapsed` is the consumer's state.** Not internal state: the control that flips it belongs
 *   beside the sidebar. This drives it the way a consumer would and checks there is a way back.
 *
 * **The tooltip is opened from the keyboard, and that is not a shortcut.** React Aria opens one on
 * hover through a *timer*, which the runner's polling never advances — `Tooltip.stories.tsx` records
 * a Hover story that was written and failed for exactly this reason. Focus opens it synchronously, so
 * that is the path a test can prove; it is also the path a keyboard user needs, and the one the
 * pointer path runs the same code through.
 */

/** A glyph, in the sense the row means it: something in the icon column, taking 40px in the rail. */
const Icon = () => (
  <span className="block size-4 rounded-[2px] bg-foreground/30" />
)

const DASHBOARD = 'Dashboard'
const TASKS = 'Tasks'
const TASKS_ROW = new RegExp(TASKS)

/**
 * The rail's fixture: a leaf, a section, and a branch with a count in it. `defaultOpen` because the
 * disclosure's name — "Expand Tasks" against "Collapse Tasks" — is React Aria's, and each test should
 * ask for the one it actually means.
 */
function Sidebar({
  isCollapsed = false,
  defaultOpen = false,
}: {
  isCollapsed?: boolean
  defaultOpen?: boolean
}) {
  return (
    <Nav
      aria-label="Primary"
      isCollapsed={isCollapsed}
      // "/" rather than a route *inside* the branch: React Aria syncs the tree's focus to whatever
      // `selectedRoute` matches, so focusing any link while the route is under `/tasks` hands the
      // focus to that item's link — the tooltip test below would then be reading a tip for the
      // wrong row, which is a thing this fixture already did once.
      selectedRoute="/"
      defaultExpandedKeys={defaultOpen ? ['tasks'] : []}
    >
      <Nav.Item href="/" textValue={DASHBOARD} icon={<Icon />}>
        <Nav.Label>{DASHBOARD}</Nav.Label>
      </Nav.Item>
      <Nav.Section>
        <Nav.Item id="tasks" href="/tasks" textValue={TASKS} icon={<Icon />}>
          <Nav.Label>{TASKS}</Nav.Label>
          <Nav.Item href="/tasks/bugs" textValue="Bugs" icon={<Icon />}>
            <Nav.Label>
              Bugs <Nav.Count>12</Nav.Count>
            </Nav.Label>
          </Nav.Item>
        </Nav.Item>
      </Nav.Section>
    </Nav>
  )
}

/** Anything portalled is queried off the document, not off the render container. */
const tooltip = () => document.querySelector('[role=tooltip]')
const slot = (root: Element, name: string) =>
  root.querySelector(`[data-slot=${name}]`)!

test("the rail folds the label away and hands it back as the item's tooltip", async () => {
  const screen = await render(<Sidebar isCollapsed />)

  const link = screen.getByRole('link', { name: DASHBOARD })
  await expect.element(link).toBeInTheDocument()

  // Folded to nothing on the surface — and the link is *still named*, which is the whole reason the
  // text is kept at zero width rather than removed. The icon is what is left to hit: a 40px box.
  expect(getComputedStyle(slot(link.element(), 'text')).width).toBe('0px')
  expect(getComputedStyle(slot(link.element(), 'icon')).width).toBe('40px')

  // Nothing is open at rest. A tooltip that shipped open would be worse than none.
  expect(tooltip()).toBeNull()

  // The label, back again — as the tip that describes the link rather than as its name.
  link.element().focus()
  const tip = screen.getByRole('tooltip')
  await expect.element(tip).toHaveTextContent(DASHBOARD)
  expect(link.element().getAttribute('aria-describedby')?.split(' ')).toContain(
    tip.element().id,
  )

  // And it closes again: a tip that stays up over the rail is a panel nobody asked for.
  link.element().blur()
  await vi.waitFor(() => expect(tooltip()).toBeNull())
})

test("the rail's disclosure is quiet until the row is pointed at or focused, and the branch opens either way", async () => {
  const screen = await render(<Sidebar isCollapsed />)

  const row = screen.getByRole('row', { name: TASKS_ROW })
  // By the row's name, not by "expand": React Aria names this button after what it will do, so it is
  // "Expand Tasks" until the branch is open and "Collapse Tasks" afterwards, and a locator pinned to
  // one of those stops resolving the moment the other is true.
  const chevron = screen.getByRole('button', { name: TASKS_ROW })

  // React Aria requires a real expand button for an expandable item, and it is here — named, and
  // operable. It is simply not painted until it is needed.
  expect(getComputedStyle(chevron.element()).opacity).toBe('0')

  // The pointer finds it: the row is hovered, and the corner of the row comes alive.
  await userEvent.hover(row.element())
  await vi.waitFor(() =>
    expect(getComputedStyle(chevron.element()).opacity).toBe('1'),
  )
  await userEvent.unhover(row.element())
  await vi.waitFor(() =>
    expect(getComputedStyle(chevron.element()).opacity).toBe('0'),
  )

  // **The focus finds it too — and the focus is on the *row*, not on the button.** React Aria gives
  // the disclosure `tabindex="-1"` and prevents focus on it, in the wide panel as much as here: it is
  // not a Tab stop and never was, so a reveal written on the button's own `:focus-visible` would be
  // dead code. What a keyboard lands on is the link inside the row, and that is what lights the
  // corner.
  const link = screen.getByRole('link', { name: TASKS })
  link.element().focus()
  await vi.waitFor(() =>
    expect(getComputedStyle(chevron.element()).opacity).toBe('1'),
  )

  // The branch opens without the button at all, the way the tree opens one: ArrowRight, from the
  // link. A rail whose branches could only be opened with a pointer would be half a rail.
  expect(row.element().getAttribute('aria-expanded')).toBe('false')
  await userEvent.keyboard('{ArrowRight}')
  await expect
    .element(screen.getByRole('row', { name: TASKS_ROW }))
    .toHaveAttribute('aria-expanded', 'true')

  // And the pointer opens it with the button it revealed, which is what the corner is for.
  await userEvent.hover(row.element())
  await userEvent.click(chevron.element())
  await expect
    .element(screen.getByRole('row', { name: TASKS_ROW }))
    .toHaveAttribute('aria-expanded', 'false')
})

test("the rail goes back to a sidebar, because isCollapsed is the consumer's state", async () => {
  function Toggleable() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setIsCollapsed((open) => !open)}>
          Toggle the rail
        </button>
        <Sidebar isCollapsed={isCollapsed} defaultOpen />
      </>
    )
  }

  const screen = await render(<Toggleable />)
  const grid = screen.getByRole('treegrid')
  const label = () =>
    slot(screen.getByRole('link', { name: DASHBOARD }).element(), 'text')
  const count = () => document.querySelector('[data-slot=count]')!

  // The wide panel: 224px, labels on the surface, and the count as a number in its column.
  expect(getComputedStyle(grid.element()).width).toBe('224px')
  await vi.waitFor(() =>
    expect(getComputedStyle(label()).width).not.toBe('0px'),
  )
  expect(getComputedStyle(count()).width).not.toBe('6px')

  const toggle = screen.getByRole('button', { name: 'Toggle the rail' })
  await userEvent.click(toggle.element())
  await vi.waitFor(() =>
    expect(getComputedStyle(grid.element()).width).toBe('64px'),
  )
  // Folded, and the count is the dot on the icon's shoulder — the same row, saying less.
  await vi.waitFor(() => expect(getComputedStyle(label()).width).toBe('0px'))
  await vi.waitFor(() => expect(getComputedStyle(count()).width).toBe('6px'))

  // And back, because a rail with no way out of it is a trap.
  await userEvent.click(toggle.element())
  await vi.waitFor(() =>
    expect(getComputedStyle(grid.element()).width).toBe('224px'),
  )
  await vi.waitFor(() =>
    expect(getComputedStyle(label()).width).not.toBe('0px'),
  )
  await vi.waitFor(() =>
    expect(getComputedStyle(count()).width).not.toBe('6px'),
  )
})
