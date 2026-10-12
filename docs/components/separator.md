# Separator

The sheet's five dividers, which is why there are five.

```tsx
<Separator />
<Separator variant="strong" />
<Separator variant="dashed" />
<Separator orientation="vertical" />
```

| Variant  | Sheet            | Treatment                           |
| -------- | ---------------- | ----------------------------------- |
| `hair`   | `.ds-div-hair`   | `--border`, a fill                  |
| `soft`   | `.ds-div-soft`   | `--border-soft`, a fill             |
| `strong` | `.ds-div-strong` | `--foreground` — full white in dark |
| `dashed` | `.ds-div-dashed` | a `border-top`, at 45%              |
| `dotted` | `.ds-div-dotted` | a `border-top`, at 45%              |

`strong` reads `--foreground` rather than the sheet's literal `#ffffff`, because on a white page a
white rule separates nothing.

`dashed` and `dotted` are **borders**, not fills — a 1px fill cannot be dashed — and they turn with
the separator: `border-t` horizontally, `border-s` vertically, because a vertical line drawn with
`border-t` paints across a 1px column and disappears. That is the sort of thing that looks fine in a
screenshot of the wrong element.

React Aria renders it as an `<hr>` when horizontal and a `<div role="separator">` when vertical, and
it is **not** `aria-hidden`: a rule carries no text and announces nothing, so there is nothing to
hide. A first version of the story asserted `aria-hidden="true"` and was wrong.

**A separator is not a spacer.** It says two things are apart; where nothing is apart, the space is
the answer.

### Storybook forces the font size of every form control

Worth knowing before spending an hour on it. Storybook's own preview CSS contains

```css
input,
textarea,
select {
  font-size: max(16px, 1rem);
}
```

to stop iOS zooming a form on focus. That rule is **unlayered**, so it beats every Tailwind utility,
which lives in a cascade layer — and it cannot be overridden from a component without `!important`.
A textarea therefore computes **16px/24px under the test runner** while being 14px/21px in the app.

The symptom is precise and misleading: `min-height`, `padding` and `border-radius` on the same
element all apply, and only `font-size` does not. Assert the type on the **field root**, where the
field sets it, and leave the control alone.

`area.closest('[data-rac]')` does not find the root either — React Aria puts `data-rac` on every
element it renders, so the closest one is the control itself. It is `area.parentElement`.
