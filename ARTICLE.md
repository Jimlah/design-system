# Consistency you cannot opt out of

## What you get when you build on this design system

Every design system promises consistency. Most deliver a palette, a component library, and a wiki page that
says _please use the tokens_. Six months later the app has three greys, two hover treatments, and a checkbox
somebody assembled with no visible control.

This system is organised around that failure. It is not a set of components plus guidelines — it is a set of
components plus **checks**, and the checks are the product. What follows is what those checks actually
guarantee a team building on it, and — in one section near the end — exactly where each guarantee stops.

---

## 1. The palette is a rule, not a palette

Every colour in the system is one entry in one `@theme` block, and each entry holds **both themes**:

```css
--color-teal: light-dark(oklch(55% 0.0931 189.5), oklch(91.98% 0.1236 189.5));
--color-panel: light-dark(#f7f7f7, #0d1015);
--color-line: color-mix(in oklch, var(--color-fg) 62%, transparent);
```

You write `bg-panel`, not `#0D1015`. You write `text-fg`, and the three muted weights and four hairline
weights that go with it are **derived** from it, so changing the text colour moves all seven.

More importantly, the _states_ are not yours to choose. Hover and pressed deepen a control's own colour
toward `ink` rather than substituting a different one:

```
rest → hover 12% toward ink → pressed 22% toward ink
```

Because `ink` inverts with the fills, the same recipe deepens a luminous dark-theme accent and lightens a
deep light-theme one. A new accent gets a correct hover, a correct pressed, a correct disabled and a correct
focus ring **for free**, because the recipes read `var(--btn)` rather than restating a colour.

**What this removes:** two teams cannot pick two hover treatments, because there is nowhere to put one. The
only way to diverge is to write a raw hex, which is visible in review and against the house rules.

---

## 2. Light and dark cannot disagree

There is no `.dark` block, no second variable set, no media query. Switching themes moves **`color-scheme`**
and nothing else, because `light-dark()` resolves per element:

```css
:root {
  color-scheme: dark;
}
[data-theme='light'] {
  color-scheme: light;
}
```

**What this removes:** the entire class of "we added a colour and forgot the dark value", and the slower one —
a second token block that drifts until nobody trusts either. A subtree can also flip itself by setting its own
`color-scheme`, without redefining anything.

---

## 3. The invariants a type system cannot express are lint errors

Types say a prop exists. They cannot say _a `Radio` without an `Indicator` is a label with no visible control_,
because React Aria renders exactly the children it is given and supplies no default dot. Nothing in
TypeScript objects; the component compiles; the page ships with an invisible radio.

So this system carries local lint rules, and the requirements are declared once:

```js
'pulse/enforce-required-children': ['error', {
  rules: {
    Radio: ['Indicator', 'Text'],
    Checkbox: ['Indicator', 'Text'],
    TextField: ['Input'],
    NumberField: ['Input', 'Counter'],
    SearchField: ['Input'],
    DatePicker: ['Input', 'Button'],
    DateRangePicker: ['Input', 'Button'],
  },
  // When *every* listed member is present, the container becomes required and they must sit inside it.
  groups: {
    TextField: { container: 'Group', members: ['Input', 'Icon'] },
    SearchField: { container: 'Group', members: ['Input', 'Icon'] },
    NumberField: { container: 'Group', members: ['Input', 'Counter'] },
    DatePicker: { container: 'Group', members: ['Input', 'Button'] },
    DateRangePicker: { container: 'Group', members: ['Input', 'Button'] },
  },
}]
```

Read that as a list of things a consumer **cannot** get wrong: a radio you can see, a checkbox you can click,
a text field with somewhere to type, an icon and an input that are positioned against each other rather than
stacked, a date picker whose calendar can actually open.

**This is not theoretical.** The rule was switched on against a codebase whose tests were all green, and it
immediately found a `<Checkbox>` in a form story with no `Indicator` — a label with nothing to click. The tests
had passed because nothing asserted the square was there, which is the whole difference between a suite that
is green and a suite that is looking.

Two mechanisms make the rule safe to adopt:

- **`ignore` is per component and additive**, so an exemption is one entry beside the requirement, not a
  blanket `off` for a file. `Table.Selection` is exempt from the `Checkbox` rule and nothing else — the
  `Radio` requirement still applies in that file.
- **An exemption is verifiable.** `--print-config` prints what a file actually resolves to, because a config
  entry that matches nothing looks exactly like one that works:

```sh
npx eslint --print-config src/components/Table/Table.tsx \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['rules'].get('pulse/enforce-required-children'))"
```

---

## 4. One anatomy per job, so screens look alike

Every field in the system — text, textarea, select, combobox, number, search, date, time, colour — uses the
same slots in the same roles:

```tsx
<TextField>
  <TextField.Label>Title</TextField.Label>
  <TextField.Group>
    <TextField.Input />
  </TextField.Group>
  <TextField.Hint>One line, as it would read in a list.</TextField.Hint>
</TextField>
```

A consumer assembling a form has no decisions left to make about order, spacing or where the hint goes. The
same is true of `DatePicker`, whose documented shape is the only shape:

```tsx
<DatePicker defaultValue={parseDate('2026-10-11')}>
  <DatePicker.Label>Starts</DatePicker.Label>
  <DatePicker.Group>
    <DatePicker.Input />
    <DatePicker.Button />
  </DatePicker.Group>
  <DatePicker.Hint>Your local time.</DatePicker.Hint>
</DatePicker>
```

That shape is enforced partly by **subtraction**. `DatePicker` used to publish thirteen slots — including
`Popover`, `Calendar`, `Heading`, `Grid`, `Cell` and `Segment`, for rearranging the calendar by hand. Those
are internal now, and the export publishes six: `Label`, `Group`, `Input`, `Button`, `Hint`, `Error`. The
capability they carried was not lost; it was moved to a prop on the picker, where it cannot be used to build a
second, different date picker.

**What this removes:** the two-forms-that-look-different problem. There is no supported second way to assemble
a field.

---

## 5. The published surface is the only surface

Components publish a **curated** prop list, re-declared deliberately rather than inherited wholesale, and the
manifest that tooling reads is the same list:

```sh
curl -s http://localhost:6006/manifests/components.json
# Avatar → ['alt', 'className', 'color', 'isPreviewable', 'size', 'src']
```

That matters more than it sounds. The manual tells any collaborator — human or AI — to trust this manifest
over its own assumptions, and to read the right key inside it. So "does this component take `shadow`?" has a
factual answer rather than a plausible one, and a proposed variant that does not exist is visible as a
proposal rather than merged as a near-miss.

**What this removes:** the slow accumulation of one-off variants. You can only pass props that exist.

---

## 6. The behaviour is specified as tests you can read

There is no separate test suite. Each component's stories are its acceptance criteria, and each one runs in a
real browser: 54 components, 55 story files, **311 tests**.

They assert measurements rather than presence — that a broken image falls back to initials and the initials are
the right two letters; that a slider's thumb is square rather than merely not-round; that an avatar's preview
measures over 200px; that a map's pixels are the two colours they should be, sampled at each dot's centre.

Every root also carries a `data-slot`, so a consuming team can write its own tests against stable hooks instead
of class names.

**What this removes:** the argument about what a component is _supposed_ to do. If you are unsure whether a
disabled danger button keeps its colour, a story asserts it — and if the behaviour regresses, the failure lands
here rather than in five downstream apps.

---

## 7. Where each guarantee stops

This is the section most design systems omit, and it is the one worth reading twice. The checks are strong, and
none of them is a wall.

| The promise                    | Enforced by                          | How a determined consumer bypasses it         |
| ------------------------------ | ------------------------------------ | --------------------------------------------- |
| One palette, one set of states | Tokens exist only in `@theme`        | Writing a raw hex or an `rgba()` in a feature |
| Light and dark stay in step    | A single `color-scheme` switch       | Defining your own `[data-theme]` block        |
| Controls render something      | The lint rule                        | `ignore` in your config, or an inline disable |
| One anatomy per job            | Slots, docs, and the trimmed exports | Using React Aria's primitives directly        |
| Only real props                | The manifest                         | Not reading it                                |
| Behaviour is specified         | The story suite                      | Forking and not running it                    |

Two more limits, stated plainly:

- **The lint rule only sees JSX.** It cannot read a `<Radio>` written inside a markdown example or a template
  string — which is precisely where the missing-`Indicator` bug was first spotted. Documentation examples are
  verified by eye, not by a machine.
- **The rule only fires where the component is imported**, and it matches on the tag name. An aliased import
  (`import { Radio as R }`) is invisible to it.

None of this makes the checks decorative. It makes them _honest_: they catch the mistakes people actually
make, and they say so when they can't.

---

## 8. Why this matters more when an AI is in the loop

An AI writing UI produces inconsistency in a specific way: it proposes plausible things that do not exist. A
`shadow` prop. A sixth button variant. A `<Radio>` with a bare text child, because that is what the markup
looks like it should accept.

This repository is arranged so that those proposals are checkable rather than persuasive:

- the **manual** says which React Aria props exist and which do not, and gives the differences that trip people
  up (`isDisabled`, not `disabled` — and `isPending` renders no native `disabled` attribute at all);
- the **per-component doc** records the decisions already made and the mistakes already paid for, and is meant
  to be read before that component is changed;
- the **manifest** answers "what props does this take" factually;
- the **lint rule** turns the invariants into errors at the point of use.

And the honest half: **an AI still writes bugs.** In the work that produced this system, an AI wrote all three
of the traversal bugs in the lint rule above, misdiagnosed three correct components as violations, and
assembled a story with a picker nested inside itself. Every one was caught — by a must-pass control, by a
measurement, by `--print-config`, by running the suite twice to separate a flake from a failure.

The value is not that the AI is careful. It is that **the repository makes carelessness visible**, which is the
same thing it does for the team.

---

## 9. Adopting it

1. **Consume the components, not the primitives.** The whole guarantee — anatomy, states, accessibility — is
   in the component.
2. **Never override a token per feature.** If a screen needs a colour that is not in the palette, that is a
   conversation about the palette.
3. **Run the local lint rules in your repo**, not just here. They are the part of the system that travels.
4. **Treat the stories as the contract.** If your product needs a behaviour no story asserts, add the story
   first — that is how this system grew.
5. **Read `docs/components/<name>.md` before changing that component.** It is short, and it exists to stop you
   re-deriving a settled decision.

The numbers, each measured rather than remembered: **54 components**, **55 story files**, **311 tests**,
**389 published props across 53 components**, and **76 lint rules** resolving for a single source file — **68
of them at error severity**.

A design system is not the components. It is the set of mistakes your team can no longer make.
