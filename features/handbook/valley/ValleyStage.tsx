'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PHASE_LABEL, SKY_MODES, skyInfo, type SkyMode } from './phase'
import type { ValleyHandle } from './scene'

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
export function ValleyStage({ scores }: { scores: number[] }) {
  const scoresRef = useRef(scores)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ValleyHandle | null>(null)
  const [mode, setMode] = useState<SkyMode>('auto')
  const [calm, setCalm] = useState(false)
  const [live, setLive] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    setCalm(storedCalm())
  }, [])

  useEffect(() => {
    setLabel(skyInfo(mode).label)
    if (mode !== 'auto') return
    const timer = window.setInterval(() => setLabel(skyInfo('auto').label), 30000)
    return () => window.clearInterval(timer)
  }, [mode])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || !canRenderWebGL()) return
    const section = host.parentElement
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
          mode: 'auto',
          reducedMotion: reducedQuery.matches || storedCalm(),
        })
      } catch {
        return
      }
      handle.current = valley
      setLive(true)

      const onScroll = () => {
        if (!section) return
        const rect = section.getBoundingClientRect()
        valley.setProgress(0.55 * Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height))))
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()

      let visible = true
      const sync = () => valley.setPaused(!visible || document.hidden)
      const io = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true
        sync()
      })
      io.observe(host)
      document.addEventListener('visibilitychange', sync)
      const onMotion = () => valley.setReducedMotion(reducedQuery.matches || storedCalm())
      reducedQuery.addEventListener('change', onMotion)

      cleanup = () => {
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', sync)
        reducedQuery.removeEventListener('change', onMotion)
        io.disconnect()
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
      <div ref={hostRef} className="hb-valley" data-live={live ? '' : undefined} aria-hidden="true">
        <canvas ref={canvasRef} className="hb-valley-canvas" />
      </div>
      <div className="hb-valley-ctl hb-mono" role="group" aria-label="Valley sky">
        <span className="hb-valley-label">{label}</span>
        <span className="hb-valley-note">Beacon scores are samples.</span>
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
    </>
  )
}
