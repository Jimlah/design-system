import { VisuallyHidden as AriaVisuallyHidden } from 'react-aria-components'
import type { VisuallyHiddenProps as AriaVisuallyHiddenProps } from 'react-aria-components'

/**
 * Text for screen readers and nobody else.
 *
 * ```tsx
 * <VisuallyHidden>Checked every 60 seconds</VisuallyHidden>
 * ```
 *
 * **It is not `display: none` and it is not `visibility: hidden`.** Both of those take the text out of the
 * accessibility tree as well as off the screen. This keeps the text in the tree at one pixel with the
 * clip-path technique — which is what `sr-only` is — so a screen reader still reads it and the page does
 * not move.
 *
 * It is here because several components in this repo had written the same `sr-only` span by hand, and a
 * visually hidden thing is easy to get subtly wrong: `width: 1px` without `white-space: nowrap` wraps the
 * text into a column, and a missing `clip-path` leaves it over the content it was hiding behind.
 */
export function VisuallyHidden({
  // **`span`, not React Aria's default `div`.** This component's whole job is to sit inside a sentence —
  // "Uptime <VisuallyHidden>checked every 60 seconds</VisuallyHidden>" — and a `<div>` there is invalid
  // HTML: the browser reports "a `<p>` cannot contain a nested `<div>`", and it forces a block box into
  // the middle of inline text. React Aria defaults to `div` and uses `elementType="span"` itself for its
  // own hidden inputs; the useful default for a design system is the inline one, and a consumer who needs
  // a block can still pass `elementType`.
  elementType = 'span',
  className,
  ...props
}: AriaVisuallyHiddenProps) {
  return (
    <AriaVisuallyHidden
      data-slot="visually-hidden"
      elementType={elementType}
      className={className}
      {...props}
    />
  )
}
