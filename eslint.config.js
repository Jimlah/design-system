//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

// A local rule rather than a dependency. `eslint-plugin-enforce-children` cannot express this: it only
// forbids (an allow-list, "nothing but these"), and `getTagName` returns null for member expressions, so
// `<Radio.Indicator>` is invisible to it — and every compound in this library is a member expression.
import { enforceRequiredChildren } from './eslint-rules/enforce-required-children.js'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      // Build output — not source. Never lint compiled bundles.
      // The local lint rules are lint configuration, not app source: they are not part of any tsconfig, so
      // the typed-lint project service reports "file was not found in any of the provided project(s)".
      // `// @ts-check` at the top of each gives them editor type checking instead.
      'eslint-rules/**',
      'storybook-static/**',
      'dist/**',
      '.tanstack/**',
    ],
  },
  {
    // `Radio` renders exactly the children it is given — React Aria supplies no default dot — so a `Radio`
    // without an `Indicator` is a label with no visible control. This is the rule that says so at the point
    // of use, which is the one place it can be caught: the component's own source has no `<Radio>` in it.
    //
    // **The requirement list is declared once, and `ignore` is the exception list.** A file that is exempt
    // from one parent is named here rather than in a second config entry that restates the map — that entry
    // would go stale the day a third parent is added, silently. `ignore` is additive, so adding a parent
    // touches this object and nothing else.
    //
    // `Table.Selection` is the one exception: it renders `<Checkbox slot="selection">` with an `Indicator` and
    // deliberately no `Text`, because the row it sits in is its label and React Aria creates and drives that
    // checkbox through the slot. It is a `Checkbox` exception, not a `Table` one — the `Radio` requirement
    // still applies in that file.
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      pulse: {
        rules: { 'enforce-required-children': enforceRequiredChildren },
      },
    },
    rules: {
      'pulse/enforce-required-children': [
        'error',
        {
          rules: {
            Radio: ['Indicator', 'Text'],
            Checkbox: ['Indicator', 'Text'],
            // A `TextField` renders exactly the children it is given too, so without its `Input` there is
            // no field to type in — it is a label and a hint with nothing between them.
            TextField: ['Input'],
            // **A `NumberField` is never a bare input.** The `Counter` is the stepper and this system always
            // renders it, so both are required — which also makes the `Group` unconditional for every
            // `NumberField`, because `groups` fires whenever both members are present and they always are.
            NumberField: ['Input', 'Counter'],
            // A `SearchField` is never a bare label either. Its `Icon` stays optional — an icon with no
            // input is a decoration, and the `Group` is only required for the pair.
            SearchField: ['Input'],
            // A `DatePicker` is the input and the calendar trigger, always both — a picker without its
            // `Button` cannot open a calendar, which is the whole component.
            DatePicker: ['Input', 'Button'],
            // The same pair, and the same reason: a range picker without its `Button` cannot open a calendar.
            DateRangePicker: ['Input', 'Button'],
          },
          ignore: {
            Checkbox: ['src/components/Table/Table.tsx'],
          },
          // **The `Group` is required only when `Input` *and* `Icon` are both rendered**, and then both must
          // be inside it. Either one alone is fine on its own — `Input` alone is a good field, `Icon` alone is
          // a decoration — and it is the pair that needs somewhere to be positioned relative to each other.
          groups: {
            TextField: { container: 'Group', members: ['Input', 'Icon'] },
            // `SearchField` has the same pair. `NumberField` has no `Icon` slot — its second member is the
            // `Counter`, the stepper — so the container argument is the same and the member is not.
            SearchField: { container: 'Group', members: ['Input', 'Icon'] },
            NumberField: { container: 'Group', members: ['Input', 'Counter'] },
            DatePicker: { container: 'Group', members: ['Input', 'Button'] },
            DateRangePicker: {
              container: 'Group',
              members: ['Input', 'Button'],
            },
          },
        },
      ],
    },
  },
]
