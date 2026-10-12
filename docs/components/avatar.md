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

## The fourth component with nothing to copy

`pulse-replica/` has no avatar, no user chip and nothing person-shaped at all — after the date picker, the
accordion and the toast, this is the fourth component here invented rather than replicated. So every
decision comes from the system's own language:

- **Square.** The sheet squares off its controls and makes exactly two exceptions, the checkbox's 2px and
  the radio's circle. A round avatar would be a **third**, so it is `rounded-none`. This is the one place a
  designer expects a circle, which is why it is stated rather than left to look like an oversight.
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
