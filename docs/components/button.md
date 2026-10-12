# Button

The first component, and the one the whole system's state vocabulary came from.

```tsx
<Button variant="outline" color="danger" size="md" onPress={remove}>
  <Button.Icon>{trash}</Button.Icon>
  <Button.Text>Delete monitor</Button.Text>
</Button>
```

| Slot          | React Aria | Notes                                                      |
| ------------- | ---------- | ---------------------------------------------------------- |
| `Button`      | `Button`   | `variant` × `color` × `size`, plus `block` and `isPending` |
| `Button.Icon` | —          | Decorative; `aria-hidden`, sizes in `cap`                  |
| `Button.Text` | —          | The label; truncates rather than wrapping                  |

`variant` is the _shape_ — `default`, `outline`, `ghost`, `text`, `icon` — and `color` is the
_meaning_ — `primary`, `secondary`, `neutral`, `success`, `danger`. The two are separate because
every combination is real: a ghost danger button is a row action that destroys something.

## Loading keeps the box

`isPending` leaves the content in place but unpainted and centres a spinner over it, so the button
does not resize or shift its row when the action starts. React Aria supplies the rest: **no native
`disabled`**, so it stays focusable, presses are blocked, and the state is announced.

Two hiding mechanisms, and they are **not** interchangeable:

| Content             | Mechanism            | Why                                                                                                        |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Text (bare or slot) | `text-transparent`   | `visibility` would drop it from the accessibility tree, and while loading the label is often the only name |
| Decorative icon     | `visibility: hidden` | carries no text, so no name is lost, and its box still holds the width                                     |

A bare text child can only be reached by the colour route; no `> *` rule matches a text node. The
spinner then repaints itself in `--btn-fg`, the colour the label would have had, because the
button's own colour is transparent while loading — that differs per variant, and hardcoding `ink`
there paints a black spinner on the black page for `outline`, `ghost` and `text`.

`isDisabled` and `isPending` together are coherent but not free: the dim still applies, so it reads
as unavailable, and the cursor defers to disabled (`not-allowed`, not `progress`) since the spinner
already says work is in flight. The rough edge is that `opacity` compounds onto children, so the
spinner dims along with everything else and is faint — most visibly in the light theme.

## States move the colour, they do not replace it

The sheet declares `hover: #FFF` on its one accent, and that does not survive five semantic colours:
a danger button that turns the same white as everything else has stopped meaning danger. It is
barely available anyway — these fills sit at L 92%, leaving 8% of headroom toward white.

So hover and pressed **deepen the button's own colour**, toward `--color-ink`:

```
rest → hover 12% toward ink → pressed 22% toward ink
```

Mixing with `--color-ink` rather than `black` is what makes the recipes work in both themes: `ink`
inverts with the fills, so the same 12% deepens the luminous dark-theme accents and lightens the
deep light-theme ones.

**Declare a recipe on the element that sets its base.** A custom property is substituted where it is
_declared_, so a recipe written on `:root` that reads `var(--btn)` finds nothing, becomes invalid,
and silently paints transparent. This is why the recipes live in this component's BASE class list
and not in `styles.css`.

`ToggleButton` composes these same constants — `BUTTON_BASE`, `BUTTON_VARIANTS`, `BUTTON_SIZES` — and
so does its `.Icon` and `.Text`, through thin wrappers. A toggle that drifted a pixel from the button
beside it would be the most visible kind of drift there is.

**Still open:** the `outline` button's border is the accent at 40%, which measures 2.45:1 on the dark
page and 1.76:1 on the light. It needs roughly 49% and 69% respectively, so no single alpha fixes it
and raising it would visibly thicken the button. Left alone because it is the one boundary that is
arguably decorative — a button always carries a label at full accent strength, which identifies it,
whereas an empty input has only its own edge.
