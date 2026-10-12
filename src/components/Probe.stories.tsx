import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs'
import { Button } from './Button/Button'
import { Link } from './Link/Link'

const meta = { title: 'Probe', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

/** TEMPORARY: reports what state the two failing elements are in, in the environment that fails. */
export const State: Story = {
  render: () => (
    <div>
      <Button variant="outline" color="neutral">Cancel</Button>
      <Breadcrumbs>
        <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/monitors/fra">fra1</Breadcrumbs.Item>
        <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
      </Breadcrumbs>
      <Link href="/x">Caps</Link>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button') as HTMLElement
    const links = [...canvasElement.querySelectorAll('a')] as HTMLElement[]
    const report = (label: string, el: HTMLElement) => {
      const s = getComputedStyle(el)
      console.log('PROBE ' + label, JSON.stringify({
        hovered: el.hasAttribute('data-hovered'),
        pressed: el.hasAttribute('data-pressed'),
        matchesHover: el.matches(':hover'),
        matchesFocusVisible: el.matches(':focus-visible'),
        color: s.color,
        borderTopColor: s.borderTopColor,
        className: el.getAttribute('class'),
      }))
    }
    console.log('PROBE media', JSON.stringify({
      hoverHover: window.matchMedia('(hover: hover)').matches,
      anyHover: window.matchMedia('(any-hover: hover)').matches,
      pointerFine: window.matchMedia('(pointer: fine)').matches,
      forcedColors: window.matchMedia('(forced-colors: active)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
      theme: document.documentElement.getAttribute('data-theme'),
    }))
    report('button', button)
    report('breadcrumb-link', links[0])
    report('caps-link', links[links.length - 1])
  },
}