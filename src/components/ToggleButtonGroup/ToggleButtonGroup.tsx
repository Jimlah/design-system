import { ToggleButtonGroup as AriaToggleButtonGroup } from 'react-aria-components'
import type { ToggleButtonGroupProps as AriaToggleButtonGroupProps } from 'react-aria-components'
import { SEGMENT_SELECTED } from '../segment'

import type { ReactNode } from 'react'

import { ToggleButton } from '../ToggleButton/ToggleButton'
import type { ToggleButtonProps } from '../ToggleButton/ToggleButton'

/**
 * The box, which the segments cannot draw for themselves.
 *
 * Every segment is a `ghost` — border-transparent — so without this the control is a row of words with
 * nothing around it. The border is the group's, and each segment draws only the divider before it, so
 * there are no doubled edges at the joins.
 */
const GROUP = 'inline-flex w-fit border border-input rounded-md'

/**
 * One segment of the group.
 *
 * Two `data-[selected]:` rules do the work, and both are variants — which is what makes them land: a
 * variant rule outranks the plain utility the `ghost` variant declares, whatever order the two reach
 * the stylesheet in. `border-l-line-control` is a variant for the same reason: it has to beat the plain
 * `border-transparent` a ghost button carries.
 *
 * The segment is a `ghost` at rest and a **fill** when it is on, so the group reads as one control with
 * a hole pressed into it. `--btn` is retargeted to teal as well as the background, so the hover recipe —
 * which deepens `--btn` toward ink — follows and a selected segment deepens rather than jumping.
 */
const SEGMENT = SEGMENT_SELECTED

export interface ToggleButtonGroupProps extends Omit<
  AriaToggleButtonGroupProps,
  'children' | 'className'
> {
  /** `single` gives a radio group and `multiple` a row of switches. */
  selectionMode?: AriaToggleButtonGroupProps['selectionMode']
  /** The on segments, by each toggle's `id`. Controlled. */
  selectedKeys?: AriaToggleButtonGroupProps['selectedKeys']
  /** What starts on. Uncontrolled. */
  defaultSelectedKeys?: AriaToggleButtonGroupProps['defaultSelectedKeys']
  /** Called with the new set of keys. */
  onSelectionChange?: AriaToggleButtonGroupProps['onSelectionChange']
  /** Disables the whole group. */
  isDisabled?: AriaToggleButtonGroupProps['isDisabled']
  /** Which way the arrow keys walk. Defaults to horizontal. */
  orientation?: AriaToggleButtonGroupProps['orientation']
  /**
   * Whether the last on segment can be turned off. **`single` makes this `true` by default**, and that
   * is a correction rather than a taste: without it the arrow keys *clear* the selection, so a
   * segmented control can end up showing no current value at all — which answers no question.
   */
  disallowEmptySelection?: AriaToggleButtonGroupProps['disallowEmptySelection']
  className?: string
  children?: ReactNode
}

export interface ToggleButtonGroupButtonProps extends ToggleButtonProps {
  /** The identity this segment carries in the group's value. Required — a segment without one cannot be selected. */
  id: string
}

/**
 * One segment. Use it as `ToggleButtonGroup.Button`.
 *
 * `ghost` is the default variant here rather than the button's own `default`, because a segment is not
 * a button: its fill is the *state*, not the variant. Pass `variant` to override and it wins.
 */
export function ToggleButtonGroupButton({
  className,
  variant = 'ghost',
  ...props
}: ToggleButtonGroupButtonProps) {
  return (
    <ToggleButton
      variant={variant}
      className={[SEGMENT, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

/**
 * A row of buttons where one — or several — is on. A segmented control.
 *
 * ```tsx
 * <ToggleButtonGroup defaultSelectedKeys={['24h']} selectionMode="single">
 *   <ToggleButtonGroup.Button id="1h">1h</ToggleButtonGroup.Button>
 *   <ToggleButtonGroup.Button id="24h">24h</ToggleButtonGroup.Button>
 *   <ToggleButtonGroup.Button id="7d">7d</ToggleButtonGroup.Button>
 * </ToggleButtonGroup>
 * ```
 *
 * **It is one control with holes pressed into it, not a row of buttons.** The group draws the border and
 * each segment draws the divider before it, so there are no doubled edges at the joins.
 *
 * **The arrow keys move focus, and activation is explicit** — Space, Enter or a click. They do *not*
 * carry the selection with them, and this doc claimed they did until the story was written and disagreed.
 * What matters is the corollary: with `single` the group refuses to be emptied, because React Aria's own
 * default lets the arrow keys clear the selection outright, leaving a segmented control that shows no
 * current value at all.
 *
 * In `multiple` mode it is a row of switches, tabbed into individually. That difference is React Aria's,
 * and it is the reason to use a group rather than place `ToggleButton`s side by side.
 *
 * **A segment is not a `Tab`.** Tabs swap the panel below them; this changes a value the rest of the page
 * reads. Where the sheet has a tab row it has an indicator under the current one; here the current
 * segment is *filled*, because there is no panel for an indicator to point at.
 */
function ToggleButtonGroupRoot({
  className,
  selectionMode,
  disallowEmptySelection,
  children,
  ...props
}: ToggleButtonGroupProps) {
  return (
    <AriaToggleButtonGroup
      data-slot="toggle-button-group"
      selectionMode={selectionMode}
      disallowEmptySelection={
        disallowEmptySelection ?? selectionMode === 'single'
      }
      className={[GROUP, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaToggleButtonGroup>
  )
}

export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
  Button: ToggleButtonGroupButton,
})
