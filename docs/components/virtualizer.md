# Virtualizer

Renders only the rows in view.

```tsx
import { ListLayout } from 'react-aria-components'

;<Virtualizer
  layout={ListLayout}
  layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}
>
  <GridList
    aria-label="Monitors"
    items={monitors}
    className="h-80 overflow-auto"
  >
    {(monitor) => (
      <GridList.Item id={monitor.id} textValue={monitor.name}>
        {monitor.name}
      </GridList.Item>
    )}
  </GridList>
</Virtualizer>
```

**A thin wrapper, and documented as one.** React Aria's `Virtualizer` takes three props — `layout`,
`layoutOptions`, `shouldObserveItemSize` — and no `className`, because it renders no chrome: the
_collection inside it_ becomes the scroll container, so the height and the overflow go on the
`GridList`. That is why this file has no class list.

## The collection must be given `items`, not mapped children

Virtualization works by React Aria building a collection and rendering only the visible slice. A `.map()`
in the consumer's JSX has already built every row by the time React sees it, which is the cost being
avoided. `items` comes from `CollectionProps`, so `GridList` has always accepted it even though nothing
here used it before.

`ListLayout` for a list, `GridLayout` for a grid, `TableLayout` for a table. `estimatedRowHeight` is what
the scrollbar is measured against before a row has ever rendered, so a wrong number shows as a jumpy
scrollbar rather than as a bug.

## Verified in a browser, not by the test runner

With **1000 monitors** the page holds **the same 11 rows** a 320px container can show — `scrollHeight`
484px rather than 44000 — measured with Playwright directly.

**The story does not assert that**, and the reason is worth recording. The Storybook test runner reports
all 1000 rows for the same story: React Aria renders the collection in full and prunes it once the scroll
container has been measured, and that pass does not happen the same way inside the runner's frame. An
assertion that passes in one environment and fails in the other is worse than none, and one loosened until
it passes in both asserts nothing.

So the story asserts what is true in either: the rows are the first monitors in order, and the list is a
**scroll container** (`overflow-y: auto`) — which is the Virtualizer's own contribution and is observable
in both. The pruning itself is recorded here as a browser measurement, and anyone changing this component
should re-measure it there.

## It is what makes `GridList.LoadMore` work

For a round the load-more sentinel was documented as a row and a spinner with no proven trigger: without a
scroll container React Aria renders **nothing** for it when idle, so there was no sentinel to observe. Put
the `GridList` inside a `Virtualizer` and it renders, watches the scroll, and calls `onLoadMore` at the end
of the list. That is the whole prerequisite, and it is asserted end to end in `Load More`.
