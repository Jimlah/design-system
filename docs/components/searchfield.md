# SearchField

The sheet's `.ds-affix--search`. The same field anatomy as `TextField`, but on React
Aria's `SearchField`, so the control has the searchbox role, submits on Enter, and
reports whether it is empty.

```tsx
<SearchField
  value={query}
  onChange={setQuery}
  onSubmit={(term) => filter(term)}
>
  <SearchField.Label>Search monitors</SearchField.Label>
  <SearchField.Group>
    <SearchField.Icon />
    <SearchField.Input placeholder="Filter by name or URL…" />
  </SearchField.Group>
  <SearchField.Hint>
    {matches.length} of {total} monitors match
  </SearchField.Hint>
  <SearchField.Error>Enter at least two characters.</SearchField.Error>
</SearchField>
```

`SearchField.Icon` takes no children in the common case — it draws the magnifier traced
from the sheet's own SVG (same `viewBox`, radii and 1.5 stroke), and a child replaces it.
It carries no width or height, so it sizes in `cap` and tracks the field's `size` like
`Button.Icon`.

React Aria's `Input` does **not** read `SearchFieldContext`; `SearchField` supplies the
generic `InputContext`, `LabelContext`, `GroupContext`, `TextContext` and
`FieldErrorContext` instead. That is why the same slot components work in either field.

### The anatomy is shared, the slots are not

Every style constant for the legend + control + hint column lives in
`src/components/field.ts` — `FIELD`, `LABEL`, `GROUP`, `INPUT`, `HINT`, `ERROR`, `ICON`,
`FIELD_SIZES`. `TextField` and `SearchField` each define their own slot components over
those constants.

Sharing the _components_ instead would be less code, and wrong: Storybook derives the docs
import line from the subcomponent's value, so `SearchField.Label` would be documented as
`import { TextFieldLabel }`, and one component's JSDoc cannot describe two compound forms.
Thin wrappers are the price of docs that do not lie; the constants are the thing that must
not drift.
