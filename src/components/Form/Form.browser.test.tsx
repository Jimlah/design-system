import { expect, test } from 'vite-plus/test'
import { useState } from 'react'
import { render } from 'vitest-browser-react'

import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { Radio } from '../Radio/Radio'
import { useAppForm } from './Form'

/**
 * The TanStack Form integration's tests, in Vitest's browser mode.
 *
 * **They are here rather than in the `play` functions of `Form.stories.tsx`, and that is the point of
 * the file.** Storybook runs a story's `play` when the story is *viewed* — measured in this repo's
 * dev server, in the static build, with the vitest, MCP and Chromatic addons removed, and with an
 * ordinary Chrome user agent — so a `play` that types into a form is a machine typing into the form
 * while the person who opened the story is trying to use it. That is not a theory either: the
 * TanStack stories shipped that way, and clicking the Select in one of them while it ran picked an
 * option nobody chose, then wiped what had been typed when its closing click landed on Reset.
 *
 * The two TanStack stories are demos meant to be used, so their coverage lives here, where nothing
 * runs unless it is asked to. What is asserted is the **contract**, not the story: that a field the
 * form owns is controlled in both directions, that a failure is announced through the same
 * `aria-describedby` a screen reader reads, and that each control's own value shape reaches the form.
 */

/**
 * The shape `Form.stories.tsx` documents, without the story's Reset button being the last thing that
 * happens to it.
 */
function BasicForm() {
  const [saved, setSaved] = useState('')
  const form = useAppForm({
    defaultValues: { firstName: '', host: '' },
    onSubmit: async ({ value }) => {
      setSaved(JSON.stringify(value))
    },
  })

  return (
    <div>
      <form.AppForm>
        <form.Form>
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
                <field.TextField.Input />
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
                <field.TextField.Input />
                <field.TextField.Hint>
                  Lowercase alphanumeric and dashes only
                </field.TextField.Hint>
                <field.TextField.Error />
              </field.TextField>
            )}
          </form.AppField>
          <form.Form.Actions>
            <Button type="button" variant="ghost" onPress={() => form.reset()}>
              Reset
            </Button>
            <form.Submit>Save</form.Submit>
          </form.Form.Actions>
        </form.Form>
      </form.AppForm>
      {saved ? <output data-slot="saved">{saved}</output> : null}
    </div>
  )
}

test('a field the form owns is controlled from the form, not by the input', async () => {
  const screen = await render(<BasicForm />)

  const first = screen.getByRole('textbox', { name: /First name/ })
  // The label is associated, so the field is reachable by name — which a wrapper rendering its own
  // `<label>` without a slot would break.
  await expect.element(first).toBeInTheDocument()
  // ...and the field named the control after itself in the form's data. Nothing in the JSX above
  // writes that attribute; `form.AppField name="firstName"` is where it comes from.
  await expect.element(first).toHaveAttribute('name', 'firstName')

  // Typing reaches the form, which is what "the form owns the value" has to mean.
  await first.fill('Ada')
  await expect.element(first).toHaveValue('Ada')

  // ...and the way back is what a one-way binding cannot do: `reset()` puts the control back to the
  // form's default, so the input follows the form rather than keeping what was typed into it.
  await screen.getByRole('button', { name: 'Reset' }).click()
  await expect.element(first).toHaveValue('')
})

test('a failed submission is announced the way a screen reader reads it', async () => {
  const screen = await render(<BasicForm />)

  const host = screen.getByRole('textbox', { name: /Hostname/ })
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect.element(host).toHaveAttribute('aria-invalid', 'true')

  // **The message is found through the control's own `aria-describedby`** rather than by its text. This
  // field has both a hint and an error, so the id list is more than one node; the error is the
  // described node wearing the sheet's error red, and that is what keeps the query from landing on
  // whichever node happens to match first — a mistake this suite has already made once.
  const describedBy = host.element().getAttribute('aria-describedby') ?? ''
  const error = describedBy
    .split(' ')
    .map((id) => document.getElementById(id))
    .find((node) => node?.classList.contains('text-destructive'))

  expect(error?.textContent).toBe('Enter a hostname.')
  // Nothing was submitted, which is the whole point of validating at the door.
  expect(document.querySelector('[data-slot=saved]')).toBeNull()

  // Both fields, because the form is only asked once and it is entitled to refuse while either is
  // empty — the first draft of this test filled only the hostname and then read the refusal as a
  // failure of the integration rather than of the test.
  await screen.getByRole('textbox', { name: /First name/ }).fill('Ada')
  await host.fill('fra1.example.com')
  await screen.getByRole('button', { name: 'Save' }).click()
  await expect.element(screen.getByText(/fra1\.example\.com/)).toBeVisible()
})

/**
 * One control per *value shape* rather than one per component: a number, a key from a list, a
 * boolean, one key of a group, and an array. The stories render all thirteen; the shapes are what
 * the binding has to get right, and the four controls whose shape is a plain string are covered by
 * the two tests above.
 */
function ShapesForm() {
  const form = useAppForm({
    defaultValues: {
      quantity: 0,
      region: null as string | null,
      alerts: false,
      plan: '',
      autoRetry: false,
      channels: [] as string[],
    },
    onSubmit: async () => {},
  })

  return (
    <div>
      <form.AppForm>
        <form.Form>
          <form.AppField name="quantity">
            {(field) => (
              <field.NumberField>
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
                {/* A bare `Select.Button` places the value and the caret; `Select` renders no trigger
                    of its own, which is why this line is not optional. */}
                <field.Select.Button />
                <field.Select.Menu>
                  <field.Select.Option id="fra">
                    fra1 · Frankfurt
                  </field.Select.Option>
                  <field.Select.Option id="iad">
                    iad1 · Virginia
                  </field.Select.Option>
                </field.Select.Menu>
              </field.Select>
            )}
          </form.AppField>
          <form.AppField name="alerts">
            {(field) => (
              <field.Checkbox>
                <field.Checkbox.Indicator />
                <field.Checkbox.Text>Email me</field.Checkbox.Text>
              </field.Checkbox>
            )}
          </form.AppField>
          <form.AppField name="autoRetry">
            {(field) => (
              <field.Switch>
                <field.Switch.Indicator />
                <field.Switch.Text>Auto-retry</field.Switch.Text>
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
          <form.AppField name="channels">
            {(field) => (
              <field.CheckboxGroup>
                <field.CheckboxGroup.Label>Channels</field.CheckboxGroup.Label>
                <Checkbox value="email">
                  <Checkbox.Indicator />
                  <Checkbox.Text>Email</Checkbox.Text>
                </Checkbox>
              </field.CheckboxGroup>
            )}
          </form.AppField>
          <form.Form.Actions>
            <Button type="button" variant="ghost" onPress={() => form.reset()}>
              Reset
            </Button>
          </form.Form.Actions>
        </form.Form>
      </form.AppForm>
      {/* The form's own state, so the assertion is about the form and not about the DOM, which would
          look the same whether or not anything were bound to it.
          **`form.Subscribe` and not `form.state.values` in the render**: the latter is a snapshot with
          nothing subscribing to the store, so it would read whatever the values were when this
          component last rendered — which the first draft of this file did, and which made a working
          NumberField look broken. */}
      <form.Subscribe selector={(state) => JSON.stringify(state.values)}>
        {(values) => <output data-slot="values">{values}</output>}
      </form.Subscribe>
    </div>
  )
}

test('each control writes into the form through its own value shape, and reset brings it back', async () => {
  const screen = await render(<ShapesForm />)
  const values = () =>
    document.querySelector('[data-slot=values]')?.textContent ?? ''

  await screen.getByRole('button', { name: /increase/i }).click()
  await screen.getByRole('button', { name: /region/i }).click()
  await screen.getByRole('option', { name: /fra1/ }).click()
  // **The label, not the control.** A React Aria checkbox and switch are a real input the recipe
  // makes invisible — it is the `<label>` around it that is the click target, and a pointer aimed at
  // the input itself waits forever for something Playwright will never call visible. Same move as
  // `Login.browser.test.tsx` makes for its "keep me signed in" checkbox.
  await screen.getByText('Email me').click()
  await screen.getByText('Auto-retry').click()
  await screen.getByText('Pro').click()

  await expect
    .element(screen.getByText('"region":"fra"', { exact: false }))
    .toBeVisible()
  expect(values()).toContain('"quantity":1')
  expect(values()).toContain('"alerts":true')
  expect(values()).toContain('"autoRetry":true')
  expect(values()).toContain('"plan":"pro"')

  await screen.getByRole('button', { name: 'Reset' }).click()
  await expect
    .element(screen.getByText('"region":null', { exact: false }))
    .toBeVisible()
  expect(values()).toContain('"quantity":0')
  expect(values()).toContain('"plan":""')
})

/**
 * **The two controls whose error this round fixed, on the TanStack side.** `field.Checkbox.Error` was
 * written, documented, and rendered nothing — the deprecated `Checkbox` publishes no field context —
 * and `field.Slider` had no `Error` slot at all, because React Aria's slider is not a field. Both are
 * bound to a validator that fails, so each message is the field's rather than a server's.
 */
function FailingFieldsForm() {
  const form = useAppForm({
    defaultValues: { terms: false, retention: 10 },
    onSubmit: async () => {},
  })

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField
          name="terms"
          validators={{
            onSubmit: ({ value }) => (value ? undefined : 'Accept the terms.'),
          }}
        >
          {(field) => (
            <field.Checkbox>
              <field.Checkbox.Indicator />
              <field.Checkbox.Text>Accept the terms</field.Checkbox.Text>
              <field.Checkbox.Error />
            </field.Checkbox>
          )}
        </form.AppField>
        <form.AppField
          name="retention"
          validators={{
            onSubmit: ({ value }) =>
              value >= 50 ? undefined : 'At least 50 days.',
          }}
        >
          {(field) => (
            <field.Slider minValue={0} maxValue={90}>
              <field.Slider.Label>Retention</field.Slider.Label>
              <field.Slider.Track>
                <field.Slider.Fill />
                <field.Slider.Thumb label="Days" />
              </field.Slider.Track>
              <field.Slider.Error />
            </field.Slider>
          )}
        </form.AppField>
        <form.Form.Actions>
          <form.Submit>Save</form.Submit>
        </form.Form.Actions>
      </form.Form>
    </form.AppForm>
  )
}

test('a bound checkbox and a bound slider both say what failed', async () => {
  const screen = await render(<FailingFieldsForm />)
  await screen.getByRole('button', { name: 'Save' }).click()

  /** The node a control's own `aria-describedby` points at, as a screen reader would follow it. */
  const described = (control: Element, text: string) =>
    (control.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .find((node) => node?.textContent === text)

  // A checkbox on its own is a field, so its error is its own — the half of this binding that rendered
  // nothing until the control was rebuilt on `CheckboxField`.
  const terms = screen.getByRole('checkbox', { name: 'Accept the terms' })
  await expect.element(terms).toHaveAttribute('aria-invalid', 'true')
  expect(described(terms.element(), 'Accept the terms.')).toBeTruthy()
  // ...and the name is the label alone, not the label and the message together.
  expect(terms.element().closest('label')?.textContent).toBe('Accept the terms')

  // ...and the slider, which is not a field in React Aria, is told it is invalid by the field and
  // carries that to its range input — the element a screen reader reads the value from.
  const days = screen.getByRole('slider', { name: /^Days/ })
  await expect.element(days).toHaveAttribute('aria-invalid', 'true')
  expect(described(days.element(), 'At least 50 days.')).toBeTruthy()
  await expect.element(screen.getByText('At least 50 days.')).toBeVisible()
})
