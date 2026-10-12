/**
 * The sheet's `.ds-select-menu`, shared by everything that opens over the page: `Menu` now, and
 * `Select` and `ComboBox` when they converge onto it. The same split as `field.ts` — the surface is
 * the thing that must not drift, and the slots are still defined per component so Storybook
 * documents them under the right name.
 *
 * The shadow is the one literal colour in this file: it is a **shadow**, not a surface, and every
 * attempt to derive one from a token produces a haze rather than a shadow. It is `rgba(0,0,0,.7)`
 * because a shadow has to darken in both themes, exactly as the modal's scrim does.
 */
export const SURFACE = [
  'border border-border-strong bg-card',
  'shadow-[0_12px_32px_rgba(0,0,0,.7)]',
  'outline-none',
].join(' ')

/** A popover that holds a single scrolling list, sized to the control it came from. */
export const POPOVER = `flex w-(--trigger-width) flex-col overflow-hidden ${SURFACE}`

/** The list inside it. `max-h` so a long list scrolls rather than running off the page. */
export const LIST = 'max-h-[264px] overflow-auto p-0 outline-none'

/**
 * The sheet's `.ds-select-option`: 13px at 75%, with the accent reserved for the choice.
 *
 * Hover and focus land on the same treatment on purpose. A menu is walked with the arrow keys as
 * much as with a pointer, so the row the keyboard has reached and the row the pointer is over
 * should not look like two different kinds of thing.
 */
export const ITEM = [
  'relative flex items-center justify-between gap-3',
  'px-3.5 py-[11px] text-[13px] text-foreground/75',
  'cursor-pointer select-none',
  'data-[hovered]:bg-foreground/7 data-[hovered]:text-foreground',
  'data-[focus-visible]:outline-none data-[focus-visible]:bg-foreground/7 data-[focus-visible]:text-foreground',
  'data-[selected]:text-primary',
  'data-[disabled]:cursor-not-allowed data-[disabled]:text-foreground/35',
].join(' ')

/** One item's text, which truncates rather than wrapping a menu wider than its trigger. */
export const ITEM_LABEL = 'truncate'

/** A run of items, announced as a group. */
export const SECTION = 'flex flex-col'

/** The sheet's `.ds-select-group-label`. */
export const SECTION_TITLE = [
  'px-3.5 pt-[9px] pb-1',
  'text-[11px] uppercase tracking-[0.08em] text-foreground/45',
].join(' ')

/** The sheet's `.ds-div-hair`, inset so it reads as a break in the list rather than a table edge. */
export const SEPARATOR = 'my-1 h-px shrink-0 bg-border'

/** A search box above the list sits behind the menu's own hairline, so it reads as part of the surface. */
export const SEARCH = 'border-b border-border-strong p-2'

/**
 * A submenu's caret. A row with a submenu says so — `data-has-submenu` is React Aria's — and an
 * affordance nobody can see is not an affordance.
 */
export const SUBMENU_CARET = [
  'shrink-0 text-foreground/45',
  'transition-[rotate] duration-[120ms] ease-pulse',
  'data-[open]:rotate-90',
].join(' ')
