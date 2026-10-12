import {
  Button as AriaButton,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  useLocale,
  CalendarMonthPicker,
  CalendarYearPicker,
} from 'react-aria-components'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'

import { FIELD } from './field'

/**
 * The anatomy the two date components share. The same split as `field.ts`: everything that does
 * not differ lives here, and each component defines its own slot components over it, so Storybook
 * still documents `DatePicker.Label` as `DatePicker.Label` rather than as its neighbour's.
 *
 * The sheet has no date picker at all, so all of this is invention — but it is invention confined
 * to one file, which is what stops the second component from quietly becoming a fork of the first.
 */

/**
 * The field root. Identical for both, because it is the *field*: the same hairline, the same
 * height, the same teal on focus and on open.
 */
export const DATE_ROOT = [
  FIELD,
  'data-[open]:[--field-border:var(--color-primary)]',
  'data-[focused]:[--field-border:var(--color-primary)]',
  'data-[open]:[--field-hover:var(--color-primary)]',
  '[--dropdown-caret-rotate:0deg]',
  '[--dropdown-caret-ink:color-mix(in_oklch,var(--color-foreground)_50%,transparent)]',
  'data-[open]:[--dropdown-caret-rotate:180deg]',
  'data-[open]:[--dropdown-caret-ink:var(--color-primary)]',
  // A range's two date inputs sit inside one control, so the states that land on the root —
  // invalid, disabled — have no element of their own to dim or recolour. They are published here
  // and read by that control, the same arrangement `Select` uses for its trigger's border.
  'data-[invalid]:not-data-[focused]:[--field-border:var(--color-destructive)]',
  '[--date-control-opacity:1]',
  'data-[disabled]:[--date-control-opacity:0.4]',
].join(' ')

const DATE_CARET = [
  'h-1.5 w-2.5',
  'rotate-(--dropdown-caret-rotate) [color:var(--dropdown-caret-ink)]',
  'motion-safe:transition-[rotate,color] motion-safe:duration-(--duration-base) ease-pulse',
].join(' ')

export const DATE_TRIGGER = [
  'absolute top-1/2 right-3.5 z-10 flex size-3 -translate-y-1/2',
  'items-center justify-center',
  'cursor-pointer',
  'data-[disabled]:cursor-not-allowed',
  // 12px is the drawing, not the target — the pseudo-element makes it 24.
  'after:absolute after:content-[""] after:-inset-1.5',
  'outline-1 outline-offset-1 outline-transparent',
  'data-[focus-visible]:outline-ring',
].join(' ')

/** The sheet's `.ds-select-menu`, the same surface a select's list opens on. */
export const DATE_MENU = [
  'flex w-fit flex-col overflow-clip',
  'border border-border-strong bg-card rounded-xl p-2',
  'shadow-[0_12px_32px_rgba(0,0,0,.7)]',
].join(' ')

/**
 * One day in a month grid.
 *
 * Shared, because a day looks the same whether it arrived from `DatePicker`, `DateRangePicker` or a
 * `Calendar` sitting on the page — which is the whole reason this file exists. It was private to
 * `DatePicker` until a second component needed it.
 */
export const DATE_CELL: string = [
  'flex size-8 items-center justify-center rounded-md',
  'text-[13px] text-foreground/75 tabular-nums cursor-pointer select-none',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[hovered]:bg-foreground/7 data-[hovered]:text-foreground',
  'data-[pressed]:bg-foreground/15',
  'data-[outside-month]:text-foreground/30',
  // A day outside `minValue`/`maxValue` is `data-unavailable`; a day in a wholly disabled
  // calendar is `data-disabled`. Both mean the same thing to the eye, so both are marked.
  // Only days outside `minValue`/`maxValue` are struck through. A day either side of the month is
  // `data-disabled` too — React Aria disables everything outside the visible range — so striking
  // on `data-disabled` alone draws a line through the leading and trailing days of every month,
  // which says "unavailable" about a day that is merely in the wrong month.
  'data-[unavailable]:not-data-[outside-month]:text-foreground/25',
  'data-[unavailable]:not-data-[outside-month]:line-through',
  'data-[disabled]:not-data-[outside-month]:text-foreground/25',
  'data-[disabled]:not-data-[outside-month]:line-through',
  'data-[unavailable]:cursor-not-allowed data-[disabled]:cursor-not-allowed',
  'data-[today]:outline-1 data-[today]:outline-ring',
  'data-[selected]:bg-primary data-[selected]:text-ink',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-[3px]',
  'data-[focus-visible]:outline-ring',
].join(' ')

/**
 * A segment of a date. It takes the field's text colour and its placeholder weight, and marks the
 * one being edited with the same faint wash the sheet puts behind a hovered option rather than
 * with the accent — a field's focus is a teal *border*, and filling a segment in would say
 * "chosen" about one that is only being typed.
 */
export const DATE_SEGMENT = [
  'rounded-md px-0.5 outline-none',
  'text-foreground data-[placeholder]:text-foreground/35',
  'data-[focused]:bg-foreground/12 data-[focused]:text-foreground',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
].join(' ')

/** The month's arrows. */
export const DATE_NAV = [
  'flex size-7 items-center justify-center rounded-md',
  'text-foreground/70 cursor-pointer',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'data-[hovered]:bg-foreground/7 data-[hovered]:text-foreground',
  'data-[focus-visible]:outline-1 data-[focus-visible]:outline-offset-2',
  'data-[focus-visible]:outline-ring',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30',
].join(' ')

/** The sheet's `.ds-field-legend` and `.ds-select-group-label` are both this: 11–12px, spaced. */
export const DATE_HEADING =
  'text-[12px] uppercase tracking-[0.04em] text-muted-foreground tabular-nums'

export const DATE_WEEKDAY =
  'pb-1 text-[11px] uppercase tracking-[0.08em] text-foreground/45 font-normal'

/** The chevron that opens the calendar. */
export function DateCaret() {
  return (
    <svg
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      className={DATE_CARET}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Chevron({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The month: its arrows, its heading, the weekday row and the days. Shared because it is pure
 * boilerplate — React Aria builds a calendar from two render props and a grid, and none of that
 * is a decision either component is making.
 *
 * It takes the two slots that genuinely differ. `Heading` is the month's name, which each
 * component exposes publicly and so must render as its own symbol; `Cell` is the day, where a
 * single date fills one and a range fills two and tints what lies between.
 */

/**
 * The month and the year, as controls rather than as a caption.
 *
 * **This is the difference between a calendar you page through and one you navigate.** Without them the
 * only way to reach March is to press the arrow eleven times, and a monitoring window is usually "last
 * month" rather than "next month" — so the heading is a control, not a label.
 *
 * Borderless and in the heading's own type, because the calendar's header is not a form: these read as
 * part of the title until you point at one, which is the convention a month name already has.
 * `appearance-none` drops the platform's own arrow for the same reason — the sheet has no native control
 * chrome anywhere in it.
 */
const DATE_PICKER = [
  'cursor-pointer appearance-none border-0 bg-transparent p-0',
  'font-mono text-[12px] font-medium tracking-[0.08em] uppercase text-foreground',
  'transition-colors duration-(--duration-fast) ease-pulse',
  'hover:text-primary',
  'outline-2 outline-offset-2 outline-transparent',
  'data-[focus-visible]:outline-ring focus-visible:outline-ring',
].join(' ')

/**
 * One of the two header pickers.
 *
 * **React Aria renders nothing here — it hands you the props and you render the `<select>`.** That is
 * why the component takes no `className` and its `children` is required: it is a render-prop control, not
 * a styled one. It yields `{ 'aria-label', value, onChange, items }`, and `items` must be pulled *out* of
 * what is spread onto the element, or React warns about an unknown `items` attribute.
 */
function DatePicker({
  Picker,
  format,
}: {
  Picker: typeof CalendarMonthPicker | typeof CalendarYearPicker
  format?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
}) {
  return (
    <Picker format={format}>
      {({ items, value, onChange, 'aria-label': ariaLabel }) => (
        // **`onChange` cannot be spread.** React Aria hands back a key — `onChange(key: Key | null)` —
        // and a `<select>` fires an event, so the two are adapted here rather than merged.
        <select
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={DATE_PICKER}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.formatted}
            </option>
          ))}
        </select>
      )}
    </Picker>
  )
}

export function DateCalendarChrome({
  Heading,
  Cell,
  months = 1,
}: {
  /** The month, or the months, in view — rendered only when there is more than one. */
  Heading: React.ComponentType
  Cell: (props: { date: CalendarDate }) => React.ReactElement
  /**
   * How many months to draw. A multi-month calendar needs one grid per month, each with its own
   * `offset` — without them the heading spans both months while the grid shows only the first,
   * which is worse than not offering the prop at all.
   */
  months?: number
}) {
  return (
    <>
      <header className="flex items-center justify-between pb-2">
        <AriaButton
          slot="previous"
          className={DATE_NAV}
          aria-label="Previous month"
        >
          <Chevron className="h-1.5 w-2.5 rotate-90" />
        </AriaButton>
        {months > 1 ? (
          // **A multi-month calendar keeps the heading, and a single-month one takes the pickers.**
          // The heading names the whole span — "March – April 2026" — and no pair of pickers can say a
          // range. A single month has nothing to span, so it can afford to be navigable instead.
          <Heading />
        ) : (
          <div className="flex items-center gap-1.5">
            <DatePicker Picker={CalendarMonthPicker} format="long" />
            <DatePicker Picker={CalendarYearPicker} />
          </div>
        )}
        <AriaButton slot="next" className={DATE_NAV} aria-label="Next month">
          <Chevron className="h-1.5 w-2.5 -rotate-90" />
        </AriaButton>
      </header>
      {/* Side by side, which is the whole point of asking for two: a range's ends are usually in
          different months, and stacking them puts a scroll or a page break between the two things
          being compared. React Aria's grids are tables, so they are block-level and stack unless
          something lays them out. */}
      <div className="flex gap-6">
        {Array.from({ length: months }, (_, i) => (
          <AriaCalendarGrid
            key={i}
            offset={{ months: i }}
            className="border-separate border-spacing-0"
          >
            <AriaCalendarGridHeader>
              {(day) => (
                <AriaCalendarHeaderCell className={DATE_WEEKDAY}>
                  {day}
                </AriaCalendarHeaderCell>
              )}
            </AriaCalendarGridHeader>
            <AriaCalendarGridBody>
              {(date) => <Cell date={date} />}
            </AriaCalendarGridBody>
          </AriaCalendarGrid>
        ))}
      </div>
    </>
  )
}

/**
 * The month, or the months, the calendar is showing.
 *
 * React Aria's `CalendarHeading` renders two nodes: an `aria-hidden` visual one and a separate
 * one for assistive tech. With more than one visible month they disagree — the hidden one, which
 * is the only one anybody sees and the one the consumer's `className` lands on, names just the
 * first month, so a two-month calendar is captioned "October 2026" above a grid showing November
 * as well. Rendering the text here from the calendar's own `visibleRange` gives one node, correct
 * for one month and for two.
 */
export function useVisibleRangeLabel(
  range: { start: CalendarDate; end: CalendarDate } | null,
) {
  const { locale } = useLocale()
  if (!range) return null

  // `formatRange` takes plain `Date`s, so the date values are converted first.
  const zone = getLocalTimeZone()
  const start = range.start.toDate(zone)
  const end = range.end.toDate(zone)
  const sameYear = range.start.year === range.end.year

  /**
   * **The two months are joined here rather than by `formatRange`, and that is a server-render fix.**
   * `Intl.DateTimeFormat#formatRange` puts the separator's spaces in the hands of the runtime's own
   * ICU, and the two runtimes are not the same ICU: measured, `en-GB` came out as
   * `March<U+2009>–<U+2009>April 2024` on this app's dev server and
   * `March<U+0020>–<U+0020>April 2024` in Chrome — the same words with different whitespace, which is
   * enough for React to throw the tree away and re-render it on every load of a page with a calendar on
   * it. Composing the label makes the caption the component's own typography, like everything else the
   * sheet draws, and leaves the environment with nothing to disagree about.
   */
  if (
    range.start.year === range.end.year &&
    range.start.month === range.end.month
  ) {
    return new DateFormatter(locale, { month: 'long', year: 'numeric' }).format(
      end,
    )
  }

  // The year once when both months are in it, which is what a range format would have said.
  const startLabel = new DateFormatter(locale, {
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' as const }),
  }).format(start)
  return `${startLabel} – ${new DateFormatter(locale, { month: 'long', year: 'numeric' }).format(end)}`
}
