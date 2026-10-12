# DropZone

A target that accepts files dragged onto it.

```tsx
<DropZone onDrop={async (e) => importFiles(await collect(e.items))}>
  <DropZone.Title>Drop a log file here</DropZone.Title>
  <DropZone.Hint>JSON or CSV, up to 10 MB</DropZone.Hint>
  <FileTrigger acceptedFileTypes={['.json', '.csv']} onSelect={upload}>
    <Button variant="outline">Browse…</Button>
  </FileTrigger>
</DropZone>
```

| Slot             | React Aria | Notes                                    |
| ---------------- | ---------- | ---------------------------------------- |
| `DropZone`       | `DropZone` | The target. `onDrop`, `isDisabled`       |
| `DropZone.Title` | —          | What it is for                           |
| `DropZone.Hint`  | —          | Accepted types, a size limit, or an "or" |

**The sheet has no drop zone**, so this is an invention from what it does have: the panel's surface
and the dashed edge `Separator` already draws.

The **dashed edge is the whole affordance**, and it is the only place here where a dashed border means
"put something here" rather than "these two things are apart". A solid edge reads as a panel that
merely happens to be empty.

### A drop zone on its own is not accessible

Dragging is a pointer gesture — invisible to a keyboard and to a screen reader. The `FileTrigger` and
its button are **not optional decoration**; they are the other half of the component, and a page that
offers only the drop is a page some people cannot use at all. That is why `Default` asserts the file
input's `accept` against the `Hint`'s promise: two places saying which files are welcome, and nothing
keeping them in sync but the test.

**`FileTrigger` needs no styling of its own.** It renders a hidden file input and hands the chosen
files to whatever child you give it, so the visible control is your `Button` — which is why there is no
`FileTrigger` component in this system. It is a behaviour, not a surface.

### `[data-rac]` is on every element React Aria renders — twice now

The story queried the zone with `canvasElement.querySelector('[data-rac]')` and got the browse
**button** inside it. This is the same trap the number field's affix walked into, and the fix is the
same: `data-slot="dropzone"` names the box itself, as it does for the fill and the slider's grip.

### The drag target is not asserted, after five attempts

`data-drop-target` and the styling it drives are **not** tested. The attribute appeared in one probe
and not the next — because in the first, the mouse happened to be over the zone — and neither `onDrop`,
nor a `FileTrigger` inside, nor `userEvent.hover`, nor synthetic `dragenter`/`dragover` with a real
`DataTransfer` reproduced it reliably from the runner. The story was **deleted** rather than written to
assert something adjacent.

That is the sixth story left out here, and the pattern is consistent: the tooltip's hover, the nav's
tab order, the tag's hover, the menu's type-ahead, the toolbar's `Home`/`End`, and now this. What a
story can prove is that the zone, its title, its hint and its browse button are all present and styled;
what it cannot is that a drag lands on it.
