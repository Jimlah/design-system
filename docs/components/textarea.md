# TextArea

The sheet's `.ds-textarea`: the field anatomy with a control that takes more than one line. The
third of the family, and the one `field.ts` was written for.

```tsx
<TextArea defaultValue="" isRequired>
  <TextArea.Label>Notes</TextArea.Label>
  <TextArea.Input rows={4} placeholder="What changed?" />
  <TextArea.Hint>Markdown is fine.</TextArea.Hint>
  <TextArea.Error>Keep it under 500 characters.</TextArea.Error>
</TextArea>
```

| Slot             | React Aria   | Notes                                      |
| ---------------- | ------------ | ------------------------------------------ |
| `TextArea`       | `TextField`  | Owns the value. The root is a text _field_ |
| `TextArea.Label` | `Label`      | The sheet's `.ds-field-legend`             |
| `TextArea.Input` | `TextArea`   | The control. `rows` is the height          |
| `TextArea.Hint`  | `Text`       | `slot="description"`                       |
| `TextArea.Error` | `FieldError` | Renders nothing while valid                |

React Aria's `TextArea` is the **element**, not the root — so the root here is `TextField`, which is
what owns the label, the value and the validity, exactly as it does for `Input`. That is why this
shares `field.ts` rather than growing an anatomy of its own: a legend, a hairline and a hint column
do not care how many lines the answer runs to.

**There is no `size`.** A field's `size` sets a fixed control height and a textarea does not have
one; its height is its `rows`. A three-line box and a five-line box are not two sizes of the same
thing. The sheet's only variant, `.ds-textarea--compact`, is a `min-height`, which `rows` says
without a second vocabulary.

`resize-y` and never `resize-x`: making a control wider than its column is not something a user
should be able to do to a form.
