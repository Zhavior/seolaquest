'use client'
import Link from 'next/link'
import { useState } from 'react'

export function HQNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b-4 border-outline"
      style={{ background: '#f4ebd8' }}
      aria-label="SEOlaQuest navigation"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 sm:h-[72px]">

        {/* Logo mark */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <span
            className="flex h-9 w-9 items-center justify-center border-4 border-outline font-black text-ink text-lg leading-none shadow-brutal group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform"
            style={{ background: '#FFE600' }}
            aria-hidden="true"
          >
            ⚔
          </span>
          <div className="hidden sm:flex flex-col">
            <span className="text-xl font-black uppercase tracking-[0.15em] leading-none">SEOlaQuest</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">AI Lead Guild</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'How It Works', href: '#features' },
            { label: 'Ranking Board', href: '#leaderboard' },
            { label: 'Treasury', href: '/pricing' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="px-4 py-2 text-sm font-black uppercase tracking-wider border-2 border-transparent hover:border-outline hover:shadow-brutal-sm transition-all"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA cluster */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden sm:inline-flex items-center px-5 py-2.5 border-3 border-outline font-black uppercase tracking-widest text-sm bg-card hover:bg-inset shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-5 py-2.5 border-3 border-outline font-black uppercase tracking-widest text-sm text-ink shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-transform"
            style={{ background: '#ff4500' }}
          >
            Join Guild
          </Link>
          <button
            className="md:hidden p-2 border-2 border-outline font-black"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t-4 border-outline px-4 pb-5 pt-4 flex flex-col gap-3" style={{ background: '#f4ebd8' }}>
          {[
            { label: 'How It Works', href: '#features' },
            { label: 'Ranking Board', href: '#leaderboard' },
            { label: 'Treasury / Pricing', href: '/pricing' },
            { label: 'Sign In', href: '/sign-in' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 border-2 border-outline font-black uppercase tracking-wider text-sm bg-card shadow-brutal-sm"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
