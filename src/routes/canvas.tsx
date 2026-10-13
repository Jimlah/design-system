import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/ComponentCanvas.tsx, like every other page here: a route file with
// extra exports cannot be code-split, and the canvas is a page that shows the components being used
// rather than a component of the library.
import { ComponentCanvas } from '../examples/ComponentCanvas'

export const Route = createFileRoute('/canvas')({
  // A page of its own and indexed as one: someone looking for what these components actually look
  // like in every variant they publish is looking for exactly this.
  head: () =>
    pageHead({
      title: 'Component canvas',
      path: 'canvas',
      description:
        'Every component in the Pulse library on one plane you can pan and zoom: each named variant, each state that a pointer cannot reach, and the compositions that show how they fit together.',
    }),
  component: ComponentCanvas,
})
