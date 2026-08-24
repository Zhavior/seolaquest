'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { SampleTarget } from '../data/sample-targets'

const RING_COUNT = 4
const SWEEP_RADIANS_PER_SECOND = Math.PI * 0.55
const HIT_RADIUS_PX = 26
/** Gap between the outer ring and the panel edge, in CSS px. */
const RING_INSET_PX = 18

const BLIP_COLOR: Record<SampleTarget['rarity'], string> = {
  LEGENDARY: '#FFB800',
  EPIC: '#8B5CF6',
  RARE: '#00FF66',
  COMMON: '#94A3B8',
}

type Props = {
  targets: SampleTarget[]
  selectedId: string
  onSelect: (target: SampleTarget) => void
  /** When true the sweep is drawn once, parked, and never animated. */
  reducedMotion: boolean
}

/**
 * The scope is decorative-plus-pointer: it is `aria-hidden` and every target it
 * draws is also rendered as a real button underneath it, so the mouse path and
 * the keyboard path reach the same state. Canvas hit-testing alone would have
 * made the primary interaction of the page unreachable without a pointer.
 */
export function RadarScope({ targets, selectedId, onSelect, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // The draw loop reads live values through refs. Passing them as effect
  // dependencies instead would tear down and restart the animation on every
  // selection change, which visibly resets the sweep.
  const stateRef = useRef({ targets, selectedId })

  const sizeRef = useRef({ width: 0, height: 0 })
  // Populated by the draw effect so a parked (reduced-motion) scope can be
  // repainted on demand when the selection or the filter changes.
  const redrawRef = useRef<(() => void) | null>(null)

  const positionOf = useCallback((target: SampleTarget) => {
    const { width, height } = sizeRef.current
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.max(Math.min(cx, cy) - RING_INSET_PX, 0)
    // Bearing is compass-style: 0deg points up, angles run clockwise.
    const radians = ((target.bearing - 90) * Math.PI) / 180
    return {
      x: cx + Math.cos(radians) * maxRadius * target.range,
      y: cy + Math.sin(radians) * maxRadius * target.range,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let sweep = reducedMotion ? Math.PI * 0.25 : 0
    let lastTimestamp = 0
    let visible = true

    const applySize = () => {
      const rect = parent.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      // Backing store in device pixels, drawing commands in CSS pixels. Without
      // this the scope is drawn at 420x320 and stretched by CSS, which blurs
      // the rings and squashes the labels on every display.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width: rect.width, height: rect.height }
    }

    const draw = () => {
      const { width, height } = sizeRef.current
      if (width === 0 || height === 0) return

      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(cx, cy) - RING_INSET_PX

      ctx.clearRect(0, 0, width, height)

      // A parent narrower than twice the ring inset makes the radius negative,
      // and `ctx.arc` throws on a negative radius rather than drawing nothing.
      // That happens for real during the first layout pass on a narrow column,
      // so the scope has to survive it instead of taking the page down.
      if (radius <= 0) return

      ctx.fillStyle = '#0A0A0A'
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(0, 255, 102, 0.22)'
      ctx.lineWidth = 1
      for (let ring = 1; ring <= RING_COUNT; ring += 1) {
        ctx.beginPath()
        ctx.arc(cx, cy, (radius / RING_COUNT) * ring, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(cx - radius, cy)
      ctx.lineTo(cx + radius, cy)
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx, cy + radius)
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.14)'
      ctx.stroke()

      const cone = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius)
      cone.addColorStop(0, 'rgba(0, 255, 102, 0.38)')
      cone.addColorStop(1, 'rgba(0, 255, 102, 0)')
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, sweep - 0.5, sweep)
      ctx.closePath()
      ctx.fillStyle = cone
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius)
      ctx.strokeStyle = '#00FF66'
      ctx.lineWidth = 2
      ctx.stroke()

      const { targets: liveTargets, selectedId: liveSelectedId } = stateRef.current
      for (const target of liveTargets) {
        const { x, y } = positionOf(target)
        const isSelected = target.id === liveSelectedId
        const color = isSelected ? '#FFE600' : BLIP_COLOR[target.rarity]

        if (isSelected) {
          ctx.beginPath()
          ctx.arc(x, y, 14, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#0A0A0A'
        ctx.fill()

        ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.fillStyle = isSelected ? '#FFE600' : '#E2E8F0'
        // Keep the label inside the panel when the blip sits near the right edge.
        const labelWidth = ctx.measureText(target.competitor).width
        const flip = x + 12 + labelWidth > width - 4
        ctx.textAlign = flip ? 'right' : 'left'
        ctx.fillText(target.competitor, flip ? x - 12 : x + 12, y + 4)
        ctx.textAlign = 'left'
      }
    }

    const tick = (timestamp: number) => {
      const delta = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp
      sweep = (sweep + delta * SWEEP_RADIANS_PER_SECOND) % (Math.PI * 2)
      draw()
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (reducedMotion || frame !== 0) return
      lastTimestamp = 0
      frame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
    }

    redrawRef.current = draw

    applySize()
    draw()
    if (!reducedMotion) start()

    const resizeObserver = new ResizeObserver(() => {
      applySize()
      draw()
    })
    resizeObserver.observe(parent)

    // A radar sweep repainting every frame in a background tab or below the
    // fold is pure battery cost, so the loop only runs when it can be seen.
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      if (visible && !document.hidden) start()
      else stop()
    })
    intersectionObserver.observe(parent)

    const onVisibilityChange = () => {
      if (document.hidden || !visible) stop()
      else start()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      redrawRef.current = null
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [positionOf, reducedMotion])

  // Publish the new state to the draw loop and repaint immediately, so a parked
  // (reduced-motion) scope still reflects the change.
  useEffect(() => {
    stateRef.current = { targets, selectedId }
    redrawRef.current?.()
  }, [targets, selectedId])

  const handlePointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top

    let nearest: SampleTarget | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const target of targets) {
      const { x, y } = positionOf(target)
      const distance = Math.hypot(x - px, y - py)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = target
      }
    }

    // Clicking empty space keeps the current lock rather than snapping to a
    // blip the user was not aiming at.
    if (nearest && nearestDistance <= HIT_RADIUS_PX) onSelect(nearest)
  }

  return (
    <div className="relative aspect-[4/3] w-full border-4 border-outline bg-[#0A0A0A] shadow-brutal">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onClick={handlePointer}
        className="absolute inset-0 block h-full w-full cursor-crosshair"
      />
      {targets.length === 0 ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-xs font-bold text-[#94A3B8]">
          No sample threads match this filter.
        </p>
      ) : null}
    </div>
  )
}
