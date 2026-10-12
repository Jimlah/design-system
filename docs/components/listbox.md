# ListBox

A list of options where the choice is a value, not a set of rows.

```tsx
<ListBox
  aria-label="Region"
  selectionMode="single"
  defaultSelectedKeys={['fra']}
>
  <ListBox.Item id="fra">Frankfurt</ListBox.Item>
  <ListBox.Item id="iad">Ashburn</ListBox.Item>
</ListBox>
```

| Slot               | React Aria            | Notes                                           |
| ------------------ | --------------------- | ----------------------------------------------- |
| `ListBox`          | `ListBox`             | `selectionMode`, `selectedKeys`, `disabledKeys` |
| `ListBox.Item`     | `ListBoxItem`         | One option. `id` is the key                     |
| `ListBox.Section`  | `ListBoxSection`      | A group of options                              |
| `ListBox.Header`   | `Header`              | A section's heading, and its accessible name    |
| `ListBox.LoadMore` | `ListBoxLoadMoreItem` | The next-page sentinel                          |

## This is not `GridList`

A grid list is a set of **rows** — a dashboard's monitors, a run of results — where each row is a thing
you look at and act on. A list box is a set of **options**, where the list's whole purpose is to produce
one value. They look similar and answer different questions, which is why both exist and why an option
and a row are styled differently: an option takes the accent as **text** when chosen, a row takes it as a
border.

It is also distinct from `Select`, `ComboBox` and `Menu`, which you must open. This one stands on the page
with its own border, and it is what those three build their panels out of.

## It found a bug in four components at once

`ListBox` reuses `OPTION` and `OPTION_LIST` from `optionList.ts`, extracted from `ComboBox` rather than
copied — and its own test, asserting the opacity of a disabled option, got **1**.

`disabledKeys` was dimming nothing: the shared recipe had no `data-[disabled]` rule, so an option that
cannot be chosen looked exactly like one that can — **in this list, in the select, in the combo box and in
the menu**, all four of which share that class list. One line fixed all four.

That is the argument for sharing a recipe rather than copying one, made the other way round: a single
component's test becomes a test of every component that wears it.
