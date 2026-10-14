import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
} from 'react'
import type { ReactNode, Ref } from 'react'
import { Button as AriaButton, Group as AriaGroup } from 'react-aria-components'
import type { GroupProps as AriaGroupProps } from 'react-aria-components'

import { Modal } from '../Modal/Modal'

export interface AvatarProps {
  /** The image. Omit it, or let it fail, and the initials are used. */
  src?: string
  /**
   * The person or thing this stands for. Required, and it is a **name rather than a description** — it
   * becomes the accessible name and the initials, so there is nothing else to give.
   */
  alt: string
  size?: 'sm' | 'md' | 'lg'
  /** `Button`'s palette. `neutral` is the default because most of these are not the interesting one. */
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'danger'
  /**
   * Opens the avatar in a modal when it is pressed. The avatar becomes a button, so this changes the
   * element and its place in the tab order — see the note above on why it is off by default.
   */
  isPreviewable?: boolean
  className?: string
}

type AvatarSize = 'sm' | 'md' | 'lg'

/**
 * The size `Avatar.Group` hands its children, so a stack of faces is sized once rather than at every one
 * of them. An avatar that names its own `size` still wins — the context is a default, not a rule.
 */
const AvatarSizeContext = createContext<AvatarSize | null>(null)

/** Only `--avatar` is set per colour; the fill and the label both read it, so they cannot disagree. */
const COLORS: Record<NonNullable<AvatarProps['color']>, string> = {
  primary: '[--avatar:var(--color-primary)]',
  secondary: '[--avatar:var(--color-warning)]',
  neutral: '[--avatar:var(--color-secondary)]',
  success: '[--avatar:var(--color-success)]',
  danger: '[--avatar:var(--color-destructive)]',
}

/**
 * The box each size draws, shared because `Avatar.Group`'s counter has to be the same box as the faces it
 * counts — two copies of these three numbers would be two chances for the counter to be a different
 * height from the avatars beside it.
 */
const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-[11px]',
  lg: 'size-10 text-[13px]',
}

/**
 * The face in the modal: much larger than any inline size, because the whole point of opening it is to see
 * the picture. `size-56` is 224px — big enough to read a face, small enough to leave the dialog room for
 * the name beneath it.
 */
const PREVIEW_SIZE = 'size-56 text-[56px]'

/**
 * The styled element. Not exported — `Avatar` below is the public symbol, and docgen reads the JSDoc
 * from the *exported* declaration, not this one.
 */
function AvatarRoot({
  src,
  alt,
  size,
  color = 'neutral',
  isPreviewable = false,
  className,
}: AvatarProps) {
  // The group's size, or this component's own default of `md` for an avatar standing on its own.
  const inheritedSize = useContext(AvatarSizeContext)
  const boxSize = size ?? inheritedSize ?? 'md'
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  /** The fill, the label and the shape — the same in the row and in the modal, at two different sizes. */
  const box = (dimensions: string, extra?: string) =>
    [
      // `clip`, not `hidden`: the box is not a scroller, and `hidden` would let a script (or a
      // stray focus) move its contents.
      'inline-flex shrink-0 items-center justify-center overflow-clip rounded-md',
      dimensions,
      COLORS[color],
      // `ink` on the fill, which inverts with the theme — black on the luminous dark accents, white on
      // the deep light ones. Hardcoding either is the mistake the token exists to prevent.
      'bg-(--avatar) font-mono tracking-[0.04em] text-ink uppercase',
      extra,
    ]
      .filter(Boolean)
      .join(' ')

  // The picture, or the initials when there is none to show. Rendered in whichever box is asking for it.
  const face = (
    <>
      {showImage ? (
        <img
          data-slot="avatar-image"
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span data-slot="avatar-initials" aria-hidden="true">
          {initials(alt)}
        </span>
      )}
    </>
  )

  if (!isPreviewable) {
    return (
      <span
        data-slot="avatar"
        // The wrapper carries the name and the image is decorative, so a screen reader hears "Ada Lovelace"
        // once. Giving both an `alt` announces the same thing twice.
        role="img"
        aria-label={alt}
        className={box(AVATAR_SIZES[boxSize], className)}
      >
        {face}
      </span>
    )
  }

  return (
    <Modal>
      {/* React Aria's own `Button`, not this system's: the styled one brings a fill, a size and a padding,
          and this element is an avatar that happens to be pressable. It also has to be a real button for
          `DialogTrigger` to open the modal from the keyboard. */}
      <AriaButton
        data-slot="avatar"
        // The name alone would not say what pressing it does, so the action is in the label. It is also
        // why the initials are `aria-hidden`: the name is announced once, by the button.
        aria-label={`Preview ${alt}`}
        className={box(
          AVATAR_SIZES[boxSize],
          `cursor-pointer ${className ?? ''}`,
        )}
      >
        {face}
      </AriaButton>
      <Modal.Content>
        <Modal.Close />
        <Modal.Title>{alt}</Modal.Title>
        <div className="flex justify-center py-2">
          <span
            data-slot="avatar-preview"
            role="img"
            aria-label={alt}
            className={box(PREVIEW_SIZE)}
          >
            {face}
          </span>
        </div>
      </Modal.Content>
    </Modal>
  )
}

/**
 * How much of each avatar the one before it covers: **a quarter of it**, which is the ratio Spectrum's
 * own avatar group uses. Enough that the stack reads as one object rather than as a row of separate
 * things, little enough that a face is still a face. A half — which is what the dashboard drew by hand
 * before this existed — turns four avatars into a row of slivers.
 */
const OVERLAP: Record<AvatarSize, string> = {
  sm: '[&>*:not([data-slot=avatar-group-label]):not(:first-child)]:-ms-1.5',
  md: '[&>*:not([data-slot=avatar-group-label]):not(:first-child)]:-ms-2',
  lg: '[&>*:not([data-slot=avatar-group-label]):not(:first-child)]:-ms-2.5',
}

/**
 * The ring that cuts every child out of the one behind it, **in the surface the group is standing on**.
 *
 * **Every child but the label, and the label is the reason both of these name it.** It is a sibling of the
 * faces in the same flex row, so it inherits the overlap and would wear the ring unless it is excepted —
 * a 4px pull that draws "4 teammates" on top of the last face, which is exactly what it did until a story
 * that measures the two boxes caught it.
 *
 * `--avatar-ring` is declared here, on the element that sets the base, and it defaults to the page. A
 * stack inside a panel moves it with one class — `[--avatar-ring:var(--color-card)]` — which is the same
 * mechanism `Button`'s colours use, and the reason it is a property rather than a class per caller.
 *
 * The ring follows the element's own radius, and an avatar's is `rounded-md`: this system squares
 * everything, so a circular cut-out around a square face is exactly what does not happen here.
 */
const CUT_OUT =
  '[&>*:not([data-slot=avatar-group-label])]:ring-2 [&>*:not([data-slot=avatar-group-label])]:ring-(--avatar-ring)'

/** The counter: the avatar's own box, in the panel's quieter fill. */
const COUNTER =
  'grid place-items-center rounded-md bg-muted text-muted-foreground'

/** The label after the stack, sized to the avatars it belongs to. */
const LABEL: Record<AvatarSize, string> = {
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[13px]',
}

/**
 * Children, with fragments flattened away.
 *
 * `max` counts avatars, and a caller who wrote `<>{teammates.map(…)}</>` means the same thing as one
 * who passed the array — so the fragment has to be looked through rather than counted as one child that
 * happens to contain a stack. `Children.toArray` is what gives every flattened child a key, so nothing
 * warns about the array this builds.
 */
function flatten(nodes: ReactNode): ReactNode[] {
  return Children.toArray(nodes).flatMap((node) =>
    isValidElement(node) && node.type === Fragment
      ? flatten((node.props as { children?: ReactNode }).children)
      : [node],
  )
}

export interface AvatarGroupProps extends Omit<
  AriaGroupProps,
  | 'className'
  | 'children'
  | 'role'
  | 'isDisabled'
  | 'isInvalid'
  | 'isReadOnly'
  | 'aria-label'
  | 'aria-labelledby'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: Ref<HTMLDivElement>
  /**
   * The avatars. Anything else may be stacked too, but the ring and the overlap are applied to the
   * group's **direct children**, so whatever is passed is expected to be one box per thing.
   */
  children?: ReactNode
  /**
   * The size every avatar in the group takes, unless one names its own. Defaults to `sm` — one step
   * below a lone avatar, because a stack is a summary rather than a portrait.
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Text after the stack — "4 teammates". It is also the group's **accessible name** unless one is given
   * with `aria-label`, which is what makes a group of faces announce as something rather than as an
   * unexplained run of names.
   */
  label?: string
  /** How many avatars to show before the rest are counted, as `+N`. Unset shows all of them. */
  max?: number
  /**
   * What that counter says, for a group whose children are not the whole group: three faces loaded out
   * of eight teammates is `max={3} overflowCount={5}`. Unset counts what `max` left out.
   */
  overflowCount?: number
  /** Names the group. `label` names it visually instead; passing this overrides that. */
  'aria-label'?: AriaGroupProps['aria-label']
  /**
   * Names the group by another element. `label` wires itself up this way; this is for a heading
   * elsewhere on the page.
   */
  'aria-labelledby'?: AriaGroupProps['aria-labelledby']
  className?: string
}

/**
 * Several avatars that belong together — who is on a board, who is on call, who an alert went to. Use it
 * as `Avatar.Group`.
 *
 * ```tsx
 * <Avatar.Group label="4 teammates">
 *   <Avatar alt="Ada Lovelace" src="/ada.png" />
 *   <Avatar alt="Grace Hopper" />
 *   <Avatar alt="Karen Spärck Jones" />
 * </Avatar.Group>
 * ```
 *
 * **It is React Aria's `Group`, and that is the whole of what it wraps.** A stack of faces is not a
 * control: there is nothing to press, nothing to arrow between and nothing to select, so there is no RAC
 * primitive with behaviour to borrow — what `Group` supplies is the one thing this needs, a real
 * `role="group"` with a name, and the prop surface that goes with it. `isDisabled`, `isInvalid` and
 * `role` are dropped from the published props because nothing in a group of avatars can be any of them.
 *
 * ### The faces are one object, and the ring is what says so
 *
 * Each avatar overlaps the one before it by a quarter and is cut out of it by a 2px ring in the surface the
 * group stands on. **That ring is the whole trick**: without it the overlapping faces merge into a smear,
 * and with the ring in the wrong colour it draws a line around a stack that is sitting on something else.
 * Hence `--avatar-ring` — the page by default, `var(--color-card)` inside a panel.
 *
 * `size` **travels to the children through `Avatar`'s own context**, so the group is sized once:
 * `<AvatarGroup size="lg">` is every avatar in it, and an avatar that names its own `size` still wins.
 *
 * ### The counter is the one thing the reference does not have
 *
 * Spectrum's avatar group ends at the avatars and a label. This one counts too, because the page it was
 * built from had already invented that by hand — four faces and a hardcoded "+5" — and a number written
 * into a page is a number nobody maintains. `max` trims the stack; `overflowCount` says what the
 * counter reads when the children are not the whole group, which is the case for any list loaded a page at
 * a time.
 *
 * The counter is a **picture rather than a word**: it reads "+5" and is named "5 more", so a screen reader
 * hears what the eye sees rather than a plus sign.
 *
 * Exported as `AvatarGroup` only so tooling can resolve it; consume the compound form `Avatar.Group`.
 */
export function AvatarGroup({
  ref,
  children,
  size = 'sm',
  label,
  max,
  overflowCount,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...props
}: AvatarGroupProps) {
  const labelId = useId()
  const items = flatten(children)
  const shown = max === undefined ? items : items.slice(0, Math.max(0, max))
  // What the counter says: the caller's number when there is one, and otherwise what `max` left out.
  const hidden =
    overflowCount ?? (max === undefined ? 0 : items.length - shown.length)

  return (
    <AriaGroup
      ref={ref}
      data-slot="avatar-group"
      // The name, in the order a caller expects: their own `aria-label`, then their own
      // `aria-labelledby`, then this label's own id.
      aria-label={ariaLabel}
      // **`aria-labelledby` outranks `aria-label`, so the label is only wired up when the caller has not
      // named the group themselves.** Setting both and expecting the label to lose is how a group ends up
      // called "4 teammates" while its own `aria-label` says something else — measured, by the test that
      // asked for it by name and found two groups answering.
      aria-labelledby={
        ariaLabelledby ?? (label && !ariaLabel ? labelId : undefined)
      }
      className={[
        // The surface the stack is cut out of, declared here — see the note on `CUT_OUT`.
        '[--avatar-ring:var(--color-background)]',
        'flex items-center',
        CUT_OUT,
        OVERLAP[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <AvatarSizeContext.Provider value={size}>
        {shown}
        {hidden > 0 ? (
          <span
            data-slot="avatar-group-overflow"
            role="img"
            aria-label={hidden + ' more'}
            className={[COUNTER, AVATAR_SIZES[size]].join(' ')}
          >
            +{hidden}
          </span>
        ) : null}
        {label ? (
          <span
            data-slot="avatar-group-label"
            id={labelId}
            className={[
              'ms-2 truncate text-muted-foreground',
              LABEL[size],
            ].join(' ')}
          >
            {label}
          </span>
        ) : null}
      </AvatarSizeContext.Provider>
    </AriaGroup>
  )
}

/**
 * The first letter of the first and last words, or the first two letters of a single one.
 *
 * A name that is only punctuation or spaces has no letters to take, so it gets `?` rather than an empty
 * box — the one case where the fallback has to invent something rather than derive it.
 */
export function initials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\S/.test(word))
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words.at(-1)![0]).toUpperCase()
}

/**
 * Who something belongs to — a monitor's owner, an alert's assignee — as a picture or as initials.
 *
 * ```tsx
 * <Avatar alt="Ada Lovelace" src="/ada.png" />
 * <Avatar alt="Ada Lovelace" />              // initials, when there is no picture
 * <Avatar alt="fra1" color="primary" />      // a machine's name works the same way
 * <Avatar alt="Ada Lovelace" src="/ada.png" isPreviewable />
 * <Avatar.Group label="4 teammates">{…}</Avatar.Group>   // several of them, stacked
 * ```
 *
 * **This is the fourth component here with nothing in the sheet to copy** — after the date picker, the
 * accordion and the toast. `pulse-replica/` has no avatar, no user chip and nothing person-shaped at all,
 * so every decision below comes from the system's own language rather than from a source file:
 *
 * - **Square, like everything else.** The sheet squares off its buttons and inputs and makes exactly two
 *   exceptions — the checkbox's 2px and the radio's circle. A round avatar would be a third, so it is
 *   `rounded-none`. This is the one place a designer would expect a circle, which is why it is worth
 *   saying out loud rather than leaving to look like an oversight.
 * - **A fill carrying `ink`**, like every other filled control here. The five colours are `Button`'s, so an
 *   avatar cannot drift away from the palette it sits beside.
 * - **Mono, uppercase, letterspaced initials** — the same face every other label in this system wears.
 *
 * **Initials, not an icon.** The fallback is derived from `alt`: the first letter of the first and last
 * words, or the first two letters of a single word — so "Ada Lovelace" is `AL` and "fra1" is `FR`. A
 * generic silhouette would say "somebody" and this is a monitoring system, where *which* somebody is the
 * whole content of the cell.
 *
 * **A broken image falls back to initials rather than to nothing.** That is the state a real dashboard
 * spends most of its life in — an avatar URL that 404s, a service without a picture — and it is checked in
 * the stories with a source that cannot load.
 *
 * **`Avatar.Group` is several of these, overlapped** — a stack of faces that belong together, cut out of
 * each other so the stack reads as one object. It is a slot on this component rather than a component of
 * its own because it *is* an avatar, several times over: the size it takes, the box it draws and the name
 * it carries are all this one's.
 *
 * **`size` is a default, not a fact.** An `AvatarGroup` sizes every avatar in it through the context
 * below, and an avatar that names its own `size` still wins — which is what lets one row of a stack be
 * the person the row is about. On its own an avatar is `md`; in a group it takes the group's, which is
 * `sm` unless the group says otherwise.
 *
 * **`isPreviewable` changes what the element is, which is why it is opt-in.** Off, this is a `<span>` with
 * `role="img"` — a picture, correctly skipped by the tab order. On, it is a **button** that opens the
 * avatar large in a modal, because a picture that responds to a click has to be reachable by keyboard and
 * announced as something you can press. An avatar in a list or a table cell is decoration, and turning
 * every one of them into a tab stop would be the wrong default.
 */
export const Avatar = Object.assign(AvatarRoot, {
  Group: AvatarGroup,
})
