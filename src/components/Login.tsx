import { useTransition } from 'react'

import { Button } from './Button/Button'
import { Checkbox } from './Checkbox/Checkbox'
import { Form } from './Form/Form'
import { Link } from './Link/Link'
import { Separator } from './Separator/Separator'
import { TextField } from './TextField/TextField'

/** What the form hands back once it validates, keyed by each field's `name`. */
export interface SignInValues {
  email: string
  password: string
  remember: boolean
}

export interface LoginProps {
  /**
   * Called with the values after the example's simulated round trip. Returning a promise extends the
   * pending state for as long as it takes, which is the reason that state exists at all.
   */
  onSubmit?: (values: SignInValues) => void | Promise<void>
}

/**
 * How long the example pretends the sign-in request takes. There is no server behind this page, and
 * the delay is what makes the pending state observable in the first place — a real app would await
 * its own request instead, and pass `onSubmit`.
 */
const REQUEST_MS = 900

/**
 * An example sign-in page: the components doing the job they were built for, several at once.
 *
 * ```tsx
 * <Login onSubmit={async (values) => { await signIn(values) }} />
 * ```
 *
 * It is a page rather than a component, like `Home`, so it lives outside `src/routes` and the route
 * file stays thin enough for TanStack Router to code-split.
 *
 * **What it demonstrates is that the pieces compose without extra glue.** The fields carry their own
 * labels, hints and error slots; `Form` is what makes them all validate at once and moves focus to
 * the first thing that failed; and the submit button's `isPending` comes from a `useTransition` around
 * the request, so the label stays in the accessibility tree while it loads and the button is still
 * called "Sign in" to a screen reader while spinning.
 *
 * Two deliberate gaps, so they are not mistaken for oversights. There is no recovery flow behind
 * "Forgot password?" — the example has no such page, so the link is a placeholder rather than a link
 * to a 404. And nothing here stores a session: `onSubmit` is the seam a real app plugs into.
 */
export function Login({ onSubmit }: LoginProps) {
  // A transition rather than a `useState` flag. React 19 tracks the async scope, so `isPending` stays
  // true across the awaited request rather than only for the render that started it — which is what
  // makes one flag enough, with no separate "loading" state to keep in step.
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Read before the transition, because `currentTarget` is only live for the dispatch. The browser
    // has already validated the fields by the time this runs — that is what `validationBehavior="native"`
    // buys — so this handler is only ever reached with values worth sending.
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const values: SignInValues = {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      // An unchecked checkbox submits nothing at all, so absence is the false answer.
      remember: data.get('remember') === 'on',
    }

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_MS))
      await onSubmit?.(values)
    })
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-base px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[12px] tracking-[0.06em] text-teal uppercase">
          Pulse
        </p>
        <h1 className="mt-4 text-[32px] leading-[1.05] font-semibold tracking-[-0.02em]">
          Sign in
        </h1>
        <p className="mt-3 text-[13px] text-fg/60">
          Every region from one console. Use the account your team already gave
          you.
        </p>

        <Form
          onSubmit={handleSubmit}
          className="mt-8 border border-line-strong bg-panel p-6"
        >
          <Form.Section>
            <TextField name="email" isRequired>
              <TextField.Label>Email</TextField.Label>
              <TextField.Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <TextField.Error>
                Enter the address you sign in with.
              </TextField.Error>
            </TextField>

            <TextField name="password" isRequired>
              <TextField.Label>Password</TextField.Label>
              <TextField.Input
                type="password"
                autoComplete="current-password"
                minLength={8}
                placeholder="At least 8 characters"
              />
              <TextField.Hint>At least 8 characters.</TextField.Hint>
              <TextField.Error>
                Passwords here are at least 8 characters.
              </TextField.Error>
            </TextField>
          </Form.Section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Checkbox name="remember" defaultSelected>
              <Checkbox.Indicator />
              <Checkbox.Text>Keep me signed in</Checkbox.Text>
            </Checkbox>
            <Link variant="url" href="#reset">
              Forgot password?
            </Link>
          </div>

          <Form.Actions>
            <Button type="submit" isPending={isPending} className="w-full">
              <Button.Text>Sign in</Button.Text>
            </Button>
          </Form.Actions>
        </Form>

        <Separator variant="soft" className="my-6" />

        <p className="text-[12px] text-fg/60">
          Here for the components rather than the console?{' '}
          <Link
            variant="viewmore"
            href={`${import.meta.env.BASE_URL}storybook/`}
          >
            Open the docs
          </Link>
        </p>
      </div>
    </main>
  )
}
