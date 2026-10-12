# Breadcrumbs

A trail back up the hierarchy, where the last step is the page you are on.

```tsx
<Breadcrumbs label="Breadcrumb">
  <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
  <Breadcrumbs.Item href="/monitors/fra1">fra1</Breadcrumbs.Item>
  <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
</Breadcrumbs>
```

| Slot               | React Aria    | Notes                                                       |
| ------------------ | ------------- | ----------------------------------------------------------- |
| `Breadcrumbs`      | `Breadcrumbs` | The trail. `label` names the `<nav>`                        |
| `Breadcrumbs.Item` | `Breadcrumb`  | One step. `href` makes it a link; without one it is current |

**The sheet has no breadcrumb in it**, so the arrangement is an invention — but every visible part is
borrowed: the sheet's own `.ds-link-caps` for the steps, its softest line tone for the punctuation,
and its muted-to-full-strength hierarchy for the trail above you.

### React Aria renders the list and not the landmark

`Breadcrumbs` is an `<ol>` — **no `<nav>` around it and no role on the list.** The first version of this
component was therefore a list of links sitting in no landmark at all, so a screen reader's landmark
list offered no way to reach it. A breadcrumb _is_ navigation; the wrapper is this component's job, so
`Breadcrumbs` draws the `<nav aria-label>` itself and the `label` prop goes there rather than through
to React Aria.

### The slash is a pseudo-element, and that is right here

It belongs to the item, not to the list, and `last:after:content-none` is what stops a trail ending in
a stray `/`. A pseudo-element is correct for it — a slash carries no text, cannot be pressed and needs
no accessible name — which is exactly why the caret in `Nav` could **not** be one.

### The steps are `shrink-0`

Without it a flex item happily narrows mid-word, so three steps sat on one line in a 176px container
with every word squeezed and `flex-wrap` never had anything to wrap. `Wraps` found it.

### A link that really navigates kills the test runner

Worth knowing before writing an interaction story about anchors. `userEvent.click` on a step with a
real `href` **navigates the story's own frame away**, and the symptom is `[vitest] Browser connection
was closed while running tests` with three of six stories passing and no failing story named at all —
because the runner never got to name one. The `Keyboard` story now asserts that every step is a
reachable anchor at `tabIndex 0` and **does not press it**. Following a link is the browser's job.

### The type belongs to the link

A step is a caps link, and the **link owns its type** — `.ds-link-caps` at 14px and `-0.01em`, with
`--lg` the only larger size the sheet has. A font size on the item would lose the cascade to the
link's anyway, and pretending otherwise made the assertion wrong twice before it was deleted.
