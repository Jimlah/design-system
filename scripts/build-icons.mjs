/**
 * Generates the mark and the social card from the design system's own tokens.
 *
 *   npm run icons
 *
 * Writes `public/favicon.svg`, `public/apple-touch-icon.png` and `public/og.png`.
 *
 * **The colours are read from `src/styles.css` rather than copied out of it.** An icon is the one
 * artefact on this site that cannot use a custom property — a favicon is fetched by the browser on its
 * own, with no page around it, and the card is rendered before any page exists — so the alternative to
 * parsing the tokens here is a second set of colour values that drifts the first time a token changes.
 *
 * Only the concrete `light-dark()` pairs are read, and only their **dark** side: the mark is drawn on
 * the system's own black canvas rather than on the visitor's, so it reads the same in a light browser
 * chrome as in a dark one. Everything translucent is mixed in the renderer, from the values read here.
 *
 * The PNGs come out of Playwright — already a devDependency for the browser tests — and are committed
 * rather than rebuilt in CI, because a PNG is not byte-identical across machines and a `git diff`
 * guard on one would fail for reasons that have nothing to do with the design. The SVG is written by
 * the same run and is byte-stable.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const OUT = 'public'
const CSS = readFileSync('src/styles.css', 'utf8')

/** The two halves of a `light-dark(a, b)`, split on the comma that separates them and not on one inside `a`. */
function halves(inner) {
  let depth = 0
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0)
      return [inner.slice(0, i), inner.slice(i + 1)]
  }
  return null
}

/** Every `--name: light-dark(light, dark);` in the stylesheet, dark side only. */
function readTokens(css) {
  const tokens = new Map()
  const start = /--([a-z0-9-]+):\s*light-dark\(/g
  let match

  while ((match = start.exec(css))) {
    // Walk to the matching close paren: the values are nested functions, so the first `)` is not the end.
    let depth = 1
    let i = start.lastIndex
    while (i < css.length && depth > 0) {
      if (css[i] === '(') depth++
      else if (css[i] === ')') depth--
      i++
    }
    const pair = halves(css.slice(start.lastIndex, i - 1))
    if (pair) tokens.set(match[1], pair[1].trim())
  }

  return tokens
}

const tokens = readTokens(CSS)

/**
 * oklch to `#rrggbb`. The matrices are Björn Ottosson's, applied in the order he defines them:
 * polar to `oklab`, then the cube-rooted LMS cone response to linear sRGB, then the transfer function.
 *
 * This exists because a favicon is not only read by browsers. Unfurlers, feed readers and older
 * engines fetch it too, and `fill="oklch(…)"` is a colour they are entitled not to understand — the
 * failure mode being a black or invisible icon with nothing to say so. The card could keep oklch,
 * since Playwright is the one rendering it; the favicon cannot, so everything is converted.
 */
function toHex(value) {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*\)$/.exec(
    value,
  )
  if (!match) return value

  const [, lightness, percent, chroma, hue] = match
  const l = percent ? Number(lightness) / 100 : Number(lightness)
  const c = Number(chroma)
  const h = hue === 'none' ? 0 : (Number(hue) * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const lp = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mp = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sp = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  const channel = (linear) => {
    const encoded =
      linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${channel(4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp)}${channel(-1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp)}${channel(-0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp)}`
}

function color(name) {
  const value = tokens.get(name)
  if (!value) {
    throw new Error(
      `src/styles.css has no \`--${name}: light-dark(…)\` to read. These icons are generated from the tokens, so a renamed token has to be renamed here too.`,
    )
  }
  return toHex(value)
}

const base = color('background')
const panel = color('card')
const teal = color('primary')
const fg = color('foreground')
/** What the sheet uses for secondary text, mixed the way the token itself is. */
const fgMuted = `color-mix(in oklch, ${fg} 70%, transparent)`
/** `--line-strong`, for the one rule under the card's footer. */
const line = `color-mix(in oklch, ${fg} 40%, transparent)`

/**
 * The mark: the sheet's panel, squared off with the same 2px it gives its selection controls, and a
 * monitor trace across it. The trace is drawn in viewBox units so one path serves every size, and its
 * joins are mitred — the sheet has no rounded corners, so the mark should not either.
 */
function mark(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="Pulse">
  <rect width="32" height="32" rx="2" fill="${panel}"/>
  <path d="M4.5 17.5h5.5l3-8 4.5 15 3.5-8h6.5" fill="none" stroke="${teal}" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>`
}

/**
 * The card. Set in the system's mono rather than its sans, which is not a preference: Overpass Mono is
 * loaded as a webfont, so the card renders identically wherever this runs, where a system sans would
 * come out as SF Pro here and something else on another machine.
 */
function card() {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;500;600;700&display=swap');
  * { margin: 0; box-sizing: border-box }
  body {
    width: 1200px; height: 630px; padding: 68px 80px;
    background: ${base}; color: ${fg};
    font-family: 'Overpass Mono', ui-monospace, Menlo, Consolas, monospace;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  header { display: flex; align-items: center; gap: 18px }
  .wordmark { font-size: 26px; font-weight: 500; letter-spacing: .34em; text-transform: uppercase; color: ${teal} }
  h1 { font-size: 64px; font-weight: 600; line-height: 1.1; letter-spacing: -.02em; max-width: 980px }
  p { margin-top: 26px; font-size: 23px; line-height: 1.5; color: ${fgMuted}; max-width: 900px }
  .trace { width: 1040px; height: 84px; display: block }
  footer { display: flex; justify-content: space-between; align-items: flex-end;
           border-top: 1px solid ${line}; padding-top: 24px; font-size: 20px; color: ${fgMuted} }
</style>
<header>
  ${mark(56)}
  <span class="wordmark">Pulse</span>
</header>
<section>
  <h1>A dark monitoring design language</h1>
  <p>Accessible React components on React Aria, the tokens every one of them derives from, and a registry that installs them into another project.</p>
</section>
<svg class="trace" viewBox="0 0 1040 84" fill="none" aria-hidden="true">
  <path d="M0 46h260l54-38 78 70 60-38h588" stroke="${teal}" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>
<footer>
  <span>jimlah.github.io/design-system</span>
  <span>React Aria &middot; Tailwind CSS v4</span>
</footer>`
}

async function render(html, width, height, path) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  // The card is set in a webfont, so the screenshot waits for it; without this it renders in the fallback.
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path })
  await browser.close()
}

writeFileSync(`${OUT}/favicon.svg`, `${mark(32)}\n`)
await render(
  `<!doctype html><meta charset="utf-8"><style>*{margin:0}</style>${mark(180)}`,
  180,
  180,
  `${OUT}/apple-touch-icon.png`,
)
await render(card(), 1200, 630, `${OUT}/og.png`)

console.log(
  'Wrote public/favicon.svg, public/apple-touch-icon.png and public/og.png',
)
