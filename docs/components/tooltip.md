# Tooltip

The sheet's `.ds-tip` — a short description attached to the thing it describes, on its own panel
rather than on a themed bubble.

```tsx
<Tooltip delay={0}>
  <Button>Restart</Button>
  <Tooltip.Content>
    <Tooltip.Title>Restart</Tooltip.Title>
    <Tooltip.Text>Runs the check again from the top.</Tooltip.Text>
  </Tooltip.Content>
</Tooltip>
```

| Slot              | React Aria       | Notes                                                        |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| `Tooltip`         | `TooltipTrigger` | The wiring. Renders **no element** — there is no `className` |
| `Tooltip.Content` | `Tooltip`        | The surface; `delay` and placement live on the root          |
| `Tooltip.Title`   | —                | The sheet's `.ds-tip__title`                                 |
| `Tooltip.Text`    | —                | The sheet's `.ds-tip__sub`                                   |

`Tooltip` carries the thing as its first child and the tooltip as its second, so the two cannot be
wired to different things. Like `Select.AutoComplete`, the root renders no element of its own — so
it takes **no `className`**, and the class goes on the thing being described.

`Tooltip.Title` is 12px, letterspaced, `--primary`, and deliberately **not uppercase** — the one
piece of small text in this system that is not. A tooltip is read at a glance while the pointer
rests, not scanned down a column.

### A tooltip is not a label

It opens on hover and on focus, cannot be scrolled or selected, and is gone the moment the pointer
moves. Anything a user must read twice, copy, or click belongs somewhere else. React Aria supplies
what a hand-rolled tooltip always gets wrong: it opens on **focus**, so a keyboard user can reach
it; it is `aria-describedby` rather than a replacement for the element's name; Escape closes it
without moving focus; and it waits before opening on hover, so a pointer crossing a toolbar does
not flicker through every tooltip in it.

### The hover path cannot be tested here, so there is no story for it

React Aria opens a tooltip on hover through a **timer**, and the test runner's polling never
advances it. That is the trap the Testing section already records — a query that fails with
`Unable to find an accessible element with the role "tooltip"` and reads like a missing component.

Two stories were written for the hover and the delay, and both failed. The keyboard path opens
**synchronously**, so that is the one a story can prove, and `Default` and `Keyboard` both drive it
that way. The hover path is the same code; its delay is asserted nowhere rather than asserted badly.
This is the same conclusion as the table row's hover, for the same reason.
