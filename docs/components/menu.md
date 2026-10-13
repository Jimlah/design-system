# Menu

A menu of actions or choices, opened from a control. The surface is the sheet's `.ds-select-menu`,
now shared with the select through `popover.ts` — the same split as `field.ts`, and the first time
two families here have genuinely converged on one surface.

```tsx
<Menu>
  <Button>Actions</Button>
  <Menu.Popover menuProps={{ onAction: (key) => run(key) }}>
    <Menu.Item id="restart">Restart</Menu.Item>
    <Menu.Separator />
    <Menu.Section>
      <Menu.SectionTitle>Danger</Menu.SectionTitle>
      <Menu.Item id="delete">Delete</Menu.Item>
    </Menu.Section>
  </Menu.Popover>
</Menu>
```

| Slot                | React Aria       | Notes                                              |
| ------------------- | ---------------- | -------------------------------------------------- |
| `Menu`              | `MenuTrigger`    | The trigger, then a `Menu.Popover`                 |
| `Menu.Popover`      | `Popover`+`Menu` | The surface and the list. `menuProps` for the list |
| `Menu.Item`         | `MenuItem`       | One row. A `SubmenuTrigger` inside it opens again  |
| `Menu.Section`      | `MenuSection`    | A group                                            |
| `Menu.SectionTitle` | `Header`         | Its heading, in `.ds-select-group-label`           |
| `Menu.Separator`    | `Separator`      | The sheet's `.ds-div-hair`                         |

### A menu performs; a select keeps

`onAction` is the prop that says which this is. Set it and the rows are commands and the menu closes
when one is chosen; leave it off with a `selectionMode` and they are choices that mark themselves
`aria-checked`.

**A menu closes on select whatever the mode** — that is what a menu _is_ — so a row that sets a value
rather than running an action has to say `shouldCloseOnSelect: false`, or the list vanishes the
moment it has been used once. The `Selection` story failed on exactly that before it was written
down.

### `Menu.Popover` carries the list's props

`selectionMode`, `disabledKeys` and `onAction` are the _menu's_ rather than the surface's, and
writing them would otherwise mean two slots for one decision — so the popover takes them as
`menuProps`. `Menu.Popover` draws the popover and the list together, as `Select.Menu` does, because a
surface with no list in it and a list with nowhere to open are never useful apart.

### The menu is at least as wide as the button that opened it

`popover.ts`'s `POPOVER` sizes the panel from the trigger and lets it grow: a trigger is sized for its
own label ("Actions"), and a menu sized to exactly that cuts off the one item longer than the control —
usually the item the menu was opened to find. `min-w-(--trigger-width)`, capped at the window minus the
1rem gutter the modal keeps, so nothing can run off the page. This was also where a whole-library bug
came to light: the reset that set `min-width: 0` on `*` was unlayered, and an unlayered rule beats every
Tailwind utility, so `min-w-*` had never applied anywhere. See
[theming.md](../theming.md#cascade-layers-and-the-one-reset-that-had-to-move).

### The shadow is the second deliberate literal

`popover.ts` carries `rgba(0,0,0,.7)` for the same reason the modal's scrim does: a shadow has to
darken in **both** themes, and every token that would do it inverts. It is the one literal in that
file, and it says so.

### Focus is real, and type-ahead is not asserted

React Aria's menu puts **real** focus on a row — unlike its tree, which uses `aria-activedescendant`,
so a story here asks `toHaveAttribute('role', 'menuitem')` rather than reading it off the menu.

Type-ahead (`d` reaching Delete) is deliberately **not** asserted. It uses the same kind of pending
timer the tooltip's hover does, and a query that cannot see it fails as if the feature were missing.
That is the third time this session that a story has been left out rather than written to assert
something else.

## `Menu.LoadMore` — the row that asks for the next page

```tsx
<Menu.Popover>
  <Menu.Item id="a">Restart</Menu.Item>
  <Menu.LoadMore isLoading={isLoading} onLoadMore={loadMore} />
</Menu.Popover>
```

A menu that runs long — every region, hundreds of actions — has no scrollbar a reader can consult for how
much is left. This is where the rest arrives. It is the same sentinel as `GridList.LoadMore`, on the same
shared recipe, and it needs a virtualized collection for the same reason (`gridlist.md` carries the
mechanism and the scroll proof).

**While it is loading it is a `menuitem`**, announced with the actions above it, because React Aria puts it
in the menu's own collection. The story asserted the opposite first — that a row asking for the next page
would take no part in the menu — and its own failure corrected it. When it is _not_ loading, React Aria
renders nothing at all for it.
