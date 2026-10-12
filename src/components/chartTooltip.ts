/**
 * The panel a chart shows under the pointer.
 *
 * Shared by `BarChart` and `DotMap`, because the two readouts are the same object: a small piece of text
 * on the panel surface, floating over the drawing, showing what the mark under the pointer means. The
 * replica has one `.dash-tip--chart` for the same reason — `dashboard.html` keeps a single `#pc-tip` and
 * moves it around rather than giving every chart its own.
 *
 * It is `bg-card` with a hairline, like every other floating surface here, so a readout over a chart reads
 * as the same material as a menu over a page.
 *
 * **`pointer-events-none` is part of the recipe, not decoration.** A panel that can be hovered sits between
 * the pointer and the mark it describes, so moving onto it changes what is under the pointer and the
 * readout flickers between two answers.
 */
export const CHART_TOOLTIP = [
  'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full',
  // Small enough to take the control step, like the tooltip it is.
  'border border-border-strong bg-card rounded-md px-2 py-1',
  'font-mono text-[11px] tracking-[0.04em] text-foreground uppercase',
].join(' ')
