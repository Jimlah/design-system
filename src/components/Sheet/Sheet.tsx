import {
  SheetTrigger as AriaSheetTrigger,
  Heading as AriaHeading,
  Sheet as AriaSheet,
  SheetContent as AriaSheetContent,
  SheetOverlay as AriaSheetOverlay,
  Text as AriaText,
} from 'react-aria-components'
import type {
  DialogTriggerProps as AriaDialogTriggerProps,
  HeadingProps as AriaHeadingProps,
  SheetOverlayProps as AriaSheetOverlayProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { createContext, useContext, useId } from 'react'
import type { ReactNode } from 'react'

import { Button } from '../Button/Button'
import { DIALOG_DESCRIPTION, DIALOG_FOOTER, DIALOG_TITLE } from '../Modal/Modal'
import { SURFACE } from '../popover'

/** Which edge the panel comes in from. `start` and `end` resolve to left or right by the locale. */
export type SheetSide = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end'

/**
 * How big the panel is, per edge — **chosen in JavaScript, not in CSS**.
 *
 * It is applied to the `Sheet` layer rather than to the panel, because the panel cannot be sized from
 * outside at all — see the note in `SheetContent`.
 */
const SIZES: Record<SheetSide, string> = {
  right: 'h-full w-96',
  left: 'h-full w-96',
  start: 'h-full w-96',
  end: 'h-full w-96',
  // An edge-anchored sheet meets the home indicator and the notch, so its panel is inset from
  // them. The insets are `0px` until the document asks for `viewport-fit=cover`, which the root
  // route now does.
  bottom:
    'max-h-[80vh] w-full [padding-block-end:env(safe-area-inset-bottom,0px)]',
  top: 'max-h-[80vh] w-full [padding-block-start:env(safe-area-inset-top,0px)]',
}

export interface SheetProps extends Omit<
  AriaDialogTriggerProps,
  'children' | 'className' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /** Whether the sheet is open. Controlled, so pass `onOpenChange` with it. */
  isOpen?: AriaDialogTriggerProps['isOpen']
  /** Whether it starts open, for uncontrolled use. */
  defaultOpen?: AriaDialogTriggerProps['defaultOpen']
  /** Called when the sheet asks to open or close. */
  onOpenChange?: AriaDialogTriggerProps['onOpenChange']
  /** The trigger, then a `Sheet.Content`. */
  children?: ReactNode
}

export interface SheetContentProps extends Omit<
  AriaSheetOverlayProps,
  'children' | 'className' | 'position'
> {
  /** Which edge the panel slides in from. It also becomes the swipe direction. */
  side?: SheetSide
  className?: string
  children?: ReactNode
}

export interface SheetTitleProps extends Omit<AriaHeadingProps, 'className'> {
  className?: string
}

export interface SheetDescriptionProps extends Omit<
  AriaTextProps,
  'className'
> {
  className?: string
}

export interface SheetFooterProps {
  className?: string
  children?: ReactNode
}

export interface SheetCloseProps {
  className?: string
  children?: ReactNode
}

/**
 * The id the panel is described by. React Aria wires `aria-labelledby` from the title on its own and
 * does **not** wire a description — the same gap the modal has, and the same fix.
 */
const DescriptionId = createContext<string | undefined>(undefined)

/**
 * The panel: the scrim, the edge, and the swipe. Use it as `Sheet.Content`.
 *
 * **Three layers, and none of them is optional.** `SheetOverlay` owns the state and draws the scrim,
 * `Sheet` reads that state and decides the edge, and `SheetContent` reads *its* result. Putting the
 * content straight inside `Sheet` leaves `SheetContext` null and the story fails with
 * `Cannot destructure property 'position' of useContext(...)` — which reads like a React bug and is a
 * missing layer.
 *
 * **`position` is a `SheetOverlay` prop** — not `Sheet`, not `SheetContent`. It is `side` here because
 * that is the word a consumer reaches for; it is handed to the overlay, which is the layer that wants it.
 *
 * The surface is `popover.ts`'s, so a sheet and a menu read as the same material arriving by different
 * routes.
 *
 * Exported as `SheetContent` only so tooling can resolve it; consume the compound form `Sheet.Content`.
 */
export function SheetContent({
  side = 'right',
  className,
  children,
  ...props
}: SheetContentProps) {
  const id = useId()
  return (
    <AriaSheetOverlay
      position={side}
      data-slot="sheet-overlay"
      className={[
        'fixed inset-0 z-50 bg-black/50',
        // The scrim is the one place the palette deliberately does not reach: no token darkens in both
        // themes, so this is Tailwind's own black at half, by design.
        'flex',
        side === 'bottom' || side === 'top' ? 'items-end' : 'items-stretch',
        side === 'left' || side === 'start' ? 'justify-start' : 'justify-end',
        side === 'top' ? '!items-start' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/*
        **The size goes here, on `Sheet` — not on `SheetContent`.** React Aria's `SheetContent`
        renders a `Dialog` with `style={{ width: '100%', height: '100%' }}` written *after* the props,
        and an inline style outranks every class. So the panel is always exactly as big as the layer
        above it, and a `w-96` passed to it silently does nothing — the first version of this component
        did that and rendered a 250×149 panel while the class list looked correct.
      */}
      <AriaSheet
        data-slot="sheet"
        className={[
          'flex outline-1 outline-offset-[-2px] outline-transparent',
          // React Aria renders this surface without a `data-focus-visible`, so the ring is keyed on
          // the pseudo-class the browser gives it rather than on an attribute that never arrives.
          'focus-visible:outline-ring',
          SIZES[side],
        ].join(' ')}
      >
        <AriaSheetContent
          aria-describedby={id}
          className={[
            // Scrolling lives on the panel, because the layer above is pinned to `height: 100%`
            // and cannot be sized from outside. Without it a sheet taller than the viewport had
            // no scrollbar anywhere: `mt-auto` on the footer had no free space to claim, and the
            // content below the fold was unreachable.
            SURFACE,
            'flex min-h-0 flex-col overflow-y-auto overscroll-contain p-6',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <DescriptionId.Provider value={id}>{children}</DescriptionId.Provider>
        </AriaSheetContent>
      </AriaSheet>
    </AriaSheetOverlay>
  )
}

/**
 * The panel's title. Use it as `Sheet.Title` — the modal's own title type, imported rather than copied,
 * because the two are the same short task arriving by a different route.
 *
 * Exported as `SheetTitle` only so tooling can resolve it; consume the compound form `Sheet.Title`.
 */
export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <AriaHeading
      slot="title"
      className={[DIALOG_TITLE, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A sentence under the title. Use it as `Sheet.Description` — its id is wired to the panel's
 * `aria-describedby` here, because React Aria does not.
 *
 * Exported as `SheetDescription` only so tooling can resolve it; consume the compound form
 * `Sheet.Description`.
 */
export function SheetDescription({
  className,
  ...props
}: SheetDescriptionProps) {
  return (
    <AriaText
      slot="description"
      id={useContext(DescriptionId)}
      className={[DIALOG_DESCRIPTION, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * The actions at the foot of the panel. Use it as `Sheet.Footer`.
 *
 * Exported as `SheetFooter` only so tooling can resolve it; consume the compound form `Sheet.Footer`.
 */
export function SheetFooter({ className, children }: SheetFooterProps) {
  return (
    <div
      className={[DIALOG_FOOTER, 'mbs-auto', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

/**
 * A button that closes the panel. Use it as `Sheet.Close` — a plain button carrying `slot="close"`,
 * which is the whole mechanism, as it is on the modal.
 *
 * Exported as `SheetClose` only so tooling can resolve it; consume the compound form `Sheet.Close`.
 */
export function SheetClose({ className, children }: SheetCloseProps) {
  return (
    <Button slot="close" variant="ghost" className={className}>
      {children}
    </Button>
  )
}

function SheetRoot({ children, ...props }: SheetProps) {
  // **`SheetTrigger`, not `DialogTrigger`.** They take the same props, but React Aria's `SheetTrigger` wraps
  // its children in a `PressResponder` with `isPressed={false}` — "prevent the trigger element from
  // appearing stuck while the sheet is open". A plain `DialogTrigger` leaves the button that opened the
  // sheet looking pressed for as long as the sheet is up, which is exactly what a press-and-hold looks like
  // and is wrong.
  return <AriaSheetTrigger {...props}>{children}</AriaSheetTrigger>
}

/**
 * A panel that slides in from an edge — a task's details without leaving the page.
 *
 * ```tsx
 * <Sheet>
 *   <Button>Details</Button>
 *   <Sheet.Content side="right">
 *     <Sheet.Title>fra1 · Frankfurt</Sheet.Title>
 *     <Sheet.Description>Checked every 60 seconds.</Sheet.Description>
 *     <Sheet.Footer>
 *       <Sheet.Close>Close</Sheet.Close>
 *     </Sheet.Footer>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 *
 * **A sheet is a modal that kept the page visible.** It takes the pointer and traps focus exactly as a
 * `Modal` does, but covers one edge instead of the middle — so the row you opened it from is still on
 * screen behind it, which is the reason to reach for it over a dialog. Its title and footer are the
 * modal's own, imported rather than copied, so the two cannot drift.
 *
 * **It is also a swipe target on touch**, which is why `side` is not merely a layout prop: React Aria
 * turns it into the swipe direction, so a right-hand panel is dismissed by dragging right. A panel that
 * arrives with a gesture should leave the same way.
 */
export const Sheet = Object.assign(SheetRoot, {
  Content: SheetContent,
  Title: SheetTitle,
  Description: SheetDescription,
  Footer: SheetFooter,
  Close: SheetClose,
})
