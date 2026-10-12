import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { TextField } from '../TextField/TextField'
import {
  Select,
  SelectButton,
  SelectFieldError,
  SelectHint,
  SelectIcon,
  SelectLabel,
  SelectAutoComplete,
  SelectMenu,
  SelectOption,
  SelectOptionList,
  SelectPopover,
  SelectSection,
  SelectSectionTitle,
  SelectValueSlot,
} from './Select'

const meta = {
  component: Select,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Select.Label': SelectLabel,
    'Select.Value': SelectValueSlot,
    'Select.Button': SelectButton,
    'Select.Icon': SelectIcon,
    'Select.Popover': SelectPopover,
    'Select.AutoComplete': SelectAutoComplete,
    'Select.OptionList': SelectOptionList,
    'Select.Menu': SelectMenu,
    'Select.Option': SelectOption,
    'Select.Section': SelectSection,
    'Select.SectionTitle': SelectSectionTitle,
    'Select.Hint': SelectHint,
    'Select.Error': SelectFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Select defaultSelectedKey="https" placeholder="Choose a protocol">
  <Select.Label>Protocol</Select.Label>
  <Select.Button>
    <Select.Value />
    <Select.Icon />
  </Select.Button>
  <Select.Popover>
    <Select.AutoComplete>
      <Select.Search />
      <Select.OptionList>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
      </Select.OptionList>
    </Select.AutoComplete>
  </Select.Popover>
  <Select.Hint>Applies to every check.</Select.Hint>
  <Select.Error>Choose a protocol.</Select.Error>
</Select>`,
      },
    },
    layout: 'centered',
  },
  args: {
    size: 'md',
    defaultSelectedKey: 'https',
    placeholder: 'Choose a protocol',
    isDisabled: false,
    isRequired: false,
    isInvalid: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    defaultSelectedKey: { control: 'text' },
    placeholder: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
  },
  render: (args) => (
    <Select {...args} className="w-80">
      <Select.Label>Protocol</Select.Label>
      <Select.Button>
        <Select.Value />
        <Select.Icon />
      </Select.Button>
      <Select.Menu>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
        <Select.Option id="tcp">TCP</Select.Option>
      </Select.Menu>
      <Select.Hint>Applies to every check.</Select.Hint>
    </Select>
  ),
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })

    // The value lives in the trigger, so a form can read it back and the user can see
    // what is set without opening anything.
    await expect(trigger).toHaveTextContent('HTTPS')
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    // The menu is portalled out of the story root, so it is queried from the document.
    const listbox = await screen.findByRole('listbox')
    await expect(listbox).toBeInTheDocument()

    // The chosen option is marked by the accent, by `aria-selected`, and by the sheet's
    // literal `[SET]`.
    const chosen = screen.getByRole('option', { name: /https/i })
    await expect(chosen).toHaveAttribute('aria-selected', 'true')
    await expect(chosen).toHaveTextContent('[SET]')
    await expect(
      screen.getByRole('option', { name: /^http$/i }),
    ).not.toHaveAttribute('aria-selected', 'true')

    // Picking one closes the menu and moves the value.
    await userEvent.click(screen.getByRole('option', { name: /^http$/i }))
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await expect(trigger).toHaveTextContent('HTTP')
  },
}

export const Multiple: Story = {
  // Not spread from the meta's args: those are typed for single selection, and a multiple
  // select takes keys rather than a key. The mode is inferred from `selectionMode`.
  render: () => (
    <Select
      selectionMode="multiple"
      defaultValue={['http', 'https', 'tcp']}
      placeholder="Choose protocols"
      className="w-80"
    >
      <Select.Label>Protocols</Select.Label>
      <Select.Button>
        <Select.Value />
        <Select.Icon />
      </Select.Button>
      <Select.Menu>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
        <Select.Option id="tcp">TCP</Select.Option>
        <Select.Option id="udp">UDP</Select.Option>
      </Select.Menu>
    </Select>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocols/i })

    // Three chosen, and the trigger still says what and how many. Listing all three would
    // truncate the moment the list outgrows the field; the count never can.
    await expect(trigger).toHaveTextContent('HTTP')
    const count = trigger.querySelector(
      '[data-slot=value-count]',
    ) as HTMLElement
    await expect(count).toHaveTextContent('+2')
    // A chip, so it cannot be the part the ellipsis eats.
    await expect(getComputedStyle(count).flexShrink).toBe('0')

    // Selecting in a multiple select adds rather than replaces, and leaves the menu open so
    // the next one can follow.
    await userEvent.click(trigger)
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: 'UDP' }))
    await expect(screen.queryByRole('listbox')).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: /protocols/i }),
    ).toHaveTextContent('+3')

    // Back to one, and the count goes away rather than reading "+0".
    await userEvent.click(screen.getByRole('option', { name: 'HTTP' }))
    await userEvent.click(screen.getByRole('option', { name: 'HTTPS' }))
    await userEvent.click(screen.getByRole('option', { name: 'TCP' }))
    await userEvent.keyboard('{Escape}')

    const after = canvas.getByRole('button', { name: /protocols/i })
    await expect(after).toHaveTextContent('UDP')
    await expect(after.querySelector('[data-slot=value-count]')).toBeNull()
  },
}

export const ValueSummary: Story = {
  // The same trigger at every count, which is the case that matters for a multiple select:
  // the value has to stay readable as the selection grows, and stay silent at one.
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {[
        { keys: [], note: 'none' },
        { keys: ['http'], note: 'one' },
        { keys: ['http', 'https'], note: 'two' },
        { keys: ['http', 'https', 'tcp'], note: 'three' },
        { keys: ['http', 'https', 'tcp', 'udp'], note: 'four' },
      ].map(({ keys, note }) => (
        <Select
          key={note}
          selectionMode="multiple"
          defaultValue={keys}
          placeholder="Choose protocols"
          className="w-80"
        >
          <Select.Button>
            <Select.Value />
            <Select.Icon />
          </Select.Button>
          <Select.Menu>
            <Select.Option id="http">HTTP</Select.Option>
            <Select.Option id="https">HTTPS</Select.Option>
            <Select.Option id="tcp">TCP</Select.Option>
            <Select.Option id="udp">UDP</Select.Option>
          </Select.Menu>
        </Select>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const triggers = [...canvasElement.querySelectorAll('button')]
    await expect(triggers).toHaveLength(5)

    // None: the placeholder, at the placeholder weight. One: the name, and no count — a
    // lone selection reading "HTTP +0" would be noise.
    await expect(triggers[0]).toHaveTextContent('Choose protocols')
    await expect(triggers[1]).toHaveTextContent('HTTP')
    await expect(
      triggers[1].querySelector('[data-slot=value-count]'),
    ).toBeNull()

    // Beyond that the count carries the rest, so the trigger never depends on the names
    // fitting.
    await expect(triggers[2]).toHaveTextContent('+1')
    await expect(triggers[3]).toHaveTextContent('+2')
    await expect(triggers[4]).toHaveTextContent('+3')
    // ...and every one of them still names the first selection. Only from two up: at one,
    // the value is React Aria's own markup, with no slot of ours inside it.
    for (const t of triggers.slice(2)) {
      await expect(t.querySelector('[data-slot=value-text]')).toHaveTextContent(
        'HTTP',
      )
    }
  },
}

export const Placeholder: Story = {
  args: { defaultSelectedKey: null },
  // Nothing chosen reads at 35%, the same weight as an input's placeholder — so "empty"
  // looks the same wherever it appears on the page.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    await expect(trigger).toHaveTextContent('Choose a protocol')

    const value = trigger.querySelector('[data-slot=value]') as HTMLElement
    await expect(value).toHaveAttribute('data-placeholder')
    await expect(getComputedStyle(value).color).toBe('oklab(1 0 0 / 0.35)')
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-end gap-3">
          <TextField size={size} defaultValue="" className="w-48">
            <TextField.Input placeholder="A field" />
          </TextField>
          <Select {...args} size={size} className="w-48">
            <Select.Button>
              <Select.Value />
              <Select.Icon />
            </Select.Button>
            <Select.Menu>
              <Select.Option id="https">HTTPS</Select.Option>
            </Select.Menu>
          </Select>
        </div>
      ))}
    </div>
  ),
  // The point of the shared tokens: a select and a field line up in a column at every
  // size, because both take their height from `--field-control-h` rather than agreeing
  // by hand. This is the assertion that keeps that true.
  play: async ({ canvasElement }) => {
    const fields = [...canvasElement.querySelectorAll('input[data-slot=input]')]
    const triggers = [...canvasElement.querySelectorAll('button')]
    await expect(fields.length).toBe(3)
    await expect(triggers.length).toBe(3)

    const heights = fields.map((field, i) => [
      getComputedStyle(field).height,
      getComputedStyle(triggers[i]).height,
    ])
    for (const [fieldHeight, triggerHeight] of heights) {
      await expect(triggerHeight).toBe(fieldHeight)
    }
    // ...and that the sizes are actually different, or the above would pass vacuously.
    await expect(heights[0][0]).not.toBe(heights[1][0])
    await expect(heights[1][0]).not.toBe(heights[2][0])
  },
}

export const Search: Story = {
  render: (args) => (
    <Select
      {...args}
      defaultSelectedKey="fra"
      className="w-80"
      placeholder="Choose a monitor"
    >
      <Select.Label>Monitor</Select.Label>
      <Select.Button>
        <Select.Value />
        <Select.Icon />
      </Select.Button>
      <Select.Popover>
        <Select.AutoComplete placeholder="Filter monitors…">
          <Select.OptionList>
            <Select.Option id="fra">fra1 · Frankfurt</Select.Option>
            <Select.Option id="iad">iad1 · Virginia</Select.Option>
            <Select.Option id="sfo">sfo1 · San Francisco</Select.Option>
            <Select.Option id="stg">stg1 · Staging</Select.Option>
          </Select.OptionList>
        </Select.AutoComplete>
      </Select.Popover>
    </Select>
  ),
  // `Select.AutoComplete` supplies `startsWith` as its filter by default, and does so for a
  // reason worth knowing: React Aria's own default filter is not applied to a Select's
  // collection, so a scope left without one leaves the list unfiltered however the input is
  // wired. The default is also a choice — a substring match would keep iad1 · Virginia.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /monitor/i }))
    await screen.findByRole('listbox')
    await expect(screen.getAllByRole('option')).toHaveLength(4)

    const search = screen.getByRole('searchbox', { name: /filter monitors/i })
    await userEvent.type(search, 'fra')

    // Filtered, not merely scrolled to: three options go away.
    await expect(screen.getAllByRole('option')).toHaveLength(1)
    await expect(
      screen.getByRole('option', { name: /fra1/i }),
    ).toBeInTheDocument()

    // Narrowing from the start rather than matching anywhere: "Virginia" contains this query
    // but does not begin with it, so the option drops out.
    await userEvent.clear(search)
    await userEvent.type(search, 'virginia')
    await expect(screen.queryAllByRole('option')).toHaveLength(0)

    // Clearing brings them back, so the list is never left stuck on a stale query.
    await userEvent.clear(search)
    await expect(screen.getAllByRole('option')).toHaveLength(4)

    // And choosing still works after all of that.
    await userEvent.click(screen.getByRole('option', { name: /sfo1/i }))
    await expect(
      canvas.getByRole('button', { name: /monitor/i }),
    ).toHaveTextContent('sfo1')
  },
}

export const Grouped: Story = {
  render: (args) => (
    <Select {...args} className="w-80">
      <Select.Label>Monitor</Select.Label>
      <Select.Button>
        <Select.Value />
        <Select.Icon />
      </Select.Button>
      <Select.Menu>
        <Select.Section>
          <Select.SectionTitle>Edge</Select.SectionTitle>
          <Select.Option id="fra">fra1 · Frankfurt</Select.Option>
          <Select.Option id="iad">iad1 · Virginia</Select.Option>
        </Select.Section>
        <Select.Section>
          <Select.SectionTitle>Internal</Select.SectionTitle>
          <Select.Option id="stg">stg1 · Staging</Select.Option>
        </Select.Section>
      </Select.Menu>
    </Select>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /monitor/i }))
    await screen.findByRole('listbox')
    // React Aria groups the options for a screen reader rather than only drawing a
    // heading above them, so the heading is reachable as a group name.
    const groups = screen.getAllByRole('group')
    await expect(groups.length).toBe(2)
    await expect(
      screen.getByRole('group', { name: /edge/i }),
    ).toBeInTheDocument()
    await expect(
      screen.getByRole('option', { name: /fra1/i }),
    ).toBeInTheDocument()
  },
}

export const Error: Story = {
  args: { defaultSelectedKey: null, isInvalid: true },
  // The meta render carries a hint but no error, so this story draws its own.
  render: (args) => (
    <Select {...args} className="w-80">
      <Select.Label>Protocol</Select.Label>
      <Select.Button>
        <Select.Value />
        <Select.Icon />
      </Select.Button>
      <Select.Menu>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
      </Select.Menu>
      <Select.Error>Choose a protocol to continue.</Select.Error>
    </Select>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    // The trigger is role=button, where `aria-invalid` is not supported — so React Aria
    // is right to leave it off, and the failure travels as the trigger's description.
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    const message = canvas.getByText(/choose a protocol to continue/i)
    await expect(message).toBeVisible()
    await expect(
      trigger.getAttribute('aria-describedby')?.split(' '),
    ).toContain(message.id)
    await expect(trigger.parentElement).toHaveAttribute('data-invalid', 'true')

    // Invalid borrows the field's treatment rather than inventing one: the sheet's rule
    // is `.ds-field.is-error .ds-select-btn`, the same border it gives an input.
    trigger.style.transition = 'none'
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)', // --destructive
    )
  },
}

export const Required: Story = {
  args: { isRequired: true },
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    // Required is carried where a form can see it: the native `required` on the hidden
    // `<select>`, and `data-required` on the field root for the marker to read.
    await expect(canvasElement.querySelector('select')).toHaveAttribute(
      'required',
    )
    await expect(trigger.parentElement).toHaveAttribute('data-required', 'true')

    // The marker is the label's `::after`, driven by the select's own `data-required`,
    // so it cannot drift out of sync with the prop.
    const label = canvas.getByText(/^protocol$/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
    await expect(marker.color).toBe('oklch(0.785 0.1236 29)') // --destructive
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    await expect(trigger).toBeDisabled()
    await expect(getComputedStyle(trigger).opacity).toBe('0.4')

    // Disabled means it cannot be opened at all, not merely that it looks inert.
    await userEvent.click(trigger, { pointerEventsCheck: 0 }).catch(() => {})
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  },
}

export const Keyboard: Story = {
  args: { defaultSelectedKey: null },
  // A select opened from the keyboard has to be walkable and escapable; that is most of
  // the reason to take a component library's version over a styled native one.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })

    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const listbox = await screen.findByRole('listbox')
    await expect(listbox).toBeInTheDocument()

    const http = screen.getByRole('option', { name: /^http$/i })
    const https = screen.getByRole('option', { name: /https/i })
    // The list keeps DOM focus and moves a *virtual* focus instead — `aria-activedescendant`
    // on the listbox, `data-focused` on the option — so that typing still reaches the
    // collection. Asserting `toHaveFocus` here would be asserting the wrong mechanism.
    await expect(http).toHaveAttribute('data-focused', 'true')
    await userEvent.keyboard('{ArrowDown}')
    await expect(https).toHaveAttribute('data-focused', 'true')
    await expect(http).not.toHaveAttribute('data-focused', 'true')

    await userEvent.keyboard('{Enter}')
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await expect(trigger).toHaveTextContent('HTTPS')

    // Escape leaves the value alone, which is the other half of the contract.
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await expect(trigger).toHaveTextContent('HTTPS')
  },
}

export const Hover: Story = {
  // Hover goes through `user-event`, which fires the pointer events a pointer really
  // fires — the `data-hovered` state React Aria derives from them is then the component's
  // own, not something the test put there. See the testing guidance in AGENTS.md.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    trigger.style.transition = 'none'

    // The resting hairline is what identifies the control, so hover has to strengthen it
    // rather than replace it. It goes 45% to 62%, not to the sheet's 25% — that value was
    // chosen against a transparent resting border and would dim ours.
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      'oklch(1 0 none / 0.45)',
    )
    await userEvent.hover(trigger)
    // **Waited for, because the state is React Aria's and it lands on the next commit.**
    // `userEvent.hover` fires the pointer sequence; `data-hovered` is derived from it by a
    // re-render, so a read on the very next line races that commit — and loses on a slower
    // runner, where the attribute is simply not there yet. See the testing rules in AGENTS.md.
    await waitFor(() => expect(trigger).toHaveAttribute('data-hovered', 'true'))
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      'oklch(1 0 none / 0.62)',
    )
  },
}

export const FocusRing: Story = {
  // A select's edge is a 1px hairline, so the ring `Button` carries would draw two
  // parallel teal lines with a gap between them. The sheet turns the border teal instead,
  // and Chrome's UA ring has to be switched off explicitly or it shows through.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    trigger.style.transition = 'none'

    await expect(getComputedStyle(trigger).outlineStyle).toBe('none')
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(trigger).outlineStyle).toBe('none')
  },
}

export const Icon: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Select defaultSelectedKey="https" className="w-80">
        <Select.Label>Options loaded</Select.Label>
        <Select.Button>
          <Select.Value />
          <Select.Icon />
        </Select.Button>
        <Select.Menu>
          <Select.Option id="https">HTTPS</Select.Option>
        </Select.Menu>
      </Select>
      <Select
        defaultSelectedKey="https"
        placeholder="Loading options…"
        className="w-80"
      >
        <Select.Label>Fetching</Select.Label>
        <Select.Button>
          <Select.Value />
          <Select.Icon isLoading />
        </Select.Button>
        <Select.Menu>
          <Select.Option id="https">HTTPS</Select.Option>
        </Select.Menu>
      </Select>
    </div>
  ),
  // `isLoading` swaps the caret for the spinner the Button shows while `isPending`, and
  // gives it back when it clears.
  play: async ({ canvasElement }) => {
    const [idle, loading] = [
      ...canvasElement.querySelectorAll('[data-slot=icon]'),
    ] as HTMLElement[]
    const svgOf = (el: HTMLElement) => el.querySelector('svg') as SVGElement

    // At rest: the sheet's 10x6 caret, and nothing animating.
    await expect(svgOf(idle).getAttribute('viewBox')).toBe('0 0 10 6')
    await expect(getComputedStyle(svgOf(idle)).animationName).toBe('none')

    // Loading: the Button's spinner — same 16x16 drawing, same 0.3 ring — turning.
    await expect(svgOf(loading).getAttribute('viewBox')).toBe('0 0 16 16')
    await expect(
      svgOf(loading).querySelector('circle')?.getAttribute('stroke-opacity'),
    ).toBe('0.3')
    await expect(getComputedStyle(svgOf(loading)).animationName).toBe('spin')

    // The spinner is not rotated by the caret's own rule, so opening the menu while it
    // is showing cannot set it turning at an angle.
    await expect(getComputedStyle(loading).rotate).toBe('none')
    await expect(getComputedStyle(idle).rotate).toBe('0deg')
  },
}

export const Open: Story = {
  args: { defaultSelectedKey: 'https' },
  // The open trigger holds the border and turns the caret, as the sheet's `.is-open` does.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /protocol/i })
    // The rotation lives on the icon wrapper, not on the svg inside it.
    const caret = trigger.querySelector('[data-slot=icon]') as HTMLElement
    trigger.style.transition = 'none'
    caret.style.transition = 'none'

    await expect(getComputedStyle(caret).rotate).toBe('0deg')

    await userEvent.click(trigger)
    await screen.findByRole('listbox')
    await expect(getComputedStyle(trigger).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    // The caret is its own property, so rotating it cannot disturb the centring that
    // `translate` is doing.
    await expect(getComputedStyle(caret).rotate).toBe('180deg')
  },
}
