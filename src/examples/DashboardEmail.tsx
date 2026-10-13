import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Selection } from 'react-aria-components'

import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { Menu } from '../components/Menu/Menu'
import { Modal } from '../components/Modal/Modal'
import { Nav } from '../components/Nav/Nav'
import { SearchField } from '../components/SearchField/SearchField'
import { Separator } from '../components/Separator/Separator'
import { Sparkline } from '../components/Sparkline/Sparkline'
import { Table } from '../components/Table/Table'
import { Tabs } from '../components/Tabs/Tabs'
import { CHIP } from '../components/TagGroup/TagGroup'
import { VisuallyHidden } from '../components/VisuallyHidden/VisuallyHidden'

import {
  IconArchive,
  IconAssign,
  IconBell,
  IconBookmark,
  IconBuilding,
  IconCalendar,
  IconCheckDouble,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconCollapse,
  IconColumns,
  IconCustomers,
  IconDashboard,
  IconDots,
  IconEnvelope,
  IconExpand,
  IconExport,
  IconFeedback,
  IconFilter,
  IconFlag,
  IconGlobe,
  IconGrip,
  IconHelp,
  IconImport,
  IconInfo,
  IconLeads,
  IconMail,
  IconMapPin,
  IconMessages,
  IconOrders,
  IconPencil,
  IconPhone,
  IconPlus,
  IconPlusCircle,
  IconRate,
  IconSearch,
  IconSettings,
  IconShare,
  IconSliders,
  IconSort,
  IconStatus,
  IconTable,
  IconTag,
  IconTrash,
  IconTrendDown,
  IconTrendUp,
  IconUserPlus,
} from './dashboardIcons'
import {
  LEAD_ACTIONS,
  LEAD_TABS,
  LEADS,
  ME,
  NAV_BRANCHES,
  SCORE_SEGMENTS,
  SELECTION_ACTIONS,
  TEAMMATES,
  VIEWS,
  formatDay,
  formatDelta,
  leadStats,
  scoreLabel,
  segmentLit,
  segmentTone,
  visibleLeads,
} from './leads'
import type { Lead, LeadStatus, ViewId } from './leads'

/**
 * The leads dashboard: a worked example of the design system doing a whole sales page — sidebar,
 * headline figures, a filterable table, and a lead that opens out of its own row into a card, which
 * opens again into the full record.
 *
 * **It is an example, not a component, which is why it lives here and has no story.** The same
 * reasoning as Login, Create and TaskBoard: a story is what publishes a page as part of the library's
 * API through the components manifest this project's MCP tools serve, and a page is not an API. It is
 * tested by `DashboardEmail.browser.test.tsx` in the components project, and the route file that
 * serves it stays thin.
 *
 * Four decisions shape everything below.
 *
 * **The arithmetic is in `leads.ts`, and this file only draws it.** What a view keeps, what a score's
 * segments mean, what the header adds up to and what `formatDay` returns are all plain functions over
 * `Lead[]`. That is the split TaskBoard's `board.ts` argues for, for the same reason: a filter that
 * lives inside a render is a filter no test can hold, and this page's numbers are the part a reader
 * would actually check.
 *
 * **The card is the design system's `Modal`, and the two things it cannot be given are written on the
 * dialog itself as inline styles.** See the note on `LeadCard` — this is a measurement, not a
 * preference, and it is the same class of problem `docs/components/sheet.md` records for
 * `SheetContent`.
 *
 * **The card is one surface at two sizes, not two surfaces.** Every intermediate frame of the
 * reference is the same rounded box at a different size with different contents inside it, so that is
 * what this is: one dialog whose `inline-size` and `block-size` are the only things that change, with
 * two absolutely-positioned content layers crossfading inside it. Neither layer can influence the box,
 * so nothing reflows mid-flight — **a morph is a box that changes size while its contents hold still.**
 *
 * **The movement is the Web Animations API, not CSS.** `styles.css` is the design system's, and a page
 * has no business adding to it; a page's own motion is the page's. Four animations run: the card
 * arriving, the board going back when it closes, and one stagger per card size. All four are skipped
 * whole under `prefers-reduced-motion: reduce` — the state change still happens, on the next frame,
 * with no travel.
 */

/** The day this example is written for. A real product would pass its own. */
const TODAY = '2026-10-12'

/**
 * How long the morph takes, in milliseconds.
 *
 * **Longer than anything in the token sheet, and that is the point.** Every duration the system
 * declares answers a press: 120ms is feedback and 200ms is the ceiling for a surface arriving. A morph
 * is not feedback — it is the page saying that the card you are looking at is the row you were looking
 * at a moment ago — and that story does not fit in 200ms. 480ms is the top of the range where the eye
 * still reads one object changing size rather than two crossfading.
 */
const MORPH_MS = 480

/** The system's easing curve, read here because WAAPI takes a string and `--ease-pulse` is a token. */
const MORPH_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

/** One element of a stagger: how long it takes, and how far it comes. */
const STAGGER_MS = 160
const STAGGER_RISE = '0.35rem'

const cls = (...parts: (string | false | undefined | null)[]) =>
  parts.filter(Boolean).join(' ')

/** The one media query this page cares about. */
const STILL = '(prefers-reduced-motion: reduce)'

/**
 * Should the page move?
 *
 * **The one place the query is read, and it is read as a subscription rather than as a one-off.** Every
 * animation below asks this first, so the whole motion layer has a single switch: flip the OS setting
 * and everything stops, including a transition that is already half way through.
 *
 * `useSyncExternalStore` rather than a `useState` in an effect, and that is a server-render decision:
 * the page is prerendered, and a value that can only be known in the browser has to have a *server*
 * snapshot as well as a client one or React hydrates a mismatch. The server snapshot here says "let it
 * move", which is also the browser's own default, so the two agree on the first paint and React
 * re-reads the client value immediately after.
 */
function useMotionAllowed() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia(STILL)
      query.addEventListener('change', onStoreChange)
      return () => query.removeEventListener('change', onStoreChange)
    },
    () => !window.matchMedia(STILL).matches,
    () => true,
  )
}

/** The same question, asked outside a render — an effect cannot call a hook. */
function motionAllowed() {
  return typeof window === 'undefined' || !window.matchMedia(STILL).matches
}

/**
 * Play one stagger over a subtree: every `[data-stagger]` element rises into place, each after its own
 * delay in milliseconds.
 *
 * **`fill: 'backwards'`, and it matters.** A delay alone would leave an element at its *finished* look
 * until the delay elapsed and then snap it to the start and animate — the wrong way round. Backwards
 * fill holds the start frame through the delay instead. There is no `forwards`: when the animation
 * ends the element returns to its own stylesheet state, which is exactly where it should stay, so
 * nothing is left pinned by an exhausted animation.
 */
function playStagger(root: HTMLElement | null) {
  if (!root || !motionAllowed()) return
  for (const node of root.querySelectorAll<HTMLElement>('[data-stagger]')) {
    node.animate(
      [
        { opacity: 0, transform: 'translateY(' + STAGGER_RISE + ')' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: STAGGER_MS,
        delay: Number(node.dataset.stagger ?? 0),
        easing: MORPH_EASE,
        fill: 'backwards',
      },
    )
  }
}

export interface DashboardEmailProps {
  /** The rows. Defaults to the fixture in `leads.ts`. */
  leads?: Lead[]
  /** The day "overdue" is measured against. Defaults to the day this page was written for. */
  today?: string
}

/* ==========================================================================
   Small pieces of the page
   ========================================================================== */

/**
 * The status chip.
 *
 * **It composes `TagGroup`'s own `CHIP` rather than restating the anatomy**, which is the one thing
 * this page can do that a component cannot: this is a tag without a tag group around it, and the class
 * list that makes a chip a chip is exported for exactly this. What is added here is the tone — the
 * hairline and the label take the colour the status means, and nothing is filled, because six filled
 * chips down a column would shout as loudly as each other.
 */
const STATUS_TONE: Record<LeadStatus, string> = {
  Hot: 'border-destructive text-destructive',
  Qualified: 'border-success text-success',
  'In progress': 'border-warning text-warning',
  New: 'border-primary text-primary',
  Open: 'border-border-strong text-foreground/70',
  Pending: 'border-border-soft text-muted-foreground',
}

function StatusChip({ status }: { status: LeadStatus }) {
  return (
    <span
      data-slot="status-chip"
      className={cls(CHIP, 'whitespace-nowrap', STATUS_TONE[status])}
    >
      {status}
    </span>
  )
}

const SEGMENT_TONE: Record<'destructive' | 'warning' | 'success', string> = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
}

/**
 * The score, as ten segments and a pill.
 *
 * The metre is the same width whatever the score, so the pill beside it lines up down the whole
 * column — which is why the reference draws it this way, and why `segmentTone` colours by *position*
 * rather than by value. The lit segments are `aria-hidden` and the count is announced once, in words:
 * ten coloured bars say nothing to a screen reader.
 */
function ScoreMeter({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className="flex items-end gap-[2px]">
        {Array.from({ length: SCORE_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={cls(
              'w-[2px] rounded-full',
              index % 3 === 1 ? 'h-3' : 'h-3.5',
              segmentLit(score, index)
                ? SEGMENT_TONE[segmentTone(index)]
                : 'bg-foreground/15',
            )}
          />
        ))}
      </span>
      <span
        data-slot="score-pill"
        className="rounded-md border border-border-soft px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground"
      >
        {scoreLabel(score)}
      </span>
      <VisuallyHidden>
        {score} of {SCORE_SEGMENTS}
      </VisuallyHidden>
    </span>
  )
}

/** One headline figure: what it is, what it is now, which way it moved, and the line it moved along. */
function StatCard({ stat }: { stat: ReturnType<typeof leadStats>[number] }) {
  return (
    <div
      data-slot="stat"
      className="flex items-center justify-between gap-4 border-e border-border-soft px-5 py-4 last:border-e-0"
    >
      <div className="min-w-0">
        <p className="truncate text-[12px] uppercase tracking-[0.04em] text-muted-foreground">
          {stat.label}
        </p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[26px] leading-none font-semibold tabular-nums">
            {stat.value}
          </span>
          {/* The arrow, the sign and the colour say which way three times, because the two that
              survive a monochrome screen or a colour-blind reader are the ones that have to be
              there. */}
          <span
            className={cls(
              'inline-flex items-center gap-1 text-[12px] tabular-nums',
              stat.up ? 'text-success' : 'text-destructive',
            )}
          >
            {stat.up ? (
              <IconTrendUp className="size-3.5" />
            ) : (
              <IconTrendDown className="size-3.5" />
            )}
            {formatDelta(stat.delta)}
          </span>
        </p>
      </div>
      <Sparkline
        data={stat.series}
        label={stat.label + ' over the last ten weeks'}
        className="h-12 w-24 shrink-0 text-primary"
      />
    </div>
  )
}

/** The mark beside a workspace in the sidebar. Two pixels, and the only colour down there. */
const NAV_TONE = {
  primary: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
} as const

/**
 * The glyph beside a destination.
 *
 * **A partial map, not a complete one, and the type says so.** Two of the sidebar's leaves are not
 * destinations with a mark — a workspace is a coloured square and "Productivity" has nothing beside
 * it at all. Typing this as a lookup keyed on every id would tell the compiler a glyph always exists,
 * which is how a missing one becomes a crash rather than a blank; the `| undefined` in the type is
 * what keeps the guard below honest.
 */
const NAV_ICON: Record<
  string,
  React.ComponentType<{ className?: string }> | undefined
> = {
  dashboard: IconDashboard,
  leads: IconLeads,
  orders: IconOrders,
  customers: IconCustomers,
  messages: IconMessages,
  feedback: IconFeedback,
  help: IconHelp,
  settings: IconSettings,
}

/* ==========================================================================
   The sidebar
   ========================================================================== */

/**
 * The workspace sidebar.
 *
 * **The one link in it is the page you are on, and everything else is a row.** The leaf that names a
 * destination this repo actually has is an anchor, so middle-click, the status bar and a screen reader
 * get a real destination; the rest are React Aria tree rows with no `href`, which is what they are —
 * destinations that do not exist here. Writing `href="#"` for those would put eleven dead anchors in
 * the tab order and say nothing, and this is the difference between a mock and an example.
 */
function Sidebar() {
  return (
    <aside
      data-slot="dashboard-sidebar"
      className="flex w-56 shrink-0 flex-col border-e border-border-soft bg-sidebar"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-md bg-foreground text-[15px] font-bold text-background"
        >
          C
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-foreground">
            Conceptzilla
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            Free Workflow
          </span>
        </span>
        <Button
          variant="icon"
          color="neutral"
          size="sm"
          aria-label="Switch workspace"
        >
          <Button.Icon>
            <IconChevronDown className="size-4" />
          </Button.Icon>
        </Button>
      </div>

      <div className="px-4 pb-3">
        <SearchField aria-label="Search the workspace" className="w-full">
          <SearchField.Group>
            <SearchField.Icon>
              <IconSearch className="size-4" />
            </SearchField.Icon>
            <SearchField.Input placeholder="Search" />
          </SearchField.Group>
        </SearchField>
      </div>

      <Nav
        aria-label="Workspace"
        selectedRoute="/dashboard-email"
        className="min-h-0 flex-1 overflow-y-auto pb-4"
      >
        {NAV_BRANCHES.map((branch) => (
          <Nav.Section key={branch.id}>
            <Nav.Header>
              <span className="flex items-center gap-2.5">
                <IconChevronUp className="size-3.5 text-foreground/30" />
                {branch.label}
              </span>
            </Nav.Header>
            {branch.items.map((item) => {
              const Icon = NAV_ICON[item.id]
              return (
                <Nav.Item
                  key={item.id}
                  textValue={item.label}
                  href={item.id === 'leads' ? '/dashboard-email' : undefined}
                >
                  <Nav.Label>
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="grid size-4 shrink-0 place-items-center text-foreground/45">
                        {Icon ? <Icon className="size-4" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.tone ? (
                        <span
                          aria-hidden="true"
                          className={cls(
                            'size-2 shrink-0',
                            NAV_TONE[item.tone],
                          )}
                        />
                      ) : null}
                      {item.count !== undefined ? (
                        <Nav.Count>{item.count}</Nav.Count>
                      ) : null}
                    </span>
                  </Nav.Label>
                </Nav.Item>
              )
            })}
          </Nav.Section>
        ))}
      </Nav>

      <div className="mt-auto flex items-center gap-3 border-t border-border-soft px-4 py-3">
        <Avatar alt={ME} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium text-foreground">
            {ME}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            aiden@workflow.com
          </span>
        </span>
        <Button
          variant="icon"
          color="neutral"
          size="sm"
          aria-label="Account menu"
        >
          <Button.Icon>
            <IconDots className="size-4" />
          </Button.Icon>
        </Button>
      </div>
    </aside>
  )
}

/* ==========================================================================
   The lead card
   ========================================================================== */

/** The identity line under the name. The data has the company, so the role follows from it. */
function roleOf(lead: Lead) {
  return 'Head of sales at ' + lead.company
}

/**
 * One row of the record: what it is, and what it is.
 *
 * The icon is decorative, so it is `aria-hidden` and the label beside it is real text — a screen
 * reader hears "Status: Hot", never "diamond". The pair is a definition list in all but spelling.
 */
function DetailRow({
  icon,
  label,
  delay,
  children,
}: {
  icon: React.ReactNode
  label: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <div data-stagger={delay} className="flex items-center gap-3 px-5 py-2">
      <span aria-hidden="true" className="text-foreground/45">
        {icon}
      </span>
      <span className="w-20 shrink-0 text-[13px] text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
        {children}
      </span>
    </div>
  )
}

/** The glyph beside a menu item. */
const MENU_ICON: Record<string, React.ReactNode> = {
  qualify: <IconCheckDouble className="size-4 text-foreground/45" />,
  pipeline: <IconPlusCircle className="size-4 text-foreground/45" />,
  priority: <IconFlag className="size-4 text-foreground/45" />,
  status: <IconTag className="size-4 text-foreground/45" />,
  manager: <IconUserPlus className="size-4 text-foreground/45" />,
  archive: <IconArchive className="size-4 text-foreground/45" />,
}

/**
 * The lead, as a card that opens.
 *
 * **This is `Modal`, and two of its numbers are overridden inline — which is a measurement rather
 * than a shortcut.** `Modal.Content` renders the dialog inside a React Aria `Modal` layer that it has
 * already given `className="w-full max-w-md"`, and the dialog itself carries `w-full max-w-md p-6`.
 * There is no prop that reaches either layer, and a class of mine cannot be relied on to beat a class
 * of its own — Tailwind resolves two `width` utilities by its own emission order, not by the order
 * they are written. So the size and the centring go on the dialog as `style`, which is the one thing
 * that always wins. This is the same problem `docs/components/sheet.md` records for `SheetContent`,
 * one level further out: there the library wrote `style`, here it wrote a class list.
 *
 * The overrides are these, and nothing else:
 *
 * - `inlineSize` and `blockSize` — the morph. Both states are `min()` expressions so the browser can
 *   interpolate one into the other, and both are inside the `max-w-md` and `max-h-[90dvh]` the
 *   component already declared, so neither is fought.
 * - `marginInline: auto` — a 320px block inside the layer's 448px box is otherwise flush left.
 * - `transitionProperty` and `transitionDuration` — the size change is a CSS transition rather than a
 *   WAAPI animation, because a transition on the element's own box survives both the mount and the
 *   expand with one declaration. The duration is the constant above, so the CSS transition and the
 *   JS animations cannot drift apart.
 *
 * `p-6` is left alone deliberately: the two content layers are `absolute inset-0`, and an absolutely
 * positioned child is laid out against its ancestor's *padding* box, so they cover the padding rather
 * than sit inside it. Nothing needs to be un-set.
 */
function LeadCard({
  lead,
  expanded,
  onToggleExpanded,
  onClose,
  onAction,
}: {
  lead: Lead
  expanded: boolean
  onToggleExpanded: () => void
  onClose: () => void
  onAction: (id: string) => void
}) {
  const compactRef = useRef<HTMLDivElement>(null)
  const fullRef = useRef<HTMLDivElement>(null)

  /**
   * Whether this machine wants movement at all, read as a subscription.
   *
   * **The box transition is the one piece of motion here CSS owns rather than JavaScript**, so it needs
   * the same switch as the WAAPI animations or a reader who has asked for stillness gets a 480ms grow
   * and, in the same breath, no stagger inside it. With `0ms` the card is simply at its other size on
   * the next frame — the state change the user asked for, minus the travel.
   */
  const moving = useMotionAllowed()
  const sizeTransition = moving ? MORPH_MS + 'ms' : '0ms'

  /**
   * The dialog itself. `Modal.Content` takes no `ref`, and its own layer is out of reach, so the
   * element is found from a layer inside it — which is also what keeps this free of a document query
   * that would find the wrong dialog the moment two are on a page.
   */
  const cardOf = () =>
    fullRef.current?.closest<HTMLElement>('[data-slot="lead-card"]') ?? null

  // The card arriving. Keyed on the lead, so opening a second one plays it again.
  useEffect(() => {
    const card = cardOf()
    if (!card || !moving) return
    card.animate(
      [
        { opacity: 0, transform: 'scale(0.9)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: MORPH_MS, easing: MORPH_EASE },
    )
    playStagger(compactRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  /**
   * The two layers, moving past each other.
   *
   * **The compact contents do not simply fade.** They rise and leave while the full record's rise
   * into place, so what the eye follows is one block of content travelling upward as the card grows —
   * which is what the reference animates. A plain crossfade leaves both arrangements on screen at once
   * at the midpoint, and reads as a dissolve rather than as a move.
   *
   * **The exit animations are held and cancelled** rather than left to expire: they end at
   * `opacity: 0` with `fill: 'forwards'`, so without the cancel the compact card would come back
   * invisible when it was collapsed into again.
   */
  const exiting = useRef<Animation[]>([])

  /**
   * **The half that is left behind must not take the focus with it.**
   *
   * Expanding makes the compact layer `inert`, and the control the reader just pressed — Expand the
   * lead — lives inside it. An inert subtree cannot hold focus, so the browser drops it to `<body>`,
   * which is *outside* the dialog: measured in the browser, the card was left with no focused element
   * and the Escape key stopped closing it — for a keyboard user, on the one control that had just been
   * used. Putting focus back on the dialog is the standard answer and the predictable one: the reader
   * lands at the top of the surface they are still inside, and the next Tab reaches Collapse.
   */
  useEffect(() => {
    if (!expanded) return
    // **A frame later, not on the commit.** The browser moves focus out of an inert subtree as it
    // processes the attribute, which is *after* React's effects have run — measured: focusing the
    // dialog in the effect itself was undone a moment later, and `document.activeElement` was back on
    // `<body>` by the time anyone could look. One animation frame puts this on the far side of that.
    const frame = requestAnimationFrame(() => {
      const card = cardOf()
      if (!card) return
      // **The guard is about the *record*, not about the dialog.** Asking "is focus inside the card"
      // answers yes at this point — the Expand button is inside the card, inside the half being left
      // behind — and skipping the move on that answer is what made the first two attempts do nothing.
      // What matters is whether focus is already in the half that survives.
      if (fullRef.current?.contains(document.activeElement)) return
      card.focus()
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  useEffect(() => {
    if (!expanded) {
      for (const animation of exiting.current) animation.cancel()
      exiting.current = []
      return
    }

    playStagger(fullRef.current)

    if (!moving) return
    exiting.current = Array.from(
      compactRef.current?.querySelectorAll<HTMLElement>('[data-stagger]') ?? [],
    ).map((node) =>
      node.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-0.5rem)' },
        ],
        { duration: STAGGER_MS, easing: MORPH_EASE, fill: 'forwards' },
      ),
    )
  }, [expanded])

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        color="primary"
        size="sm"
        block
        className="flex-1"
      >
        <Button.Icon>
          <IconEnvelope className="size-4" />
        </Button.Icon>
        <Button.Text>Compose email</Button.Text>
      </Button>
      <Button
        variant="outline"
        color="neutral"
        size="sm"
        aria-label="Save lead"
      >
        <Button.Icon>
          <IconBookmark className="size-4" />
        </Button.Icon>
      </Button>
      <Menu>
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          aria-label="Lead actions"
        >
          <Button.Icon>
            <IconDots className="size-4" />
          </Button.Icon>
        </Button>
        <Menu.Popover
          className="min-w-56"
          menuProps={{ onAction: (key) => onAction(String(key)) }}
        >
          {LEAD_ACTIONS.map((group, index) => (
            <Fragment key={group.group}>
              {index > 0 ? <Menu.Separator /> : null}
              <Menu.Section>
                {group.items.map((item) => (
                  <Menu.Item key={item.id} id={item.id} textValue={item.label}>
                    <span className="flex items-center gap-2.5">
                      {MENU_ICON[item.id]}
                      {item.label}
                    </span>
                  </Menu.Item>
                ))}
              </Menu.Section>
            </Fragment>
          ))}
        </Menu.Popover>
      </Menu>
    </div>
  )

  /* The one band that is in both sizes and does not move: the grip, what this is, and the two ways
     out of it. */
  const title = (
    <div className="flex items-center gap-2 px-5 pt-4">
      <span aria-hidden="true" className="text-foreground/35">
        <IconGrip className="size-4" />
      </span>
      <span className="flex-1 text-[13px] text-muted-foreground">
        Lead overview
      </span>
      <Button
        variant="text"
        color="neutral"
        size="sm"
        aria-label={expanded ? 'Collapse the lead' : 'Expand the lead'}
        onPress={onToggleExpanded}
      >
        <Button.Icon>
          {expanded ? (
            <IconCollapse className="size-4" />
          ) : (
            <IconExpand className="size-4" />
          )}
        </Button.Icon>
      </Button>
      <Button
        variant="text"
        color="neutral"
        size="sm"
        aria-label="Close"
        onPress={onClose}
      >
        <Button.Icon>
          <IconClose className="size-4" />
        </Button.Icon>
      </Button>
    </div>
  )

  return (
    <Modal.Content
      data-slot="lead-card"
      aria-label={'Lead overview: ' + lead.name}
      style={{
        inlineSize: expanded ? '21.25rem' : '20rem',
        blockSize: expanded ? 'min(38rem, 84dvh)' : 'min(9.5rem, 84dvh)',
        marginInline: 'auto',
        transitionProperty: 'inline-size, block-size',
        transitionDuration: sizeTransition,
        transitionTimingFunction: MORPH_EASE,
      }}
    >
      {/* The description `Modal.Content` points `aria-describedby` at whether or not one is passed.
          A dangling reference is worse than a sentence, so here is the sentence. */}
      <Modal.Description>
        <VisuallyHidden>
          {lead.name} · {roleOf(lead)} · {lead.status}
        </VisuallyHidden>
      </Modal.Description>

      {/* --- the compact card --------------------------------------------- */}
      <div
        ref={compactRef}
        data-slot="lead-compact"
        aria-hidden={expanded || undefined}
        inert={expanded || undefined}
        className={cls(
          'absolute inset-0 flex flex-col transition-opacity ease-pulse',
          expanded ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
        style={{ transitionDuration: sizeTransition }}
      >
        {title}
        <div data-stagger={60} className="flex items-center gap-3 px-5 py-4">
          <Avatar alt={lead.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">
              {lead.name}
            </span>
            <span className="block truncate text-[12px] text-muted-foreground">
              {roleOf(lead)}
            </span>
          </span>
        </div>
        <div data-stagger={120} className="mt-auto px-5 pb-4">
          {actions}
        </div>
      </div>

      {/* --- the full record --------------------------------------------- */}
      <div
        ref={fullRef}
        data-slot="lead-full"
        aria-hidden={!expanded || undefined}
        inert={!expanded || undefined}
        className={cls(
          'absolute inset-0 flex flex-col overflow-y-auto overscroll-contain',
          'transition-opacity ease-pulse',
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ transitionDuration: sizeTransition }}
      >
        {title}
        {/* The identity block is the one thing that genuinely moves: centred, with a larger avatar.
            The reference does exactly this, and the size change is the cue that says the card you are
            looking at is the same card, grown. */}
        <div
          data-stagger={60}
          className="flex flex-col items-center gap-2 px-5 pt-4 pb-1"
        >
          <Avatar alt={lead.name} size="lg" />
          <span className="text-center">
            <span className="block text-[16px] font-semibold">{lead.name}</span>
            <span className="block text-[12px] text-muted-foreground">
              {roleOf(lead)}
            </span>
          </span>
        </div>
        <div data-stagger={120} className="px-5 pt-3">
          {actions}
        </div>
        <div data-stagger={180} className="mt-3">
          <Tabs defaultSelectedKey="info">
            <Tabs.List aria-label="Lead record">
              {LEAD_TABS.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            <Tabs.Panels>
              {/* **One panel per tab, all three holding the record.** A `Tabs.Panel` renders
                  nothing without an `id` that matches its tab — the component's own docs say so, and
                  this is the second place in this page that caught it. Since the three tabs are three
                  readings of one record rather than three records, they all carry the same rows. */}
              {LEAD_TABS.map((tab) => (
                <Tabs.Panel key={tab.id} id={tab.id}>
                  <DetailRow
                    icon={<IconStatus className="size-4" />}
                    label="Status"
                    delay={200}
                  >
                    <StatusChip status={lead.status} />
                  </DetailRow>
                  <DetailRow
                    icon={<IconPhone className="size-4" />}
                    label="Phone"
                    delay={235}
                  >
                    {lead.phone}
                  </DetailRow>
                  <DetailRow
                    icon={<IconMail className="size-4" />}
                    label="Email"
                    delay={270}
                  >
                    {lead.email}
                  </DetailRow>
                  <DetailRow
                    icon={<IconBuilding className="size-4" />}
                    label="Company"
                    delay={305}
                  >
                    {lead.company}
                  </DetailRow>
                  <DetailRow
                    icon={<IconMapPin className="size-4" />}
                    label="Location"
                    delay={340}
                  >
                    {lead.location}
                  </DetailRow>
                  <DetailRow
                    icon={<IconGlobe className="size-4" />}
                    label="Source"
                    delay={375}
                  >
                    {lead.source}
                  </DetailRow>
                  <DetailRow
                    icon={<IconCalendar className="size-4" />}
                    label="Due date"
                    delay={410}
                  >
                    {formatDay(lead.due)}
                  </DetailRow>
                  <DetailRow
                    icon={<IconRate className="size-4" />}
                    label="Rate"
                    delay={445}
                  >
                    {lead.rate}%
                  </DetailRow>
                </Tabs.Panel>
              ))}
            </Tabs.Panels>
          </Tabs>
        </div>
      </div>
    </Modal.Content>
  )
}

/* ==========================================================================
   The selection bar
   ========================================================================== */

/**
 * The bar that appears when rows are checked.
 *
 * It sits on the page rather than in the flow — a selection is a mode, and a mode that pushes the
 * table down as it appears is a mode that moves the thing you were reading. The surface is the
 * system's own card with a hairline rather than an inverted pill, and that is `Button`'s doing:
 * a label's colour comes from `--btn`, which every colour sets *on the button itself*, so a bar cannot
 * hand its own buttons the background colour without reaching into their recipe. The panel says the
 * same thing — this is a surface over the page, not part of it — without that.
 */
function SelectionBar({
  count,
  onDiscard,
  onAction,
}: {
  count: number
  onDiscard: () => void
  onAction: (id: string) => void
}) {
  return (
    <div
      data-slot="selection-bar"
      className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border-strong bg-card p-1.5">
        <span className="px-3 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
          Selected: {count}
        </span>
        <Separator orientation="vertical" className="mx-1 h-6" />
        {SELECTION_ACTIONS.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            color={action.id === 'delete' ? 'danger' : 'neutral'}
            size="sm"
            onPress={() => onAction(action.id)}
          >
            <Button.Icon>
              {action.id === 'edit' ? (
                <IconPencil className="size-4" />
              ) : action.id === 'assign' ? (
                <IconAssign className="size-4" />
              ) : (
                <IconTrash className="size-4" />
              )}
            </Button.Icon>
            <Button.Text>{action.label}</Button.Text>
          </Button>
        ))}
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="default" color="neutral" size="sm" onPress={onDiscard}>
          <Button.Text>Discard</Button.Text>
        </Button>
      </div>
    </div>
  )
}

/* ==========================================================================
   The page
   ========================================================================== */

export function DashboardEmail({
  leads = LEADS,
  today = TODAY,
}: DashboardEmailProps) {
  const [view, setView] = useState<ViewId>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const stats = useMemo(() => leadStats(leads), [leads])
  const rows = useMemo(
    () => visibleLeads(leads, view, query, today),
    [leads, view, query, today],
  )
  const lead = useMemo(
    () => (openId ? (leads.find((item) => item.id === openId) ?? null) : null),
    [leads, openId],
  )

  function openLead(id: string) {
    setExpanded(false)
    setOpenId(id)
  }

  function closeLead() {
    setExpanded(false)
    setOpenId(null)
  }

  /** Both menus are the same menu: the page answers a choice, and only Archive changes anything. */
  function runAction(id: string) {
    if (id === 'archive') closeLead()
    if (id === 'open') return
  }

  return (
    <div
      data-slot="dashboard-email"
      className="relative min-h-dvh bg-muted p-6 text-foreground"
    >
      <div
        data-slot="dashboard-app"
        className="mx-auto flex h-[calc(100dvh-3rem)] max-w-[96rem] overflow-hidden rounded-xl border border-border-strong bg-background"
      >
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border-soft px-6 py-4">
            <h1 className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
              Leads
            </h1>
            <span className="text-[13px] tabular-nums text-muted-foreground">
              {rows.length}
            </span>
            <div className="ms-auto flex items-center gap-1.5">
              <Button
                variant="icon"
                color="neutral"
                size="sm"
                aria-label="About leads"
              >
                <Button.Icon>
                  <IconInfo className="size-4" />
                </Button.Icon>
              </Button>
              <Button
                variant="icon"
                color="neutral"
                size="sm"
                aria-label="Lead settings"
              >
                <Button.Icon>
                  <IconSettings className="size-4" />
                </Button.Icon>
              </Button>
              <Button
                variant="icon"
                color="neutral"
                size="sm"
                aria-label="Notifications"
              >
                <Button.Icon>
                  <IconBell className="size-4" />
                </Button.Icon>
              </Button>
              <span className="mx-2 flex items-center">
                {TEAMMATES.map((name, index) => (
                  <span key={name} className={cls(index > 0 && '-ms-3')}>
                    <span className="block rounded-full ring-2 ring-background">
                      <Avatar alt={name} size="sm" />
                    </span>
                  </span>
                ))}
                <span className="-ms-3 grid size-8 place-items-center rounded-full bg-muted text-[11px] text-muted-foreground ring-2 ring-background">
                  +5
                </span>
              </span>
              <Button variant="default" color="primary" size="sm">
                <Button.Icon>
                  <IconShare className="size-4" />
                </Button.Icon>
                <Button.Text>Share access</Button.Text>
              </Button>
            </div>
          </header>

          <div
            data-slot="stat-row"
            className="grid grid-cols-2 border-b border-border-soft lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>

          <Tabs
            selectedKey={view}
            onSelectionChange={(key) => setView(key as ViewId)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Tabs.List aria-label="Lead views">
              {VIEWS.map((item) => (
                <Tabs.Tab key={item.id} id={item.id}>
                  {item.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            <Tabs.Panels className="flex min-h-0 flex-1 flex-col">
              {/* **One panel per view, all six holding the same board.** A `Tabs.Panel`'s `id` has to
                  match its tab's — the component's own docs say so — and these six tabs are six filters
                  over one table rather than six different tables. A panel with no id renders nothing at
                  all, which is what the first version of this did. React Aria unmounts the panels that
                  are not selected, so exactly one board is ever in the DOM. */}
              {VIEWS.map((item) => (
                <Tabs.Panel
                  key={item.id}
                  id={item.id}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex items-center gap-2 border-b border-border-soft px-6 py-3">
                    <SearchField
                      aria-label="Search leads"
                      value={query}
                      onChange={setQuery}
                      className="w-64"
                    >
                      <SearchField.Group>
                        <SearchField.Icon>
                          <IconSearch className="size-4" />
                        </SearchField.Icon>
                        <SearchField.Input placeholder="Search" />
                      </SearchField.Group>
                    </SearchField>
                    <Button
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      aria-label="Filter"
                    >
                      <Button.Icon>
                        <IconFilter className="size-4" />
                      </Button.Icon>
                    </Button>
                    <Button
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      aria-label="Sort"
                    >
                      <Button.Icon>
                        <IconSort className="size-4" />
                      </Button.Icon>
                    </Button>
                    <Button
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      aria-label="Display options"
                    >
                      <Button.Icon>
                        <IconSliders className="size-4" />
                      </Button.Icon>
                    </Button>
                    <div className="ms-auto flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        aria-label="Card view"
                      >
                        <Button.Icon>
                          <IconColumns className="size-4" />
                        </Button.Icon>
                      </Button>
                      <Button
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        aria-label="Table view"
                      >
                        <Button.Icon>
                          <IconTable className="size-4" />
                        </Button.Icon>
                      </Button>
                      <Separator orientation="vertical" className="mx-1 h-6" />
                      <Button variant="ghost" color="neutral" size="sm">
                        <Button.Icon>
                          <IconImport className="size-4" />
                        </Button.Icon>
                        <Button.Text>Import</Button.Text>
                      </Button>
                      <Button variant="ghost" color="neutral" size="sm">
                        <Button.Icon>
                          <IconExport className="size-4" />
                        </Button.Icon>
                        <Button.Text>Export</Button.Text>
                      </Button>
                      <Button variant="default" color="primary" size="sm">
                        <Button.Icon>
                          <IconPlus className="size-4" />
                        </Button.Icon>
                        <Button.Text>Add lead</Button.Text>
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto">
                    <Table
                      aria-label="Leads"
                      // **This table is drawn denser than the component's default, on purpose, and
                      // the numbers are why.** `Table.Cell` is `px-5` and 13px, which is right for
                      // the three-column table it was designed against; a nine-column lead grid in a
                      // *monospace* body needs 1424px that way — measured, not estimated — against
                      // the 1166 a 224px sidebar leaves on a 1440px screen. React Aria's cell carries
                      // `wrap-anywhere`, so the overflow does not scroll, it wraps, and every row
                      // came out three lines tall. `[&_td]:` and `[&_th]:` are arbitrary variants of
                      // this one table's root: a descendant selector outranks the component's own
                      // class on the cell, so this tightens *this* table without touching a shared
                      // class list that four other surfaces depend on. The floor keeps the rows one
                      // line tall on a narrow window by scrolling rather than wrapping.
                      className="min-w-[1120px] [&_td]:px-3 [&_th]:px-3 [&_td]:text-[12px]"
                      selectionMode="multiple"
                      selectedKeys={selected}
                      onSelectionChange={(keys: Selection) =>
                        setSelected(
                          keys === 'all'
                            ? new Set(rows.map((row) => row.id))
                            : new Set(Array.from(keys, String)),
                        )
                      }
                      onRowAction={(key) => openLead(String(key))}
                    >
                      <Table.Header>
                        {/* The `width`s are hints for a virtualised table and are kept as the
                            declaration of relative size; the table's own `min-width` is what actually
                            lays it out. See the note on `Table` below. */}
                        <Table.Column width={44}>
                          <Table.Selection />
                        </Table.Column>
                        <Table.Column isRowHeader width={176}>
                          Customer
                        </Table.Column>
                        <Table.Column width={128}>Company</Table.Column>
                        <Table.Column width={220}>Email</Table.Column>
                        <Table.Column width={104}>Status</Table.Column>
                        <Table.Column width={104}>Manager</Table.Column>
                        <Table.Column width={96}>Score</Table.Column>
                        <Table.Column width={124}>Created</Table.Column>
                        <Table.Column width={48}>
                          <VisuallyHidden>Actions</VisuallyHidden>
                        </Table.Column>
                      </Table.Header>
                      <Table.Body
                        renderEmptyState={() => (
                          <p className="px-5 py-8 text-[13px] text-muted-foreground">
                            No lead matches this view.
                          </p>
                        )}
                      >
                        {rows.map((row) => (
                          <Table.Row key={row.id} id={row.id}>
                            <Table.Cell>
                              <Table.Selection />
                            </Table.Cell>
                            <Table.Cell className="font-medium text-foreground">
                              {row.name}
                            </Table.Cell>
                            <Table.Cell className="text-foreground/70">
                              {row.company}
                            </Table.Cell>
                            <Table.Cell className="text-foreground/70">
                              {row.email}
                            </Table.Cell>
                            <Table.Cell>
                              <StatusChip status={row.status} />
                            </Table.Cell>
                            <Table.Cell className="text-foreground/70">
                              {row.manager}
                            </Table.Cell>
                            <Table.Cell>
                              <ScoreMeter score={row.score} />
                            </Table.Cell>
                            <Table.Cell className="text-foreground/70">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <IconCalendar className="size-3.5 text-foreground/40" />
                                {formatDay(row.created)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <Menu>
                                <Button
                                  variant="ghost"
                                  color="neutral"
                                  size="sm"
                                  aria-label={'Actions for ' + row.name}
                                >
                                  <Button.Icon>
                                    <IconDots className="size-4" />
                                  </Button.Icon>
                                </Button>
                                <Menu.Popover
                                  className="min-w-44"
                                  menuProps={{
                                    onAction: (key) => {
                                      const action = String(key)
                                      if (action === 'open') openLead(row.id)
                                      else runAction(action)
                                    },
                                  }}
                                >
                                  <Menu.Item id="open" textValue="Open lead">
                                    <span className="flex items-center gap-2.5">
                                      <IconExpand className="size-4 text-foreground/45" />
                                      Open lead
                                    </span>
                                  </Menu.Item>
                                  <Menu.Separator />
                                  <Menu.Item id="edit" textValue="Edit">
                                    <span className="flex items-center gap-2.5">
                                      <IconPencil className="size-4 text-foreground/45" />
                                      Edit
                                    </span>
                                  </Menu.Item>
                                  <Menu.Item id="delete" textValue="Delete">
                                    <span className="flex items-center gap-2.5">
                                      <IconTrash className="size-4 text-foreground/45" />
                                      Delete
                                    </span>
                                  </Menu.Item>
                                </Menu.Popover>
                              </Menu>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                </Tabs.Panel>
              ))}
            </Tabs.Panels>
          </Tabs>
        </main>

        {selected.size > 0 ? (
          <SelectionBar
            count={selected.size}
            onDiscard={() => setSelected(new Set())}
            onAction={runAction}
          />
        ) : null}
      </div>

      {/* A `Modal` is always mounted and knows whether it is open; the card inside it exists only
          while a lead is chosen, so the mount is what starts the arrival animation. */}
      <Modal
        isOpen={lead !== null}
        onOpenChange={(open) => {
          if (!open) closeLead()
        }}
      >
        {lead ? (
          <LeadCard
            lead={lead}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((open) => !open)}
            onClose={closeLead}
            onAction={runAction}
          />
        ) : null}
      </Modal>
    </div>
  )
}
