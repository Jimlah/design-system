import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Pulse } from './Pulse'

/**
 * The Pulse page's own tests, in Vitest's browser mode rather than as a story.
 *
 * The page is an example of the library being used rather than a library component: it is in no
 * registry item and it has no story, so what documents it is `docs/pulse.md` and what holds it to
 * account is this file. Four claims are worth a browser, and they are the four the page is built on.
 *
 * **The page is its own demonstration of the theme**, so the first test moves the control rather than
 * reading the markup: it asserts that the attribute lands on the page's own root and on nothing above
 * it, which is the whole reason `light-dark()` is worth using this way.
 *
 * **The token table quotes the sheet**, and it is a quotation nothing can check at runtime, so the test
 * checks that both readings of an accent are on the page and that the table has the shape it claims.
 *
 * **The install command is composed**, from a field and a segmented choice, which is the one thing on
 * the page a reader can be wrong about: it is a string they might paste.
 */

test('the theme control flips this page, and reaches nothing outside it', async () => {
  const screen = await render(<Pulse />)

  const page = document.querySelector<HTMLElement>('[data-theme]')
  expect(page).not.toBeNull()
  expect(page?.getAttribute('data-theme')).toBe('dark')

  // **The page's claim, measured rather than described.** One attribute on one subtree moves the
  // computed colour below it; this is also the app's own CSS check, which the story the old landing
  // page carried used to be.
  const bar = document.querySelector<HTMLElement>('.bar-cut')
  expect(bar).not.toBeNull()
  const darkAccent = getComputedStyle(bar as HTMLElement).backgroundColor
  const darkInk = getComputedStyle(page as HTMLElement).color

  await userEvent.click(screen.getByRole('radio', { name: 'Light' }).element())
  await vi.waitFor(() => expect(page?.getAttribute('data-theme')).toBe('light'))

  // `light-dark()` resolves per element, so a theme is one attribute on one subtree. Nothing above the
  // page is told anything and no token is redeclared — which is what makes the whole palette flip without
  // a second set of values existing anywhere.
  expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  expect(document.body.getAttribute('data-theme')).toBeNull()

  await vi.waitFor(() =>
    expect(getComputedStyle(bar as HTMLElement).backgroundColor).not.toBe(
      darkAccent,
    ),
  )
  expect(getComputedStyle(page as HTMLElement).color).not.toBe(darkInk)

  await userEvent.click(screen.getByRole('radio', { name: 'Dark' }).element())
  await vi.waitFor(() => expect(page?.getAttribute('data-theme')).toBe('dark'))
})

test('the token table carries both readings of a value that holds them', async () => {
  await render(<Pulse />)

  const table = document.querySelector<HTMLTableElement>('table')
  expect(table).not.toBeNull()
  const body = table?.textContent ?? ''

  // Both columns of one accent, as src/styles.css declares them. A browser cannot be asked for the pair —
  // getComputedStyle resolves the theme in force and discards the other one — so the page states it and
  // this is where the statement is held.
  expect(body).toContain('oklch(55% 0.0931 189.5)')
  expect(body).toContain('oklch(91.98% 0.1236 189.5)')
  expect(table?.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(5)
})

test('the accordion keeps one layer open', async () => {
  const screen = await render(<Pulse />)

  await expect
    .element(screen.getByRole('button', { name: 'Close Tokens' }))
    .toHaveAttribute('aria-expanded', 'true')

  await userEvent.click(
    screen.getByRole('button', { name: 'Open Behaviour' }).element(),
  )

  await expect
    .element(screen.getByRole('button', { name: 'Close Behaviour' }))
    .toHaveAttribute('aria-expanded', 'true')
  await expect
    .element(screen.getByRole('button', { name: 'Open Tokens' }))
    .toHaveAttribute('aria-expanded', 'false')
})

test('the install command is composed from the field and the choice', async () => {
  const screen = await render(<Pulse />)
  const shown = () => document.body.textContent

  expect(shown()).toContain('npx shadcn@latest add @pulse/pulse')

  await userEvent.click(
    screen.getByRole('radio', { name: 'One component' }).element(),
  )
  await vi.waitFor(() =>
    expect(shown()).toContain('npx shadcn@latest add @pulse/button'),
  )

  // The namespace is the reader's to rename, and the command has to follow it: the two together are the
  // one thing on this page someone will paste into a terminal.
  const field = screen.getByLabelText('Namespace').element() as HTMLInputElement
  await userEvent.clear(field)
  await userEvent.type(field, '@acme')
  await vi.waitFor(() =>
    expect(shown()).toContain('npx shadcn@latest add @acme/button'),
  )
})
