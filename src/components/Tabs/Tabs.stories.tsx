import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import {
  Tabs,
  TabsCount,
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
} from './Tabs'

const meta = {
  component: Tabs,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Tabs.List': TabsList,
    'Tabs.Tab': TabsTab,
    'Tabs.Count': TabsCount,
    'Tabs.Panels': TabsPanels,
    'Tabs.Panel': TabsPanel,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Tabs defaultSelectedKey="overview">
  <Tabs.List aria-label="Monitor detail">
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="checks">
      Checks <Tabs.Count>3</Tabs.Count>
    </Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Everything at a glance.</Tabs.Panel>
  <Tabs.Panel id="checks">Three failing.</Tabs.Panel>
</Tabs>`,
      },
    },
    layout: 'centered',
  },
  args: {
    defaultSelectedKey: 'overview',
    isDisabled: false,
  },
  argTypes: {
    defaultSelectedKey: { control: 'text' },
    isDisabled: { control: 'boolean' },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
  render: (args) => (
    <Tabs {...args} className="w-96">
      <Tabs.List aria-label="Monitor detail">
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="checks">
          Checks <Tabs.Count>3</Tabs.Count>
        </Tabs.Tab>
        <Tabs.Tab id="history">History</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="overview">
        Everything at a glance for this monitor.
      </Tabs.Panel>
      <Tabs.Panel id="checks">Three checks are failing.</Tabs.Panel>
      <Tabs.Panel id="history">No incidents in the last 24 hours.</Tabs.Panel>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const tabOf = (canvasElement: HTMLElement, name: RegExp) =>
  [...canvasElement.querySelectorAll<HTMLElement>('[role=tab]')].find((tab) =>
    name.test(tab.textContent),
  ) as HTMLElement

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' })
    const checks = canvas.getByRole('tab', { name: /checks/i })

    await expect(overview).toHaveAttribute('aria-selected', 'true')
    await expect(checks).not.toHaveAttribute('aria-selected', 'true')

    // React Aria renders the selected panel and nothing else — the others are unmounted, not
    // merely hidden, so an unselected panel's contents are not in the document at all. Keeping
    // them is opt-in, with `shouldForceMount` on the panel.
    await expect(canvas.getByText(/everything at a glance/i)).toBeVisible()
    await expect(canvas.queryByText(/three checks are failing/i)).toBeNull()
    await expect(
      canvasElement.querySelectorAll('[role=tabpanel]'),
    ).toHaveLength(1)

    // The count is a slot, so it carries its own styling rather than being a number in a prop.
    const count = tabOf(canvasElement, /checks/i).querySelector(
      '[data-slot=count]',
    ) as HTMLElement
    await expect(count).toHaveTextContent('3')
    await expect(getComputedStyle(count).color).toBe(
      'oklch(0.8733 0.1505 91.2)',
    ) // --color-yellow

    // The indicator is an `::after` on the tab, inset to the label rather than the cell, and it
    // fades rather than growing — a border going 0 to 2px would shift every tab in the row.
    await expect(getComputedStyle(overview, '::after').opacity).toBe('1')
    await expect(getComputedStyle(checks, '::after').opacity).toBe('0')
    await expect(getComputedStyle(overview, '::after').height).toBe('2px')
  },
}

export const Keyboard: Story = {
  // The whole set is one tab stop and the arrow keys move between tabs, which is what lets a
  // keyboard user step past the strip rather than through it.
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' })
    const checks = canvas.getByRole('tab', { name: /checks/i })
    const history = canvas.getByRole('tab', { name: 'History' })

    await userEvent.tab()
    await expect(overview).toHaveFocus()
    // One stop for three tabs.
    await expect(checks).toHaveAttribute('tabindex', '-1')

    await userEvent.keyboard('{ArrowRight}')
    await expect(checks).toHaveFocus()
    // Arrow keys select as they move, so the panel follows the focus.
    await expect(checks).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowRight}')
    await expect(history).toHaveFocus()

    // ...and it wraps, so the strip never becomes a dead end at either end.
    await userEvent.keyboard('{ArrowRight}')
    await expect(overview).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    await expect(history).toHaveFocus()
  },
}

export const Click: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: /checks/i }))
    await expect(canvas.getByRole('tab', { name: /checks/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByText(/three checks are failing/i)).toBeVisible()
    await expect(canvas.queryByText(/everything at a glance/i)).toBeNull()

    // Each tab points at the panel it controls, which is what ties the two halves together for
    // assistive tech rather than for the eye.
    const checks = canvas.getByRole('tab', { name: /checks/i })
    const panelId = checks.getAttribute('aria-controls') as string
    await expect(document.getElementById(panelId)).toBeInTheDocument()
    await expect(document.getElementById(panelId)).toHaveAttribute(
      'aria-labelledby',
      checks.id,
    )
  },
}

export const Panels: Story = {
  render: (args) => (
    <Tabs {...args} className="w-96">
      <Tabs.List aria-label="Monitor detail">
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="checks">Checks</Tabs.Tab>
      </Tabs.List>
      {/* Optional, but it keeps the set's two halves readable when the contents are long. */}
      <Tabs.Panels>
        <Tabs.Panel id="overview">Everything at a glance.</Tabs.Panel>
        <Tabs.Panel id="checks">Three checks are failing.</Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll('[role=tabpanel]'),
    ).toHaveLength(1)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByText(/three checks are failing/i)).toBeVisible()
  },
}

export const Orientation: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <Tabs {...args} className="flex w-96 gap-6">
      <Tabs.List aria-label="Monitor detail">
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="checks">Checks</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="overview">Everything at a glance.</Tabs.Panel>
      <Tabs.Panel id="checks">Three checks are failing.</Tabs.Panel>
    </Tabs>
  ),
  // The orientation describes the *strip*. It has to actually turn — a vertical list that only
  // moved the panel beside it would announce itself as vertical and still read as a row — and it
  // is announced too, because the arrow keys that move within the set differ by axis.
  play: async ({ canvas, canvasElement }) => {
    const list = canvas.getByRole('tablist')
    await expect(list).toHaveAttribute('aria-orientation', 'vertical')

    // The tabs stack...
    await expect(getComputedStyle(list).flexDirection).toBe('column')
    // ...and the hairline moves from under the strip to its trailing edge, so the indicator still
    // has something to sit on.
    const listStyles = getComputedStyle(list)
    await expect(listStyles.borderBottomWidth).toBe('0px')
    await expect(listStyles.borderInlineEndWidth).toBe('1px')

    await userEvent.tab()
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    // Down rather than across.
    await userEvent.keyboard('{ArrowDown}')
    const checks = canvas.getByRole('tab', { name: 'Checks' })
    await expect(checks).toHaveFocus()
    await expect(checks).toHaveAttribute('aria-selected', 'true')

    // The indicator turns with the strip: 2px *wide* now, running down the tab's own text rather
    // than across it, and still in the accent. Its opacity is left to the Default story — the
    // indicator fades, so reading it here would catch it mid-fade.
    const indicator = getComputedStyle(checks, '::after')
    await expect(indicator.width).toBe('2px')
    await expect(indicator.height).not.toBe('2px')
    await expect(indicator.insetInlineEnd).toBe('-1px')
    await expect(indicator.backgroundColor).toBe('oklch(0.9198 0.1236 189.5)')
    await expect(canvasElement).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' })
    // Disabled tabs are still focusable — a keyboard user has to be able to reach the set to be
    // told it is disabled — so each one reports its own state rather than the set hiding.
    await expect(overview).toHaveAttribute('aria-disabled', 'true')
    await expect(overview).toHaveAttribute('data-disabled', 'true')
    await expect(getComputedStyle(overview).opacity).toBe('0.35')
  },
}

export const FocusRing: Story = {
  // A tab's edge is its indicator, which is 2px and only there when selected, so the ring
  // surrounds the label rather than repeating anything — which is why the sheet gives a tab the
  // shared ring, and a field does not.
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' })
    // `transition-colors` covers `outline-color` too, so the ring would be read mid-fade
    // straight after focusing. Freeze it, as the other focus stories do.
    overview.style.transition = 'none'
    await expect(getComputedStyle(overview).outlineStyle).toBe('none')

    await userEvent.tab()
    await expect(overview).toHaveFocus()
    await expect(getComputedStyle(overview).outlineStyle).toBe('solid')
    await expect(getComputedStyle(overview).outlineColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(overview).outlineOffset).toBe('3px')
  },
}
