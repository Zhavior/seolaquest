'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import { valleyAudio } from './audio'
import { PHASE_LABEL, SKY_MODES, skyInfo, type SkyMode } from './phase'
import type { BeaconMark, BeaconView, ValleyHandle } from './scene'

const CALM_KEY = 'sq-calm'

/**
 * A label pinned to a landmark in the scan view: 0-3 the beacons, 4 the
 * visitor's own site, 5 the answer. Beacons show only their domain until
 * selected; `move` shows only on the selected pin.
 */
export type ScanPin = { label: string; note: string; move?: string; tone: string }

/** Pins fade out as the hero scrolls away, between these fractions of the viewport height. */
const PIN_FADE: [number, number] = [0.7, 1.3]
/** How close, in pixels, a click must land to a marker to select it. */
const PICK_RADIUS = 44

function pinFade(): number {
  const at = window.scrollY / Math.max(1, window.innerHeight)
  return 1 - Math.min(1, Math.max(0, (at - PIN_FADE[0]) / (PIN_FADE[1] - PIN_FADE[0])))
}

type Box = { x: number; y: number; w: number; h: number }

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** Marker half-size in pixels: the scene draws markers at 7% of the view height. */
const markerRadius = () => window.innerHeight * 0.036
const EDGE = 12
const GAP = 6

/**
 * Domain labels that follow the landmarks on screen. Decorative: the same
 * sources, verdicts and moves are in the sample scan panel as real buttons.
 *
 * Each frame the labels are placed in priority order (the selected one, then
 * the answer, then your site, then the beacons). A label tries below and
 * above its marker, centred and then flush with either side, then right and
 * left, keeping clear of the copy panel, the screen edges, every marker and
 * the labels already placed. A label with no free spot is hidden for that
 * frame rather than drawn over another.
 */
function ScanPins({
  handle,
  pins,
  selected,
}: {
  handle: RefObject<ValleyHandle | null>
  pins: ScanPin[]
  selected: number
}) {
  const refs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const fade = pinFade()
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const r = markerRadius()
      const copy = document.querySelector('.hb-hero-copy')?.getBoundingClientRect() ?? null
      const anchors = pins.map((_, i) => (fade > 0 ? (handle.current?.screenOf(i) ?? null) : null))
      const placed: Box[] = []
      anchors.forEach((at) => {
        if (at) placed.push({ x: at.x - r, y: at.y - r, w: r * 2, h: r * 2 })
      })
      if (copy) placed.push({ x: copy.left - GAP, y: copy.top - GAP, w: copy.width + GAP * 2, h: copy.height + GAP * 2 })

      const sel = selected
      const order = [sel, 5, 4, 0, 1, 2, 3].filter((i, k, all) => i >= 0 && i < pins.length && all.indexOf(i) === k)
      for (const i of order) {
        const el = refs.current[i]
        if (!el) continue
        const card = el.firstElementChild as HTMLElement | null
        const at = anchors[i]
        const hidden = !at || !card || (copy !== null && at.x > copy.left && at.x < copy.right && at.y > copy.top && at.y < copy.bottom)
        if (hidden || !at || !card) {
          el.style.opacity = '0'
          continue
        }
        const w = card.offsetWidth
        const h = card.offsetHeight
        const tries: Array<[number, number]> =
          i === 5
            ? [[-w / 2, -r - GAP - h], [r + GAP, -h / 2], [-w / 2, r + GAP]]
            : [
                [-w / 2, r + GAP],
                [-w / 2, -r - GAP - h],
                [-r, r + GAP],
                [-r, -r - GAP - h],
                [r - w, r + GAP],
                [r - w, -r - GAP - h],
                [r + GAP, -h / 2],
                [-r - GAP - w, -h / 2],
              ]
        const boxes = tries.map(([dx, dy]) => ({
          x: Math.min(Math.max(at.x + dx, EDGE), vw - EDGE - w),
          y: Math.min(Math.max(at.y + dy, EDGE), vh - EDGE - h),
          w,
          h,
        }))
        let spot = boxes.find((box) => !placed.some((other) => overlaps(box, other))) ?? null
        // The selected label always shows; it may cover a marker, never the copy.
        if (!spot && i === sel && copy) {
          const panel = { x: copy.left, y: copy.top, w: copy.width, h: copy.height }
          spot = boxes.find((box) => !overlaps(box, panel)) ?? null
        }
        if (!spot) {
          el.style.opacity = '0'
          continue
        }
        placed.push(spot)
        el.style.opacity = String(fade)
        el.style.transform = `translate3d(${Math.round(spot.x)}px, ${Math.round(spot.y)}px, 0)`
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [handle, pins, selected])

  return (
    <div className="hb-pins" aria-hidden="true">
      {pins.map((pin, i) => (
        <div
          key={pin.label}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="hb-pin"
          data-kind={i === 5 ? 'answer' : undefined}
          data-selected={i === selected ? '' : undefined}
          style={{ '--tone': pin.tone } as CSSProperties}
        >
          <div className="hb-pin-card hb-mono">
            <b>{pin.label}</b>
            {i === selected || i >= 4 ? <span>{pin.note}</span> : null}
            {i === selected && pin.move ? <em>{pin.move}</em> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

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
  scan,
  onPick,
}: {
  scores: number[]
  /** Label and colour per beacon in place of a score; see `ValleyOptions.marks`. */
  marks?: BeaconMark[]
  beacons?: BeaconView[]
  /** Bump `n` to fire a claim surge at beacon `index`. */
  burst?: { index: number; n: number } | null
  /** Pins for the scan view. Turns on the home page's scan view (grid, threads, your site). */
  scan?: ScanPin[]
  /** Called with a landmark's index (0-4) when the visitor clicks it in the scan view. */
  onPick?: (index: number) => void
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
  // null until the visitor chooses; the scan view then opens on its own once.
  const [scanChoice, setScanChoice] = useState<boolean | null>(null)
  const [scanAuto, setScanAuto] = useState(false)
  const scanOn = Boolean(scan) && live && (scanChoice ?? scanAuto)
  const hasScan = Boolean(scan)
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
          scan: hasScan,
          shiftRight: hasScan ? 0.15 : 0,
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

      // The scan view opens on its own a moment after the valley appears, so the
      // first thing a visitor sees is the land and the second is what it means.
      const autoScan = window.setTimeout(() => setScanAuto(true), 1400)

      const sync = () => valley.setPaused(document.hidden)
      document.addEventListener('visibilitychange', sync)
      const onMotion = () => valley.setReducedMotion(reducedQuery.matches || storedCalm())
      reducedQuery.addEventListener('change', onMotion)

      cleanup = () => {
        window.clearTimeout(autoScan)
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
    // The valley is built once; `hasScan` is fixed for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    handle.current?.setScan(scanOn)
  }, [scanOn])

  // Click a landmark to select it; the cursor shows which ones answer a click.
  useEffect(() => {
    if (!scanOn || !onPick) return
    const blocked = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest('a,button,input,textarea,select,label,summary,[role="button"],.hb-panel,.hb-note,.hb-leaf,.hb-hero-copy,.hb-valley-ctl,.hb-topbar'))
    const nearest = (x: number, y: number): number | null => {
      if (pinFade() <= 0) return null
      let best: number | null = null
      let bestD = PICK_RADIUS
      for (let i = 0; i < 5; i++) {
        const at = handle.current?.screenOf(i)
        if (!at) continue
        const d = Math.hypot(at.x - x, at.y - y)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      return best
    }
    const onClick = (e: MouseEvent) => {
      if (blocked(e.target)) return
      const i = nearest(e.clientX, e.clientY)
      if (i !== null) onPick(i)
    }
    let hot = false
    const onMove = (e: PointerEvent) => {
      const next = !blocked(e.target) && nearest(e.clientX, e.clientY) !== null
      if (next === hot) return
      hot = next
      document.body.style.cursor = next ? 'pointer' : ''
    }
    document.addEventListener('click', onClick)
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('pointermove', onMove)
      document.body.style.cursor = ''
    }
  }, [scanOn, onPick])

  const selected = beacons ? beacons.findIndex((b) => b.selected) : -1

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
      {scan && scanOn ? <ScanPins handle={handle} pins={scan} selected={selected} /> : null}
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
          {hasScan && live ? (
            <button
              type="button"
              className="hb-valley-toggle hb-mono"
              aria-pressed={scanOn}
              onClick={() => setScanChoice(!scanOn)}
            >
              Scan view: {scanOn ? 'On' : 'Off'}
            </button>
          ) : null}
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
