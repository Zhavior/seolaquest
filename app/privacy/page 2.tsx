'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Lock, 
  ShieldCheck, 
  Zap, 
  Key, 
  Server, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  HardDrive
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { sfx } from '@/lib/sfx'

export default function PrivacyPage() {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletionStatus, setDeletionStatus] = useState<'idle' | 'simulating' | 'success'>('idle')

  const copyPrivacySummary = () => {
    sfx.playCoinDrop()
    const summary = `COQUEST ENGINE - PRIVACY POLICY SUMMARY (v2.4)\n1. Data: Scrapes only public B2B signals (X, Reddit, Web). No private DMs.\n2. Security: Cryptographic SHA-256 API key hashing. Zero plaintext raw keys.\n3. Subprocessors: Stripe (Billing), Upstash (Redis), Vercel (Edge), Clerk (Auth).\n4. Data Deletion: Self-service purge in /settings or via privacy@coquest.com.`
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleSimulateDeletion = () => {
    sfx.playBountyUnlock()
    setDeletionStatus('simulating')
    setTimeout(() => {
      setDeletionStatus('success')
    }, 1500)
  }

  const subprocessors = [
    { name: 'Stripe, Inc.', purpose: 'Payment Processing & Subscriptions', location: 'USA', certification: 'PCI-DSS Level 1' },
    { name: 'Upstash, Inc.', purpose: 'Serverless Redis Caching & Rate Limiting', location: 'USA / EU', certification: 'SOC2 Type II / ISO 27001' },
    { name: 'Vercel, Inc.', purpose: 'Edge Network Hosting & Global CDN', location: 'USA / Global Edge', certification: 'SOC2 Type II / ISO 27001' },
    { name: 'Clerk, Inc.', purpose: 'User Identity & Authentication Vault', location: 'USA', certification: 'SOC2 Type II / GDPR Compliant' },
    { name: 'Supabase Inc. / PostgreSQL', purpose: 'Encrypted Relational Data Storage', location: 'AWS US-East', certification: 'SOC2 Type II / HIPAA Ready' },
  ]

  const filteredSubprocessors = subprocessors.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black font-sans pb-12">
      {/* Top Banner Nav */}
      <div className="border-b-4 border-black bg-[#06B6D4] text-white px-4 py-3">
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
            <span className="border-2 border-black bg-white text-black px-2.5 py-1 shadow-[2px_2px_0_0_#000]">
              🔒 PRIVACY SHIELD
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        
        {/* Header Hero Section */}
        <div className="border-4 border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0_0_#000] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none text-[#06B6D4]">
            <Lock size={240} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 border-2 border-black bg-[#06B6D4] text-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
              <ShieldCheck size={14} /> PRIVACY & DATA TRANSPARENCY PROTOCOL • v2.4
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black leading-none">
              Guild Privacy Policy & Data Shield
            </h1>

            <p className="text-sm sm:text-base font-bold text-zinc-700 max-w-3xl leading-relaxed">
              At CoQuest, we respect data sovereignty and zero-trust security. This document details our exact data collection mechanisms, SHA-256 cryptographic standards, subprocessor registry, and user deletion rights.
            </p>

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={copyPrivacySummary}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="flex items-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#86EFAC] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                {copied ? <Check size={16} className="text-green-800" /> : <Copy size={16} />}
                <span>{copied ? 'Privacy Summary Copied!' : 'Copy Privacy Shield Summary'}</span>
              </button>

              <a
                href="#subprocessors"
                onClick={() => sfx.playHoverBlip()}
                className="flex items-center gap-1.5 border-3 border-black bg-white px-4 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-zinc-100 transition-all"
              >
                <span>Inspect Subprocessors</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* 1. DATA COLLECTION TRANSPARENCY */}
        <section id="data-collection" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              1
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Data Collection Transparency</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Public B2B Lead Signals vs Private Confidential Data</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
            <p>
              CoQuest operates as an automated social listening radar for B2B founders. Here is how we collect and process intent signals:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-3 border-black bg-emerald-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                <span className="inline-flex items-center gap-1 font-black uppercase text-xs text-emerald-800 bg-emerald-200 px-2 py-0.5 border border-black">
                  <CheckCircle2 size={12} /> WHAT WE COLLECT & PROCESS
                </span>
                <ul className="list-disc pl-4 text-xs font-bold space-y-1.5 text-zinc-800">
                  <li>Public social posts, tweets, and comments (X/Twitter, Reddit, Web feeds).</li>
                  <li>Public company domain information & B2B social profile metadata.</li>
                  <li>Account email address & user profile name (via Clerk identity provider).</li>
                  <li>API call telemetry (timestamp, endpoint route, consumed Mana count).</li>
                </ul>
              </div>

              <div className="border-3 border-black bg-red-50 p-4 shadow-[3px_3px_0_0_#000] space-y-2">
                <span className="inline-flex items-center gap-1 font-black uppercase text-xs text-red-800 bg-red-200 px-2 py-0.5 border border-black">
                  <ShieldAlert size={12} /> WHAT WE NEVER COLLECT OR STORE
                </span>
                <ul className="list-disc pl-4 text-xs font-bold space-y-1.5 text-zinc-800">
                  <li>Private direct messages (DMs), non-public emails, or inbox contents.</li>
                  <li>Plaintext credit card numbers or banking secrets (handled entirely by Stripe).</li>
                  <li>Unprocessed raw API keys (`cq_live_...` secrets are never stored in plaintext).</li>
                  <li>Third-party end-user cookies or cross-site tracking pixels.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SECURITY STANDARDS & CRYPTOGRAPHIC HASHING */}
        <section id="security-standards" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#06B6D4] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              2
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Security Standards & API Key Protection</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Cryptographic SHA-256 Hashing & Encryption Architecture</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
            <div className="border-3 border-black bg-[#F4F4F5] p-5 shadow-[4px_4px_0_0_#000] space-y-4">
              <div className="flex items-center gap-2 font-black uppercase text-sm text-black">
                <Key className="text-[#06B6D4]" size={20} />
                <span>SHA-256 Bearer Token Hashing Standard</span>
              </div>
              <p className="text-xs font-bold text-zinc-700 leading-normal">
                When an API key (`cq_live_...`) is generated in your API Vault, the secret key is displayed ONCE to the user. Our database only persists the One-Way Cryptographic SHA-256 Digest of the token. Incoming API requests are authenticated by hashing the incoming Bearer token in memory and performing constant-time comparison.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_0_#000]">
                  <span className="font-black uppercase text-xs text-black block mb-1">In-Transit Protection</span>
                  <span className="text-xs font-bold text-emerald-600">TLS 1.3 / HTTPS Strict Transport</span>
                </div>
                <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_0_#000]">
                  <span className="font-black uppercase text-xs text-black block mb-1">At-Rest Storage</span>
                  <span className="text-xs font-bold text-emerald-600">AES-256 Database Encryption</span>
                </div>
                <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_0_#000]">
                  <span className="font-black uppercase text-xs text-black block mb-1">Payment Vault</span>
                  <span className="text-xs font-bold text-emerald-600">Stripe PCI-DSS Level 1</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THIRD-PARTY SUBPROCESSORS TABLE */}
        <section id="subprocessors" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#A855F7] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              3
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Authorized Subprocessors Registry</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Vetted Infrastructure & Cloud Partners</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subprocessor or service purpose..."
                className="w-full border-3 border-black bg-white pl-10 pr-4 py-2.5 font-bold text-xs shadow-[3px_3px_0_0_#000] focus:outline-none focus:bg-[#FFF7AA]"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            </div>

            {/* Subprocessors Table */}
            <div className="border-3 border-black overflow-x-auto shadow-[4px_4px_0_0_#000]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFE600] border-b-3 border-black font-black text-xs uppercase">
                    <th className="p-3 border-r-2 border-black">Subprocessor</th>
                    <th className="p-3 border-r-2 border-black">Processing Purpose</th>
                    <th className="p-3 border-r-2 border-black">Data Location</th>
                    <th className="p-3">Security Standards</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold bg-white">
                  {filteredSubprocessors.length > 0 ? (
                    filteredSubprocessors.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 border-r-2 border-black font-black uppercase text-black">{sub.name}</td>
                        <td className="p-3 border-r-2 border-black text-zinc-800">{sub.purpose}</td>
                        <td className="p-3 border-r-2 border-black text-zinc-700">{sub.location}</td>
                        <td className="p-3 text-emerald-700 font-black">{sub.certification}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center font-bold text-zinc-500">
                        No subprocessors matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. DATA DELETION REQUEST OPTIONS & INTERACTIVE SIMULATOR */}
        <section id="data-deletion" className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-10 h-10 bg-[#FF5722] text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#000]">
              4
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">User Data Deletion & GDPR Rights</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase">Self-Service Vault Purge & Formal Deletion Requests</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-zinc-800 leading-relaxed">
            <p>
              Under GDPR, CCPA, and CoQuest Guild Charter, every Hunter retains complete ownership of their account data and may execute a full data purge at any time:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Self Service Card */}
              <div className="border-3 border-black bg-white p-5 shadow-[4px_4px_0_0_#000] space-y-3">
                <span className="font-black uppercase text-sm text-black flex items-center gap-2">
                  <Trash2 size={18} className="text-red-600" /> Option A: Self-Service Purge
                </span>
                <p className="text-xs font-bold text-zinc-600">
                  Navigate to your <Link href="/settings" className="underline text-blue-600 font-black">Hunter Settings (`/settings`)</Link> and click &quot;Execute Vault Purge&quot;. This immediately deletes all stored Scout parameters, API key hashes, and cached leads.
                </p>
              </div>

              {/* Email Request Card */}
              <div className="border-3 border-black bg-white p-5 shadow-[4px_4px_0_0_#000] space-y-3">
                <span className="font-black uppercase text-sm text-black flex items-center gap-2">
                  <HardDrive size={18} className="text-purple-600" /> Option B: Formal Email Request
                </span>
                <p className="text-xs font-bold text-zinc-600">
                  Send a formal data wipe request to <a href="mailto:privacy@coquest.com" className="underline font-black text-purple-700">privacy@coquest.com</a>. Our data protection officer will verify identity and confirm total deletion within 30 days.
                </p>
              </div>
            </div>

            {/* Interactive Data Deletion Request Simulator */}
            <div className="border-3 border-black bg-[#F4F4F5] p-5 shadow-[4px_4px_0_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-black uppercase text-xs text-black">INTERACTIVE PRIVACY DEMO: DATA DELETION AUDIT</span>
                <span className="text-xs font-bold text-zinc-500">Simulate GDPR Wipe</span>
              </div>

              {deletionStatus === 'idle' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs font-bold text-zinc-700">
                    Test our automated data purge protocol in simulation mode.
                  </p>
                  <button
                    onClick={handleSimulateDeletion}
                    onMouseEnter={() => sfx.playHoverBlip()}
                    className="border-3 border-black bg-[#FF5722] text-white px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-orange-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
                  >
                    Simulate Deletion Request
                  </button>
                </div>
              )}

              {deletionStatus === 'simulating' && (
                <div className="flex items-center gap-3 p-3 bg-amber-100 border-2 border-black text-amber-900 text-xs font-black uppercase animate-pulse">
                  <Server size={16} className="animate-spin" /> Purging temporary caches and cryptographically overwriting database record pointers...
                </div>
              )}

              {deletionStatus === 'success' && (
                <div className="flex items-center justify-between p-3 bg-emerald-100 border-2 border-black text-emerald-900 text-xs font-black uppercase">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700" /> SIMULATION COMPLETE: ALL MOCK DATA SHREDDED & VERIFIED
                  </span>
                  <button
                    onClick={() => setDeletionStatus('idle')}
                    className="underline font-bold text-emerald-950 text-[10px]"
                  >
                    Reset Demo
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Bottom Banner Hub */}
        <div className="border-4 border-black bg-[#06B6D4] text-white p-6 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-black uppercase text-base text-white">Need developer API guidelines?</span>
            <p className="text-xs font-bold text-white/90">Explore our Mana deduction rules and rate limit quotas.</p>
          </div>

          <Link
            href="/api-terms"
            onClick={() => sfx.playCoinDrop()}
            className="border-3 border-black bg-[#FFE600] text-black px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-white transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Read API Policy</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* Global Neo-Brutalist Footer */}
      <Footer />
    </div>
  )
}
