# ActionBar

The actions for what is selected — a bar that arrives when rows are chosen and leaves when nothing
is. React Aria has no `ActionBar`, so it is built here out of the two things that do exist: React
Aria's `Toolbar`, which makes the bar one tab stop, and the sheet's floating surface, which the
popover, the sheet and the toast already share.

```tsx
const [selected, setSelected] = useState<Selection>(new Set(['fra1', 'iad1']))

<Table
  aria-label="Monitors"
  selectionMode="multiple"
  selectedKeys={selected}
  onSelectionChange={setSelected}
>
  …
</Table>

<ActionBar
  selectedItemCount={selected === 'all' ? 'all' : selected.size}
  onClearSelection={() => setSelected(new Set())}
>
  <Button size="sm" variant="ghost" color="neutral">
    Restart
  </Button>
  <Button size="sm" variant="ghost" color="danger">
    Take down
  </Button>
</ActionBar>
```

| Prop                | Type              | Notes                                                             |
| ------------------- | ----------------- | ----------------------------------------------------------------- |
| `selectedItemCount` | `number \| 'all'` | `0` renders nothing; `'all'` renders "All selected"               |
| `onClearSelection`  | `() => void`      | The clear button, and Escape while the bar has focus              |
| `isEmphasized`      | `boolean`         | The accent on the bar's boundary and its count, on by default off |
| `aria-label`        | `string`          | Names the toolbar. Defaults to "Selection actions"                |
| `className`         | `string`          | Appended to the surface's own list                                |
| `children`          | `ReactNode`       | The actions — `Button`s, one per thing that can be done to them   |

**It is a `role="toolbar"` with a name**, not a `div` with buttons in it, and that is the whole of what
React Aria adds: the bar is **one tab stop** and the arrow keys walk it, so four actions cost a
keyboard user one press of Tab rather than four. The name is a prop rather than a fixed string because
a page can have more than one bar — a table's and a chart's — and "Selection actions" twice tells a
screen reader nothing about which is which.

**It is not `Toolbar` with a different class list.** `Toolbar` is `flex items-center gap-1` on a
`rounded-md` surface with a `p-1` inset; this is a much larger bar on a `rounded-xl` floating panel.
Appending one class list to the other would leave two radii, two paddings and two sets of gaps on one
element, and which of each wins is decided by the order Tailwind emits them rather than the order they
are written — so the two components share the primitive and not the recipe.

### The count is the bar's, the selection is not

`selectedItemCount` and `onClearSelection` are React Spectrum's own pair, and they are what a design
system can honestly publish: **the bar reflects a selection, it does not own one.** The collection
owns it — React Aria's `Table`, `GridList` and `Tree` all report theirs through
`onSelectionChange` — and a bar holding its own copy would be a second source of truth for the same
fact, and the one that goes stale first.

That makes `onClearSelection` a **request**, exactly as `TagGroup`'s `onRemove` is: it says what the
user asked for and leaves the collection to do it. The consequence is a testing rule rather than a
naming one — clearing is only proven by the rows being unchecked, never by the callback having been
called, which is the mistake `TagGroup` already made once. `ActionBar.browser.test.tsx` asserts both
halves.

`'all'` is in the union because "412 selected" and "everything selected" are different facts about a
filter, and only the caller knows which one it has — a table that has selected every row _of what
matches_ is not a table with 412 rows chosen, and the wording should not pretend otherwise.

The count is a `role="status"` live region. The bar appearing is otherwise a purely visual event:
without it, a keyboard user who has just chosen a row is told nothing at all.

### Escape leaves selection mode, and only from inside the bar

React Spectrum scopes that key to the bar's own element and so does this, for a reason worth stating:
the selection belongs to a table the reader may be scrolled away from, so a key that empties it from
anywhere on the page throws work away with no visible source. Inside the bar, Escape is the way out of
selection mode — it is the same contract the reference has.

**And it is the key React Aria's own collections already answer.** `useSelectableCollection` defaults
`escapeKeyBehavior` to `'clearSelection'`, so a table or a grid list clears its own selection on
Escape with the bar nowhere near it — measured here rather than read off: a click on a row followed by
Escape empties the selection with focus still on the row. The bar is therefore not inventing a key; it
is saying the same thing in the second place a keyboard user ends up. That is also why the browser test
contrasts the bar with a page _button_ rather than with the table: a table would have answered on its
own, and the test would have proven React Aria's behaviour while claiming the bar's.

### `isEmphasized` is the accent boundary, not a repaint of everything inside

S2's emphasized bar flips to a high-contrast container and asks every button inside it to render in a
static colour — "the container decides how its controls look". That mechanism does not exist in this
system: every control sets its own `--btn` and derives its hover, pressed and disabled states from it,
so a container that repainted its children would leave a ghost button's accent label on an accent fill
and read as nothing at all. Emphasis here is therefore the accent on the bar's **own** boundary and
count: it says which bar is the live one without taking a single decision away from the controls in
it.

The class is a `data-[emphasized]:` variant rather than a second `border-*` utility, and that is not
cosmetic. The surface already declares `border-border-strong`; two border-colour utilities on one
element resolve by the order Tailwind emits them in the compiled stylesheet, so a component that looks
right in the source can render in the wrong colour and nothing in the file will show it. The attribute
selector outranks the plain utility whatever the order. The `Emphasized` story compares the bar's
boundary with the accent **as painted on a probe element in the same story**, so the assertion holds in
either theme and fails the moment the variant stops outranking the surface.

### What is deliberately not here

- **No `scrollRef`, and none of the container arithmetic that goes with it.** In Spectrum it positions
  the bar inside a collection's own scroll container and offsets it by that container's scrollbar
  width — and returns an `actionBarHeight` so the collection can reserve room for it. This library's
  collections are ordinary elements the caller composes, so there is no such container to measure. The
  bar is `fixed` to the viewport, which is where a bar over a page wants to be; a page whose last row
  must stay clickable wants a little bottom padding of its own.
- **No exit animation.** The entry is the shared mount animation in `styles.css`, keyed on
  `data-slot="action-bar"` — the same one every panel gets — and it respects
  `prefers-reduced-motion` like the rest. The exit has no hook to hang off: `useExitAnimation` is
  private to React Spectrum, and holding a bar with nothing selected mounted for 160ms to fade it out
  would be a state machine for polish.
- **The two sentences are English**, like `TagGroup`'s "Remove" and `Toast`'s "Dismiss". The count is
  the one string that has to agree with `selectedItemCount`, so it stays the component's; a system
  that needs another language needs it in the other three places too.

### Where the tests are, and why they are split

The states are stories: `Hidden` is the control for the bar existing at all, `AllSelected` is the
`'all'` wording, `Emphasized` is the variant winning, and `Keyboard` is the arrow keys walking the
bar and staying inside it.

**`Default` carries no `play` at all**, because a `play` runs when a story is _viewed_: one that chose
rows and then cleared them would be a machine working the same table the reader opened, and it would
leave them on a page with no bar to try. What that story demonstrates is covered in
`ActionBar.browser.test.tsx`, where nothing runs unless it is asked to — choosing a row brings the bar
up with the count that row implies, the header's select-all reads "All selected", clearing is proven
by the rows and not by the request, and Escape clears from inside the bar while leaving the page
outside it alone. The arrangement, and the reason for it, is the one `Form.browser.test.tsx` records.
