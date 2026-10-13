import { Link } from '../components/Link/Link'
import { Separator } from '../components/Separator/Separator'
import { CHIP } from '../components/TagGroup/TagGroup'

import { EXAMPLES } from './exampleList'

/**
 * The examples index: one page that lists every worked example in this repo, so that a page is
 * something you can find rather than something you have to already know the address of.
 *
 * **It is an example too, and it is in the list.** The alternative — a page of links that nothing
 * links to — is the same problem one level up, so the landing page's toolbar points here, and this
 * page's first entry is the landing page. There is no fourth place to look.
 *
 * Two decisions worth keeping:
 *
 * - **The address is built from `BASE_URL` and the entry's own path**, exactly as the landing page
 *   builds its own links. On GitHub Pages this whole app is mounted under a repository subpath, and a
 *   link written `/board/` would leave the site. One helper, one place for a path to be wrong.
 * - **Each card is a `<li>` holding a `Link`, not a `Card` holding a button.** A card that navigates
 *   is an anchor: middle-click, "open in a new tab" and the status bar are most of what a link to a
 *   page is for, and `Card` has no such affordance to give. The card's surface here is the list item's
 *   own classes — the same panel treatment, on the element that is allowed to be a destination.
 */
function hrefFor(path: string) {
  return import.meta.env.BASE_URL + (path ? path + '/' : '')
}

export function Examples() {
  return (
    <div
      data-slot="examples"
      className="min-h-dvh bg-background px-6 py-16 text-foreground"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-[12px] uppercase tracking-[0.04em] text-muted-foreground">
            Pulse · design system
          </p>
          <h1 className="text-[32px] leading-none font-semibold tracking-[-0.02em]">
            Examples
          </h1>
          <p className="max-w-2xl text-[14px] leading-[1.6] text-foreground/70">
            Pages built out of this library, each doing one job end to end. None
            of them is a component and none of them is in the manifest — a story
            is what publishes a component, and a page is not an API. They are
            here to be read and used.
          </p>
        </header>

        <Separator variant="strong" />

        <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
          {EXAMPLES.map((example) => (
            <li
              key={example.path}
              data-slot="example-card"
              className="flex flex-col gap-3 border border-border-strong bg-card p-5"
            >
              <h2 className="m-0 text-[16px] font-semibold">
                <Link
                  variant="caps"
                  href={hrefFor(example.path)}
                  className="text-[16px]"
                >
                  {example.title}
                </Link>
              </h2>
              <p className="m-0 text-[13px] leading-[1.6] text-foreground/70">
                {example.summary}
              </p>
              <p className="m-0 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                {example.path ? '/' + example.path : '/'}
              </p>
              <ul className="mt-auto flex list-none flex-wrap gap-1.5 p-0">
                {example.shows.map((name) => (
                  <li key={name}>
                    <span
                      className={
                        CHIP + ' border-border-soft text-foreground/60'
                      }
                    >
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="text-[13px] text-foreground/60">
          The components themselves are documented in{' '}
          <Link variant="url" href={hrefFor('storybook')}>
            Storybook
          </Link>
          , which is where each one's props, states and mistakes live.
        </p>
      </div>
    </div>
  )
}
