import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { startsWith } from '../Select/Select'
import { TextField } from '../TextField/TextField'
import {
  ComboBox,
  ComboBoxButton,
  ComboBoxFieldError,
  ComboBoxGroup,
  ComboBoxHint,
  ComboBoxIcon,
  ComboBoxInput,
  ComboBoxLabel,
  ComboBoxOption,
  ComboBoxOptionList,
  ComboBoxPopover,
  ComboBoxSection,
  ComboBoxSectionTitle,
} from './ComboBox'

const MONITORS = [
  { id: 'fra', label: 'fra1 · Frankfurt' },
  { id: 'iad', label: 'iad1 · Virginia' },
  { id: 'sfo', label: 'sfo1 · San Francisco' },
  { id: 'stg', label: 'stg1 · Staging' },
]

const meta = {
  component: ComboBox,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'ComboBox.Label': ComboBoxLabel,
    'ComboBox.Group': ComboBoxGroup,
    'ComboBox.Input': ComboBoxInput,
    'ComboBox.Icon': ComboBoxIcon,
    'ComboBox.Button': ComboBoxButton,
    'ComboBox.Popover': ComboBoxPopover,
    'ComboBox.OptionList': ComboBoxOptionList,
    'ComboBox.Option': ComboBoxOption,
    'ComboBox.Section': ComboBoxSection,
    'ComboBox.SectionTitle': ComboBoxSectionTitle,
    'ComboBox.Hint': ComboBoxHint,
    'ComboBox.Error': ComboBoxFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<ComboBox defaultSelectedKey="iad">
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
    </ComboBox.OptionList>
  </ComboBox.Popover>
  <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
  <ComboBox.Error>Pick a monitor.</ComboBox.Error>
</ComboBox>`,
      },
    },
    layout: 'centered',
  },
  args: {
    size: 'md',
    defaultSelectedKey: 'iad',
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
    isInvalid: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    defaultSelectedKey: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
  },
  render: (args) => (
    <ComboBox {...args} className="w-80">
      <ComboBox.Label>Monitor</ComboBox.Label>
      <ComboBox.Group>
        <ComboBox.Icon />
        <ComboBox.Input placeholder="Search monitors…" />
        <ComboBox.Button />
      </ComboBox.Group>
      <ComboBox.Popover>
        <ComboBox.OptionList>
          {MONITORS.map((m) => (
            <ComboBox.Option key={m.id} id={m.id}>
              {m.label}
            </ComboBox.Option>
          ))}
        </ComboBox.OptionList>
      </ComboBox.Popover>
      <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
    </ComboBox>
  ),
} satisfies Meta<typeof ComboBox>

export default meta
type Story = StoryObj<typeof meta>

/** The trigger is the field's own input, and the chevron is the button beside it. */
const inputOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-slot=input]') as HTMLInputElement
const caretOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-slot=icon-end] svg') as SVGElement

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: /monitor/i })
    await expect(input).toHaveValue('iad1 · Virginia')
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // A combobox is not a select with typing bolted on: the input *is* the control, so it
    // carries the combobox role and the chevron is a separate button beside it.
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(
      canvas.getByRole('button', { name: /monitor/i }),
    ).toBeInTheDocument()

    // It filters as you type, with no autocomplete scope and no filter prop — a combobox
    // narrows by itself, which its own select does not.
    await userEvent.clear(input)
    await userEvent.type(input, 'fra')
    const listbox = await screen.findByRole('listbox')
    await expect(listbox).toBeInTheDocument()
    await expect(screen.getAllByRole('option')).toHaveLength(1)
    await expect(
      screen.getByRole('option', { name: /fra1/i }),
    ).toBeInTheDocument()

    // ...and choosing writes the option's text back into the input.
    await userEvent.click(screen.getByRole('option', { name: /fra1/i }))
    await expect(
      canvas.getByRole('combobox', { name: /monitor/i }),
    ).toHaveValue('fra1 · Frankfurt')
    // The menu fades out before React Aria unmounts it.
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    )

    // The icon is an affix the Group makes room for, not something the input knows about.
    await expect(
      canvasElement.querySelector('[data-slot=icon-start]'),
    ).toBeInTheDocument()
  },
}

export const StartsWith: Story = {
  render: (args) => (
    <ComboBox {...args} defaultFilter={startsWith} className="w-80">
      <ComboBox.Label>Monitor</ComboBox.Label>
      <ComboBox.Group>
        <ComboBox.Input placeholder="Search monitors…" />
        <ComboBox.Button />
      </ComboBox.Group>
      <ComboBox.Popover>
        <ComboBox.OptionList>
          {MONITORS.map((m) => (
            <ComboBox.Option key={m.id} id={m.id}>
              {m.label}
            </ComboBox.Option>
          ))}
        </ComboBox.OptionList>
      </ComboBox.Popover>
    </ComboBox>
  ),
  // React Aria's built-in combobox filter is a substring match. Naming one changes *how* it
  // narrows, not whether it does — which is the opposite of the select, where naming one is
  // the only thing that makes it narrow at all.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: /monitor/i })
    await userEvent.clear(input)

    // "sfo" contains "o" and "iad1 · Virginia" contains "ia"; from the start, only sfo1 fits.
    await userEvent.type(input, 'sfo')
    await screen.findByRole('listbox')
    await expect(screen.getAllByRole('option')).toHaveLength(1)

    // The proof that it is the named filter and not the default: this query is a substring of
    // an option but not a prefix of it, so a substring match would keep it and this drops it.
    await userEvent.clear(input)
    await userEvent.type(input, 'virginia')
    await expect(screen.queryAllByRole('option')).toHaveLength(0)
  },
}

export const CustomValue: Story = {
  args: { defaultSelectedKey: null, allowsCustomValue: true },
  // The line between this and a `Select`: with `allowsCustomValue` the input may hold text that
  // is in no option, so the value stops being a key into the list and becomes free text.
  play: async ({ canvas, canvasElement }) => {
    const input = inputOf(canvasElement)
    const typed: string[] = []
    input.addEventListener('input', () => typed.push(input.value))

    await userEvent.type(input, 'mon_9f2c')
    await expect(input).toHaveValue('mon_9f2c')
    // It kept every keystroke rather than snapping back to a match.
    await expect(typed).toContain('mon_9f2c')

    // Focus away without choosing, and the text is still there.
    await userEvent.tab()
    await expect(
      canvas.getByRole('combobox', { name: /monitor/i }),
    ).toHaveValue('mon_9f2c')
  },
}

export const Grouped: Story = {
  render: (args) => (
    <ComboBox {...args} defaultSelectedKey="fra" className="w-80">
      <ComboBox.Label>Monitor</ComboBox.Label>
      <ComboBox.Group>
        <ComboBox.Input placeholder="Search monitors…" />
        <ComboBox.Button />
      </ComboBox.Group>
      <ComboBox.Popover>
        <ComboBox.OptionList>
          <ComboBox.Section>
            <ComboBox.SectionTitle>Edge</ComboBox.SectionTitle>
            <ComboBox.Option id="fra">fra1 · Frankfurt</ComboBox.Option>
            <ComboBox.Option id="iad">iad1 · Virginia</ComboBox.Option>
          </ComboBox.Section>
          <ComboBox.Section>
            <ComboBox.SectionTitle>Internal</ComboBox.SectionTitle>
            <ComboBox.Option id="stg">stg1 · Staging</ComboBox.Option>
          </ComboBox.Section>
        </ComboBox.OptionList>
      </ComboBox.Popover>
    </ComboBox>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /monitor/i }))
    await screen.findByRole('listbox')
    // The headings are reachable as group names, not just drawn above the options. Asserted by
    // name rather than by count — the combobox root is a group too.
    await expect(
      screen.getByRole('group', { name: /edge/i }),
    ).toBeInTheDocument()
    await expect(
      screen.getByRole('group', { name: /internal/i }),
    ).toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { defaultSelectedKey: null, allowsEmptyCollection: true },
  render: (args) => (
    <ComboBox {...args} className="w-80">
      <ComboBox.Label>Monitor</ComboBox.Label>
      <ComboBox.Group>
        <ComboBox.Input placeholder="Search monitors…" />
        <ComboBox.Button />
      </ComboBox.Group>
      <ComboBox.Popover>
        <ComboBox.OptionList
          renderEmptyState={() => (
            <span
              data-slot="empty"
              className="block px-3.5 py-[11px] text-[13px] text-foreground/55"
            >
              No monitors match that
            </span>
          )}
        >
          {MONITORS.map((m) => (
            <ComboBox.Option key={m.id} id={m.id}>
              {m.label}
            </ComboBox.Option>
          ))}
        </ComboBox.OptionList>
      </ComboBox.Popover>
    </ComboBox>
  ),
  // An empty menu that says nothing reads as a control that has stopped working, so the empty
  // state is worth writing.
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByRole('combobox', { name: /monitor/i }),
      'zzz',
    )
    const listbox = await screen.findByRole('listbox')
    await expect(listbox).toBeInTheDocument()

    // No monitor matches, and the empty state says so rather than leaving a blank menu — which
    // would read as a control that has stopped working. React Aria gives that message the
    // `option` role, so it is counted here rather than filtered out; what matters is that no
    // *monitor* is offered.
    // The empty state arrives inside the menu, so it fades in with it.
    await waitFor(() =>
      expect(screen.getByText(/no monitors match that/i)).toBeVisible(),
    )
    await expect(
      screen.queryByRole('option', { name: /fra1/i }),
    ).not.toBeInTheDocument()
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
          <ComboBox {...args} size={size} className="w-48">
            <ComboBox.Group>
              <ComboBox.Input placeholder="A combobox" />
              <ComboBox.Button />
            </ComboBox.Group>
            <ComboBox.Popover>
              <ComboBox.OptionList>
                <ComboBox.Option id="fra">fra1</ComboBox.Option>
              </ComboBox.OptionList>
            </ComboBox.Popover>
          </ComboBox>
        </div>
      ))}
    </div>
  ),
  // The same shared tokens a field uses, so a combobox and a field line up at every size —
  // asserted rather than assumed, because two controls that agree by luck stop agreeing.
  play: async ({ canvasElement }) => {
    // Both components mark their control `data-slot=input`, so the field is picked out by its
    // own slot being the control rather than by that attribute alone.
    const boxes = Array.from(canvasElement.querySelectorAll('[role=combobox]'))
    const fields = boxes.map(
      (box) =>
        box
          .closest('[data-rac]')
          ?.parentElement?.querySelector(
            'input[data-slot=input]',
          ) as HTMLInputElement,
    )
    await expect(fields).toHaveLength(3)
    await expect(fields.every(Boolean)).toBe(true)
    for (let i = 0; i < 3; i++) {
      await expect(getComputedStyle(boxes[i]).height).toBe(
        getComputedStyle(fields[i]).height,
      )
    }
    // ...and that the sizes differ, or the loop above would pass vacuously.
    await expect(getComputedStyle(boxes[0]).height).not.toBe(
      getComputedStyle(boxes[1]).height,
    )
  },
}

export const Error: Story = {
  args: { defaultSelectedKey: null, isInvalid: true },
  render: (args) => (
    <ComboBox {...args} className="w-80">
      <ComboBox.Label>Monitor</ComboBox.Label>
      <ComboBox.Group>
        <ComboBox.Input placeholder="Search monitors…" />
        <ComboBox.Button />
      </ComboBox.Group>
      <ComboBox.Popover>
        <ComboBox.OptionList>
          {MONITORS.map((m) => (
            <ComboBox.Option key={m.id} id={m.id}>
              {m.label}
            </ComboBox.Option>
          ))}
        </ComboBox.OptionList>
      </ComboBox.Popover>
      <ComboBox.Error>Pick a monitor to continue.</ComboBox.Error>
    </ComboBox>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: /monitor/i })
    // Unlike a select, this one *does* carry `aria-invalid`: the input's role is `combobox`,
    // which supports it. A select's trigger is a button, which does not — the same prop, two
    // different answers, both correct.
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    const message = canvas.getByText(/pick a monitor to continue/i)
    await expect(message).toBeVisible()
    await expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
      message.id,
    )

    const box = inputOf(canvasElement)
    box.style.transition = 'none'
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)', // --destructive
    )
  },
}

export const Required: Story = {
  args: { isRequired: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: /monitor/i })
    await expect(input).toHaveAttribute('required')

    const label = canvas.getByText(/^monitor$/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
    await expect(marker.color).toBe('oklch(0.785 0.1236 29)') // --destructive
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement)
    await expect(input).toBeDisabled()
    await expect(getComputedStyle(input).opacity).toBe('0.4')

    // Disabled means the list cannot be opened at all, not merely that it looks inert.
    await userEvent.click(input, { pointerEventsCheck: 0 }).catch(() => {})
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  },
}

export const FocusRing: Story = {
  // A control's edge is a 1px hairline, so the ring `Button` carries would draw two parallel
  // teal lines with a gap. The sheet turns the border teal instead, and Chrome's UA ring has to
  // be switched off explicitly or it shows through as blue.
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: /monitor/i })
    const box = inputOf(canvasElement)
    box.style.transition = 'none'

    await userEvent.tab()
    await expect(input).toHaveFocus()
    await expect(getComputedStyle(box).outlineStyle).toBe('none')
    await expect(getComputedStyle(box).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}

export const Open: Story = {
  // The chevron turns and the border holds while the list is open, as the sheet's `.is-open`
  // does. Both are driven from the root, where `data-open` is.
  play: async ({ canvas, canvasElement }) => {
    const caret = caretOf(canvasElement)
    caret.style.transition = 'none'
    // The input transitions its border, so it has to be frozen too or the read below lands
    // mid-transition and sees the resting colour.
    inputOf(canvasElement).style.transition = 'none'
    await expect(getComputedStyle(caret).rotate).toBe('0deg')

    await userEvent.click(canvas.getByRole('button', { name: /monitor/i }))
    await screen.findByRole('listbox')
    await expect(getComputedStyle(caret).rotate).toBe('180deg')
    await expect(getComputedStyle(inputOf(canvasElement)).borderTopColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}
