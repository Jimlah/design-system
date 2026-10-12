/**
 * The app's global stylesheet, for the `*.browser.test.tsx` files.
 *
 * **Browser mode's whole advantage over a DOM-simulating test is real CSS** — a computed colour, a
 * control's height, a focus ring. That only means anything if the sheet is actually loaded, and a
 * test file that imports only a component gets the UA defaults instead: `bg-teal` resolves to
 * nothing and every colour assertion quietly compares two transparent values.
 *
 * Stories have had a place for this from the start — `.storybook/preview.tsx` imports the same file
 * — so this is the component-test equivalent of that line, referenced by `setupFiles` on the
 * `components` project in vite.config.ts.
 */
import './styles.css'
