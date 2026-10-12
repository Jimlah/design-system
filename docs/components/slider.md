# Slider

A value chosen by dragging a handle along a rail. **The sheet has no slider in it**, so this is an
invention — and it is the progress bar's drawing made interactive: the same 4px rail, the same accent
fill, the same `progress.ts`. A slider _is_ a bar with a handle on it, and two drawings of one idea is
the drift that file exists to prevent.

```tsx
<Slider defaultValue={60}>
  <Slider.Header>
    <Slider.Label>Alert threshold</Slider.Label>
    <Slider.Value />
  </Slider.Header>
  <Slider.Track>
    <Slider.Fill />
    <Slider.Thumb />
  </Slider.Track>
</Slider>
```

| Slot            | React Aria     | Notes                                                      |
| --------------- | -------------- | ---------------------------------------------------------- |
| `Slider`        | `Slider`       | The value. `size` is `sm \| md \| lg`, and `orientation`   |
| `Slider.Header` | —              | The label and the reading on one line                      |
| `Slider.Label`  | `Label`        | Names the rail — React Aria wires it, so there is no prop  |
| `Slider.Value`  | `SliderOutput` | An `<output>`, which is the element for a control's result |
| `Slider.Track`  | `SliderTrack`  | The rail. One `Fill` and one or more `Thumb`s              |
| `Slider.Fill`   | `SliderFill`   | The filled part — the run to the thumb, or between two     |
| `Slider.Thumb`  | `SliderThumb`  | A handle. `index` and `label` for a range                  |

### A range is the same component, twice

`Slider.Track` holds as many thumbs as you write, and React Aria keeps them from crossing.
**Each thumb's accessible name is its own label _plus_ the group's** — `"From Latency window"`, not
`"From"`. That is the right answer: a screen reader crossing a form hears which window _and_ which
end of it. A story therefore matches on a prefix rather than on a name invented to make it pass.

### `size` was accepted and ignored — twice

The same trap as the number field's steppers, one component later, and it survived two rounds because
the assertion only ever checked one end of it.

The first version set `h-1` outright, so `size` changed the legend's type and nothing else; `Sizes`
found three identical rails where it expected three. The rail was then wired to `--slider-rail` — and
the **handle** kept a fixed size, so three rails of three different thicknesses all carried an
identical grip, and `Sizes` still passed, because it was only looking at the rails.
`size-(--slider-thumb)` silently produced nothing; `h-(--slider-rail)` had worked the whole time.

The lesson is about the _test_ rather than the class: **check both ends of a two-ended decision.**
`Sizes` now asserts three distinct rail heights _and_ three distinct grip heights, and that every grip
is square. (It required the opposite for a while — "taller than it is wide" — which is the assertion the
section below is about.)

### Disabled dims through a variable, for the fourth time

`data-disabled` is on the slider **root** while the handle is a descendant, so a
`data-[disabled]:opacity-30` on the handle never matches and the handle stayed at full strength. The
root publishes `--slider-dim` and the handle reads it — the same shape as `Checkbox`'s indicator and
`Select`'s trigger. React Aria also renders an **inner wrapper** inside the thumb, so the input's
parent is not the styled element; `data-slot="thumb"` is the hook, as it is on the fill.

### The story that matters most measures the handle

`ThumbPosition` compares the handle's centre against the rail's width and expects a quarter. That is
the whole claim a slider makes, and the one a broken layout keeps while every behavioural assertion
still passes.

## The handle: square, full-strength, and the loudest mark on the rail

| size | rail | handle |
| ---- | ---- | ------ |
| `sm` | 3px  | 16px   |
| `md` | 4px  | 20px   |
| `lg` | 6px  | 24px   |

The sheet has no slider — this is one of the components invented here — so the handle's shape and colour
were choices, and it took three readings of the rendered control to get them right.

**Shape.** It began as a `bg-background` square **with a border**, which on the dark page was a black box showing
nothing but its own hairline. The verdict was that squareness was at fault, so it became a tall narrow bar —
7×18px at `md`, then 10×24px. The next reader said it still looked wrong, rightly: a bar a hairline wide and
several rails tall reads as a **cursor**, not as something a hand closes around. The border and the black fill
were the original problem; being square never was.

**What kept it a bar was an assertion.** `Sizes` required `height > width`, annotated "that proportion is what
makes it a grip" — so the wrong shape was not merely accepted, it was _enforced_, and no amount of looking at
the component would have found that.

**Colour, which was the actual complaint.** `bg-foreground/70` is 70% white: measurably lighter than the page, but
_duller than the teal fill it sits on_ — so on the filled half of the rail the handle receded while the fill
led, and it was hard to see. It is the thing you grab; it should be the loudest mark on the rail. It is now
`bg-foreground` at full strength, which reads against both the teal fill and the dark track with no border and no ring.
Sizes moved up one step at the same time.

**The state signals are scale, not colour.** With the handle already white at rest, hover and drag have nothing
left to brighten, so they grow. Dragging used to turn the handle **teal** — the exact colour of the fill
underneath it, invisible on the filled half. The same mistake as the resting colour, found in the same pass.

All three sizes carry the same rule, and `Sizes` checks that they are still three different sizes.

## The handle was painted as a sliver, and it hung above the rail

The grip the section above describes was not what the browser drew, and it took a 3× screenshot of the
rendered control to see it. Two separate faults, both from `Slider.Track` composing the progress bar's
recipe instead of its own:

1. **The rail clips.** `progress.ts` exports `TRACK` as `overflow-hidden`, which the bar can afford —
   its fill is the whole drawing. A slider's handle is a **20px square on a 4px rail**, so the clip painted
   it as a 4px white notch at the end of the fill. React Aria's own docs CSS for a slider track has no
   overflow rule at all. What the two rails share is the **wash**, not the clip; that is now its own
   export, `TRACK_WASH`.
2. **The handle had no cross-axis centre.** React Aria positions the thumb along the rail and centres it
   with `transform: translate(-50%, -50%)` — which assumes the box it translates already _starts_ at the
   rail's centre, and it does not, because `top` is `auto`. Measured, the grip sat **10px above** a 4px
   rail, hanging over the fill like a tab. React Aria's docs CSS carries the missing line: `top: 50%`
   when the rail lies down, `left: 50%` when it stands up. It is read off the **track**, because React Aria
   publishes `data-orientation` there and not on the thumb.

**Neither was visible to the suite, and the reason is the same for both.** Every assertion measured
`getBoundingClientRect`, which returns a layout box whether or not an ancestor clips it and whatever the
box's transform has done to it on screen: the handle measured 20×20 while painting four pixels tall. The
story now asserts the two mechanisms rather than the symptom — the track's computed `overflow` is
`visible`, the handle is taller than the rail, and its centre is within a pixel of the rail's in **both**
orientations. That is the difference between a component that works and one that only measures as if it
did.
