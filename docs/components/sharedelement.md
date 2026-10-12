# SharedElement

One element that moves between parents, animating from where it was to where it goes.

```tsx
<SharedElementTransition>
  {atTop ? (
    <header>
      <SharedElement name="marker" className="size-2 bg-teal" />
    </header>
  ) : (
    <footer>
      <SharedElement name="marker" className="size-2 bg-teal" />
    </footer>
  )}
</SharedElementTransition>
```

| Component                 | React Aria                | Notes                                    |
| ------------------------- | ------------------------- | ---------------------------------------- |
| `SharedElementTransition` | `SharedElementTransition` | The scope. Renders nothing itself        |
| `SharedElement`           | `SharedElement`           | `name` is required; `isVisible` optional |

## The pair is not optional

`SharedElement` **throws** without a `SharedElementTransition` ancestor — _"`<SharedElement>` must be
rendered inside a `SharedElementTransition`"_ — which is the same shape as `ColumnResizer` without its
container. `SharedElementTransition` renders no element of its own, so it has no class list and there is
nothing to style.

## `name` is the whole contract

Render the same `name` in a different place and React Aria treats it as **one thing that moved**, carrying
its animation with it, rather than as an element that vanished and another that appeared. It reports
`data-entering` and `data-exiting` while it does, and `isVisible={false}` animates it out instead of
unmounting it.

The story proves the part that is provable in the runner: the element starts inside one parent and, after a
press, the **same element by `name`** is inside the other. The animation between those two positions is not
asserted — what is asserted is the identity that makes it possible.

## One component here already uses it internally

React Aria's own `ToggleButtonGroup` — which this repo wraps — puts a `SharedElementTransition` around its
children, so a selected segment's fill can travel rather than blink. So the machinery is already live in
this library; what this file adds is the API for a consumer laying out its own moving thing, and the
documentation of a contract that is easy to get wrong.
