## `RadioButton` and `CheckboxButton` are not components you can consume

They look like the obvious API — `RadioButton` is even named like a member — and they are **React Aria's
internal renderers**. `Radio` ends with:

```tsx
<InternalRadioContext.Provider
  value={{ ...aria, inputRef, defaultClassName: 'react-aria-Radio' }}
>
  <RadioButton {...props} ref={ref} />
</InternalRadioContext.Provider>
```

So `RadioButton` **is** the implementation of `Radio`, and `Radio` passes its own `children` down to it. A
`RadioButton` written inside a `Radio` is therefore rendered _as well as_ the one `Radio` builds itself, and
the member ends up with two hidden inputs. The measurement: `getAllByRole('radio')` returned **6 for a group of three**.
That was taken while a `Radio` segment variant existed; the variant is gone, but the double input is not —
it belongs to `RadioButton`, and a plain group reproduces it just as well. The same holds for `CheckboxButton` and `Checkbox`.

**`RadioButton` is therefore not something to consume.** A wrapper around it was written first, could not be
used as intended, and was deleted — `RadioButtonProps` does not even accept a `value`, which is the first clue.
It was briefly reached for again as a `variant="segment"` on `Radio`; that variant has been removed, and the
reason it had to wrap `Radio` rather than `RadioButton` is the paragraph above.

## Two assertions that could not fail, and a real bug

**`getByRole('radio')` returns the visually hidden `input`, not the painted control.** It carries the
semantics and is a transparent pixel box; the painted thing is the `label` around it. Two versions of the
assertion measured the input and reported transparent against a control that was correctly checked on screen.
The version that holds queries the **state** — `label[data-selected]` — rather than indexing into a list whose
order the DOM never promised.

**One version compared a value with itself** (`chosen === chosen`), which cannot fail and therefore asserted
nothing while looking like a check on the fill. It was written by the same hand that has been criticising
exactly this all session.

The bug hiding under all of it: `Radio.Group` carried **both** `flex-col` (from its base) and `flex-row` (added
for horizontal), so which direction won depended on the order Tailwind generated the two utilities in — not
on the class list. The direction is now chosen in one place.

## The parts — including `Radio.Indicator`, which this file never mentioned

Every slot the compound exports, and what each one is for:

| slot              | element | notes                                                                   |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| `Radio.Indicator` | `span`  | **the round control** — `aria-hidden`, with a `centre` slot for the dot |
| `Radio.Text`      | `span`  | the label                                                               |
| `Radio.Label`     | `label` | the field label, for the group                                          |
| `Radio.Hint`      | `span`  | the quiet line under the group                                          |
| `Radio.Error`     | `span`  | the error line, when the group is invalid                               |

```tsx
<Radio.Group defaultValue="1h">
  <Radio value="1h">
    <Radio.Indicator />
    <Radio.Text>1h</Radio.Text>
  </Radio>
  <Radio value="24h">
    <Radio.Indicator />
    <Radio.Text>24h</Radio.Text>
  </Radio>
</Radio.Group>
```

**`Radio.Indicator` is not optional in practice, and that is the thing this document got wrong.** React Aria's
`Radio` renders exactly the children it is given and nothing else — there is no default dot. A `Radio` written
without an `Indicator` is therefore a **label with no visible control**: it is focusable, announced, and
invisible. Every example in this file used a `segment` variant — since removed — and that variant was the one
case where omitting the indicator is correct, because a segment's fill _is_ its indicator. So the base anatomy
never appeared, the dot was never documented, and the omission that was right in the one case was wrong in
every other.

That is not a styling detail to infer from a screenshot. It is the difference between a form a reader can fill
in and one they cannot see.
