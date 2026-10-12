import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  TextField,
  TextFieldError,
  TextFieldGroup,
  TextFieldHint,
  TextFieldIcon,
  TextFieldInput,
  TextFieldLabel,
} from './TextField'

const meta = {
  component: TextField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TextField.Label': TextFieldLabel,
    'TextField.Group': TextFieldGroup,
    'TextField.Input': TextFieldInput,
    'TextField.Icon': TextFieldIcon,
    'TextField.Hint': TextFieldHint,
    'TextField.Error': TextFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'centered' },
  args: {
    size: 'md',
    isDisabled: false,
    isInvalid: false,
    isRequired: false,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Height and type size of the control.',
    },
    isDisabled: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
  },
  render: (args) => (
    <TextField {...args} className="w-80" defaultValue="api.example.com">
      <TextField.Label>Monitor name</TextField.Label>
      <TextField.Input spellCheck={false} />
      <TextField.Hint>Lowercase alphanumeric and dashes only</TextField.Hint>
    </TextField>
  ),
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

/* Sized in `cap` by `TextField.Icon`, so it tracks the field's `size` the same
   way `Button.Icon` tracks the button's. The `viewBox` is what lets `w-auto`
   follow the drawing's ratio. */
const Magnifier = (
  <svg viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10.6 10.6L14 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const Check = (
  <svg viewBox="0 0 16 16" fill="none">
    <path
      d="M2.5 8.5L6 12L13.5 4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * WCAG relative-luminance contrast, with any alpha flattened against `behind`
 * first. `getComputedStyle` returns a translucent border as `oklab(… / 0.45)`,
 * which means nothing until it is composited onto whatever is actually behind
 * it — and compositing is not symmetric, which is the whole reason the hairline
 * needs checking in both themes rather than once.
 */
function contrastOver(colour: string, behind: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  // `globalThis.Error`, because this module also exports a story named `Error`.
  if (!ctx) throw new globalThis.Error('no 2d context')
  const over = (c: string, bg: string) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1, 1)
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  }
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const lum = (c: number[]) =>
    0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  const [hi, lo] = [lum(over(colour, behind)), lum(over(behind, behind))].sort(
    (a, b) => b - a,
  )
  return (hi + 0.05) / (lo + 0.05)
}

export const Default: Story = {
  // Proves the styles come from the Pulse tokens rather than the browser's
  // defaults, and that React Aria actually wired the label and the hint up.
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor name/i)
    const styles = getComputedStyle(input)

    await expect(input).toHaveValue('api.example.com')
    await expect(styles.height).toBe('44px') // md
    await expect(styles.borderRadius).toBe('0px') // the sheet is square throughout
    await expect(styles.fontFamily).toContain('Overpass Mono')
    await expect(styles.backgroundColor).toBe('oklch(0.225 0.009 255.6)') // --muted

    // The hint is described-by rather than a separate announcement, which is
    // what `slot="description"` buys.
    const describedBy = input.getAttribute('aria-describedby') ?? ''
    const hint = canvas.getByText(/lowercase alphanumeric/i)
    await expect(describedBy.split(' ')).toContain(hint.id)
  },
}

export const Focus: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-5">
      <TextField {...args} defaultValue="api.example.com">
        <TextField.Label>Monitor name</TextField.Label>
        <TextField.Input />
      </TextField>
    </div>
  ),
  // Focus is carried by the border alone. Adding the shared offset ring here
  // draws a second teal hairline 3px outside the first, which reads as a fault.
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor name/i)
    // The border transitions, so a read right after the state change returns the
    // old colour in different notation.
    input.style.transition = 'none'
    const styles = () => getComputedStyle(input)

    // At rest the field carries a hairline, so it reads as a control at all.
    await expect(styles().borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
    await expect(styles().borderTopColor).not.toBe('oklch(0 0 none)')

    // A real interaction, not `.focus()`: React Aria sets `data-focused` from a
    // focus event through React state, so a programmatic call has not rendered
    // the attribute by the time the next line runs.
    await userEvent.click(input)
    await expect(input).toHaveAttribute('data-focused')
    await expect(styles().borderTopColor).toBe('oklch(0.9198 0.1236 189.5)') // --primary
    // Focus is the border and nothing else: a ring here would draw a second teal
    // hairline 3px outside the first.
    await expect(styles().outlineStyle).toBe('none')
  },
}

export const ControlBoundary: Story = {
  // The panel fill alone does not identify a control — panel-2 is 1.23:1 against
  // the dark page and 1.17:1 against the light one — so the resting hairline is
  // what carries it, and it has to clear 3:1 on both. This is checked by
  // compositing and measuring rather than by comparing to a token value, because
  // a token can be changed to something that looks right and is not.
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor name/i)
    const root = document.documentElement
    const restore = root.dataset.theme
    input.style.transition = 'none'
    try {
      for (const theme of ['dark', 'light']) {
        root.dataset.theme = theme
        const page = getComputedStyle(document.body).backgroundColor
        const measured = contrastOver(
          getComputedStyle(input).borderTopColor,
          page,
        )
        await expect(
          measured,
          `${theme} page: ${measured.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(3)
      }
    } finally {
      if (restore) root.dataset.theme = restore
      input.style.removeProperty('transition')
    }
  },
}

export const Placeholder: Story = {
  render: (args) => (
    <TextField {...args} className="w-80">
      <TextField.Label>Endpoint</TextField.Label>
      <TextField.Input placeholder="example.com" />
      <TextField.Hint>
        Placeholder uses the subtlest foreground step
      </TextField.Hint>
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/endpoint/i)
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('placeholder', 'example.com')
    // Placeholder is the same token family as every translucent foreground, so
    // it follows the theme instead of being a hardcoded grey.
    await expect(getComputedStyle(input, '::placeholder').color).toBe(
      'oklab(1 0 0 / 0.35)',
    )
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-5">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TextField
          {...args}
          key={size}
          size={size}
          defaultValue="api.example.com"
        >
          <TextField.Label>{size}</TextField.Label>
          <TextField.Input />
        </TextField>
      ))}
    </div>
  ),
  // The sheet's three heights: 36 / 44 / 52px.
  play: async ({ canvas }) => {
    for (const [size, height] of [
      ['sm', '36px'],
      ['md', '44px'],
      ['lg', '52px'],
    ] as const) {
      const input = canvas.getByLabelText(size)
      await expect(getComputedStyle(input).height).toBe(height)
    }
  },
}

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <TextField {...args}>
        <TextField.Label>Find a monitor</TextField.Label>
        <TextField.Group>
          <TextField.Input placeholder="Search" />
          <TextField.Icon position="start">{Magnifier}</TextField.Icon>
        </TextField.Group>
      </TextField>
      <TextField {...args} defaultValue="api.example.com">
        <TextField.Label>Verified endpoint</TextField.Label>
        <TextField.Group>
          <TextField.Input />
          <TextField.Icon position="end" className="text-primary">
            {Check}
          </TextField.Icon>
        </TextField.Group>
        <TextField.Hint>A leading or trailing icon both fit</TextField.Hint>
      </TextField>
    </div>
  ),
  // Composing in `render` leaves Storybook's default code panel printing the raw
  // export names, so it is written out the way a consumer would write it.
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: `import { TextField } from 'design-system'

<TextField>
  <TextField.Label>Find a monitor</TextField.Label>
  <TextField.Group>
    <TextField.Input placeholder="Search" />
    <TextField.Icon position="start">{magnifier}</TextField.Icon>
  </TextField.Group>
</TextField>

<TextField defaultValue="api.example.com">
  <TextField.Label>Verified endpoint</TextField.Label>
  <TextField.Group>
    <TextField.Input />
    <TextField.Icon position="end" className="text-primary">{check}</TextField.Icon>
  </TextField.Group>
</TextField>`,
      },
    },
  },
  play: async ({ canvas }) => {
    const search = canvas.getByLabelText(/find a monitor/i)
    const trailing = canvas.getByLabelText(/verified endpoint/i)

    // The room an affix needs is padding on the input, but the affix is the
    // input's sibling — the field works it out with `:has()`, so nothing has to
    // be lined up by hand.
    await expect(getComputedStyle(search).paddingInlineStart).toBe('42px')
    await expect(getComputedStyle(trailing).paddingInlineEnd).toBe('56px')

    // The affix is decoration, so it must not become a click target...
    const control = search.closest('[data-slot=control]') as HTMLElement
    const icon = control.querySelector('[data-slot=icon-start]') as HTMLElement
    await expect(getComputedStyle(icon).pointerEvents).toBe('none')
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    // ...it must inherit the control's type size, not the page's font...
    await expect(parseFloat(getComputedStyle(icon).fontSize)).toBe(14)

    // ...and it must land *inside* the input's box. `TextField.Input` is the
    // affix's positioning context; without one the icon silently jumps to the
    // edge of the field, which has the legend above it and the hint below.
    const field = search.getBoundingClientRect()
    const affix = icon.getBoundingClientRect()
    await expect(Math.round(affix.top)).toBe(Math.round(field.top))
    await expect(Math.round(affix.height)).toBe(Math.round(field.height))
    await expect(Math.round(affix.left)).toBe(Math.round(field.left + 14))
  },
}

export const Error: Story = {
  render: (args) => (
    <TextField {...args} className="w-80" defaultValue="api example" isInvalid>
      <TextField.Label>Monitor name</TextField.Label>
      <TextField.Input />
      <TextField.Error>
        Use lowercase letters, numbers and dashes only.
      </TextField.Error>
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor name/i)

    await expect(input).toHaveAttribute('aria-invalid', 'true')
    // The sheet paints this state yellow because it only owned two accents.
    // Here yellow is the secondary button, so the error takes the danger hue.
    await expect(getComputedStyle(input).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)',
    )
    await expect(
      canvas.getByText(/lowercase letters, numbers and dashes only/i),
    ).toBeVisible()
  },
}

export const Disabled: Story = {
  render: (args) => (
    <TextField
      {...args}
      className="w-80"
      defaultValue="api.example.com"
      isDisabled
    >
      <TextField.Label>Monitor name</TextField.Label>
      <TextField.Input />
      <TextField.Hint>Cannot be changed once created</TextField.Hint>
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor name/i)
    await expect(input).toBeDisabled()
    await expect(getComputedStyle(input).opacity).toBe('0.4')
    await expect(getComputedStyle(input).cursor).toBe('not-allowed')
  },
}

export const ReadOnly: Story = {
  render: (args) => (
    <TextField {...args} className="w-80" defaultValue="mon_8f31c2" isReadOnly>
      <TextField.Label>Monitor id</TextField.Label>
      <TextField.Input />
      <TextField.Hint>Assigned on creation</TextField.Hint>
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/monitor id/i)
    // Read-only is not disabled: the value can still be selected and copied,
    // it just cannot be edited. React Aria marks it `readonly`, not `disabled`.
    await expect(input).toHaveAttribute('readonly')
    await expect(input).not.toBeDisabled()
    // It does not dim, either. At 40% the value measured 3.42:1 — under the 4.5:1
    // body text needs — so the one thing the user came to read was the one thing
    // they could not. Read-only signals itself through the hairline instead, which
    // is the affordance it actually loses: nothing here invites a click.
    await expect(getComputedStyle(input).opacity).toBe('1')
    await expect(getComputedStyle(input).borderTopColor).toBe(
      'oklch(1 0 none / 0.3)', // --border-soft, against the rest state's 0.45
    )
  },
}

export const Required: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-5">
      <TextField {...args} isRequired>
        <TextField.Label>Monitor name</TextField.Label>
        <TextField.Input placeholder="api.example.com" />
      </TextField>
      <TextField {...args} defaultValue="60">
        <TextField.Label>Interval (seconds)</TextField.Label>
        <TextField.Input />
      </TextField>
    </div>
  ),
  play: async ({ canvas }) => {
    const required = canvas.getByLabelText(/monitor name/i)
    // React Aria puts the native `required` on the input rather than
    // `aria-required`, so this checks the state rather than one spelling of it.
    await expect(required).toBeRequired()

    // The marker is drawn by the label's `::after` from the field's own
    // `data-required`, so it cannot drift out of sync with the prop...
    const label = canvas.getByText(/monitor name/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
    await expect(marker.color).toBe('oklch(0.785 0.1236 29)') // --destructive
    // ...and an optional field must not grow one.
    const optionalLabel = canvas.getByText(/interval/i)
    await expect(
      getComputedStyle(optionalLabel, '::after').content,
    ).not.toContain('*')
  },
}

export const FormExample: Story = {
  render: () => (
    <form
      className="flex w-80 flex-col gap-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <TextField name="name">
        <TextField.Label>Monitor name</TextField.Label>
        <TextField.Input placeholder="api.example.com" />
        <TextField.Hint>Lowercase alphanumeric and dashes only</TextField.Hint>
      </TextField>

      <TextField name="path" defaultValue="/health" isInvalid>
        <TextField.Label>Health check path</TextField.Label>
        <TextField.Input />
        <TextField.Error>
          That path does not respond from outside the VPC.
        </TextField.Error>
      </TextField>

      <TextField name="interval" defaultValue="60" size="sm">
        <TextField.Label>Interval (seconds)</TextField.Label>
        <TextField.Input inputMode="numeric" />
      </TextField>

      <div className="flex gap-3">
        <Button type="submit" color="primary">
          Create monitor
        </Button>
        <Button type="button" variant="outline" color="neutral">
          Cancel
        </Button>
      </div>
    </form>
  ),
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: `import { TextField, Button } from 'design-system'

<form>
  <TextField name="name">
    <TextField.Label>Monitor name</TextField.Label>
    <TextField.Input placeholder="api.example.com" />
    <TextField.Hint>Lowercase alphanumeric and dashes only</TextField.Hint>
  </TextField>

  <TextField name="path" defaultValue="/health" isInvalid>
    <TextField.Label>Health check path</TextField.Label>
    <TextField.Input />
    <TextField.Error>That path does not respond from outside the VPC.</TextField.Error>
  </TextField>

  <Button type="submit" color="primary">Create monitor</Button>
</form>`,
      },
    },
  },
  play: async ({ canvas }) => {
    // The field anatomy has to hold up next to the component it was built
    // alongside, at the same size and in the same column.
    const submit = canvas.getByRole('button', { name: /create monitor/i })
    const name = canvas.getByLabelText(/monitor name/i)
    await expect(getComputedStyle(submit).height).toBe('44px')
    await expect(getComputedStyle(name).height).toBe('44px')
    await expect(canvas.getByLabelText(/interval/i)).toHaveValue('60')
  },
}
