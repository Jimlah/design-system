import { OverlayArrow as AriaOverlayArrow } from 'react-aria-components'
import type { OverlayArrowProps as AriaOverlayArrowProps } from 'react-aria-components'

/**
 * The shape of the marker: a rotated square with two hairlines and the panel's own fill, so it continues
 * the panel's edge out to a point. Every other surface here is squared; an SVG arrow would be the one
 * curved thing in the system.
 *
 * **The rotation is on the shape inside React Aria's element, not on the element itself.** That element is
 * positioned with an inline `transform`, and an inline style outranks every class — a `rotate-45` written
 * on it type-checks, looks right in the source, and does nothing at all. The first version of this file did
 * exactly that and rendered an unrotated square sitting on the panel's edge.
 *
 * The two edges facing outward are the ones kept, so the other two disappear under the panel. Which two
 * depends on where React Aria put the overlay, which it reports as `data-placement` on the **parent** —
 * hence the arbitrary ancestor variants rather than plain `data-[…]` ones.
 */
export const OVERLAY_ARROW = [
  'block size-2 rotate-45 border-border-strong bg-card',
  '[[data-placement=bottom]_&]:border-t [[data-placement=bottom]_&]:border-l',
  '[[data-placement=top]_&]:border-r [[data-placement=top]_&]:border-b',
  '[[data-placement=left]_&]:border-t [[data-placement=left]_&]:border-r',
  '[[data-placement=right]_&]:border-b [[data-placement=right]_&]:border-l',
].join(' ')

/** React Aria positions this element; all it needs from us is to stay above the panel. */
export const OVERLAY_ARROW_POSITION = 'z-10'

/**
 * The marker that points from a floating panel back at the thing that opened it.
 *
 * ```tsx
 * <Popover>
 *   <Popover.Arrow />
 *   …
 * </Popover>
 * ```
 *
 * **Nothing here uses one by default, and that is a decision rather than an oversight.** A pointer is a
 * shape the design language does not otherwise contain: the sheet's panels are flat rectangles joined to
 * their trigger by proximity and position, and every menu, select and tooltip in this system opens
 * anchored without one. So it is an opt-in slot — `Popover.Arrow`, `Tooltip.Arrow` — for the case where a
 * panel must be tied to a small target and proximity is not enough.
 *
 * React Aria positions this element and reports which way it must point as `data-placement`.
 */
export interface OverlayArrowProps extends Omit<
  AriaOverlayArrowProps,
  'className'
> {
  className?: string
}

export function OverlayArrow({ className, ...props }: OverlayArrowProps) {
  return (
    <AriaOverlayArrow
      data-slot="overlay-arrow"
      className={OVERLAY_ARROW_POSITION}
      {...props}
    >
      <span
        data-slot="overlay-arrow-shape"
        className={[OVERLAY_ARROW, className].filter(Boolean).join(' ')}
      />
    </AriaOverlayArrow>
  )
}
