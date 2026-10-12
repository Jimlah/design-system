# Toast

The sheet has no toast either — the third component here with nothing to copy, after the date
picker and the accordion — so it borrows the **tooltip's** surface, which is the closest thing the
sheet has to a floating panel, and React Aria's behaviour.

```tsx
const queue: ToastQueue<ToastData> = new Toast.Queue({ maxVisibleToasts: 3 })

<Toast.Region queue={queue} aria-label="Notifications">
  {({ toast }) => (
    <Toast toast={toast}>
      <Toast.Content>
        <Toast.Title>{toast.content.title}</Toast.Title>
        <Toast.Text>{toast.content.text}</Toast.Text>
      </Toast.Content>
      <Toast.Close />
    </Toast>
  )}
</Toast.Region>

queue.add({ title: 'Check failed' }, { timeout: 5000 })
```

| Slot            | React Aria             | Notes                                               |
| --------------- | ---------------------- | --------------------------------------------------- |
| `Toast`         | `UNSTABLE_Toast`       | One toast, inside a region's render function        |
| `ToastQueue`    | `UNSTABLE_ToastQueue`  | The queue itself, a class                           |
| `Toast.Region`  | `UNSTABLE_ToastRegion` | The corner they collect in. **Once**, near the root |
| `Toast.Content` | —                      | Holds the title and the text                        |
| `Toast.Title`   | —                      | The sheet's row legend, at full strength            |
| `Toast.Text`    | —                      | 13px at 70% — detail, not a second heading          |
| `Toast.Close`   | `Button slot="close"`  | `slot="close"` is what makes it the dismiss control |

### React Aria's toast is `UNSTABLE_`, and this is a thin skin over it

Every part is marked `UNSTABLE_`, and that is a real risk worth saying out loud rather than
burying at an import: the API can move between minor versions, and this component moves with it. It
was still the right trade — a queue, a region, auto-dismiss, a pause on hover, focus management and
an announcement to a screen reader are precisely what a hand-rolled toast gets wrong, and
`role="status"` on a div does not get them right.

`Toast.Close` writes `slot="close"` itself rather than leaving it to the consumer, for the same
reason `Select.Button` places its own value: the one attribute that makes it work is the one nobody
remembers, and getting it wrong still renders.

### Two consequences of the compound form

- **`Object.assign` flattens the generic**, so `toast.content` comes back as `unknown` unless the
  queue is typed at the point it is made. Hence `ToastQueue<T>`, exported as a type beside the
  component — say `new Toast.Queue<ToastData>({…})` and the rest follows.
- **`toast` is a required prop**, so there is nothing for Storybook to put in `args` and the meta
  is `as Meta<typeof Toast>` rather than `satisfies`. Every story supplies its own `render`.

`data-animation="entering" | "exiting"` is on the toast for the length of its entry and exit, so an
animation can hang off state rather than off a class that is always on. No keyframes ship with it:
which way a toast should move is a house decision.

### A toast announces itself, so it should not be the only place anything is said

It is for what has just happened and needs no answer. Anything a user must act on belongs in the
page, where it will still be there when they look back. `timeout` is how long it stays; a toast with
no timeout stays until dismissed, which is a decision worth making deliberately.

## `ToastQueue` is a named export, not a slot

Every other trailing name in this system is a component you can render — `Toast.Title`,
`Modal.Content` — so `Toast.Queue` was a name that looked renderable and was a
**React Aria class**. It is now `import { ToastQueue } from './Toast'`, and the compound contains only
components. `new ToastQueue({ maxVisibleToasts: 3 })`, then pass it to `Toast.Region`.
