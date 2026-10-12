import {
  Button as AriaButton,
  Tree as AriaTree,
  TreeHeader as AriaTreeHeader,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent,
  TreeSection as AriaTreeSection,
  TreeLoadMoreItem as AriaTreeLoadMoreItem,
} from 'react-aria-components'
import { LOAD_MORE, LoadMoreSpinner } from '../loadMore'
import type {
  SectionProps as AriaSectionProps,
  TreeItemContentProps as AriaTreeItemContentProps,
  TreeItemProps as AriaTreeItemProps,
  TreeProps as AriaTreeProps,
  TreeLoadMoreItemProps as AriaTreeLoadMoreItemProps,
} from 'react-aria-components'

import type { ComponentProps, ReactNode } from 'react'

import {
  NAV_CHEVRON,
  NAV_HEADER,
  NAV_ITEM,
  NAV_LABEL,
  NAV_LEVEL,
  NavCaret,
} from '../Nav/Nav'

/**
 * Join a class list, dropping anything falsy.
 *
 * React Aria types `className` as `string | ((renderProps) => string)`, and the root passes it straight
 * through, so this has to accept the function form as well as the resolved string.
 */
type ClassPart = string | false | undefined | ((...args: never[]) => string)
const join = (...parts: ClassPart[]) =>
  parts.filter((part): part is string => typeof part === 'string').join(' ')

export interface TreeProps<T extends object = object> extends Omit<
  AriaTreeProps<T>,
  | 'children'
  | 'className'
  | 'selectionMode'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'onSelectionChange'
  | 'expandedKeys'
  | 'defaultExpandedKeys'
  | 'onExpandedChange'
  | 'disabledKeys'
> {
  /** `none`, `single` or `multiple`. A tree with no selection mode is a tree of labels. */
  selectionMode?: AriaTreeProps<T>['selectionMode']
  /** The chosen rows, by each item's `id`. */
  selectedKeys?: AriaTreeProps<T>['selectedKeys']
  /** What starts chosen. */
  defaultSelectedKeys?: AriaTreeProps<T>['defaultSelectedKeys']
  /** Called with the new set of keys. */
  onSelectionChange?: AriaTreeProps<T>['onSelectionChange']
  /** Which rows are open, by `id`. */
  expandedKeys?: AriaTreeProps<T>['expandedKeys']
  /** What starts open. Without an `id` on the item this matches nothing and the tree renders collapsed, silently. */
  defaultExpandedKeys?: AriaTreeProps<T>['defaultExpandedKeys']
  /** Called as rows open and close. */
  onExpandedChange?: AriaTreeProps<T>['onExpandedChange']
  /** Rows that cannot be chosen. */
  disabledKeys?: AriaTreeProps<T>['disabledKeys']

  className?: AriaTreeProps<T>['className']
  children?: ReactNode
}

export interface TreeItemProps<T extends object = object> extends Omit<
  AriaTreeItemProps<T>,
  'className' | 'children'
> {
  className?: AriaTreeItemProps<T>['className']
  children?: ReactNode
}

export interface TreeLabelProps extends Omit<
  AriaTreeItemContentProps,
  'className' | 'children'
> {
  children?: ReactNode
}

export interface TreeSectionProps<T extends object = object> extends Omit<
  AriaSectionProps<T>,
  'className' | 'children'
> {
  className?: string
  children?: ReactNode
}

/**
 * `TreeHeader` reports a `<header>` element while React Aria's exported `HeaderProps` describes a
 * `<div>`, so the two disagree by one DOM generic. Taking the component's own props avoids the
 * argument entirely, and is what the header's type actually is.
 */
export type TreeHeaderProps = Omit<
  ComponentProps<typeof AriaTreeHeader>,
  'className'
> & {
  className?: string
}

/**
 * What an item says, plus its disclosure chevron.
 *
 * **The chevron is a button with `slot="chevron"`, drawn from the render props.** React Aria hands over
 * `hasChildItems` and `isExpanded` and renders nothing for either — so a parent row has no affordance
 * at all until this draws one, and a leaf correctly gets none. It is the same `NAV_CHEVRON` and the same
 * `NavCaret` a sidebar row uses, so a tree and a nav disclose in one direction.
 *
 * It carries **no `className`**, because `TreeItemContent` takes none — the row's own class list is on
 * the row, and everything here is inside it.
 *
 * Exported as `TreeLabel` only so tooling can resolve it; consume the compound form `Tree.Label`.
 */
export function TreeLabel({ children, ...props }: TreeLabelProps) {
  return (
    <AriaTreeItemContent {...props}>
      {({ hasChildItems, isExpanded }) => (
        <>
          {hasChildItems ? (
            <AriaButton slot="chevron" className={NAV_CHEVRON}>
              <NavCaret expanded={isExpanded} />
            </AriaButton>
          ) : null}
          <span className={NAV_LABEL}>{children}</span>
        </>
      )}
    </AriaTreeItemContent>
  )
}

/**
 * One node. Use it as `Tree.Item` — it nests inside itself for depth.
 *
 * Exported as `TreeItem` only so tooling can resolve it; consume the compound form `Tree.Item`.
 */
export function TreeItem<T extends object = object>({
  className,
  textValue,
  children,
  ...props
}: TreeItemProps<T>) {
  return (
    <AriaTreeItem
      textValue={textValue}
      // **The indent is the level**, read from the render props rather than tracked by hand, so a
      // subtree of any depth lines up without the consumer counting anything.
      className={(renderProps) =>
        join(
          NAV_ITEM,
          // **`NAV_ITEM` marks `data-[current]`, and this is not that.** A navigation tree says where
          // you are with `isCurrent`; a selection tree says which row you chose. Sharing the row
          // vocabulary without this line left the chosen row with no accent at all — brighter only
          // through the browser's own selection handling. The accent is the same teal, because "the one
          // you are looking at" is the same idea in both.
          'data-[selected]:text-teal',
          NAV_LEVEL[renderProps.level] ?? NAV_LEVEL[3],
          typeof className === 'function' ? className(renderProps) : className,
        )
      }
      {...props}
    >
      {children}
    </AriaTreeItem>
  )
}

/**
 * A group of nodes. Use it as `Tree.Section`.
 *
 * Exported as `TreeSection` only so tooling can resolve it; consume the compound form `Tree.Section`.
 */
export function TreeSection<T extends object = object>({
  className,
  children,
  ...props
}: TreeSectionProps<T>) {
  return (
    <AriaTreeSection className={join(className)} {...props}>
      {children}
    </AriaTreeSection>
  )
}

/**
 * The legend above a section. Use it as `Tree.Header`.
 *
 * Exported as `TreeHeader` only so tooling can resolve it; consume the compound form `Tree.Header`.
 */
export function TreeHeader({ className, children, ...props }: TreeHeaderProps) {
  return (
    <AriaTreeHeader className={join(NAV_HEADER, className)} {...props}>
      {children}
    </AriaTreeHeader>
  )
}

/**
 * A hierarchical list of items, expanded and collapsed in place.
 *
 * ```tsx
 * <Tree aria-label="Files" selectionMode="single">
 *   <Tree.Item id="src" textValue="src">
 *     <Tree.Label>src</Tree.Label>
 *     <Tree.Item id="index" textValue="index.ts">
 *       <Tree.Label>index.ts</Tree.Label>
 *     </Tree.Item>
 *   </Tree.Item>
 * </Tree>
 * ```
 *
 * **This is what `Nav` is built on, with the links taken out.** React Aria's `NavigationTree` extends
 * its `Tree`, so the two share one row vocabulary — a label, a level indent and a disclosure chevron,
 * exported from `Nav` and composed here rather than copied, because a tree of files and a tree of links
 * should not drift apart in a sidebar.
 *
 * Reach for this when the hierarchy is **data** — a file explorer, a category tree, an outline — and
 * for `Nav` when it is **a set of destinations** and the current one is a URL. The difference is what a
 * click does: this selects, that navigates.
 *
 * **It renders a treegrid, not a list.** `role="row"` and `role="gridcell"` are the shape React Aria
 * builds, so a story queries those and a screen reader announces depth and position for free.
 *
 * **Expansion is the item's own state**, keyed by each item's `id` — the same key `selectedKeys` and
 * `disabledKeys` speak in. Without an `id`, `defaultExpandedKeys` matches nothing and the tree renders
 * fully collapsed, with no error and no warning.
 */
function TreeRoot<T extends object = object>({
  className,
  children,
  ...props
}: TreeProps<T>) {
  return (
    <AriaTree
      data-slot="tree"
      className={join('flex flex-col p-1 outline-none select-none', className)}
      {...props}
    >
      {children}
    </AriaTree>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */

/**
 * The row that asks for the next page. Use it as `Tree.LoadMore`, last inside `Tree`.
 *
 * It watches the scroll position and calls `onLoadMore` when it comes into view.
 *
 * **It only works inside a virtualized collection** — `Virtualizer` supplies the scroll container the
 * sentinel observes. Without one React Aria renders nothing for it at all when idle, so there is no
 * sentinel and no request. `GridList.LoadMore` carries the end-to-end proof; this is the same machinery in
 * another collection.
 *
 * **It draws nothing until `isLoading`**, and the spinner is `motion-safe`.
 */
export function TreeLoadMore({
  className,
  children,
  ...props
}: AriaTreeLoadMoreItemProps) {
  return (
    <AriaTreeLoadMoreItem
      data-slot="tree-load-more"
      className={[LOAD_MORE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <LoadMoreSpinner />}
    </AriaTreeLoadMoreItem>
  )
}

export const Tree = Object.assign(TreeRoot, {
  Item: TreeItem,
  Label: TreeLabel,
  Section: TreeSection,
  Header: TreeHeader,
  LoadMore: TreeLoadMore,
})
