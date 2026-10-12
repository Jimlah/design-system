/**
 * The sheet's links. Three treatments, each with its own hover — the sheet varies the *treatment*
 * rather than the colour, which is why these are variants and not one link with a size on it.
 *
 * All three are written against a real `<a>`: React Aria's `Link` renders one, so the middle-click,
 * the status bar, "open in a new tab" and the browser's own visited styling all work. A `div` with
 * an `onClick` is the thing this avoids.
 */
export const LINK = [
  'cursor-pointer bg-transparent',
  'transition-[color,background-color,text-decoration-color] duration-[120ms]',
  'ease-pulse',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-2',
  'data-[focus-visible]:outline-teal',
].join(' ')

/**
 * The sheet's `.ds-link-caps`: 14px, `-0.01em`, uppercase, white at 70% going to white on hover.
 * `lg` is its `.ds-link-caps--lg`, which changes the type size and nothing else.
 */
export const LINK_CAPS: Record<'sm' | 'lg', string> = {
  sm: 'text-[14px]',
  lg: 'text-[16px]',
}

/** The rest of `.ds-link-caps`, shared by both sizes. */
export const LINK_CAPS_BASE = [
  'tracking-[-0.01em] uppercase',
  'text-fg/70',
  'hover:text-fg data-[hovered]:text-fg',
  // The page you are on, from the sheet's own `[aria-current="page"] { color: teal }`.
  'data-[current]:text-teal',
].join(' ')

/**
 * The sheet's `.ds-link-url`: 12px, `-0.015em`, underlined, going teal on hover. The underline is
 * the whole affordance — it is the one link here that sits inside running text, where a colour
 * change alone would not mark it.
 */
export const LINK_URL = [
  'text-[12px] tracking-[-0.015em] text-fg',
  'underline decoration-1 underline-offset-[3px]',
  'hover:text-teal hover:decoration-teal',
].join(' ')

/**
 * The sheet's `.ds-link-viewmore`: 16px, uppercase, in the accent — and the one link that *gains*
 * its underline on hover rather than losing it. It is a call to go and look at the rest, so it
 * wears the accent at rest and underlines itself when the pointer arrives.
 */
export const LINK_VIEWMORE = [
  'text-[16px] tracking-[-0.01em] uppercase text-teal',
  'no-underline',
  'hover:underline hover:underline-offset-4',
].join(' ')
