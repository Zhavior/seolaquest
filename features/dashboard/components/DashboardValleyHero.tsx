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

const CHIPS: Array<{ value: LeadIntentFilter; label: string }> = [
  { value: 'all', label: 'All leads' },
  { value: 'engage', label: `Score ${LEAD_ENGAGE_MIN}+` },
  { value: 'unscored', label: 'No score yet' },
]

/**
 * The signed-in hero: the public site's valley in a fixed frame. The camera
 * holds the establishing shot instead of travelling with scroll, and each of
 * the four beacons stands for one of the hunter's newest leads. Beacons with
 * no lead stay dark. Decorative: the canvas is hidden from assistive tech, and
 * without WebGL the painted dusk gradient stays.
 *
 * The heading says what the page is and what is waiting, on a solid backing so
 * it reads over any frame of the scene. Motion can always be stopped with the
 * Pause button (WCAG 2.2.2); the choice is remembered with the public valley's
 * Calm setting. It is short on phones so the next step is in the first screen.
 */
export function DashboardValleyHero({ name, level, title, leads, filter, onFilter, eyebrow = 'Welcome back' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ValleyHandle | null>(null)
  const syncRef = useRef<() => void>(() => {})
  const [live, setLive] = useState(false)
  // Starts false on both server and client so the button's first render
  // matches; the stored choice is applied once the scene loads.
  const [calm, setCalm] = useState(false)
  const calmRef = useRef(false)

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
    calmRef.current = storedCalm()
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
          reducedMotion: prefersReducedMotion() || calmRef.current,
          atmosphere: 0.45,
        })
      } catch {
        return
      }
      handle.current = valley
      valley.setProgress(0)
      valley.setBeacons(beaconsRef.current)
      setLive(true)
      setCalm(calmRef.current)

      // Stop rendering while the hero is scrolled away, the tab is hidden, or
      // the person paused it; the dashboard stays open for long stretches.
      let onScreen = true
      const sync = () => valley.setPaused(calmRef.current || document.hidden || !onScreen)
      syncRef.current = sync
      sync()
      document.addEventListener('visibilitychange', sync)
      const io = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting
            sync()
          })
        : null
      io?.observe(host)

      cleanup = () => {
        syncRef.current = () => {}
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
    const next = !calmRef.current
    calmRef.current = next
    setCalm(next)
    try {
      window.localStorage.setItem(CALM_KEY, next ? '1' : '0')
    } catch {
      // Storage can be blocked; the toggle still works for this visit.
    }
    handle.current?.setReducedMotion(next || prefersReducedMotion())
    // Paused means still: stop drawing frames, not just slow the camera.
    syncRef.current()
  }, [])

  const lit = shown.length
  const beaconNote =
    lit === 0 ? 'Each light will stand for one of your newest leads' : `Each light is one of your ${lit} newest ${lit === 1 ? 'lead' : 'leads'}`
  const status =
    leads.length === 0 ? 'No leads to look at yet.' : `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'} to look at.`

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

      <div className="flex min-h-[260px] flex-col justify-between gap-6 p-4 sm:min-h-[max(360px,45vh)] sm:p-7">
        <div className="min-w-0 max-w-xl self-start rounded-[14px] bg-[rgb(11_8_24/0.86)] px-4 py-3 sm:px-5 sm:py-4">
          <p className="mb-1 text-sm font-medium text-[#f3d58a]">{eyebrow}</p>
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">Home</h1>
          <p className="mt-1 text-base text-[#f6ebd2]">{status}</p>
          <p className="mt-1 text-sm text-[#d9d0ec]">
            {name} · Level {level} · {title}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter discovered leads">
            {CHIPS.map((chip) => {
              const count = leads.filter((lead) => matchesIntentFilter(lead, chip.value)).length
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={filter === chip.value}
                  onClick={() => onFilter(chip.value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#5a4720] bg-[rgb(11_8_24/0.86)] px-3 text-sm font-medium text-[#f6ebd2] backdrop-blur transition-colors hover:border-[#8a6420] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f3d58a] aria-pressed:border-[#d8a93b] aria-pressed:bg-[linear-gradient(#f3d58a,#d8a93b)] aria-pressed:text-[#1a1206]"
                >
                  {chip.label}
                  <span className="tabular-nums opacity-80">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-[10px] bg-[rgb(11_8_24/0.86)] px-3 py-2 text-sm text-[#d9d0ec]">
              {beaconNote}
            </p>
            <button
              type="button"
              aria-pressed={calm}
              onClick={toggleCalm}
              className="min-h-11 rounded-[10px] border border-[#5a4720] bg-[rgb(11_8_24/0.86)] px-3 text-sm text-[#f3d58a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f3d58a] aria-pressed:border-[#d8a93b]"
            >
              {calm ? 'Play animation' : 'Pause animation'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
