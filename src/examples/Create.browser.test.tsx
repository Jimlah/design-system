import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Create } from './Create'
import {
  ACCENTS,
  BASES,
  DEFAULT_THEME,
  FONTS,
  contrastWithBlack,
  contrastWithWhite,
  darkFill,
  lightFill,
  oklch,
  srgb,
  themeCss,
  themeFrom,
  themeQuery,
  themeTokens,
} from './createTheme'

/**
 * The Create page’s own tests, in Vitest’s browser mode rather than as a story.
 *
 * The page is an example — it shows the components being used and is published nowhere — so it
 * gets a browser test, like the sign-in page. The claims below are the ones that would let this
 * page lie without anyone noticing: that its arithmetic is the stylesheet’s, that what it offers
 * to copy is what it is wearing, and that the components it shows follow the theme rather than
 * merely sitting near it.
 */

test('the accent rule reproduces the accent the stylesheet was built from', () => {
  // The sheet records light teal as `oklch(55% 0.0931 189.5)` and dark teal as `oklch(91.98%
  // 0.1236 189.5)`. Those are the two values this derivation has to land on, and the tolerance
  // is a measurement rather than a shrug: the light fill stops 2% inside the sRGB ceiling, so it
  // comes out 0.0002 below the sheet rather than on it.
  expect(Math.abs(lightFill(189.5).c - 0.0931)).toBeLessThan(0.0005)
  expect(Math.abs(darkFill(189.5).l - 0.9198)).toBeLessThan(0.001)
  expect(darkFill(189.5).c).toBe(0.1236)

  // The other accent the sheet derives rather than picks: red sits at L 78.5% because that is the
  // highest lightness at which its hue still holds the chroma every dark accent shares, which is
  // exactly what this rule solves for. Measured at 78.7%, a fifth of a percent away.
  expect(Math.abs(darkFill(29).l - 0.785)).toBeLessThan(0.005)

  // And the constraint both rules exist to hold, over the whole hue circle rather than the six
  // hues the controls offer: a light fill carries white, a dark one black, and both clear AA.
  for (let hue = 0; hue < 360; hue += 5) {
    expect(
      contrastWithWhite(lightFill(hue)),
      'light at ' + hue,
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastWithBlack(darkFill(hue)),
      'dark at ' + hue,
    ).toBeGreaterThanOrEqual(7)
  }
})

test('a swatch is painted the colour the token beside it names', () => {
  // React Aria's `ColorSwatch` parses rgb, hsl and hsb and throws on anything else, so the page
  // converts before handing a colour over. The sheet records the dark accent as #71FFF6 —
  // rgb(113, 255, 246) — and this is that value coming back out of the same matrices the gamut
  // search is built on, which is the closest thing here to an external check.
  expect(srgb(darkFill(189.5))).toBe('rgb(113, 255, 246)')
})

test('the default theme is the sheet, token for token', () => {
  const tokens = themeTokens(DEFAULT_THEME)

  // The values, as src/styles.css declares them — both columns in one token, never a second
  // block of values.
  expect(tokens['--background']).toBe(
    'light-dark(oklch(100% 0 none), oklch(0% 0 none))',
  )
  expect(tokens['--card']).toBe(
    'light-dark(oklch(97.5% 0 none), oklch(17.22% 0.0115 260.6))',
  )
  expect(tokens['--muted']).toBe(
    'light-dark(oklch(94.5% 0 none), oklch(22.5% 0.009 255.6))',
  )

  // The references, which are what make a theme one edit rather than thirty. A block that
  // restated these would look the same and drift the first time one of them moved.
  expect(tokens['--ring']).toBe('var(--primary)')
  expect(tokens['--border']).toBe(
    'color-mix(in oklch, var(--foreground) 62%, transparent)',
  )
  expect(tokens['--chart-3']).toBe('var(--warning)')
  expect(tokens['--accent']).toBe('var(--muted)')

  // Two tokens a theme builder of shadcn’s shape would offer and this one deliberately does not
  // move: the corner, and the family the sheet ships.
  expect(tokens['--radius']).toBe('0')
  expect(tokens['--type-mono']).toBe(
    "'Overpass Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  )

  // A must-pass control, because a generator that ignores its input passes every test that only
  // ever asks for the default: graphite differs from carbon in the panel tint and nowhere else.
  expect(themeTokens({ ...DEFAULT_THEME, base: 'graphite' })['--card']).toBe(
    'light-dark(oklch(97.5% 0 none), oklch(17.22% 0 none))',
  )
})

test('the page wears the theme it offers to copy, at the root a consumer pastes it', async () => {
  const preset = { base: 'slate', hue: '275', font: 'space', mode: 'light' }
  const theme = themeFrom(preset)
  await render(<Create preset={preset} />)

  // The rule the page injects and the block it offers to copy are the same string from the same
  // function, which is the only version of "what you see is what you get" that cannot drift.
  const rule = document.querySelector('[data-slot="theme"]') as HTMLElement
  expect(rule.textContent).toBe(themeCss(theme))
  const shown = document.querySelector('[data-slot="tokens"]') as HTMLElement
  expect(shown.textContent).toBe(themeCss(theme))

  // And it is really applied: the theme block in the stylesheet declares these tokens on `:root`
  // too, so this is also the check that the page’s rule wins on document order.
  expect(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim(),
  ).toBe(themeTokens(theme)['--primary'])

  // The other half of the mechanism: a theme is chosen by `color-scheme` and never by redefining a
  // token, so the light column is what `light-dark()` resolves to here.
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('light')
})
test('choosing an accent repaints the components themselves', async () => {
  const screen = await render(<Create />)
  const restart = screen.getByRole('button', { name: 'Restart' })
  await expect.element(restart).toBeVisible()

  // The dark column by default, so this is the fill Iris derives: L 76.75% at the chroma every
  // dark accent shares. Painting a reference div with it is what makes this a comparison of
  // colours rather than of strings — the browser resolves both.
  const before = getComputedStyle(restart.element()).backgroundColor
  await screen.getByRole('radio', { name: 'Iris' }).click()
  const reference = document.createElement('div')
  reference.style.backgroundColor = oklch(darkFill(275))
  document.body.append(reference)

  await vi.waitFor(() =>
    expect(getComputedStyle(restart.element()).backgroundColor).toBe(
      getComputedStyle(reference).backgroundColor,
    ),
  )
  expect(getComputedStyle(restart.element()).backgroundColor).not.toBe(before)
})

test('a typeface reaches the utilities, which is why the family left @theme inline', async () => {
  // The utility has to answer to the token on the element it is used on. It did not before this
  // page existed — `.font-mono` carried the family as a literal, so the token naming the system’s
  // typeface could not change it anywhere, in this repo or in a consumer’s project. Measured by
  // compiling the sheet, and pinned here.
  const screen = await render(<Create preset={{ font: 'jetbrains' }} />)
  const restart = screen.getByRole('button', { name: 'Restart' })
  expect(getComputedStyle(restart.element()).fontFamily).toContain(
    'JetBrains Mono',
  )
})

test('and the sheet’s own family is what the default asks for', async () => {
  // The must-pass control for the claim above: a stylesheet that had lost its font token
  // altogether would pass a test that only ever asked for a second family.
  const screen = await render(<Create />)
  const restart = screen.getByRole('button', { name: 'Restart' })
  expect(getComputedStyle(restart.element()).fontFamily).toContain(
    'Overpass Mono',
  )
})
test('copying the tokens copies the block the page is showing', async () => {
  const written: string[] = []
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        written.push(text)
      },
    },
  })

  const screen = await render(<Create />)
  await screen.getByRole('button', { name: 'Copy the tokens' }).click()

  await vi.waitFor(() => expect(written).toHaveLength(1))
  expect(written[0]).toBe(themeCss(DEFAULT_THEME))
})

test('a theme is a link, and half a link still opens a page', () => {
  const theme = {
    base: 'sand',
    hue: 137.5,
    font: 'plex',
    mode: 'system',
  } as const
  expect(
    themeFrom(Object.fromEntries(new URLSearchParams(themeQuery(theme)))),
  ).toEqual(theme)

  // Every field falls back on its own, because a link is typed by hand as often as it is copied.
  expect(
    themeFrom({ base: 'nope', hue: 'banana', font: 'comic', mode: 'sepia' }),
  ).toEqual(DEFAULT_THEME)
  expect(themeFrom({ hue: '999' })).toEqual(DEFAULT_THEME)
  expect(themeFrom({ base: 'slate' })).toEqual({
    ...DEFAULT_THEME,
    base: 'slate',
  })

  // The controls and the engine agree on what exists, which is what keeps a preset from being
  // offered by one and unknown to the other.
  expect(BASES.map((entry) => entry.id)).toContain(
    themeFrom({ base: 'slate' }).base,
  )
  expect(FONTS.map((entry) => entry.id)).toContain(
    themeFrom({ font: 'plex' }).font,
  )
  expect(ACCENTS.map((entry) => entry.hue)).toContain(
    themeFrom({ hue: '189.5' }).hue,
  )
})
