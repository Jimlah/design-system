import {
  SharedElement as AriaSharedElement,
  SharedElementTransition as AriaSharedElementTransition,
} from 'react-aria-components'
import type {
  SharedElementProps as AriaSharedElementProps,
  SharedElementTransitionProps as AriaSharedElementTransitionProps,
} from 'react-aria-components'

export interface SharedElementTransitionProps extends AriaSharedElementTransitionProps {}
export interface SharedElementProps extends Omit<
  AriaSharedElementProps,
  'className'
> {
  className?: string
}

/**
 * The scope a moving element lives in.
 *
 * **It renders nothing at all** — it is a context provider with no element of its own — so there is no
 * class list here and nothing to style. What it does is give its `SharedElement`s a shared registry to
 * animate through.
 *
 * The two are a pair: a `SharedElement` **throws** without one — *"`<SharedElement>` must be rendered
 * inside a `SharedElementTransition`"* — which is the same shape as `ColumnResizer` without its
 * `ResizableTableContainer`. So this is not an optional wrapper.
 */
export function SharedElementTransition({
  children,
}: SharedElementTransitionProps) {
  return <AriaSharedElementTransition>{children}</AriaSharedElementTransition>
}

/**
 * One element that moves between parents, animating from where it was to where it goes.
 *
 * ```tsx
 * <SharedElementTransition>
 *   {atTop ? <header><SharedElement name="dot" className="size-2 bg-primary" /></header>
 *           : <footer><SharedElement name="dot" className="size-2 bg-primary" /></footer>}
 * </SharedElementTransition>
 * ```
 *
 * **`name` is what ties the two together, not a ref or a key.** Render the same `name` in a different
 * place and React Aria treats it as one thing that moved, carrying its animation with it; render it with
 * `isVisible={false}` and it animates out rather than vanishing. It reports `data-entering` and
 * `data-exiting` while it does.
 *
 * **Nothing here uses it in the default styling of another component, and one already uses it
 * internally.** React Aria's own `ToggleButtonGroup` — which this repo wraps — puts a
 * `SharedElementTransition` around its children, so a selected segment's fill can travel rather than blink.
 * This exists for a consumer laying out its own moving thing: a marker that follows the current view, a
 * chip that changes columns.
 */
export function SharedElement({ className, ...props }: SharedElementProps) {
  return (
    <AriaSharedElement
      data-slot="shared-element"
      className={className}
      {...props}
    />
  )
}
