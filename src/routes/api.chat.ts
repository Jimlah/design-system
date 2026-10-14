import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
  toolDefinition,
} from '@tanstack/ai'
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { createFileRoute } from '@tanstack/react-router'
// Type-only, and load-bearing: it is what brings TanStack Start's route augmentation — and so the
// `server` option below — into this program.
import type {} from '@tanstack/react-start'

/**
 * The documented transport: a server route that streams SSE back to the page.
 *
 * **This is the one path whose key never reaches the browser**, and it is also the one a static deploy
 * cannot have — Pages serves files and runs nothing. So it exists for a developer running
 * `npm run dev`, and the page probes it with a `GET` before preferring it over the scripted model.
 * The browser-direct path is the page's other way to a real model, and it is the one that works from a
 * static host, with the reader's own key.
 *
 * The key comes from the environment rather than from the request, which is what keeps this route the
 * *safe* one: nothing from the browser is trusted, and nothing is relayed. Set
 * `ASSISTANT_GATEWAY_KEY` (and optionally `ASSISTANT_GATEWAY_URL` / `ASSISTANT_GATEWAY_MODEL`) to
 * turn it on.
 */

const BASE_URL =
  process.env.ASSISTANT_GATEWAY_URL ?? 'https://api.openai.com/v1'
const MODEL = process.env.ASSISTANT_GATEWAY_MODEL ?? 'gpt-4o-mini'
const KEY = process.env.ASSISTANT_GATEWAY_KEY ?? ''

/**
 * The marker the page's probe insists on.
 *
 * A shape rather than a status code, because a static host answers an unknown path with its own 404
 * page and could plausibly answer with a 200 that is HTML — the probe has to be able to tell the
 * difference between *this* route and *something* being there.
 */
function GET() {
  return Response.json({ route: 'pulse-assistant', configured: KEY.length > 0 })
}

async function POST({ request }: { request: Request }) {
  if (!KEY) {
    return Response.json(
      {
        error: {
          type: 'assistant_not_configured',
          message:
            'The demo server route has no key. Set ASSISTANT_GATEWAY_KEY, or configure a gateway in the page instead.',
        },
      },
      { status: 503 },
    )
  }

  // Throws a 400 Response on a malformed AG-UI body, which TanStack Start returns for us.
  const params = await chatParamsFromRequest(request)

  /**
   * The client sends the *declarations* of the tools it will run, so the model is offered the same
   * shapes the browser is about to execute — and with no `execute` here on purpose. A tool the browser
   * runs must not also run on the server, or one question would be answered twice.
   */
  const tools = params.tools.map((tool) =>
    toolDefinition({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters,
    }),
  )

  const stream = chat({
    adapter: openaiCompatibleText(MODEL, {
      baseURL: BASE_URL,
      apiKey: KEY,
      api: 'chat-completions',
    }),
    messages: params.messages,
    tools,
    threadId: params.threadId,
    runId: params.runId,
  })

  return toServerSentEventsResponse(stream)
}

// Only `Route` is exported: a route file with extra exports cannot be code-split, which is the rule
// every other route here follows.
export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: { GET, POST },
  },
})
