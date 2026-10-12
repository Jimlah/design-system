import { DropZone as AriaDropZone } from 'react-aria-components'
import type { DropZoneProps as AriaDropZoneProps } from 'react-aria-components'

import type { ReactNode } from 'react'

export interface DropZoneProps extends Omit<
  AriaDropZoneProps,
  | 'className'
  | 'children'
  | 'onDrop'
  | 'isDisabled'
  | 'onDropEnter'
  | 'onDropExit'
> {
  /** Called with the dropped files. This is the whole point of the component — and it was missing from the published manifest, so it looked like a component that took nothing. */
  onDrop?: AriaDropZoneProps['onDrop']
  /** Stops the zone accepting drops. */
  isDisabled?: AriaDropZoneProps['isDisabled']
  /** Called when a drag enters the zone. */
  onDropEnter?: AriaDropZoneProps['onDropEnter']
  /** Called when a drag leaves the zone. */
  onDropExit?: AriaDropZoneProps['onDropExit']

  className?: string
  children?: ReactNode
}

/** What the zone is for. */
export interface DropZoneTitleProps {
  className?: string
  children?: ReactNode
}

/** The line under it — the "or", the accepted types, the size limit. */
export interface DropZoneHintProps {
  className?: string
  children?: ReactNode
}

/**
 * A target that accepts files dragged onto it.
 *
 * **The sheet has no drop zone**, so this is an invention built from what it does have: a dashed
 * rule where `Separator` draws its dashed one, the panel's own surface, and the capped mono legend.
 *
 * The **dashed edge is the whole affordance**, and it is the only place in this system a dashed
 * border means "put something here" rather than "these two things are apart". A solid edge would read
 * as a panel with nothing in it; a dashed one reads as a space waiting to be filled.
 *
 * ```tsx
 * <DropZone onDrop={async (e) => importFiles(await collect(e.items))}>
 *   <DropZone.Title>Drop a log file here</DropZone.Title>
 *   <DropZone.Hint>JSON or CSV, up to 10 MB</DropZone.Hint>
 *   <FileTrigger acceptedFileTypes={['.json', '.csv']} onSelect={(files) => upload(files)}>
 *     <Button variant="outline">Browse…</Button>
 *   </FileTrigger>
 * </DropZone>
 * ```
 *
 * **A drop zone on its own is not accessible.** Dragging is a pointer gesture, so it is invisible to
 * a keyboard and to a screen reader — which is why the `FileTrigger` and its button are not optional
 * decoration but the other half of the component. A page that offers only the drop is a page some
 * people cannot use at all. `FileTrigger` needs no styling of its own: it renders a hidden file input
 * and hands the chosen files to whatever child you give it, so the visible control is your `Button`.
 *
 * React Aria handles the parts that are genuinely hard: it knows when a drag is over the zone and
 * reports it as `data-drop-target`, it can tell a file drag from a text drag, and `getDropOperation`
 * decides whether the drop is a copy or a move.
 */
function DropZoneRoot({ className, children, ...props }: DropZoneProps) {
  return (
    <AriaDropZone
      // **`[data-rac]` is on every element React Aria renders**, so querying the first one from the
      // story root finds the browse *button* — the documented trap, and one this suite has now walked
      // into twice. `data-slot` names the box itself, as it does for the fill and the slider's grip.
      data-slot="dropzone"
      className={[
        'flex min-h-40 flex-col items-center justify-center gap-3 p-8',
        'border border-dashed border-border bg-card text-center',
        // The target lights up while a file is over it, which is the only feedback a drag gets.
        'transition-colors duration-150 ease-pulse',
        'data-[drop-target]:border-primary data-[drop-target]:bg-primary/8',
        'data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-ring',
        'data-[disabled]:opacity-30',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaDropZone>
  )
}

/**
 * What the zone is for. Use it as `DropZone.Title`.
 *
 * Exported as `DropZoneTitle` only so tooling can resolve it; consume the compound form
 * `DropZone.Title`.
 */
export function DropZoneTitle({ className, children }: DropZoneTitleProps) {
  return (
    <p
      className={['text-[14px] text-foreground', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}

/**
 * The line under the title — accepted types, a size limit, or the word "or". Use it as
 * `DropZone.Hint`.
 *
 * Exported as `DropZoneHint` only so tooling can resolve it; consume the compound form
 * `DropZone.Hint`.
 */
export function DropZoneHint({ className, children }: DropZoneHintProps) {
  return (
    <p
      className={[
        'font-mono text-[11px] uppercase tracking-[0.04em] text-foreground/45',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const DropZone = Object.assign(DropZoneRoot, {
  Title: DropZoneTitle,
  Hint: DropZoneHint,
})
