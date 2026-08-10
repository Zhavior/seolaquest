import type { Variants } from 'framer-motion'

/** Section enter for Mission Control — use with `useReducedMotion()`. */
export const dashboardSectionReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export const dashboardStaticReveal: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
}

export function dashboardReveal(shouldReduceMotion: boolean | null): Variants {
  return shouldReduceMotion ? dashboardStaticReveal : dashboardSectionReveal
}

/** Scroll without hijacking users who prefer reduced motion. */
export function scrollToDashboardId(id: string, preferReducedMotion: boolean | null) {
  const el = document.getElementById(id)
  const behavior: ScrollBehavior = preferReducedMotion ? 'auto' : 'smooth'
  if (el) {
    el.scrollIntoView({ behavior, block: 'start' })
    return
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior })
}
