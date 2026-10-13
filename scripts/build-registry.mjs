/**
 * Generates registry.json - the source registry for this design system.
 *
 *   npm run registry        # regenerate registry.json
 *   npm run registry:build  # regenerate it and emit the served JSON under public/r
 *
 * **This file is generated, and generating it is the point.** Fifty-four components carry the same
 * token block, and most of them share a recipe module; a hand-written registry is the same staleness
 * trap as a hand-written component index. See docs/registry.md for the design, and read the
 * "Why every item carries the theme" note there before changing how the items are shaped.
 *
 * Three things it measures rather than assumes:
 *
 *   - **The token block comes out of src/styles.css.** The @theme block is parsed with PostCSS, so the
 *     registry cannot drift from the stylesheet it distributes. Nothing is retyped.
 *   - **The item graph comes out of the imports.** Each component item lists every file it
 *     transitively imports, so it installs on its own - see docs/registry.md for why that is
 *     duplication by design rather than a mistake.
 *   - **The title, one-line description and full docs come out of docs/components/<name>.md**, which is
 *     already this repository's single source of truth for what each component is.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'

const SRC = 'src/components'
const DOCS = 'docs/components'
const STYLES = 'src/styles.css'
const OUTPUT = 'registry.json'

const REGISTRY_NAME = 'pulse'
const HOMEPAGE = 'https://jimlah.github.io/design-system'
/** Where the files land in a consumer's project: @ui is their aliases.ui, pulse is ours. */
const TARGET_PREFIX = '@ui/pulse'

/** The theme item. */
const THEME_ITEM = 'theme'
/** The one item that installs the whole library. */
const BUNDLE_ITEM = 'pulse'

/** npm packages the components import, and how they are published. */
const NPM = {
  'react-aria-components': function (v) {
    return 'react-aria-components@^' + v
  },
  '@internationalized/date': function (v) {
    return '@internationalized/date@^' + v
  },
  // The TanStack Form integration in `src/components/Form/tanstack.tsx`. Without this line the
  // item installs and then cannot resolve its imports: `npmDependencies` only publishes packages
  // it finds here, and an unlisted one is dropped without a word.
  '@tanstack/react-form': function (v) {
    return '@tanstack/react-form@^' + v
  },
}
/* react is deliberately absent: every consumer already has it, and shadcn does not install peers. */

/** The primary category each component is filed under. One each, from this vocabulary. */
const CATEGORY_OF = {
  Button: 'form',
  Checkbox: 'form',
  Radio: 'form',
  Switch: 'form',
  TextField: 'form',
  TextArea: 'form',
  SearchField: 'form',
  NumberField: 'form',
  ColorField: 'form',
  DateField: 'form',
  TimeField: 'form',
  Select: 'form',
  ComboBox: 'form',
  Slider: 'form',
  Form: 'form',
  TokenField: 'form',
  DropZone: 'form',
  ColorSwatchPicker: 'form',
  TagGroup: 'form',
  ToggleButton: 'form',
  ToggleButtonGroup: 'form',
  Calendar: 'date',
  RangeCalendar: 'date',
  DatePicker: 'date',
  DateRangePicker: 'date',
  Modal: 'overlay',
  Sheet: 'overlay',
  Popover: 'overlay',
  Menu: 'overlay',
  Tooltip: 'overlay',
  Toast: 'overlay',
  OverlayArrow: 'overlay',
  Nav: 'navigation',
  Breadcrumbs: 'navigation',
  Link: 'navigation',
  Tabs: 'navigation',
  Toolbar: 'navigation',
  Table: 'data',
  GridList: 'data',
  ListBox: 'data',
  Tree: 'data',
  Virtualizer: 'data',
  Avatar: 'display',
  ColorSwatch: 'display',
  Separator: 'display',
  VisuallyHidden: 'display',
  SharedElement: 'display',
  Accordion: 'display',
  Card: 'display',
  BarChart: 'chart',
  Sparkline: 'chart',
  FlatLine: 'chart',
  DotMap: 'chart',
  ProgressBar: 'feedback',
  Meter: 'feedback',
}

/**
 * Which doc file documents which component. Two docs cover a pair of controls that share one
 * anatomy, so the map is not simply kebab(name).md.
 */
const DOC_OF = {
  Checkbox: 'checkbox-and-radio',
  Radio: 'radio',
  ProgressBar: 'progressbar-and-meter',
  Meter: 'progressbar-and-meter',
}

/**
 * One-liners that come from a doc other than the one the item ships.
 *
 * radio.md opens with an aside - "RadioButton and CheckboxButton are not components you can consume" -
 * rather than a summary of the control, so its description is taken from the shared anatomy doc it
 * belongs to instead. The item still carries radio.md as its `docs`.
 */
const DESCRIPTION_OF = { Radio: 'checkbox-and-radio' }

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Code-unit ordering, spelled out rather than left to the default so the lint rule that asks for a
 * comparator is satisfied - but deliberately *not* localeCompare, which orders by the runtime's
 * locale. This file has to come out byte-identical on a developer's machine and on CI; a locale
 * difference would show up as a registry that is "stale" the moment it is checked.
 */
function byCodeUnit(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}
function posix(p) {
  return p.split('\\').join('/')
}
function collapse(value) {
  return value.replace(/\s+/g, ' ').trim()
}

/** Every source file the registry can ship, as repo-relative posix paths. */
function sourceFiles() {
  const found = []
  const walk = function (dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = posix(join(dir, entry.name))
      if (entry.isDirectory()) walk(path)
      else if (
        /\.tsx?$/.test(entry.name) &&
        !/\.(stories|test|browser\.test)\./.test(entry.name)
      )
        found.push(path)
    }
  }
  walk(SRC)
  return found.sort(byCodeUnit)
}

/** Resolve a relative import specifier to a source file this repository ships. */
function resolveSpec(from, spec) {
  const base = posix(join(from, '..', spec))
  const candidates = [
    base + '.tsx',
    base + '.ts',
    base + '/index.tsx',
    base + '/index.ts',
    base,
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  throw new Error('Cannot resolve ' + spec + ' from ' + from)
}

/** file -> the files it imports. */
function importGraph(files) {
  const graph = new Map()
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const specs = [
      ...source.matchAll(/(?:from|import)\s*['"](\.[^'"]+)['"]/g),
    ].map(function (m) {
      return m[1]
    })
    graph.set(
      file,
      specs.map(function (spec) {
        return resolveSpec(file, spec)
      }),
    )
  }
  return graph
}

/** Every file needed to render entry, itself included. */
function closure(graph, entry) {
  const seen = new Set()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    for (const next of graph.get(file) || []) queue.push(next)
  }
  return [...seen].sort(byCodeUnit)
}

/**
 * An @theme block plus the rest of the stylesheet, straight out of src/styles.css: no token is ever
 * retyped here. The @import lines are dropped because a consumer's entry stylesheet owns its import
 * order and already imports tailwindcss itself.
 */
function readTheme() {
  const root = postcss.parse(readFileSync(STYLES, 'utf8'))

  const tokens = {}
  root.walkAtRules('theme', function (at) {
    at.walkDecls(function (decl) {
      tokens[decl.prop.replace(/^--/, '')] = collapse(decl.value)
    })
  })

  // The reset sits after the theme block. It is filed under @layer base, the same layer Tailwind's
  // own preflight uses, so a consumer's utilities still beat it.
  const base = {}
  const addRule = function (selector, decls) {
    if (!base[selector]) base[selector] = {}
    Object.assign(base[selector], decls)
  }
  for (const node of root.nodes) {
    if (node.type === 'comment') continue
    if (node.type === 'atrule') continue
    if (node.type !== 'rule') continue
    const decls = {}
    for (const child of node.nodes || []) {
      if (child.type === 'decl') decls[child.prop] = collapse(child.value)
    }
    if (Object.keys(decls).length > 0) addRule(node.selector, decls)
  }

  return { tokens: tokens, base: base }
}

/**
 * The doc's summary line: the first paragraph under its # heading, as plain text.
 *
 * The markdown is stripped rather than escaped because this lands in `description`, which every
 * registry surface renders as text - and a stray `**` from a bolded opening sentence is exactly the
 * kind of thing that shows up in `shadcn list` and nowhere else. The full markdown still travels in
 * `docs`.
 */
function describe(markdown) {
  const body = markdown.replace(/^#{1,6}[^\n]*\n+/, '').trim()
  return collapse(body.split(/\n\s*\n/)[0])
    .replace(/[*_`]/g, '')
    .replace(/[:;]\s*$/, '')
}

/**
 * The doc file for a component. Most are simply the lowercased name - the docs are named
 * `numberfield.md`, not `number-field.md` - and the rest are the pairs that share one anatomy.
 */
function docSlug(name) {
  if (DOC_OF[name]) return DOC_OF[name]
  const lower = name.toLowerCase()
  if (existsSync(join(DOCS, lower + '.md'))) return lower
  return kebab(name)
}

function readDoc(name) {
  const path = join(DOCS, docSlug(name) + '.md')
  if (!existsSync(path))
    throw new Error('No doc for ' + name + ': expected ' + path)
  return readFileSync(path, 'utf8')
}

/** name@^x.y.z for every npm package the given files import, read from what is installed here. */
function npmDependencies(files) {
  const packages = new Set()
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/from\s*['"]([^'".][^'"]*)['"]/g)) {
      const specifier = match[1]
      const name = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0]
      if (NPM[name]) packages.add(name)
    }
  }
  return [...packages].sort(byCodeUnit).map(function (name) {
    const manifest = join('node_modules', name, 'package.json')
    const version = existsSync(manifest)
      ? JSON.parse(readFileSync(manifest, 'utf8')).version
      : null
    return version ? NPM[name](version) : name
  })
}

function fileEntry(file) {
  const parts = file.split('/')
  const topLevel = parts.length === 3
  return {
    path: file,
    type: !topLevel && file.endsWith('.tsx') ? 'registry:ui' : 'registry:lib',
    target: TARGET_PREFIX + '/' + parts.slice(2).join('/'),
  }
}

/**
 * The token block every item carries, so a component installed alone still has the colours it paints.
 * Nothing here is typed out: it is src/styles.css, read at generate time.
 */
function themeFields(extraCss) {
  const theme = readTheme()
  return {
    cssVars: { theme: theme.tokens },
    css: Object.assign({}, extraCss || {}, { '@layer base': theme.base }),
  }
}

const FONT_PACKAGE = '@fontsource/overpass-mono'
/**
 * The four weights the components actually use, one import each. `@fontsource/overpass-mono`'s own
 * `index.css` carries weight 400 alone, and the sheet sets `font-synthesis: none`, so a 500 label
 * would otherwise render at 400 with no synthesis to hide it.
 *
 * The font rides on the theme item - and on the bundle, which is the same promise - rather than on
 * every component: adding a Button should not add five megabytes of font files. The family still
 * resolves to the monospace stack until the theme is installed.
 */
const FONT_IMPORTS = Object.fromEntries(
  ['400', '500', '600', '700'].map(function (weight) {
    return ['@import "' + FONT_PACKAGE + '/' + weight + '.css"', {}]
  }),
)

const THEME_DOCS = [
  'The tokens are light-dark() pairs resolved by color-scheme, never a second block of variables',
  'under a media query or a .dark class. Pulse is dark-first: :root sets color-scheme: dark, and',
  'data-theme="light" opts into the light column. Switch themes by setting color-scheme, never by',
  'redefining a token - light-dark() resolves per element, so a subtree with its own color-scheme',
  'flips on its own.',
  '',
  'This item also carries Overpass Mono, the only typeface the system uses, at the four weights the',
  'components use. A component item leaves the font out on purpose, so that adding a Button does not',
  'also add a font package; the family falls back to the monospace stack until this item is installed.',
].join('\n')

function componentItem(name, files) {
  const doc = readDoc(name)
  // Every item is filed under exactly one category. A missing one serialises as `[null]`, and
  // nothing here notices: the catalogue is written, and the failure only surfaces later, at
  // `shadcn build`, as "Expected string, received null" against a schema path that does not name
  // the component. Adding a component means adding it here too.
  const category = CATEGORY_OF[name]
  if (!category) {
    throw new Error(
      `scripts/build-registry.mjs has no CATEGORY_OF entry for ${name}. Every item is filed under one category — form, date, overlay, navigation, data, display, chart or feedback — and an item without one is rejected by the registry schema.`,
    )
  }
  return {
    name: kebab(name),
    type: 'registry:ui',
    title: name,
    description: describe(readDoc(DESCRIPTION_OF[name] ?? name)),
    categories: [category],
    dependencies: npmDependencies(files),
    ...themeFields(),
    docs: doc.replace(/^#[^\n]*\n/, '').trim(),
    files: files.map(fileEntry),
  }
}

function build() {
  const files = sourceFiles()
  const graph = importGraph(files)

  // A component is a directory with an entry file named after it. Home.tsx is the app's landing page
  // - the one page body in src/components - and is not part of the library a consumer installs.
  const names = readdirSync(SRC, { withFileTypes: true })
    .filter(function (entry) {
      return entry.isDirectory()
    })
    .map(function (entry) {
      return entry.name
    })
    .filter(function (name) {
      return existsSync(join(SRC, name, name + '.tsx'))
    })
    .sort()

  const componentFiles = names.map(function (name) {
    return closure(graph, posix(join(SRC, name, name + '.tsx')))
  })

  const theme = {
    name: THEME_ITEM,
    type: 'registry:theme',
    title: 'Pulse',
    description:
      'The Pulse design tokens - surfaces, accents, foreground and hairlines - as a Tailwind v4 ' +
      'theme, plus the reset the components are drawn against and the Overpass Mono typeface.',
    categories: ['theme'],
    dependencies: [FONT_PACKAGE],
    ...themeFields(FONT_IMPORTS),
    docs: THEME_DOCS,
  }

  const bundleFiles = [...new Set(componentFiles.flat())].sort(byCodeUnit)
  const bundle = {
    name: BUNDLE_ITEM,
    type: 'registry:block',
    title: 'Pulse - every component',
    description:
      'The whole Pulse library in one item: all ' +
      names.length +
      ' components and the theme they are drawn in.',
    categories: ['library'],
    // The bundle is the whole library, so it carries the typeface as well as the tokens.
    dependencies: npmDependencies(bundleFiles).concat([FONT_PACKAGE]),
    ...themeFields(FONT_IMPORTS),
    files: bundleFiles.map(fileEntry),
  }

  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: REGISTRY_NAME,
    homepage: HOMEPAGE,
    items: [theme, bundle].concat(
      names.map(function (name, index) {
        return componentItem(name, componentFiles[index])
      }),
    ),
  }
}

writeFileSync(OUTPUT, JSON.stringify(build(), null, 2) + '\n')
console.log('Wrote ' + OUTPUT + '.')
