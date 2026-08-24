'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * The one thing this page used `framer-motion` for that CSS cannot do itself.
 *
 * Read through `useSyncExternalStore` so the server render takes the safe
 * branch (no motion) and the client re-reads the real preference after
 * hydration, rather than mismatching on the first paint.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  )
}
