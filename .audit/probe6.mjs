import { chromium } from 'playwright'
const SB = 'http://localhost:6006/iframe.html?id='
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
const log = (k, v) => console.log('@@' + k + ' ' + JSON.stringify(v))
const safe = async (k, fn) => { try { log(k, await fn()) } catch (e) { log(k, 'ERR ' + String(e).slice(0, 140)) } }
async function open(id) { await page.goto(SB + id + '&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(600) }
const lum = (rgb) => { const [r,g,b] = rgb.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) }); return 0.2126*r + 0.7152*g + 0.0722*b }
const ratio = (a, b) => { const [x,y] = [lum(a), lum(b)].sort((p,q)=>q-p); return +(((x+0.05)/(y+0.05)).toFixed(2)) }
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0,3).map(Number)

// A. option focus indicator
await safe('optionFocus', async () => {
  await open('components-select--default')
  await page.locator('#storybook-root button').first().click({ force: true }); await page.waitForTimeout(300)
  const before = await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].slice(0,4).map(o => getComputedStyle(o).backgroundColor))
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120)
  const after = await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].slice(0,4).map(o => ({ bg: getComputedStyle(o).backgroundColor, focused: o.matches(':focus-visible') || !!o.closest('[data-focus-visible]'), outline: getComputedStyle(o).outlineStyle + ' ' + getComputedStyle(o).outlineWidth })))
  const pageBg = await page.evaluate(() => getComputedStyle(document.querySelector('#storybook-root > div') || document.body).backgroundColor)
  return { before, after, pageBg }
})

// B. motion under reduced motion, scoped
async function motion(id) {
  const read = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root *')].map(el => { const s = getComputedStyle(el)
      return (s.transitionDuration === '0s' && s.animationName === 'none') ? null : { tag: el.tagName, cls: String(el.className).slice(0, 46), prop: s.transitionProperty, dur: s.transitionDuration } }).filter(Boolean))
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await open(id); const n = await read()
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(id); const r = await read()
  await page.emulateMedia({ reducedMotion: null })
  return { normal: n, reduced: r }
}
for (const [k, id] of [['slider','components-slider--default'],['switch','components-switch--default'],['accordion','components-accordion--default'],['tabs','components-tabs--default'],['checkbox','components-checkbox--default'],['radio','components-radio--default']]) await safe('motion:' + k, () => motion(id))

// C. overlays: any enter animation?
for (const [k, id] of [['modal','components-modal--default'],['sheet','components-sheet--default'],['popover','components-popover--default']]) await safe('enter:' + k, async () => {
  await open(id)
  await page.locator('#storybook-root button').first().click({ force: true })
  const samples = []
  for (const t of [0, 40, 120, 300]) { await page.waitForTimeout(t === 0 ? 0 : t - (samples.at(-1)?.t || 0)); samples.push({ t, ...(await page.evaluate(() => { const d = document.querySelector('[role="dialog"], [role="listbox"]'); if (!d) return { none: true }; const s = getComputedStyle(d)
    return { attrs: [...d.attributes].map(a => a.name).filter(n => /enter|exit|rac/.test(n)).join(','), anim: s.animationName, dur: s.transitionDuration, op: s.opacity, tf: s.transform.slice(0, 30) } })) }) }
  return samples
})

// D. accordion panel height over time
await safe('accordionHeight', async () => {
  await open('components-accordion--default')
  const heights = []
  const header = page.locator('#storybook-root [data-rac] button, #storybook-root button').first()
  await header.click({ force: true })
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(30); heights.push(await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role="region"], #storybook-root [role="group"]')].map(e => Math.round(e.getBoundingClientRect().height)))) }
  return heights
})

// E. textarea growth
await safe('textareaGrow', async () => {
  await open('components-textarea--default')
  return page.evaluate(() => { const ta = document.querySelector('#storybook-root textarea'); const h0 = Math.round(ta.getBoundingClientRect().height)
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(ta, Array.from({ length: 12 }, (_, i) => 'line ' + i).join('\n')); ta.dispatchEvent(new Event('input', { bubbles: true }))
    const h1 = Math.round(ta.getBoundingClientRect().height)
    return { fieldSizing: getComputedStyle(ta).fieldSizing, resize: getComputedStyle(ta).resize, rows: ta.rows, before: h0, after: h1, scrollH: ta.scrollHeight } })
})

// F. table numbers
await safe('tableNumbers', () => ({ skip: 1 }))
await safe('tableNumbers2', async () => { await open('components-table--default')
  return page.evaluate(() => { const cells = [...document.querySelectorAll('#storybook-root td, #storybook-root [role="gridcell"], #storybook-root [role="rowheader"]')]
    const num = cells.filter(c => /^[\s$€£]?-?[\d.,]+%?$/.test(c.textContent.trim()))
    return { cells: cells.length, numeric: num.map(c => c.textContent.trim()).slice(0, 8), tabular: num.map(c => getComputedStyle(c).fontVariantNumeric) } }) })

// G. app: hit areas + pseudo-element hit expansion + scrollers overscroll
await safe('appTargets', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1200)
  return page.evaluate(() => {
    const pick = (sel) => [...document.querySelectorAll(sel)].map(el => { const r = el.getBoundingClientRect(); const bs = getComputedStyle(el, '::before')
      return { aria: el.getAttribute('aria-label'), cls: String(el.className).slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), beforeW: bs.width + ' ' + bs.height + ' ' + bs.content } })
    const scrollers = [...document.querySelectorAll('*')].filter(el => ['auto','scroll'].includes(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 4)
      .map(el => ({ cls: String(el.className).slice(0, 44), overscrollY: getComputedStyle(el).overscrollBehaviorY, scrollSnap: getComputedStyle(el).scrollSnapType }))
    return { targets: pick('[aria-label="Calendar"], [aria-label="Show suggestions"], [aria-label="Increase"], [aria-label="Decrease"]'), scrollers: scrollers.slice(0, 10), scrollerCount: scrollers.length } })
})
await safe('navPress', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1200)
  const link = page.locator('a[data-slot="link"], #storybook-root a').first()
  const before = await page.evaluate(() => { const a = document.querySelector('a[data-slot="link"]'); return a ? getComputedStyle(a).color + ' | ' + getComputedStyle(a).opacity : 'none' })
  const box = await link.boundingBox()
  if (!box) return 'no link'
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(80)
  const during = await page.evaluate(() => { const a = document.querySelector('a[data-slot="link"]'); return a ? { color: getComputedStyle(a).color, opacity: getComputedStyle(a).opacity, pressed: a.hasAttribute('data-pressed'), active: a.matches(':active') } : 'none' })
  await page.mouse.up()
  return { before, during }
})
await browser.close()