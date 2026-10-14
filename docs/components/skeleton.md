# Skeleton

A placeholder that keeps the layout of the content it stands in for.

```tsx
<Skeleton isLoading={isLoading}>
  <Card>
    <Card.Header>
      <Card.Title>Uptime</Card.Title>
      <Card.Description>api-gateway · last 24 hours</Card.Description>
    </Card.Header>
    <Card.Content>Every monitor answered inside its window.</Card.Content>
  </Card>
</Skeleton>

<Skeleton className="h-4 w-40" />
```

| Prop        | Type        | Default | What it is                                                             |
| ----------- | ----------- | ------- | ---------------------------------------------------------------------- |
| `children`  | `ReactNode` | —       | the content being stood in for. With none, the placeholder is a box.   |
| `isLoading` | `boolean`   | `true`  | `false` renders the children as they are, with no element of its own.  |
| `className` | `string`    | —       | the placeholder's own box: `h-4 w-40`, `size-10 rounded-full`, `h-24`. |

## How React Spectrum's works, and what had to change here

React Spectrum's `Skeleton` **renders no element at all**. It publishes a context — `SkeletonContext`
and `useIsSkeleton` — and the components that can be skeletonised read it and draw themselves as
shimmering boxes: `Text`, `Image`, `Icon`, `Link`, `StatusLight`, `Badge` and `Meter`. Form
components inside one are disabled. So the placeholder is composed of the components' real shapes,
and the docs can list exactly which components are affected — which is also the catch: a component
that does not read the context keeps rendering as itself.

Its shimmer is one class, `loadingStyle`: a three-stop gradient 300% as wide as the box, plus
`* { visibility: hidden }`. The sweep is a Web Animation rather than a CSS keyframe, so that every
skeleton on the page can be given `startTime = 0` and share one phase, and it is not created at all
under `prefers-reduced-motion`.

**This library has no `Text`, no `Image` and no `Icon`** — the sheet has no typography component —
so there is nothing for that context to attach to, and a skeleton cannot be built out of components
that are not here. The shimmer therefore goes on the element this component renders, which wraps the
content instead. The property that matters survives: the content is hidden but **still laid out**, so
the placeholder's box is the box the real content will occupy, and the page does not move when it
arrives. What is lost is one gradient per component; what is gained is that any markup can be
skeletonised without the per-component opt-in React Spectrum's own library needed.

The context is published anyway, and it is the one part of the React Spectrum mechanism that had to
survive, because it is the only way a _consumer's_ component can tell it is inside a placeholder and
skip work nobody can see. `Skeleton.stories.tsx`'s `OptIn` story is one.

### The gradient is mixed from the placeholder's own colour

The highlight is `color-mix(in oklch, var(--foreground) 12%, var(--muted))`, not a second grey. Every
hover and pressed state in this system already derives from its base rather than substituting a
colour, and the same rule pays off here: `--foreground` inverts with the theme, so one declaration
lightens the dark theme's placeholder and darkens the light theme's. 12% is `TRACK_WASH`'s wash — a
step you can see across a card and cannot mistake for a border.

The stops sit at 33% and 66% of a gradient that is three times the box's width, which is why a
placeholder at rest — the reduced-motion case — shows the flat `--muted` end of it rather than a
band parked in the middle of the box.

### `visibility`, not `display`

`[&_*]:invisible` takes the subtree out of the picture **and the accessibility tree** while leaving
every box exactly where it was. `display: none` would collapse the placeholder to nothing, which is
the one thing a skeleton must not do; and hiding the _wrapper_ instead would hide the shimmer as
well.

### Three things are not left to the caller

- **The subtree is `inert`.** Nothing inside is visible, so nothing inside may be tabbed to, clicked
  or announced. That is also how React Spectrum disables the form components in a skeleton, without a
  second prop for a consumer to remember. `Skeleton.browser.test.tsx` presses a button inside one and
  checks focus does not land.
- **The sweep is synchronised across the page.** Every skeleton sets its `startTime` to `0`, React
  Spectrum's own technique. A CSS keyframe starts when each element mounts, so two placeholders that
  appeared a second apart are visibly out of step and read as two things loading rather than one
  screen. `Synchronized` is the story that measures it.
- **`prefers-reduced-motion` is honoured**, and what is left is a _still_ placeholder rather than no
  placeholder: the movement the reader asked to be spared, not the state.

### No element at all once it is loaded

With `isLoading={false}` this component renders its children and nothing else — no wrapper to work
around, and no `data-slot="skeleton"` in the page. **The root only exists while the placeholder
does**, which is worth knowing before writing a test that queries it: the honest assertion while
loaded is that it is _absent_, not that it is invisible. `Loaded` is that story.

## Granularity is the caller's

Wrap a whole card and it shimmers as one surface; wrap each line and each one shimmers on its own.
The second is how a skeleton screen is usually drawn, and it needs no content at all — a bare
placeholder is sized entirely by `className`:

```tsx
<div className="flex flex-col gap-3">
  <Skeleton className="h-4 w-40" />
  <Skeleton className="h-3 w-full" />
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
</div>
```

**The wrapper is a block box**, which is what a placeholder surface is: it is the container's width
and the content's height. A placeholder that has to sit _inside_ a line of running text therefore
does not have a form here — put the bar in a block-level parent, sized as a line, or wrap the line
it belongs to.

**A placeholder is not a spinner.** A spinner says something specific is happening and is used for
one control's pending state (`isPending` on `Button`); a skeleton is used when a _region_ is being
fetched and its shape is already known. Using both in the same region says it twice.
