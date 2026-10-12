# Tabs

The sheet's `.ds-tabs` and `.ds-tabpanel`: a row with one hairline under all of it, which the
selected tab's indicator then sits on top of.

```tsx
<Tabs defaultSelectedKey="overview">
  <Tabs.List aria-label="Monitor detail">
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="checks">
      Checks <Tabs.Count>3</Tabs.Count>
    </Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Everything at a glance.</Tabs.Panel>
  <Tabs.Panel id="checks">Three checks are failing.</Tabs.Panel>
</Tabs>
```

| Slot          | React Aria  | Notes                                                            |
| ------------- | ----------- | ---------------------------------------------------------------- |
| `Tabs`        | `Tabs`      | Owns the selection, as a single key                              |
| `Tabs.List`   | `TabList`   | The strip. Give it an `aria-label` when nothing visible names it |
| `Tabs.Tab`    | `Tab`       | Its `id` ties it to the panel                                    |
| `Tabs.Count`  | —           | The sheet's `.ds-count`, in the selected-yellow                  |
| `Tabs.Panels` | `TabPanels` | Optional wrapper around the panels                               |
| `Tabs.Panel`  | `TabPanel`  | The content behind a tab                                         |

The whole set is **one tab stop** and the arrow keys move between tabs — that is what lets a
keyboard user step past the strip rather than through it, and it wraps at both ends so the strip
is never a dead end. `Tabs.Count` is a slot rather than a number passed to `Tabs.Tab`, because a
count is often the whole reason to look at the tab and the moment it needs a dot or a colour of
its own, a prop stops being enough.

### `orientation` describes the strip

Not the panels, and not the set's overall shape. A vertical list **stacks its tabs** and moves its
hairline from the bottom edge to the trailing one, and the indicator turns with it — down the
tab's own text, 2px wide, rather than across it. Where the panel then sits is the consumer's
layout to decide; the prop has nothing to say about it.

This is easy to get half-right, and the half that is easy to miss is the strip itself: laying the
panel _beside_ the list is the obvious part and the list keeps reading as a row, announcing
itself as vertical while looking horizontal. The `Orientation` story asserts the column, the
moved hairline and the turned indicator rather than just the `aria-orientation`.

Those rules are written against the list's `aria-orientation` — `aria-[orientation=vertical]:` on
the strip, and `[[aria-orientation=vertical]_&]:` from the tab — rather than as group variants on
the tab, because a group variant ties on specificity with the tab's own rules and would leave the
outcome to source order.

### Only the selected panel is rendered

React Aria **unmounts** the unselected panels rather than hiding them, so their contents are not
in the document at all and `getByText` on an unselected panel finds nothing. A panel that needs
to hold state across a switch has to say so with `shouldForceMount`. Worth knowing before
writing an assertion about "the panel that is hidden" — there may be no such element.

### Two traps this caught

- **`transition-colors` covers `outline-color`.** The focus ring is painted through a colour
  transition, so reading it straight after focusing returns the previous colour — the same trap
  as the indicator and the knob, in a place where it is much less obvious.
- **A tab is not a field.** It gets the shared 3px ring rather than a teal border, because its
  edge is a 2px indicator that is only there when selected — there is nothing for a ring to
  repeat, which is the whole test for which of the two a control takes.
