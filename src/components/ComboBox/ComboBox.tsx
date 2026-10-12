import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Header as AriaHeader,
  Input as AriaInput,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  Text as AriaText,
} from 'react-aria-components'
import type {
  ButtonProps as AriaButtonProps,
  ComboBoxProps as AriaComboBoxProps,
  FieldErrorProps as AriaFieldErrorProps,
  GroupProps as AriaGroupProps,
  HeaderProps as AriaHeaderProps,
  InputProps as AriaInputProps,
  LabelProps as AriaLabelProps,
  ListBoxItemProps as AriaListBoxItemProps,
  ListBoxProps as AriaListBoxProps,
  ListBoxSectionProps as AriaListBoxSectionProps,
  PopoverProps as AriaPopoverProps,
  TextProps as AriaTextProps,
} from 'react-aria-components'
import { OPTION, OPTION_LIST } from '../optionList'

import {
  ERROR,
  FIELD,
  FIELD_SIZES,
  GROUP,
  HINT,
  ICON,
  ICON_POSITIONS,
  INPUT,
  LABEL,
} from '../field'
import type { FieldSize, IconPosition } from '../field'
import { startsWith } from '../Select/Select'

/**
 * The sheet has no combobox class of its own — it is the search affix and the select menu put
 * together, which is exactly what a combobox is. So the trigger is the field's own `.ds-input`,
 * with the affix room the `Group` already knows how to leave, and the menu is the same surface
 * the select uses.
 *
 * The caret's rotation and colour are published here rather than on the button, because
 * `data-open` is on this root and a group variant cannot win that cascade — the same reason
 * `Select` publishes them, and the same names, since it is the same caret.
 */
const ROOT = [
  FIELD,
  // Open and focus both hold the border teal, as the sheet's `.ds-select-btn.is-open` does.
  // The input's border comes from `--field-border`, published on this root, so the state is
  // expressed here rather than on the input — the same arrangement as `Select`.
  'data-[open]:[--field-border:var(--color-primary)]',
  'data-[focused]:[--field-border:var(--color-primary)]',
  // The input's hover rule outranks its resting border, so an open control has to retarget what
  // hover resolves to, or hovering it would take the hover colour and lose the teal.
  'data-[open]:[--field-hover:var(--color-primary)]',
  // The caret's rotation and colour, for the reason above: `data-open` is here, not on the
  // button, and a group variant cannot win that cascade.
  '[--dropdown-caret-rotate:0deg]',
  '[--dropdown-caret-ink:color-mix(in_oklch,var(--color-foreground)_50%,transparent)]',
  'data-[open]:[--dropdown-caret-rotate:180deg]',
  'data-[open]:[--dropdown-caret-ink:var(--color-primary)]',
].join(' ')

const CARET = [
  'h-1.5 w-2.5',
  'rotate-(--dropdown-caret-rotate) [color:var(--dropdown-caret-ink)]',
  'transition-[rotate,color] duration-[160ms] ease-pulse',
].join(' ')

/**
 * The chevron sits where the sheet puts the select's caret — 14px in, at half height — and the
 * `Group` sees its `data-slot` and pads the input to match, the same way it does for an affix.
 */
const TRIGGER = [
  'absolute top-1/2 right-3.5 z-10 flex size-3 -translate-y-1/2',
  'items-center justify-center',
  'cursor-pointer',
  'data-[disabled]:cursor-not-allowed',
  'data-[focus-visible]:outline-none',
].join(' ')

/** The same drawing the Button shows while `isPending`, so a loading menu looks like one. */
const SPINNER = 'size-[1.25cap] motion-safe:animate-spin'

/** The sheet's `.ds-select-menu`, shared down to the class list with `Select`. */
const MENU = [
  'flex w-(--trigger-width) flex-col overflow-hidden',
  'border border-border-strong bg-card',
  'shadow-[0_12px_32px_rgba(0,0,0,.7)]',
].join(' ')

const OPTION_LABEL = 'truncate'

/**
 * The sheet marks the chosen option with a literal `[SET]` rather than a tick — its own idiom,
 * kept as-is. `aria-hidden`, because `aria-selected` already says this.
 */
const MARKER =
  'shrink-0 font-mono text-[11px] text-warning data-[slot=marker]:select-none'

/** The sheet's `.ds-select-group-label`. */
const GROUP_LABEL = [
  'px-3.5 pt-[9px] pb-1',
  'text-[11px] uppercase tracking-[0.08em] text-foreground/45',
].join(' ')

const SECTION = 'flex flex-col'

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

const Spinner = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={SPINNER}>
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

export type SelectionMode = 'single' | 'multiple'

/**
 * A combobox filters as you type, so its value is a key into the options rather than free text
 * — unless `allowsCustomValue`, which is the escape hatch for a value that is not in the list.
 *
 * The selection mode is a parameter on React Aria's `ComboBoxProps` defaulting to `'single'`,
 * so a plain `selectionMode="multiple"` is rejected; carrying it through here is what makes
 * the mode inferable from the prop and types `onChange` as an array of keys.
 */
export interface ComboBoxProps<
  TMode extends SelectionMode = 'single',
> extends Omit<
  AriaComboBoxProps<object, TMode>,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'children'
  | 'className'
  | 'placeholder'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLDivElement>
  /** Sizes the control the same way a field is sized, through the shared tokens. */
  size?: FieldSize
  /** Disables the control. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaComboBoxProps<object, TMode>['isDisabled']
  isReadOnly?: AriaComboBoxProps<object, TMode>['isReadOnly']
  isRequired?: AriaComboBoxProps<object, TMode>['isRequired']
  isInvalid?: AriaComboBoxProps<object, TMode>['isInvalid']
  /**
   * The value, as a key — or an array of them once the mode is multiple. `allowsCustomValue`
   * lets the input hold text that matches no option, which is the one case where the value is
   * not a key at all.
   */
  selectedKey?: AriaComboBoxProps<object, TMode>['selectedKey']
  defaultSelectedKey?: AriaComboBoxProps<object, TMode>['defaultSelectedKey']
  value?: AriaComboBoxProps<object, TMode>['value']
  defaultValue?: AriaComboBoxProps<object, TMode>['defaultValue']
  /** One key in single mode; an array of them in multiple. */
  onChange?: AriaComboBoxProps<object, TMode>['onChange']
  /** Fires with the typed text, which is what the filtering runs on. */
  onInputChange?: AriaComboBoxProps<object, TMode>['onInputChange']
  /**
   * Decides which options survive the query. Defaults to `startsWith`.
   *
   * React Aria's built-in filter is **not applied** to a combobox's collection either — the
   * same trap as `Select`, and it looks the same: the query sits in the input and the list
   * shows everything. Supplying one is what makes the control filter at all; the choice of
   * which is the second question.
   */
  defaultFilter?: AriaComboBoxProps<object, TMode>['defaultFilter']
  /** Whether to open the menu on focus rather than on typing or the chevron alone. */
  menuTrigger?: AriaComboBoxProps<object, TMode>['menuTrigger']
  /** Lets the input hold a value that is not in the list. */
  allowsCustomValue?: AriaComboBoxProps<object, TMode>['allowsCustomValue']
  /** Whether an empty result set still opens the menu, to say so. */
  allowsEmptyCollection?: AriaComboBoxProps<
    object,
    TMode
  >['allowsEmptyCollection']
  className?: string
  /** `ComboBox.Label`, `ComboBox.Group`, then the menu, hint and error. */
  children?: React.ReactNode
}

export interface ComboBoxLabelProps extends AriaLabelProps {
  children?: React.ReactNode
}

export interface ComboBoxGroupProps extends Omit<AriaGroupProps, 'className'> {
  className?: string
  children?: React.ReactNode
}

export interface ComboBoxInputProps extends Omit<
  AriaInputProps,
  'value' | 'defaultValue' | 'onChange'
> {
  className?: string
}

export interface ComboBoxIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which end of the control the affix sits at, as the sheet's `.ds-affix` does. */
  position?: IconPosition
  className?: string
  children?: React.ReactNode
}

export interface ComboBoxButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className'
> {
  /**
   * Swaps the chevron for the Button's spinner while the options are being fetched. The box
   * stays the same size either way, so the input's text cannot shift under it.
   */
  isLoading?: boolean
  className?: string
  /** Replaces the caret. Ignored while `isLoading`. */
  children?: React.ReactNode
}

export interface ComboBoxPopoverProps extends Omit<
  AriaPopoverProps,
  'className'
> {
  className?: string
  /** A `ComboBox.OptionList`, and anything else that should sit below the search. */
  children?: React.ReactNode
}

export interface ComboBoxOptionListProps extends Omit<
  AriaListBoxProps<object>,
  'children' | 'className'
> {
  className?: string
  children?: React.ReactNode
}

export interface ComboBoxOptionProps extends Omit<
  AriaListBoxItemProps<object>,
  'children' | 'className'
> {
  className?: string
  /** The option's label. */
  children?: React.ReactNode
}

export interface ComboBoxSectionProps extends Omit<
  AriaListBoxSectionProps<object>,
  'children' | 'className'
> {
  className?: string
  /** A `ComboBox.SectionTitle`, then the options in this run. */
  children?: React.ReactNode
}

export interface ComboBoxSectionTitleProps extends AriaHeaderProps {
  children?: React.ReactNode
}

export interface ComboBoxHintProps extends AriaTextProps {
  children?: React.ReactNode
}

export interface ComboBoxFieldErrorProps extends AriaFieldErrorProps {
  children?: React.ReactNode
}

/**
 * The legend. Use it as `ComboBox.Label`. The required marker comes from the combobox's own
 * `data-required`, so it cannot drift out of sync with `isRequired`.
 *
 * Exported as `ComboBoxLabel` only so tooling can resolve it; consume the compound form
 * `ComboBox.Label`.
 */
export function ComboBoxLabel({
  className,
  children,
  ...props
}: ComboBoxLabelProps) {
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
 * Wraps the input and its affixes. Use it as `ComboBox.Group`. It is what leaves room for them:
 * the input itself never has to know it has neighbours.
 *
 * Exported as `ComboBoxGroup` only so tooling can resolve it; consume the compound form
 * `ComboBox.Group`.
 */
export function ComboBoxGroup({
  className,
  children,
  ...props
}: ComboBoxGroupProps) {
  return (
    <AriaGroup
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaGroup>
  )
}

/**
 * The text field the user types into. Use it as `ComboBox.Input`. It takes the field's resting
 * hairline, height and focus treatment from the shared anatomy, so it lines up with a
 * `TextField` beside it.
 *
 * Exported as `ComboBoxInput` only so tooling can resolve it; consume the compound form
 * `ComboBox.Input`.
 */
export function ComboBoxInput({ className, ...props }: ComboBoxInputProps) {
  return (
    <AriaInput
      data-slot="input"
      className={[INPUT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * An affix at either end of the control. Use it as `ComboBox.Icon`; inside a `ComboBox.Group`.
 * Position it with `position`, and it draws the sheet's magnifier unless given a child.
 *
 * Exported as `ComboBoxIcon` only so tooling can resolve it; consume the compound form
 * `ComboBox.Icon`.
 */
export function ComboBoxIcon({
  position = 'start',
  className,
  children,
  ...props
}: ComboBoxIconProps) {
  return (
    <span
      data-slot={position === 'start' ? 'icon-start' : 'icon-end'}
      aria-hidden="true"
      className={[ICON, ICON_POSITIONS[position], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children ?? (
        <svg viewBox="0 0 16 16" fill="none" className="h-full w-auto">
          <circle
            cx="6.8"
            cy="6.8"
            r="5.1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="10.7"
            y1="10.7"
            x2="14.6"
            y2="14.6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </span>
  )
}

/**
 * The chevron that opens the list, or closes an open one. Use it as `ComboBox.Button`, inside a
 * `ComboBox.Group`.
 *
 * Exported as `ComboBoxButton` only so tooling can resolve it; consume the compound form
 * `ComboBox.Button`.
 */
export function ComboBoxButton({
  isLoading,
  className,
  children,
  ...props
}: ComboBoxButtonProps) {
  return (
    <AriaButton
      data-slot="icon-end"
      className={[TRIGGER, className].filter(Boolean).join(' ')}
      {...props}
    >
      {isLoading ? Spinner : (children ?? Caret)}
    </AriaButton>
  )
}

/**
 * The menu surface. Use it as `ComboBox.Popover`, with a `ComboBox.OptionList` inside.
 *
 * Exported as `ComboBoxPopover` only so tooling can resolve it; consume the compound form
 * `ComboBox.Popover`.
 */
export function ComboBoxPopover({
  className,
  children,
  offset = 6,
  ...props
}: ComboBoxPopoverProps) {
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
 * The options. Use it as `ComboBox.OptionList`. Leave its `renderEmptyState` to say what a
 * query with no matches means, which otherwise reads as a control that has stopped working.
 *
 * Exported as `ComboBoxOptionList` only so tooling can resolve it; consume the compound form
 * `ComboBox.OptionList`.
 */
export function ComboBoxOptionList({
  className,
  children,
  ...props
}: ComboBoxOptionListProps) {
  return (
    <AriaListBox
      className={[OPTION_LIST, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaListBox>
  )
}

/**
 * One choice. Use it as `ComboBox.Option`, inside a `ComboBox.OptionList`. Pass `textValue` when
 * the label is not plain text, since type-ahead and the filter both read it rather than the
 * rendered nodes.
 *
 * Exported as `ComboBoxOption` only so tooling can resolve it; consume the compound form
 * `ComboBox.Option`.
 */
export function ComboBoxOption({
  className,
  children,
  ...props
}: ComboBoxOptionProps) {
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
 * A labelled run of options, announced as a group. Use it as `ComboBox.Section`, with a
 * `ComboBox.SectionTitle` inside it.
 *
 * Exported as `ComboBoxSection` only so tooling can resolve it; consume the compound form
 * `ComboBox.Section`.
 */
export function ComboBoxSection({
  className,
  children,
  ...props
}: ComboBoxSectionProps) {
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
 * The heading of a `ComboBox.Section`, in the sheet's `.ds-select-group-label`.
 *
 * Exported as `ComboBoxSectionTitle` only so tooling can resolve it; consume the compound form
 * `ComboBox.SectionTitle`.
 */
export function ComboBoxSectionTitle({
  className,
  children,
  ...props
}: ComboBoxSectionTitleProps) {
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
 * The guidance under the control. Use it as `ComboBox.Hint`. React Aria wires it to the input's
 * `aria-describedby`.
 *
 * Exported as `ComboBoxHint` only so tooling can resolve it; consume the compound form
 * `ComboBox.Hint`.
 */
export function ComboBoxHint({
  className,
  children,
  ...props
}: ComboBoxHintProps) {
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
 * The message shown when the combobox is `isInvalid`. Use it as `ComboBox.Error`; React
 * Aria renders nothing while it is valid.
 *
 * Exported as `ComboBoxFieldError` only so tooling can resolve it; consume the compound form
 * `ComboBox.Error`.
 */
export function ComboBoxFieldError({
  className,
  children,
  ...props
}: ComboBoxFieldErrorProps) {
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
 * Styled element. Not exported — `ComboBox` below is the public symbol, and docgen reads the
 * JSDoc from the *exported* declaration, not this one.
 */
function ComboBoxRoot<TMode extends SelectionMode = 'single'>({
  ref,
  size = 'md',
  defaultFilter = startsWith,
  className,
  children,
  ...props
}: ComboBoxProps<TMode>) {
  return (
    <AriaComboBox
      ref={ref}
      defaultFilter={defaultFilter}
      className={[ROOT, FIELD_SIZES[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaComboBox>
  )
}

/**
 * A combobox — the sheet's search affix and select menu together, which is what a combobox is:
 * a text field that filters a list as you type, where the list is the value rather than a hint
 * about it.
 *
 * ```tsx
 * <ComboBox defaultSelectedKey="iad">
 *   <ComboBox.Label>Monitor</ComboBox.Label>
 *   <ComboBox.Group>
 *     <ComboBox.Icon />
 *     <ComboBox.Input placeholder="Search monitors…" />
 *     <ComboBox.Button />
 *   </ComboBox.Group>
 *   <ComboBox.Popover>
 *     <ComboBox.OptionList>
 *       <ComboBox.Option id="fra">fra1 · Frankfurt</ComboBox.Option>
 *       <ComboBox.Option id="iad">iad1 · Virginia</ComboBox.Option>
 *     </ComboBox.OptionList>
 *   </ComboBox.Popover>
 *   <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
 *   <ComboBox.Error>Pick a monitor.</ComboBox.Error>
 * </ComboBox>
 * ```
 *
 * **It has to be given a filter, exactly as `Select` does.** React Aria's combobox documents a
 * built-in filter, and on a combobox's own collection it is not applied: the query sits in the
 * input and the list shows every option. `ComboBox` therefore supplies `startsWith` as its
 * default, so the control filters out of the box — `defaultFilter` is there to change *how* it
 * narrows, not to switch it on.
 *
 * `allowsCustomValue` is the difference from `Select`: with it the input may hold text that
 * matches no option, so the value stops being a key into the list.
 */
export const ComboBox = Object.assign(ComboBoxRoot, {
  Label: ComboBoxLabel,
  Group: ComboBoxGroup,
  Input: ComboBoxInput,
  Icon: ComboBoxIcon,
  Button: ComboBoxButton,
  Popover: ComboBoxPopover,
  OptionList: ComboBoxOptionList,
  Option: ComboBoxOption,
  Section: ComboBoxSection,
  SectionTitle: ComboBoxSectionTitle,
  Hint: ComboBoxHint,
  Error: ComboBoxFieldError,
})
