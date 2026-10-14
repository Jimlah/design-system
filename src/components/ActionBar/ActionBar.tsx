import { Toolbar as AriaToolbar } from 'react-aria-components'
import type { ToolbarProps as AriaToolbarProps } from 'react-aria-components'

import { Button } from '../Button/Button'
import { SURFACE } from '../popover'

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from 'react'

/**
 * The floating surface, pinned to the bottom of the viewport.
 *
 * **The boundary colour is moved by a variant rather than by a second class.** `SURFACE` already carries
 * `border-border-strong`, and two border-colour utilities on one element are decided by the order
 * Tailwind happens to emit them in, not by the order they are written here — the same trap that made
 * `Toolbar` grow its own class list instead of wearing this one. `data-[emphasized]:` compiles to an
 * attribute selector, which outranks the plain utility whatever the order is, so exactly one of the two
 * colours can ever win.
 */
const BAR = [
  SURFACE,
  'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40',
  'mx-auto flex max-w-3xl p-2',
  'data-[emphasized]:border-primary',
].join(' ')

const TOOLBAR = 'flex w-full items-center gap-4'

const COUNT = 'truncate text-[13px] tabular-nums'

const ACTIONS = 'ms-auto flex shrink-0 items-center gap-2'

export interface ActionBarProps extends Omit<
  AriaToolbarProps,
  'className' | 'children' | 'orientation' | 'aria-label' | 'ref'
> {
  /** React 19 passes `ref` as an ordinary prop, so no `forwardRef` wrapper. */
  ref?: Ref<HTMLDivElement>
  /**
   * How many items are selected. `0` hides the bar; `'all'` says every one of them is, which is a
   * different sentence from a large number.
   * @default 0
   */
  selectedItemCount?: number | 'all'
  /**
   * Called when the clear button is pressed, or when Escape is pressed while the bar has focus.
   * React Aria reports; it does not clear — the selection belongs to the collection, not to the bar.
   */
  onClearSelection?: () => void
  /**
   * Whether the bar is the live one: it takes the accent on its boundary and on its count instead of
   * the quiet hairline. See the note on the component for what this deliberately does not do.
   * @default false
   */
  isEmphasized?: boolean
  /**
   * The bar's accessible name. It is a toolbar, so it needs one; this says what the bar is about rather
   * than what is in it.
   * @default 'Selection actions'
   */
  'aria-label'?: AriaToolbarProps['aria-label']
  className?: string
  /** The actions themselves — `Button`s, one per thing that can be done to the selection. */
  children?: ReactNode
}

/**
 * The actions for what is selected — a bar that arrives when rows are chosen and goes away when
 * nothing is.
 *
 * ```tsx
 * const [selected, setSelected] = useState<Selection>(new Set())
 *
 * <Table
 *   aria-label="Monitors"
 *   selectionMode="multiple"
 *   selectedKeys={selected}
 *   onSelectionChange={setSelected}
 * >
 *   …
 * </Table>
 *
 * <ActionBar
 *   selectedItemCount={selected === 'all' ? 'all' : selected.size}
 *   onClearSelection={() => setSelected(new Set())}
 * >
 *   <Button size="sm" variant="ghost" color="neutral">Restart</Button>
 *   <Button size="sm" variant="ghost" color="danger">Take down</Button>
 * </ActionBar>
 * ```
 *
 * **React Aria has no `ActionBar`, so this is one component built out of two things that do exist**:
 * React Aria's `Toolbar`, which is what makes the bar **one tab stop** with the arrow keys walking it,
 * and the sheet's floating surface, which the popover, the sheet and the toast already share. The
 * reference — React Spectrum S2's `ActionBar` — is a `div` with a `FocusScope`, an entry animation and a
 * `role="group"` inside it; the semantics here come from the toolbar instead, which is a stronger version
 * of the same promise: the whole bar is reached in one press of Tab rather than one per action.
 *
 * ### The count is the bar's, the selection is not
 *
 * `selectedItemCount` and `onClearSelection` are React Spectrum's own pair, and they are what a design
 * system can honestly publish: **the bar does not own the selection, it reflects it.** The collection
 * does — React Aria's `Table`, `GridList` and `Tree` all report selection through `onSelectionChange` —
 * and a bar that kept its own copy would be a second source of truth for the same fact. The same call
 * `TagGroup`'s `onRemove` makes: a control that *reports* is not a control that *acts*, and a story that
 * wires it up has to prove the selection is actually gone rather than that a callback fired.
 *
 * `0` renders nothing at all rather than an invisible bar — nothing is selected, so there is nothing to
 * act on, and its controls do not sit in the tab order waiting to be found.
 *
 * ### Escape leaves selection mode, and only from inside the bar
 *
 * React Spectrum scopes that key to the bar's own element, and so does this: Escape clears while focus
 * is within the bar, which is where a keyboard user is once they have acted on a row. It does not clear
 * while focus is out on the page, because a key that empties a selection the reader cannot see the
 * source of is a key that throws work away.
 *
 * **It is also the key React Aria's collections already answer.** `useSelectableCollection` defaults
 * `escapeKeyBehavior` to `'clearSelection'`, so a `Table` or a `GridList` clears its own selection on
 * Escape with the bar nowhere near it. The bar is not inventing a key, it is saying the same thing in
 * the second place a keyboard user ends up.
 *
 * ### `isEmphasized` means the accent boundary, not a repaint of everything inside
 *
 * S2's emphasized bar flips to a high-contrast container and asks every button inside it to render in a
 * static colour — "the container decides how its controls look", which does not exist in this system,
 * where every control sets its own `--btn` and states derive from it. Ported literally it would put a
 * ghost button's accent label on an accent fill and read as nothing at all. So emphasis here is the
 * accent on the bar's own boundary and its count: it says which bar is the live one without taking a
 * single decision away from the controls inside it.
 *
 * ### What is deliberately not here
 *
 * - **No `scrollRef`, and none of the container arithmetic that goes with it.** In Spectrum it exists so
 *   the bar can be positioned inside a collection's own scroll container and offset by its scrollbar
 *   width. This library's collections are ordinary elements the caller composes, so the bar is fixed to
 *   the viewport and there is no scrollbar to measure. It floats over the page, so a page whose last row
 *   must stay reachable wants a little bottom padding of its own.
 * - **No exit animation.** The entry is the shared mount animation in `styles.css`, keyed on
 *   `data-slot="action-bar"`, the same one every panel gets. The exit is a hook React Aria keeps private
 *   (`useExitAnimation`), and holding a stale bar mounted to fade it out would be a state machine for
 *   160ms of polish.
 * - **The two sentences are English**, like `TagGroup`'s "Remove" and `Toast`'s "Dismiss": the count is
 *   the one string that has to agree with `selectedItemCount`, so it is the component's rather than the
 *   caller's.
 */
export function ActionBar({
  ref,
  selectedItemCount = 0,
  onClearSelection,
  isEmphasized = false,
  'aria-label': ariaLabel = 'Selection actions',
  className,
  children,
  ...props
}: ActionBarProps) {
  // Nothing is selected, so the bar is not there at all — see the note above. Everything below is the
  // bar at rest, which is why this is the first line and not a class on the element.
  if (selectedItemCount === 0) {
    return null
  }

  return (
    <div
      data-slot="action-bar"
      data-emphasized={isEmphasized ? true : undefined}
      // The bar's own element, not the document: see "Escape leaves selection mode" above. Focus is on
      // one of the toolbar's controls by then, so the key reaches here through the React tree.
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
          onClearSelection?.()
        }
      }}
      className={[BAR, className].filter(Boolean).join(' ')}
    >
      <AriaToolbar
        ref={ref}
        aria-label={ariaLabel}
        orientation="horizontal"
        className={TOOLBAR}
        {...props}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* The label is the button's: an icon-only control with no name is a square. The icon's own
              `size-4` is what makes it a glyph rather than the 8px cap height of an 11px label — an
              icon-only control has no label for a cap to track. See `Button.Icon`. */}
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Clear selection"
            onPress={onClearSelection}
          >
            <Button.Icon>
              <svg
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                className="size-4"
              >
                <path
                  d="M1 1L9 9M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Button.Icon>
          </Button>
          {/* A live region, so choosing a row is answered out loud — the bar appearing is otherwise a
              purely visual event, and the count is the page's only statement of what is selected. */}
          <span
            data-slot="count"
            role="status"
            className={[
              COUNT,
              isEmphasized ? 'text-primary' : 'text-foreground/70',
            ].join(' ')}
          >
            {selectedItemCount === 'all'
              ? 'All selected'
              : `${selectedItemCount} selected`}
          </span>
        </div>
        <div className={ACTIONS}>{children}</div>
      </AriaToolbar>
    </div>
  )
}
