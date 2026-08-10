'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const BattleAreaCanvas = dynamic(
  () => import('@/features/dashboard/components/battle/BattleAreaCanvas'),
  { ssr: false }
)

type DeferredBattleAreaCanvasProps = {
  userLevel?: number
}

/**
 * Loads the R3F battle canvas only after the browser is idle (or a short
 * fallback timeout). Mount this component only when the Progress / desktop
 * strategy surface is actually shown so Mission Control's first paint stays
 * free of the 3D chunk.
 */
export function DeferredBattleAreaCanvas({ userLevel }: DeferredBattleAreaCanvasProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const arm = () => {
      if (!cancelled) setReady(true)
    }

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(arm, { timeout: 2500 })
    } else {
      timeoutId = setTimeout(arm, 400)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  if (!ready) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-[200px] w-full items-center justify-center border-4 border-outline bg-emerald-950 font-mono text-xs font-black uppercase text-[#FFE600] md:h-[280px]"
      >
        3D viewport deferred until idle…
      </div>
    )
  }

  return <BattleAreaCanvas userLevel={userLevel} />
}

export default DeferredBattleAreaCanvas
