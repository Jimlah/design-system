// @ts-check

/**
 * Require named children inside a component, wherever that component is used, and require the container
 * they belong in when they are used together.
 *
 * `eslint-plugin-enforce-children` cannot express any of this, for two separate reasons, and both matter:
 *
 * 1. **It only forbids.** Its message is "only these children are allowed inside <X>" — an allow-list. There
 *    is no way to say "`Radio` must contain `Radio.Indicator`", which is the constraint that actually keeps a
 *    control visible. A rule that cannot state the requirement cannot find the bug.
 * 2. **It skips member expressions.** `getTagName` returns `null` for `<Some.Child>`, and the rule returns
 *    early — so `<Radio.Indicator>` is invisible to it. Every compound in this library is a member
 *    expression, which means the plugin would report nothing while looking correctly configured.
 *
 * This rule is the inverse, and it resolves `Radio.Indicator` rather than skipping it. It has no autofix on
 * purpose: where a missing child belongs, and what it should say, are decisions the rule cannot make.
 *
 * ```js
 * 'pulse/enforce-required-children': ['error', {
 *   rules: {
 *     Radio: ['Indicator', 'Text'],
 *     Checkbox: ['Indicator', 'Text'],
 *     TextField: ['Input'],
 *   },
 *   // When *every* listed member is present, the container becomes required and they must be inside it.
 *   groups: {
 *     TextField: { container: 'Group', members: ['Input', 'Icon'] },
 *   },
 *   ignore: { Checkbox: ['src/components/Table/Table.tsx'] },
 * }]
 * ```
 *
 * **`ignore` exists so the requirement list is declared exactly once.** The obvious alternative is a second,
 * file-scoped config entry that restates the map without `Checkbox`. That works, and it is what this started
 * as, but it drifts silently: the day a third parent is added to `rules`, every such entry has to be found
 * and updated by hand, and nothing reports the ones that were missed. It is the same staleness `Home`'s
 * component index is generated to avoid. An `ignore` entry is additive, so adding a parent touches one place.
 *
 * **`groups` is keyed on *all* members being present, not any.** A `TextField` with only an `Icon`, or only
 * an `Input`, does not need a `Group` — `Input` alone is a perfectly good field, and `Icon` alone is a
 * decoration. It is the pair that needs somewhere to be positioned relative to each other, which is what the
 * `Group` is for. Demanding the container for either one alone would make the rule wrong about correct code.
 */

/** `Radio` from `<Radio>`, `Radio.Indicator` from `<Radio.Indicator>`, else null. */
function memberName(name) {
  if (!name) return null
  if (name.type === 'JSXIdentifier') return name.name
  if (name.type === 'JSXMemberExpression') {
    const object = memberName(name.object)
    const property = name.property?.name
    return object && property ? `${object}.${property}` : null
  }
  return null
}

/**
 * Every nested `JSXElement` under a node, descending through fragments, expressions and other elements, so
 * a child inside `{cond && <X.Y />}` or one level down inside a wrapper still counts.
 *
 * **This traversal has been wrong three times, every time silently.** First it walked `openingElement`,
 * which has no children, so nothing was ever found. Then the array branch recursed without pushing, so
 * direct children — which always arrive in an array — were dropped. Then elements were pushed without
 * recursing, so anything nested was dropped, and `<TextField.Input>` inside `<TextField.Group>` was invisible.
 * Each version produced confident, plausible output. The controls have to cover the nested form explicitly.
 */
function descendants(node, out = []) {
  const visit = (value) => {
    if (!value || typeof value.type !== 'string') return
    if (value.type === 'JSXElement') out.push(value)
    descendants(value, out)
  }
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue
    const value = node[key]
    if (Array.isArray(value)) value.forEach(visit)
    else visit(value)
  }
  return out
}

/**
 * A `*`/`**` glob as a regex. Ten lines instead of a dependency: `minimatch` is only present transitively
 * here, and a lint rule should not import a package the project does not declare.
 */
function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const body = escaped
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*')
  return new RegExp(`^${body}$`)
}

export const enforceRequiredChildren = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require named child components inside a component, wherever it is used.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          /** { Radio: ['Indicator', 'Text'] } — key is the parent, values are the members it must contain. */
          rules: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
          /** { TextField: { container: 'Group', members: ['Input', 'Icon'] } } — required together. */
          groups: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                container: { type: 'string' },
                members: { type: 'array', items: { type: 'string' } },
              },
              required: ['container', 'members'],
              additionalProperties: false,
            },
          },
          /** { Checkbox: ['src/components/Table/Table.tsx'] } — per-parent file exclusions, additive. */
          ignore: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing:
        '<{{parent}}> must contain <{{child}}>. React Aria renders exactly the children it is given, so a {{parent}} without one is rendered without it.',
      needsContainer:
        '<{{parent}}> renders <{{member}}> and <{{others}}> together, so it needs a <{{container}}> — that is what positions them against each other.',
      outsideContainer:
        '<{{member}}> must be inside <{{container}}>, not a sibling of it, because <{{parent}}> renders it and <{{others}}> together.',
    },
  },

  create(context) {
    const config = context.options[0] ?? {}
    const userRules = config.rules ?? {}
    const groups = config.groups ?? {}
    const ignore = config.ignore ?? {}

    // `context.filename` is the ESLint 9 property; `getFilename()` is the fallback for anything older.
    const filename = String(
      context.filename ?? context.getFilename?.() ?? '',
    ).replace(/\\/g, '/')
    const relative = filename.startsWith(process.cwd())
      ? filename.slice(process.cwd().length + 1)
      : filename

    /** Parents this file is exempt from — computed once per file, not once per element. */
    const exempt = new Set(
      Object.entries(ignore)
        .filter(([, patterns]) =>
          patterns.some((pattern) => globToRegExp(pattern).test(relative)),
        )
        .map(([parent]) => parent),
    )

    /** Parents whose component is actually imported into this file, so another library's `Radio` is left alone. */
    const imported = new Set()

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          const name = specifier.local?.name
          if (name && (userRules[name] || groups[name])) imported.add(name)
        }
      },

      JSXElement(node) {
        const parent = memberName(node.openingElement.name)
        if (!parent || !imported.has(parent)) return

        const required = userRules[parent]
        const group = groups[parent]
        if ((!required || exempt.has(parent)) && !group) return

        const children = descendants(node)
        const names = children.map((child) =>
          memberName(child.openingElement.name),
        )

        if (required && !exempt.has(parent)) {
          const found = new Set()
          for (const name of names) {
            if (name?.startsWith(`${parent}.`))
              found.add(name.slice(parent.length + 1))
          }
          for (const member of required) {
            if (!found.has(member)) {
              context.report({
                node,
                messageId: 'missing',
                data: { parent, child: `${parent}.${member}` },
              })
            }
          }
        }

        if (group && !exempt.has(parent)) {
          const { container, members } = group
          const containers = children.filter(
            (child) =>
              memberName(child.openingElement.name) ===
              `${parent}.${container}`,
          )
          // Only *all* of them together require the container.
          const present = members.filter((member) =>
            names.includes(`${parent}.${member}`),
          )
          if (present.length === members.length) {
            if (containers.length === 0) {
              context.report({
                node,
                messageId: 'needsContainer',
                data: {
                  parent,
                  container: `${parent}.${container}`,
                  member: `${parent}.${members[0]}`,
                  others: members
                    .slice(1)
                    .map((member) => `${parent}.${member}`)
                    .join(', '),
                },
              })
            } else {
              // Everything inside any container counts as inside; a direct child is normally the shape, but
              // a wrapper is not worth a false report.
              const inside = new Set(containers.flatMap((c) => descendants(c)))
              for (const [index, member] of members.entries()) {
                const element = children.find(
                  (child) =>
                    memberName(child.openingElement.name) ===
                    `${parent}.${member}`,
                )
                if (element && !inside.has(element)) {
                  context.report({
                    node: element,
                    messageId: 'outsideContainer',
                    data: {
                      parent,
                      container: `${parent}.${container}`,
                      member: `${parent}.${member}`,
                      others: members
                        .filter((_, i) => i !== index)
                        .map((other) => `${parent}.${other}`)
                        .join(', '),
                    },
                  })
                }
              }
            }
          }
        }
      },
    }
  },
}
