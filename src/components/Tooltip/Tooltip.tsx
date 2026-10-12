import {
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
} from 'react-aria-components'
import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps,
} from 'react-aria-components'
import { OverlayArrow } from '../OverlayArrow/OverlayArrow'

/**
 * The sheet's `.ds-tip`: its own panel rather than a themed bubble, at 94% so a hairline of
 * whatever is behind it shows through, with a 45% border over the top. `w-max` because a tooltip
 * is as wide as its text and never the width of the thing it describes.
 */
const CONTENT = [
  'flex w-max max-w-72 flex-col gap-[5px]',
  'border border-line-strong bg-panel/94 px-3.5 pt-2.5 pb-3',
].join(' ')

/** The sheet's `.ds-tip__title`: 12px, letterspaced, in the accent — not uppercase, as the sheet's labels are. */
const TITLE = 'text-[12px] tracking-[0.1em] text-teal'

/** The sheet's `.ds-tip__sub`: 14px, with the sheet's negative tracking. */
const TEXT = 'text-[14px] tracking-[-0.5px] text-fg'

export interface TooltipProps extends Omit<
  AriaTooltipTriggerProps,
  'children' | 'className'
> {
  /**
   * How long to wait before showing, on hover only. React Aria's default is a deliberately
   * unhurried 1500ms, which is the ARIA guidance for a hover — a tooltip that appears the instant
   * a pointer crosses it flickers over every icon in a toolbar. Set `0` when the tooltip is the
   * only way to know what something is.
   */
  delay?: AriaTooltipTriggerProps['delay']
  /** Opens on focus as well as hover. On by default, because a keyboard user has no pointer. */
  isOpen?: AriaTooltipTriggerProps['isOpen']
  defaultOpen?: AriaTooltipTriggerProps['defaultOpen']
  onOpenChange?: AriaTooltipTriggerProps['onOpenChange']
  /**
   * The thing being described, then a `Tooltip.Content`. There is no `className`: like
   * `Select.AutoComplete`, this renders no element of its own — it is the wiring between the two
   * — so there is nothing to style. Put the class on the thing being described.
   */
  children?: React.ReactNode
}

export interface TooltipContentProps extends Omit<
  AriaTooltipProps,
  'children' | 'className'
> {
  className?: string
  /** A `Tooltip.Title` and a `Tooltip.Text`, in that order. */
  children?: React.ReactNode
}

export interface TooltipTitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface TooltipTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

/**
 * The tooltip's surface. Use it as `Tooltip.Content`, as the second child of a `Tooltip`.
 *
 * Exported as `TooltipContent` only so tooling can resolve it; consume the compound form
 * `Tooltip.Content`.
 */
export function TooltipContent({
  className,
  children,
  offset = 10,
  ...props
}: TooltipContentProps) {
  return (
    <AriaTooltip
      offset={offset}
      className={[CONTENT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTooltip>
  )
}

/**
 * What the tooltip is about. Use it as `Tooltip.Title`, above a `Tooltip.Text`.
 *
 * Exported as `TooltipTitle` only so tooling can resolve it; consume the compound form
 * `Tooltip.Title`.
 */
export function TooltipTitle({
  className,
  children,
  ...props
}: TooltipTitleProps) {
  return (
    <span
      data-slot="title"
      className={[TITLE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * The detail under it. Use it as `Tooltip.Text`.
 *
 * Exported as `TooltipText` only so tooling can resolve it; consume the compound form
 * `Tooltip.Text`.
 */
export function TooltipText({
  className,
  children,
  ...props
}: TooltipTextProps) {
  return (
    <span
      data-slot="text"
      className={[TEXT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Styled element. Not exported — `Tooltip` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function TooltipRoot({ children, ...props }: TooltipProps) {
  return <AriaTooltipTrigger {...props}>{children}</AriaTooltipTrigger>
}

/**
 * The sheet's `.ds-tip` — a short description attached to the thing it describes. It carries the
 * thing itself as its first child and the tooltip as its second, so the two cannot be wired to
 * different things:
 *
 * ```tsx
 * <Tooltip delay={0}>
 *   <Button>Restart</Button>
 *   <Tooltip.Content>
 *     <Tooltip.Title>Restart</Tooltip.Title>
 *     <Tooltip.Text>Runs the check again from the top.</Tooltip.Text>
 *   </Tooltip.Content>
 * </Tooltip>
 * ```
 *
 * **A tooltip is not a label and not a place to put anything necessary.** It opens on hover and
 * on focus, cannot be scrolled or selected, and is gone the moment the pointer moves — so anything
 * a user must be able to read twice, copy, or click belongs somewhere else. Its own content is
 * described, not interactive.
 *
 * React Aria gives it the parts a hand-rolled tooltip always gets wrong: it opens on **focus** as
 * well as hover, so a keyboard user can reach it; it waits before opening on hover, so a pointer
 * crossing a toolbar does not flicker through every tooltip in it; it stays open while the pointer
 * moves onto the tooltip itself; and it is wired as `aria-describedby` rather than replacing the
 * element's name.
 *
 * `Tooltip.Title` is the sheet's `.ds-tip__title` — 12px, letterspaced, in the accent — and is
 * deliberately **not** uppercase, unlike the sheet's other small text. A tooltip's heading is
 * read at a glance while the pointer is resting, not scanned in a column.
 */

/**
 * The marker pointing back at the trigger. Use it as `Tooltip.Arrow`.
 *
 * **Opt-in, and nothing here uses it.** The design language's panels are flat and anchored by proximity;
 * see `OverlayArrow` for why the shape exists at all and what it is made of.
 */
export function TooltipArrow({ className }: { className?: string }) {
  return <OverlayArrow className={className} />
}

export const Tooltip = Object.assign(TooltipRoot, {
  Arrow: TooltipArrow,
  Content: TooltipContent,
  Title: TooltipTitle,
  Text: TooltipText,
})
