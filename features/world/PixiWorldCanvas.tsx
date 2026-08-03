'use client'

import { useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'

export default function PixiWorldCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let app: Application | null = null

    const start = async () => {
      if (!containerRef.current) return

      app = new Application()

      await app.init({
        width: containerRef.current.clientWidth || 480,
        height: 260,
        background: '#0f172a',
        antialias: false,
        resolution: window.devicePixelRatio || 1,
      })

      containerRef.current.replaceChildren(app.canvas)

      const world = new Container()
      app.stage.addChild(world)

      const ground = new Graphics()
        .rect(0, 180, app.renderer.width, 80)
        .fill(0x2f855a)

      world.addChild(ground)

      const hero = new Graphics()
        .rect(0, 0, 24, 32)
        .fill(0xfacc15)

      hero.x = 40
      hero.y = 148

      world.addChild(hero)

      let direction: 1 | -1 = 1

      app.ticker.add((ticker) => {
        hero.x += direction * 1.5 * ticker.deltaTime

        if (hero.x > app!.renderer.width - 40) direction = -1
        if (hero.x < 40) direction = 1
      })

      const handleResize = async () => {
        if (!containerRef.current || !app) return

        app.renderer.resize(
          containerRef.current.clientWidth || 480,
          260,
        )

        ground.clear()
        ground.rect(0, 180, app.renderer.width, 80).fill(0x2f855a)
      }

      window.addEventListener('resize', handleResize)

      ;(app.canvas as HTMLCanvasElement).dataset.resizeListener = 'true'

      return handleResize
    }

    let resizeHandler: (() => void | Promise<void>) | undefined

    start().then((handler) => {
      resizeHandler = handler
    })

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }

      app?.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="h-[260px] w-full" />
}
