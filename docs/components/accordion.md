# Accordion

The sheet has no accordion in it — the second component here with nothing to copy, after the date
picker — so this follows its _language_ rather than its markup: square, mono, and the hairline
vocabulary of its dividers.

```tsx
<Accordion defaultExpandedKeys={['checks']}>
  <Accordion.Item id="checks">
    <Accordion.Header>Checks</Accordion.Header>
    <Accordion.Panel>Three checks are failing.</Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item id="history">
    <Accordion.Header>History</Accordion.Header>
    <Accordion.Panel>No incidents in the last 24 hours.</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

| Slot               | React Aria        | Notes                                                           |
| ------------------ | ----------------- | --------------------------------------------------------------- |
| `Accordion`        | `DisclosureGroup` | The set. Owns which items are open                              |
| `Accordion.Item`   | `Disclosure`      | One row. Its `id` is what `expandedKeys` speaks in              |
| `Accordion.Header` | `Button`          | The whole row, `slot="trigger"`; `indicator` replaces the caret |
| `Accordion.Panel`  | `DisclosurePanel` | The content, hidden while the row is closed                     |

### What it looks like, and why

Three things, all borrowed rather than invented — which is the point, since the sheet has no
accordion to copy:

- **The label is the sheet's row legend**: 12px, uppercase, `tracking-[0.06em]` — the same
  treatment the sheet gives a field legend and a table row. A sentence-case 13px heading reads as
  a different design system entirely, which is what the first version of this component looked
  like.
- **The open row is one panel block.** The sheet's `.ds-panel` surface goes on the whole item, not
  on the body alone, so the heading is part of the block instead of floating above a tinted
  paragraph. Closed rows are plain, separated by the sheet's `.ds-div-hair`.
- **The accent goes on the caret, and nowhere else.** An open row already says so twice without
  colour — the panel surface and the label going from 55% to full strength — so the caret is where
  a little teal does the most work. There was a 2px accent rule down the open row's leading edge
  for a while; it was removed. Three signals for one state was one too many, and a full-height
  rule beside every accordion is a lot of a system's single accent to spend on a disclosure.

All of it is published from the item as custom properties — `--accordion-ink`,
`--accordion-caret-ink`, `--accordion-row-bg`, `--accordion-caret-rotate` — and only _read_
further in: `data-expanded` is on the item, not on the header button, so a rule reaching the
caret through a group variant would tie on specificity and lose.

### The set decides, not the item

By default opening one closes the rest. That is the difference between an accordion and a stack
of independent disclosures — and writing a `Disclosure` per row and calling it an accordion is
how you get the second by accident. `allowsMultipleExpanded` asks for the other behaviour, on
purpose.

`expandedKeys` / `onExpandedChange` speak in the items' `id`s. Uncontrolled use takes
`defaultExpandedKeys`; controlling the set means passing `expandedKeys`, and the component will
not change it for you.

### The whole row is the button

Not the word inside it. A header sized to its label makes an accordion fiddly with a mouse, and
the `Default` story asserts the row is as wide as the set rather than as wide as "History".

### The caret reads a variable from the item

`data-expanded` is on the **item**, while the caret is inside the button inside it — so the
rotation is published as `--accordion-caret-rotate` on the item and read by the caret. Same
arrangement as `Select`, `ComboBox` and the date pickers, same reason: a rule reaching a child
through a group variant ties on specificity and loses on source order.

### A closed panel is hidden, but it still has a box

React Aria leaves it mounted, hidden with `hidden="until-found"` — out of sight and out of the
accessibility tree, but still in the document, which is what lets the browser's find-in-page open
the right one. Two consequences, and the second one is a styling bug that is easy to ship:

1. **A text query still finds it.** `queryByText(...)` is the wrong assertion; `.not.toBeVisible()`
   is the right one. My first version of this component's JSDoc claimed the panel was unmounted,
   which the failing test corrected.
2. **`hidden="until-found"` does not remove the box.** The browser implements it as
   `content-visibility: hidden`, which skips the _content_ but keeps the element's own padding and
   border — and Tailwind's preflight deliberately leaves `[hidden="until-found"]` out of its
   `display: none` rule, so nothing else removes it either. A panel with `pb-4` on it therefore
   added **16px of dead space under every closed row**: each item measured 65px for a 48px
   header. The panel's padding and border are guarded on not being hidden for exactly this reason.

The panel has no `data-expanded` to key off — my first version used one, so the padding and the
top hairline never applied at all. `hidden` is the attribute that is actually there.

Disabled stops a row being _changed_, it does not close what is already shown.
