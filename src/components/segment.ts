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
  // **The ends of the group take the corner and the middle does not.** The group is one rounded box with
  // holes pressed into it, so a radius on every segment would draw four corners in a row.
  //
  // Each rule is a variant — which is what lets it beat the plain `rounded-md` every button carries, since
  // two plain utilities of the same property are ordered by Tailwind and not by the author — and each is
  // **guarded so that two of them can never match one element**. `first:rounded-s-md` alone was not
  // enough and read perfectly: the base still rounds all four corners, and a start-corner rule only
  // overrides two of the longhands it set, so the first segment came out round on its inner edge too.
  // Measured in the browser, then written as longhands that cannot overlap.
  '[&:first-child:not(:last-child)]:rounded-s-md',
  '[&:first-child:not(:last-child)]:rounded-e-none',
  '[&:last-child:not(:first-child)]:rounded-e-md',
  '[&:last-child:not(:first-child)]:rounded-s-none',
  '[&:only-child]:rounded-md',
  '[&:not(:first-child):not(:last-child)]:rounded-none',
  'data-[selected]:bg-primary data-[selected]:text-ink',
  'data-[selected]:[--btn:var(--color-primary)] data-[selected]:[--btn-fg:var(--color-ink)]',
].join(' ')
