# Sheet

A panel that slides in from an edge — a task's details without leaving the page.

```tsx
<Sheet>
  <Button>Details</Button>
  <Sheet.Content side="right">
    <Sheet.Title>fra1 · Frankfurt</Sheet.Title>
    <Sheet.Description>Checked every 60 seconds.</Sheet.Description>
    <Sheet.Footer>
      <Sheet.Close>Close</Sheet.Close>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet>
```

| Slot                | React Aria                                | Notes                                           |
| ------------------- | ----------------------------------------- | ----------------------------------------------- |
| `Sheet`             | `DialogTrigger`                           | The trigger, then a `Sheet.Content`             |
| `Sheet.Content`     | `SheetOverlay` + `Sheet` + `SheetContent` | The scrim, the edge, and the panel              |
| `Sheet.Title`       | `Heading`                                 | The modal's own title type, imported not copied |
| `Sheet.Description` | `Text`                                    | `aria-describedby` wired here, as on `Modal`    |
| `Sheet.Footer`      | —                                         | The actions, pushed to the foot                 |
| `Sheet.Close`       | `Button`                                  | `slot="close"`, the whole mechanism             |

**A sheet is a modal that kept the page visible.** It takes the pointer and traps focus exactly as a
`Modal` does, but covers one edge instead of the middle — so the row you opened it from is still on
screen behind the scrim. Reach for `Modal` when the page is irrelevant to the decision and for this
when it is the context.

It is also a **swipe target on touch**, which is why `side` is not merely a layout prop: React Aria
resolves it into the edge _and_ the swipe direction, so a right-hand panel is dismissed by dragging
right.

## Three layers, and none of them is optional

`SheetOverlay` owns the state and draws the scrim, `Sheet` reads that state and decides the edge, and
`SheetContent` reads _its_ result. Content placed straight inside `Sheet` leaves `SheetContext` null:
`Cannot destructure property 'position' of useContext(...)` — which reads like a React bug and is a
missing layer.

**`position` is a `SheetOverlay` prop** — not `Sheet`, not `SheetContent`.

## The panel cannot be sized from outside — size the layer above it

`SheetContent` renders a `Dialog` with `style={{ width: '100%', height: '100%' }}` written _after_ the
props it is given. **An inline style outranks every class**, so a `w-96` passed to the panel does
nothing at all, and the panel is always exactly as big as the layer above it.

The size therefore goes on `Sheet`, which this component owns — `SIZES[side]` in JavaScript, where
`side` is already known. The first version put it on the panel and rendered a **250×149** panel while
the class list looked perfectly correct.

## The two earlier verdicts, revisited

This component was built, removed, and rebuilt. Both reasons it was removed are worth recording as
they turned out:

- **"It opens on load" was wrong.** A throwaway Playwright probe that navigates straight to an
  `iframe.html?viewMode=story` URL reports a dialog already open for _every_ overlay story here,
  because Storybook restores that story's canvas from a previous visit in the same browser context.
  The runner asserts the opposite: `Default`'s **first** assertion is that no dialog is present, made
  before any click, and it passes — and the click that follows opens it. That is conclusive.
- **"The panel is 250×149" was right**, and the cause was the inline style above, not a missing class.
  It now measures 384×460 in a 760×460 viewport, pinned to the right edge.

Neither was findable by reading the class list. **Read React Aria's own source for a component that
misbehaves** — `dist/private/<Name>.js.map` carries the original `tsx` in `sourcesContent`, which is how
the hardcoded `style` was found after two rounds of guessing.

## The root is `SheetTrigger`, not `DialogTrigger`

They take the same props and render the same element, and only one of them is right. React Aria's
`SheetTrigger` wraps its children in a `PressResponder` with `isPressed={false}`, in its own words to
_"prevent the trigger element from appearing stuck while the sheet is open"_. A plain `DialogTrigger`
leaves the button that opened the sheet looking pressed for as long as the sheet is up — which is exactly
what press-and-hold looks like, and is wrong.

It was found by reading React Aria's source rather than its types, because both are typed
`DialogTriggerProps` and the difference is one line of JSX.

## `SheetBackdrop` — attempted, measured, reverted

React Aria's animated scrim, which follows the panel out when a sheet is swiped. It was wired in, and the
attempt was reverted on evidence rather than on taste.

**The blocker is that React Aria owns the geometry of both layers.** A probe of the live DOM shows the
overlay reporting `position: absolute` where this component writes `fixed`, and the `Sheet` layer
reporting `relative` where it writes `absolute` — React Aria's own `sheetProps` set `position`, `top`,
`left`, `width` and `height` inline, and an inline style outranks every class. So the `Sheet` layer is
content-sized by the library, and `SheetBackdrop`'s `inset-0` can only ever resolve against **that** box.

The consequence is exact: a backdrop inside `Sheet` covers the **panel**, not the page. Making the layer
full-viewport is not a class away — it is React Aria's structure, and the first attempt collapsed the panel
from full-height to 149px, which the suite caught immediately.

The scrim therefore stays on the overlay, where it works and is tested.
