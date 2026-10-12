
import { chromium } from 'playwright'
const SB = 'http://localhost:6006/iframe.html?id='
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const log = (k, v) => console.log('@@' + k + ' ' + JSON.stringify(v))
async function story(id, fn) {
  await page.goto(SB + id + '&viewMode=story', { waitUntil: 'load' })
  await page.waitForTimeout(400)
  return fn()
}
const safe = async (k, fn) => { try { log(k, await fn()) } catch (e) { log(k, 'ERR ' + String(e).slice(0, 180)) } }

await safe('app', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  return page.evaluate(() => {
    const b = getComputedStyle(document.body), root = getComputedStyle(document.documentElement)
    const inter = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"],[tabindex]')]
    const small = inter.map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, t: (el.textContent||'').trim().slice(0,16), w: Math.round(r.width), h: Math.round(r.height) } }).filter(x => x.h > 0 && (x.w < 44 || x.h < 44))
    const clipped = [...document.querySelectorAll('*')].filter(el => { const s = getComputedStyle(el); return s.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 2 }).map(el => el.tagName + '.' + String(el.className).slice(0, 50))
    return { textRendering: b.textRendering, fontSize: b.fontSize, overscrollHtml: root.overscrollBehaviorY, overscrollBody: b.overscrollBehaviorY, scrollbarGutter: root.scrollbarGutter, colorScheme: root.colorScheme, interactiveCount: inter.length, smallTargets: small.length, smallSample: small.slice(0, 10), clippedScrollers: clipped.length, clippedSample: clipped.slice(0, 6), maxWidthWrappers: [...document.querySelectorAll('.mx-auto')].map(e => String(e.className).slice(0, 44)), fontSizes: [...new Set([...document.querySelectorAll('*')].map(el => getComputedStyle(el).fontSize))].join(','), viewportMeta: document.querySelector('meta[name=viewport]')?.content, safeAreaCss: [...document.querySelectorAll('*')].filter(el => /safe-area/.test(getComputedStyle(el).paddingBottom)).length }
  })
})
await safe('button', () => story('components-button--default', () => page.evaluate(() => {
  const btn = document.querySelector('button'); btn.focus(); const s = getComputedStyle(btn), r = btn.getBoundingClientRect()
  return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow.slice(0,50), transition: s.transitionProperty + ' / ' + s.transitionDuration, rect: [Math.round(r.width), Math.round(r.height)] }
})))
async function reduceProbe(id) {
  const read = () => page.evaluate(() => [...document.querySelectorAll('*')].map(el => { const s = getComputedStyle(el)
      const t = s.transitionProperty + ' / ' + s.transitionDuration + ' / ' + s.animationName
      return (t.startsWith('all / 0s / none') || t.startsWith('all/0s/none')) ? null : { tag: el.tagName, cls: String(el.className).slice(0, 55), t } }).filter(Boolean))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const normal = await story(id, read)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reduced = await story(id, read)
  await page.emulateMedia({ reducedMotion: null })
  return { normal: normal.length, reduced: reduced.length, still: reduced.slice(0, 6).map(r => r.tag + '.' + r.cls + ' :: ' + r.t) }
}
for (const id of ['components-slider--default', 'components-accordion--default', 'components-switch--default', 'components-tabs--default', 'components-button--default']) await safe('motion:' + id, () => reduceProbe(id))
await safe('textarea', () => story('components-textarea--default', () => page.evaluate(() => {
  const ta = document.querySelector('textarea'); if (!ta) return 'none'; const s = getComputedStyle(ta)
  return { fieldSizing: s.fieldSizing, resize: s.resize, overflowY: s.overflowY, rows: ta.rows, h: Math.round(ta.getBoundingClientRect().height) }
})))
await safe('tableNumbers', () => story('components-table--default', () => page.evaluate(() => {
  const cells = [...document.querySelectorAll('td,[role="rowheader"],[role="gridcell"]')]
  const num = cells.filter(c => /^[\s$€£]?-?[\d.,]+%?$/.test(c.textContent.trim()))
  return { cells: cells.length, numeric: num.length, tabular: num.filter(c => getComputedStyle(c).fontVariantNumeric.includes('tabular')).length, sample: num.slice(0,8).map(c => c.textContent.trim()), sampleTabular: num.slice(0,8).map(c => getComputedStyle(c).fontVariantNumeric) }
})))
await safe('modal', async () => {
  await page.goto(SB + 'components-modal--default&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(400)
  await page.locator('button:visible').first().click(); await page.waitForTimeout(100)
  const mid = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return 'none'; const s = getComputedStyle(d)
    return { anim: s.animationName, trans: s.transitionProperty + ' ' + s.transitionDuration, attrs: [...d.attributes].map(a => a.name).join(','), overscroll: s.overscrollBehaviorY } })
  await page.waitForTimeout(600)
  const settled = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? [...d.attributes].map(a => a.name).join(',') : 'gone' })
  return { mid, settled }
})
await safe('sheet', async () => {
  await page.goto(SB + 'components-sheet--default&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(400)
  await page.locator('button:visible').first().click(); await page.waitForTimeout(100)
  return page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return 'none'; const s = getComputedStyle(d)
    return { anim: s.animationName, trans: s.transitionProperty + ' ' + s.transitionDuration, attrs: [...d.attributes].map(a => a.name).join(','), transform: s.transform, width: s.width } })
})
await safe('selectList', async () => {
  await page.goto(SB + 'components-select--default&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(400)
  await page.locator('button:visible').first().click(); await page.waitForTimeout(250)
  return page.evaluate(() => { const l = document.querySelector('[role="listbox"]'); if (!l) return 'none'; const s = getComputedStyle(l)
    return { overflowY: s.overflowY, overscroll: s.overscrollBehaviorY, maxHeight: s.maxHeight, scrollHeight: l.scrollHeight, clientHeight: l.clientHeight } })
})
await safe('tooltip', async () => {
  await page.goto(SB + 'components-tooltip--default&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(400)
  await page.locator('button:visible').first().hover(); await page.waitForTimeout(700)
  return page.evaluate(() => { const t = document.querySelector('[role="tooltip"]'); if (!t) return 'none'; const s = getComputedStyle(t); return { anim: s.animationName, trans: s.transitionProperty + ' ' + s.transitionDuration, attrs: [...t.attributes].map(a=>a.name).join(',') } })
})
await browser.close()

