import { Link as AriaLink } from 'react-aria-components'
import type { LinkProps as AriaLinkProps } from 'react-aria-components'

import {
  LINK,
  LINK_CAPS,
  LINK_CAPS_BASE,
  LINK_URL,
  LINK_VIEWMORE,
} from '../link'

/** Which of the sheet's three links this is. */
export type LinkVariant = 'caps' | 'url' | 'viewmore'

/** `.ds-link-caps--lg` only changes the type size, so it is a size rather than a second variant. */
export type LinkSize = 'sm' | 'lg'

export interface LinkProps extends Omit<
  AriaLinkProps,
  'className' | 'href' | 'isDisabled' | 'onPress' | 'target'
> {
  /** Where the link goes. It renders a real anchor, so middle-click and "open in a new tab" work. */
  href?: AriaLinkProps['href']
  /** Renders it unavailable without removing it from the page. */
  isDisabled?: AriaLinkProps['isDisabled']
  /** Press handler. This is a React Aria prop — there is no `onClick`. */
  onPress?: AriaLinkProps['onPress']
  /** The anchor's target, e.g. `_blank`. */
  target?: AriaLinkProps['target']

  /**
   * `caps` is `.ds-link-caps` — the sheet's nav and legend link. `url` is `.ds-link-url`, for a
   * destination inside running text. `viewmore` is `.ds-link-viewmore`, the accent call to go and
   * read the rest.
   */
  variant?: LinkVariant
  /** Only `caps` has two sizes, because only `.ds-link-caps` does. */
  size?: LinkSize
  className?: string
  children?: React.ReactNode
}

/**
 * The sheet's three links: `.ds-link-caps`, `.ds-link-url` and `.ds-link-viewmore`.
 *
 * ```tsx
 * <Link href="/monitors" isCurrent>Monitors</Link>
 * <Link variant="url" href="https://status.example.com">status.example.com</Link>
 * <Link variant="viewmore" href="/monitors">View more</Link>
 * ```
 *
 * React Aria's `Link` is what makes these links at all: it renders a real `<a>`, so middle-click,
 * the status bar and "open in a new tab" work, and `isCurrent` gives the page you are on both
 * `aria-current` for a screen reader and `data-current` for the sheet's own
 * `[aria-current="page"] { color: teal }` rule.
 *
 * **The three variants are three different jobs, which is why they are not one link with a colour
 * option.** Every one of them derives its hover from what it is: a caps link darkens toward full
 * strength because at 70% it is deliberately quiet at rest; a URL link turns teal because its
 * underline already carries the affordance; and a view-more link *gains* an underline, because it
 * wears the accent at rest and needs somewhere to go on hover. Swapping any two of those would say
 * the wrong thing about the link.
 */
export function Link({
  variant = 'caps',
  size = 'sm',
  className,
  children,
  ...props
}: LinkProps) {
  const variantClass =
    variant === 'url'
      ? LINK_URL
      : variant === 'viewmore'
        ? LINK_VIEWMORE
        : [LINK_CAPS[size], LINK_CAPS_BASE].join(' ')

  return (
    <AriaLink
      data-slot="link"
      className={[LINK, variantClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaLink>
  )
}
