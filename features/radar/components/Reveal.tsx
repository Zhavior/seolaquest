'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

/**
 * Scroll-reveal wrapper for the radar sections.
 *
 * An IntersectionObserver plus a CSS transition, rather than `framer-motion`:
 * the library is 133 KB and this page used it for four fades, which put the
 * route over its bundle budget on its own. The observer disconnects on first
 * intersection, so a section that has been read never re-animates.
 *
 * The easing matches the landing page's `fadeUp` so the two pages move alike.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShown(true)
        observer.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  // Reduced motion renders the settled state with no transition attached at
  // all, so there is nothing for a preference change to interrupt mid-flight.
  if (prefersReducedMotion) return <div className={className}>{children}</div>

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[18px] opacity-0',
        className,
      )}
      style={shown && delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
