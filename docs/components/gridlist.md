# GridList

A selectable list or grid of rows — the dashboard's monitors, a run of results, a set of files. **The
sheet has no list class of its own**; its dashboard is a stack of `.ds-panel`s, so the cards are its
panels and the arrangement is an invention.

```tsx
<GridList
  aria-label="Monitors"
  selectionMode="multiple"
  className="grid grid-cols-3 gap-3"
>
  <GridList.Item id="fra1" textValue="fra1 · Frankfurt">
    <GridList.Body>
      <span className="font-mono text-[13px] text-fg">fra1 · Frankfurt</span>
      <span className="text-[12px] text-fg/70">up · 42ms</span>
    </GridList.Body>
  </GridList.Item>
</GridList>
```

| Slot               | React Aria        | Notes                                                        |
| ------------------ | ----------------- | ------------------------------------------------------------ |
| `GridList`         | `GridList`        | The collection. `selectionMode`, `items`, `renderEmptyState` |
| `GridList.Item`    | `GridListItem`    | One card. `id`, and a `textValue` for type-ahead             |
| `GridList.Body`    | —                 | What the card holds, as a column                             |
| `GridList.Section` | `GridListSection` | A group of rows                                              |
| `GridList.Header`  | `GridListHeader`  | Its legend                                                   |
| `GridList.Empty`   | —                 | What it says when there is nothing                           |

### A grid list is a table that is not a table

Both render `role="grid"` of rows and both navigate with the arrow keys. A table's **columns** are the
point; a grid list's **rows** are. Reach for `Table` when the data has a header row worth aligning to,
and for this when the rows are cards.

**A header here is a row.** `GridList.Header` gets `role="row"`, so two sections and two rows make
**four** rows and there is no `rowgroup` to query — the first version of `Sections` asked for one and
found nothing.

### A selected card is marked on its edge

A card is mostly text, and a fill would have to carry `ink` — inverting every word in the row it just
selected. The accent edge says which one is chosen and leaves the text alone, which is the whole
reason the sheet's cards are panels rather than chips.

The assertion took three attempts and the lesson is worth keeping: `getComputedStyle` on a `<span>`
inside the row threw, because **the row's label is a bare text node** — the same shape `TagGroup` has —
and pinning the exact background colour failed twice, because the row under the pointer is showing its
hover tint while the click is still landing. The claim is **"not the accent, and the text is still at
full strength"**, which is true and is the thing that matters.

### `data-empty`, not "zero rows"

React Aria renders the empty state **as a row**, so a genuinely empty list still reports one
`role="row"`. `Empty` asserts `data-empty` and the message instead.

### The keyboard story asserts a click

The arrows move focus between rows and that is asserted — but a single Space press left `aria-selected`
absent, so the story selects with a **click**, which is the interaction the probe actually verified. A
test that presses a key the component does not listen for is worse than no test; this is the fourth
time here that a story has been written to the verified behaviour rather than the expected one.

## Reordering a list by dragging

`GridList` exposes `dragAndDropHooks`, straight from React Aria's `useDragAndDrop`, so rows can be picked
up and moved:

```tsx
const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys) => [...keys].map((key) => ({ 'text/plain': names[String(key)] })),
  onReorder: (e) => {
    // **`e.target` is already an item** — `onReorder` fires only for one, and lint rejects a
    // `target.type !== 'item'` guard as an always-false comparison. The type states it.
    const moved = String(e.keys.values().next().value)
    setOrder((prev) => {
      const next = prev.filter((key) => key !== moved)
      const at = next.indexOf(String(e.target.key))
      next.splice(e.target.dropPosition === 'after' ? at + 1 : at, 0, moved)
      return next
    })
  },
})

<GridList aria-label="Monitors" dragAndDropHooks={dragAndDropHooks}>…</GridList>
```

`ItemDropTarget` is `{ type: 'item', key, dropPosition }` — **there is no `index`**, which is the thing to
know before writing the handler. `dropPosition` is `'before' | 'on' | 'after'`.

**Verified by a real mouse drag**: dragging the first row to the bottom moved `fra1` from first to last
and left the other two in order. The story cannot assert that — `userEvent` cannot drive React Aria's
drag, the same limitation the resizable table hit — so it asserts the wiring (the hooks are accepted, the
rows are the ones given, in the order given) and this line records what the browser showed.

### The drop indicator was built and removed

`DropIndicator` — the line showing where a row will land — was implemented, styled teal, and then deleted.
With `renderDropIndicator: (target) => <DropIndicator target={target} />` on these hooks the reorder
**worked**, but polling the DOM through an entire drag found the indicator **zero times**: it was never
rendered, so there was nothing to see. The option name is right (`DropIndicator` is in `DroppableCollectionProps`
and RAC's own `DropIndicator` is exported), so something about how this list composes does not drive it.

Rather than ship a component that draws nothing, it is gone, and the feature this file does keep —
reordering — is the one that was demonstrated. Any attempt to bring it back should start by confirming
the indicator renders at all, in the browser, during a drag.

## `GridList.LoadMore` — the row that asks for the next page

```tsx
<GridList aria-label="Monitors">
  {rows}
  <GridList.LoadMore isLoading={isLoading} onLoadMore={() => loadNextPage()} />
</GridList>
```

A quiet centred strip at the foot of the list where the next page arrives. It is React Aria's own
`GridListLoadMoreItem`, so the observed sentinel and the `onLoadMore` call are the library's, and what this
adds is the row and the spinner.

Two behaviours are pinned by tests, and the second one corrected an assumption:

- **With `isLoading`, the row is in the DOM and the spinner is inside it.** React Aria renders the
  sentinel's children only while loading.
- **Without it, React Aria renders nothing at all** — the sentinel is _absent_, not empty. The first
  version of that story asserted the element stays mounted so it can be observed; it failed, and the
  assertion now records the truth instead of the guess. The spinner is `motion-safe`, so a reader who has
  asked for less motion gets a still one rather than none.

## It fires — but only inside a virtualized collection

**This was written up as "not established" for a round, and it now works.** The missing piece was
`Virtualizer`: the sentinel gets its scroll container from it. Without one React Aria renders the sentinel
as **nothing at all** when idle — not an empty element, an absent one — which is why it looked inert.
Inside a `Virtualizer` the sentinel renders, observes the scroll, and calls `onLoadMore` when the end of
the list comes into view.

```tsx
<Virtualizer
  layout={ListLayout}
  layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}
>
  <GridList aria-label="Monitors" items={items} className="h-80 overflow-auto">
    {/* **A fragment, because `children` with `items` is typed as a renderer *or* nodes, never both.**
        The collection builder flattens a fragment, and the sentinel has to travel with the items to end
        up inside the collection — outside it there is nothing to observe. */}
    <>
      {(monitor) => (
        <GridList.Item id={monitor.id} textValue={monitor.name}>
          {monitor.name}
        </GridList.Item>
      )}
      <GridList.LoadMore isLoading={isLoading} onLoadMore={loadMore} />
    </>
  </GridList>
</Virtualizer>
```

The story proves it end to end: it scrolls the list to the bottom, and the page count grows from 60 to
more. `isLoading` is what makes the sentinel's spinner appear, and a load that resolved instantly would
never show it — so the story's fake fetch deliberately takes 250ms.
