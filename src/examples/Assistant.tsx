import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useChat } from '@tanstack/ai-react'
import type { ConnectionAdapter, UIMessage } from '@tanstack/ai-react'

import { Avatar } from '../components/Avatar/Avatar'
import { BarChart } from '../components/BarChart/BarChart'
import { Button } from '../components/Button/Button'
import { Card } from '../components/Card/Card'
import { Select } from '../components/Select/Select'
import { Modal } from '../components/Modal/Modal'
import { Skeleton } from '../components/Skeleton/Skeleton'
import { Switch } from '../components/Switch/Switch'
import { CHIP, TagGroup } from '../components/TagGroup/TagGroup'
import type { TagVariant } from '../components/TagGroup/TagGroup'
import { TextArea } from '../components/TextArea/TextArea'
import { TextField } from '../components/TextField/TextField'

import {
  CUSTOM_MODEL,
  CUSTOM_PRESET,
  DEFAULT_GATEWAY,
  GATEWAY_PRESETS,
  connectionFor,
  modeLabel,
  probeServerRoute,
  listModels,
  readConversation,
  readGateway,
  testGateway,
  writeConversation,
  writeGateway,
} from './assistantGateway'
import type {
  AssistantMode,
  GatewayProbe,
  GatewaySettings,
  ServerRoute,
} from './assistantGateway'
import { isLeadFigures, leadFiguresTool } from './assistantTool'
import type { LeadFigures } from './assistantTool'

/**
 * An assistant page: a conversation with a model, streamed into the components this library already
 * has, and a gateway panel that decides where the requests go.
 *
 * **It is an example, not a component, which is why it is here rather than in `src/components/`.**
 * Nothing in this file is published — no docs page, no entry in the components manifest, no story —
 * and it is tested by `Assistant.browser.test.tsx` in the `components` project instead. The route file
 * stays thin because a route with extra exports cannot be code-split.
 *
 * Three things are worth reading the source for:
 *
 * - **The transport is chosen, not assumed.** `assistantGateway.ts` holds the three of them and the
 *   probes that decide between them. The panel is what makes the choice visible, and the readout in
 *   the header is the sentence a reader needs to know which one answered them.
 * - **The tool is the point of the demo.** `show_lead_figures` is *declared* on the server side of
 *   whichever transport is in use and *executed* in the browser, and its result is drawn with
 *   `BarChart` and `TagGroup` inside the assistant's own `Card` — a model answer that renders this
 *   design system rather than a wall of text.
 * - **Nothing is assumed about the answer.** `part.output` is `any`, so it goes through a type guard
 *   before anything is drawn from it.
 */

/** What the welcome panel offers, and the reason it exists: the tool is invisible otherwise. */
const SUGGESTIONS = [
  'How many hot leads are there?',
  'Show the overdue leads as figures.',
  'What can you do?',
]

export interface AssistantProps {
  /**
   * Replaces the transport the page would otherwise choose.
   *
   * The seam exists for the same reason `Login` takes `onSubmit`: a browser test has to be able to
   * state a contract without a network, and every other assertion in this file is about behaviour
   * rather than about the wire. Pass a real `ConnectionAdapter`.
   */
  connection?: ConnectionAdapter
  /** Seeds the gateway panel, so a test can open it on known settings instead of a default one. */
  initialGateway?: GatewaySettings
}

export function Assistant({
  connection: injected,
  initialGateway,
}: AssistantProps) {
  const [draft, setDraft] = useState<GatewaySettings>(
    initialGateway ?? DEFAULT_GATEWAY,
  )
  const [applied, setApplied] = useState<GatewaySettings>(
    initialGateway ?? DEFAULT_GATEWAY,
  )
  /** True once a probe of the *applied* settings has succeeded from this browser. */
  const [gatewayReady, setGatewayReady] = useState(false)
  const [server, setServer] = useState<ServerRoute | null>(null)
  const [probe, setProbe] = useState<GatewayProbe | null>(null)
  /** What the endpoint said it serves, from the last probe that reached it. */
  const [models, setModels] = useState<string[]>([])
  /** True once the reader asks to type a model id rather than choose from that list. */
  const [isCustomModel, setCustomModel] = useState(false)
  const [isTesting, setTesting] = useState(false)
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  /** Whether the stored conversation has been read yet. The transcript renders once it has. */
  const [ready, setReady] = useState(false)

  /**
   * The conversation as it stands, kept out of React state on purpose: a stream updates the transcript
   * many times a second, and the only thing the page needs from it is the value to hand the next
   * transport when the reader switches one.
   */
  const history = useRef<UIMessage[]>([])
  const writeTimer = useRef<number | null>(null)

  useEffect(() => {
    const saved = readGateway()
    if (saved) {
      setDraft(saved)
      setApplied(saved)
      // A remembered gateway is re-checked on the way in. That check is also what lists its models, and
      // it is the only honest way to claim the connection the page is about to use still works — a
      // stored key says nothing about a server that has moved.
      void recheck(saved)
    }
    setInitialMessages(readConversation())
    setReady(true)
  }, [])

  /**
   * The model list follows the address, without waiting for a connection test.
   *
   * **Choosing a preset should fill the chooser at once.** Ollama on this machine needs no key and lists
   * its models to anyone on it, and pressing "Test and use" merely to look at a list would also switch
   * where every request goes — agreement to a question the reader only wanted to see answered. The wait
   * is there because the Base URL arrives one character at a time.
   */
  useEffect(() => {
    if (!isPanelOpen) return
    if (!/^https?:\/\//.test(draft.baseUrl.trim())) return
    let alive = true
    const timer = window.setTimeout(() => {
      void listModels(draft).then((ids) => {
        if (alive) setModels(ids)
      })
    }, 500)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [isPanelOpen, draft.baseUrl, draft.apiKey, draft.preset])

  useEffect(() => {
    let alive = true
    void probeServerRoute().then((route) => {
      if (alive) setServer(route)
    })
    return () => {
      alive = false
    }
  }, [])

  const mode: AssistantMode = gatewayReady
    ? 'gateway'
    : server?.configured
      ? 'server'
      : 'scripted'

  // Memoised, and that is not an optimisation: `useChat` recreates its client whenever the connection
  // identity changes, so a connection built during render would restart the conversation every render.
  const connection = useMemo(
    () => injected ?? connectionFor(mode, applied, server?.url ?? null),
    [injected, mode, applied, server],
  )

  /**
   * Persisting is throttled rather than fired per token. A stream calls this on every chunk, and a
   * synchronous `localStorage` write per chunk is the one way this page could make its own typing
   * feel slow. The last write always lands, so nothing is lost — only coalesced.
   */
  const handleMessages = useCallback((messages: UIMessage[]) => {
    history.current = messages
    if (writeTimer.current !== null) window.clearTimeout(writeTimer.current)
    writeTimer.current = window.setTimeout(() => {
      writeTimer.current = null
      writeConversation(messages)
    }, 400)
  }, [])

  /**
   * Probe a set of settings, and take the model list it answers with.
   *
   * The list is why this is shared rather than inlined: the same request decides whether a gateway is
   * usable *and* what it serves, and the panel's chooser is built from the second answer.
   */
  async function recheck(settings: GatewaySettings) {
    const result = await testGateway(settings)
    setProbe(result)
    setModels(result.models)
    setCustomModel(
      result.models.length > 0 && !result.models.includes(settings.model),
    )
    return result
  }

  /** Test the draft, and adopt it only if this browser can actually reach it. */
  async function testAndUse() {
    setTesting(true)
    const result = await recheck(draft)
    setTesting(false)
    if (!result.ok) return
    // The conversation survives the switch: the next transport is seeded with it rather than starting
    // over, so changing where the answers come from does not throw away the answers already given.
    setInitialMessages(history.current)
    setApplied(draft)
    setGatewayReady(true)
    writeGateway(draft)
  }

  return (
    <div
      data-slot="assistant"
      className="min-h-dvh bg-background px-6 py-16 text-foreground"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-[12px] tracking-[0.04em] text-muted-foreground uppercase">
            Pulse · design system
          </p>
          <h1 className="text-[32px] leading-none font-semibold tracking-[-0.02em]">
            Assistant
          </h1>
          <p className="max-w-2xl text-[14px] leading-[1.6] text-foreground/70">
            A conversation streamed into these components, with one tool whose
            result is drawn as a card. It runs on a scripted model until you
            point it at a gateway of your own.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-slot="assistant-mode"
              className={CHIP + ' border-border-soft text-foreground/60'}
            >
              {modeLabel(mode, applied)}
            </span>
            {/*
              A `Modal`, where this panel was planned as a `Sheet`. On this page the sheet's panel
              never leaves its entering offset — `[data-slot="sheet"]` arrives without `data-expanded`
              and its position element stays at `left: calc(100dvw)`, a viewport off-screen — and the
              same component is perfectly placed on `/board`. That is a defect to chase in the sheet,
              not here, so the panel takes the surface that works rather than being unreachable.
            */}
            <Modal isOpen={isPanelOpen} onOpenChange={setPanelOpen}>
              <Button variant="outline" size="sm">
                <Button.Text>Gateway</Button.Text>
              </Button>
              <Modal.Content className="w-[26rem] max-w-[92vw]">
                <GatewayPanel
                  draft={draft}
                  onChange={(next) => {
                    setDraft(next)
                    // The readout is a claim about the connection in use, so a failed probe stops
                    // being evidence the moment the settings behind it change.
                    setProbe(null)
                    // And a model list belongs to the address it came from: pointing the panel at
                    // another endpoint must not keep offering the previous one's models.
                    if (next.baseUrl !== draft.baseUrl) {
                      setModels([])
                      setCustomModel(false)
                    }
                  }}
                  onTest={() => void testAndUse()}
                  isTesting={isTesting}
                  probe={probe}
                  models={models}
                  isCustomModel={isCustomModel}
                  onCustomModel={() => setCustomModel(true)}
                  server={server}
                  inUse={modeLabel(mode, applied)}
                />
              </Modal.Content>
            </Modal>
          </div>
        </header>

        {ready ? (
          <Conversation
            key={mode + '|' + applied.baseUrl + '|' + applied.model}
            connection={connection}
            initialMessages={initialMessages}
            onMessages={handleMessages}
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   The conversation
   ------------------------------------------------------------------------ */

interface ConversationProps {
  connection: ConnectionAdapter
  initialMessages: UIMessage[]
  onMessages: (messages: UIMessage[]) => void
}

function Conversation({
  connection,
  initialMessages,
  onMessages,
}: ConversationProps) {
  const chat = useChat({
    connection,
    tools: [leadFiguresTool],
    initialMessages,
  })
  const [draft, setDraft] = useState('')

  useEffect(() => {
    onMessages(chat.messages)
  }, [chat.messages, onMessages])

  function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void chat.sendMessage(text)
  }

  /**
   * Enter sends; Shift+Enter starts a new line.
   *
   * **`isComposing` is the part that is silently wrong elsewhere**: an IME uses Enter to accept a
   * candidate, so a composer without this check posts a half-typed word the moment the reader picks a
   * character.
   */
  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  const last = chat.messages[chat.messages.length - 1]
  // The skeleton card stands in for the gap before the assistant has a turn of its own. Once one
  // exists its own card carries the placeholder, so there is never more than one on screen.
  const isWaiting =
    chat.isLoading && (chat.messages.length === 0 || last.role === 'user')

  return (
    <Card data-slot="assistant-conversation">
      <Card.Content className="flex flex-col gap-4">
        {chat.messages.length === 0 ? (
          <Welcome onPick={(prompt) => void chat.sendMessage(prompt)} />
        ) : (
          <ol
            data-slot="assistant-transcript"
            className="flex list-none flex-col gap-4 p-0"
          >
            {chat.messages.map((message) => (
              <li key={message.id}>
                <Turn message={message} />
              </li>
            ))}
            {isWaiting ? (
              <li>
                <PendingTurn />
              </li>
            ) : null}
          </ol>
        )}

        {chat.error ? (
          <div
            data-slot="assistant-error"
            role="alert"
            className="flex flex-wrap items-center gap-3 border border-destructive/40 px-4 py-3 text-[13px]"
          >
            <span className="text-foreground/80">
              That request did not finish: {chat.error.message}
            </span>
            <Button variant="text" size="sm" onPress={() => void chat.reload()}>
              <Button.Text>Try again</Button.Text>
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <TextArea value={draft} onChange={setDraft} className="w-full">
            <TextArea.Label>Message</TextArea.Label>
            <TextArea.Input
              rows={3}
              placeholder="Ask about the pipeline…"
              onKeyDown={onComposerKeyDown}
            />
            <TextArea.Hint>
              Enter sends · Shift+Enter starts a new line.
            </TextArea.Hint>
          </TextArea>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
              {chat.messages.length === 1
                ? '1 message'
                : chat.messages.length + ' messages'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="text"
                size="sm"
                isDisabled={chat.messages.length === 0}
                onPress={() => chat.clear()}
              >
                <Button.Text>Clear</Button.Text>
              </Button>
              {chat.isLoading ? (
                <Button
                  variant="default"
                  color="neutral"
                  onPress={() => chat.stop()}
                >
                  <Button.Text>Stop</Button.Text>
                </Button>
              ) : (
                <Button
                  variant="default"
                  color="primary"
                  isDisabled={draft.trim().length === 0}
                  onPress={send}
                >
                  <Button.Text>Send</Button.Text>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

/** Does this message have anything to show yet? An empty text part mid-stream counts as nothing. */
function hasVisiblePart(message: UIMessage) {
  return message.parts.some((part) => {
    if (part.type === 'text') return part.content.trim().length > 0
    if (part.type === 'thinking') return part.content.trim().length > 0
    if (part.type === 'tool-call') return part.state === 'complete'
    return false
  })
}

function Welcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div data-slot="assistant-welcome" className="flex flex-col gap-3">
      <p className="m-0 text-[13px] leading-[1.6] text-foreground/70">
        Ask about the leads this repo ships. The assistant will call a tool and
        draw the figures as a card — the same card either way, whether the
        answer came from a scripted model or from a gateway you configured.
      </p>
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => onPick(suggestion)}
            >
              <Button.Text>{suggestion}</Button.Text>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One turn, in the register the turn belongs to: the assistant in a card, the reader beside it. */
function Turn({ message }: { message: UIMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          data-slot="assistant-question"
          className="max-w-[85%] border border-border-soft bg-muted px-4 py-3 text-[13px] leading-[1.55] whitespace-pre-wrap"
        >
          {message.parts.map((part, index) =>
            part.type === 'text' ? (
              <span key={index}>{part.content}</span>
            ) : null,
          )}
        </div>
      </div>
    )
  }

  return (
    <Card data-slot="assistant-answer">
      <Card.Header>
        <div className="flex items-center gap-3">
          <Avatar alt="Pulse assistant" size="sm" />
          <Card.Title>Assistant</Card.Title>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {hasVisiblePart(message) ? (
          message.parts.map((part, index) => <Part key={index} part={part} />)
        ) : (
          <Skeleton className="h-4 w-2/3" />
        )}
      </Card.Content>
    </Card>
  )
}

/** The gap between sending and the first token, when the assistant has no message of its own yet. */
function PendingTurn() {
  return (
    <Card data-slot="assistant-pending">
      <Card.Header>
        <div className="flex items-center gap-3">
          <Avatar alt="Pulse assistant" size="sm" />
          <Card.Title>Assistant</Card.Title>
        </div>
      </Card.Header>
      <Card.Content>
        <Skeleton className="h-4 w-1/2" />
      </Card.Content>
    </Card>
  )
}

function Part({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') {
    return (
      <p className="m-0 text-[13px] leading-[1.55] whitespace-pre-wrap">
        {part.content}
      </p>
    )
  }
  if (part.type === 'thinking') {
    return (
      <p className="m-0 text-[12px] leading-[1.5] text-muted-foreground italic">
        {part.content}
      </p>
    )
  }
  if (part.type === 'tool-call') {
    // The output arrives as `any`, so it is checked before anything is drawn from it: a model
    // that answers with the wrong shape gets a placeholder rather than a card built out of nonsense.
    if (part.state === 'complete' && isLeadFigures(part.output)) {
      return <Figures figures={part.output} />
    }
    return (
      <div data-slot="assistant-tool-pending" className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }
  return null
}

/** The tool's result, in the components that already exist: a chart, then the counts as chips. */
function Figures({ figures }: { figures: LeadFigures }) {
  return (
    <div
      data-slot="assistant-figures"
      className="mt-1 flex flex-col gap-3 border border-border-soft bg-background/40 p-4"
    >
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
          {figures.title}
        </p>
        <p className="m-0 text-[13px] text-foreground/70">
          {figures.total === 1 ? '1 lead' : figures.total + ' leads'} in this
          view
        </p>
      </div>
      <BarChart
        className="w-full"
        values={figures.values}
        labels={figures.labels}
        highlightIndex={figures.highlightIndex}
        width={640}
        height={96}
        label={'Leads per status — ' + figures.title}
      />
      <TagGroup
        aria-label={figures.title + ': leads per status'}
        selectionMode="none"
      >
        <TagGroup.List>
          {figures.statuses.map((entry) => (
            <TagGroup.Tag
              key={entry.status}
              id={entry.status}
              textValue={entry.status + ' ' + entry.count}
              variant={toneFor(entry.status, entry.count)}
            >
              {entry.status} · {entry.count}
            </TagGroup.Tag>
          ))}
        </TagGroup.List>
      </TagGroup>
    </div>
  )
}

/** A chip's treatment says whether there is anything in it, and which status it is. */
function toneFor(status: string, count: number): TagVariant {
  if (count === 0) return 'gray'
  if (status === 'Hot') return 'teal'
  if (status === 'Pending') return 'yellow'
  return 'outline'
}

/* ---------------------------------------------------------------------------
   The gateway panel
   ------------------------------------------------------------------------ */

interface GatewayPanelProps {
  draft: GatewaySettings
  onChange: (next: GatewaySettings) => void
  onTest: () => void
  isTesting: boolean
  probe: GatewayProbe | null
  /** What the endpoint listed, or empty when it listed nothing. */
  models: string[]
  /** Whether the reader has stepped outside that list. */
  isCustomModel: boolean
  onCustomModel: () => void
  server: ServerRoute | null
  /** What the page is speaking over right now — about the *applied* settings, never the draft. */
  inUse: string
}

function GatewayPanel({
  draft,
  onChange,
  onTest,
  isTesting,
  probe,
  models,
  isCustomModel,
  onCustomModel,
  server,
  inUse,
}: GatewayPanelProps) {
  // The endpoint's own list, with the current model in front of it when the list does not carry it:
  // a model remembered from another endpoint, or typed by hand, should be shown rather than blanked.
  const modelOptions =
    draft.model.trim() && !models.includes(draft.model)
      ? [draft.model, ...models]
      : models

  return (
    <>
      <Modal.Title>Gateway</Modal.Title>
      <Modal.Description>
        Where this page's requests go. Nothing here leaves your browser except
        the requests you send to the address below.
      </Modal.Description>

      <div className="mt-6 flex flex-col gap-5">
        <Select
          selectedKey={draft.preset}
          onSelectionChange={(key) => {
            const preset = GATEWAY_PRESETS.find(
              (candidate) => candidate.id === String(key),
            )
            if (preset) {
              onChange({
                ...draft,
                preset: preset.id,
                baseUrl: preset.baseUrl,
                model: preset.model,
              })
              return
            }
            onChange({ ...draft, preset: CUSTOM_PRESET })
          }}
        >
          <Select.Label>Preset</Select.Label>
          <Select.Button>
            <Select.Value />
          </Select.Button>
          <Select.Menu>
            {GATEWAY_PRESETS.map((preset) => (
              <Select.Option
                key={preset.id}
                id={preset.id}
                textValue={preset.label}
              >
                {preset.label}
              </Select.Option>
            ))}
            <Select.Option id={CUSTOM_PRESET} textValue="Custom">
              Custom
            </Select.Option>
          </Select.Menu>
        </Select>

        <TextField
          value={draft.baseUrl}
          onChange={(baseUrl) =>
            onChange({ ...draft, baseUrl, preset: CUSTOM_PRESET })
          }
        >
          <TextField.Label>Base URL</TextField.Label>
          <TextField.Input type="url" />
          <TextField.Hint>
            Any OpenAI-compatible endpoint: OpenRouter, Groq, vLLM, LM Studio,
            Ollama on this machine.
          </TextField.Hint>
        </TextField>

        {isCustomModel ? (
          <TextField
            value={draft.model}
            onChange={(model) => onChange({ ...draft, model })}
          >
            <TextField.Label>Model</TextField.Label>
            <TextField.Input />
            <TextField.Hint>
              Type any model id this endpoint serves.
            </TextField.Hint>
          </TextField>
        ) : (
          <Select
            selectedKey={draft.model}
            onSelectionChange={(key) => {
              if (String(key) === CUSTOM_MODEL) {
                onCustomModel()
                return
              }
              const chosen = models.find((candidate) => candidate === key)
              if (chosen) onChange({ ...draft, model: chosen })
            }}
          >
            <Select.Label>Model</Select.Label>
            <Select.Button>
              <Select.Value />
            </Select.Button>
            <Select.Popover>
              {/* A real gateway lists dozens of models, so the list is searchable: the scope filters
                  from the start of each id, and `Custom` stays reachable underneath it. */}
              <Select.AutoComplete placeholder="Filter models…">
                <Select.OptionList>
                  {modelOptions.map((model) => (
                    <Select.Option key={model} id={model} textValue={model}>
                      {model}
                    </Select.Option>
                  ))}
                  <Select.Option id={CUSTOM_MODEL} textValue="Another model id">
                    Another model id…
                  </Select.Option>
                </Select.OptionList>
              </Select.AutoComplete>
            </Select.Popover>
            <Select.Hint>
              {models.length === 0
                ? 'No models listed yet — they arrive once that address answers, or pick Another model id.'
                : models.length +
                  (models.length === 1 ? ' model listed' : ' models listed') +
                  ' by the endpoint.'}
            </Select.Hint>
          </Select>
        )}

        <TextField
          value={draft.apiKey}
          onChange={(apiKey) => onChange({ ...draft, apiKey })}
        >
          <TextField.Label>API key</TextField.Label>
          <TextField.Input type="password" autoComplete="off" />
          <TextField.Hint>
            Sent to that address and nowhere else. Left out of this browser's
            storage unless you ask for it to be remembered.
          </TextField.Hint>
        </TextField>

        <Switch
          isSelected={draft.remember}
          onChange={(remember) => onChange({ ...draft, remember })}
        >
          <Switch.Indicator />
          <Switch.Text>Remember on this device</Switch.Text>
        </Switch>

        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="default"
              color="primary"
              isPending={isTesting}
              onPress={onTest}
            >
              <Button.Text>Test and use</Button.Text>
            </Button>
            <span
              data-slot="gateway-status"
              className="text-[13px] text-foreground/70"
            >
              {probe
                ? probe.message
                : 'Not tested yet — the page is on its scripted model until a gateway answers.'}
            </span>
          </div>
          <p className="m-0 text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
            In use: {inUse}
          </p>
          <p className="m-0 text-[13px] leading-[1.6] text-foreground/60">
            {server
              ? server.configured
                ? 'A local server route is running, and the page prefers it when no gateway is set.'
                : 'A local server route is running but has no key in its environment, so the page stays scripted.'
              : 'There is no server behind this page, so a gateway is the only way to reach a real model — and only this browser can tell whether your address answers.'}
          </p>
        </div>
      </div>
    </>
  )
}
