# Nav

React Aria's `NavigationTree` — a nested, hierarchical set of links — which is what a sidebar
actually is. **The sheet has no sidebar**: its two navs, `dash-nav` and `page-nav`, are both
horizontal top bars. So the _arrangement_ is an invention, and every visible part is the sheet's own
vocabulary turned on its side.

```tsx
<Nav aria-label="Primary" selectedRoute="/monitors/fra1">
  <Nav.Item href="/" textValue="Overview" icon={<IconGrid />}>
    <Nav.Label>Overview</Nav.Label>
  </Nav.Item>
  <Nav.Item href="/monitors" textValue="Monitors" icon={<IconActivity />}>
    <Nav.Label>
      Monitors <Nav.Count>12</Nav.Count>
    </Nav.Label>
    <Nav.Item href="/monitors/fra1" textValue="fra1">
      <Nav.Label>fra1 · Frankfurt</Nav.Label>
    </Nav.Item>
  </Nav.Item>
  <Nav.Section>
    <Nav.Header>Account</Nav.Header>
    <Nav.Item href="/settings" textValue="Settings" icon={<IconSettings />}>
      <Nav.Label>Settings</Nav.Label>
    </Nav.Item>
  </Nav.Section>
</Nav>
```

| Slot          | React Aria                  | Notes                                                                               |
| ------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `Nav`         | `NavigationTree`            | The surface. `selectedRoute` is where you are; `isCollapsed` is the rail            |
| `Nav.Item`    | `NavigationTreeItem`        | One destination, or a parent of more. Nests. `icon` is the glyph its row leads with |
| `Nav.Label`   | `NavigationTreeItemContent` | What the item says. It draws the row: icon column, link, trailing disclosure        |
| `Nav.Section` | `NavigationTreeSection`     | A group, divided from the one above it                                              |
| `Nav.Header`  | `NavigationTreeHeader`      | The group's legend                                                                  |
| `Nav.Count`   | —                           | The sheet's `.ds-count` at the trailing edge — a dot in the rail, see below         |

## A row is three columns, and its two ends are reserved

**Icon, link, disclosure.** The icon leads because a sidebar that carries glyphs has one column of
them, and it is the leftmost thing the eye lands on. The disclosure trails because that is the far
end of the row, where a count also lands, and because the leading column is already spoken for.

Both ends are booked even when the row has nothing for them, and that is one argument stated twice:

- **The box at the leading edge** (`NAV_ICON`) is drawn on every row whether or not it has a glyph.
  A row with an icon cannot start its label 24px to the right of a row without one, or the column of
  labels steps in and out as the eye reads down it. Measured in `Icons`: with a glyph and without,
  the label starts 42px from the row's own edge — 18px of padding, the 16px box, the 8px gap.
- **The box at the trailing edge** (`NAV_END_GUTTER`) exists for the count. `Nav.Count` is
  `ms-auto`: it lands on the link's trailing edge, and that is where the column of numbers comes
  from. A row whose disclosure is 16px of the row would end its link 24px sooner than a leaf, so the
  numbers would step in and out down the side — which is the one thing the column is for. `Counts`
  measures two counts on a parent and a leaf and finds one right edge.

The glyph itself is `aria-hidden` and is a prop on the item, not a `Nav.Icon` slot inside the label:
the label owns the row's edges, and a slot would let the glyph land in the middle of the link, or
twice, with only the layout knowing.

The icon takes the row's own colour — white at rest, the accent when it is where you are — because
it is part of the item rather than a decoration beside it. **This system ships no icon set**; a page
draws the ones it uses, which is what `Nav.stories.tsx` and `src/examples/dashboardIcons.tsx` do.

## A branch is followed down the page

A row below the first level draws a 1px hairline at **its parent's icon column** — 25px, just inside
the box a level-1 icon sits in. Indentation alone is a measurement the eye has to take against the
panel edge; the line is one it can follow.

It is drawn per row rather than per group because React Aria renders the rows of a tree flat: a
nested item is a sibling row, not a child of a container, so a row is the only element with a height
to hang it from. `Nesting` measures the line's width on a child row and `content: none` on a
top-level one.

## A group has an edge

`Nav.Section` carries a hairline across its top. This is the group's own edge rather than a
decorative rule: a sidebar is a stack of groups — the page's own destinations, then the collections
under them — and without it the last row of one group and the first row of the next sit exactly as
close as two rows inside either.

The legend `Nav.Header` adds above it names the group. A group named by an **item** instead — a
`Nav.Section` wrapped around an expandable parent such as `Tasks`, which is what the reference
draws — gets the line and needs no legend.

## The rail: `isCollapsed`

The same tree at 64px, where an item is its icon. What does _not_ change is the tree: every item is
still a link, every branch still opens, and `selectedRoute` still says where you are. Three things
do, and each of them is why the rail is more than `w-16`:

- **A label is folded, not deleted.** The text stays in the markup in a zero-width clipped box
  (`NAV_TEXT`) — out of sight, still in the accessibility tree — which is what keeps the link named
  and the item typeable. Delete the text and the rail is a column of unnamed links.
- **A count becomes the dot on the icon's shoulder.** A number cannot be read at 6px, but its
  presence can, and the number itself is still inside the dot, clipped. It is not the accent, for the
  reason the wide panel's count is not the selected-yellow: the accent means _where you are_, and
  this dot would be on a different row.
- **The label becomes the tooltip, and that decides the element.** The rail is the one place in this
  system where a tooltip is the only way to know what a control is, so it opens at once
  (`delay={0}`) and it hangs on **React Aria's `Link`**, not on the plain anchor the wide panel
  draws. `TooltipTrigger` hands its trigger its props through the Focusable context rather than by
  cloning, so a bare `<a>` never receives them and the tip would never open — silently, with no
  error and no difference you could see in the source. Both render the same `<a href>`.

The row is 44px of the 64px column (`mx-2.5`), so the wash the pointer paints around a hovered or
current row is **the square the icon sits in** rather than a bar across the panel — and 44px is the
target size a finger needs. `Rail` measures all of it, and `Nav.browser.test.tsx` operates it.

### The disclosure goes quiet, not away

React Aria refuses an expandable item with no expand button — _"Expandable tree items must contain a
expand button so screen reader users can expand/collapse the item"_ — and it is right to: a rail
whose branches cannot be opened is a rail that lies. So the button is there, named, operable, and
painted at the row's trailing corner **when the row is pointed at or has the focus inside it**.

**It is not a Tab stop, and that is not the rail's doing.** React Aria gives the chevron
`tabindex="-1"` and `data-react-aria-prevent-focus` in the wide panel too — measured in the browser,
not read off the source — so a keyboard opens a branch the tree's way: **ArrowRight on the link
inside the row**, and ArrowLeft to close it again. The first version of the rail's reveal was written
on the button's own `:focus-visible`, which was dead code: a control that cannot take focus cannot
be revealed by taking it. It follows the row instead.

### `isCollapsed` is a prop, not internal state

A rail needs a way back, and the control that flips it belongs beside the sidebar where the consumer
can put it with the rest of the page's furniture. `Nav` takes the boolean and renders accordingly;
`Nav.browser.test.tsx` drives it from a plain button the way a consumer would and checks there is a
way out of the rail as well as into it.

## It is a treegrid, not a nav landmark

`NavigationTree` builds on React Aria's `Tree`, so it renders `role="treegrid"` with `role="row"`
items — the same shape as its `Table`. Query it that way: the items are **rows**, and their styling
lives on the row.

## The rows are virtual, so the anchors are the tab stops

The grid is `tabindex="-1"` and its rows carry no tabindex at all. A first version put
`tabIndex={-1}` on the anchors to avoid "two tab stops per item", which made **nothing** in the tree
reachable — the whole sidebar fell out of the keyboard. Every link is `tabindex="0"` (measured),
they are the only things here a keyboard can reach, and they must stay that way.

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

## `selectedRoute` is the whole of "where am I"

There is no `isCurrent` per item to keep in sync with a router. One string is matched against every
`href`, and the tree marks the item that matches **and its ancestors** — `data-current-ancestor` —
which is the thing a top bar never needed and a tree cannot do without: it is what lets the tree show
you where you are inside a branch you have not opened.

The current item takes the accent, as the sheet's own `[aria-current="page"]` rule does. **Its row is
washed as well, at the value a hover uses** (`bg-foreground/5`). On a row that now leads with an icon,
the accent is one glyph and one word at the far end of a line; the wash is what says "this row" at a
glance, and the accent then says _where_. It shares the hover's value deliberately — a current row
that darkened as the pointer crossed it would be a third state saying nothing the other two do not.

An **ancestor** comes up to full strength and goes no further — two accented labels would stop saying
which one you are on.

**Its chevron takes the accent, though, and that is what makes a collapsed branch legible.** Full
strength alone says nothing when every other row is 70% white: with your page inside a closed branch,
the sidebar showed no cue at all. The cue goes on the one glyph that means "there is more in here",
so the accent never reaches a second _label_ and "where you are" is still said exactly once.

## The text is passed separately, because the label is markup

`textValue` is required, and that is the honest signature: an item's label here often carries a count
badge, and keyboard type-ahead needs the string someone would actually type. Deriving it from the
rendered label would pick up the number. In the rail it is also the one thing about an item that
survives: it is the tooltip.

## The tests that were worth writing, and one that was not

`Nesting` measures `padding-inline-start` on the **row** (18px at level 1, 30px at level 2) rather
than the row's left edge: the indent is padding, padding is inside the row, so the row's edges never
move however deep it is. Measuring the left edge passed at depth one and failed at depth two.

`Icons` measures the label's offset from the row's own edge and asserts **42**. It used to compare
the two rows' left edges with each other, which passed while asserting nothing: the slot was
`display: contents` then, a contents element generates no box, and both measurements were zero. The
slot is a real flex column now, and the assertion is a number that cannot be two zeros.

The Tab-order assertion was **deleted**. Driving Tab from the runner did not land on the links, and a
test that quietly asserts something else is worse than no test. `Keyboard` now says so in its own
comment and asserts only what is true: every item is a link with an `href`, and every one can take
focus.

**The rail's hover tooltip is not asserted anywhere, and that is a record rather than an oversight.**
React Aria opens a tooltip on hover through a _timer_, which the runner's polling never advances —
the same trap `Tooltip.stories.tsx` records, where a Hover story was written and failed. Focus opens
it synchronously, so that is the path `Nav.browser.test.tsx` proves: the link is focused, the tip
appears, and it describes the link rather than naming it.

## The column of edges, and the count that stopped shouting

**Every row reserves the disclosure's box, whether or not it has a disclosure** — now at the trailing
edge, where the counts are (see above). The leading box, which this replaced, was the chevron's and
had the same argument.

**A section header has room above it and almost none below** (`pt-5`, from `pt-3`). At `pt-3` the
legend sat as close to the row above as one row sits to the next, so `ACCOUNT` read as one more item.
A group's name belongs to the items under it.

**The count is quiet here** (`text-foreground/45`, from the sheet's selected-yellow). In the sheet the
`.ds-count` sits in a horizontal top bar beside the one chosen thing; in a vertical sidebar every
counted row would carry the yellow, and two of them became the loudest thing on a surface whose
labels are 70% white. Yellow means _selection_ everywhere else in this system, so spending it on a
number that is merely true costs it that meaning. The trailing column stays — alignment is what makes
a count scannable, not the colour — and `tabular-nums` keeps the digits from jittering.

**A row answers a hover with a fill** (`data-[hovered]:bg-foreground/5`), not only with a brighter
label: a sidebar is a column of targets, and the wash is what makes the row under the pointer read as
one. It is the value `Accordion`'s header rows already use.

**Every root carries a `data-slot`** — `nav`, `section`, and inside a row `icon`, `text` and
`count` — and they were checked in the DOM rather than in the source, because a slot on an element
that renders no DOM lands nowhere.

## What this component deliberately does not own

**The brand row and the workspace switcher that open the reference's sidebar are not `Nav`.** A
treegrid is a list of destinations; a switcher is a control that changes what the list _is_, and it
belongs beside the tree rather than inside it — the same reason `Nav` has no toggle for its own rail.
Both are composition around this component, from `Button`, `Popover`, `ListBox` or `Menu` and
`Avatar`, and neither is built here.
