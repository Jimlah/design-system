import { useEffect, useMemo, useState } from 'react'
import { Breadcrumbs } from '../components/Breadcrumbs/Breadcrumbs'
import { Button } from '../components/Button/Button'
import { Card } from '../components/Card/Card'
import { ColorSwatch } from '../components/ColorSwatch/ColorSwatch'
import { Link } from '../components/Link/Link'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { Separator } from '../components/Separator/Separator'
import { Slider } from '../components/Slider/Slider'
import { Sparkline } from '../components/Sparkline/Sparkline'
import { Switch } from '../components/Switch/Switch'
import { Table } from '../components/Table/Table'
import { TagGroup } from '../components/TagGroup/TagGroup'
import { TextField } from '../components/TextField/TextField'
import { ToggleButtonGroup } from '../components/ToggleButtonGroup/ToggleButtonGroup'
import {
  ACCENTS,
  BASES,
  DEFAULT_THEME,
  FONTS,
  MAX_RADIUS,
  contrastWithBlack,
  contrastWithWhite,
  darkFill,
  lightFill,
  oklch,
  srgb,
  themeCss,
  themeFrom,
  themeQuery,
} from './createTheme'
import type { CreateTheme, Mode } from './createTheme'

/**
 * The Create page: shadcn's `/create`, for this design system.
 *
 * Where shadcn's asks you to pick a component library, a base colour, a theme, an icon set and a
 * typeface, this asks the three questions Pulse actually has an answer to — **base, accent, type** —
 * and answers the rest by derivation. That difference is the point of the page rather than a gap in
 * it: this library's tokens are formulas (`color-mix()` off `--foreground`, `light-dark()` per value,
 * `var(--primary)` for the ring), so a base colour and a hue determine the whole block. The engine is
 * `createTheme.ts`, which is where the rules and their justification live.
 *
 * **The preview is real components, not mock-ups.** They are the library's own, rendered inside one
 * element that carries the generated tokens, so what the page shows is what an install produces —
 * and because `@theme inline` makes a utility read the variable on the element it is used on, that
 * one wrapper repaints everything below it. It is the mechanism the whole page rests on.
 *
 * **There is no radius control, and the page says so rather than offering a dead one.** The sheet
 * squares its buttons and inputs, and nothing here uses the `--radius` scale at all.
 */

/** The registry's public address, the same one the landing page prints. */
const REGISTRY_URL = 'https://jimlah.github.io/design-system/r'

const INSTALL = [
  'npx shadcn@latest registry add @pulse=' + REGISTRY_URL + '/{name}.json',
  'npx shadcn@latest add @pulse/theme',
].join('\n')

/** The note weight every explanation on this page uses. */
const NOTE = 'text-[13px] leading-[1.6] text-foreground/60'
/**
 * The one thing a theme is chosen by. Not a token: `light-dark()` is resolved where it is *used*,
 * so a subtree or a page with its own `color-scheme` flips on its own and no value is redefined.
 */
const SCHEME: Record<Mode | 'system', string> = {
  dark: ':root { color-scheme: dark; }',
  light: ':root { color-scheme: light; }',
  system: ':root { color-scheme: light dark; }',
}

/**
 * The two steps of the radius scale this page offers, as multiples of the base.
 *
 * They are `--radius-md` and `--radius-xl` from `src/styles.css`, named here rather than re-derived
 * so the control reads as the stylesheet's own scale. The page's test asserts a rendered control and a
 * rendered surface against them.
 */
const CONTROL_SCALE = 0.8
const SURFACE_SCALE = 1.4

/** The small uppercase heading each control group carries. */
const LEGEND =
  'font-mono text-[11px] tracking-[0.08em] text-foreground/60 uppercase'

export interface CreateProps {
  /**
   * The theme a shared link carried, as the route read it off the query string. Absent — a plain
   * visit, or the test — means the defaults.
   */
  preset?: Record<string, unknown>
}

export function Create({ preset }: CreateProps) {
  const [theme, setTheme] = useState<CreateTheme>(() => themeFrom(preset ?? {}))
  const [copied, setCopied] = useState<string | null>(null)

  // One source, three readers: the rule in the head of this page, the block in the panel below, and
  // the button that copies it. None of them can drift from the others because there is nothing to
  // drift from.
  const css = useMemo(() => themeCss(theme), [theme])

  /**
   * Keep the address bar in step, so any theme is a link.
   *
   * `replaceState` rather than the router: this page does not navigate. It also cannot run on the
   * server, which is why the route reads the query string and this writes it — the two halves of a
   * shared link, and neither has to know about the other.
   */
  useEffect(() => {
    const url = new URL(window.location.href)
    url.search = themeQuery(theme)
    window.history.replaceState(null, '', url)
  }, [theme])

  const update = (change: Partial<CreateTheme>) =>
    setTheme((current) => ({ ...current, ...change }))

  const copy = async (what: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(what)
    window.setTimeout(() => setCopied(null), 1600)
  }

  const link = () => {
    const url = new URL(window.location.href)
    url.search = themeQuery(theme)
    return url.toString()
  }

  const light = lightFill(theme.hue)
  const dark = darkFill(theme.hue)
  const base = BASES.find((entry) => entry.id === theme.base) ?? BASES[0]
  const surfaces = theme.mode === 'light' ? base.light : base.dark

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      {/*
        **The theme is applied at the root, exactly as a consumer applies it.** It cannot be applied
        to the preview element instead, and that is a measurement rather than a preference: every
        fill in this library is written `--btn: var(--color-primary)`, and `--color-primary` is
        declared on `:root`, where its `var(--primary)` is already substituted. A wrapper setting
        `--primary` therefore leaves every button teal — the utilities compiled from `@theme inline`
        do read the variable on the element, but the recipes they feed reach the token through the
        `--color-*` alias, which does not. Applying the block where the stylesheet applies it keeps
        the page honest and needs no second, hand-written copy of the alias table.

        The second rule is the other half of the same mechanism: a theme is chosen by `color-scheme`
        and never by redefining a token, which is why this is two rules rather than one.

        Both stay in the body on purpose. A `:root` rule in the stylesheet and a `:root` rule here have
        the same specificity, so document order is what decides — and this one has to come after the
        stylesheet. Hoisting it into the head, which is what `<style precedence>` would do, would put
        it back in front of the block it exists to override.
      */}
      <style data-slot="theme">{css}</style>
      <style data-slot="scheme">{SCHEME[theme.mode]}</style>
      <Breadcrumbs label="Breadcrumb">
        <Breadcrumbs.Item href={import.meta.env.BASE_URL}>
          Design system
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Create</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={LEGEND}>Theme builder</p>
          <h1 className="mt-3 text-[40px] leading-[1.05] font-semibold tracking-[-0.02em]">
            Create
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-foreground/70">
            Pick a base, an accent, a corner and a typeface. Everything else —
            the hairlines, the label colour, the charts, the sidebar — is
            derived from those values by the rules in the library&apos;s own
            stylesheet, so the block below is the whole theme rather than a
            patch over one.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ToggleButtonGroup
            aria-label="Theme"
            selectionMode="single"
            selectedKeys={new Set([theme.mode])}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (next === 'dark' || next === 'light' || next === 'system')
                update({ mode: next })
            }}
          >
            <ToggleButtonGroup.Button id="dark">Dark</ToggleButtonGroup.Button>
            <ToggleButtonGroup.Button id="light">
              Light
            </ToggleButtonGroup.Button>
            <ToggleButtonGroup.Button id="system">
              System
            </ToggleButtonGroup.Button>
          </ToggleButtonGroup>
          <Button variant="outline" onPress={() => setTheme(DEFAULT_THEME)}>
            Reset
          </Button>
          <Button
            variant="outline"
            onPress={() =>
              update({
                hue: Math.round(Math.random() * 3600) / 10,
                base: BASES[Math.floor(Math.random() * BASES.length)].id,
              })
            }
          >
            Randomise
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className={LEGEND}>Base</h2>
            <ToggleButtonGroup
              aria-label="Base colour"
              className="mt-3 flex-wrap"
              selectionMode="single"
              selectedKeys={new Set([theme.base])}
              onSelectionChange={(keys) => {
                const next = [...keys][0]
                const match = BASES.find((entry) => entry.id === next)
                if (match) update({ base: match.id })
              }}
            >
              {BASES.map((entry) => (
                <ToggleButtonGroup.Button key={entry.id} id={entry.id}>
                  {entry.name}
                </ToggleButtonGroup.Button>
              ))}
            </ToggleButtonGroup>
            <p className={'mt-3 ' + NOTE}>{base.note}</p>
            <div className="mt-3 flex items-center gap-3">
              <ColorSwatch color={srgb(surfaces.background)} />
              <ColorSwatch color={srgb(surfaces.card)} />
              <ColorSwatch color={srgb(surfaces.muted)} />
              <span className="text-[12px] text-foreground/60">
                page · panel · quiet fill
              </span>
            </div>
          </section>

          <section>
            <h2 className={LEGEND}>Accent</h2>
            <ToggleButtonGroup
              aria-label="Accent hue"
              className="mt-3 flex-wrap"
              selectionMode="single"
              selectedKeys={
                new Set(
                  ACCENTS.filter((entry) => entry.hue === theme.hue).map(
                    (entry) => entry.id,
                  ),
                )
              }
              onSelectionChange={(keys) => {
                const match = ACCENTS.find((entry) => entry.id === [...keys][0])
                if (match) update({ hue: match.hue })
              }}
            >
              {ACCENTS.map((entry) => (
                <ToggleButtonGroup.Button key={entry.id} id={entry.id}>
                  {entry.name}
                </ToggleButtonGroup.Button>
              ))}
            </ToggleButtonGroup>

            <Slider
              className="mt-4"
              value={theme.hue}
              minValue={0}
              maxValue={360}
              onChange={(value) => {
                const degrees = Array.isArray(value) ? value[0] : value
                update({ hue: Math.round(degrees * 10) / 10 })
              }}
            >
              <Slider.Header>
                <Slider.Label>Hue</Slider.Label>
                <Slider.Value />
              </Slider.Header>
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            {/*
              The two fills, side by side, because they are what the control moves. They are shown
              as swatches rather than described, and the readings beside them are the contrasts the
              sheet's rules exist to hold: white on the light fill, black on the dark one.
            */}
            <div className="mt-4 flex flex-col gap-3">
              <Fill
                label="Light column"
                fill={lightFill(theme.hue)}
                ink="white"
                contrast={contrastWithWhite(light)}
              />
              <Fill
                label="Dark column"
                fill={darkFill(theme.hue)}
                ink="black"
                contrast={contrastWithBlack(dark)}
              />
            </div>
          </section>

          <section>
            <h2 className={LEGEND}>Radius</h2>
            <Slider
              className="mt-3"
              value={theme.radius}
              minValue={0}
              maxValue={MAX_RADIUS}
              onChange={(value) => {
                const pixels = Array.isArray(value) ? value[0] : value
                update({ radius: Math.round(pixels) })
              }}
            >
              <Slider.Header>
                <Slider.Label>Corner</Slider.Label>
                <Slider.Value />
              </Slider.Header>
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            {/*
              One number, two steps, and both are shown because the scale is the thing a reader has
              to take away: a control sits at 0.8 of the base and a surface at 1.4, which is what the
              stylesheet's own `--radius-md` and `--radius-xl` already derive. At the sheet's 0 both
              are 0, which is why Pulse looks exactly as it always has.
            */}
            <div className="mt-4 flex flex-col gap-2">
              <Corner
                label="Control"
                sample="rounded-md"
                scale={CONTROL_SCALE}
                radius={theme.radius}
              />
              <Corner
                label="Surface"
                sample="rounded-xl"
                scale={SURFACE_SCALE}
                radius={theme.radius}
              />
            </div>
            <p className={'mt-3 ' + NOTE}>
              The base is the theme&apos;s; the scale is the stylesheet&apos;s.
              Set it to 0 and every corner is the sheet&apos;s — square.
            </p>
          </section>

          <section>
            <h2 className={LEGEND}>Type</h2>
            <ToggleButtonGroup
              aria-label="Typeface"
              className="mt-3 flex-col items-stretch"
              orientation="vertical"
              selectionMode="single"
              selectedKeys={new Set([theme.font])}
              onSelectionChange={(keys) => {
                const match = FONTS.find((entry) => entry.id === [...keys][0])
                if (match) update({ font: match.id })
              }}
            >
              {FONTS.map((entry) => (
                <ToggleButtonGroup.Button
                  key={entry.id}
                  id={entry.id}
                  style={{ fontFamily: entry.stack }}
                >
                  {entry.name}
                </ToggleButtonGroup.Button>
              ))}
            </ToggleButtonGroup>
            <p className={'mt-3 ' + NOTE}>
              One typeface for the whole system: labels, data and prose are all
              the mono. The other three arrive with this page&apos;s stylesheet,
              the way Overpass Mono arrives with the app&apos;s.
            </p>
          </section>

          <section>
            <h2 className={LEGEND}>Out of reach</h2>
            <p className={'mt-3 ' + NOTE}>
              A few corners are deliberately not the theme&apos;s. The
              checkbox&apos;s 2px and the radio&apos;s circle, because those are
              the radii users expect of them; a switch, which is a pill whatever
              the theme says; the table, whose hairline grid collapses its
              borders and cannot carry a radius at all; the sheet, which is
              anchored to an edge; and the swatch and slider grip, which are
              pictures of a value rather than panels.
            </p>
          </section>
        </div>

        <Preview />
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className={LEGEND}>The tokens</h2>
          <p className={'mt-3 max-w-2xl ' + NOTE}>
            The block the preview is wearing, and the block to paste into{' '}
            <span className="text-foreground">src/styles.css</span>. Both
            columns are in every value, so a token carries its own light and
            dark answer and nothing is redefined per theme.
          </p>
          <pre
            data-slot="tokens"
            className="mt-4 max-h-[26rem] overflow-auto border border-border-strong bg-card p-4 font-mono text-[12px] leading-[1.7]"
          >
            {css}
          </pre>
        </div>

        <div>
          <h2 className={LEGEND}>Take it with you</h2>
          <ol className={'mt-3 flex flex-col gap-2 ' + NOTE}>
            <li>
              1. Install the token set. The components carry it too, so a single
              component works on its own.
            </li>
            <li>
              2. Paste the block above into your <span>:root</span>, replacing
              the values it has.
            </li>
            <li>
              3. The family travels as <span>--type-mono</span>, which the theme
              block maps <span>--font-mono</span> to.
            </li>
          </ol>
          <pre className="mt-4 border border-border-strong bg-card p-4 font-mono text-[12px] leading-[1.9]">
            {INSTALL}
          </pre>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onPress={() => copy('css', css)}>
              {copied === 'css' ? 'Copied' : 'Copy the tokens'}
            </Button>
            <Button variant="outline" onPress={() => copy('link', link())}>
              {copied === 'link' ? 'Copied' : 'Copy the link'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

/** One derived fill, with the reading that says whether it may carry that label. */
function Fill({
  label,
  fill,
  ink,
  contrast,
}: {
  label: string
  fill: { l: number; c: number; h: number }
  ink: string
  contrast: number
}) {
  return (
    <div className="flex items-center gap-3">
      <ColorSwatch color={srgb(fill)} />
      <div className="min-w-0">
        <p className="font-mono text-[12px]">{oklch(fill)}</p>
        <p className="text-[12px] text-foreground/60">
          {label} · {ink} label at {contrast.toFixed(2)}:1
        </p>
      </div>
    </div>
  )
}

/**
 * One step of the radius scale, shown as the utility that carries it.
 *
 * The readings are arithmetic on the base because the *samples* are not: they wear `rounded-md` and
 * `rounded-xl` themselves, so the corner in the panel is painted by the same rule a button and a card
 * are. The arithmetic only names the number, and the page's test holds it to a computed style — 0.8
 * and 1.4 are the stylesheet's own multipliers, and a change to them that the page did not follow
 * would fail there rather than silently mislabel a corner.
 */
function Corner({
  label,
  sample,
  scale,
  radius,
}: {
  label: string
  sample: string
  scale: number
  radius: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={'size-6 shrink-0 border border-input bg-muted ' + sample}
      />
      <div className="min-w-0">
        <p className="font-mono text-[12px]">
          {label} · {sample}
        </p>
        <p className="text-[12px] text-foreground/60">
          {(radius * scale).toFixed(1)}px
        </p>
      </div>
    </div>
  )
}

/**
 * A working screen, in the theme being built.
 *
 * The components are the library's and the content is the kind of thing this design language is
 * for, because a gallery of controls in boxes would not show what a theme does: the fills have to
 * meet their hairlines, and the panel has to sit on the page.
 */
function Preview() {
  return (
    <div
      data-slot="preview"
      className="border border-border-strong bg-background text-foreground"
    >
      <div className="p-6">
        <Breadcrumbs label="Breadcrumb">
          <Breadcrumbs.Item href="#">Monitors</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">fra1</Breadcrumbs.Item>
          <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
        </Breadcrumbs>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.08em] text-primary uppercase">
              Region
            </p>
            <h2 className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.01em]">
              Frankfurt
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Replicating to fra2 · 42ms median
            </p>
          </div>
          <TagGroup aria-label="Regions">
            <TagGroup.List>
              <TagGroup.Tag variant="teal">fra1</TagGroup.Tag>
              <TagGroup.Tag variant="outline">eu-west</TagGroup.Tag>
            </TagGroup.List>
          </TagGroup>
        </div>

        <Separator variant="soft" className="my-6" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Table aria-label="Monitors">
            <Table.Header>
              <Table.Column isRowHeader>Monitor</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>Uptime</Table.Column>
            </Table.Header>
            <Table.Body>
              {FLEET.map((monitor) => (
                <Table.Row key={monitor.id} id={monitor.id}>
                  <Table.Cell>{monitor.name}</Table.Cell>
                  <Table.Cell>{monitor.status}</Table.Cell>
                  <Table.Cell>{monitor.uptime}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <Card>
            <Card.Header>
              <Card.Title>Throughput</Card.Title>
              <Card.Description>Requests, last 6 hours</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-5">
              {/* The svg renders its own 300x84 and stretches only when a class tells it to —
                  without one it ran past the card it sits in. */}
              <Sparkline
                className="w-full"
                data={[12, 18, 15, 24, 21, 30]}
                label="Requests, last 6 hours"
              />
              <ProgressBar value={72}>
                <ProgressBar.Header>
                  <ProgressBar.Label>Uptime</ProgressBar.Label>
                  <ProgressBar.Value />
                </ProgressBar.Header>
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              <Switch defaultSelected>
                <Switch.Indicator />
                <Switch.Text>Auto-retry</Switch.Text>
              </Switch>
            </Card.Content>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-5">
          <TextField name="region" className="w-52">
            <TextField.Label>Region</TextField.Label>
            <TextField.Input placeholder="fra1" />
            <TextField.Hint>Lowercase, three characters.</TextField.Hint>
          </TextField>
          <div className="flex flex-wrap gap-3">
            <Button>Restart</Button>
            <Button color="danger" variant="outline">
              Drain
            </Button>
            <Button variant="ghost">Silence</Button>
            <Button variant="text">View more</Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-[13px]">
          <Link variant="caps" href="#runbook">
            Runbook
          </Link>
          <Link variant="url" href="#logs">
            Open the logs
          </Link>
          <Link variant="viewmore" href="#alerts">
            All alerts
          </Link>
        </div>
      </div>
    </div>
  )
}

/** The three rows the preview's table draws. */
const FLEET = [
  { id: 'fra1', name: 'fra1 · Frankfurt', status: 'Up', uptime: '99.98%' },
  { id: 'iad1', name: 'iad1 · Virginia', status: 'Degraded', uptime: '98.10%' },
  {
    id: 'sfo1',
    name: 'sfo1 · San Francisco',
    status: 'Down',
    uptime: '91.44%',
  },
]
