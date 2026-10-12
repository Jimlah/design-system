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
          <p className="font-mono text-[12px] tracking-[0.08em] text-teal uppercase">
            {index.length} components · {RECENT.length} suites green
          </p>
          <h1 className="mt-4 text-[40px] leading-[1.05] font-semibold tracking-[-0.02em]">
            Pulse
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-fg/70">
            React Aria for behaviour, Tailwind for the styling, and one set of
            tokens in <code className="text-fg">src/styles.css</code> for both
            themes. Every component is documented beside its source, and this
            page uses them rather than describing them.
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
            <Button variant="ghost">Read the docs</Button>
          </Toolbar>
        </div>

        <aside className="border border-line-strong bg-panel p-5">
          <Meter value={82}>
            <Meter.Header>
              <Meter.Label>Token coverage</Meter.Label>
              <Meter.Value />
            </Meter.Header>
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
          <Separator className="my-4" />
          <ProgressBar value={64}>
            <ProgressBar.Header>
              <ProgressBar.Label>Dark contrast, 4.5:1</ProgressBar.Label>
              <ProgressBar.Value />
            </ProgressBar.Header>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <Separator className="my-4" />
          <div className="flex items-center gap-3">
            <Avatar alt="Ada Lovelace" color="primary" size="lg" />
            <div>
              <p className="text-[13px] text-fg">Ada Lovelace</p>
              <p className="font-mono text-[11px] tracking-[0.04em] text-fg/60 uppercase">
                maintainer
              </p>
            </div>
          </div>
        </aside>
      </section>

      <Separator className="my-12" />

      <section id="charts" className="grid gap-8 md:grid-cols-2">
        <div className="border border-line-strong bg-panel p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
            Stories written
          </p>
          <Sparkline
            data={METRICS}
            label="Stories written, last twelve weeks"
            className="mt-4 h-[84px] w-full"
          />
        </div>

        <div className="border border-line-strong bg-panel p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
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

        <div className="border border-line-strong bg-panel p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
            Uptime, no variation
          </p>
          <FlatLine
            label="Uptime, 100%"
            height={72}
            lineY={4}
            className="mt-4 h-[72px] w-full"
          />
        </div>

        <div className="border border-line-strong bg-panel p-5">
          <p className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
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
            <p className="mt-2 text-[14px] text-fg/70">
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
                  <ul className="grid gap-px border border-line-strong bg-line-soft sm:grid-cols-3">
                    {shown
                      .filter((entry) => entry.group === group)
                      .map((entry) => (
                        <li key={entry.name} className="bg-panel">
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
                            <span className="font-mono text-[13px] tracking-[0.02em] text-fg">
                              {entry.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    {shown.filter((entry) => entry.group === group).length ===
                    0 ? (
                      <li className="bg-panel px-4 py-3 font-mono text-[12px] text-fg/50 uppercase">
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
                One <code>@theme</code> block in <code>src/styles.css</code>.
                Both themes are <code>light-dark()</code> pairs, so switching
                only moves <code>color-scheme</code>.
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
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
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
            <h3 className="font-mono text-[12px] tracking-[0.06em] text-fg/60 uppercase">
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
