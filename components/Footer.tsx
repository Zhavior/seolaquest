import Link from 'next/link'
import { ArrowRight, BookOpen, Cpu, FileText, Lock, ReceiptText, Terminal, Zap } from 'lucide-react'

const links = [
  { label: 'Pricing', href: '/pricing', icon: ReceiptText },
  { label: 'Blog', href: '/blog', icon: BookOpen },
  { label: 'System status', href: '/status', icon: Cpu },
  { label: 'Terms', href: '/terms', icon: FileText },
  { label: 'Privacy', href: '/privacy', icon: Lock },
  { label: 'API status', href: '/api-terms', icon: Terminal },
]

export function Footer() {
  return (
    <footer className="relative z-20 mt-20 border-t-4 border-outline bg-card text-ink">
      <div className="border-b-4 border-outline bg-black px-6 py-8 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-10">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-black uppercase text-[#FFE600]">
              <Zap className="fill-[#FFE600]" /> SEOlaQuest Engine
            </Link>
            <p className="mt-2 text-sm font-bold leading-relaxed text-white/75">
              Find relevant customer conversations on X. Review the source and decide what to investigate next.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end md:justify-start">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 border-4 border-outline bg-accent px-5 py-3 text-sm font-black uppercase text-on-accent shadow-[6px_6px_0_0_#ff5a36] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#ff5a36]"
            >
              Create free account
              <ArrowRight size={16} />
            </Link>

            <div className="grid grid-cols-2 gap-3 md:max-w-[420px] md:justify-items-end">
              {links.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 border-2 border-white bg-card px-3 py-2 text-xs font-black uppercase text-ink shadow-[2px_2px_0_0_#FFE600]"
                  >
                    <Icon size={14} /> {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs font-bold text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 SEOlaQuest</span>
        <span>No public uptime SLA or open API access is currently available.</span>
      </div>
    </footer>
  )
}
