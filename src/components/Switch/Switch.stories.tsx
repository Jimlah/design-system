import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'

import { Switch, SwitchIndicator, SwitchText } from './Switch'

const meta = {
  component: Switch,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Switch.Indicator': SwitchIndicator,
    'Switch.Text': SwitchText,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Switch defaultSelected>
  <Switch.Indicator />
  <Switch.Text>Auto-retry failed checks</Switch.Text>
</Switch>`,
      },
    },
    layout: 'centered',
  },
  args: {
    defaultSelected: true,
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
    isInvalid: false,
  },
  argTypes: {
    defaultSelected: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
  },
  render: (args) => (
    <Switch {...args}>
      <Switch.Indicator />
      <Switch.Text>Auto-retry failed checks</Switch.Text>
    </Switch>
  ),
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/** The control root is the `<label>`; the track and knob hang off it. */
const trackOf = (input: HTMLElement) =>
  input.closest('label')?.querySelector('[data-slot=indicator]') as HTMLElement
const knobOf = (input: HTMLElement) =>
  trackOf(input).querySelector('[data-slot=knob]') as HTMLElement

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Switch>
        <Switch.Indicator />
        <Switch.Text>Auto-retry failed checks</Switch.Text>
      </Switch>
      <Switch defaultSelected>
        <Switch.Indicator />
        <Switch.Text>Email me on recovery</Switch.Text>
      </Switch>
      <Switch defaultSelected isDisabled>
        <Switch.Indicator />
        <Switch.Text>Maintenance window — locked</Switch.Text>
      </Switch>
    </div>
  ),
  play: async ({ canvas }) => {
    const off = canvas.getByRole('switch', { name: /auto-retry/i })
    const on = canvas.getByRole('switch', { name: /email me/i })

    // A switch is a checkbox input under the hood, but it is *not* announced as one —
    // the role is what tells a screen reader this takes effect immediately.
    await expect(off).toHaveAttribute('type', 'checkbox')
    await expect(off).toHaveAttribute('role', 'switch')
    await expect(off).not.toBeChecked()
    await expect(on).toBeChecked()

    // The sheet's track: 40x20, fully rounded, so the knob can sit inside it.
    const track = trackOf(off)
    const trackStyles = getComputedStyle(track)
    await expect(trackStyles.width).toBe('40px')
    await expect(trackStyles.height).toBe('20px')
    // Tailwind v4's `rounded-full` is `calc(infinity * 1px)`, which Chrome computes to
    // 3.35544e+07px — so "is it a pill" is "at least half the height", not '50%'.
    await expect(parseFloat(trackStyles.borderRadius)).toBeGreaterThanOrEqual(
      parseFloat(trackStyles.height) / 2,
    )

    const knob = knobOf(off)
    const knobStyles = getComputedStyle(knob)
    await expect(knobStyles.width).toBe('14px')
    await expect(knobStyles.height).toBe('14px')
    await expect(parseFloat(knobStyles.borderRadius)).toBeGreaterThanOrEqual(7)

    // The travel is the state, so it is measured rather than read off a token: the
    // sheet's 20px is the track's inner width less the knob and both 2px insets.
    // The knob transitions, so freeze it before asking where it ended up.
    knob.style.transition = 'none'
    knobOf(on).style.transition = 'none'
    const travel =
      knobOf(on).getBoundingClientRect().left -
      knob.getBoundingClientRect().left
    await expect(Math.round(travel)).toBe(20)

    // Disabled dims the whole control, as everywhere else in the system.
    const locked = canvas.getByRole('switch', { name: /maintenance/i })
    await expect(locked).toBeDisabled()
    await expect(
      getComputedStyle(locked.closest('label') as HTMLElement).opacity,
    ).toBe('0.35')
  },
}

export const Keyboard: Story = {
  args: { defaultSelected: false },
  // A switch has to work from the keyboard, and Space is what toggles it — Enter is
  // deliberately not bound, because a switch is not a button.
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('switch', { name: /auto-retry/i })

    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(toggle).toBeChecked()
    await userEvent.keyboard(' ')
    await expect(toggle).not.toBeChecked()

    // Enter must not toggle it. A switch is not a button, and Enter here is usually
    // someone trying to submit the row rather than flip the setting. Asserted on the
    // state, not the colour, which would be read mid-transition.
    await userEvent.keyboard('{Enter}')
    await expect(toggle).not.toBeChecked()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Switch defaultSelected isReadOnly>
        <Switch.Indicator />
        <Switch.Text>Read-only — on</Switch.Text>
      </Switch>
      <Switch isReadOnly>
        <Switch.Indicator />
        <Switch.Text>Read-only — off</Switch.Text>
      </Switch>
      <Switch defaultSelected isInvalid>
        <Switch.Indicator />
        <Switch.Text>Invalid — accept to continue</Switch.Text>
      </Switch>
    </div>
  ),
  play: async ({ canvas }) => {
    // Read-only is not disabled: it stays focusable and announced, it just cannot be
    // changed — and unlike a disabled switch it does not dim, because which side the
    // knob is on is the content.
    const readonly = canvas.getByRole('switch', { name: /read-only — on/i })
    // `readonly` is not a valid attribute on a checkbox input, so React Aria reports
    // read-only the way a screen reader can actually hear it.
    await expect(readonly).toHaveAttribute('aria-readonly', 'true')
    await expect(readonly).not.toBeDisabled()
    await expect(
      getComputedStyle(readonly.closest('label') as HTMLElement).opacity,
    ).toBe('1')

    const knob = knobOf(readonly)
    knob.style.transition = 'none'
    const track = trackOf(readonly)
    track.style.transition = 'none'
    // It still shows its state in full — the accent fill is untouched.
    await expect(getComputedStyle(track).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )

    // Invalid turns the edge red so the failure is visible, and announces it.
    const invalid = canvas.getByRole('switch', { name: /invalid/i })
    await expect(invalid).toHaveAttribute('aria-invalid', 'true')
    const invalidTrack = trackOf(invalid)
    invalidTrack.style.transition = 'none'
    await expect(getComputedStyle(invalidTrack).borderTopColor).toBe(
      'oklch(0.785 0.1236 29)', // --color-red
    )
    // ...and it outranks the selected fill, which is the state that matters more.
    await expect(getComputedStyle(invalidTrack).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}

export const FocusRing: Story = {
  args: { defaultSelected: false },
  // The control is a 1x1 hidden input, so the ring is drawn on the track. It is
  // present but transparent at rest, so that it can fade in with the track's own
  // colours rather than switching the outline on and off.
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('switch', { name: /auto-retry/i })
    const track = trackOf(toggle)
    track.style.transition = 'none'

    await expect(getComputedStyle(track).outlineColor).not.toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    await expect(getComputedStyle(track).outlineStyle).toBe('solid')
    await expect(getComputedStyle(track).outlineColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(track).outlineOffset).toBe('3px')
  },
}

export const Hover: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Switch>
        <Switch.Indicator />
        <Switch.Text>Email me on recovery</Switch.Text>
      </Switch>
      <Switch defaultSelected>
        <Switch.Indicator />
        <Switch.Text>Auto-retry failed checks</Switch.Text>
      </Switch>
    </div>
  ),
  // Hover goes through `user-event`, which fires the pointer events a pointer really
  // fires — the `data-hovered` state React Aria derives from them is then the component's
  // own, not something the test put there. See the testing guidance in AGENTS.md.
  play: async ({ canvas }) => {
    const off = canvas.getByRole('switch', { name: /email me/i })
    const on = canvas.getByRole('switch', { name: /auto-retry/i })
    const root = (input: HTMLElement) => input.closest('label') as HTMLElement
    // The track is what transitions, not the input.
    for (const el of [off, on]) trackOf(el).style.transition = 'none'

    // Hovering brightens the edge of an off switch...
    await userEvent.hover(trackOf(off))
    // **Waited for, because the state is React Aria's and it lands on the next commit.**
    // `userEvent.hover` fires the pointer sequence; `data-hovered` is derived from it by a
    // re-render, so a read on the very next line races that commit — and loses on a slower
    // runner, where the attribute is simply not there yet. See the testing rules in AGENTS.md.
    await waitFor(() =>
      expect(root(off)).toHaveAttribute('data-hovered', 'true'),
    )
    await expect(getComputedStyle(trackOf(off)).borderTopColor).toBe(
      'oklch(1 0 none)', // --color-fg
    )

    // ...and of an on one, which keeps its fill. That is the sheet's own pair: a
    // switch gains a rim rather than inverting, unlike a checked checkbox.
    await userEvent.hover(trackOf(on))
    await waitFor(() =>
      expect(root(on)).toHaveAttribute('data-hovered', 'true'),
    )
    await expect(getComputedStyle(trackOf(on)).borderTopColor).toBe(
      'oklch(1 0 none)',
    )
    await expect(getComputedStyle(trackOf(on)).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
  },
}

/** The shape these actually get used in: a column of settings, each one instant. */
export const Settings: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-5">
      <Switch defaultSelected>
        <Switch.Indicator />
        <Switch.Text>Alert when a monitor goes down</Switch.Text>
      </Switch>
      <Switch defaultSelected>
        <Switch.Indicator />
        <Switch.Text>Alert again on recovery</Switch.Text>
      </Switch>
      <Switch>
        <Switch.Indicator />
        <Switch.Text>Page the on-call rotation</Switch.Text>
      </Switch>
    </div>
  ),
  play: async ({ canvas }) => {
    // A switch applies as soon as it is flipped — there is nothing to submit — which
    // is the whole reason to reach for one over a checkbox in a form.
    const page = canvas.getByRole('switch', { name: /page the on-call/i })
    await userEvent.click(page)
    await expect(page).toBeChecked()
  },
}
