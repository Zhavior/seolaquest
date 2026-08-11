/**
 * Captures the /dev/neo-brutalist reference sheet in each theme, into
 * public/blog/. The blog post that documents this design system embeds the
 * output, so the article's screenshots are generated from the components it
 * describes rather than mocked up separately.
 *
 * Usage: node scripts/capture-primitives.mjs http://localhost:3000
 */
import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const OUT = 'public/blog'

// data-theme values come from app/globals.css.
const SHOTS = [
  { theme: 'parchment', file: 'neo-brutalist-primitives-light.png' },
  { theme: 'grey', file: 'neo-brutalist-primitives-dark.png' },
]

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })

await page.goto(`${BASE}/dev/neo-brutalist`, { waitUntil: 'networkidle', timeout: 90_000 })
await page.waitForSelector('h1')

for (const { theme, file } of SHOTS) {
  // ThemeScript owns this attribute at runtime; setting it directly is the same
  // switch the theme toggle performs.
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true })
  console.log(`wrote ${OUT}/${file}`)
}

await browser.close()
