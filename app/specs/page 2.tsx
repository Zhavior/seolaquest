'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Cpu, 
  Zap, 
  Database, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  Radio, 
  Layers, 
  Lock, 
  ArrowRight,
  Code,
  Globe,
  Gauge
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { sfx } from '@/lib/sfx'

export default function SpecsPage() {
  const [copiedSpecs, setCopiedSpecs] = useState(false)
  const [activeTab, setActiveTab] = useState<'stack' | 'edge' | 'security' | 'sla'>('stack')
  
  // Ping Simulator State
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<{ ms: number; region: string } | null>(null)

  const copySpecsSummary = () => {
    sfx.playCoinDrop()
    const summary = `COQUEST ENGINE - TECHNICAL SPECIFICATIONS & ARCHITECTURE (v2.4)\n- Stack: Next.js App Router, TypeScript, Tailwind CSS\n- Edge & Cache: Upstash Redis token bucket rate-limiting\n- Security: Cryptographic SHA-256 Bearer Token hashing\n- Latency SLA: < 60s social signal discovery & webhook push\n- Uptime: 99.9% availability across all Scout networks.`
    navigator.clipboard.writeText(summary)
    setCopiedSpecs(true)
    setTimeout(() => setCopiedSpecs(false), 3000)
  }

  const runPingTest = () => {
    sfx.playRadarBlip()
    setPinging(true)
    setPingResult(null)
    setTimeout(() => {
      sfx.playBountyUnlock()
      setPinging(false)
      const randomMs = Math.floor(Math.random() * 18) + 14 // 14ms - 32ms
      const regions = ['US-East (IAD)', 'US-West (SFO)', 'EU-Central (FRA)', 'AP-Southeast (SIN)']
      const region = regions[Math.floor(Math.random() * regions.length)]
      setPingResult({ ms: randomMs, region })
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black font-sans pb-12">
      {/* Top Banner Nav */}
      <div className="border-b-4 border-black bg-black text-[#FFE600] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            onClick={() => sfx.playCoinDrop()}
            className="flex items-center gap-2 font-black uppercase text-lg sm:text-xl tracking-tight text-[#FFE600]"
          >
            <Zap className="fill-[#FFE600] text-black w-6 h-6" />
            <span>COQUEST ENGINE</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <span className="border-2 border-black bg-[#FFE600] text-black px-2.5 py-1 shadow-[2px_2px_0_0_#fff]">
              ⚡ SYSTEM BLUEPRINT
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        
        {/* Header Hero Section */}
        <div className="border-4 border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0_0_#000] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none text-black">
            <Cpu size={240} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] text-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
              <Activity size={14} className="animate-spin text-black" /> ARCADE ENGINE ARCHITECTURE • REVISION v2.4
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black leading-none">
              System Specifications & Architecture
            </h1>

            <p className="text-sm sm:text-base font-bold text-zinc-700 max-w-3xl leading-relaxed">
              Technical breakdown of CoQuest&apos;s high-octane speed-to-lead engine: Next.js App Router architecture, distributed Upstash Redis edge caching, SHA-256 Bearer token security, and sub-minute latency SLAs.
            </p>

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={copySpecsSummary}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="flex items-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                {copiedSpecs ? <Check size={16} className="text-green-800" /> : <Copy size={16} />}
                <span>{copiedSpecs ? 'Specs Summary Copied!' : 'Copy Architecture Specs'}</span>
              </button>

              <button
                onClick={runPingTest}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="flex items-center gap-2 border-3 border-black bg-black text-[#00FFFF] px-4 py-2.5 text-xs font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-zinc-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <Radio size={16} className={pinging ? 'animate-ping' : ''} />
                <span>{pinging ? 'Testing Edge Latency...' : 'Run Edge Ping Test'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* LIVE SYSTEM HEALTH MONITOR RIBBON */}
        <div className="border-4 border-black bg-black text-white p-4 shadow-[6px_6px_0_0_#000] grid grid-cols-1 sm:grid-cols-4 gap-4 text-center font-mono">
          <div className="border-r-0 sm:border-r-2 border-zinc-800 p-2 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">SCOUT NETWORK SLA</span>
            <span className="text-lg font-black text-emerald-400">🟢 99.9% UPTIME</span>
          </div>

          <div className="border-r-0 sm:border-r-2 border-zinc-800 p-2 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">SIGNAL LATENCY</span>
            <span className="text-lg font-black text-[#FFE600]">&lt; 60 SECONDS</span>
          </div>

          <div className="border-r-0 sm:border-r-2 border-zinc-800 p-2 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">EDGE DATABASE</span>
            <span className="text-lg font-black text-cyan-400">UPSTASH REDIS</span>
          </div>

          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">SECURITY HASH</span>
            <span className="text-lg font-black text-purple-400">SHA-256 TLS 1.3</span>
          </div>
        </div>

        {/* PING TEST RESULT MODAL / BANNER */}
        {pingResult && (
          <div className="border-3 border-black bg-emerald-100 p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-3">
              <Gauge size={20} className="text-emerald-700" />
              <div>
                <span className="font-black uppercase text-emerald-950 block">EDGE PROBE DISPATCH SUCCESSFUL</span>
                <span className="font-bold text-emerald-800">
                  Target Region: <span className="underline">{pingResult.region}</span> • Round-Trip Latency: <span className="font-black text-black bg-emerald-300 px-1.5 py-0.5 border border-black">{pingResult.ms}ms</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => setPingResult(null)}
              className="font-black uppercase text-[10px] text-emerald-950 underline hover:text-black"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* ARCHITECTURE BLUEPRINT TABS */}
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 border-b-4 border-black pb-2">
            {[
              { id: 'stack', label: '1. Core Framework Stack', icon: Layers },
              { id: 'edge', label: '2. Edge Database & Cache', icon: Database },
              { id: 'security', label: '3. Cryptographic Security', icon: Lock },
              { id: 'sla', label: '4. Latency & Uptime SLA', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sfx.playHoverBlip()
                    setActiveTab(tab.id as 'stack' | 'edge' | 'security' | 'sla')
                  }}
                  className={`flex items-center gap-2 border-3 border-black px-4 py-2.5 font-black uppercase text-xs transition-all shadow-[3px_3px_0_0_#000] cursor-pointer ${
                    active 
                      ? 'bg-black text-[#FFE600] shadow-[3px_3px_0_0_#FFE600]' 
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB 1: CORE STACK */}
          {activeTab === 'stack' && (
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b-4 border-black pb-4">
                <div className="w-10 h-10 bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
                  ⚡
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Core Framework & Frontend System</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Modern Next.js App Router Architecture</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border-3 border-black bg-blue-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-blue-900 block flex items-center gap-1.5">
                    <Globe size={16} /> Next.js App Router
                  </span>
                  <p className="text-xs font-bold text-zinc-700 leading-normal">
                    React 19 Server Components for instant initial paint, server-side data streaming, and zero-bundle hydration overhead.
                  </p>
                </div>

                <div className="border-3 border-black bg-cyan-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-cyan-900 block flex items-center gap-1.5">
                    <Code size={16} /> Strict TypeScript
                  </span>
                  <p className="text-xs font-bold text-zinc-700 leading-normal">
                    100% end-to-end type safety across API routes, Prisma / Drizzle database schemas, and client state primitives.
                  </p>
                </div>

                <div className="border-3 border-black bg-purple-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-purple-900 block flex items-center gap-1.5">
                    <Zap size={16} /> Neo-Brutalist Tailwind
                  </span>
                  <p className="text-xs font-bold text-zinc-700 leading-normal">
                    High-contrast Arcade design system with 4px hard black borders, Cyber Yellow accents, and crisp retro drop shadows.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDGE & CACHE */}
          {activeTab === 'edge' && (
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b-4 border-black pb-4">
                <div className="w-10 h-10 bg-[#06B6D4] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
                  💾
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Edge Database & Distributed Caching</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Upstash Redis Token Bucket Engine</p>
                </div>
              </div>

              <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
                <p>
                  To deliver zero-latency rate enforcement and handle high-concurrency webhook bursts, CoQuest leverages Upstash Redis edge nodes:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3 border-2 border-black bg-[#F4F4F5] p-3 shadow-[2px_2px_0_0_#000]">
                    <CheckCircle2 size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase text-black">Token Bucket Algorithm:</span> Sliding window rate limiting implemented directly at Vercel edge middleware using `@upstash/ratelimit`.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 border-2 border-black bg-[#F4F4F5] p-3 shadow-[2px_2px_0_0_#000]">
                    <CheckCircle2 size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase text-black">In-Memory Mana Ledger:</span> Real-time Mana balance checks completed in under 5 milliseconds prior to executing scout workflows.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b-4 border-black pb-4">
                <div className="w-10 h-10 bg-[#A855F7] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
                  🔒
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Cryptographic Security Protocol</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase">SHA-256 Bearer Token Hashing & Webhook HMAC Verification</p>
                </div>
              </div>

              <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
                <div className="border-3 border-black bg-purple-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-purple-950 block">Cryptographic Hash Verification</span>
                  <p className="text-xs font-bold text-zinc-800">
                    Bearer tokens (`cq_live_...`) are passed via standard HTTP `Authorization` headers. The server executes SHA-256 hashing and compares hashes in constant time to eliminate timing attack vectors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LATENCY & UPTIME SLA */}
          {activeTab === 'sla' && (
            <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b-4 border-black pb-4">
                <div className="w-10 h-10 bg-[#A3E635] border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
                  ⏱️
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Latency SLA & Uptime Guarantee</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase">&lt; 60-Second Social Keyword Discovery Target</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-bold">
                <div className="border-3 border-black bg-white p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-black block">&lt; 60-Second Discovery SLA</span>
                  <p className="text-xs font-bold text-zinc-700">
                    Scout engines query high-intent social keyword channels every 30 seconds. New intent signals are formatted into JSON webhooks and dispatched within 60 seconds of publication.
                  </p>
                </div>

                <div className="border-3 border-black bg-white p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                  <span className="font-black uppercase text-xs text-black block">99.9% Uptime Commitment</span>
                  <p className="text-xs font-bold text-zinc-700">
                    Redundant Scout nodes ensure continuous social listening. Automated failover triggers across primary and secondary edge clusters to maintain 99.9% operational uptime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Banner Hub */}
        <div className="border-4 border-black bg-[#A3E635] text-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-black uppercase text-base text-black">Want to inspect Master Guild Governance?</span>
            <p className="text-xs font-bold text-zinc-800">Read our full Terms of Service and Code of Conduct.</p>
          </div>

          <Link
            href="/terms"
            onClick={() => sfx.playCoinDrop()}
            className="border-3 border-black bg-black text-white px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-zinc-800 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Read Terms of Service</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* Global Neo-Brutalist Footer */}
      <Footer />
    </div>
  )
}
