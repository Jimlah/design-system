import { Meter as AriaMeter } from 'react-aria-components'
import type { MeterProps as AriaMeterProps } from 'react-aria-components'

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

export interface MeterProps extends Omit<
  AriaMeterProps,
  'children' | 'className'
> {
  value?: AriaMeterProps['value']
  minValue?: AriaMeterProps['minValue']
  maxValue?: AriaMeterProps['maxValue']
  formatOptions?: AriaMeterProps['formatOptions']
  /**
   * What the reading means.
   *
   * There is no default that reads the value and picks a colour for you, because only the caller
   * knows which direction is the bad one: 80% of a disk used is a warning and 80% of a disk free is
   * not. Deriving it here would guess, and guess confidently.
   */
  tone?: keyof typeof TONE
  className?: string
  /** A `Meter.Label`, a `Meter.Track`, and whatever else it says. */
  children?: ReactNode
}

export interface MeterLabelProps {
  className?: string
  children?: ReactNode
}

/** The label and the reading on one line. */
export interface MeterHeaderProps {
  className?: string
  children?: ReactNode
}

export interface MeterValueProps {
  className?: string
  /** Overrides what React Aria formatted. Rarely wanted. */
  children?: ReactNode
}

export interface MeterTrackProps {
  className?: string
  children?: ReactNode
}

export interface MeterFillProps {
  /** Overrides the value React Aria computed. Rarely wanted. */
  percentage?: number
  tone?: keyof typeof TONE
  className?: string
}

/**
 * What the pieces inside a `Meter` need from the one outside it — the fraction, the formatted
 * reading and the id that names it. The same arrangement as `ProgressBar`, for the same reason: the
 * render props live inside the component so the slots can stay ordinary children.
 */
interface MeterContextValue {
  percentage?: number
  valueText?: string
  labelId: string
  /**
   * The tone has to travel too. It is set on the meter — one reading, one meaning — while the thing
   * it colours is the fill, and a first version left it out of the context: `tone="success"` on the
   * meter was silently ignored and every fill rendered neutral, which the `Tones` story caught by
   * finding five identical colours where it expected five.
   */
  tone: keyof typeof TONE
}

const MeterContext = createContext<MeterContextValue | null>(null)

/**
 * What the meter is measuring. Use it as `Meter.Label`. Its id is what names the widget, because
 * React Aria omits `label` on a meter and its `Label` child captions the drawing without naming it.
 *
 * Exported as `MeterLabel` only so tooling can resolve it; consume the compound form `Meter.Label`.
 */
export function MeterLabel({ className, children }: MeterLabelProps) {
  const ctx = useContext(MeterContext)
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
 * The line above the rail: the label on the left, the reading on the right. Use it as
 * `Meter.Header`.
 *
 * Exported as `MeterHeader` only so tooling can resolve it; consume the compound form `Meter.Header`.
 */
export function MeterHeader({ className, children }: MeterHeaderProps) {
  return (
    <div className={[HEADER, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The reading. Use it as `Meter.Value` — with no children it renders the formatted value itself.
 *
 * Exported as `MeterValue` only so tooling can resolve it; consume the compound form `Meter.Value`.
 */
export function MeterValue({ className, children }: MeterValueProps) {
  const ctx = useContext(MeterContext)
  return (
    <span className={[VALUE, className].filter(Boolean).join(' ')}>
      {children ?? ctx?.valueText}
    </span>
  )
}

/**
 * The rail. Use it as `Meter.Track`, around a `Meter.Fill`.
 *
 * Exported as `MeterTrack` only so tooling can resolve it; consume the compound form `Meter.Track`.
 */
export function MeterTrack({ className, children }: MeterTrackProps) {
  return (
    <div className={[TRACK, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The bar. Use it as `Meter.Fill`, inside a `Meter.Track`.
 *
 * Exported as `MeterFill` only so tooling can resolve it; consume the compound form `Meter.Fill`.
 */
export function MeterFill({ percentage, tone, className }: MeterFillProps) {
  const ctx = useContext(MeterContext)
  const value = percentage ?? ctx?.percentage
  const which = tone ?? ctx?.tone ?? 'neutral'
  return (
    <div
      data-slot="fill"
      style={{ '--fill': `${value ?? 100}%` } as React.CSSProperties}
      className={[
        FILL,
        TONE[which] ?? TONE.neutral,
        value === undefined ? INDETERMINATE : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

/**
 * Styled element. Not exported — `Meter` below is the public symbol, and docgen reads the JSDoc from
 * the *exported* declaration, not this one.
 */
function MeterRoot({
  tone = 'neutral',
  className,
  children,
  ...props
}: MeterProps) {
  const labelId = useId()
  return (
    <AriaMeter
      // Points at the label slot whether or not one was written — the same trade the modal makes for
      // its description, and for the same reason.
      aria-labelledby={labelId}
      className={[PROGRESS, className].filter(Boolean).join(' ')}
      {...props}
    >
      {({ percentage, valueText }) => (
        <MeterContext.Provider value={{ percentage, valueText, labelId, tone }}>
          {children}
        </MeterContext.Provider>
      )}
    </AriaMeter>
  )
}

/**
 * How much of something there is. A meter and a `ProgressBar` are the same drawing of two different
 * facts, which is why they share `progress.ts` — and why the difference is worth keeping rather than
 * collapsing into one component with a flag.
 *
 * ```tsx
 * <Meter value={82} tone={82 > 80 ? 'danger' : 'success'} className="w-72">
 *   <Meter.Header>
 *     <Meter.Label>Disk</Meter.Label>
 *     <Meter.Value />
 *   </Meter.Header>
 *   <Meter.Track>
 *     <Meter.Fill />
 *   </Meter.Track>
 * </Meter>
 * ```
 *
 * **A meter reports; a progress bar completes.** A progress bar's maximum is almost always 100% and
 * its accent means "getting there is good". A meter's reading is a fact about the world, and whether
 * it is good depends on what is being measured — 80% of a disk used is a warning, 80% of a disk free
 * is not. So `tone` is asked for rather than derived: the component would have to guess, and it would
 * guess confidently.
 *
 * The slots are ordinary children, as they are everywhere else here. React Aria hands `percentage`
 * and `valueText` to a **function** child, which would make this the one family whose consumer writes
 * a callback; the function lives inside the component instead and the slots read a context.
 */
export const Meter = Object.assign(MeterRoot, {
  Label: MeterLabel,
  Header: MeterHeader,
  Value: MeterValue,
  Track: MeterTrack,
  Fill: MeterFill,
})
