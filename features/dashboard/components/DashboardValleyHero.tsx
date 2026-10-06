'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BeaconView, ValleyHandle } from '@/features/handbook/valley/scene'
import type { DashboardLead } from '@/features/dashboard/types'

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

/**
 * Only a LIVE Aurora verdict is a measurement. A FALLBACK decision still carries
 * a score (a flat 50 when the classifier was unreachable), so it shows as a dash.
 */
function liveScore(lead: DashboardLead): number | null {
  const aurora = lead.aurora
  if (!aurora || aurora.evaluationStatus !== 'LIVE' || !Number.isFinite(aurora.score)) return null
  return Math.round(aurora.score)
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
  credits: string
  plan: string
  leads: DashboardLead[]
}

/**
 * The signed-in hero: the public site's valley in a fixed frame. The camera
 * holds the establishing shot instead of travelling with scroll, and each of
 * the four beacons stands for one of the hunter's newest leads. Beacons with
 * no lead stay dark. Decorative: the canvas is hidden from assistive tech, and
 * without WebGL the painted dusk gradient stays.
 */
export function DashboardValleyHero({ name, level, title, credits, plan, leads }: Props) {
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

  const unscored = shown.filter((lead) => liveScore(lead) === null).length
  const legend =
    shown.length === 0
      ? 'Beacons light up as leads arrive.'
      : `Beacons: your ${shown.length === 1 ? 'newest lead' : `${shown.length} newest leads`}` +
        (unscored ? ' · – means no live score yet' : ' · number is the live Aurora score')

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
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(8_6_20/0.78),rgb(8_6_20/0.35)_50%,rgb(8_6_20/0)_78%)]"
      />

      <div className="flex min-h-[clamp(20rem,48vh,30rem)] flex-col justify-between gap-6 p-5 sm:p-7">
        <div className="min-w-0 max-w-xl [text-shadow:0_1px_12px_rgb(8_6_20/0.8)]">
          <p className="mb-2 text-xs font-medium tracking-wide text-[#f3d58a]">Your growth journal</p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">One useful step at a time.</h1>
          <p className="mt-3 text-sm text-[#d9d0ec]">
            {name} · Lv {level} · {title}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-[14px] border border-[#5a4720] bg-[rgb(11_8_24/0.8)] px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-medium text-[#a99fc9]">Scan credits</p>
              <p className="text-lg font-semibold leading-none tabular-nums">{credits}</p>
            </div>
            <div className="rounded-[14px] border border-[#5a4720] bg-[rgb(11_8_24/0.8)] px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-medium text-[#a99fc9]">Plan</p>
              <p className="max-w-[14rem] truncate text-sm font-semibold leading-none">{plan}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-[10px] bg-[rgb(11_8_24/0.72)] px-3 py-2 text-[11px] text-[#d9d0ec] backdrop-blur">{legend}</p>
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
