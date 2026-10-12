import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, userEvent } from 'storybook/test'

import { Button } from '../Button/Button'
import { FileTrigger } from 'react-aria-components'
import { DropZone, DropZoneHint, DropZoneTitle } from './DropZone'

const meta = {
  component: DropZone,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'DropZone.Title': DropZoneTitle,
    'DropZone.Hint': DropZoneHint,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<DropZone onDrop={async (e) => importFiles(await collect(e.items))}>
  <DropZone.Title>Drop a log file here</DropZone.Title>
  <DropZone.Hint>JSON or CSV, up to 10 MB</DropZone.Hint>
  <FileTrigger acceptedFileTypes={['.json', '.csv']} onSelect={(files) => upload(files)}>
    <Button variant="outline">Browse…</Button>
  </FileTrigger>
</DropZone>`,
      },
    },
    layout: 'centered',
  },
  render: () => (
    <DropZone onDrop={() => {}} className="w-96">
      <DropZone.Title>Drop a log file here</DropZone.Title>
      <DropZone.Hint>JSON or CSV, up to 10 MB</DropZone.Hint>
      <FileTrigger acceptedFileTypes={['.json', '.csv']} onSelect={() => {}}>
        <Button variant="outline">Browse…</Button>
      </FileTrigger>
    </DropZone>
  ),
} satisfies Meta<typeof DropZone>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const zone = canvasElement.querySelector(
      '[data-slot=dropzone]',
    ) as HTMLElement

    // **The dashed edge is the whole affordance.** It is the only place in this system where a dashed
    // border means "put something here" rather than "these two things are apart" — a solid edge would
    // read as a panel that merely happens to be empty.
    await expect(getComputedStyle(zone).borderTopStyle).toBe('dashed')
    await expect(getComputedStyle(zone).borderTopLeftRadius).toBe('0px')

    // The title is body text and the hint is the sheet's capped mono, so the line saying what is
    // accepted is not competing with the line telling you what to do.
    const hint = canvas.getByText('JSON or CSV, up to 10 MB')
    await expect(getComputedStyle(hint).fontSize).toBe('11px')
    await expect(getComputedStyle(hint).textTransform).toBe('uppercase')

    // **A drop zone on its own is not accessible**, and the browse button is not decoration: dragging
    // is a pointer gesture, invisible to a keyboard and to a screen reader. This is the other half.
    const browse = canvas.getByRole('button', { name: 'Browse…' })
    await expect(browse).toBeInTheDocument()
    await userEvent.click(browse)

    // ...and the file input it opens accepts only the types the hint promised, so the two cannot drift.
    const input = canvasElement.querySelector(
      'input[type=file]',
    ) as HTMLInputElement
    await expect(input).toHaveAttribute('accept', '.json,.csv')
    await expect(input).toHaveAttribute('type', 'file')
  },
}

export const Disabled: Story = {
  render: () => (
    <DropZone isDisabled className="w-96">
      <DropZone.Title>Drop a log file here</DropZone.Title>
      <DropZone.Hint>Uploads are paused</DropZone.Hint>
    </DropZone>
  ),
  // A zone that cannot be used dims **and says why**. The `Hint` slot is doing real work here: a
  // dimmed box with no explanation is a bug report waiting to happen.
  play: async ({ canvas, canvasElement }) => {
    const zone = canvasElement.querySelector(
      '[data-slot=dropzone]',
    ) as HTMLElement
    await expect(getComputedStyle(zone).opacity).toBe('0.3')
    await expect(canvas.getByText('Uploads are paused')).toBeVisible()
    await expect(zone).toHaveAttribute('data-disabled')
  },
}

export const Layout: Story = {
  render: () => (
    <div className="flex w-[560px] gap-3">
      <DropZone onDrop={() => {}} className="flex-1">
        <DropZone.Title>Logs</DropZone.Title>
        <DropZone.Hint>JSON</DropZone.Hint>
      </DropZone>
      <DropZone onDrop={() => {}} className="flex-1">
        <DropZone.Title>Traces</DropZone.Title>
        <DropZone.Hint>CSV</DropZone.Hint>
      </DropZone>
    </div>
  ),
  // Two zones side by side, each taking an equal share. A drop zone is a **box you aim at**, so where
  // its edges are is the whole interaction — the sort of claim a behavioural assertion never notices
  // and a misplaced `w-full` silently breaks.
  play: async ({ canvasElement }) => {
    const zones = [
      ...canvasElement.querySelectorAll('[data-slot=dropzone]'),
    ].map((z) => z.getBoundingClientRect())
    await expect(zones).toHaveLength(2)
    await expect(Math.round(zones[0].width)).toBe(Math.round(zones[1].width))
    await expect(Math.round(zones[0].top)).toBe(Math.round(zones[1].top))
    await expect(zones[0].right).toBeLessThanOrEqual(zones[1].left)
  },
}
