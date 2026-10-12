# ProgressBar and Meter

**The sheet has no bar of any kind**, so these two are an invention — a small one that borrows its
language: square, 4px, and the system's own colours. They share `progress.ts` the way `TextField` and
`SearchField` share `field.ts`: a progress bar and a meter are the same drawing of two different
facts, and the drawing is the thing that must not drift.

```tsx
<ProgressBar value={72} className="w-72">
  <ProgressBar.Header>
    <ProgressBar.Label>Uptime</ProgressBar.Label>
    <ProgressBar.Value />
  </ProgressBar.Header>
  <ProgressBar.Track>
    <ProgressBar.Fill />
  </ProgressBar.Track>
</ProgressBar>

<Meter value={82} tone={82 > 80 ? 'danger' : 'success'} className="w-72">
  <Meter.Header>
    <Meter.Label>Disk</Meter.Label>
    <Meter.Value />
  </Meter.Header>
  <Meter.Track>
    <Meter.Fill />
  </Meter.Track>
</Meter>
```

| Slot                  | React Aria            | Notes                                         |
| --------------------- | --------------------- | --------------------------------------------- |
| `ProgressBar`/`Meter` | `ProgressBar`/`Meter` | The value. `formatOptions`, `isIndeterminate` |
| `.Label`              | —                     | The caption, and the widget's name            |
| `.Header`             | —                     | The label and the reading on one line         |
| `.Value`              | —                     | The reading, as React Aria formats it         |
| `.Track`              | —                     | The rail                                      |
| `.Fill`               | —                     | The bar                                       |

### A progress bar completes; a meter reports

Not a difference in decoration. A progress bar says how far along an operation is, its maximum is
almost always 100%, and its accent means "getting there is good". A meter's reading is a fact about
the world, and whether it is good depends on what is being measured — 80% of a disk used is a
warning, 80% of a disk free is not. So `Meter` asks for a `tone` rather than deriving one: it would
have to guess, and it would guess confidently.

### The width is a value, so it arrives as `--fill`

`percentage` is React Aria's, and it is `number | undefined`. It is handed over as a custom property
and read by `w-(--fill)`, so the width stays a utility in the class list like every other
measurement here and the only thing written inline is the number. A custom property needs the
`as React.CSSProperties` cast, because React's `CSSProperties` has no index signature — the
alternative is an inline `style={{ width }}`, which is a measurement in the one place this system
keeps them all in classes.

### Indeterminate is the _absence_ of a value

React Aria renders `isIndeterminate` as the absence of `aria-valuenow` — and `percentage` arrives
`undefined` rather than `0`, which is exactly the difference between "we do not know how far along
this is" and "it has not started". The rail fills and pulses.

A moving stripe would say it better and would need keyframes this system does not have; the pulse is
Tailwind's own, so nothing new was invented to say "in progress".

### The render props live inside the component, so the slots stay slots

React Aria hands `percentage` and `valueText` to a **function** child. Left there, this would be the
one family here whose consumer writes a callback where every other component takes slots — so the
function lives inside the root and the two values go into a context that `.Fill` and `.Value` read.
`Nav.Label` reading its own chevron's state is the same arrangement, for the same reason.

That is not what the first version did. It took a `label` **prop** and rendered every piece itself,
which worked and read like a different kind of component; a `label` prop on a slots-first system is a
tell that the slots were not doing their job.

The context also carries the id that names the widget. React Aria **omits `label`** on both a
progress bar and a meter, and their `Label` child is a caption that does not register itself as the
name — so an early version failed every story with _"Unable to find an accessible element with the
role progressbar and name Uptime"_. `ProgressBar`/`Meter` generate an id with `useId` and point
`aria-labelledby` at it, which is what the modal does for its description.

### `tone` travels in the context too, and the first version forgot

`tone` is set on the meter — one reading, one meaning — while the thing it colours is the fill. A
first version left it out of the context, so `tone="success"` was silently ignored and every fill
rendered neutral. The `Tones` story caught it by finding **five identical colours where it expected
five** — which is the sort of assertion worth writing precisely because the component looks right
when it is wrong.

### The bar is measured, not read off a token

`Default` compares the fill's rendered width against the rail's and expects 72%. That is the only
claim that matters about a progress bar, and the one a wrong width would break — the lesson the
number field's steppers taught.
