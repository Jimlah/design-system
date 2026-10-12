import { createContext, useContext } from 'react'
import {
  Button as AriaButton,
  Label as AriaLabel,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
} from 'react-aria-components'
import type {
  LabelProps as AriaLabelProps,
  TagGroupProps as AriaTagGroupProps,
  TagListProps as AriaTagListProps,
  TagProps as AriaTagProps,
} from 'react-aria-components'

import { LABEL } from '../field'

/**
 * The sheet's `.ds-tag`: a 12px uppercase chip with a transparent 1px edge, so every variant is the
 * same box however it is filled.
 *
 * **The hover state is `:hover`, not `data-hovered`.** React Aria's `Tag` does not provide one —
 * a real pointer hover leaves the tag without the attribute, which this component's own test caught.
 * Everywhere else in this system `data-[hovered]` is right because React Aria supplies it; here the
 * only honest source of "the pointer is on this chip" is the browser's own pseudo-class.
 *
 * The hover recipe is the same one the button uses — the tag's own colour deepened toward ink — and
 * for the same reason. The sheet brightens its chips with `filter: brightness(1.08)`, which is
 * invisible on a fill that already sits near the top of its range and says nothing at all about
 * *which* tag you are pointing at. `--tag-hover` is declared by each variant and read here, so the
 * recipe and the base land on the same element.
 */
export const CHIP = [
  'inline-flex items-center',
  'border px-2.5 py-1',
  'text-[12px] tracking-[-0.01em] uppercase',
  'transition-[color,background-color,border-color] duration-[120ms] ease-pulse',
].join(' ')

export const TAG_CHIP = [
  CHIP,
  'cursor-pointer',
  'hover:bg-(--tag-hover)',
  'data-[pressed]:bg-(--tag-pressed)',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-2',
  'data-[focus-visible]:outline-teal',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  // A tag with a remove button is still one chip, so the button sits inside the box rather than
  // beside it.
  '[&[data-rac]]:select-none',
].join(' ')

/**
 * The sheet's `.ds-tag--*`, one per variant it defines — seven, because that is how many it has.
 *
 * `default` and `outline` are the two outlines, and `outline` is the one the sheet gives the accent
 * on hover. The three fills carry `ink`. The two accented outlines take a wash of their own colour,
 * which is the same "derive from the base" rule the fills follow — an outline has no fill to deepen,
 * so it gains one.
 *
 * Every one of these is written out in full rather than built from a template string: Tailwind reads
 * source text, and `var(--color-${token})` is not source text it can see.
 */
const VARIANT: Record<string, string> = {
  default: 'border-transparent text-fg/70 hover:text-fg',
  outline: 'border-line-control text-fg/70 hover:border-teal hover:text-teal',
  teal: '[--tag:var(--color-teal)] [--tag-hover:color-mix(in_oklch,var(--color-teal)_88%,var(--color-ink))] [--tag-pressed:color-mix(in_oklch,var(--color-teal)_78%,var(--color-ink))] border-transparent bg-(--tag) text-ink',
  gray: '[--tag:var(--color-neutral)] [--tag-hover:color-mix(in_oklch,var(--color-neutral)_88%,var(--color-ink))] [--tag-pressed:color-mix(in_oklch,var(--color-neutral)_78%,var(--color-ink))] border-transparent bg-(--tag) text-ink',
  yellow:
    '[--tag:var(--color-yellow)] [--tag-hover:color-mix(in_oklch,var(--color-yellow)_88%,var(--color-ink))] [--tag-pressed:color-mix(in_oklch,var(--color-yellow)_78%,var(--color-ink))] border-transparent bg-(--tag) text-ink',
  'outline-teal':
    '[--tag-hover:color-mix(in_oklch,var(--color-teal)_14%,transparent)] [--tag-pressed:color-mix(in_oklch,var(--color-teal)_22%,transparent)] border-teal text-teal',
  'outline-yellow':
    '[--tag-hover:color-mix(in_oklch,var(--color-yellow)_14%,transparent)] [--tag-pressed:color-mix(in_oklch,var(--color-yellow)_22%,transparent)] border-yellow text-yellow',
}

export type TagVariant =
  | 'default'
  | 'outline'
  | 'teal'
  | 'gray'
  | 'yellow'
  | 'outline-teal'
  | 'outline-yellow'

/**
 * The label inside a tag, and the anchor it becomes when the tag has an `href`. React Aria reports a
 * tag with an `href` as `data-href` on a grid row and renders no anchor itself — the same as its
 * navigation tree — so the destination is drawn here. A tag is a real link or it is a chip, and
 * `middle-click`, "open in a new tab" and the status bar all need the anchor.
 */
const LINK = 'inline-flex min-w-0 items-center text-inherit no-underline'
const HREF = createContext<string | undefined>(undefined)

/**
 * The remove button, drawn when the group allows removing. React Aria marks the tag
 * `data-allows-removing` and leaves the control to the consumer, exactly as it does for the tree's
 * disclosure — so this writes it, for the same reason `Table.Selection` writes its own slot: the one
 * attribute that makes it work is the one nobody remembers.
 */
export const TAG_REMOVE = [
  'ms-1.5 -me-1 grid size-3.5 shrink-0 cursor-pointer place-items-center',
  'text-current opacity-55',
  'transition-opacity duration-[120ms] ease-pulse',
  'hover:opacity-100',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-1',
  'data-[focus-visible]:outline-current',
].join(' ')

/** The list wraps, because chips that overflow a column are the one thing a tag group is for. */
const LIST = 'flex flex-wrap gap-2'

// Not generic, unlike `TagListProps`: React Aria's own `TagGroupProps` is not — a tag group's items
// are tags, and the group itself owns no data of its own.
export interface TagGroupProps extends Omit<
  AriaTagGroupProps,
  | 'children'
  | 'className'
  | 'selectionMode'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'onSelectionChange'
  | 'disabledKeys'
  | 'onRemove'
> {
  /** `none`, `single` or `multiple`. */
  selectionMode?: AriaTagGroupProps['selectionMode']
  /** The chosen chips, by each tag's `id`. */
  selectedKeys?: AriaTagGroupProps['selectedKeys']
  /** What starts chosen. */
  defaultSelectedKeys?: AriaTagGroupProps['defaultSelectedKeys']
  /** Called with the new set of keys. */
  onSelectionChange?: AriaTagGroupProps['onSelectionChange']
  /** Chips that cannot be chosen. */
  disabledKeys?: AriaTagGroupProps['disabledKeys']
  /** Called when a chip's remove button is pressed. */
  onRemove?: AriaTagGroupProps['onRemove']

  /** `className` places the group; the chips' own styling stays internal. */
  className?: string
  /** A `TagGroup.Label`, then a `TagGroup.List`. */
  children?: React.ReactNode
}

export interface TagGroupLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface TagGroupListProps<T> extends Omit<
  AriaTagListProps<T>,
  'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface TagProps extends Omit<AriaTagProps, 'className' | 'children'> {
  /** Which of the sheet's chips this is. */
  variant?: TagVariant
  /**
   * Turns the chip into a link. React Aria matches it, and this component draws the anchor — a tag
   * with an `href` is a grid row with `data-href` and nothing to click otherwise.
   */
  href?: string
  className?: string
  children?: React.ReactNode
}

/**
 * The group's legend. Use it as `TagGroup.Label`, above a `TagGroup.List`.
 *
 * Exported as `TagGroupLabel` only so tooling can resolve it; consume the compound form
 * `TagGroup.Label`.
 */
export function TagGroupLabel({
  className,
  children,
  ...props
}: TagGroupLabelProps) {
  return (
    <AriaLabel
      className={[LABEL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaLabel>
  )
}

/**
 * The chips. Use it as `TagGroup.List`, wrapping the `TagGroup.Tag`s.
 *
 * Exported as `TagGroupList` only so tooling can resolve it; consume the compound form
 * `TagGroup.List`.
 */
export function TagGroupList<T>({
  className,
  children,
  ...props
}: TagGroupListProps<T>) {
  return (
    <AriaTagList
      className={[LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTagList>
  )
}

/**
 * One chip. Use it as `TagGroup.Tag`. Give it an `href` and it is a link rather than a value — the
 * sheet uses its tags both ways, which is why `Tag` takes `LinkDOMProps`.
 *
 * Exported as `TagItem` only so tooling can resolve it; consume the compound form `TagGroup.Tag`.
 */
export function TagItem({
  variant = 'default',
  href,
  className,
  children,
  ...props
}: TagProps) {
  const inherited = useContext(HREF)
  const target = href ?? inherited
  return (
    <HREF.Provider value={target}>
      <AriaTag
        href={target}
        className={[TAG_CHIP, VARIANT[variant] ?? VARIANT.default, className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {({ allowsRemoving }) => (
          <>
            {target ? (
              // A link needs a wrapper, and a wrapper makes the children "non-plain text" — which is
              // React Aria's cue to ask for `textValue`, because it can no longer read the name off
              // the markup. A chip with no destination keeps its text bare and needs nothing.
              <a href={target} className={LINK}>
                {children}
              </a>
            ) : (
              children
            )}
            {allowsRemoving ? (
              <AriaButton
                slot="remove"
                aria-label="Remove"
                className={TAG_REMOVE}
              >
                <svg
                  viewBox="0 0 8 8"
                  fill="none"
                  aria-hidden="true"
                  className="size-2"
                >
                  <path
                    d="M1 1L7 7M7 1L1 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </AriaButton>
            ) : null}
          </>
        )}
      </AriaTag>
    </HREF.Provider>
  )
}

/**
 * Styled element. Not exported — `TagGroup` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function TagGroupRoot({ className, children, ...props }: TagGroupProps) {
  return (
    <AriaTagGroup
      data-slot="tag-group"
      className={[className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaTagGroup>
  )
}

/**
 * The sheet's `.ds-tag`: a 12px uppercase chip, in the seven treatments the sheet defines.
 *
 * ```tsx
 * <TagGroup aria-label="Regions">
 *   <TagGroup.List>
 *     <TagGroup.Tag variant="teal">fra1</TagGroup.Tag>
 *     <TagGroup.Tag variant="outline">iad1</TagGroup.Tag>
 *     <TagGroup.Tag variant="outline-yellow">sfo1</TagGroup.Tag>
 *   </TagGroup.List>
 * </TagGroup>
 * ```
 *
 * Add `selectionMode="multiple"` and the chips become selectable rather than decorative, add a
 * `href` and they become links — the sheet uses them all three ways, and React Aria decides which
 * one it is from the props rather than from a different component.
 *
 * ### A tag is not a button
 *
 * It is a short piece of metadata with an edge. The moment it carries an action, it is a button and
 * should look like one; the moment it carries nothing but a value, it does not need to be a control
 * at all. `selectionMode` says the chips are chosen; without it they are labels, and adding
 * `onRemove` to a group that was never selectable makes a control out of decoration.
 *
 * ### Hover deepens the tag's own colour, rather than brightening it
 *
 * The sheet's `a.ds-tag:hover { filter: brightness(1.08) }` cannot survive five fills: on a
 * near-white yellow it is invisible, and on any of them it says nothing about which tag the pointer
 * is on. Fills deepen toward `--color-ink` — the recipe the button uses — and the two accented
 * outlines, which have no fill to deepen, take a wash of their own colour instead. Both derive from
 * the base; neither substitutes a different one.
 *
 * The `outline` variant's edge is `--color-line-control` rather than the sheet's 35% white, which
 * measures under the 3:1 a boundary needs on the dark page. It is the same correction the rest of
 * the system makes, and the reason `--color-line-control` exists.
 */
export const TagGroup = Object.assign(TagGroupRoot, {
  Label: TagGroupLabel,
  List: TagGroupList,
  Tag: TagItem,
})
