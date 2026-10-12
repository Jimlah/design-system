import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../Button/Button'
import {
  Toast,
  ToastClose,
  ToastContent,
  ToastQueue,
  ToastRegion,
  ToastText,
  ToastTitle,
} from './Toast'

type ToastData = { title: string; text: string }

/** One queue per story run: a module-level queue would keep toasts across tests. */
const makeQueue = (): ToastQueue<ToastData> =>
  new ToastQueue<ToastData>({ maxVisibleToasts: 3 })

const meta = {
  component: Toast,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'Toast.Region': ToastRegion,
    'Toast.Content': ToastContent,
    'Toast.Title': ToastTitle,
    'Toast.Text': ToastText,
    'Toast.Close': ToastClose,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `const queue = new Toast.Queue({ maxVisibleToasts: 3 })

<Toast.Region queue={queue} aria-label="Notifications">
  {({ toast }) => (
    <Toast toast={toast}>
      <Toast.Content>
        <Toast.Title>Check failed</Toast.Title>
        <Toast.Text>fra1 · Frankfurt stopped responding.</Toast.Text>
      </Toast.Content>
      <Toast.Close />
    </Toast>
  )}
</Toast.Region>

queue.add({ title: 'Check failed' }, { timeout: 5000 })`,
      },
    },
    layout: 'fullscreen',
  },
  // `toast` is required — a Toast only exists inside a Region's render function — so there is
  // nothing for Storybook to put in `args`. The cast is how that is said; the stories all supply
  // their own `render`.
} as Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A queue and a region, which is the whole wiring. `Toast.Region` goes near the root and only
 * once — it is the thing a screen reader is told about when anything happens on the page.
 */
const Harness = ({ queue }: { queue: ToastQueue<ToastData> }) => (
  <>
    <div className="p-8">
      <Button
        onPress={() =>
          queue.add(
            {
              title: 'Check failed',
              text: 'fra1 · Frankfurt stopped responding.',
            },
            { timeout: 5000 },
          )
        }
      >
        Add toast
      </Button>
    </div>
    <Toast.Region queue={queue} aria-label="Notifications">
      {({ toast }) => (
        <Toast toast={toast}>
          <Toast.Content>
            <Toast.Title>{toast.content.title}</Toast.Title>
            <Toast.Text>{toast.content.text}</Toast.Text>
          </Toast.Content>
          <Toast.Close />
        </Toast>
      )}
    </Toast.Region>
  </>
)

export const Default: Story = {
  render: () => <Harness queue={makeQueue()} />,
  play: async ({ canvas }) => {
    await expect(screen.queryByText(/check failed/i)).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: /add toast/i }))

    // The region is the landmark a screen reader hears; the toast is inside it.
    const region = await screen.findByRole('region', { name: /notifications/i })
    await expect(region).toBeInTheDocument()
    // A toast arrives with the same entry animation every other panel has, and its first frame
    // is `opacity: 0` — so the text is waited for rather than read on the frame it appears.
    await waitFor(() => expect(screen.getByText(/check failed/i)).toBeVisible())
    await expect(screen.getByText(/stopped responding/i)).toBeVisible()
  },
}

export const Dismiss: Story = {
  render: () => <Harness queue={makeQueue()} />,
  // Dismissing has to work with a pointer and with the keyboard, and it has to put focus somewhere
  // sensible rather than on the body — React Aria does both, which is most of the reason to use it.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /add toast/i }))
    await screen.findByText(/check failed/i)

    const dismiss = screen.getByRole('button', { name: /dismiss/i })
    await userEvent.click(dismiss)
    await expect(screen.queryByText(/check failed/i)).not.toBeInTheDocument()
  },
}

export const Parts: Story = {
  render: () => <Harness queue={makeQueue()} />,
  // The tooltip's surface, which is the closest thing the sheet has to a floating panel — and the
  // sheet has no toast of its own at all. The title is the sheet's row legend at full strength; the
  // body is 13px at 70%, because a toast's second line is detail rather than a heading.
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /add toast/i }))
    await screen.findByText(/check failed/i)

    const title = screen.getByText(/check failed/i)
    const body = screen.getByText(/stopped responding/i)
    await expect(getComputedStyle(title).fontSize).toBe('12px')
    await expect(getComputedStyle(title).textTransform).toBe('uppercase')
    await expect(getComputedStyle(title).color).toBe('oklch(1 0 none)')
    await expect(getComputedStyle(body).fontSize).toBe('13px')

    // The surface is the tooltip's: its own panel, square, with a strong hairline.
    const surface = title.closest('[data-rac]') as HTMLElement
    await expect(getComputedStyle(surface).borderTopColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(surface).borderTopLeftRadius).toBe('0px')
  },
}
