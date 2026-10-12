# Tree

A hierarchical list of items, expanded and collapsed in place.

```tsx
<Tree aria-label="Files" selectionMode="single" defaultExpandedKeys={['src']}>
  <Tree.Item id="src" textValue="src">
    <Tree.Label>src</Tree.Label>
    <Tree.Item id="index" textValue="index.ts">
      <Tree.Label>index.ts</Tree.Label>
    </Tree.Item>
  </Tree.Item>
</Tree>
```

| Slot           | React Aria        | Notes                                    |
| -------------- | ----------------- | ---------------------------------------- |
| `Tree`         | `Tree`            | The set. `selectionMode`, `expandedKeys` |
| `Tree.Item`    | `TreeItem`        | One node; nests inside itself            |
| `Tree.Label`   | `TreeItemContent` | The text, plus the disclosure            |
| `Tree.Section` | `TreeSection`     | A group                                  |
| `Tree.Header`  | `TreeHeader`      | The group's legend                       |

### It is `Nav` with the links taken out

React Aria's `NavigationTree` **extends** its `Tree`, so the two share one row vocabulary. `NAV_ITEM`,
`NAV_LEVEL`, `NAV_CHEVRON`, `NAV_LABEL`, `NAV_HEADER` and `NavCaret` are therefore **exported from
`Nav` and composed here**, not copied — a tree of files and a tree of links sit in the same sidebar and
must not drift apart. Reaching for one or the other is a decision about what a click does: this
**selects**, `Nav` **navigates**.

### The row vocabulary is `data-[current]`, and selection is not that

`Nav` says where you are with `isCurrent` → `data-[current]`. A tree says which row you chose →
`data-selected`. Sharing the constants without adding that one line left the chosen row with **no
accent at all**: it looked selected only through the browser's own text rendering, and the screenshot
showed a bright row where a teal one belonged. `Tree.Item` adds `data-[selected]:text-primary` — the same
accent, because "the one you are looking at" is the same idea in both.

### The chevron is a button with `slot="chevron"`, and React Aria insists on it

Not decoration and not negotiable. React Aria says so at runtime if it is missing — _"Expandable tree
items must contain a expand button so screen reader users can expand/collapse the item"_ — and an
earlier `Nav` drew its caret as a pseudo-element, which cannot be pressed and cannot be named.

It comes from the render props (`hasChildItems`, `isExpanded`) and is rendered **only when there are
children**, so a leaf correctly has none. `TreeItemContent` takes **no `className`**, so the classes go
on the row and on the inner elements — the same shape `Nav` already had.

### It is a treegrid, and the row carries the name

React Aria builds its tree on its table, so items are `role="row"` and labels are `role="gridcell"` —
a story querying `treeitem` finds nothing and asserts nothing. And **the cell has no accessible name**:
`Tree.Label` wraps its text in a plain `<span>` beside the chevron button, so every query here follows
the **row**. That cost a failing story against a tree that was rendering correctly.

### `defaultExpandedKeys` speaks in each item's `id`

Without one React Aria generates a key, `defaultExpandedKeys={['src']}` matches nothing, and the tree
renders fully collapsed — with no error and no warning. The same trap as `Table.Row` and
`Accordion.Item`.

## `Tree.LoadMore` — the row that asks for the next page

The same sentinel as `GridList.LoadMore`, on the same shared recipe (`loadMore.tsx`). It only works inside
a virtualized collection, draws nothing until `isLoading`, and **React Aria renders nothing at all for it
when idle** — so a test asserts the element is absent rather than that it is empty.

The mechanism, and the end-to-end proof that it fires on scroll, are in `gridlist.md` and
`virtualizer.md`; this component is that machinery in another collection.
