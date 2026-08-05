'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, Sparkles, Flame, X, Zap } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { createManaCheckoutAction, getBillingStateAction } from '@/features/billing/actions'
import { sfx } from '@/lib/sfx'
import { POTION_CATALOG, type PotionId } from '@/src/modules/billing/domain/catalog'

interface ManaShopModalProps {
  onClose: () => void
  /** Retained for caller compatibility; only a verified server refresh may use it. */
  onPurchaseSuccess?: (questsAdded: number) => void
}

const ICONS = {
  minor_vial: FlaskConical,
  greater_elixir: Sparkles,
  dragon_cauldron: Flame,
} as const

export default function ManaShopModal({ onClose }: ManaShopModalProps) {
  const [balance, setBalance] = useState(0)
  const [capacity, setCapacity] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const [selected, setSelected] = useState<PotionId | null>(null)
  const [message, setMessage] = useState('Loading verified balance…')

  useEffect(() => {
    let active = true
    void getBillingStateAction()
      .then((state) => {
        if (!active) return
        setBalance(state.questsRemaining)
        setCapacity(state.maxCredits)
        setEnabled(state.potionCheckoutEnabled)
        setMessage(state.potionCheckoutEnabled
          ? 'Stripe top-ups are enabled. Credits arrive only after payment verification.'
          : 'Top-ups are paused until refund and dispute reversals are production-ready.')
      })
      .catch(() => {
        if (active) setMessage('Balance unavailable. No paid state is assumed.')
      })
    return () => { active = false }
  }, [])

  const buy = async (potionId: PotionId) => {
    if (!enabled) {
      setMessage('Top-ups are paused. No charge was made.')
      return
    }
    sfx.playCoinDrop()
    setSelected(potionId)
    setMessage('Opening secure Stripe Checkout…')
    try {
      const result = await createManaCheckoutAction(potionId)
      if (result.ok && result.url) {
        window.location.assign(result.url)
        return
      }
      setMessage(result.message ?? 'Checkout is unavailable. No charge was made.')
    } catch {
      setMessage('Checkout is unavailable. No charge was made.')
    }
    setSelected(null)
  }

  const meterCapacity = Math.max(1, capacity, balance)
  const percentage = Math.min(100, Math.round((balance / meterCapacity) * 100))

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy="mana-shop-dialog-title"
      describedBy="mana-shop-dialog-description"
      closeOnBackdrop={selected === null}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      panelClassName="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border-4 border-outline bg-canvas p-5 text-ink shadow-brutal-lg sm:p-8"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
        <button
          onClick={onClose}
          aria-label="Close mana shop"
          className="absolute top-4 right-4 bg-card hover:bg-black hover:text-white border-2 border-outline p-2 z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-accent border-4 border-outline p-5 shadow-brutal-lg">
          <h2 id="mana-shop-dialog-title" className="text-3xl sm:text-4xl font-black uppercase">The Alchemist Shop</h2>
          <p id="mana-shop-dialog-description" className="text-sm font-bold mt-2 pr-10">{message}</p>
        </div>

        <div className="mt-6 bg-black text-white border-4 border-outline p-4 shadow-[6px_6px_0_#06B6D4]">
          <div className="flex justify-between gap-4 text-sm font-black uppercase">
            <span>Server-verified scan balance</span>
            <span className="text-[#FFE600]">{balance.toLocaleString()} / {capacity.toLocaleString()}</span>
          </div>
          <div className="mt-3 h-8 border-2 border-white bg-zinc-900 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#A3E635]" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">
          {(Object.keys(POTION_CATALOG) as PotionId[]).map((id) => {
            const potion = POTION_CATALOG[id]
            const Icon = ICONS[id]
            return (
              <div key={id} className="bg-card border-4 border-outline p-5 shadow-brutal flex flex-col justify-between">
                <div>
                  <Icon className="w-12 h-12 mb-3" />
                  <h3 className="text-xl font-black uppercase">{potion.name}</h3>
                  <p className="text-3xl font-black text-[#06B6D4]">+{potion.quests.toLocaleString()}</p>
                  <p className="font-mono font-black">${(potion.priceCents / 100).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => void buy(id)}
                  disabled={!enabled || selected !== null}
                  className="mt-5 bg-accent disabled:bg-inset disabled:text-ink-muted border-3 border-outline py-3 font-black uppercase disabled:cursor-not-allowed"
                >
                  {selected === id ? <Zap className="w-5 h-5 animate-spin mx-auto" /> : enabled ? 'Open Stripe Checkout' : 'Top-ups paused'}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-7 text-xs font-bold text-ink-muted">
          This screen never adds local credits. The signed Stripe webhook and unique economic ledger are authoritative.
        </p>
    </AccessibleDialog>
  )
}
