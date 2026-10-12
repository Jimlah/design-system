# TokenField

Text with tokens inside it — a notification target, an alert's audience.

```tsx
<TokenField
  defaultValue={
    new TokenFieldValue([
      { type: 'token', text: '#ops', value: 'ops' },
      { type: 'text', text: ' on call' },
    ])
  }
>
  <TokenField.Label>Notify</TokenField.Label>
  <TokenField.Input />
  <TokenField.Hint>
    Backspace removes the token before the caret.
  </TokenField.Hint>
</TokenField>
```

| Slot               | React Aria   | Notes                                               |
| ------------------ | ------------ | --------------------------------------------------- |
| `TokenField`       | `TokenField` | The value is a `TokenFieldValue`, not a set of keys |
| `TokenField.Label` | `Label`      |                                                     |
| `TokenField.Input` | `TokenInput` | The typing surface, and where tokens are drawn      |
| `TokenField.Token` | `Token`      | Only meaningful inside `TokenField.Input`           |
| `TokenField.Hint`  | `Text`       |                                                     |

## A token is part of the value, not a chip beside it

That is the whole difference from `TagGroup`. A tag group is **a set of chips you edit as a set** —
order does not matter, each has an identity, and the control's job is to add and remove them. Here the
tokens are **words inside a sentence the user is writing**, in order, and React Aria puts the caret
between them. `TagGroup` answers _which labels apply_; this answers _who hears about it, and what do
you want to say_.

So the value is a `TokenFieldValue` — a string with tokens embedded — rather than an array of keys, and
`onChange` hands back the whole thing.

## The shape of the segments, which is not what you would guess

`TokenField.Input`'s `children` is a function, and it is called **only for tokens**:

```
case 'token':  →  children(segment)        // wrapped in zero-width spaces
case 'text':   return v.text               // a bare string, never passed to children
```

Two consequences, both of which cost a round here:

- **A text segment is not an element.** There is no node to put a `data-slot` on, and the typing
  surface's own `textContent` _is_ the sentence. So its type and colour belong on
  `TokenField.Input` — a slot for text would be dead code that looks correct in the source.
- **The parameter is typed as a token segment**, so `segment.type === 'token'` is a condition the
  compiler knows is always true. eslint says so directly: _"comparison is always true, since
  `"token" === "token"` is true"_. That lint error is the contract restated.

The zero-width spaces React Aria wraps each token in are for caret placement and are not part of what
the user sees; a test that reads the sentence has to strip them.

## No validation, and so no `Error` slot

React Aria 1.22's token field takes `isDisabled`, `isReadOnly`, `allowsNewlines` and keyboard handlers
— and **no validation props at all**: no `isInvalid`, no `isRequired`, no `validationBehavior`. An
`errorMessage` slot would render and never be wired to anything, which is worse than not having one, so
there is no `TokenField.Error`. This follows the house rule that a component is trimmed rather than
shipped broken.

## No `placeholder` either

A text field's placeholder belongs to its input element, and this container is a `role="textbox"`
`div` with none to put it on. The text content of the value is what stands in for it.

## The keyboard is most of the component

Backspace at a token's edge removes it; the arrow keys step through tokens as single characters; typing
filters what remains. None of that is implemented here, and all of it is the reason to use this rather
than compose a text field with chips.
