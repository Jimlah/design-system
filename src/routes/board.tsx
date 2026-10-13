import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../seo'
// The body lives in src/examples/TaskBoard.tsx, like the sign-in page and the theme builder: a
// route file with extra exports cannot be code-split, and this page is a worked example of the
// components being used rather than one of them.
import { TaskBoard } from '../examples/TaskBoard'

export const Route = createFileRoute('/board')({
  // A page of its own, and indexed as one: someone looking for what these components look like
  // doing a real job is looking for exactly this.
  head: () =>
    pageHead({
      title: 'Task board',
      path: 'board',
      description:
        'A task board built from this design system: four columns of cards, dragged between them, with a sheet for the detail behind each one.',
    }),
  component: TaskBoard,
})
