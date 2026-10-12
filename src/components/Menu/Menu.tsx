import {
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
  Separator as AriaSeparator,
  MenuLoadMoreItem as AriaMenuLoadMoreItem,
} from 'react-aria-components'
import type {
  HeaderProps as AriaHeaderProps,
  MenuItemProps as AriaMenuItemProps,
  MenuProps as AriaMenuProps,
  MenuSectionProps as AriaMenuSectionProps,
  MenuTriggerProps as AriaMenuTriggerProps,
  PopoverProps as AriaPopoverProps,
  SeparatorProps as AriaSeparatorProps,
  MenuLoadMoreItemProps as AriaMenuLoadMoreItemProps,
} from 'react-aria-components'
import { LOAD_MORE, LoadMoreSpinner } from '../loadMore'

import {
  ITEM,
  ITEM_LABEL,
  LIST,
  POPOVER,
  SECTION,
  SECTION_TITLE,
  SEPARATOR,
  SUBMENU_CARET,
} from '../popover'

export interface MenuProps extends Omit<
  AriaMenuTriggerProps,
  'children' | 'className' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /** Whether the menu is open. Controlled, so pass `onOpenChange` with it. */
  isOpen?: AriaMenuTriggerProps['isOpen']
  /** Whether it starts open, for uncontrolled use. */
  defaultOpen?: AriaMenuTriggerProps['defaultOpen']
  /** Called when the menu asks to open or close. */
  onOpenChange?: AriaMenuTriggerProps['onOpenChange']

  /** The trigger, then a `Menu.Popover`. */
  children?: React.ReactNode
}

export interface MenuPopoverProps<T> extends Omit<
  AriaPopoverProps,
  'children' | 'className'
> {
  className?: string
  /**
   * Props for the list itself — `selectionMode`, `disabledKeys`, `onAction` — which are the menu's
   * rather than the surface's, and which nobody should have to write two slots to reach.
   */
  menuProps?: Omit<AriaMenuProps<T>, 'children' | 'className'>
  /** The items. */
  children?: AriaMenuProps<T>['children']
}

export interface MenuItemProps<T = object> extends Omit<
  AriaMenuItemProps<T>,
  'className' | 'children'
> {
  className?: string
  children?: React.ReactNode
}

export interface MenuSectionProps<T> extends AriaMenuSectionProps<T> {
  children?: React.ReactNode
}

export interface MenuSectionTitleProps extends AriaHeaderProps {
  children?: React.ReactNode
}

export interface MenuSeparatorProps extends Omit<
  AriaSeparatorProps,
  'className'
> {
  className?: string
}

/**
 * The surface the items sit on, and the list itself. Use it as `Menu.Popover`, as the second child of
 * a `Menu` — it draws both, because a popover with no list in it and a list with nowhere to open are
 * never useful apart, the same call `Select.Menu` makes.
 *
 * Exported as `MenuPopover` only so tooling can resolve it; consume the compound form
 * `Menu.Popover`.
 */
export function MenuPopover<T>({
  className,
  menuProps,
  children,
  ...props
}: MenuPopoverProps<T>) {
  return (
    <AriaPopover
      data-slot="menu"
      className={[POPOVER, className].filter(Boolean).join(' ')}
      {...props}
    >
      <AriaMenu className={LIST} {...menuProps}>
        {children}
      </AriaMenu>
    </AriaPopover>
  )
}

/**
 * One row. Use it as `Menu.Item` — with an `href` it is a link, with `onAction` on the menu it is an
 * action, and with a `SubmenuTrigger` inside it it opens again.
 *
 * Exported as `MenuItem` only so tooling can resolve it; consume the compound form `Menu.Item`.
 */
export function MenuItem<T = object>({
  className,
  children,
  ...props
}: MenuItemProps<T>) {
  return (
    <AriaMenuItem
      className={[ITEM, className].filter(Boolean).join(' ')}
      {...props}
    >
      {({ hasSubmenu }) => (
        <>
          <span className={ITEM_LABEL}>{children}</span>
          {hasSubmenu ? (
            <svg
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
              className={`size-2.5 ${SUBMENU_CARET}`}
            >
              <path
                d="M3 1L7 5L3 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </>
      )}
    </AriaMenuItem>
  )
}

/**
 * A group of items. Use it as `Menu.Section`, with a `Menu.SectionTitle` at the top of it.
 *
 * Exported as `MenuSection` only so tooling can resolve it; consume the compound form `Menu.Section`.
 */
export function MenuSection<T>({ children, ...props }: MenuSectionProps<T>) {
  return (
    <AriaMenuSection className={SECTION} {...props}>
      {children}
    </AriaMenuSection>
  )
}

/**
 * A group's heading. Use it as `Menu.SectionTitle`.
 *
 * Exported as `MenuSectionTitle` only so tooling can resolve it; consume the compound form
 * `Menu.SectionTitle`.
 */
export function MenuSectionTitle({
  children,
  ...props
}: MenuSectionTitleProps) {
  return (
    <AriaHeader className={SECTION_TITLE} {...props}>
      {children}
    </AriaHeader>
  )
}

/**
 * The sheet's hairline, between two runs of items. Use it as `Menu.Separator`.
 *
 * Exported as `MenuSeparator` only so tooling can resolve it; consume the compound form
 * `Menu.Separator`.
 */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return (
    <AriaSeparator
      elementType="div"
      className={[SEPARATOR, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * Styled element. Not exported — `Menu` below is the public symbol, and docgen reads the JSDoc from
 * the *exported* declaration, not this one.
 */
function MenuRoot({ children, ...props }: MenuProps) {
  return <AriaMenuTrigger {...props}>{children}</AriaMenuTrigger>
}

/**
 * A menu of actions or choices, opened from a control. The surface is the sheet's
 * `.ds-select-menu`, shared with the select through `popover.ts`.
 *
 * ```tsx
 * <Menu>
 *   <Button>Actions</Button>
 *   <Menu.Popover menuProps={{ onAction: (key) => run(key) }}>
 *     <Menu.Item id="restart">Restart</Menu.Item>
 *     <Menu.Separator />
 *     <Menu.Item id="delete">Delete</Menu.Item>
 *   </Menu.Popover>
 * </Menu>
 * ```
 *
 * **A menu is a list of things to do, and it closes when you do one.** That is the difference between
 * it and a `Select`: a select keeps a value and says so in its trigger, while a menu performs an
 * action and goes away. `onAction` is the prop that says which this is — set it and the rows are
 * commands, leave it off and `selectionMode` makes them choices.
 *
 * React Aria does the parts a hand-rolled menu gets wrong: the popover is positioned against the
 * trigger and flips when it would run off the page, focus moves into the list and back out to the
 * trigger, the arrow keys walk it, Escape and a click outside dismiss it, and type-ahead jumps to a
 * row by its first letters.
 *
 * `Menu.Popover` carries the menu's own props — `selectionMode`, `disabledKeys`, `onAction` — so they
 * are written once rather than split across two slots. A submenu is a `SubmenuTrigger` inside a
 * `Menu.Item`; this component does not wrap it, because a submenu is a second menu and wrapping it
 * would have to answer questions the consumer has not been asked yet.
 */

/**
 * The row that asks for the next page. Use it as `Menu.LoadMore`, last inside `Menu`.
 *
 * A menu that runs long — a list of regions, a list of hundreds of actions — has no scrollbar a reader
 * can consult for how much is left. This is where the rest arrives.
 *
 * It only works inside a virtualized collection, draws nothing until `isLoading`, and React Aria renders
 * nothing at all for it when idle. `gridlist.md` carries the mechanism and the end-to-end proof that it
 * fires on scroll; this is the same sentinel on the same shared recipe.
 */
export function MenuLoadMore({
  className,
  children,
  ...props
}: AriaMenuLoadMoreItemProps) {
  return (
    <AriaMenuLoadMoreItem
      data-slot="menu-load-more"
      className={[LOAD_MORE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? <LoadMoreSpinner />}
    </AriaMenuLoadMoreItem>
  )
}

export const Menu = Object.assign(MenuRoot, {
  Popover: MenuPopover,
  LoadMore: MenuLoadMore,
  Item: MenuItem,
  Section: MenuSection,
  SectionTitle: MenuSectionTitle,
  Separator: MenuSeparator,
})
