/**
 * A copy of an element, off the page, for reading a value that nothing can have hovered.
 *
 * **This exists because of a measurement, not a preference.** Two stories assert a *resting* colour —
 * the caps link's 70% and the outline button's 40% hairline — and on CI the real pointer was sitting on
 * the element under test: `matches(':hover')` read true, and React Aria's `data-hovered` with it, so
 * both stories read the **hovered** colour and failed on a runner where they pass locally.
 *
 * `userEvent.unhover` cannot clear that, and the story that already called it — with a one-second
 * `waitFor` after it — is the proof: it fires synthetic events, and the browser's `:hover` obeys a real
 * pointer only. Nor can a test move that pointer: this environment's `userEvent.pointer` is synthetic
 * too, measured by hovering an element and watching `:hover` stay false.
 *
 * A copy carries the same classes, and with them the same custom properties, and nothing can hover it
 * nine thousand pixels off the page. What it asserts is the recipe — "the caps link rests at 70%, not at
 * the trail's 45%" — which is what those assertions were always about.
 */
export function restCopy(el: Element, parent: Element): HTMLElement {
  const copy = el.cloneNode(true) as HTMLElement
  // The copy inherits whatever interaction state the original was in; the recipe is what is wanted.
  for (const state of [
    'data-hovered',
    'data-pressed',
    'data-focus-visible',
    'data-focus-within',
  ]) {
    copy.removeAttribute(state)
  }
  copy.style.position = 'fixed'
  copy.style.left = '-9999px'
  copy.style.top = '0'
  parent.appendChild(copy)
  return copy
}
