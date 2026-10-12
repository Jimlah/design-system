import { Virtualizer as AriaVirtualizer } from 'react-aria-components'
import type { VirtualizerProps as AriaVirtualizerProps } from 'react-aria-components'

import type { ReactNode } from 'react'

export interface VirtualizerProps<T> extends Omit<
  AriaVirtualizerProps<T>,
  'children'
> {
  /**
   * The collection to virtualize — a `GridList`, `Table` or `Tree`. Optional in the type so that a docs
   * page can show the component without one; React Aria's own prop is required, and this always passes a
   * child through.
   */
  children?: ReactNode
}

/**
 * Renders only the rows in view.
 *
 * ```tsx
 * import { ListLayout } from 'react-aria-components'
 *
 * <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}>
 *   <GridList aria-label="Monitors" items={monitors} className="h-80 overflow-auto">
 *     {(m) => <GridList.Item id={m.id} textValue={m.name}>…</GridList.Item>}
 *   </GridList>
 * </Virtualizer>
 * ```
 *
 * **It is a thin wrapper, and it is documented as one.** React Aria's `Virtualizer` takes exactly three
 * props — `layout`, `layoutOptions`, `shouldObserveItemSize` — and no `className`, because it renders no
 * chrome of its own: the *collection inside it* becomes the scroll container, so the height and the
 * overflow go on the `GridList`, not here. There is nothing to restyle, which is why this file has no
 * class list and why that is the honest thing to say rather than inventing one.
 *
 * **The collection must be given `items` and a render function, not mapped children.** Virtualization
 * works by React Aria building a collection and rendering only the visible slice; a `.map()` in the
 * consumer's JSX has already built every row by the time React sees it, which is the cost being avoided.
 * `items` comes from `CollectionProps`, so `GridList` has always accepted it.
 *
 * The layout object decides the geometry: `ListLayout` for a list, `GridLayout` for a grid,
 * `TableLayout` for a table. `estimatedRowHeight` is what the scrollbar is measured against before a row
 * has ever rendered, so a wrong number shows as a jumpy scrollbar rather than as a bug.
 */
export function Virtualizer<T>({ children, ...props }: VirtualizerProps<T>) {
  return <AriaVirtualizer {...props}>{children}</AriaVirtualizer>
}
