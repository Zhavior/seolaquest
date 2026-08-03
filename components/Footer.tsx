import Link from 'next/link'
import { BookOpen, Cpu, FileText, Lock, ReceiptText, Terminal, Zap } from 'lucide-react'

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
    <footer className="relative z-20 mt-20 border-t-4 border-black bg-white text-black">
      <div className="border-b-4 border-black bg-black px-6 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-black uppercase text-[#FFE600]">
              <Zap className="fill-[#FFE600]" /> CoQuest Engine
            </Link>
            <p className="mt-2 text-sm font-bold leading-relaxed text-zinc-300">
              Keyword-based opportunity research with measured results. Provider availability, production readiness, and paid access are
              shown explicitly inside the product.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {links.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 border-2 border-white bg-white px-3 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_0_#FFE600]"
                >
                  <Icon size={14} /> {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs font-bold text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 CoQuest</span>
        <span>No public uptime SLA or API availability is currently offered.</span>
      </div>
    </footer>
  )
}
