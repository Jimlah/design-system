# TagGroup

The sheet's `.ds-tag`: a 12px uppercase chip, in the seven treatments the sheet defines — which is
why there are seven.

```tsx
<TagGroup aria-label="Regions">
  <TagGroup.List>
    <TagGroup.Tag id="fra1" variant="teal">
      fra1
    </TagGroup.Tag>
    <TagGroup.Tag
      id="iad1"
      variant="outline"
      href="/monitors/iad1"
      textValue="iad1"
    >
      iad1
    </TagGroup.Tag>
  </TagGroup.List>
</TagGroup>
```

| Slot             | React Aria | Notes                                    |
| ---------------- | ---------- | ---------------------------------------- |
| `TagGroup`       | `TagGroup` | The set. `selectionMode`, `disabledKeys` |
| `TagGroup.Label` | `Label`    | The sheet's `.ds-field-legend`           |
| `TagGroup.List`  | `TagList`  | The chips, wrapping                      |
| `TagGroup.Tag`   | `Tag`      | One chip. `variant`, `href`, `id`        |

| Variant                  | Sheet              | Treatment                  |
| ------------------------ | ------------------ | -------------------------- |
| _(default)_              | `.ds-tag`          | 70% text, transparent edge |
| `outline`                | `.ds-tag--outline` | an edge at 45%             |
| `teal` `gray` `yellow`   | the three fills    | the fill, carrying `ink`   |
| `outline-ring` `-yellow` | §18's two          | accent edge and text       |

### A selectable or removable chip needs an `id`

`selectedKeys` and `disabledKeys` speak in the tags' `id`s, exactly as `Table.Row` and
`Accordion.Item` do. Without one React Aria generates a key, and `defaultSelectedKeys={['fra1']}`
matches nothing: the story renders, every chip is enabled, and the assertion fails on a missing
attribute rather than on a wrong colour.

### React Aria's `Tag` is a grid row, and provides neither a link nor a remove button

It renders `div[role="row"]` inside `div[role="grid"]` — the same shape as its table and its tree —
and an `href` becomes `data-href` with nothing to click, while `onRemove` becomes
`data-allows-removing` with nothing to press. So `TagGroup.Tag` draws both from the render props: an
anchor when it has an `href`, and a `<Button slot="remove">` when the group allows removing. Same
reason `Table.Selection` writes its own slot — the one attribute that makes it work is the one nobody
remembers.

An early version wrapped every label in a `<span>`, and React Aria answered at runtime: _"A
`textValue` prop is required for `<Tag>` elements with non-plain text children."_ A chip that is not
a link now keeps its text **bare**, so the name can still be read off the markup; only a link, which
needs the wrapper, asks for `textValue`.

### The chip's hover is `:hover`, not `data-hovered`

Everywhere else in this system `data-[hovered]` is right, because React Aria supplies it. `Tag` does
not: a real pointer hover leaves the tag without the attribute, which this component's own test
found. So the chip's hover is the browser's own pseudo-class — correct for a user, and not
reproducible from the test runner. The Hover story was therefore **deleted** rather than written to
assert something else, the same call as the tooltip's hover.

### Hover deepens the tag's own colour

The sheet's `a.ds-tag:hover { filter: brightness(1.08) }` cannot survive five fills: on a near-white
yellow it is invisible, and on any of them it says nothing about _which_ tag the pointer is on. Fills
deepen toward `--ink`, the recipe the button uses; the two accented outlines have no fill to
deepen and take a wash of their own colour instead. Both derive from the base, and the `--tag-hover`
is declared by each variant and read by the base list, so the two land on the same element.

The `outline` edge is `--input` rather than the sheet's 35% white, which measures under
the 3:1 a boundary needs — the correction `--input` exists for.

## Removing a tag is your job, not the component's

**This is the part the docs left out, and it produced a chip with a working remove button that removed
nothing.** `onRemove` is not a command — it is a _report_. React Aria hands you the keys the user asked to
remove and stops there, because the group does not own the collection. A group whose handler does nothing is
a control that does nothing when pressed:

```tsx
// The story shipped this first. The button worked, the tag stayed, and the test passed.
;<TagGroup onRemove={() => {}}>…</TagGroup>

// The pattern to copy: hold the keys, and drop the removed ones.
function Regions() {
  const [keys, setKeys] = useState(['fra1', 'iad1'])
  return (
    <TagGroup
      onRemove={(removed) =>
        setKeys((cur) => cur.filter((k) => !removed.has(k)))
      }
    >
      <TagGroup.List>
        {keys.map((key) => (
          <TagItem key={key} id={key}>
            {key}
          </TagItem>
        ))}
      </TagGroup.List>
    </TagGroup>
  )
}
```

The signature is `(keys: Set<Key>) => void`, so a tag is dropped by filtering on something like
`removed.has(key)` — not by index.

### And the test that missed it

The story counted two remove buttons and checked their accessible names. Both true, both useful, and neither
one presses anything — **a remove control is only proven by the thing being gone.** The story now clicks the
first one and asserts the chip is no longer in the document, that the other one still is, and that the button
count fell. This is the same gap as `ToggleButton`'s off state: an assertion about what was _built_ rather
than about what it _does_.
