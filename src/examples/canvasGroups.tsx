import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import {
  FileTrigger,
  ListLayout,
  parseColor,
  TokenFieldValue,
} from 'react-aria-components'
import { parseDate, parseTime } from '@internationalized/date'

import { Accordion } from '../components/Accordion/Accordion'
import { ActionBar } from '../components/ActionBar/ActionBar'
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
import { WORLD_DOTS } from '../components/DotMap/worldDots'
import { DotMap } from '../components/DotMap/DotMap'
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
import { OverlayArrow } from '../components/OverlayArrow/OverlayArrow'
import { Popover } from '../components/Popover/Popover'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { Radio } from '../components/Radio/Radio'
import { RangeCalendar } from '../components/RangeCalendar/RangeCalendar'
import { SearchField } from '../components/SearchField/SearchField'
import { Select } from '../components/Select/Select'
import { Separator } from '../components/Separator/Separator'
import {
  SharedElement,
  SharedElementTransition,
} from '../components/SharedElement/SharedElement'
import { Sheet } from '../components/Sheet/Sheet'
import { Skeleton } from '../components/Skeleton/Skeleton'
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
import { Virtualizer } from '../components/Virtualizer/Virtualizer'
import { VisuallyHidden } from '../components/VisuallyHidden/VisuallyHidden'

/**
 * What is on the canvas — every group, every row and every preview, as data.
 *
 * **This file is the sample data and nothing else.** It does not position anything and it does not
 * know where the camera is; the layout is in ComponentCanvas.tsx and the arithmetic is in
 * canvasCamera.ts. The one thing a preview declares that the layout obeys is its `span`, because
 * how much room a component needs is a property of the component rather than of the plane.
 *
 * Three rules shape the rows, and they are the reason a group has *rows* rather than a flat list:
 *
 * - **One row changes one thing.** A row is named for the prop or the feature it varies, and every
 *   slot in it is the same width, the same component and the same sample data. A variant comparison
 *   holds size and colour; a size comparison holds the variant.
 * - **Every named variant of every prop in scope is present**, plus the states a reader cannot reach
 *   with a pointer — `isDisabled`, `isPending`, `isReadOnly`, `isInvalid`, an open collection.
 *   Hover, focus and pressed are **not** rows: they are what those components do when a person
 *   points at them, and the canvas is live, so the way to see them is to use one.
 * - **Nothing here invents a prop.** Every value written below is one the component's own type
 *   publishes; a prop that is not in `src/components/<Name>/<Name>.tsx` is not in this file.
 *
 * The categories are the ones `scripts/build-registry.mjs` already files every component under, so
 * the canvas and the registry say the same thing about what kind of thing a component is.
 */

/** How much of a row a slot takes: a third, a half, or all of it. */
export type CanvasSpan = 'narrow' | 'medium' | 'wide'

export interface CanvasPreview {
  /** Stable within its group, and the last part of the preview's `data-preview` value. */
  key: string
  /** The slot's accessible name: what this example shows, not what it is. */
  label: string
  /** Defaults to `narrow`. */
  span?: CanvasSpan
  /** A component rather than an element, so a preview can hold state of its own. */
  Component: () => ReactNode
}

export interface CanvasRow {
  /** The one thing this row varies. Rendered above it, so a comparison explains itself. */
  axis: string
  previews: CanvasPreview[]
}

export interface CanvasGroup {
  /** The hash a link to this group uses. */
  id: string
  title: string
  rows: CanvasRow[]
}

export interface CanvasCategory {
  id: string
  title: string
  groups: CanvasGroup[]
}

/* -------------------------------------------------------------------------------------------- */
/* The glyphs                                                                                    */
/*                                                                                             */
/* This system ships no icon set - an icon is content, which is what dashboardIcons.tsx says over */
/* on the leads page. Three glyphs are needed here and they are drawn the same way every other   */
/* one in this repo is: a 16-unit grid in a 1.4 stroke of currentColor, so an icon takes the     */
/* colour of whatever it sits in and needs no theme of its own.                                  */
/* -------------------------------------------------------------------------------------------- */

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** The sheet's own caret, from Button's story. No width or height: Button.Icon sizes it. */
export function Caret() {
  return (
    <Glyph>
      <path d="M2.5 5.5L8 11L13.5 5.5" />
    </Glyph>
  )
}

/** A plus, for the icon-only buttons. */
export function Plus() {
  return (
    <Glyph>
      <path d="M8 3v10M3 8h10" />
    </Glyph>
  )
}

/** A magnifier, for the search field and the icon-button row. */
export function Search() {
  return (
    <Glyph>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </Glyph>
  )
}

/** Four squares, for the nav's icon column. */
export function Grid() {
  return (
    <Glyph>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" />
      <rect x="9" y="2.5" width="4.5" height="4.5" />
      <rect x="2.5" y="9" width="4.5" height="4.5" />
      <rect x="9" y="9" width="4.5" height="4.5" />
    </Glyph>
  )
}

/** A tick, for the fields that show a verified value. */
export function Tick() {
  return (
    <Glyph>
      <path d="M3 8.5L6.5 12L13 4.5" />
    </Glyph>
  )
}

/** A slot: its label is not always just the axis and its value, and its span is not always a third. */
function one(
  key: string,
  label: string,
  Component: () => ReactNode,
  span?: CanvasSpan,
): CanvasPreview {
  return span ? { key, label, Component, span } : { key, label, Component }
}

/* -------------------------------------------------------------------------------------------- */
/* The anatomies that repeat                                                                     */
/*                                                                                              */
/* These are not extra components and they are not part of the canvas: they are the shapes the   */
/* rows below would otherwise write out four times each, with only the prop under test changing. */
/* -------------------------------------------------------------------------------------------- */

const box = (
  props: ComponentProps<typeof Checkbox>,
  text = 'Alert on failure',
) => (
  <Checkbox {...props}>
    <Checkbox.Indicator />
    <Checkbox.Text>{text}</Checkbox.Text>
  </Checkbox>
)

const radio = (
  value: string,
  text: string,
  props?: Omit<ComponentProps<typeof Radio>, 'value' | 'children'>,
) => (
  <Radio value={value} {...props}>
    <Radio.Indicator />
    <Radio.Text>{text}</Radio.Text>
  </Radio>
)

const toggle = (
  props?: ComponentProps<typeof Switch>,
  text = 'Auto-retry failed checks',
) => (
  <Switch {...props}>
    <Switch.Indicator />
    <Switch.Text>{text}</Switch.Text>
  </Switch>
)

const textField = (props?: ComponentProps<typeof TextField>) => (
  <TextField {...props}>
    <TextField.Label>Hostname</TextField.Label>
    <TextField.Group>
      <TextField.Input placeholder="api.example.com" />
    </TextField.Group>
    <TextField.Hint>Lowercase alphanumeric and dashes only.</TextField.Hint>
  </TextField>
)

const search = (props?: ComponentProps<typeof SearchField>) => (
  <SearchField {...props}>
    <SearchField.Label>Search monitors</SearchField.Label>
    <SearchField.Group>
      <SearchField.Icon />
      <SearchField.Input placeholder="Filter by name or URL" />
    </SearchField.Group>
  </SearchField>
)

const number = (props?: ComponentProps<typeof NumberField>) => (
  <NumberField defaultValue={60} minValue={5} maxValue={600} {...props}>
    <NumberField.Label>Interval</NumberField.Label>
    <NumberField.Group>
      <NumberField.Input />
      <NumberField.Counter />
    </NumberField.Group>
    <NumberField.Hint>Seconds between checks.</NumberField.Hint>
  </NumberField>
)

const select = (props?: ComponentProps<typeof Select>) => (
  <Select defaultSelectedKey="https" {...props}>
    <Select.Label>Protocol</Select.Label>
    <Select.Button>
      <Select.Value />
      <Select.Icon />
    </Select.Button>
    <Select.Popover>
      <Select.OptionList>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
        <Select.Option id="tcp">TCP</Select.Option>
      </Select.OptionList>
    </Select.Popover>
    <Select.Hint>Applies to every check.</Select.Hint>
  </Select>
)

const combo = (props?: ComponentProps<typeof ComboBox>) => (
  <ComboBox defaultSelectedKey="fra" {...props}>
    <ComboBox.Label>Monitor</ComboBox.Label>
    <ComboBox.Group>
      <ComboBox.Icon />
      <ComboBox.Input placeholder="Search monitors" />
      <ComboBox.Button />
    </ComboBox.Group>
    <ComboBox.Popover>
      <ComboBox.OptionList>
        <ComboBox.Option id="fra">fra1 - Frankfurt</ComboBox.Option>
        <ComboBox.Option id="iad">iad1 - Virginia</ComboBox.Option>
        <ComboBox.Option id="sin">sin1 - Singapore</ComboBox.Option>
      </ComboBox.OptionList>
    </ComboBox.Popover>
    <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
  </ComboBox>
)

const slider = (props?: ComponentProps<typeof Slider>) => (
  <Slider defaultValue={60} {...props}>
    <Slider.Header>
      <Slider.Label>Threshold</Slider.Label>
      <Slider.Value />
    </Slider.Header>
    <Slider.Track>
      <Slider.Fill />
      <Slider.Thumb />
    </Slider.Track>
  </Slider>
)

/**
 * The previews that hold state of their own.
 *
 * **They are components because they have to be** — a hook cannot live in a data literal — and they
 * are here rather than in the rows for the same reason the helpers above are: the row is the
 * comparison and this is the anatomy. Two of them are demonstrations in their own right: the tag
 * group really removes a tag, and the form really reports that it submitted, because a control that
 * reports rather than acts is a control that has not been shown to work.
 */

/** Tags that are really removed, so the remove button is proven and not just drawn. */
function RemovableTags() {
  const [tags, setTags] = useState(['fra1', 'iad1', 'sfo1'])
  return (
    <TagGroup
      aria-label="Regions"
      onRemove={(keys) =>
        setTags((current) => current.filter((tag) => !keys.has(tag)))
      }
    >
      <TagGroup.List>
        {tags.map((tag) => (
          <TagGroup.Tag key={tag} id={tag} textValue={tag}>
            {tag}
          </TagGroup.Tag>
        ))}
      </TagGroup.List>
    </TagGroup>
  )
}

/** A drop zone that counts what it was given and reads nothing. */
function DropZonePreview() {
  const [count, setCount] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <DropZone onDrop={(event) => setCount(event.items.length)}>
        <DropZone.Title>Drop a log file here</DropZone.Title>
        <DropZone.Hint>JSON or CSV. Nothing is uploaded.</DropZone.Hint>
        <FileTrigger onSelect={(files) => setCount(files ? files.length : 0)}>
          <Button variant="outline">Browse</Button>
        </FileTrigger>
      </DropZone>
      <p className="m-0 text-[12px] text-foreground/60">
        {count === 0
          ? 'Nothing dropped yet.'
          : count + ' item(s) offered, read by nothing.'}
      </p>
    </div>
  )
}

/** A form that validates nothing and submits nowhere, and says so. */
function FormPreview() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      <Form.Legend>New monitor</Form.Legend>
      <Form.Section>
        <TextField name="host" isRequired>
          <TextField.Label>Hostname</TextField.Label>
          <TextField.Input />
          <TextField.Error>Enter a hostname.</TextField.Error>
        </TextField>
      </Form.Section>
      <Form.Actions>
        <Button type="submit">Save</Button>
        <Button
          type="button"
          variant="ghost"
          onPress={() => setSubmitted(false)}
        >
          Reset
        </Button>
        <span className="text-[12px] text-foreground/60">
          {submitted ? 'Submitted, to nowhere.' : 'Nothing has been sent.'}
        </span>
      </Form.Actions>
    </Form>
  )
}

/** A toast queue that lives in this page and nowhere else. */
/** The monitors every data row shows, so a comparison differs by the prop and nothing else. */
const MONITORS = [
  { id: 'fra1', name: 'fra1 - Frankfurt', status: 'Up', uptime: '99.98%' },
  { id: 'iad1', name: 'iad1 - Virginia', status: 'Slow', uptime: '99.41%' },
  { id: 'sin1', name: 'sin1 - Singapore', status: 'Down', uptime: '97.10%' },
]

/** A thousand rows, for the virtualizer. Nothing here is real and nothing is fetched. */
const MONITORS_THOUSAND = Array.from({ length: 1000 }, (_, index) => ({
  id: 'monitor-' + index,
  name: 'monitor-' + String(index).padStart(4, '0'),
}))

/**
 * An avatar picture, drawn inline.
 *
 * **It is a data URI rather than a URL, and that is the safety requirement rather than a
 * convenience**: a preview must not reach the network, and an <img> pointing at a host would be a
 * request from every visitor's browser to somewhere this project does not control. Sixteen bytes of
 * SVG keep the example honest.
 */
/** Four names for the avatar previews: enough to overlap, few enough to read. */
const TEAM_NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Karen Spärck Jones',
  'Mary Jackson',
]

const AVATAR_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%2371FFF6"/><circle cx="16" cy="12" r="5" fill="%230D1015"/><path d="M6 30c0-6 4.5-9 10-9s10 3 10 9z" fill="%230D1015"/></svg>',
  )

const toastQueue = new ToastQueue<{ title: string; text: string }>({
  maxVisibleToasts: 3,
})

function ToastPreview() {
  return (
    <>
      <Button
        onPress={() =>
          toastQueue.add(
            {
              title: 'Check failed',
              text: 'fra1 - Frankfurt stopped responding.',
            },
            { timeout: 5000 },
          )
        }
      >
        Add toast
      </Button>
      <Toast.Region queue={toastQueue} aria-label="Notifications">
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
    </>
  )
}

/**
 * The action bar's own demo: a selection, and the bar that appears over the page while there is one.
 *
 * **It starts with nothing selected, so the canvas shows no bar until this button is pressed**, and
 * pressing it puts the bar at the bottom of the *viewport* rather than in this slot — the component is
 * `fixed`, which is what it does over a real page and the same trade the toast's region makes here. A
 * bar pinned over the canvas is a bar doing its actual job; a bar with its position overridden would be
 * a picture of one.
 */
function ActionBarPreview() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onPress={() => setSelected(new Set(['fra1', 'iad1']))}
      >
        Choose two rows
      </Button>
      <ActionBar
        selectedItemCount={selected.size}
        onClearSelection={() => setSelected(new Set())}
      >
        <Button size="sm" variant="ghost" color="neutral">
          Restart
        </Button>
        <Button size="sm" variant="ghost" color="danger">
          Take down
        </Button>
      </ActionBar>
    </>
  )
}

/** The shared element's own demo: one thing that moves between two parents. */
function SharedElementPreview() {
  const [inFooter, setInFooter] = useState(false)
  return (
    <SharedElementTransition>
      <div className="flex flex-col items-start gap-4">
        {inFooter ? null : (
          <header className="flex items-center gap-2">
            <SharedElement
              name="marker"
              className="size-2 rounded-full bg-primary"
            />
            <span className="text-[12px] text-foreground/60">
              in the header
            </span>
          </header>
        )}
        <Button
          variant="outline"
          onPress={() => setInFooter((current) => !current)}
        >
          Move it
        </Button>
        {inFooter ? (
          <footer className="flex items-center gap-2">
            <SharedElement
              name="marker"
              className="size-2 rounded-full bg-primary"
            />
            <span className="text-[12px] text-foreground/60">
              in the footer
            </span>
          </footer>
        ) : null}
      </div>
    </SharedElementTransition>
  )
}

const CATEGORIES: CanvasCategory[] = [
  {
    id: 'form',
    title: 'Form',
    groups: [
      {
        id: 'button',
        title: 'Button',
        rows: [
          {
            axis: 'variant',
            previews: (
              [
                ['default', 'default'],
                ['outline', 'outline'],
                ['ghost', 'ghost'],
                ['text', 'text'],
                ['icon', 'icon'],
              ] as const
            ).map(([variant, label]) => ({
              key: variant,
              label: 'variant=' + label,
              Component: () =>
                variant === 'icon' ? (
                  <Button variant="icon" aria-label="Add monitor">
                    <Button.Icon>
                      <Plus />
                    </Button.Icon>
                  </Button>
                ) : (
                  <Button variant={variant}>Continue</Button>
                ),
            })),
          },
          {
            axis: 'color',
            previews: (
              [
                ['primary', 'primary'],
                ['secondary', 'secondary'],
                ['neutral', 'neutral'],
                ['success', 'success'],
                ['danger', 'danger'],
              ] as const
            ).map(([color, label]) => ({
              key: color,
              label: 'color=' + label,
              Component: () => <Button color={color}>Continue</Button>,
            })),
          },
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) => ({
              key: size,
              label: 'size=' + size,
              Component: () => <Button size={size}>Continue</Button>,
            })),
          },
          {
            axis: 'state',
            previews: [
              {
                key: 'rest',
                label: 'rest',
                Component: () => <Button>Continue</Button>,
              },
              {
                key: 'disabled',
                label: 'isDisabled',
                Component: () => <Button isDisabled>Continue</Button>,
              },
              {
                key: 'pending',
                label: 'isPending',
                Component: () => <Button isPending>Continue</Button>,
              },
            ],
          },
          {
            axis: 'disabled keeps its colour, which is why it is a state and not a variant',
            previews: (
              [
                ['danger', 'danger'],
                ['success', 'success'],
                ['outline', 'outline, danger'],
              ] as const
            ).map(([color, label]) => ({
              key: 'disabled-' + color,
              label: 'isDisabled, color=' + label,
              Component: () => (
                <Button
                  isDisabled
                  color={color === 'outline' ? 'danger' : color}
                  variant={color === 'outline' ? 'outline' : 'default'}
                >
                  Delete
                </Button>
              ),
            })),
          },
          {
            axis: 'content',
            previews: [
              {
                key: 'text',
                label: 'text only',
                Component: () => <Button>Continue</Button>,
              },
              {
                key: 'icon-text',
                label: 'icon and text',
                Component: () => (
                  <Button>
                    <Button.Icon>
                      <Plus />
                    </Button.Icon>
                    <Button.Text>Add monitor</Button.Text>
                  </Button>
                ),
              },
              {
                key: 'icon-only',
                label: 'icon only, with an accessible name',
                Component: () => (
                  <Button variant="icon" aria-label="Search">
                    <Button.Icon>
                      <Search />
                    </Button.Icon>
                  </Button>
                ),
              },
              {
                key: 'icon-trailing',
                label: 'icon after the text',
                Component: () => (
                  <Button variant="outline">
                    <Button.Text>Continue</Button.Text>
                    <Button.Icon>
                      <Caret />
                    </Button.Icon>
                  </Button>
                ),
              },
            ],
          },
          {
            axis: 'block',
            previews: [
              {
                key: 'inline',
                label: 'block is off, so the button is as wide as its label',
                Component: () => <Button>Continue</Button>,
              },
              {
                key: 'block',
                label: 'block',
                span: 'medium',
                Component: () => <Button block>Continue</Button>,
              },
            ],
          },
        ],
      },
      {
        id: 'checkbox',
        title: 'Checkbox',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => box({})),
              one('selected', 'defaultSelected', () =>
                box({ defaultSelected: true }),
              ),
              one('indeterminate', 'isIndeterminate', () =>
                box({ isIndeterminate: true }),
              ),
              one('disabled', 'isDisabled, and selected', () =>
                box({ isDisabled: true, defaultSelected: true }),
              ),
              one('readonly', 'isReadOnly, and selected', () =>
                box({ isReadOnly: true, defaultSelected: true }),
              ),
              one('invalid', 'isInvalid', () => box({ isInvalid: true })),
            ],
          },
          {
            axis: 'group',
            previews: [
              one(
                'group',
                'a group with a label and a hint',
                () => (
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
                    <Checkbox value="degraded" isDisabled>
                      <Checkbox.Indicator />
                      <Checkbox.Text>Degraded</Checkbox.Text>
                    </Checkbox>
                    <Checkbox.Hint>Applies to every monitor.</Checkbox.Hint>
                  </Checkbox.Group>
                ),
                'medium',
              ),
              one(
                'group-invalid',
                'the same group, invalid, so its error is drawn',
                () => (
                  <Checkbox.Group isInvalid defaultValue={[]}>
                    <Checkbox.Label>Alert me when</Checkbox.Label>
                    <Checkbox value="down">
                      <Checkbox.Indicator />
                      <Checkbox.Text>Down</Checkbox.Text>
                    </Checkbox>
                    <Checkbox.Error>Pick at least one.</Checkbox.Error>
                  </Checkbox.Group>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'radio',
        title: 'Radio',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <Radio.Group aria-label="Protocol">
                  {radio('https', 'HTTPS')}
                </Radio.Group>
              )),
              one('selected', 'selected, which the group owns', () => (
                <Radio.Group defaultValue="https" aria-label="Protocol">
                  {radio('https', 'HTTPS')}
                </Radio.Group>
              )),
              one('disabled', 'isDisabled', () => (
                <Radio.Group aria-label="Protocol">
                  {radio('https', 'HTTPS', { isDisabled: true })}
                </Radio.Group>
              )),
              one('readonly', 'isReadOnly, and selected', () => (
                <Radio.Group
                  isReadOnly
                  defaultValue="https"
                  aria-label="Protocol"
                >
                  {radio('https', 'HTTPS')}
                </Radio.Group>
              )),
            ],
          },
          {
            axis: 'group',
            previews: [
              one(
                'vertical',
                'a vertical group, with a label and a hint',
                () => (
                  <Radio.Group defaultValue="https">
                    <Radio.Label>Protocol</Radio.Label>
                    {radio('http', 'HTTP')}
                    {radio('https', 'HTTPS')}
                    <Radio.Hint>Applies to every check.</Radio.Hint>
                  </Radio.Group>
                ),
                'medium',
              ),
              one(
                'horizontal',
                'the same group, laid out horizontally',
                () => (
                  <Radio.Group defaultValue="https" orientation="horizontal">
                    <Radio.Label>Protocol</Radio.Label>
                    {radio('http', 'HTTP')}
                    {radio('https', 'HTTPS')}
                  </Radio.Group>
                ),
                'medium',
              ),
              one(
                'invalid',
                'invalid, so its error is drawn',
                () => (
                  <Radio.Group isInvalid>
                    <Radio.Label>Protocol</Radio.Label>
                    {radio('http', 'HTTP')}
                    {radio('https', 'HTTPS')}
                    <Radio.Error>Choose a protocol.</Radio.Error>
                  </Radio.Group>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'switch',
        title: 'Switch',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => toggle()),
              one('selected', 'defaultSelected', () =>
                toggle({ defaultSelected: true }),
              ),
              one('disabled', 'isDisabled', () => toggle({ isDisabled: true })),
              one('disabled-selected', 'isDisabled, and selected', () =>
                toggle({ isDisabled: true, defaultSelected: true }),
              ),
              one('readonly', 'isReadOnly, and selected', () =>
                toggle({ isReadOnly: true, defaultSelected: true }),
              ),
              one('invalid', 'isInvalid', () => toggle({ isInvalid: true })),
            ],
          },
        ],
      },
      {
        id: 'textfield',
        title: 'TextField',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => textField({ size })),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => textField({})),
              one('filled', 'defaultValue', () =>
                textField({ defaultValue: 'api.example.com' }),
              ),
              one('required', 'isRequired', () =>
                textField({ isRequired: true }),
              ),
              one('disabled', 'isDisabled', () =>
                textField({ isDisabled: true }),
              ),
              one('readonly', 'isReadOnly', () =>
                textField({ isReadOnly: true }),
              ),
            ],
          },
          {
            axis: 'content',
            previews: [
              one(
                'icon-start',
                'an icon before the input',
                () => (
                  <TextField>
                    <TextField.Label>Find a monitor</TextField.Label>
                    <TextField.Group>
                      <TextField.Icon position="start">
                        <Search />
                      </TextField.Icon>
                      <TextField.Input placeholder="Search" />
                    </TextField.Group>
                  </TextField>
                ),
                'medium',
              ),
              one(
                'icon-end',
                'an icon after the input, with a value',
                () => (
                  <TextField defaultValue="api.example.com">
                    <TextField.Label>Verified endpoint</TextField.Label>
                    <TextField.Group>
                      <TextField.Input />
                      <TextField.Icon position="end" className="text-primary">
                        <Tick />
                      </TextField.Icon>
                    </TextField.Group>
                  </TextField>
                ),
                'medium',
              ),
              one(
                'invalid',
                'invalid, so its error is drawn',
                () => (
                  <TextField isInvalid defaultValue="/health">
                    <TextField.Label>Health check path</TextField.Label>
                    <TextField.Group>
                      <TextField.Input />
                    </TextField.Group>
                    <TextField.Error>
                      That path does not respond from outside the VPC.
                    </TextField.Error>
                  </TextField>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'textarea',
        title: 'TextArea',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <TextArea>
                  <TextArea.Label>Notes</TextArea.Label>
                  <TextArea.Input rows={3} placeholder="What changed?" />
                </TextArea>
              )),
              one('filled', 'defaultValue', () => (
                <TextArea defaultValue="Rolled back at 09:14.">
                  <TextArea.Label>Notes</TextArea.Label>
                  <TextArea.Input rows={3} />
                </TextArea>
              )),
              one('disabled', 'isDisabled', () => (
                <TextArea isDisabled defaultValue="Rolled back at 09:14.">
                  <TextArea.Label>Notes</TextArea.Label>
                  <TextArea.Input rows={3} />
                </TextArea>
              )),
              one('invalid', 'isInvalid, with a hint and an error', () => (
                <TextArea isInvalid>
                  <TextArea.Label>Notes</TextArea.Label>
                  <TextArea.Input rows={3} placeholder="What changed?" />
                  <TextArea.Hint>Markdown is fine.</TextArea.Hint>
                  <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
                </TextArea>
              )),
            ],
          },
        ],
      },
      {
        id: 'searchfield',
        title: 'SearchField',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => search({ size })),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => search()),
              one(
                'filled',
                'a value, which is what draws the clear button',
                () => search({ defaultValue: 'fra' }),
              ),
              one('disabled', 'isDisabled', () => search({ isDisabled: true })),
              one('invalid', 'isInvalid', () => (
                <SearchField isInvalid defaultValue="f">
                  <SearchField.Label>Search monitors</SearchField.Label>
                  <SearchField.Group>
                    <SearchField.Icon />
                    <SearchField.Input />
                  </SearchField.Group>
                  <SearchField.Error>
                    Enter at least two characters.
                  </SearchField.Error>
                </SearchField>
              )),
            ],
          },
        ],
      },
      {
        id: 'numberfield',
        title: 'NumberField',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => number({ size })),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => number()),
              one('disabled', 'isDisabled', () => number({ isDisabled: true })),
              one('readonly', 'isReadOnly', () => number({ isReadOnly: true })),
              one('invalid', 'isInvalid', () =>
                number({ isInvalid: true, defaultValue: 900 }),
              ),
            ],
          },
          {
            axis: 'formatOptions',
            previews: [
              one('percent', 'style: percent', () =>
                number({
                  defaultValue: 0.72,
                  minValue: 0,
                  maxValue: 1,
                  formatOptions: { style: 'percent' },
                }),
              ),
              one('currency', 'style: currency', () =>
                number({
                  defaultValue: 240,
                  formatOptions: { style: 'currency', currency: 'EUR' },
                }),
              ),
            ],
          },
        ],
      },
      {
        id: 'colorfield',
        title: 'ColorField',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <ColorField defaultValue={parseColor('#71FFF6')}>
                  <ColorField.Label>Label colour</ColorField.Label>
                  <ColorField.Control>
                    <ColorField.Swatch />
                    <ColorField.Input />
                  </ColorField.Control>
                </ColorField>
              )),
              one('disabled', 'isDisabled', () => (
                <ColorField defaultValue={parseColor('#FAD14F')} isDisabled>
                  <ColorField.Label>Label colour</ColorField.Label>
                  <ColorField.Control>
                    <ColorField.Swatch />
                    <ColorField.Input />
                  </ColorField.Control>
                </ColorField>
              )),
              one('invalid', 'isInvalid, with a hint and an error', () => (
                <ColorField isInvalid defaultValue={parseColor('#FF9A8B')}>
                  <ColorField.Label>Label colour</ColorField.Label>
                  <ColorField.Control>
                    <ColorField.Swatch />
                    <ColorField.Input />
                  </ColorField.Control>
                  <ColorField.Hint>Hex, rgb() or oklch().</ColorField.Hint>
                  <ColorField.Error>That is not a colour.</ColorField.Error>
                </ColorField>
              )),
            ],
          },
        ],
      },
      {
        id: 'datefield',
        title: 'DateField',
        rows: [
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <DateField defaultValue={parseDate('2026-10-11')}>
                  <DateField.Label>Starts on</DateField.Label>
                  <DateField.Group>
                    <DateField.Input />
                  </DateField.Group>
                </DateField>
              )),
              one('required', 'isRequired', () => (
                <DateField isRequired>
                  <DateField.Label>Starts on</DateField.Label>
                  <DateField.Group>
                    <DateField.Input />
                  </DateField.Group>
                </DateField>
              )),
              one('readonly', 'isReadOnly', () => (
                <DateField defaultValue={parseDate('2026-10-11')} isReadOnly>
                  <DateField.Label>Starts on</DateField.Label>
                  <DateField.Group>
                    <DateField.Input />
                  </DateField.Group>
                </DateField>
              )),
              one('disabled', 'isDisabled', () => (
                <DateField defaultValue={parseDate('2026-10-11')} isDisabled>
                  <DateField.Label>Starts on</DateField.Label>
                  <DateField.Group>
                    <DateField.Input />
                  </DateField.Group>
                </DateField>
              )),
              one('invalid', 'isInvalid, so its error is drawn', () => (
                <DateField isInvalid>
                  <DateField.Label>Starts on</DateField.Label>
                  <DateField.Group>
                    <DateField.Input />
                  </DateField.Group>
                  <DateField.Error>Choose a date.</DateField.Error>
                </DateField>
              )),
            ],
          },
        ],
      },
      {
        id: 'timefield',
        title: 'TimeField',
        rows: [
          {
            axis: 'granularity',
            previews: (['hour', 'minute', 'second'] as const).map(
              (granularity) =>
                one(granularity, 'granularity=' + granularity, () => (
                  <TimeField
                    defaultValue={parseTime('09:30')}
                    granularity={granularity}
                  >
                    <TimeField.Label>Opens at</TimeField.Label>
                    <TimeField.Group>
                      <TimeField.Input />
                    </TimeField.Group>
                  </TimeField>
                )),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <TimeField defaultValue={parseTime('09:30')}>
                  <TimeField.Label>Opens at</TimeField.Label>
                  <TimeField.Group>
                    <TimeField.Input />
                  </TimeField.Group>
                </TimeField>
              )),
              one('disabled', 'isDisabled', () => (
                <TimeField defaultValue={parseTime('09:30')} isDisabled>
                  <TimeField.Label>Opens at</TimeField.Label>
                  <TimeField.Group>
                    <TimeField.Input />
                  </TimeField.Group>
                </TimeField>
              )),
              one('invalid', 'isInvalid, so its error is drawn', () => (
                <TimeField isInvalid>
                  <TimeField.Label>Opens at</TimeField.Label>
                  <TimeField.Group>
                    <TimeField.Input />
                  </TimeField.Group>
                  <TimeField.Error>Enter a time.</TimeField.Error>
                </TimeField>
              )),
            ],
          },
        ],
      },

      {
        id: 'select',
        title: 'Select',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => select({ size })),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => select()),
              one('placeholder', 'no selection, so the placeholder shows', () =>
                select({
                  defaultSelectedKey: null,
                  placeholder: 'Choose a protocol',
                }),
              ),
              one('disabled', 'isDisabled', () => select({ isDisabled: true })),
              one('invalid', 'isInvalid, so its error is drawn', () =>
                select({ isInvalid: true, defaultSelectedKey: null }),
              ),
            ],
          },
          {
            axis: 'collection',
            previews: [
              one('sections', 'sections and their titles', () =>
                select({
                  defaultSelectedKey: 'https',
                  children: (
                    <>
                      <Select.Label>Protocol</Select.Label>
                      <Select.Button>
                        <Select.Value />
                        <Select.Icon />
                      </Select.Button>
                      <Select.Popover>
                        <Select.OptionList>
                          <Select.Section>
                            <Select.SectionTitle>Web</Select.SectionTitle>
                            <Select.Option id="http">HTTP</Select.Option>
                            <Select.Option id="https">HTTPS</Select.Option>
                          </Select.Section>
                          <Select.Section>
                            <Select.SectionTitle>Other</Select.SectionTitle>
                            <Select.Option id="tcp" isDisabled>
                              TCP
                            </Select.Option>
                          </Select.Section>
                        </Select.OptionList>
                      </Select.Popover>
                    </>
                  ),
                }),
              ),
              one('multiple', 'selectionMode: multiple', () =>
                select({
                  selectionMode: 'multiple',
                  defaultValue: ['http', 'https'],
                }),
              ),
              one('autocomplete', 'an autocomplete inside the popover', () =>
                select({
                  defaultSelectedKey: 'https',
                  children: (
                    <>
                      <Select.Label>Protocol</Select.Label>
                      <Select.Button>
                        <Select.Value />
                        <Select.Icon />
                      </Select.Button>
                      <Select.Popover>
                        <Select.AutoComplete placeholder="Search protocols">
                          <Select.OptionList>
                            <Select.Option id="http">HTTP</Select.Option>
                            <Select.Option id="https">HTTPS</Select.Option>
                            <Select.Option id="tcp">TCP</Select.Option>
                          </Select.OptionList>
                        </Select.AutoComplete>
                      </Select.Popover>
                    </>
                  ),
                }),
              ),
            ],
          },
        ],
      },
      {
        id: 'combobox',
        title: 'ComboBox',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => combo({ size })),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest, with a selection', () => combo()),
              one('empty', 'no selection', () =>
                combo({ defaultSelectedKey: null }),
              ),
              one('disabled', 'isDisabled', () => combo({ isDisabled: true })),
              one('invalid', 'isInvalid', () => combo({ isInvalid: true })),
            ],
          },
          {
            axis: 'behaviour',
            previews: [
              one(
                'custom-value',
                'allowsCustomValue, so a typed value is kept',
                () =>
                  combo({ allowsCustomValue: true, defaultSelectedKey: null }),
              ),
              one('menu-on-focus', 'menuTrigger: focus', () =>
                combo({ menuTrigger: 'focus', defaultSelectedKey: null }),
              ),
              one(
                'empty-collection',
                'allowsEmptyCollection, so it stays open on no match',
                () =>
                  combo({
                    allowsEmptyCollection: true,
                    defaultSelectedKey: null,
                  }),
              ),
            ],
          },
        ],
      },
      {
        id: 'slider',
        title: 'Slider',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => slider({ size })),
            ),
          },
          {
            axis: 'orientation',
            previews: [
              one('horizontal', 'orientation: horizontal', () => slider()),
              one('vertical', 'orientation: vertical', () =>
                slider({ orientation: 'vertical', className: 'h-40' }),
              ),
            ],
          },
          {
            axis: 'state',
            previews: [
              one('disabled', 'isDisabled', () => slider({ isDisabled: true })),
              one('invalid', 'isInvalid, so its error is drawn', () => (
                <Slider defaultValue={90} isInvalid>
                  <Slider.Header>
                    <Slider.Label>Threshold</Slider.Label>
                    <Slider.Value />
                  </Slider.Header>
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                  <Slider.Error>Raise it above 10%.</Slider.Error>
                </Slider>
              )),
            ],
          },
          {
            axis: 'thumbs',
            previews: [
              one(
                'range',
                'two thumbs, which is one value with two ends',
                () => (
                  <Slider defaultValue={[20, 80]}>
                    <Slider.Header>
                      <Slider.Label>Window</Slider.Label>
                      <Slider.Value />
                    </Slider.Header>
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb index={0} label="From" />
                      <Slider.Thumb index={1} label="To" />
                    </Slider.Track>
                  </Slider>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'form',
        title: 'Form',
        rows: [
          {
            axis: 'the whole thing',
            previews: [
              one(
                'form',
                'a legend, a section and its actions',
                () => <FormPreview />,
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'tokenfield',
        title: 'TokenField',
        rows: [
          {
            axis: 'state',
            previews: [
              one(
                'tokens',
                'a value that is a token and some text',
                () => (
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
                ),
                'medium',
              ),
              one(
                'empty',
                'empty, which is how it starts',
                () => (
                  <TokenField>
                    <TokenField.Label>Notify</TokenField.Label>
                    <TokenField.Input />
                    <TokenField.Hint>
                      Type a channel name and press Enter.
                    </TokenField.Hint>
                  </TokenField>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'dropzone',
        title: 'DropZone',
        rows: [
          {
            axis: 'state',
            previews: [
              one(
                'dropzone',
                'a drop zone with the file trigger it cannot do without',
                () => <DropZonePreview />,
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'colorswatchpicker',
        title: 'ColorSwatchPicker',
        rows: [
          {
            axis: 'layout',
            previews: [
              one('stack', 'layout: stack', () => (
                <ColorSwatchPicker
                  aria-label="Label colour"
                  defaultValue="#71FFF6"
                  layout="stack"
                >
                  <ColorSwatchPicker.Item color="#71FFF6" />
                  <ColorSwatchPicker.Item color="#FAD14F" />
                  <ColorSwatchPicker.Item color="#FF9A8B" />
                  <ColorSwatchPicker.Item color="#B0FBB1" />
                </ColorSwatchPicker>
              )),
              one('grid', 'layout: grid', () => (
                <ColorSwatchPicker
                  aria-label="Label colour"
                  defaultValue="#FAD14F"
                  layout="grid"
                >
                  <ColorSwatchPicker.Item color="#71FFF6" />
                  <ColorSwatchPicker.Item color="#FAD14F" />
                  <ColorSwatchPicker.Item color="#FF9A8B" />
                  <ColorSwatchPicker.Item color="#B0FBB1" />
                </ColorSwatchPicker>
              )),
            ],
          },
        ],
      },
      {
        id: 'taggroup',
        title: 'TagGroup',
        rows: [
          {
            axis: 'variant',
            previews: (
              [
                'default',
                'outline',
                'teal',
                'gray',
                'yellow',
                'outline-ring',
                'outline-warning',
              ] as const
            ).map((variant) =>
              one(variant, 'variant=' + variant, () => (
                <TagGroup aria-label="Regions">
                  <TagGroup.List>
                    <TagGroup.Tag variant={variant} textValue="fra1">
                      fra1
                    </TagGroup.Tag>
                  </TagGroup.List>
                </TagGroup>
              )),
            ),
          },
          {
            axis: 'selection',
            previews: [
              one('selected', 'selectionMode: single, with one chosen', () => (
                <TagGroup
                  aria-label="Regions"
                  selectionMode="single"
                  defaultSelectedKeys={['fra1']}
                >
                  <TagGroup.List>
                    <TagGroup.Tag id="fra1" textValue="fra1">
                      fra1
                    </TagGroup.Tag>
                    <TagGroup.Tag id="iad1" textValue="iad1">
                      iad1
                    </TagGroup.Tag>
                    <TagGroup.Tag id="sfo1" textValue="sfo1">
                      sfo1
                    </TagGroup.Tag>
                  </TagGroup.List>
                </TagGroup>
              )),
              one('multiple', 'selectionMode: multiple', () => (
                <TagGroup
                  aria-label="Regions"
                  selectionMode="multiple"
                  defaultSelectedKeys={['fra1', 'sin1']}
                >
                  <TagGroup.List>
                    <TagGroup.Tag id="fra1" textValue="fra1">
                      fra1
                    </TagGroup.Tag>
                    <TagGroup.Tag id="iad1" textValue="iad1">
                      iad1
                    </TagGroup.Tag>
                    <TagGroup.Tag id="sin1" textValue="sin1">
                      sin1
                    </TagGroup.Tag>
                  </TagGroup.List>
                </TagGroup>
              )),
              one('removable', 'removable, and it really removes', () => (
                <RemovableTags />
              )),
            ],
          },
          {
            axis: 'href',
            previews: [
              one('href', 'a tag that is a link', () => (
                <TagGroup aria-label="Regions">
                  <TagGroup.List>
                    <TagGroup.Tag
                      variant="outline"
                      href="#fra1"
                      textValue="fra1"
                    >
                      fra1
                    </TagGroup.Tag>
                    <TagGroup.Tag
                      variant="outline"
                      href="#iad1"
                      textValue="iad1"
                    >
                      iad1
                    </TagGroup.Tag>
                  </TagGroup.List>
                </TagGroup>
              )),
            ],
          },
        ],
      },
      {
        id: 'togglebutton',
        title: 'ToggleButton',
        rows: [
          {
            axis: 'variant',
            previews: (['default', 'outline', 'ghost', 'text'] as const).map(
              (variant) =>
                one(variant, 'variant=' + variant, () => (
                  <ToggleButton variant={variant}>24h</ToggleButton>
                )),
            ),
          },
          {
            axis: 'color',
            previews: (
              ['primary', 'secondary', 'neutral', 'success', 'danger'] as const
            ).map((color) =>
              one(color, 'color=' + color, () => (
                <ToggleButton color={color}>24h</ToggleButton>
              )),
            ),
          },
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => (
                <ToggleButton size={size}>24h</ToggleButton>
              )),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('off', 'off', () => <ToggleButton>24h</ToggleButton>),
              one('on', 'on', () => (
                <ToggleButton defaultSelected>24h</ToggleButton>
              )),
              one('disabled-off', 'isDisabled, and off', () => (
                <ToggleButton isDisabled>24h</ToggleButton>
              )),
              one('disabled-on', 'isDisabled, and on', () => (
                <ToggleButton isDisabled defaultSelected>
                  24h
                </ToggleButton>
              )),
            ],
          },
        ],
      },
      {
        id: 'togglebuttongroup',
        title: 'ToggleButtonGroup',
        rows: [
          {
            axis: 'selectionMode',
            previews: (['single', 'multiple'] as const).map((selectionMode) =>
              one(selectionMode, 'selectionMode=' + selectionMode, () => (
                <ToggleButtonGroup
                  aria-label="Range"
                  selectionMode={selectionMode}
                  defaultSelectedKeys={['24h']}
                >
                  <ToggleButtonGroup.Button id="1h">
                    1h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="24h">
                    24h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="7d">
                    7d
                  </ToggleButtonGroup.Button>
                </ToggleButtonGroup>
              )),
            ),
          },
          {
            axis: 'orientation',
            previews: [
              one('horizontal', 'orientation: horizontal', () => (
                <ToggleButtonGroup
                  aria-label="Range"
                  defaultSelectedKeys={['24h']}
                >
                  <ToggleButtonGroup.Button id="1h">
                    1h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="24h">
                    24h
                  </ToggleButtonGroup.Button>
                </ToggleButtonGroup>
              )),
              one('vertical', 'orientation: vertical', () => (
                <ToggleButtonGroup
                  aria-label="Range"
                  orientation="vertical"
                  defaultSelectedKeys={['24h']}
                >
                  <ToggleButtonGroup.Button id="1h">
                    1h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="24h">
                    24h
                  </ToggleButtonGroup.Button>
                </ToggleButtonGroup>
              )),
            ],
          },
          {
            axis: 'state',
            previews: [
              one('disallow-empty', 'disallowEmptySelection', () => (
                <ToggleButtonGroup
                  aria-label="Range"
                  disallowEmptySelection
                  defaultSelectedKeys={['24h']}
                >
                  <ToggleButtonGroup.Button id="1h">
                    1h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="24h">
                    24h
                  </ToggleButtonGroup.Button>
                </ToggleButtonGroup>
              )),
              one('disabled', 'isDisabled', () => (
                <ToggleButtonGroup
                  aria-label="Range"
                  isDisabled
                  defaultSelectedKeys={['24h']}
                >
                  <ToggleButtonGroup.Button id="1h">
                    1h
                  </ToggleButtonGroup.Button>
                  <ToggleButtonGroup.Button id="24h">
                    24h
                  </ToggleButtonGroup.Button>
                </ToggleButtonGroup>
              )),
            ],
          },
        ],
      },

      /* __MORE_FORM__ */
    ],
  },
  {
    id: 'date',
    title: 'Date',
    groups: [
      {
        id: 'calendar',
        title: 'Calendar',
        rows: [
          {
            axis: 'months',
            previews: [
              one(
                'one',
                'one month, with a day chosen',
                () => (
                  <Calendar
                    aria-label="Date"
                    defaultValue={parseDate('2026-10-11')}
                  />
                ),
                'medium',
              ),
              one(
                'two',
                'months: 2',
                () => (
                  <Calendar
                    aria-label="Date"
                    months={2}
                    defaultValue={parseDate('2026-10-11')}
                  />
                ),
                'wide',
              ),
            ],
          },
          {
            axis: 'state',
            previews: [
              one(
                'readonly',
                'isReadOnly',
                () => (
                  <Calendar
                    aria-label="Date"
                    isReadOnly
                    defaultValue={parseDate('2026-10-11')}
                  />
                ),
                'medium',
              ),
              one(
                'disabled',
                'isDisabled',
                () => (
                  <Calendar
                    aria-label="Date"
                    isDisabled
                    defaultValue={parseDate('2026-10-11')}
                  />
                ),
                'medium',
              ),
              one(
                'bounded',
                'a minValue and a maxValue',
                () => (
                  <Calendar
                    aria-label="Date"
                    defaultValue={parseDate('2026-10-11')}
                    minValue={parseDate('2026-10-05')}
                    maxValue={parseDate('2026-10-20')}
                  />
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'rangecalendar',
        title: 'RangeCalendar',
        rows: [
          {
            axis: 'value',
            previews: [
              one(
                'range',
                'a range, with both ends chosen',
                () => (
                  <RangeCalendar
                    aria-label="Range"
                    defaultValue={{
                      start: parseDate('2026-10-11'),
                      end: parseDate('2026-10-20'),
                    }}
                  />
                ),
                'medium',
              ),
              one(
                'two-months',
                'months: 2',
                () => (
                  <RangeCalendar
                    aria-label="Range"
                    months={2}
                    defaultValue={{
                      start: parseDate('2026-10-11'),
                      end: parseDate('2026-10-20'),
                    }}
                  />
                ),
                'wide',
              ),
            ],
          },
          {
            axis: 'state',
            previews: [
              one(
                'readonly',
                'isReadOnly',
                () => (
                  <RangeCalendar
                    aria-label="Range"
                    isReadOnly
                    defaultValue={{
                      start: parseDate('2026-10-11'),
                      end: parseDate('2026-10-20'),
                    }}
                  />
                ),
                'medium',
              ),
              one(
                'non-contiguous',
                'allowsNonContiguousRanges',
                () => (
                  <RangeCalendar
                    aria-label="Range"
                    allowsNonContiguousRanges
                    defaultValue={{
                      start: parseDate('2026-10-11'),
                      end: parseDate('2026-10-20'),
                    }}
                  />
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'datepicker',
        title: 'DatePicker',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => (
                <DatePicker defaultValue={parseDate('2026-10-11')} size={size}>
                  <DatePicker.Label>Starts</DatePicker.Label>
                  <DatePicker.Group>
                    <DatePicker.Input />
                    <DatePicker.Button />
                  </DatePicker.Group>
                </DatePicker>
              )),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest, with a hint', () => (
                <DatePicker defaultValue={parseDate('2026-10-11')}>
                  <DatePicker.Label>Starts</DatePicker.Label>
                  <DatePicker.Group>
                    <DatePicker.Input />
                    <DatePicker.Button />
                  </DatePicker.Group>
                  <DatePicker.Hint>Your local time.</DatePicker.Hint>
                </DatePicker>
              )),
              one('disabled', 'isDisabled', () => (
                <DatePicker isDisabled defaultValue={parseDate('2026-10-11')}>
                  <DatePicker.Label>Starts</DatePicker.Label>
                  <DatePicker.Group>
                    <DatePicker.Input />
                    <DatePicker.Button />
                  </DatePicker.Group>
                </DatePicker>
              )),
              one('invalid', 'isInvalid, so its error is drawn', () => (
                <DatePicker isInvalid>
                  <DatePicker.Label>Starts</DatePicker.Label>
                  <DatePicker.Group>
                    <DatePicker.Input />
                    <DatePicker.Button />
                  </DatePicker.Group>
                  <DatePicker.Error>Pick a start date.</DatePicker.Error>
                </DatePicker>
              )),
            ],
          },
        ],
      },
      {
        id: 'daterangepicker',
        title: 'DateRangePicker',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => (
                <DateRangePicker
                  defaultValue={{
                    start: parseDate('2026-10-11'),
                    end: parseDate('2026-10-20'),
                  }}
                  size={size}
                >
                  <DateRangePicker.Label>Window</DateRangePicker.Label>
                  <DateRangePicker.Group>
                    <DateRangePicker.Input />
                    <DateRangePicker.Button />
                  </DateRangePicker.Group>
                </DateRangePicker>
              )),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest, with a hint', () => (
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
                </DateRangePicker>
              )),
              one('disabled', 'isDisabled', () => (
                <DateRangePicker
                  isDisabled
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
                </DateRangePicker>
              )),
              one('invalid', 'isInvalid, so its error is drawn', () => (
                <DateRangePicker isInvalid>
                  <DateRangePicker.Label>Window</DateRangePicker.Label>
                  <DateRangePicker.Group>
                    <DateRangePicker.Input />
                    <DateRangePicker.Button />
                  </DateRangePicker.Group>
                  <DateRangePicker.Error>Pick both ends.</DateRangePicker.Error>
                </DateRangePicker>
              )),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'overlay',
    title: 'Overlay',
    groups: [
      {
        id: 'modal',
        title: 'Modal',
        rows: [
          {
            axis: 'what it is',
            previews: [
              one(
                'modal',
                'the trigger is the page; press it to open the dialog',
                () => (
                  <Modal>
                    <Button>New monitor</Button>
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
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'sheet',
        title: 'Sheet',
        rows: [
          {
            axis: 'side',
            previews: (
              ['right', 'left', 'top', 'bottom', 'start', 'end'] as const
            ).map((side) =>
              one(side, 'side=' + side, () => (
                <Sheet>
                  <Button variant="outline">{side}</Button>
                  <Sheet.Content side={side}>
                    <Sheet.Title>fra1 - Frankfurt</Sheet.Title>
                    <Sheet.Description>
                      Checked every 60 seconds.
                    </Sheet.Description>
                    <Sheet.Footer>
                      <Sheet.Close>Close</Sheet.Close>
                    </Sheet.Footer>
                  </Sheet.Content>
                </Sheet>
              )),
            ),
          },
        ],
      },
      {
        id: 'popover',
        title: 'Popover',
        rows: [
          {
            axis: 'placement',
            previews: (
              ['bottom start', 'bottom end', 'top', 'right', 'left'] as const
            ).map((placement) =>
              one(placement, 'placement: ' + placement, () => (
                <Popover>
                  <Button variant="outline">{placement}</Button>
                  <Popover.Content placement={placement}>
                    <Popover.Title>Filters</Popover.Title>
                    <Popover.Description>
                      Applies to this view only.
                    </Popover.Description>
                  </Popover.Content>
                </Popover>
              )),
            ),
          },
          {
            axis: 'with an arrow',
            previews: [
              one('arrow', 'the marker pointing back at the trigger', () => (
                <Popover>
                  <Button variant="outline">Filters</Button>
                  <Popover.Content placement="bottom start">
                    <Popover.Arrow />
                    <Popover.Description>
                      Anchored to the button.
                    </Popover.Description>
                  </Popover.Content>
                </Popover>
              )),
            ],
          },
        ],
      },
      {
        id: 'menu',
        title: 'Menu',
        rows: [
          {
            axis: 'collection',
            previews: [
              one('items', 'items and a separator', () => (
                <Menu>
                  <Button>Actions</Button>
                  <Menu.Popover menuProps={{ onAction: () => undefined }}>
                    <Menu.Item id="restart">Restart</Menu.Item>
                    <Menu.Item id="pause">Pause</Menu.Item>
                    <Menu.Separator />
                    <Menu.Item id="delete">Delete</Menu.Item>
                  </Menu.Popover>
                </Menu>
              )),
              one('sections', 'sections with their own titles', () => (
                <Menu>
                  <Button variant="outline">More</Button>
                  <Menu.Popover menuProps={{ onAction: () => undefined }}>
                    <Menu.Section>
                      <Menu.SectionTitle>Monitor</Menu.SectionTitle>
                      <Menu.Item id="restart">Restart</Menu.Item>
                      <Menu.Item id="pause">Pause</Menu.Item>
                    </Menu.Section>
                    <Menu.Section>
                      <Menu.SectionTitle>Account</Menu.SectionTitle>
                      <Menu.Item id="settings">Settings</Menu.Item>
                      <Menu.Item id="remove" isDisabled>
                        Remove
                      </Menu.Item>
                    </Menu.Section>
                  </Menu.Popover>
                </Menu>
              )),
            ],
          },
        ],
      },
      {
        id: 'tooltip',
        title: 'Tooltip',
        rows: [
          {
            axis: 'content',
            previews: [
              one('title-text', 'a title and a line of text', () => (
                <Tooltip delay={0}>
                  <Button>Restart</Button>
                  <Tooltip.Content>
                    <Tooltip.Title>Restart</Tooltip.Title>
                    <Tooltip.Text>
                      Runs the check again from the top.
                    </Tooltip.Text>
                  </Tooltip.Content>
                </Tooltip>
              )),
              one('text-only', 'a line of text on its own', () => (
                <Tooltip delay={0}>
                  <Link variant="url" href="/help">
                    What is this?
                  </Link>
                  <Tooltip.Content>
                    <Tooltip.Text>
                      Point at it, or focus it with the keyboard.
                    </Tooltip.Text>
                  </Tooltip.Content>
                </Tooltip>
              )),
              one('arrow', 'with the marker', () => (
                <Tooltip delay={0}>
                  <Button variant="outline">Restart</Button>
                  <Tooltip.Content>
                    <Tooltip.Arrow />
                    <Tooltip.Text>
                      Runs the check again from the top.
                    </Tooltip.Text>
                  </Tooltip.Content>
                </Tooltip>
              )),
            ],
          },
        ],
      },
      {
        id: 'action-bar',
        title: 'ActionBar',
        rows: [
          {
            axis: 'what it is',
            previews: [
              one(
                'two',
                'two rows chosen — press to select, and the bar appears over the page',
                () => <ActionBarPreview />,
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'toast',
        title: 'Toast',
        rows: [
          {
            axis: 'a queue and a region',
            previews: [
              one(
                'toast',
                'a queue, a region, and a button that adds to it',
                () => <ToastPreview />,
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'overlayarrow',
        title: 'OverlayArrow',
        rows: [
          {
            axis: 'where it appears',
            previews: [
              one('bare', 'the component itself, inside a popover', () => (
                <Popover>
                  <Button variant="outline">Filters</Button>
                  <Popover.Content placement="bottom start">
                    <OverlayArrow />
                    <Popover.Description>
                      Anchored to the button.
                    </Popover.Description>
                  </Popover.Content>
                </Popover>
              )),
              one(
                'as-a-slot',
                'Popover.Arrow, this component with the styling the library gives it',
                () => (
                  <Popover>
                    <Button variant="outline">Filters</Button>
                    <Popover.Content placement="bottom start">
                      <Popover.Arrow />
                      <Popover.Description>
                        Anchored to the button.
                      </Popover.Description>
                    </Popover.Content>
                  </Popover>
                ),
              ),
              one('in-a-tooltip', 'inside Tooltip.Content', () => (
                <Tooltip delay={0}>
                  <Button variant="outline">Restart</Button>
                  <Tooltip.Content>
                    <Tooltip.Arrow />
                    <Tooltip.Text>
                      Runs the check again from the top.
                    </Tooltip.Text>
                  </Tooltip.Content>
                </Tooltip>
              )),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    groups: [
      {
        id: 'nav',
        title: 'Nav',
        rows: [
          {
            axis: 'structure',
            previews: [
              one(
                'nested',
                'a section, a nested item, a count and an icon column',
                () => (
                  <Nav
                    aria-label="Primary"
                    selectedRoute="/monitors"
                    className="w-64"
                  >
                    <Nav.Item href="/" textValue="Overview" icon={<Grid />}>
                      <Nav.Label>Overview</Nav.Label>
                    </Nav.Item>
                    <Nav.Item
                      href="/monitors"
                      textValue="Monitors"
                      icon={<Grid />}
                    >
                      <Nav.Label>
                        Monitors <Nav.Count>12</Nav.Count>
                      </Nav.Label>
                      <Nav.Item href="/monitors/fra1" textValue="fra1">
                        <Nav.Label>fra1 - Frankfurt</Nav.Label>
                      </Nav.Item>
                    </Nav.Item>
                    <Nav.Section>
                      <Nav.Header>Account</Nav.Header>
                      <Nav.Item
                        href="/settings"
                        textValue="Settings"
                        icon={<Grid />}
                      >
                        <Nav.Label>Settings</Nav.Label>
                      </Nav.Item>
                    </Nav.Section>
                  </Nav>
                ),
                'medium',
              ),
              one(
                'collapsed',
                'isCollapsed, which folds it to a rail',
                () => (
                  <Nav
                    aria-label="Primary"
                    isCollapsed
                    selectedRoute="/monitors"
                    className="w-16"
                  >
                    <Nav.Item href="/" textValue="Overview" icon={<Grid />}>
                      <Nav.Label>Overview</Nav.Label>
                    </Nav.Item>
                    <Nav.Item
                      href="/monitors"
                      textValue="Monitors"
                      icon={<Grid />}
                    >
                      <Nav.Label>Monitors</Nav.Label>
                    </Nav.Item>
                    <Nav.Item
                      href="/settings"
                      textValue="Settings"
                      icon={<Grid />}
                    >
                      <Nav.Label>Settings</Nav.Label>
                    </Nav.Item>
                  </Nav>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'breadcrumbs',
        title: 'Breadcrumbs',
        rows: [
          {
            axis: 'trail',
            previews: [
              one(
                'short',
                'three steps, the last one being the page you are on',
                () => (
                  <Breadcrumbs label="Breadcrumb">
                    <Breadcrumbs.Item href="/monitors">
                      Monitors
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item href="#fra1">fra1</Breadcrumbs.Item>
                    <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
                  </Breadcrumbs>
                ),
                'medium',
              ),
              one(
                'long',
                'a longer trail',
                () => (
                  <Breadcrumbs label="Breadcrumb">
                    <Breadcrumbs.Item href="/organisation">
                      Organisation
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/project">Project</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/monitors">
                      Monitors
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/monitors/fra1">
                      fra1
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
                  </Breadcrumbs>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'link',
        title: 'Link',
        rows: [
          {
            axis: 'variant',
            previews: (['caps', 'url', 'viewmore'] as const).map((variant) =>
              one(variant, 'variant=' + variant, () => (
                <Link variant={variant} href="/monitors">
                  Monitors
                </Link>
              )),
            ),
          },
          {
            axis: 'size',
            previews: (['sm', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => (
                <Link variant="url" size={size} href="/monitors">
                  Monitors
                </Link>
              )),
            ),
          },
          {
            axis: 'state',
            previews: [
              one('rest', 'rest', () => (
                <Link variant="url" href="/monitors">
                  Monitors
                </Link>
              )),
              one('disabled', 'isDisabled', () => (
                <Link variant="url" isDisabled href="/monitors">
                  Monitors
                </Link>
              )),
              one('external', 'target: _blank', () => (
                <Link variant="url" href="/monitors" target="_blank">
                  Monitors
                </Link>
              )),
            ],
          },
        ],
      },
      {
        id: 'tabs',
        title: 'Tabs',
        rows: [
          {
            axis: 'orientation',
            previews: [
              one(
                'horizontal',
                'orientation: horizontal',
                () => (
                  <Tabs defaultSelectedKey="overview">
                    <Tabs.List aria-label="Monitor detail">
                      <Tabs.Tab id="overview">Overview</Tabs.Tab>
                      <Tabs.Tab id="checks">
                        Checks <Tabs.Count>3</Tabs.Count>
                      </Tabs.Tab>
                      <Tabs.Tab id="history">History</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel id="overview">
                      Everything at a glance.
                    </Tabs.Panel>
                    <Tabs.Panel id="checks">Three failing.</Tabs.Panel>
                    <Tabs.Panel id="history">Nothing for 24 hours.</Tabs.Panel>
                  </Tabs>
                ),
                'medium',
              ),
              one(
                'vertical',
                'orientation: vertical',
                () => (
                  <Tabs defaultSelectedKey="overview" orientation="vertical">
                    <Tabs.List aria-label="Monitor detail">
                      <Tabs.Tab id="overview">Overview</Tabs.Tab>
                      <Tabs.Tab id="checks">Checks</Tabs.Tab>
                      <Tabs.Tab id="history">History</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel id="overview">
                      Everything at a glance.
                    </Tabs.Panel>
                    <Tabs.Panel id="checks">Three failing.</Tabs.Panel>
                    <Tabs.Panel id="history">Nothing for 24 hours.</Tabs.Panel>
                  </Tabs>
                ),
                'medium',
              ),
            ],
          },
          {
            axis: 'state',
            previews: [
              one(
                'disabled-tab',
                'disabledKeys, so one tab cannot be chosen',
                () => (
                  <Tabs defaultSelectedKey="overview" disabledKeys={['checks']}>
                    <Tabs.List aria-label="Monitor detail">
                      <Tabs.Tab id="overview">Overview</Tabs.Tab>
                      <Tabs.Tab id="checks">Checks</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel id="overview">
                      Everything at a glance.
                    </Tabs.Panel>
                    <Tabs.Panel id="checks">Three failing.</Tabs.Panel>
                  </Tabs>
                ),
                'medium',
              ),
              one(
                'all-disabled',
                'isDisabled on the whole set',
                () => (
                  <Tabs isDisabled defaultSelectedKey="overview">
                    <Tabs.List aria-label="Monitor detail">
                      <Tabs.Tab id="overview">Overview</Tabs.Tab>
                      <Tabs.Tab id="checks">Checks</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel id="overview">
                      Everything at a glance.
                    </Tabs.Panel>
                  </Tabs>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'toolbar',
        title: 'Toolbar',
        rows: [
          {
            axis: 'orientation',
            previews: [
              one(
                'horizontal',
                'orientation: horizontal',
                () => (
                  <Toolbar aria-label="Range">
                    <Toolbar.Group>
                      <ToggleButton defaultSelected>1h</ToggleButton>
                      <ToggleButton>24h</ToggleButton>
                      <ToggleButton>7d</ToggleButton>
                    </Toolbar.Group>
                    <Toolbar.Separator />
                    <ToggleButton variant="ghost">Live</ToggleButton>
                  </Toolbar>
                ),
                'medium',
              ),
              one(
                'vertical',
                'orientation: vertical',
                () => (
                  <Toolbar aria-label="Range" orientation="vertical">
                    <Toolbar.Group>
                      <ToggleButton defaultSelected>1h</ToggleButton>
                      <ToggleButton>24h</ToggleButton>
                    </Toolbar.Group>
                    <Toolbar.Separator />
                    <ToggleButton variant="ghost">Live</ToggleButton>
                  </Toolbar>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    groups: [
      {
        id: 'table',
        title: 'Table',
        rows: [
          {
            axis: 'selectionMode',
            previews: [
              one(
                'none',
                'selectionMode: none',
                () => (
                  <Table aria-label="Monitors" className="w-full">
                    <Table.Header>
                      <Table.Column isRowHeader>Monitor</Table.Column>
                      <Table.Column>Status</Table.Column>
                      <Table.Column>Uptime</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {MONITORS.map((monitor) => (
                        <Table.Row key={monitor.id} id={monitor.id}>
                          <Table.Cell>{monitor.name}</Table.Cell>
                          <Table.Cell>{monitor.status}</Table.Cell>
                          <Table.Cell>{monitor.uptime}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ),
                'medium',
              ),
              one(
                'single',
                'selectionMode: single',
                () => (
                  <Table
                    aria-label="Monitors"
                    selectionMode="single"
                    className="w-full"
                  >
                    <Table.Header>
                      <Table.Column isRowHeader>Monitor</Table.Column>
                      <Table.Column>Status</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {MONITORS.map((monitor) => (
                        <Table.Row key={monitor.id} id={monitor.id}>
                          <Table.Cell>{monitor.name}</Table.Cell>
                          <Table.Cell>{monitor.status}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ),
                'medium',
              ),
              one(
                'multiple',
                'selectionMode: multiple, with a selection column',
                () => (
                  <Table
                    aria-label="Monitors"
                    selectionMode="multiple"
                    defaultSelectedKeys={['fra1']}
                    className="w-full"
                  >
                    <Table.Header>
                      <Table.Column width={48}>
                        <Table.Selection />
                      </Table.Column>
                      <Table.Column isRowHeader>Monitor</Table.Column>
                      <Table.Column>Status</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {MONITORS.map((monitor) => (
                        <Table.Row key={monitor.id} id={monitor.id}>
                          <Table.Cell>
                            <Table.Selection />
                          </Table.Cell>
                          <Table.Cell>{monitor.name}</Table.Cell>
                          <Table.Cell>{monitor.status}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ),
                'medium',
              ),
            ],
          },
          {
            axis: 'content',
            previews: [
              one(
                'empty',
                'renderEmptyState, when there is nothing to show',
                () => (
                  <Table aria-label="Monitors" className="w-full">
                    <Table.Header>
                      <Table.Column isRowHeader>Monitor</Table.Column>
                      <Table.Column>Status</Table.Column>
                    </Table.Header>
                    <Table.Body renderEmptyState={() => 'No monitors match.'} />
                  </Table>
                ),
                'medium',
              ),
              one(
                'disabled-rows',
                'disabledKeys, so a row cannot be chosen',
                () => (
                  <Table
                    aria-label="Monitors"
                    selectionMode="multiple"
                    disabledKeys={['sin1']}
                    className="w-full"
                  >
                    <Table.Header>
                      <Table.Column isRowHeader>Monitor</Table.Column>
                      <Table.Column>Status</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {MONITORS.map((monitor) => (
                        <Table.Row key={monitor.id} id={monitor.id}>
                          <Table.Cell>{monitor.name}</Table.Cell>
                          <Table.Cell>{monitor.status}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'gridlist',
        title: 'GridList',
        rows: [
          {
            axis: 'selectionMode',
            previews: [
              one(
                'single',
                'selectionMode: single, one per row',
                () => (
                  <GridList
                    aria-label="Monitors"
                    selectionMode="single"
                    className="w-full"
                  >
                    <GridList.Item id="fra1" textValue="fra1 - Frankfurt">
                      <GridList.Body>
                        <span className="font-mono text-[13px]">
                          fra1 - Frankfurt
                        </span>
                        <span className="text-[12px] text-foreground/70">
                          up - 42ms
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                    <GridList.Item id="iad1" textValue="iad1 - Virginia">
                      <GridList.Body>
                        <span className="font-mono text-[13px]">
                          iad1 - Virginia
                        </span>
                        <span className="text-[12px] text-foreground/70">
                          slow - 210ms
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                    <GridList.Item
                      id="sin1"
                      textValue="sin1 - Singapore"
                      isDisabled
                    >
                      <GridList.Body>
                        <span className="font-mono text-[13px]">
                          sin1 - Singapore
                        </span>
                        <span className="text-[12px] text-foreground/70">
                          disabled row
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                  </GridList>
                ),
                'medium',
              ),
              one(
                'grid',
                'a grid rather than a list',
                () => (
                  <GridList
                    aria-label="Monitors"
                    selectionMode="multiple"
                    className="grid w-full grid-cols-3 gap-3"
                  >
                    <GridList.Item id="fra1" textValue="fra1 - Frankfurt">
                      <GridList.Body>
                        <span className="font-mono text-[13px]">fra1</span>
                        <span className="text-[12px] text-foreground/70">
                          up
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                    <GridList.Item id="iad1" textValue="iad1 - Virginia">
                      <GridList.Body>
                        <span className="font-mono text-[13px]">iad1</span>
                        <span className="text-[12px] text-foreground/70">
                          slow
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                    <GridList.Item id="sin1" textValue="sin1 - Singapore">
                      <GridList.Body>
                        <span className="font-mono text-[13px]">sin1</span>
                        <span className="text-[12px] text-foreground/70">
                          down
                        </span>
                      </GridList.Body>
                    </GridList.Item>
                  </GridList>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'listbox',
        title: 'ListBox',
        rows: [
          {
            axis: 'selectionMode',
            previews: (['single', 'multiple'] as const).map((selectionMode) =>
              one(selectionMode, 'selectionMode=' + selectionMode, () => (
                <ListBox
                  aria-label="Region"
                  selectionMode={selectionMode}
                  defaultSelectedKeys={['fra']}
                  className="w-64"
                >
                  <ListBox.Item id="fra">Frankfurt</ListBox.Item>
                  <ListBox.Item id="iad">Ashburn</ListBox.Item>
                  <ListBox.Item id="sin" isDisabled>
                    Singapore
                  </ListBox.Item>
                </ListBox>
              )),
            ),
          },
          {
            axis: 'sections',
            previews: [
              one('sections', 'sections with their own headers', () => (
                <ListBox
                  aria-label="Region"
                  selectionMode="single"
                  className="w-64"
                >
                  <ListBox.Section>
                    <ListBox.Header>Europe</ListBox.Header>
                    <ListBox.Item id="fra">Frankfurt</ListBox.Item>
                    <ListBox.Item id="ams">Amsterdam</ListBox.Item>
                  </ListBox.Section>
                  <ListBox.Section>
                    <ListBox.Header>Americas</ListBox.Header>
                    <ListBox.Item id="iad">Ashburn</ListBox.Item>
                  </ListBox.Section>
                </ListBox>
              )),
            ],
          },
        ],
      },
      {
        id: 'tree',
        title: 'Tree',
        rows: [
          {
            axis: 'selectionMode',
            previews: [
              one('none', 'selectionMode: none, expanded in place', () => (
                <Tree
                  aria-label="Files"
                  defaultExpandedKeys={['src']}
                  className="w-64"
                >
                  <Tree.Item id="src" textValue="src">
                    <Tree.Label>src</Tree.Label>
                    <Tree.Item id="index" textValue="index.ts">
                      <Tree.Label>index.ts</Tree.Label>
                    </Tree.Item>
                  </Tree.Item>
                  <Tree.Item id="readme" textValue="README.md">
                    <Tree.Label>README.md</Tree.Label>
                  </Tree.Item>
                </Tree>
              )),
              one('single', 'selectionMode: single', () => (
                <Tree
                  aria-label="Files"
                  selectionMode="single"
                  defaultExpandedKeys={['src']}
                  className="w-64"
                >
                  <Tree.Item id="src" textValue="src">
                    <Tree.Label>src</Tree.Label>
                    <Tree.Item id="index" textValue="index.ts">
                      <Tree.Label>index.ts</Tree.Label>
                    </Tree.Item>
                  </Tree.Item>
                </Tree>
              )),
              one('multiple', 'selectionMode: multiple', () => (
                <Tree
                  aria-label="Files"
                  selectionMode="multiple"
                  className="w-64"
                >
                  <Tree.Item id="src" textValue="src">
                    <Tree.Label>src</Tree.Label>
                  </Tree.Item>
                  <Tree.Item id="docs" textValue="docs">
                    <Tree.Label>docs</Tree.Label>
                  </Tree.Item>
                </Tree>
              )),
            ],
          },
          {
            axis: 'sections',
            previews: [
              one('sections', 'sections, with a collapsed root', () => (
                <Tree
                  aria-label="Files"
                  selectionMode="single"
                  className="w-64"
                >
                  <Tree.Section>
                    <Tree.Header>Project</Tree.Header>
                    <Tree.Item id="src" textValue="src">
                      <Tree.Label>src</Tree.Label>
                    </Tree.Item>
                    <Tree.Item id="public" textValue="public">
                      <Tree.Label>public</Tree.Label>
                    </Tree.Item>
                  </Tree.Section>
                </Tree>
              )),
            ],
          },
        ],
      },
      {
        id: 'virtualizer',
        title: 'Virtualizer',
        rows: [
          {
            axis: 'a thousand rows',
            previews: [
              one(
                'virtualizer',
                'only the rows in view are rendered',
                () => (
                  <Virtualizer
                    layout={ListLayout}
                    layoutOptions={{ rowHeight: 44, estimatedRowHeight: 44 }}
                  >
                    <GridList
                      aria-label="Monitors"
                      items={MONITORS_THOUSAND}
                      selectionMode="single"
                      className="h-72 w-72 overflow-auto"
                    >
                      {(monitor: { id: string; name: string }) => (
                        <GridList.Item id={monitor.id} textValue={monitor.name}>
                          {monitor.name}
                        </GridList.Item>
                      )}
                    </GridList>
                  </Virtualizer>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'display',
    title: 'Display',
    groups: [
      {
        id: 'avatar',
        title: 'Avatar',
        rows: [
          {
            axis: 'size',
            previews: (['sm', 'md', 'lg'] as const).map((size) =>
              one(size, 'size=' + size, () => (
                <Avatar size={size} alt="Ada Lovelace" />
              )),
            ),
          },
          {
            axis: 'color',
            previews: (
              ['primary', 'secondary', 'neutral', 'success', 'danger'] as const
            ).map((color) =>
              one(color, 'color=' + color, () => (
                <Avatar color={color} alt="fra1" />
              )),
            ),
          },
          {
            axis: 'several',
            previews: [
              one(
                'group',
                'Avatar.Group: four faces, cut out of each other',
                () => (
                  <Avatar.Group label="4 teammates">
                    {TEAM_NAMES.map((name) => (
                      <Avatar key={name} alt={name} />
                    ))}
                  </Avatar.Group>
                ),
                'medium',
              ),
              one(
                'group-counted',
                'max and overflowCount: the rest as a counter',
                () => (
                  <Avatar.Group label="9 teammates" max={3} overflowCount={5}>
                    {TEAM_NAMES.map((name) => (
                      <Avatar key={name} alt={name} />
                    ))}
                  </Avatar.Group>
                ),
                'medium',
              ),
            ],
          },
          {
            axis: 'source',
            previews: [
              one('initials', 'no src, so the initials are drawn', () => (
                <Avatar alt="Ada Lovelace" />
              )),
              one(
                'image',
                'a src, which the canvas serves itself',
                () => <Avatar alt="Ada Lovelace" src={AVATAR_SRC} />,
                'medium',
              ),
              one(
                'previewable',
                'isPreviewable',
                () => (
                  <Avatar alt="Ada Lovelace" src={AVATAR_SRC} isPreviewable />
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'colorswatch',
        title: 'ColorSwatch',
        rows: [
          {
            axis: 'the palette',
            previews: [
              '#71FFF6',
              '#FAD14F',
              '#FF9A8B',
              '#B0FBB1',
              '#BFBFBF',
            ].map((hex) =>
              one(hex, 'color=' + hex, () => (
                <div className="flex items-center gap-2">
                  <ColorSwatch color={parseColor(hex)} className="size-6" />
                  <span className="font-mono text-[11px] text-foreground/60">
                    {hex}
                  </span>
                </div>
              )),
            ),
          },
        ],
      },
      {
        id: 'separator',
        title: 'Separator',
        rows: [
          {
            axis: 'variant',
            previews: (
              ['hair', 'soft', 'strong', 'dashed', 'dotted'] as const
            ).map((variant) =>
              one(variant, 'variant=' + variant, () => (
                <div className="flex w-full items-center gap-3">
                  <span className="w-16 shrink-0 font-mono text-[11px] text-foreground/60">
                    {variant}
                  </span>
                  <Separator variant={variant} className="w-full" />
                </div>
              )),
            ),
          },
          {
            axis: 'orientation',
            previews: [
              one('vertical', 'orientation: vertical', () => (
                <div className="flex h-16 items-stretch gap-3">
                  <span className="text-[13px]">Left</span>
                  <Separator orientation="vertical" />
                  <span className="text-[13px]">Right</span>
                </div>
              )),
            ],
          },
        ],
      },
      {
        id: 'visuallyhidden',
        title: 'VisuallyHidden',
        rows: [
          {
            axis: 'what it does',
            previews: [
              one(
                'name',
                'an icon-only button whose name is a VisuallyHidden line',
                () => (
                  <Button variant="icon">
                    <Button.Icon>
                      <Plus />
                    </Button.Icon>
                    <VisuallyHidden>Add monitor</VisuallyHidden>
                  </Button>
                ),
                'medium',
              ),
              one(
                'inside-a-sentence',
                'inside a sentence, where a div would break the markup',
                () => (
                  <p className="m-0 text-[13px] text-foreground/70">
                    Uptime{' '}
                    <VisuallyHidden>checked every 60 seconds</VisuallyHidden>{' '}
                    99.98%
                  </p>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'sharedelement',
        title: 'SharedElement',
        rows: [
          {
            axis: 'a move between parents',
            previews: [
              one(
                'shared',
                'one element that animates between two parents',
                () => <SharedElementPreview />,
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'accordion',
        title: 'Accordion',
        rows: [
          {
            axis: 'expansion',
            previews: [
              one(
                'one-at-a-time',
                'one panel at a time',
                () => (
                  <Accordion
                    defaultExpandedKeys={['checks']}
                    className="w-full"
                  >
                    <Accordion.Item id="checks">
                      <Accordion.Header>Checks</Accordion.Header>
                      <Accordion.Panel>
                        Three checks are failing.
                      </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item id="history">
                      <Accordion.Header>History</Accordion.Header>
                      <Accordion.Panel>
                        No incidents in 24 hours.
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                ),
                'medium',
              ),
              one(
                'allows-multiple',
                'allowsMultipleExpanded',
                () => (
                  <Accordion
                    allowsMultipleExpanded
                    defaultExpandedKeys={['checks', 'history']}
                    className="w-full"
                  >
                    <Accordion.Item id="checks">
                      <Accordion.Header>Checks</Accordion.Header>
                      <Accordion.Panel>
                        Three checks are failing.
                      </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item id="history">
                      <Accordion.Header>History</Accordion.Header>
                      <Accordion.Panel>
                        No incidents in 24 hours.
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                ),
                'medium',
              ),
              one(
                'disabled-item',
                'a disabled item',
                () => (
                  <Accordion className="w-full">
                    <Accordion.Item id="checks">
                      <Accordion.Header>Checks</Accordion.Header>
                      <Accordion.Panel>
                        Three checks are failing.
                      </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item id="history" isDisabled>
                      <Accordion.Header>History</Accordion.Header>
                      <Accordion.Panel>
                        No incidents in 24 hours.
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'card',
        title: 'Card',
        rows: [
          {
            axis: 'anatomy',
            previews: [
              one(
                'full',
                'a header, a title, a description, an action, content and a footer',
                () => (
                  <Card>
                    <Card.Header>
                      <Card.Title>Frankfurt</Card.Title>
                      <Card.Description>fra1 - 42ms</Card.Description>
                      <Card.Action>
                        <Button variant="icon" aria-label="Monitor actions">
                          <Button.Icon>
                            <Caret />
                          </Button.Icon>
                        </Button>
                      </Card.Action>
                    </Card.Header>
                    <Card.Content>
                      <Sparkline
                        data={[12, 18, 15, 24, 21, 30]}
                        label="Requests, last 6 hours"
                      />
                    </Card.Content>
                    <Card.Footer>
                      <Button variant="outline">Open</Button>
                    </Card.Footer>
                  </Card>
                ),
                'medium',
              ),
              one(
                'title-only',
                'a title on its own',
                () => (
                  <Card>
                    <Card.Title>Frankfurt</Card.Title>
                  </Card>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chart',
    title: 'Chart',
    groups: [
      {
        id: 'barchart',
        title: 'BarChart',
        rows: [
          {
            axis: 'a series',
            previews: [
              one(
                'labelled',
                'values, labels and one highlighted bar',
                () => (
                  <BarChart
                    values={[12, 30, 18, 44, 26, 9]}
                    labels={['00', '04', '08', '12', '16', '20']}
                    highlightIndex={3}
                    width={552}
                    height={140}
                    label="Requests per four hours"
                  />
                ),
                'medium',
              ),
              one(
                'plain',
                'the same series without labels or a highlight',
                () => (
                  <BarChart
                    values={[12, 30, 18, 44, 26, 9]}
                    width={552}
                    height={140}
                    label="Requests per four hours"
                  />
                ),
                'medium',
              ),
            ],
          },
          {
            axis: 'highlightIndex',
            previews: [0, 2, 5].map((index) =>
              one('highlight-' + index, 'highlightIndex=' + index, () => (
                <BarChart
                  values={[12, 30, 18, 44, 26, 9]}
                  highlightIndex={index}
                  width={360}
                  height={110}
                  label="Requests per four hours"
                />
              )),
            ),
          },
        ],
      },
      {
        id: 'sparkline',
        title: 'Sparkline',
        rows: [
          {
            axis: 'data',
            previews: [
              one('varying', 'a series that moves', () => (
                <Sparkline
                  data={[12, 18, 15, 24, 21, 30]}
                  width={360}
                  height={80}
                  label="Requests, last 6 hours"
                />
              )),
              one('flat', 'a series that does not', () => (
                <Sparkline
                  data={[20, 20, 20, 20, 20, 20]}
                  width={360}
                  height={80}
                  label="Requests, last 6 hours"
                />
              )),
              one('spiky', 'a series with one spike', () => (
                <Sparkline
                  data={[8, 9, 8, 40, 9, 8]}
                  width={360}
                  height={80}
                  label="Requests, last 6 hours"
                />
              )),
            ],
          },
        ],
      },
      {
        id: 'flatline',
        title: 'FlatLine',
        rows: [
          {
            axis: 'lineY',
            previews: [
              one('middle', 'the default line', () => (
                <FlatLine width={360} height={80} label="fra1 uptime, 100%" />
              )),
              one('high', 'lineY: 6, near the top', () => (
                <FlatLine
                  width={360}
                  height={80}
                  lineY={6}
                  label="iad1 uptime, 100%"
                />
              )),
              one('low', 'lineY: 68, near the bottom', () => (
                <FlatLine
                  width={360}
                  height={80}
                  lineY={68}
                  label="sin1 uptime, 100%"
                />
              )),
            ],
          },
        ],
      },
      {
        id: 'dotmap',
        title: 'DotMap',
        rows: [
          {
            axis: 'dots',
            previews: [
              one(
                'world',
                'the generated world, with one accented origin',
                () => (
                  <DotMap
                    dots={[...WORLD_DOTS, [292.5, 243.5, 1, 'fra1 - 1.2m']]}
                    width={528}
                    height={264}
                    label="Request origins, last hour"
                  />
                ),
                'medium',
              ),
              one(
                'fit',
                'fit, which scales the drawing to its box',
                () => (
                  <DotMap
                    dots={WORLD_DOTS}
                    width={528}
                    height={264}
                    fit
                    label="Request origins, last hour"
                  />
                ),
                'medium',
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    groups: [
      {
        id: 'progressbar',
        title: 'ProgressBar',
        rows: [
          {
            axis: 'value',
            previews: [0, 25, 72, 100].map((value) =>
              one('value-' + value, 'value=' + value, () => (
                <ProgressBar value={value} className="w-full">
                  <ProgressBar.Label>Uptime</ProgressBar.Label>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              )),
            ),
          },
          {
            axis: 'content',
            previews: [
              one(
                'header',
                'a header with the value written out',
                () => (
                  <ProgressBar value={72} className="w-full">
                    <ProgressBar.Header>
                      <ProgressBar.Label>Uptime</ProgressBar.Label>
                      <ProgressBar.Value />
                    </ProgressBar.Header>
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                ),
                'medium',
              ),
              one(
                'indeterminate',
                'isIndeterminate, which is not a value',
                () => (
                  <ProgressBar isIndeterminate className="w-full">
                    <ProgressBar.Label>Checking</ProgressBar.Label>
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                ),
                'medium',
              ),
              one(
                'formatOptions',
                'a styled value',
                () => (
                  <ProgressBar
                    value={0.72}
                    minValue={0}
                    maxValue={1}
                    formatOptions={{ style: 'percent' }}
                    className="w-full"
                  >
                    <ProgressBar.Header>
                      <ProgressBar.Label>Budget used</ProgressBar.Label>
                      <ProgressBar.Value />
                    </ProgressBar.Header>
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
      {
        id: 'meter',
        title: 'Meter',
        rows: [
          {
            axis: 'tone',
            previews: (
              ['accent', 'success', 'warning', 'danger', 'neutral'] as const
            ).map((tone) =>
              one(tone, 'tone=' + tone, () => (
                <Meter value={72} className="w-full">
                  <Meter.Header>
                    <Meter.Label>Disk</Meter.Label>
                    <Meter.Value />
                  </Meter.Header>
                  <Meter.Track>
                    <Meter.Fill tone={tone} />
                  </Meter.Track>
                </Meter>
              )),
            ),
          },
          {
            axis: 'value',
            previews: [12, 82, 99].map((value) =>
              one('value-' + value, 'value=' + value, () => (
                <Meter value={value} className="w-full">
                  <Meter.Header>
                    <Meter.Label>Disk</Meter.Label>
                    <Meter.Value />
                  </Meter.Header>
                  <Meter.Track>
                    <Meter.Fill tone={value > 80 ? 'danger' : 'success'} />
                  </Meter.Track>
                </Meter>
              )),
            ),
          },
        ],
      },
      {
        id: 'skeleton',
        title: 'Skeleton',
        rows: [
          {
            axis: 'what it stands in for',
            previews: [
              one(
                'card',
                'a card of mock content, laid out as the real one will be',
                () => (
                  <Skeleton>
                    <Card>
                      <Card.Header>
                        <Card.Title>Uptime</Card.Title>
                        <Card.Description>
                          api-gateway · last 24 hours
                        </Card.Description>
                      </Card.Header>
                      <Card.Content>
                        Every monitor answered inside its window.
                      </Card.Content>
                    </Card>
                  </Skeleton>
                ),
                'medium',
              ),
              one(
                'lines',
                'lines sized by the caller, the way a skeleton screen is drawn',
                () => (
                  <div className="flex w-full flex-col gap-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ),
                'medium',
              ),
            ],
          },
          {
            axis: 'loaded',
            previews: [
              one(
                'isLoading-false',
                'isLoading={false}, which renders no element of its own',
                () => (
                  <Skeleton isLoading={false}>
                    <Card>
                      <Card.Header>
                        <Card.Title>Uptime</Card.Title>
                        <Card.Description>
                          api-gateway · last 24 hours
                        </Card.Description>
                      </Card.Header>
                      <Card.Content>
                        Every monitor answered inside its window.
                      </Card.Content>
                    </Card>
                  </Skeleton>
                ),
                'medium',
              ),
            ],
          },
        ],
      },
    ],
  },
]

export const CANVAS_CATEGORIES: CanvasCategory[] = CATEGORIES
