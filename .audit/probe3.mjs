import { chromium } from 'playwright'
const SB = 'http://localhost:6006/iframe.html?id='
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const log = (k, v) => console.log('@@' + k + ' ' + JSON.stringify(v))
const safe = async (k, fn) => { try { log(k, await fn()) } catch (e) { log(k, 'ERR ' + String(e).slice(0, 200)) } }
async function open(id) { await page.goto(SB + id + '&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(500) }
await safe('focusRing', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1000)
  const seen = []
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(60)
    seen.push(await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return 'body'
      const s = getComputedStyle(el)
      return { tag: el.tagName, t: (el.textContent||'').trim().slice(0,14), outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow.slice(0,50) } }))
  }
  return seen
})
await safe('focusRingButtonStory', async () => {
  await open('components-button--default')
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Tab'); await page.waitForTimeout(150)
  return page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el)
    return { tag: el.tagName, text: (el.textContent||'').trim().slice(0,20), outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, rect: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)] } })
})
async function motionProbe(id) {
  const read = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root *')].map(el => { const s = getComputedStyle(el)
      const t = s.transitionProperty + ' | ' + s.transitionDuration + ' | ' + s.animationName
      return (s.transitionDuration === '0s' && s.animationName === 'none') ? null : { tag: el.tagName, cls: String(el.className).slice(0, 50), t } }).filter(Boolean))
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await open(id); const normal = await read()
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(id); const reduced = await read()
  await page.emulateMedia({ reducedMotion: null })
  return { normal: normal.slice(0, 8), reducedStill: reduced.slice(0, 8), counts: [normal.length, reduced.length] }
}
for (const [k, id] of [['slider','components-slider--default'],['accordion','components-accordion--default'],['switch','components-switch--default'],['tabs','components-tabs--default'],['checkbox','components-checkbox--default']]) await safe('motion:' + k, () => motionProbe(id))
await safe('accordionPanel', async () => {
  await open('components-accordion--default')
  const before = await page.evaluate(() => { const p = document.querySelector('#storybook-root [role="region"]'); const s = p ? getComputedStyle(p) : null
    return { transition: s ? s.transitionProperty + ' ' + s.transitionDuration : 'no region', interpolate: getComputedStyle(document.documentElement).interpolateSize } })
  await page.locator('#storybook-root button').first().click()
  const during = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role="region"], #storybook-root [role="group"]')].map(e => { const s = getComputedStyle(e)
    return { tag: e.tagName, transition: s.transitionProperty + ' ' + s.transitionDuration, h: Math.round(e.getBoundingClientRect().height), anim: s.animationName } }))
  await page.waitForTimeout(600)
  const after = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role="region"]')].map(e => Math.round(e.getBoundingClientRect().height)))
  return { before, during, after }
})
for (const [k, id] of [['modal','components-modal--default'],['sheet','components-sheet--default'],['popover','components-popover--default']]) await safe('overlay:' + k, async () => {
  await open(id)
  const btn = page.locator('#storybook-root button').first()
  const box = await btn.boundingBox(); if (!box || !box.width) return 'no visible trigger'
  await btn.click({ timeout: 5000 }); await page.waitForTimeout(80)
  const mid = await page.evaluate(() => { const list = [...document.querySelectorAll('[role="dialog"], [role="tooltip"], .react-aria-Popover, [data-rac]')].filter(d => d.closest('#storybook-root'))
    const d = list[0]; if (!d) return 'none'; const s = getComputedStyle(d)
    return { tag: d.tagName, anim: s.animationName, trans: s.transitionProperty + ' ' + s.transitionDuration, attrs: [...d.attributes].map(a => a.name).join(','), transform: s.transform.slice(0, 40) } })
  await page.waitForTimeout(500)
  const settled = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? [...d.attributes].map(a => a.name).join(',') : 'nothing-open' })
  return { mid, settled }
})
await safe('clippedDetail', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1000)
  return page.evaluate(() => [...document.querySelectorAll('*')].filter(el => { const s = getComputedStyle(el); return s.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 2 })
    .map(el => ({ tag: el.tagName, cls: String(el.className).slice(0, 40), sh: el.scrollHeight, ch: el.clientHeight, parent: (el.parentElement?.tagName || '') + '.' + String(el.parentElement?.className || '').slice(0, 30) })).slice(0, 10))
})
await safe('smallTargets', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1000)
  return page.evaluate(() => [...document.querySelectorAll('button,[role="button"],a')]
    .filter(el => { const r = el.getBoundingClientRect(); const txt = (el.textContent||'').trim(); return r.width > 0 && r.height > 0 && r.height < 44 && r.width < 44 && txt.length <= 2 })
    .map(el => { const r = el.getBoundingClientRect(); return { txt: (el.textContent||'').trim().slice(0,6), aria: el.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), cls: String(el.className).slice(0, 44) } }).slice(0, 14))
})
await safe('avatar', async () => {
  await open('components-avatar--default')
  return page.evaluate(() => { const img = document.querySelector('#storybook-root img')
    if (!img) return [...document.querySelectorAll('#storybook-root *')].slice(0,4).map(e => e.tagName + '.' + String(e.className).slice(0, 40))
    const s = getComputedStyle(img); const r = img.getBoundingClientRect()
    return { objectFit: s.objectFit, aspectRatio: s.aspectRatio, w: Math.round(r.width), h: Math.round(r.height), parentOverflow: getComputedStyle(img.parentElement).overflow } })
})
await browser.close()