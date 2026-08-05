import Link from 'next/link'

const LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'API Terms', href: '/api-terms' },
  { label: 'Sign In', href: '/sign-in' },
]

export function HQFooter() {
  return (
    <footer className="border-t-4 border-outline px-4 sm:px-6 py-10" style={{ background: '#f4ebd8' }}>
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center border-4 border-outline font-black text-lg shadow-brutal-sm"
            style={{ background: '#FFE600' }}
            aria-hidden="true"
          >
            ⚔
          </span>
          <div>
            <div className="font-black uppercase tracking-widest text-sm">SEO la Quest</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink/40">
              © {new Date().getFullYear()} SEO la Quest. All rights reserved.
            </div>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-black uppercase tracking-widest text-ink/50 hover:text-ink transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
