'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ValleyStage } from '../valley/ValleyStage'
import type { BeaconMark, BeaconView } from '../valley/scene'

/**
 * The home page's fixed valley. It sits behind every chapter and the camera
 * travels it as the whole page scrolls, so the journey down the page is a
 * journey through the valley. The hero's sample scan publishes the beacon
 * states here; the chapters are plain content floating over the scene.
 */

type Burst = { index: number; n: number }

type HomeStageApi = {
  scores: number[]
  setBeacons: (beacons: BeaconView[]) => void
  fire: (index: number) => void
}

const noop: HomeStageApi = { scores: [], setBeacons: () => {}, fire: () => {} }
const HomeStageContext = createContext<HomeStageApi>(noop)

export function useHomeStage(): HomeStageApi {
  return useContext(HomeStageContext)
}

export function HomeStage({
  scores,
  marks,
  children,
}: {
  scores: number[]
  marks?: BeaconMark[]
  children: ReactNode
}) {
  const [beacons, setBeacons] = useState<BeaconView[] | undefined>(undefined)
  const [burst, setBurst] = useState<Burst | null>(null)

  const fire = useCallback((index: number) => {
    setBurst((current) => ({ index, n: (current?.n ?? 0) + 1 }))
  }, [])

  const api = useMemo<HomeStageApi>(() => ({ scores, setBeacons, fire }), [scores, fire])

  return (
    <HomeStageContext.Provider value={api}>
      <ValleyStage scores={scores} marks={marks} beacons={beacons} burst={burst} />
      <div className="hb-home">{children}</div>
    </HomeStageContext.Provider>
  )
}
