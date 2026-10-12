# Card

One thing on the page, in the surface Modal, Tooltip and Toast already share: `bg-card`, a
boundary in `--border-strong`, the surface step of the radius scale — `rounded-xl`, square at the
sheet's `0` — and no shadow.

The slots are shadcn/ui's, name for name — so a card copied out of shadcn/ui keeps its shape when
it moves here:

```tsx
<Card>
  <Card.Header>
    <Card.Title>Frankfurt</Card.Title>
    <Card.Description>fra1 · 42ms</Card.Description>
    <Card.Action>
      <Menu.Trigger>…</Menu.Trigger>
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <Sparkline points={…} />
  </Card.Content>
  <Card.Footer>
    <Button variant="outline">Open</Button>
  </Card.Footer>
</Card>
```

| Slot               | Renders              | Notes                                                          |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| `Card`             | `div`                | The surface. Carries no padding — the slots do                 |
| `Card.Header`      | `div`                | A grid. Two columns **only** when a `Card.Action` is inside it |
| `Card.Title`       | React Aria `Heading` | An `<h3>` by default; `level` is a published prop              |
| `Card.Description` | `p`                  | The line under the title                                       |
| `Card.Action`      | `div`                | The right-hand corner of the header. One control               |
| `Card.Content`     | `div`                | The body — the chart, the table, the text                      |
| `Card.Footer`      | `div`                | A row of actions, over its own hairline                        |

Every root carries a `data-slot` — `card`, `card-header`, `card-title`, `card-description`,
`card-action`, `card-content`, `card-footer` — so a test can reach a part of the card without
knowing what the consumer put in it.

## The hairlines are the right way round

A card's own edge is `--border-strong`, at 40%. The rule under the header and above the footer is
`--border`, at 62%. The boundary is the quiet one and the rules inside it are the loud one, which
is the sheet's habit everywhere: Table draws its row separators at 62% inside a panel whose own
edge is 40%.

The reverse is what a box drawn around a rule looks like. It is worth stating out loud because
`strong` is the louder word and 40% the quieter alpha — the names are the ones the sheet's own
tokens used, and the values are what matter. The story asserts the pair, so a future rename that
swaps them fails rather than quietly inverting the surface.

## It is not pressable, deliberately

There is no `onPress`, and no React Aria primitive under the panels. A card is a surface, not a
control: a card that does something should hold a `Link` or a `Button` that says what the
something is. A pressable surface is a control with no name for a screen reader to announce and
no target to aim at, and it makes the real control inside it harder to find.

That is also why the action in a header is a slot rather than a prop — `Card.Action` takes a
`Button`, and the story presses it and checks what happened, because a control is only proven by
what it does.

## `Card.Title` is a heading

React Aria's `Heading`, not a styled `div`, so a page of cards has an outline a screen reader can
walk. It renders an `<h3>` by default and takes `level`, because a card nested inside a section
usually wants a different one.

## The action column is conditional

`Card.Header` is a grid, and it becomes two columns only when the header actually contains a
`Card.Action`:

```css
.has-data-\[slot\=card-action\]\:grid-cols-\[1fr_auto\]:has(
  [data-slot='card-action']
) {
  grid-template-columns: 1fr auto;
}
```

That is a `has-data-*` variant — the condition read off the DOM rather than handed in as a prop —
so a header with nothing on the right has nothing on the right: no empty second column and no
`justify` for a consumer to get wrong. The story asserts both cases, because a condition that
always applies looks exactly like a condition that works.

## What it is not

- **Not a link.** A whole card that navigates is a `Link` with a card's clothes, and React Aria's
  `Link` already reports itself as one. Put the link in the title or the footer, where it has a
  name.
- **Not a dialog.** If the card is a task that has to be answered before the page can be used
  again, that is a `Modal`.
- **Not padded.** The root carries the surface and nothing else, so a card holding a table can
  let the rows reach its edges. `Card.Content` is where padding comes from when it is wanted.
