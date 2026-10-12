import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
const log = (k, v) => console.log('@@' + k + ' ' + JSON.stringify(v))
const read = () => page.evaluate(() => {
  const rules = []
  for (const sheet of document.styleSheets) { try { for (const r of sheet.cssRules) rules.push(r.cssText) } catch (e) {} }
  const all = rules.join('\n')
  const count = (s) => all.split(s).length - 1
  return { sheets: document.styleSheets.length, chars: all.length,
    keyframes: [...all.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]).slice(0, 20),
    reducedMotionRules: count('prefers-reduced-motion'),
    tabular: count('tabular-nums'), overflowClip: count('overflow:clip') + count('overflow: clip'),
    easing: count('cubic-bezier(0.4,0,0.2,1)'),
    hoverMedia: count('hover:hover') + count('hover: hover'),
    focusedRules: count('data-focused'), entering: count('entering'),
    transitionProps: [...new Set([...all.matchAll(/transition-property:\s*([^;}]+)/g)].map(m => m[1].trim()))].slice(0, 30),
    durations: [...new Set([...all.matchAll(/transition-duration:\s*([^;}]+)/g)].map(m => m[1].trim()))].slice(0, 20),
    hasFocusVisible: count('focus-visible'), outlineNone: count('outline-style:none'),
  } })
await page.goto('http://localhost:6006/iframe.html?id=components-switch--default&viewMode=story', { waitUntil: 'load' }); await page.waitForTimeout(800)
log('storybookCSS', await read())
await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(1200)
log('appCSS', await read())
await browser.close()