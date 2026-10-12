import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, waitFor } from 'storybook/test'

import { Link } from './Link'

const meta = {
  component: Link,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'centered' },
  args: { href: '#monitors', variant: 'caps', size: 'sm' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['caps', 'url', 'viewmore'],
      description: "Which of the sheet's three links this is.",
    },
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
  },
  render: (args) => <Link {...args}>Monitors</Link>,
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // A real anchor, so middle-click, the status bar and "open in a new tab" all work — which is
    // the whole reason to use `Link` rather than a `div` with an `onClick`.
    const link = canvas.getByRole('link', { name: 'Monitors' })
    await expect(link.tagName).toBe('A')
    await expect(link).toHaveAttribute('href', '#monitors')

    // The sheet's `.ds-link-caps`: 14px, -1%, uppercase, white at 70%.
    const style = getComputedStyle(link)
    await expect(style.fontSize).toBe('14px')
    await expect(style.letterSpacing).toBe('-0.14px')
    await expect(style.textTransform).toBe('uppercase')
    // The colour is transitioned, so read it settled rather than on the frame the animation happens
    // to be on — CI caught the same assertion mid-flight in `Breadcrumbs`, which asserts this very
    // value on the same recipe. See that story for the measurement.
    await waitFor(() =>
      expect(getComputedStyle(link).color).toBe('oklab(1 0 0 / 0.7)'),
    )
    await expect(style.textDecorationLine).toBe('none')
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-baseline gap-6">
      <Link {...args} size="sm">
        Monitors
      </Link>
      <Link {...args} size="lg">
        Monitors
      </Link>
    </div>
  ),
  // `.ds-link-caps--lg` changes the type size and nothing else, which is why `lg` is a size rather
  // than a second variant: everything about the link's behaviour is identical.
  play: async ({ canvas }) => {
    const [sm, lg] = canvas.getAllByRole('link')
    await expect(getComputedStyle(sm).fontSize).toBe('14px')
    await expect(getComputedStyle(lg).fontSize).toBe('16px')
    await expect(getComputedStyle(lg).textTransform).toBe('uppercase')
    await expect(getComputedStyle(lg).color).toBe(getComputedStyle(sm).color)
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Link href="#a">Monitors</Link>
      <Link href="#b" variant="url">
        status.example.com
      </Link>
      <Link href="#c" variant="viewmore">
        View more
      </Link>
    </div>
  ),
  // Three links, three jobs, and each hover derives from what the link is. The URL link carries its
  // affordance in the underline and turns teal; the view-more link wears the accent at rest and
  // *gains* an underline. Swapping any two would say the wrong thing.
  play: async ({ canvasElement }) => {
    const [caps, url, viewmore] = [...canvasElement.querySelectorAll('a')].map(
      (a) => getComputedStyle(a),
    )

    // The underline is the affordance for a URL link, and it is under the text rather than through
    // it, 3px clear.
    await expect(url.textDecorationLine).toBe('underline')
    await expect(url.textUnderlineOffset).toBe('3px')
    await expect(url.fontSize).toBe('12px')
    await expect(caps.textDecorationLine).toBe('none')

    // ...and the view-more link is the one that starts underlined-free, in the accent.
    await expect(viewmore.textDecorationLine).toBe('none')
    await expect(viewmore.color).toBe('oklch(0.9198 0.1236 189.5)')
    await expect(viewmore.fontSize).toBe('16px')
  },
}

export const Current: Story = {
  args: { 'aria-current': 'page' },
  // `aria-current` is the attribute the sheet's own `[aria-current="page"] { color: teal }` rule
  // reads, and React Aria hands it over as `data-current` as well — so the accent lands on the page
  // you are on without a prop of its own. (`NavigationTree` has `isCurrent`; a plain `Link` does
  // not, and inventing one here would only be a second name for the same attribute.)
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Monitors' })
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(link).toHaveAttribute('data-current')
    await expect(getComputedStyle(link).color).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}
