import { createContext, useContext, useId } from 'react'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  DialogProps as AriaDialogProps,
  DialogTriggerProps as AriaDialogTriggerProps,
  HeadingProps as AriaHeadingProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

/**
 * The scrim. **The one place in this system where the palette deliberately does not reach.**
 *
 * A scrim's job is to push the page back, which means it has to *darken* — and there is no token
 * that darkens in both themes. `--color-ink` is black in the dark theme and white in the light one,
 * so it would haze a white page white and separate nothing; `--background` is black in one and white
 * in the other for the same reason. `black/50` is Tailwind's own, is the same in both themes by
 * design, and says exactly what it is.
 */
const OVERLAY = [
  'fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4',
  'bg-black/50',
].join(' ')

/**
 * The sheet's `.ds-panel`, with an edge: a dialog floats over a page, so it needs the same separation
 * the tooltip and the toast do — its own panel, and a hairline to say where it ends.
 */
const DIALOG = [
  'relative w-full max-w-md',
  'border border-border-strong bg-card p-6',
  'outline-none',
].join(' ')

/** The sheet's `.ds-panel-title`: 18px/600, measured off its Page Check reference. */
export const DIALOG_TITLE =
  'm-0 text-[18px] font-semibold tracking-[0.01em] text-foreground'

export const DIALOG_DESCRIPTION =
  'mt-2 text-[13px] leading-[1.5] text-foreground/70'

export const DIALOG_FOOTER = 'mt-6 flex items-center justify-end gap-3'

/** The same dismiss control the toast draws, for the same reason: it is the one that is often missed. */
export const DIALOG_CLOSE = [
  'absolute end-4 top-4 grid size-5 cursor-pointer place-items-center',
  'text-foreground/45',
  'transition-colors duration-[120ms] ease-pulse',
  'data-[hovered]:text-foreground',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-2',
  'data-[focus-visible]:outline-ring',
].join(' ')

export interface ModalProps extends Omit<
  AriaDialogTriggerProps,
  'children' | 'className' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /**
   * Whether the dialog is open. This is a React Aria prop on the trigger — controlled state, so pass
   * `onOpenChange` with it.
   */
  isOpen?: AriaDialogTriggerProps['isOpen']
  /** Whether the dialog starts open, for uncontrolled use. */
  defaultOpen?: AriaDialogTriggerProps['defaultOpen']
  /** Called when the dialog asks to open or close. */
  onOpenChange?: AriaDialogTriggerProps['onOpenChange']

  /** The trigger, then a `Modal.Content`. */
  children?: React.ReactNode
}

export interface ModalContentProps extends Omit<
  AriaDialogProps,
  'children' | 'className'
> {
  className?: string
  /** A `Modal.Title`, the body, and a `Modal.Footer`. */
  children?: React.ReactNode
}

export interface ModalTitleProps extends AriaHeadingProps {
  children?: React.ReactNode
}

export interface ModalDescriptionProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface ModalFooterProps {
  className?: string
  children?: React.ReactNode
}

export interface ModalCloseProps extends Omit<
  AriaButtonProps,
  'children' | 'className' | 'slot'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * The description's id, shared between the dialog and the `Text` inside it. React Aria wires the
 * **title** to the dialog for you — `aria-labelledby` appears on its own — but it does not wire the
 * description, and a description nobody is pointed at is decoration. The id is generated here and
 * passed down rather than written by the consumer, who would have to keep two things in step.
 */
const DescriptionId = createContext<string | undefined>(undefined)

/**
 * The dialog's surface, its scrim and its placement, in one slot. Use it as `Modal.Content`, as the
 * second child of a `Modal`.
 *
 * Exported as `ModalContent` only so tooling can resolve it; consume the compound form
 * `Modal.Content`.
 */
export function ModalContent({
  className,
  children,
  ...props
}: ModalContentProps) {
  const descriptionId = useId()
  return (
    <AriaModalOverlay data-slot="modal" className={OVERLAY} isDismissable>
      <AriaModal className="w-full max-w-md">
        <DescriptionId.Provider value={descriptionId}>
          <AriaDialog
            // Points at the description whether or not one was passed. A dialog with a dangling
            // `aria-describedby` is a smaller thing than a description nobody reads.
            aria-describedby={descriptionId}
            className={[DIALOG, className].filter(Boolean).join(' ')}
            {...props}
          >
            {children}
          </AriaDialog>
        </DescriptionId.Provider>
      </AriaModal>
    </AriaModalOverlay>
  )
}

/**
 * What the dialog is about. Use it as `Modal.Title`. It is the sheet's `.ds-panel-title`, and it is
 * what names the dialog — React Aria wires it to the dialog's `aria-labelledby`, so the title is not
 * decoration.
 *
 * Exported as `ModalTitle` only so tooling can resolve it; consume the compound form `Modal.Title`.
 */
export function ModalTitle({ className, children, ...props }: ModalTitleProps) {
  return (
    <AriaHeading
      slot="title"
      className={[DIALOG_TITLE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaHeading>
  )
}

/**
 * A sentence under the title. Use it as `Modal.Description` — it becomes the dialog's
 * `aria-describedby`, so a screen reader hears what the dialog is for before it hears the controls.
 *
 * Exported as `ModalDescription` only so tooling can resolve it; consume the compound form
 * `Modal.Description`.
 */
export function ModalDescription({
  className,
  children,
  ...props
}: ModalDescriptionProps) {
  const id = useContext(DescriptionId)
  return (
    <AriaText
      id={id}
      slot="description"
      className={[DIALOG_DESCRIPTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaText>
  )
}

/**
 * The actions, right-aligned. Use it as `Modal.Footer`.
 *
 * Exported as `ModalFooter` only so tooling can resolve it; consume the compound form
 * `Modal.Footer`.
 */
export function ModalFooter({ className, children }: ModalFooterProps) {
  return (
    <div className={[DIALOG_FOOTER, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The **×** in the corner. Use it as `Modal.Close` — it is absolutely positioned, so it belongs to
 * the dialog rather than to a footer.
 *
 * Its `slot="close"` is what tells React Aria it is a dismiss control, and that attribute is the
 * whole mechanism: putting it on **any** button closes the dialog. A footer that says "Cancel"
 * rather than "×" therefore wants a plain `Button` with the same `slot`, not this — a first version of
 * the story used `Modal.Close` in its footer and the word flew to the top-right corner, because
 * `position: absolute` goes where it is told.
 *
 * Exported as `ModalClose` only so tooling can resolve it; consume the compound form
 * `Modal.Close`.
 */
export function ModalClose({ className, children, ...props }: ModalCloseProps) {
  return (
    <AriaButton
      slot="close"
      aria-label="Close"
      className={[DIALOG_CLOSE, className].filter(Boolean).join(' ')}
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
 * Styled element. Not exported — `Modal` below is the public symbol, and docgen reads the JSDoc from
 * the *exported* declaration, not this one.
 */
function ModalRoot({ children, ...props }: ModalProps) {
  return <AriaDialogTrigger {...props}>{children}</AriaDialogTrigger>
}

/**
 * A dialog over the page: a short task that needs an answer before the page can be used again.
 *
 * ```tsx
 * <Modal>
 *   <Button>New monitor</Button>
 *   <Modal.Content>
 *     <Modal.Title>New monitor</Modal.Title>
 *     <Modal.Description>It starts checking as soon as you save.</Modal.Description>
 *     <Modal.Footer>
 *       <Modal.Close>Cancel</Modal.Close>
 *       <Button variant="primary">Save</Button>
 *     </Modal.Footer>
 *   </Modal.Content>
 * </Modal>
 * ```
 *
 * **A modal is a demand, so it should be rare.** It takes the page away, traps focus, and stops
 * anyone reading behind it — which is the right trade for a decision that has to be made now, and
 * the wrong one for a form someone might want to consult the page while filling in. A `Popover` is
 * the same dialog without that cost, and the sheet's own menus are popovers.
 *
 * React Aria does the parts a hand-rolled dialog gets wrong: the scrim, focus trapped inside and
 * restored to the trigger on close, Escape to dismiss, a click outside to dismiss, the page behind
 * made inert to a screen reader, and the scroll locked without the page jumping as the bar
 * disappears. `Modal.Close` writes its own `slot="close"` for the same reason `Toast.Close` does.
 *
 * The scrim is the one place in this system where the palette deliberately does not reach, and it
 * says so above.
 */
export const Modal = Object.assign(ModalRoot, {
  Content: ModalContent,
  Title: ModalTitle,
  Description: ModalDescription,
  Footer: ModalFooter,
  Close: ModalClose,
})
