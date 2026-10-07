'use client'

import { useEffect, useRef, useState } from 'react'
import type { TocHeading } from '@/lib/blog-types'
import { stripEmoji } from '../text'

/**
 * The article's table of contents, hung in the margin column. Tracks the
 * heading being read. On narrow screens it collapses into a disclosure so the
 * article, not the list, is what the reader lands on.
 */
export function TocNav({ toc }: { toc: TocHeading[] }) {
  const [active, setActive] = useState('')
  const details = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (window.matchMedia('(min-width: 62rem)').matches && details.current) details.current.open = true
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )
    for (const heading of toc) {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  return (
    <details ref={details} className="hb-tocbox">
      <summary className="hb-tocbox-summary">In this article</summary>
      <nav aria-label="Table of contents">
        <ol className="hb-toc">
          {toc
            .filter((heading) => heading.level > 1)
            .map((heading) => (
              <li key={heading.id} data-level={heading.level}>
                <a href={`#${heading.id}`} aria-current={active === heading.id ? 'location' : undefined}>
                  {stripEmoji(heading.text)}
                </a>
              </li>
            ))}
        </ol>
      </nav>
    </details>
  )
}
