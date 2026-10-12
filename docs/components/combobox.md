# ComboBox

The sheet has no combobox class of its own — it is the search affix and the select menu put
together, which is what a combobox is: a text field that filters a list as you type, where the
list _is_ the value rather than a hint about it.

```tsx
<ComboBox defaultSelectedKey="iad">
  <ComboBox.Label>Monitor</ComboBox.Label>
  <ComboBox.Group>
    <ComboBox.Icon />
    <ComboBox.Input placeholder="Search monitors…" />
    <ComboBox.Button />
  </ComboBox.Group>
  <ComboBox.Popover>
    <ComboBox.OptionList>
      <ComboBox.Option id="fra">fra1 · Frankfurt</ComboBox.Option>
      <ComboBox.Option id="iad">iad1 · Virginia</ComboBox.Option>
    </ComboBox.OptionList>
  </ComboBox.Popover>
  <ComboBox.Hint>One monitor per check.</ComboBox.Hint>
  <ComboBox.Error>Pick a monitor.</ComboBox.Error>
</ComboBox>
```

| Slot                    | React Aria       | Notes                                                   |
| ----------------------- | ---------------- | ------------------------------------------------------- |
| `ComboBox`              | `ComboBox`       | Owns the value. `size` is `sm \| md \| lg`              |
| `ComboBox.Label`        | `Label`          | The sheet's `.ds-field-legend`                          |
| `ComboBox.Group`        | `Group`          | Leaves room for the affixes                             |
| `ComboBox.Input`        | `Input`          | The control itself, with the field's hairline and focus |
| `ComboBox.Icon`         | —                | An affix at either end; draws the magnifier by default  |
| `ComboBox.Button`       | `Button`         | The chevron. `isLoading` swaps it for the spinner       |
| `ComboBox.Popover`      | `Popover`        | The menu surface                                        |
| `ComboBox.OptionList`   | `ListBox`        | The options; takes `renderEmptyState`                   |
| `ComboBox.Option`       | `ListBoxItem`    | One choice, marked `[SET]` when chosen                  |
| `ComboBox.Section`      | `ListBoxSection` | A run of options, announced as a group                  |
| `ComboBox.SectionTitle` | `Header`         | Its heading, in `.ds-select-group-label`                |
| `ComboBox.Hint`         | `Text`           | `slot="description"`                                    |
| `ComboBox.Error`        | `FieldError`     | Renders nothing while valid                             |

The input is the control, so unlike `Select` there is no separate trigger: the chevron is a
button beside it, and `ComboBox.Icon` is an affix the `Group` makes room for through the same
`has-[[data-slot=…]]` rules a `TextField` uses. The height comes from the shared
`--field-control-h`, so a combobox and a field line up — the `Sizes` story asserts it.

### The built-in filter is not applied either

React Aria documents a filter on its combobox, and on a combobox's own collection it does not
run — the query sits in the input and the list shows every option. **This is the same trap as
`Select`**, found the same way, and it means the rule is about React Aria's collections rather
than about either component: a filter has to be passed explicitly for a filtered collection to
narrow at all.

So `ComboBox` supplies `startsWith` as its default, and `defaultFilter` is there to change
_how_ it narrows rather than to switch it on.

### One prop, two answers, both right

`isInvalid` puts `aria-invalid` on a combobox's input and withholds it from a select's trigger.
That is not an inconsistency: the input's role is `combobox`, which supports the attribute,
while a select's trigger is a `button`, which does not. The `Error` story asserts both.

Worth knowing when writing the empty state: React Aria gives the `renderEmptyState` output the
`option` role, so it is counted by `getAllByRole('option')`. The `Empty` story therefore asserts
that no _monitor_ is offered rather than that the option count is zero.
