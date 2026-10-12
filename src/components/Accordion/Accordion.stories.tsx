import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from './Accordion'

const ITEMS = [
  { id: 'checks', label: 'Checks', body: 'Three checks are failing.' },
  {
    id: 'history',
    label: 'History',
    body: 'No incidents in the last 24 hours.',
  },
  { id: 'config', label: 'Configuration', body: 'Interval 60s, timeout 10s.' },
]

const meta = {
  component: Accordion,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Accordion.Item': AccordionItem,
    'Accordion.Header': AccordionHeader,
    'Accordion.Panel': AccordionPanel,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Accordion defaultExpandedKeys={['checks']}>
  <Accordion.Item id="checks">
    <Accordion.Header>Checks</Accordion.Header>
    <Accordion.Panel>Three checks are failing.</Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item id="history">
    <Accordion.Header>History</Accordion.Header>
    <Accordion.Panel>No incidents in 24 hours.</Accordion.Panel>
  </Accordion.Item>
</Accordion>`,
      },
    },
    layout: 'centered',
  },
  args: {
    isDisabled: false,
    allowsMultipleExpanded: false,
  },
  argTypes: {
    isDisabled: { control: 'boolean' },
    allowsMultipleExpanded: { control: 'boolean' },
  },
  render: (args) => (
    <Accordion {...args} defaultExpandedKeys={['checks']} className="w-80">
      {ITEMS.map((item) => (
        <Accordion.Item key={item.id} id={item.id}>
          <Accordion.Header>{item.label}</Accordion.Header>
          <Accordion.Panel>{item.body}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

const headerOf = (canvasElement: HTMLElement, name: string) =>
  [...canvasElement.querySelectorAll<HTMLElement>('button')].find((b) =>
    b.textContent.trim().startsWith(name),
  ) as HTMLElement

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const checks = canvas.getByRole('button', { name: 'Checks' })
    const history = canvas.getByRole('button', { name: 'History' })

    await expect(checks).toHaveAttribute('aria-expanded', 'true')
    await expect(history).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.getByText(/three checks are failing/i)).toBeVisible()

    // The whole row is the button, not just the word inside it: a header sized to its label makes
    // an accordion fiddly with a mouse. So the row is as wide as the set, not as wide as "History".
    const row = headerOf(canvasElement, 'History')
    const set = canvasElement.querySelector('[data-rac]') as HTMLElement
    await expect(row.getBoundingClientRect().width).toBe(
      set.getBoundingClientRect().width,
    )
    await expect(row.getBoundingClientRect().width).toBeGreaterThan(200)
  },
}

export const TakesTurns: Story = {
  // The set decides how many may be open, and by default it is one — the difference between an
  // accordion and a stack of independent disclosures.
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Checks' }),
    ).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(canvas.getByRole('button', { name: 'History' }))
    await expect(
      canvas.getByRole('button', { name: 'History' }),
    ).toHaveAttribute('aria-expanded', 'true')
    // Opening one closes the other, so there is never a wall of open panels.
    await expect(
      canvas.getByRole('button', { name: 'Checks' }),
    ).toHaveAttribute('aria-expanded', 'false')
    // React Aria leaves the closed panel mounted, hidden with `hidden="until-found"`, so it is
    // still in the document and a text query still finds it — visibility is the question.
    await expect(
      canvas.getByText(/three checks are failing/i),
    ).not.toBeVisible()
    await expect(canvas.getByText(/no incidents/i)).toBeVisible()

    // ...and clicking the open one closes it, leaving nothing open at all.
    await userEvent.click(canvas.getByRole('button', { name: 'History' }))
    await expect(
      canvas.getByRole('button', { name: 'History' }),
    ).toHaveAttribute('aria-expanded', 'false')
  },
}

export const Multiple: Story = {
  args: { allowsMultipleExpanded: true },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'History' }))
    // Both stay open, which is the other legitimate behaviour — worth asking for on purpose.
    await expect(
      canvas.getByRole('button', { name: 'Checks' }),
    ).toHaveAttribute('aria-expanded', 'true')
    await expect(
      canvas.getByRole('button', { name: 'History' }),
    ).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText(/three checks are failing/i)).toBeVisible()
    await expect(canvas.getByText(/no incidents/i)).toBeVisible()
  },
}

export const Keyboard: Story = {
  // Each header is a real button, so Tab reaches them and Enter or Space opens them — nothing here
  // is a div with a click handler.
  play: async ({ canvas }) => {
    const checks = canvas.getByRole('button', { name: 'Checks' })
    await userEvent.tab()
    await expect(checks).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(checks).toHaveAttribute('aria-expanded', 'false')

    await userEvent.keyboard(' ')
    await expect(checks).toHaveAttribute('aria-expanded', 'true')

    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'History' })).toHaveFocus()
  },
}

export const Caret: Story = {
  // The rotation is driven by a variable published on the item, because `data-expanded` is on the
  // item rather than on the button the caret sits in.
  play: async ({ canvasElement }) => {
    const caretOf = (name: string) =>
      headerOf(canvasElement, name).querySelector('svg') as SVGElement

    const open = caretOf('Checks')
    const closed = caretOf('History')
    open.style.transition = 'none'
    closed.style.transition = 'none'

    await expect(getComputedStyle(open).rotate).toBe('180deg')
    await expect(getComputedStyle(closed).rotate).toBe('0deg')
  },
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    const checks = canvas.getByRole('button', { name: 'Checks' })
    // The panel is still open — disabled stops it being *changed*, it does not close what is
    // already shown.
    await expect(checks).toBeDisabled()
    await expect(checks).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText(/three checks are failing/i)).toBeVisible()
  },
}

export const Indicator: Story = {
  render: (args) => (
    <Accordion {...args} defaultExpandedKeys={['checks']} className="w-80">
      <Accordion.Item id="checks">
        <Accordion.Header indicator={<span aria-hidden>▸</span>}>
          Checks
        </Accordion.Header>
        <Accordion.Panel>Three checks are failing.</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
  // The indicator is replaceable because a header's job is to say whether it is open, not to draw
  // a particular triangle.
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('▸')).toBeInTheDocument()
    await expect(
      headerOf(canvasElement, 'Checks').querySelector('svg'),
    ).toBeNull()
  },
}
