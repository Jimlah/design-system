/**
 * TanStack Form composition for the Pulse field controls.
 *
 * `Form` is a `<form>` that validates React Aria's own fields. This module is the other half: the
 * same controls driven by [TanStack Form](https://tanstack.com/form), where the form library owns
 * the values and this library owns how a field looks, what it says when it is wrong, and how it is
 * operated.
 *
 * ## Why `createFormHook`, and not a wrapper around each control
 *
 * The obvious shape for an integration is one wrapper component per control — a `FieldTextField`
 * taking a `name` and reaching for the form through a hook. It is the shape written by hand in every
 * app that uses both libraries, and it is wrong in a way that only shows up later: the wrapper has
 * to be handed the form, so it only works inside the component that owns it. A field inside a
 * reusable sub-form, a field group, or a `withForm` block cannot reach a form it was never given.
 *
 * TanStack's own answer is `createFormHook`, and it is the answer for the same reason React Aria
 * components here take `isDisabled` rather than `disabled`: the context is the wiring. A field
 * component reads its field from `fieldContext`, which `<form.AppField name="…">` provides, so the
 * same component works anywhere in the tree — including inside a sub-form rendered by `withForm`,
 * which receives a *different* form instance.
 *
 * The registration at the bottom is therefore the whole integration. `useAppForm` is `useForm` with
 * the field components already attached, and the render prop TanStack hands to `AppField`'s children
 * is a `FieldApi` with those components assigned onto it — which is why a consumer writes
 * `<field.TextField>` and gets this library's `TextField` bound to that field.
 *
 * ## Two things every root below does, and why
 *
 * **`validationBehavior="aria"` on every field.** TanStack owns validation here, so React Aria must
 * not also run the browser's. Left at the library default of `native`, a required field renders the
 * `required` attribute and the browser blocks submission with its own bubble — the styled message
 * never gets a chance and the two validators argue. `aria` keeps `data-required`, so the label still
 * draws its asterisk, and hands validation to the form library. `Form.tsx` records the same decision
 * made the other way round, for the forms React Aria validates itself.
 *
 * **`isInvalid` comes from the field's own errors, with no "touched" gate.** TanStack's
 * `handleSubmit` marks every field touched before it validates, so a submit-time error always shows;
 * and a validator that runs `onChange` shows as the user types, which is what that validator asked
 * for. Gating on `isTouched` as well would only ever hide errors the validator deliberately made.
 *
 * ## The one field React Aria does not supply
 *
 * `field.Slider` binds its value and its invalid state, and `field.Slider.Error` renders the
 * field's messages — but the invalid state itself is this library's, not React Aria's. `Slider` is
 * not a field there: `useSlider` takes no `isInvalid`, so `Slider` publishes the validation
 * context a `FieldError` renders from itself, and the message is the caller's rather than a
 * server's. Every other bound field here reads an invalid state React Aria computed. See
 * `docs/components/form.md`.
 */
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/react-form'
import { useContext } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { Color, DateValue, Key, TimeValue } from 'react-aria-components'

import { Button } from '../Button/Button'
import type { ButtonProps } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import type { CheckboxGroupProps, CheckboxProps } from '../Checkbox/Checkbox'
import { ColorField } from '../ColorField/ColorField'
import type { ColorFieldProps } from '../ColorField/ColorField'
import { DateField } from '../DateField/DateField'
import type { DateFieldProps } from '../DateField/DateField'
import { NumberField } from '../NumberField/NumberField'
import type { NumberFieldProps } from '../NumberField/NumberField'
import { Radio } from '../Radio/Radio'
import type { RadioGroupProps } from '../Radio/Radio'
import { SearchField } from '../SearchField/SearchField'
import type { SearchFieldProps } from '../SearchField/SearchField'
import { Select } from '../Select/Select'
import type { SelectProps } from '../Select/Select'
import { Slider } from '../Slider/Slider'
import type { SliderProps } from '../Slider/Slider'
import { Switch } from '../Switch/Switch'
import type { SwitchProps } from '../Switch/Switch'
import { TextArea } from '../TextArea/TextArea'
import type { TextAreaProps } from '../TextArea/TextArea'
import { TextField } from '../TextField/TextField'
import type { TextFieldProps } from '../TextField/TextField'
import { TimeField } from '../TimeField/TimeField'
import type { TimeFieldProps } from '../TimeField/TimeField'
import { Form, FormActions, FormLegend, FormSection } from './Form'
import type { FormProps } from './Form'

/**
 * The two contexts `createFormHook` needs, plus the accessors for them.
 *
 * They are created once here rather than in the consumer's app, for the same reason the field
 * components live here: `createFormHook` pairs a context with the components that read it, so a
 * second `createFormHookContexts()` elsewhere would make a second, disconnected pair and a
 * `field.TextField` that throws. `useFieldContext` is exported so an app can write its own field
 * component against this library's controls and register it with `extendForm`.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

/**
 * Every message a field is currently carrying, as plain strings.
 *
 * TanStack types `meta.errors` as "whatever the validators returned", and that is not one thing: a
 * validator function returns a string, while a Standard Schema validator — the Zod, Valibot or
 * ArkType path — returns an *issue object* with a `message` on it. Joining the array directly, which
 * is what TanStack's own examples do, renders `[object Object]` for the second kind. Both shapes are
 * read here, and anything else is dropped rather than printed.
 */
export function fieldErrorMessages(field: AnyFieldApi): string[] {
  const errors = (field.state.meta.errors as unknown[]).flat(1)
  return errors
    .map((error) => {
      if (typeof error === 'string') return error
      if (error && typeof error === 'object' && 'message' in error) {
        const message: unknown = (error as { message?: unknown }).message
        return typeof message === 'string' ? message : undefined
      }
      return undefined
    })
    .filter((message): message is string => Boolean(message))
}

/**
 * What `fieldErrorSlot` renders — the shared shape of every control's `Error` slot.
 *
 * Narrower than React Aria's own `FieldErrorProps`, and deliberately: the error slots in this
 * library publish `className?: string`, not the render function the library allows, and a factory
 * typed against the wider prop cannot be handed one of them. `string` still satisfies the wider
 * prop, so the narrower type is the one both ends agree on.
 */
type FieldErrorSlotProps = { className?: string; children?: ReactNode }

/**
 * **Every bound field's value is `T | undefined`, not `T`.**
 *
 * `useFieldContext<T>()` is a *claim* this library makes about the form it is dropped into, not a
 * constraint it can enforce: the consumer's `defaultValues` decides the real type, and a key that is
 * absent, cleared with `setFieldValue(name, undefined)`, or reached through an optional parent is
 * `undefined` at runtime whatever the cast says. Passing that straight through would flip a React
 * Aria control from controlled to uncontrolled — the one state in which the form stops owning the
 * value, which is the whole premise of this file — so every root narrows it with a default, and every
 * root declares the value as `Bound<…>` so that the default is a real branch rather than dead code.
 */
type Bound<T> = T | undefined

/**
 * Turns a control's own `Error` slot into the one a field component carries.
 *
 * With no children it renders the field's own messages, so `<field.TextField.Error />` is the whole
 * message rather than a placeholder waiting for the consumer to re-implement error extraction. With
 * children it is the plain slot again — which is what a server's answer needs, where the text is
 * known and the field's validators are not what produced it.
 *
 * It reads the context with `useContext` rather than `useFieldContext` on purpose: the throwing
 * accessor is right for a root, where a missing provider is a bug, and wrong for a slot, where it
 * would turn a misplaced slot into a crash instead of a field that renders its plain content.
 */
function fieldErrorSlot(Plain: ComponentType<FieldErrorSlotProps>) {
  function FieldError({ children, ...props }: FieldErrorSlotProps) {
    // `createFormHookContexts` builds this context with `null`, so a slot outside a field reads
    // `null` — but the type it publishes says `AnyFieldApi`, with no `| null` on it. The cast restores
    // what is actually there; without it the branch below reads as dead code, and the misplacement
    // this guards against turns into a crash instead of a field that renders its plain content.
    const field = useContext(fieldContext) as AnyFieldApi | null
    const messages = field ? fieldErrorMessages(field) : []
    return (
      <Plain {...props}>
        {children ?? (messages.length > 0 ? messages.join(', ') : null)}
      </Plain>
    )
  }
  return FieldError
}

/**
 * The props every field component publishes: the control's own, minus the ones the *field* owns.
 *
 * `value`, `defaultValue` and `onChange` are omitted rather than merely unused — TanStack's form is
 * the single source of truth, so accepting them here would silently do nothing. That is the same
 * rule `TextField` states for its own `Input`. `name` and `validationBehavior` go with them: the
 * field names the control after itself in the form's data, and it validates in `aria` mode for the
 * reason recorded at the top of this file.
 */
export type FieldTextFieldProps = Omit<
  TextFieldProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldTextAreaProps = Omit<
  TextAreaProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldSearchFieldProps = Omit<
  SearchFieldProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldNumberFieldProps = Omit<
  NumberFieldProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldSelectProps = Omit<
  SelectProps,
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldCheckboxProps = Omit<
  CheckboxProps,
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldCheckboxGroupProps = Omit<
  CheckboxGroupProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldSwitchProps = Omit<
  SwitchProps,
  | 'isSelected'
  | 'defaultSelected'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldRadioProps = Omit<
  RadioGroupProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldSliderProps = Omit<
  SliderProps,
  'value' | 'defaultValue' | 'onChange' | 'isInvalid'
>
export type FieldDateFieldProps = Omit<
  DateFieldProps<DateValue>,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldTimeFieldProps = Omit<
  TimeFieldProps<TimeValue>,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>
export type FieldColorFieldProps = Omit<
  ColorFieldProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'name'
  | 'isInvalid'
  | 'validationBehavior'
>

/**
 * A labelled text control bound to one string field. Use it as `field.TextField` inside
 * `<form.AppField name="…">`.
 *
 * ```tsx
 * <field.TextField isRequired>
 *   <field.TextField.Label>First name</field.TextField.Label>
 *   <field.TextField.Input placeholder="Ada" />
 *   <field.TextField.Hint>As it should appear on the invoice</field.TextField.Hint>
 *   <field.TextField.Error />
 * </field.TextField>
 * ```
 *
 * The value is a string. `Label`, `Group`, `Input`, `Icon` and `Hint` are `TextField`'s own slots
 * unchanged; `Error` is the field-aware one, and renders the field's messages when given none.
 */
function FieldTextFieldRoot({ children, ...props }: FieldTextFieldProps) {
  const field = useFieldContext<Bound<string>>()
  return (
    <TextField
      name={field.name}
      value={field.state.value ?? ''}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </TextField>
  )
}

export const FieldTextField = Object.assign(FieldTextFieldRoot, {
  Label: TextField.Label,
  Group: TextField.Group,
  Input: TextField.Input,
  Icon: TextField.Icon,
  Hint: TextField.Hint,
  Error: fieldErrorSlot(TextField.Error),
})

/** Several lines of text bound to one string field — `TextField`'s anatomy with a control that grows. */
function FieldTextAreaRoot({ children, ...props }: FieldTextAreaProps) {
  const field = useFieldContext<Bound<string>>()
  return (
    <TextArea
      name={field.name}
      value={field.state.value ?? ''}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </TextArea>
  )
}

export const FieldTextArea = Object.assign(FieldTextAreaRoot, {
  Label: TextArea.Label,
  Input: TextArea.Input,
  Hint: TextArea.Hint,
  Error: fieldErrorSlot(TextArea.Error),
})

/**
 * A search control bound to one string field.
 *
 * `onSubmit` and `onClear` still pass through, so both halves of a search field's contract survive:
 * the value on every keystroke, and the value at the moment the user says they have finished typing.
 */
function FieldSearchFieldRoot({ children, ...props }: FieldSearchFieldProps) {
  const field = useFieldContext<Bound<string>>()
  return (
    <SearchField
      name={field.name}
      value={field.state.value ?? ''}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </SearchField>
  )
}

export const FieldSearchField = Object.assign(FieldSearchFieldRoot, {
  Label: SearchField.Label,
  Group: SearchField.Group,
  Input: SearchField.Input,
  Icon: SearchField.Icon,
  Hint: SearchField.Hint,
  Error: fieldErrorSlot(SearchField.Error),
})

/**
 * A number bound to one field, as a `number | null`.
 *
 * `null` for empty is React Aria's own answer and the honest one: a field nobody has typed in holds
 * no number, and `0` is a number somebody could have meant. It is handed to the control as `NaN`,
 * though, because `NaN` is how *React Aria* spells empty internally — it is the value its own state
 * is keyed on, its input renders blank for it, and its stepper counts from the minimum rather than
 * from zero. `null` is what `onChange` hands back for the same state, so the two meet here and
 * nowhere else.
 */
function FieldNumberFieldRoot({ children, ...props }: FieldNumberFieldProps) {
  const field = useFieldContext<Bound<number | null>>()
  return (
    <NumberField
      name={field.name}
      value={field.state.value ?? NaN}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </NumberField>
  )
}

export const FieldNumberField = Object.assign(FieldNumberFieldRoot, {
  Label: NumberField.Label,
  Group: NumberField.Group,
  Input: NumberField.Input,
  Counter: NumberField.Counter,
  Hint: NumberField.Hint,
  Error: fieldErrorSlot(NumberField.Error),
})

/**
 * One choice from a list, bound to one key field.
 *
 * Single selection only. React Aria splits a select's value in two — `selectedKey` for one choice, an
 * array-valued `value` for several — and a bound component would have to switch between them on a
 * runtime `selectionMode`, which is not a shape the props can carry. A multiple select needs
 * `useFieldContext` and a component of its own.
 *
 * Every slot of `Select` is carried over, so the whole menu — `OptionList`, `Option`, `Section`,
 * `AutoComplete` — is written exactly as it is outside a form.
 */
function FieldSelectRoot({ children, ...props }: FieldSelectProps) {
  const field = useFieldContext<Bound<Key | null>>()
  return (
    <Select
      name={field.name}
      selectedKey={field.state.value ?? null}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </Select>
  )
}

export const FieldSelect = Object.assign(FieldSelectRoot, {
  Label: Select.Label,
  Value: Select.Value,
  Button: Select.Button,
  Icon: Select.Icon,
  Popover: Select.Popover,
  AutoComplete: Select.AutoComplete,
  OptionList: Select.OptionList,
  Menu: Select.Menu,
  Option: Select.Option,
  Section: Select.Section,
  SectionTitle: Select.SectionTitle,
  Hint: Select.Hint,
  Error: fieldErrorSlot(Select.Error),
})

/**
 * One checkbox bound to one boolean field, for a single yes-or-no — a consent, a term.
 *
 * `Checkbox.value` is deliberately left alone: inside a group that prop identifies the checkbox to
 * the group, and it is not the field's value here, so a field component has no business setting it.
 * For a field that *is* a set of checkboxes, use `field.CheckboxGroup`.
 */
function FieldCheckboxRoot({ children, ...props }: FieldCheckboxProps) {
  const field = useFieldContext<Bound<boolean>>()
  return (
    <Checkbox
      name={field.name}
      isSelected={field.state.value ?? false}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </Checkbox>
  )
}

export const FieldCheckbox = Object.assign(FieldCheckboxRoot, {
  Indicator: Checkbox.Indicator,
  Text: Checkbox.Text,
  Hint: Checkbox.Hint,
  Error: fieldErrorSlot(Checkbox.Error),
})

/**
 * A set of checkboxes bound to one array-of-keys field — "which of these apply".
 *
 * The individual checkboxes are plain `Checkbox`es with `Checkbox.Indicator` and `Checkbox.Text`,
 * exactly as outside a form: the group owns the array, so only the group is a field.
 */
function FieldCheckboxGroupRoot({
  children,
  ...props
}: FieldCheckboxGroupProps) {
  const field = useFieldContext<Bound<string[]>>()
  return (
    <Checkbox.Group
      name={field.name}
      value={field.state.value ?? []}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </Checkbox.Group>
  )
}

export const FieldCheckboxGroup = Object.assign(FieldCheckboxGroupRoot, {
  Label: Checkbox.Label,
  Hint: Checkbox.Hint,
  Error: fieldErrorSlot(Checkbox.Error),
})

/**
 * A switch bound to one boolean field.
 *
 * `Switch.value` is not the field's value — it is what the control submits while it is on — so it
 * stays a prop of its own, and the field's boolean travels through `isSelected`.
 */
function FieldSwitchRoot({ children, ...props }: FieldSwitchProps) {
  const field = useFieldContext<Bound<boolean>>()
  return (
    <Switch
      name={field.name}
      isSelected={field.state.value ?? false}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </Switch>
  )
}

export const FieldSwitch = Object.assign(FieldSwitchRoot, {
  Indicator: Switch.Indicator,
  Text: Switch.Text,
  Error: fieldErrorSlot(Switch.Error),
})

/**
 * One choice from a set of radios, bound to one string field.
 *
 * **This is the group, not a single radio.** A radio carries no value of its own: it names itself to
 * the group that owns the selection, which is why React Aria requires `value` on every one of them.
 * The field here is the group's, so `field.Radio` renders `Radio.Group`, and the individual radios
 * inside it are plain `Radio`s.
 *
 * ```tsx
 * <field.Radio>
 *   <field.Radio.Label>Plan</field.Radio.Label>
 *   <Radio value="free">
 *     <Radio.Indicator />
 *     <Radio.Text>Free</Radio.Text>
 *   </Radio>
 *   <field.Radio.Error />
 * </field.Radio>
 * ```
 */
function FieldRadioRoot({ children, ...props }: FieldRadioProps) {
  const field = useFieldContext<Bound<string>>()
  return (
    <Radio.Group
      name={field.name}
      value={field.state.value ?? null}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </Radio.Group>
  )
}

export const FieldRadio = Object.assign(FieldRadioRoot, {
  Label: Radio.Label,
  Hint: Radio.Hint,
  Error: fieldErrorSlot(Radio.Error),
})

/**
 * A value chosen by dragging a handle, bound to one number-or-array field.
 *
 * **This is the one field whose invalid state React Aria does not supply.** `Slider` is not a field
 * there — `useSlider` takes no `isInvalid` — which is why `Slider.Error` is this library's rather
 * than React Aria's, and why the message is the field's own rather than a server's. Everything else
 * about the binding is the same as every other control's: `isInvalid` comes from the field's errors
 * with no "touched" gate, and `<field.Slider.Error />` renders them.
 */
function FieldSliderRoot({ children, ...props }: FieldSliderProps) {
  const field = useFieldContext<Bound<number | number[]>>()
  return (
    <Slider
      value={field.state.value}
      onChange={field.handleChange}
      isInvalid={fieldErrorMessages(field).length > 0}
      {...props}
    >
      {children}
    </Slider>
  )
}

export const FieldSlider = Object.assign(FieldSliderRoot, {
  Header: Slider.Header,
  Label: Slider.Label,
  Value: Slider.Value,
  Track: Slider.Track,
  Fill: Slider.Fill,
  Thumb: Slider.Thumb,
  Error: fieldErrorSlot(Slider.Error),
})

/** A date bound to one field, as a `DateValue | null`. */
function FieldDateFieldRoot({ children, ...props }: FieldDateFieldProps) {
  const field = useFieldContext<Bound<DateValue | null>>()
  return (
    <DateField
      name={field.name}
      value={field.state.value ?? null}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </DateField>
  )
}

export const FieldDateField = Object.assign(FieldDateFieldRoot, {
  Label: DateField.Label,
  Group: DateField.Group,
  Input: DateField.Input,
  Hint: DateField.Hint,
  Error: fieldErrorSlot(DateField.Error),
})

/** A time bound to one field, as a `TimeValue | null` — `DateField`'s sibling, bound the same way. */
function FieldTimeFieldRoot({ children, ...props }: FieldTimeFieldProps) {
  const field = useFieldContext<Bound<TimeValue | null>>()
  return (
    <TimeField
      name={field.name}
      value={field.state.value ?? null}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </TimeField>
  )
}

export const FieldTimeField = Object.assign(FieldTimeFieldRoot, {
  Label: TimeField.Label,
  Group: TimeField.Group,
  Input: TimeField.Input,
  Hint: TimeField.Hint,
  Error: fieldErrorSlot(TimeField.Error),
})

/**
 * A colour typed into a field, bound to one field holding a `Color | string | null`.
 *
 * A React Aria colour field hands back a **parsed `Color`**, not the text that produced it, and takes
 * a string straight through on the way in. Both are accepted here, so a form can keep its colours as
 * hex strings in `defaultValues` and will come back with a `Color` once the user edits one.
 * Declaring the field as `Color | string | null` is what keeps that honest.
 */
function FieldColorFieldRoot({ children, ...props }: FieldColorFieldProps) {
  const field = useFieldContext<Bound<Color | string | null>>()
  return (
    <ColorField
      name={field.name}
      value={field.state.value ?? null}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={fieldErrorMessages(field).length > 0}
      validationBehavior="aria"
      {...props}
    >
      {children}
    </ColorField>
  )
}

export const FieldColorField = Object.assign(FieldColorFieldRoot, {
  Label: ColorField.Label,
  Control: ColorField.Control,
  Swatch: ColorField.Swatch,
  Input: ColorField.Input,
  Hint: ColorField.Hint,
  Error: fieldErrorSlot(ColorField.Error),
})

/** The form element's own props, minus the two the integration supplies. */
export type FieldFormProps = Omit<
  FormProps,
  'onSubmit' | 'validationBehavior' | 'validationErrors'
>

/**
 * The `<form>`, wired to this TanStack form. Use it as `form.Form`, inside `form.AppForm`.
 *
 * It exists to remove the two lines every TanStack form has to write correctly and can quietly get
 * wrong: `onSubmit` must stop the browser's own submission before handing the values to
 * `handleSubmit`, and `validationBehavior` must be `aria` so the browser does not validate the
 * fields a second time. Both are here, once.
 *
 * `Form`'s own layout slots are attached too, so the whole form reads in one namespace:
 * `form.Form.Legend`, `form.Form.Section`, `form.Form.Actions`.
 */
function FieldFormRoot({ children, ...props }: FieldFormProps) {
  const form = useFormContext()
  return (
    <Form
      validationBehavior="aria"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      {...props}
    >
      {children}
    </Form>
  )
}

export const FieldForm = Object.assign(FieldFormRoot, {
  Legend: FormLegend,
  Section: FormSection,
  Actions: FormActions,
})

/** The submit button's own props, minus what it reads from the form. */
export type FieldSubmitProps = Omit<ButtonProps, 'type' | 'isPending'>

/**
 * The button that submits the form. Use it as `form.Submit`.
 *
 * It is a `Button` with `type="submit"` and `isPending` already bound to the form's
 * `isSubmitting`, so the spinner, the blocked presses and the live region all come from the button
 * this system already has.
 *
 * It is deliberately **not** disabled while the form is invalid. A button greyed out with no
 * explanation is the thing validation exists to avoid, and there is no form-level message element
 * for it to explain itself in — the errors belong to the fields.
 */
export function FieldSubmit({ children, ...props }: FieldSubmitProps) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" isPending={isSubmitting} {...props}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  )
}

/**
 * `useForm` with this library's fields already attached.
 *
 * Every field component above is registered by name, and the name is what a consumer writes: the
 * `field` TanStack hands to `<form.AppField>`'s children is the field API with these objects
 * assigned onto it, so `field.TextField` is `FieldTextField`. Two form-level components are
 * registered the same way — `form.Form` and `form.Submit`.
 *
 * `withForm`, `withFieldGroup`, `useTypedAppFormContext` and `extendForm` come along with it, and
 * they are why this is a hook factory rather than a component: a reusable sub-form receives its own
 * form instance, and the field components keep working inside it because they read the field from
 * context rather than from a captured form.
 */
export const {
  useAppForm,
  withForm,
  withFieldGroup,
  useTypedAppFormContext,
  extendForm,
} = createFormHook({
  fieldComponents: {
    TextField: FieldTextField,
    TextArea: FieldTextArea,
    SearchField: FieldSearchField,
    NumberField: FieldNumberField,
    Select: FieldSelect,
    Checkbox: FieldCheckbox,
    CheckboxGroup: FieldCheckboxGroup,
    Switch: FieldSwitch,
    Radio: FieldRadio,
    Slider: FieldSlider,
    DateField: FieldDateField,
    TimeField: FieldTimeField,
    ColorField: FieldColorField,
  },
  formComponents: {
    Form: FieldForm,
    Submit: FieldSubmit,
  },
  fieldContext,
  formContext,
})
