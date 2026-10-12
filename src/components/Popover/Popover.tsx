import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Popover as AriaPopover,
  Text as AriaText,
} from 'react-aria-components'
import type {
  DialogTriggerProps as AriaDialogTriggerProps,
  HeadingProps as AriaHeadingProps,
  PopoverProps as AriaPopoverProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'
import { OverlayArrow } from '../OverlayArrow/OverlayArrow'

import { createContext, useContext, useId } from 'react'
import type { ReactNode } from 'react'

import { DIALOG_DESCRIPTION, DIALOG_TITLE } from '../Modal/Modal'
import { SURFACE } from '../popover'

export interface PopoverProps extends Omit<
  AriaDialogTriggerProps,
  'children' | 'className' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /**
   * Whether the panel is open. This is a React Aria prop on the trigger — controlled state, so pass
   * `onOpenChange` with it.
   */
  isOpen?: AriaDialogTriggerProps['isOpen']
  /** Whether the panel starts open, for uncontrolled use. */
  defaultOpen?: AriaDialogTriggerProps['defaultOpen']
  /** Called when the panel asks to open or close. */
  onOpenChange?: AriaDialogTriggerProps['onOpenChange']

  /** The trigger, then a `Popover.Content`. */
  children?: ReactNode
}

export interface PopoverContentProps extends Omit<
  AriaPopoverProps,
  'children' | 'className'
> {
  className?: string
  children?: ReactNode
}

export interface PopoverTitleProps extends Omit<AriaHeadingProps, 'className'> {
  className?: string
}

export interface PopoverDescriptionProps extends Omit<
  AriaTextProps,
  'className'
> {
  className?: string
}

/**
 * The id the panel is described by. React Aria wires `aria-labelledby` from the title on its own and
 * does **not** wire a description — the same gap the modal has, and the same fix.
 */
const DescriptionId = createContext<string | undefined>(undefined)

/**
 * The panel itself. Use it as `Popover.Content`, as the second child of a `Popover`.
 *
 * **It is a dialog that does not take the page.** React Aria's `Popover` is non-modal by default, so
 * focus is not trapped and the page behind stays readable and clickable — which is the whole reason to
 * reach for this over a `Modal`. Dismissing on Escape and on an outside click still works.
 *
 * The surface is `popover.ts`'s — the same hairline, square corners and one shadow the menus wear — but
 * **not** `POPOVER` itself, which is `w-(--trigger-width)`: that is right for a select matched to its
 * field and wrong for a panel with its own idea of how wide it should be.
 *
 * Exported as `PopoverContent` only so tooling can resolve it; consume the compound form
 * `Popover.Content`.
 */
export function PopoverContent({
  className,
  children,
  ...props
}: PopoverContentProps) {
  const id = useId()
  return (
    <AriaPopover
      data-slot="popover"
      className={[SURFACE, 'outline-none', className].filter(Boolean).join(' ')}
      {...props}
    >
      <AriaDialog
        aria-describedby={id}
        className="flex flex-col gap-3 p-4 outline-none"
      >
        <DescriptionId.Provider value={id}>{children}</DescriptionId.Provider>
      </AriaDialog>
    </AriaPopover>
  )
}

/**
 * The panel's title. Use it as `Popover.Title` — the modal's own title type, imported rather than
 * copied, because a popover and a dialog are the same thing at different weights.
 *
 * Exported as `PopoverTitle` only so tooling can resolve it; consume the compound form
 * `Popover.Title`.
 */
export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <AriaHeading
      slot="title"
      className={[DIALOG_TITLE, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A sentence under the title. Use it as `Popover.Description` — its id is wired to the panel's
 * `aria-describedby` here, because React Aria does not.
 *
 * Exported as `PopoverDescription` only so tooling can resolve it; consume the compound form
 * `Popover.Description`.
 */
export function PopoverDescription({
  className,
  ...props
}: PopoverDescriptionProps) {
  return (
    <AriaText
      slot="description"
      id={useContext(DescriptionId)}
      className={[DIALOG_DESCRIPTION, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

function PopoverRoot({ children, ...props }: PopoverProps) {
  return <AriaDialogTrigger {...props}>{children}</AriaDialogTrigger>
}

/**
 * A panel anchored to the thing that opened it, that does not take the page away.
 *
 * ```tsx
 * <Popover>
 *   <Button>Filters</Button>
 *   <Popover.Content placement="bottom start">
 *     <Popover.Title>Filters</Popover.Title>
 *     <Popover.Description>Applies to this view only.</Popover.Description>
 *   </Popover.Content>
 * </Popover>
 * ```
 *
 * **A popover is a modal that is not modal**, and that is the whole decision. It is dismissed by
 * Escape and by a click outside, but it traps nothing and hides nothing: the page behind it stays
 * readable and usable, so someone can consult it while they work. Reach for `Modal` when the page is
 * irrelevant to the decision and for this when it is the context.
 *
 * **Placement is React Aria's, and it flips by itself.** `placement="bottom start"` is a request rather
 * than an instruction: near the bottom of the viewport the panel opens upwards, and near the edge it
 * shifts along, so the screen reader announces where it actually landed.
 *
 * It is what `Menu`, `Select` and `ComboBox` are built on, each adding the list and the trigger
 * behaviour it needs. This is the same surface with no list at all — for an explanation, a filter form,
 * or a small action set that is not a menu.
 */

/**
 * The marker pointing back at the trigger. Use it as `Popover.Arrow`.
 *
 * **Opt-in, and nothing here uses it.** The design language's panels are flat and anchored by proximity;
 * see `OverlayArrow` for why the shape exists at all and what it is made of.
 */
export function PopoverArrow({ className }: { className?: string }) {
  return <OverlayArrow className={className} />
}

export const Popover = Object.assign(PopoverRoot, {
  Arrow: PopoverArrow,
  Content: PopoverContent,
  Title: PopoverTitle,
  Description: PopoverDescription,
})
