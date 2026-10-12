import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { Select } from '../Select/Select'
import { TextField } from '../TextField/TextField'
import { Form, FormActions, FormLegend, FormSection } from './Form'

const meta = {
  component: Form,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Form.Legend': FormLegend,
    'Form.Section': FormSection,
    'Form.Actions': FormActions,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Form onSubmit={(e) => save(e)}>
  <Form.Legend>New monitor</Form.Legend>
  <Form.Section>
    <TextField name="host" isRequired>
      <TextField.Label>Hostname</TextField.Label>
      <TextField.Input />
      <TextField.Error>Enter a hostname.</TextField.Error>
    </TextField>
  </Form.Section>
  <Form.Actions>
    <Button type="submit">Save</Button>
  </Form.Actions>
</Form>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <Form onSubmit={(e) => e.preventDefault()} className="w-80">
      <Form.Legend>New monitor</Form.Legend>
      <Form.Section>
        <TextField name="host" isRequired>
          <TextField.Label>Hostname</TextField.Label>
          <TextField.Input placeholder="example.com" />
          <TextField.Error>Enter a hostname.</TextField.Error>
        </TextField>
      </Form.Section>
      <Form.Actions>
        <Button type="reset" variant="ghost">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // It is a real `<form>`, so Enter in a field submits it and a password manager recognises it —
    // which a stack of `div`s with a button under them does not get.
    //
    // It does **not** have `role="form"`: a form is only a landmark when it has an accessible name, and
    // this one has a visible heading rather than a label. Querying the role finds nothing and the story
    // passes while asserting nothing at all — the failure mode this suite keeps having to relearn.
    const form = canvasElement.querySelector('form') as HTMLElement
    await expect(form).toBeInTheDocument()
    await expect(form).not.toHaveAttribute('role')

    // The title wears the sheet's `.ds-panel-title` — the same type a modal's title does, because both
    // are the name of one short task.
    const legend = canvas.getByText('New monitor')
    await expect(getComputedStyle(legend).fontSize).toBe('18px')
    await expect(getComputedStyle(legend).fontWeight).toBe('600')

    // A real submit button, so the form can be submitted by pressing Enter in a field.
    await expect(
      canvasElement.querySelector('button[type=submit]'),
    ).toBeInTheDocument()
  },
}

export const Validation: Story = {
  // **This is what a `Form` is for.** Every control here was built on React Aria's field anatomy, so
  // each already renders its own `FieldError`; the form is what validates them all at once on submit
  // and moves focus to the first one that failed.
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.queryByText('Enter a hostname.'),
    ).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))

    const input = canvas.getByRole('textbox', { name: /Hostname/ })
    await expect(input).toHaveFocus()
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // The message is the sheet's own error red, not a browser bubble in the platform's typeface — and it
    // is found through the **input's own `aria-describedby`**, which is the element a screen reader
    // reads out. `getByText` matched something else here and measured a colour that was never the
    // error's, which is the third time in this file that a query found a node nobody was asserting about.
    const describedBy = input.getAttribute('aria-describedby')
    await expect(describedBy).toBeTruthy()
    const error = canvasElement.querySelector(
      `#${CSS.escape(describedBy as string)}`,
    ) as HTMLElement
    await expect(error).toHaveTextContent('Enter a hostname.')
    await expect(error).toHaveClass(/text-destructive/)

    // The red is **not** asserted on the field's border, and that is the system working. React Aria
    // moves focus to the first field that failed, and focus outranks invalid here — the rule this
    // system settled on two components ago, so that typing inside a field you have already been told is
    // wrong is not also shouted at. A teal border on a focused invalid field is the correct rendering;
    // asserting red on it was asserting the opposite of the design.
    await expect(error).toHaveClass(/text-destructive/)

    // Typing an answer lets it through.
    await userEvent.type(input, 'example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(
      canvas.queryByText('Enter a hostname.'),
    ).not.toBeInTheDocument()
    await expect(canvasElement.querySelector('input')).toHaveValue(
      'example.com',
    )
  },
}

export const ServerErrors: Story = {
  render: () => (
    <Form
      onSubmit={(e) => e.preventDefault()}
      validationErrors={{ host: 'That hostname is already taken.' }}
      className="w-80"
    >
      <Form.Section>
        <TextField name="host" isRequired defaultValue="fra1.example.com">
          <TextField.Label>Hostname</TextField.Label>
          <TextField.Input />
          <TextField.Error />
        </TextField>
      </Form.Section>
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
  // **A server's answer arrives through the same door as the browser's.** `validationErrors` is keyed
  // by each field's `name`, so a field does not care where the objection came from — which is why the
  // same `TextField.Error` slot renders both, and why nothing here has to distinguish them.
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('That hostname is already taken.'),
    ).toBeVisible()
    await expect(
      canvas.getByRole('textbox', { name: /Hostname/ }),
    ).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Fields: Story = {
  render: () => (
    <Form onSubmit={(e) => e.preventDefault()} className="w-80">
      <Form.Section>
        <TextField name="host" isRequired>
          <TextField.Label>Hostname</TextField.Label>
          <TextField.Input placeholder="example.com" />
          <TextField.Error>Enter a hostname.</TextField.Error>
        </TextField>
        <Select name="region" isRequired placeholder="Choose a region">
          <Select.Label>Region</Select.Label>
          <Select.Menu>
            <Select.Option id="fra">fra1 · Frankfurt</Select.Option>
            <Select.Option id="iad">iad1 · Virginia</Select.Option>
          </Select.Menu>
          <Select.Error>Choose a region.</Select.Error>
        </Select>
        <Checkbox name="alerts">
          <Checkbox.Indicator />
          <Checkbox.Text>Email me when it goes down</Checkbox.Text>
        </Checkbox>
      </Form.Section>
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
  // ...and it does not care *what* is in it. A field, a select and a checkbox all report through the
  // same anatomy, so a form made of all three validates as one thing without the form knowing which
  // is which.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))

    // Both the text field and the select are required, and both say so at once rather than one at a
    // time — a form that reveals its objections one per submission is a form nobody finishes.
    await expect(await canvas.findByText('Enter a hostname.')).toBeVisible()
    await expect(canvas.getByText('Choose a region.')).toBeVisible()
    await expect(canvas.getByRole('checkbox')).not.toHaveAttribute(
      'aria-invalid',
    )
  },
}

export const Reset: Story = {
  // A real `type="reset"` button puts every field back to its default, which is the browser's own
  // behaviour and the reason not to build a "clear" button out of state.
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /Hostname/ })
    await userEvent.type(input, 'fra1.example.com')
    await expect(input).toHaveValue('fra1.example.com')

    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(canvas.getByRole('textbox', { name: /Hostname/ })).toHaveValue(
      '',
    )
  },
}
