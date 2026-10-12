# Select

The sheet's `.ds-select`, `.ds-select-btn` and `.ds-select-menu`. Opens a list over the page
rather than pushing it down, and keeps the chosen value in the trigger where a form can read
it back.

> **There is no `Select.Search`, and four places in the component said there was.** The search strip
> belongs to `Select.AutoComplete`, which draws it itself — a filter scope with no box in it would have
> nothing to filter with. The component's doc comments named `Select.Search` four times and its story's
> curated snippet wrote `<Select.Search />`, which is the example a consumer copies. Nothing checked:
> a snippet is text and a JSDoc is a comment, so the first page that actually rendered one threw on the
> spot. Found while wiring a `Select` into `/create` — reading a doc and rendering it are two different
> tests, and only one of them was being run.

```tsx
<Select defaultSelectedKey="https" placeholder="Choose a protocol">
  <Select.Label>Protocol</Select.Label>
  <Select.Button>
    <Select.Value />
    <Select.Icon />
  </Select.Button>
  <Select.Popover>
    <Select.AutoComplete>
      <Select.OptionList>
        <Select.Option id="http">HTTP</Select.Option>
        <Select.Option id="https">HTTPS</Select.Option>
      </Select.OptionList>
    </Select.AutoComplete>
  </Select.Popover>
  <Select.Hint>Applies to every check.</Select.Hint>
  <Select.Error>Choose a protocol.</Select.Error>
</Select>
```

| Slot                  | React Aria          | Notes                                                            |
| --------------------- | ------------------- | ---------------------------------------------------------------- |
| `Select`              | `Select`            | Owns the value. `size` is `sm \| md \| lg`, and `placeholder`    |
| `Select.Label`        | `Label`             | The sheet's `.ds-field-legend`                                   |
| `Select.Button`       | `Button`            | The trigger. Places the value and icon for you when bare         |
| `Select.Value`        | `SelectValue`       | The chosen option, or the placeholder. `flex-1`, so it truncates |
| `Select.Icon`         | —                   | The caret; `isLoading` swaps it for the spinner                  |
| `Select.Popover`      | `Popover`           | The menu surface                                                 |
| `Select.AutoComplete` | `Autocomplete`      | The filter scope. Draws the search box, renders no wrapper       |
| `Select.OptionList`   | `ListBox`           | The options                                                      |
| `Select.Option`       | `ListBoxItem`       | One choice, marked `[SET]` when chosen                           |
| `Select.Section`      | `ListBoxSection`    | A run of options, announced as a group                           |
| `Select.SectionTitle` | `Header`            | Its heading, in `.ds-select-group-label`                         |
| `Select.Menu`         | `Popover`+`ListBox` | Both together, for when there is nothing to search               |
| `Select.Hint`         | `Text`              | `slot="description"`                                             |
| `Select.Error`        | `FieldError`        | Renders nothing while the select is valid                        |

A select and an input line up in a column at every size, because both take their height from
the shared `--field-control-h`. The `Sizes` story asserts that rather than trusting it.

### Multiple selection, and how the value shows it

React Aria's `Select` does support multiple, but the mode is a **type parameter** defaulting to
`'single'`, so a plain `selectionMode="multiple"` is rejected by the compiler.
`SelectProps` here carries that parameter through, which makes the mode inferable from the prop
— and types `onChange` as an array of keys rather than one.

The value then comes from `ValueBase`, not from `selectedKey`: **`defaultValue` and `value` take
an array in multiple mode**, while `selectedKey`/`defaultSelectedKey` stay singular whatever the
mode. Both pairs are published on `SelectProps` for that reason.

`Select.Value` draws more than one selection as the first name plus a count — `HTTP +2` — and
falls through to React Aria untouched for the placeholder and the single case. Listing every
name is what a native multi-select does, and it fails the moment the list outgrows the trigger:
the value truncates and the ellipsis eats the one thing the trigger is for, how many are chosen.
The count is `shrink-0`, so it can never be the part that gets cut, and it drops away at one
selection rather than reading `+0`.

The count comes from `SelectStateContext` rather than from the value's render props, because a
function child has to be handed to React Aria up front, while the render props only say how many
are selected _after_ it has decided to call one. Reading the state lets the other two cases stay
React Aria's.

### A working default filter, and why it has to be explicit

React Aria's autocomplete scope has a default filter, and **it is not applied to a Select's
collection**. A scope with a search box and a list inside it, wired every way the types allow,
filters nothing — the input holds the query and the list shows every option. Only an
explicitly passed `filter` turns it on.

So `Select.AutoComplete` supplies one, rather than leaving a trap that looks like a styling
bug: `startsWith`, exported alongside `Select` for anyone who wants it directly. React Aria's
own default is a substring match, and the choice is visible on a list of monitors — `s`
surfacing every region with an `s` in it is worse than narrowing from the front. The `Search`
story pins the difference: `virginia` contains `iad1 · Virginia` but does not begin with it,
so the option drops out.

The scope also draws the search box itself — there is no separate search slot, because a scope
with nothing to type into would have no purpose. `Select.Menu` is the path for a list that
needs no searching at all.

The autocomplete's `inputValue`, `defaultInputValue`, `onInputChange`, `filter`,
`disableAutoFocusFirst` and `disableVirtualFocus` are re-declared on `Select.AutoComplete`
rather than inherited: docgen drops props declared under `node_modules`, so inheriting them
would leave the documented surface empty.

### The state that cannot be applied to the trigger

`Select` puts `data-invalid`, `data-required` and `data-open` on its **root**, while the border
they change is on the trigger — so, as with `Checkbox`, the field publishes `--field-border`
and `--field-hover` and the trigger reads them. The trigger's own hover rule is a specificity
step above its resting border, which is why an open trigger additionally retargets
`--field-hover`: otherwise hovering an open menu takes the hover colour and loses the teal.

**A select does not mark itself invalid with `aria-invalid`, and that is correct.** Its trigger
is a `<button>` with `aria-haspopup="listbox"`, and WAI-ARIA does not support `aria-invalid` on
`role="button"` — it applies to textboxes, comboboxes, switches and the like. React Aria is
right to withhold it where it sets it on a `Checkbox`. The failure still reaches assistive
tech, because `Select.Error` is wired to the trigger as its `aria-describedby`. Do not
add it back; that would be invalid markup, not a fix.

### The icon is a fixed box, not an overlay

The sheet positions its caret absolutely. Here it is a 12x12 flex child with the value on
`flex-1`, so the caret and the spinner are the same width and swapping one for the other
cannot shift the text beside them — and so neither has to know where it sits. The rotation
stays the standalone `rotate` property, driven by a variable on the root, where `data-open`
lives.
