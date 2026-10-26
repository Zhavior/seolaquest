'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { ValleyStage, type ScanPin } from '../valley/ValleyStage'
import type { BeaconMark, BeaconView } from '../valley/scene'

/**
 * The home page's fixed valley. It sits behind every chapter and the camera
 * travels it as the whole page scrolls, so the journey down the page is a
 * journey through the valley. The hero's sample scan publishes the beacon
 * states here; the chapters are plain content floating over the scene.
 * With `scan` pins the valley also shows the sample scan as a scene: your
 * site, the answer and a thread from each cited source.
 */

type Burst = { index: number; n: number }

type HomeStageApi = {
  scores: number[]
  setBeacons: (beacons: BeaconView[]) => void
  fire: (index: number) => void
  /** Register what happens when a landmark is clicked in the scan view. */
  onPick: (handler: ((index: number) => void) | null) => void
}

const noop: HomeStageApi = { scores: [], setBeacons: () => {}, fire: () => {}, onPick: () => {} }
const HomeStageContext = createContext<HomeStageApi>(noop)

export function useHomeStage(): HomeStageApi {
  return useContext(HomeStageContext)
}

export function HomeStage({
  scores,
  marks,
  scan,
  children,
}: {
  scores: number[]
  marks?: BeaconMark[]
  scan?: ScanPin[]
  children: ReactNode
}) {
  const [beacons, setBeacons] = useState<BeaconView[] | undefined>(undefined)
  const [burst, setBurst] = useState<Burst | null>(null)

  const fire = useCallback((index: number) => {
    setBurst((current) => ({ index, n: (current?.n ?? 0) + 1 }))
  }, [])

  const pickRef = useRef<((index: number) => void) | null>(null)
  const onPick = useCallback((handler: ((index: number) => void) | null) => {
    pickRef.current = handler
  }, [])
  const pick = useCallback((index: number) => pickRef.current?.(index), [])

  const api = useMemo<HomeStageApi>(() => ({ scores, setBeacons, fire, onPick }), [scores, fire, onPick])

  return (
    <HomeStageContext.Provider value={api}>
      <ValleyStage scores={scores} marks={marks} beacons={beacons} burst={burst} scan={scan} onPick={pick} />
      <div className="hb-home">{children}</div>
    </HomeStageContext.Provider>
  )
}
