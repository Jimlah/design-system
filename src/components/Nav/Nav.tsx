import { createContext, useContext } from 'react'
import {
  Button as AriaButton,
  Link as AriaLink,
  NavigationTree as AriaNavigationTree,
  NavigationTreeHeader as AriaNavigationTreeHeader,
  NavigationTreeItem as AriaNavigationTreeItem,
  NavigationTreeItemContent as AriaNavigationTreeItemContent,
  NavigationTreeSection as AriaNavigationTreeSection,
} from 'react-aria-components'
import type {
  NavigationTreeHeaderProps as AriaNavigationTreeHeaderProps,
  NavigationTreeItemContentProps as AriaNavigationTreeItemContentProps,
  NavigationTreeItemProps as AriaNavigationTreeItemProps,
  NavigationTreeProps as AriaNavigationTreeProps,
  NavigationTreeSectionProps as AriaNavigationTreeSectionProps,
} from 'react-aria-components'
import { Tooltip } from '../Tooltip/Tooltip'

/**
 * The sheet has **no sidebar** — its two navs, `dash-nav` and `page-nav`, are both horizontal top
 * bars — so the *arrangement* here is an invention. The *behaviour* is not: React Aria's
 * `NavigationTree` is a nested, hierarchical set of links, which is what a sidebar actually is.
 *
 * Everything visible is still the sheet's own vocabulary, turned on its side:
 *
 * - `.ds-link-caps` — 14px, `-0.01em`, uppercase, white at 70% going to white on hover — is the
 *   sheet's nav link, and it is the whole of what an item is here.
 * - The sheet's own `[aria-current="page"] { color: var(--c-teal) }` is how it marks the current
 *   page. `NavigationTree`'s `selectedRoute` produces the same thing as `data-current`, and adds
 *   `data-current-ancestor` for the parents of the current route — which a top bar never needed
 *   and a tree cannot do without.
 * - `.ds-panel` is the surface, `.ds-div-hair` divides the groups, `.ds-count` — 11px in the
 *   selected-yellow — is the badge.
 *
 * ### The four parts of a row, and why the order is the order
 *
 * A row is **an icon column, then the link, then the disclosure**. The icon leads because a sidebar
 * that carries glyphs has one column of them and it is the leftmost thing the eye lands on; the
 * disclosure trails because that is the far end of the row, where a count also lands, and because
 * the leading column is already spoken for by the icon. The reservation that used to hold a
 * chevron's box is now the **icon's** box (`NAV_ICON`), drawn on every row whether or not it has a
 * glyph, for the reason the chevron's was: a column of labels that steps in and out as the eye reads
 * down it says nothing true about anything.
 *
 * ### The rail, and what a row becomes when there is no room for a label
 *
 * `isCollapsed` narrows the panel to an icon column. A label does not fit, and dropping it would
 * take the item's *name* away with it — so it stays in the markup at zero width (`NAV_TEXT`) and
 * keeps saying "Dashboard" to a screen reader while showing nothing. Three things follow from that,
 * and each of them is why the rail is more than `w-16`:
 *
 * - **The count becomes the dot on the icon's shoulder.** A number cannot be read at 6px, but its
 *   presence can, and the number itself is still in the markup the dot clips.
 * - **The tooltip is the label.** The rail is the one place where the tooltip is the only way to know
 *   what a control is, which is what `delay={0}` is for. It hangs on a **React Aria `Link`**, not on
 *   the plain anchor the wide panel draws: `TooltipTrigger` hands its trigger its props through the
 *   Focusable context rather than by cloning, so a bare `<a>` never receives them and the tooltip
 *   would simply never open.
 * - **The disclosure goes quiet rather than away.** React Aria refuses an expandable item with no
 *   expand button, and it is right to: a rail whose branches cannot be opened is a rail that lies.
 *   So the button keeps its place in the focus order and appears in the row's corner when the row is
 *   pointed at or focused — the one thing on this surface that is invisible until you need it.
 */
/** As tall as the page it sits beside, not as tall as its links: a sidebar that stops short reads as
 * a floating panel, which is the one thing it is not. */
const NAV_PANEL = [
  'flex flex-col min-h-full',
  'border-e border-border-soft bg-card',
].join(' ')

/** The wide panel, and the rail. One or the other — never both, since two width utilities are a coin toss. */
const NAV_WIDTH = 'w-56'
const NAV_RAIL_WIDTH = 'w-16'

/**
 * Indentation by nesting depth, from the tree's own `level`. Written as whole literals rather than
 * as arithmetic on `level`, because Tailwind reads source text and cannot see a computed class —
 * the map is the only reason these three utilities exist in the stylesheet at all.
 */
export const NAV_LEVEL: Record<number, string> = {
  1: 'ps-[18px]',
  2: 'ps-[30px]',
  3: 'ps-[42px]',
}

/**
 * The hairline that follows a branch down the page, drawn by every row below the first level at
 * **its parent's icon column** — 26px, the centre of a level-1 icon box that runs 18px to 34px.
 *
 * Without it, indentation is the only thing saying a row is inside another one, and an indent is a
 * measurement the eye has to take against the panel edge rather than a line it can follow. It is
 * drawn per row rather than per group because React Aria renders the rows of a tree flat — a nested
 * item is a sibling row, not a child of a container — so a row is the only element with a height to
 * hang it from.
 */
export const NAV_GUIDE: Record<number, string> = {
  2: 'before:absolute before:inset-y-0 before:start-[25px] before:w-px before:bg-border-soft before:content-[""]',
  3: 'before:absolute before:inset-y-0 before:start-[37px] before:w-px before:bg-border-soft before:content-[""]',
}

/**
 * The sheet's `.ds-link-caps`, at the item's own depth. **The row is where every state lands** —
 * hover, current, focus, pressed and disabled are all written here, and the label and the anchor
 * inside it inherit, so a state and a colour never meet on two different elements.
 *
 * The disclosure is not drawn here. It is a real `<button slot="chevron">` at the row's trailing
 * edge, because React Aria refuses an expandable item without one — a pseudo-element cannot be
 * pressed, named or reached by a keyboard — and the icon's box is reserved on every row so that
 * labels share a left edge (see `NAV_ICON`).
 */
export const NAV_ITEM = [
  'relative flex cursor-pointer items-center gap-2 pe-[18px] py-2.5',
  'text-[14px] tracking-[-0.01em] uppercase',
  'transition-colors duration-(--duration-fast) ease-pulse',
  // The row is the tree's interactive surface, so this is where every state lands — and where every
  // rule is written. The anchor inside only inherits, which is what keeps React Aria's state and
  // this system's colours from meeting on two different elements. Nothing else may set a colour
  // here: `:has()` carries the specificity of its argument, so a rule like it ties with the hover
  // rule below and the outcome falls to source order.
  'text-foreground/70',
  // A fill, not only a brighter label: a sidebar is a column of targets, and the wash is what makes
  // the row under the pointer read as one. The sheet's own row treatment (`.ds-row--hover`) and
  // `Accordion`'s header both do this, and the value is the header's.
  'data-[hovered]:bg-foreground/5 data-[hovered]:text-foreground',
  // Where you are takes the accent; the route you are under comes up to full strength and goes no
  // further. The accent is the system's one accent, and two items coloured with it would stop
  // saying which one you are on.
  'data-[current]:text-primary',
  // **The current row is washed as well as accented, and the wash is the hover wash.** On a row that
  // now leads with an icon, the accent is one glyph and one word at the end of a long line, and
  // `selectedRoute` is worth more than that: the row is what says "this one" at a glance, and the
  // accent then says *where*. It shares the hover's value deliberately — a current row that darkens
  // as the pointer crosses it would be a third state saying nothing the other two do not.
  'data-[current]:bg-foreground/5',
  'data-[current-ancestor]:text-foreground',
  // The reset removes the tap highlight, so a row that does not answer a press is silent on a phone.
  // It dims rather than recolours: `text-foreground` would be the same as hover, and on the current
  // row — which carries the accent — it would substitute a different colour instead of deepening
  // the one it has, which is the rule this system's states follow.
  'data-[pressed]:opacity-80',
  // **The ring is on the row for the arrow keys, and on the anchor for Tab.** The row is what the
  // tree marks `data-focused` when its *virtual* focus moves (`aria-activedescendant`, the grid
  // holding the real focus). Tab is a different route: it lands on the anchor inside the row, and
  // React Aria does **not** move `focusedKey` when DOM focus moves between anchors — measured, by
  // tabbing twice and reading `data-focused`: the first row keeps it. So a ring on the row alone
  // would stay behind on the first row while the second anchor drew nothing. The anchor therefore
  // carries the ring itself on `focus-visible`, and the row's own ring is suppressed while an
  // anchor inside it has the focus, so exactly one ring is drawn either way.
  'data-[focused]:outline-1 data-[focused]:outline-offset-[-3px]',
  'data-[focused]:outline-ring',
  // The anchor inside has the focus: its own ring is the one to draw.
  'data-[focused]:has-[:focus-visible]:outline-transparent',
  // **The rail.** 44px of row inside a 64px column, so the wash the pointer paints is the rounded
  // square the icon sits in rather than a bar across the panel — which is also the 44px a finger
  // needs. The level's indent goes: there is no room for a hierarchy in a column of icons, and
  // `NAV_GUIDE` has nothing to align with.
  '[[data-collapsed]_&]:mx-2.5 [[data-collapsed]_&]:rounded-md',
  '[[data-collapsed]_&]:ps-0 [[data-collapsed]_&]:pe-0 [[data-collapsed]_&]:py-1',
].join(' ')

/** The sheet's field legend: 12px, uppercase, `0.04em`, quieter than the items beneath it. */
/**
 * The disclosure. React Aria requires a real button here and says so at runtime if it is missing —
 * "Expandable tree items must contain a expand button so screen reader users can expand/collapse
 * the item" — which is the warning that replaced an earlier version of this component that tried to
 * draw a caret as a pseudo-element. A pseudo-element cannot be pressed and cannot be named.
 *
 * It is a sibling of the anchor rather than inside it, because a button inside a link is not a thing.
 */
export const NAV_CHEVRON = [
  'grid size-4 shrink-0 place-items-center',
  'cursor-pointer text-foreground/45',
  'transition-[color,opacity] duration-(--duration-fast) ease-pulse',
  // 16px of caret, 24px of target.
  'relative after:absolute after:content-[""] after:-inset-1',
  // **The branch you are inside, when the page you are on is hidden.** A collapsed parent cannot show
  // the accent on its label — nav.md argues that, and rightly: two accented labels stop saying which one
  // you are on — so the cue goes on the one glyph that means "there is more in here". The `[[…]_&]` form
  // is the one `Tabs` already uses for its conditional rules, and the accent never reaches a label, so
  // "where you are" is still said exactly once.
  '[[data-current-ancestor]_&]:text-primary',
  'data-[hovered]:text-foreground',
  'data-[pressed]:opacity-70',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-ring',
].join(' ')

/**
 * The box a chevron sits in, drawn even when there is no chevron in it. `Tree`'s rows lead with their
 * disclosure and this is the reservation that keeps their labels on one left edge; `Nav`'s rows lead
 * with an icon and reserve the same idea as `NAV_ICON`. It stays here because the row vocabulary is
 * this file's — a tree and a sidebar share it — and the constant is the half of it only the tree uses.
 */
export const NAV_GUTTER = 'size-4 shrink-0'

/**
 * The disclosure in the rail. **Quiet, not gone.** It keeps its place in the focus order and its name
 * — React Aria requires it and a rail whose branches cannot be opened is a rail that lies — and it
 * steps out of the way into the row's corner, where it appears the moment the row is pointed at or
 * focused. The caret's rotation still comes from the render props, so an open branch still points the
 * way it points in the wide panel.
 */
/**
 * The box the disclosure sits in at the **trailing** edge, drawn even when there is no disclosure in
 * it — the mirror of the leading reservation, and it exists for the count.
 *
 * `Nav.Count` is `ms-auto`: it lands on the anchor's trailing edge, which is where the row's numbers
 * form a column from. With the disclosure moved out to the far end of the row, a row with one would
 * end its anchor 24px earlier than a row without, and the column of numbers would step in and out
 * down the side — which is the one thing the column is for. Every row reserves the box, so every
 * count shares one right edge. In the rail the box goes: the disclosure there is absolutely
 * positioned, and a row that keeps 16px of nothing beside a 40px icon is not a rail.
 */
const NAV_END_GUTTER = `${NAV_GUTTER} [[data-collapsed]_&]:hidden`

const NAV_CHEVRON_RAIL = [
  '[[data-collapsed]_&]:absolute [[data-collapsed]_&]:end-1 [[data-collapsed]_&]:bottom-1',
  '[[data-collapsed]_&]:opacity-0',
  '[[data-collapsed]_&]:[[data-hovered]_&]:opacity-100',
  '[[data-collapsed]_&]:focus-visible:opacity-100',
].join(' ')

/**
 * The box the row leads with, drawn even when there is no icon in it.
 *
 * **A row with an icon cannot start its label 24px to the right of a row without one.** A sidebar is
 * a column of edges, and a label that steps in and out as the eye reads down it is the first thing
 * anyone sees. Reserving the box on every row gives one left edge per level and one icon column down
 * the panel, at the cost of 24px on a row that needed none. In the rail it is the row (40px, with the
 * wash around it), which is what makes the icon something a finger can hit.
 *
 * The glyph itself is `aria-hidden`: every item already says its `textValue`, and a second,
 * decorative name beside it is noise in a list of destinations.
 */
export const NAV_ICON = [
  'grid size-4 shrink-0 place-items-center',
  '[[data-collapsed]_&]:size-10',
].join(' ')

/**
 * What the item says, wrapped so that the rail can fold it away without losing it.
 *
 * `contents` in the wide panel, so the label and the `Nav.Count` are the anchor's own flex children
 * and the count's `ms-auto` still reaches the trailing edge. In the rail it becomes a zero-width
 * clipped box instead: the text is gone from the screen and **still in the accessibility tree**,
 * which is the difference between a rail and a rail nobody can use. The count is not clipped with
 * it — the dot is absolutely positioned against the row, and an ancestor's `overflow` does not reach
 * a descendant whose containing block is outside it.
 */
const NAV_TEXT = [
  'contents',
  '[[data-collapsed]_&]:block [[data-collapsed]_&]:w-0 [[data-collapsed]_&]:overflow-hidden',
  '[[data-collapsed]_&]:whitespace-nowrap',
].join(' ')

/**
 * The anchor inside the row's content. The row is pressable and focusable and the anchor is neither
 * a second tab stop nor a second ring — it is there so the item is a *link*: middle-click, open in a
 * new tab, the status bar, and a screen reader announcing a destination rather than a widget.
 */
export const NAV_LABEL = [
  'flex min-w-0 flex-1 items-center gap-2 text-inherit no-underline',
  // The rail: the anchor *is* the icon's box, so the link is as big as the thing it stands for and
  // the icon has no gap to centre around.
  '[[data-collapsed]_&]:justify-center [[data-collapsed]_&]:gap-0',
].join(' ')
const NAV_LABEL_LINK = `${NAV_LABEL} outline-1 outline-offset-[-3px] outline-transparent focus-visible:outline-ring`

export const NAV_HEADER = [
  // Room above, almost none below: the legend belongs to the items under it. At `pt-3` it sat as close
  // to the row above as one row sits to the next, which read as one more item rather than a group's name.
  'px-[18px] pt-5 pb-1.5',
  'text-[12px] uppercase tracking-[0.04em] text-foreground/55',
  // **The rail has no room for a legend, so the legend becomes the rule.** A group's name at 64px is
  // three wrapped words; the line the name was standing for is what is left of it, and the text stays
  // in the markup for the same reason a label does — a group a screen reader cannot hear is not
  // grouped at all.
  '[[data-collapsed]_&]:mx-2.5 [[data-collapsed]_&]:my-2 [[data-collapsed]_&]:h-px [[data-collapsed]_&]:p-0',
  '[[data-collapsed]_&]:bg-border-soft',
].join(' ')

/**
 * A group of items, divided from the one above it by the sheet's hairline.
 *
 * **The line is the group's own edge, not a decorative rule between two of them.** A sidebar in this
 * system is a stack of groups — the page's own destinations, then the collections under them — and
 * without an edge the last row of one group and the first row of the next sit exactly as close as
 * two rows inside either. The legend `Nav.Header` adds above it names the group; a group that is
 * named by an item instead (`Nav.Section` around an expandable parent) still gets the line.
 */
const NAV_SECTION = 'border-t border-border-soft'

/**
 * The sheet's `.ds-count`, pushed to the trailing edge so the numbers form a column down the side
 * rather than trailing each label at whatever length it happens to be — which is the whole reason a
 * sidebar carries counts at all.
 *
 * **It is quiet here; the sheet has it in the selected-yellow.** There the count appears in a horizontal
 * top bar, beside one or two other words. In a vertical sidebar two of them at `--warning` become the
 * loudest thing on the surface, while the labels they qualify — 70% white, 14px uppercase — read as the
 * quieter half of the pair. Yellow means *selection* everywhere else in this system, so spending it on
 * a number that is merely true costs it that meaning. The column stays: the alignment is what makes a
 * count scannable, not the colour.
 *
 * **In the rail it is a dot.** A 6px circle on the icon's shoulder says "there is something here" and
 * nothing more, which is all a 64px column can say; the number is still inside it, clipped, so the
 * screen reader that can read a count still gets one. It is not the accent, for the same reason the
 * wide panel's count is not the selected-yellow — the accent means *where you are*, and this dot would
 * be on a different row.
 */
const NAV_COUNT = [
  'ms-auto text-[11px] text-foreground/45 tabular-nums',
  '[[data-collapsed]_&]:absolute [[data-collapsed]_&]:top-1.5 [[data-collapsed]_&]:end-1.5',
  '[[data-collapsed]_&]:size-1.5 [[data-collapsed]_&]:overflow-hidden',
  '[[data-collapsed]_&]:rounded-full [[data-collapsed]_&]:bg-foreground/55',
].join(' ')

export interface NavProps<T extends object> extends Omit<
  AriaNavigationTreeProps<T>,
  'className'
> {
  ref?: React.Ref<HTMLDivElement>
  /**
   * The sidebar's surface and width. A function is passed through, since React Aria's own
   * `className` may be one.
   */
  className?: AriaNavigationTreeProps<T>['className']
  /**
   * The route you are on. Each item's `href` is matched against it, so this is the one prop that
   * makes a sidebar show where you are — and it is why the component has no `isCurrent` per item to
   * keep in sync.
   */
  selectedRoute?: AriaNavigationTreeProps<T>['selectedRoute']
  /**
   * The rail: the same tree at 64px, where an item is its icon. Labels stay in the markup and in the
   * accessibility tree at zero width, each one also becomes its item's tooltip, a count becomes the
   * dot on the icon's shoulder, and the disclosure waits in the row's corner until the row is
   * pointed at or focused. A tree and a rail are one component because they are one tree — the
   * alternative is two sidebars that drift apart.
   */
  isCollapsed?: boolean
  children?: React.ReactNode
}

/**
 * What a `Nav.Item` hands the `Nav.Label` inside it. Three things travel this way, and all three
 * are the item's rather than the label's: its destination, the string it is typed by, and the glyph
 * its row leads with.
 */
interface NavItemContextValue {
  href?: string
  textValue: string
  icon?: React.ReactNode
}

const NavItemContext = createContext<NavItemContextValue>({ textValue: '' })

/** Whether the enclosing `Nav` is a rail. One boolean for the whole subtree, read by every slot. */
const NavCollapsedContext = createContext(false)

export interface NavItemProps<T extends object = object> extends Omit<
  AriaNavigationTreeItemProps<T>,
  'className'
> {
  /**
   * The item's text, for keyboard type-ahead. Required rather than derived, and that is the honest
   * signature: an item's label here is markup — a count badge, often — and React Aria needs the
   * string it would actually be typed. It is also what the rail shows in place of a label.
   */
  textValue: string
  className?: AriaNavigationTreeItemProps<T>['className']
  /**
   * The glyph the row leads with, drawn in the column every row reserves whether or not it fills it.
   * A parent's icon is the same box as a child's, so a branch and the rows under it line up.
   *
   * It is a prop rather than a `Nav.Icon` slot inside the label. The label owns the row's edges —
   * the reserved box, the anchor, the trailing disclosure — and a slot would let the glyph land in
   * the middle of the link, or twice, and only the layout would know.
   */
  icon?: React.ReactNode
  /** A `Nav.Label`, and any nested `Nav.Item`s. */
  children: React.ReactNode
}

export interface NavLabelProps extends Omit<
  AriaNavigationTreeItemContentProps,
  'children'
> {
  /** What the item says. */
  children: React.ReactNode
  /** Overrides the enclosing `Nav.Item`'s `href`. Rarely wanted. */
  href?: string
}

export interface NavSectionProps<
  T extends object,
> extends AriaNavigationTreeSectionProps<T> {
  children?: React.ReactNode
}

export interface NavHeaderProps extends AriaNavigationTreeHeaderProps {
  children?: React.ReactNode
}

export interface NavCountProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

/** React Aria's `className` is either a string or a function of the item's state; join both. */
function joinClass(
  base: string,
  className: string | ((props: never) => string) | undefined,
  props: unknown,
): string {
  const extra =
    typeof className === 'function'
      ? (className as (p: unknown) => string)(props)
      : className
  return [base, extra].filter(Boolean).join(' ')
}

/**
 * One destination, or one that holds others. Use it as `Nav.Item`, inside a `Nav`. Nest a
 * `Nav.Item` inside it and it becomes the parent of a subtree — the nesting *is* the hierarchy, and
 * the indentation follows from it.
 *
 * Exported as `NavItem` only so tooling can resolve it; consume the compound form `Nav.Item`.
 */
export function NavItem<T extends object = object>({
  className,
  textValue,
  href,
  icon,
  children,
  ...props
}: NavItemProps<T>) {
  return (
    <NavItemContext.Provider value={{ href, textValue, icon }}>
      <AriaNavigationTreeItem
        href={href}
        textValue={textValue}
        className={(renderProps) =>
          joinClass(
            [
              NAV_ITEM,
              NAV_LEVEL[renderProps.level] ?? NAV_LEVEL[3],
              NAV_GUIDE[renderProps.level] ?? '',
            ]
              .filter(Boolean)
              .join(' '),
            className,
            renderProps,
          )
        }
        {...props}
      >
        {children}
      </AriaNavigationTreeItem>
    </NavItemContext.Provider>
  )
}

/**
 * What an item says. Use it as `Nav.Label`, as the first child of a `Nav.Item`.
 *
 * It draws the row: the icon's box, the link, the trailing disclosure. The icon comes from the
 * `Nav.Item` above it, because the *row* is where the column is reserved and the label is the thing
 * that fills it.
 *
 * Exported as `NavLabel` only so tooling can resolve it; consume the compound form `Nav.Label`.
 */
export function NavLabel({ children, href, ...props }: NavLabelProps) {
  const item = useContext(NavItemContext)
  const collapsed = useContext(NavCollapsedContext)
  const target = href ?? item.href

  const body = (
    <>
      <span aria-hidden="true" data-slot="icon" className={NAV_ICON}>
        {item.icon}
      </span>
      <span data-slot="text" className={NAV_TEXT}>
        {children}
      </span>
    </>
  )

  return (
    <AriaNavigationTreeItemContent {...props}>
      {({ hasChildItems, isExpanded }) => (
        <>
          {/* The state comes from the render props, not from a rule reaching down from the row —
              which is the arrangement the whole system avoids, because a group variant ties on
              specificity with its own child's rules and loses on source order. */}
          {target ? (
            collapsed ? (
              // **React Aria's `Link`, in the rail only, and only because of the tooltip.**
              // `TooltipTrigger` does not clone its child — it provides the trigger's props through
              // the Focusable context, which a bare `<a>` never reads, so the rail's tip would never
              // open. This renders the same `<a href>` the wide panel draws; the wide panel keeps the
              // plain one, since a tooltip it does not show is no reason to change the element the
              // rest of the library's links are not.
              <Tooltip delay={0}>
                <AriaLink href={target} className={NAV_LABEL_LINK}>
                  {body}
                </AriaLink>
                <Tooltip.Content>
                  <Tooltip.Text>{item.textValue}</Tooltip.Text>
                </Tooltip.Content>
              </Tooltip>
            ) : (
              // The anchor stays in the tab order, and that is not an oversight. The tree itself is
              // `tabindex="-1"` and its rows carry no tabindex at all — a *navigation* tree keeps a
              // virtual focus and expects its items to be real links, which are then the only things
              // here a keyboard can actually reach.
              <a href={target} className={NAV_LABEL_LINK}>
                {body}
              </a>
            )
          ) : (
            <span className={NAV_LABEL}>{body}</span>
          )}
          {hasChildItems ? (
            <AriaButton
              slot="chevron"
              className={`${NAV_CHEVRON} ${NAV_CHEVRON_RAIL}`}
            >
              <NavCaret expanded={isExpanded} />
            </AriaButton>
          ) : (
            // An empty box where the disclosure would be — see `NAV_END_GUTTER`: without it the
            // counts down the side lose their column, because a count rides the anchor's trailing
            // edge and a row with a chevron ends its anchor 24px sooner than one without.
            <span aria-hidden="true" className={NAV_END_GUTTER} />
          )}
        </>
      )}
    </AriaNavigationTreeItemContent>
  )
}

/** A chevron from two borders, pointing at the group when closed and down at it when open. */
/**
 * The disclosure chevron, exported because a tree and a nav point the same way — the row vocabulary
 * `NAV_ITEM` / `NAV_LEVEL` / `NAV_CHEVRON` is shared with `Tree`, and the glyph belongs with it.
 * `Nav` itself is the only consumer of the rest of this file.
 */
export function NavCaret({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'size-1.5 border-e border-b border-current',
        'motion-safe:transition-[rotate] motion-safe:duration-(--duration-fast) ease-pulse',
        expanded ? 'rotate-45' : 'rotate-[-45deg]',
      ].join(' ')}
    />
  )
}

/**
 * A group of items, divided from the one above it. Use it as `Nav.Section`.
 *
 * Exported as `NavSection` only so tooling can resolve it; consume the compound form `Nav.Section`.
 */
export function NavSection<T extends object>({
  className,
  children,
  ...props
}: NavSectionProps<T>) {
  return (
    <AriaNavigationTreeSection
      data-slot="section"
      className={[NAV_SECTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaNavigationTreeSection>
  )
}

/**
 * A group's heading. Use it as `Nav.Header`.
 *
 * Exported as `NavHeader` only so tooling can resolve it; consume the compound form `Nav.Header`.
 */
export function NavHeader({ children, ...props }: NavHeaderProps) {
  return (
    <AriaNavigationTreeHeader className={NAV_HEADER} {...props}>
      <span data-slot="text" className={NAV_TEXT}>
        {children}
      </span>
    </AriaNavigationTreeHeader>
  )
}

/**
 * A count beside an item's label. Use it as `Nav.Count`.
 *
 * Exported as `NavCount` only so tooling can resolve it; consume the compound form `Nav.Count`.
 */
export function NavCount({ className, children, ...props }: NavCountProps) {
  return (
    <span
      data-slot="count"
      className={[NAV_COUNT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Styled element. Not exported — `Nav` below is the public symbol, and docgen reads the JSDoc from
 * the *exported* declaration, not this one.
 */
function NavRoot<T extends object>({
  className,
  isCollapsed = false,
  children,
  ...props
}: NavProps<T>) {
  return (
    <NavCollapsedContext.Provider value={isCollapsed}>
      <AriaNavigationTree
        data-slot="nav"
        data-collapsed={isCollapsed || undefined}
        className={(renderProps) =>
          joinClass(
            `${NAV_PANEL} ${isCollapsed ? NAV_RAIL_WIDTH : NAV_WIDTH}`,
            className,
            renderProps,
          )
        }
        {...props}
      >
        {children}
      </AriaNavigationTree>
    </NavCollapsedContext.Provider>
  )
}

/**
 * A navigation sidebar — a nested, hierarchical set of links. **The sheet has no sidebar**: its two
 * navs, `dash-nav` and `page-nav`, are both horizontal top bars. The arrangement is therefore an
 * invention, but the behaviour is React Aria's `NavigationTree`, which is what a sidebar actually
 * is, and every visible part is the sheet's own vocabulary turned on its side.
 *
 * ```tsx
 * <Nav aria-label="Primary" selectedRoute="/monitors/fra1">
 *   <Nav.Item href="/" textValue="Overview" icon={<GridIcon />}>
 *     <Nav.Label>Overview</Nav.Label>
 *   </Nav.Item>
 *   <Nav.Item href="/monitors" textValue="Monitors" icon={<GaugeIcon />}>
 *     <Nav.Label>
 *       Monitors <Nav.Count>12</Nav.Count>
 *     </Nav.Label>
 *     <Nav.Item href="/monitors/fra1" textValue="fra1">
 *       <Nav.Label>fra1 · Frankfurt</Nav.Label>
 *     </Nav.Item>
 *   </Nav.Item>
 *   <Nav.Section>
 *     <Nav.Header>Account</Nav.Header>
 *     <Nav.Item href="/settings" textValue="Settings" icon={<GearIcon />}>
 *       <Nav.Label>Settings</Nav.Label>
 *     </Nav.Item>
 *   </Nav.Section>
 * </Nav>
 * ```
 *
 * ### `selectedRoute` is the whole of "where am I"
 *
 * There is no `isCurrent` to set per item and keep in sync with the router. One string is matched
 * against every `href`, and the tree marks not only the item that matches but its **ancestors** —
 * `data-current-ancestor` — which is the thing a top bar never needed and a tree cannot do without.
 * The current row is washed and its label takes the accent; an ancestor comes up to full strength
 * and goes no further, because two accented labels would stop saying which one you are on.
 *
 * ### The nesting is the hierarchy
 *
 * A `Nav.Item` inside a `Nav.Item` is its child. The indentation follows from the depth React Aria
 * reports, not from anything the consumer writes — so moving an item one level is moving a line of
 * JSX, and nothing else has to be kept in step.
 *
 * ### The label contains a count, so the text is passed separately
 *
 * `textValue` is required, and that is the honest signature rather than an annoyance: the label is
 * markup, often with a badge in it, and keyboard type-ahead needs the string someone would actually
 * type. Deriving it from the rendered label would pick up the count. In the rail it is also the one
 * thing about an item that survives: it is the tooltip and the accessible name.
 *
 * ### A navigation tree is links, not buttons
 *
 * `aria-label` matters more here than on a single-purpose page: a screen reader lists every nav on
 * the page by its label, and "Primary" is what tells them which one this is.
 *
 * ### `isCollapsed` is a rail, not a hidden sidebar
 *
 * The same tree at 64px. Labels keep their place in the accessibility tree, a count becomes the dot
 * on the icon's shoulder, each item's `textValue` becomes its tooltip, and the disclosure waits in
 * the row's corner until the row is pointed at or focused. What the rail does *not* do is take
 * anything away: every item is still a link, every branch still opens, and the way back is the state
 * the consumer already holds — `isCollapsed` is a prop, not internal state, because the control that
 * toggles it belongs beside the sidebar rather than inside it.
 */
export const Nav = Object.assign(NavRoot, {
  Item: NavItem,
  Label: NavLabel,
  Section: NavSection,
  Header: NavHeader,
  Count: NavCount,
})
