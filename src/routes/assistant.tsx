import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/Assistant.tsx, like every other worked example here: a route file
// with extra exports cannot be code-split.
import { Assistant } from '../examples/Assistant'

export const Route = createFileRoute('/assistant')({
  // Indexed on its own, like the other examples: someone searching for a chat UI built out of React
  // Aria components and a streaming model is looking for exactly this page.
  head: () =>
    pageHead({
      title: 'Assistant',
      path: 'assistant',
      description:
        'A streaming assistant built from Pulse components: a conversation, a tool whose result is drawn as a chart, and a panel that points the requests at a gateway of your own.',
    }),
  component: Assistant,
})
