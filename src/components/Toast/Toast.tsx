import {
  Button as AriaButton,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  ToastProps as AriaToastProps,
  ToastRegionProps as AriaToastRegionProps,
} from 'react-aria-components'

/**
 * The sheet has no toast either — the third component here with nothing to copy, after the date
 * picker and the accordion. It borrows the tooltip's surface, which is the closest thing the sheet
 * has to a floating panel: its own panel, a strong hairline, square.
 *
 * **React Aria's toast is marked `UNSTABLE_`**, every part of it. That is a real risk and worth
 * saying out loud rather than burying: the API can change under this component, and the parts are
 * named to make that obvious at every import. It was still the right trade — a queue, a region,
 * auto-dismiss, focus management, and announcements to a screen reader are what a hand-rolled
 * toast gets wrong, and `role="status"` on a div does not get them right.
 */
const REGION =
  'fixed end-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2'

const TOAST = [
  'flex items-start gap-3',
  'border border-line-strong bg-panel p-3.5',
  // React Aria puts `data-animation="entering" | "exiting"` on the toast for the duration of its
  // entry and exit, so an animation can be hung off it rather than off a class that is always on.
  // No keyframes are shipped with it: which way a toast should move is a house decision, not this
  // component's.
].join(' ')

const CONTENT = 'flex min-w-0 flex-1 flex-col gap-1'

/** The sheet's row legend, at full strength: a toast's heading is read, not scanned. */
const TITLE = 'text-[12px] uppercase tracking-[0.06em] text-fg'

const TEXT = 'text-[13px] leading-[1.5] text-fg/70'

const CLOSE = [
  'flex size-5 shrink-0 items-center justify-center',
  'cursor-pointer text-fg/45',
  'transition-colors duration-[120ms] ease-pulse',
  'data-[hovered]:text-fg',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-2',
  'data-[focus-visible]:outline-teal',
].join(' ')

/**
 * The queue, exported as a type as well as a value: `Object.assign` flattens the generic, so a
 * consumer who wants typed `toast.content` has to say so once, on the queue.
 */
export type ToastQueue<T> = UNSTABLE_ToastQueue<T>

export interface ToastRegionProps<T> extends Omit<
  AriaToastRegionProps<T>,
  'children' | 'className'
> {
  className?: string
  /** A function of `{ toast }` returning a `Toast`, or a `Toast.List` of them. */
  children: AriaToastRegionProps<T>['children']
}

export interface ToastProps<T> extends Omit<
  AriaToastProps<T>,
  'children' | 'className' | 'toast'
> {
  /** The toast to render, from the queue `Toast.Region` is draining. Its `content` is what the slots read. */
  toast: AriaToastProps<T>['toast']

  className?: string
  /** A `Toast.Content`, and a `Toast.Close` beside it. */
  children?: React.ReactNode
}

export interface ToastContentProps {
  className?: string
  /** A `Toast.Title` and a `Toast.Text`. */
  children?: React.ReactNode
}

export interface ToastTitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface ToastTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export interface ToastCloseProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * The corner the toasts collect in. Use it as `Toast.Region`, once, near the root — and only once,
 * because it is the whole of what a screen reader is told is happening on the page.
 *
 * Exported as `ToastRegion` only so tooling can resolve it; consume the compound form
 * `Toast.Region`.
 */
export function ToastRegion<T>({
  className,
  children,
  ...props
}: ToastRegionProps<T>) {
  return (
    <AriaToastRegion
      className={[REGION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaToastRegion>
  )
}

/**
 * One toast. Use it as `Toast`, inside a `Toast.Region`'s render function.
 *
 * Exported as `ToastItem` only so tooling can resolve it; consume the compound form `Toast`.
 */
export function ToastItem<T>({ className, children, ...props }: ToastProps<T>) {
  return (
    <AriaToast
      className={[TOAST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaToast>
  )
}

/**
 * A toast's text. Use it as `Toast.Content`.
 *
 * Exported as `ToastContent` only so tooling can resolve it; consume the compound form
 * `Toast.Content`.
 */
export function ToastContent({ className, children }: ToastContentProps) {
  return (
    <div
      data-slot="content"
      className={[CONTENT, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}

/**
 * What the toast is about. Use it as `Toast.Title`, above a `Toast.Text` — React Aria wires the
 * two together so the announcement reads as one message rather than two.
 *
 * Exported as `ToastTitle` only so tooling can resolve it; consume the compound form
 * `Toast.Title`.
 */
export function ToastTitle({ className, children, ...props }: ToastTitleProps) {
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
 * The detail under it. Use it as `Toast.Text`.
 *
 * Exported as `ToastText` only so tooling can resolve it; consume the compound form
 * `Toast.Text`.
 */
export function ToastText({ className, children, ...props }: ToastTextProps) {
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
 * Dismisses it. Use it as `Toast.Close`. Its `slot="close"` is what tells React Aria it is the
 * dismiss control, so it gets the label, the keyboard handling and the focus return for free —
 * and it is why the slot has to be written here rather than left to the consumer.
 *
 * Exported as `ToastClose` only so tooling can resolve it; consume the compound form
 * `Toast.Close`.
 */
export function ToastClose({ className, children, ...props }: ToastCloseProps) {
  return (
    <AriaButton
      slot="close"
      aria-label="Dismiss"
      className={[CLOSE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? (
        <svg
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="size-2.5"
        >
          <path
            d="M1 1L9 9M9 1L1 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </AriaButton>
  )
}

/**
 * The sheet has no toast, so this follows the tooltip's surface — its own panel, a strong
 * hairline, square — and React Aria's behaviour.
 *
 * ```tsx
 * const queue = new Toast.Queue({ maxVisibleToasts: 3 })
 *
 * <Toast.Region queue={queue} aria-label="Notifications">
 *   {({ toast }) => (
 *     <Toast toast={toast}>
 *       <Toast.Content>
 *         <Toast.Title>Check failed</Toast.Title>
 *         <Toast.Text>fra1 · Frankfurt stopped responding.</Toast.Text>
 *       </Toast.Content>
 *       <Toast.Close />
 *     </Toast>
 *   )}
 * </Toast.Region>
 *
 * queue.add({ title: 'Check failed' }, { timeout: 5000 })
 * ```
 *
 * **React Aria's toast is `UNSTABLE_` in every part**, and this component is a thin skin over it.
 * The API can move between minor versions. It is still worth it: a queue, a region, auto-dismiss,
 * a pause on hover, focus management and an announcement to a screen reader are precisely what a
 * hand-rolled toast gets wrong.
 *
 * **A toast announces itself, so it should not be the only place anything is said.** It is for
 * what has just happened and needs no answer — anything a user must act on belongs in the page,
 * where it will still be there when they look back. The `timeout` is how long it stays; a toast
 * with no timeout stays until it is dismissed, which is a decision worth making deliberately.
 */
export const Toast = Object.assign(ToastItem, {
  Region: ToastRegion,
  Content: ToastContent,
  Title: ToastTitle,
  Text: ToastText,
  Close: ToastClose,
})

/**
 * The queue the region drains. Create one, push toasts onto it, and pass it to `Toast.Region`.
 *
 * **A named export rather than a slot, and the only thing here that is not a component.** Every other
 * trailing name in this system is a component you can render — `Toast.Title`, `Modal.Content` — so
 * `Toast.Queue` was a name that looked renderable and was a class. Renaming it says what it is.
 */
export const ToastQueue = UNSTABLE_ToastQueue
