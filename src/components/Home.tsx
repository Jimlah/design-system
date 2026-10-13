import { useMemo, useState } from 'react'

import { Accordion } from './Accordion/Accordion'
import { Avatar } from './Avatar/Avatar'
import { BarChart } from './BarChart/BarChart'
import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs'
import { Button } from './Button/Button'
import { ColorField } from './ColorField/ColorField'
import { ColorSwatch } from './ColorSwatch/ColorSwatch'
import { ColorSwatchPicker } from './ColorSwatchPicker/ColorSwatchPicker'
import { ComboBox } from './ComboBox/ComboBox'
import { DatePicker } from './DatePicker/DatePicker'
import { DateRangePicker } from './DateRangePicker/DateRangePicker'
import { DotMap } from './DotMap/DotMap'
import { DropZone } from './DropZone/DropZone'
import { WORLD_DOTS } from './DotMap/worldDots'
import { FlatLine } from './FlatLine/FlatLine'
import { Form } from './Form/Form'
import { Link } from './Link/Link'
import { Meter } from './Meter/Meter'
import { NumberField } from './NumberField/NumberField'
import { ProgressBar } from './ProgressBar/ProgressBar'
import { Radio } from './Radio/Radio'
import { SearchField } from './SearchField/SearchField'
import { Select } from './Select/Select'
import { Separator } from './Separator/Separator'
import { Slider } from './Slider/Slider'
import { Sparkline } from './Sparkline/Sparkline'
import { Switch } from './Switch/Switch'
import { Table } from './Table/Table'
import { Tabs } from './Tabs/Tabs'
import { TagGroup } from './TagGroup/TagGroup'
import { TextArea } from './TextArea/TextArea'
import { TextField } from './TextField/TextField'
import { TimeField } from './TimeField/TimeField'
import { TokenField } from './TokenField/TokenField'
import { Toolbar } from './Toolbar/Toolbar'

/**
 * The app's landing page, and the one place in this repo where the components are *used* at length
 * rather than documented one at a time.
 *
 * **The component index is derived, not typed out.** The previous version of this page said why: a
 * hand-written list of components "goes stale the first time one is added", which is the same drift the
 * shared `field.ts`, `date.tsx` and `popover.ts` constants exist to prevent. It was right — so this reads
 * the directory with `import.meta.glob` instead. Add a component and it appears here with no edit, which
 * is the only version of "use all the components" that stays true.
 *
 * **Every section is a component doing its actual job**, not a gallery: the charts show the system's own
 * build metrics, the table is the component list as data, the form is a real form, and the overlays are
 * where a reader would expect them. A landing page that lines components up in boxes tells you nothing
 * about whether they work together.
 *
 * The SSR check is still the reason this file exists at all: React Aria ships a `client-only` guard, so
 * rendering real components through TanStack Start's server render is the cheapest proof the components
 * and the app agree.
 */

/** Every component directory, with its stories. Vite resolves this at build time. */
const SOURCES = import.meta.glob('./*/*.tsx')

interface Entry {
  name: string
  group: string
}

/** The component index, read off the filesystem so a new component cannot be forgotten. */
function useComponentIndex() {
  return useMemo<Entry[]>(() => {
    const groups: Record<string, string[]> = {
      Inputs: [
        'Button',
        'Checkbox',
        'ColorField',
        'ComboBox',
        'DateField',
        'DatePicker',
        'DateRangePicker',
        'NumberField',
        'Radio',
        'SearchField',
        'Select',
        'Slider',
        'Switch',
        'TextArea',
        'TextField',
        'TimeField',
        'ToggleButton',
        'ToggleButtonGroup',
        'TokenField',
        'Toolbar',
      ],
      Collections: [
        'Accordion',
        'GridList',
        'ListBox',
        'Nav',
        'Table',
        'Tabs',
        'TagGroup',
        'Tree',
        'Virtualizer',
      ],
      Overlays: [
        'Menu',
        'Modal',
        'Popover',
        'Sheet',
        'Toast',
        'Tooltip',
        'OverlayArrow',
      ],
      Charts: [
        'BarChart',
        'DotMap',
        'FlatLine',
        'Meter',
        'ProgressBar',
        'Sparkline',
      ],
      Display: [
        'Avatar',
        'Breadcrumbs',
        'Calendar',
        'Card',
        'ColorSwatch',
        'ColorSwatchPicker',
        'DropZone',
        'Form',
        'Link',
        'RangeCalendar',
        'Separator',
        'SharedElement',
        'VisuallyHidden',
      ],
    }
    // `./Button/Button.tsx` and friends. Stories are excluded, and a directory whose name does not match
    // its file is skipped — the two must agree, which the compound-export rule already requires.
    // `./Button/Button.tsx` in; `./Button/Button.stories.tsx` and anything not capitalised out.
    // **The glob is deliberately broad.** A narrower pattern — `./*/[A-Z]*.tsx` — silently matched only
    // some directories, so the index listed 20 of 54 components while claiming to be derived. That is
    // the same failure this whole approach exists to prevent, one level down.
    const found = new Set(
      Object.keys(SOURCES)
        .filter((path) => !path.includes('.stories.'))
        .map((path) => path.split('/').pop() ?? '')
        .filter((file) => /^[A-Z]/.test(file))
        .map((file) => file.replace(/\.tsx$/, '')),
    )
    return Object.entries(groups).flatMap(([group, names]) =>
      names.filter((name) => found.has(name)).map((name) => ({ name, group })),
    )
  }, [])
}

const METRICS = [12, 19, 14, 26, 22, 31, 27, 38, 34, 44, 39, 51]
const HOURS = ['00', '04', '08', '12', '16', '20']

const RECENT = [
  { name: 'Popover', state: 'Passing', checks: 6 },
  { name: 'Tree', state: 'Passing', checks: 5 },
  { name: 'Virtualizer', state: 'Trimmed', checks: 2 },
  { name: 'DotMap', state: 'Passing', checks: 3 },
]

/**
 * The registry's public address — the string a consumer copies, and the same one in
 * `registry.json`'s `homepage` and in the README's commands.
 *
 * **Written out, not derived from `import.meta.env.BASE_URL`.** The base is the right shape on
 * Pages and the wrong one in dev, where it is `/`: deriving it would document
 * `https://…/r/button.json`, an address that has never existed. A reader in dev is reading about
 * the deployed registry, so the deployed address is the honest one to print.
 */
const REGISTRY_URL = 'https://jimlah.github.io/design-system/r'

/** Prose that explains a command, at the page's hint weight. */
const NOTE = 'mt-3 text-[13px] leading-[1.6] text-foreground/60'

/**
 * A command a reader is meant to copy. One component rather than the same `<pre>` three times, so
 * the three addresses cannot drift apart in style.
 *
 * `whitespace-pre-wrap` rather than a horizontal scrollbar: the namespace command is wider than a
 * half-width column, and a scrollbar would hide the end of the one line a reader has to check. A
 * soft wrap copies as a single line, so the command still pastes intact.
 */
function Command({ children }: { children: string }) {
  return (
    <pre className="mt-3 border border-border-strong bg-card p-4 font-mono text-[12px] leading-[1.9] whitespace-pre-wrap">
      <code>{children}</code>
    </pre>
  )
}

export function Home() {
  const index = useComponentIndex()
  const [query, setQuery] = useState('')

  const shown = index.filter((entry) =>
    entry.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <Breadcrumbs>
        <Breadcrumbs.Item href="#top">Design system</Breadcrumbs.Item>
        <Breadcrumbs.Item>Overview</Breadcrumbs.Item>
      </Breadcrumbs>

      <section
        id="top"
        className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div>
          <p className="font-mono text-[12px] tracking-[0.08em] text-primary uppercase">
            {index.length} components · {RECENT.length} suites green
          </p>
          <h1 className="mbs-4 text-(length:--text-display) leading-[1.05] font-semibold tracking-[-0.02em]">
            Pulse
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-foreground/70">
            React Aria for behaviour, Tailwind for the styling, and one set of
            tokens in <code className="text-foreground">src/styles.css</code>{' '}
            for both themes. Every component is documented beside its source,
            and this page uses them rather than describing them — and the whole
            library is published as a registry, so another project installs it
            instead of copying it.
          </p>
          <Toolbar aria-label="Page actions" className="mt-6">
            <Button
              onPress={() =>
                document
                  .getElementById('components')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Browse components
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                document
                  .getElementById('charts')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              See the charts
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                document
                  .getElementById('registry')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Install the registry
            </Button>
            {/*
              **Create is an action of this page, not a footnote in its registry section.** It is the
              one thing here a reader can *do* to the system rather than read about it: a base colour, an
              accent hue, a corner and a typeface, and the token block that falls out. A link, for the
              same reason the docs link beside it is one — middle-click and "open in a new tab" are most
              of what a link is for, and `BASE_URL` is what keeps it working under the Pages subpath.
            */}
            <Link variant="caps" href={`${import.meta.env.BASE_URL}create/`}>
              Create a theme
            </Link>
            {/*
              **A link that navigates is an anchor, not a button.** This was a `Button` with no
              handler, so it did nothing at all — and a button that opens a new address also gives up
              middle-click and "open in a new tab", which is most of what a link to the docs is for.
              The destination is the Storybook build the app serves at `/storybook/` in dev, in
              `vite preview` and on Pages alike; see `storybookBuild()` in vite.config.ts. Read from
              `BASE_URL` rather than written as `/storybook/`, because on Pages this whole app is
              mounted under a repository subpath.
            */}
            <Link variant="caps" href={`${import.meta.env.BASE_URL}storybook/`}>
              Read the docs
            </Link>
            {/*
              **One link to every worked example, rather than one per example.** The board used to be
              here on its own, and the leads dashboard would have made two — a toolbar that grows a
              link per page is a toolbar that has become a table of contents. `/examples` is that
              table of contents, and it lists the board, the dashboard, Create, the sign-in page and
              this page itself, so nothing is reachable only from the page that happens to link it.
            */}
            <Link variant="caps" href={`${import.meta.env.BASE_URL}examples/`}>
              See the examples
            </Link>
          </Toolbar>
        </div>

        <aside className="flex flex-col gap-4 border border-border-strong bg-card p-5">
          <Meter value={82}>
            <Meter.Header>
              <Meter.Label>Token coverage</Meter.Label>
              <Meter.Value />
            </Meter.Header>
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
          <Separator />
          <ProgressBar value={64}>
            <ProgressBar.Header>
              <ProgressBar.Label>Dark contrast, 4.5:1</ProgressBar.Label>
              <ProgressBar.Value />
            </ProgressBar.Header>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar alt="Ada Lovelace" color="primary" size="lg" />
            <div>
              <p className="text-[13px] text-foreground">Ada Lovelace</p>
              <p className="font-mono text-[11px] tracking-[0.04em] text-foreground/60 uppercase">
                maintainer
              </p>
            </div>
          </div>
        </aside>
      </section>

      <Separator className="my-12" />

      <section id="charts" className="grid gap-8 md:grid-cols-2">
        <div className="border border-border-strong bg-card p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
            Stories written
          </p>
          <Sparkline
            data={METRICS}
            label="Stories written, last twelve weeks"
            className="mt-4 h-[84px] w-full"
          />
        </div>

        <div className="border border-border-strong bg-card p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
            Checks per suite
          </p>
          <BarChart
            values={[6, 5, 8, 11, 7, 4]}
            labels={HOURS}
            highlightIndex={3}
            width={420}
            height={120}
            label="Checks per suite"
            className="mt-4"
          />
        </div>

        <div className="border border-border-strong bg-card p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
            Uptime, no variation
          </p>
          <FlatLine
            label="Uptime, 100%"
            height={72}
            lineY={4}
            className="mt-4 h-[72px] w-full"
          />
        </div>

        <div className="border border-border-strong bg-card p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
            Where the stories are read
          </p>
          <DotMap
            dots={WORLD_DOTS}
            width={420}
            height={140}
            label="Where the stories are read"
            className="mt-4"
          />
        </div>
      </section>

      <Separator className="my-12" />

      <section id="components">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.01em]">
              Components
            </h2>
            <p className="mt-2 text-[14px] text-foreground/70">
              Read from the directory, so adding one is enough.
            </p>
          </div>
          <SearchField
            aria-label="Filter components"
            value={query}
            onChange={setQuery}
            className="w-64"
          >
            <SearchField.Label>Filter</SearchField.Label>
            <SearchField.Group>
              <SearchField.Icon />
              <SearchField.Input placeholder="Search components" />
            </SearchField.Group>
          </SearchField>
        </div>

        <Tabs className="mt-6">
          <Tabs.List aria-label="Component groups">
            {['Inputs', 'Collections', 'Overlays', 'Charts', 'Display'].map(
              (group) => (
                <Tabs.Tab key={group} id={group}>
                  {group}
                </Tabs.Tab>
              ),
            )}
          </Tabs.List>
          <Tabs.Panels>
            {['Inputs', 'Collections', 'Overlays', 'Charts', 'Display'].map(
              (group) => (
                <Tabs.Panel key={group} id={group}>
                  <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-px border border-border-strong bg-border-soft">
                    {shown
                      .filter((entry) => entry.group === group)
                      .map((entry) => (
                        <li key={entry.name} className="bg-card">
                          <Link
                            // The Storybook build lives beside this page — served by the app at
                            // /storybook/ in dev and preview (see vite.config.ts) and copied in as
                            // `storybook/` for the Pages build. Read from `BASE_URL` rather than
                            // written as `/storybook/`, because on Pages this whole app is mounted
                            // at /design-system/ and an absolute root path would leave the site.
                            // The trailing slash is load-bearing: it is what makes Storybook's own
                            // relative asset URLs resolve under the prefix, not against the root.
                            href={`${import.meta.env.BASE_URL}storybook/?path=/docs/components-${entry.name.toLowerCase()}--docs`}
                            variant="caps"
                            className="block px-4 py-3"
                          >
                            <span className="font-mono text-[13px] tracking-[0.02em] text-foreground">
                              {entry.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    {shown.filter((entry) => entry.group === group).length ===
                    0 ? (
                      <li className="bg-card px-4 py-3 font-mono text-[12px] text-foreground/50 uppercase">
                        nothing here
                      </li>
                    ) : null}
                  </ul>
                </Tabs.Panel>
              ),
            )}
          </Tabs.Panels>
        </Tabs>
      </section>

      <Separator className="my-12" />

      <section id="registry">
        <h2 className="text-[24px] font-semibold tracking-[-0.01em]">
          Registry
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] text-foreground/70">
          The same components are published as a shadcn registry, so another
          project installs them instead of copying them: one theme, one bundle,
          and one item per component, served from this site as static JSON.
        </p>
        <p className="mt-3 max-w-2xl text-[14px] text-foreground/70">
          The theme is not fixed either.{' '}
          <Link variant="url" href={`${import.meta.env.BASE_URL}create/`}>
            Create one
          </Link>{' '}
          from a base colour, an accent hue and a typeface, and the block it
          hands back replaces the values every one of these components reads.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
              Install
            </h3>
            <Tabs className="mt-3">
              <Tabs.List aria-label="Registry addresses">
                <Tabs.Tab id="namespace">Namespace</Tabs.Tab>
                <Tabs.Tab id="url">URL</Tabs.Tab>
                <Tabs.Tab id="github">GitHub</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel id="namespace">
                  <Command>{`npx shadcn@latest registry add @pulse=${REGISTRY_URL}/{name}.json
npx shadcn@latest add @pulse/button`}</Command>
                  <p className={NOTE}>
                    Register the catalogue once; after that every item is an
                    address of its own. The whole library is{' '}
                    <code>@pulse/pulse</code>.
                  </p>
                </Tabs.Panel>
                <Tabs.Panel id="url">
                  <Command>{`npx shadcn@latest add ${REGISTRY_URL}/button.json`}</Command>
                  <p className={NOTE}>
                    No namespace needed. An item carries everything it needs, so
                    it installs from any address.
                  </p>
                </Tabs.Panel>
                <Tabs.Panel id="github">
                  <Command>{`npx shadcn@latest add Jimlah/design-system/button`}</Command>
                  <p className={NOTE}>
                    Reads <code>registry.json</code> straight out of the
                    repository — no deployment involved.
                  </p>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs>
          </div>

          <div>
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
              What is in it
            </h3>
            <Table aria-label="Registry items" className="mt-3">
              <Table.Header>
                <Table.Column isRowHeader>Item</Table.Column>
                <Table.Column>Type</Table.Column>
                <Table.Column>Installs</Table.Column>
              </Table.Header>
              <Table.Body>
                <Table.Row id="theme">
                  <Table.Cell>@pulse/theme</Table.Cell>
                  <Table.Cell>theme</Table.Cell>
                  <Table.Cell>
                    The tokens, the base layer, and Overpass Mono
                  </Table.Cell>
                </Table.Row>
                <Table.Row id="bundle">
                  <Table.Cell>@pulse/pulse</Table.Cell>
                  <Table.Cell>block</Table.Cell>
                  <Table.Cell>All {index.length} components at once</Table.Cell>
                </Table.Row>
                <Table.Row id="component">
                  <Table.Cell>{'@pulse/<component>'}</Table.Cell>
                  <Table.Cell>ui</Table.Cell>
                  <Table.Cell>
                    One component, and every file it imports
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </div>
        </div>

        <Accordion className="mt-8" defaultExpandedKeys={['arrives']}>
          <Accordion.Item id="arrives">
            <Accordion.Header>
              What arrives with one component?
            </Accordion.Header>
            <Accordion.Panel>
              The tokens and the base layer travel inside every item, so a
              component installed on its own still has the colours it paints. So
              does every file it imports: <code>@pulse/select</code> brings{' '}
              <code>SearchField</code> and <code>field.ts</code> with it, and
              there is nothing to add by hand.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item id="dependency">
            <Accordion.Header>
              Why is the theme in every item, and not a dependency?
            </Accordion.Header>
            <Accordion.Panel>
              Because a <code>registryDependencies</code> entry does not survive
              the trip. <code>./theme.json</code> resolves against the
              consumer's working directory, a bare name resolves against the
              shadcn/ui registry, and <code>@pulse/theme</code> needs the
              namespace registered first. An item that carries its own tokens
              installs from any of the three addresses above.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item id="layout">
            <Accordion.Header>
              Where do the files land, and where is the typeface?
            </Accordion.Header>
            <Accordion.Panel>
              Under your <code>aliases.ui</code>, as{' '}
              <code>pulse/&lt;Name&gt;/&lt;Name&gt;.tsx</code> — the layout of{' '}
              <code>src/components</code>, which is what keeps the relative
              imports resolving, so with the usual <code>@/components/ui</code>{' '}
              alias a Button arrives as{' '}
              <code>@/components/ui/pulse/Button/Button</code>. Overpass Mono
              rides on <code>@pulse/theme</code> rather than on every item:
              adding a Button should not also install a font package.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item id="current">
            <Accordion.Header>How is it kept current?</Accordion.Header>
            <Accordion.Panel>
              <code>registry.json</code> is generated from the components,{' '}
              <code>src/styles.css</code> and the docs beside them;{' '}
              <code>npm run registry:build</code> rebuilds it and the JSON this
              site serves. CI fails when the committed copy is stale, so a
              component added without regenerating it cannot ship quietly.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <p className="mt-6 max-w-2xl text-[13px] leading-[1.6] text-foreground/60">
          The longer notes — why the items are shaped this way, what the CLI
          writes into a consumer's stylesheet, and how each claim was measured —
          live in{' '}
          <Link
            variant="url"
            href="https://github.com/Jimlah/design-system/blob/main/docs/registry.md"
          >
            docs/registry.md
          </Link>
          .
        </p>
      </section>

      <Separator className="my-12" />

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
            Recent suites
          </h2>
          <Table aria-label="Recent component suites" className="mt-4">
            <Table.Header>
              <Table.Column isRowHeader>Component</Table.Column>
              <Table.Column>State</Table.Column>
              <Table.Column>Checks</Table.Column>
            </Table.Header>
            <Table.Body>
              {RECENT.map((row) => (
                <Table.Row key={row.name} id={row.name}>
                  <Table.Cell>{row.name}</Table.Cell>
                  <Table.Cell>{row.state}</Table.Cell>
                  <Table.Cell>{row.checks}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
            Questions
          </h2>
          <Accordion className="mt-4" defaultExpandedKeys={['tokens']}>
            <Accordion.Item id="tokens">
              <Accordion.Header>Where do the tokens live?</Accordion.Header>
              <Accordion.Panel>
                In <code>src/styles.css</code>, in shadcn&apos;s shape: the
                values under <code>:root</code>, and one{' '}
                <code>@theme inline</code> that turns them into utilities. Both
                themes are <code>light-dark()</code> pairs, so switching only
                moves <code>color-scheme</code>.
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item id="behaviour">
              <Accordion.Header>
                Why React Aria rather than hand-rolled?
              </Accordion.Header>
              <Accordion.Panel>
                Focus, keyboard and screen-reader behaviour are the parts of a
                component that are expensive to get right and cheap to get
                subtly wrong. Every interactive piece here wraps a primitive.
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>
      </section>

      <Separator className="my-12" />

      <section
        id="foundations"
        className="grid gap-10 md:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
            Send a report
          </h2>
          <Form className="mt-4">
            <Form.Section>
              <TextField isRequired>
                <TextField.Label>Title</TextField.Label>
                <TextField.Group>
                  <TextField.Input placeholder="Something broke" />
                </TextField.Group>
                <TextField.Hint>
                  One line, as it would read in a list.
                </TextField.Hint>
              </TextField>

              <Select defaultSelectedKey="bug">
                <Select.Label>Kind</Select.Label>
                <Select.Button>
                  <Select.Value />
                  <Select.Icon />
                </Select.Button>
                <Select.Popover>
                  <Select.OptionList>
                    <Select.Option id="bug">Bug</Select.Option>
                    <Select.Option id="idea">Idea</Select.Option>
                  </Select.OptionList>
                </Select.Popover>
              </Select>

              <ComboBox>
                <ComboBox.Label>Component</ComboBox.Label>
                <ComboBox.Group>
                  <ComboBox.Input />
                  <ComboBox.Button>
                    <ComboBox.Icon />
                  </ComboBox.Button>
                </ComboBox.Group>
                <ComboBox.Popover>
                  <ComboBox.OptionList>
                    {index.slice(0, 8).map((entry) => (
                      <ComboBox.Option key={entry.name} id={entry.name}>
                        {entry.name}
                      </ComboBox.Option>
                    ))}
                  </ComboBox.OptionList>
                </ComboBox.Popover>
              </ComboBox>

              <TextArea>
                <TextArea.Label>What happened</TextArea.Label>
                <TextArea.Input
                  rows={3}
                  placeholder="Steps, expected, actual"
                />
              </TextArea>

              <TokenField>
                <TokenField.Label>Affected regions</TokenField.Label>
                <TokenField.Input />
              </TokenField>

              <NumberField defaultValue={3} minValue={1} maxValue={10}>
                <NumberField.Label>Severity</NumberField.Label>
                <NumberField.Group>
                  <NumberField.Input />
                  <NumberField.Counter />
                </NumberField.Group>
              </NumberField>

              <Slider defaultValue={60}>
                <Slider.Header>
                  <Slider.Label>Confidence</Slider.Label>
                  <Slider.Value />
                </Slider.Header>
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>

              <DateRangePicker>
                <DateRangePicker.Label>Window</DateRangePicker.Label>
                <DateRangePicker.Group>
                  <DateRangePicker.Input />
                  <DateRangePicker.Button />
                </DateRangePicker.Group>
              </DateRangePicker>

              <div className="flex flex-wrap gap-6">
                <DatePicker>
                  <DatePicker.Label>Seen on</DatePicker.Label>
                  <DatePicker.Group>
                    <DatePicker.Input />
                    <DatePicker.Button />
                  </DatePicker.Group>
                </DatePicker>

                <TimeField>
                  <TimeField.Label>At</TimeField.Label>
                  <TimeField.Group>
                    <TimeField.Input />
                  </TimeField.Group>
                </TimeField>
              </div>

              <ColorField defaultValue="#71FFF6">
                <ColorField.Label>Label colour</ColorField.Label>
                <ColorField.Control>
                  <ColorField.Input />
                  <ColorField.Swatch />
                </ColorField.Control>
              </ColorField>

              <Switch defaultSelected>Notify the on-call rota</Switch>

              <Radio.Group defaultValue="b" aria-label="Blast radius">
                <Radio value="a">
                  <Radio.Indicator />
                  <Radio.Text>One region</Radio.Text>
                </Radio>
                <Radio value="b">
                  <Radio.Indicator />
                  <Radio.Text>One cluster</Radio.Text>
                </Radio>
              </Radio.Group>
            </Form.Section>
            <Form.Actions>
              <Button type="submit">Send report</Button>
              <Button variant="ghost" type="reset">
                Clear
              </Button>
            </Form.Actions>
          </Form>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
              Palette
            </h3>
            <ColorSwatchPicker className="mt-3">
              {['#71FFF6', '#FAD14F', '#B0FBB1', '#FF9A8B', '#BFBFBF'].map(
                (color) => (
                  <ColorSwatchPicker.Item key={color} color={color}>
                    <ColorSwatch color={color} />
                  </ColorSwatchPicker.Item>
                ),
              )}
            </ColorSwatchPicker>
          </div>

          <div>
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-foreground/60 uppercase">
              Treatments
            </h3>
            <TagGroup aria-label="Tag treatments" className="mt-3">
              <TagGroup.List>
                <TagGroup.Tag id="a" variant="teal">
                  teal
                </TagGroup.Tag>
                <TagGroup.Tag id="b" variant="yellow">
                  warning
                </TagGroup.Tag>
                <TagGroup.Tag id="c" variant="gray">
                  muted
                </TagGroup.Tag>
              </TagGroup.List>
            </TagGroup>
          </div>

          <DropZone>
            <DropZone.Title>Drop a screenshot</DropZone.Title>
            <DropZone.Hint>PNG or JPG, up to 4MB.</DropZone.Hint>
          </DropZone>
        </div>
      </section>
      <Separator className="my-12" />
    </main>
  )
}
