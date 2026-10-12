import {
  Separator as AriaSeparator,
  Toolbar as AriaToolbar,
} from 'react-aria-components'
import type {
  SeparatorProps as AriaSeparatorProps,
  ToolbarProps as AriaToolbarProps,
} from 'react-aria-components'

import type { ReactNode } from 'react'

export interface ToolbarProps extends Omit<
  AriaToolbarProps,
  'className' | 'children' | 'orientation'
> {
  /** Which way the arrow keys walk. Defaults to horizontal. */
  orientation?: AriaToolbarProps['orientation']

  className?: string
  children?: ReactNode
}

/** A run of controls that go together. */
export interface ToolbarGroupProps {
  className?: string
  children?: ReactNode
}

export interface ToolbarSeparatorProps extends Omit<
  AriaSeparatorProps,
  'className' | 'orientation'
> {
  className?: string
}

/**
 * A bar of controls, walked with the arrow keys.
 *
 * ```tsx
 * <Toolbar aria-label="Range">
 *   <Toolbar.Group>
 *     <ToggleButton defaultSelected>1h</ToggleButton>
 *     <ToggleButton>24h</ToggleButton>
 *     <ToggleButton>7d</ToggleButton>
 *   </Toolbar.Group>
 *   <Toolbar.Separator />
 *   <ToggleButton variant="ghost">Live</ToggleButton>
 * </Toolbar>
 * ```
 *
 * **The sheet has no toolbar class**, so the surface is an invention: the sheet's hairline, its square
 * corners, and its own controls inside it.
 *
 * What React Aria adds is the part a `div` with `display: flex` does not: the toolbar is **one tab
 * stop** and the arrow keys walk it, so a bar of eight controls does not cost a keyboard user eight
 * presses of Tab. Home and End reach the ends, and a disabled control is skipped over rather than
 * trapping them. That is the whole reason to use this rather than a flex row.
 *
 * `orientation` turns it, and the arrow keys turn with it — a vertical toolbar is walked up and down.
 */
function ToolbarRoot({ className, children, ...props }: ToolbarProps) {
  return (
    <AriaToolbar
      data-slot="toolbar"
      orientation="horizontal"
      className={[
        'flex items-center gap-1',
        'border border-line-strong bg-panel p-1',
        'data-[orientation=vertical]:w-fit data-[orientation=vertical]:flex-col',
        'data-[orientation=vertical]:items-stretch',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </AriaToolbar>
  )
}

/**
 * A run of controls that belongs together. Use it as `Toolbar.Group` — a segmented control is a group
 * of toggle buttons inside a toolbar, which is exactly what it is.
 *
 * Exported as `ToolbarGroup` only so tooling can resolve it; consume the compound form `Toolbar.Group`.
 */
export function ToolbarGroup({ className, children }: ToolbarGroupProps) {
  return (
    // No border of its own: the controls inside carry their own edges, and a box around a box reads as
    // a nesting mistake rather than as grouping.
    <div
      role="group"
      className={['flex items-center', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}

/**
 * The sheet's hairline, standing up between two runs of controls. Use it as `Toolbar.Separator`.
 *
 * Exported as `ToolbarSeparator` only so tooling can resolve it; consume the compound form
 * `Toolbar.Separator`.
 */
export function ToolbarSeparator({
  className,
  ...props
}: ToolbarSeparatorProps) {
  return (
    <AriaSeparator
      orientation="vertical"
      className={[
        'mx-1 h-5 w-px shrink-0 self-center bg-line',
        'data-[orientation=vertical]:h-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const Toolbar = Object.assign(ToolbarRoot, {
  Group: ToolbarGroup,
  Separator: ToolbarSeparator,
})
