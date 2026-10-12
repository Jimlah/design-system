# Table

The sheet's `.ds-rows` and `.ds-row`: a panel-coloured stack separated by hairlines, closed by a
softer one. The sheet builds its rows out of a CSS grid with fixed column widths, because it is
laying out one dashboard; a table is a table, so the _surfaces_ are what get borrowed.

```tsx
<Table aria-label="Monitors">
  <Table.Header>
    <Table.Column isRowHeader>Monitor</Table.Column>
    <Table.Column>Status</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row id="fra1">
      <Table.Cell>fra1 · Frankfurt</Table.Cell>
      <Table.Cell>Up</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

| Slot           | React Aria    | Notes                                                         |
| -------------- | ------------- | ------------------------------------------------------------- |
| `Table`        | `Table`       | `aria-label`; `selectedKeys`, `disabledKeys`, `selectionMode` |
| `Table.Header` | `TableHeader` | The column headings                                           |
| `Table.Column` | `Column`      | `isRowHeader` marks the column whose cell names the row       |
| `Table.Body`   | `TableBody`   | Takes `renderEmptyState`                                      |
| `Table.Row`    | `Row`         | Its `id` is what `selectedKeys` and `disabledKeys` speak in   |
| `Table.Cell`   | `Cell`        | One cell                                                      |

### The header is the table's, not the sheet's

The sheet has **no table header at all**. Its rows are a dashboard grid where each cell holds its
own 12px uppercase label above its value, so the row carries its labels with it. A real table says
them once at the top instead, and the headings take the sheet's _quieter_ legend — 11px, spaced,
45% — rather than the full-strength treatment a row's own label gets.

Row headers are the exception: the column marked `isRowHeader` is the row's identity, so it keeps
full strength and everything else sits at 75%. That is styled off `[&[role=rowheader]]` on the cell,
so which column identifies the row is decided once, on the column, and the styling cannot drift
from it.

### Selection is a slot, and React Aria drives it

`Table.Selection` is a `Checkbox` carrying `slot="selection"`. React Aria finds it by that slot and
does everything else: the one in the column heading becomes select-all, and it goes
**indeterminate** on its own when some rows are chosen — the `mixed` state a table needs and a
plain checkbox does not have.

```tsx
<Table selectionMode="multiple" defaultSelectedKeys={['fra1']}>
  <Table.Header>
    <Table.Column width={48}>
      <Table.Selection />
    </Table.Column>
    <Table.Column isRowHeader>Monitor</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row id="fra1">
      <Table.Cell>
        <Table.Selection />
      </Table.Cell>
      <Table.Cell>fra1 · Frankfurt</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

**Do not pass it `isSelected` or `onChange`** — the table supplies both through the slot, and
passing them fights it. The header checkbox is labelled "Select All" by React Aria and each row's
from its row header, so there is nothing to name.

A selection column is a gutter, not a column: it holds a control and a heading that is itself a
control, so `Table.Column` and `Table.Cell` narrow themselves to 12 units when they contain one —
`has-[[data-slot=selection]]` — rather than making every table spell that out.

### No numeric variant

The sheet gives its figures 16–20px, and its headline figure `--color-yellow`. That belongs to its
dashboard, where a number _is_ the point of the row. In a table it is one column of many, and a
table of yellow figures is a table where nothing stands out. Pass a `className` when a column
really is the point.

### A row's hover cannot be tested, so there is no story for it

React Aria _does_ set `data-hovered` on a row, and it is the "correct" RAC way to style one. But it
wires that to **pointer enter, which does not bubble** — so a pointer over a cell does not shade
its row, and `user-event` fires its events on the target alone. The native `:hover` is no better:
browsers apply it from real input only, and a synthetic event is not that.

So the row's hover is the native pseudo-class — matching the sheet's `.ds-row--hover:hover` — and
there is deliberately no Hover story. A story that asserts the row is opaque at rest and calls
itself "Hover" would pass while testing nothing, which is worse than not having it.

### Two things the roles turned out to be

- **React Aria gives a table the _grid_ roles**, not the table ones: `role="grid"` on the element,
  `gridcell` on the cells. So query `gridcell`, not `cell`, or the query finds nothing and the
  failure reads like a missing body.
- **The empty state is a full-width `rowheader`.** `renderEmptyState` on the body renders a single
  cell with `colspan` and `role="rowheader"`, so `queryAllByRole('rowheader')` is 1 on an empty
  table, not 0. Assert on the message being visible and on there being no `gridcell`s.

## Resizable columns: `Table.Resizable` + `Table.Resizer`

```tsx
<Table.Resizable>
  <Table aria-label="Monitors">
    <Table.Header>
      <Table.Column isRowHeader defaultWidth={220} minWidth={140}>
        Monitor
        <Table.Resizer aria-label="Resize Monitor column" />
      </Table.Column>
      {/* … */}
    </Table.Header>
    <Table.Body>…</Table.Body>
  </Table>
</Table.Resizable>
```

| Slot              | React Aria                | Notes                                         |
| ----------------- | ------------------------- | --------------------------------------------- |
| `Table.Resizable` | `ResizableTableContainer` | The scroll container. Required — see below    |
| `Table.Resizer`   | `ColumnResizer`           | Inside a `Table.Column`, on its trailing edge |

**The two are one feature, not two props.** A `ColumnResizer` _throws_ without the container — React
Aria's own message is _"Wrap your `<Table>` in a `<ResizableTableContainer>` to enable column resizing"_.
The container walks up to the first scrollable element and measures that, which is why it has to be the
thing that scrolls, and why it carries `overflow-x-auto`.

Column widths come from the column: `defaultWidth`, `minWidth`, `maxWidth`, or a controlled `width`.

The grip shows its hairline on hover and turns **teal while the drag is live** — the accent for a
genuinely active state, the same rule a selected row follows. It sits _over_ the column's trailing edge
(absolute, `-end-px`) rather than taking a share of it, so widening a column never eats the neighbouring
cell's padding.

**Drag is the interaction and it is a pointer sequence** — pointerdown, pointermove, pointerup. A single
`click` asserts nothing about it. Verified directly in the browser: dragging the Monitor grip 117px took
that column from 220 to 337 and left its neighbours at 140 and 120.

**The story does not assert the drag, and that is deliberate.** `userEvent.pointer` could not drive
React Aria's resize here — with absolute `clientX`/`clientY` (which are accepted and then ignored when a
`target` is given) or with target-relative `x`/`y` — while a real mouse does. Rather than ship an
assertion that silently proves nothing, the story asserts what the runner can actually demonstrate: the
column's width coming from `defaultWidth`, the grip's `role="presentation"` wrapper carrying a
`type="range"` control with the column's accessible name, and the outline regression below.

### The focus ring here could never draw

This column's class list carried `outline-none` next to a `data-[focus-visible]:outline-1` ring. Because
`outline-none` sets Tailwind's **shared** `--tw-outline-style` — the very property every `outline-<width>`
utility reads back — the ring was unreachable: the element reported `outline-width: 1px` with
`outline-style: none`. It is now a **transparent outline at rest** (`outline-1 -outline-offset-2
outline-transparent`), and `Table`'s `Resizable` story asserts exactly that, at rest, where `solid` with a
transparent colour is correct and `none` is the failure. `GridList`'s row had the identical bug and the
same fix; its rows now compute `2px solid` with a transparent colour.

## `Table.Footer` — the closing row

```tsx
<Table.Footer>
  <Table.Row>
    <Table.Cell>Fleet</Table.Cell>
    <Table.Cell>3 monitors</Table.Cell>
    <Table.Cell>98.99%</Table.Cell>
  </Table.Row>
</Table.Footer>
```

**A footer is not a body row that happens to be last.** It is the table's conclusion — the totals, the
count, the average — and it is the one row a reader arrives at deliberately rather than scanning past.
So the separation line goes _above_ it rather than below, and its type is a step quieter (`text-fg/60`)
than the data, which is the same relationship the header has at the other end. It holds `Table.Row`s like
the body does, because it is the same collection machinery underneath.

It renders a real **`<tfoot>`**, after the `tbody` — and that is the assertion the story makes, because a
footer drawn as a last body row looks identical and is not one. A `tfoot` written before `tbody` is legal
HTML and still renders last, so the story checks the actual group order: `THEAD, TBODY, TFOOT`.

## `Table.LoadMore` — the row that asks for the next page

The same sentinel as `GridList.LoadMore`, on the same shared recipe (`loadMore.tsx`). It only works inside
a virtualized collection, draws nothing until `isLoading`, and **React Aria renders nothing at all for it
when idle** — so a test asserts the element is absent rather than that it is empty.

The mechanism, and the end-to-end proof that it fires on scroll, are in `gridlist.md` and
`virtualizer.md`; this component is that machinery in another collection.
