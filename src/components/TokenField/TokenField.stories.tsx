import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { TokenFieldValue } from 'react-aria-components'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import {
  TokenField,
  TokenFieldHint,
  TokenFieldInput,
  TokenFieldLabel,
  TokenFieldToken,
} from './TokenField'

const meta = {
  component: TokenField,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TokenField.Label': TokenFieldLabel,
    'TokenField.Input': TokenFieldInput,
    'TokenField.Token': TokenFieldToken,
    'TokenField.Hint': TokenFieldHint,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        code: `<TokenField
  defaultValue={
    new TokenFieldValue([
      { type: 'token', text: '#ops', value: 'ops' },
      { type: 'text', text: ' on call' },
    ])
  }
>
  <TokenField.Label>Notify</TokenField.Label>
  <TokenField.Input />
  <TokenField.Hint>Backspace removes the token before the caret.</TokenField.Hint>
</TokenField>`,
      },
    },
  },
} satisfies Meta<typeof TokenField>

export default meta
type Story = StoryObj<typeof meta>

const input = () =>
  document.querySelector<HTMLElement>('[data-slot=token-input]')
/** The zero-width spaces React Aria wraps tokens in, which are not part of what the user sees. */
const sentence = () => input()?.textContent.replaceAll('\u200b', '')

/** A target is a sentence, so the value is text with tokens inside it — not a list of chips. */
const Notify = ({ tokens = true }: { tokens?: boolean }) => (
  <TokenField
    aria-label="Notify"
    defaultValue={
      new TokenFieldValue(
        tokens
          ? [
              { type: 'token', text: '#ops', value: 'ops' },
              { type: 'text', text: ' on call' },
            ]
          : [{ type: 'text', text: 'Notify #ops on call' }],
      )
    }
  >
    <TokenField.Label>Notify</TokenField.Label>
    <TokenField.Input />
    <TokenField.Hint>
      Backspace removes the token before the caret.
    </TokenField.Hint>
  </TokenField>
)

export const Default: Story = {
  render: () => <Notify />,
  play: async () => {
    await expect(screen.getByText('Notify')).toBeInTheDocument()

    const token = screen.getByText('#ops')
    // **A token is a box round a word, not a chip beside it.** It carries no role of its own and no
    // button — the sentence it sits in is the only thing with a role, which is the point of the
    // component, and the difference from `TagGroup`.
    await expect(token).toHaveAttribute('data-slot', 'token')
    await expect(token).not.toHaveAttribute('role')

    // **The rest of the sentence is not an element at all.** React Aria renders a text segment as the
    // bare string it is, so it belongs to the container's own text — which is what makes this one
    // editable sentence rather than a row of boxes, and why the sentence's type and colour are set on
    // `TokenField.Input` and not on a slot.
    await expect(sentence()).toBe('#ops on call')
  },
}

export const Placeholder: Story = {
  // **There is no `placeholder` prop** — a text field's placeholder belongs to its input element, and
  // this container has none. The text content of the value is what stands in for it.
  render: () => <Notify tokens={false} />,
  play: async () => {
    await expect(sentence()).toBe('Notify #ops on call')
    await expect(
      document.querySelector('[data-slot=token]'),
    ).not.toBeInTheDocument()
  },
}

export const Typing: Story = {
  render: () => <Notify />,
  play: async () => {
    await userEvent.click(input() as HTMLElement)
    await userEvent.type(input() as HTMLElement, ' now')

    // The sentence grows rather than a new one starting, because React Aria keeps one text segment at
    // the end of the value.
    await waitFor(() => expect(sentence()).toContain('now'))
  },
}

export const Removing: Story = {
  // Backspace at the end of the sentence eats the text, and then the token itself — the behaviour that
  // makes a token field feel like text rather than like a list of chips. None of it is implemented here.
  render: () => <Notify />,
  play: async () => {
    await userEvent.click(input() as HTMLElement)
    await userEvent.keyboard('{Backspace>9/}')

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot=token]'),
      ).not.toBeInTheDocument(),
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <TokenField
      aria-label="Notify"
      isDisabled
      defaultValue={
        new TokenFieldValue([{ type: 'text', text: 'Notify #ops on call' }])
      }
    >
      <TokenField.Label>Notify</TokenField.Label>
      <TokenField.Input />
    </TokenField>
  ),
  play: async () => {
    // React Aria reports this on the typing surface, so a test reads the state from the element the
    // user would have typed into — not from the root.
    await expect(input()).toHaveAttribute('data-disabled')
    await expect(input()).toHaveAttribute('data-rac')
  },
}

export const ReadOnly: Story = {
  // `isReadOnly` keeps the sentence readable and selectable but uneditable, and does not dim it — the
  // same rule the text field follows, for the same reason: it is available, just not to you.
  //
  // **There is no invalid state**, and so no `TokenField.Error`. React Aria 1.22's token field takes
  // `isDisabled`, `isReadOnly` and `allowsNewlines` and no validation props at all — an error slot here
  // would render and never be wired to anything, which is worse than not having one.
  render: () => (
    <TokenField
      aria-label="Notify"
      isReadOnly
      defaultValue={
        new TokenFieldValue([{ type: 'text', text: 'Notify #ops on call' }])
      }
    >
      <TokenField.Label>Notify</TokenField.Label>
      <TokenField.Input />
    </TokenField>
  ),
  play: async () => {
    await expect(input()).toHaveAttribute('data-readonly')
    await expect(sentence()).toBe('Notify #ops on call')
  },
}
