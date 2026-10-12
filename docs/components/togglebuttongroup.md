# ToggleButtonGroup

A row of buttons where one — or several — is on. A segmented control.

```tsx
<ToggleButtonGroup selectionMode="single" defaultSelectedKeys={['24h']}>
  <ToggleButtonGroup.Button id="1h">1h</ToggleButtonGroup.Button>
  <ToggleButtonGroup.Button id="24h">24h</ToggleButtonGroup.Button>
  <ToggleButtonGroup.Button id="7d">7d</ToggleButtonGroup.Button>
</ToggleButtonGroup>
```

| Slot                       | React Aria          | Notes                                                                  |
| -------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `ToggleButtonGroup`        | `ToggleButtonGroup` | `selectionMode`, `selectedKeys`, `onSelectionChange`                   |
| `ToggleButtonGroup.Button` | `ToggleButton`      | A segment. `id` is required — a segment without one cannot be selected |

## A segment is not a `Tab`, and not a `Button`

A `Tab` swaps the panel below it. A segment changes a value the rest of the page reads. Where the sheet
has a tab row it puts an **indicator under** the current tab; here the current segment is **filled**,
because there is no panel for an indicator to point at. The fill is `--color-teal` with `ink` text — the
same place the accent goes on `Nav`'s current item and a selected table row.

The segments are `ghost` buttons plus two `data-[selected]:` rules, and the whole trick is that **those
rules are variants**: a variant outranks the plain `bg-transparent` / `border-transparent` the `ghost`
variant declares, whatever order the two reach the stylesheet in. `--btn` is retargeted to teal as well
as the background, so the button's own hover recipe — which deepens `--btn` toward ink — follows and the
segment deepens rather than jumping to another colour.

## The group draws the box

Every segment is border-transparent, so without the group's own border the control is a row of words
with nothing around it. The group draws the outline and each segment draws **only the divider before it**
(`[&:not(:first-child)]:border-l-line-control`), so no edge is drawn twice at the joins.

## The arrow keys do not carry the selection — but must not lose it

React Aria's model here is **manual activation**: the arrow keys move focus, and Space, Enter or a click
activates. Written into this doc originally was the tidier claim that the arrows move the selection and
wrap; the story was written, disagreed, and the doc was corrected.

The corollary is the part that matters. React Aria's own default **lets the arrow keys clear the
selection outright** — press the right arrow on a segmented control and it shows no current value at
all, which answers no question. So `single` sets `disallowEmptySelection` by default. `Keyboard`'s first
assertion is what pins that: focus has moved to the next segment _and_ the previous one is still on.

## A group has no `disabledKeys`

The prop does not exist on `ToggleButtonGroupProps` — tsc says so. A segment that cannot be turned on is
disabled on itself with `isDisabled`, which is also how a single unavailable option is expressed.
