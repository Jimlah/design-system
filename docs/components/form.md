# Form

A group of fields with a button that submits them.

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
