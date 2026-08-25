'use client'

import { useEffect, useRef } from 'react'
import { PARTICLE_COLORS } from '../theme'

/** Hard cap. The field is ambience; it is not allowed to cost a frame. */
const NODE_COUNT = 30
/** CSS px per second. Slow enough to read as drift rather than as motion. */
const MAX_DRIFT = 5
/** Above ~1.5 the backing store grows faster than the effect improves. */
const MAX_DPR = 1.5

type Node = {
  x: number
  y: number
  vx: number
  vy: number
  /** Side length in CSS px. Squares, not dots — this is a pixel field. */
  size: number
  color: string
}

/**
 * Ambient micro-particles behind the console grid.
 *
 * Fixed-position canvas, so scrolling never invalidates it and the drift cost
 * is bounded by the viewport rather than by page height. The loop is parked
 * whenever the tab is hidden and never starts at all under
 * `prefers-reduced-motion` — a background animation nobody asked for is the
 * first thing that should stop.
 *
 * Positions are seeded inside an effect, so this renders as an empty canvas on
 * the server and cannot mismatch on hydration.
 */
export function ParticleField({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let nodes: Node[] = []
    let frame = 0
    let lastTimestamp = 0

    const seed = () => {
      nodes = Array.from({ length: NODE_COUNT }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2 * MAX_DRIFT,
        vy: (Math.random() - 0.5) * 2 * MAX_DRIFT,
        size: 3 + Math.round(Math.random() * 5),
        // Cycled rather than random so the accent squares stay a minority at
        // any field size instead of clumping by chance.
        color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
      }))
    }

    const applySize = () => {
      const nextWidth = window.innerWidth
      const nextHeight = window.innerHeight
      if (nextWidth === 0 || nextHeight === 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(nextWidth * dpr)
      canvas.height = Math.round(nextHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const hadNodes = nodes.length > 0
      const scaleX = width === 0 ? 1 : nextWidth / width
      const scaleY = height === 0 ? 1 : nextHeight / height
      width = nextWidth
      height = nextHeight

      // Rescale rather than reseed on resize, so dragging a window edge does
      // not visibly teleport the whole field.
      if (hadNodes) {
        for (const node of nodes) {
          node.x *= scaleX
          node.y *= scaleY
        }
      } else {
        seed()
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const node of nodes) {
        ctx.fillStyle = node.color
        // Snapped to whole pixels: a square on a half-pixel is drawn as a
        // four-pixel blur, which reads as fog rather than as a pixel field.
        ctx.fillRect(Math.round(node.x), Math.round(node.y), node.size, node.size)
      }
    }

    const step = (delta: number) => {
      for (const node of nodes) {
        node.x += node.vx * delta
        node.y += node.vy * delta
        // Wrap instead of bouncing: a bounce puts every node on the edges
        // eventually, which turns the field into a frame.
        if (node.x < -node.size) node.x = width + node.size
        else if (node.x > width + node.size) node.x = -node.size
        if (node.y < -node.size) node.y = height + node.size
        else if (node.y > height + node.size) node.y = -node.size
      }
    }

    const tick = (timestamp: number) => {
      const delta = lastTimestamp === 0 ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.05)
      lastTimestamp = timestamp
      step(delta)
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

    applySize()
    draw()
    start()

    const onResize = () => {
      applySize()
      if (reducedMotion) draw()
    }
    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else start()
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
