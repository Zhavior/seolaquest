'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { 
  Zap, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  FileText, 
  Lock, 
  Terminal, 
  Cpu, 
  BookOpen, 
  ExternalLink,
  Swords,
  Sparkles
} from 'lucide-react'
import { sfx } from '@/lib/sfx'

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    sfx.playCoinDrop()
    setSubscribed(true)
  }

  const legalNavItems = [
    { label: 'KNOWLEDGE VAULT', href: '/blog', icon: BookOpen, color: 'bg-[#FFE600] hover:bg-[#FFF7AA]' },
    { label: 'SYSTEM SPECS', href: '/specs', icon: Cpu, color: 'bg-[#06B6D4] text-white hover:bg-[#67E8F9]' },
    { label: 'TERMS', href: '/terms', icon: FileText, color: 'bg-[#A3E635] hover:bg-[#BEF264]' },
    { label: 'PRIVACY', href: '/privacy', icon: Lock, color: 'bg-[#FF5722] text-white hover:bg-[#FF7A50]' },
    { label: 'API POLICY', href: '/api-terms', icon: Terminal, color: 'bg-[#A855F7] text-white hover:bg-[#C084FC]' },
  ]

  return (
    <footer className="border-t-4 border-black bg-white text-black mt-20 relative z-20 overflow-hidden font-sans">
      
      {/* ⚔️ TOP ENGINE BANNER & DIRECTORY BAR (AS SPECIFIED) */}
      <div className="border-b-4 border-black bg-black text-white p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Engine Header Ribbon */}
          <div className="inline-flex items-center gap-3 border-3 border-black bg-[#FFE600] px-4 sm:px-6 py-2 text-xs sm:text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#fff]">
            <Swords size={18} className="animate-bounce" />
            <span>COQUEST ENGINE v2.4 • BUILT FOR B2B SPEED-TO-LEAD</span>
            <Sparkles size={16} />
          </div>

          {/* Core Link Pills requested in Task Spec */}
          <div className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            {legalNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => sfx.playHoverBlip()}
                  onClick={() => sfx.playCoinDrop()}
                  className={`inline-flex items-center gap-2 border-3 border-black px-4 py-2.5 text-xs sm:text-sm font-black uppercase transition-all duration-150 shadow-[3px_3px_0_0_#fff] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none text-black ${item.color}`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span>[{item.label}]</span>
                </Link>
              )
            })}
          </div>

        </div>
      </div>

      {/* Newsletter Banner Box */}
      <div className="border-b-4 border-black bg-[#8A2BE2] p-8 md:p-12 text-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
              <Mail size={14} /> DAILY SPEED-TO-LEAD PLAYBOOK
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Get High-Converting SaaS Growth Tactics Weekly
            </h3>
            <p className="text-sm font-bold text-white/90 max-w-xl">
              Join 4,000+ B2B growth leaders receiving real-time signal benchmarks, API architecture breakdowns, and guild lore.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            {subscribed ? (
              <div className="flex items-center gap-2 border-3 border-black bg-[#A3E635] px-6 py-3 font-black uppercase text-black shadow-[4px_4px_0_0_#000]">
                <CheckCircle2 size={18} /> YOU ARE IN THE GUILD FEED! 🪙
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => sfx.playHoverBlip()}
                  placeholder="Enter hunter email..."
                  required
                  className="border-3 border-black bg-white px-4 py-3 font-bold text-sm text-black placeholder:text-zinc-500 shadow-[4px_4px_0_0_#000] focus:outline-none focus:bg-[#FFF7AA] w-full sm:w-72"
                />
                <button
                  type="submit"
                  onMouseEnter={() => sfx.playHoverBlip()}
                  className="flex items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-6 py-3 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <span>Subscribe</span>
                  <ArrowRight size={16} strokeWidth={3} />
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Multi-Column Directory */}
      <div className="max-w-7xl mx-auto p-8 md:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <Link
            href="/"
            onClick={() => sfx.playCoinDrop()}
            className="flex items-center gap-2 font-black uppercase text-xl text-black"
          >
            <Zap className="fill-[#FFE600] text-black stroke-[2.5px] w-7 h-7" /> COQUEST ENGINE
          </Link>
          <p className="text-xs font-bold text-zinc-700 leading-relaxed">
            Gamified B2B social listening engine, speed-to-lead automated response dispatcher, and developer Mana vault.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase">
            <span className="inline-flex items-center gap-1 border-2 border-black bg-blue-100 px-2 py-0.5 text-blue-800 shadow-[2px_2px_0_0_#000]">
              <Shield size={12} /> REVISION v2.4
            </span>
            <span className="inline-flex items-center gap-1 border-2 border-black bg-emerald-100 px-2 py-0.5 text-emerald-800 shadow-[2px_2px_0_0_#000]">
              🟢 99.9% UPTIME
            </span>
          </div>
        </div>

        {/* Platform Navigation */}
        <div className="space-y-3">
          <h4 className="font-black uppercase text-xs text-zinc-500 tracking-wider flex items-center gap-1.5">
            <Swords size={14} className="text-[#8A2BE2]" /> HUNTER PLATFORM
          </h4>
          <ul className="space-y-2.5 text-xs font-black uppercase">
            <li>
              <Link href="/dashboard" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#8A2BE2] hover:underline flex items-center gap-2 transition-colors">
                <span>⚡</span> Radar Dashboard
              </Link>
            </li>
            <li>
              <Link href="/guild" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#8A2BE2] hover:underline flex items-center gap-2 transition-colors">
                <span>🛡️</span> Guild Hall
              </Link>
            </li>
            <li>
              <Link href="/keys" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#8A2BE2] hover:underline flex items-center gap-2 transition-colors">
                <span>🔑</span> API Key Vault
              </Link>
            </li>
            <li>
              <Link href="/billing" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#8A2BE2] hover:underline flex items-center gap-2 transition-colors">
                <span>💳</span> Mana & Billing
              </Link>
            </li>
            <li>
              <Link href="/settings" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#8A2BE2] hover:underline flex items-center gap-2 transition-colors">
                <span>⚙️</span> Hunter Settings
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div className="space-y-3">
          <h4 className="font-black uppercase text-xs text-zinc-500 tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-[#06B6D4]" /> GOVERNANCE & LAWS
          </h4>
          <ul className="space-y-2.5 text-xs font-black uppercase">
            <li>
              <Link href="/terms" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#06B6D4] hover:underline flex items-center gap-2 transition-colors">
                <span>📜</span> Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#06B6D4] hover:underline flex items-center gap-2 transition-colors">
                <span>🔒</span> Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/api-terms" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#06B6D4] hover:underline flex items-center gap-2 transition-colors">
                <span>🧪</span> API Usage & Mana Terms
              </Link>
            </li>
            <li>
              <Link href="/specs" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-[#06B6D4] hover:underline flex items-center gap-2 transition-colors">
                <span>⚡</span> Architecture Specifications
              </Link>
            </li>
          </ul>
        </div>

        {/* Knowledge & Lore */}
        <div className="space-y-3">
          <h4 className="font-black uppercase text-xs text-zinc-500 tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#A3E635]" /> VAULT & COMMUNITY
          </h4>
          <ul className="space-y-2.5 text-xs font-black uppercase">
            <li>
              <Link href="/blog" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-emerald-600 hover:underline flex items-center gap-2 transition-colors">
                <span>📜</span> Speed-to-Lead Playbooks
              </Link>
            </li>
            <li>
              <Link href="/blog" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-emerald-600 hover:underline flex items-center gap-2 transition-colors">
                <span>🐉</span> Guild Lore & Tactics
              </Link>
            </li>
            <li>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-emerald-600 hover:underline flex items-center gap-2 transition-colors">
                <span>📣</span> Town Crier (X / Twitter) <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <a href="mailto:support@coquest.com" onMouseEnter={() => sfx.playHoverBlip()} className="hover:text-emerald-600 hover:underline flex items-center gap-2 transition-colors">
                <span>🧙‍♂️</span> Contact Guildmaster
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t-3 border-black bg-[#F4F0EA] p-4 text-center text-xs font-black uppercase text-zinc-700 tracking-wider">
        © 2026 COQUEST ENGINE • ALL RIGHTS RESERVED • HIGH-OCTANE B2B SPEED-TO-LEAD AUTOMATION
      </div>
    </footer>
  )
}
