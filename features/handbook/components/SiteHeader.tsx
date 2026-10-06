'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Brand } from './Brand'

const LINKS = [
  { label: 'The Hunt', href: '/#hunt' },
  { label: 'Quests', href: '/#quests' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Field Notes', href: '/blog' },
]

/**
 * Fixed top bar. It floats clear over the scene and gains a dark glass backing
 * once the page scrolls, so the links stay legible over any sky.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="hb-topbar" data-scrolled={scrolled ? '' : undefined}>
      <Brand />
      <nav className="hb-links" aria-label="Sections">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <nav className="hb-account" aria-label="Account">
        <Link href="/sign-in" className="hb-top-link">
          Sign in
        </Link>
        <Link href="/sign-up" className="hb-btn hb-btn--small">
          Start free
        </Link>
      </nav>
    </header>
  )
}
