# OverlayArrow

The marker that points from a floating panel back at the thing that opened it.

```tsx
<Popover>
  <Popover.Arrow />
  <p className="text-[13px] text-fg/70">Anchored to the button.</p>
</Popover>
```

| Slot            | React Aria     | Notes                              |
| --------------- | -------------- | ---------------------------------- |
| `Popover.Arrow` | `OverlayArrow` | Opt-in; inside the popover         |
| `Tooltip.Arrow` | `OverlayArrow` | Opt-in; inside the tooltip content |

## Nothing uses one by default, and that is a decision

A pointer is a shape the design language does not otherwise contain. The sheet's panels are flat rectangles
joined to their trigger by proximity and position, and every menu, select and tooltip here opens anchored
without one — so it is neither in `popover.ts` nor built into `Popover`.

It was left out for three rounds on **inference**, which is a weak reason. Building it as an **opt-in slot**
settles the question with code instead: if nothing uses it, the judgement is confirmed; if something needs
it, it is already there. That is the difference between a decision and a guess.

## A rotated square, not a triangle

```tsx
// The shape's own class list, and the reason it is a separate element:
'block size-2 rotate-45 border-line-strong bg-panel'
'[[data-placement=bottom]_&]:border-t [[data-placement=bottom]_&]:border-l'
```

Two hairlines and the panel's own fill continue the panel's edge out to a point — the same squared geometry
as every other surface here. An SVG arrow would be the one curved thing in the system. Which two edges are
kept depends on where React Aria put the overlay, reported as `data-placement` on the **parent** — hence
arbitrary ancestor variants rather than plain `data-[…]` ones.

## Two things that cost a round

**React Aria owns the outer element's `transform`.** It positions the arrow with an inline `transform`, and
an inline style outranks every class — so a `rotate-45` written on that element type-checks, reads correctly
in the source, and does nothing. The first version did exactly that and drew an unrotated square. The
rotation lives on a `<span>` inside it. This is the third time in this repo an inline style has silently
beaten a class.

**Tailwind v4 writes the `rotate` property, not `transform`.** The assertion that caught the first bug then
reported `transform: 'none'` for an element that _was_ visibly rotated, because `rotate-45` sets
`rotate: 45deg`. The code was right and the assertion was wrong. Check `rotate`.

## Focus is the reliable way into a tooltip

`Tooltip.Arrow`'s story focuses the trigger with `tab()` rather than hovering it. A tooltip must open for a
keyboard user with no pointer, so focus is the first-class route — and it is also the one that does not
depend on a hover delay.
