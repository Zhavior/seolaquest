'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

export function MotionPreferenceProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  )
}
