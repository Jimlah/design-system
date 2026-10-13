import { useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import { Modal } from '../Modal/Modal'

/**
 * Who something belongs to — a monitor's owner, an alert's assignee — as a picture or as initials.
 *
 * ```tsx
 * <Avatar alt="Ada Lovelace" src="/ada.png" />
 * <Avatar alt="Ada Lovelace" />              // initials, when there is no picture
 * <Avatar alt="fra1" color="primary" />      // a machine's name works the same way
 * <Avatar alt="Ada Lovelace" src="/ada.png" isPreviewable />
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
 * **`isPreviewable` changes what the element is, which is why it is opt-in.** Off, this is a `<span>` with
 * `role="img"` — a picture, correctly skipped by the tab order. On, it is a **button** that opens the
 * avatar large in a modal, because a picture that responds to a click has to be reachable by keyboard and
 * announced as something you can press. An avatar in a list or a table cell is decoration, and turning
 * every one of them into a tab stop would be the wrong default.
 */
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

/** Only `--avatar` is set per colour; the fill and the label both read it, so they cannot disagree. */
const COLORS: Record<NonNullable<AvatarProps['color']>, string> = {
  primary: '[--avatar:var(--color-primary)]',
  secondary: '[--avatar:var(--color-warning)]',
  neutral: '[--avatar:var(--color-secondary)]',
  success: '[--avatar:var(--color-success)]',
  danger: '[--avatar:var(--color-destructive)]',
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
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

export function Avatar({
  src,
  alt,
  size = 'md',
  color = 'neutral',
  isPreviewable = false,
  className,
}: AvatarProps) {
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
        className={box(SIZES[size], className)}
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
        className={box(SIZES[size], `cursor-pointer ${className ?? ''}`)}
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
