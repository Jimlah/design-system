import { Separator as AriaSeparator } from 'react-aria-components'
import type { SeparatorProps as AriaSeparatorProps } from 'react-aria-components'

/** The sheet's `.ds-div-vhair`: a hairline that stretches to whatever it is dividing. */
const ORIENTATION: Record<'horizontal' | 'vertical', string> = {
  horizontal: 'h-px w-full',
  vertical: 'w-px self-stretch',
}

/**
 * The sheet's five dividers, and where each one comes from.
 *
 * `hair` is `.ds-div-hair` and `soft` is `.ds-div-soft` — the two it uses between panels and inside
 * them. `strong` is `.ds-div-strong`, which is full white in the sheet: the one divider meant to be
 * *seen* rather than to separate quietly, so it reads `--color-fg`, which is white in the dark theme
 * and near-black in the light one, because a rule that is white on white separates nothing.
 *
 * `dashed` and `dotted` are the sheet's `.ds-div-dashed` and `.ds-div-dotted`, both drawn as a
 * border rather than a fill — a 1px fill cannot be dashed. They carry the same 45% the sheet gives
 * them, which is `--color-line-control`; the sheet's dotted is 50%, and a second alpha four
 * percentage points away from an existing one is a second alpha nobody can see.
 */
const VARIANT: Record<string, { horizontal: string; vertical: string }> = {
  hair: { horizontal: 'bg-line', vertical: 'bg-line' },
  soft: { horizontal: 'bg-line-soft', vertical: 'bg-line-soft' },
  strong: { horizontal: 'bg-fg', vertical: 'bg-fg' },
  dashed: {
    horizontal: 'border-t border-dashed border-line-control',
    vertical: 'border-s border-dashed border-line-control',
  },
  dotted: {
    horizontal: 'border-t border-dotted border-line-control',
    vertical: 'border-s border-dotted border-line-control',
  },
}

export type SeparatorVariant = 'hair' | 'soft' | 'strong' | 'dashed' | 'dotted'

export interface SeparatorProps extends Omit<
  AriaSeparatorProps,
  'className' | 'elementType'
> {
  /**
   * Which of the sheet's dividers this is. `hair` and `soft` separate; `strong` is meant to be seen;
   * `dashed` and `dotted` say "these are two of something" rather than "these are different".
   */
  variant?: SeparatorVariant
  /**
   * `horizontal` is a rule across a column, `vertical` a rule down a row — React Aria's, and the
   * sheet's `.ds-div-vhair`.
   */
  orientation?: AriaSeparatorProps['orientation']
  className?: string
}

/**
 * The sheet's `.ds-div-*`: a hairline that separates without asking to be looked at.
 *
 * ```tsx
 * <Separator />
 * <Separator variant="strong" />
 * <Separator variant="dashed" />
 * <div className="flex items-stretch gap-4">
 *   <span>Left</span>
 *   <Separator orientation="vertical" />
 *   <span>Right</span>
 * </div>
 * ```
 *
 * React Aria renders it as a `<hr>` when it is horizontal and a `<div role="separator">` when it is
 * vertical, and in both cases it is a `separator` in the accessibility tree. A horizontal rule
 * carries no text and announces nothing on its own, so nothing is hidden — there is nothing to
 * hide.
 *
 * **A separator is not a spacer.** It says two things are apart; if nothing is apart, the space is
 * the answer. And a `strong` divider is the loudest thing in this file on purpose: the sheet spends
 * it where a section genuinely ends, not between every pair of rows, where it would draw a ladder
 * down the page.
 */
export function Separator({
  variant = 'hair',
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  const rule = VARIANT[variant] ?? VARIANT.hair
  return (
    <AriaSeparator
      data-slot="separator"
      orientation={orientation}
      className={[
        'shrink-0 border-0',
        ORIENTATION[orientation],
        rule[orientation],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
