# Switch

The sheet's `.ds-switch`. An on/off setting, unlike a checkbox, which is one choice among
several: the state reads from which side the knob sits on, and the change takes effect at
once rather than on submit.

```tsx
<Switch defaultSelected>
  <Switch.Indicator />
  <Switch.Text>Auto-retry failed checks</Switch.Text>
</Switch>
```

| Slot               | React Aria                     | Notes                                                |
| ------------------ | ------------------------------ | ---------------------------------------------------- |
| `Switch`           | `SwitchField` + `SwitchButton` | Owns the state. `onChange(boolean)`, `name`, `value` |
| `Switch.Indicator` | —                              | The track and its knob, drawn for you                |
| `Switch.Text`      | —                              | The label                                            |
| `Switch.Error`     | `FieldError`                   | The message for an `isInvalid` switch                |

### `Switch.Error` is the half the invalid state was missing

The control has always _painted_ invalid — `CONTROL` turns its edge red one step above every
other state — while having nowhere to say what had failed. So a required switch announced
`aria-invalid`, drew a red edge, and named no reason. That is the one case a switch actually
has something to fail: a consent, a confirmation, a setting that must not be left on.

It was added by the TanStack Form integration, which is where the gap became impossible to
ignore — `field.Switch` is bound to a field that can carry a message, and had no slot to put
it in. The slot is the same shape as every other control's — `FieldError` underneath, the
shared `ERROR` recipe from `field.ts` on top — so nothing about it is new except its
existence. React Aria renders nothing while the field is valid, so it is always safe to
include.

**It renders inside the label, so it is also part of the switch's accessible name.** `Switch`
renders its children in `SwitchButton`, which is the `<label>`, and a `<label>` element's text is
the name of the control inside it: measured, an invalid switch carrying this message introduces
itself as `"Auto-retryYou must decide."`. React Aria's own docs put the description and the error
_before_ the button instead — beside it, in the field wrapper. `Checkbox` and `Radio` render their
children in the label the same way, so this is recorded rather than worked around in one of the
three.

### `Switch` itself is deprecated

React Aria's `Switch` carries `@deprecated Use SwitchField + SwitchButton instead` in 1.22,
so this builds on that pair. `SwitchField` is the wrapper that owns the value and supplies
the validation and help-text contexts; `SwitchButton` is the `<label>` you click.
`SwitchField` renders its children directly, so a consumer would otherwise have to write the
`SwitchButton` themselves — `Switch` writes it for them, which is why the slot list has no
`Switch.Button`.

**The `<label>` is the control root, and every state lands on it** — `data-selected`,
`data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-readonly`,
`data-invalid` and `data-required`. So the same rule as `Checkbox` applies: publish the state
on the label as custom properties and let the track read them, rather than reaching a child
through a group variant, which would tie on specificity and lose.

The `SwitchField` wrapper is a `<div>`, so `className` on `Switch` is layout only — the same
split as `TextField`, where `className` places the field and the control's own styling stays
internal.

### The edge rules are built so no two can match at once

A switch has four things that can decide its edge, and two pairs of them are not mutually
exclusive — selected and hovered, invalid and selected. Ordering those by source position
would be a coin flip, since Tailwind sorts them, so each rule is written to exclude the ones
it must not fight:

| State                  | Edge            | Specificity |
| ---------------------- | --------------- | ----------- |
| rest                   | `--input`       | 1           |
| selected               | `--primary`     | 2           |
| invalid (not disabled) | `--destructive` | 3           |
| hover (not invalid/ro) | `--foreground`  | 4           |

Hover excludes invalid and read-only, so it never competes with either; invalid sits one step
above selected, so a failed switch turns red even while it is on. The fill is left alone by
the hover rule entirely: a selected switch keeps its teal and gains a rim, where a checked
checkbox inverts.

Read-only keeps its state at full strength — the knob's position is the content — and only
loses the hover, exactly as a read-only field loses its own.

Invalid turns the **edge** red rather than the fill, so an off switch shows a red ring on a
transparent track and an on switch on a teal one. A 1px ring is legible on both, which a fill
swap would not be: swapping the fill would throw away the switch's state in order to show its
error.

### Two things that make the tests lie

- **`readonly` is not a valid attribute on a checkbox input**, so React Aria does not set it.
  Assert `aria-readonly` instead — the same split as `Checkbox`.
- **The knob's travel is measured, not read off a token.** The sheet's 20px is the track's
  inner width less the knob and both 2px insets (40 − 2 − 2 − 14 − 2 = 20), so the on and off
  positions are symmetric rather than eyeballed. The test compares `getBoundingClientRect()`
  before and after, which cannot drift the way a hardcoded expectation can. And Tailwind's
  `translate-x-*` sets the standalone `translate` property, not `transform` — the same trap
  as `scale-*`.
