import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

import { LEADS, visibleLeads } from './leads'
import type { LeadStatus, ViewId } from './leads'

/**
 * The day the Overdue view is measured against.
 *
 * A fixed date rather than `new Date()`, for the reason `leads.ts` gives: a page whose figures
 * change at midnight is a page no test can hold still, and this one's numbers are asserted exactly.
 * `DashboardEmail` pins the same day for the same reason.
 */
export const TODAY = '2026-10-12'

/** The six states a lead moves through, in pipeline order — the order the chart draws them in. */
const STATUSES = [
  'New',
  'Open',
  'In progress',
  'Qualified',
  'Pending',
  'Hot',
] as const satisfies readonly LeadStatus[]

/**
 * The views the tool accepts, and the list the model is offered.
 *
 * `satisfies readonly ViewId[]` catches a name that is not a view; it cannot catch a view that was
 * forgotten, so the browser test compares this list against `VIEWS` instead. That is the honest
 * place for it — a completeness check is a claim about data, and this file is not where data lives.
 */
export const VIEW_IDS = [
  'all',
  'favourite',
  'new',
  'assigned',
  'overdue',
  'hot',
] as const satisfies readonly ViewId[]

/** What each view is called on the card. Typed as a full `Record`, so a new view fails to compile. */
const VIEW_LABELS: Record<ViewId, string> = {
  all: 'Every lead',
  favourite: 'Favourite leads',
  new: 'New leads',
  assigned: 'Assigned to me',
  overdue: 'Overdue leads',
  hot: 'Hot leads',
}

const input = z.object({
  view: z.enum(VIEW_IDS).meta({
    description:
      'Which rows to count: every lead, the favourites, the new ones, the ones assigned to me, the overdue ones, or the hot ones.',
  }),
})

const output = z.object({
  view: z.enum(VIEW_IDS),
  title: z.string().meta({ description: 'The card heading.' }),
  total: z.number().meta({ description: 'How many leads this view holds.' }),
  values: z
    .array(z.number())
    .meta({ description: 'One count per status, in pipeline order.' }),
  labels: z
    .array(z.string())
    .meta({ description: 'The status each count belongs to.' }),
  highlightIndex: z
    .number()
    .meta({ description: 'The status holding the most leads.' }),
  statuses: z.array(z.object({ status: z.string(), count: z.number() })),
})

/** What the tool returns, inferred from the schema rather than restated beside it. */
export type LeadFigures = z.infer<typeof output>
/** What the tool takes. */
export type LeadFiguresInput = z.infer<typeof input>

/**
 * The figures for one view, computed from the rows this repo already ships.
 *
 * **The counts are over `visibleLeads`, which is the same function the leads dashboard draws its
 * table with** — so a figure here can never disagree with a row there. Nothing is fetched and nothing
 * is invented: twelve leads in `leads.ts` are the whole dataset, and the point of the tool is that
 * the model asked a question the page already knew the answer to.
 */
export function figuresFor(view: ViewId): LeadFigures {
  const rows = visibleLeads(LEADS, view, '', TODAY)
  const statuses = STATUSES.map((status) => ({
    status,
    count: rows.filter((lead) => lead.status === status).length,
  }))
  const values = statuses.map((entry) => entry.count)
  // The tallest bar is the accent one. A tie keeps the earlier status, so the drawing is stable.
  const highlightIndex = values.reduce(
    (best, value, index) => (value > values[best] ? index : best),
    0,
  )
  return {
    view,
    title: VIEW_LABELS[view],
    total: rows.length,
    values,
    labels: [...STATUSES],
    highlightIndex,
    statuses,
  }
}

/**
 * Does an unknown value have the shape the card needs?
 *
 * `part.output` is `any` on the wire, so the renderer would happily draw a card out of a
 * hallucinated object. This is the boundary where that stops being possible.
 */
export function isLeadFigures(value: unknown): value is LeadFigures {
  if (!value || typeof value !== 'object') return false
  const figures = value as Partial<LeadFigures>
  return (
    typeof figures.title === 'string' &&
    typeof figures.total === 'number' &&
    Array.isArray(figures.values) &&
    figures.values.every((entry) => typeof entry === 'number') &&
    Array.isArray(figures.labels) &&
    Array.isArray(figures.statuses) &&
    typeof figures.highlightIndex === 'number'
  )
}

/**
 * The one tool this example has, as an **isomorphic definition**: the schema and the description the
 * model is given, with no implementation attached.
 *
 * The two halves are deliberately separate, which is the whole point of `toolDefinition()`:
 * `leadFigures` goes to `chat()` — on the dev server route, or in the browser for the two
 * browser transports — and only *declares* what the model may call. `leadFiguresTool` is the half
 * `useChat` runs in the browser. Neither environment ever executes the other's half, so a figure
 * is computed once, in the page, from data the page already bundled.
 */
export const leadFigures = toolDefinition({
  name: 'show_lead_figures',
  description:
    'Show the pipeline figures for one view of the leads table: how many leads sit in each status, drawn as a chart and a row of chips. Call it whenever the reader asks how many leads there are, asks for a breakdown, or names a view.',
  inputSchema: input,
  outputSchema: output,
})

/** The browser half: what `useChat` executes when the model calls `show_lead_figures`. */
export const leadFiguresTool = leadFigures.client(({ view }) =>
  figuresFor(view),
)
