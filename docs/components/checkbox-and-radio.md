# Checkbox and Radio

Two controls, one anatomy. Each is a control, and each carries the group it belongs to as
a slot — so the compound form covers the whole control, not just its decorations:

```tsx
<Radio.Group defaultValue="https">
  <Radio.Label>Protocol</Radio.Label>
  <Radio value="http">
    <Radio.Indicator />
    <Radio.Text>HTTP</Radio.Text>
  </Radio>
  <Radio.Hint>Applies to every check.</Radio.Hint>
  <Radio.Error>Choose a protocol.</Radio.Error>
</Radio.Group>
```

`Checkbox` mirrors it exactly, with `Checkbox.Group`, `.Indicator`, `.Text`, `.Label`,
`.Hint` and `.FieldError`. The slots are explicit, like `Button.Icon` and `Button.Text`; a
bare text child still renders, it just misses the label styling, so a missing slot degrades
rather than disappears.

| Slot                 | React Aria                     | Notes                                                         |
| -------------------- | ------------------------------ | ------------------------------------------------------------- |
| `Radio` / `Checkbox` | `Radio` / `Checkbox`           | The control. Owns the selection when outside a group          |
| `.Group`             | `RadioGroup` / `CheckboxGroup` | Owns it when inside one; `value` identifies the control to it |
| `.Indicator`         | —                              | The dot or the box, drawn for you                             |
| `.Text`              | —                              | One control's label                                           |
| `.Label`             | `Label`                        | The group's legend — the same `.ds-field-legend` as a field   |
| `.Hint`              | `Text`                         | `slot="description"`, so it is described-by                   |
| `.FieldError`        | `FieldError`                   | Renders nothing while the group is valid                      |

`isRequired` and `isInvalid` live on the **group**, not the control: a `Radio` outside one
has no group state to read. React Aria splits validity two ways — the group gets
`data-invalid` as a styling hook, while `aria-invalid` goes on each control, because the
group is not a focusable thing a screen reader could land on.

### State travels as custom properties, not group variants

The control root is where React Aria puts `data-selected`, `data-hovered` and the rest, so a
rule reaching the indicator has to go through a group variant — and **group variants sort at
the same specificity as a plain utility**, because Tailwind wraps the ancestor in `:where()`.
`group-data-[hovered]:border-fg` therefore ties with the indicator's own
`border-line-control` and loses on source order, silently.

Instead the root publishes `--selection-border`, `--selection-bg`, `--selection-mark`,
`--selection-scale` and `--selection-ring`, and the indicator only reads them. Both rules
then land on the same element, where `[data-selected][data-hovered]` plainly outranks
`[data-hovered]` and the ordinary cascade decides. `Checkbox` and `Radio` publish the same
names deliberately, so neither has to know which it is.

The ring is a transparent outline at rest rather than `outline-none`, so it fades in with
everything else instead of switching the outline on and off.

### Indeterminate is a third state, drawn as a dash

`isIndeterminate` fills the box exactly as a checked one does and shows a **dash** instead of a
tick — the difference between "all of it" and "some of it". React Aria renders `data-indeterminate`
for it, and the tick and the dash sit in the box's single grid cell, so swapping one for the other
cannot change the box's size.

The tick's rule has to **exclude** the indeterminate one. An indeterminate checkbox is usually a
selected one too, so `data-[selected]:[--selection-mark:1]` and `data-[indeterminate]:[…]` would tie
on specificity and source order would decide whether a "some" checkbox showed a tick. Written as
`data-[selected]:not-data-[indeterminate]:` only one of them ever matches.

### The state is a property, not an attribute

A native checkbox reports "mixed" through the **`indeterminate` DOM property**, and nothing writes
it into the markup — so `aria-checked` is absent from it, and `toHaveAttribute('aria-checked',
'mixed')` fails with `null`. Assert `input.indeterminate` and `input.checked`. The browser is what
tells assistive tech it is mixed.

### Three things that make these tests lie

- **The indicator transitions, the input does not.** Reading a colour or an opacity straight
  after a state change returns the old value mid-transition. Freeze `[data-slot=indicator]` or
  `[data-slot=centre]`, not the input.
- **Tailwind v4's `scale-*` sets the standalone `scale` property, not `transform`**, so
  `getComputedStyle(el).transform` stays `'none'` however scaled.
- **`rounded-full` is `border-radius: calc(infinity * 1px)`**, which Chrome computes to
  `3.35544e+07px`. "Is it a circle" has to be asked as "is the radius at least half the box",
  not compared against `'50%'`.
