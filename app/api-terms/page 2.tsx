'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Key, 
  Copy, 
  Check, 
  ArrowRight, 
  Clock, 
  Sliders, 
  Code,
  Lock
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { sfx } from '@/lib/sfx'

export default function ApiTermsPage() {
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Interactive Mana Calculator State
  const [scoutRuns, setScoutRuns] = useState(500)
  const [quickstrikeDrafts, setQuickstrikeDrafts] = useState(100)
  const [enrichmentCalls, setEnrichmentCalls] = useState(50)

  const calculatedMana = (scoutRuns * 1) + (quickstrikeDrafts * 5) + (enrichmentCalls * 10)

  const getRecommendedTier = (mana: number) => {
    if (mana <= 2500) return { name: '🗡️ Swordsman', price: '$15.99/mo', color: 'bg-green-100 border-green-600' }
    if (mana <= 6000) return { name: '🛡️ Knight', price: '$24.99/mo', color: 'bg-blue-100 border-blue-600' }
    if (mana <= 15000) return { name: '🔮 Sorcerer', price: '$49.99/mo', color: 'bg-purple-100 border-purple-600' }
    return { name: '🐉 Dragon Slayer', price: '$199.00/mo', color: 'bg-red-100 border-red-600' }
  }

  const recTier = getRecommendedTier(calculatedMana)

  const curlExample = `curl -X POST https://api.coquest.com/v1/scout/trigger \\
  -H "Authorization: Bearer cq_live_8f93a102b5e4129" \\
  -H "Content-[#06B6D4]: application/json" \\
  -d '{
    "keyword": "SaaS analytics tool",
    "webhook_url": "https://your-crm.com/webhooks/coquest"
  }'`

  const copyCode = () => {
    sfx.playCoinDrop()
    navigator.clipboard.writeText(curlExample)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black font-sans pb-12">
      {/* Top Banner Nav */}
      <div className="border-b-4 border-black bg-[#A855F7] text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            onClick={() => sfx.playCoinDrop()}
            className="flex items-center gap-2 font-black uppercase text-lg sm:text-xl tracking-tight text-white"
          >
            <Zap className="fill-white text-white w-6 h-6" />
            <span>COQUEST ENGINE</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <span className="border-2 border-black bg-[#FFE600] text-black px-2.5 py-1 shadow-[2px_2px_0_0_#000]">
              🧪 API & RUNE POLICY
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        
        {/* Header Hero Section */}
        <div className="border-4 border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0_0_#000] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none text-[#A855F7]">
            <Terminal size={240} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 border-2 border-black bg-[#A855F7] text-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
              <ShieldCheck size={14} /> DEVELOPER CONTRACT & RUNE PROTOCOL • v2.4
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black leading-none">
              API Usage & Rune Policy
            </h1>

            <p className="text-sm sm:text-base font-bold text-zinc-700 max-w-3xl leading-relaxed">
              Build custom integrations, real-time CRM webhooks, and automated QuickStrike outreach bots. Understand Mana deduction rules, token hashing standards, and rate limits.
            </p>

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/keys"
                onClick={() => sfx.playCoinDrop()}
                className="flex items-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <Key size={16} />
                <span>Open API Key Vault (`/keys`)</span>
              </Link>

              <a
                href="#mana-calculator"
                onClick={() => sfx.playHoverBlip()}
                className="flex items-center gap-1.5 border-3 border-black bg-white px-4 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-zinc-100 transition-all"
              >
                <Sliders size={16} />
                <span>Mana Cost Calculator</span>
              </a>
            </div>
          </div>
        </div>

        {/* 1. DEVELOPER MANA DEDUCTION RULES */}
        <section id="mana-deduction" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              1
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Mana Deduction Rules per API Request</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Deterministic Mana Pricing Grid</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-zinc-800">
              Every call to CoQuest REST or Webhook endpoints consumes Mana from your active monthly pool according to this fixed resource grid:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between">
                <div>
                  <span className="font-black uppercase text-sm text-black block">📡 Scout Keyword Trigger</span>
                  <span className="text-xs font-bold text-zinc-500">Real-time keyword monitoring scan</span>
                </div>
                <span className="border-2 border-black bg-blue-100 px-3 py-1 font-black text-sm text-blue-900 shadow-[2px_2px_0_0_#000]">
                  1 Mana
                </span>
              </div>

              <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between">
                <div>
                  <span className="font-black uppercase text-sm text-black block">⚡ Webhook Push Event</span>
                  <span className="text-xs font-bold text-zinc-500">Guaranteed payload dispatch</span>
                </div>
                <span className="border-2 border-black bg-emerald-100 px-3 py-1 font-black text-sm text-emerald-900 shadow-[2px_2px_0_0_#000]">
                  2 Mana
                </span>
              </div>

              <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between">
                <div>
                  <span className="font-black uppercase text-sm text-black block">🤖 QuickStrike AI Reply</span>
                  <span className="text-xs font-bold text-zinc-500">LLM contextual reply generation</span>
                </div>
                <span className="border-2 border-black bg-[#FFE600] px-3 py-1 font-black text-sm text-black shadow-[2px_2px_0_0_#000]">
                  5 Mana
                </span>
              </div>

              <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between">
                <div>
                  <span className="font-black uppercase text-sm text-black block">🔍 Deep Lead Enrichment</span>
                  <span className="text-xs font-bold text-zinc-500">Domain & social profile lookup</span>
                </div>
                <span className="border-2 border-black bg-purple-100 px-3 py-1 font-black text-sm text-purple-950 shadow-[2px_2px_0_0_#000]">
                  10 Mana
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MANA CALCULATOR WIDGET */}
        <section id="mana-calculator" className="border-4 border-black bg-[#F4F4F5] p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center justify-between border-b-3 border-black pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={22} className="text-[#A855F7]" />
              <h3 className="text-xl font-black uppercase tracking-tight text-black">Interactive Developer Mana Calculator</h3>
            </div>
            <span className="text-xs font-black uppercase bg-[#FFE600] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0_0_#000]">
              LIVE ESTIMATOR
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-5">
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>Scout Keyword Runs: {scoutRuns}</span>
                  <span className="text-blue-700">{scoutRuns * 1} Mana</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="50"
                  value={scoutRuns} 
                  onChange={(e) => setScoutRuns(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>QuickStrike AI Drafts: {quickstrikeDrafts}</span>
                  <span className="text-amber-700">{quickstrikeDrafts * 5} Mana</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={quickstrikeDrafts} 
                  onChange={(e) => setQuickstrikeDrafts(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>Deep Lead Enrichments: {enrichmentCalls}</span>
                  <span className="text-purple-700">{enrichmentCalls * 10} Mana</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="10"
                  value={enrichmentCalls} 
                  onChange={(e) => setEnrichmentCalls(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className={`border-4 border-black p-6 space-y-4 shadow-[6px_6px_0_0_#000] ${recTier.color}`}>
              <span className="font-black uppercase text-xs text-zinc-600 block">ESTIMATED MONTHLY RESOURCE CONSUMPTION</span>
              <div className="text-4xl font-black text-black">
                {calculatedMana.toLocaleString()} <span className="text-lg font-bold">Mana / mo</span>
              </div>

              <div className="border-t-2 border-black pt-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-700 block">Recommended Guild Tier:</span>
                  <span className="font-black uppercase text-base text-black">{recTier.name}</span>
                </div>
                <span className="font-black text-sm bg-white px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  {recTier.price}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. RATE LIMIT QUOTAS BY TIER */}
        <section id="rate-limits" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#06B6D4] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              2
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Rate Limit Quotas (Token Bucket)</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Upstash Redis Enforced Speed Controls</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-zinc-800 leading-relaxed">
              Rate limits are enforced at the Upstash Redis edge using token bucket sliding windows. Exceeding limits will return HTTP `429 Too Many Requests` with `Retry-After` headers:
            </p>

            <div className="border-3 border-black overflow-x-auto shadow-[4px_4px_0_0_#000]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#A3E635] border-b-3 border-black font-black text-xs uppercase">
                    <th className="p-3 border-r-2 border-black">Guild Tier</th>
                    <th className="p-3 border-r-2 border-black">Sustained Rate</th>
                    <th className="p-3 border-r-2 border-black">Burst Capacity</th>
                    <th className="p-3">Webhook Dispatch SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold bg-white">
                  <tr>
                    <td className="p-3 border-r-2 border-black font-black uppercase">🗡️ Swordsman</td>
                    <td className="p-3 border-r-2 border-black">10 req / min</td>
                    <td className="p-3 border-r-2 border-black">20 requests</td>
                    <td className="p-3 text-zinc-600">Standard (&lt; 60s)</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="p-3 border-r-2 border-black font-black uppercase text-amber-950">🛡️ Knight (Popular)</td>
                    <td className="p-3 border-r-2 border-black text-amber-950">60 req / min</td>
                    <td className="p-3 border-r-2 border-black text-amber-950">100 requests</td>
                    <td className="p-3 font-black text-emerald-700">Priority (&lt; 15s)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-r-2 border-black font-black uppercase">🐉 Dragon Slayer</td>
                    <td className="p-3 border-r-2 border-black">300 req / min</td>
                    <td className="p-3 border-r-2 border-black">500 requests</td>
                    <td className="p-3 font-black text-emerald-700">High-Speed (&lt; 5s)</td>
                  </tr>
                  <tr className="bg-cyan-50">
                    <td className="p-3 border-r-2 border-black font-black uppercase text-cyan-950">⚡ Arcane Enterprise</td>
                    <td className="p-3 border-r-2 border-black text-cyan-950">Up to 100 req / sec</td>
                    <td className="p-3 border-r-2 border-black text-cyan-950">Dedicated Cluster</td>
                    <td className="p-3 font-black text-cyan-900">Dedicated Socket Stream</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3. KEY ROTATION & TOKEN HASHING SECURITY */}
        <section id="key-security" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#A855F7] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              3
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Key Rotation & Authentication Protocol</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Bearer Token Security & Rotation Schedules</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-3 border-black bg-white p-5 shadow-[4px_4px_0_0_#000] space-y-2">
                <span className="font-black uppercase text-xs text-black flex items-center gap-1.5">
                  <Clock size={16} className="text-amber-600" /> 90-Day Key Rotation Guideline
                </span>
                <p className="text-xs font-bold text-zinc-600">
                  We strongly advise rotating production API keys every 90 days. Key creation and instant one-click revocation are available inside your <Link href="/keys" className="underline font-black text-purple-700">API Key Vault (`/keys`)</Link>.
                </p>
              </div>

              <div className="border-3 border-black bg-white p-5 shadow-[4px_4px_0_0_#000] space-y-2">
                <span className="font-black uppercase text-xs text-black flex items-center gap-1.5">
                  <Lock size={16} className="text-blue-600" /> Cryptographic SHA-256 Verification
                </span>
                <p className="text-xs font-bold text-zinc-600">
                  Every request must send the key in the `Authorization` header. Raw secrets are hashed using SHA-256 before database matching, protecting keys against data leak vulnerabilities.
                </p>
              </div>
            </div>

            {/* Terminal Code snippet */}
            <div className="border-4 border-black bg-black text-white p-5 shadow-[6px_6px_0_0_#000] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs">
                <span className="flex items-center gap-2 text-zinc-400 font-bold">
                  <Code size={14} className="text-[#FFE600]" /> COQUEST REST DISPATCH EXAMPLE (cURL)
                </span>
                <button
                  onClick={copyCode}
                  onMouseEnter={() => sfx.playHoverBlip()}
                  className="flex items-center gap-1 text-[#FFE600] font-black uppercase text-[10px] hover:underline cursor-pointer"
                >
                  {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  <span>{copiedCode ? 'COPIED!' : 'COPY CURL'}</span>
                </button>
              </div>

              <pre className="text-xs font-bold text-[#00FFFF] overflow-x-auto whitespace-pre leading-relaxed">
                {curlExample}
              </pre>
            </div>

          </div>
        </section>

        {/* Bottom Banner Hub */}
        <div className="border-4 border-black bg-[#FFE600] text-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-black uppercase text-base text-black">Ready to deploy high-tech Scouts?</span>
            <p className="text-xs font-bold text-zinc-800">Inspect full system latency SLAs and architectural specs.</p>
          </div>

          <Link
            href="/specs"
            onClick={() => sfx.playCoinDrop()}
            className="border-3 border-black bg-black text-white px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-zinc-800 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>View System Specs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* Global Neo-Brutalist Footer */}
      <Footer />
    </div>
  )
}
