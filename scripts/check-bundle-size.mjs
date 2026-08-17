#!/usr/bin/env node
/**
 * Per-route initial client JS budget for the prerendered routes.
 *
 * Why this exists: `@next/bundle-analyzer` is a webpack plugin and emits nothing
 * under a Turbopack build — `ANALYZE=true npm run build` silently produces no
 * report at all. That blind spot let `three` + `@react-three/fiber` sit in the
 * landing page's initial bundle (875 KB of 2,230 KB) for a decorative
 * background nobody could have justified paying for.
 *
 * How it measures: it reads the `<script src>` tags out of each prerendered
 * HTML file and sums those files on disk. That is exactly the set of JS the
 * browser fetches before the page is interactive, so the number cannot drift
 * from what users actually pay.
 *
 * Deliberately NOT used: the `entryJSFiles` list in each route's
 * client-reference-manifest. It contains only entry chunks, not the transitive
 * graph, and undercounts the landing page by roughly 3x (417 KB vs the 1,352 KB
 * the browser really fetches). A budget built on that would pass while a
 * regression sailed through a shared chunk.
 *
 * Scope limit, stated rather than hidden: only prerendered (static/SSG) routes
 * can be measured from the build output. The authenticated `/app/*` routes are
 * server-rendered on demand and need a real authenticated request, so they are
 * NOT covered here. Do not read a pass as "every route is within budget".
 *
 * Sizes are UNCOMPRESSED bytes, on purpose: uncompressed size tracks the
 * parse/compile cost that delays interactivity on mid-range phones, and it does
 * not move when a CDN changes its compression settings.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs            # enforce budgets, exit 1 on regression
 *   node scripts/check-bundle-size.mjs --report   # print every route, always exit 0
 */

import fs from 'node:fs'
import path from 'node:path'

const NEXT_DIR = '.next'
const APP_DIR = path.join(NEXT_DIR, 'server', 'app')
const KB = 1024

// Budgets sit just above the measured size at the time of writing, so any
// meaningful regression trips the gate. Raising one should be deliberate and
// reviewed — put the reason in the commit message.
//
// `/` is the route ad traffic lands on. It is the number that matters most, and
// it is the one that silently tripled before this script existed.
// Measured sizes when these were set: / 1236, /blog/[slug] 1110, /blog 1103,
// /pricing 1077, /landing 1076. Headroom is ~5%, which is enough for ordinary
// feature work and not enough to hide another library landing on a route.
const BUDGETS = {
  '/': 1300 * KB,
  '/blog': 1180 * KB,
  '/blog/[slug]': 1180 * KB,
  '/pricing': 1150 * KB,
  '/landing': 1150 * KB,
}

// Any prerendered route without its own budget still gets a ceiling, so a new
// heavy page cannot appear without either coming in under this or declaring a
// budget of its own. Highest undeclared route when set: /dev/onboarding at 1191.
const DEFAULT_BUDGET = 1260 * KB

/** Prerendered blog posts all share one template; collapse them to one budget. */
function routeNameFor(htmlPath) {
  const rel = path.relative(APP_DIR, htmlPath).replace(/\.html$/, '')
  if (rel === 'index') return '/'
  if (rel.startsWith('blog/')) return '/blog/[slug]'
  return '/' + rel
}

function initialJsFor(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8')

  // Both `<script src>` and the preload links Next emits for the same chunks
  // resolve to the same files; a Set collapses the duplicates.
  const refs = new Set()
  for (const m of html.matchAll(/\/_next\/(static\/[^"'\s]+?\.js)/g)) refs.add(m[1])

  let bytes = 0
  let missing = 0
  for (const ref of refs) {
    const onDisk = path.join(NEXT_DIR, ref)
    if (fs.existsSync(onDisk)) bytes += fs.statSync(onDisk).size
    else missing += 1
  }
  return { bytes, fileCount: refs.size, missing }
}

function findHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findHtml(full, out)
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

const htmlFiles = findHtml(APP_DIR)
if (htmlFiles.length === 0) {
  console.error(`No prerendered HTML under ${APP_DIR} — run \`npm run build\` first.`)
  process.exit(1)
}

// Collapse duplicate route names (the blog posts) to their largest instance, so
// the budget is checked against the worst case rather than an average.
const byRoute = new Map()
for (const file of htmlFiles) {
  const name = routeNameFor(file)
  const measured = initialJsFor(file)
  const existing = byRoute.get(name)
  if (!existing || measured.bytes > existing.bytes) byRoute.set(name, measured)
}

const rows = [...byRoute.entries()]
  .map(([route, m]) => ({ route, ...m }))
  .sort((a, b) => b.bytes - a.bytes)

const reportOnly = process.argv.includes('--report')
const failures = []
const pad = (s, n) => String(s).padEnd(n)

console.log('')
console.log(`${pad('route', 30)}${pad('initial JS', 13)}${pad('budget', 12)}files`)
console.log('-'.repeat(66))

for (const r of rows) {
  const budget = BUDGETS[r.route] ?? DEFAULT_BUDGET
  const declared = r.route in BUDGETS
  if (r.bytes > budget) failures.push({ ...r, budget })

  console.log(
    pad(r.route, 30) +
      pad(`${Math.round(r.bytes / KB)} KB`, 13) +
      pad(`${Math.round(budget / KB)} KB${declared ? '' : '*'}`, 12) +
      r.fileCount +
      (r.bytes > budget ? '   OVER' : ''),
  )
  if (r.missing) {
    console.log(`${' '.repeat(30)}warning: ${r.missing} referenced file(s) not on disk`)
  }
}

console.log('-'.repeat(66))
console.log("* no declared budget; using the default ceiling.")
console.log('Uncompressed initial client JS, read from the prerendered HTML.')
console.log('Not covered: the server-rendered /app/* routes (they need an authenticated request).')

if (reportOnly) {
  console.log('\n--report given: budgets not enforced.')
  process.exit(0)
}

if (failures.length) {
  console.error('\nBundle budget exceeded:\n')
  for (const f of failures) {
    console.error(
      `  ${f.route} is ${Math.round((f.bytes - f.budget) / KB)} KB over its ` +
        `${Math.round(f.budget / KB)} KB budget.`,
    )
  }
  console.error(
    '\nThe usual cause is a heavy module reaching a route through a static import\n' +
      'that should be `dynamic(() => import(...), { ssr: false })` — that is exactly\n' +
      'how three.js ended up on the landing page.\n' +
      'If the growth is intended, raise the budget here and say why in the commit.\n',
  )
  process.exit(1)
}

console.log('\nAll prerendered routes within budget.')
