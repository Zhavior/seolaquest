import { motion, type Variants } from 'framer-motion'
import { Coins, Volume2, VolumeX } from 'lucide-react'

export type DamageEntry = { id: number; amount: number; x: number }

type BillingHeroProps = {
  itemVariants: Variants
  userCredits: number
  MAX_MANA: number
  isLowMana: boolean
  isRefilling: boolean
  damageTexts: DamageEntry[]
  refillNotification: number | null
  sfxEnabled: boolean
  setSfxEnabled: (v: boolean | ((prev: boolean) => boolean)) => void
  sfxBlip: () => void
  typedDialogue: string
}

export function BillingHero({ itemVariants, userCredits, isLowMana, sfxEnabled, setSfxEnabled }: BillingHeroProps) {
  return (
    <motion.section variants={itemVariants} className="grid gap-6 rounded-2xl bg-forest p-6 text-on-forest sm:p-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-xs font-medium tracking-wide text-forest-muted">Your field supplies</p>
        <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">Ready for your next discovery.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-forest-muted">Review your scan credits and subscription before starting more work. Rewards and scan credits stay separate.</p>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-5 rounded-2xl border border-white/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm"><Coins size={18} aria-hidden /> Scan credits</span>
          <button type="button" onClick={() => setSfxEnabled(v => !v)} aria-label={sfxEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={sfxEnabled} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/25">
            {sfxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
        <p className="font-display text-5xl tabular-nums text-accent">{userCredits.toLocaleString()}</p>
        <p className="text-xs leading-relaxed text-forest-muted">{isLowMana ? 'Your scan credit balance is low. Check the available options below.' : 'Current balance from your verified account.'}</p>
      </div>
    </motion.section>
  )
}
