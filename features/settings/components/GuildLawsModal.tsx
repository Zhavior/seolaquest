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
        'Use the Billing tab to open the available Stripe subscription controls. Cancellation timing and continued access follow the verified billing state shown there; CoQuest does not assume a cancellation succeeded until Stripe confirms it.',
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
      panelClassName="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border-4 border-black bg-white shadow-[10px_10px_0_0_#000]"
    >
        {/* Header */}
        <header className="border-b-4 border-black bg-[#06B6D4] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-black" size={32} />
            <div>
              <h2 id="guild-laws-dialog-title" className="text-2xl font-black uppercase tracking-tight text-black">Guild Laws & Laws of Mana</h2>
              <p id="guild-laws-dialog-description" className="text-xs font-bold uppercase text-black/80">Official Guild Codex & Refund Directives</p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playHoverBlip()
              onClose()
            }}
            className="border-3 border-black bg-white p-2 text-black hover:bg-[#FFE600] transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#F4F0EA]">
          <div className="border-3 border-black bg-[#FFE600] p-4 flex items-start gap-3 shadow-[4px_4px_0_0_#000]">
            <HelpCircle className="text-black shrink-0 mt-0.5" size={24} />
            <p className="text-sm font-black uppercase text-black">
              Guild Laws govern accounts, server-recorded credits, billing, and supported lead workflows.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {laws.map((law, index) => {
              const isOpenItem = openIndex === index
              return (
                <div key={law.title} className="border-3 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left p-4 font-black uppercase flex items-center justify-between bg-white hover:bg-yellow-50 transition-colors"
                  >
                    <span className="text-base flex items-center gap-2">{law.title}</span>
                    {isOpenItem ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isOpenItem && (
                    <div className="p-4 border-t-3 border-black bg-[#F4F0EA] text-sm font-bold text-gray-800 leading-relaxed border-dashed">
                      {law.content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-4 border-black bg-white p-4 flex justify-between items-center">
          <span className="text-xs font-black uppercase flex items-center gap-1.5 text-gray-600">
            <Scroll size={16} /> Guild Seal Approved
          </span>
          <button
            type="button"
            onClick={() => {
              sfx.playHoverBlip()
              onClose()
            }}
            className="border-3 border-black bg-[#06B6D4] px-6 py-2 font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Acknowledge Laws
          </button>
        </footer>
    </AccessibleDialog>
  )
}
