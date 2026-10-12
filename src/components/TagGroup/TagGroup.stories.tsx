import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'

import { TagGroup, TagGroupLabel, TagGroupList, TagItem } from './TagGroup'
import type { TagVariant } from './TagGroup'

const meta = {
  component: TagGroup,
  // The KEY is the name shown in the docs and manifest — use the compound form.
  // The VALUE must be the named export; see the same rule in Button.stories.tsx.
  subcomponents: {
    'TagGroup.Label': TagGroupLabel,
    'TagGroup.List': TagGroupList,
    'TagGroup.Tag': TagItem,
  },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    docs: {
      source: {
        code: `<TagGroup aria-label="Regions">
  <TagGroup.List>
    <TagGroup.Tag variant="teal">fra1</TagGroup.Tag>
    <TagGroup.Tag variant="outline">iad1</TagGroup.Tag>
    <TagGroup.Tag variant="outline-yellow">sfo1</TagGroup.Tag>
  </TagGroup.List>
</TagGroup>`,
      },
    },
    layout: 'centered',
  },
  args: { 'aria-label': 'Regions' },
  render: (args) => (
    <TagGroup {...args}>
      <TagGroup.List>
        <TagItem id="fra1" variant="teal">
          fra1
        </TagItem>
        <TagItem id="iad1" variant="outline">
          iad1
        </TagItem>
        <TagItem id="sfo1" variant="outline-yellow">
          sfo1
        </TagItem>
      </TagGroup.List>
    </TagGroup>
  ),
} satisfies Meta<typeof TagGroup>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS: TagVariant[] = [
  'default',
  'outline',
  'teal',
  'gray',
  'yellow',
  'outline-teal',
  'outline-yellow',
]

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const tags = [...canvasElement.querySelectorAll('[data-rac]')].filter(
      (el) => el.textContent.match(/^(fra1|iad1|sfo1)$/),
    )
    await expect(tags).toHaveLength(3)

    // The sheet's `.ds-tag`, measured rather than trusted.
    const style = getComputedStyle(tags[0])
    await expect(style.fontSize).toBe('12px')
    await expect(style.textTransform).toBe('uppercase')
    await expect(style.letterSpacing).toBe('-0.12px')
    await expect(style.paddingTop).toBe('4px')
    await expect(style.paddingInlineStart).toBe('10px')
    await expect(style.borderTopLeftRadius).toBe('0px')

    // A fill carries `ink`: black on the luminous dark-theme accents, white on the deep light-theme
    // ones. The token inverts, so this is never hardcoded.
    await expect(style.color).toBe('oklch(0 0 none)')
  },
}

export const Variants: Story = {
  render: () => (
    <TagGroup aria-label="Every chip">
      <TagGroup.List>
        {VARIANTS.map((variant) => (
          <TagItem key={variant} variant={variant}>
            {variant}
          </TagItem>
        ))}
      </TagGroup.List>
    </TagGroup>
  ),
  // Seven treatments, and every one of them the same box: the sheet declares a transparent 1px edge
  // on the base so a filled chip and an outlined one are the same size. Without it, adding a
  // variant reflows the group.
  play: async ({ canvasElement }) => {
    const tags = [...canvasElement.querySelectorAll('[data-rac]')].filter(
      (el) => VARIANTS.includes(el.textContent as TagVariant),
    )
    await expect(tags).toHaveLength(7)

    // The heights, not the widths: the labels are different lengths, and the claim is that the
    // *box* is the same however the chip is filled — which is what a transparent edge buys.
    const heights = tags.map((t) =>
      Math.round(t.getBoundingClientRect().height),
    )
    await expect(new Set(heights).size).toBe(1)
    const paddings = tags.map((t) => getComputedStyle(t).paddingTop)
    await expect(new Set(paddings).size).toBe(1)

    // The filled ones carry ink; the outlined ones carry their own accent and a transparent fill.
    const [plain, outline, teal, , yellow] = tags.map((t) =>
      getComputedStyle(t),
    )
    await expect(plain.borderTopColor).toBe('rgba(0, 0, 0, 0)')
    await expect(outline.borderTopColor).toBe('oklch(1 0 none / 0.45)')
    await expect(teal.backgroundColor).toBe('oklch(0.9198 0.1236 189.5)')
    await expect(yellow.backgroundColor).toBe('oklch(0.8733 0.1505 91.2)')
    await expect(teal.color).toBe('oklch(0 0 none)')
  },
}

export const Selectable: Story = {
  args: { selectionMode: 'multiple', defaultSelectedKeys: ['fra1'] },
  // With `selectionMode` the chips are chosen rather than decorative. React Aria reports that as
  // `data-selected`, and the group is a toolbar of toggles with a roving focus — not a row of Tab
  // stops.
  play: async ({ canvasElement }) => {
    const tag = [...canvasElement.querySelectorAll('[data-rac]')].find(
      (el) => el.textContent === 'fra1',
    ) as HTMLElement
    await expect(tag).toHaveAttribute('data-selected')

    await userEvent.click(tag)
    await expect(tag).not.toHaveAttribute('data-selected')
    await userEvent.click(tag)
    await expect(tag).toHaveAttribute('data-selected')
  },
}

export const Links: Story = {
  render: () => (
    <TagGroup aria-label="Monitors">
      <TagGroup.List>
        <TagItem variant="outline" href="#fra1" textValue="fra1">
          fra1
        </TagItem>
        <TagItem variant="outline" href="#iad1" textValue="iad1">
          iad1
        </TagItem>
      </TagGroup.List>
    </TagGroup>
  ),
  // The sheet uses its tags as link-chips too — `a.ds-tag:hover` is in the stylesheet — and React
  // Aria makes that a link from the props rather than a second component.
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link')
    await expect(links).toHaveLength(2)
    await expect(links[0]).toHaveAttribute('href', '#fra1')
    // ...and it is still a chip: the same 12px uppercase face as a value tag.
    await expect(getComputedStyle(links[0]).fontSize).toBe('12px')
  },
}

/**
 * **Removal is the consumer's job, and this story used to pretend otherwise.** React Aria's `onRemove`
 * *reports* which keys the user asked to remove — it does not remove anything, because the group does not
 * own the collection. A no-op handler is therefore a control that does nothing when pressed, which is
 * exactly what this story shipped: two working remove buttons attached to nothing.
 *
 * The pattern to copy is here: hold the keys in state, and drop the removed ones.
 */
function RemovableTags(args: Story['args']) {
  const [keys, setKeys] = useState(['fra1', 'iad1'])
  return (
    <TagGroup
      {...args}
      onRemove={(removed) =>
        setKeys((current) => current.filter((key) => !removed.has(key)))
      }
    >
      <TagGroup.List>
        {keys.map((key) => (
          <TagItem key={key} id={key}>
            {key}
          </TagItem>
        ))}
      </TagGroup.List>
    </TagGroup>
  )
}

export const Removable: Story = {
  render: (args) => <RemovableTags {...args} />,
  // `onRemove` is what puts a remove button in each chip, and React Aria names it from the tag's own
  // text — so a screen reader hears "Remove fra1" rather than a row of anonymous buttons.
  play: async ({ canvas }) => {
    const remove = canvas.getAllByRole('button', { name: /remove/i })
    await expect(remove).toHaveLength(2)
    await expect(remove[0]).toHaveAccessibleName(/fra1/i)

    // **And pressing it has to actually remove the tag.** This is the assertion the story was missing:
    // it counted the buttons and checked their names, so a handler that did nothing passed — and the tag
    // stayed on screen, which is what a reader reported. A remove control is only proven by the thing
    // being gone.
    await userEvent.click(remove[0])
    await expect(
      canvas.queryAllByRole('button', { name: /remove/i }),
    ).toHaveLength(1)
    await expect(canvas.queryByText('fra1')).not.toBeInTheDocument()
    await expect(canvas.getByText('iad1')).toBeInTheDocument()
  },
}

// There is no Hover story, and this is the third time that has been worth saying. React Aria's
// `Tag` provides no `data-hovered` — a real pointer hover leaves the attribute off — so the chip's
// hover is the browser's own `:hover`, which is the correct styling and is not reproducible from the
// test runner. A story asserting the colour changed failed; a story asserting nothing would be worse
// than no story. The same conclusion as the tooltip's hover and the sidebar's tab order.

export const Disabled: Story = {
  args: { disabledKeys: ['iad1'] },
  // `selectedKeys` and `disabledKeys` speak in the tags' `id`s, exactly as `Table.Row` and
  // `Accordion.Item` do. Without one, React Aria generates a key and `['iad1']` matches nothing —
  // the story renders, every chip is enabled, and the assertion fails on a missing attribute.
  // A chip that cannot be chosen still reads as a chip: it dims without recolouring, so a disabled
  // yellow tag is still recognisably the yellow one.
  play: async ({ canvasElement }) => {
    const tag = [...canvasElement.querySelectorAll('[data-rac]')].find(
      (el) => el.textContent === 'iad1',
    ) as HTMLElement
    await expect(tag).toHaveAttribute('data-disabled')
    await expect(getComputedStyle(tag).opacity).toBe('0.4')
    // ...and it keeps its own colour underneath, rather than flattening to grey.
    await expect(getComputedStyle(tag).textTransform).toBe('uppercase')
  },
}
