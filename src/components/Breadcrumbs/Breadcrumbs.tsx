import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
} from 'react-aria-components'
import type {
  BreadcrumbProps as AriaBreadcrumbProps,
  BreadcrumbsProps as AriaBreadcrumbsProps,
} from 'react-aria-components'

import { Link } from '../Link/Link'

export interface BreadcrumbsProps<T> extends Omit<
  AriaBreadcrumbsProps<T>,
  | 'children'
  | 'className'
  | 'aria-label'
  | 'aria-labelledby'
  | 'onAction'
  | 'isDisabled'
> {
  /** Called with the key of the crumb that was pressed. React Aria's own name for it — a breadcrumb navigates, so this is not `onPress`. */
  onAction?: AriaBreadcrumbsProps<T>['onAction']
  /** Disables every crumb at once. */
  isDisabled?: AriaBreadcrumbsProps<T>['isDisabled']

  /** Names the trail. It goes on the `<nav>` landmark, which is the thing a screen reader lists. */
  label?: string
  className?: string
  children?: AriaBreadcrumbsProps<T>['children']
}

export interface BreadcrumbsItemProps extends Omit<
  AriaBreadcrumbProps,
  'className' | 'children' | 'id'
> {
  className?: string
  /** Where it goes. Leave it off for the page you are on, which is the last one. */
  href?: string
  children?: React.ReactNode
}

/**
 * The trail.
 *
 * **The sheet has no breadcrumb in it** — its `page-nav` is a single horizontal bar — so this is an
 * invention assembled from what the sheet does have: mono caps, a hairline's worth of contrast, and
 * the accent only for the link you can follow.
 *
 * The **slash is drawn by the item**, not by the list, which is the same call `Select.Menu` makes
 * about its popover: a trail is items and separators together, and a separator with nothing to
 * separate is not a thing anyone wants. It is also the one place here where a pseudo-element is
 * right — a slash carries no text, cannot be pressed, and needs no accessible name, unlike the
 * caret that had to become a real button in `Nav`.
 */
const LIST = 'flex flex-wrap items-center gap-0 outline-none'

const ITEM = [
  // `shrink-0` is what makes the trail wrap instead of squashing: without it a flex item happily
  // narrows, mid-word, and a breadcrumb whose steps are clipped is a breadcrumb nobody can read. The
  // `Wraps` story found this — three steps sat on one line in a 176px container with every word
  // squeezed, and `flex-wrap` never had anything to wrap.
  'flex shrink-0 items-center gap-2',
  // No font size: a step is a `caps` link, and the **link owns its own type** — the sheet's
  // `.ds-link-caps` at 14px, with `.ds-link-caps--lg` as the one larger size it has. A size utility
  // here would lose the cascade to the link's anyway, which is the correct outcome rather than a bug.
  'text-fg/45',
  // The slash between two items, and only between two: `last:` drops it from the page you are on.
  "after:mx-2 after:text-fg/30 after:content-['/'] last:after:content-none",
  'data-[disabled]:hidden',
].join(' ')

/** The page you are on: named, at full strength, and not a link. */
const CURRENT = 'text-fg'

/**
 * A trail back up the hierarchy. The last item is the page you are on and is not a link.
 *
 * ```tsx
 * <Breadcrumbs label="Breadcrumb">
 *   <Breadcrumbs.Item href="/monitors">Monitors</Breadcrumbs.Item>
 *   <Breadcrumbs.Item href="/monitors/fra1">fra1</Breadcrumbs.Item>
 *   <Breadcrumbs.Item>Frankfurt</Breadcrumbs.Item>
 * </Breadcrumbs>
 * ```
 *
 * Every item but the last takes an `href` and renders a real `Link`, so middle-click and "open in a
 * new tab" work — which is most of what a breadcrumb is for, and what a `<span onClick>` gives up.
 *
 * **It collapses rather than overflows.** React Aria drops the middle of the trail when the container
 * is too narrow and replaces it with an ellipsis, keeping the first and the last, because a trail that
 * wraps onto two lines pushes the page down every time someone resizes a window.
 */
function BreadcrumbsRoot<T>({
  label = 'Breadcrumb',
  className,
  children,
  ...props
}: BreadcrumbsProps<T>) {
  return (
    // **React Aria renders the list and not the landmark.** Its `Breadcrumbs` is an `<ol>` — no
    // `<nav>` around it and no role on the list itself — so the first version of this component was a
    // list of links sitting in no landmark at all, and a screen reader's landmark list offered no way
    // to reach it. A breadcrumb *is* navigation, so the wrapper is this component's job.
    <nav data-slot="breadcrumbs" aria-label={label}>
      <AriaBreadcrumbs
        className={[LIST, className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </AriaBreadcrumbs>
    </nav>
  )
}

/**
 * One step. Use it as `Breadcrumbs.Item` — with an `href` it is a link, without one it is the page
 * you are on.
 *
 * Exported as `BreadcrumbsItem` only so tooling can resolve it; consume the compound form
 * `Breadcrumbs.Item`.
 */
export function BreadcrumbsItem({
  className,
  href,
  children,
  ...props
}: BreadcrumbsItemProps) {
  return (
    <AriaBreadcrumb
      className={[ITEM, className].filter(Boolean).join(' ')}
      {...props}
    >
      {({ isCurrent }) =>
        href === undefined ? (
          // The page you are on: not a link, because there is nowhere to go, and `aria-current`
          // rather than a heading so a screen reader can find the trail's end.
          <span aria-current="page" className={CURRENT}>
            {children}
          </span>
        ) : (
          <Link
            href={href}
            variant="caps"
            aria-current={isCurrent ? 'page' : undefined}
            className={isCurrent ? CURRENT : undefined}
          >
            {children}
          </Link>
        )
      }
    </AriaBreadcrumb>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbsItem,
})
