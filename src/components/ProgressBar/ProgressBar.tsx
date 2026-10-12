import { ProgressBar as AriaProgressBar } from 'react-aria-components'
import type { ProgressBarProps as AriaProgressBarProps } from 'react-aria-components'

import { createContext, useContext, useId } from 'react'
import type { ReactNode } from 'react'

import {
  FILL,
  HEADER,
  INDETERMINATE,
  LABEL,
  PROGRESS,
  TONE,
  TRACK,
  VALUE,
} from '../progress'

export interface ProgressBarProps extends Omit<
  AriaProgressBarProps,
  'children' | 'className'
> {
  /** The value, or omit it for one that is still being worked out. */
  value?: AriaProgressBarProps['value']
  minValue?: AriaProgressBarProps['minValue']
  maxValue?: AriaProgressBarProps['maxValue']
  /** How the reading is written — a percentage by default, a byte count or a duration if you say so. */
  formatOptions?: AriaProgressBarProps['formatOptions']
  /** No value to show: the rail fills and pulses instead of measuring. */
  isIndeterminate?: AriaProgressBarProps['isIndeterminate']
  /** Extra props for the widget itself, `aria-label` among them. */
  className?: string
  /** A `ProgressBar.Label`, a `ProgressBar.Track`, and whatever else it says. */
  children?: ReactNode
}

export interface ProgressLabelProps {
  className?: string
  children?: ReactNode
}

export interface ProgressValueProps {
  className?: string
  /** Overrides what React Aria formatted. Rarely wanted. */
  children?: ReactNode
}

/** The label and the reading on one line — the sheet's own arrangement in a table row. */
export interface ProgressHeaderProps {
  className?: string
  children?: ReactNode
}

export interface ProgressTrackProps {
  className?: string
  children?: ReactNode
}

export interface ProgressFillProps {
  /** Overrides the value React Aria computed. Rarely wanted. */
  percentage?: number
  /** Which of the system's colours it is filled with. */
  tone?: keyof typeof TONE
  className?: string
}

/**
 * What the pieces inside a `ProgressBar` need from the one outside it: the fraction, the formatted
 * reading, and the id that ties the label to the widget.
 *
 * This is what lets the slots be ordinary children rather than a render-prop function. React Aria
 * hands `percentage` and `valueText` to a **function** child, which would make this the one
 * component here whose consumer writes a callback instead of slots — so the function lives inside
 * the component and the slots read the result from here. The same arrangement as `Nav.Label`
 * reading its chevron's state, for the same reason.
 */
interface ProgressContextValue {
  percentage?: number
  valueText?: string
  labelId: string
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

/**
 * What the bar is measuring. Use it as `ProgressBar.Label`. Its id is what names the widget —
 * React Aria omits `label` on a progress bar and its `Label` child is a caption that does not
 * register itself, so the name is wired here.
 *
 * Exported as `ProgressLabel` only so tooling can resolve it; consume the compound form
 * `ProgressBar.Label`.
 */
export function ProgressLabel({ className, children }: ProgressLabelProps) {
  const ctx = useContext(ProgressContext)
  return (
    <span
      id={ctx?.labelId}
      className={[LABEL, className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  )
}

/**
 * The reading, as React Aria formats it. Use it as `ProgressBar.Value` — with no children it renders
 * the formatted value itself.
 *
 * Exported as `ProgressValue` only so tooling can resolve it; consume the compound form
 * `ProgressBar.Value`.
 */
export function ProgressValue({ className, children }: ProgressValueProps) {
  const ctx = useContext(ProgressContext)
  return (
    <span className={[VALUE, className].filter(Boolean).join(' ')}>
      {children ?? ctx?.valueText}
    </span>
  )
}

/**
 * The line above the rail: the label on the left, the reading on the right. Use it as
 * `ProgressBar.Header`. The arrangement is a slot rather than something the component does for you,
 * so a bar can be labelled any way its page needs one.
 *
 * Exported as `ProgressHeader` only so tooling can resolve it; consume the compound form
 * `ProgressBar.Header`.
 */
export function ProgressHeader({ className, children }: ProgressHeaderProps) {
  return (
    <div className={[HEADER, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The rail. Use it as `ProgressBar.Track`, around a `ProgressBar.Fill`.
 *
 * Exported as `ProgressTrack` only so tooling can resolve it; consume the compound form
 * `ProgressBar.Track`.
 */
export function ProgressTrack({ className, children }: ProgressTrackProps) {
  return (
    <div className={[TRACK, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The bar itself. Use it as `ProgressBar.Fill`, inside a `ProgressBar.Track`. Its width is the
 * percentage React Aria computed, handed over as `--fill` so the width stays a utility and the only
 * thing written inline is the number.
 *
 * Exported as `ProgressFill` only so tooling can resolve it; consume the compound form
 * `ProgressBar.Fill`.
 */
export function ProgressFill({
  percentage,
  tone = 'accent',
  className,
}: ProgressFillProps) {
  const ctx = useContext(ProgressContext)
  const value = percentage ?? ctx?.percentage
  return (
    <div
      data-slot="fill"
      // A custom property needs the cast: React's `CSSProperties` has no index signature, and its
      // absence would mean writing the width as an inline style — a measurement in the one place
      // this system keeps them all in classes.
      style={{ '--fill': `${value ?? 100}%` } as React.CSSProperties}
      className={[
        FILL,
        TONE[tone] ?? TONE.accent,
        value === undefined ? INDETERMINATE : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

/**
 * Styled element. Not exported — `ProgressBar` below is the public symbol, and docgen reads the
 * JSDoc from the *exported* declaration, not this one.
 */
function ProgressBarRoot({ className, children, ...props }: ProgressBarProps) {
  const labelId = useId()
  return (
    <AriaProgressBar
      // Points at the label slot whether or not one was written, for the reason the modal does the
      // same with its description: a dangling id is a smaller thing than an unnamed widget.
      aria-labelledby={labelId}
      className={[PROGRESS, className].filter(Boolean).join(' ')}
      {...props}
    >
      {({ percentage, valueText }) => (
        <ProgressContext.Provider value={{ percentage, valueText, labelId }}>
          {children}
        </ProgressContext.Provider>
      )}
    </AriaProgressBar>
  )
}

/**
 * How far along something is. **The sheet has no bar in it**, so this is an invention — a small one
 * that borrows its language: square, 4px, and the system's own accent.
 *
 * ```tsx
 * <ProgressBar value={72} className="w-72">
 *   <ProgressBar.Label>Uptime</ProgressBar.Label>
 *   <ProgressBar.Track>
 *     <ProgressBar.Fill />
 *   </ProgressBar.Track>
 * </ProgressBar>
 * ```
 *
 * **A progress bar is not a meter**, and the difference is not decoration. A progress bar says how
 * far along an operation is, and its maximum is almost always 100% — it wears the accent, because
 * finishing is the good news. A `Meter` says how much of something there is, and how much is *not*
 * the good news: that is what the four semantic colours are for.
 *
 * The `percentage` and the formatted `valueText` come from React Aria as render props, and this
 * component is the one place they are read: it puts them in a context so `ProgressBar.Fill` and
 * `ProgressBar.Value` are ordinary slots rather than a callback the consumer has to write. A first
 * version took a `label` prop and rendered every piece itself, which made this the only component
 * here whose consumer did not write the slots.
 *
 * `value` is a **number, not a string**, and `undefined` is a real state rather than a zero: React
 * Aria renders `isIndeterminate` as the absence of `aria-valuenow`, which is exactly how a screen
 * reader tells "we do not know yet" from "nothing has happened".
 */
export const ProgressBar = Object.assign(ProgressBarRoot, {
  Label: ProgressLabel,
  Header: ProgressHeader,
  Value: ProgressValue,
  Track: ProgressTrack,
  Fill: ProgressFill,
})
