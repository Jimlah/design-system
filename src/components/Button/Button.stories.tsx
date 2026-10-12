import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { Button, ButtonIcon, ButtonText } from './Button'

const meta = {
  component: Button,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export. Pointing it at `Button.Icon` instead
  // makes the manifest report Button's own props (`variant`, `size`) for the
  // slot, which is a lie the MCP tools would serve to an agent.
  subcomponents: { 'Button.Icon': ButtonIcon, 'Button.Text': ButtonText },
  // 'autodocs' generates the docs page whose ArgTypes table renders a panel
  // per subcomponent.
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/* The sheet's leading caret. No px width/height on purpose: `Button.Icon`
   sizes it in `cap`, so it tracks the label at every button size. The
   `viewBox` is what lets `w-auto` follow the drawing's ratio. */
const Caret = (
  <svg viewBox="0 0 10 6" fill="none">
    <path
      d="M1 1.2L5 5.2L9 1.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

const COLORS = ['primary', 'secondary', 'neutral', 'success', 'danger'] as const
const VARIANTS = ['default', 'outline', 'ghost', 'text'] as const

const USAGE_IMPORT = "import { Button } from 'design-system'"

export const Default: Story = {
  args: { children: 'New Monitor' },
  // Proves the styles are coming from the Pulse tokens rather than defaults.
  // Chromium serialises a computed colour from the oklch() token it was written
  // as, so these strings are the token values, not conversions.
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /new monitor/i })
    const styles = getComputedStyle(button)

    await expect(styles.backgroundColor).toBe('oklch(0.9198 0.1236 189.5)') // --primary
    await expect(styles.color).toBe('oklch(0 0 none)') // --color-ink
    await expect(styles.height).toBe('44px') // md
    await expect(styles.borderRadius).toBe('0px') // --radius: 0, the sheet's own corner
    await expect(styles.textTransform).toBe('uppercase')
    await expect(styles.fontFamily).toContain('Overpass Mono')
  },
}

export const Radius: Story = {
  // **A button's corner is the theme's, and a subtree can set it.** This is the mechanism
  // `/create` rests on: `rounded-md` compiles to `border-radius: calc(var(--radius) * 0.8)`, so the
  // token is read on the element the utility lands on rather than at `:root` — which is why every
  // corner in the library moves when one value does, and why the components had to stop saying
  // `rounded-none`.
  render: () => (
    <div style={{ '--radius': '10px' } as React.CSSProperties}>
      <Button>Restart</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Restart' })
    await expect(getComputedStyle(button).borderRadius).toBe('8px') // 0.8 × 10
  },
}

export const Colors: Story = {
  // `color` is meaning, `variant` is emphasis. Every colour has to hold up in
  // every variant, so each one only sets two custom properties.
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      {COLORS.map((color) => (
        <div key={color} className="flex items-center gap-4">
          <code className="w-20 font-mono text-[11px] text-muted-foreground">
            {color}
          </code>
          <Button {...args} color={color}>
            Deploy
          </Button>
          <Button {...args} color={color} variant="outline">
            Deploy
          </Button>
          <Button {...args} color={color} variant="ghost">
            Deploy
          </Button>
        </div>
      ))}
    </div>
  ),
  args: { children: 'Deploy' },
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          <code className="w-20 font-mono text-[11px] text-muted-foreground">
            {variant}
          </code>
          <Button {...args} variant={variant}>
            New Monitor
          </Button>
        </div>
      ))}
    </div>
  ),
  args: { children: 'New Monitor' },
}

export const Outline: Story = {
  args: { variant: 'outline', color: 'neutral', children: 'Cancel' },
  // The outline's hairline is easy to lose to a `border-transparent` in the base
  // classes, which no amount of type-checking would catch. Assert it.
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /cancel/i })
    const styles = getComputedStyle(button)

    await expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(styles.borderTopWidth).toBe('1px')
    // Derived from the colour, not a hardcoded rgba: 40% of --btn.
    await expect(styles.borderTopColor).toBe('oklab(0.8047 0 0 / 0.4)')
    await expect(styles.color).toBe('oklch(0.8047 0 none)')
  },
}

export const Sizes: Story = {
  // Each size carries the same `Button.Icon`, so the icon tracks the label from
  // 11px to 14px without a per-size number.
  render: (args) => (
    <div className="flex items-center gap-4">
      <Button {...args} size="sm">
        <Button.Icon>{Caret}</Button.Icon>
        <Button.Text>Small</Button.Text>
      </Button>
      <Button {...args} size="md">
        <Button.Icon>{Caret}</Button.Icon>
        <Button.Text>Medium</Button.Text>
      </Button>
      <Button {...args} size="lg">
        <Button.Icon>{Caret}</Button.Icon>
        <Button.Text>Large</Button.Text>
      </Button>
    </div>
  ),
  args: { children: 'Label' },
  play: async ({ canvas }) => {
    const medium = canvas.getByRole('button', { name: 'Medium' })
    const large = canvas.getByRole('button', { name: 'Large' })
    const iconHeight = (el: Element) => {
      const svg = el.querySelector('svg')
      return svg ? parseFloat(getComputedStyle(svg).height) : NaN
    }

    // One `Button.Icon` rule sizes every one of these. The icon grows with the
    // label because `cap` is relative to the font; a px-sized icon would report
    // the same number at both sizes.
    await expect(iconHeight(medium)).toBeGreaterThan(0)
    await expect(iconHeight(large)).toBeGreaterThan(iconHeight(medium))

    // A capital is shorter than the em box, so the icon must stay under the
    // font size — that is what keeps it aligned with the letters.
    await expect(iconHeight(large)).toBeLessThan(
      parseFloat(getComputedStyle(large).fontSize),
    )
  },
}

export const WithIcon: Story = {
  args: { children: 'New Monitor' },
  parameters: {
    docs: {
      source: {
        code: `${USAGE_IMPORT}

<Button>
  <Button.Icon>{/* leading icon */}</Button.Icon>
  <Button.Text>New Monitor</Button.Text>
</Button>`,
      },
    },
  },
  render: ({ children, ...buttonArgs }) => (
    <Button {...buttonArgs}>
      <Button.Icon>{Caret}</Button.Icon>
      <Button.Text>{children}</Button.Text>
    </Button>
  ),
}

export const IconOnly: Story = {
  args: { variant: 'icon', 'aria-label': 'Add monitor' },
  parameters: {
    docs: {
      source: {
        code: `${USAGE_IMPORT}

{/* An icon-only button has no label, so it needs an accessible name. */}
<Button variant="icon" aria-label="Add monitor">
  <Button.Icon>{/* icon */}</Button.Icon>
</Button>`,
      },
    },
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      {COLORS.map((color) => (
        <Button {...args} key={color} color={color}>
          <Button.Icon>{Caret}</Button.Icon>
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    // Five colours share the one accessible name on purpose, so take the first.
    const button = canvas.getAllByRole('button', { name: 'Add monitor' })[0]
    const styles = getComputedStyle(button)

    // Square: the width tracks the height, with no label padding.
    await expect(styles.width).toBe(styles.height)
    await expect(styles.height).toBe('44px')
  },
}

export const Block: Story = {
  args: { children: 'Check Now' },
  parameters: {
    docs: {
      source: {
        code: `${USAGE_IMPORT}

<Button block>Check Now</Button>`,
      },
    },
  },
  render: (args) => (
    <div className="w-64">
      <Button {...args} block />
    </div>
  ),
}

export const Disabled: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {COLORS.map((color) => (
        <Button {...args} key={color} color={color} isDisabled>
          {color}
        </Button>
      ))}
    </div>
  ),
  args: { children: 'Disabled' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /primary/i })

    // `isDisabled` sets the native attribute as well as the data marker; the
    // state styles hang off `data-disabled` so they also cover any case where
    // only the data attribute is present.
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(button).opacity).toBe('0.3')
    // Dimmed, not repainted: the button keeps its own colour, so a disabled
    // danger button still reads as danger.
    await expect(getComputedStyle(button).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    ) // --primary, untouched by the state
    await expect(getComputedStyle(button).cursor).toBe('not-allowed')
  },
}

export const Loading: Story = {
  // `isPending` is the loading state. The content keeps its box but stops being
  // painted, and a spinner takes its place, so the button does not resize or
  // shift the row when the action starts.
  render: () => (
    <div className="flex items-center gap-4">
      <Button>Deploy</Button>
      <Button isPending>Deploy</Button>
      <Button isPending>
        <Button.Text>Deploy</Button.Text>
      </Button>
      <Button variant="outline" isPending>
        Deploy
      </Button>
      {/* Disabled and loading at once: dimmed and unavailable, but the spinner
          still shows that the work in flight is why. */}
      <Button isDisabled isPending>
        Deploy
      </Button>
      <Button variant="icon" isPending aria-label="Add monitor">
        <Button.Icon>{Caret}</Button.Icon>
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const [idle, bare, slotted, outlined, both, iconOnly] =
      canvas.getAllByRole('button')

    // React Aria's pending wiring, untouched: no native `disabled`, so it stays
    // in the tab order, and it reports itself as busy.
    await expect(bare).toHaveAttribute('data-pending')
    await expect(bare).toHaveAttribute('aria-disabled', 'true')
    await expect(bare).not.toHaveAttribute('disabled')
    await expect(getComputedStyle(bare).cursor).toBe('progress')

    // Every loading button keeps its accessible name. Hiding the label with
    // `visibility` would drop it out of the accessibility tree and leave a
    // screen reader with an unnamed button — which is why text uses colour.
    await expect(
      canvas.getAllByRole('button', { name: 'Deploy' }),
    ).toHaveLength(5)

    // The point of hiding rather than removing: the box survives, so the button
    // keeps its width and the row never jumps when the action starts.
    for (const button of [bare, slotted, outlined]) {
      await expect(getComputedStyle(button).width).toBe(
        getComputedStyle(idle).width,
      )
      // The label is gone from view...
      await expect(getComputedStyle(button).color).toBe('rgba(0, 0, 0, 0)')
      // ...and the spinner has taken its place.
      const spinner = button.querySelector('svg') as SVGElement
      await expect(spinner.getBoundingClientRect().width).toBeGreaterThan(0)
    }
    await expect(idle.querySelector('svg')).toBeNull()

    // A decorative icon is the one thing `visibility` may hide, because it
    // carries no text and so no accessible name.
    const iconSlot = iconOnly.querySelector('[data-slot=icon]') as HTMLElement
    await expect(getComputedStyle(iconSlot).visibility).toBe('hidden')

    // The loader paints in the variant's own label colour. Hardcoding ink here
    // put a black spinner on the black page for `outline`/`ghost`/`text`.
    const loaderColor = (el: HTMLElement) =>
      getComputedStyle(el.querySelector('[data-slot=loader]') as HTMLElement)
        .color
    await expect(loaderColor(outlined)).toBe('oklch(0.9198 0.1236 189.5)')
    await expect(loaderColor(bare)).toBe('oklch(0 0 none)')

    // Disabled and pending together: the dim still applies so it reads as
    // unavailable, and it is the cursor, not the spinner, that yields.
    await expect(both).toBeDisabled()
    await expect(getComputedStyle(both).opacity).toBe('0.3')
    await expect(getComputedStyle(both).cursor).toBe('not-allowed')
  },
}

export const PressFeedback: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {VARIANTS.map((variant) => (
        <Button {...args} key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
      <Button {...args} variant="icon" aria-label="icon">
        <Button.Icon>{Caret}</Button.Icon>
      </Button>
    </div>
  ),
  args: { children: 'Press' },
  // The browser's tap highlight is gone and `data-[hovered]` never fires on a
  // touch screen, so on touch the pressed state is the ONLY feedback the user
  // gets. A variant without one feels dead.
  //
  // React Aria does set `data-pressed` on pointerdown — verified in a real
  // browser, where primary goes oklch(0.9198 0.1236 189.5) at rest -> white on
  // hover -> oklch(0.717444 0.096408 189.5) while pressed. Synthetic events in
  // this runner do not drive that state, so drive the attribute directly and
  // assert the CSS contract: every variant must visibly change from rest.
  play: async ({ canvas }) => {
    const snapshot = (el: HTMLElement) => {
      const s = getComputedStyle(el)
      return `${s.backgroundColor}|${s.color}|${s.borderTopColor}|${s.opacity}`
    }

    for (const name of [...VARIANTS, 'icon']) {
      const button = canvas.getByRole('button', { name })
      const atRest = snapshot(button)

      // The button transitions its colours, so reading straight after the
      // attribute lands returns a value part-way through the transition — and
      // the first frame of a transition is the OLD colour in a different
      // serialisation, which reads as a change even when nothing changed. Kill
      // the transition so the computed value is the settled one.
      button.style.transition = 'none'
      button.setAttribute('data-pressed', 'true')
      const pressed = snapshot(button)
      button.removeAttribute('data-pressed')
      button.style.removeProperty('transition')

      await expect(pressed, `variant "${name}" has no pressed state`).not.toBe(
        atRest,
      )
    }
  },
}

export const Themes: Story = {
  args: { children: 'Deploy' },
  // Both themes come from one set of tokens. Switching `data-theme` moves
  // `color-scheme` and every `light-dark()` in src/styles.css re-resolves; no
  // token is redefined and no second variable block exists.
  play: async ({ canvas }) => {
    const root = document.documentElement
    const restore = root.dataset.theme
    const button = canvas.getByRole('button', { name: /deploy/i })
    // The button transitions its colours, so a read straight after the switch
    // would return the old value mid-transition.
    button.style.transition = 'none'
    const style = () => {
      const s = getComputedStyle(button)
      return { bg: s.backgroundColor, ink: s.color }
    }

    try {
      root.dataset.theme = 'dark'
      const dark = style()
      root.dataset.theme = 'light'
      const light = style()

      await expect(dark.bg).not.toBe(light.bg)

      // The ink inverts with the fills: black on the luminous dark accent, white
      // on the deep light one. A token that failed to flip would leave black
      // text on a dark fill, which is the failure this guards.
      await expect(dark.ink).toBe('oklch(0 0 none)')
      await expect(light.ink).toBe('oklch(1 0 none)')
    } finally {
      if (restore) root.dataset.theme = restore
      button.style.removeProperty('transition')
    }
  },
}
