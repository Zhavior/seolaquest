'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const RadarDemo = dynamic(
  () => import('@/features/radar/components/RadarDemo').then((module) => module.RadarDemo),
  { loading: () => <div className="h-96 w-full animate-pulse bg-black/5" /> },
)

export function LandingRadarDemo() {
  const boundaryRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const boundary = boundaryRef.current
    if (!boundary || !('IntersectionObserver' in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(boundary)
    return () => observer.disconnect()
  }, [])

  return (
    <div id="demo" ref={boundaryRef} className="min-h-96 scroll-mt-24">
      {shouldLoad ? <RadarDemo /> : <div className="h-96 w-full bg-black/5" aria-hidden="true" />}
    </div>
  )
}
