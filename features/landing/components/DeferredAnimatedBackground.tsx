'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const AnimatedBackgroundWeapons = dynamic(
  () => import('./AnimatedBackgroundWeapons').then((m) => m.AnimatedBackgroundWeapons),
  { ssr: false }
)

export function DeferredAnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  if (!mounted) return null
  return <AnimatedBackgroundWeapons />
}
