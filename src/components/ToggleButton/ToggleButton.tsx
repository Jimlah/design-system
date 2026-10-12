import { ToggleButton as AriaToggleButton } from 'react-aria-components'
import type { ToggleButtonProps as AriaToggleButtonProps } from 'react-aria-components'

import type { ReactNode } from 'react'

import {
  BUTTON_BASE,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  ButtonIcon,
  ButtonText,
  COLORS,
} from '../Button/Button'
import type { ButtonProps } from '../Button/Button'

export interface ToggleButtonProps extends Omit<
  AriaToggleButtonProps,
  | 'className'
  | 'children'
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'isDisabled'
  | 'isPending'
  | 'onPress'
> {
  /** Whether the toggle is on. Controlled, so pass `onChange` with it. */
  isSelected?: AriaToggleButtonProps['isSelected']
  /** Whether the toggle starts on, for uncontrolled use. */
  defaultSelected?: AriaToggleButtonProps['defaultSelected']
  /** Called with the next on/off state. This is a React Aria prop — there is no `onClick`. */
  onChange?: AriaToggleButtonProps['onChange']
  /** Disables the button. This is a React Aria prop — there is no `disabled`. */
  isDisabled?: AriaToggleButtonProps['isDisabled']
  /** Press handler. This is a React Aria prop — there is no `onClick`. */
  onPress?: AriaToggleButtonProps['onPress']

  /** The same five the button has, because this *is* the button. */
  variant?: NonNullable<ButtonProps['variant']>
  /**
   * The same five colours the button has. **It sets `--btn`, and without it a filled variant paints
   * nothing** — see the note on the component.
   */
  color?: NonNullable<ButtonProps['color']>
  size?: NonNullable<ButtonProps['size']>
  className?: string
  children?: ReactNode
}

/**
 * A button that stays down.
 *
 * ```tsx
 * <ToggleButton defaultSelected>24h</ToggleButton>
 * <ToggleButton isSelected={live} onChange={setLive}>Live</ToggleButton>
 * ```
 *
 * **It is a button, so it wears the button's clothes.** `ToggleButton` composes `Button`'s own base
 * classes, variants and sizes rather than growing a second copy of them — the same call `field.ts`
 * and `popover.ts` make, except that here the shared thing was already in one file and only needed
 * exporting. A toggle that drifted a pixel from the button beside it would be the most visible kind
 * of drift there is.
 *
 * **The on-state retargets the variant's own recipe rather than painting over it.** `Button` paints
 * `bg-(--btn)` and derives its hover and pressed shades from it, so the toggle simply points `--btn`
 * at the accent while it is selected — and hover, pressed, focus and the pending spinner all follow
 * without a second rule. That is the same mechanism `Checkbox` and `Meter` use to move a state without
 * replacing a colour, and the reason it works here is that a `data-[selected]:` rule outranks the plain
 * one the variant declares, whatever order the two land in.
 *
 * It is a **toggle, not a checkbox in a button's shape**: `aria-pressed` is set, so a screen reader
 * announces it as something that can be on or off rather than as something you check.
 */
function ToggleButtonRoot({
  variant = 'default',
  color = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ToggleButtonProps) {
  return (
    <AriaToggleButton
      data-slot="toggle-button"
      className={[
        BUTTON_BASE,
        // **The colour is not optional, and its absence was invisible rather than loud.** Every filled
        // variant paints `bg-(--btn)`, and `--btn` is only ever set by `COLORS[color]` — so a toggle
        // without one drew no background at all while `text-ink` still drew its label, which on this
        // dark page is black on black. The source looked right and the Default story was an empty box.
        COLORS[color],
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        // Selected: the accent, spent the same way `Nav`'s current item and a selected table row
        // spend it. Not the sheet's yellow — that token is named `selected-yellow`, but it is already
        // the `secondary` button, and a colour that means two things stops meaning either. That
        // correction is the same one the error state needed.
        'data-[selected]:[--btn:var(--color-teal)] data-[selected]:[--btn-fg:var(--color-ink)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaToggleButton>
  )
}

/**
 * The button's icon. Use it as `ToggleButton.Icon`.
 *
 * **It is `Button.Icon` in a thin wrapper, not the same export.** A toggle *is* the button — same base
 * classes, same variants, same sizes — so it has to be able to wear the button's parts too. Reusing the
 * export directly would make Storybook document `ToggleButton.Icon` as `import { ButtonIcon }`, which is
 * the one thing the docs must not do; the wrapper costs three lines and keeps the docs honest. It is the
 * same arrangement `TextField` and `SearchField` have over `field.ts`.
 *
 * Exported as `ToggleButtonIcon` only so tooling can resolve it; consume the compound form
 * `ToggleButton.Icon`.
 */
export function ToggleButtonIcon({ children }: { children?: ReactNode }) {
  return <ButtonIcon>{children}</ButtonIcon>
}

/**
 * The button's label, truncated rather than wrapped. Use it as `ToggleButton.Text`.
 *
 * Exported as `ToggleButtonText` only so tooling can resolve it; consume the compound form
 * `ToggleButton.Text`.
 */
export function ToggleButtonText({ children }: { children?: ReactNode }) {
  return <ButtonText>{children}</ButtonText>
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const ToggleButton = Object.assign(ToggleButtonRoot, {
  Icon: ToggleButtonIcon,
  Text: ToggleButtonText,
})
