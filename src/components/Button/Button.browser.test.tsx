import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Button } from './Button'

/**
 * `Button`'s component tests, in Vitest's browser mode — the setup the guide recommends for
 * component testing and the one `vite.config.ts` points the `components` project at.
 *
 * These are not a second copy of `Button.stories.tsx`. A story is the component *documented*: it
 * carries the curated snippet, the controls and the docs page, and its `play` function checks what
 * the page claims. These check the contract instead — what a caller can rely on — and they do it in
 * a real browser, which is the only place a computed colour or a focus ring means anything.
 *
 * The stylesheet comes from `src/browserTestSetup.ts`, wired in as `setupFiles`; without it every
 * colour below would be comparing two transparent values.
 */

test('is a real button that reports a press through onPress', async () => {
  const onPress = vi.fn()
  const screen = await render(<Button onPress={onPress}>New monitor</Button>)

  const button = screen.getByRole('button', { name: 'New monitor' })
  await expect.element(button).toBeInTheDocument()

  // A press, not a DOM click handler: React Aria is what turns this into `onPress`.
  await button.click()
  expect(onPress).toHaveBeenCalledTimes(1)
})

test('isDisabled is a state, and it is announced as one', async () => {
  const screen = await render(<Button isDisabled>New monitor</Button>)

  // React Aria renders the native `disabled` attribute as well as `data-disabled`, so this is the
  // state a screen reader and the browser agree on rather than one this test invents.
  await expect
    .element(screen.getByRole('button', { name: 'New monitor' }))
    .toBeDisabled()
})

test('isPending stays focusable, because the work is in flight and the control is not gone', async () => {
  const screen = await render(<Button isPending>New monitor</Button>)

  const button = screen.getByRole('button', { name: 'New monitor' })
  await expect.element(button).toHaveAttribute('data-pending')

  // The documented difference from `isDisabled`: no native `disabled`, so focus can still land on
  // it. Focus is exactly the sort of thing a browser-mode test can check and a simulated DOM cannot.
  const element = button.element() as HTMLButtonElement
  expect(element.hasAttribute('disabled')).toBe(false)
  element.focus()
  expect(document.activeElement).toBe(element)
})

test('paints its fill from the real stylesheet, and an outline paints none', async () => {
  // Both in one render, with names of their own: `render`'s selectors query the page, not the
  // container (they have to — a portalled surface is not inside it), so two `render` calls would put
  // two buttons named "New monitor" in the page and every query would be ambiguous.
  const screen = await render(
    <>
      <Button>Filled</Button>
      <Button variant="outline">Outlined</Button>
    </>,
  )

  const background = (locator: { element: () => Element }) =>
    getComputedStyle(locator.element()).backgroundColor

  // The sheet's own accent, resolved by the browser — the assertion a jsdom test cannot make.
  expect(background(screen.getByRole('button', { name: 'Filled' }))).not.toBe(
    'rgba(0, 0, 0, 0)',
  )
  // ...and an outline carries its meaning in the border, so its fill stays out of the way.
  expect(background(screen.getByRole('button', { name: 'Outlined' }))).toBe(
    'rgba(0, 0, 0, 0)',
  )
})
