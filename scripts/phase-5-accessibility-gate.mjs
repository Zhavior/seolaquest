#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const manifestPath = join(projectRoot, 'tests', 'accessibility', 'public-routes.json')
const commandTimeoutMs = 20_000

function failPrerequisite(message) {
  console.error(`ACCESSIBILITY GATE PREREQUISITE FAILED: ${message}`)
  process.exit(2)
}

function parseArguments(argv) {
  const options = { baseUrl: process.env.A11Y_BASE_URL || 'http://127.0.0.1:3000' }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--base-url') {
      options.baseUrl = argv[index + 1]
      index += 1
    } else if (argument === '--help' || argument === '-h') {
      console.log('Usage: node scripts/phase-5-accessibility-gate.mjs [--base-url http://127.0.0.1:3000]')
      process.exit(0)
    } else {
      failPrerequisite(`unknown argument: ${argument}`)
    }
  }

  if (!options.baseUrl) failPrerequisite('--base-url requires a value')

  try {
    const parsed = new URL(options.baseUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol')
    options.baseUrl = parsed.href.replace(/\/$/, '')
  } catch {
    failPrerequisite(`invalid base URL: ${options.baseUrl}`)
  }

  return options
}

async function fileExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function findChrome() {
  const candidates = [
    process.env.A11Y_CHROME_PATH,
    (() => {
      try {
        return require('@playwright/test').chromium.executablePath()
      } catch {
        return null
      }
    })(),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate
  }

  return null
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

async function waitForJson(url, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  let lastError

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await delay(100)
  }

  throw new Error(`timed out waiting for ${url}: ${lastError?.message || 'no response'}`)
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl
    this.socket = null
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl)

    await new Promise((resolveConnection, rejectConnection) => {
      const timeout = setTimeout(() => rejectConnection(new Error('timed out connecting to Chrome')), commandTimeoutMs)
      this.socket.addEventListener('open', () => {
        clearTimeout(timeout)
        resolveConnection()
      }, { once: true })
      this.socket.addEventListener('error', () => {
        clearTimeout(timeout)
        rejectConnection(new Error('Chrome debugging socket failed'))
      }, { once: true })
    })

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        clearTimeout(pending.timeout)
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`))
        else pending.resolve(message.result)
        return
      }

      const listeners = this.listeners.get(message.method)
      if (!listeners) return
      for (const listener of [...listeners]) listener(message.params)
    })

    this.socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timeout)
        pending.reject(new Error(`Chrome closed while waiting for ${pending.method}`))
      }
      this.pending.clear()
    })
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1

    return new Promise((resolveCommand, rejectCommand) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        rejectCommand(new Error(`${method} timed out after ${commandTimeoutMs}ms`))
      }, commandTimeoutMs)

      this.pending.set(id, { method, resolve: resolveCommand, reject: rejectCommand, timeout })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || new Set()
    listeners.add(listener)
    this.listeners.set(method, listeners)
    return () => listeners.delete(listener)
  }

  waitFor(method, timeoutMs = commandTimeoutMs) {
    return new Promise((resolveEvent, rejectEvent) => {
      let removeListener
      const timeout = setTimeout(() => {
        removeListener?.()
        rejectEvent(new Error(`${method} did not fire within ${timeoutMs}ms`))
      }, timeoutMs)

      removeListener = this.on(method, (params) => {
        clearTimeout(timeout)
        removeListener()
        resolveEvent(params)
      })
    })
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })

    if (response.exceptionDetails) {
      const description = response.exceptionDetails.exception?.description || response.exceptionDetails.text
      throw new Error(`browser evaluation failed: ${description}`)
    }

    return response.result.value
  }

  close() {
    this.socket?.close()
  }
}

async function launchBrowser(chromePath, axeSource) {
  const profileDirectory = await mkdtemp(join(tmpdir(), 'coquest-a11y-chrome-'))
  const chrome = spawn(chromePath, [
    '--headless=new',
    // GitHub's Ubuntu runners disable unprivileged user namespaces, so Chrome's
    // sandbox cannot start and the browser aborts before it ever writes
    // DevToolsActivePort. Dropping the sandbox is safe here and only here: the
    // gate loads our own production build on localhost and nothing else. Local
    // runs keep the sandbox, so this stays a CI-only concession.
    ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-features=MediaRouter,OptimizationHints,Translate',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })

  let chromeErrors = ''
  chrome.stderr.on('data', (chunk) => {
    chromeErrors += chunk.toString()
    if (chromeErrors.length > 8_000) chromeErrors = chromeErrors.slice(-8_000)
  })

  const activePortPath = join(profileDirectory, 'DevToolsActivePort')
  const deadline = Date.now() + 10_000
  let debuggingPort

  while (Date.now() < deadline) {
    if (chrome.exitCode !== null) {
      throw new Error(`Chrome exited before startup (code ${chrome.exitCode}): ${chromeErrors.trim()}`)
    }

    try {
      const contents = await readFile(activePortPath, 'utf8')
      debuggingPort = Number(contents.split(/\r?\n/)[0])
      if (Number.isInteger(debuggingPort)) break
    } catch {
      // Chrome writes DevToolsActivePort after its profile is ready.
    }
    await delay(100)
  }

  if (!debuggingPort) {
    chrome.kill('SIGTERM')
    throw new Error(`Chrome did not expose a debugging port: ${chromeErrors.trim()}`)
  }

  const browserVersion = await waitForJson(`http://127.0.0.1:${debuggingPort}/json/version`)
  const pageResponse = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about%3Ablank`, { method: 'PUT' })
  if (!pageResponse.ok) throw new Error(`Chrome could not create a test page: HTTP ${pageResponse.status}`)
  const page = await pageResponse.json()
  const client = new CdpClient(page.webSocketDebuggerUrl)
  await client.connect()
  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Network.enable'),
  ])
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: axeSource })

  return {
    browserVersion: browserVersion.Browser,
    client,
    async close() {
      client.close()
      chrome.kill('SIGTERM')
      await Promise.race([
        new Promise((resolveExit) => chrome.once('exit', resolveExit)),
        delay(2_000),
      ])
      if (chrome.exitCode === null) chrome.kill('SIGKILL')
      await rm(profileDirectory, { recursive: true, force: true })
    },
  }
}

async function setViewport(client, profile) {
  await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: profile.width,
    height: profile.height,
    deviceScaleFactor: 1,
    mobile: profile.mobile,
    screenWidth: profile.width,
    screenHeight: profile.height,
  })
  await client.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{
      name: 'prefers-reduced-motion',
      value: profile.reducedMotion ? 'reduce' : 'no-preference',
    }],
  })
}

async function waitForDocument(client) {
  const deadline = Date.now() + commandTimeoutMs
  while (Date.now() < deadline) {
    const state = await client.evaluate('document.readyState')
    if (state === 'complete') break
    await delay(50)
  }

  await client.evaluate(`(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  })()`)
  // Let finite entrance transitions settle before axe samples blended colors.
  // Reduced-motion profiles are still checked separately for running motion.
  await delay(800)
}

async function navigate(client, url) {
  const loadEvent = client.waitFor('Page.loadEventFired').catch(() => null)
  const navigation = await client.send('Page.navigate', { url })
  if (navigation.errorText) throw new Error(`navigation failed: ${navigation.errorText}`)
  await loadEvent
  await waitForDocument(client)
}

async function waitForTitle(client, expectedTitle) {
  const deadline = Date.now() + 5_000
  let title = ''
  while (Date.now() < deadline) {
    title = await client.evaluate('document.title')
    if (title === expectedTitle) return title
    await delay(100)
  }
  return title
}

const pageInspectionExpression = `(() => {
  const isVisible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const countVisible = (selector) => [...document.querySelectorAll(selector)].filter(isVisible).length;
  const root = document.scrollingElement || document.documentElement;
  const clientWidth = document.documentElement.clientWidth;
  const overflowPixels = Math.max(0, Math.ceil(root.scrollWidth - clientWidth));
  const overflowElements = overflowPixels > 1
    ? [...document.querySelectorAll('body *')]
        .filter(isVisible)
        .map((element) => ({
          element,
          rect: element.getBoundingClientRect(),
        }))
        .filter(({ rect }) => rect.right > clientWidth + 1 || rect.left < -1)
        .slice(0, 5)
        .map(({ element, rect }) => ({
          selector: element.id ? '#' + CSS.escape(element.id) : element.tagName.toLowerCase() + (element.classList.length ? '.' + [...element.classList].slice(0, 2).map((name) => CSS.escape(name)).join('.') : ''),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        }))
    : [];
  const navigation = performance.getEntriesByType('navigation')[0];
  const undersizedTouchTargets = [...document.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"]')]
    .filter(isVisible)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        selector: element.id ? '#' + CSS.escape(element.id) : element.tagName.toLowerCase() + (element.classList.length ? '.' + [...element.classList].slice(0, 2).map((name) => CSS.escape(name)).join('.') : ''),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })
    .filter(({ width, height }) => width < 44 || height < 44)
    .slice(0, 10);

  return {
    contentLength: document.body.innerText.trim().length,
    finalUrl: location.href,
    status: navigation?.responseStatus || 0,
    overflowPixels,
    overflowElements,
    undersizedTouchTargets,
    landmarks: {
      main: countVisible('main, [role="main"]'),
      navigation: countVisible('nav, [role="navigation"]'),
      banner: countVisible('body > header, [role="banner"]'),
      contentinfo: countVisible('body > footer, [role="contentinfo"]'),
    },
  };
})()`

const reducedMotionExpression = `(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const parseDurations = (value) => value.split(',').map((entry) => {
    const trimmed = entry.trim();
    if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed);
    if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000;
    return 0;
  });
  const offenders = [];

  for (const element of document.querySelectorAll('body *')) {
    const style = getComputedStyle(element);
    const animationMs = Math.max(0, ...parseDurations(style.animationDuration));
    const transitionMs = Math.max(0, ...parseDurations(style.transitionDuration));
    if (animationMs > 50 || transitionMs > 50) {
      offenders.push({
        selector: element.id ? '#' + CSS.escape(element.id) : element.tagName.toLowerCase() + (element.classList.length ? '.' + [...element.classList].slice(0, 2).map((name) => CSS.escape(name)).join('.') : ''),
        animationMs,
        transitionMs,
      });
      if (offenders.length === 5) break;
    }
  }

  const longRunningAnimations = document.getAnimations({ subtree: true })
    .filter((animation) => {
      const timing = animation.effect?.getComputedTiming?.();
      return animation.playState === 'running' && (timing?.activeDuration > 50 || timing?.activeDuration === Infinity);
    })
    .slice(0, 5)
    .map((animation) => ({
      id: animation.id || animation.animationName || '(unnamed)',
      playState: animation.playState,
    }));

  return {
    preferenceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    offenders,
    longRunningAnimations,
  };
})()`

const axeExpression = `(async () => {
  if (!globalThis.axe?.run) throw new Error('axe-core was not injected into the rendered page');
  const results = await axe.run(document, {
    resultTypes: ['violations'],
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
  });
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.slice(0, 3).map((node) => ({
        target: node.target.join(' '),
        summary: node.failureSummary,
      })),
      nodeCount: violation.nodes.length,
    }));
})()`

async function inspectProfile(client, route, baseUrl, profile) {
  await setViewport(client, profile)
  const routeUrl = new URL(route.path, `${baseUrl}/`).href
  await navigate(client, routeUrl)
  const title = await waitForTitle(client, route.title)
  const page = await client.evaluate(pageInspectionExpression)
  const axeViolations = await client.evaluate(axeExpression)
  const reducedMotion = profile.reducedMotion
    ? await client.evaluate(reducedMotionExpression)
    : null

  return { profile: profile.name, title, page, axeViolations, reducedMotion }
}

async function inspectZoom(client) {
  try {
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 })
    await delay(100)
    const result = await client.evaluate(`(() => ({
      supported: Boolean(window.visualViewport),
      scale: window.visualViewport?.scale || 1,
      contentLength: document.body.innerText.trim().length,
      mainCount: document.querySelectorAll('main, [role="main"]').length,
    }))()`)
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })
    return result
  } catch (error) {
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 }).catch(() => {})
    return { supported: false, reason: error.message }
  }
}

function evaluateRoute(route, desktop, narrow, zoom, baseUrl) {
  const failures = []
  const expectedUrl = new URL(route.path, `${baseUrl}/`)

  for (const result of [desktop, narrow]) {
    const label = result.profile
    let finalUrl
    try {
      finalUrl = new URL(result.page.finalUrl)
    } catch {
      failures.push(`${label}: browser ended on an invalid URL (${result.page.finalUrl})`)
    }

    if (result.page.status && result.page.status >= 400) {
      failures.push(`${label}: document returned HTTP ${result.page.status}`)
    }
    if (finalUrl && (finalUrl.origin !== expectedUrl.origin || finalUrl.pathname !== expectedUrl.pathname)) {
      failures.push(`${label}: redirected to ${finalUrl.href}`)
    }
    if (result.page.contentLength === 0) failures.push(`${label}: rendered body is blank`)
    if (result.title !== route.title) {
      failures.push(`${label}: title was ${JSON.stringify(result.title)}, expected ${JSON.stringify(route.title)}`)
    }
    if (result.page.landmarks.main !== 1) {
      failures.push(`${label}: expected exactly one visible main landmark, found ${result.page.landmarks.main}`)
    }
    for (const landmark of route.requiredLandmarks) {
      if (!result.page.landmarks[landmark]) failures.push(`${label}: missing required ${landmark} landmark`)
    }
    if (result.page.overflowPixels > 1) {
      const culprits = result.page.overflowElements.map((item) => `${item.selector} (${item.left}..${item.right})`).join(', ')
      failures.push(`${label}: horizontal overflow by ${result.page.overflowPixels}px${culprits ? `; possible sources: ${culprits}` : ''}`)
    }
    if (label === 'narrow-320/reduced-motion' && result.page.undersizedTouchTargets.length) {
      const targets = result.page.undersizedTouchTargets
        .map((item) => `${item.selector} (${item.width}x${item.height})`)
        .join(', ')
      failures.push(`${label}: interactive touch targets smaller than 44x44px: ${targets}`)
    }
    for (const violation of result.axeViolations) {
      const targets = violation.nodes
        .map((node) => `${node.target}: ${node.summary || 'no failure summary'}`)
        .join(' | ')
      failures.push(`${label}: axe ${violation.impact} ${violation.id} (${violation.nodeCount} node${violation.nodeCount === 1 ? '' : 's'}): ${targets}; ${violation.helpUrl}`)
    }
  }

  if (!narrow.reducedMotion?.preferenceMatches) {
    failures.push('narrow/reduced-motion: browser did not apply prefers-reduced-motion: reduce')
  }
  if (narrow.reducedMotion?.offenders.length) {
    failures.push(`narrow/reduced-motion: durations over 50ms remained on ${narrow.reducedMotion.offenders.map((item) => item.selector).join(', ')}`)
  }
  if (narrow.reducedMotion?.longRunningAnimations.length) {
    failures.push(`narrow/reduced-motion: long-running animations remained (${narrow.reducedMotion.longRunningAnimations.map((item) => item.id).join(', ')})`)
  }

  if (zoom.supported) {
    if (zoom.scale < 1.9) failures.push(`zoom: requested 200% but visual viewport scale was ${zoom.scale}`)
    if (!zoom.contentLength || zoom.mainCount !== 1) failures.push('zoom: meaningful main content was not preserved at 200%')
  }

  return failures
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    failPrerequisite(`cannot read ${manifestPath}: ${error.message}`)
  }

  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.routes) || manifest.routes.length === 0) {
    failPrerequisite('public-routes.json must contain schemaVersion 1 and at least one route')
  }

  const routePaths = new Set()
  const expectedTitles = new Set()
  for (const route of manifest.routes) {
    if (!route.path?.startsWith('/') || !route.title || !Array.isArray(route.requiredLandmarks)) {
      failPrerequisite(`invalid route manifest entry: ${JSON.stringify(route)}`)
    }
    if (routePaths.has(route.path)) failPrerequisite(`duplicate route path in manifest: ${route.path}`)
    if (expectedTitles.has(route.title)) failPrerequisite(`duplicate expected route title in manifest: ${route.title}`)
    routePaths.add(route.path)
    expectedTitles.add(route.title)
  }

  let axePath
  try {
    axePath = require.resolve('axe-core/axe.min.js')
  } catch {
    failPrerequisite('axe-core is missing; install the locked dependencies with npm ci')
  }

  const chromePath = await findChrome()
  if (!chromePath) {
    failPrerequisite('Chrome/Chromium is missing; set A11Y_CHROME_PATH to a compatible executable')
  }

  try {
    const response = await fetch(options.baseUrl, { redirect: 'manual', signal: AbortSignal.timeout(5_000) })
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    failPrerequisite(`app is not reachable at ${options.baseUrl}: ${error.message}`)
  }

  const axeSource = await readFile(axePath, 'utf8')
  const browser = await launchBrowser(chromePath, axeSource)
  const profiles = {
    desktop: { name: 'desktop', width: 1280, height: 900, mobile: false, reducedMotion: false },
    narrow: { name: 'narrow-320/reduced-motion', width: 320, height: 800, mobile: true, reducedMotion: true },
  }

  console.log('CoQuest phase 5 accessibility release gate')
  console.log(`Base URL: ${options.baseUrl}`)
  console.log(`Browser: ${browser.browserVersion}`)
  console.log(`axe-core: ${require('axe-core/package.json').version}`)
  console.log(`Coverage: ${manifest.routes.length} routes; 1280px desktop; 320px narrow + reduced motion; 200% zoom capability`)

  const results = []
  try {
    for (const route of manifest.routes) {
      try {
        const desktop = await inspectProfile(browser.client, route, options.baseUrl, profiles.desktop)
        const zoom = await inspectZoom(browser.client)
        const narrow = await inspectProfile(browser.client, route, options.baseUrl, profiles.narrow)
        const failures = evaluateRoute(route, desktop, narrow, zoom, options.baseUrl)
        results.push({ route, failures, zoom })
        console.log(`${failures.length ? 'FAIL' : 'PASS'} ${route.path} — ${route.title}`)
        for (const failure of failures) console.log(`  - ${failure}`)
        if (!zoom.supported) console.log(`  - INFO zoom check unsupported: ${zoom.reason || 'visualViewport unavailable'}`)
      } catch (error) {
        const failure = `gate execution failed: ${error.message}`
        results.push({ route, failures: [failure], zoom: { supported: false } })
        console.log(`FAIL ${route.path} — ${route.title}`)
        console.log(`  - ${failure}`)
      }
    }
  } finally {
    await browser.close()
  }

  const failedRoutes = results.filter((result) => result.failures.length > 0)
  const violationCount = results.reduce((total, result) => total + result.failures.length, 0)
  console.log(`Summary: ${results.length - failedRoutes.length}/${results.length} routes passed; ${violationCount} gate failure${violationCount === 1 ? '' : 's'}`)

  if (failedRoutes.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(`ACCESSIBILITY GATE CRASHED: ${error.stack || error.message}`)
  process.exitCode = 2
})
