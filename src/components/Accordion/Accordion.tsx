import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  DisclosurePanel as AriaDisclosurePanel,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  DisclosureGroupProps as AriaDisclosureGroupProps,
  DisclosurePanelProps as AriaDisclosurePanelProps,
  DisclosureProps as AriaDisclosureProps,
} from 'react-aria-components'

/**
 * The sheet has no accordion in it — the second component here with nothing to copy, after the
 * date picker. So it follows the sheet's *language* rather than its markup: square, mono, the
 * hairline vocabulary of its dividers, and no fill of its own beyond the panel it sits on.
 */

/** A hairline-separated list, which is what the sheet's `.ds-div-hair` draws between rows. */
/** The set is the stack; every line in it belongs to an item. */
const ROOT = 'flex flex-col'

/**
 * One row, and the one element that owns its own state.
 *
 * `data-expanded` is here, not on the header button, so everything the state changes is published
 * from here as custom properties and merely *read* further in — the same arrangement as `Select`
 * and the date pickers, and for the same reason: a rule reaching a child through a group variant
 * ties on specificity with the child's own and loses on source order.
 *
 * The open row announces itself three ways, and none of them is a rule down its edge: the label
 * goes from 55% to full strength, the caret turns, and the row takes the sheet's `.ds-panel`
 * surface. The accent is spent on the caret alone.
 */
const ITEM = [
  'relative flex flex-col',
  'border-b border-line',
  '[--accordion-caret-rotate:0deg]',
  '[--accordion-ink:color-mix(in_oklch,var(--color-fg)_55%,transparent)]',
  '[--accordion-caret-ink:color-mix(in_oklch,var(--color-fg)_45%,transparent)]',
  '[--accordion-row-bg:transparent]',
  'data-[expanded]:[--accordion-caret-rotate:180deg]',
  'data-[expanded]:[--accordion-caret-ink:var(--color-teal)]',
  'data-[expanded]:[--accordion-ink:var(--color-fg)]',
  // The sheet's `.ds-panel`, put on the whole item rather than on the body alone: the open row is
  // one block, heading included, not a heading with a tinted paragraph under it.
  'data-[expanded]:[--accordion-row-bg:var(--color-panel)]',
  '[background:var(--accordion-row-bg)]',
  'transition-colors duration-[160ms] ease-pulse',
].join(' ')

/**
 * The whole header row is the button, which is what makes an accordion usable with a mouse: a
 * target the width of the row rather than the width of the word.
 *
 * The label is the sheet's **row legend** — 12px, uppercase, letterspaced mono — which is how the
 * sheet labels everything from a field to a table row. A sentence-case 13px heading here would
 * read as a different system.
 */
const HEADER = [
  'flex w-full items-center justify-between gap-4 ps-5 pe-4 py-3.5 text-start',
  'text-[12px] uppercase tracking-[0.06em] [color:var(--accordion-ink)]',
  'cursor-pointer select-none',
  'transition-colors duration-[120ms] ease-pulse',
  'data-[hovered]:bg-fg/5 data-[hovered]:text-fg',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-teal',
  // Inset, because an outset ring on a row that reaches the panel's edges would be clipped by
  // whatever the accordion sits in.
  'data-[focus-visible]:-outline-offset-2',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-35',
].join(' ')

/** In the header's own colour, so it dims and brightens with the label beside it — except when
 * open, where the accent is the one thing that says so at a glance. */
const CARET = [
  'h-2 w-3 shrink-0 rotate-(--accordion-caret-rotate)',
  '[color:var(--accordion-caret-ink)]',
  'transition-[rotate,color] duration-[160ms] ease-pulse',
].join(' ')

/**
 * The body. It carries no surface of its own — the item does, so that the open row reads as one
 * block with its heading rather than as a heading with a tinted paragraph under it.
 *
 * The padding is guarded on the panel *not* being hidden, and that guard is doing real work.
 * React Aria hides a closed panel with `hidden="until-found"`, which the browser implements as
 * `content-visibility: hidden` — that skips the content but keeps the element's own box, so
 * padding left on a collapsed panel is dead space under every closed row. Tailwind's preflight
 * deliberately leaves `[hidden="until-found"]` out of its `display: none` rule, so there is
 * nothing else to remove it. The panel has no `data-expanded` to key off; `hidden` is the
 * attribute that is actually there.
 */
const PANEL = [
  'ps-5 pe-4 pb-4 pt-1 text-[13px] leading-[1.6] text-fg/70',
  '[&[hidden]]:p-0',
  'outline-none',
].join(' ')

const Caret = (
  <svg viewBox="0 0 10 6" fill="none" aria-hidden="true" className={CARET}>
    <path
      d="M1 1L5 5L9 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export interface AccordionProps extends Omit<
  AriaDisclosureGroupProps,
  'isDisabled' | 'children' | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Disables every disclosure in the set. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaDisclosureGroupProps['isDisabled']
  /**
   * Which items are open. An accordion shows one at a time unless this is set, which is the
   * difference between an accordion and a stack of independent disclosures.
   */
  allowsMultipleExpanded?: AriaDisclosureGroupProps['allowsMultipleExpanded']
  expandedKeys?: AriaDisclosureGroupProps['expandedKeys']
  defaultExpandedKeys?: AriaDisclosureGroupProps['defaultExpandedKeys']
  onExpandedChange?: AriaDisclosureGroupProps['onExpandedChange']
  className?: string
  /** `Accordion.Item`s. */
  children?: React.ReactNode
}

export interface AccordionItemProps extends Omit<
  AriaDisclosureProps,
  'isDisabled' | 'children' | 'className'
> {
  /** Identifies the item to the set, and is what `expandedKeys` speaks in. */
  id?: AriaDisclosureProps['id']
  /** Disables this one item. */
  isDisabled?: AriaDisclosureProps['isDisabled']
  isExpanded?: AriaDisclosureProps['isExpanded']
  defaultExpanded?: AriaDisclosureProps['defaultExpanded']
  onExpandedChange?: AriaDisclosureProps['onExpandedChange']
  className?: string
  /** An `Accordion.Header`, then an `Accordion.Panel`. */
  children?: React.ReactNode
}

export interface AccordionHeaderProps extends Omit<
  AriaButtonProps,
  'children' | 'className' | 'slot'
> {
  className?: string
  /** The row's label. */
  children?: React.ReactNode
  /**
   * Replaces the caret. An accordion header always shows something that says whether it is open,
   * so this is only for changing *what* — a plus, a dot, a count.
   */
  indicator?: React.ReactNode
}

export interface AccordionPanelProps extends Omit<
  AriaDisclosurePanelProps,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

/**
 * One row's header. Use it as `Accordion.Header`, inside an `Accordion.Item`. The whole row is the
 * button, so the target is the width of the panel rather than the width of the word.
 *
 * Exported as `AccordionHeader` only so tooling can resolve it; consume the compound form
 * `Accordion.Header`.
 */
export function AccordionHeader({
  className,
  children,
  indicator,
  ...props
}: AccordionHeaderProps) {
  return (
    <AriaButton
      slot="trigger"
      className={[HEADER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
      {indicator ?? Caret}
    </AriaButton>
  )
}

/**
 * The content behind a header. Use it as `Accordion.Panel`. While the item is closed React Aria
 * leaves the panel in the document, hidden with `hidden="until-found"` — out of sight and out of
 * the accessibility tree, but still there, which is what lets the browser's find-in-page open the
 * right one. Assert on its visibility, not on its absence.
 *
 * Exported as `AccordionPanel` only so tooling can resolve it; consume the compound form
 * `Accordion.Panel`.
 */
export function AccordionPanel({
  className,
  children,
  ...props
}: AccordionPanelProps) {
  return (
    <AriaDisclosurePanel
      className={[PANEL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaDisclosurePanel>
  )
}

/**
 * One disclosure in the set. Use it as `Accordion.Item`; its `id` is what the set's `expandedKeys`
 * speaks in.
 *
 * Exported as `AccordionItem` only so tooling can resolve it; consume the compound form
 * `Accordion.Item`.
 */
export function AccordionItem({
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <AriaDisclosure
      className={[ITEM, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaDisclosure>
  )
}

/**
 * Styled element. Not exported — `Accordion` below is the public symbol, and docgen reads the
 * JSDoc from the *exported* declaration, not this one.
 */
function AccordionRoot({ ref, className, children, ...props }: AccordionProps) {
  return (
    <AriaDisclosureGroup
      data-slot="accordion"
      ref={ref}
      className={[ROOT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaDisclosureGroup>
  )
}

/**
 * A set of disclosures that takes turns — the sheet has no accordion in it, so this follows its
 * language rather than its markup: square, mono, and the hairline vocabulary of its dividers.
 *
 * ```tsx
 * <Accordion defaultExpandedKeys={['checks']}>
 *   <Accordion.Item id="checks">
 *     <Accordion.Header>Checks</Accordion.Header>
 *     <Accordion.Panel>Three checks are failing.</Accordion.Panel>
 *   </Accordion.Item>
 *   <Accordion.Item id="history">
 *     <Accordion.Header>History</Accordion.Header>
 *     <Accordion.Panel>No incidents in 24 hours.</Accordion.Panel>
 *   </Accordion.Item>
 * </Accordion>
 * ```
 *
 * **The set, not the item, decides how many may be open.** By default opening one closes the
 * rest, which is the difference between an accordion and a stack of independent disclosures;
 * `allowsMultipleExpanded` is the other behaviour, and it is worth asking for deliberately rather
 * than by writing a `Disclosure` per row and calling it an accordion.
 *
 * `expandedKeys` and `onExpandedChange` speak in the items' `id`s. Uncontrolled use takes
 * `defaultExpandedKeys`; controlling the set means passing `expandedKeys` instead, and the
 * component will not change it for you.
 */
export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Panel: AccordionPanel,
})
