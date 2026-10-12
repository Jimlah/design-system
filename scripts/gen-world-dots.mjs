/**
 * Regenerates `src/components/DotMap/worldDots.ts` from the replica's dataset.
 *
 *   node scripts/gen-world-dots.mjs
 *
 * **This exists because the file it produces was generated once, by a throwaway script that was then
 * deleted** — so the module claimed to be generated while nothing could generate it, and the doc told a
 * reader to regenerate it if `data.js` changed. That is a maintenance trap: a derived file with no
 * derivation is indistinguishable from a hand-written one, and the next person edits it directly.
 *
 * It reads `GEO_DOTS` out of `pulse-replica/js/data.js` with a regex rather than importing it, because that
 * file is a plain browser script with a top-level `const`, not a module. The array is valid JSON — no
 * trailing commas, single-quoted strings — so it parses directly.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = '../pulse-replica/js/data.js'
const TARGET = 'src/components/DotMap/worldDots.ts'

const match = readFileSync(SOURCE, 'utf8').match(
  /const GEO_DOTS\s*=\s*(\[[\s\S]*?\]);/,
)
if (!match) throw new Error(`GEO_DOTS not found in ${SOURCE}`)

const dots = JSON.parse(match[1])
const accented = dots.filter((d) => d[2] === 'teal').length

const header = `/**
 * The world map the dashboard draws, as a list of dot centres.
 *
 * **Generated from \`pulse-replica/js/data.js\` by \`scripts/gen-world-dots.mjs\`, not hand-written** — ${dots.length}
 * points, of which ${accented} carry a second value meaning "this one matters". Run that script rather than editing this
 * file: it is data rather than design, which is why it lives in its own module, and a consumer that never
 * draws the map never pays for it.
 *
 * Coordinates are in the drawing's own units — x from about 81 to 482, y from about 144 to 401 — and
 * \`dashboard.html\` scales that range about 0.93 into a 528×380 zone, which is the default box here.
 */
/**
 * A dot centre, with an optional accent flag and an optional label.
 *
 * The world map below uses neither label: \`GEO_DOTS\` in the replica is bare geometry, so there is
 * nothing to say about an individual point. A map built from your own data — request origins,
 * deployment regions, where the failures were — can carry a label, and \`DotMap\` shows it under the
 * pointer. That is the whole reason the fourth slot exists.
 */
export type MapDot = [number, number] | [number, number, 1, string?]

export const WORLD_DOTS: MapDot[] = [`

const body = dots
  .map((d) => `  [${d[0]}, ${d[1]}${d[2] === 'teal' ? ', 1' : ''}],`)
  .join('\n')

writeFileSync(TARGET, `${header}\n${body}\n]\n`)
console.log(`wrote ${dots.length} dots (${accented} accented) to ${TARGET}`)
