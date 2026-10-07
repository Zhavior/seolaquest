'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BeaconView, ValleyHandle } from '@/features/handbook/valley/scene'
import type { DashboardLead } from '@/features/dashboard/types'
import {
  LEAD_ENGAGE_MIN,
  liveScore,
  matchesIntentFilter,
  type LeadIntentFilter,
} from '@/features/dashboard/lib/leadScore'

// Shared with the public valley, so one Calm choice covers both.
const CALM_KEY = 'sq-calm'

function storedCalm(): boolean {
  try {
    return window.localStorage.getItem(CALM_KEY) === '1'
  } catch {
    return false
  }
}

function canRenderWebGL(): boolean {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Beacon scores and states from the `liveScore` list, newest lead first. */
function beaconsFor(scoreKey: string): { scores: Array<number | null>; views: BeaconView[] } {
  const scores = scoreKey ? scoreKey.split(',').map((part) => (part === '-' ? null : Number(part))) : []
  const views = [0, 1, 2, 3].map<BeaconView>((i) =>
    i < scores.length ? { state: 'open', selected: i === 0 } : { state: 'dismissed', selected: false },
  )
  return { scores, views }
}

type Props = {
  name: string
  level: number
  title: string
  leads: DashboardLead[]
  /** Which leads the list below the hero shows. The chips here set it. */
  filter: LeadIntentFilter
  onFilter: (filter: LeadIntentFilter) => void
  /** Small line above the heading. The public sample hunt says it is a sample here. */
  eyebrow?: string
}

const CHIPS: Array<{ value: LeadIntentFilter; label: string; hint: string }> = [
  { value: 'all', label: 'All leads', hint: 'Every lead in your queue' },
  { value: 'engage', label: `Score ${LEAD_ENGAGE_MIN}+`, hint: `Live Aurora score of ${LEAD_ENGAGE_MIN} or more` },
  { value: 'unscored', label: 'Unscored', hint: 'No live Aurora score yet' },
]

/**
 * The signed-in hero: the public site's valley in a fixed frame. The camera
 * holds the establishing shot instead of travelling with scroll, and each of
 * the four beacons stands for one of the hunter's newest leads. Beacons with
 * no lead stay dark. Decorative: the canvas is hidden from assistive tech, and
 * without WebGL the painted dusk gradient stays.
 */
export function DashboardValleyHero({ name, level, title, leads, filter, onFilter, eyebrow = 'Your growth journal' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ValleyHandle | null>(null)
  const [live, setLive] = useState(false)
  // Read on the client only. The Calm button renders after the scene is live,
  // so this never changes the server markup.
  const [calm, setCalm] = useState(() => typeof window !== 'undefined' && storedCalm())

  const shown = leads.slice(0, 4)
  // A string key, so a new leads array with the same four leads changes nothing.
  const scoreKey = shown.map((lead) => liveScore(lead) ?? '-').join(',')
  const initial = beaconsFor(scoreKey)
  const scoresRef = useRef(initial.scores)
  const beaconsRef = useRef(initial.views)

  // Leads change while the dashboard is open (a scan, a claim). Keep the
  // beacons in step without rebuilding the scene.
  useEffect(() => {
    const { scores, views } = beaconsFor(scoreKey)
    scoresRef.current = scores
    beaconsRef.current = views
    handle.current?.setScores(scores)
    handle.current?.setBeacons(views)
  }, [scoreKey])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || !canRenderWebGL()) return
    let cancelled = false
    let cleanup = () => {}

    void import('@/features/handbook/valley/scene').then(({ createValley }) => {
      if (cancelled) return
      let valley: ValleyHandle
      try {
        valley = createValley({
          canvas,
          host,
          scores: scoresRef.current,
          mode: 'auto',
          reducedMotion: prefersReducedMotion() || storedCalm(),
          atmosphere: 0.45,
        })
      } catch {
        return
      }
      handle.current = valley
      valley.setProgress(0)
      valley.setBeacons(beaconsRef.current)
      setLive(true)

      // Stop rendering while the hero is scrolled away or the tab is hidden;
      // the dashboard stays open for long stretches.
      let onScreen = true
      const sync = () => valley.setPaused(document.hidden || !onScreen)
      document.addEventListener('visibilitychange', sync)
      const io = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting
            sync()
          })
        : null
      io?.observe(host)

      cleanup = () => {
        document.removeEventListener('visibilitychange', sync)
        io?.disconnect()
        valley.dispose()
        handle.current = null
      }
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  const toggleCalm = useCallback(() => {
    setCalm((current) => {
      const next = !current
      try {
        window.localStorage.setItem(CALM_KEY, next ? '1' : '0')
      } catch {
        // Storage can be blocked; the toggle still works for this visit.
      }
      handle.current?.setReducedMotion(next || prefersReducedMotion())
      return next
    })
  }, [])

  const lit = shown.length
  const beaconNote =
    lit === 0 ? 'Beacons light up as leads arrive' : `${lit} of 4 beacons lit · one per newest lead`

  return (
    <section
      aria-label="Your valley"
      className="relative isolate overflow-hidden rounded-[20px] border border-[#5a4720] bg-[linear-gradient(180deg,#15122e,#5e3258_55%,#d9704a)] text-[#f6ebd2]"
    >
      <div
        ref={hostRef}
        aria-hidden="true"
        className={`absolute inset-0 -z-10 transition-opacity duration-700 motion-reduce:transition-none ${live ? 'opacity-100' : 'opacity-0'}`}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(8_6_20/0.72),rgb(8_6_20/0)_42%),linear-gradient(90deg,rgb(8_6_20/0.78),rgb(8_6_20/0.35)_50%,rgb(8_6_20/0)_78%)]"
      />

      <div className="flex min-h-[max(420px,55vh)] flex-col justify-between gap-6 p-5 sm:p-7">
        <div className="min-w-0 max-w-2xl [text-shadow:0_1px_12px_rgb(8_6_20/0.8)]">
          <p className="mb-2 text-xs font-medium tracking-wide text-[#f3d58a]">{eyebrow}</p>
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {name} · Lv {level} · {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter discovered leads">
            {CHIPS.map((chip) => {
              const count = leads.filter((lead) => matchesIntentFilter(lead, chip.value)).length
              return (
                <button
                  key={chip.value}
                  type="button"
                  title={chip.hint}
                  aria-pressed={filter === chip.value}
                  onClick={() => onFilter(chip.value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#5a4720] bg-[rgb(11_8_24/0.82)] px-3 text-xs font-medium text-[#f6ebd2] backdrop-blur transition-colors hover:border-[#8a6420] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f3d58a] aria-pressed:border-[#d8a93b] aria-pressed:bg-[linear-gradient(#f3d58a,#d8a93b)] aria-pressed:text-[#1a1206]"
                >
                  {chip.label}
                  <span className="tabular-nums opacity-80">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-[10px] bg-[rgb(11_8_24/0.72)] px-3 py-2 font-mono text-[11px] text-[#d9d0ec] backdrop-blur">
              {beaconNote}
            </p>
            {live ? (
              <button
                type="button"
                aria-pressed={calm}
                onClick={toggleCalm}
                className="min-h-11 rounded-[10px] border border-[#5a4720] bg-[rgb(11_8_24/0.85)] px-3 text-xs text-[#f3d58a] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f3d58a] aria-pressed:border-[#d8a93b]"
              >
                {calm ? 'Calm on' : 'Calm'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
