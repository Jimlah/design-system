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

| Slot          | React Aria                  | Notes                                                                              |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `Nav`         | `NavigationTree`            | The surface. `selectedRoute` is where you are                                      |
| `Nav.Item`    | `NavigationTreeItem`        | One destination, or a parent of more. Nests                                        |
| `Nav.Label`   | `NavigationTreeItemContent` | What the item says, plus the disclosure                                            |
| `Nav.Section` | `NavigationTreeSection`     | A group                                                                            |
| `Nav.Header`  | `NavigationTreeHeader`      | The group's legend                                                                 |
| `Nav.Count`   | —                           | The sheet's `.ds-count`, pushed to the trailing edge — and quieter here, see below |

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

**The ancestor's chevron takes the accent, though, and that is what makes a collapsed branch legible.**
Full strength alone says nothing when every other row is 70% white: with your page inside a closed
branch, the sidebar showed no cue at all. The cue goes on the one glyph that means "there is more in
here", so the accent never reaches a second _label_ and "where you are" is still said exactly once.

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

### The column of edges, and the count that stopped shouting

Four changes came out of looking at the sidebar as a whole rather than at one row of it.

**Every row reserves the chevron's box, whether or not it has a chevron** (`NAV_GUTTER`, and the same
box in `Tree.Label`). Measured before: a row with a disclosure started its label 24px to the right of
one without — 18px against 42px at level 1 — so the labels stepped in and out down the column and the
indentation said nothing true about the hierarchy. Every label now shares a left edge per level, and
the cost is 24px of a 224px sidebar on a row that needed none.

**A section header has room above it and almost none below** (`pt-5`, from `pt-3`). At `pt-3` the legend
sat as close to the row above as one row sits to the next, so `ACCOUNT` read as one more item. A
group's name belongs to the items under it.

**The count is quiet here** (`text-foreground/45`, from the sheet's selected-yellow). In the sheet the
`.ds-count` sits in a horizontal top bar beside the one chosen thing; in a vertical sidebar every
counted row would carry the yellow, and two of them became the loudest thing on a surface whose labels
are 70% white. Yellow means _selection_ everywhere else in this system, so spending it on a number
that is merely true costs it that meaning. The trailing column stays — alignment is what makes a count
scannable, not the colour — and `tabular-nums` keeps the digits from jittering. A count that genuinely
wants attention is a `tone` on `Nav.Count`, the day someone asks for one.

**A row answers a hover with a fill** (`data-[hovered]:bg-foreground/5`), not only with a brighter
label: a sidebar is a column of targets, and the wash is what makes the row under the pointer read as
one. It is the value `Accordion`'s header rows already use.

`Nav` also carries `data-slot="nav"` now — it was the one root in the library without one.
