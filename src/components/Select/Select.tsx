import { useContext } from 'react'
import {
  Autocomplete as AriaAutocomplete,
  AutocompleteStateContext,
  Button as AriaButton,
  FieldError as AriaFieldError,
  Header as AriaHeader,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectStateContext,
  SelectValue as AriaSelectValue,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  FieldErrorProps as AriaFieldErrorProps,
  HeaderProps as AriaHeaderProps,
  LabelProps as AriaLabelProps,
  ListBoxItemProps as AriaListBoxItemProps,
  AutocompleteProps as AriaAutocompleteProps,
  ListBoxProps as AriaListBoxProps,
  ListBoxSectionProps as AriaListBoxSectionProps,
  PopoverProps as AriaPopoverProps,
  SelectProps as AriaSelectProps,
  SelectValueProps as AriaSelectValueProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'

import { ERROR, FIELD, FIELD_SIZES, HINT, LABEL } from '../field'
import type { FieldSize } from '../field'
import { SearchField } from '../SearchField/SearchField'

/**
 * The sheet's `.ds-select-btn`.
 *
 * It is the same control as `.ds-input` — the same height, the same fill, the same
 * resting hairline and the same focus treatment — so it reads `--field-border` and
 * `--field-hover` from the field root rather than deciding either itself. That is what
 * makes a field and a select sit together in a column without a seam.
 */
const TRIGGER = [
  'flex w-full items-center gap-3',
  'h-(--field-control-h) ps-3.5 pe-3.5 text-left',
  'border border-(--field-border) bg-panel-2 text-fg',
  'cursor-pointer rounded-none',
  'transition-[border-color,background-color] duration-[120ms] ease-pulse',
  'data-[hovered]:not-data-[focused]:border-(--field-hover)',
  // The sheet turns the border teal on focus and leaves the UA ring off; Chrome gives a
  // focused button `outline-style: auto` regardless, so it has to be said explicitly.
  'data-[focused]:outline-none',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
].join(' ')

/**
 * The sheet's `.placeholder` — 35%, the same weight as an input's placeholder. The
 * state is on the value itself, so this needs no group.
 */
const VALUE = 'min-w-0 flex-1 truncate data-[placeholder]:text-fg/35'

/**
 * The rest of a multiple selection, counted rather than listed.
 *
 * Showing every chosen name is what a native multi-select does, and it fails the moment the
 * list outgrows the trigger: the value truncates and the ellipsis eats the one fact the
 * trigger is for — how many things are selected. Naming the first and counting the rest keeps
 * both, and the count is `shrink-0`, so it can never be the part that gets cut.
 */
const COUNT = [
  'ms-2 shrink-0 align-middle',
  'bg-fg/8 px-1.5 py-0.5 font-mono text-[11px] text-fg/70',
].join(' ')

/**
 * The sheet puts `.ds-caret` 14px from the right, at half height. The icon is absolutely
 * positioned and the trigger keeps its `pe-10`, so replacing the caret with a spinner —
 * which is a different size — cannot shift the value beside it.
 */
const ICON = 'flex size-3 shrink-0 items-center justify-center'

/**
 * The box is a fixed 12x12 in the flow, so swapping the 10x6 caret for the 12px spinner
 * cannot shift the value beside it. Alignment is the trigger's flex, not an absolute
 * offset, which is what lets it be a normal flex child.
 *
 * The rotation stays the standalone `rotate` property rather than a `transform`, which is
 * why the sheet can write it independently — and why it can be driven by a variable set
 * on the root, where `data-open` lives.
 */
const ICON_CARET = [
  ICON,
  'rotate-(--dropdown-caret-rotate) [color:var(--dropdown-caret-ink)]',
  'transition-[rotate,color] duration-[160ms] ease-pulse',
].join(' ')

/** Same box, no rotation: a spinner that turned when the menu opened would read as a fault. */
const ICON_SPINNER = [ICON, '[color:var(--dropdown-caret-ink)]'].join(' ')

/**
 * The sheet's `.ds-select-menu`. The border and shadow sit on the popover, because that
 * is the positioned box; the scrolling sits on the list inside it, so the options move
 * under a fixed frame rather than dragging the frame's edges with them.
 */
const MENU = [
  'flex w-(--trigger-width) flex-col overflow-hidden',
  'border border-line-strong bg-panel',
  'shadow-[0_12px_32px_rgba(0,0,0,.7)]',
].join(' ')

const LIST = 'max-h-[264px] overflow-auto p-0 outline-none'

/** The sheet's `.ds-select-option`: 13px, 75%, with the accent reserved for the choice. */
const OPTION = [
  'flex items-center justify-between gap-3',
  'px-3.5 py-[11px] text-[13px] text-fg/75',
  'cursor-pointer select-none',
  'data-[hovered]:bg-fg/7 data-[hovered]:text-fg',
  'data-[focus-visible]:outline-none data-[focus-visible]:bg-fg/7 data-[focus-visible]:text-fg',
  'data-[selected]:text-teal',
].join(' ')

const OPTION_LABEL = 'truncate'

/**
 * The sheet marks the chosen option with a literal `[SET]` rather than a tick — its own
 * idiom, kept as-is. It is `aria-hidden` because `aria-selected` already says this, and
 * a screen reader announcing "set" on top of "selected" would be noise.
 */
const MARKER =
  'shrink-0 font-mono text-[11px] text-yellow data-[slot=marker]:select-none'

/** The sheet's `.ds-select-group-label`. */
const GROUP_LABEL = [
  'px-3.5 pt-[9px] pb-1',
  'text-[11px] uppercase tracking-[0.08em] text-fg/45',
].join(' ')

const SECTION = 'flex flex-col'

/**
 * The search sits above the options behind the same hairline the menu is drawn with, so
 * it reads as part of the surface rather than as a field dropped into it.
 */
const SEARCH = 'border-b border-line-strong p-2'

/**
 * A select does **not** mark itself invalid with `aria-invalid`, and that is correct
 * rather than a gap. Its trigger is a `<button>` with `aria-haspopup="listbox"`, and
 * WAI-ARIA does not support `aria-invalid` on `role="button"` — it applies to textboxes,
 * comboboxes, switches and the like. React Aria leaves it off for the same reason it
 * puts it on a Checkbox and withholds it here.
 *
 * The failure still reaches assistive tech: `Select.Error` is wired to the trigger
 * as its `aria-describedby`, so focusing the trigger reads the message. The select's own
 * `data-invalid` on the field root is the styling hook, and it is what turns the border
 * red. Do not add `aria-invalid` back — it would be invalid markup, not a fix.
 */

const Caret = (
  <svg
    viewBox="0 0 10 6"
    fill="none"
    aria-hidden="true"
    className="h-1.5 w-2.5"
  >
    <path
      d="M1 1L5 5L9 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * The same drawing the Button uses while `isPending`, down to the 0.3 ring, so a loading
 * select and a loading button look like the same event. Sized in `cap` to track the
 * trigger's font size the way the caret's fixed box cannot.
 */
const Spinner = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className="size-[1.25cap] motion-safe:animate-spin"
  >
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      strokeOpacity="0.3"
      strokeWidth="2"
    />
    <path
      d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

/**
 * The selection mode. React Aria's `Select` supports multiple, but types the mode as a
 * parameter defaulting to single, so a plain `selectionMode="multiple"` is rejected. Carrying
 * that parameter through here is what makes the mode inferable from the prop — and it is what
 * types `onChange` correctly, as an array of keys rather than one.
 */
export type SelectionMode = 'single' | 'multiple'

export interface SelectProps<
  TMode extends SelectionMode = 'single',
> extends Omit<
  AriaSelectProps<object, TMode>,
  'isDisabled' | 'isRequired' | 'isInvalid' | 'children' | 'className'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Sizes the trigger the same way a field is sized, through the shared tokens. */
  size?: FieldSize
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaSelectProps<object, TMode>['isDisabled']
  isRequired?: AriaSelectProps<object, TMode>['isRequired']
  isInvalid?: AriaSelectProps<object, TMode>['isInvalid']
  /** The select owns the value, as a single key. */
  /**
   * The value, as a key. This pair is the single-selection one, and stays singular whatever
   * the mode — in multiple, `value` and `defaultValue` below are the ones that take an array.
   */
  selectedKey?: AriaSelectProps<object, TMode>['selectedKey']
  defaultSelectedKey?: AriaSelectProps<object, TMode>['defaultSelectedKey']
  /**
   * The selection when the mode is multiple: an array of keys, where `selectedKey` above
   * holds one. React Aria types these through `ValueBase`, so the array form appears only
   * once `selectionMode="multiple"` has narrowed the mode.
   */
  value?: AriaSelectProps<object, TMode>['value']
  defaultValue?: AriaSelectProps<object, TMode>['defaultValue']
  /** One key in single mode; an array of them in multiple. */
  onChange?: AriaSelectProps<object, TMode>['onChange']
  /**
   * What the trigger shows before anything is chosen, before the value itself. Carried
   * on the select rather than the value, so it survives the value slot being replaced.
   */
  placeholder?: AriaSelectProps<object>['placeholder']
  className?: string
  /** `Select.Label`, `Select.Button`, `Select.Menu`, then the hint and error. */
  children?: React.ReactNode
}

export interface SelectLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface SelectButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  className?: string
  /** Replaces the value area. The caret is always drawn. */
  children?: React.ReactNode
}

export interface SelectValueProps extends Omit<
  AriaSelectValueProps<object>,
  'children' | 'className'
> {
  className?: string
  /**
   * Replaces how the value is drawn. Left alone, one selection is shown as its own name and
   * several are shown as the first plus a count — pass a function to render the whole
   * selection your own way.
   */
  children?: AriaSelectValueProps<object>['children']
}

export interface SelectIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Swaps the caret for the Button's spinner while the options are being fetched, and
   * puts it back when they land. The caret's rotation is dropped with it, since a
   * spinner that turned whenever the menu opened would read as a fault.
   */
  isLoading?: boolean
  className?: string
  /** Replaces the default caret. Ignored while `isLoading`. */
  children?: React.ReactNode
}

export interface SelectMenuProps extends Omit<AriaPopoverProps, 'className'> {
  className?: string
  children?: React.ReactNode
}

export interface SelectPopoverProps extends Omit<
  AriaPopoverProps,
  'className'
> {
  className?: string
  /** `Select.Search` and `Select.List`, in that order. */
  children?: React.ReactNode
}

export interface SelectAutoCompleteProps extends Omit<
  AriaAutocompleteProps<object>,
  | 'children'
  | 'inputValue'
  | 'defaultInputValue'
  | 'onInputChange'
  | 'filter'
  | 'disableAutoFocusFirst'
  | 'disableVirtualFocus'
  | 'className'
> {
  /** Shown in the box and used as its label, since a dropdown has no room for one. */
  placeholder?: string
  /**
   * Applies to the search strip. The scope itself renders no element, so this is the only
   * thing here it could style.
   */
  className?: string
  /**
   * The query the list is filtered by. Uncontrolled by default — the box owns it — so pass
   * this only to drive the filtering from outside, which is what you want when the value
   * lives in a URL or a store.
   */
  inputValue?: AriaAutocompleteProps<object>['inputValue']
  defaultInputValue?: AriaAutocompleteProps<object>['defaultInputValue']
  /** Fires as the query changes. React Aria passes the string directly, not an event. */
  onInputChange?: AriaAutocompleteProps<object>['onInputChange']
  /**
   * Decides which options survive the query. Defaults to `startsWith`.
   *
   * It is not optional in practice: **React Aria's own default filter is not applied to a
   * Select's collection**, so a scope left without one filters nothing at all. Having this
   * component supply a default is the difference between a search that works and one that
   * silently does not.
   */
  filter?: AriaAutocompleteProps<object>['filter']
  /** Whether the first option takes focus once a filter runs. Off by default. */
  disableAutoFocusFirst?: AriaAutocompleteProps<object>['disableAutoFocusFirst']
  /** Whether the list keeps a virtual focus instead of being tabbable item by item. */
  disableVirtualFocus?: AriaAutocompleteProps<object>['disableVirtualFocus']
  /** A `Select.OptionList`, and anything else that should sit below the search box. */
  children?: React.ReactNode
}

/**
 * A `filter` for `Select.AutoComplete` that narrows from the start of an option's text,
 * case- and accent-insensitively:
 *
 * ```tsx
 * <Select.AutoComplete filter={startsWith}>
 * ```
 *
 * React Aria's own default is a substring match, so `iad` finds `iad1 · Virginia` either
 * way; the difference shows on a short query, where `s` should not surface every monitor
 * with an `s` in its region. Case-insensitivity matters because the list is uppercase and
 * nobody types uppercase.
 */
export function startsWith(textValue: string, inputValue: string): boolean {
  return textValue
    .toLocaleLowerCase()
    .startsWith(inputValue.toLocaleLowerCase())
}

export interface SelectOptionListProps extends Omit<
  AriaListBoxProps<object>,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface SelectOptionProps extends Omit<
  AriaListBoxItemProps<object>,
  'children' | 'className'
> {
  className?: string
  /** The option's label. */
  children?: React.ReactNode
}

export interface SelectSectionProps extends Omit<
  AriaListBoxSectionProps<object>,
  'children' | 'className'
> {
  className?: string
  /** A `Select.SectionTitle`, then the options in this run. */
  children?: React.ReactNode
}

export interface SelectSectionTitleProps extends AriaHeaderProps {
  children?: React.ReactNode
}

export interface SelectHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface SelectFieldErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

/**
 * The legend for the select. Use it as `Select.Label`. The required marker comes from the
 * select's own `data-required`, so it cannot drift out of sync with `isRequired`.
 *
 * Exported as `SelectLabel` only so tooling can resolve it; consume the compound form
 * `Select.Label`.
 */
export function SelectLabel({
  className,
  children,
  ...props
}: SelectLabelProps) {
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
 * The value that React Aria renders inside the trigger. Use it as `Select.Value` only to
 * override that; otherwise `Select.Button` places it for you.
 *
 * Exported as `SelectValueSlot` only so tooling can resolve it; consume the compound form
 * `Select.Value`.
 */
export function SelectValueSlot({
  className,
  children,
  ...props
}: SelectValueProps) {
  // The count comes from the select's own state rather than from the render props, because a
  // function child has to be passed up front and the render props only say how many *after*
  // React Aria has decided to call one. Reading the state lets the placeholder and the
  // single-selection cases fall through to React Aria untouched.
  const state = useContext(SelectStateContext)
  const selected = state?.selectedItems ?? []
  return (
    <AriaSelectValue
      data-slot="value"
      className={[VALUE, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ??
        (selected.length > 1
          ? () => (
              <>
                <span data-slot="value-text" className="truncate">
                  {selected[0]?.textValue}
                </span>
                <span data-slot="value-count" className={COUNT}>
                  +{selected.length - 1}
                </span>
              </>
            )
          : undefined)}
    </AriaSelectValue>
  )
}

/**
 * The trigger. Use it as `Select.Button`. Put `Select.Value` and `Select.Icon` inside
 * it; a bare `<Select.Button />` places both for you, so the two are only worth writing
 * out when you are replacing one of them.
 *
 * Exported as `SelectButton` only so tooling can resolve it; consume the compound form
 * `Select.Button`.
 */
export function SelectButton({
  className,
  children,
  ...props
}: SelectButtonProps) {
  return (
    <AriaButton
      className={[TRIGGER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children ?? (
        <>
          <SelectValueSlot />
          <SelectIcon />
        </>
      )}
    </AriaButton>
  )
}

/**
 * The dropdown icon at the end of the trigger. Use it as `Select.Icon`.
 *
 * It draws the sheet's caret unless you replace it with a child, and takes `isLoading`
 * to swap that for the spinner the Button shows while `isPending`:
 *
 * ```tsx
 * <Select.Icon />
 * <Select.Icon isLoading />
 * ```
 *
 * Exported as `SelectIcon` only so tooling can resolve it; consume the compound form
 * `Select.Icon`.
 */
export function SelectIcon({
  isLoading,
  className,
  children,
  ...props
}: SelectIconProps) {
  return (
    <span
      data-slot="icon"
      aria-hidden="true"
      className={[isLoading ? ICON_SPINNER : ICON_CARET, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading ? Spinner : (children ?? Caret)}
    </span>
  )
}

/**
 * The menu: a popover holding the list. Use it as `Select.Menu`, and put
 * `Select.Option`s inside it. React Aria positions it against the trigger and keeps the
 * width matched, so the sheet's `left: 0; right: 0` needs no work.
 *
 * Exported as `SelectMenu` only so tooling can resolve it; consume the compound form
 * `Select.Menu`.
 */
export function SelectPopover({
  className,
  children,
  offset = 6,
  ...props
}: SelectPopoverProps) {
  // The popover owns the autocomplete, not the search field, because React Aria needs
  // the scope to wrap the list as well as the input. That keeps `Select.Search` and
  // `Select.List` siblings inside it, which is the shape a consumer would expect, and
  // leaves the scope inert when no search is present.
  return (
    <AriaPopover
      offset={offset}
      className={[MENU, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaPopover>
  )
}

/**
 * The autocomplete scope. Use it as `Select.AutoComplete`, inside a `Select.Popover`.
 *
 * React Aria filters a collection by wrapping *both* the search box and the list in one
 * scope, so this has to sit above `Select.Search` and `Select.OptionList` together. It
 * renders no element of its own — it exists to be that boundary, which is why the list is
 * a sibling of the search rather than a child of it.
 *
 * It draws the search box itself — there is no separate search slot, because a scope
 * without a box to type in would have nothing to do. Reach for `Select.Menu` instead when
 * the list needs no searching at all.
 *
 * Exported as `SelectAutoComplete` only so tooling can resolve it; consume the compound
 * form `Select.AutoComplete`.
 */
export function SelectAutoComplete({
  placeholder = 'Search…',
  filter = startsWith,
  className,
  children,
  ...props
}: SelectAutoCompleteProps) {
  // Driving the field from the autocomplete state directly, rather than letting the two
  // find each other, is what makes the filtering work: React Aria hands the scope's value to
  // the input through a context that a SearchField also fills in itself, so which one wins
  // is left to merge order. Naming the connection leaves nothing to chance.
  const autocomplete = useContext(AutocompleteStateContext)
  return (
    <AriaAutocomplete filter={filter} {...props}>
      <div
        data-slot="search"
        className={[SEARCH, className].filter(Boolean).join(' ')}
      >
        <SearchField
          size="sm"
          value={autocomplete?.inputValue}
          onChange={(value) => autocomplete?.setInputValue(value)}
        >
          <SearchField.Group>
            <SearchField.Icon />
            <SearchField.Input
              placeholder={placeholder}
              aria-label={placeholder}
            />
          </SearchField.Group>
        </SearchField>
      </div>
      {children}
    </AriaAutocomplete>
  )
}

/**
 * The options. Use it as `Select.OptionList`, inside a `Select.Popover` — wrapped in a
 * `Select.AutoComplete` when there is a `Select.Search` above it.
 *
 * Exported as `SelectOptionList` only so tooling can resolve it; consume the compound form
 * `Select.OptionList`.
 */
export function SelectOptionList({
  className,
  children,
  ...props
}: SelectOptionListProps) {
  return (
    <AriaListBox
      className={[LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaListBox>
  )
}

/**
 * The popover and the list together — the common case. Use it as `Select.Menu`. Reach for
 * `Select.Popover` with `Select.AutoComplete` and `Select.OptionList` instead when
 * something has to sit among them, such as `Select.Search`.
 *
 * Exported as `SelectMenu` only so tooling can resolve it; consume the compound form
 * `Select.Menu`.
 */
export function SelectMenu({
  className,
  children,
  offset = 6,
  ...props
}: SelectMenuProps) {
  return (
    <SelectPopover offset={offset} className={className} {...props}>
      <SelectOptionList>{children}</SelectOptionList>
    </SelectPopover>
  )
}

/**
 * One choice. Use it as `Select.Option`, inside a `Select.Menu`. The label is its child;
 * pass `textValue` yourself only when the label is not plain text, since type-ahead reads
 * it rather than the rendered nodes.
 *
 * Exported as `SelectOption` only so tooling can resolve it; consume the compound form
 * `Select.Option`.
 */
export function SelectOption({
  className,
  children,
  ...props
}: SelectOptionProps) {
  return (
    <AriaListBoxItem
      textValue={
        props.textValue ?? (typeof children === 'string' ? children : undefined)
      }
      className={[OPTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span data-slot="label" className={OPTION_LABEL}>
            {children}
          </span>
          {isSelected ? (
            <span data-slot="marker" aria-hidden="true" className={MARKER}>
              [SET]
            </span>
          ) : null}
        </>
      )}
    </AriaListBoxItem>
  )
}

/**
 * The heading of a `Select.Section`, in the sheet's `.ds-select-group-label`.
 *
 * A slot rather than a `title` prop, so it composes the way everything else here does —
 * and so a heading that needs a count or an icon can be given one without the section
 * having to grow a prop for it.
 *
 * Exported as `SelectSectionTitle` only so tooling can resolve it; consume the compound
 * form `Select.SectionTitle`.
 */
export function SelectSectionTitle({
  className,
  children,
  ...props
}: SelectSectionTitleProps) {
  return (
    <AriaHeader
      className={[GROUP_LABEL, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaHeader>
  )
}

/**
 * A labelled run of options, announced as a group. Use it as `Select.Section`, with a
 * `Select.SectionTitle` inside it.
 *
 * Exported as `SelectSection` only so tooling can resolve it; consume the compound form
 * `Select.Section`.
 */
export function SelectSection({
  className,
  children,
  ...props
}: SelectSectionProps) {
  return (
    <AriaListBoxSection
      className={[SECTION, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaListBoxSection>
  )
}

/**
 * The guidance under the select. Use it as `Select.Hint`. React Aria wires it to the
 * trigger's `aria-describedby`.
 *
 * Exported as `SelectHint` only so tooling can resolve it; consume the compound form
 * `Select.Hint`.
 */
export function SelectHint({ className, children, ...props }: SelectHintProps) {
  return (
    <AriaText
      slot="description"
      className={[HINT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaText>
  )
}

/**
 * The message shown when the select is `isInvalid`. Use it as `Select.Error`; React
 * Aria renders nothing while the select is valid.
 *
 * Exported as `SelectFieldError` only so tooling can resolve it; consume the compound form
 * `Select.Error`.
 */
export function SelectFieldError({
  className,
  children,
  ...props
}: SelectFieldErrorProps) {
  return (
    <AriaFieldError
      className={[ERROR, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaFieldError>
  )
}

/**
 * Styled element. Not exported — `Select` below is the public symbol, and docgen reads
 * the JSDoc from the *exported* declaration, not this one.
 */
function SelectRoot<TMode extends SelectionMode = 'single'>({
  ref,
  size = 'md',
  className,
  children,
  isInvalid,
  isRequired,
  ...props
}: SelectProps<TMode>) {
  return (
    <AriaSelect
      ref={ref}
      className={[
        FIELD,
        FIELD_SIZES[size],
        // While the menu is open the trigger keeps the focus border, as the sheet's
        // `.is-open` does. Both this and the focus rule resolve to the same colour, so
        // it does not matter that either can match first.
        'data-[open]:not-data-[invalid]:[--field-border:var(--color-primary)]',
        'data-[focused]:not-data-[disabled]:[--field-border:var(--color-primary)]',
        // Invalid outranks the resting border, and excludes focus so the two can never
        // both match and leave the colour to source order.
        'data-[invalid]:not-data-[focused]:[--field-border:var(--color-destructive)]',
        // The trigger's hover rule is one specificity step above its resting border, so
        // an open trigger that is also hovered would take the hover colour and lose the
        // teal. Retargeting what hover resolves to is what keeps open winning, without
        // the trigger needing to know it is open at all.
        'data-[open]:[--field-hover:var(--color-primary)]',
        // The caret's rotation and colour live here because `data-open` is on this
        // element, not on the trigger — and a group variant would tie on specificity
        // with the caret's own resting rule. See the note in `Checkbox.tsx`. The names are
        // shared with `ComboBox`, which has the same caret with the same problem.
        '[--dropdown-caret-rotate:0deg]',
        '[--dropdown-caret-ink:color-mix(in_oklch,var(--color-foreground)_50%,transparent)]',
        'data-[open]:[--dropdown-caret-rotate:180deg]',
        'data-[open]:[--dropdown-caret-ink:var(--color-primary)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      isInvalid={isInvalid}
      isRequired={isRequired}
      {...props}
    >
      {children}
    </AriaSelect>
  )
}

/**
 * A select — the sheet's `.ds-select`, `.ds-select-btn` and `.ds-select-menu`. Opens a
 * list over the page instead of pushing it down, and keeps the chosen value in the
 * trigger where a form can read it back.
 *
 * ```tsx
 * <Select defaultSelectedKey="https" placeholder="Choose a protocol">
 *   <Select.Label>Protocol</Select.Label>
 *   <Select.Button>
 *     <Select.Value />
 *     <Select.Icon />
 *   </Select.Button>
 *   <Select.Popover>
 *     <Select.AutoComplete>
 *       <Select.Search />
 *       <Select.OptionList>
 *         <Select.Option id="http">HTTP</Select.Option>
 *         <Select.Option id="https">HTTPS</Select.Option>
 *       </Select.OptionList>
 *     </Select.AutoComplete>
 *   </Select.Popover>
 *   <Select.Hint>Applies to every check.</Select.Hint>
 *   <Select.Error>Choose a protocol.</Select.Error>
 * </Select>
 * ```
 *
 * The composition is explicit, like every other control here: `Select.Value` shows the
 * chosen option and `Select.Icon` the dropdown caret, both written inside
 * `Select.Button`. A bare `<Select.Button />` places those two for you, so the trigger is
 * never empty — but spelling them out is what lets you swap the caret, or hand the icon
 * `isLoading` while the options are still being fetched.
 *
 * `Select.Menu` is the popover and the list together, so the options go one level in
 * rather than three — React Aria needs a `Popover` around a `ListBox` around each item,
 * and none of that is a decision the consumer is making.
 *
 * `size` is `sm | md | lg` and travels as CSS through the same tokens a field uses, so a
 * select and an input line up in a column at any size.
 */
export const Select = Object.assign(SelectRoot, {
  Label: SelectLabel,
  Value: SelectValueSlot,
  Button: SelectButton,
  Icon: SelectIcon,
  Popover: SelectPopover,
  AutoComplete: SelectAutoComplete,
  OptionList: SelectOptionList,
  Menu: SelectMenu,
  Option: SelectOption,
  Section: SelectSection,
  SectionTitle: SelectSectionTitle,
  Hint: SelectHint,
  Error: SelectFieldError,
})
