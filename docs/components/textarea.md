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
| `TextArea.Input` | `TextArea`   | The control. Grows with its content        |
| `TextArea.Hint`  | `Text`       | `slot="description"`                       |
| `TextArea.Error` | `FieldError` | Renders nothing while valid                |

React Aria's `TextArea` is the **element**, not the root — so the root here is `TextField`, which is
what owns the label, the value and the validity, exactly as it does for `Input`. That is why this
shares `field.ts` rather than growing an anatomy of its own: a legend, a hairline and a hint column
do not care how many lines the answer runs to.

**There is no `size`.** A field's `size` sets a fixed control height and a textarea does not have
one. The sheet's only variant, `.ds-textarea--compact`, is a `min-height`, and that is what this
control has: `min-h-[92px]`, the field's own minimum.

**The box grows with what is typed.** `field-sizing: content` sizes the control to its content, so
there is no mirror element and no grow script, and `resize-none` follows — a box that already fits
its content has nothing for a drag handle to do. `max-h-[12lh]` is the ceiling: past twelve lines it
scrolls rather than pushing the page down. `rows` stays on the element because it is the native
attribute, and because it is what sizes the box before this CSS is parsed, but it is no longer the
height; a consumer who wants a taller _start_ sets a `min-h` on the control.

Support: `field-sizing` is Chrome 123, Safari 26.2 and Firefox 152, and the rule that comes with it is
to write no fallback. A browser without it gets the field's fixed `min-h` box with a scrollbar and no
grow — and, because the drag handle went with the growth, no way to resize it by hand either. That is
the trade the entry names: a box that sizes itself needs no handle. Worth knowing it is a trade rather
than a free upgrade, and the one place this component is weaker on an old engine than it was before.
