import { chat } from '@tanstack/ai'
import { fakeText } from '@tanstack/ai/testing'
import { fetchServerSentEvents, stream } from '@tanstack/ai-react'
import type { ConnectionAdapter, UIMessage } from '@tanstack/ai-react'
import type { FakeResponseStep } from '@tanstack/ai/testing'

import type { ViewId } from './leads'

import { leadFigures } from './assistantTool'

/**
 * Where an assistant request goes, and how the page decides between three answers.
 *
 * **Three transports, in the order the page prefers them**, and the order is the whole design:
 *
 * 1. `gateway` — the browser talks to the endpoint the reader configured, with the reader's own key.
 *    This is the only path that produces real model output, and it is chosen **only after a probe of
 *    that endpoint has succeeded from this browser**, because it is not a documented TanStack AI shape:
 *    the library's own BYOK support is a relay that puts the key on a header for *your* server, and
 *    `stream()`/`rpcStream()` do not carry those headers at all. A static deploy has no server to
 *    relay through, so the page either reaches the gateway directly or does not reach one.
 * 2. `server` — the dev server route at `/api/chat`, which is the documented shape and the only
 *    one whose key never touches the browser. It exists under `npm run dev`, and its key comes from
 *    the environment; the page probes it with a `GET` and prefers it over the script when it answers.
 * 3. `scripted` — `fakeText()` from `@tanstack/ai/testing`, streamed through the same
 *    `useChat` and the same tool as the real thing. **This is what a visitor to the deployed page
 *    gets**, and it is a first-class transport rather than a mock: no network, no key, and the tool
 *    still fires and still draws its card.
 *
 * The alternative — making the deployed page depend on the browser-direct path — means the site's most
 * visible example breaks the day a provider changes a response header. Hence the probe.
 */

/** Where the gateway settings live. Only written when the reader asks for them to be remembered. */
export const GATEWAY_KEY = 'pulse-assistant-gateway'
/** Where the conversation lives, the way `board.ts` keeps the task board. */
export const CONVERSATION_KEY = 'pulse-assistant-conversation'

export interface GatewayPreset {
  id: string
  label: string
  baseUrl: string
  model: string
  /** Whether the endpoint is expected to need a key. Ollama on this machine does not. */
  needsKey: boolean
}

/**
 * The presets, and the reason one adapter covers all of them: every one of these speaks the
 * OpenAI-compatible chat-completions shape, so a preset only fills in a Base URL and a model — the
 * free-text Base URL beside them is what makes the list a shortcut rather than a menu.
 */
export const GATEWAY_PRESETS: GatewayPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    needsKey: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    needsKey: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    needsKey: true,
  },
  {
    id: 'ollama',
    label: 'Ollama on this machine',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    needsKey: false,
  },
]

/** The preset id that means "the reader typed their own Base URL". */
export const CUSTOM_PRESET = 'custom'

/** The model option that means "type one the endpoint did not list". */
export const CUSTOM_MODEL = '__custom__'

export interface GatewaySettings {
  preset: string
  baseUrl: string
  model: string
  apiKey: string
  /** Whether the key is written to this browser's storage. Off unless the reader turns it on. */
  remember: boolean
}

export const DEFAULT_GATEWAY: GatewaySettings = {
  preset: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
  remember: false,
}

/** Which transport the page is speaking over, which is what the panel's mode readout names. */
export type AssistantMode = 'scripted' | 'gateway' | 'server'

/* ---------------------------------------------------------------------------
   Storage

   Both readers are corrupt-safe and both writers swallow storage errors, following board.ts: a
   browser in private mode throws on `localStorage` access rather than returning null, and a page
   that cannot remember a conversation must still hold one.
   ------------------------------------------------------------------------ */

function stored(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Nothing to do and nothing to say: the setting simply does not survive the visit.
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/** The remembered settings, or null when there are none — or when what is there is not one. */
export function readGateway(): GatewaySettings | null {
  const raw = stored(GATEWAY_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>
    return {
      preset: text(record.preset, DEFAULT_GATEWAY.preset),
      baseUrl: text(record.baseUrl, DEFAULT_GATEWAY.baseUrl),
      model: text(record.model, DEFAULT_GATEWAY.model),
      apiKey: text(record.apiKey, ''),
      remember: record.remember === true,
    }
  } catch {
    return null
  }
}

/**
 * Remember the settings, or forget them entirely.
 *
 * **`remember` decides whether the key is written, not whether the settings are.** A key typed into a
 * public page and silently kept is the one outcome this panel must not produce, so an unremembered
 * gateway leaves nothing behind at all rather than leaving everything but the key.
 */
export function writeGateway(settings: GatewaySettings) {
  store(GATEWAY_KEY, settings.remember ? JSON.stringify(settings) : null)
}

/** The conversation, as far as it can be trusted back out of storage. */
export function readConversation(): UIMessage[] {
  const raw = stored(CONVERSATION_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((message): message is UIMessage => {
      if (!message || typeof message !== 'object') return false
      const record = message as Partial<UIMessage>
      return (
        typeof record.id === 'string' &&
        typeof record.role === 'string' &&
        Array.isArray(record.parts)
      )
    })
  } catch {
    return []
  }
}

export function writeConversation(messages: UIMessage[]) {
  store(CONVERSATION_KEY, messages.length ? JSON.stringify(messages) : null)
}

/* ---------------------------------------------------------------------------
   Probes
   ------------------------------------------------------------------------ */

export interface GatewayProbe {
  ok: boolean
  message: string
  /**
   * What the endpoint says it serves, in the order it said it.
   *
   * Empty is a real answer: a gateway that exposes no model list is still reachable and still usable,
   * it just cannot be chosen from.
   */
  models: string[]
}

const PROBE_TIMEOUT_MS = 5000

/**
 * Can **this browser** reach the configured endpoint?
 *
 * That question — rather than "is the endpoint up" — is the one the gateway mode depends on: the request
 * is made from the page, so CORS decides it as much as the address does. `/models` is the cheapest
 * authenticated GET every one of these providers answers.
 *
 * **The same call is what lists the models**, and that is why the panel can offer a chooser instead of
 * asking for an id: one request answers "does it answer" and "what does it serve" together, with no
 * second endpoint to get wrong.
 */
/** What one `/models` request can tell us: whether it answered, and what it listed. */
interface ModelAnswer {
  ok: boolean
  /** The status, when the endpoint answered with something other than 200. */
  status?: number
  /** True when nothing answered at all. */
  unreachable?: boolean
  timedOut?: boolean
  models: string[]
}

/**
 * One request, two questions.
 *
 * `/models` is the cheapest authenticated GET every one of these providers answers, and its answer is
 * both the connection verdict and the model list — which is why this is shared rather than written
 * twice: the panel's chooser and its "can I reach this" readout come from the same call.
 */
async function requestModels(settings: GatewaySettings): Promise<ModelAnswer> {
  const base = settings.baseUrl.trim().replace(/\/+$/, '')
  if (!base) return { ok: false, models: [] }
  try {
    const response = await fetch(base + '/models', {
      headers: settings.apiKey
        ? { authorization: 'Bearer ' + settings.apiKey }
        : undefined,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    if (!response.ok) {
      return { ok: false, status: response.status, models: [] }
    }
    const body: unknown = await response.json().catch(() => null)
    return { ok: true, models: modelIds(body) }
  } catch (error) {
    return {
      ok: false,
      unreachable: true,
      timedOut: error instanceof Error && error.name === 'TimeoutError',
      models: [],
    }
  }
}

/**
 * Can **this browser** reach the configured endpoint?
 *
 * That question — rather than "is the endpoint up" — is the one the gateway mode depends on: the
 * request is made from the page, so CORS decides it as much as the address does.
 */
export async function testGateway(
  settings: GatewaySettings,
): Promise<GatewayProbe> {
  if (!settings.baseUrl.trim()) {
    return { ok: false, message: 'Enter a base URL.', models: [] }
  }
  if (!settings.model.trim()) {
    return { ok: false, message: 'Enter a model.', models: [] }
  }
  const answer = await requestModels(settings)
  if (answer.ok) {
    return {
      ok: true,
      models: answer.models,
      message: answer.models.length
        ? 'Reachable · ' + answer.models.length + ' models'
        : 'Reachable, but it lists no models — type an id instead.',
    }
  }
  if (answer.status !== undefined) {
    return {
      ok: false,
      models: [],
      message:
        'That address answered ' +
        answer.status +
        '. The key may be missing or wrong, or the endpoint may not list models.',
    }
  }
  return {
    ok: false,
    models: [],
    message: answer.timedOut
      ? 'No answer within ' + PROBE_TIMEOUT_MS / 1000 + ' seconds.'
      : 'This browser could not reach that address. The address and its CORS headers are both possible causes.',
  }
}

/**
 * The endpoint's model list on its own, for the panel's background refresh.
 *
 * **A second entry point exists because choosing a preset should fill the chooser immediately.** An
 * Ollama server needs no key and lists its models to anyone on the machine, so making the reader press
 * "Test and use" first — which also switches where their requests go — would be asking for agreement
 * to a question they only wanted to look at.
 */
export async function listModels(settings: GatewaySettings): Promise<string[]> {
  return (await requestModels(settings)).models
}

/**
 * The model ids a /models answer carries, as far as they can be trusted.
 *
 * The OpenAI-shaped answer is an object with a data array of objects carrying an id, which is what
 * Ollama, Groq, OpenRouter and the rest all imitate — but nothing guarantees the shape, so anything
 * that is not a non-empty string is dropped rather than rendered as an option.
 */
function modelIds(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const data = (body as { data?: unknown }).data
  if (!Array.isArray(data)) return []
  return data
    .map((entry) =>
      entry && typeof entry === 'object'
        ? (entry as { id?: unknown }).id
        : undefined,
    )
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export interface ServerRoute {
  url: string
  /** Whether the route has a key in its environment. A route without one cannot answer. */
  configured: boolean
}

/**
 * Is the dev server route there?
 *
 * The answer has to be a *shape* and not a status code: a static host answers an unknown path with its
 * own 404 page and could plausibly answer with a 200 that is HTML, so the probe insists on the marker
 * the route's own GET writes.
 */
export async function probeServerRoute(): Promise<ServerRoute | null> {
  const url = import.meta.env.BASE_URL + 'api/chat'
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) return null
    const body: unknown = await response.json().catch(() => null)
    if (!body || typeof body !== 'object') return null
    const record = body as { route?: unknown; configured?: unknown }
    if (record.route !== 'pulse-assistant') return null
    return { url, configured: record.configured === true }
  } catch {
    return null
  }
}

/* ---------------------------------------------------------------------------
   The transports
   ------------------------------------------------------------------------ */

export const SYSTEM_PROMPT =
  'You are the assistant on a design-system example page. You can show pipeline figures with the show_lead_figures tool: call it whenever the reader asks about leads, counts or a breakdown of the pipeline, then describe the figures in one short sentence. Keep answers brief and concrete.'

/** How many answers one run is armed with. A tool call plus its follow-up is two; the loop allows five. */
const ANSWERS_PER_RUN = 6

/** What the scripted model treats as a request for the figures. */
const ASKS_FOR_FIGURES =
  /\b(figure|figures|pipeline|breakdown|how many|count|counts|numbers|status|statuses|leads)\b/i

/** The scripted model's reading of a prompt: the first view it names, or every lead. */
export function viewFrom(prompt: string): ViewId {
  // Named for what it is rather than for its type: there is a module-level `text` helper below, and
  // shadowing it here is a warning this repo keeps on.
  const asked = prompt.toLowerCase()
  if (asked.includes('overdue')) return 'overdue'
  if (asked.includes('favourite') || asked.includes('favorite'))
    return 'favourite'
  if (asked.includes('assigned') || asked.includes('mine')) return 'assigned'
  if (asked.includes('new')) return 'new'
  if (asked.includes('hot')) return 'hot'
  return 'all'
}

/** The text of one wire message, whichever of the shapes it arrived in. */
function messageText(message: unknown): string {
  if (!message || typeof message !== 'object') return ''
  const record = message as { content?: unknown; parts?: unknown }
  if (typeof record.content === 'string') return record.content
  const chunks = Array.isArray(record.parts)
    ? record.parts
    : Array.isArray(record.content)
      ? record.content
      : []
  return chunks
    .map((chunk) => {
      if (!chunk || typeof chunk !== 'object') return ''
      const part = chunk as { text?: unknown; content?: unknown }
      if (typeof part.text === 'string') return part.text
      if (typeof part.content === 'string') return part.content
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Whether a message carries a tool result — which is how the scripted model knows a tool just ran.
 *
 * Three shapes, because a conversation crosses three of them: a UI message carries `parts`, a model
 * message carries `content`, and a tool answer is sometimes a row of its own with `role: 'tool'`.
 * Reading only `parts` is the mistake that makes a scripted model call its own tool forever.
 */
function hasToolResult(message: unknown): boolean {
  if (!message || typeof message !== 'object') return false
  const record = message as {
    role?: unknown
    parts?: unknown
    content?: unknown
  }
  if (record.role === 'tool') return true
  const chunks = Array.isArray(record.parts)
    ? record.parts
    : Array.isArray(record.content)
      ? record.content
      : []
  return chunks.some((chunk) => {
    if (!chunk || typeof chunk !== 'object') return false
    const type = (chunk as { type?: unknown }).type
    return type === 'tool-result' || type === 'tool_result'
  })
}

/**
 * The scripted model's next answer, decided from the conversation it was handed.
 *
 * It is a function of the request rather than of a queue index, so the same step can be armed several
 * times in one run and still answer correctly: what it says depends on where the conversation stands.
 */
export const scriptedStep: FakeResponseStep = ({ request }) => {
  const messages = Array.isArray(request.messages) ? request.messages : []
  const last = messages[messages.length - 1]
  if (hasToolResult(last)) {
    // A guard rather than the usual path. The browser runs the tool and the run ends with its card, so
    // this sentence is what answers a continuation if one is ever asked for — and answering with text is
    // what keeps that continuation from calling the same tool again.
    return {
      text: 'Those are the counts behind the view you asked for — the tallest bar is the status with the most leads.',
    }
  }
  const prompt = messageText(last)
  if (ASKS_FOR_FIGURES.test(prompt)) {
    // A sentence and a call in one answer, which is what a model does — and what makes the turn read as
    // an answer rather than as a card that arrived from nowhere.
    return {
      text: 'Let me pull the pipeline figures for that.',
      toolCalls: [
        { name: leadFigures.name, input: { view: viewFrom(prompt) } },
      ],
    }
  }
  return {
    text: 'I can draw the pipeline figures for any view — every lead, the favourites, the new ones, the ones assigned to me, the overdue ones, the hot ones. Ask me how many hot leads there are and the figures land here.',
  }
}

/**
 * The scripted transport: the real `chat()` loop with a scripted adapter behind it.
 *
 * **`setResponses` is called per run, not once.** One run can call the model more than once — the tool
 * call, then the sentence that follows the result — and each new send starts another run, so arming the
 * answers here is what keeps a long conversation from running the queue dry.
 */
export function scriptedConnection(): ConnectionAdapter {
  const fake = fakeText({ model: 'pulse-demo', tokensPerSecond: 160 })
  return stream((messages) => {
    fake.setResponses(
      Array.from({ length: ANSWERS_PER_RUN }, () => scriptedStep),
    )
    return chat({
      adapter: fake,
      messages,
      tools: [leadFigures],
      systemPrompts: [SYSTEM_PROMPT],
    })
  })
}

/**
 * The browser-direct transport: the page talks to the configured endpoint itself, with the reader's key.
 *
 * **The provider SDK is imported inside the factory rather than at the top of this file.** It is a
 * Node-shaped package that only runs in a browser with `dangerouslyAllowBrowser`, and TanStack AI
 * documents it as a server library — so it stays out of the bundle until someone has actually configured
 * a gateway, and a visitor who never opens the panel never downloads it.
 *
 * `api: 'chat-completions'` because that is the one shape every OpenAI-compatible endpoint speaks,
 * Ollama included; the Responses API is OpenAI's own.
 */
export function gatewayConnection(
  settings: GatewaySettings,
): ConnectionAdapter {
  return stream(async function* (messages, _data, abortSignal) {
    const { openaiCompatibleText } =
      await import('@tanstack/ai-openai/compatible')
    const adapter = openaiCompatibleText(settings.model, {
      baseURL: settings.baseUrl,
      apiKey: settings.apiKey,
      api: 'chat-completions',
      dangerouslyAllowBrowser: true,
    })
    // Stop has to reach the request, not merely stop reading the answer.
    const controller = new AbortController()
    if (abortSignal?.aborted) controller.abort()
    else
      abortSignal?.addEventListener('abort', () => controller.abort(), {
        once: true,
      })
    yield* chat({
      adapter,
      messages,
      tools: [leadFigures],
      systemPrompts: [SYSTEM_PROMPT],
      abortController: controller,
    })
  })
}

/** The documented transport: the dev server route, streaming SSE back through `fetchServerSentEvents`. */
export function serverConnection(url: string): ConnectionAdapter {
  return fetchServerSentEvents(url)
}

/** The connection for a mode — the one place the three transports are chosen between. */
export function connectionFor(
  mode: AssistantMode,
  settings: GatewaySettings,
  serverUrl: string | null,
): ConnectionAdapter {
  if (mode === 'gateway') return gatewayConnection(settings)
  if (mode === 'server' && serverUrl) return serverConnection(serverUrl)
  return scriptedConnection()
}

/** A one-line description of a mode, for the panel's readout. */
export function modeLabel(
  mode: AssistantMode,
  settings: GatewaySettings,
): string {
  if (mode === 'gateway')
    return 'Gateway · ' + settings.model + ' at ' + settings.baseUrl
  if (mode === 'server') return 'Local server route · key from the environment'
  return 'Scripted demo · no key, no network'
}
