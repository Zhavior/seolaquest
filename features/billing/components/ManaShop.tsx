import { motion, type Variants } from 'framer-motion'
import { Coins } from 'lucide-react'
import { POTION_CATALOG } from '@/src/modules/billing/domain/catalog'

type ManaShopProps = {
  itemVariants: Variants
  buyPotion: (potionId: string, questAmount: number) => void
  purchasingPotion: string | null
  potionSuccess: string | null
  potionCheckoutEnabled: boolean
  sfxBlip: () => void
}

export function ManaShop({ itemVariants, buyPotion, purchasingPotion, potionSuccess, potionCheckoutEnabled, sfxBlip }: ManaShopProps) {
  return (
    <motion.section variants={itemVariants} aria-labelledby="credit-top-ups">
      <div className="mb-6 border-b border-hairline pb-4">
        <h2 id="credit-top-ups" className="font-display text-3xl">A little more room to explore.</h2>
        <p className="mt-2 text-sm text-ink-muted">One-time credit top-ups. Credits apply only after verified payment.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(POTION_CATALOG).map(potion => (
          <article key={potion.id} className="flex min-w-0 flex-col rounded-2xl border border-hairline bg-card p-6 shadow-brutal-sm">
            <Coins aria-hidden className="mb-5 size-9 rounded-xl bg-highlight p-2 text-on-accent" />
            <h3 className="font-semibold">{potion.name}</h3>
            <p className="mt-3 font-display text-3xl tabular-nums">{potion.quests.toLocaleString()} <span className="font-sans text-sm text-ink-muted">scan credits</span></p>
            <p className="mt-3 text-sm text-ink-muted">{new Intl.NumberFormat('en-US', { style: 'currency', currency: potion.currency }).format(potion.priceCents / 100)} USD · one-time purchase</p>
            <button type="button" onClick={() => buyPotion(potion.id, potion.quests)} onMouseEnter={sfxBlip} disabled={!potionCheckoutEnabled || purchasingPotion !== null} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:bg-inset disabled:text-ink-muted">
              {!potionCheckoutEnabled ? 'Top-ups paused' : potionSuccess === potion.id ? 'Payment verified' : purchasingPotion === potion.id ? 'Opening checkout…' : 'Buy credits'}
            </button>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
