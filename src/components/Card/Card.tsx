import type { HTMLAttributes, ReactNode } from 'react'
import { Heading as AriaHeading } from 'react-aria-components'
import type { HeadingProps as AriaHeadingProps } from 'react-aria-components'

/**
 * The sheet's panel, with a structure on it. A card is one thing on the page — a chart, a
 * monitor's detail, a run of results — and it borrows the surface Modal, Tooltip and Toast
 * already share: `bg-card`, a boundary in `--border-strong`, square, and no shadow.
 *
 * The divider under the header and above the footer is `--border`, the row rule Table draws
 * between its rows. That is the sheet's habit everywhere: a panel's own edge is the quieter
 * hairline and the rules inside it are the louder one.
 */
const CARD = 'flex flex-col border border-border-strong bg-card'

/**
 * A grid rather than a flex row, so the `Action` can sit in a second column beside both the title
 * and the description without needing a wrapper. It only becomes two columns when there is an
 * action to put in the second one — `has-data-[slot=card-action]` is that condition, read off the
 * element instead of a prop, so a header with nothing on the right has nothing on the right.
 */
const CARD_HEADER = [
  'grid auto-rows-min items-start gap-1',
  'border-b border-border p-4',
  'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
].join(' ')

const CARD_TITLE =
  'text-[14px] leading-[1.3] font-semibold tracking-[-0.01em] text-foreground'

const CARD_DESCRIPTION = 'text-[12px] leading-[1.5] text-foreground/70'

const CARD_ACTION =
  'col-start-2 row-span-2 row-start-1 self-start justify-self-end'

const CARD_CONTENT = 'p-4 text-[13px] leading-[1.55] text-foreground/70'

const CARD_FOOTER = 'flex items-center gap-2 border-t border-border p-4'

export interface CardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  className?: string
  /** A `Card.Header`, a `Card.Content`, a `Card.Footer` — in that order, and none of them required. */
  children?: ReactNode
}

export interface CardHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  className?: string
  /**
   * A `Card.Title`, a `Card.Description`, and optionally a `Card.Action`. React Aria renders the
   * title as a real heading, so the page's outline says what each card is.
   */
  children?: ReactNode
}

export interface CardTitleProps extends Omit<
  AriaHeadingProps,
  'children' | 'className'
> {
  className?: string
  children?: ReactNode
  /**
   * The heading level. Defaults to 3, or to one deeper than an enclosing React Aria `Section`.
   */
  level?: AriaHeadingProps['level']
}

export interface CardDescriptionProps extends Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'children' | 'className'
> {
  className?: string
  children?: ReactNode
}

export interface CardActionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  className?: string
  /** One control — a `Button`, a `Menu` trigger. More than one belongs in the footer. */
  children?: ReactNode
}

export interface CardContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  className?: string
  children?: ReactNode
}

export interface CardFooterProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  className?: string
  children?: ReactNode
}

/**
 * The top of a card: what it is about, and one control beside that if there is one.
 *
 * Exported as `CardHeader` only so tooling can resolve it; consume the compound form
 * `Card.Header`.
 */
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={[CARD_HEADER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * What the card is about.
 *
 * **A real heading, not a styled `div`.** React Aria renders it as an `h3` by default, so a page
 * of cards has an outline a screen reader can walk; the `level` is a published prop because a
 * card nested inside a section usually wants a different one.
 *
 * Exported as `CardTitle` only so tooling can resolve it; consume the compound form
 * `Card.Title`.
 */
export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <AriaHeading
      data-slot="card-title"
      className={[CARD_TITLE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaHeading>
  )
}

/**
 * The line under the title, for what the card contains rather than what it is.
 *
 * Exported as `CardDescription` only so tooling can resolve it; consume the compound form
 * `Card.Description`.
 */
export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      data-slot="card-description"
      className={[CARD_DESCRIPTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </p>
  )
}

/**
 * The right-hand corner of a header. One control, beside the title — a menu trigger, a refresh,
 * a dismiss.
 *
 * Exported as `CardAction` only so tooling can resolve it; consume the compound form
 * `Card.Action`.
 */
export function CardAction({ className, children, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={[CARD_ACTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * The body — the chart, the table, the text.
 *
 * Exported as `CardContent` only so tooling can resolve it; consume the compound form
 * `Card.Content`.
 */
export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={[CARD_CONTENT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * The row of actions at the bottom, over its own hairline.
 *
 * Exported as `CardFooter` only so tooling can resolve it; consume the compound form
 * `Card.Footer`.
 */
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={[CARD_FOOTER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

function CardRoot({ className, children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={[CARD, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * One thing on the page, in the sheet's own surface.
 *
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Frankfurt</Card.Title>
 *     <Card.Description>fra1 · 42ms</Card.Description>
 *     <Card.Action>
 *       <Menu.Trigger>…</Menu.Trigger>
 *     </Card.Action>
 *   </Card.Header>
 *   <Card.Content>
 *     <Sparkline points={…} />
 *   </Card.Content>
 *   <Card.Footer>
 *     <Button variant="outline">Open</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 *
 * **It is not interactive, and that is the design.** There is no `onPress` and no React Aria
 * primitive under the panels, because a card is a surface rather than a control: a card that
 * does something holds a `Link` or a `Button` that says what the something is. A pressable
 * surface is a control with no name to announce and no target to aim at, and it makes the real
 * control inside it unreachable to anyone who cannot see where it is.
 *
 * **The slots are optional, and a card with only content is a complete card.** Padding lives on
 * the slots rather than on the root, so what the root holds is the surface itself.
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Content: CardContent,
  Footer: CardFooter,
})
