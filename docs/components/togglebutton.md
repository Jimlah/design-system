# ToggleButton

A button that stays down.

```tsx
<ToggleButton defaultSelected>24h</ToggleButton>
<ToggleButton isSelected={live} onChange={setLive}>Live</ToggleButton>
```

| Prop         | Notes                                                      |
| ------------ | ---------------------------------------------------------- |
| `variant`    | The same five the button has, because this _is_ the button |
| `size`       | The same three, from the same table                        |
| `isSelected` | Controlled or not; `onChange` gives the next state         |

**It is a button, so it wears the button's clothes.** `ToggleButton` composes `Button`'s own base
classes, variants and sizes rather than growing a second copy — the same call `field.ts` and
`popover.ts` make, except that here the shared thing was already in one file and only needed
exporting. A toggle that drifted a pixel from the button beside it would be the most visible kind of
drift there is, and `MatchesButton` measures the two against each other.

**The on-state retargets the variant's own recipe instead of painting over it.** `Button` paints
`bg-(--btn)` and derives its hover and pressed shades from it, so a selected toggle simply points
`--btn` at the accent — hover, pressed, focus and the pending spinner all follow with no second rule.
That is the same mechanism `Checkbox` and `Meter` use to move a state without replacing a colour, and
it works because a `data-[selected]:` rule outranks the plain one the variant declares, whatever order
the two land in.

**The accent, not the sheet's yellow.** `--warning` is literally named `selected-yellow`, which
makes it the obvious choice — and it is already the `secondary` button. A colour that means two things
stops meaning either, which is exactly the correction the error state needed when it moved from yellow
to red.

It is a **toggle, not a checkbox in a button's shape**: `aria-pressed` is set, so it is announced as
something that can be on or off, and it clicks off again.

## An off toggle was invisible, and nothing here could see it

`ToggleButton` composes `Button`'s base, variants and sizes — but it did **not** compose `Button`'s
`COLORS`. Every filled variant paints `bg-(--btn)`, and `--btn` is only ever set by `COLORS[color]`, so a
toggle that never applied one painted **no background at all** while `text-ink` still painted its label.
On this dark page that is black text on black: the `Default` story rendered an empty box with a focus ring
around it, and the source looked entirely correct.

**Why the tests missed it, which is the part worth keeping.** The file asserted `aria-pressed`, the
`data-selected` attribute, and the _selected_ colours — semantics, and the state that worked. The bug lived
in the one place nothing looked: the appearance of the **off** state. A suite that covers a component's
behaviour and its on-state can still be blind to whether the control is visible at all.

The fix is `color`, defaulting to `primary`, applied through the same shared `COLORS` table the button uses.
The regression test asserts the invariant directly: `default` is a filled variant, so it must paint, and
its label must not be the colour of the surface it sits on — its **own** fill if it has one, the page only
when it does not. The first version of that second assertion compared against the page alone and failed on
correct black-on-teal; comparing against the actual surface is what makes it a real check.
