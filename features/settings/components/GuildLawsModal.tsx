'use client'

import { useState } from 'react'
import { Shield, ChevronDown, ChevronUp, X, Scroll, HelpCircle } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { sfx } from '@/lib/sfx'

interface GuildLawsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GuildLawsModal({ isOpen, onClose }: GuildLawsModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const laws = [
    {
      title: '🛡️ The Law of Purchases & Refund Terms',
      content:
        'Beta subscription payments are processed by Stripe. Consumed credits are not restored automatically; contact support for billing disputes. Credit top-ups and higher tiers are not currently sold, and applicable consumer rights are not waived.',
    },
    {
      title: '⚡ The Law of Credit Allocation',
      content:
        'Each qualifying paid Beta invoice adds 50 scan credits to the server ledger. Unused credits remain recorded, while paid scans, AI replies, and CRM export still require a current active subscription period. Pro, Agency, and credit top-ups are not currently enabled.',
    },
    {
      title: '📜 The Cancellation Scroll',
      content:
        'Use the Billing tab to open the available Stripe subscription controls. Cancellation timing and continued access follow the verified billing state shown there; SEOlaQuest does not assume a cancellation succeeded until Stripe confirms it.',
    },
    {
      title: '⚔️ Guild Code of Honor & Ethics',
      content:
        'Use manual source research responsibly. Do not spam webhooks, automate customer contact without permission, or misrepresent source matches as qualified customers.',
    },
  ]

  const toggleAccordion = (index: number) => {
    sfx.playHoverBlip()
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <AccessibleDialog
      open={isOpen}
      onClose={onClose}
      labelledBy="guild-laws-dialog-title"
      describedBy="guild-laws-dialog-description"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      panelClassName="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-outline bg-card shadow-sm"
    >
        {/* Header */}
        <header className="border-b border-outline bg-info p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-on-accent" size={32} />
            <div>
              <h2 id="guild-laws-dialog-title" className="font-display text-2xl font-semibold normal-case tracking-tight text-ink">Guild Laws & Laws of Mana</h2>
              <p id="guild-laws-dialog-description" className="text-xs font-medium normal-case text-ink/80">Official Guild Codex & Refund Directives</p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playHoverBlip()
              onClose()
            }}
            className="rounded-[20px] border border-outline bg-card p-2 text-ink hover:bg-accent transition-colors shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-canvas">
          <div className="rounded-[20px] border border-outline bg-accent p-4 flex items-start gap-3 shadow-sm">
            <HelpCircle className="text-on-accent shrink-0 mt-0.5" size={24} />
            <p className="text-sm font-semibold normal-case text-on-accent">
              Guild Laws govern accounts, server-recorded credits, billing, and supported lead workflows.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {laws.map((law, index) => {
              const isOpenItem = openIndex === index
              return (
                <div key={law.title} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left p-4 font-semibold normal-case flex items-center justify-between bg-card hover:bg-highlight transition-colors"
                  >
                    <span className="text-base flex items-center gap-2">{law.title}</span>
                    {isOpenItem ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isOpenItem && (
                    <div className="p-4 border-t border-outline bg-canvas text-sm font-medium text-ink leading-relaxed border-dashed">
                      {law.content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-outline bg-card p-4 flex justify-between items-center">
          <span className="text-xs font-semibold normal-case flex items-center gap-1.5 text-ink-muted">
            <Scroll size={16} /> Guild Seal Approved
          </span>
          <button
            type="button"
            onClick={() => {
              sfx.playHoverBlip()
              onClose()
            }}
            className="rounded-[20px] border border-outline bg-info px-6 py-2 font-semibold normal-case text-on-accent shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Acknowledge Laws
          </button>
        </footer>
    </AccessibleDialog>
  )
}
