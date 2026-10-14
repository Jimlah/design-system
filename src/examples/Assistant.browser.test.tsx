import userEvent from '@testing-library/user-event'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { fakeText } from '@tanstack/ai/testing'
import { fetchServerSentEvents, stream } from '@tanstack/ai-react'
import { beforeEach, expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'

import { Assistant } from './Assistant'
import {
  CONVERSATION_KEY,
  GATEWAY_KEY,
  scriptedConnection,
} from './assistantGateway'
import { VIEW_IDS, figuresFor } from './assistantTool'
import { LEADS, VIEWS, visibleLeads } from './leads'

/**
 * The assistant page, asserted in the components project rather than through a story — it is an
 * example, and a story would publish a page as part of the library's API.
 *
 * **One test here is about the wire and the rest are about behaviour**, which is the split that keeps
 * the suite honest: the page takes a `connection` for the behaviour tests, so nothing but the last
 * test touches `fetch`, and that one test is the only place the server-sent-events path is proven.
 */

const TODAY = '2026-10-12'

beforeEach(() => {
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

/**
 * A scripted transport that pauses before its answer.
 *
 * The wait is the state under test — a pending card and a Stop button live exactly in the gap before
 * the first token — so it is a delay rather than a slow stream: pacing the tokens makes the window a
 * race against the runner, and a promise held open cannot be raced past. It is generous because a
 * full-suite run starves the page, and a window that closes before the first assertion reads as a
 * missing state rather than a slow one.
 */
function slowConnection(text: string) {
  const fake = fakeText({ model: 'test' })
  return stream(async function* (messages) {
    await new Promise((resolve) => setTimeout(resolve, 2500))
    fake.setResponses([{ text }])
    yield* chat({ adapter: fake, messages })
  })
}

test('offers the model every view the leads module declares, and no view it does not', () => {
  // The list is hand-kept next to the schema, which is the one place a view could go missing
  // silently — so this compares it against the module the views actually live in.
  expect([...VIEW_IDS].sort()).toEqual(VIEWS.map((view) => view.id).sort())
})

test('counts the same rows the leads table would draw', () => {
  const figures = figuresFor('hot')
  const rows = visibleLeads(LEADS, 'hot', '', TODAY)

  expect(figures.total).toBe(rows.length)
  // Every row is in exactly one status, so the bars add up to the total or one of them is wrong.
  expect(figures.values.reduce((sum, value) => sum + value, 0)).toBe(
    rows.length,
  )
  // The accent bar is the tallest one, which is what the drawing claims by highlighting it.
  expect(figures.values[figures.highlightIndex]).toBe(
    Math.max(...figures.values),
  )
  expect(figuresFor('all').total).toBe(LEADS.length)
})

test('opens on the welcome panel, and a suggested prompt draws the tool result as a card', async () => {
  const screen = await render(<Assistant connection={scriptedConnection()} />)

  const suggestion = screen.getByRole('button', {
    name: 'How many hot leads are there?',
  })
  await expect.element(suggestion).toBeVisible()
  await suggestion.click()

  await vi.waitFor(
    () => {
      expect(
        document.querySelector('[data-slot="assistant-figures"]'),
      ).not.toBeNull()
    },
    { timeout: 15000 },
  )

  // The card is the tool's own output, computed here from leads.ts — not prose the model wrote.
  const figures = figuresFor('hot')
  await expect.element(screen.getByText(figures.title)).toBeVisible()
  await expect
    .element(
      screen.getByText(figures.total + ' leads in this view', { exact: false }),
    )
    .toBeVisible()
  expect(document.querySelector('[data-slot="bar-chart"]')).not.toBeNull()
  expect(document.querySelector('[data-slot="tag-group"]')).not.toBeNull()
})

test('shows the assistant working, and swaps Send for Stop until the answer lands', async () => {
  const answer =
    'A deliberately slow answer, so that the working state is observable rather than raced past.'
  const screen = await render(<Assistant connection={slowConnection(answer)} />)

  await screen.getByLabelText('Message').fill('What can you do?')
  await screen.getByRole('button', { name: 'Send' }).click()

  // The placeholder is the gap before the first token, which is the distinction isLoading alone hides.
  await vi.waitFor(
    () => {
      expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    },
    { timeout: 15000 },
  )
  await expect
    .element(screen.getByRole('button', { name: 'Stop' }))
    .toBeVisible()

  await vi.waitFor(
    () => {
      expect(
        screen.getByRole('button', { name: 'Send' }).query(),
      ).not.toBeNull()
    },
    { timeout: 30000 },
  )
  await expect.element(screen.getByText(answer, { exact: false })).toBeVisible()
})

test('sends on Enter, and starts a new line on Shift+Enter', async () => {
  const screen = await render(<Assistant connection={scriptedConnection()} />)
  const box = screen.getByLabelText('Message')

  await box.fill('What can you do?')
  await userEvent.keyboard('{Shift>}{Enter}{/Shift}')

  // The field is a real multiline control, so Shift+Enter is a newline and nothing has been sent.
  expect((box.element() as HTMLTextAreaElement).value).toBe(
    'What can you do?\n',
  )
  expect(
    document.querySelectorAll('[data-slot="assistant-question"]'),
  ).toHaveLength(0)

  await userEvent.keyboard('{Enter}')
  await vi.waitFor(
    () => {
      expect(
        document.querySelectorAll('[data-slot="assistant-question"]'),
      ).toHaveLength(1)
    },
    { timeout: 15000 },
  )
})

test('keeps the key in this browser only when the switch asks it to', async () => {
  // A gateway that answers its model list. Everything else about the request is out of scope here:
  // this test is about what the panel stores, not about what the model says.
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [{ id: 'gpt-4o-mini' }, { id: 'gpt-4o' }, { id: 'o4-mini' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    ),
  )

  const screen = await render(<Assistant connection={scriptedConnection()} />)
  await screen.getByRole('button', { name: 'Gateway' }).click()
  await expect.element(screen.getByRole('dialog')).toBeVisible()

  await screen.getByRole('button', { name: 'Test and use' }).click()
  await vi.waitFor(
    () => {
      expect(
        document.querySelector('[data-slot="gateway-status"]')?.textContent,
      ).toContain('Reachable')
    },
    { timeout: 15000 },
  )

  // **The models the endpoint listed are what the panel offers.** The same request that proves the
  // address answers is the one that fills the chooser, so a gateway is never a guessing game about
  // model ids — and an endpoint that lists nothing still gets the field to type into.
  // Matched as a substring on purpose: React Aria names the trigger from the label element, and that
  // element contains the hidden native select — so the name is the label plus every option and the
  // chosen value, never the word on its own.
  const chooser = screen.getByRole('button', { name: /Model/ })
  await expect.element(chooser).toBeVisible()
  await chooser.click()

  // **And it is searchable, because a real gateway lists dozens.** The filter lives in the scope the
  // select wraps around itself rather than in this page, so what is asserted is that a typed prefix
  // narrows the list instead of merely scrolling it.
  await screen.getByPlaceholder('Filter models…').fill('o4')
  const narrowed = screen.getByRole('option', { name: 'o4-mini' })
  await expect.element(narrowed).toBeVisible()
  await vi.waitFor(
    () => {
      expect(
        screen.getByRole('option', { name: 'gpt-4o-mini' }).query(),
      ).toBeNull()
    },
    { timeout: 15000 },
  )
  await narrowed.click()
  await vi.waitFor(
    () => {
      expect(chooser.element().textContent).toContain('o4-mini')
    },
    { timeout: 15000 },
  )

  // Remember is off, so the key is not written — not even the parts of it that are not the key.
  expect(window.localStorage.getItem(GATEWAY_KEY)).toBeNull()

  // The label is the control root — React Aria hides the input it owns — so this is the click a
  // reader makes, and the same move Login's test makes for its checkbox.
  await screen.getByText('Remember on this device').click()
  await screen.getByRole('button', { name: 'Test and use' }).click()

  await vi.waitFor(
    () => {
      expect(window.localStorage.getItem(GATEWAY_KEY)).not.toBeNull()
    },
    { timeout: 15000 },
  )
  const remembered = JSON.parse(
    window.localStorage.getItem(GATEWAY_KEY) ?? '{}',
  ) as { remember?: boolean; model?: string }
  expect(remembered.remember).toBe(true)
  // The model chosen from the endpoint's own list is the one that is kept.
  expect(remembered.model).toBe('o4-mini')
})

test('lists a preset\u2019s models as soon as it is chosen, without testing the connection first', async () => {
  // What an Ollama server on this machine answers: no key needed, models listed to anyone on it.
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ data: [{ id: 'qwen2.5:7b' }, { id: 'mistral' }] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    ),
  )

  const screen = await render(<Assistant connection={scriptedConnection()} />)
  await screen.getByRole('button', { name: 'Gateway' }).click()
  await expect.element(screen.getByRole('dialog')).toBeVisible()

  // No key and no test: choosing the endpoint is enough for its models to arrive.
  await screen.getByRole('button', { name: /Preset/ }).click()
  await screen.getByRole('option', { name: 'Ollama on this machine' }).click()

  const chooser = screen.getByRole('button', { name: /Model/ })
  await chooser.click()
  await vi.waitFor(
    () => {
      expect(
        screen.getByRole('option', { name: 'mistral' }).query(),
      ).not.toBeNull()
    },
    { timeout: 15000 },
  )

  // And it was the address the preset filled in that answered.
  expect(
    (screen.getByLabelText('Base URL').element() as HTMLInputElement).value,
  ).toBe('http://localhost:11434/v1')
})

test('parses the server-sent events the SDK writes, so the server transport is proven end to end', async () => {
  // The stream is produced by the library's own `toServerSentEventsResponse` and read back by its own
  // `fetchServerSentEvents`, which is the only assertion in this file about the wire — the joint that
  // nothing else would be checking.
  const fake = fakeText({ model: 'test' })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      fake.setResponses([{ text: 'Answered over server-sent events.' }])
      return toServerSentEventsResponse(chat({ adapter: fake, messages: [] }))
    }),
  )

  const screen = await render(
    <Assistant connection={fetchServerSentEvents('/api/chat')} />,
  )
  await screen.getByLabelText('Message').fill('Hello')
  await screen.getByRole('button', { name: 'Send' }).click()

  await vi.waitFor(
    () => {
      expect(document.body.textContent).toContain(
        'Answered over server-sent events.',
      )
    },
    { timeout: 15000 },
  )
})

test('restores the conversation from storage, and Clear empties it there too', async () => {
  window.localStorage.setItem(
    CONVERSATION_KEY,
    JSON.stringify([
      {
        id: 'seed-1',
        role: 'user',
        parts: [{ type: 'text', content: 'Stored question' }],
      },
      {
        id: 'seed-2',
        role: 'assistant',
        parts: [{ type: 'text', content: 'Stored answer' }],
      },
    ]),
  )

  const screen = await render(<Assistant connection={scriptedConnection()} />)
  await expect.element(screen.getByText('Stored question')).toBeVisible()
  await expect.element(screen.getByText('Stored answer')).toBeVisible()

  await screen.getByRole('button', { name: 'Clear' }).click()
  await vi.waitFor(
    () => {
      expect(window.localStorage.getItem(CONVERSATION_KEY)).toBeNull()
    },
    { timeout: 15000 },
  )
  await expect
    .element(
      screen.getByRole('button', { name: 'How many hot leads are there?' }),
    )
    .toBeVisible()
})
