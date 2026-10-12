import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { User } from '@react-aria/test-utils'

import {
  Checkbox,
  CheckboxFieldError,
  CheckboxGroup,
  CheckboxHint,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxText,
} from './Checkbox'

const meta = {
  component: Checkbox,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Checkbox.Group': CheckboxGroup,
    'Checkbox.Indicator': CheckboxIndicator,
    'Checkbox.Text': CheckboxText,
    'Checkbox.Label': CheckboxLabel,
    'Checkbox.Hint': CheckboxHint,
    'Checkbox.Error': CheckboxFieldError,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Checkbox.Group defaultValue={['slow']}>
  <Checkbox.Label>Alert me when</Checkbox.Label>
  <Checkbox value="down">
    <Checkbox.Indicator />
    <Checkbox.Text>Down</Checkbox.Text>
  </Checkbox>
  <Checkbox.Hint>Applies to every monitor.</Checkbox.Hint>
  <Checkbox.Error>Pick at least one.</Checkbox.Error>
</Checkbox.Group>`,
      },
    },
    layout: 'centered',
  },
  args: {
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
    isInvalid: false,
  },
  argTypes: {
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
  },
  render: (args) => (
    <Checkbox {...args} defaultSelected>
      <Checkbox.Indicator />
      <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
    </Checkbox>
  ),
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/** The `.ds-check-box` inside the control the given input belongs to. */
const boxOf = (input: HTMLElement) =>
  input.closest('label')?.querySelector('[data-slot=indicator]') as HTMLElement
const tickOf = (input: HTMLElement) =>
  boxOf(input).querySelector('svg') as SVGElement

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Checkbox>
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox defaultSelected>
        <Checkbox.Indicator />
        <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
      </Checkbox>
      <Checkbox defaultSelected isDisabled>
        <Checkbox.Indicator />
        <Checkbox.Text>Cert expiring — locked</Checkbox.Text>
      </Checkbox>
    </div>
  ),
  play: async ({ canvas }) => {
    const off = canvas.getByRole('checkbox', { name: 'Down' })
    const on = canvas.getByRole('checkbox', { name: /slow/i })

    await expect(off).not.toBeChecked()
    await expect(on).toBeChecked()

    // The sheet's box: 18px square, 2px radius, hairline border.
    const box = boxOf(off)
    const boxStyles = getComputedStyle(box)
    await expect(boxStyles.width).toBe('18px')
    await expect(boxStyles.height).toBe('18px')
    await expect(boxStyles.borderRadius).toBe('2px')
    await expect(boxStyles.borderTopColor).not.toBe('rgba(0, 0, 0, 0)')

    // Selected fills the box with the accent and fades the tick in. The tick is
    // always in the DOM, so nothing mounts and nothing shifts. Both transition, so
    // they are frozen before being read.
    const onBox = boxOf(on)
    onBox.style.transition = 'none'
    tickOf(on).style.transition = 'none'
    await expect(getComputedStyle(onBox).backgroundColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(tickOf(on)).opacity).toBe('1')
    await expect(getComputedStyle(tickOf(off)).opacity).toBe('0')

    // Disabled dims the whole control rather than repainting it, as elsewhere.
    const locked = canvas.getByRole('checkbox', { name: /locked/i })
    await expect(locked).toBeDisabled()
    await expect(
      getComputedStyle(locked.closest('label') as HTMLElement).opacity,
    ).toBe('0.35')
  },
}

export const Group: Story = {
  render: () => (
    <Checkbox.Group defaultValue={['slow']} className="w-64">
      <Checkbox.Label>Alert me when</Checkbox.Label>
      <Checkbox value="down">
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox value="slow">
        <Checkbox.Indicator />
        <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
      </Checkbox>
      <Checkbox value="tls">
        <Checkbox.Indicator />
        <Checkbox.Text>Certificate expires</Checkbox.Text>
      </Checkbox>
      <Checkbox.Hint>Applies to every monitor.</Checkbox.Hint>
    </Checkbox.Group>
  ),
  play: async ({ canvas, canvasElement }) => {
    // The CheckboxGroup tester reads the *group's* value rather than the inputs' — which is exactly
    // the claim this story makes, that the group owns it.
    const ariaUser = new User({ interactionType: 'mouse' })
    const group = ariaUser.createTester('CheckboxGroup', {
      root: canvasElement,
    })

    await expect(group.getSelectedCheckboxes()).toHaveLength(1)
    await expect(group.getSelectedCheckboxes()[0]).toBeChecked()

    // Adding, not replacing — the difference from a `Radio.Group`, driven the way the pattern says.
    await group.toggleCheckbox({ checkbox: 'Down' })
    await expect(group.getSelectedCheckboxes()).toHaveLength(2)

    // Queried by the group's label, so this only resolves if `Checkbox.Label` is associated with
    // `Checkbox.Group`; and the hint is wired through `aria-describedby`, not merely sitting nearby.
    const labelled = canvas.getByRole('group', { name: /alert me when/i })
    const describedBy = labelled.getAttribute('aria-describedby') ?? ''
    const hint = canvas.getByText(/applies to every monitor/i)
    await expect(describedBy.split(' ')).toContain(hint.id)
  },
}

export const Selection: Story = {
  render: () => (
    <Checkbox.Group defaultValue={['down']} className="w-64">
      <Checkbox.Label>Alert me when</Checkbox.Label>
      <Checkbox value="down">
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox value="slow">
        <Checkbox.Indicator />
        <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
      </Checkbox>
    </Checkbox.Group>
  ),
  play: async ({ canvas }) => {
    const down = canvas.getByRole('checkbox', { name: 'Down' })
    const slow = canvas.getByRole('checkbox', { name: /slow/i })

    await expect(down).toBeChecked()
    await expect(slow).not.toBeChecked()
    // Ticking a second one adds to the array — it does not replace the first, which
    // is the whole difference between this and a `Radio.Group`.
    await userEvent.click(slow)
    await expect(down).toBeChecked()
    await expect(slow).toBeChecked()

    // ...and unticking the first leaves the second alone.
    await userEvent.click(down)
    await expect(down).not.toBeChecked()
    await expect(slow).toBeChecked()
  },
}

export const Toggle: Story = {
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: /slow/i })

    // Space, not click: a checkbox has to work from the keyboard, and the state is
    // React Aria's `data-selected` rather than the native `checked` property.
    await userEvent.tab()
    await expect(checkbox).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(checkbox).not.toBeChecked()
    await userEvent.keyboard(' ')
    await expect(checkbox).toBeChecked()
  },
}

export const Indeterminate: Story = {
  // A checkbox standing in for a set of which only some are chosen — a table's select-all,
  // usually. It fills like a checked one and shows a dash instead: the difference between "all of
  // it" and "some of it".
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox
        {...args}
        isIndeterminate
        isSelected={false}
        onChange={() => {}}
      >
        <Checkbox.Indicator />
        <Checkbox.Text>All checks</Checkbox.Text>
      </Checkbox>
      <Checkbox {...args} defaultSelected>
        <Checkbox.Indicator />
        <Checkbox.Text>One check</Checkbox.Text>
      </Checkbox>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [some, all] = [
      ...canvasElement.querySelectorAll<HTMLInputElement>(
        'input[type=checkbox]',
      ),
    ]

    // The state is a *property*, not an attribute: a native checkbox says "mixed" through
    // `indeterminate`, and the browser reports it to assistive tech from there. Nothing writes it
    // into the markup, so `aria-checked` is absent on it and asserting on that fails.
    await expect(some.indeterminate).toBe(true)
    await expect(some.checked).toBe(false)
    await expect(all.indeterminate).toBe(false)

    // The dash stands in for the tick in the same 18px box, so the two states cannot differ in
    // size — only in which mark is showing.
    const pick = (input: HTMLInputElement, slot: string) =>
      input
        .closest('label')
        ?.querySelector(`[data-slot=${slot}]`) as HTMLElement
    const indicatorOf = (input: HTMLInputElement) => pick(input, 'indicator')

    await expect(getComputedStyle(pick(some, 'dash')).opacity).toBe('1')
    await expect(getComputedStyle(pick(some, 'mark')).opacity).toBe('0')
    // ...and the reverse for a plain checked one.
    await expect(getComputedStyle(pick(all, 'mark')).opacity).toBe('1')
    await expect(getComputedStyle(pick(all, 'dash')).opacity).toBe('0')

    // Both fill the box the same way, so "some" reads as the same kind of state as "all" rather
    // than as a third thing.
    await expect(getComputedStyle(indicatorOf(some)).backgroundColor).toBe(
      getComputedStyle(indicatorOf(all)).backgroundColor,
    )
    await expect(getComputedStyle(indicatorOf(some)).width).toBe('18px')
  },
}

export const FocusRing: Story = {
  render: () => (
    <Checkbox>
      <Checkbox.Indicator />
      <Checkbox.Text>Down</Checkbox.Text>
    </Checkbox>
  ),
  // The control is a 1x1 invisible input, so the ring is drawn on the indicator. It
  // is present but transparent at rest, so it can fade in with everything else
  // rather than switching the outline on and off.
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Down' })
    const box = boxOf(checkbox)
    // The *indicator* transitions, not the input it belongs to — reading its colour
    // straight after a state change returns the old one mid-transition.
    box.style.transition = 'none'

    await expect(getComputedStyle(box).outlineColor).not.toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await userEvent.tab()
    await expect(checkbox).toHaveFocus()
    await expect(getComputedStyle(box).outlineStyle).toBe('solid')
    await expect(getComputedStyle(box).outlineColor).toBe(
      'oklch(0.9198 0.1236 189.5)',
    )
    await expect(getComputedStyle(box).outlineOffset).toBe('3px')
  },
}

export const Hover: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Checkbox>
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox defaultSelected>
        <Checkbox.Indicator />
        <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
      </Checkbox>
    </div>
  ),
  // Hover goes through `user-event`, which fires the pointer events a pointer really
  // fires — the `data-hovered` state React Aria derives from them is then the component's
  // own, not something the test put there. See the testing guidance in AGENTS.md.
  play: async ({ canvas }) => {
    const off = canvas.getByRole('checkbox', { name: 'Down' })
    const on = canvas.getByRole('checkbox', { name: /slow/i })
    const root = (input: HTMLElement) => input.closest('label') as HTMLElement
    // The indicator is what transitions, not the input, so this is where the
    // transition has to be killed before reading a colour straight after the change.
    for (const el of [off, on]) boxOf(el).style.transition = 'none'

    // Hovering an empty box brightens its border...
    await userEvent.hover(boxOf(off))
    // **Waited for, because the state is React Aria's and it lands on the next commit.**
    // `userEvent.hover` fires the pointer sequence; `data-hovered` is derived from it by a
    // re-render, so a read on the very next line races that commit — and loses on a slower
    // runner, where the attribute is simply not there yet. See the testing rules in AGENTS.md.
    await waitFor(() =>
      expect(root(off)).toHaveAttribute('data-hovered', 'true'),
    )
    await expect(getComputedStyle(boxOf(off)).borderTopColor).toBe(
      'oklch(1 0 none)', // --color-fg
    )
    // ...and hovering a checked one inverts its fill, as the sheet does.
    await userEvent.hover(boxOf(on))
    await waitFor(() =>
      expect(root(on)).toHaveAttribute('data-hovered', 'true'),
    )
    await expect(getComputedStyle(boxOf(on)).backgroundColor).toBe(
      'oklch(1 0 none)',
    )
  },
}

export const ReadOnly: Story = {
  render: () => (
    <Checkbox isReadOnly>
      <Checkbox.Indicator />
      <Checkbox.Text>Down</Checkbox.Text>
    </Checkbox>
  ),
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Down' })
    // Read-only is not disabled: it stays focusable and announced, it just cannot be
    // changed — which for a checkbox is the `aria-readonly` state, not `disabled`.
    await expect(checkbox).toHaveAttribute('aria-readonly', 'true')
    await expect(checkbox).not.toBeDisabled()
  },
}

export const FieldError: Story = {
  render: () => (
    <Checkbox.Group isInvalid className="w-64">
      <Checkbox.Label>Alert me when</Checkbox.Label>
      <Checkbox value="down">
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox.Error>Pick at least one trigger.</Checkbox.Error>
    </Checkbox.Group>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: /alert me when/i })
    // React Aria splits the two: the group gets `data-invalid` as a styling hook,
    // while `aria-invalid` goes on each control — the group itself is not a
    // focusable thing a screen reader could land on.
    await expect(group).toHaveAttribute('data-invalid', 'true')
    await expect(
      canvas.getByRole('checkbox', { name: 'Down' }),
    ).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText(/pick at least one trigger/i)).toBeVisible()
  },
}

export const GroupRequired: Story = {
  render: () => (
    <Checkbox.Group isRequired className="w-64">
      <Checkbox.Label>Alert me when</Checkbox.Label>
      <Checkbox value="down">
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
    </Checkbox.Group>
  ),
  play: async ({ canvas }) => {
    const label = canvas.getByText(/alert me when/i)
    const marker = getComputedStyle(label, '::after')
    await expect(marker.content).toContain('*')
    await expect(marker.color).toBe('oklch(0.785 0.1236 29)') // --color-red
  },
}

export const GroupDisabled: Story = {
  render: () => (
    <Checkbox.Group isDisabled className="w-64">
      <Checkbox.Label>Alert me when</Checkbox.Label>
      <Checkbox value="down">
        <Checkbox.Indicator />
        <Checkbox.Text>Down</Checkbox.Text>
      </Checkbox>
      <Checkbox value="slow">
        <Checkbox.Indicator />
        <Checkbox.Text>Slow — over 600ms</Checkbox.Text>
      </Checkbox>
    </Checkbox.Group>
  ),
  play: async ({ canvas }) => {
    // The group disables its controls, so none of them has to be told.
    await expect(canvas.getByRole('checkbox', { name: 'Down' })).toBeDisabled()
    await expect(canvas.getByRole('checkbox', { name: /slow/i })).toBeDisabled()
  },
}
