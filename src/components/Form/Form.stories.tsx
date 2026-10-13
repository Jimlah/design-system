import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'
import { useState } from 'react'

import { parseDate, parseTime } from '@internationalized/date'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { Radio } from '../Radio/Radio'
import { Select } from '../Select/Select'
import { TextField } from '../TextField/TextField'
import { Form, FormActions, FormLegend, FormSection, useAppForm } from './Form'

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
          {/* `Select` renders no trigger of its own — a bare `Select.Button` places the value and the
              caret — so without this line the select was a label and a menu with nothing between them,
              which is what this story shipped for as long as it has existed. */}
          <Select.Button />
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

/**
 * The TanStack Form integration, in the shape a consumer writes it: `useAppForm` returns a form with
 * this library's fields attached, and `<form.AppField>`'s render prop hands back that same form's
 * field API *with the fields on it* — which is what makes `field.TextField` the compound component
 * the docs promise rather than a name someone has to import twice.
 */
function TanStackBasics() {
  const [saved, setSaved] = useState('')
  const form = useAppForm({
    defaultValues: { firstName: '', host: '' },
    onSubmit: async ({ value }) => {
      setSaved(JSON.stringify(value))
    },
  })

  return (
    <div className="flex w-80 flex-col gap-4">
      <form.AppForm>
        <form.Form>
          <form.Form.Legend>New monitor</form.Form.Legend>
          <form.Form.Section>
            <form.AppField
              name="firstName"
              validators={{
                onSubmit: ({ value }) =>
                  value.trim() ? undefined : 'Enter a first name.',
              }}
            >
              {(field) => (
                <field.TextField>
                  <field.TextField.Label>First name</field.TextField.Label>
                  <field.TextField.Input placeholder="Ada" />
                  <field.TextField.Error />
                </field.TextField>
              )}
            </form.AppField>
            <form.AppField
              name="host"
              validators={{
                onSubmit: ({ value }) =>
                  value.trim() ? undefined : 'Enter a hostname.',
              }}
            >
              {(field) => (
                <field.TextField>
                  <field.TextField.Label>Hostname</field.TextField.Label>
                  <field.TextField.Input placeholder="example.com" />
                  <field.TextField.Hint>
                    Lowercase alphanumeric and dashes only
                  </field.TextField.Hint>
                  <field.TextField.Error />
                </field.TextField>
              )}
            </form.AppField>
          </form.Form.Section>
          <form.Form.Actions>
            {/* `form.reset()` is TanStack's own; the saved value is this story's, so it goes back with
                it. The button is also what lets the `play` below leave the form at rest — see the note
                there. */}
            <Button
              type="button"
              variant="ghost"
              onPress={() => {
                form.reset()
                setSaved('')
              }}
            >
              Reset
            </Button>
            <form.Submit>Save</form.Submit>
          </form.Form.Actions>
        </form.Form>
      </form.AppForm>
      {/* The form state, read live, so the story can assert that typing reached the form rather than
          that the input holds what was typed into it — which is true whether or not anything is bound. */}
      <form.Subscribe selector={(state) => state.values.firstName}>
        {(firstName) => (
          <output data-slot="value" className="text-muted-foreground">
            {firstName}
          </output>
        )}
      </form.Subscribe>
      {saved ? (
        <output data-slot="saved" className="text-muted-foreground">
          {saved}
        </output>
      ) : null}
    </div>
  )
}

export const TanStackForm: Story = {
  render: () => <TanStackBasics />,
  parameters: {
    docs: {
      source: {
        code: `const form = useAppForm({
  defaultValues: { firstName: '', host: '' },
  onSubmit: async ({ value }) => save(value),
})

<form.AppForm>
  <form.Form>
    <form.Form.Legend>New monitor</form.Form.Legend>
    <form.Form.Section>
      <form.AppField
        name="firstName"
        validators={{
          onSubmit: ({ value }) =>
            value.trim() ? undefined : 'Enter a first name.',
        }}
      >
        {(field) => (
          <field.TextField>
            <field.TextField.Label>First name</field.TextField.Label>
            <field.TextField.Input placeholder="Ada" />
            <field.TextField.Error />
          </field.TextField>
        )}
      </form.AppField>
    </form.Form.Section>
    <form.Form.Actions>
      <Button type="button" variant="ghost" onPress={() => form.reset()}>
        Reset
      </Button>
      <form.Submit>Save</form.Submit>
    </form.Form.Actions>
  </form.Form>
</form.AppForm>`,
      },
    },
  },
  // **This story has no `play`, and that is deliberate.** Storybook runs a story's `play` when the
  // story is *viewed* — measured in this repo's dev server and its static build, with the test-ish
  // addons removed, so it is not an artefact of the test runner — which means a `play` that types into
  // a form is a machine typing into this form while the person who opened it is trying to use it.
  // That is what this story shipped as: clicking the Select picked an option nobody chose, and the
  // closing Reset wiped what had been typed. The coverage lives in `Form.browser.test.tsx`, where
  // nothing runs unless it is asked to.
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

/**
 * Every field-shaped control in the library, bound to one form — the proof that the integration is a
 * pattern and not a single component. Each line here is the control's own documentation with the
 * value taken away: nothing about how a `Select` is written, or a `Radio`, or a `Slider`, changes
 * because it is now inside a form.
 */
function TanStackFieldsDemo() {
  const form = useAppForm({
    defaultValues: {
      notes: '',
      query: '',
      quantity: 0,
      region: null as string | null,
      alerts: false,
      channels: [] as string[],
      autoRetry: false,
      plan: '',
      retention: 30,
      startsOn: parseDate('2024-03-18'),
      opensAt: parseTime('09:30'),
      accent: '#71FFF6',
    },
    onSubmit: async () => {},
  })

  return (
    <div className="flex w-96 flex-col gap-5">
      <form.AppForm>
        <form.Form>
          <form.Form.Section>
            <form.AppField name="notes">
              {(field) => (
                <field.TextArea>
                  <field.TextArea.Label>Notes</field.TextArea.Label>
                  <field.TextArea.Input rows={3} placeholder="What changed?" />
                </field.TextArea>
              )}
            </form.AppField>

            <form.AppField name="query">
              {(field) => (
                <field.SearchField>
                  <field.SearchField.Label>
                    Search monitors
                  </field.SearchField.Label>
                  <field.SearchField.Group>
                    <field.SearchField.Icon />
                    <field.SearchField.Input placeholder="Filter by name…" />
                  </field.SearchField.Group>
                </field.SearchField>
              )}
            </form.AppField>

            <form.AppField name="quantity">
              {(field) => (
                <field.NumberField minValue={0} maxValue={10}>
                  <field.NumberField.Label>Quantity</field.NumberField.Label>
                  <field.NumberField.Group>
                    <field.NumberField.Input />
                    <field.NumberField.Counter />
                  </field.NumberField.Group>
                </field.NumberField>
              )}
            </form.AppField>

            <form.AppField name="region">
              {(field) => (
                <field.Select placeholder="Choose a region">
                  <field.Select.Label>Region</field.Select.Label>
                  <field.Select.Button>
                    <field.Select.Value />
                    <field.Select.Icon />
                  </field.Select.Button>
                  <field.Select.Popover>
                    <field.Select.OptionList>
                      <field.Select.Option id="fra">
                        fra1 · Frankfurt
                      </field.Select.Option>
                      <field.Select.Option id="iad">
                        iad1 · Virginia
                      </field.Select.Option>
                    </field.Select.OptionList>
                  </field.Select.Popover>
                  <field.Select.Error />
                </field.Select>
              )}
            </form.AppField>

            <form.AppField name="alerts">
              {(field) => (
                <field.Checkbox>
                  <field.Checkbox.Indicator />
                  <field.Checkbox.Text>
                    Email me when it goes down
                  </field.Checkbox.Text>
                </field.Checkbox>
              )}
            </form.AppField>

            <form.AppField name="channels">
              {(field) => (
                <field.CheckboxGroup>
                  <field.CheckboxGroup.Label>
                    Channels
                  </field.CheckboxGroup.Label>
                  <Checkbox value="email">
                    <Checkbox.Indicator />
                    <Checkbox.Text>Email</Checkbox.Text>
                  </Checkbox>
                  <Checkbox value="sms">
                    <Checkbox.Indicator />
                    <Checkbox.Text>SMS</Checkbox.Text>
                  </Checkbox>
                  <field.CheckboxGroup.Hint>
                    Applies to every monitor.
                  </field.CheckboxGroup.Hint>
                </field.CheckboxGroup>
              )}
            </form.AppField>

            <form.AppField name="autoRetry">
              {(field) => (
                <field.Switch>
                  <field.Switch.Indicator />
                  <field.Switch.Text>
                    Auto-retry failed checks
                  </field.Switch.Text>
                </field.Switch>
              )}
            </form.AppField>

            <form.AppField name="plan">
              {(field) => (
                <field.Radio>
                  <field.Radio.Label>Plan</field.Radio.Label>
                  <Radio value="free">
                    <Radio.Indicator />
                    <Radio.Text>Free</Radio.Text>
                  </Radio>
                  <Radio value="pro">
                    <Radio.Indicator />
                    <Radio.Text>Pro</Radio.Text>
                  </Radio>
                </field.Radio>
              )}
            </form.AppField>

            <form.AppField name="retention">
              {(field) => (
                <field.Slider minValue={0} maxValue={90}>
                  <field.Slider.Header>
                    <field.Slider.Label>Retention</field.Slider.Label>
                    <field.Slider.Value />
                  </field.Slider.Header>
                  <field.Slider.Track>
                    <field.Slider.Fill />
                    <field.Slider.Thumb label="Days" />
                  </field.Slider.Track>
                  <field.Slider.Error />
                </field.Slider>
              )}
            </form.AppField>

            <form.AppField name="startsOn">
              {(field) => (
                <field.DateField>
                  <field.DateField.Label>Starts on</field.DateField.Label>
                  <field.DateField.Group>
                    <field.DateField.Input />
                  </field.DateField.Group>
                </field.DateField>
              )}
            </form.AppField>

            <form.AppField name="opensAt">
              {(field) => (
                <field.TimeField>
                  <field.TimeField.Label>Opens at</field.TimeField.Label>
                  <field.TimeField.Group>
                    <field.TimeField.Input />
                  </field.TimeField.Group>
                </field.TimeField>
              )}
            </form.AppField>

            <form.AppField name="accent">
              {(field) => (
                <field.ColorField>
                  <field.ColorField.Label>Accent</field.ColorField.Label>
                  <field.ColorField.Control>
                    <field.ColorField.Swatch />
                    <field.ColorField.Input />
                  </field.ColorField.Control>
                </field.ColorField>
              )}
            </form.AppField>
          </form.Form.Section>
          <form.Form.Actions>
            <Button type="button" variant="ghost" onPress={() => form.reset()}>
              Reset
            </Button>
          </form.Form.Actions>
        </form.Form>
      </form.AppForm>
      <form.Subscribe selector={(state) => JSON.stringify(state.values)}>
        {(values) => (
          <output
            data-slot="values"
            className="break-all text-muted-foreground"
          >
            {values}
          </output>
        )}
      </form.Subscribe>
    </div>
  )
}

export const TanStackFields: Story = {
  render: () => <TanStackFieldsDemo />,
  // The demo is the form: type in it, pick from the select, drag the rail, and watch the readout
  // below change. It has no `play` for the reason recorded on `TanStackForm` above, and the coverage
  // that used to be here is in `Form.browser.test.tsx`.
}
