import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Separator } from '../Separator/Separator'
import {
  Tree,
  TreeHeader,
  TreeItem,
  TreeLabel,
  TreeLoadMore,
  TreeSection,
} from './Tree'

const meta = {
  component: Tree,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Tree.Item': TreeItem,
    'Tree.Label': TreeLabel,
    'Tree.Section': TreeSection,
    'Tree.Header': TreeHeader,
    'Tree.LoadMore': TreeLoadMore,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<Tree aria-label="Files" selectionMode="single">
  <Tree.Item id="src" textValue="src">
    <Tree.Label>src</Tree.Label>
    <Tree.Item id="index" textValue="index.ts">
      <Tree.Label>index.ts</Tree.Label>
    </Tree.Item>
  </Tree.Item>
</Tree>`,
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Tree>

export default meta
type Story = StoryObj<typeof meta>

const Files = () => (
  <Tree
    aria-label="Files"
    selectionMode="single"
    defaultExpandedKeys={['src']}
    defaultSelectedKeys={['index']}
  >
    <Tree.Item id="src" textValue="src">
      <Tree.Label>src</Tree.Label>
      <Tree.Item id="index" textValue="index.ts">
        <Tree.Label>index.ts</Tree.Label>
      </Tree.Item>
      <Tree.Item id="utils" textValue="utils.ts">
        <Tree.Label>utils.ts</Tree.Label>
      </Tree.Item>
    </Tree.Item>
    <Tree.Item id="readme" textValue="README.md">
      <Tree.Label>README.md</Tree.Label>
    </Tree.Item>
  </Tree>
)

/**
 * **The row carries the name, not the gridcell.** `Tree.Label` puts its text in a plain `<span>` beside
 * the chevron button, so the cell itself has no accessible name — querying the cell found nothing while
 * the tree was rendering perfectly. Every query here follows the row.
 */
const row = (
  canvas: { getByRole: (role: string, options?: object) => HTMLElement },
  name: string,
) => canvas.getByRole('row', { name: new RegExp(name) })

export const Default: Story = {
  render: () => <Files />,
  play: async ({ canvas }) => {
    // **A treegrid, not a list.** React Aria builds its tree on its table, so the items are rows and
    // the labels are gridcells — a story querying "treeitem" finds nothing and asserts nothing.
    await expect(canvas.getByRole('treegrid')).toBeInTheDocument()
    await expect(canvas.getAllByRole('row').length).toBeGreaterThanOrEqual(4)
    await expect(row(canvas, 'src')).toBeInTheDocument()
  },
}

export const Expanded: Story = {
  render: () => <Files />,
  // **`defaultExpandedKeys` speaks in each item's `id`.** Without one React Aria generates a key,
  // `defaultExpandedKeys={['src']}` matches nothing, and the tree renders fully collapsed — with no
  // error and no warning. That is the same trap as `Table.Row` and `Accordion.Item`.
  play: async ({ canvas }) => {
    // The child of `src` is on screen because `src` is expanded by default.
    await expect(row(canvas, 'index\\.ts')).toBeInTheDocument()
    await expect(row(canvas, 'src')).toHaveAttribute('aria-expanded', 'true')
  },
}

export const Selection: Story = {
  render: () => <Files />,
  // Selecting is the difference from `Nav`: a click here chooses a row rather than navigating.
  play: async ({ canvas }) => {
    const readme = row(canvas, 'README')
    await userEvent.click(readme)

    await expect(readme).toHaveAttribute('aria-selected', 'true')
    // ...and a single-selection tree holds exactly one.
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(1)
  },
}

export const Sections: Story = {
  render: () => (
    <Tree aria-label="Outline" selectionMode="none">
      <Tree.Section>
        <Tree.Header>Changed</Tree.Header>
        <Tree.Item id="a" textValue="api.ts">
          <Tree.Label>api.ts</Tree.Label>
        </Tree.Item>
      </Tree.Section>
      <Separator />
      <Tree.Section>
        <Tree.Header>Untracked</Tree.Header>
        <Tree.Item id="b" textValue="notes.md">
          <Tree.Label>notes.md</Tree.Label>
        </Tree.Item>
      </Tree.Section>
    </Tree>
  ),
  // **A section is a group, and its header is the group's legend** — the same `NAV_HEADER` a sidebar
  // uses, because a tree and a nav are the same surface with different leaf behaviour.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed')).toBeInTheDocument()
    await expect(canvas.getByText('Untracked')).toBeInTheDocument()
    await expect(row(canvas, 'api\\.ts')).toBeInTheDocument()
  },
}

const PageTree = ({ loading }: { loading: boolean }) => (
  <Tree aria-label="Regions">
    <Tree.Item id="fra" textValue="Frankfurt">
      <Tree.Label>fra1 · Frankfurt</Tree.Label>
    </Tree.Item>
    <Tree.LoadMore isLoading={loading} onLoadMore={() => {}} />
  </Tree>
)

export const LoadMore: Story = {
  render: () => <PageTree loading />,
  play: async ({ canvasElement }) => {
    const sentinel = canvasElement.querySelector('[data-slot=tree-load-more]')
    await expect(sentinel).not.toBeNull()
    await expect(
      sentinel?.querySelector('[data-slot=loader]'),
    ).toBeInTheDocument()
  },
}

export const LoadMoreIdle: Story = {
  render: () => <PageTree loading={false} />,
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot=tree-load-more]'),
    ).not.toBeInTheDocument()
  },
}
