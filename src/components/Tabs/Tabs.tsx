import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  TabPanels as AriaTabPanels,
  Tabs as AriaTabs,
} from 'react-aria-components'
import type {
  TabListProps as AriaTabListProps,
  TabPanelProps as AriaTabPanelProps,
  TabPanelsProps as AriaTabPanelsProps,
  TabProps as AriaTabProps,
  TabsProps as AriaTabsProps,
} from 'react-aria-components'

/**
 * The sheet's `.ds-tabs`: a row with one hairline under all of it, which each tab's indicator
 * then sits on top of. The line is at 30% — `--border-soft` — which is the one place in the
 * sheet where a boundary is deliberately this quiet, because the selected tab's 2px of teal is
 * what is meant to be read.
 */
const LIST = [
  'flex border-b border-border-soft',
  // The orientation describes the strip, so the strip is what turns. A vertical list runs down
  // the page, and its hairline moves to the trailing edge — the same treatment as the sheet's
  // horizontal one, which is a line along the strip's long side with the indicator over it.
  'aria-[orientation=vertical]:flex-col',
  'aria-[orientation=vertical]:border-b-0 aria-[orientation=vertical]:border-e',
].join(' ')

/**
 * The sheet's `.ds-tab`. `relative` because the indicator is drawn against it, and the indicator
 * is an `::after` rather than a border so that fading it in cannot move the one above it — which
 * a border going from 0 to 2px would do to every tab in the row.
 */
const TAB = [
  'relative cursor-pointer select-none',
  'bg-transparent px-[18px] py-3 text-[13px] tracking-[0.02em] text-foreground/55',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[hovered]:text-foreground',
  'data-[selected]:text-foreground',
  'data-[pressed]:text-foreground',
  // The indicator spans the tab's own text, not its padding, so it reads as belonging to the
  // label rather than to the cell.
  'after:absolute after:inset-x-[18px] after:-bottom-px after:h-0.5',
  'after:bg-primary after:opacity-0 after:transition-opacity after:duration-(--duration-fast)',
  // The indicator fades on the system's own curve, not on Tailwind's default one.
  'after:ease-pulse',
  // The same indicator, turned: down the tab's own text rather than across it, over the strip's
  // hairline at its trailing edge. Written against the list's `aria-orientation` rather than a
  // group variant, because a group variant ties on specificity with the rules above and would
  // leave the outcome to source order.
  // Physical block edges rather than `inset-y-*`: the horizontal rule sets `bottom` physically,
  // and a logical `inset-block` would leave the two fighting over the same box edge.
  // `start-auto` rather than `inset-x-auto`, because the latter writes both inline edges and
  // would clobber the `end-` offset below.
  '[[aria-orientation=vertical]_&]:after:start-auto',
  '[[aria-orientation=vertical]_&]:after:end-[-1px]',
  '[[aria-orientation=vertical]_&]:after:top-3',
  '[[aria-orientation=vertical]_&]:after:bottom-3',
  '[[aria-orientation=vertical]_&]:after:h-auto',
  '[[aria-orientation=vertical]_&]:after:w-0.5',
  'data-[selected]:after:opacity-100',
  // The sheet gives a tab the shared ring, unlike a field, whose border is the edge it repeats.
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-[3px]',
  'data-[focus-visible]:outline-ring',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
].join(' ')

/** The sheet's `.ds-count`: 11px, in the selected-yellow, beside the label. */
const COUNT = 'ms-2 text-[11px] text-warning'

/** The sheet's `.ds-tabpanel`: the panel clears the list by 18px and nothing more. */
const PANEL = [
  'pt-[18px]',
  // A focusable tabpanel that draws nothing is a focusable tabpanel with no focus: the
  // same transparent-outline-at-rest pattern `Table`'s column and `GridList`'s row use.
  'outline-1 -outline-offset-2 outline-transparent',
  'data-[focus-visible]:outline-ring',
].join(' ')

export interface TabsProps extends Omit<
  AriaTabsProps,
  'isDisabled' | 'children' | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Disables the whole set. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaTabsProps['isDisabled']
  /** The set owns the value, as a single key. `onSelectionChange` gives it back. */
  selectedKey?: AriaTabsProps['selectedKey']
  defaultSelectedKey?: AriaTabsProps['defaultSelectedKey']
  onSelectionChange?: AriaTabsProps['onSelectionChange']
  /**
   * Which way the tab list runs. It describes the *strip*, not the panels — a vertical list
   * stacks its tabs and puts its hairline on the trailing edge, and where the panel then sits
   * is the consumer's layout to decide, not this prop's.
   */
  orientation?: AriaTabsProps['orientation']
  className?: string
  /** `Tabs.List`, then `Tabs.Panel`s — or a `Tabs.Panels` around them. */
  children?: React.ReactNode
}

export interface TabsListProps extends Omit<
  AriaTabListProps<object>,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface TabsTabProps extends Omit<
  AriaTabProps,
  'isDisabled' | 'children' | 'className'
> {
  /** The tab's label — usually a `Tabs.Count` alongside it. */
  children?: React.ReactNode
  className?: string
}

export interface TabsCountProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface TabsPanelsProps extends Omit<
  AriaTabPanelsProps<object>,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface TabsPanelProps extends Omit<
  AriaTabPanelProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * The tab strip. Use it as `Tabs.List`. Give it an `aria-label` when there is no visible heading
 * above it, since the list is what a screen reader announces the set by.
 *
 * Exported as `TabsList` only so tooling can resolve it; consume the compound form `Tabs.List`.
 */
export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <AriaTabList
      className={[LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTabList>
  )
}

/**
 * One tab. Use it as `Tabs.Tab`, inside a `Tabs.List`. Its `id` is what ties it to the matching
 * `Tabs.Panel`, and the arrow keys move between tabs from anywhere in the set.
 *
 * Exported as `TabsTab` only so tooling can resolve it; consume the compound form `Tabs.Tab`.
 */
export function TabsTab({ className, children, ...props }: TabsTabProps) {
  return (
    <AriaTab className={[TAB, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </AriaTab>
  )
}

/**
 * A count beside a tab's label, in the sheet's `.ds-count`. Use it as `Tabs.Count`.
 *
 * It is a slot rather than a number passed to `Tabs.Tab`, because a count is frequently the
 * whole reason to look at the tab — how many checks are failing — and the moment it needs a
 * dot, a colour of its own or a title, a prop stops being enough.
 *
 * Exported as `TabsCount` only so tooling can resolve it; consume the compound form
 * `Tabs.Count`.
 */
export function TabsCount({ className, children, ...props }: TabsCountProps) {
  return (
    <span
      data-slot="count"
      className={[COUNT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * The run of panels. Use it as `Tabs.Panels` around the `Tabs.Panel`s. Optional — the panels
 * work without it — but it keeps the set's two halves readable when the contents are long.
 *
 * Exported as `TabsPanels` only so tooling can resolve it; consume the compound form
 * `Tabs.Panels`.
 */
export function TabsPanels({ className, children, ...props }: TabsPanelsProps) {
  return (
    <AriaTabPanels className={className} {...props}>
      {children}
    </AriaTabPanels>
  )
}

/**
 * The content behind a tab. Use it as `Tabs.Panel`; its `id` matches the tab's. Only the
 * selected panel is rendered — the rest are unmounted, not hidden — so a panel that needs to
 * hold state across a switch has to say so with `shouldForceMount`.
 *
 * Exported as `TabsPanel` only so tooling can resolve it; consume the compound form
 * `Tabs.Panel`.
 */
export function TabsPanel({ className, children, ...props }: TabsPanelProps) {
  return (
    <AriaTabPanel
      className={[PANEL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTabPanel>
  )
}

/**
 * Styled element. Not exported — `Tabs` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function TabsRoot({ ref, className, children, ...props }: TabsProps) {
  return (
    <AriaTabs ref={ref} className={className} {...props}>
      {children}
    </AriaTabs>
  )
}

/**
 * A set of tabs — the sheet's `.ds-tabs` and `.ds-tabpanel`. One panel is shown at a time, and
 * the whole set is a single tab stop: the arrow keys move between tabs rather than the Tab key,
 * which is what lets a keyboard user step past the strip instead of through it.
 *
 * ```tsx
 * <Tabs defaultSelectedKey="overview">
 *   <Tabs.List aria-label="Monitor detail">
 *     <Tabs.Tab id="overview">Overview</Tabs.Tab>
 *     <Tabs.Tab id="checks">
 *       Checks <Tabs.Count>3</Tabs.Count>
 *     </Tabs.Tab>
 *   </Tabs.List>
 *   <Tabs.Panel id="overview">Everything at a glance.</Tabs.Panel>
 *   <Tabs.Panel id="checks">Three failing.</Tabs.Panel>
 * </Tabs>
 * ```
 *
 * Use tabs to switch *views of the same thing*, not to step through a form: a tab set hides its
 * unselected panels, so anything a user must fill in belongs in a page flow rather than behind
 * a tab they might not open.
 */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Count: TabsCount,
  Panels: TabsPanels,
  Panel: TabsPanel,
})
