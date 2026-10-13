import {
  GridList as AriaGridList,
  GridListHeader as AriaGridListHeader,
  GridListItem as AriaGridListItem,
  GridListSection as AriaGridListSection,
  GridListLoadMoreItem as AriaGridListLoadMoreItem,
} from 'react-aria-components'
import { LOAD_MORE, LoadMoreSpinner } from '../loadMore'
import type {
  GridListHeaderProps as AriaGridListHeaderProps,
  GridListItemProps as AriaGridListItemProps,
  GridListProps as AriaGridListProps,
  GridListSectionProps as AriaGridListSectionProps,
  GridListLoadMoreItemProps as AriaGridListLoadMoreItemProps,
} from 'react-aria-components'

import type { ReactNode } from 'react'

export interface GridListProps<T> extends Omit<
  AriaGridListProps<T>,
  | 'children'
  | 'className'
  | 'selectionMode'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'onSelectionChange'
  | 'disabledKeys'
  | 'dragAndDropHooks'
> {
  /**
   * Wires drag-and-drop, from React Aria's own `useDragAndDrop`. Without it a row cannot be picked up —
   * and a `DropIndicator` has nowhere to be rendered, so the two arrive together.
   */
  dragAndDropHooks?: AriaGridListProps<T>['dragAndDropHooks']

  /** `none`, `single` or `multiple`. */
  selectionMode?: AriaGridListProps<T>['selectionMode']
  /** The chosen rows, by each item's `id`. */
  selectedKeys?: AriaGridListProps<T>['selectedKeys']
  /** What starts chosen. */
  defaultSelectedKeys?: AriaGridListProps<T>['defaultSelectedKeys']
  /** Called with the new set of keys. */
  onSelectionChange?: AriaGridListProps<T>['onSelectionChange']
  /** Rows that cannot be chosen. */
  disabledKeys?: AriaGridListProps<T>['disabledKeys']

  /** The rows, or a function that renders one from an item. */
  children?: AriaGridListProps<T>['children']
  className?: string
}

export interface GridListItemProps<T = object> extends Omit<
  AriaGridListItemProps<T>,
  'className' | 'children'
> {
  className?: string
  /** What the row says, for keyboard type-ahead and for a screen reader. */
  textValue?: string
  children?: ReactNode
}

/** The inside of a row, laid out as a column instead of React Aria's inline default. */
export interface GridListBodyProps {
  className?: string
  children?: ReactNode
}

export interface GridListSectionProps<T> extends Omit<
  AriaGridListSectionProps<T>,
  'className' | 'children'
> {
  className?: string
  children?: ReactNode
}

export interface GridListHeaderProps extends Omit<
  AriaGridListHeaderProps,
  'className'
> {
  className?: string
}

/**
 * The surface the rows sit on.
 *
 * **The sheet has no list or grid class of its own** — its dashboard is a stack of `.ds-panel`s — so
 * the arrangement is an invention and every visible part is borrowed: the panel, the hairline, the
 * uppercase legend. `GridList` is the sheet's dashboard as something you can select from.
 *
 * A list is a column and a grid is a `grid`, and only the caller knows which they want, so the layout
 * is a `className` rather than a `layout` prop that would have to guess.
 */
const LIST = [
  'flex flex-col outline-none',
  'data-[empty]:items-center data-[empty]:justify-center',
].join(' ')

/**
 * A row: the sheet's panel, with the selected state on its edge rather than on a fill.
 *
 * A fill would have to carry `ink`, and a card is mostly *text* — a filled card would invert every
 * word in it. The edge and a hairline of accent is enough to say which one is chosen, and it leaves
 * the text alone.
 */
const ITEM = [
  'flex items-start gap-3 p-4',
  'border border-border-strong bg-card rounded-xl',
  'text-foreground outline-2 -outline-offset-2 outline-transparent',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[hovered]:bg-muted',
  'data-[pressed]:bg-foreground/10',
  'data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-ring',
  'data-[selected]:border-primary',
  'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed',
].join(' ')

const BODY = 'flex min-w-0 flex-1 flex-col gap-1'

const SECTION = 'flex flex-col gap-2'

/** The sheet's `.ds-field-legend`, over a run of rows. */
const HEADER = [
  'px-0.5 pt-1 pb-0.5',
  'font-mono text-[11px] uppercase tracking-[0.08em] text-foreground/45',
].join(' ')

/**
 * The empty state, styled rather than left as a bare string, because an empty list is the state a
 * dashboard is in most mornings.
 */
const EMPTY = 'px-4 py-10 text-center text-[13px] text-foreground/45'

/**
 * A selectable list or grid of rows. Use it for anything the page is a collection of — a dashboard's
 * monitors, a run of results, a set of files.
 *
 * ```tsx
 * <GridList aria-label="Monitors" selectionMode="multiple" className="grid grid-cols-3 gap-3">
 *   <GridList.Item id="fra1" textValue="fra1 · Frankfurt">
 *     <GridList.Body>
 *       <span className="font-mono text-[13px] text-foreground">fra1 · Frankfurt</span>
 *       <span className="text-[12px] text-foreground/70">up · 42ms</span>
 *     </GridList.Body>
 *   </GridList.Item>
 * </GridList>
 * ```
 *
 * **A grid list is a table that is not a table.** Both render `role="grid"` with rows, and both are
 * navigated with the arrow keys — but a table's columns are the point, and a grid list's rows are.
 * Reach for `Table` when the data has a header row worth aligning to; reach for this when the rows
 * are cards.
 *
 * The selection is React Aria's: `selectionMode`, `selectedKeys`, `disabledKeys`, and a row that
 * reports itself through `aria-selected` and `data-selected`. The keyboard model is the table's —
 * arrows move, Space toggles, Ctrl+A selects the lot — with type-ahead over each row's `textValue`.
 *
 * `GridList.Section` and `GridList.Header` group rows that belong together, and
 * `renderEmptyState` gives the list something to say when there is nothing in it, which a bare
 * `map` over an empty array never does.
 */
function GridListRoot<T>({ className, children, ...props }: GridListProps<T>) {
  return (
    <AriaGridList
      data-slot="grid-list"
      className={[LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGridList>
  )
}

/**
 * One row. Use it as `GridList.Item`, with a `GridList.Body` inside it and a `textValue` for
 * type-ahead.
 *
 * Exported as `GridListItem` only so tooling can resolve it; consume the compound form
 * `GridList.Item`.
 */
export function GridListItem<T = object>({
  className,
  children,
  ...props
}: GridListItemProps<T>) {
  return (
    <AriaGridListItem
      className={[ITEM, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGridListItem>
  )
}

/**
 * What a row holds, as a column. Use it as `GridList.Body`.
 *
 * Exported as `GridListBody` only so tooling can resolve it; consume the compound form
 * `GridList.Body`.
 */
export function GridListBody({ className, children }: GridListBodyProps) {
  return (
    <div className={[BODY, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * A group of rows. Use it as `GridList.Section`, with a `GridList.Header` at the top of it.
 *
 * Exported as `GridListSection` only so tooling can resolve it; consume the compound form
 * `GridList.Section`.
 */
export function GridListSection<T>({
  className,
  children,
  ...props
}: GridListSectionProps<T>) {
  return (
    <AriaGridListSection
      className={[SECTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGridListSection>
  )
}

/**
 * A group's legend. Use it as `GridList.Header`.
 *
 * Exported as `GridListHeader` only so tooling can resolve it; consume the compound form
 * `GridList.Header`.
 */
export function GridListHeader({
  className,
  children,
  ...props
}: GridListHeaderProps) {
  return (
    <AriaGridListHeader
      className={[HEADER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGridListHeader>
  )
}

/**
 * What a list says when it has nothing to show.
 *
 * It is a **component** rather than a string so a caller can put a button in it — "nothing here yet"
 * and "nothing here yet, add one" are different messages, and the second is the one a person on an
 * empty dashboard needs.
 */
export function GridListEmpty({ children }: { children?: ReactNode }) {
  return <div className={EMPTY}>{children}</div>
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` would leave TypeScript
 * unaware of the slots — the same shape every other component here uses, and the reason the root is
 * not itself exported under the plain name.
 */
/**
 * The row that asks for the next page. Use it as `GridList.LoadMore`, last inside `GridList`.
 *
 * ```tsx
 * <GridList aria-label="Monitors" onLoadMore={() => loadNextPage()}>
 *   {rows}
 *   <GridList.LoadMore isLoading={isLoading} onLoadMore={() => loadNextPage()} />
 * </GridList>
 * ```
 *
 * **It watches the scroll position and calls `onLoadMore` when it comes into view** — React Aria's own
 * sentinel, not something this component implements. What it adds is the row: a quiet centred strip at
 * the foot of the list, where the next page arrives.
 *
 * **It draws nothing until `isLoading`.** React Aria renders the sentinel's children only while loading, so
 * the element is always in the DOM to be observed and the spinner appears inside it when there is work in
 * flight. The spinner is `motion-safe`, so a reader who has asked for less motion gets a still one rather
 * than none.
 */
export function GridListLoadMore({
  className,
  children,
  ...props
}: AriaGridListLoadMoreItemProps) {
  return (
    <AriaGridListLoadMoreItem
      data-slot="grid-list-load-more"
      className={[LOAD_MORE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <LoadMoreSpinner />}
    </AriaGridListLoadMoreItem>
  )
}

export const GridList = Object.assign(GridListRoot, {
  Item: GridListItem,
  Body: GridListBody,
  Section: GridListSection,
  Header: GridListHeader,
  Empty: GridListEmpty,
  LoadMore: GridListLoadMore,
})
