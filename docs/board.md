# The task board

`/board` is this system's second worked example, after the sign-in page: four columns of cards you can
drag between them, with a sheet for the detail behind each one. It is a page — `src/examples/TaskBoard.tsx`
with its body in `src/routes/board.tsx`, no story, no entry in the components manifest — for the same
reason `Login` and `Create` are: a story is what publishes a _component_, and this is a page that uses
fifteen of them.

It is tested by `src/examples/TaskBoard.browser.test.tsx` in the `components` project. Twenty tests, and
the split they are built on is the point of the example:

| What                  | Where                   | How it is held to account                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| What a move _means_   | `src/examples/board.ts` | plain functions over `Task[]`, asserted directly                                 |
| What a drag _reaches_ | `TaskBoard.tsx`         | a real mouse drag and real key events in a browser                               |
| What a person can do  | `TaskBoard.tsx`         | `userEvent` through the menu, the sheet and its picker, the composer, the filter |

## The board is a list that arrives

The board is built on React Aria's `useAsyncList`, and that is the data layer rather than a flourish.
What the page needs from its data is what a request gives it: something that arrives later, reports
whether it is loading, can be re-fetched, and owns the operations a collection needs. So the page keeps
no task array of its own. `fetchBoard` is the `load` — what this browser stored, or the sprint the page
starts with — the board draws `list.items`, every change is a list operation (`insertAfter`,
`moveBefore`, `moveAfter`, `update`, `remove`), and Reset and Undo are a re-fetch: they put a board back
where the memory reads from and ask for it again, which is the same path the page took to open.

Three things that cost real bugs, and are worth knowing before touching it:

- **The list moves cards; it has no idea which column a card is in.** Order is the list's and membership
  is this board's own field on the task, so a move across columns is _both_: the card is re-labelled and
  then moved. Doing only the second is a drag that appears to do nothing — and that is exactly what this
  page shipped for one round, with the state holding the card in the right place while the column it
  belonged to said otherwise. It was found by dumping the list's own order, which was correct, next to
  the board's, which was not.
- **A list's state starts `idle`, not `loading`.** "Not loading" is therefore true before the first fetch
  has even been dispatched, and a write-through effect keyed on that alone writes an empty board over a
  stored one _before_ the fetch reads it. The flag the page gates its write on is set by the load
  function when it returns.
- **A fetch that resolves in the same tick has no loading state to render.** `fetchBoard` waits a beat
  deliberately (220ms, as the library's own `LoadMore` story does), and the page renders that state: a
  `ProgressBar` named for the sprint, in place of four empty columns. Nothing is drawn until the board
  is there, which is also what keeps the summary from announcing "0 open" for a fifth of a second.

## The board owns the decisions, the list owns the order

`board.ts` keeps what is this board's rather than any list's: which cards a filter keeps, what a column's
foot is, what a drop lands against, and the numbers in the header. There is one coordinate a drop has —
_against this card, on this side_ — and the list moves things by key, so the two agree without an index
anywhere:

```ts
interface Drop {
  anchor: string | null
  side: 'before' | 'after'
}
```

`footAnchor` is the interesting one. A drop into a column's own space names no card, so it names that
column's **last** card — and when the column is empty, the board's last card, which is the same place in
the order the board renders. An index would not do: an index is a position on screen, and a filter hiding
the card in between would move the landing place out from under the drop.

**And it has to be asked with the board's tasks, which is a bug this page shipped.** The two are the same
list for a column with cards in it, so the difference never shows until a column is _empty_: asked with
the column's own (empty) list, `footAnchor` has nothing to name and returns `null`, and a drop with
nothing to land against is the board's one no-op — so **a card could not be dragged into an empty column
at all**, which is the first thing anyone does with a kanban column they have just finished. Every
anchor is now computed in `TaskBoard` and handed down, because it is the only thing that has the whole
list; the column cannot get it wrong because it no longer computes it. Measured after the fix, with the
browser: three cards dragged to Done's foot empty the In review column, and the next card dropped into its
space lands in it ("PL-1041 moved to In review.").

**The filter narrows the screen and never the board.** `matchesFilter` decides what is drawn; nothing
moves, and a drop beside a visible card lands where the column actually holds it. The column says
"1 of 4" while it is filtered, which is the honest reading: one card on screen, four in the column.

## Drag and drop, in React Aria's terms

**Every column is its own collection with its own `useDragAndDrop`** — the hooks are per collection, so
the board cannot own one set. A drag _within_ a column is internal to React Aria and arrives at
`onReorder` with the dragged keys; a drag _between_ two columns is external to the receiving one and
arrives at `onInsert` with `DropItem`s. So the identity of a dragged card travels as a MIME string:

```tsx
getItems: (keys) =>
  [...keys].map((key) => ({
    'text/plain': task.id + ' ' + task.title,
    'application/x-pulse-task': String(key),
  }))
```

`acceptedDragTypes: ['application/x-pulse-task']` is what keeps a file dragged in from the desktop from
finding a drop target at all, rather than a target that quietly does nothing. `getDropOperation` returns
`'move'` for everything: a second copy of the same card is never what a drag meant.

## Four things the library does not do here

Each of these was measured in a browser, with a real mouse drag, and each is the reason the code looks the
way it does.

**The drop mark had to be moved out of the flow.** Passing `renderDropIndicator` gets a styled
`<DropIndicator>` rendered between two rows — `docs/components/gridlist.md` had recorded the opposite
(built, drawing nothing through an entire drag, removed) and the difference is worth keeping: what that
measurement saw was the _column's_ target, which is drawn by a separate and unstyled element the option
never reaches. Styled `absolute inset-x-0`, the mark then rendered at the top of the column whatever card
the pointer was over — a mark that lied about where the card would land. The static position of an
absolutely positioned child of a **flex container** is the container's own start corner, not where the
element sits in the flow, and a collection is a flex column. Left in the flow with `-my-[5px]` to cancel
its height and the two gaps around it, the mark sits in the gap it names, 2px tall and as wide as the
column (measured: 336×2 at the gap the pointer was over), and the cards below do not jump.

**The board has no "on" target, and the middle of a card is a dead zone for a drag inside its own
column.** React Aria tries an "on" target first, and a drag within the same collection always refuses
one: a list _reorders_ between items, and `onReorder` takes before and after only. `shouldAcceptItemDrop:
() => false` is the documented way to say the board has no such operation, and it is also what settles
the geometry, because the list's drop-target delegate then falls back to before or after **by which half
of the card the pointer is over** rather than by a five-pixel rim. Every drop names a card and a side, and
the line above is the only mark the board draws.

The dead zone does not go away, and this is the measurement rather than the reasoning. With no "on"
target, a same-column drop **in the gap between two cards** and **on a card's top edge** each produce a
target and draw the line; the **middle of a 233-pixel card** produces no target at all — no indicator, no
handler, no move. A hand-written `dropTargetDelegate` was tried against this: it returned a before/after
for every position, and a probe from inside it showed the collection accepting all eight of the four
cards' before/after targets, and React Aria still set no target for the middle position. It was removed
rather than shipped, the same call `DropIndicator` got for the same reason. **Across columns there is no
dead zone at all** — an insert is valid for a drop anywhere on a card, measured at the gap, the top edge,
the bottom edge and the middle — so the gesture that always works is the one the board is for: drag a card
to another column, drop it anywhere on a card there. Reordering inside a column is a drop _between_ two
cards.

**A drop into a column's empty space has no visible mark.** The target there is the whole collection, and
React Aria draws it as an aria-hidden row with a visually-hidden button and no class hook of its own. The
line above is the option for a target _between two cards_; the empty column is left to its own empty state
("Nothing here yet — drag a card in, or add one below") to say that it will take one.

**A keyboard drag reorders within a column; it does not travel between columns.** With the drag button
focused, Enter picks the card up and React Aria announces the place it would land ('Insert between',
`aria-label` and all — verified by driving real key events). The arrow keys move that place _within the
column_: holding ArrowRight left the target where it was in all four presses. Moving a card to another
column without a pointer is therefore the card's menu, which is a plain `Menu`: a "Move to" section that
names a column, and an "Order" section with **Move up** and **Move down**.

**Those two are the answer to the dead zone above, and they are not a second implementation.** They ask
`stepDrop` in `board.ts` for the card to land against, and the menu hands the same before/after to the
same list move a drop does — so the two paths cannot drift apart. They disable themselves at the ends
("up" against the first card of its column is not a move, it is the absence of one), which is a state a
drag has no way to express. The board's own status line says which happened: "moved within Backlog" when
the card stayed in its column, "moved to In review" when it did not.

**Shift and a click does not select a range, and the page says so because it was measured.** React Aria
1.22 has no shift-click range on a collection: a click toggles the card it lands on, so clicking two cards
selects those two and nothing between them. Shift _does_ extend a run from the keyboard, where the arrows
move the focused card and the span follows it — and the select-all gesture takes the column. Both are
asserted in the suite, and the board's own footer says what they do rather than what a desktop file
manager would.

## The date field is a picker

The sheet's due date is `DatePicker`, not a text field wearing `type="date"`: a picker is the one field a
person can use without knowing what this locale's date format is. Its value is a `DateValue` — a calendar
date, not an instant — so the two ends are `parseDate` and `toString()`, and everything between them (the
model, the storage, the card's own due label) stays an ISO date with no time zone to get wrong. The test
opens the calendar, chooses the 15th, saves, and asserts the card reads "In 3d" — the whole path from a
clicked day to a card's label.

Two smaller decisions in the same sheet: the footer is `sticky bottom-0` because eight fields do not fit
a 96-wide sheet and the footer is where Save is — a page whose only way to keep a change is to scroll to
the end of a form you have already filled in is a page that loses changes, and the same fact is what made
one test flaky, since a hit-testing click on a button below the fold cannot land. And the editor's tags
are a `TagGroup` whose chips need a `textValue`: React Aria warns, in the console, for a chip whose
children are not plain text, and a warning nobody reads is how a real one gets missed.

## The real drag, and why the test suite does not drive it

`userEvent` cannot drive React Aria's drag — the same limitation the resizable table hit — so the drag
itself is verified by hand and recorded here. What the suite _does_ drive is everything a person's events
can reach: the load and its loading state, the menu's move, the sheet's edit, its unsaved draft and its
date picker, the composer, the filter, undo, the stored board, selection, and the arrow keys walking a
column.

The browser run, with Playwright against the dev server:

| Drag                                                                                        | Result                                                                         |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PL-1041 from Backlog onto the middle of a card in In review                                 | `1049, 1041, 1050, 1051` — the side follows the pointer, both halves of a card |
| PL-1041 from Backlog into the gap above a card in In review                                 | `1049, 1041, 1050, 1051` — between the two it was dropped between              |
| PL-1041 within Backlog, dropped in the gap above the third card                             | `1042, 1041, 1043, 1044` — reordered, membership untouched                     |
| PL-1041 and PL-1043 selected, then PL-1041 dragged onto a card in Done                      | `1041, 1043, 1052, 1053, 1054` — both moved, in the order they were selected   |
| The three cards of In review dragged to the foot of Done, then PL-1041 into its empty space | `PL-1041` alone in In review — a root drop, into an **empty column**           |
| PL-1043, with the board filtered to `latency`, into the column the filter emptied           | `PL-1043` — the whole column took the card, which is what a root target means  |
| PL-1042, picked up by its grip and moved with the arrows                                    | moved one place down; Escape puts it back                                      |

## What it keeps, and what it is not

The page has no server, so what it remembers it remembers in `localStorage`, written on every change and
read by `fetchBoard`. `decodeBoard` trusts nothing that comes out of that key: a task in a column that
does not exist is dropped, a second task whose id has been seen is dropped (every drop target, selection
and edit is keyed by the id, so a duplicate is the one corruption a board cannot survive), and a payload
that is not a board at all returns `null` so the page seeds the sprint rather than opening empty.
`decodeBoard` returning `null` rather than an empty array is also why `fetchBoard` reads it with `??`: an
empty board is a board somebody emptied on purpose.

Three deliberate gaps, so they are not mistaken for oversights. Nothing is enforced: a column over its
limit says so in the warning colour and lets you do it anyway, which is what a limit is on a board — a
thing to see, not a wall. Files dragged in from the desktop are ignored by `acceptedDragTypes`. And there
is no swimlane, no sprint filter and no server: the list's own operations are the seams a real
application would point at an API, and the page is the whole of the storage.

## A case-insensitive filename is a trap

The model module is `board.ts` and not `taskBoard.ts`, and that is not a preference. It began as
`taskBoard.ts` beside `TaskBoard.tsx`, and `import { TaskBoard } from './TaskBoard'` then failed with
"does not provide an export named 'TaskBoard'" — because Vite resolves extensions in order and macOS
resolves paths case-insensitively, so `./TaskBoard` found `taskBoard.ts` first. It would have worked on a
Linux checkout and broken on a Mac, or the other way round. `Create.tsx` beside `createTheme.ts` never had
the problem because no module name is one of the other's names with the case changed.
