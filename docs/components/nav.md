# Nav

React Aria's `NavigationTree` — a nested, hierarchical set of links — which is what a sidebar
actually is. **The sheet has no sidebar**: its two navs, `dash-nav` and `page-nav`, are both
horizontal top bars. So the _arrangement_ is an invention, and every visible part is the sheet's own
vocabulary turned on its side.

```tsx
<Nav aria-label="Primary" selectedRoute="/monitors/fra1">
  <Nav.Item href="/monitors" textValue="Monitors">
    <Nav.Label>
      Monitors <Nav.Count>12</Nav.Count>
    </Nav.Label>
    <Nav.Item href="/monitors/fra1" textValue="fra1">
      <Nav.Label>fra1 · Frankfurt</Nav.Label>
    </Nav.Item>
  </Nav.Item>
  <Nav.Section>
    <Nav.Header>Account</Nav.Header>
    <Nav.Item href="/settings" textValue="Settings">
      <Nav.Label>Settings</Nav.Label>
    </Nav.Item>
  </Nav.Section>
</Nav>
```

| Slot          | React Aria                  | Notes                                                |
| ------------- | --------------------------- | ---------------------------------------------------- |
| `Nav`         | `NavigationTree`            | The surface. `selectedRoute` is where you are        |
| `Nav.Item`    | `NavigationTreeItem`        | One destination, or a parent of more. Nests          |
| `Nav.Label`   | `NavigationTreeItemContent` | What the item says, plus the disclosure              |
| `Nav.Section` | `NavigationTreeSection`     | A group                                              |
| `Nav.Header`  | `NavigationTreeHeader`      | The group's legend                                   |
| `Nav.Count`   | —                           | The sheet's `.ds-count`, pushed to the trailing edge |

### It is a treegrid, not a nav landmark

`NavigationTree` builds on React Aria's `Tree`, so it renders `role="treegrid"` with `role="row"`
items — the same shape as its `Table`. Query it that way: the items are **rows**, and their styling
lives on the row.

### The rows are virtual, so the anchors are the tab stops

The grid is `tabindex="-1"` and its rows carry no tabindex at all. A first version put
`tabIndex={-1}` on the anchors to avoid "two tab stops per item", which made **nothing** in the tree
reachable — the whole sidebar fell out of the keyboard. The links are the only real focus targets
here and they must stay in the tab order.

For the same reason the tree is `aria-activedescendant`-driven, so a row is marked `data-focused`
rather than `data-focus-visible`, and the focus ring follows that.

**A ring on the row alone was not enough, and for a while there was none at all.** `NAV_ITEM` carried
`outline-none` in the same class list as its `data-[focused]:outline-1` ring, which sets Tailwind's
shared `--tw-outline-style` and makes the ring unwritable — the same mistake `Table` and `GridList`
had made, and the third one in the repo. The anchor, meanwhile, carried `focus:outline-none`, and the
anchor is the real Tab stop here, so a keyboard user tabbing the sidebar got nothing.

The row is right for the **arrow keys**: React Aria moves a _virtual_ focus with
`aria-activedescendant` and marks the row `data-focused`. Tab is a different route, and there the row
cannot carry it: RAC does not move `focusedKey` when DOM focus travels from one anchor to the next —
measured by tabbing twice and reading `data-focused`, which stayed on the first row. So the anchor
draws the ring itself on `focus-visible`, the row keeps its own for the arrow keys, and the row's ring
is switched off while an anchor inside it has the focus (`data-[focused]:has-[:focus-visible]`). One
ring, whichever way focus arrived.

### An expandable item must contain a real button

React Aria says so at runtime: _"Expandable tree items must contain a expand button so screen reader
users can expand/collapse the item."_ The first version drew a caret as an `after:` pseudo-element —
which cannot be pressed and cannot be named. It is now a `<Button slot="chevron">` in `Nav.Label`,
drawn only when `hasChildItems`, sitting _beside_ the anchor rather than inside it.

Its rotation comes from the render props, not from a rule reaching down from the row. That is the
arrangement this whole system avoids, and here React Aria hands the state over directly.

### `selectedRoute` is the whole of "where am I"

There is no `isCurrent` per item to keep in sync with a router. One string is matched against every
`href`, and the tree marks the item that matches **and its ancestors** — `data-current-ancestor` —
which is the thing a top bar never needed and a tree cannot do without: it is what lets the tree show
you where you are inside a branch you have not opened.

The current item takes the accent, as the sheet's own `[aria-current="page"]` rule does. An ancestor
comes up to full strength and goes no further — two items in the accent would stop saying which one
you are on.

### The text is passed separately, because the label is markup

`textValue` is required, and that is the honest signature: an item's label here often carries a count
badge, and keyboard type-ahead needs the string someone would actually type. Deriving it from the
rendered label would pick up the number.

### The tests that were worth writing, and one that was not

`Nesting` measures `padding-inline-start` on the **row** (18px at level 1, 30px at level 2) rather
than the row's left edge: the indent is padding, padding is inside the row, so the row's edges never
move however deep it is. Measuring the left edge passed at depth one and failed at depth two.

The Tab-order assertion was **deleted**. Driving Tab from the runner did not land on the links, and a
test that quietly asserts something else is worse than no test. `Keyboard` now says so in its own
comment and asserts only what is true: every item is a link with an `href`, and every one can take
focus.
