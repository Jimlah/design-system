import { useEffect } from 'react'
import type { Preview } from '@storybook/tanstack-react'

// The app loads this stylesheet through a <link href> injected by
// src/routes/__root.tsx (Vite emits it as a URL). Importing the same file
// here gives stories the identical global styles, including Tailwind.
import '../src/styles.css'

/**
 * **Automation runs the preview with transitions off, and only automation does.**
 *
 * Every story here asserts a state — a colour, an opacity, a rotation — and none asserts a motion. A
 * transition is therefore pure timing hazard: a read taken while one is running returns a frame of
 * it, and the first frame of a transition is the OLD value in a different serialisation, which reads
 * as a change even when nothing changed. That is not theory. It cost three CI runs in a row, each on
 * a different assertion — Breadcrumbs' trail colour, ToggleButton's selected fill, Nav's hover —
 * every one of them passing on a developer machine, where the animation is over before `play` starts
 * (`document.getAnimations()` is empty by then; on the runner it is not).
 *
 * `Button`'s `States` and `Accordion`'s `Caret` already turn the transition off by hand for exactly
 * this reason. This is that same call made once, for the whole run.
 *
 * `navigator.webdriver` is true only under an automation driver, so the Storybook a person opens —
 * docs and all — keeps the sheet's own motion. Durations rather than `animation`, because React
 * Aria's overlays advance on `animationend`, and the transitions in question are all ours.
 */
if (typeof navigator !== 'undefined' && navigator.webdriver) {
  const noMotion = document.createElement('style')
  noMotion.textContent =
    '*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important }'
  document.head.append(noMotion)
}

/**
 * Switches the preview between the two themes by setting `data-theme` on the
 * preview document. That only moves `color-scheme`; no token is redefined, and
 * every `light-dark()` in src/styles.css re-resolves from it.
 */
function ThemeDecorator(
  Story: () => React.ReactNode,
  context: { globals: { theme?: string } },
) {
  const theme = context.globals.theme ?? 'dark'
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return <Story />
}

const preview: Preview = {
  decorators: [ThemeDecorator],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // The backgrounds addon paints a fixed colour on the preview body, which
    // would sit behind the stories and ignore the theme. The canvas instead
    // takes `--background` from our own stylesheet, so it flips with everything
    // else. Use the Theme toolbar to switch.
    backgrounds: { disable: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  globalTypes: {
    theme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark', icon: 'circlehollow' },
          { value: 'light', title: 'Light', icon: 'circle' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    // Pulse is dark-first, so the workbench opens in the sheet's own theme.
    theme: 'dark',
  },
}

export default preview
