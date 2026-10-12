import { expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Login } from './Login'

/**
 * The example page's tests, in Vitest's browser mode rather than as a story.
 *
 * A story is how a *library component* is documented: it carries the curated snippet, the controls
 * and a docs page, and it is what puts the component into the components manifest this repo's MCP
 * tools serve. This page is none of those things — it is an example of the components being *used* —
 * so it gets a browser test instead, and the four claims below are the ones worth holding it to.
 *
 * The stylesheet comes from `src/browserTestSetup.ts`, wired in as `setupFiles`, so the computed
 * styles in the first test mean what they mean in the app.
 */

test('is a real form, with each field reachable by its own label', async () => {
  const screen = await render(<Login />)

  // A real `<form>`, so Enter in a field submits it and a password manager recognises it. It carries no
  // `role="form"`: a form is only a landmark when it has an accessible name, and this one has a heading
  // instead — so querying that role here would find nothing and assert nothing at all.
  const form = document.querySelector('form') as HTMLFormElement
  expect(form).not.toBeNull()
  expect(form.hasAttribute('role')).toBe(false)

  await expect
    .element(screen.getByRole('heading', { name: 'Sign in' }))
    .toBeVisible()

  // By label, which is the one thing the field anatomy exists to get right — and the password is only
  // reachable this way, because an input of that type has no role.
  await expect
    .element(screen.getByLabelText('Email'))
    .toHaveAttribute('type', 'email')
  await expect
    .element(screen.getByLabelText('Password'))
    .toHaveAttribute('type', 'password')
  await expect.element(screen.getByText('At least 8 characters.')).toBeVisible()
  await expect
    .element(screen.getByRole('checkbox', { name: /keep me signed in/i }))
    .toBeChecked()

  // A submit button is what makes Enter in a field work, which is why it is not a button wearing a
  // press handler.
  const submit = screen.getByRole('button', { name: 'Sign in' })
  await expect.element(submit).toHaveAttribute('type', 'submit')
  await expect
    .element(screen.getByRole('link', { name: /open the docs/i }))
    .toBeVisible()

  // The stylesheet loaded and Tailwind resolved the classes this page actually wears. Without these
  // the test passes with no CSS at all, which reads exactly like a page that has been styled.
  expect(getComputedStyle(submit.element()).backgroundColor).not.toBe(
    'rgba(0, 0, 0, 0)',
  )
  expect(
    getComputedStyle(screen.getByRole('heading', { name: 'Sign in' }).element())
      .fontSize,
  ).toBe('32px')
  // The panel's hairline, from the line token rather than a hardcoded border.
  expect(getComputedStyle(form).borderTopWidth).toBe('1px')
})

test('an empty submit is blocked, and focus moves to the field that is wrong', async () => {
  const screen = await render(<Login />)

  await screen.getByRole('button', { name: 'Sign in' }).click()

  // The browser blocks the submit and React Aria marks the field, so the handler is never reached and
  // nothing here has to re-check the values by hand.
  const email = screen.getByLabelText('Email')
  await expect.element(email).toHaveAttribute('aria-invalid', 'true')
  await expect
    .element(screen.getByText('Enter the address you sign in with.'))
    .toBeVisible()
  expect(document.activeElement).toBe(email.element())
})

test('hands the form its values, reading an unchecked box as false', async () => {
  const onSubmit = vi.fn()
  const screen = await render(<Login onSubmit={onSubmit} />)

  // Unchecked first, because that is the half worth proving: a checkbox that is not ticked submits
  // nothing at all, so the page has to read absence as the answer rather than assume a default.
  //
  // Toggled through its label, because that is where a user clicks. The box they see is an
  // `aria-hidden` indicator sitting over the input, so a click aimed at the input's centre is delivered
  // to the indicator and the label toggles the control from there — which a hit-testing locator insists
  // on and a dispatched `userEvent.click(input)` never notices.
  await screen.getByText('Keep me signed in').click()
  await screen.getByLabelText('Email').fill('ada@example.com')
  await screen.getByLabelText('Password').fill('correct-horse')
  await screen.getByRole('button', { name: 'Sign in' }).click()

  // A longer wait than the default: the page awaits its simulated round trip before handing them on.
  await vi.waitFor(
    () =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'correct-horse',
        remember: false,
      }),
    { timeout: 3000 },
  )
})

test('isPending keeps the button focusable and its label painted, then clears', async () => {
  const screen = await render(<Login />)

  await screen.getByLabelText('Email').fill('ada@example.com')
  await screen.getByLabelText('Password').fill('correct-horse')
  const submit = screen.getByRole('button', { name: 'Sign in' })
  await submit.click()

  // `isPending` is not `isDisabled`: there is no native `disabled`, so focus can still land on it.
  // That is the documented difference, and one only a real browser can settle.
  await expect.element(submit).toHaveAttribute('data-pending')
  const element = submit.element() as HTMLButtonElement
  expect(element.disabled).toBe(false)

  // ...and the label is hidden by colour rather than by `visibility`, so the button keeps its name
  // while it loads. Hiding it would drop the button's only accessible name.
  const label = element.querySelector('[data-slot="text"]') as HTMLElement
  expect(label.textContent).toBe('Sign in')
  expect(getComputedStyle(label).visibility).not.toBe('hidden')

  // The transition's own promise ends the state, so this waits rather than resolving anything by hand
  // — and if the async scope were not tracked, the attribute would already be gone.
  await vi.waitFor(
    () => expect(element.hasAttribute('data-pending')).toBe(false),
    { timeout: 3000 },
  )
})
