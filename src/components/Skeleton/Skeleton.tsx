import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

/**
 * Whether a `Skeleton` above this point is standing in for content.
 *
 * This is the whole of React Spectrum's mechanism: its `Skeleton` renders no element at all, it
 * publishes a context, and the components that can be skeletonised — `Text`, `Image`, `Icon`,
 * `Link`, `StatusLight`, `Badge` and `Meter` — read it and draw themselves as placeholders. A
 * component that does not read it keeps rendering, which is why the docs can list exactly which
 * ones are affected.
 *
 * **This library's components do not need to read it**, because the shimmer below goes on an
 * element that wraps the content rather than on each component's own root (see `Skeleton`). The
 * context stays public anyway, and that is not decoration: it is the only way a *consumer's* own
 * component — a chart, a monitor tile — can tell that it is inside a placeholder and skip work it
 * would otherwise do to draw something nobody can see. `Skeleton.stories.tsx` has one.
 */
const SkeletonContext = createContext(false)

/**
 * Whether the content here is a placeholder.
 *
 * ```tsx
 * function Uptime({percent}: {percent: number}) {
 *   // Nothing under a skeleton is visible, so there is no point measuring a chart into it.
 *   if (useIsSkeleton()) return <div className="h-6 w-24" />
 *   return <div>{percent}%</div>
 * }
 * ```
 */
export function useIsSkeleton(): boolean {
  return useContext(SkeletonContext)
}

/**
 * The shimmer, as one class list.
 *
 * A three-stop gradient whose middle band is the highlight, laid out 300% as wide as the box so
 * that the sweep has somewhere to travel, and never repeated. The stops are at 33% and 66% of the
 * *gradient*, which is why a box at rest — one with no animation, under reduced motion — shows the
 * flat `--muted` end of it rather than a band parked in the middle.
 *
 * **The highlight is mixed from the base colour rather than picked as a second grey**, the same
 * move every hover and pressed state in this system makes: `--foreground` inverts with the theme,
 * so one rule lightens the dark theme's placeholder and darkens the light theme's. 12% is
 * `TRACK_WASH`'s wash — a step you can see across a card and cannot mistake for a border.
 *
 * `[&_*]:invisible` is what makes the content a placeholder. `visibility`, not `display`, because
 * a skeleton is a promise about *where things will be*: the subtree leaves the picture and the
 * accessibility tree while its boxes stay exactly where the real content will land, which is the
 * whole reason the page does not jump when the content arrives.
 */
const SHIMMER = [
  '[&_*]:invisible',
  'bg-no-repeat',
  '[background-image:linear-gradient(to_right,var(--muted)_33%,color-mix(in_oklch,var(--foreground)_12%,var(--muted))_50%,var(--muted)_66%)]',
  '[background-size:300%_100%]',
].join(' ')

/** The sweep takes two seconds, eased at both ends, and never stops. */
const SWEEP_DURATION = 2000

/**
 * Whether the reader has asked for less motion, read from the media query and watched, so that
 * turning it on stops a running sweep rather than waiting for the next mount.
 *
 * Read in an effect, never during render: this app is server-rendered, where `window` does not
 * exist, and a preference read at render time would also be a preference that never changes.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export interface SkeletonProps {
  /**
   * The content being stood in for — mock data inside your real markup, or nothing at all when the
   * placeholder is a bare box sized by `className`.
   */
  children?: ReactNode
  /**
   * Whether the content is still being fetched. `true` by default, because a `Skeleton` that is
   * not standing in for anything is a blank box; pass `false` and the children render as they are,
   * with no element of this component's own in the page.
   */
  isLoading?: boolean
  /**
   * The placeholder's own box: `h-4 w-40` for a line of text, `size-10 rounded-full` for an
   * avatar, `h-24` for a chart. A placeholder wrapped *around* content needs none of this — it
   * takes the content's size — and a bare one is sized entirely from here.
   */
  className?: string
}

/**
 * A placeholder that keeps the layout of the content it stands in for.
 *
 * ```tsx
 * // Mock data inside your real component, the way React Spectrum's docs do it: the placeholder is
 * // laid out by the markup it is standing in for, so the page does not move when it arrives.
 * <Skeleton isLoading={isLoading}>
 *   <Card>
 *     <Card.Header>
 *       <Card.Title>Uptime</Card.Title>
 *       <Card.Description>api-gateway · last 24 hours</Card.Description>
 *     </Card.Header>
 *     <Card.Content>Every monitor answered within its window.</Card.Content>
 *   </Card>
 * </Skeleton>
 *
 * // One line on its own, sized by the caller rather than by content:
 * <Skeleton className="h-4 w-40" />
 * ```
 *
 * **React Spectrum's `Skeleton` renders no element of its own.** It publishes a context and its
 * own `Text`, `Image`, `Icon`, `Link`, `StatusLight`, `Badge` and `Meter` read it and swap
 * themselves for a shimmering box, so the placeholder is composed of the components' real
 * shapes. This library has no `Text` and no `Image` — the sheet has no typography component —
 * and a skeleton cannot be built out of components that are not here. So the shimmer goes on this
 * element, which wraps the content instead: **the content is hidden but still laid out, so the box
 * is the size the content really is**, which is the property that matters. What you lose is one
 * gradient per component and what you gain is that any markup in this library can be skeletonised
 * without the component opt-in React Spectrum needed.
 *
 * The granularity is the caller's. Wrap a whole card and it shimmers as one surface; wrap each line
 * and each one shimmers on its own, which is how a skeleton screen is normally drawn:
 *
 * ```tsx
 * <div className="flex flex-col gap-3">
 *   <Skeleton className="h-4 w-40" />
 *   <Skeleton className="h-3 w-full" />
 * </div>
 * ```
 *
 * Three things are deliberately *not* left to the caller:
 *
 * - **The sweep is synchronised across the page.** The shimmer is a Web Animation rather than a
 *   CSS keyframe, and every skeleton sets its `startTime` to `0` — React Spectrum's own technique.
 *   A CSS animation starts when each element mounts, so two placeholders that appeared a second
 *   apart are visibly out of step, which reads as two things loading rather than one screen.
 * - **`prefers-reduced-motion` is honoured**, and what is left is a flat placeholder rather than no
 *   placeholder: the state change the reader asked for, minus the movement.
 * - **The subtree is `inert`.** Nothing inside is visible, so nothing inside may be tabbed to,
 *   clicked or announced — which is also how React Spectrum disables the form components in a
 *   skeleton. There is no separate "disabled inside a skeleton" prop for a consumer to remember.
 */
export function Skeleton({
  children,
  isLoading = true,
  className,
}: SkeletonProps) {
  const reducedMotion = usePrefersReducedMotion()
  const animation = useRef<Animation | null>(null)

  /**
   * Start the sweep when the box attaches, and leave it alone afterwards. A re-render replaces this
   * callback's identity, so React calls it again with the same element — which must not restart the
   * animation, and does not: it only runs when there is no animation yet.
   */
  const shimmer = useCallback(
    (element: HTMLDivElement | null) => {
      const shouldAnimate = isLoading && !reducedMotion
      if (
        shouldAnimate &&
        !animation.current &&
        element &&
        typeof element.animate === 'function'
      ) {
        // `startTime` 0 rather than "now": every skeleton on the page is then at the same point in
        // the same sweep, so the whole screen pulses as one surface.
        animation.current = element.animate(
          [{ backgroundPosition: '100%' }, { backgroundPosition: '0%' }],
          {
            duration: SWEEP_DURATION,
            iterations: Infinity,
            easing: 'ease-in-out',
          },
        )
        animation.current.startTime = 0
      } else if (!shouldAnimate && animation.current) {
        animation.current.cancel()
        animation.current = null
      }
    },
    [isLoading, reducedMotion],
  )

  useEffect(
    () => () => {
      animation.current?.cancel()
      animation.current = null
    },
    [],
  )

  if (!isLoading) {
    return (
      <SkeletonContext.Provider value={false}>
        {children}
      </SkeletonContext.Provider>
    )
  }

  return (
    <SkeletonContext.Provider value={true}>
      <div
        data-slot="skeleton"
        ref={shimmer}
        inert
        className={[SHIMMER, className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </SkeletonContext.Provider>
  )
}
