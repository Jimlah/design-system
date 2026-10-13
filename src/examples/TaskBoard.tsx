import { useEffect, useMemo, useState } from 'react'
import {
  DropIndicator,
  useAsyncList,
  useDragAndDrop,
} from 'react-aria-components'
import type { DropItem, ItemDropTarget } from 'react-aria-components'
import { parseDate } from '@internationalized/date'

import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { Card } from '../components/Card/Card'
import { DatePicker } from '../components/DatePicker/DatePicker'
import { GridList } from '../components/GridList/GridList'
import { Menu } from '../components/Menu/Menu'
import { NumberField } from '../components/NumberField/NumberField'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { SearchField } from '../components/SearchField/SearchField'
import { Select } from '../components/Select/Select'
import { Separator } from '../components/Separator/Separator'
import { Sheet } from '../components/Sheet/Sheet'
import { TagGroup } from '../components/TagGroup/TagGroup'
import { TextArea } from '../components/TextArea/TextArea'
import { TextField } from '../components/TextField/TextField'
import { ToggleButtonGroup } from '../components/ToggleButtonGroup/ToggleButtonGroup'
import { VisuallyHidden } from '../components/VisuallyHidden/VisuallyHidden'

import {
  COLUMNS,
  EMPTY_FILTER,
  MEMBERS,
  PRIORITIES,
  SEED_TASKS,
  STORAGE_KEY,
  allTags,
  boardStats,
  columnOf,
  copyOf,
  dueLabel,
  encodeBoard,
  fetchBoard,
  footAnchor,
  isFiltered,
  matchesFilter,
  memberOf,
  newTask,
  nextTaskId,
  stepDrop,
  todayIso,
} from './board'
import type {
  BoardFilter,
  Column as BoardColumn,
  ColumnId,
  Drop,
  MemberId,
  Priority,
  Task,
} from './board'

/**
 * The task board: a worked example of the design system doing one job end to end — columns of
 * cards dragged between them, with a sheet for the detail behind each one.
 *
 * **It is an example, not a component, which is why it lives here and has no story.** The same
 * reasoning as Login and Create: a story is what publishes a page as part of the library's API
 * through the components manifest this project's MCP tools serve, and this is a page. It is tested
 * by TaskBoard.browser.test.tsx in the components project instead, and the route file that serves it
 * stays thin.
 *
 * **What it shows is the composition, not the cards.** The board's own decisions — what a drop
 * between two cards means, which cards a filter keeps, what happens to a column past its limit — are
 * plain functions over Task[] in board.ts, tested as arithmetic. What is left here is the part
 * that genuinely needs a DOM: React Aria's collections, its drag session, and its focus handling.
 * That split is the point. A board whose move logic lives inside a drop handler is a board whose move
 * logic cannot be tested without a mouse.
 *
 * **The board is a useAsyncList, and that is the data layer rather than a flourish.** React Aria's
 * collections want a list to draw: one that arrives asynchronously, reports whether it is loading,
 * can be re-fetched, and owns the operations a collection needs — insert, update, remove, and the
 * moves a drop performs, by key. So the page keeps no task array of its own. fetchBoard is the
 * `load`, the board draws list.items, every change is a list operation, and Reset and Undo are a
 * re-fetch. What board.ts still owns is the part that is this board's rather than any list's: which
 * cards a filter keeps, what a column's foot is, what a drop lands against, and the numbers in the
 * header. See docs/board.md for what that split bought and what it cost.
 *
 * Four things about the wiring are worth knowing before reading it:
 *
 * - **Every column is its own collection with its own useDragAndDrop**, which is what React Aria
 *   requires: the hooks are per collection. A drag between two of them is therefore external as far
 *   as the receiving column is concerned, so it arrives at onInsert (between two cards) or onRootDrop
 *   (the column's empty space) as DropItems rather than keys, and the card's identity travels in a drag
 *   type of its own. A drag within one column is internal and arrives at onReorder with keys. All of
 *   them end in the same list.moveBefore / list.moveAfter, because React Aria reports a place as the
 *   card it is next to — which is exactly how the list moves things.
 * - **A card's identity is its id, carried as a MIME type.** A drag's payload is strings keyed by media
 *   type, so application/x-pulse-task holds the id while text/plain holds something a person would
 *   recognise if the card were dropped into a text editor.
 * - **'on' a card means before it.** React Aria reports before, on and after; the board has two, and
 *   a drop onto a card lands the dragged cards in front of it — the reading a card-sized drop target
 *   invites, and the one that never needs an index.
 * - **A filter narrows the screen, never the board.** Hiding a card does not move it, and a drop
 *   against a visible neighbour lands where the column actually holds it.
 */

/** What a dragged card carries. A drag type is the only channel a cross-collection drop has. */
const TASK_MIME = 'application/x-pulse-task'

/**
 * The mark a drop leaves between two cards: two pixels of accent, laid in the gap the card will land in.
 *
 * **It is React Aria's own `DropIndicator`, styled and nothing more**, which is worth saying because the
 * library's indicator was written off once already — `docs/components/gridlist.md` records it being
 * built, drawing nothing through a whole drag, and removed. What that measurement missed is that
 * `renderDropIndicator` is only consulted for a target *on a card*: the column's own empty space is
 * drawn by a separate, unstyled element that the option never reaches. The line here is that option,
 * and the empty column is left to its own empty state to say it will take a card. Measured again in the
 * browser this round: a real drag between two cards renders this element, 2px tall and as wide as the
 * column, and a drag into the column's empty space renders nothing visible.
 *
 * **One mark, because the board has one kind of target.** Every drop is a drop *between* two cards —
 * see `shouldAcceptItemDrop` below — so the line below is drawn wherever the pointer is, including
 * over the middle of a card. When "on" targets were accepted instead, that half of every card was a
 * drop the mark never reached, and the drag looked broken over most of the board.
 *
 * **It is a row of the list rather than something floating over it, and the negative margin is what
 * keeps that from moving anything.** The mark is rendered by React Aria between two rows, so it *is* a
 * flex item of the collection — and an absolutely positioned one would not stay there: the static
 * position of an abs-positioned child of a flex container is the container's own start corner, which
 * measured this line at the top of the column whatever card the pointer was over, a mark that lied
 * about where the card would land. Left in the flow it sits in the gap it names; `-my-[5px]` cancels
 * its own height and the two gaps around it, so the cards below do not jump as the pointer moves.
 */
const MARK =
  'pointer-events-none h-0.5 w-full -my-[5px] rounded-full bg-primary'

/**
 * Where a drop puts the cards it is carrying: against `anchor`, on one side of it.
 *
 * **Two fields rather than one "before" id, because a list moves things by key and not by index.** The
 * anchor is a card; the side is which side of it. A drop into a column's empty space has no card to name,
 * and `footAnchor` is what gives it one — the last card of that column, or of the board when the column
 * is empty. An anchor of `null` means a board with nothing on it at all, which is the one drop that has
 * nowhere to go.
 */
/** How far back the board can undo. A board is not a text editor; a dozen is past anyone's reach. */
const MAX_UNDO = 12

/** Where the sheet's unassigned option keeps its value — a member id that no member has. */
const UNASSIGNED = 'unassigned'

/**
 * The ids a drop is carrying, in the order they were picked up.
 *
 * **A drop item is a DropItem, and only its text kind carries anything a board can use.** A file
 * dragged in from the desktop arrives here too, which is why the type is checked rather than assumed —
 * and why nothing happens to it rather than something strange.
 */
async function draggedIds(items: DropItem[]): Promise<string[]> {
  const ids = await Promise.all(
    items.map(async (item) => {
      if (item.kind !== 'text' || !item.types.has(TASK_MIME)) return null
      const id = await item.getText(TASK_MIME)
      return id === '' ? null : id
    }),
  )
  return ids.filter((id): id is string => id !== null)
}

/** A chip for a card's priority, in the strengths the sheet gives a warning and a quiet label. */
const PRIORITY_CHIP: Record<Priority, string> = {
  urgent: 'border-destructive/60 text-destructive',
  high: 'border-warning/60 text-warning',
  normal: 'border-border-strong text-foreground/60',
  low: 'border-border-soft text-foreground/45',
}

/** Assignee avatar colours, so the same person wears the same one everywhere on the board. */
const AVATAR_COLOR: Record<
  MemberId,
  'primary' | 'secondary' | 'neutral' | 'success' | 'danger'
> = {
  ada: 'primary',
  bo: 'secondary',
  chen: 'success',
  dara: 'danger',
  elif: 'neutral',
}

export interface TaskBoardProps {
  /** The board to open with when this browser has nothing stored. */
  initialTasks?: Task[]
  /**
   * The date the cards' due labels are measured against, as YYYY-MM-DD. A page gets this from the
   * clock; a test passes it, which is what keeps '3d late' from depending on the day it runs.
   */
  today?: string
  /** Where the board remembers itself, or null to remember nothing. */
  storageKey?: string | null
}

/**
 * The board: four columns of the sheet's own panels, each one a GridList, so a card can be picked up,
 * selected, walked with the arrow keys and dropped by the same machinery a table row is.
 */
export function TaskBoard({
  initialTasks = SEED_TASKS,
  today = todayIso(),
  storageKey = STORAGE_KEY,
}: TaskBoardProps) {
  /**
   * The board, as a list that arrives. Every operation below is one of its own — `insertAfter`,
   * `moveBefore`, `update`, `remove` — and every one of them moves cards **by key**, which is what
   * makes a drop's target and a list operation the same thing.
   */
  const [loaded, setLoaded] = useState(false)
  const list = useAsyncList<Task>({
    getKey: (task) => task.id,
    load: async ({ signal }) => {
      const items = await fetchBoard(signal, storageKey, initialTasks)
      // **The state a list starts in is `idle`, not `loading`**, so "not loading" is true before the
      // first fetch has even been dispatched — and an effect that wrote the board on that alone wrote
      // an empty one over the stored board *before* the fetch read it. This is the flag that says the
      // fetch has actually returned.
      setLoaded(true)
      return { items }
    },
  })
  const tasks = list.items

  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER)
  const [status, setStatus] = useState('')
  const [history, setHistory] = useState<Task[][]>([])

  /**
   * **The board is written down as it changes, and read back only when it is asked for.** The write is
   * the board's memory; the read is `fetchBoard`, on the way in and on every re-fetch. So Undo and
   * Reset are not a second way of setting the items — they are the two operations that put a board
   * back on the "server" and ask for it again, which is the same path the page took to open.
   *
   * Nothing is written until the first load has landed, or the seed would be written over a stored
   * board before it had been read.
   */
  useEffect(() => {
    if (!loaded || storageKey === null) return
    window.localStorage.setItem(storageKey, encodeBoard(list.items))
  }, [loaded, storageKey, list.items])

  /** A change, its history entry, and the note the board says about it. */
  function commit(message: string) {
    setHistory((past) => [list.items, ...past].slice(0, MAX_UNDO))
    setStatus(message)
  }

  /** Put a board back where the memory reads from, and fetch it again. */
  function restore(snapshot: Task[]) {
    if (storageKey !== null) {
      window.localStorage.setItem(storageKey, encodeBoard(snapshot))
    }
    list.reload()
  }

  function undo() {
    if (history.length === 0) return
    // Indexed after the length is checked, rather than as `history[0]` guarded for `undefined`: with
    // no `noUncheckedIndexedAccess` the type says an index is never missing, so the guard reads as a
    // condition that cannot happen — and the runtime disagrees.
    const previous = history[0]
    setHistory(history.slice(1))
    restore(previous)
    setStatus('Undone.')
  }

  function handleMove(ids: string[], column: ColumnId, drop: Drop) {
    if (ids.length === 0) return
    // A drop with nothing to land against is the board's only no-op: there is no card to move it past.
    if (drop.anchor === null) return
    /*
      **The list moves cards; it does not know which column a card is in.** Order is the list's, and
      membership is the board's own field on the task — so a move across columns is both: the card is
      re-labelled, and then it is moved. Doing only the second is a drag that looks like it did nothing,
      which is exactly what this page shipped for one round: the state had the card in the right place
      and the column it belonged to still said otherwise.
    */
    for (const id of ids) {
      const task = list.getItem(id)
      if (task !== undefined && task.column !== column) {
        list.update(id, { ...task, column })
      }
    }
    if (drop.side === 'after') list.moveAfter(drop.anchor, ids)
    else list.moveBefore(drop.anchor, ids)
    const what = ids.length === 1 ? (ids[0] ?? 'Task') : ids.length + ' tasks'
    // A move that stayed inside the column reordered rather than moved, and the board says which it
    // was: "moved to Backlog" for a card that was already in Backlog reads like nothing happened.
    const stayed = ids.every((id) => list.getItem(id)?.column === column)
    commit(
      what +
        (stayed ? ' moved within ' : ' moved to ') +
        columnOf(column).title +
        '.',
    )
  }

  /** A move that names a column rather than a card: the menu's "Move to", which lands at its foot. */
  function handleMoveToColumn(ids: string[], column: ColumnId) {
    handleMove(ids, column, {
      anchor: footAnchor(list.items, column),
      side: 'after',
    })
  }

  /**
   * A drop into a column's own space, which names no card and still has an answer: the foot of that
   * column. It is here rather than in the column because **the anchor for an empty column is the
   * board's last card** — the column has no cards to ask, and this is the only place with the list.
   */
  function handleDropAtFoot(column: ColumnId, ids: string[]) {
    handleMove(ids, column, {
      anchor: footAnchor(list.items, column),
      side: 'after',
    })
  }

  function handleAdd(column: ColumnId, title: string) {
    const task = newTask(list.items, column, title)
    const anchor = footAnchor(list.items, column)
    if (anchor === null) list.append(task)
    else list.insertAfter(anchor, task)
    commit(task.id + ' added to ' + columnOf(column).title + '.')
  }

  function handleSave(task: Task) {
    list.update(task.id, task)
    commit(task.id + ' saved.')
  }

  function handleDelete(id: string) {
    list.remove(id)
    commit(id + ' deleted.')
  }

  function handleDuplicate(id: string) {
    const original = list.getItem(id)
    if (original === undefined) return
    const copy = copyOf(original, nextTaskId(list.items))
    list.insertAfter(id, copy)
    commit(id + ' copied to ' + copy.id + '.')
  }

  function reset() {
    restore(initialTasks.map((task) => ({ ...task })))
    commit('Board reset to the sprint it started with.')
  }

  const stats = useMemo(() => boardStats(tasks, today), [tasks, today])
  const tags = useMemo(() => allTags(tasks), [tasks])
  const visible = useMemo(
    () => tasks.filter((task) => matchesFilter(task, filter)),
    [tasks, filter],
  )
  const hidden = tasks.length - visible.length
  const filtering = isFiltered(filter)

  return (
    <main className="min-h-dvh bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="font-mono text-[12px] tracking-[0.06em] text-primary uppercase">
                Pulse
              </p>
              <h1 className="mt-2 text-[30px] leading-none font-semibold tracking-[-0.02em]">
                Task board
              </h1>
              <p className="mt-3 max-w-prose text-[13px] leading-[1.6] text-foreground/60">
                Sprint 24 — {stats.open} open, {stats.late} late, {stats.done}{' '}
                shipped. Drag a card between columns, or open one for the detail
                behind it.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SearchField
                aria-label="Search tasks"
                size="sm"
                value={filter.query}
                onChange={(query) => setFilter({ ...filter, query })}
                className="w-56"
              >
                <SearchField.Group>
                  <SearchField.Icon />
                  <SearchField.Input placeholder="Search tasks…" />
                </SearchField.Group>
              </SearchField>

              <Select
                aria-label="Filter by assignee"
                size="sm"
                className="w-44"
                selectedKey={filter.assignee}
                onChange={(key) =>
                  setFilter({
                    ...filter,
                    assignee: String(key) as MemberId | 'all',
                  })
                }
              >
                <Select.Button>
                  <Select.Value />
                  <Select.Icon />
                </Select.Button>
                <Select.Popover>
                  <Select.OptionList>
                    <Select.Option id="all" textValue="Anyone">
                      Anyone
                    </Select.Option>
                    {MEMBERS.map((member) => (
                      <Select.Option key={member.id} id={member.id}>
                        {member.name}
                      </Select.Option>
                    ))}
                  </Select.OptionList>
                </Select.Popover>
              </Select>

              <Select
                aria-label="Filter by tag"
                size="sm"
                className="w-40"
                selectedKey={filter.tag}
                onChange={(key) => setFilter({ ...filter, tag: String(key) })}
              >
                <Select.Button>
                  <Select.Value />
                  <Select.Icon />
                </Select.Button>
                <Select.Popover>
                  <Select.OptionList>
                    <Select.Option id="all" textValue="Every tag">
                      Every tag
                    </Select.Option>
                    {tags.map((tag) => (
                      <Select.Option key={tag} id={tag}>
                        {tag}
                      </Select.Option>
                    ))}
                  </Select.OptionList>
                </Select.Popover>
              </Select>

              <Separator orientation="vertical" className="h-8" />

              <Button
                variant="outline"
                size="sm"
                isDisabled={history.length === 0}
                onPress={undo}
              >
                <Button.Icon>{UNDO}</Button.Icon>
                <Button.Text>Undo</Button.Text>
              </Button>
              <Button variant="ghost" size="sm" onPress={reset}>
                <Button.Text>Reset</Button.Text>
              </Button>
            </div>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Sprint 24</Card.Title>
              <Card.Description>
                {stats.total} tasks across {COLUMNS.length} columns.
                {filtering
                  ? ' ' + hidden + ' hidden by the filter.'
                  : ' Nothing hidden.'}
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Figure label="Open" value={stats.open} />
              <Figure label="In review" value={stats.byColumn.review} />
              <Figure
                label="Late"
                value={stats.late}
                tone={stats.late > 0 ? 'text-destructive' : 'text-foreground'}
              />
              <ProgressBar
                value={stats.done}
                maxValue={Math.max(stats.total, 1)}
                className="min-w-0 justify-center"
              >
                <ProgressBar.Header>
                  <ProgressBar.Label>Shipped</ProgressBar.Label>
                  <ProgressBar.Value />
                </ProgressBar.Header>
                <ProgressBar.Track>
                  <ProgressBar.Fill tone="success" />
                </ProgressBar.Track>
              </ProgressBar>
            </Card.Content>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/*
              **The loading state is the list's, and the board says so rather than drawing an empty
              sprint.** It is one line because there is one thing to know; the columns below are not
              rendered until there is a board to put in them, which is also what keeps the summary
              above from announcing "0 open" for a fifth of a second.
            */}
            <p role="status" className="text-[12px] text-foreground/55">
              {status === ''
                ? 'Drag a card to another column, or between two cards, or use its menu.'
                : status}
            </p>
            <p className="text-[12px] text-foreground/40">
              Kept in this browser only · {tasks.length} tasks saved as you work
            </p>
          </div>
        </header>

        {list.loadingState === 'loading' ? (
          <Card className="items-center justify-center py-16">
            <ProgressBar isIndeterminate aria-label="Loading the sprint">
              <ProgressBar.Label className="text-foreground/60">
                Loading the sprint…
              </ProgressBar.Label>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </Card>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.column === column.id)}
                visible={visible.filter((task) => task.column === column.id)}
                today={today}
                filtered={filtering}
                onMove={handleMove}
                onMoveToColumn={handleMoveToColumn}
                onDropAtFoot={(ids) => handleDropAtFoot(column.id, ids)}
                onAdd={handleAdd}
                onSave={handleSave}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}

        <footer className="flex flex-col gap-2 border-t border-border pt-5">
          <p className="max-w-prose text-[12px] leading-[1.6] text-foreground/55">
            Every card is a row of a grid list. Click one to select it and click
            another to add it, or take the whole column with Ctrl and A — then
            drag the selection onto another column. The arrow keys walk the
            cards, Shift and an arrow selects a run, and each card's menu can
            move, copy or delete it with no pointer at all.
          </p>
          <p className="max-w-prose text-[12px] leading-[1.6] text-foreground/40">
            The board is an example of this design system's components rather
            than one of them: no story publishes it, and the page owns no
            server, so it keeps itself in local storage.
          </p>
        </footer>
      </div>
    </main>
  )
}

/** One number in the sprint summary. */
function Figure({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] tracking-[0.06em] text-foreground/50 uppercase">
        {label}
      </p>
      <p
        className={[
          'mt-1.5 text-[26px] leading-none font-semibold tabular-nums',
          tone,
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

interface ColumnProps {
  column: BoardColumn
  /** Every task in this column, in board order — what a drop computes its landing place against. */
  tasks: Task[]
  /** The ones the filter kept, which is what the grid draws. */
  visible: Task[]
  today: string
  filtered: boolean
  onMove: (ids: string[], column: ColumnId, drop: Drop) => void
  onMoveToColumn: (ids: string[], column: ColumnId) => void
  /** A drop into this column's own space, which names no card: the board knows what that means. */
  onDropAtFoot: (ids: string[]) => void
  onAdd: (column: ColumnId, title: string) => void
  onSave: (task: Task) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

/**
 * One column: a heading, the cards, and the field that adds another.
 *
 * **The drag and drop hooks belong here rather than on the board**, because React Aria's
 * useDragAndDrop is per collection and a collection is a component's own. The column is what a drop
 * knows about; the board only hears the answer, as ids and a place.
 */
function Column({
  column,
  tasks,
  visible,
  today,
  filtered,
  onMove,
  onMoveToColumn,
  onDropAtFoot,
  onAdd,
  onSave,
  onDelete,
  onDuplicate,
}: ColumnProps) {
  const [title, setTitle] = useState('')

  const count = tasks.length
  const overLimit = column.wip !== null && count > column.wip

  /**
   * Where a drop lands, as the card it lands against and which side of it.
   *
   * **'on' is read as 'before'**, because a card is the smallest thing a drop can point at and landing
   * in front of the one the pointer is over is what a card-sized target invites. The column's own space
   * has no card at all, which is what footAnchor is for.
   */
  function landing(target: ItemDropTarget): Drop {
    return {
      anchor: String(target.key),
      side: target.dropPosition === 'after' ? 'after' : 'before',
    }
  }

  /**
   * One place up or down inside this column: the menu's twin of a drag. Same list move, same board
   * field — and the reason it exists is measured in the drop-target note above, since a pointer drag
   * cannot reach the middle of a card inside its own column.
   */
  function step(id: string, direction: 'up' | 'down') {
    const task = tasks.find((entry) => entry.id === id)
    const drop = task === undefined ? null : stepDrop(tasks, id, direction)
    if (task !== undefined && drop !== null) onMove([id], task.column, drop)
  }

  async function insertWith(items: DropItem[], target: ItemDropTarget) {
    const ids = await draggedIds(items)
    if (ids.length > 0) onMove(ids, column.id, landing(target))
  }

  const { dragAndDropHooks } = useDragAndDrop<Task>({
    // Only this board's own cards. Anything else dragged over a column finds no drop target at all,
    // rather than a drop target that quietly does nothing.
    acceptedDragTypes: [TASK_MIME],
    getItems: (keys) =>
      [...keys].map((key) => {
        const task = tasks.find((entry) => entry.id === String(key))
        return {
          'text/plain':
            task === undefined ? String(key) : task.id + ' ' + task.title,
          [TASK_MIME]: String(key),
        }
      }),
    // A card is moved, never copied: a second copy of the same task is never what a drag meant.
    getDropOperation: () => 'move',
    renderDropIndicator: (target) => (
      <DropIndicator target={target} className={MARK} />
    ),
    /*
      **This board has no "on" target, and the whole card is a between-cards drop because of it.**
      React Aria tries an "on" target first, and a drag within the same collection always refuses one —
      a list *reorders* between items, and `onReorder` takes before and after only. Refusing "on"
      outright is the documented way to say the board has no such operation, and it also settles the
      geometry: the list's drop-target delegate falls back to before or after, by which half of the
      card the pointer is over. So every drop names a card and a side, the mark below is the only one
      the board draws, and `getDropOperation` still answers "move" for the positions that remain.

      **The middle of a card is still a dead zone for a drag within its own column, and that is
      measured rather than assumed.** With no "on" target RAC's delegate keeps its fallback only near
      a card's edge and returns an "on" target everywhere else, which the collection then cancels: a
      same-column drop in the gap between two cards and on a card's top edge both produce a target,
      drawn, and the middle of a 233-pixel card produces none at all. A hand-written delegate was
      tried — it returned a before/after for every position, and the state accepted all eight of the
      cards' before/after targets in a probe — and React Aria still set no target for the middle, so
      it was removed rather than shipped. Across columns there is no dead zone at all. The page's own
      footer names the gesture that works, because the honest answer is "between two cards".
    */
    shouldAcceptItemDrop: () => false,
    // Within this column React Aria reports keys; from another column it reports drop items.
    onReorder: (event) => {
      onMove([...event.keys].map(String), column.id, landing(event.target))
    },
    onInsert: (event) => {
      void insertWith(event.items, event.target)
    },
    /*
      **The foot of the column is the board's to name, not this column's.** The anchor for a drop that
      names no card is the column's last card — and when the column is *empty*, the board's last card,
      which is the same place in the order the board renders. Computing it here from this column's own
      cards gave `null` for an empty column, and `handleMove` refuses a drop with nothing to land
      against: **a card could not be dragged into an empty column at all**, which is the one thing a
      kanban board is for once you have finished its work. The board owns it for the same reason it owns
      every other anchor: it is the only place that has the whole list.
    */
    onRootDrop: (event) => {
      void draggedIds(event.items).then((ids) => {
        if (ids.length > 0) onDropAtFoot(ids)
      })
    },
  })

  return (
    <section
      aria-labelledby={'column-' + column.id}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2
            id={'column-' + column.id}
            className="font-mono text-[11px] tracking-[0.08em] text-foreground/70 uppercase"
          >
            {column.title}
          </h2>
          <span
            className={[
              'font-mono text-[11px] tabular-nums',
              overLimit ? 'text-warning' : 'text-foreground/45',
            ].join(' ')}
          >
            {filtered ? visible.length + ' of ' + count : count}
            {column.wip === null ? '' : ' / ' + column.wip}
          </span>
        </div>
        <p className="text-[11px] text-foreground/40">
          {overLimit
            ? 'Over the limit of ' + column.wip + ' — finish something first.'
            : column.note}
        </p>
      </div>
      <GridList
        aria-label={column.title}
        items={visible}
        selectionMode="multiple"
        dragAndDropHooks={dragAndDropHooks}
        className="gap-2"
        renderEmptyState={() => (
          <GridList.Empty>
            {filtered
              ? 'Nothing here matches the filter.'
              : 'Nothing here yet — drag a card in, or add one below.'}
          </GridList.Empty>
        )}
      >
        {(task: Task) => (
          <GridList.Item
            id={task.id}
            textValue={task.id + ' ' + task.title}
            // Dimmed while it is the card being dragged: a board with a ghost on the pointer and an
            // untouched original under it looks like two cards. React Aria's own attribute, styled.
            className="data-[dragging]:opacity-40"
          >
            <TaskCard
              task={task}
              today={today}
              onMoveToColumn={onMoveToColumn}
              onStep={step}
              canStepUp={stepDrop(tasks, task.id, 'up') !== null}
              canStepDown={stepDrop(tasks, task.id, 'down') !== null}
              onSave={onSave}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </GridList.Item>
        )}
      </GridList>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const next = title.trim()
          if (next === '') return
          onAdd(column.id, next)
          setTitle('')
        }}
      >
        <TextField
          aria-label={'New task in ' + column.title}
          size="sm"
          value={title}
          onChange={setTitle}
          className="min-w-0 flex-1"
        >
          <TextField.Input placeholder="Add a task…" autoComplete="off" />
        </TextField>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          aria-label={'Add to ' + column.title}
          isDisabled={title.trim() === ''}
        >
          <Button.Icon>{PLUS}</Button.Icon>
        </Button>
      </form>
    </section>
  )
}

interface TaskCardProps {
  task: Task
  today: string
  /** A move to a column by name, which is what the card's menu offers. */
  onMoveToColumn: (ids: string[], column: ColumnId) => void
  /** One place up or down inside this column: the menu's route to what a drag cannot always reach. */
  onStep: (id: string, direction: 'up' | 'down') => void
  canStepUp: boolean
  canStepDown: boolean
  onSave: (task: Task) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

/**
 * One card: what the task is, who has it, when it is due, and the controls it needs.
 *
 * **The body is a component but the row is not, and that is React Aria's rule rather than a
 * preference.** A collection is built from the JSX the list's children function returns, and a
 * component that is not a collection node cannot be one — where a GridList.Item belongs, anything
 * else throws 'Unknown element <TaskCard> in collection'. What is inside the item is ordinary React
 * and can be split up freely, which is what this is.
 */
function TaskCard({
  task,
  today,
  onMoveToColumn,
  onStep,
  canStepUp,
  canStepDown,
  onSave,
  onDelete,
  onDuplicate,
}: TaskCardProps) {
  const member = memberOf(task.assignee)
  const due = task.due === null ? null : dueLabel(task.due, today)
  const subtasks = task.subtasks.total
  const finished = subtasks > 0 && task.subtasks.done === subtasks

  return (
    <>
      {/*
        **The grip is for the keyboard, and React Aria makes it untouchable by a mouse.** A grid
        list's drag starts on the row for a pointer, and this button — the slot="drag" one React Aria
        asks every draggable collection for — is rendered with pointer-events: none so the two
        cannot disagree about who picked the card up. Its accessible name is React Aria's own.
      */}
      <Button slot="drag" variant="icon" size="sm" className="mt-0.5">
        <Button.Icon>{GRIP}</Button.Icon>
      </Button>

      <GridList.Body className="gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.06em] text-foreground/45">
            {task.id}
          </span>
          <span
            className={[
              'rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase',
              PRIORITY_CHIP[task.priority],
            ].join(' ')}
          >
            {PRIORITIES.find((entry) => entry.id === task.priority)?.label}
          </span>
        </div>

        <p className="text-[13px] leading-[1.35] font-medium text-foreground">
          {task.title}
        </p>

        {task.description === '' ? null : (
          <p className="line-clamp-2 text-[12px] leading-[1.45] text-foreground/55">
            {task.description}
          </p>
        )}

        {task.tags.length === 0 ? null : (
          <ul className="flex flex-wrap gap-x-2 gap-y-0.5">
            {task.tags.map((tag) => (
              <li
                key={tag}
                className="font-mono text-[10px] tracking-[0.04em] text-foreground/45"
              >
                {'#' + tag}
              </li>
            ))}
          </ul>
        )}

        {subtasks === 0 ? null : (
          <div className="mt-0.5 flex items-center gap-2">
            <ProgressBar
              aria-label={
                task.subtasks.done + ' of ' + subtasks + ' subtasks done'
              }
              value={task.subtasks.done}
              maxValue={subtasks}
              className="min-w-0 flex-1"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill tone={finished ? 'success' : 'accent'} />
              </ProgressBar.Track>
            </ProgressBar>
            <span className="font-mono text-[10px] tabular-nums text-foreground/45">
              {task.subtasks.done}/{subtasks}
            </span>
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          {member === null ? (
            <span className="text-[11px] text-foreground/40">Unassigned</span>
          ) : (
            <Avatar
              alt={member.name}
              size="sm"
              color={AVATAR_COLOR[member.id]}
            />
          )}

          {due === null ? null : (
            <span
              className={[
                'font-mono text-[10px] tabular-nums',
                due.late
                  ? 'text-destructive'
                  : due.soon
                    ? 'text-warning'
                    : 'text-foreground/45',
              ].join(' ')}
            >
              {due.text}
              <VisuallyHidden> due</VisuallyHidden>
            </span>
          )}

          <span className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[10px] text-foreground/40">
              {task.points} pt
            </span>
            <TaskEditor
              task={task}
              tags={task.tags}
              onSave={onSave}
              onDelete={onDelete}
            />
          </span>
        </div>
      </GridList.Body>

      <Menu>
        <Button
          variant="icon"
          size="sm"
          className="-mt-1 -mr-1"
          aria-label={'Actions for ' + task.id}
        >
          <Button.Icon>{KEBAB}</Button.Icon>
        </Button>
        <Menu.Popover
          menuProps={{
            onAction: (key) => {
              const action = String(key)
              if (action.startsWith('move:')) {
                // The menu's "Move to" names a column rather than a card, so the board is the one that
                // can say where in it the card lands.
                onMoveToColumn([task.id], action.slice(5) as ColumnId)
                return
              }
              if (action === 'step:up') onStep(task.id, 'up')
              if (action === 'step:down') onStep(task.id, 'down')
              if (action === 'duplicate') onDuplicate(task.id)
              if (action === 'delete') onDelete(task.id)
            },
          }}
        >
          {/*
            **Order, with the menu, because a drag inside a column cannot reach the middle of a card.**
            See the drop-target note above: React Aria sets no target there, so reordering by pointer is
            a drop *between* two cards and nothing else. These two are the same list operations the
            drag performs, and they are the path that always works — and they disable themselves at the
            ends rather than moving a card nowhere.
          */}
          <Menu.Section>
            <Menu.SectionTitle>Order</Menu.SectionTitle>
            <Menu.Item id="step:up" isDisabled={!canStepUp}>
              Move up
            </Menu.Item>
            <Menu.Item id="step:down" isDisabled={!canStepDown}>
              Move down
            </Menu.Item>
          </Menu.Section>
          <Menu.Separator />
          <Menu.Section>
            <Menu.SectionTitle>Move to</Menu.SectionTitle>
            {COLUMNS.filter((entry) => entry.id !== task.column).map(
              (entry) => (
                <Menu.Item key={entry.id} id={'move:' + entry.id}>
                  {entry.title}
                </Menu.Item>
              ),
            )}
          </Menu.Section>
          <Menu.Separator />
          <Menu.Item id="duplicate">Duplicate</Menu.Item>
          <Menu.Item id="delete">Delete</Menu.Item>
        </Menu.Popover>
      </Menu>
    </>
  )
}

interface TaskEditorProps {
  task: Task
  /** The tags this card already carries. */
  tags: string[]
  onSave: (task: Task) => void
  onDelete: (id: string) => void
}

/**
 * The detail behind one card, in a sheet down the edge: everything the card shows, and the things it
 * has no room for.
 *
 * **The trigger lives here, inside the Sheet, because a React Aria dialog trigger takes its trigger
 * as its first child.** The draft is a copy of the task, so a change nobody saved leaves the card
 * alone — and the sheet is what the trigger toggles, which is why Save and Delete close it through the
 * same onOpenChange every other dismissal goes through.
 */
function TaskEditor({ task, tags, onSave, onDelete }: TaskEditorProps) {
  const [draft, setDraft] = useState<Task>(task)
  const [isOpen, setOpen] = useState(false)

  function commit() {
    const done = Math.min(draft.subtasks.done, draft.subtasks.total)
    onSave({
      ...draft,
      title: draft.title.trim(),
      subtasks: { ...draft.subtasks, done },
    })
    setOpen(false)
  }

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        // The draft is taken from the card as it is when the sheet opens, so a card that changed
        // while the sheet was shut — by a move, by an undo — is never edited from a stale copy.
        if (open) setDraft(task)
        setOpen(open)
      }}
    >
      <Button variant="text" size="sm" aria-label={'Open ' + task.id}>
        <Button.Text>Open</Button.Text>
      </Button>

      <Sheet.Content side="right">
        <Sheet.Title>{task.id}</Sheet.Title>
        <Sheet.Description>{columnOf(task.column).title}</Sheet.Description>

        <div className="mt-6 flex flex-col gap-5">
          <TextField
            isRequired
            value={draft.title}
            onChange={(next) => setDraft({ ...draft, title: next })}
          >
            <TextField.Label>Title</TextField.Label>
            <TextField.Input />
            <TextField.Error>A task needs a title.</TextField.Error>
          </TextField>

          <TextArea
            value={draft.description}
            onChange={(description) => setDraft({ ...draft, description })}
          >
            <TextArea.Label>Description</TextArea.Label>
            <TextArea.Input rows={4} placeholder="What does done look like?" />
          </TextArea>

          <Select
            aria-label="Column"
            selectedKey={draft.column}
            onChange={(key) =>
              setDraft({ ...draft, column: String(key) as ColumnId })
            }
          >
            <Select.Label>Column</Select.Label>
            <Select.Button>
              <Select.Value />
              <Select.Icon />
            </Select.Button>
            <Select.Popover>
              <Select.OptionList>
                {COLUMNS.map((column) => (
                  <Select.Option key={column.id} id={column.id}>
                    {column.title}
                  </Select.Option>
                ))}
              </Select.OptionList>
            </Select.Popover>
          </Select>

          <div className="flex flex-col gap-2">
            <span
              id={task.id + '-priority'}
              className="font-mono text-[12px] tracking-[0.04em] text-foreground/55 uppercase"
            >
              Priority
            </span>
            <ToggleButtonGroup
              aria-labelledby={task.id + '-priority'}
              selectionMode="single"
              selectedKeys={[draft.priority]}
              onSelectionChange={(keys) => {
                const chosen = [...keys].at(0)
                if (chosen === undefined) return
                setDraft({ ...draft, priority: String(chosen) as Priority })
              }}
            >
              {PRIORITIES.map((priority) => (
                <ToggleButtonGroup.Button key={priority.id} id={priority.id}>
                  {priority.label}
                </ToggleButtonGroup.Button>
              ))}
            </ToggleButtonGroup>
          </div>

          <Select
            aria-label="Assignee"
            selectedKey={draft.assignee ?? UNASSIGNED}
            onChange={(key) =>
              setDraft({
                ...draft,
                assignee:
                  String(key) === UNASSIGNED ? null : (String(key) as MemberId),
              })
            }
          >
            <Select.Label>Assignee</Select.Label>
            <Select.Button>
              <Select.Value />
              <Select.Icon />
            </Select.Button>
            <Select.Popover>
              <Select.OptionList>
                <Select.Option id={UNASSIGNED} textValue="Unassigned">
                  Unassigned
                </Select.Option>
                {MEMBERS.map((member) => (
                  <Select.Option key={member.id} id={member.id}>
                    {member.name}
                  </Select.Option>
                ))}
              </Select.OptionList>
            </Select.Popover>
          </Select>

          {/*
            **The due date is a DatePicker, and the task keeps a plain ISO string.** The component's
            value is a `DateValue` — a calendar date, not an instant — so the two ends are `parseDate`
            and `toString`, and everything between them (the model, the storage, the card's own label)
            stays a date with no time zone to get wrong. A picker is also the only one of the two that
            can be *used* without knowing what this locale's date format is.
          */}
          <DatePicker
            value={draft.due === null ? null : parseDate(draft.due)}
            onChange={(date) =>
              setDraft({
                ...draft,
                due: date === null ? null : date.toString(),
              })
            }
          >
            <DatePicker.Label>Due</DatePicker.Label>
            <DatePicker.Group>
              <DatePicker.Input />
              <DatePicker.Button />
            </DatePicker.Group>
            <DatePicker.Hint>
              Clear it to take the date off the card.
            </DatePicker.Hint>
          </DatePicker>

          <div className="grid grid-cols-3 gap-3">
            <NumberField
              value={draft.points}
              minValue={1}
              maxValue={21}
              onChange={(points) => setDraft({ ...draft, points })}
            >
              <NumberField.Label>Points</NumberField.Label>
              <NumberField.Group>
                <NumberField.Input />
                <NumberField.Counter />
              </NumberField.Group>
            </NumberField>

            <NumberField
              value={draft.subtasks.done}
              minValue={0}
              maxValue={99}
              onChange={(done) =>
                setDraft({
                  ...draft,
                  subtasks: { ...draft.subtasks, done },
                })
              }
            >
              <NumberField.Label>Done</NumberField.Label>
              <NumberField.Group>
                <NumberField.Input />
                <NumberField.Counter />
              </NumberField.Group>
            </NumberField>

            <NumberField
              isWheelDisabled
              value={draft.subtasks.total}
              minValue={0}
              maxValue={99}
              onChange={(total) =>
                setDraft({
                  ...draft,
                  subtasks: { ...draft.subtasks, total },
                })
              }
            >
              <NumberField.Label>Of</NumberField.Label>
              <NumberField.Group>
                <NumberField.Input />
                <NumberField.Counter />
              </NumberField.Group>
            </NumberField>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[12px] tracking-[0.04em] text-foreground/55 uppercase">
              Tags
            </span>
            {/*
              A group with no chips in it is a label over nothing, so the sheet says what it means
              instead: this card carries none, so there is nothing to offer it.
            */}
            {tags.length === 0 ? (
              <p className="text-[12px] text-foreground/45">
                No tags on this card yet.
              </p>
            ) : (
              <TagGroup
                aria-label="Tags"
                selectionMode="multiple"
                selectedKeys={draft.tags}
                onSelectionChange={(keys) =>
                  setDraft({
                    ...draft,
                    tags: keys === 'all' ? [] : [...keys].map(String),
                  })
                }
              >
                <TagGroup.List>
                  {tags.map((tag) => (
                    <TagGroup.Tag
                      key={tag}
                      id={tag}
                      textValue={tag}
                      variant={draft.tags.includes(tag) ? 'teal' : 'outline'}
                    >
                      {tag}
                    </TagGroup.Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            )}
          </div>
        </div>

        {/*
          **Sticky, because eight fields do not fit a 96-wide sheet and the footer is where Save is.**
          Without it the panel scrolls and the only way to keep a change is to scroll to the end of a
          form you have already filled in — which is also what made this page's own test flaky: a
          hit-testing click on a button below the fold cannot land. The background is the panel's own
          surface, so the fields pass behind it rather than through it.
        */}
        <Sheet.Footer className="sticky bottom-0 bg-card">
          {/*
            **Three buttons at their smallest size, because the panel is 384 wide and a footer that
            overflows it clips the one button that matters.** "Cancel" is a plain button carrying the
            close slot rather than `Sheet.Close`, which is the same thing at the panel's own size — the
            slot is the mechanism, and it is what lets the row keep one height.
          */}
          <Button
            variant="text"
            color="danger"
            size="sm"
            onPress={() => {
              onDelete(task.id)
              setOpen(false)
            }}
          >
            <Button.Text>Delete</Button.Text>
          </Button>
          <Button variant="ghost" size="sm" slot="close">
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button size="sm" onPress={commit}>
            <Button.Text>Save</Button.Text>
          </Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  )
}

/* ------------------------------------------------------------------------------------------------
 * Icons, inline, as this library does everywhere: no icon dependency, one glyph each, and a viewBox
 * so Button.Icon's w-auto has a ratio to work from.
 * ---------------------------------------------------------------------------------------------- */

const GRIP = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 6h10M3 10h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const KEBAB = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    {/*
      Three dots, spaced as far apart as the box allows. Measured at this button's size an icon is
      drawn at about eight pixels square, where `1.4`-radius circles a unit and a half apart are a
      single vertical bar rather than three dots — which is exactly how the first version read.
    */}
    <circle cx="8" cy="2.5" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13.5" r="1.5" />
  </svg>
)

const PLUS = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 3v10M3 8h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const UNDO = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 7h7a3.5 3.5 0 0 1 0 7H7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M5.5 4 3 7l2.5 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
