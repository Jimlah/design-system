import {
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxLoadMoreItem as AriaListBoxLoadMoreItem,
  ListBoxSection as AriaListBoxSection,
} from 'react-aria-components'
import type {
  HeaderProps as AriaHeaderProps,
  ListBoxItemProps as AriaListBoxItemProps,
  ListBoxLoadMoreItemProps as AriaListBoxLoadMoreItemProps,
  ListBoxProps as AriaListBoxProps,
  ListBoxSectionProps as AriaListBoxSectionProps,
} from 'react-aria-components'

import type { ReactNode } from 'react'

import { LOAD_MORE, LoadMoreSpinner } from '../loadMore'
import { OPTION, OPTION_LIST } from '../optionList'

// `overflow-clip` so the rounded panel actually clips the option rows it holds — a row's hover fill
// is a rectangle and would otherwise paint over the corner. The panel's own focus ring is drawn on the
// panel, not inside it, so clipping its children costs nothing. `clip` rather than `hidden`: this box
// is not a scroller, and `hidden` would leave one a script could move.
const PANEL = 'border border-border-strong bg-card rounded-xl overflow-clip'

export interface ListBoxProps<T> extends Omit<
  AriaListBoxProps<T>,
  | 'children'
  | 'className'
  | 'selectionMode'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'onSelectionChange'
  | 'disabledKeys'
  | 'dragAndDropHooks'
> {
  /** `none`, `single` or `multiple`. A list box with no selection mode is a list of labels. */
  selectionMode?: AriaListBoxProps<T>['selectionMode']
  /** The chosen options, by each item's `id`. Controlled. */
  selectedKeys?: AriaListBoxProps<T>['selectedKeys']
  /** What starts chosen. Uncontrolled. */
  defaultSelectedKeys?: AriaListBoxProps<T>['defaultSelectedKeys']
  /** Called with the new set of keys. */
  onSelectionChange?: AriaListBoxProps<T>['onSelectionChange']
  /** Options that cannot be chosen. */
  disabledKeys?: AriaListBoxProps<T>['disabledKeys']
  /** Wires drag-and-drop, from React Aria's own `useDragAndDrop`. */
  dragAndDropHooks?: AriaListBoxProps<T>['dragAndDropHooks']
  className?: string
  children?: ReactNode
}

export interface ListBoxItemProps<T = object> extends Omit<
  AriaListBoxItemProps<T>,
  'className'
> {
  className?: string
}

export interface ListBoxSectionProps<T> extends Omit<
  AriaListBoxSectionProps<T>,
  'className'
> {
  className?: string
}

export interface ListBoxHeaderProps extends Omit<AriaHeaderProps, 'className'> {
  className?: string
}

export interface ListBoxLoadMoreProps extends Omit<
  AriaListBoxLoadMoreItemProps,
  'className'
> {
  className?: string
}

/**
 * One option. Use it as `ListBox.Item`.
 *
 * It carries the same class list the `Select` menu's options do, imported rather than copied — an option
 * that looks one way inside a select and another way in a list on the page would be one component wearing
 * two designs.
 */
export function ListBoxItem<T = object>({
  className,
  ...props
}: ListBoxItemProps<T>) {
  return (
    <AriaListBoxItem
      data-slot="list-box-item"
      className={[OPTION, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/** A named group of options. Use it as `ListBox.Section`. */
export function ListBoxSection<T>({
  className,
  ...props
}: ListBoxSectionProps<T>) {
  return <AriaListBoxSection className={className} {...props} />
}

/** A section's heading. Use it as `ListBox.Header`, inside a `ListBox.Section`. */
export function ListBoxHeader({ className, ...props }: ListBoxHeaderProps) {
  return (
    <AriaHeader
      data-slot="list-box-header"
      className={[
        'px-3.5 pt-3 pb-1 text-[11px] uppercase tracking-[0.08em] text-foreground/45',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The row that asks for the next page. Use it as `ListBox.LoadMore`, last inside `ListBox`.
 *
 * It only works inside a virtualized collection — see `gridlist.md` for the mechanism and the end-to-end
 * proof that it fires; this is the same sentinel on the same shared recipe.
 */
export function ListBoxLoadMore({
  className,
  children,
  ...props
}: ListBoxLoadMoreProps) {
  return (
    <AriaListBoxLoadMoreItem
      data-slot="list-box-load-more"
      className={[LOAD_MORE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <LoadMoreSpinner />}
    </AriaListBoxLoadMoreItem>
  )
}

function ListBoxRoot<T>({ className, children, ...props }: ListBoxProps<T>) {
  return (
    <AriaListBox
      data-slot="list-box"
      className={[PANEL, OPTION_LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaListBox>
  )
}

/**
 * A list of options where the choice is a value, not a set of rows.
 *
 * ```tsx
 * <ListBox aria-label="Region" selectionMode="single" defaultSelectedKeys={['fra']}>
 *   <ListBox.Item id="fra">Frankfurt</ListBox.Item>
 *   <ListBox.Item id="iad">Ashburn</ListBox.Item>
 * </ListBox>
 * ```
 *
 * **This is not `GridList`.** A grid list is a set of **rows** — a dashboard's monitors, a run of results
 * — where each row is a thing you look at and act on. A list box is a set of **options**, where the list's
 * whole purpose is to produce one value. The two look similar and answer different questions, which is
 * why both exist and why an option and a row are styled differently.
 *
 * It is what `Select`, `ComboBox` and `Menu` build their panels out of, so those already shared these
 * recipes; this is the same list standing on the page, with its own border rather than a popover's.
 */
export const ListBox = Object.assign(ListBoxRoot, {
  Item: ListBoxItem,
  Section: ListBoxSection,
  Header: ListBoxHeader,
  LoadMore: ListBoxLoadMore,
})
