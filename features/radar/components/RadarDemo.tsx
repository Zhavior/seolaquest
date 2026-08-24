'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  Ban,
  Braces,
  Check,
  Copy,
  Crosshair,
  ExternalLink,
  Flame,
  MessageSquare,
  Play,
  Radar,
  Send,
  Sliders,
  Sparkles,
  SquareArrowOutUpRight,
  Target,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { sfx } from '@/lib/sfx'
import {
  ACTION_LIST,
  PAIN_LIST,
  PREY_LIST,
  SAMPLE_ROW_COUNT,
  SAMPLE_TARGETS,
  SCOPE_FILTERS,
  rawRecord,
  rejectedRowCount,
  type ActionId,
  type Pain,
  type Prey,
  type SampleTarget,
} from '../data/sample-targets'
import { HudStory } from './HudStory'
import { RadarScope } from './RadarScope'
import { Reveal } from './Reveal'
import { ReplyDrawer } from './ReplyDrawer'

type TerminalLine = { text: string; type: 'input' | 'output' | 'system' }

/** One line of the execution log shown while a scan runs. */
type TelemetryLine = { key: string; label: string; value: string; tone: string }

/**
 * `lib/sfx` owns the mute preference but publishes no change events, so the
 * toggle is wrapped in the smallest possible store: subscribers here, one
 * notify on write.
 */
const soundListeners = new Set<() => void>()

function subscribeToSound(onChange: () => void) {
  soundListeners.add(onChange)
  return () => {
    soundListeners.delete(onChange)
  }
}

function toggleSoundPreference() {
  const enabled = sfx.toggle()
  soundListeners.forEach((listener) => listener())
  return enabled
}

const INITIAL_TERMINAL: TerminalLine[] = [
  { text: 'SEOlaQuest radar simulator — sample data only, no live accounts are queried.', type: 'system' },
  { text: "Type 'help' for the command list.", type: 'system' },
]

/** Total execution time of a scan, in ms. Each telemetry line lands inside it. */
const SCAN_DURATION_MS = 800
const TELEMETRY_STEP_MS = 180

/** Shared chrome. Every panel on the page is the same slab. */
const PANEL = 'border-4 border-outline bg-card shadow-brutal'
const EYEBROW =
  'inline-flex items-center gap-2 border-2 border-outline bg-accent px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-on-accent shadow-brutal sm:text-xs'
const HEADING = 'text-3xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl lg:text-5xl'

const RARITY_STYLE: Record<SampleTarget['rarity'], string> = {
  LEGENDARY: 'bg-accent text-on-accent',
  EPIC: 'bg-[#7C3AED] text-white',
  RARE: 'bg-[#16A34A] text-white',
  COMMON: 'bg-inset text-ink',
}

const SOURCE_STYLE: Record<SampleTarget['source'], string> = {
  Reddit: 'bg-accent-2 text-white',
  X: 'bg-ink text-ink-inverse',
}

/** Renders the chosen action's output for a target. Pure — safe during render. */
function draftFor(action: ActionId, target: SampleTarget): string {
  switch (action) {
    case 'reply':
      return target.suggestedReply
    case 'dm':
      return `Hi — saw your ${target.competitor} thread about ${target.painPoint.toLowerCase()}.\n\nNot pitching: we went through the same migration and kept notes on what broke. Happy to send them over if that is useful. Either way, good luck with the deadline.`
    case 'webhook':
      return JSON.stringify(
        {
          event: 'radar.target.matched',
          sample: true,
          target: {
            id: target.id,
            source: target.source,
            handle: target.handle,
            competitor: target.competitor,
            pain: target.painPoint,
            demo_score: target.intentScore,
          },
        },
        null,
        2,
      )
    case 'export':
      return [
        'source,handle,competitor,pain,demo_score',
        `${target.source},${target.handle},${target.competitor},"${target.painPoint}",${target.intentScore}`,
      ].join('\n')
  }
}

/**
 * The interactive half of the radar simulator: scope, scan builder, telemetry,
 * output panes and the command line.
 *
 * Split out from the `/radar` page so the landing page can mount the same demo
 * without inheriting that page's hero, pricing table or chrome. All the state
 * lives here, which is what makes it portable — the host page only decides
 * where it sits.
 */
export function RadarDemo() {
  const prefersReducedMotion = usePrefersReducedMotion()

  // The audio preference lives in `lib/sfx` (and in localStorage), which makes
  // it external state: read through `useSyncExternalStore` so the server render
  // uses the module default and the client re-reads the stored preference after
  // hydration, instead of mismatching on the first paint.
  const soundOn = useSyncExternalStore(subscribeToSound, () => sfx.isEnabled(), () => true)

  const [filter, setFilter] = useState<(typeof SCOPE_FILTERS)[number]>('All')
  const [pickedId, setPickedId] = useState(SAMPLE_TARGETS[0].id)

  const [prey, setPrey] = useState<Prey>('Salesforce')
  const [pain, setPain] = useState<Pain>('Pricing revolt')
  const [action, setAction] = useState<ActionId>('reply')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ target: SampleTarget; note: string | null } | null>(
    null,
  )

  // Telemetry is revealed line by line during the run and then left on screen,
  // so the output panes keep the record of which query produced them.
  const [telemetry, setTelemetry] = useState<TelemetryLine[]>([])
  const [revealed, setRevealed] = useState(0)
  const [showRawJson, setShowRawJson] = useState(false)

  // The HUD runs the intro deck until it finishes or is dismissed, after which
  // the panel is the interactive scope and stays that way unless replayed.
  const [storyOpen, setStoryOpen] = useState(false)
  const [storySettled, setStorySettled] = useState(false)

  const [drawerTarget, setDrawerTarget] = useState<SampleTarget | null>(null)
  const [copied, setCopied] = useState(false)
  const [paneCopied, setPaneCopied] = useState(false)

  const [scanCount, setScanCount] = useState(0)
  const [terminal, setTerminal] = useState<TerminalLine[]>(INITIAL_TERMINAL)
  const [command, setCommand] = useState('')
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const terminalScrollRef = useRef<HTMLDivElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)

  // Every deferred state update is tracked so unmounting mid-timeout cannot
  // write to a dead component.
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const defer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
  }, [])
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => timeouts.forEach(clearTimeout)
  }, [])

  const closeStory = useCallback(() => {
    setStoryOpen(false)
    setStorySettled(true)
  }, [])

  const replayStory = useCallback(() => {
    sfx.playHoverBlip()
    setStoryOpen(true)
  }, [])

  /**
   * The deck opens once, on arrival. Deferred by a tick because the decision
   * reads `window.scrollY`, which is not a render-time value, and because
   * opening it is a state write that does not belong in an effect body.
   */
  useEffect(() => {
    if (storySettled) return
    const start = setTimeout(() => {
      if (window.scrollY > 120 || prefersReducedMotion) setStorySettled(true)
      else setStoryOpen(true)
    }, 0)
    return () => clearTimeout(start)
  }, [prefersReducedMotion, storySettled])

  /** Ran to the end: hand the reader down to the scan builder. */
  const finishStory = useCallback(() => {
    setStoryOpen(false)
    setStorySettled(true)
    // One frame later: closing the deck swaps the panel, and scrolling before
    // that commit aims at a layout that is about to change height.
    requestAnimationFrame(() => {
      document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const visibleTargets = useMemo(
    () =>
      filter === 'All'
        ? SAMPLE_TARGETS
        : SAMPLE_TARGETS.filter((target) => target.painPoint === filter),
    [filter],
  )

  // Derived rather than corrected in an effect: when a filter hides the locked
  // target the first visible one takes over immediately, with no intermediate
  // render where the detail card describes a thread the scope no longer shows.
  const selected =
    visibleTargets.find((target) => target.id === pickedId) ??
    visibleTargets[0] ??
    SAMPLE_TARGETS[0]

  const actionMeta = ACTION_LIST.find((entry) => entry.id === action) ?? ACTION_LIST[0]

  const toggleSound = () => {
    if (toggleSoundPreference()) sfx.playHoverBlip()
  }

  const selectTarget = (target: SampleTarget) => {
    closeStory()
    sfx.playRadarBlip()
    setPickedId(target.id)
  }

  const celebrate = useCallback(async () => {
    if (prefersReducedMotion) return
    // Loaded on demand: a confetti library has no business in the initial
    // bundle of a page that may never fire it.
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      particleCount: 60,
      spread: 62,
      origin: { y: 0.6 },
      colors: ['#FFE600', '#FF5722', '#16A34A'],
      disableForReducedMotion: true,
    })
  }, [prefersReducedMotion])

  const runScan = () => {
    if (isScanning) return
    closeStory()
    sfx.playRadarBlip()
    setIsScanning(true)
    setShowRawJson(false)
    setPaneCopied(false)

    // The whole log is built up front from the query, then revealed on a timer.
    // Building it line by line inside the timeouts would let a second scan
    // interleave its lines with the first one's.
    const rejected = rejectedRowCount(prey, pain)
    const lines: TelemetryLine[] = [
      { key: 'target', label: 'TARGET', value: prey, tone: 'text-accent' },
      { key: 'intent', label: 'INTENT', value: pain, tone: 'text-accent' },
      {
        key: 'status',
        label: 'STATUS',
        value: 'Reading the sample set (X, Reddit) — no live feed is connected.',
        tone: 'text-[#4ADE80]',
      },
      {
        key: 'rejected',
        label: 'REJECTED',
        value: `${rejected} of ${SAMPLE_ROW_COUNT} sample rows filtered out (promo, bot, or wrong problem).`,
        tone: 'text-[#FCA5A5]',
      },
    ]
    setTelemetry(lines)
    setRevealed(0)
    lines.forEach((_, index) => {
      defer(() => setRevealed(index + 1), TELEMETRY_STEP_MS * (index + 1))
    })

    defer(() => {
      // The scan must never answer with a thread about a different tool: an
      // unrelated result reads as a match and is worse than an empty one. Only
      // the pain point degrades, and when it does the card says so.
      const exact = SAMPLE_TARGETS.find(
        (target) => target.competitor === prey && target.painPoint === pain,
      )
      const sameTool = SAMPLE_TARGETS.find((target) => target.competitor === prey)

      if (exact) {
        setScanResult({ target: exact, note: null })
      } else if (sameTool) {
        setScanResult({
          target: sameTool,
          note: `No sample thread pairs ${prey} with ${pain.toLowerCase()}. Closest match in the sample set:`,
        })
      } else {
        setScanResult({
          target: {
            ...SAMPLE_TARGETS[0],
            id: `no-match-${prey}-${pain}`,
            handle: '—',
            avatar: '∅',
            source: 'Reddit',
            competitor: prey,
            painPoint: pain,
            rarity: 'COMMON',
            intentScore: 0,
            timestamp: 'no result',
            title: `No sample thread mentions ${prey}`,
            body: 'On a live account a scan either returns matching threads or returns nothing. An empty result is a real answer, and the sample set deliberately keeps some combinations empty so this page shows that too.',
            suggestedReply: 'Nothing to draft — there is no matching thread.',
          },
          note: null,
        })
      }

      setIsScanning(false)
      setScanCount((count) => count + 1)
      sfx.playBountyUnlock()
      void celebrate()
    }, SCAN_DURATION_MS)
  }

  const openDrawer = (target: SampleTarget) => {
    sfx.playHoverBlip()
    setCopied(false)
    setDrawerTarget(target)
  }

  /**
   * Clipboard access is denied in some contexts. Both call sites keep the draft
   * selectable on the page, so a silent failure is better than an alert.
   */
  const writeDraft = async (target: SampleTarget, onDone: (ok: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(draftFor(action, target))
      sfx.playCoinDrop()
      onDone(true)
    } catch {
      onDone(false)
    }
  }

  const copyDraft = async () => {
    if (!drawerTarget) return
    await writeDraft(drawerTarget, (ok) => {
      if (!ok) return
      setCopied(true)
      defer(() => setCopied(false), 2500)
    })
  }

  const copyPaneDraft = async () => {
    if (!scanResult) return
    await writeDraft(scanResult.target, (ok) => {
      if (!ok) return
      setPaneCopied(true)
      defer(() => setPaneCopied(false), 2500)
    })
  }

  const pushLines = (lines: TerminalLine[]) => {
    setTerminal((current) => [...current, ...lines].slice(-60))
    defer(() => {
      const node = terminalScrollRef.current
      if (node) node.scrollTop = node.scrollHeight
    }, 20)
  }

  const runCommand = (event: React.FormEvent) => {
    event.preventDefault()
    const raw = command.trim()
    if (!raw) return

    sfx.playHoverBlip()
    historyRef.current = [...historyRef.current, raw].slice(-30)
    historyIndexRef.current = -1
    setCommand('')

    const input: TerminalLine = { text: `> ${raw}`, type: 'input' }
    const [verb, ...rest] = raw.toLowerCase().split(/\s+/)

    if (verb === 'clear') {
      setTerminal(INITIAL_TERMINAL)
      return
    }

    if (verb === 'help') {
      pushLines([
        input,
        { text: "help · scan · targets · filter <pain|all> · status · clear", type: 'output' },
      ])
      return
    }

    if (verb === 'scan') {
      runScan()
      pushLines([
        input,
        { text: `Scanning the sample set for ${prey} · ${pain.toLowerCase()}.`, type: 'output' },
      ])
      return
    }

    if (verb === 'targets') {
      pushLines([
        input,
        ...visibleTargets.map((target) => ({
          text: `${target.handle.padEnd(24)} ${target.competitor.padEnd(12)} ${target.painPoint}`,
          type: 'output' as const,
        })),
      ])
      return
    }

    if (verb === 'filter') {
      const requested = rest.join(' ')
      const match = SCOPE_FILTERS.find((entry) => entry.toLowerCase() === requested)
      if (match) {
        setFilter(match)
        pushLines([input, { text: `Filter set to "${match}".`, type: 'output' }])
      } else {
        pushLines([
          input,
          { text: `Unknown filter. Options: ${SCOPE_FILTERS.join(', ')}.`, type: 'output' },
        ])
      }
      return
    }

    if (verb === 'status') {
      pushLines([
        input,
        {
          text: `Simulator only. ${SAMPLE_TARGETS.length} sample threads loaded, ${visibleTargets.length} shown, ${scanCount} scan${scanCount === 1 ? '' : 's'} run this session. No live source is connected.`,
          type: 'output',
        },
      ])
      return
    }

    pushLines([input, { text: `Unknown command: ${verb}. Type 'help'.`, type: 'output' }])
  }

  const recallHistory = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    const history = historyRef.current
    if (history.length === 0) return
    event.preventDefault()

    if (event.key === 'ArrowUp') {
      historyIndexRef.current = Math.min(historyIndexRef.current + 1, history.length - 1)
    } else {
      historyIndexRef.current = Math.max(historyIndexRef.current - 1, -1)
    }

    setCommand(historyIndexRef.current === -1 ? '' : history[history.length - 1 - historyIndexRef.current])
  }


  return (
    <>
        {/* ── 2 · The scope ────────────────────────────────────────────── */}
        <section id="scope" className="scroll-mt-24 border-y-4 border-outline bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-10">
            <Reveal className="max-w-3xl space-y-4">
              <p className={EYEBROW}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Step one · the scope</span>
              </p>
              <h2 className={HEADING}>Five sample threads, on one scope</h2>
              <p className="text-base text-ink-muted sm:text-lg">
                Filter them the way you would filter a live feed. Nothing here is connected — these
                are written sample threads, and the Reddit ones preview a source that is built but
                not switched on yet.
              </p>
            </Reveal>

            <div className="grid gap-8 lg:grid-cols-2">
              <Reveal className={cn('p-5', PANEL)}>
                <div className="mb-4 flex items-center justify-between gap-3 border-b-4 border-outline pb-3">
                  <h3 className="font-mono text-sm font-black uppercase tracking-[0.18em] text-ink">
                    Scope
                  </h3>
                  <div className="flex items-center gap-2">
                    {storyOpen ? null : (
                      <button
                        type="button"
                        onClick={replayStory}
                        className="flex items-center gap-1 border-2 border-outline bg-card px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                      >
                        <Play className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Replay intro</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={toggleSound}
                      aria-pressed={soundOn}
                      className={cn(
                        'flex items-center gap-1.5 border-2 border-outline px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                        soundOn ? 'bg-accent text-on-accent' : 'bg-card text-ink-muted',
                      )}
                    >
                      {soundOn ? (
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <VolumeX className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span className="sr-only">Toggle interface sound</span>
                      <span aria-hidden="true">{soundOn ? 'On' : 'Off'}</span>
                    </button>
                    <span className="border-2 border-outline bg-highlight px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-on-accent">
                      {visibleTargets.length} shown
                    </span>
                  </div>
                </div>

                {/* The deck owns the panel while it plays; the interactive
                    scope takes it straight back when it ends, so nothing the
                    deck shows is only reachable through the deck. */}
                {storyOpen ? (
                  <HudStory
                    targets={visibleTargets}
                    target={selected}
                    draft={draftFor(action, selected)}
                    draftLabel={actionMeta.outputLabel}
                    reducedMotion={prefersReducedMotion}
                    onFinish={finishStory}
                    onSkip={closeStory}
                  />
                ) : (
                  <RadarScope
                    targets={visibleTargets}
                    selectedId={selected.id}
                    onSelect={selectTarget}
                    reducedMotion={prefersReducedMotion}
                  />
                )}

                <fieldset className="mt-4">
                  <legend className="sr-only">Filter sample threads by pain point</legend>
                  <div className="flex flex-wrap gap-2">
                    {SCOPE_FILTERS.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        aria-pressed={filter === entry}
                        onClick={() => {
                          sfx.playHoverBlip()
                          setFilter(entry)
                        }}
                        className={cn(
                          'border-2 border-outline px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] transition-transform duration-75 active:translate-x-[1px] active:translate-y-[1px]',
                          filter === entry
                            ? 'bg-accent text-on-accent shadow-brutal-sm'
                            : 'bg-card text-ink-muted hover:bg-highlight hover:text-on-accent',
                        )}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </Reveal>

              <Reveal delay={0.1} className="space-y-4">
                <ul className="space-y-2">
                  {visibleTargets.map((target) => (
                    <li key={target.id}>
                      <button
                        type="button"
                        aria-pressed={target.id === selected.id}
                        onClick={() => selectTarget(target)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 border-4 border-outline px-3 py-2.5 text-left font-mono text-xs font-black uppercase tracking-[0.12em] transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px]',
                          target.id === selected.id
                            ? 'bg-accent text-on-accent shadow-brutal'
                            : 'bg-card text-ink shadow-brutal-sm',
                        )}
                      >
                        <span className="truncate">
                          <span aria-hidden="true">{target.avatar} </span>
                          {target.competitor} · {target.painPoint}
                        </span>
                        <span className="shrink-0">{target.intentScore}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className={cn('space-y-3 p-4', PANEL)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden="true">
                        {selected.avatar}
                      </span>
                      <span>
                        <span className="block font-mono text-xs font-black text-ink">
                          {selected.handle}
                        </span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                          {selected.source} · {selected.timestamp}
                        </span>
                      </span>
                    </div>
                    <span
                      className={cn(
                        'border-2 border-outline px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] shadow-brutal-sm',
                        RARITY_STYLE[selected.rarity],
                      )}
                    >
                      Demo score {selected.intentScore}
                    </span>
                  </div>

                  <p className="line-clamp-3 border-2 border-outline bg-inset p-3 text-sm text-ink">
                    &ldquo;{selected.body}&rdquo;
                  </p>

                  <button
                    type="button"
                    onClick={() => openDrawer(selected)}
                    className="flex w-full items-center justify-center gap-2 border-2 border-outline bg-ink px-4 py-2.5 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-ink-inverse shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Open draft</span>
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>


        {/* ── 3 · Build a scan ─────────────────────────────────────────── */}
        <section id="simulator" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-10">
            <Reveal className="max-w-3xl space-y-4">
              <p className={EYEBROW}>
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Step two · build a scan</span>
              </p>
              <h2 className={HEADING}>Pick a tool, pick a complaint, pick what happens next</h2>
              <p className="text-base text-ink-muted sm:text-lg">
                The scan runs against the same five sample threads. If your combination has no example,
                it says so — an empty result is a real answer.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  key: 'prey',
                  icon: <Target className="h-4 w-4" aria-hidden="true" />,
                  title: '1 · Their current tool',
                  legend: 'Choose the tool being complained about',
                  body: (
                    <div className="grid grid-cols-2 gap-2">
                      {PREY_LIST.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          aria-pressed={prey === entry}
                          onClick={() => {
                            sfx.playHoverBlip()
                            setPrey(entry)
                          }}
                          className={cn(
                            'border-2 border-outline p-2.5 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] transition-transform duration-75 active:translate-x-[1px] active:translate-y-[1px]',
                            prey === entry
                              ? 'bg-accent text-on-accent shadow-brutal-sm'
                              : 'bg-card text-ink hover:bg-highlight hover:text-on-accent',
                          )}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'pain',
                  icon: <Flame className="h-4 w-4" aria-hidden="true" />,
                  title: '2 · The complaint',
                  legend: 'Choose the complaint',
                  body: (
                    <div className="space-y-2">
                      {PAIN_LIST.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          aria-pressed={pain === entry}
                          onClick={() => {
                            sfx.playHoverBlip()
                            setPain(entry)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between border-2 border-outline p-2.5 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] transition-transform duration-75 active:translate-x-[1px] active:translate-y-[1px]',
                            pain === entry
                              ? 'bg-accent-2 text-white shadow-brutal-sm'
                              : 'bg-card text-ink hover:bg-highlight hover:text-on-accent',
                          )}
                        >
                          <span>{entry}</span>
                          {pain === entry ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                        </button>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'action',
                  icon: <Zap className="h-4 w-4" aria-hidden="true" />,
                  title: '3 · What you get',
                  legend: 'Choose what the scan produces',
                  body: (
                    <div className="space-y-2">
                      {ACTION_LIST.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          aria-pressed={action === entry.id}
                          onClick={() => {
                            sfx.playHoverBlip()
                            setAction(entry.id)
                          }}
                          className={cn(
                            'w-full border-2 border-outline p-2.5 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] transition-transform duration-75 active:translate-x-[1px] active:translate-y-[1px]',
                            action === entry.id
                              ? 'bg-ink text-ink-inverse shadow-brutal-sm'
                              : 'bg-card text-ink hover:bg-highlight hover:text-on-accent',
                          )}
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>
                  ),
                },
              ].map((step, index) => (
                <Reveal key={step.key} delay={index * 0.08}>
                  <fieldset className={cn('h-full space-y-4 p-5', PANEL)}>
                    <legend className="sr-only">{step.legend}</legend>
                    <p className="flex items-center gap-2 border-b-4 border-outline pb-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">
                      {step.icon}
                      <span>{step.title}</span>
                    </p>
                    {step.body}
                  </fieldset>
                </Reveal>
              ))}
            </div>

            <Reveal className="flex justify-center">
              <button
                type="button"
                onClick={runScan}
                disabled={isScanning}
                className={cn(
                  'inline-flex items-center gap-3 border-4 border-outline px-8 py-5 text-lg font-black uppercase tracking-[0.14em] shadow-brutal-lg transition-all duration-75 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-brutal-sm sm:text-xl',
                  isScanning
                    ? 'cursor-wait bg-highlight-strong text-on-accent'
                    : 'bg-accent text-on-accent hover:bg-highlight-strong',
                )}
              >
                {isScanning ? (
                  <>
                    <Radar
                      className={cn('h-6 w-6', !prefersReducedMotion && 'animate-spin [animation-duration:0.6s]')}
                      aria-hidden="true"
                    />
                    <span>Executing query · {SAMPLE_ROW_COUNT} rows…</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="h-6 w-6" aria-hidden="true" />
                    <span>Scan for {prey}</span>
                  </>
                )}
              </button>
            </Reveal>
          </div>
        </section>


        {/* ── 4 · Telemetry + split-pane output ────────────────────────── */}
        {telemetry.length > 0 || scanResult ? (
          <section className="border-y-4 border-outline bg-ink px-4 py-16 sm:px-6" ref={outputRef}>
            <div className="mx-auto max-w-7xl space-y-8">
              {telemetry.length > 0 ? (
                <div className="mx-auto max-w-3xl border-4 border-[#3F3F46] bg-[#0A0A0A] shadow-[6px_6px_0_0_var(--accent-primary)]">
                  <div className="flex items-center justify-between gap-2 border-b-4 border-[#3F3F46] px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                    <span className="flex items-center gap-2 text-[#E4E4E7]">
                      <Radar className="h-3 w-3" aria-hidden="true" />
                      <span>Telemetry stream</span>
                    </span>
                    <span className={isScanning ? 'text-[#4ADE80]' : 'text-[#A1A1AA]'}>
                      {isScanning ? 'Executing' : 'Complete'}
                    </span>
                  </div>
                  <div
                    aria-live="polite"
                    aria-busy={isScanning}
                    className="space-y-1.5 p-4 font-mono text-xs leading-relaxed"
                  >
                    {telemetry.slice(0, revealed).map((line) => (
                      <p key={line.key} className="flex flex-wrap gap-x-2">
                        <span className="text-[#71717A]">&gt;</span>
                        <span className={cn('font-black', line.tone)}>{line.label}:</span>
                        <span className="text-[#D4D4D8]">{line.value}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div aria-live="polite">
                {scanResult ? (
                  <div
                    // Keyed on the scan so a fresh result replays the entrance;
                    // the animation itself is CSS, and `motion-reduce` turns it
                    // off without a second render path.
                    key={`${scanResult.target.id}-${scanCount}`}
                    className="space-y-5 motion-safe:animate-[radar-rise_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                  >
                    {scanResult.note ? (
                      <p className="mx-auto max-w-3xl border-4 border-outline bg-accent p-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal">
                        {scanResult.note}
                      </p>
                    ) : null}

                    <div className="grid items-start gap-6 lg:grid-cols-2">
                      {/* Left — filtered source thread */}
                      <section className="border-4 border-outline bg-card shadow-brutal-lg">
                        <h3 className="flex items-center gap-2 border-b-4 border-outline bg-inset px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-ink">
                          <Radar className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Filtered source thread</span>
                        </h3>

                        <div className="space-y-3 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center border-2 border-outline bg-highlight text-lg" aria-hidden="true">
                              {scanResult.target.avatar}
                            </span>
                            <span className="mr-auto font-mono text-sm font-black text-ink">
                              {scanResult.target.handle}
                            </span>
                            <span
                              className={cn(
                                'border-2 border-outline px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] shadow-brutal-sm',
                                SOURCE_STYLE[scanResult.target.source],
                              )}
                            >
                              {scanResult.target.source}
                            </span>
                            {/* Labelled "demo score", not "confidence": the number
                                is written into the sample data, not produced by a
                                model, and a confidence pill would claim otherwise. */}
                            <span
                              className={cn(
                                'border-2 border-outline px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] shadow-brutal-sm',
                                RARITY_STYLE[scanResult.target.rarity],
                              )}
                            >
                              Demo score: {scanResult.target.intentScore}
                            </span>
                          </div>

                          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">
                            {scanResult.target.competitor} · {scanResult.target.painPoint} ·{' '}
                            {scanResult.target.timestamp}
                          </p>

                          <h4 className="text-lg font-black leading-snug text-ink">
                            {scanResult.target.title}
                          </h4>

                          <p className="border-2 border-outline bg-inset p-3 text-sm leading-relaxed text-ink">
                            &ldquo;{scanResult.target.body}&rdquo;
                          </p>

                          {showRawJson ? (
                            <pre className="max-h-64 overflow-auto border-2 border-outline bg-[#0A0A0A] p-3 font-mono text-[11px] leading-relaxed text-[#4ADE80]">
                              {rawRecord(scanResult.target)}
                            </pre>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 border-t-4 border-outline px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              sfx.playHoverBlip()
                              setShowRawJson((shown) => !shown)
                            }}
                            aria-expanded={showRawJson}
                            className="flex items-center gap-1.5 border-2 border-outline bg-card px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          >
                            <Braces className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{showRawJson ? 'Hide raw JSON' : 'View raw JSON'}</span>
                          </button>

                          {/* Sample rows have no source URL, so this is a disabled
                              stub rather than a link that would go nowhere. */}
                          <span
                            className="flex cursor-not-allowed items-center gap-1.5 border-2 border-dashed border-ink-muted px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink-muted"
                            title="Sample data has no source URL. On a connected account this opens the original thread."
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Source link — none (sample)</span>
                          </span>
                        </div>
                      </section>

                      {/* Right — outreach action */}
                      <section className="border-4 border-outline bg-card shadow-[8px_8px_0_0_var(--accent-primary)]">
                        <h3 className="flex items-center gap-2 border-b-4 border-outline bg-accent px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-on-accent">
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{actionMeta.outputLabel}</span>
                        </h3>

                        <div className="space-y-3 p-4">
                          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">
                            Generated for {scanResult.target.handle} · edit before you post
                          </p>
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap border-2 border-outline bg-inset p-3 font-mono text-xs leading-relaxed text-ink">
                            {draftFor(action, scanResult.target)}
                          </pre>
                        </div>

                        <div className="flex flex-wrap gap-2 border-t-4 border-outline px-4 py-3">
                          <button
                            type="button"
                            onClick={copyPaneDraft}
                            className="flex items-center gap-1.5 border-2 border-outline bg-accent px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          >
                            {paneCopied ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span>{paneCopied ? 'Copied' : 'Copy draft'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openDrawer(scanResult.target)}
                            className="flex items-center gap-1.5 border-2 border-outline bg-card px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Expand</span>
                          </button>

                          <Link
                            href="/sign-up"
                            className="flex items-center gap-1.5 border-2 border-outline bg-ink px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink-inverse shadow-brutal-sm transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          >
                            <SquareArrowOutUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Open in app</span>
                          </Link>
                        </div>

                        <p aria-live="polite" className="sr-only">
                          {paneCopied ? 'Draft copied to clipboard.' : ''}
                        </p>
                      </section>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}


        {/* ── 7 · Terminal ─────────────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <div className="border-4 border-outline bg-[#0A0A0A] shadow-brutal-lg">
              <div className="flex items-center justify-between gap-3 border-b-4 border-[#3F3F46] px-4 py-2.5 font-mono text-[11px] font-black uppercase tracking-[0.18em]">
                <span className="text-[#E4E4E7]">radar-simulator</span>
                <span className="text-[#4ADE80]">Sample data only</span>
              </div>

              <div
                ref={terminalScrollRef}
                aria-live="polite"
                className="max-h-56 space-y-1.5 overflow-y-auto p-4 font-mono text-xs text-[#D4D4D8]"
              >
                {terminal.map((line, index) => (
                  <p
                    key={`${index}-${line.text}`}
                    className={cn(
                      line.type === 'input' && 'font-black text-accent',
                      line.type === 'output' && 'text-[#4ADE80]',
                      line.type === 'system' && 'text-[#A1A1AA]',
                    )}
                  >
                    {line.text}
                  </p>
                ))}
              </div>

              <form onSubmit={runCommand} className="flex border-t-4 border-[#3F3F46]">
                <label
                  htmlFor="radar-command"
                  className="flex items-center px-3 font-mono text-xs font-black text-accent"
                >
                  quest@sample:~$
                  <span className="sr-only">Simulator command</span>
                </label>
                <input
                  id="radar-command"
                  type="text"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  onKeyDown={recallHistory}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="help"
                  className="flex-1 bg-transparent px-2 py-3 font-mono text-xs text-white outline-none placeholder:text-[#71717A]"
                />
                <button
                  type="submit"
                  className="border-l-4 border-[#3F3F46] bg-accent px-5 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-on-accent transition-colors hover:bg-highlight-strong"
                >
                  Run
                </button>
              </form>
            </div>
          </Reveal>
        </section>

      <ReplyDrawer
        open={drawerTarget !== null}
        target={drawerTarget ?? SAMPLE_TARGETS[0]}
        draft={draftFor(action, drawerTarget ?? SAMPLE_TARGETS[0])}
        draftLabel={actionMeta.outputLabel}
        copied={copied}
        onCopy={copyDraft}
        onClose={() => setDrawerTarget(null)}
        reducedMotion={prefersReducedMotion}
      />
    </>
  )
}
