/**
 * Runs axe-core against a list of public routes and reports violations by
 * impact. Used to produce the accessibility numbers quoted in the blog, so the
 * article cites a measurement rather than an industry average.
 *
 * Usage: node scripts/audit-a11y.mjs http://localhost:3000
 */
import { chromium } from 'playwright-core'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const AXE_PATH = require.resolve('axe-core/axe.min.js')

const BASE = process.argv[2] ?? 'http://localhost:3000'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const ROUTES = ['/', '/pricing', '/blog', '/blog/neo-brutalist-ui-components-react', '/dev/neo-brutalist']
const THEMES = ['parchment', 'grey']

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

let total = 0

for (const route of ROUTES) {
  for (const theme of THEMES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 90_000 })
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)

    // Colour tokens transition on theme change and hydration can still be
    // swapping classes. Sampling before both settle gave swings from 0 to 30
    // nodes on identical code — wait for a settled paint, then measure.
    await page.waitForTimeout(800)
    await page.addScriptTag({ path: AXE_PATH })

    const results = await page.evaluate(async () =>
      // WCAG 2.1 A/AA is the bar the rest of the codebase is held to.
      window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
    )

    const counts = results.violations.reduce((acc, v) => {
      acc[v.impact] = (acc[v.impact] ?? 0) + v.nodes.length
      return acc
    }, {})

    total += results.violations.length
    const summary = Object.entries(counts)
      .map(([impact, n]) => `${impact}:${n}`)
      .join(' ')

    console.log(
      `${results.violations.length === 0 ? 'PASS' : 'FAIL'} ${route} [${theme}] ` +
        `${results.violations.length} violations ${summary}`
    )

    for (const v of results.violations) {
      console.log(`   - ${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.help}`)
    }
  }
}

await browser.close()
console.log(`\ntotal violation types across all routes/themes: ${total}`)
process.exit(total === 0 ? 0 : 1)
