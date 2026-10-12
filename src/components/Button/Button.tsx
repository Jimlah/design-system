import type { ReactNode } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import type { ButtonProps as AriaButtonProps } from 'react-aria-components'

export interface ButtonIconProps {
  /**
   * The icon markup, typically an inline `<svg>`.
   */
  children: ReactNode
}

export interface ButtonTextProps {
  /**
   * The button label. Also the button's accessible name.
   */
  children: ReactNode
}

export interface ButtonProps extends Omit<
  AriaButtonProps,
  'isDisabled' | 'isPending' | 'onPress' | 'children' | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: React.Ref<HTMLButtonElement>
  /**
   * How much weight the button carries. Combines with `color`.
   * - `default` — solid fill, for the primary action in a view.
   * - `outline` — hairline border over a transparent fill, for the alternative beside it.
   * - `ghost` — no border; a wash appears on hover. For toolbar and table actions.
   * - `text` — label only, no wash. For the lowest-emphasis actions and "View More" links.
   * - `icon` — square, no label. Pair with `aria-label` and a single `Button.Icon`.
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost' | 'text' | 'icon'
  /**
   * What the button means. Combines with `variant`.
   * - `primary` — action-teal, the system's main accent.
   * - `secondary` — selected-yellow, the sheet's second accent.
   * - `neutral` — the sheet's grey, for actions that carry no meaning.
   * - `success` — green, for confirming or completing.
   * - `danger` — red, for destructive or irreversible actions.
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'danger'
  /**
   * Control height: 32px / 44px / 52px.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Stretch to fill the container width.
   * @default false
   */
  block?: boolean

  /* The four React Aria props this design system exposes, re-declared here on
     purpose. Docgen's default filter drops anything declared under
     node_modules, so without this the components manifest that the MCP tools
     serve would claim Button only takes variant/size/block — and agents are
     instructed to treat undocumented props as non-existent. Declaring them
     against our own source keeps the published API curated and is local to
     this component, unlike loosening the filter for the whole project. */

  /**
   * Disables the button. This is a React Aria prop — there is no `disabled`.
   */
  isDisabled?: AriaButtonProps['isDisabled']
  /**
   * Puts the button in a loading state: the content stays in place but turns
   * invisible, and a spinner is centred over it. The width is preserved, so a
   * pending button does not resize or shift the layout. React Aria keeps it
   * focusable, blocks presses, and announces the pending state to screen
   * readers.
   */
  isPending?: AriaButtonProps['isPending']
  /**
   * Press handler. This is a React Aria prop — there is no `onClick`. Fires
   * consistently for mouse, touch and keyboard.
   */
  onPress?: AriaButtonProps['onPress']
  /**
   * Button content. Compose with `Button.Icon` and `Button.Text`.
   */
  children?: ReactNode
}

/* States come from React Aria's `data-*` attributes rather than CSS
   pseudo-classes, because the two "inactive" states differ in the DOM:
     - `isDisabled` renders BOTH the native `disabled` attribute and
       `data-disabled`, so either selector would work.
     - `isPending` renders only `aria-disabled` + `data-pending`; it stays
       focusable and has NO native `disabled`, so `disabled:` would never match.
   `data-[pressed]` is likewise preferred over `:active`, since it also covers
   keyboard Space/Enter. */
export const BUTTON_BASE = [
  // `relative` anchors the pending spinner overlay.
  'relative inline-flex items-center justify-center gap-2.5',
  'font-mono font-medium uppercase tracking-[0.04em] rounded-none',
  'border cursor-pointer select-none',
  'transition-[background-color,color,border-color,opacity] duration-[120ms] ease-pulse',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-[3px] data-[focus-visible]:outline-teal',
  /* Hover and pressed derive from `--btn` rather than replacing it, so a state
     can never drift away from the colour it belongs to. Written here, on the
     element that sets `--btn`, and not on `:root`: a custom property is
     substituted where it is *declared*, so a recipe on `:root` would look for
     `--btn` there, find nothing, and collapse to invalid.

     The sheet declares `hover: #FFF` on its one accent. That does not survive
     five semantic colours — a danger button that turns the same white as
     everything else has stopped meaning danger. It is barely available anyway:
     these fills sit at L 92%, leaving 8% of headroom toward white. Toward the
     ink instead: rest -> hover deepens a little -> pressed deepens more. */
  '[--btn-hover:color-mix(in_oklch,var(--btn)_88%,var(--color-ink))]',
  '[--btn-pressed:color-mix(in_oklch,var(--btn)_78%,var(--color-ink))]',
  /* **The ring is declared here, transparent, and only coloured on focus-visible.** With no rest
     outline the browser's own `outline-style: auto` applies and draws in *its* colour — measured on this
     repo's own button as `1px auto rgb(153, 200, 255)`, a light blue belonging to no part of this design
     language. Declaring the geometry at rest takes that decision away from the UA; it is the same
     transparent-outline move `Table`'s column and `GridList`'s row needed. `outline-none` here instead
     would set Tailwind's shared `--tw-outline-style`, and then no ring in this file could ever draw. */
  'outline-1 outline-offset-[3px] outline-transparent',
  /* The lower-emphasis label for `ghost` and `text`. It cannot simply be a
     faded accent: in light mode the accents clear 4.5:1 by only a hair, so
     fading one to 70% over white lands at 2.8:1 and fails AA. Dark has room to
     fade (a near-white accent on black stays above 5:1), light does not, so
     there the accent is used at full strength. */
  '[--btn-muted:light-dark(var(--btn),color-mix(in_oklch,var(--btn)_70%,transparent))]',
  /* Disabled dims the button rather than repainting it. Flattening every fill
     to one grey throws away the colour that says what the button does — a
     disabled danger button should still read as danger — so the whole control
     fades and keeps its own look, in the theme it is in.

     The cursor defers to disabled while pending: a button you cannot press
     should not claim to be "working", and the spinner already says the work is
     in progress. */
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30',
  /* Loading keeps the button's own chrome — fill, border, focus ring — and
     hides only the content, so the control still reads as the action that is
     running.

     Two mechanisms, because they are not interchangeable here. A decorative
     icon gets `visibility: hidden`, which keeps its box so the width survives.
     Anything carrying *text* gets the transparent colour instead: `visibility`
     would drop it out of the accessibility tree, and while loading the label is
     usually the button's only accessible name — hiding it would leave a screen
     reader with an unnamed button. The colour route preserves the name, and it
     is the only route that can reach a bare text child, which no `> *` rule
     matches. */
  'data-[pending]:not-data-[disabled]:cursor-progress data-[pending]:text-transparent',
  'data-[pending]:[&>[data-slot=icon]]:invisible',
].join(' ')

/* Each colour only sets `--btn`. `--btn-hover` and `--btn-pressed` are recipes
   in src/styles.css that resolve against whatever `--btn` is, so variant x
   color is a product rather than 25 hand-written combinations, a new colour
   costs one line, and no state can drift away from the colour it belongs to.

   Exported because `ToggleButton` is the button and has to be able to set
   `--btn` too. It forgot to, and the failure was silent in the worst way: with
   `--btn` unset, `bg-(--btn)` paints nothing while `text-ink` still paints, so
   an *off* default toggle was black text on the black page — an empty box,
   correct in the source and invisible on screen. */
export const COLORS: Record<NonNullable<ButtonProps['color']>, string> = {
  primary: '[--btn:var(--color-primary)]',
  secondary: '[--btn:var(--color-warning)]',
  neutral: '[--btn:var(--color-secondary)]',
  success: '[--btn:var(--color-success)]',
  danger: '[--btn:var(--color-destructive)]',
}

/* Each variant owns its border colour: BUTTON_BASE only declares the 1px border
   itself, because a `border-transparent` there would win the cascade over an
   outline's border and silently erase it.

   `--btn-fg` is the colour the label would be at full strength. The pending
   loader needs it because the button's own colour goes transparent while
   loading, and the correct replacement differs by variant: ink on a filled
   button, the accent itself on one whose fill is the page. Hardcoding `ink`
   there paints a black spinner on the black page for `outline`/`ghost`/`text`.

   Hover and pressed move the button's own colour rather than replacing it — see
   the recipes in src/styles.css. Every variant needs its own `data-[pressed]`
   state: the browser's tap highlight is gone, so on a touch screen, where
   `data-[hovered]` never fires, press is the only feedback the user gets. */
export const BUTTON_VARIANTS: Record<
  NonNullable<ButtonProps['variant']>,
  string
> = {
  default:
    '[--btn-fg:var(--color-ink)] border-transparent bg-(--btn) text-ink data-[hovered]:bg-(--btn-hover) data-[pressed]:bg-(--btn-pressed)',
  outline:
    '[--btn-fg:var(--btn)] bg-transparent text-(--btn) border-(--btn)/40 data-[hovered]:border-(--btn) data-[pressed]:bg-(--btn)/12',
  ghost:
    '[--btn-fg:var(--btn)] border-transparent bg-transparent text-(--btn-muted) data-[hovered]:text-(--btn) data-[hovered]:bg-(--btn)/8 data-[pressed]:bg-(--btn)/16',
  text: '[--btn-fg:var(--btn)] border-transparent bg-transparent text-(--btn-muted) data-[hovered]:text-(--btn) data-[pressed]:opacity-60',
  icon: '[--btn-fg:var(--color-ink)] border-transparent bg-(--btn) text-ink data-[hovered]:bg-(--btn-hover) data-[pressed]:bg-(--btn-pressed)',
}

/* Heights, horizontal padding and label size per the sheet's size spec. */
export const BUTTON_SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3.5 text-[11px]',
  md: 'h-11 px-[22px] text-[13px]',
  lg: 'h-[52px] px-7 text-[14px]',
}

/* `icon` is the one variant that is a shape, not a fill: square, no label, so
   the padding is dropped and the width tracks the height. */
const ICON_SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'size-8 text-[11px]',
  md: 'size-11 text-[13px]',
  lg: 'size-[52px] text-[14px]',
}

/**
 * Layout slot for an icon inside a `Button`. Use it as `Button.Icon`, placed
 * before `Button.Text` for a leading icon or after it for a trailing one — its
 * position in the markup decides, so there is no `position` prop to keep in
 * sync.
 *
 * The child `<svg>` is sized in `cap`, the height of the font's capital
 * letters, so one icon works at every `size` without a per-variant number: at
 * 11px the icon is smaller than at 14px, which is what the eye expects. The
 * markup needs a `viewBox` for `w-auto` to follow the drawing's ratio.
 * Never set a px `width`/`height` on it — a fixed icon does not track the text.
 *
 * Exported as `ButtonIcon` only so tooling can resolve it; consume the
 * compound form `Button.Icon`.
 */
export function ButtonIcon({ children }: ButtonIconProps) {
  return (
    <span
      data-slot="icon"
      aria-hidden="true"
      className="inline-flex shrink-0 items-center [&>svg]:block [&>svg]:h-[1cap] [&>svg]:w-auto [&>svg]:shrink-0"
    >
      {children}
    </span>
  )
}

/**
 * Layout slot for a `Button` label. Use it as `Button.Text`. Truncates rather
 * than wrapping so a long label cannot change the control's height.
 *
 * Exported as `ButtonText` only so tooling can resolve it; consume the
 * compound form `Button.Text`.
 */
export function ButtonText({ children }: ButtonTextProps) {
  return (
    <span data-slot="text" className="truncate">
      {children}
    </span>
  )
}

/**
 * The indeterminate indicator shown while `isPending`. Hand-rolled rather than
 * React Aria's `ProgressBar`, which renders a `<div>` — not phrasing content,
 * so it cannot legally sit inside a `<button>`. Sized in `cap` like `Button.Icon`
 * and drawn in `currentColor`, so it picks up the button's ink in either theme.
 *
 * The spin is motion, so it lives behind `motion-safe:`. Without it the ring
 * still reads as a spinner, it just does not turn.
 */
function Spinner() {
  return (
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
}

/**
 * The styled element. Not exported — `Button` below is the public symbol, and
 * docgen reads the JSDoc from the *exported* declaration, not this one.
 */
function ButtonRoot({
  ref,
  variant = 'default',
  color = 'primary',
  size = 'md',
  block = false,
  className,
  children,
  isPending = false,
  ...rest
}: ButtonProps) {
  const isIcon = variant === 'icon'
  return (
    <AriaButton
      ref={ref}
      isPending={isPending}
      className={(renderProps) =>
        [
          BUTTON_BASE,
          COLORS[color],
          BUTTON_VARIANTS[variant],
          isIcon ? ICON_SIZES[size] : BUTTON_SIZES[size],
          // A square control has nothing to stretch, so `block` is ignored.
          block && !isIcon ? 'w-full' : '',
          // RAC's className may be a function of render state; support both.
          typeof className === 'function' ? className(renderProps) : className,
        ]
          .filter(Boolean)
          .join(' ')
      }
      {...rest}
    >
      {children}
      {/*
        The loader sits in an overlay so it never joins the flex layout, which
        would otherwise change the button's width. It paints in `--btn-fg`, the
        colour the label would have had, because the button's own colour is
        transparent while pending — and that colour differs per variant.
      */}
      {isPending ? (
        <span
          data-slot="loader"
          className="absolute inset-0 grid place-items-center text-(--btn-fg)"
        >
          <Spinner />
        </span>
      ) : null}
    </AriaButton>
  )
}

/**
 * Button is used for user interactions that do not navigate to another route.
 * Compose it with `Button.Icon` and `Button.Text`.
 *
 * Built on React Aria Components: it takes `onPress` rather than `onClick` and
 * `isDisabled` rather than `disabled`, and surfaces `isPending` while an async
 * action is in flight.
 *
 * Emphasis and meaning are separate axes. `variant` is how much weight the
 * button carries (`default` / `outline` / `ghost` / `text` / `icon`) and `color`
 * is what it means (`primary` / `secondary` / `neutral` / `success` / `danger`);
 * any variant combines with any colour.
 */
export const Button = Object.assign(ButtonRoot, {
  Icon: ButtonIcon,
  Text: ButtonText,
})
