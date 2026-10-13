# Form

A group of fields with a button that submits them — and the same fields bound to a TanStack Form,
further down.

```tsx
<Form onSubmit={(e) => save(e)}>
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
</Form>
```

| Slot           | React Aria | Notes                                        |
| -------------- | ---------- | -------------------------------------------- |
| `Form`         | `Form`     | The `<form>`. `onSubmit`, `validationErrors` |
| `Form.Legend`  | —          | The title, in the sheet's `.ds-panel-title`  |
| `Form.Section` | —          | A block of fields that belongs together      |
| `Form.Actions` | —          | The buttons, right-aligned                   |

**The point of a form component is that the fields already know how to say what is wrong.** Every
control here was built on React Aria's field anatomy, so each already renders its own `FieldError`
and marks itself `aria-invalid`. `Form` is what makes them all validate at once, on submit, and moves
focus to the first thing that failed.

Two footnotes to that, both of which have now been measured rather than assumed. A standalone
`Checkbox` could not say what was wrong until it was rebuilt on `CheckboxField` — it announced
`aria-invalid`, drew a red box and rendered no message — and `Slider` is the one field React Aria
does not supply an invalid state for at all, so its `Error` is this library's. See
[checkbox-and-radio.md](./checkbox-and-radio.md) and [slider.md](./slider.md).

### `validationBehavior="native"`, because `aria` does not validate at all

This is a **measured** finding, not a preference, and it is the only place in this system where a
React Aria default is overridden.

React Aria documents `aria` as the default: validation on submit, errors rendered by the component,
no browser chrome. In `react-aria-components` 1.22 a form in `aria` mode with a required empty field
submitted **cleanly** — no `FieldError`, no `aria-invalid`, focus left sitting on the submit button.
`requestSubmit()` on the form itself behaved the same way, so it was not the click. The same form with
`validationBehavior="native"` puts `required` on the input, and then React Aria marks the field
`aria-invalid`, renders the same styled `TextField.Error`, wires it as the field's `aria-describedby`
and moves focus to it. That is the whole behaviour, and it only exists in one of the two modes.

A consumer can still pass their own `validationBehavior`, because `{...props}` comes last.

### A server's answer arrives through the same door as the browser's

`validationErrors` is keyed by each field's `name`, so a field does not care where the objection came
from — which is why the same `TextField.Error` slot renders both. The `ServerErrors` story pins it.

### Two assertions this round got wrong, both instructive

- **`getByText` found the wrong node** for the error message and reported a colour that was never the
  error's. The element is now reached through the **input's own `aria-describedby`**, which is also
  the thing a screen reader reads — a query that cannot land on the wrong node because it follows the
  relationship rather than the text.
- **The field's border is teal, not red, while it is focused** — and that is correct. Focus outranks
  invalid here by design, so that typing inside a field you have already been told is wrong is not also
  shouted at. Asserting red on a focused invalid field was asserting the opposite of the design; the
  rule was already written down two components earlier and the test contradicted it.

A `<form>` also has **no `role="form"` unless it is named**, so querying the role finds nothing and the
story passes while asserting nothing at all.

## TanStack Form

`Form` is the React Aria half of this item; `Form/tanstack.tsx` is the [TanStack
Form](https://tanstack.com/form) half. The controls are the same controls. What changes is who owns
the value: a React Aria field owns its own and `Form` validates them all on submit, while a TanStack
form owns every value and this library only draws them.

```tsx
const form = useAppForm({
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
          <field.TextField isRequired>
            <field.TextField.Label>First name</field.TextField.Label>
            <field.TextField.Input placeholder="Ada" />
            <field.TextField.Error />
          </field.TextField>
        )}
      </form.AppField>
    </form.Form.Section>
    <form.Form.Actions>
      <form.Submit>Save</form.Submit>
    </form.Form.Actions>
  </form.Form>
</form.AppForm>
```

Installing this item installs `@tanstack/react-form`, because the item ships
`Form/tanstack.tsx`. Nothing in `Form.tsx` needs it: a form whose fields can own their own values
should use the React Aria half and skip all of this.

### `field.TextField` is a compound component, and `field` is TanStack's own render prop

`createFormHook` is what makes `<field.TextField>` work, and it is worth knowing why, because the
obvious alternative is the one that breaks later.

The obvious shape for an integration is one wrapper per control — a `FieldTextField` that takes a
`name` and reaches for the form through a hook. It only works inside the component that owns the
form, so a field inside a reusable sub-form, a field group, or a `withForm` block cannot reach a form
it was never given.

TanStack's answer is a context: `<form.AppField name="…">` provides the field, and a field component
reads it from `fieldContext` rather than being handed it. That is the same reason React Aria
components here take `isDisabled` rather than `disabled`. So `useAppForm` is `useForm` with these
components already registered, and the render prop TanStack hands back is the field API **with those
components assigned onto it** — which is why the field is called `field` here and why
`field.TextField` is this library's `TextField`. Registered names are:

| `field.…`       | The value it holds            | Its slots                                                     |
| --------------- | ----------------------------- | ------------------------------------------------------------- |
| `TextField`     | `string`                      | `Label`, `Group`, `Input`, `Icon`, `Hint`, `Error`            |
| `TextArea`      | `string`                      | `Label`, `Input`, `Hint`, `Error`                             |
| `SearchField`   | `string`                      | `Label`, `Group`, `Input`, `Icon`, `Hint`, `Error`            |
| `NumberField`   | `number \| null`              | `Label`, `Group`, `Input`, `Counter`, `Hint`, `Error`         |
| `Select`        | one key, or `null`            | every slot `Select` has                                       |
| `Checkbox`      | `boolean`                     | `Indicator`, `Text`, `Hint`, `Error`                          |
| `CheckboxGroup` | `string[]`                    | `Label`, `Hint`, `Error`                                      |
| `Switch`        | `boolean`                     | `Indicator`, `Text`, `Error`                                  |
| `Radio`         | one key of the group          | `Label`, `Hint`, `Error`                                      |
| `Slider`        | `number` or `number[]`        | `Header`, `Label`, `Value`, `Track`, `Fill`, `Thumb`, `Error` |
| `DateField`     | `DateValue` or `null`         | `Label`, `Group`, `Input`, `Hint`, `Error`                    |
| `TimeField`     | `TimeValue` or `null`         | `Label`, `Group`, `Input`, `Hint`, `Error`                    |
| `ColorField`    | `Color` or `string` or `null` | `Label`, `Control`, `Swatch`, `Input`, `Hint`, `Error`        |

Everything else is unchanged: `field.Select.Option`, `<Radio value="pro">`, `field.Slider.Thumb` and
the rest are the components this library already has, written exactly as they are outside a form.

### Four decisions worth knowing

- **Every bound field validates in `aria` mode.** TanStack owns validation here, so React Aria must not
  also run the browser's: left at `native`, a required field renders the `required` attribute and the
  browser blocks submission with its own bubble before the styled message can appear. This is the same
  decision `Form` records above, made the other way round for the fields it validates itself.
- **`field.TextField.Error` renders the field's messages when it is given no children.** TanStack's
  `meta.errors` holds whatever the validators returned — a string from a validator function, an issue
  object from a Standard Schema validator — so both shapes are read and the message text is what comes
  out. Pass children instead and it is the plain `TextField.Error` again, which is what a server's
  answer needs.
- **A field's value is `T | undefined` whatever the form's types say.** `useFieldContext<T>()` is a
  claim this library makes about the form it is dropped into, not one it can enforce, so each root
  narrows the value with a default rather than letting `undefined` through — which would flip the
  control from controlled to uncontrolled, the one state in which the form stops owning it.
- **`field.Select` is single-selection and `field.Radio` is the group.** React Aria splits a select's
  value in two — `selectedKey` for one choice, an array for several — and a radio carries no value of
  its own, naming itself to the group that owns the selection. A multiple select needs
  `useFieldContext` and a component of its own.
- **`field.Slider.Error` is the one message that is the field's rather than a server's.** Every other
  bound field reads an invalid state React Aria computed; `Slider` is not a field there, so
  `field.Slider` passes one in — `fieldErrorMessages(field).length > 0`, with no "touched" gate, the
  same rule the other twelve use. It is the one place in this integration where the invalid state does
  not come from React Aria, and [slider.md](./slider.md) records why.

### `form.Form` and `form.Submit`

`form.Form` is this library's `Form`, with the two lines every TanStack form has to get right already
written: `onSubmit` stops the browser's own submission before calling `handleSubmit`, and
`validationBehavior` is `aria`. Its layout slots come with it — `form.Form.Legend`,
`form.Form.Section`, `form.Form.Actions` are `Form`'s own.

`form.Submit` is a `Button` with `type="submit"` and `isPending` bound to the form's `isSubmitting`. It
is deliberately not disabled while the form is invalid: a button greyed out with no explanation is the
thing validation exists to avoid, and the errors belong to the fields.

### Why the two TanStack stories have no `play`

**Storybook runs a story's `play` when the story is _viewed_, so a `play` is not only a test — it is
also the story's opening state, and if it operates the controls, it operates them while the person
who just opened the story is.** That is not an assumption: it was measured in this repo's dev
server, in the static build served over plain HTTP, with the vitest, MCP and Chromatic addons removed
from `.storybook/main.ts`, and with `navigator.webdriver` reporting `false` under an ordinary Chrome
user agent.

Both of these stories shipped with a `play` that drove their own form, and both were wrong in the
same way. `TanStackForm` arrived filled in and already submitted, so there was nothing left to try —
and after that was patched with a closing Reset, opening it and typing within the first second had
the input wiped by the play's own click on that Reset. `TanStackFields` was worse: its `play`
clicked the Select, so opening the story and reaching for the Select yourself chose an option nobody
chose, and the play's own assertion failed underneath you.

So the demos are demos. **The coverage lives in `Form.browser.test.tsx`**, in the `components`
project, where nothing runs unless it is asked to: the form owning a field in both directions, a
failed submission announced through the `aria-describedby` a screen reader reads, and each control's
value shape — a number, a key, a boolean, an array — reaching the form, with `reset()` putting it back.

Two things that cost a round while writing those tests, both worth knowing. **`form.state.values`
read in a render is a snapshot with nothing subscribed to the store** — the readout has to be inside
`form.Subscribe`, or a working `NumberField` looks broken. And **a React Aria checkbox or switch is
a real input the recipe makes invisible, so the `<label>` is the click target** — a pointer aimed at
the control waits for a visibility Playwright will never grant. `Login.browser.test.tsx` already
made that second move for its own checkbox.

### What is exported

`Form.tsx` re-exports the whole integration, so a consumer imports from one place: `useAppForm`,
`withForm`, `withFieldGroup`, `useTypedAppFormContext`, `extendForm`, the two contexts with their
`useFieldContext` and `useFormContext` accessors, `fieldErrorMessages`, and the field components
themselves (`FieldTextField` and its siblings) for an app that wants to register them alongside its
own with `extendForm`.
