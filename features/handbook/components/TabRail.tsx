'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties } from 'react'
import {
  BookOpen,
  Crosshair,
  Package,
  PenLine,
  Play,
  ScrollText,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { VOLUMES, tokensFor, volumeForPath, type VolumeId } from '../tokens'

const ICONS: Record<VolumeId, LucideIcon> = {
  start: BookOpen,
  hunt: Crosshair,
  try: Play,
  quests: ScrollText,
  inventory: Package,
  notes: PenLine,
  errata: TriangleAlert,
}

/**
 * Stepped tab rail down the fore edge: one tab per volume. The current tab
 * takes the board's hue and sits flush with the page edge, so it reads as the
 * board itself. On the home page every volume is a chapter of the same scroll,
 * so the current tab follows whichever chapter crosses the reading line.
 */
export function TabRail() {
  const pathname = usePathname() ?? '/'
  const routeVolume = volumeForPath(pathname)
  const [sectionVolume, setSectionVolume] = useState<VolumeId | null>(null)
  const onHome = pathname === '/'

  useEffect(() => {
    if (!onHome) return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-volume]'))
    if (sections.length === 0 || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const volume = (entry.target as HTMLElement).dataset.volume as VolumeId | undefined
          if (volume) setSectionVolume(volume)
        }
      },
      { rootMargin: '-35% 0px -64% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [onHome])

  const current: VolumeId = onHome ? (sectionVolume ?? 'start') : routeVolume

  return (
    <nav className="hb-rail" aria-label="Handbook sections">
      <ul className="hb-rail-list">
        {VOLUMES.map((volume) => {
          const Icon = ICONS[volume.id]
          const tokens = tokensFor(volume.id)
          const isCurrent = volume.id === current
          const style = {
            '--tab': tokens.board,
            '--tab-ink': tokens.onBoard,
            '--weight': volume.weight,
          } as CSSProperties
          return (
            <li key={volume.id} className="hb-rail-item" style={style}>
              <Link
                href={volume.href}
                className="hb-tab"
                aria-current={isCurrent ? (onHome && volume.href.startsWith('/#') ? 'location' : 'page') : undefined}
              >
                <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
                <span className="hb-tab-label">{volume.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
