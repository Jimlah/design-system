/**
 * The load-more sentinel's shared parts, so `GridList.LoadMore`, `Table.LoadMore` and `Tree.LoadMore` are
 * one recipe in three collections rather than three drifting copies — the same reason `field.ts` and
 * `date.tsx` exist.
 */

/**
 * A quiet centred strip at the foot of a list, where the next page arrives.
 *
 * It is deliberately the least conspicuous thing in the component: a page boundary is a seam in the data,
 * not an event, and a reader scrolling past should see the list continue rather than a control.
 */
export const LOAD_MORE =
  'flex items-center justify-center gap-2 p-4 text-[11px] uppercase tracking-[0.08em] text-fg/45'

/**
 * The spinner, in the sentinel's own colour.
 *
 * `motion-safe`, so a reader who has asked for less motion gets a still one rather than none of it.
 */
export function LoadMoreSpinner() {
  return (
    <span
      data-slot="loader"
      aria-hidden="true"
      className="size-3 border border-fg/30 border-t-fg motion-safe:animate-spin"
    />
  )
}
