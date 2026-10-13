# Popover

A panel anchored to the thing that opened it, that does not take the page away.

```tsx
<Popover>
  <Button>Filters</Button>
  <Popover.Content placement="bottom start">
    <Popover.Title>Filters</Popover.Title>
    <Popover.Description>Applies to this view only.</Popover.Description>
  </Popover.Content>
</Popover>
```

| Slot                  | React Aria           | Notes                                           |
| --------------------- | -------------------- | ----------------------------------------------- |
| `Popover`             | `DialogTrigger`      | The trigger, then a `Popover.Content`           |
| `Popover.Content`     | `Popover` + `Dialog` | The surface, and the dialog that names it       |
| `Popover.Title`       | `Heading`            | The modal's own title type, imported not copied |
| `Popover.Description` | `Text`               | `aria-describedby` wired here, as on Modal      |

**A popover is a modal that is not modal**, and that is the whole decision. It is dismissed by Escape
and by a click outside, but it traps nothing and hides nothing: the page behind stays readable and
usable. Reach for `Modal` when the page is irrelevant to the decision and for this when it is the
context.

The surface is `popover.ts`'s, but **not `POPOVER` itself** — that one holds a single scrolling list and
is sized from the control it came from (`min-w-(--trigger-width)`, capped at the window), which is right
for a menu over a button and wrong for a panel with its own idea of how wide it should be. It is what
`Menu`, `Select` and `ComboBox` are built on; this is the same surface with no list at all.

**Placement is a request, not an instruction.** `placement="bottom start"` opens downwards when there
is room and flips when there is not, so the story asserts that React Aria reports where the panel
landed rather than the value the prop asked for.

### The browser probe reports "open on load", and is wrong

Worth writing down because it has now happened twice and cost a component once.

A throwaway Playwright script that navigates straight to an `iframe.html?viewMode=story` URL and then
looks for `role="dialog"` **finds one already open**, for both the sheet and the popover — because
Storybook has restored that story's canvas from a previous visit in the same browser context. The
test runner does not: `Default` clicks the trigger and its **first** assertion, made before any click,
is that no dialog is present — and it passes.

**So the runner is the authority on whether something opens by itself, and the probe is not.** The
`Sheet` was removed on this evidence in an earlier round; its size defect was independently confirmed
and stands, but the "opens before you open it" half of that verdict may well have been this artifact.
Trust the suite for state, the screenshot for appearance.
