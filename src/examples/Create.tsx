import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  FileTrigger,
  I18nProvider,
  parseColor,
  TokenFieldValue,
} from 'react-aria-components'
import { parseDate, parseTime } from '@internationalized/date'

import { Accordion } from '../components/Accordion/Accordion'
import { Avatar } from '../components/Avatar/Avatar'
import { BarChart } from '../components/BarChart/BarChart'
import { Breadcrumbs } from '../components/Breadcrumbs/Breadcrumbs'
import { Button } from '../components/Button/Button'
import { Calendar } from '../components/Calendar/Calendar'
import { Card } from '../components/Card/Card'
import { Checkbox } from '../components/Checkbox/Checkbox'
import { ColorField } from '../components/ColorField/ColorField'
import { ColorSwatch } from '../components/ColorSwatch/ColorSwatch'
import { ColorSwatchPicker } from '../components/ColorSwatchPicker/ColorSwatchPicker'
import { ComboBox } from '../components/ComboBox/ComboBox'
import { DateField } from '../components/DateField/DateField'
import { DatePicker } from '../components/DatePicker/DatePicker'
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker'
import { DotMap } from '../components/DotMap/DotMap'
import { WORLD_DOTS } from '../components/DotMap/worldDots'
import { DropZone } from '../components/DropZone/DropZone'
import { FlatLine } from '../components/FlatLine/FlatLine'
import { Form } from '../components/Form/Form'
import { GridList } from '../components/GridList/GridList'
import { Link } from '../components/Link/Link'
import { ListBox } from '../components/ListBox/ListBox'
import { Menu } from '../components/Menu/Menu'
import { Meter } from '../components/Meter/Meter'
import { Modal } from '../components/Modal/Modal'
import { Nav } from '../components/Nav/Nav'
import { NumberField } from '../components/NumberField/NumberField'
import { Popover } from '../components/Popover/Popover'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { Radio } from '../components/Radio/Radio'
import { RangeCalendar } from '../components/RangeCalendar/RangeCalendar'
import { SearchField } from '../components/SearchField/SearchField'
import { Select } from '../components/Select/Select'
import { Separator } from '../components/Separator/Separator'
import { Sheet } from '../components/Sheet/Sheet'
import { Slider } from '../components/Slider/Slider'
import { Sparkline } from '../components/Sparkline/Sparkline'
import { Switch } from '../components/Switch/Switch'
import { Table } from '../components/Table/Table'
import { Tabs } from '../components/Tabs/Tabs'
import { TagGroup } from '../components/TagGroup/TagGroup'
import { TextArea } from '../components/TextArea/TextArea'
import { TextField } from '../components/TextField/TextField'
import { TimeField } from '../components/TimeField/TimeField'
import { Toast, ToastQueue } from '../components/Toast/Toast'
import { ToggleButton } from '../components/ToggleButton/ToggleButton'
import { ToggleButtonGroup } from '../components/ToggleButtonGroup/ToggleButtonGroup'
import { TokenField } from '../components/TokenField/TokenField'
import { Toolbar } from '../components/Toolbar/Toolbar'
import { Tooltip } from '../components/Tooltip/Tooltip'
import { Tree } from '../components/Tree/Tree'
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
            className="mbs-4 max-h-[26rem] overflow-auto overscroll-contain border border-border-strong bg-card p-4 font-mono text-[12px] leading-[1.7]"
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
 * One card of the showcase: what the card is for, and the components themselves rather than a picture
 * of them.
 *
 * **A card is the unit because that is what a design system is read in.** A page of controls laid out
 * as one screen shows that they coexist; a card per area shows each one doing its own job, and it
 * gives every corner in the theme something to be measured on.
 */
function Showcase({
  title,
  note,
  className,
  children,
}: {
  title: string
  note: string
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title className="text-[15px]">{title}</Card.Title>
        <Card.Description className="text-[12px]">{note}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-5">{children}</Card.Content>
    </Card>
  )
}

/** The screen the theme is for: a trail, a region, its chips, and the way out to the docs. */
function ScreenHeader() {
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs label="Breadcrumb">
        <Breadcrumbs.Item href="#">Monitors</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#">fra1</Breadcrumbs.Item>
        <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="flex flex-wrap items-start justify-between gap-4">
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
            <TagGroup.Tag variant="outline-warning">degraded</TagGroup.Tag>
          </TagGroup.List>
        </TagGroup>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-[13px]">
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
  )
}

/**
 * The five meanings a button can carry, and the three ways a row of controls can say what is on.
 *
 * `Restart` is the page's own anchor for a primary fill — the tests measure the theme on it — so it is
 * the first button in the grid and stays there.
 */
function ActionsCard() {
  return (
    <Showcase
      title="Actions"
      note="Five variants, five meanings, and two kinds of row."
    >
      <div className="flex flex-wrap gap-2">
        <Button>Restart</Button>
        <Button variant="outline">Drain</Button>
        <Button variant="ghost">Silence</Button>
        <Button variant="text">View more</Button>
        <Button variant="icon" aria-label="Add a monitor">
          <Button.Icon>{PLUS}</Button.Icon>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUTTON_COLORS.map((color) => (
          <Button key={color} size="sm" color={color}>
            {color}
          </Button>
        ))}
      </div>

      <Toolbar aria-label="Range" className="w-fit">
        <Toolbar.Group>
          <ToggleButton size="sm" defaultSelected>
            1h
          </ToggleButton>
          <ToggleButton size="sm">24h</ToggleButton>
          <ToggleButton size="sm">7d</ToggleButton>
        </Toolbar.Group>
        <Toolbar.Separator />
        <ToggleButton size="sm" variant="ghost">
          Live
        </ToggleButton>
      </Toolbar>

      <ToggleButtonGroup
        aria-label="Layout"
        className="w-fit"
        selectionMode="single"
        defaultSelectedKeys={['grid']}
      >
        <ToggleButtonGroup.Button id="list">List</ToggleButtonGroup.Button>
        <ToggleButtonGroup.Button id="grid">Grid</ToggleButtonGroup.Button>
        <ToggleButtonGroup.Button id="board">Board</ToggleButtonGroup.Button>
      </ToggleButtonGroup>
    </Showcase>
  )
}

/** Every control in the library wears one anatomy: legend, control, hint, error. */
function FieldsCard() {
  return (
    <Showcase
      title="Fields"
      note="One anatomy — label, control, hint, error — five different controls."
    >
      <TextField name="host" defaultValue="fra1">
        <TextField.Label>Hostname</TextField.Label>
        <TextField.Group>
          <TextField.Icon>{DOT}</TextField.Icon>
          <TextField.Input />
        </TextField.Group>
        <TextField.Hint>Where the checks run from.</TextField.Hint>
        <TextField.Error>Enter a hostname.</TextField.Error>
      </TextField>

      <TextArea defaultValue="Rolled the region on Tuesday.">
        <TextArea.Label>Notes</TextArea.Label>
        <TextArea.Input rows={3} placeholder="What changed?" />
        <TextArea.Hint>Markdown is fine.</TextArea.Hint>
        <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
      </TextArea>

      <SearchField>
        <SearchField.Label>Search monitors</SearchField.Label>
        <SearchField.Group>
          <SearchField.Icon />
          <SearchField.Input placeholder="Filter by name or URL…" />
        </SearchField.Group>
        <SearchField.Hint>12 of 24 monitors match</SearchField.Hint>
        <SearchField.Error>Enter at least two characters.</SearchField.Error>
      </SearchField>

      <NumberField defaultValue={60} minValue={5} maxValue={600}>
        <NumberField.Label>Interval</NumberField.Label>
        <NumberField.Group>
          <NumberField.Input />
          <NumberField.Counter />
        </NumberField.Group>
        <NumberField.Hint>Seconds between checks.</NumberField.Hint>
      </NumberField>

      <TokenField
        defaultValue={
          new TokenFieldValue([
            { type: 'token', text: '#ops', value: 'ops' },
            { type: 'text', text: ' on call' },
          ])
        }
      >
        <TokenField.Label>Notify</TokenField.Label>
        <TokenField.Input />
        <TokenField.Hint>
          Backspace removes the token before the caret.
        </TokenField.Hint>
      </TokenField>
    </Showcase>
  )
}

/** The selection controls: a group of checkboxes, a group of radios, a switch, a slider. */
function ChoicesCard() {
  return (
    <Showcase
      title="Choices"
      note="Two groups, a switch and a rail — each with its own keyboard model."
    >
      <Checkbox.Group defaultValue={['down']}>
        <Checkbox.Label>Alert me when</Checkbox.Label>
        <Checkbox value="down">
          <Checkbox.Indicator />
          <Checkbox.Text>Down</Checkbox.Text>
        </Checkbox>
        <Checkbox value="slow">
          <Checkbox.Indicator />
          <Checkbox.Text>Slow</Checkbox.Text>
        </Checkbox>
        <Checkbox.Hint>Applies to every monitor.</Checkbox.Hint>
        <Checkbox.Error>Pick at least one.</Checkbox.Error>
      </Checkbox.Group>

      <Radio.Group defaultValue="https">
        <Radio.Label>Protocol</Radio.Label>
        <Radio value="http">
          <Radio.Indicator />
          <Radio.Text>HTTP</Radio.Text>
        </Radio>
        <Radio value="https">
          <Radio.Indicator />
          <Radio.Text>HTTPS</Radio.Text>
        </Radio>
      </Radio.Group>

      <Switch defaultSelected>
        <Switch.Indicator />
        <Switch.Text>Auto-retry failed checks</Switch.Text>
      </Switch>

      <Slider defaultValue={60} className="w-full">
        <Slider.Header>
          <Slider.Label>Alert threshold</Slider.Label>
          <Slider.Value />
        </Slider.Header>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </Showcase>
  )
}

/** The colour half of the library: a typed colour, a row of presets, and the palette itself. */
function ColourCard() {
  return (
    <Showcase
      title="Colour"
      note="A colour typed, a colour picked, and the five the system has."
    >
      <ColorField defaultValue={parseColor('#71FFF6')}>
        <ColorField.Label>Label colour</ColorField.Label>
        <ColorField.Control>
          <ColorField.Swatch />
          <ColorField.Input />
        </ColorField.Control>
        <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
        <ColorField.Error>That is not a colour.</ColorField.Error>
      </ColorField>

      <ColorSwatchPicker aria-label="Preset colours" defaultValue="#71FFF6">
        {PALETTE.map((colour) => (
          <ColorSwatchPicker.Item key={colour} color={colour} />
        ))}
      </ColorSwatchPicker>

      <div className="flex items-center gap-2">
        {PALETTE.map((colour) => (
          <ColorSwatch key={colour} color={colour} />
        ))}
        <span className="text-[12px] text-foreground/60">
          every colour a swatch is asked to show here
        </span>
      </div>
    </Showcase>
  )
}

/** Three ways to choose from a list, and the keyboard model is the same in all three. */
function PickersCard() {
  return (
    <Showcase
      title="Pickers"
      note="A select with a search inside it, a combobox, and a plain list box."
    >
      <Select defaultSelectedKey="https" placeholder="Choose a protocol">
        <Select.Label>Protocol</Select.Label>
        <Select.Button>
          <Select.Value />
          <Select.Icon />
        </Select.Button>
        <Select.Popover>
          <Select.AutoComplete placeholder="Search protocols…">
            <Select.OptionList>
              <Select.Option id="http">HTTP</Select.Option>
              <Select.Option id="https">HTTPS</Select.Option>
              <Select.Option id="quic">QUIC</Select.Option>
            </Select.OptionList>
          </Select.AutoComplete>
        </Select.Popover>
        <Select.Hint>Applies to every check.</Select.Hint>
        <Select.Error>Choose a protocol.</Select.Error>
      </Select>

      <ComboBox defaultSelectedKey="iad">
        <ComboBox.Label>Monitor</ComboBox.Label>
        <ComboBox.Group>
          <ComboBox.Icon />
          <ComboBox.Input placeholder="Search monitors…" />
          <ComboBox.Button />
        </ComboBox.Group>
        <ComboBox.Popover>
          <ComboBox.OptionList>
            <ComboBox.Option id="fra">fra1 · Frankfurt</ComboBox.Option>
            <ComboBox.Option id="iad">iad1 · Virginia</ComboBox.Option>
            <ComboBox.Option id="sfo">sfo1 · San Francisco</ComboBox.Option>
          </ComboBox.OptionList>
        </ComboBox.Popover>
        <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
        <ComboBox.Error>Pick a monitor.</ComboBox.Error>
      </ComboBox>

      <ListBox
        aria-label="Region"
        selectionMode="single"
        defaultSelectedKeys={['fra']}
      >
        <ListBox.Item id="fra">Frankfurt</ListBox.Item>
        <ListBox.Item id="iad">Ashburn</ListBox.Item>
        <ListBox.Item id="sin">Singapore</ListBox.Item>
      </ListBox>
    </Showcase>
  )
}

/** Dates and times as fields, before any calendar is involved. */
function DatesCard() {
  return (
    <Showcase
      title="Dates and times"
      note="Typed, segmented, and each segment its own little field."
    >
      <DateField defaultValue={parseDate('2026-10-11')}>
        <DateField.Label>Starts on</DateField.Label>
        <DateField.Group>
          <DateField.Input />
        </DateField.Group>
        <DateField.Error>Choose a date.</DateField.Error>
      </DateField>

      <TimeField defaultValue={parseTime('09:30')}>
        <TimeField.Label>Opens at</TimeField.Label>
        <TimeField.Group>
          <TimeField.Input />
        </TimeField.Group>
        <TimeField.Error>Enter a time.</TimeField.Error>
      </TimeField>

      <DatePicker defaultValue={parseDate('2026-10-11')}>
        <DatePicker.Label>Window opens</DatePicker.Label>
        <DatePicker.Group>
          <DatePicker.Input />
          <DatePicker.Button />
        </DatePicker.Group>
        <DatePicker.Hint>Your local time.</DatePicker.Hint>
        <DatePicker.Error>Choose a date.</DatePicker.Error>
      </DatePicker>
    </Showcase>
  )
}

/** A month on the page, with no field and no popover around it. */
function CalendarCard() {
  return (
    <Showcase
      title="Calendar"
      note="The month itself, standing on the page rather than behind a field."
    >
      <Calendar aria-label="Date" defaultValue={parseDate('2026-10-11')} />
    </Showcase>
  )
}

/** Two dates as one value, and two months as one calendar. */
function RangeCard() {
  return (
    <Showcase
      className="xl:col-span-2"
      title="Ranges"
      note="A window is two dates, and it crosses a month more often than not."
    >
      <DateRangePicker
        defaultValue={{
          start: parseDate('2026-10-11'),
          end: parseDate('2026-10-20'),
        }}
      >
        <DateRangePicker.Label>Window</DateRangePicker.Label>
        <DateRangePicker.Group>
          <DateRangePicker.Input />
          <DateRangePicker.Button />
        </DateRangePicker.Group>
        <DateRangePicker.Hint>Your local time.</DateRangePicker.Hint>
        <DateRangePicker.Error>Pick a start and an end.</DateRangePicker.Error>
      </DateRangePicker>

      <RangeCalendar
        aria-label="Range"
        defaultValue={{
          start: parseDate('2024-03-12'),
          end: parseDate('2024-03-20'),
        }}
      />
    </Showcase>
  )
}

/** The sheet's rows: a panel-coloured stack, closed by a softer hairline, with a chart in a cell. */
function DataCard() {
  return (
    <Showcase
      className="xl:col-span-2"
      title="Data"
      note="A stack of rows separated by hairlines, and a sparkline inside one of its cells."
    >
      <Table aria-label="Monitors">
        <Table.Header>
          <Table.Column isRowHeader>Monitor</Table.Column>
          <Table.Column>Status</Table.Column>
          <Table.Column>Uptime</Table.Column>
          <Table.Column>Last hour</Table.Column>
        </Table.Header>
        <Table.Body>
          {FLEET.map((monitor) => (
            <Table.Row key={monitor.id} id={monitor.id}>
              <Table.Cell>{monitor.name}</Table.Cell>
              <Table.Cell>{monitor.status}</Table.Cell>
              <Table.Cell>{monitor.uptime}</Table.Cell>
              <Table.Cell>
                <Sparkline
                  className="w-full"
                  height={28}
                  data={monitor.series}
                  label={'Requests for ' + monitor.name}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Showcase>
  )
}

/** Selectable cards, which is what a GridList is for. */
function GridCard() {
  return (
    <Showcase
      title="Grid"
      note="GridList: a set of cards you can select, arrow keys and all."
    >
      <GridList
        aria-label="Monitors"
        selectionMode="multiple"
        defaultSelectedKeys={['fra1']}
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3"
      >
        {MONITORS.map((monitor) => (
          <GridList.Item
            key={monitor.id}
            id={monitor.id}
            textValue={monitor.name}
          >
            <GridList.Body>
              <span className="font-mono text-[13px] text-foreground">
                {monitor.name}
              </span>
              <span className="text-[12px] text-foreground/70">
                {monitor.detail}
              </span>
            </GridList.Body>
          </GridList.Item>
        ))}
      </GridList>
    </Showcase>
  )
}

/** A hierarchy, expanded in place. */
function TreeCard() {
  return (
    <Showcase
      title="Tree"
      note="Nested rows that expand where they stand, with the disclosure a real button."
    >
      <Tree
        aria-label="Files"
        selectionMode="single"
        defaultExpandedKeys={['src']}
      >
        <Tree.Item id="src" textValue="src">
          <Tree.Label>src</Tree.Label>
          <Tree.Item id="components" textValue="components">
            <Tree.Label>components</Tree.Label>
          </Tree.Item>
          <Tree.Item id="index" textValue="index.ts">
            <Tree.Label>index.ts</Tree.Label>
          </Tree.Item>
        </Tree.Item>
        <Tree.Item id="readme" textValue="README.md">
          <Tree.Label>README.md</Tree.Label>
        </Tree.Item>
      </Tree>
    </Showcase>
  )
}

/** A tab row over its panel, and the sidebar this library calls Nav. */
function NavigationCard() {
  return (
    <Showcase
      className="xl:col-span-2"
      title="Navigation"
      note="Tabs swap the panel below them; Nav is a tree of links beside the page."
    >
      <Tabs defaultSelectedKey="overview">
        <Tabs.List aria-label="Monitor detail">
          <Tabs.Tab id="overview">Overview</Tabs.Tab>
          <Tabs.Tab id="checks">
            Checks <Tabs.Count>3</Tabs.Count>
          </Tabs.Tab>
          <Tabs.Tab id="history">History</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="overview">
          Everything at a glance. The hairline under the row belongs to the
          list, and the fill under the current tab is the list's own indicator.
        </Tabs.Panel>
        <Tabs.Panel id="checks">Three checks are failing.</Tabs.Panel>
        <Tabs.Panel id="history">No incidents in 24 hours.</Tabs.Panel>
      </Tabs>

      <div className="flex min-h-56">
        <Nav aria-label="Primary" selectedRoute="/monitors/fra1">
          <Nav.Item href="#overview" textValue="Overview">
            <Nav.Label>Overview</Nav.Label>
          </Nav.Item>
          <Nav.Item href="#monitors" textValue="Monitors">
            <Nav.Label>
              Monitors <Nav.Count>12</Nav.Count>
            </Nav.Label>
            <Nav.Item href="#fra1" textValue="fra1">
              <Nav.Label>fra1 · Frankfurt</Nav.Label>
            </Nav.Item>
          </Nav.Item>
          <Nav.Section>
            <Nav.Header>Account</Nav.Header>
            <Nav.Item href="#settings" textValue="Settings">
              <Nav.Label>Settings</Nav.Label>
            </Nav.Item>
          </Nav.Section>
        </Nav>
      </div>
    </Showcase>
  )
}

/** Five surfaces that open over the page, each anchored to the control that opened it. */
function OverlaysCard() {
  return (
    <Showcase
      title="Overlays"
      note="A popover, a dialog, a panel, a menu and a tooltip — press any of them."
    >
      <div className="flex flex-wrap gap-2">
        <Popover>
          <Button variant="outline">Filters</Button>
          <Popover.Content placement="bottom start">
            <Popover.Arrow />
            <Popover.Title>Filters</Popover.Title>
            <Popover.Description>
              Applies to this view only.
            </Popover.Description>
          </Popover.Content>
        </Popover>

        <Modal>
          <Button variant="outline">New monitor</Button>
          <Modal.Content>
            <Modal.Title>New monitor</Modal.Title>
            <Modal.Description>
              It starts checking as soon as you save.
            </Modal.Description>
            <Modal.Footer>
              <Modal.Close>Cancel</Modal.Close>
              <Button>Save</Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>

        <Sheet>
          <Button variant="outline">Details</Button>
          <Sheet.Content side="right">
            <Sheet.Title>fra1 · Frankfurt</Sheet.Title>
            <Sheet.Description>Checked every 60 seconds.</Sheet.Description>
            <Sheet.Footer>
              <Sheet.Close>Close</Sheet.Close>
            </Sheet.Footer>
          </Sheet.Content>
        </Sheet>

        <Menu>
          <Button variant="outline">Actions</Button>
          <Menu.Popover menuProps={{ onAction: () => {} }}>
            <Menu.Item id="restart">Restart the check</Menu.Item>
            <Menu.Item id="pause">Pause for an hour</Menu.Item>
            <Menu.Separator />
            <Menu.Item id="delete">Delete the monitor</Menu.Item>
          </Menu.Popover>
        </Menu>

        <Tooltip delay={0}>
          <Button variant="outline">Hover for detail</Button>
          <Tooltip.Content>
            <Tooltip.Title>Uptime</Tooltip.Title>
            <Tooltip.Text>The share of checks that answered.</Tooltip.Text>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </Showcase>
  )
}

/**
 * Progress, a meter with a tone, and a toast wired to a button.
 *
 * The queue lives in this component rather than at module scope: a module-level one would keep its
 * toasts across a test run, which is how the Toast stories ended up making one per story.
 */
function FeedbackCard() {
  const [queue] = useState(
    () =>
      new ToastQueue<{ title: string; text: string }>({ maxVisibleToasts: 3 }),
  )

  return (
    <Showcase
      title="Feedback"
      note="How far along something is, how far it has left, and what just happened."
    >
      <ProgressBar value={72}>
        <ProgressBar.Header>
          <ProgressBar.Label>Uptime</ProgressBar.Label>
          <ProgressBar.Value />
        </ProgressBar.Header>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>

      <Meter value={82} tone="danger">
        <Meter.Header>
          <Meter.Label>Disk</Meter.Label>
          <Meter.Value />
        </Meter.Header>
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>

      <div>
        <Button
          variant="outline"
          onPress={() =>
            queue.add(
              {
                title: 'Check failed',
                text: 'fra1 · Frankfurt stopped responding.',
              },
              { timeout: 5000 },
            )
          }
        >
          Send a toast
        </Button>
      </div>

      <Toast.Region queue={queue} aria-label="Notifications">
        {({ toast }) => (
          <Toast toast={toast}>
            <Toast.Content>
              <Toast.Title>{toast.content.title}</Toast.Title>
              <Toast.Text>{toast.content.text}</Toast.Text>
            </Toast.Content>
            <Toast.Close />
          </Toast>
        )}
      </Toast.Region>
    </Showcase>
  )
}

/** Three drawings, none of which needs an axis to say what it says. */
function ChartsCard() {
  return (
    <Showcase
      className="xl:col-span-2"
      title="Charts"
      note="A series in a cell, a series that never moved, and a histogram with one bar in the accent."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-6">
        <div className="flex flex-col gap-3">
          <p className={CHART_LABEL}>Sparkline</p>
          <Sparkline
            className="w-full"
            data={[12, 18, 15, 24, 21, 30]}
            label="Requests, last 6 hours"
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className={CHART_LABEL}>Flat line</p>
          <FlatLine className="w-full" label="fra1 uptime, 100%" />
        </div>
        <div className="flex flex-col gap-3">
          <p className={CHART_LABEL}>Histogram</p>
          <BarChart
            className="w-full"
            values={[12, 30, 18, 44, 26, 9]}
            labels={['00', '04', '08', '12', '16', '20']}
            highlightIndex={3}
            label="Requests per four hours"
          />
        </div>
      </div>
    </Showcase>
  )
}

/** The world, one dot per origin, with the readout left to the caller. */
function MapCard() {
  return (
    <Showcase
      title="Map"
      note="Six hundred dots and one place you are asked to look."
    >
      <DotMap
        dots={[...WORLD_DOTS, [292.5, 243.5, 1, 'fra1 · 1.2m']]}
        label="Request origins, last hour"
      />
    </Showcase>
  )
}

/** Rows that open in place, the people who own them, and the five dividers the sheet has. */
function ContentCard() {
  return (
    <Showcase
      title="Content"
      note="An accordion, the avatars beside it, and every hairline strength at once."
    >
      <Accordion defaultExpandedKeys={['checks']}>
        <Accordion.Item id="checks">
          <Accordion.Header>Checks</Accordion.Header>
          <Accordion.Panel>Three checks are failing.</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="history">
          <Accordion.Header>History</Accordion.Header>
          <Accordion.Panel>No incidents in 24 hours.</Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <div className="flex items-center gap-3">
        {PEOPLE.map((person) => (
          <Avatar key={person.name} alt={person.name} color={person.color} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Separator variant="hair" />
        <Separator variant="soft" />
        <Separator variant="strong" />
        <Separator variant="dashed" />
        <Separator variant="dotted" />
      </div>
    </Showcase>
  )
}

/** A real form: fields that validate together, and a button that reports what it is doing. */
function FormCard() {
  return (
    <Showcase
      className="xl:col-span-2"
      title="Form"
      note="Two fields, a legend, and actions — validation moves focus to the first thing that failed."
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <Form.Legend>New monitor</Form.Legend>
        <Form.Section>
          <TextField name="host" isRequired>
            <TextField.Label>Hostname</TextField.Label>
            <TextField.Input placeholder="fra1" />
            <TextField.Error>Enter a hostname.</TextField.Error>
          </TextField>
          <Select name="protocol" defaultSelectedKey="https">
            <Select.Label>Protocol</Select.Label>
            <Select.Button>
              <Select.Value />
              <Select.Icon />
            </Select.Button>
            <Select.Popover>
              <Select.OptionList>
                <Select.Option id="http">HTTP</Select.Option>
                <Select.Option id="https">HTTPS</Select.Option>
              </Select.OptionList>
            </Select.Popover>
          </Select>
        </Form.Section>
        <Form.Actions>
          <Button type="submit">Save</Button>
          <Button variant="outline" type="reset">
            Reset
          </Button>
        </Form.Actions>
      </Form>
    </Showcase>
  )
}

/** A target for a dragged file, with the file picker a keyboard needs beside it. */
function FilesCard() {
  return (
    <Showcase
      title="Files"
      note="Drop a log on it, or browse for one — the picker is the same door for a keyboard."
    >
      <DropZone onDrop={() => {}} className="w-full">
        <DropZone.Title>Drop a log file here</DropZone.Title>
        <DropZone.Hint>JSON or CSV, up to 10 MB</DropZone.Hint>
        <FileTrigger acceptedFileTypes={['.json', '.csv']} onSelect={() => {}}>
          <Button variant="outline">Browse…</Button>
        </FileTrigger>
      </DropZone>
    </Showcase>
  )
}

/** The type scale, which is one family at five sizes rather than five families. */
function TypeCard() {
  return (
    <Showcase
      title="Type"
      note="One monospace family, and every label in the library is the caps line at the bottom."
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-[24px] leading-tight font-semibold tracking-[-0.01em]">
          Heading 24 · 600
        </h3>
        <h4 className="text-[17px] font-semibold">Heading 17 · 600</h4>
        <p className="text-[14px] leading-[1.6] text-foreground/70">
          Body 14 at 70%: the weight every explanation on this page is set in,
          and the one the sheet uses under a panel's title.
        </p>
        <p className="font-mono text-[12px] tracking-[0.08em] text-foreground/60 uppercase">
          Label 12 · uppercase · 0.08em
        </p>
        <p className="font-mono text-[32px] leading-none tabular-nums">
          99.98%
        </p>
      </div>
    </Showcase>
  )
}

/** What the theme resolves to, read off the page rather than described. */
function TokensCard() {
  return (
    <Showcase
      title="Tokens"
      note="Eight fills as the theme resolves them, and the three hairline strengths."
    >
      <div className="grid grid-cols-4 gap-3">
        {TOKEN_SWATCHES.map((token) => (
          <div key={token.name}>
            <div className={'h-10 border border-input ' + token.fill} />
            <p className="mt-1.5 font-mono text-[10px] text-foreground/60">
              {token.name}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[12px] leading-[1.6] text-foreground/60">
        The page around this card is wearing the same theme — every corner,
        every hairline and every fill above comes from the block the panel below
        copies.
      </p>
    </Showcase>
  )
}

/**
 * The showcase: a card per area of the system, each holding the real components doing their own job.
 *
 * **Why a card and not another screen.** A design system is read one control at a time — that is what
 * its docs pages are — and a single dense screen proves only that the parts coexist. A card per area
 * gives every one of them a box of its own to be looked at in, which is also what makes the radius and
 * the hairlines legible: twenty corners in one view is twenty chances to see the theme is wrong.
 *
 * The components are the library's, at their documented props, and the content is the kind of thing
 * this design language is for. Nothing here is a mock-up: press a button in it and it behaves.
 */
function Preview() {
  return (
    /*
      **The locale is pinned, and that is a hydration fix rather than a preference.** React Aria formats
      a date and a time with `Intl`, which answers from wherever it runs — so the server rendered
      `TimeField`'s literal segment one way and this browser another, and React threw away the tree and
      regenerated it on every load of this page. Measured in the console against the dev server, with the
      offending element in React's own diff: a `DateSegment` of type `literal`, which is the AM/PM
      marker. `en-GB` is also what the sheet's own `09:30` is — a 24-hour clock.
    */
    <I18nProvider locale="en-GB">
      <div
        data-slot="preview"
        className="flex flex-col gap-5 border border-border-strong bg-background p-5 text-foreground"
      >
        <ScreenHeader />
        <Separator variant="soft" />

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <ActionsCard />
          <FieldsCard />
          <ChoicesCard />
          <ColourCard />
          <PickersCard />
          <DatesCard />
          <CalendarCard />
          <OverlaysCard />
          <GridCard />
          <TreeCard />
          <FeedbackCard />
          <MapCard />
          <ContentCard />
          <FilesCard />
          <TypeCard />
          <TokensCard />
          <RangeCard />
          <DataCard />
          <ChartsCard />
          <NavigationCard />
          <FormCard />
        </div>
      </div>
    </I18nProvider>
  )
}

/** The three rows the table draws, each with the series its sparkline plots. */
const FLEET = [
  {
    id: 'fra1',
    name: 'fra1 · Frankfurt',
    status: 'Up',
    uptime: '99.98%',
    series: [12, 18, 15, 24, 21, 30],
  },
  {
    id: 'iad1',
    name: 'iad1 · Virginia',
    status: 'Degraded',
    uptime: '98.10%',
    series: [30, 28, 31, 26, 22, 19],
  },
  {
    id: 'sfo1',
    name: 'sfo1 · San Francisco',
    status: 'Down',
    uptime: '91.44%',
    series: [22, 20, 12, 9, 6, 4],
  },
]

/** The four the grid draws, and the line under each name. */
const MONITORS = [
  { id: 'fra1', name: 'fra1 · Frankfurt', detail: 'up · 42ms' },
  { id: 'iad1', name: 'iad1 · Virginia', detail: 'degraded · 180ms' },
  { id: 'sfo1', name: 'sfo1 · San Francisco', detail: 'down · 3m' },
  { id: 'sin1', name: 'sin1 · Singapore', detail: 'up · 96ms' },
]

/** The five meanings a button carries. */
const BUTTON_COLORS = [
  'primary',
  'secondary',
  'neutral',
  'success',
  'danger',
] as const

/** The palette a swatch is asked to show here — the four accents and the sheet's grey. */
const PALETTE = ['#71FFF6', '#FAD14F', '#B0FBB1', '#FF9A8B', '#BFBFBF']

/** The people the avatar row belongs to. */
const PEOPLE = [
  { name: 'Ada Lovelace', color: 'primary' },
  { name: 'Grace Hopper', color: 'success' },
  { name: 'Alan Turing', color: 'neutral' },
  { name: 'Barbara Liskov', color: 'danger' },
  { name: 'Katherine Johnson', color: 'secondary' },
] as const

/** Eight fills, as the token classes rather than as values — the theme resolves them. */
const TOKEN_SWATCHES = [
  { name: '--primary', fill: 'bg-primary' },
  { name: '--warning', fill: 'bg-warning' },
  { name: '--success', fill: 'bg-success' },
  { name: '--destructive', fill: 'bg-destructive' },
  { name: '--secondary', fill: 'bg-secondary' },
  { name: '--card', fill: 'bg-card' },
  { name: '--muted', fill: 'bg-muted' },
  { name: '--background', fill: 'bg-background' },
]

/** The small caps line above each drawing in the charts card. */
const CHART_LABEL =
  'font-mono text-[11px] tracking-[0.08em] text-foreground/60 uppercase'

/** A plus, for the icon-only button. */
const PLUS = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M6 1v10M1 6h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

/** A dot, for the field's leading affix. */
const DOT = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)
