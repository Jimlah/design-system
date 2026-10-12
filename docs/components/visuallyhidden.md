# VisuallyHidden

Text for screen readers and nobody else.

```tsx
<Uptime>
  Uptime
  <VisuallyHidden>— checked every 60 seconds</VisuallyHidden>
</Uptime>
```

**It is not `display: none`, and it is not `visibility: hidden`.** Both of those take the text out of the
accessibility tree as well as off the screen, which is the opposite of the point. This keeps the text in the
tree at a clipped one-pixel box — the `sr-only` technique — so a screen reader reads it and the page does not
move.

The story asserts both halves, because either one alone is trivially satisfiable: the element is **visible**
to the accessibility tree (`display` is not `none`, `visibility` is not `hidden`), and its box is at most one
pixel in each direction with a `clip-path`.

It is a component here because several others had hand-written the same `sr-only` span, and a visually hidden
thing is easy to get subtly wrong: `width: 1px` without `white-space: nowrap` wraps the text into a column,
and a missing `clip-path` leaves it sitting over the content it was meant to hide behind.

## It renders a `span`, not a `div`

React Aria's `VisuallyHidden` defaults to a `<div>`. This component's whole job is to sit inside a
sentence — `Uptime <VisuallyHidden>checked every 60 seconds</VisuallyHidden>` — and a block box there is
both invalid HTML and a layout bug: the browser reports _"a `<p>` cannot contain a nested `<div>`"_ while
the text reflows around an invisible block.

The default is now `span`, which is what an inline helper should be. A consumer who genuinely needs a
block can pass `elementType`.

**The only evidence was a console line.** Every assertion in the story passed with the `<div>`, because
they all measured the clip — the box, the `clip-path`, the visibility — and none of them asked what
element it was. The story now asserts `tagName === 'SPAN'`. This is the fourth time in this repo that a
passing suite was silent about a real defect, and the first time the defect announced itself in stderr
rather than in a screenshot.
