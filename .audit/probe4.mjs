import { chromium } from 'playwright'
const SB = 'http://localhost:6006/iframe.html?id='
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const log = (k, v) => console.log('@@' + k + ' ' + JSON.stringify(v))
const safe = async (k, fn) => { try { log(k, await fn()) } catch (e) { log(k, 'ERR ' + String(e).slice(0, 160)) } }
async function open(id) { await page.goto(SB + id + '&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(600) }
await safe('switchComputed', async () => {
  await open('components-switch--default')
  return page.evaluate(() => { const root = document.getElementById('storybook-root')
    const all = [...root.querySelectorAll('*')]
    const t = all.filter(el => getComputedStyle(el).transitionDuration !== '0s')
    return { rootChildren: root.children.length, nodes: all.length, withTransition: t.length, sample: t.slice(0,6).map(el => el.tagName + '.' + String(el.className).slice(0,60) + ' => ' + getComputedStyle(el).transitionProperty + ' ' + getComputedStyle(el).transitionDuration) } })
})
await safe('appInput', async () => {
  await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1000)
  const stops = []
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(80)
    stops.push(await page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el)
      const chain = []; let p = el; for (let j = 0; j < 4 && p; j++) { const ps = getComputedStyle(p); chain.push(p.tagName + '.' + String(p.className).slice(0, 60) + ' [outline ' + ps.outlineStyle + ' ' + ps.outlineWidth + ' ' + ps.outlineColor + ']'); p = p.parentElement }
      return { active: el.tagName, html: el.outerHTML.slice(0, 160), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, chain } }))
  }
  return stops
})
for (const [k, id] of [['modal','components-modal--default'],['sheet','components-sheet--default']]) await safe('triggers:' + k, async () => {
  await open(id)
  const info = await page.evaluate(() => [...document.querySelectorAll('#storybook-root button')].map(b => { const r = b.getBoundingClientRect()
    return { text: (b.textContent||'').trim().slice(0,20), aria: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(b).visibility, disp: getComputedStyle(b).display, cls: String(b.className).slice(0,40) } }))
  return info
})
await safe('modalOpen', async () => {
  await open('components-modal--default')
  await page.locator('#storybook-root button').first().click({ force: true, timeout: 4000 })
  await page.waitForTimeout(60)
  const mid = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return 'no dialog'; const s = getComputedStyle(d)
    const layer = d.closest('.react-aria-Overlay') || d.parentElement
    const ls = getComputedStyle(layer)
    return { dialog: { anim: s.animationName, trans: s.transitionProperty + ' ' + s.transitionDuration, opacity: s.opacity, transform: s.transform }, attrs: [...d.attributes].map(a => a.name).join(','), layerCls: String(layer.className).slice(0,60), layerAnim: ls.animationName + ' ' + ls.transitionProperty + ' ' + ls.transitionDuration, portalParent: d.closest('body > div')?.className } })
  await page.waitForTimeout(700)
  const settled = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? { attrs: [...d.attributes].map(a => a.name).join(','), anim: getComputedStyle(d).animationName } : 'gone' })
  return { mid, settled }
})
await safe('sheetOpen', async () => {
  await open('components-sheet--default')
  await page.locator('#storybook-root button').first().click({ force: true, timeout: 4000 })
  await page.waitForTimeout(60)
  return page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return 'no dialog'; const s = getComputedStyle(d)
    return { anim: s.animationName, trans: s.transitionProperty + ' / ' + s.transitionDuration, transform: s.transform, attrs: [...d.attributes].map(a => a.name).join(',') } })
})
await safe('tabsIndicator', async () => {
  await open('components-tabs--default')
  return page.evaluate(() => { const tabs = [...document.querySelectorAll('#storybook-root [role="tab"]')]
    return tabs.map(t => ({ text: (t.textContent||'').trim(), cls: String(t.className).slice(0, 50), after_trans: (s => s.transitionProperty + ' ' + s.transitionDuration)(getComputedStyle(t, '::after')), outline: getComputedStyle(t).outlineStyle })) })
})
await safe('sharedElement', async () => { const idx = await (await fetch('http://localhost:6006/index.json')).json()
  const s = Object.values(idx.entries).filter(e => e.type === 'story' && /Shared/i.test(e.title))
  return s.map(x => x.id) })
await browser.close()