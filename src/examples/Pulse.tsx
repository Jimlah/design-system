import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '../components/Button/Button'
import { Link } from '../components/Link/Link'
import { Table } from '../components/Table/Table'
import { TextField } from '../components/TextField/TextField'
import { ToggleButtonGroup } from '../components/ToggleButtonGroup/ToggleButtonGroup'

import './pulse.css'

/**
 * The landing page: the page that argues for Pulse, rather than showing it off.
 *
 * A design system's own site has two jobs, and they are not the same one. The first is the case for
 * using the thing at all: say what it is, prove it, and get out of the way of the install. The second is
 * a reference to the parts. This page is the first, and the reference is the documentation — an index of
 * fifty-eight components is not a case for installing any of them, which is why the index this page
 * replaced is gone rather than moved.
 *
 * **The page is built from one shape: a bar.** Pulse's own chart mark, the replica's histogram bar, is the
 * one thing in the system that is a measured value rather than a surface carrying text. It runs the page
 * at four scales: the hero's enormous accent stage, the tab on every folder band and index card, the shape
 * of the primary button, and the footer's five letters. It comes from the subject: everything worth saying
 * here is measured, and a bar is what a measurement looks like in this language.
 *
 * **The one live thing is the theme.** Pulse's distinguishing rule is that each token is a single
 * light-dark() value and a theme is an attribute rather than a second set of values. So the page is its own
 * demonstration: one real ToggleButtonGroup, blown up to fill the second screen, sets data-theme on this
 * page's own root. Because light-dark() resolves per element, everything below it flips on its own, with
 * nothing redeclared and nothing outside this page touched.
 *
 * Every number here is one this repository already states: src/styles.css for the token values,
 * registry.json for the item count, AGENTS.md for the published prop surface. None is invented, and what is
 * a quotation rather than a derivation is listed in docs/pulse.md.
 *
 * **The type scale is five sizes and a display pair, and the count is deliberate.** The page is set in the
 * system's one face, so every extra step would be visible as drift rather than as hierarchy: a small step,
 * the body, a lead, the names, the section headings, and the two display lines the hero and the closing
 * line need. The measure of whether that held is in the inspector's size count.
 */

const BASE = import.meta.env.BASE_URL

type Theme = 'dark' | 'system' | 'light'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
]

/**
 * The values themselves, quoted from the :root block of src/styles.css.
 *
 * They are written out rather than read from the stylesheet because a browser cannot be asked for a
 * token's two columns: getComputedStyle resolves light-dark() to the theme in force and throws the other
 * one away. If the sheet moves, this table moves with it.
 */
const TOKENS = [
  {
    token: '--background',
    light: 'oklch(100% 0 none)',
    dark: 'oklch(0% 0 none)',
  },
  {
    token: '--primary',
    light: 'oklch(55% 0.0931 189.5)',
    dark: 'oklch(91.98% 0.1236 189.5)',
  },
  {
    token: '--warning',
    light: 'oklch(55% 0.1103 91.2)',
    dark: 'oklch(87.33% 0.1505 91.2)',
  },
  {
    token: '--success',
    light: 'oklch(55% 0.1236 145)',
    dark: 'oklch(91.98% 0.1236 145)',
  },
  {
    token: '--destructive',
    light: 'oklch(55% 0.1236 29)',
    dark: 'oklch(78.5% 0.1236 29)',
  },
]

interface Layer {
  id: string
  name: string
  body: string
  tint: string
  picture?: string
}

/** The five layers a reader has to trust before they trust a component. */
const LAYERS: Layer[] = [
  {
    id: 'tokens',
    name: 'Tokens',
    tint: 'tint-0',
    picture: 'create.jpg',
    body: 'One sheet in shadcn&rsquo;s shape: the values under :root, and one @theme inline block that turns them into utilities. Every hover and tint is a color-mix of its own base, so moving one value moves its whole family with it.',
  },
  {
    id: 'behaviour',
    name: 'Behaviour',
    tint: 'tint-1',
    picture: 'login.jpg',
    body: 'Every interactive piece wraps a React Aria primitive and styles off its data-* attributes, never off CSS pseudo-classes. Keyboard handling, focus management and screen-reader semantics are not re-invented here.',
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    tint: 'tint-2',
    picture: 'board.jpg',
    body: 'The components are compound. A field is a Label, a Group, an Input and a Hint; a meter is a Header, a Track and a Fill. The slots are the API, and a local lint rule keeps the required ones where they belong.',
  },
  {
    id: 'registry',
    name: 'Registry',
    tint: 'tint-3',
    body: 'Every component is also a shadcn registry item, generated from the same sources as its documentation. An item carries the tokens, the base layer and every file it imports, so installing one is a single command.',
  },
  {
    id: 'docs',
    name: 'Docs',
    tint: 'tint-4',
    picture: 'storybook.jpg',
    body: 'One file per component beside its source, holding the decisions and the measurements: why a control&rsquo;s boundary sits at 45% alpha, why the overlay entry hangs off the mount, what the light column had to solve.',
  },
]

interface Worked {
  id: string
  name: string
  route: string
  shot: string
  alt: string
  body: string
  /** A clip of the page itself, used in place of the still where one exists. */
  clip?: string
  /** The frame the clip shows before it plays. */
  poster?: string
  /** A second, related still: the same page in the other theme. */
  also?: { shot: string; alt: string; caption: string }
}

/** Five pages built end to end with these components: the repository's own examples, screenshotted. */
const WORKED: Worked[] = [
  {
    id: 'board',
    name: 'Board',
    route: 'board',
    shot: 'board.jpg',
    alt: 'The task board: four columns of cards, a filter row above them, and the sidebar open beside the columns.',
    body: 'Four columns and a card you can drag between them, each card a sheet&rsquo;s worth of detail, with undo and local storage. The drag is React Aria&rsquo;s, so the keyboard moves cards too.',
    also: {
      shot: 'board-light.jpg',
      alt: 'The same task board rendered in the light theme: a white page, dark text, and the same four columns.',
      caption:
        'The same page with data-theme set to light. Both readings come from the one token set, and neither of them redefines a value.',
    },
  },
  {
    id: 'dashboard',
    name: 'Leads',
    route: 'dashboard-email',
    shot: 'dashboard-email.jpg',
    alt: 'A leads dashboard: a table of enquiries with sources and values, a toolbar above them, and a chart panel beside the table.',
    body: 'A working dashboard for a team that answers enquiries: a table with a filter row and sortable columns, a chart beside it, and a sheet for the record you opened.',
  },
  {
    id: 'create',
    name: 'Create',
    route: 'create',
    shot: 'create.jpg',
    alt: 'The theme builder: colour and type controls on one side, and the real components repainted on the other.',
    body: 'A theme builder in the shape of shadcn&rsquo;s: pick a base colour, an accent hue, a corner and a typeface, and watch the real components repaint. Copy the token block, or a link that carries it.',
  },
  {
    id: 'login',
    name: 'Sign in',
    route: 'login',
    shot: 'login.jpg',
    alt: 'A sign-in page: an email field, a password field, a remember switch and a primary button, with the error states reachable.',
    body: 'The sign-in page, end to end: the field anatomy doing the work, a submit that stays pending for as long as the round trip takes, and the two errors a real one can show.',
  },
  {
    id: 'canvas',
    name: 'Canvas',
    route: 'canvas',
    shot: 'canvas.jpg',
    alt: 'Every component on one plane, grouped by kind and labelled, on a dark ground.',
    body: 'Every component on one plane, grouped by kind, with a camera you can drive. It is the fastest way to see what the library does, and the only page in the repository with no chrome at all.',
    clip: 'canvas-clip.mp4',
    poster: 'canvas-clip-poster.jpg',
  },
]

/**
 * The proof, and the only kind this repository has: measurements.
 *
 * There are no customers to quote and no logos to borrow, so the tiles carry what is true by construction:
 * a count read off the filesystem, a contrast ratio measured on both themes, a duration declared once in the
 * sheet. Each tile's line is written long on purpose. A short label sitting above a large figure is the
 * eyebrow this page does without.
 */
const FACTS = [
  {
    value: '58',
    line: 'Fifty-eight component directories, counted by the generator that publishes them rather than typed out.',
  },
  {
    value: '332',
    line: 'Props published across 42 of them, re-declared so the manifest is the API and not the DOM.',
  },
  {
    value: '60',
    line: 'Items in registry.json, all built from the components and the token sheet.',
  },
  {
    value: '4.5:1',
    line: 'Every light accent sits at L 55%, so a fill can carry white label text.',
  },
  {
    value: '3:1',
    line: 'The control boundary at 45% alpha: 4.43:1 on the dark page, 3.36:1 on the light.',
  },
  {
    value: '0',
    line: 'The radius token. A control takes 0.8 of it, a surface 1.4. One number, every corner.',
  },
  {
    value: '160ms',
    line: 'The house duration for something that moves: 120, 160, 200, and one curve.',
  },
]

interface Question {
  id: string
  topic: string
  question: string
  answer: string
}

const QUESTIONS: Question[] = [
  {
    id: 'aria',
    topic: 'Behaviour',
    question: 'Why React Aria rather than controls written by hand?',
    answer:
      'Focus, keyboard handling and screen-reader semantics are the expensive part of a component and the easiest thing to get subtly wrong. Every interactive piece here wraps a primitive, and styles off its data-* attributes rather than off CSS pseudo-classes.',
  },
  {
    id: 'arrives',
    topic: 'Registry',
    question: 'What arrives when you install one component?',
    answer:
      'The tokens and the base layer travel inside every item, so a component installed alone still has the colours it paints. So does every file it imports: the select item brings SearchField and field.ts with it, and there is nothing to add by hand.',
  },
  {
    id: 'themes',
    topic: 'Themes',
    question: 'How is there a light theme when the source sheet is dark?',
    answer:
      'The light column is derived rather than copied. Every accent sits at L 55%, each as saturated as sRGB allows, so a fill can carry white label text at 4.5:1, and no token is redefined per theme, because one attribute moves color-scheme.',
  },
  {
    id: 'corners',
    topic: 'Geometry',
    question: 'Where does the corner radius live?',
    answer:
      'In one token, and Pulse sets it to zero, so the sheet&rsquo;s controls and inputs are square. The components read the scale instead of squaring themselves off: a control is 0.8 of it, a surface 1.4, and the checkbox, the radio, the switch and the slider keep the shapes they need.',
  },
  {
    id: 'current',
    topic: 'Upkeep',
    question: 'How does the published copy stay true to the code?',
    answer:
      'registry.json is generated from the components, src/styles.css and the docs beside them, and CI fails when the committed copy is stale. A component that lands without regenerating it cannot ship quietly.',
  },
  {
    id: 'stack',
    topic: 'Stack',
    question: 'Does it work with Tailwind v4 and React 19?',
    answer:
      'The token sheet is a Tailwind v4 stylesheet with a single @theme inline block, the components are React 19 function components, and the only runtime dependency is react-aria-components. Overpass Mono rides on the theme item.',
  },
]

/** The two things a reader can ask for, as the README writes them. */
const ADDRESSES: {
  id: 'library' | 'component'
  label: string
  tail: string
}[] = [
  { id: 'library', label: 'The library', tail: 'pulse' },
  { id: 'component', label: 'One component', tail: 'button' },
]

/**
 * Reveals the parts of every section as they arrive, once, from an effect, so the page is whole before the
 * effect runs and stays whole if it never does. Reduced motion is the reader's call, not a class: it is
 * checked here, and the page simply stays at rest.
 */
function useReveal(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    root.dataset.anim = 'on'
    const parts = [...root.querySelectorAll<HTMLElement>('[data-reveal]')]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    for (const part of parts) observer.observe(part)
    return () => observer.disconnect()
  }, [rootRef])
}

/* The five steps the page is set in, named once. Every size a blueprint asks for is mapped onto one of
   them rather than added, because in a single-face system a sixth step reads as a mistake. */
const SMALL = 'text-[14px] leading-[1.6]'
const BODY = 'text-[16px] leading-[1.6]'
const LEAD = 'text-[20px] leading-[1.45]'
const NAME = 'text-[clamp(1.25rem,1.8vw,1.65rem)] font-bold tracking-[-0.01em]'
const H2 =
  'text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1.05] tracking-[-0.02em]'

/** One margin for the whole page. */
const SHELL = 'mx-auto w-full max-w-[1240px] px-5 sm:px-8'

const DELAY = (ms: number) =>
  ({ '--reveal-delay': ms + 'ms' }) as React.CSSProperties

export function Pulse() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [openLayer, setOpenLayer] = useState('tokens')
  const [openQuestion, setOpenQuestion] = useState('aria')
  const [address, setAddress] = useState<'library' | 'component'>('library')
  const [namespace, setNamespace] = useState('@pulse')
  const [copied, setCopied] = useState(false)

  useReveal(rootRef)

  const scope = ADDRESSES.find((entry) => entry.id === address) ?? ADDRESSES[0]
  const command = 'npx shadcn@latest add ' + namespace + '/' + scope.tail
  const themeName = THEMES.find((entry) => entry.id === theme)?.label ?? 'Dark'

  const toInstall = () => {
    document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })
  }

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // A browser that refuses the clipboard still has the command on the page, selectable.
    }
  }, [command])

  return (
    <div
      ref={rootRef}
      data-theme={theme}
      className="min-h-svh bg-background text-[17px] leading-[1.55] text-foreground"
    >
      <header>
        <div
          className={
            SHELL + ' flex flex-wrap items-center gap-x-8 gap-y-4 py-6'
          }
        >
          <p className={LEAD + ' font-bold tracking-[-0.01em]'}>Pulse</p>
          {/* On a phone the links take a row of their own, so the wordmark and the one action share
              the first. A header that wraps to three rows spends the top of the first screen saying
              nothing, and the first screen is the one that has to say what this is. */}
          <nav
            aria-label="Pulse"
            className="order-last flex w-full flex-wrap items-center gap-x-6 gap-y-2 sm:order-none sm:w-auto"
          >
            <Link href={BASE + 'storybook/'} variant="caps">
              Docs
            </Link>
            <Link href={BASE + 'examples/'} variant="caps">
              Examples
            </Link>
            <Link href={BASE + 'canvas/'} variant="caps">
              Canvas
            </Link>
            <Link href={BASE + 'create/'} variant="caps">
              Create a theme
            </Link>
          </nav>
          <div className="ms-auto">
            <Button onPress={toInstall}>Install Pulse</Button>
          </div>
        </div>
      </header>

      <main>
        {/* --------------------------------------------------------------------------- the hero */}
        <section className="relative overflow-clip">
          <div className={SHELL + ' pt-[6svh]'}>
            <h1 className="max-w-[15ch] text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.98] font-bold tracking-[-0.03em] text-balance">
              Install the language.
            </h1>
            <p className={LEAD + ' mt-6 max-w-[42ch]'}>
              Pulse is 58 React Aria components, one token set holding both
              themes, and a registry that installs them into your project.
            </p>
            <div className="mt-8">
              <Button size="lg" onPress={toInstall}>
                Install Pulse
              </Button>
            </div>
          </div>

          {/* The motif once at enormous scale: one bar the height of the screen's lower half, running off
              the right edge with its top-left corner cut like every tab on the page. The real interface
              fragment sits on it at true size and is cropped by the bottom edge. */}
          <div className="mt-[5svh] flex justify-end overflow-clip">
            <div className="shutter overflow-clip">
              <div className="bar-cut relative h-[54svh] w-[86vw] bg-primary md:h-[58svh] md:w-[48vw]">
                <div
                  data-ui
                  className="shutter-once absolute top-6 left-4 w-[620px] bg-card text-foreground md:top-10 md:left-10"
                >
                  <p className="px-5 pt-5 pb-2 text-[13px] text-foreground/70">
                    The sheet&rsquo;s own values, each holding a light and a
                    dark reading in one declaration:
                  </p>
                  <Table aria-label="Pulse colour tokens and the two readings each one holds">
                    <Table.Header>
                      <Table.Column isRowHeader>Token</Table.Column>
                      <Table.Column>light-dark(light, dark)</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {TOKENS.map((entry) => (
                        <Table.Row key={entry.token} id={entry.token}>
                          <Table.Cell>{entry.token}</Table.Cell>
                          <Table.Cell>
                            {entry.light + ' / ' + entry.dark}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                    <Table.Footer>
                      <Table.Row id="radius">
                        <Table.Cell>--radius</Table.Cell>
                        <Table.Cell>0 / 0</Table.Cell>
                      </Table.Row>
                    </Table.Footer>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- the live thing */}
        <section id="themes" className="relative overflow-clip bg-card">
          <div
            // On a phone the control is in the flow, right under the sentence it belongs to, and the
            // section is only as tall as its content: the desktop's 54svh of ground beneath the poster is
            // a composition, and on a phone it would be a hole with a control floating in it.
            className={
              SHELL +
              ' relative pt-[12svh] pb-[24svh] md:pt-[14svh] md:pb-[54svh]'
            }
          >
            <h2 data-reveal className={H2 + ' max-w-[18ch] text-balance'}>
              One value, two themes.
            </h2>
            <p
              data-reveal
              style={DELAY(80)}
              className={BODY + ' mt-5 max-w-[56ch]'}
            >
              Each colour is a single oklch value holding both themes, and a
              theme is one attribute. Nothing is redeclared, so a subtree flips
              on its own. This page does. Move the control.
            </p>

            {/* The control at the size of the section. It is the component itself, scaled: the transform
                leaves its 1px boundary, its shared dividers and its 13px labels in proportion, which is
                the point of blowing a control up rather than drawing a bigger one. */}
            <div
              data-reveal
              style={DELAY(200)}
              className="mt-12 md:absolute md:top-[62%] md:left-8 md:mt-0"
            >
              <div data-ui className="poster-control">
                <ToggleButtonGroup
                  aria-label="Theme"
                  selectionMode="single"
                  selectedKeys={[theme]}
                  onSelectionChange={(keys) => {
                    const next = [...keys][0]
                    if (
                      next === 'dark' ||
                      next === 'system' ||
                      next === 'light'
                    )
                      setTheme(next)
                  }}
                >
                  {THEMES.map((entry) => (
                    <ToggleButtonGroup.Button key={entry.id} id={entry.id}>
                      {entry.label}
                    </ToggleButtonGroup.Button>
                  ))}
                </ToggleButtonGroup>
              </div>
            </div>

            <p
              aria-live="polite"
              className={
                SMALL +
                ' absolute bottom-[6svh] left-5 max-w-[52ch] text-foreground/70 sm:left-8'
              }
            >
              This page is reading{' '}
              <span className="text-foreground">{themeName}</span>. The token
              table on the first screen repaints with it, because the attribute
              is on this page and not on the document.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------------- how it is built */}
        <section id="anatomy" className={SHELL + ' pt-[20svh] pb-[16svh]'}>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-12">
            <h2 data-reveal className={H2 + ' max-w-[22ch] md:col-span-5'}>
              Five layers, and one dependency.
            </h2>
            <p
              data-reveal
              style={DELAY(80)}
              className={BODY + ' max-w-[54ch] md:col-span-6 md:col-start-7'}
            >
              A design system is only as useful as the parts a reader can look
              at separately: the values, the behaviour under them, the anatomy
              of a control, the packaging, and the notes that say why. Open any
              of the five.
            </p>
          </div>

          <div
            data-reveal
            style={DELAY(160)}
            className="mt-16 flex h-[520px] flex-col md:flex-row"
          >
            {LAYERS.map((layer) => {
              const open = layer.id === openLayer
              return (
                <div
                  key={layer.id}
                  className={[
                    layer.tint,
                    'relative overflow-clip transition-[flex-grow] duration-500 ease-pulse',
                    // **The open panel needs its basis pinned to 0 too.** On 'auto' it bases itself on
                    // its own content, which is wider than the row: there is then no free space for the
                    // closed panels to grow into, and they collapse to nothing — one panel, no stages.
                    open
                      ? 'grow-[5.8] basis-0'
                      : 'grow-[1] basis-[64px] md:basis-0',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenLayer(layer.id)}
                    className="absolute inset-0 h-full w-full cursor-pointer outline-1 outline-offset-[-3px] outline-transparent focus-visible:outline-ring"
                  >
                    <span className="sr-only">
                      {open ? 'Close ' + layer.name : 'Open ' + layer.name}
                    </span>
                  </button>
                  <div className="pointer-events-none relative h-full">
                    {open ? (
                      <div className="flex h-full flex-col justify-between gap-8 p-6 md:flex-row md:items-stretch md:p-8">
                        <div className="md:max-w-[46%]">
                          <h3 className={NAME}>{layer.name}</h3>
                          <p
                            className={BODY + ' mt-4'}
                            dangerouslySetInnerHTML={{ __html: layer.body }}
                          />
                        </div>
                        {layer.picture ? (
                          <img
                            src={BASE + 'pulse/' + layer.picture}
                            alt=""
                            width={1600}
                            height={1000}
                            loading="lazy"
                            className="h-[42%] w-full object-cover object-top md:h-full md:w-[48%]"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <p
                        className={
                          NAME +
                          ' panel-name absolute bottom-6 left-[18px] whitespace-nowrap'
                        }
                      >
                        {layer.name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------- the examples */}
        <section id="pages" className="bg-muted pb-[10svh]">
          <div className={SHELL + ' pt-[16svh]'}>
            <h2 data-reveal className={H2 + ' max-w-[16ch] text-balance'}>
              Five pages, built with it.
            </h2>
            <p
              data-reveal
              style={DELAY(80)}
              className={BODY + ' mt-5 max-w-[58ch]'}
            >
              The repository&rsquo;s own examples, each doing one job from
              beginning to end with nothing standing in for it. They are filed
              here as folder bands, and the tab on each one carries the name at
              a tab&rsquo;s scale.
            </p>
          </div>

          <div className="mt-24">
            {WORKED.map((page, i) => (
              <article
                key={page.id}
                className="folder-band sticky bg-card"
                style={
                  {
                    top: 40 + i * 64 + 'px',
                    '--tab-x': 16 + i * 24 + 'px',
                    '--tab-w': '15rem',
                  } as React.CSSProperties
                }
              >
                {/* The name lives in the tab, not in the band's body: the next band covers the body as it
                    sticks, and a folder whose label was buried would be a folder you cannot read. */}
                <div
                  className="absolute top-0 flex h-[46px] items-center pl-5"
                  style={{ left: 'var(--tab-x)', width: 'var(--tab-w)' }}
                >
                  <h3 className={NAME}>{page.name}</h3>
                </div>
                <div className={SHELL + ' pt-[96px] pb-16'}>
                  <div className="grid gap-x-8 gap-y-8 md:grid-cols-12">
                    <div className="md:col-span-7">
                      {/* A clip of the real page stands in for the still wherever one exists: the camera
                          is the page's own, driven with its own wheel gestures. */}
                      {page.clip ? (
                        <video
                          src={BASE + 'pulse/' + page.clip}
                          poster={
                            page.poster
                              ? BASE + 'pulse/' + page.poster
                              : undefined
                          }
                          aria-label={page.alt}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="aspect-[16/10] w-full bg-card object-cover"
                        />
                      ) : (
                        <img
                          src={BASE + 'pulse/' + page.shot}
                          alt={page.alt}
                          width={1600}
                          height={1000}
                          loading="lazy"
                          className="aspect-[16/10] w-full bg-card object-cover object-top"
                        />
                      )}
                      {page.also ? (
                        <figure className="mt-4">
                          <img
                            src={BASE + 'pulse/' + page.also.shot}
                            alt={page.also.alt}
                            width={1600}
                            height={1000}
                            loading="lazy"
                            className="aspect-[16/10] w-full bg-card object-cover object-top"
                          />
                          <figcaption
                            className={
                              SMALL + ' mt-3 max-w-[68ch] text-foreground/70'
                            }
                          >
                            {page.also.caption}
                          </figcaption>
                        </figure>
                      ) : null}
                    </div>
                    <div className="md:col-span-4 md:col-start-9">
                      <p
                        className={BODY}
                        dangerouslySetInnerHTML={{ __html: page.body }}
                      />
                      <p className="mt-6">
                        <Link variant="viewmore" href={BASE + page.route + '/'}>
                          Open {page.name}
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------------- the proof */}
        <section id="measured" className={SHELL + ' pt-[20svh] pb-[16svh]'}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div data-reveal className="bg-primary p-6 text-ink sm:col-span-2">
              <h2 className={H2 + ' max-w-[24ch]'}>
                Everything here is measured.
              </h2>
              <p className={BODY + ' mt-4 max-w-[54ch]'}>
                There is nobody to quote and no logos to borrow, so the tiles
                beside this one carry what is true by construction, and each of
                them says where its number comes from.
              </p>
            </div>
            {FACTS.map((fact) => (
              <div key={fact.value} data-reveal className="bg-muted p-6">
                <p className={H2 + ' tabular-nums'}>{fact.value}</p>
                <p
                  className={BODY + ' mt-4 text-foreground/80'}
                  dangerouslySetInnerHTML={{ __html: fact.line }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ the questions */}
        <section id="questions" className="bg-card pb-[22svh]">
          <div className={SHELL + ' pt-[14svh]'}>
            <h2 data-reveal className={H2}>
              Questions, answered.
            </h2>
            <div className="mt-[8svh]">
              {QUESTIONS.map((entry, i) => {
                const open = entry.id === openQuestion
                return (
                  <div
                    key={entry.id}
                    className={['index-card', i % 2 ? 'tint-1' : 'tint-0'].join(
                      ' ',
                    )}
                    style={
                      {
                        '--tab-i': i,
                        // A card opens under the one above it; the cards below it do not close over an
                        // answer that is being read, which is what an overlap of 72px would otherwise do.
                        marginTop:
                          i === 0
                            ? 0
                            : QUESTIONS[i - 1].id === openQuestion
                              ? 0
                              : '-72px',
                      } as React.CSSProperties
                    }
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenQuestion(open ? '' : entry.id)}
                      className="absolute top-0 flex h-[44px] cursor-pointer items-center pl-5 text-[16px] underline-offset-[3px] outline-1 outline-offset-[-3px] outline-transparent hover:underline focus-visible:outline-ring"
                      style={{ left: 'var(--tab-x)', width: 'var(--tab-w)' }}
                    >
                      {entry.topic}
                    </button>
                    <div className="grid gap-x-6 gap-y-4 px-6 pt-[64px] pb-6 md:grid-cols-12 md:pt-[72px]">
                      <div className="md:col-span-5">
                        <p className="text-[20px] leading-[1.25] font-medium">
                          {entry.question}
                        </p>
                      </div>
                      <div className="md:col-span-6 md:col-start-7">
                        {open ? (
                          <p
                            className={BODY + ' max-w-[64ch]'}
                            dangerouslySetInnerHTML={{ __html: entry.answer }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------------- the install */}
        <section id="install" className="overflow-clip bg-primary text-ink">
          <div
            className={
              SHELL +
              ' grid gap-x-8 gap-y-12 pt-[16svh] pb-[14svh] md:grid-cols-12'
            }
          >
            <div className="flex flex-col justify-end md:col-span-6">
              <h2
                data-reveal
                className="text-[clamp(2.4rem,4.6vw,4rem)] leading-[0.95] font-bold tracking-[-0.03em]"
              >
                Start with
                <br />
                one component.
              </h2>
              <p
                data-reveal
                style={DELAY(80)}
                className={BODY + ' mt-6 max-w-[48ch]'}
              >
                Register the catalogue once and every item after it is an
                address of its own. What the command writes is the component,
                the tokens it paints with, and the files it imports.
              </p>
            </div>

            <div
              data-ui
              className="bg-background p-6 text-foreground md:col-span-5 md:col-start-8"
            >
              <div className="flex flex-col gap-6">
                <TextField defaultValue={namespace} onChange={setNamespace}>
                  <TextField.Label>Namespace</TextField.Label>
                  <TextField.Group>
                    <TextField.Input autoComplete="off" spellCheck={false} />
                  </TextField.Group>
                  <TextField.Hint>
                    Yours to rename. This page uses @pulse as the example.
                  </TextField.Hint>
                </TextField>

                <div>
                  <p className={SMALL + ' mb-3 text-foreground/70'}>
                    What to add
                  </p>
                  <ToggleButtonGroup
                    aria-label="What to add"
                    selectionMode="single"
                    selectedKeys={[address]}
                    onSelectionChange={(keys) => {
                      const next = [...keys][0]
                      if (next === 'library' || next === 'component')
                        setAddress(next)
                    }}
                  >
                    {ADDRESSES.map((entry) => (
                      <ToggleButtonGroup.Button key={entry.id} id={entry.id}>
                        {entry.label}
                      </ToggleButtonGroup.Button>
                    ))}
                  </ToggleButtonGroup>
                </div>

                <pre className="m-0 bg-muted p-4 font-mono text-[13px] leading-[1.8] whitespace-pre-wrap">
                  <code>{command}</code>
                </pre>

                <div className="flex flex-wrap items-center gap-6">
                  <Button onPress={copy}>
                    {copied ? 'Copied' : 'Copy command'}
                  </Button>
                  <Link variant="caps" href={BASE + 'storybook/'}>
                    Read the docs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --------------------------------------------------------------------------- the mark */}
      <footer className="bg-background pt-[14svh] pb-10">
        <div className={SHELL}>
          <div
            role="img"
            aria-label="Pulse"
            className="flex h-[26svh] max-h-[280px] items-end gap-1"
          >
            {[
              { letter: 'P', fill: 'bg-primary', height: '74%' },
              { letter: 'U', fill: 'bg-warning', height: '100%' },
              { letter: 'L', fill: 'bg-success', height: '82%' },
              { letter: 'S', fill: 'bg-destructive', height: '92%' },
              { letter: 'E', fill: 'bg-secondary', height: '66%' },
            ].map((block) => (
              <span
                key={block.letter}
                aria-hidden="true"
                className={
                  block.fill +
                  ' mark-letter flex items-end justify-center pb-2 text-[clamp(2.4rem,7vw,5.6rem)] leading-none font-bold text-ink'
                }
                style={{ '--letter-h': block.height } as React.CSSProperties}
              >
                {block.letter}
              </span>
            ))}
          </div>

          <div className="mt-[6svh] grid gap-x-8 gap-y-10 md:grid-cols-12">
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-10 gap-y-3 md:col-span-6"
            >
              <Link href={BASE + 'storybook/'} variant="caps">
                Docs
              </Link>
              <Link href={BASE + 'examples/'} variant="caps">
                Examples
              </Link>
              <Link href={BASE + 'create/'} variant="caps">
                Create a theme
              </Link>
              <Link href={BASE + 'canvas/'} variant="caps">
                Canvas
              </Link>
            </nav>
            <p
              className={
                SMALL + ' text-foreground/70 md:col-span-5 md:col-start-8'
              }
            >
              Pulse is a dark-first monitoring design language, replicated from
              the source sheet beside this repository. The pictures on this page
              are screenshots of this app&rsquo;s own pages, taken from a
              running build.
            </p>
          </div>

          <p className={SMALL + ' mt-10 text-foreground/60'}>
            The tokens are in{' '}
            <Link href="https://github.com/Jimlah/design-system/blob/main/src/styles.css">
              src/styles.css
            </Link>
            , and the decisions behind each component sit beside it. This page
            argues for the library; the documentation is the reference.
          </p>
        </div>
      </footer>
    </div>
  )
}
