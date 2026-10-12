import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, userEvent, waitFor } from 'storybook/test'

import { Login } from './Login'

const meta = {
  component: Login,
  // A page rather than a control, so it takes the canvas the way it takes the viewport on its route.
  parameters: { layout: 'fullscreen' },
  tags: ['ai-generated'],
} satisfies Meta<typeof Login>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    // It is a real `<form>`, so Enter in a field submits it and a password manager recognises it. It
    // carries no `role="form"`: a form is only a landmark when it has an accessible name, and this one
    // has a visible heading instead — so a role query here would find nothing and assert nothing.
    const form = canvasElement.querySelector('form') as HTMLElement
    await expect(form).toBeInTheDocument()
    await expect(form).not.toHaveAttribute('role')

    const heading = canvas.getByRole('heading', { name: 'Sign in', level: 1 })
    await expect(heading).toBeVisible()

    // Each field is reachable by its own label, which is the one thing a field anatomy exists to get
    // right — and the password is only reachable this way, because an input of that type has no role.
    const email = canvas.getByLabelText('Email')
    const password = canvas.getByLabelText('Password')
    await expect(email).toHaveAttribute('type', 'email')
    await expect(password).toHaveAttribute('type', 'password')
    await expect(canvas.getByText('At least 8 characters.')).toBeVisible()

    await expect(
      canvas.getByRole('checkbox', { name: /keep me signed in/i }),
    ).toBeChecked()

    // A submit button is what makes Enter in a field work at all, which is the reason it is not a
    // button with a press handler.
    const submit = canvas.getByRole('button', { name: 'Sign in' })
    await expect(submit).toHaveAttribute('type', 'submit')

    await expect(
      canvas.getByRole('link', { name: /forgot password/i }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: /open the docs/i }),
    ).toBeVisible()

    // The stylesheet loaded and Tailwind resolved the class the button actually wears. Without these
    // the story passes with no CSS at all, which reads exactly like a page that has been styled.
    await expect(getComputedStyle(submit).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(heading).fontSize).toBe('32px')
    // The panel's hairline, from the line token rather than a hardcoded border.
    await expect(getComputedStyle(form).borderTopWidth).toBe('1px')
  },
}

export const Required: Story = {
  play: async ({ canvas }) => {
    const email = canvas.getByLabelText('Email')

    // Nothing is filled in, so the browser blocks the submit and React Aria marks the field invalid.
    // The handler is never reached, which is the point: the form is not sent with values nobody could
    // have entered, and nothing here has to re-check that by hand.
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }))

    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(
      canvas.getByText('Enter the address you sign in with.'),
    ).toBeVisible()
    // ...and focus is moved to the first thing that is wrong, rather than left on the button.
    await expect(email).toHaveFocus()
  },
}

export const Submit: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(canvas.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }))

    // The *values*, not the inputs: this is what proves each field's `name` reaches the form's own
    // data, and that the checkbox's default is read as an answer rather than assumed to be `true`. The
    // wait is longer than the default second because the page awaits its simulated round trip first.
    await waitFor(
      () =>
        expect(args.onSubmit).toHaveBeenCalledWith({
          email: 'ada@example.com',
          password: 'correct-horse',
          remember: true,
        }),
      { timeout: 3000 },
    )
  },
}

export const Submitting: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(canvas.getByLabelText('Password'), 'correct-horse')
    const submit = canvas.getByRole('button', { name: 'Sign in' })
    await userEvent.click(submit)

    // `isPending` is not `isDisabled`: there is no native `disabled`, so the button keeps its name and
    // stays focusable. That is the whole reason its label is hidden by colour rather than by
    // `visibility` — hiding it would drop the button's only accessible name while it loads.
    await waitFor(() => expect(submit).toHaveAttribute('data-pending', 'true'))
    await expect(submit).not.toBeDisabled()
    await expect(submit).toHaveAccessibleName('Sign in')

    // The transition's own promise ends it, so this waits rather than resolving anything by hand — and
    // if the async scope were not tracked, `isPending` would already be false here.
    await waitFor(() => expect(submit).not.toHaveAttribute('data-pending'), {
      timeout: 3000,
    })
  },
}
