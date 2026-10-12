import { useEffect } from 'react'
import type { Preview } from '@storybook/tanstack-react'

// The app loads this stylesheet through a <link href> injected by
// src/routes/__root.tsx (Vite emits it as a URL). Importing the same file
// here gives stories the identical global styles, including Tailwind.
import '../src/styles.css'

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
    // takes `--color-base` from our own stylesheet, so it flips with everything
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
