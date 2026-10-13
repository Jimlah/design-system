import { Checkbox } from '../Checkbox/Checkbox'
import {
  Cell as AriaCell,
  Column as AriaColumn,
  ColumnResizer as AriaColumnResizer,
  ResizableTableContainer as AriaResizableTableContainer,
  TableFooter as AriaTableFooter,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  TableLoadMoreItem as AriaTableLoadMoreItem,
} from 'react-aria-components'
import { LOAD_MORE, LoadMoreSpinner } from '../loadMore'
import type {
  CellProps as AriaCellProps,
  ColumnProps as AriaColumnProps,
  ColumnResizerProps as AriaColumnResizerProps,
  ResizableTableContainerProps as AriaResizableTableContainerProps,
  TableFooterProps as AriaTableFooterProps,
  RowProps as AriaRowProps,
  TableBodyProps as AriaTableBodyProps,
  TableHeaderProps as AriaTableHeaderProps,
  TableProps as AriaTableProps,
  TableLoadMoreItemProps as AriaTableLoadMoreItemProps,
} from 'react-aria-components'

/**
 * The sheet's `.ds-rows` and `.ds-row`: a panel-coloured stack separated by hairlines, closed by
 * a softer one. The sheet builds its rows out of a grid with fixed column widths, because it is
 * laying out one dashboard; a table is a table, so the columns are the table's own and the
 * surfaces are what get borrowed.
 */
const ROOT = 'w-full border-collapse border-b border-border-soft text-start'

/**
 * The sheet gives a row's own label — `.ds-row__label`, the name of the thing — 12px uppercase
 * letterspaced, and its figures 16–20px. Those are cell contents, not a header. The column
 * headings take the sheet's quieter legend (`.ds-select-group-label`): 11px, spaced, at 45%.
 */
const FOOTER = 'border-t border-border text-foreground/60'

const SELECTION_GUTTER =
  'has-[[data-slot=selection]]:w-12 has-[[data-slot=selection]]:px-3'

const COLUMN = [
  'relative border-b border-border px-5 py-2.5 text-start',
  SELECTION_GUTTER,
  'text-[11px] font-normal uppercase tracking-[0.08em] text-foreground/45',
  // A transparent outline at rest, never `outline-none` — see AGENTS.md. With `outline-none` the
  // focus ring below could never draw: it sets the shared --tw-outline-style that outline-1 reads back.
  'outline-1 -outline-offset-2 outline-transparent',
  'data-[focus-visible]:outline-1 data-[focus-visible]:-outline-offset-2',
  'data-[focus-visible]:outline-ring',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
].join(' ')

/**
 * The sheet's `.ds-row`: a panel surface with a hairline under it, and its last row without one
 * because `.ds-rows` closes the stack itself.
 *
 * Its hover is the native `:hover` — see below — and it is a *lighter solid*, not a wash: the
 * sheet picks `#12161c` against `.ds-panel`'s
 * `#0D1015`, which is `--muted` here. A translucent overlay would look similar over the
 * page and quite different over anything else, and it would leave the row see-through — a row is
 * a surface, and a surface does not become a window on hover.
 */
const ROW = [
  'border-b border-border bg-card last:border-b-0',
  'transition-colors duration-(--duration-fast) ease-pulse',
  // The native `:hover`, not `data-[hovered]` — which React Aria does set, but wires to pointer
  // *enter*, so a pointer over a cell does not shade its row. For a static surface like a row the
  // pseudo-class is both correct and what the sheet uses (`.ds-row--hover:hover`). Note that
  // neither route can be driven from a story: see the note in Table.stories.tsx.
  'hover:bg-muted',
  'data-[selected]:bg-muted',
  'data-[pressed]:bg-foreground/10',
  'data-[focus-visible]:outline-1 data-[focus-visible]:-outline-offset-2',
  'data-[focus-visible]:outline-ring',
  'data-[disabled]:opacity-40',
].join(' ')

/**
 * The sheet's `.ds-row__cell`: 13px at 75%, with the row's own name at full strength. That name is
 * the cell React Aria marks as the row header, so it is styled off the role rather than asked for
 * by a prop — one place to write it, and it cannot drift from which column is the row's identity.
 */
const CELL = [
  'px-5 py-3.5 align-middle',
  SELECTION_GUTTER,
  'text-[13px] leading-[1.5] text-foreground/75',
  // **A number in a column must not move as it changes.** The body font is monospace today, so
  // this is invisible — which is exactly why it has to come from the property and not from the
  // typeface: the day a theme picks a proportional family, the column starts dancing.
  'tabular-nums',
  // The other half of a table that survives its data. An auto-layout table ignores the root's
  // `overflow-wrap: break-word` while it measures a cell, so a long hostname or URL widens the
  // table instead of wrapping inside it.
  'wrap-anywhere',
  '[&[role=rowheader]]:text-foreground',
  'data-[focus-visible]:outline-1 data-[focus-visible]:-outline-offset-2',
  'data-[focus-visible]:outline-ring',
].join(' ')

/**
 * The selection checkbox, drawn to sit in a table cell rather than beside a label: no text, and
 * the target is the control itself.
 */
const SELECTION = 'flex items-center justify-center'

export interface TableSelectionProps extends React.ComponentProps<
  typeof Checkbox
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLLabelElement>
}

/**
 * The checkbox that selects a row. Use it as `Table.Selection` — once in a `Table.Column` of its
 * own, once inside a `Table.Cell` in each row.
 *
 * ```tsx
 * <Table selectionMode="multiple">
 *   <Table.Column width={48}><Table.Selection /></Table.Column>
 *   ...
 *   <Table.Cell><Table.Selection /></Table.Cell>
 * ```
 *
 * **It is not wired to anything.** React Aria finds it by its `slot="selection"` and drives it:
 * the one in the column heading becomes select-all with its own **indeterminate** state when some
 * rows are chosen, and each row's own becomes that row's checkbox. Nothing here passes
 * `isSelected` or `onChange`, and passing them would fight the table.
 *
 * Exported as `TableSelection` only so tooling can resolve it; consume the compound form
 * `Table.Selection`.
 */
export function TableSelection({ className, ...props }: TableSelectionProps) {
  return (
    <Checkbox
      slot="selection"
      data-slot="selection"
      className={[SELECTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      <Checkbox.Indicator />
    </Checkbox>
  )
}

export interface TableProps extends Omit<
  AriaTableProps,
  'children' | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLTableElement>
  /**
   * Which rows are disabled, by the same keys their `id`s use. A table has no `isDisabled` of its
   * own — disabling one row of a table is a much more common thing to want than disabling all of
   * them, and React Aria's model is the per-row one.
   */
  disabledKeys?: AriaTableProps['disabledKeys']
  /** Which rows are selected, in multiple mode. */
  selectedKeys?: AriaTableProps['selectedKeys']
  defaultSelectedKeys?: AriaTableProps['defaultSelectedKeys']
  onSelectionChange?: AriaTableProps['onSelectionChange']
  selectionMode?: AriaTableProps['selectionMode']
  className?: string
  /** `Table.Header`, then `Table.Body`. */
  children?: React.ReactNode
}

export interface TableHeaderProps extends Omit<
  AriaTableHeaderProps<object>,
  'children' | 'className'
> {
  className?: string
  /** The `Table.Column`s this table is made of. */
  children?: React.ReactNode
}

export interface TableColumnProps extends Omit<
  AriaColumnProps,
  'children' | 'className'
> {
  /** Marks the column whose cell names the row. Exactly one per table. */
  isRowHeader?: AriaColumnProps['isRowHeader']
  /** Fixes the column's width, as the sheet's grid does for its own. */
  width?: AriaColumnProps['width']
  className?: string
  children?: React.ReactNode
}

export interface TableBodyProps extends Omit<
  AriaTableBodyProps<object>,
  'children' | 'className'
> {
  className?: string
  /** What to draw when there is nothing to show — an empty table reads as a broken one. */
  renderEmptyState?: AriaTableBodyProps<object>['renderEmptyState']
  /** The `Table.Row`s. */
  children?: React.ReactNode
}

export interface TableRowProps extends Omit<
  AriaRowProps<object>,
  'children' | 'className'
> {
  className?: string
  /** The `Table.Cell`s, one per column. */
  children?: React.ReactNode
}

export interface TableCellProps extends Omit<
  AriaCellProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * The column headings. Use it as `Table.Header`, with `Table.Column`s inside.
 *
 * Exported as `TableHeader` only so tooling can resolve it; consume the compound form
 * `Table.Header`.
 */
export function TableHeader({
  className,
  children,
  ...props
}: TableHeaderProps) {
  return (
    <AriaTableHeader className={className} {...props}>
      {children}
    </AriaTableHeader>
  )
}

/**
 * One column — its heading, and the width every cell under it takes. Use it as `Table.Column`.
 * Mark exactly one with `isRowHeader`: that is the column whose cell names the row, and it is
 * what a screen reader reads out before the rest of the row.
 *
 * Exported as `TableColumn` only so tooling can resolve it; consume the compound form
 * `Table.Column`.
 */
export function TableColumn({
  className,
  children,
  ...props
}: TableColumnProps) {
  return (
    <AriaColumn
      className={[COLUMN, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaColumn>
  )
}

/**
 * The rows. Use it as `Table.Body`, with `Table.Row`s inside. `renderEmptyState` lives here rather
 * than on the table, because it replaces the body — a table with nothing in it reads as a table
 * that failed rather than as one with nothing to say.
 *
 * Exported as `TableBody` only so tooling can resolve it; consume the compound form `Table.Body`.
 */
export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <AriaTableBody className={className} {...props}>
      {children}
    </AriaTableBody>
  )
}

/**
 * One row. Use it as `Table.Row`; its `id` is what `selectedKeys` speaks in.
 *
 * Exported as `TableRow` only so tooling can resolve it; consume the compound form `Table.Row`.
 */
export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <AriaRow className={[ROW, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </AriaRow>
  )
}

/**
 * One cell. Use it as `Table.Cell`. The cell under the `isRowHeader` column carries
 * `role="rowheader"` and is styled at full strength from that role, so which column identifies the
 * row is decided once, on the column.
 *
 * Exported as `TableCell` only so tooling can resolve it; consume the compound form `Table.Cell`.
 */
export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <AriaCell
      className={[CELL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaCell>
  )
}

/**
 * Styled element. Not exported — `Table` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
/**
 * The closing row group. Use it as `Table.Footer`, after `Table.Body`.
 *
 * **A footer is not a body row that happens to be last.** It is the table's conclusion — the totals, the
 * count, the average — and it is the one row a reader arrives at deliberately rather than scanning past.
 * So it is separated by a line above it instead of below, and its type is a step quieter than the data,
 * which is the same relationship the header has at the other end.
 *
 * It holds `Table.Row`s like the body does, because it is the same collection machinery.
 */
export function TableFooter({
  className,
  ...props
}: AriaTableFooterProps<object>) {
  return (
    <AriaTableFooter
      data-slot="table-footer"
      className={[FOOTER, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

function TableRoot({ ref, className, children, ...props }: TableProps) {
  return (
    <AriaTable
      ref={ref}
      className={[ROOT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTable>
  )
}

/**
 * The sheet's table rows — `.ds-rows` and `.ds-row`. A panel-coloured stack separated by
 * hairlines, closed by a softer one, with a row's own name at full strength and everything else
 * at 75%.
 *
 * ```tsx
 * <Table aria-label="Monitors">
 *   <Table.Header>
 *     <Table.Column isRowHeader>Monitor</Table.Column>
 *     <Table.Column>Status</Table.Column>
 *     <Table.Column>Uptime</Table.Column>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row id="fra1">
 *       <Table.Cell>fra1 · Frankfurt</Table.Cell>
 *       <Table.Cell>Up</Table.Cell>
 *       <Table.Cell>99.98%</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 *
 * Give it an `aria-label` — a table with no caption and no label is a grid of numbers with no
 * subject.
 *
 * **The header is the table's, not the sheet's.** The sheet has no table header at all: its rows
 * are a dashboard grid, where each cell holds its own 12px uppercase label above its value, so
 * the row carries its labels with it. A real table says them once at the top instead, and the
 * header takes the sheet's *quieter* legend style for it. Row headers are the exception — the
 * column marked `isRowHeader` is the row's own name, so it keeps full strength.
 *
 * `Table.Cell` has no numeric variant. The sheet's big yellow figure — 20px, letterspaced, in
 * `--warning` — belongs to its dashboard, where a number is the point of the row; in a table
 * it is one column of many, and a table of yellow figures is a table where nothing stands out.
 * Pass a `className` when a column really is the point.
 */

/**
 * The scroll container that makes a column resizable.
 *
 * **A `ColumnResizer` throws without it** — *"Wrap your `<Table>` in a `<ResizableTableContainer>` to
 * enable column resizing"* — so the two are one feature and not two props. It walks up to the first
 * scrollable element and measures that, which is why it has to be the thing that scrolls.
 */
export function TableResizable({
  className,
  children,
  ...props
}: AriaResizableTableContainerProps) {
  return (
    <AriaResizableTableContainer
      data-slot="resizable-table"
      className={['w-full overflow-x-auto overscroll-x-contain', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaResizableTableContainer>
  )
}

/**
 * The grip on a column's trailing edge. Use it as `Table.Resizer`, inside a `Table.Column`.
 *
 * It is a drag handle **and**, because React Aria renders an `<input>` inside it, a keyboard control:
 * focus it and the arrow keys widen and narrow the column, which is the only version of this that is
 * usable without a mouse.
 *
 * The hairline appears on hover and turns teal while the drag is live — the accent for a genuinely active
 * state, the same rule a selected table row follows. It is **never an inset fill**: the grip sits over the
 * column's own edge, so it must not eat into the cell's padding.
 *
 * `outline-2 outline-transparent` at rest rather than `outline-none`, or its own focus ring could never
 * draw — see `Table.Column`, which had exactly that bug.
 */
export function TableResizer({ className, ...props }: AriaColumnResizerProps) {
  return (
    <AriaColumnResizer
      data-slot="column-resizer"
      className={[
        'absolute inset-y-0 -end-px z-10 w-1.5 cursor-col-resize touch-none select-none',
        'outline-2 outline-offset-1 outline-transparent',
        'transition-colors duration-(--duration-fast) ease-pulse',
        'data-[hovered]:bg-input',
        'data-[resizing]:bg-primary',
        'data-[focus-visible]:outline-ring',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The row that asks for the next page. Use it as `Table.LoadMore`, last inside `Table`.
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
export function TableLoadMore({
  className,
  children,
  ...props
}: AriaTableLoadMoreItemProps) {
  return (
    <AriaTableLoadMoreItem
      data-slot="table-load-more"
      className={[LOAD_MORE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <LoadMoreSpinner />}
    </AriaTableLoadMoreItem>
  )
}

export const Table = Object.assign(TableRoot, {
  Selection: TableSelection,
  Header: TableHeader,
  Column: TableColumn,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Resizable: TableResizable,
  Resizer: TableResizer,
  Footer: TableFooter,
  LoadMore: TableLoadMore,
})
