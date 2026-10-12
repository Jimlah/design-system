import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

const meta = {
  component: Card,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Card.Header': CardHeader,
    'Card.Title': CardTitle,
    'Card.Description': CardDescription,
    'Card.Action': CardAction,
    'Card.Content': CardContent,
    'Card.Footer': CardFooter,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `
<Card>
  <Card.Header>
    <Card.Title>Frankfurt</Card.Title>
    <Card.Description>fra1 · 42ms</Card.Description>
    <Card.Action>
      <Menu.Trigger>…</Menu.Trigger>
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <Sparkline points={…} />
  </Card.Content>
  <Card.Footer>
    <Button variant="outline">Open</Button>
  </Card.Footer>
</Card>`,
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-72">
      <Card.Header>
        <Card.Title>Frankfurt</Card.Title>
        <Card.Description>fra1 · 42ms</Card.Description>
      </Card.Header>
      <Card.Content>Replicating to fra2.</Card.Content>
      <Card.Footer>
        <Button variant="outline" size="sm">
          Open
        </Button>
        <Button variant="text" size="sm">
          Mute
        </Button>
      </Card.Footer>
    </Card>
  ),
  // The whole card, read off the DOM rather than the source: the surface paints, the title is a
  // heading, and the two hairlines are the right way round.
  play: async ({ canvas, canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot="card"]') as Element
    await expect(card).not.toBeNull()

    // A title is a heading, not a styled div, and it defaults to level 3.
    const title = canvas.getByRole('heading', { level: 3, name: 'Frankfurt' })
    await expect(title.tagName).toBe('H3')

    // A surface with no fill paints nothing at all, so this is the check that the token reaches
    // it rather than a class that quietly resolved to nothing.
    await expect(getComputedStyle(card).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )

    // The card's own edge is the quiet hairline and the rule inside it is the loud one — 40%
    // against 62%. The reverse draws a box around a rule, which is not what a card is.
    await expect(getComputedStyle(card).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
    const header = canvasElement.querySelector(
      '[data-slot="card-header"]',
    ) as Element
    await expect(getComputedStyle(header).borderBottomColor).toBe(
      'oklch(1 0 none / 0.62)',
    )
    const footer = canvasElement.querySelector(
      '[data-slot="card-footer"]',
    ) as Element
    await expect(getComputedStyle(footer).borderTopColor).toBe(
      'oklch(1 0 none / 0.62)',
    )
  },
}

/** A card with a control in it — and the one in the header is a control that does something. */
const Failover = () => {
  const [failed, setFailed] = useState(false)
  return (
    <Card className="w-72">
      <Card.Header>
        <Card.Title>Frankfurt</Card.Title>
        <Card.Description>fra1 · 42ms</Card.Description>
        <Card.Action>
          <Button
            color="danger"
            variant="outline"
            size="sm"
            onPress={() => setFailed(true)}
          >
            Fail over
          </Button>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        {failed ? 'Failing over to fra2.' : 'Replicating to fra2.'}
      </Card.Content>
    </Card>
  )
}

export const Action: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Card className="w-72">
        <Card.Header>
          <Card.Title>Amsterdam</Card.Title>
          <Card.Description>ams3 · 31ms</Card.Description>
        </Card.Header>
        <Card.Content>Nothing on the right.</Card.Content>
      </Card>
      <Failover />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    // Two headers, one with an action and one without. The second column is conditional on the
    // DOM carrying a Card.Action, so this is the pair of cases that proves it: one that must
    // stay a single column, and one that must widen.
    const headers = [
      ...canvasElement.querySelectorAll('[data-slot="card-header"]'),
    ].map((header) => getComputedStyle(header).gridTemplateColumns)
    await expect(headers).toHaveLength(2)
    await expect(headers[0].split(' ')).toHaveLength(1)
    await expect(headers[1].split(' ')).toHaveLength(2)

    // A card is not a control, so the control inside it has to be one — and a control is only
    // proven by what it does, never by being there.
    await userEvent.click(canvas.getByRole('button', { name: 'Fail over' }))
    await expect(
      await canvas.findByText('Failing over to fra2.'),
    ).toBeInTheDocument()
  },
}

export const Level: Story = {
  render: () => (
    <Card className="w-72">
      <Card.Header>
        <Card.Title level={2}>Uptime</Card.Title>
      </Card.Header>
      <Card.Content>99.98% over the last 30 days.</Card.Content>
    </Card>
  ),
  // level is published because a card nested inside a section usually wants a different one,
  // and because the level is the one thing about a heading a consumer can get wrong.
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { level: 2, name: 'Uptime' })
    await expect(title.tagName).toBe('H2')
    await expect(canvas.queryByRole('heading', { level: 3 })).toBeNull()
  },
}

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-72">
      <Card.Content>Just a surface with something in it.</Card.Content>
    </Card>
  ),
  // The slots are optional, and padding lives on them rather than on the root — so a card with
  // nothing but a body is still a complete card, edge and all.
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByText('Just a surface with something in it.'),
    ).toBeInTheDocument()
    const card = canvasElement.querySelector('[data-slot="card"]') as Element
    await expect(getComputedStyle(card).borderTopColor).toBe(
      'oklch(1 0 none / 0.4)',
    )
    await expect(
      canvasElement.querySelector('[data-slot="card-header"]'),
    ).toBeNull()
  },
}
