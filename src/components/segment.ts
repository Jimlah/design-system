/**
 * What makes a row of controls read as **one segmented control** rather than a row of buttons.
 *
 * Used by `ToggleButtonGroup.Button`, and by nothing else. It was written to be shared with a `Radio`
 * segment variant too, on the argument that a single-choice control built from radios and one built from
 * toggles should be indistinguishable on screen — but that variant has been removed, so this now has one
 * consumer and the claim it was written to support no longer applies to anything.
 */

/**
 * The divider before every segment but the first, and the fill that marks the chosen one.
 *
 * **These are variants, and that is what makes them land.** A `data-[selected]:` rule outranks the plain
 * `bg-transparent` a ghost button declares, and `[&:not(:first-child)]:border-l-line-control` outranks the
 * plain `border-transparent` it carries — whatever order the two reach the stylesheet in.
 *
 * `--btn` is retargeted to teal along with the background, so the button's own hover recipe — which
 * deepens `--btn` toward ink — follows and a selected segment deepens rather than jumping elsewhere.
 */
export const SEGMENT_SELECTED = [
  '[&:not(:first-child)]:border-l-line-control',
  'data-[selected]:bg-(--color-teal) data-[selected]:text-(--color-ink)',
  'data-[selected]:[--btn:var(--color-teal)] data-[selected]:[--btn-fg:var(--color-ink)]',
].join(' ')
