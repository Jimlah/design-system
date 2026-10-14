# Avatar

Who something belongs to — a monitor's owner, an alert's assignee — as a picture or as initials.

```tsx
<Avatar alt="Ada Lovelace" src="/ada.png" />
<Avatar alt="Ada Lovelace" />          // initials, when there is no picture
<Avatar alt="fra1" color="primary" />  // a machine's name works the same way
```

| prop            | default   | notes                                                  |
| --------------- | --------- | ------------------------------------------------------ |
| `alt`           | —         | required; a **name**, and it becomes the initials      |
| `src`           | —         | omit it, or let it fail, and the initials are used     |
| `size`          | `md`      | `sm` 24px, `md` 32px, `lg` 40px                        |
| `color`         | `neutral` | `Button`'s five                                        |
| `isPreviewable` | `false`   | opens the avatar large in a modal; it becomes a button |

## `Avatar.Group` — several of them

```tsx
<Avatar.Group label="4 teammates">
  <Avatar alt="Ada Lovelace" src="/ada.png" />
  <Avatar alt="Grace Hopper" />
  <Avatar alt="Karen Spärck Jones" />
</Avatar.Group>
```

| prop            | default | notes                                                            |
| --------------- | ------- | ---------------------------------------------------------------- |
| `children`      | —       | the avatars; the ring and the overlap apply to direct children   |
| `size`          | `sm`    | `sm` 24px, `md` 32px, `lg` 40px — handed to every avatar inside  |
| `label`         | —       | text after the stack; **also the group's accessible name**       |
| `max`           | —       | how many to show before the rest are counted as `+N`             |
| `overflowCount` | —       | what the counter says, when the children are not the whole group |
| `aria-label`    | —       | names the group outright, overriding `label`                     |

### It is `Avatar.Group`, not an `AvatarGroup`

**It is not a component that happens to contain avatars — it is what several avatars _are_.** The size it
takes, the box it draws, the name it carries and the colour it fills with are all `Avatar`'s, once per
face, and the compound form is what says so: a reader who has `Avatar` has `Avatar.Group`. That is the
same call `Button.Icon` and `Toolbar.Group` make, and it keeps the library's index of components a list
of things rather than a list of arrangements.

### The faces are one object, and the ring is what says so

Each avatar covers a **quarter** of the one before it — 18px steps for `sm`, 24 for `md`, 30 for `lg` —
and is cut out of it by a 2px ring in the surface the stack is standing on:

```tsx
<Avatar.Group label="3 on call" className="[--avatar-ring:var(--color-card)]">
```

**That ring is the whole trick.** Without it the overlapping faces merge into a smear; with the ring in the
wrong colour, it draws a line around a stack that is sitting on something else. `--avatar-ring` is declared
on the group and defaults to the page, so a stack inside a panel moves it with one class — the same
mechanism `Button`'s colours use, and the reason it is a property rather than a prop.

The ring follows the element's own radius, which is the avatar's `rounded-md`: this system squares
everything, and a circular cut-out around a square face is what a hand-rolled stack tends to draw.

### `size` travels to the children, and can be overruled

The group sizes every avatar inside it through a context of its own, so a stack is sized once rather than at
each face — and an avatar that names its own `size` still wins, which is what lets one face in a row be the
person the row is about. Its default is `sm`, one step below a lone avatar's `md`: a stack is a summary,
not a portrait. `GroupSizes` asserts all three sizes and the exception, by measuring the boxes.

### The counter is the one thing the reference has not got

Spectrum's avatar group ends at the avatars and a label. This one counts, because the page it was built for
had already invented that by hand — four faces and a hardcoded `+5` in the markup — and a number written
into a page is a number nobody maintains. `max` trims the stack; `overflowCount` says what the counter
reads when the children are not the whole group, which is the case for any list that arrives a page at a
time: three loaded faces out of eight teammates is `max={3} overflowCount={5}`.

The counter is a **picture rather than a word**: it reads `+5` and is named "5 more", so a screen reader
hears what the eye sees rather than a plus sign. It draws in the avatars' own box at the panel's quieter
fill, so the stack stays one height.

### The label is the accessible name

A group of faces with no name is an unexplained run of names, so `label` names it: the text is rendered
after the stack and wired up as the group's `aria-labelledby`. `aria-label` overrides it, for the group
whose visible text is a count or an abbreviation rather than a name. `GroupLabel` asserts both, and that
the name really came from the label's own id rather than from a hardcoded string.

## The fourth component with nothing to copy

`pulse-replica/` has no avatar, no user chip and nothing person-shaped at all — after the date picker, the
accordion and the toast, this is the fourth component here invented rather than replicated. So every
decision comes from the system's own language:

- **Square by default, and a circle never.** The sheet squares off its controls and makes exactly two
  exceptions, the checkbox's 2px and the radio's circle; a round avatar would be a **third**, so the box
  wears the control step of the radius scale — `rounded-md`, which is `0` in the sheet and a soft square
  under a theme. It is the one place a designer expects a circle, which is why it is stated rather than
  left to look like an oversight.
- **A fill carrying `ink`**, like every other filled control: black on the luminous dark-theme accents,
  white on the deep light-theme ones. The five colours are literally `Button`'s table, so an avatar cannot
  drift away from the palette it sits beside.
- **Mono, uppercase, letterspaced initials** — the face every other label here wears.

## Initials are derived, and the edges are checked

The first letter of the first and last words, or the first two letters of a single word:

| `alt`             | initials |
| ----------------- | -------- |
| `Ada Lovelace`    | `AL`     |
| `Ada B. Lovelace` | `AL`     |
| `fra1`            | `FR`     |
| `"  "`            | `?`      |

A middle name does not change it, because the surname is what distinguishes two Adas. A name with no letters
at all still has to render something, so it gets `?` rather than an empty box — the one case where the
fallback invents rather than derives.

A generic silhouette was the alternative and was rejected: it says "somebody", and in a monitoring system
_which_ somebody is the entire content of the cell.

## A broken image falls back to initials, not to nothing

`onError` swaps the `<img>` for the initials. This is not an edge case — an avatar URL that 404s, a service
with no picture, a directory that has not synced — it is the state a real dashboard spends most of its life
in, and the failure mode of not handling it is an empty box. `BrokenImage` is a story with a source that
cannot load, and it asserts the initials appear and the `<img>` is gone.

## The name is announced once

The wrapper is `role="img"` with `aria-label={alt}` and the inner `<img>` is `alt=""`. Giving both a name
announces the same person twice; giving only the image one leaves the initials case — the majority case —
with no name at all.

The `Default` story asserts the picture **actually arrived** by checking `naturalWidth`: an `<img>` in the
DOM proves nothing on its own, because a 404 leaves one behind.

## `isPreviewable` changes the element, not the styling

```tsx
<Avatar alt="Ada Lovelace" src="/ada.png" isPreviewable />
```

Off — the default — this is a `<span role="img" aria-label>`, a picture the tab order correctly skips. On, it
is a **real `<button>`** that opens the avatar at 224px in a `Modal`, because a picture that answers a click
has to be reachable by keyboard and announced as something you can press. It is `react-aria-components`'
own `Button` rather than this system's: the styled one brings a fill, a size and a padding, and this element
is an avatar that happens to be pressable.

Two consequences worth stating:

- **The accessible name changes from `alt` to `Preview {alt}`.** The name alone would not say what pressing
  it does. The initials stay `aria-hidden` either way, so the name is announced once.
- **The tab order changes.** An avatar in a list or a table cell is decoration; making every one of them a
  tab stop is why this is opt-in rather than automatic.

The modal's title is the `alt`, so the dialog is announced by the name it is showing. `Previewable` asserts
all of it: that the element is a `BUTTON`, that no dialog exists until it is pressed, that the open dialog's
accessible name is the name, that the preview measures over 200px, that the picture decoded, and that
closing puts it away.
