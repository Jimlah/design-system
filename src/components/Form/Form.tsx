import { Form as AriaForm } from 'react-aria-components'
import type { FormProps as AriaFormProps } from 'react-aria-components'

import type { ReactNode } from 'react'

export interface FormProps extends Omit<
  AriaFormProps,
  'children' | 'className' | 'validationErrors' | 'validationBehavior'
> {
  /** A server's answer, keyed by each field's `name`. A field does not care where the objection came from, which is why the same slot renders both. */
  validationErrors?: AriaFormProps['validationErrors']
  /** `native` by default here, because in `aria` mode React Aria 1.22 does not validate on submit at all — see the doc. */
  validationBehavior?: AriaFormProps['validationBehavior']

  className?: string
  children?: ReactNode
}

/** The group's heading — the sheet's `.ds-panel-title`, the same one a modal's title wears. */
export interface FormLegendProps {
  className?: string
  children?: ReactNode
}

/** A block of fields that belongs together. */
export interface FormSectionProps {
  className?: string
  children?: ReactNode
}

/** The row of buttons that finishes the form, right-aligned as the sheet's panels do. */
export interface FormActionsProps {
  className?: string
  children?: ReactNode
}

const ROOT = 'flex flex-col gap-5'

const LEGEND = 'text-lg font-semibold text-foreground'

const SECTION = 'flex flex-col gap-4'

const ACTIONS = 'flex items-center justify-end gap-2'

/**
 * A group of fields with a button that submits them.
 *
 * ```tsx
 * <Form onSubmit={(e) => save(e)}>
 *   <Form.Legend>New monitor</Form.Legend>
 *   <Form.Section>
 *     <TextField name="host" isRequired>
 *       <TextField.Label>Hostname</TextField.Label>
 *       <TextField.Input />
 *       <TextField.Error>Enter a hostname.</TextField.Error>
 *     </TextField>
 *   </Form.Section>
 *   <Form.Actions>
 *     <Button type="submit">Save</Button>
 *   </Form.Actions>
 * </Form>
 * ```
 *
 * **The point of a form component is that the fields already know how to say what is wrong.** Every
 * control here — `TextField`, `Select`, `Checkbox`, `Slider` — was built on React Aria's field
 * anatomy, so each one already renders its own `FieldError` and marks itself `aria-invalid`. `Form`
 * is what makes them all validate at once, on submit, and moves focus to the first thing that failed.
 * A consumer wiring that by hand would reimplement it per form and get it subtly different each time.
 *
 * `validationBehavior` defaults to **`native`**, which is not the library's default and is not a
 * preference: React Aria's `aria` mode does not validate a form on submit in this version. Measured,
 * not assumed — an `aria`-mode form with a required empty field submitted cleanly, while the same form
 * in `native` mode marked the field `aria-invalid`, rendered `TextField.Error`, and moved focus to the
 * thing that was wrong. The cost is the browser's own bubble on top of the styled message; the
 * alternative was no validation at all.
 *
 * Server-side failures come back through `validationErrors`, keyed by each field's `name` — the same
 * mechanism, so a field does not care whether the answer came from the browser or from the server.
 */
function FormRoot({ className, children, ...props }: FormProps) {
  return (
    <AriaForm
      data-slot="form"
      // **`native`, because `aria` does not validate at all.** React Aria documents `aria` as the
      // default — validation on submit, errors rendered by the component — and in this version a form
      // with a required empty field simply submitted: no `FieldError`, no `aria-invalid`, focus left on
      // the button. `native` puts `required` on the input, and React Aria then marks the field invalid
      // and renders the same styled `TextField.Error` it always did. A consumer can still pass their own
      // `validationBehavior` through, since `{...props}` comes last.
      validationBehavior="native"
      className={[ROOT, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </AriaForm>
  )
}

/**
 * The form's title. Use it as `Form.Legend` — the sheet's `.ds-panel-title`, the same type a modal's
 * title wears, because both are the name of a short task.
 *
 * Exported as `FormLegend` only so tooling can resolve it; consume the compound form `Form.Legend`.
 */
export function FormLegend({ className, children }: FormLegendProps) {
  return (
    <div className={[LEGEND, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * A block of fields that belongs together. Use it as `Form.Section` when a long form has more than one
 * idea in it.
 *
 * Exported as `FormSection` only so tooling can resolve it; consume the compound form `Form.Section`.
 */
export function FormSection({ className, children }: FormSectionProps) {
  return (
    <div className={[SECTION, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The buttons that finish the form. Use it as `Form.Actions` — right-aligned, because the affirmative
 * action belongs at the end of the reading direction.
 *
 * Exported as `FormActions` only so tooling can resolve it; consume the compound form `Form.Actions`.
 */
export function FormActions({ className, children }: FormActionsProps) {
  return (
    <div className={[ACTIONS, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

/**
 * The compound export. A plain `function` decorated with `Object.assign` leaves TypeScript unaware of
 * the slots, which is why the root is named apart and only the decorated const is exported.
 */
export const Form = Object.assign(FormRoot, {
  Legend: FormLegend,
  Section: FormSection,
  Actions: FormActions,
})
