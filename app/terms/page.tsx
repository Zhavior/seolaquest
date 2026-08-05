'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Scale, 
  CreditCard, 
  Ban, 
  RotateCcw,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { sfx } from '@/lib/sfx'

export default function TermsPage() {
  const [copied, setCopied] = useState(false)

  const copyTermsSummary = () => {
    sfx.playCoinDrop()
    const summary = `COQUEST ENGINE - MASTER GUILD CODE & TERMS SUMMARY (v2.4)\n1. Guild Code: Ethical B2B hunting required.\n2. Billing: Free access includes no paid scans. The enabled Beta plan is $14.99/month and adds 50 scan credits per qualifying paid invoice. Pro and Agency are not for sale.\n3. Credits: Unused credits remain recorded, but paid capabilities require a current active subscription.\n4. Cancellation: Cancel anytime via /billing.\n5. Acceptable Use: No illegal scraping or social spam.`
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans pb-12">
      {/* Top Banner Nav */}
      <div className="border-b-4 border-outline bg-accent px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            onClick={() => sfx.playCoinDrop()}
            className="flex items-center gap-2 font-black uppercase text-lg sm:text-xl tracking-tight"
          >
            <Zap className="fill-black text-ink w-6 h-6" />
            <span>COQUEST ENGINE</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <span className="border-2 border-outline bg-card px-2.5 py-1 shadow-brutal-sm">
              ⚖️ LEGAL GOVERNANCE
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        
        {/* Header Hero Section */}
        <div className="border-4 border-outline bg-card p-6 sm:p-10 shadow-brutal-lg relative overflow-hidden">
          <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
            <Scale size={240} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 border-2 border-outline bg-success px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
              <ShieldCheck size={14} /> EFFECTIVE REVISION: JULY 2026 • v2.4 STABLE
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-ink leading-none">
              Master Guild Code & Terms of Service
            </h1>

            <p className="text-sm sm:text-base font-bold text-ink-muted max-w-3xl leading-relaxed">
              Welcome to CoQuest. By using the application, configured scans, or paid credits, you agree to this Master Guild Code of Conduct and Operating Terms.
            </p>

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={copyTermsSummary}
                onMouseEnter={() => sfx.playHoverBlip()}
                className="flex min-h-11 items-center gap-2 border-3 border-outline bg-accent px-4 py-2.5 text-xs font-black uppercase shadow-brutal hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                {copied ? <Check size={16} className="text-green-700" /> : <Copy size={16} />}
                <span>{copied ? 'Summary Copied to Clipboard!' : 'Copy Terms Summary'}</span>
              </button>

              <a
                href="#billing-terms"
                onClick={() => sfx.playHoverBlip()}
                className="flex items-center gap-1.5 border-3 border-outline bg-card px-4 py-2.5 text-xs font-black uppercase shadow-brutal hover:bg-inset transition-all"
              >
                <span>Jump to Billing Rules</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Section Index Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="#code-of-conduct"
            onClick={() => sfx.playHoverBlip()}
            className="border-3 border-outline bg-card p-4 shadow-brutal hover:bg-highlight transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase">1. Guild Code</span>
              <ShieldCheck size={20} className="text-purple-600" />
            </div>
            <p className="text-xs font-bold text-ink-muted mt-2">Ethical B2B hunting standards & system fair play.</p>
          </a>

          <a
            href="#billing-terms"
            onClick={() => sfx.playHoverBlip()}
            className="border-3 border-outline bg-card p-4 shadow-brutal hover:bg-highlight transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase">2. Subscription & Billing</span>
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold text-ink-muted mt-2">Current enabled billing catalog and credit terms.</p>
          </a>

          <a
            href="#acceptable-use"
            onClick={() => sfx.playHoverBlip()}
            className="border-3 border-outline bg-card p-4 shadow-brutal hover:bg-highlight transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase">3. Acceptable Use</span>
              <Ban size={20} className="text-red-600" />
            </div>
            <p className="text-xs font-bold text-ink-muted mt-2">Strict anti-scraping & anti-spam guidelines.</p>
          </a>
        </div>

        {/* 1. MASTER GUILD CODE OF CONDUCT */}
        <section id="code-of-conduct" className="border-4 border-outline bg-card p-6 sm:p-8 shadow-brutal-lg space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-outline pb-4">
            <div className="w-10 h-10 bg-accent border-3 border-outline flex items-center justify-center font-black text-xl shadow-brutal-sm">
              1
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink">Master Guild Code of Conduct</h2>
              <p className="text-xs font-bold text-ink-muted uppercase">Honor, Speed, and Ethical Lead Hunting</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-ink leading-relaxed">
            <p>
              CoQuest may surface stored provider results when a configured scan succeeds. Matches are not verified purchase intent. All users must operate under the following core principles:
            </p>

            <ul className="space-y-3 pl-2">
              <li className="flex items-start gap-3 border-2 border-outline bg-inset p-3 shadow-brutal-sm">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase text-ink">Fair Play & Rate Integrity:</span> Hunters shall not attempt to breach or alter API rate limits using distributed proxy networks, key pooling, or concurrent request spikes designed to degrade service performance.
                </div>
              </li>

              <li className="flex items-start gap-3 border-2 border-outline bg-inset p-3 shadow-brutal-sm">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase text-ink">Honorable Outreach:</span> Stored source matches must be used solely for relevant, non-deceptive B2B communication. Impersonation of third-party organizations or deceptive automation may result in account restriction under these terms.
                </div>
              </li>

              <li className="flex items-start gap-3 border-2 border-outline bg-inset p-3 shadow-brutal-sm">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase text-ink">Security Vigilance:</span> Public API credentials are not currently offered. Do not attempt to access internal endpoints or credentials, and report suspected compromise through an available support channel.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. SUBSCRIPTION BILLING TERMS */}
        <section id="billing-terms" className="border-4 border-outline bg-card p-6 sm:p-8 shadow-brutal-lg space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-outline pb-4">
            <div className="w-10 h-10 bg-info text-white border-3 border-outline flex items-center justify-center font-black text-xl shadow-brutal-sm">
              2
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink">Subscription Billing & Tier Terms</h2>
              <p className="text-xs font-bold text-ink-muted uppercase">Free access and the enabled paid Beta</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-ink leading-relaxed">
            <p>
              The enabled CoQuest Beta subscription is billed monthly through Stripe. A qualifying positive paid invoice adds 50 scan credits. Free access includes no paid scan, AI-reply, or CRM-export entitlement.
            </p>

            <div className="border-3 border-outline bg-inset p-4 space-y-4 shadow-brutal">
              <div className="flex items-center justify-between border-b-2 border-outline pb-2">
                <span className="font-black uppercase text-xs text-ink-muted">CURRENT SELLABLE CATALOG</span>
                <span className="text-xs font-bold text-ink-muted">Server-enforced</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-3 border-outline bg-card p-4">
                  <div className="font-black uppercase">Free Scout — $0</div>
                  <p className="mt-2 text-xs">Dashboard access with no paid feature entitlement or included scan credits.</p>
                </div>
                <div className="border-3 border-outline bg-success p-4 shadow-brutal-sm">
                  <div className="font-black uppercase">Beta Hunter — $14.99/month</div>
                  <p className="mt-2 text-xs">50 credits per positive paid subscription-creation or renewal invoice; paid scans, AI replies, and CRM export while the subscription period is current.</p>
                </div>
              </div>

              <div className="border-3 border-outline bg-highlight p-4 text-xs font-bold">
                Pro and Agency are preview-only and grant no entitlement. Credit top-ups are disabled until refund and dispute reversal handling is implemented.
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-black uppercase text-base text-ink flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-600" /> Automatic Renewal & Upgrades
              </h3>
              <p>
                Beta renews on its Stripe billing date until canceled. No higher paid plan or mid-cycle upgrade is currently enabled. Checkout can be disabled during production verification without changing an existing subscription record.
              </p>
            </div>
          </div>
        </section>

        {/* 3. MANA NON-REFUNDABILITY & CANCELATION */}
        <section id="mana-policy" className="border-4 border-outline bg-card p-6 sm:p-8 shadow-brutal-lg space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-outline pb-4">
            <div className="w-10 h-10 bg-[#A855F7] text-white border-3 border-outline flex items-center justify-center font-black text-xl shadow-brutal-sm">
              3
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink">Usage-Based Mana & Cancellation Rules</h2>
              <p className="text-xs font-bold text-ink-muted uppercase">Non-Refundable Edge Consumption & Account Self-Service</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-ink leading-relaxed">
            <div className="border-3 border-outline bg-highlight p-4 shadow-brutal flex items-start gap-3">
              <AlertTriangle size={24} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black uppercase text-ink text-sm">CRITICAL NOTICE: MANA NON-REFUNDABILITY</span>
                <p className="text-xs font-bold text-ink leading-normal">
                  Credits are usage units recorded by the server ledger. Consumed credits are not restored automatically. Contact support for billing disputes; nothing in these terms limits rights that cannot legally be waived.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-black uppercase text-base text-ink">Account Cancellation Procedures</h3>
              <p>
                Hunters may use the available subscription controls through the <Link href="/app/billing" className="underline font-black text-blue-600 hover:text-blue-800">Billing page</Link>. A cancellation is effective only when Stripe and the server-owned billing state confirm it:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm font-bold">
                <li>Your subscription will not renew at the next billing interval.</li>
                <li>You retain full access to remaining active Mana and features until the end of your current paid billing period.</li>
                <li>Unused credits remain recorded on your account, but paid capabilities are unavailable without a current active subscription period.</li>
                <li>Credit top-ups are not currently sold; Pro and Agency remain unavailable.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. ACCEPTABLE USE POLICY (AUP) */}
        <section id="acceptable-use" className="border-4 border-outline bg-card p-6 sm:p-8 shadow-brutal-lg space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-outline pb-4">
            <div className="w-10 h-10 bg-accent-2 text-white border-3 border-outline flex items-center justify-center font-black text-xl shadow-brutal-sm">
              4
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-ink">Acceptable Use Policy (AUP)</h2>
              <p className="text-xs font-bold text-ink-muted uppercase">Strict Anti-Scraping, Anti-Spam & API Safeguards</p>
            </div>
          </div>

          <div className="space-y-4 text-sm font-bold text-ink leading-relaxed">
            <p>
              CoQuest supports keyword-based source discovery and user-reviewed lead workflows. A source match is not verified purchase intent. The following actions are strictly prohibited:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border-3 border-outline bg-red-50 p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-2">
                  <Ban size={16} /> 1. UNFAIR AUTOMATED SCRAPING
                </div>
                <p className="text-xs font-bold text-ink">
                  Using automated tools to scrape, dump, or extract CoQuest&apos;s proprietary lead database or attempt bulk reverse-engineering of Scout signals.
                </p>
              </div>

              <div className="border-3 border-outline bg-red-50 p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-2">
                  <Ban size={16} /> 2. UNSOLICITED SPAM OUTREACH
                </div>
                <p className="text-xs font-bold text-ink">
                  Weaponizing CoQuest leads for mass automated email spam, bot spamming on social channels, or sending deceptive/phishing materials.
                </p>
              </div>

              <div className="border-3 border-outline bg-red-50 p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-2">
                  <Ban size={16} /> 3. KEY RESELLING & RE-LICENSING
                </div>
                <p className="text-xs font-bold text-ink">
                  Sub-licensing, renting, or selling access to CoQuest accounts or internal credentials to third parties without prior written consent.
                </p>
              </div>

              <div className="border-3 border-outline bg-red-50 p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-2">
                  <Ban size={16} /> 4. INFRASTRUCTURE DENIAL
                </div>
                <p className="text-xs font-bold text-ink">
                  Executing Denial of Service (DoS) attacks or flooding application or webhook endpoints to exhaust shared infrastructure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation Bar / Link Hub */}
        <div className="border-4 border-outline bg-accent p-6 shadow-brutal-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-black uppercase text-base text-on-accent">Questions regarding Guild Terms?</span>
            <p className="text-xs font-bold text-ink">Review Privacy Policies or contact our Guildmaster support team.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              onClick={() => sfx.playCoinDrop()}
              className="border-3 border-outline bg-card px-4 py-2 font-black uppercase text-xs shadow-brutal-sm hover:bg-inset transition-all"
            >
              Privacy Policy
            </Link>
            <Link
              href="/api-terms"
              onClick={() => sfx.playCoinDrop()}
              className="border-3 border-outline bg-black text-[#FFE600] px-4 py-2 font-black uppercase text-xs shadow-brutal-sm hover:bg-zinc-800 transition-all flex items-center gap-1"
            >
              <span>API Terms</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

      </main>

      {/* Global Neo-Brutalist Footer */}
      <Footer />
    </div>
  )
}
