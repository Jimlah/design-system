import type { StorybookConfig } from '@storybook/tanstack-react'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/tanstack-react',
  features: {
    // Required by @storybook/addon-mcp's docs toolset, which reads the
    // components manifest. Off by default.
    componentsManifest: true,
  },
  typescript: {
    // The default `react-docgen` cannot follow `Object.assign`-based compound
    // components: every member of `Button` resolves to the same subcomponent,
    // so the manifest reports the wrong props for `Button`. The
    // TypeScript-based extractor resolves them correctly. Slower, but the
    // manifest is what agents read, so accuracy wins.
    reactDocgen: 'react-docgen-typescript',
  },
}
export default config
