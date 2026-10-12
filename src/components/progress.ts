/**
 * The sheet has no bar of any kind, so this is an invention — but a small one, and it borrows the
 * sheet's own language: square, hairline-thin, and its semantic colours rather than a new palette.
 *
 * Every constant here is shared by `ProgressBar` and `Meter`, the same split as `field.ts` between
 * `TextField`, `SearchArea` and `SearchField`. A progress bar and a meter are the same drawing of two
 * different facts, and the drawing is the thing that must not drift.
 */

/** The column: a header line, then the rail. */
export const PROGRESS = 'flex flex-col gap-2'

/** Label on the left, reading on the right — the sheet's own arrangement in a table row. */
export const HEADER = 'flex items-baseline justify-between gap-3'

/** The sheet's field legend, quieter than the value it names. */
export const LABEL = 'text-[12px] uppercase tracking-[0.04em] text-fg/55'

/** The reading, in the sheet's tabular figures so it does not jitter as it counts. */
export const VALUE = 'text-[12px] tabular-nums text-fg/70'

/**
 * The rail. 4px, because a bar is a measurement and a 1px one is a hairline that happens to be
 * coloured — the reader cannot tell how full it is. The fill's track is a wash of the text colour
 * rather than a panel, so it reads as the empty part of the same thing.
 */
export const TRACK = 'relative h-1 w-full overflow-hidden bg-fg/12'

/**
 * The bar. Its width is a **value**, not a style — which is why it arrives as `--fill` and the
 * width stays a utility: `w-(--fill)` is in the class list like every other measurement here, and
 * the only thing written inline is the number React Aria computed.
 */
export const FILL = [
  'h-full w-(--fill)',
  'transition-[width] duration-200 ease-pulse',
].join(' ')

/**
 * What the bar is filled with. `accent` is a progress bar's — the thing being done wears the
 * system's one accent, as it does everywhere else. The other four are a meter's, and they are the
 * sheet's own semantic colours: a meter says how much, and how much is the only thing that decides
 * whether it is good news.
 */
export const TONE: Record<string, string> = {
  accent: 'bg-teal',
  success: 'bg-green',
  warning: 'bg-yellow',
  danger: 'bg-red',
  neutral: 'bg-neutral',
}

/**
 * Indeterminate is not a value, so there is no width to draw. React Aria renders
 * `isIndeterminate` as the **absence** of `aria-valuenow`, and `percentage` arrives `undefined`
 * rather than `0` — which is the difference between "we do not know how far along this is" and "it
 * has not started". The bar fills the rail and pulses.
 *
 * A moving stripe would say it better, and it would need keyframes this system does not have. The
 * pulse is Tailwind's own, which means nothing new was invented to say "in progress".
 */
export const INDETERMINATE = 'motion-safe:animate-pulse'
