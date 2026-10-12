import { createContext, useContext } from 'react'
import {
  Button as AriaButton,
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
 */
/**
 * As tall as the page it sits beside, not as tall as its links: a sidebar that stops short reads as
 * a floating panel, which is the one thing it is not.
 */
const NAV_NAV = [
  'flex w-56 flex-col min-h-full',
  'border-e border-border-soft bg-card',
].join(' ')

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
 * The sheet's `.ds-link-caps`, at the item's own depth. **The row is where every state lands** —
 * hover, current, focus, pressed and disabled are all written here, and the label and the anchor
 * inside it inherit, so a state and a colour never meet on two different elements.
 *
 * The disclosure is not drawn here. It is a real `<button slot="chevron">` in `Nav.Label`, because React
 * Aria refuses an expandable item without one — a pseudo-element cannot be pressed, named or reached by
 * a keyboard — and `Nav.Label` reserves its box on every row so that labels share a left edge (see
 * `NAV_GUTTER`).
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
  // an anchor inside it has the focus, so exactly one ring is drawn either way.
  'data-[focused]:outline-1 data-[focused]:outline-offset-[-3px]',
  'data-[focused]:outline-ring',
  // The anchor inside has the focus: its own ring is the one to draw.
  'data-[focused]:has-[:focus-visible]:outline-transparent',
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
 * The box the disclosure sits in, drawn even when there is no disclosure in it.
 *
 * **A row with a chevron cannot start its label 24px to the right of a row without one.** The caret is
 * 16px with 8px of gap after it, and a sidebar is a column of edges: a label that steps in and out as
 * the eye reads down it is the first thing anyone sees, and it says nothing true about the hierarchy.
 * Reserving the box on every row gives one left edge per level, and costs a leaf 24px of a 224px
 * sidebar — which is what the alignment is worth.
 */
export const NAV_GUTTER = 'size-4 shrink-0'

/**
 * The anchor inside the row's content. The row is pressable and focusable and the anchor is neither
 * a second tab stop nor a second ring — it is there so the item is a *link*: middle-click, open in a
 * new tab, the status bar, and a screen reader announcing a destination rather than a widget.
 */
export const NAV_LABEL =
  'flex min-w-0 flex-1 items-center gap-2 text-inherit no-underline'
const NAV_LABEL_LINK = `${NAV_LABEL} outline-1 outline-offset-[-3px] outline-transparent focus-visible:outline-ring`

export const NAV_HEADER = [
  // Room above, almost none below: the legend belongs to the items under it. At `pt-3` it sat as close
  // to the row above as one row sits to the next, which read as one more item rather than a group's name.
  'px-[18px] pt-5 pb-1.5',
  'text-[12px] uppercase tracking-[0.04em] text-foreground/55',
].join(' ')

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
 */
const NAV_COUNT = 'ms-auto text-[11px] text-foreground/45 tabular-nums'

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
  children?: React.ReactNode
}

/**
 * The item's `href`, handed to the `Nav.Label` inside it. The item needs it for `selectedRoute` to
 * match and the anchor needs it to navigate, and this is what keeps one prop from being written
 * twice and drifting.
 */
const HrefContext = createContext<string | undefined>(undefined)

export interface NavItemProps<T extends object = object> extends Omit<
  AriaNavigationTreeItemProps<T>,
  'className'
> {
  /**
   * The item's text, for keyboard type-ahead. Required rather than derived, and that is the honest
   * signature: an item's label here is markup — a count badge, often — and React Aria needs the
   * string it would actually be typed.
   */
  textValue: string
  className?: AriaNavigationTreeItemProps<T>['className']
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
  children,
  ...props
}: NavItemProps<T>) {
  return (
    <HrefContext.Provider value={href}>
      <AriaNavigationTreeItem
        href={href}
        textValue={textValue}
        className={(renderProps) =>
          joinClass(
            [NAV_ITEM, NAV_LEVEL[renderProps.level] ?? NAV_LEVEL[3]]
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
    </HrefContext.Provider>
  )
}

/**
 * What an item says. Use it as `Nav.Label`, as the first child of a `Nav.Item`.
 *
 * Exported as `NavLabel` only so tooling can resolve it; consume the compound form `Nav.Label`.
 */
export function NavLabel({ children, href, ...props }: NavLabelProps) {
  const inherited = useContext(HrefContext)
  const target = href ?? inherited
  return (
    <AriaNavigationTreeItemContent {...props}>
      {({ hasChildItems, isExpanded }) => (
        <>
          {/* The state comes from the render props, not from a rule reaching down from the row —
              which is the arrangement the whole system avoids, because a group variant ties on
              specificity with its own child's rules and loses on source order. */}
          {hasChildItems ? (
            <AriaButton slot="chevron" className={NAV_CHEVRON}>
              <NavCaret expanded={isExpanded} />
            </AriaButton>
          ) : (
            // An empty box where a chevron would be: a leaf's label has to start on the same left edge
            // as its siblings', or the column reads as steps that mean nothing.
            <span aria-hidden="true" className={NAV_GUTTER} />
          )}
          {target ? (
            // The anchor stays in the tab order, and that is not an oversight. The tree itself is
            // `tabindex="-1"` and its rows carry no tabindex at all — a *navigation* tree keeps a
            // virtual focus and expects its items to be real links, which are then the only things
            // here a keyboard can actually reach.
            <a href={target} className={NAV_LABEL_LINK}>
              {children}
            </a>
          ) : (
            <span className={NAV_LABEL}>{children}</span>
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
 * A group of items under a `Nav.Header`. Use it as `Nav.Section`.
 *
 * Exported as `NavSection` only so tooling can resolve it; consume the compound form `Nav.Section`.
 */
export function NavSection<T extends object>({
  children,
  ...props
}: NavSectionProps<T>) {
  return (
    <AriaNavigationTreeSection {...props}>{children}</AriaNavigationTreeSection>
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
      {children}
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
  children,
  ...props
}: NavProps<T>) {
  return (
    <AriaNavigationTree
      data-slot="nav"
      className={(renderProps) => joinClass(NAV_NAV, className, renderProps)}
      {...props}
    >
      {children}
    </AriaNavigationTree>
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
 *   <Nav.Item href="/" textValue="Overview">
 *     <Nav.Label>Overview</Nav.Label>
 *   </Nav.Item>
 *   <Nav.Item href="/monitors" textValue="Monitors">
 *     <Nav.Label>
 *       Monitors <Nav.Count>12</Nav.Count>
 *     </Nav.Label>
 *     <Nav.Item href="/monitors/fra1" textValue="fra1">
 *       <Nav.Label>fra1 · Frankfurt</Nav.Label>
 *     </Nav.Item>
 *   </Nav.Item>
 *   <Nav.Section>
 *     <Nav.Header>Account</Nav.Header>
 *     <Nav.Item href="/settings" textValue="Settings">
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
 * The current item takes the accent, exactly as the sheet's `[aria-current="page"]` rule does; an
 * ancestor comes up to full strength and goes no further, because two items in the accent would
 * stop saying which one you are on.
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
 * type. Deriving it from the rendered label would pick up the count.
 *
 * ### A navigation tree is links, not buttons
 *
 * `aria-label` matters more here than on a single-purpose page: a screen reader lists every nav on
 * the page by its label, and "Primary" is what tells them which one this is.
 *
 * There is no collapsed rail mode. A sidebar that shrinks to icons needs a tooltip per icon and a
 * way back, and this system has neither wired up — better to leave it whole than to half-do it.
 */
export const Nav = Object.assign(NavRoot, {
  Item: NavItem,
  Label: NavLabel,
  Section: NavSection,
  Header: NavHeader,
  Count: NavCount,
})
