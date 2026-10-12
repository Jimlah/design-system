/**
 * The token engine behind the Create page: the rules `src/styles.css` follows, written down so a
 * theme can be **derived** rather than picked out of a list.
 *
 * `src/styles.css` is still the single source of truth for what Pulse ships. This module is the same
 * shape of statement, one level up: instead of a value per token, it holds the constraint each value
 * satisfies, and produces the `:root` block that would replace the one in the stylesheet.
 *
 * Three of those constraints are the stylesheet's own, and they are the reason this is arithmetic
 * rather than a table of hexes:
 *
 *   - **A light fill is as saturated as sRGB allows, and no more.** An accent in the light column
 *     sits at L 55% — deep enough that white label text clears 4.5:1 — with the largest chroma that
 *     lightness and hue can carry. The sheet's own teal is 0.0931 against the 0.0952 sRGB ceiling, so
 *     it also stops about 2% short, which is what `GAMUT_MARGIN` restates.
 *   - **A dark fill holds the system's shared chroma.** 0.1236 in every accent, which the sheet
 *     states as "the four share a chroma in dark". Teal's ceiling at L 92% *is* 0.1236, so the accent
 *     sits there; a hue whose ceiling at 92% falls short is deepened to the highest lightness that
 *     still reaches the shared chroma, which is exactly how the sheet's red arrives at L 78.5%.
 *   - **Everything else is a reference.** `--ring` is `var(--primary)`, the three hairlines are
 *     `color-mix()` off `--foreground`, and `--accent` is `--muted`, so the block this module emits
 *     is the block the components are already written against.
 *
 * Nothing here is imported by a component; this is the page's engine, not the library's API.
 */

/** An `oklch()` colour. Lightness and chroma are 0–1 fractions, so `55%` is `0.55`. */
export interface Oklch {
  l: number
  c: number
  h: number
}

/** oklch to linear-light sRGB, which is the space a gamut question is actually asked in. */
function toLinear({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)
  const lp = l + 0.3963377774 * a + 0.2158037573 * b
  const mp = l - 0.1055613458 * a - 0.0638541728 * b
  const sp = l - 0.0894841775 * a - 1.291485548 * b
  const [L, M, S] = [lp ** 3, mp ** 3, sp ** 3]

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ]
}

/** Inside sRGB, with a hair of tolerance for the binary search's own rounding. */
function inside(rgb: [number, number, number], epsilon = 1e-4): boolean {
  return rgb.every((channel) => channel >= -epsilon && channel <= 1 + epsilon)
}

/**
 * The largest chroma sRGB can represent at this lightness and hue.
 *
 * Bisection rather than a formula: the sRGB boundary is not analytic in oklch, and 60 halvings put
 * the answer within 1e-15 of it. Measured against the sheet's own hexes — `#71FFF6` reads
 * `91.98% 0.1236 189.5`, and this returns 0.1236 for that lightness and hue.
 */
export function gamutCeiling(lightness: number, hue: number): number {
  let low = 0
  let high = 0.5
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2
    if (inside(toLinear({ l: lightness, c: mid, h: hue }))) low = mid
    else high = mid
  }
  return low
}

/**
 * The highest lightness at or below the dark target at which this hue still reaches `chroma`.
 *
 * **A scan downward, not a bisection, and that is a measurement rather than caution.** The largest
 * chroma sRGB can hold at a fixed hue is not monotone in lightness — it rises to a peak and falls
 * away on both sides — so "the highest lightness that still holds the chroma" is the top of a band,
 * not a boundary a bisection can converge on. For teal the peak sits *at* the target: its ceiling is
 * 0.123259 at L 92% and 0.123611 at L 91.98%, so testing 92% alone says the hue cannot hold the
 * chroma at all, and a bisection from there walks the wrong way and returns nothing. The half-percent
 * of resolution below the target costs nothing and lands on the sheet's own 91.98%.
 */
function lightnessHolding(chroma: number, hue: number): number {
  const step = 0.0005
  const floor = 0.35
  for (let index = 0; index * step <= DARK_LIGHTNESS - floor; index += 1) {
    const lightness = DARK_LIGHTNESS - index * step
    if (gamutCeiling(lightness, hue) >= chroma) return lightness
  }
  return floor
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => Math.max(0, channel))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast against white, which is what a light fill's label is. */
export function contrastWithWhite(colour: Oklch): number {
  return 1.05 / (relativeLuminance(toLinear(colour)) + 0.05)
}

/** WCAG contrast against black, which is what a dark fill's label is. */
export function contrastWithBlack(colour: Oklch): number {
  return (relativeLuminance(toLinear(colour)) + 0.05) / 0.05
}

/** Every accent in the light column sits here: deep enough for white label text. */
export const LIGHT_LIGHTNESS = 0.55
/** The dark column's target, where a hue's gamut allows it. */
export const DARK_LIGHTNESS = 0.92
/**
 * The chroma every dark accent shares, and the one number in this file that is not derived.
 *
 * It is the sheet's: `#71FFF6`, `#B0FBB1` and `#FF9A8B` all resolve to 0.1236, and a hue that
 * cannot reach it at L 92% is deepened until it can.
 */
export const SYSTEM_CHROMA = 0.1236
/**
 * How far inside the sRGB boundary a light fill stops, as a fraction of the ceiling.
 *
 * The sheet's own teal is 0.0931 against a 0.0952 ceiling and its yellow 0.1103 against 0.1125 —
 * 97.8% and 98.0% — so this restates a margin the stylesheet already keeps, rather than inventing
 * one. Sitting exactly on the boundary invites an engine's own rounding to land outside it, where
 * the colour is silently clamped.
 */
export const GAMUT_MARGIN = 0.98

/** The light column's accent fill for a hue, at its own ceiling. */
export function lightFill(hue: number): Oklch {
  return {
    l: LIGHT_LIGHTNESS,
    c: gamutCeiling(LIGHT_LIGHTNESS, hue) * GAMUT_MARGIN,
    h: hue,
  }
}

/** The dark column's accent fill for a hue: luminous, at the chroma the system shares. */
export function darkFill(hue: number): Oklch {
  const l = lightnessHolding(SYSTEM_CHROMA, hue)
  return { l, c: Math.min(SYSTEM_CHROMA, gamutCeiling(l, hue)), h: hue }
}

interface LightDark {
  light: string
  dark: string
}

/** `light-dark()` is how every token carries both themes, so this is the shape of nearly all of them. */
function pair(value: LightDark): string {
  return `light-dark(${value.light}, ${value.dark})`
}

function trim(number: number, places: number): string {
  return number.toFixed(places).replace(/\.?0+$/, '')
}

/** An `oklch()` value, written the way the stylesheet writes them. */
export function oklch({ l, c, h }: Oklch): string {
  const lightness = `${trim(l * 100, 2)}%`
  if (c === 0) return `oklch(${lightness} 0 none)`
  return `oklch(${lightness} ${trim(c, 4)} ${trim(h, 1)})`
}

function encode(channel: number): number {
  const clipped = Math.min(1, Math.max(0, channel))
  const gamma =
    clipped <= 0.0031308
      ? clipped * 12.92
      : 1.055 * Math.pow(clipped, 1 / 2.4) - 0.055
  return Math.round(gamma * 255)
}

/**
 * The same colour as an `rgb()` string.
 *
 * **One place in this page needs it, and it is not a styling shortcut.** React Aria's `ColorSwatch`
 * parses a colour string with a parser that understands rgb, hsl and hsb and nothing else — handed an
 * `oklch()` value it throws `Invalid color value`, which is how this function came to exist. It
 * converts through the same matrices `gamutCeiling` uses, so the swatch and the token beside it are
 * one colour; measured against the sheet, the dark accent comes out `rgb(113, 255, 246)`, which is
 * the `#71FFF6` the sheet records.
 */
export function srgb({ l, c, h }: Oklch): string {
  const [r, g, b] = toLinear({ l, c, h })
  return `rgb(${encode(r)}, ${encode(g)}, ${encode(b)})`
}

/** The four surfaces a base colour sets, and nothing else — the rest of the ramp derives from them. */
interface Surfaces {
  background: Oklch
  foreground: Oklch
  card: Oklch
  muted: Oklch
}

export type BaseId = 'carbon' | 'graphite' | 'slate' | 'sand'

export interface PaletteBase {
  id: BaseId
  name: string
  /** One line for the control, saying what this base does to the ramp. */
  note: string
  light: Surfaces
  dark: Surfaces
}

/**
 * The neutral ramps. `carbon` is the sheet's own, to the byte; the other three are the same ramp
 * with one thing changed, so a choice here is legible rather than a new palette.
 *
 * Light panels sit just below a white page and dark panels well above a black one, which is not
 * symmetric and is not a mistake: white leaves 2.5% of headroom for a panel, black leaves all of it.
 */
/** Shorthand for the tables below, where every entry is three numbers and a comment. */
function shade(l: number, c: number, h: number): Oklch {
  return { l, c, h }
}

export const BASES: PaletteBase[] = [
  {
    id: 'carbon',
    name: 'Carbon',
    note: 'The sheet, exactly: a pure page, a cool-tinted panel.',
    light: {
      background: shade(1, 0, 0),
      foreground: shade(0.18, 0, 0),
      card: shade(0.975, 0, 0),
      muted: shade(0.945, 0, 0),
    },
    dark: {
      background: shade(0, 0, 0),
      foreground: shade(1, 0, 0),
      card: shade(0.1722, 0.0115, 260.6),
      muted: shade(0.225, 0.009, 255.6),
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    note: 'The same ramp in true neutral: the panel tint removed, nothing else.',
    light: {
      background: shade(1, 0, 0),
      foreground: shade(0.18, 0, 0),
      card: shade(0.975, 0, 0),
      muted: shade(0.945, 0, 0),
    },
    dark: {
      background: shade(0, 0, 0),
      foreground: shade(1, 0, 0),
      card: shade(0.1722, 0, 0),
      muted: shade(0.225, 0, 0),
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    note: 'A blue page rather than a black one, so the canvas itself carries the tint.',
    light: {
      background: shade(1, 0, 0),
      foreground: shade(0.18, 0.02, 260),
      card: shade(0.975, 0.004, 255),
      muted: shade(0.94, 0.006, 255),
    },
    dark: {
      background: shade(0.09, 0.012, 260),
      foreground: shade(1, 0, 0),
      card: shade(0.165, 0.02, 260),
      muted: shade(0.215, 0.018, 260),
    },
  },
  {
    id: 'sand',
    name: 'Sand',
    note: 'The same ramp warmed: hue 80 through the page, the panel and the quiet fill.',
    light: {
      background: shade(0.994, 0.006, 80),
      foreground: shade(0.2, 0.012, 80),
      card: shade(0.974, 0.008, 80),
      muted: shade(0.944, 0.01, 80),
    },
    dark: {
      background: shade(0.08, 0.008, 80),
      foreground: shade(1, 0, 0),
      card: shade(0.175, 0.014, 75),
      muted: shade(0.225, 0.012, 75),
    },
  },
]
export const ACCENTS = [
  { id: 'pulse', name: 'Pulse', hue: 189.5 },
  { id: 'sky', name: 'Sky', hue: 230 },
  { id: 'iris', name: 'Iris', hue: 275 },
  { id: 'orchid', name: 'Orchid', hue: 320 },
  { id: 'rose', name: 'Rose', hue: 20 },
  { id: 'lime', name: 'Lime', hue: 140 },
] as const

export type FontId = 'overpass' | 'jetbrains' | 'plex' | 'space'

export interface MonoFont {
  id: FontId
  name: string
  /** The full stack, which is what `--type-mono` carries. */
  stack: string
  /** The family in the monospace slot of a Google Fonts request. */
  google: string
}

/**
 * The families a Pulse theme may be set in. Overpass Mono is the sheet's; the other three are
 * there because a monospace design language is one typeface away from being a different one, which
 * is the whole reason the font is a control here and not a constant.
 */
export const FONTS: MonoFont[] = [
  {
    id: 'overpass',
    name: 'Overpass Mono',
    stack:
      "'Overpass Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    google: 'Overpass+Mono:wght@400;500;600;700',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    stack:
      "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    google: 'JetBrains+Mono:wght@400;500;600;700',
  },
  {
    id: 'plex',
    name: 'IBM Plex Mono',
    stack:
      "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    google: 'IBM+Plex+Mono:wght@400;500;600;700',
  },
  {
    id: 'space',
    name: 'Space Mono',
    stack:
      "'Space Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    google: 'Space+Mono:wght@400;700',
  },
]

export type Mode = 'dark' | 'light' | 'system'

export interface CreateTheme {
  base: BaseId
  hue: number
  /**
   * The base radius, in pixels — the number `--radius` carries.
   *
   * It is one number because the stylesheet's scale derives everything else from it: a control sits at
   * 0.8 of it and a surface at 1.4 (`--radius-md` and `--radius-xl`). Pulse's own value is `0`, which
   * is the sheet: square corners throughout.
   */
  radius: number
  font: FontId
  mode: Mode
}

/** How far the radius may be pushed in the page's control. Past this a control stops reading as one. */
export const MAX_RADIUS = 16

export const DEFAULT_THEME: CreateTheme = {
  base: 'carbon',
  hue: 189.5,
  radius: 0,
  font: 'overpass',
  mode: 'dark',
}

const SECONDARY = pair({
  light: 'oklch(52% 0 none)',
  dark: 'oklch(80.47% 0 none)',
})

/**
 * The accents the sheet fixes, in both themes. A theme here moves `--primary` and leaves these
 * alone: they are what success, danger and warning *mean*, and a hue chosen for the brand is not an
 * argument for repainting a destructive action.
 */
const DESTRUCTIVE = pair({
  light: 'oklch(55% 0.1236 29)',
  dark: 'oklch(78.5% 0.1236 29)',
})
const WARNING = pair({
  light: 'oklch(55% 0.1103 91.2)',
  dark: 'oklch(87.33% 0.1505 91.2)',
})
const SUCCESS = pair({
  light: 'oklch(55% 0.1236 145)',
  dark: 'oklch(91.98% 0.1236 145)',
})
const CHART_BAR = pair({
  light: 'oklch(45% 0 none)',
  dark: 'oklch(52% 0 none)',
})

/**
 * Every token the stylesheet declares, in the order it declares them, as the `:root` block a
 * consumer pastes in. One entry is a value; the rest are references to it, which is the property
 * that makes a theme one edit rather than thirty.
 */
export function themeTokens(theme: CreateTheme): Record<string, string> {
  const base = BASES.find((entry) => entry.id === theme.base) ?? BASES[0]
  const font = FONTS.find((entry) => entry.id === theme.font) ?? FONTS[0]
  const primary = pair({
    light: oklch(lightFill(theme.hue)),
    dark: oklch(darkFill(theme.hue)),
  })

  return {
    '--background': pair({
      light: oklch(base.light.background),
      dark: oklch(base.dark.background),
    }),
    '--foreground': pair({
      light: oklch(base.light.foreground),
      dark: oklch(base.dark.foreground),
    }),
    '--card': pair({
      light: oklch(base.light.card),
      dark: oklch(base.dark.card),
    }),
    '--card-foreground': 'var(--foreground)',
    '--popover': 'var(--card)',
    '--popover-foreground': 'var(--foreground)',

    '--primary': primary,
    '--primary-foreground': 'var(--ink)',
    '--secondary': SECONDARY,
    '--secondary-foreground': 'var(--ink)',
    '--destructive': DESTRUCTIVE,
    '--destructive-foreground': 'var(--ink)',
    '--warning': WARNING,
    '--warning-foreground': 'var(--ink)',
    '--success': SUCCESS,
    '--success-foreground': 'var(--ink)',

    '--muted': pair({
      light: oklch(base.light.muted),
      dark: oklch(base.dark.muted),
    }),
    '--muted-foreground':
      'color-mix(in oklch, var(--foreground) 70%, transparent)',
    '--accent': 'var(--muted)',
    '--accent-foreground': 'var(--foreground)',
    '--ink': pair({ light: 'oklch(100% 0 none)', dark: 'oklch(0% 0 none)' }),

    '--border': 'color-mix(in oklch, var(--foreground) 62%, transparent)',
    '--border-strong':
      'color-mix(in oklch, var(--foreground) 40%, transparent)',
    '--border-soft': 'color-mix(in oklch, var(--foreground) 30%, transparent)',
    '--input': 'color-mix(in oklch, var(--foreground) 45%, transparent)',
    '--ring': 'var(--primary)',

    '--chart-1': CHART_BAR,
    '--chart-2': 'var(--primary)',
    '--chart-3': 'var(--warning)',
    '--chart-4': 'var(--success)',
    '--chart-5': 'var(--destructive)',

    '--sidebar': 'var(--card)',
    '--sidebar-foreground': 'var(--foreground)',
    '--sidebar-primary': 'var(--primary)',
    '--sidebar-primary-foreground': 'var(--ink)',
    '--sidebar-accent': 'var(--muted)',
    '--sidebar-accent-foreground': 'var(--foreground)',
    '--sidebar-border': 'var(--border-soft)',
    '--sidebar-ring': 'var(--primary)',

    '--radius': theme.radius === 0 ? '0' : `${theme.radius}px`,
    '--type-mono': font.stack,
  }
}

/** The same tokens as CSS: the `:root` rule, which is both what the preview wears and what is copied. */
export function themeCss(theme: CreateTheme): string {
  const lines = Object.entries(themeTokens(theme)).map(
    ([name, value]) => `  ${name}: ${value};`,
  )
  return [':root {', ...lines, '}'].join('\n')
}

/** The theme as a query string, so a theme is a link that can be sent. */
export function themeQuery(theme: CreateTheme): string {
  return new URLSearchParams({
    base: theme.base,
    hue: String(theme.hue),
    radius: String(theme.radius),
    font: theme.font,
    mode: theme.mode,
  }).toString()
}

/**
 * A theme from whatever a URL carried: unknown values fall back one at a time, so half a link still
 * opens something rather than nothing.
 *
 * **It reads numbers as well as strings, and that is not defensive.** TanStack Router parses a search
 * value as JSON, so `?hue=320` arrives as the number 320 while `?base=sand` arrives as a string — and
 * a parser that only accepted strings read the hue as absent, fell back to the default, and left the
 * server redirecting the request to a URL with the hue stripped out. A link shared from this page was
 * therefore a link to the default theme.
 */
export function themeFrom(search: Record<string, unknown>): CreateTheme {
  const text = (key: string): string | undefined => {
    const value = search[key]
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : undefined
  }
  const hue = Number(text('hue'))
  const radius = Number(text('radius'))
  const mode = text('mode')
  const base = BASES.find((entry) => entry.id === text('base'))
  const font = FONTS.find((entry) => entry.id === text('font'))
  return {
    base: base ? base.id : DEFAULT_THEME.base,
    hue:
      Number.isFinite(hue) && hue >= 0 && hue <= 360 ? hue : DEFAULT_THEME.hue,
    radius:
      Number.isFinite(radius) && radius >= 0 && radius <= MAX_RADIUS
        ? radius
        : DEFAULT_THEME.radius,
    font: font ? font.id : DEFAULT_THEME.font,
    mode:
      mode === 'light' || mode === 'system' || mode === 'dark'
        ? mode
        : DEFAULT_THEME.mode,
  }
}
