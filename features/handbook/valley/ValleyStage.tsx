'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { valleyAudio } from './audio'
import { PHASE_LABEL, SKY_MODES, skyInfo, type SkyMode } from './phase'
import type { BeaconMark, BeaconView, ValleyHandle } from './scene'

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

/**
 * The live valley behind the hero. Decorative: the canvas is hidden from
 * assistive tech and the page reads the same without it. If WebGL is missing,
 * the painted dusk gradient from the stylesheet stays.
 *
 * The sky follows the visitor's own clock; nothing is sent anywhere and no
 * location is requested. Calm mode stops all movement and is remembered.
 */
export function ValleyStage({
  scores,
  marks,
  beacons,
  burst,
}: {
  scores: number[]
  /** Label and colour per beacon in place of a score; see `ValleyOptions.marks`. */
  marks?: BeaconMark[]
  beacons?: BeaconView[]
  /** Bump `n` to fire a claim surge at beacon `index`. */
  burst?: { index: number; n: number } | null
}) {
  const scoresRef = useRef(scores)
  const marksRef = useRef(marks)
  const beaconsRef = useRef(beacons)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ValleyHandle | null>(null)
  const [mode, setMode] = useState<SkyMode>('auto')
  // Calm and the sky label only show inside the panel, which opens after a
  // click, so reading the browser here never changes the server markup.
  const [calm, setCalm] = useState(() => typeof window !== 'undefined' && storedCalm())
  const [live, setLive] = useState(false)
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  const label = open ? skyInfo(mode).label : ''
  const sound = useSyncExternalStore(valleyAudio.subscribe, valleyAudio.getSnapshot, () => false)

  // Keep the clock in "Your sky" current while the panel is open.
  useEffect(() => {
    if (!open || mode !== 'auto') return
    const timer = window.setInterval(() => setTick((n) => n + 1), 30000)
    return () => window.clearInterval(timer)
  }, [open, mode])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || !canRenderWebGL()) return
    let cancelled = false
    let cleanup = () => {}
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    void import('./scene').then(({ createValley }) => {
      if (cancelled) return
      let valley: ValleyHandle
      try {
        valley = createValley({
          canvas,
          host,
          scores: scoresRef.current,
          marks: marksRef.current,
          mode: 'auto',
          reducedMotion: reducedQuery.matches || storedCalm(),
        })
      } catch {
        return
      }
      handle.current = valley
      if (beaconsRef.current) valley.setBeacons(beaconsRef.current)
      setLive(true)

      // The camera travels the valley as the whole page scrolls.
      const onScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        valley.setProgress(window.scrollY / max)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()

      const sync = () => valley.setPaused(document.hidden)
      document.addEventListener('visibilitychange', sync)
      const onMotion = () => valley.setReducedMotion(reducedQuery.matches || storedCalm())
      reducedQuery.addEventListener('change', onMotion)

      cleanup = () => {
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', sync)
        reducedQuery.removeEventListener('change', onMotion)
        valley.dispose()
        handle.current = null
      }
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  useEffect(() => {
    handle.current?.setMode(mode)
  }, [mode])

  useEffect(() => {
    beaconsRef.current = beacons
    if (beacons) handle.current?.setBeacons(beacons)
  }, [beacons])

  useEffect(() => {
    if (burst) handle.current?.burst(burst.index)
  }, [burst])

  const toggleCalm = useCallback(() => {
    setCalm((current) => {
      const next = !current
      try {
        window.localStorage.setItem(CALM_KEY, next ? '1' : '0')
      } catch {
        // Storage can be blocked; the toggle still works for this visit.
      }
      handle.current?.setReducedMotion(next || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return next
    })
  }, [])

  return (
    <>
      <div className="hb-intro" aria-hidden="true" />
      <div ref={hostRef} className="hb-valley" data-live={live ? '' : undefined} aria-hidden="true">
        <canvas ref={canvasRef} className="hb-valley-canvas" />
      </div>
      <div className="hb-valley-ctl">
        {open ? (
          <div id="hb-valley-panel" className="hb-valley-panel hb-mono" role="group" aria-label="Valley sky">
            <span className="hb-valley-label">{label}</span>
            <span className="hb-valley-note">{marks ? 'Beacon ranks are samples.' : 'Beacon scores are samples.'}</span>
            <span className="hb-valley-chips">
              {SKY_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="hb-valley-chip"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {m === 'auto' ? 'Auto' : PHASE_LABEL[m]}
                </button>
              ))}
              <button type="button" className="hb-valley-chip" aria-pressed={calm} onClick={toggleCalm}>
                Calm
              </button>
            </span>
          </div>
        ) : null}
        <span className="hb-valley-row">
          <button
            type="button"
            className="hb-valley-toggle hb-mono"
            aria-expanded={open}
            aria-controls="hb-valley-panel"
            onClick={() => setOpen((current) => !current)}
          >
            Sky: {mode === 'auto' ? PHASE_LABEL[skyInfo('auto').phase] : PHASE_LABEL[mode]}
          </button>
          <button
            type="button"
            className="hb-valley-toggle hb-mono"
            aria-pressed={sound}
            onClick={() => valleyAudio.toggle()}
          >
            Sound: {sound ? 'On' : 'Off'}
          </button>
        </span>
      </div>
    </>
  )
}
