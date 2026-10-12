# Link

The sheet's three links — `.ds-link-caps`, `.ds-link-url` and `.ds-link-viewmore` — as variants of one
component, because the sheet varies the _treatment_ rather than the colour.

```tsx
<Link href="/monitors" aria-current="page">Monitors</Link>
<Link variant="url" href="https://status.example.com">status.example.com</Link>
<Link variant="viewmore" href="/monitors">View more</Link>
```

| Variant    | Sheet               | Size(s)   | Hover                  |
| ---------- | ------------------- | --------- | ---------------------- |
| `caps`     | `.ds-link-caps`     | `sm` `lg` | 70% → full strength    |
| `url`      | `.ds-link-url`      | 12px      | turns teal             |
| `viewmore` | `.ds-link-viewmore` | 16px      | **gains** an underline |

### Three links, three jobs

Each hover derives from what the link _is_. A caps link is deliberately quiet at rest, so hover is
where it comes up to strength. A URL link is inside running text, where its underline already
carries the affordance, so hover is where it takes the accent. A view-more link wears the accent at
rest and has nowhere to go but an underline. Swapping any two would say the wrong thing about the
link — which is why `lg` is a _size_ (it changes the type and nothing else) and the other two are
not.

`caps` is the only one with two sizes, because `.ds-link-caps--lg` is the only `--lg` the sheet has.

### It is a real anchor, and `aria-current` is the current-page prop

React Aria's `Link` renders an `<a>`, so middle-click, the status bar and "open in a new tab" work —
which is the whole reason not to use a `div` with an `onClick`. The page you are on is marked with
`aria-current="page"`, the attribute the sheet's own `[aria-current="page"] { color: teal }` rule
reads; React Aria hands it over as `data-current` as well.

A plain `Link` has **no `isCurrent` prop** — `NavigationTree` does, and `Nav.Item` uses it. Inventing
one here would only be a second name for the attribute the browser and the stylesheet already
understand.
