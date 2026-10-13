# Modal

A dialog over the page: a short task that needs an answer before the page can be used again. The
surface is the tooltip's and the toast's — its own panel with a hairline — and the title is the
sheet's own `.ds-panel-title`, 18px/600.

```tsx
<Modal>
  <Button>New monitor</Button>
  <Modal.Content>
    <Modal.Title>New monitor</Modal.Title>
    <Modal.Description>
      It starts checking as soon as you save.
    </Modal.Description>
    <Modal.Footer>
      <Modal.Close>Cancel</Modal.Close>
      <Button variant="default">Save</Button>
    </Modal.Footer>
  </Modal.Content>
</Modal>
```

| Slot                | React Aria                | Notes                                           |
| ------------------- | ------------------------- | ----------------------------------------------- |
| `Modal`             | `DialogTrigger`           | The trigger, then a `Modal.Content`             |
| `Modal.Content`     | `ModalOverlay` + `Dialog` | The scrim, the placement and the surface        |
| `Modal.Title`       | `Heading`                 | Names the dialog — React Aria wires it          |
| `Modal.Description` | `Text`                    | Explains it — **wired here, not by React Aria** |
| `Modal.Footer`      | —                         | The actions, right-aligned                      |
| `Modal.Close`       | `Button`                  | `slot="close"`                                  |

`Modal.Content` draws the overlay and the dialog together, as `Select.Menu` draws its popover and
its list: two elements that are never useful apart, and the placement is not a decision anyone is
making.

### A modal is a demand, so it should be rare

It takes the page away, traps focus and stops anyone reading behind it — the right trade for a
decision that has to be made now, and the wrong one for a form someone might want to consult the
page while filling in. A `Popover` is the same dialog without that cost, and the sheet's own menus
are popovers.

### React Aria wires the title and not the description

The dialog gets `aria-labelledby` on its own from `Modal.Title`. It does **not** wire a description,
so `Modal.Content` generates the id with `useId` and hands it to `Modal.Description` through a
context — a description nobody is pointed at is decoration. The `aria-describedby` is set whether or
not a description was passed, because a dangling id is a smaller thing than an unreadable
explanation.

### `slot="close"` is the mechanism, and `Modal.Close` is only the ×

Putting `slot="close"` on **any** button closes the dialog — that attribute is the whole mechanism.
`Modal.Close` is the corner ×, and it is absolutely positioned because a corner control belongs to
the dialog rather than to a footer. A footer that says "Cancel" wants a plain `Button` with the same
`slot` instead: the first version of the story put `Modal.Close` in the footer and the word flew to
the top-right corner, because `position: absolute` goes exactly where it is told.

### The trigger is not `aria-hidden`, and should not be

A first version of the `Trapped` story asserted `aria-hidden="true"` on the trigger while the dialog
was open, and it is not there. React Aria makes a dialog modal by **trapping focus** and taking the
page out of the tab order, not by hiding it from the accessibility tree — where it should stay
readable, merely not reachable. `Trapped` now walks Tab six times and asserts focus never leaves.

### The scrim is the one place the palette deliberately does not reach

A scrim has to _darken_ in both themes, and no token does that: `--ink` is black in the dark
theme and white in the light one, so it would haze a white page white and separate nothing. The
overlay is `bg-black/50`, Tailwind's own, the same in both themes by design, and it says so in the
file.

### The dialog has a height, and the page behind it is not the scroller

The first version was `relative w-full max-w-md` and nothing else, with the _overlay_ carrying
`overflow-y-auto`. So a dialog taller than the viewport pushed its own title off the top and its footer
off the bottom, and the overlay's scroller could not reach either — centring plus overflow is the case
`place-items-center-safe` exists for. It is now `max-h-[90dvh] overflow-y-auto overscroll-contain`, so
the dialog scrolls inside itself, and the overlay is centered safely: a dialog too tall for the screen
keeps its top.

### It fades in and out

Every floating surface in this library used to appear and disappear in one frame. The Modal is the
measured example: `animation-name: none`, `transition-duration: 0s`, `opacity: 1` at 0, 40, 120 and
300ms after opening. The entry and exit now come from the OVERLAYS block in `styles.css` — the exit off
React Aria's own `data-exiting`, the entry off the mount, because RAC 1.22.1's `data-entering` is set and
removed inside one commit. That block carries the measurements, and the reason the scrim fades but does
not move.
