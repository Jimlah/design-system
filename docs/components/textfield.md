# TextField

The second component, and the anatomy the rest of the form controls reuse —
textarea, select, checkbox and radio all want the same legend + control + hint
column.

```tsx
<TextField defaultValue="" size="md" isRequired isInvalid={taken}>
  <TextField.Label>Monitor name</TextField.Label>
  <TextField.Group>
    <TextField.Input placeholder="example.com" />
    <TextField.Icon position="start">{magnifier}</TextField.Icon>
  </TextField.Group>
  <TextField.Hint>Lowercase alphanumeric and dashes only</TextField.Hint>
  <TextField.Error>That hostname is taken</TextField.Error>
</TextField>
```

| Slot              | React Aria   | Notes                                                  |
| ----------------- | ------------ | ------------------------------------------------------ |
| `TextField`       | `TextField`  | Owns `size` and the value. `onChange` gives a string   |
| `TextField.Label` | `Label`      | The sheet's `.ds-field-legend`                         |
| `TextField.Group` | `Group`      | Opt-in wrapper; the `relative` anchor for affixes      |
| `TextField.Input` | `Input`      | Height and type size come from the field               |
| `TextField.Icon`  | —            | `position="start" \| "end"`; must sit inside a `Group` |
| `TextField.Hint`  | `Text`       | `slot="description"`, so it is described-by            |
| `TextField.Error` | `FieldError` | Renders nothing while the field is valid               |

### Size travels as CSS, not context

`size` is `sm | md | lg` and sets two custom properties on the field —
`--field-control-h` and `--field-control-text` — which the control and any affix
inherit. No React context, because the affix is an ordinary descendant of the
field. A one-off override is a utility on the element rather than a new prop.

### Focus is the border, and only the border

The sheet's `.ds-input:focus` sets `outline: none` and turns the border teal.
Copy that. `Button` can carry the shared 3px-offset ring because the edge it
repeats is a solid fill; on a 1px border the same ring draws two parallel teal
hairlines with a gap between them, which reads as a rendering fault.

`outline-none` is doing real work there, not tidying up. **Chrome gives a focused
text input its `:focus-visible` ring at `outline-style: auto` regardless of React
Aria's `data-focus-visible`**, so removing our ring without disabling the UA one
just substitutes a blue browser ring on a teal system.

Focus also wins over invalid, as it does in the sheet (`:focus` out-specifies
`.ds-input--error`). Typing inside a field you have already been told is wrong is
when you least need the border shouting; the error message stays red throughout.

**There is a second source of the destructive border: the browser's own `:user-invalid`.** `field.ts`
and `TextArea` carry `user-invalid:not-data-[focused]:border-destructive`, so a field the user has left
in a state the browser considers invalid reddens as they leave it, before anything is submitted and
without a "touched" class or a blur listener. It is deliberately _only_ the border: React Aria reports
`isInvalid` on submit, and that is what renders the `FieldError` and sets `aria-invalid`, so there is a
window where the field is red and not yet named. The alternative — waiting for the submit — is worse
for the same reason the browser's own validators exist: the moment someone leaves a field is when they
can still do something about it.

### Two traps, both silent

- **Always name the control's border colour.** A bare `border` utility falls back to
  `currentColor`, so a field silently grows a hairline in the text colour — white in the
  dark theme, black in the light. The sheet's `.ds-input` declares
  `border: 1px solid transparent` for the same reason; this system uses
  `border-input` instead.
- **The error state is `--destructive`, not the sheet's yellow.** The sheet had two
  accents and used yellow for warnings; here `--warning` _is_ the `secondary`
  button, so an error and a secondary action would have been the same colour.

The required marker is drawn by `TextField.Label`'s `::after` from the field's own
`data-required`, so the `*` cannot drift out of sync with `isRequired`. React Aria
puts the native `required` on the input rather than `aria-required`.

### Read-only does not dim its value

`isDisabled` dims a field to 40%, and it is tempting to give read-only the same treatment.
Don't: read-only is the one state where the value is the whole point, and at 40% the text
measures **3.42:1** — under the 4.5:1 body text needs — so the thing the user came to read
becomes the thing they cannot. The a11y check catches this; it is easy to ship otherwise,
because a dimmed field _looks_ deliberate.

Read-only keeps full-strength text and signals itself through the hairline instead, which is
the affordance it actually loses: the border goes to `--border-soft` and no longer
brightens on hover, because nothing there invites a click.

This is the same cascade problem as `Checkbox`, and it takes the same shape: `data-readonly`
is on the **field root** while the border is on the input, and a `group-data-[readonly]:`
utility ties with the input's own and loses on source order. So the field publishes
`--field-border` and `--field-hover` and the input reads them. Focus and invalid stay literal
on the input, so they outrank the published values and still win — including on a read-only
field, which remains focusable and selectable.

**Control boundaries carry a resting hairline.** `--input` is
`--foreground` at 45% — the smallest alpha that clears the 3:1 a control boundary
needs on _both_ pages (4.43:1 on the dark, 3.36:1 on the light). A control's own fill
cannot do this job: `--muted` is 1.23:1 against the dark page and 1.17:1
against the light one. Alpha compositing is not symmetric, so 40% looks adequate and
is not — 3.66:1 on black, 2.85:1 on white.

The `ControlBoundary` story checks this by compositing and measuring in both themes,
not by comparing against the token value: a token can be changed to something that
looks right and is not.

**Still open:** the `outline` button's border is the accent at 40%, which measures
2.45:1 on the dark page and 1.76:1 on the light. It needs roughly 49% and 69%
respectively, so no single alpha fixes it and raising it would visibly thicken the
button. Left alone because it is the one boundary that is arguably decorative — a
button always carries a label at full accent strength, which identifies it, whereas an
empty input has only its own edge.
