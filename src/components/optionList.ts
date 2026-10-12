/**
 * The recipes a list of options shares — `ListBox`, the `Select` and `ComboBox` menus, and the `Menu`.
 *
 * Extracted rather than copied, for the reason `field.ts`, `date.tsx` and `loadMore.tsx` exist: an option
 * that looks one way in a select and another way in a standalone list is one component wearing two
 * designs.
 */

/** The scrolling list itself. `p-0` because padding belongs to the option, so a hovered row reaches the edge. */
export const OPTION_LIST = 'max-h-[264px] overflow-auto p-0'

/**
 * The sheet's `.ds-select-option`: 13px at 75%, with the accent reserved for the choice.
 *
 * **`data-[focus-visible]:outline-none` here is deliberate, and is not the bug `Table` and `GridList`
 * had.** Those declared a ring and then disabled it; this option conveys focus with a **background**
 * instead — the way a menu row does — so there is no ring to disable. Its sibling rule below is what
 * actually paints focus.
 */
export const OPTION = [
  'flex items-center justify-between gap-3',
  'px-3.5 py-[11px] text-[13px] text-fg/75',
  'cursor-pointer select-none',
  'data-[hovered]:bg-fg/7 data-[hovered]:text-fg',
  'data-[focus-visible]:outline-none data-[focus-visible]:bg-fg/7 data-[focus-visible]:text-fg',
  'data-[selected]:text-teal',
  // **Disabled dims and does not recolour**, the house rule every other control follows. This was missing
  // until `ListBox`'s own test asserted the opacity of a disabled option and got 1: an option that cannot
  // be chosen looked exactly like one that can, in this list and in the select, combo box and menu above
  // it, which all share this recipe.
  'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed',
].join(' ')
