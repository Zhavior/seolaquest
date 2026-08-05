import { Variants, motion, AnimatePresence } from 'framer-motion'
import { Crown, Volume2, VolumeX, Zap } from 'lucide-react'

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

export function BillingHero({
  itemVariants,
  userCredits,
  MAX_MANA,
  isLowMana,
  isRefilling,
  damageTexts,
  refillNotification,
  sfxEnabled,
  setSfxEnabled,
  sfxBlip,
  typedDialogue
}: BillingHeroProps) {
  return (
    <>
      {/* ── Header + Mana Meter row ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">

        {/* Alchemist Shop Header */}
        <div className="flex-1 bg-success border-4 border-outline p-6 md:p-8 shadow-brutal-lg flex flex-col justify-center relative overflow-hidden group" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px', backgroundPosition: '-2px -2px' }}>
          <div className="absolute inset-0 bg-success opacity-90 z-0"></div>
          <div className="relative z-10">
            <div className="bg-black text-white px-4 py-1 inline-block uppercase text-xs md:text-sm mb-3 border-2 border-white -rotate-2 shadow-[2px_2px_0_0_#fff]">
              Merchant&apos;s Guild
            </div>
            <h1 className="text-4xl md:text-7xl uppercase text-white" style={{ WebkitTextStroke: '2px black' }}>
              The Alchemist Shop
            </h1>
          </div>

          {/* ── SFX Toggle ──────────────────────────────────────────── */}
          <button
            onClick={() => setSfxEnabled(v => !v)}
            onMouseEnter={sfxBlip}
            className="sfx-toggle absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black text-[#FFE600] border-2 border-white px-3 py-1.5 text-[10px] uppercase font-black shadow-[3px_3px_0_0_#fff] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#fff] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#fff] transition-all"
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            SFX {sfxEnabled ? 'ON' : 'OFF'}
          </button>

          <Crown className="absolute -bottom-10 -right-10 w-64 h-64 text-ink opacity-10 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* ── Retro 8-Bit Liquid Mana Meter with Low-MP warning ──────── */}
        <div className="lg:w-1/2 bg-black border-4 border-outline p-6 shadow-[8px_8px_0_0_#06B6D4] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#06B6D4] pb-2 mb-3 z-10">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${isLowMana ? 'text-red-400 animate-pulse' : 'text-[#06B6D4] animate-pulse'}`} />
              <span className={`uppercase text-xs md:text-sm font-black tracking-wider ${isLowMana ? 'text-red-400' : 'text-[#06B6D4]'}`}>
                {isLowMana ? '⚠️ LOW MANA WARNING' : 'Active Mana Balance'}
              </span>
            </div>
            <span className="bg-info text-on-accent px-2 py-0.5 text-[10px] md:text-xs font-black uppercase border border-outline shadow-[2px_2px_0_0_#fff]">
              RETRO MP METER
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3 z-10">
            <div className={`text-4xl md:text-6xl font-black tracking-tight ${isLowMana ? 'text-red-400' : 'text-[#FFE600]'}`} style={{ WebkitTextStroke: '1px black' }}>
              {userCredits.toLocaleString()} <span className="text-lg md:text-2xl text-cyan-300 font-bold">MP</span>
            </div>
            <div className="text-xs text-cyan-200 uppercase font-mono font-bold">
              CAP: {MAX_MANA.toLocaleString()} MP
            </div>
          </div>

          {/* 8-Bit Liquid Mana Bar */}
          <div className="w-full bg-slate-950 border-4 border-white p-1 relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] z-10">
            <motion.div
              animate={{
                width: `${Math.min(100, Math.max(4, (userCredits / MAX_MANA) * 100))}%`,
                scale: isRefilling ? [1, 1.03, 1] : 1
              }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className={`h-7 md:h-8 relative overflow-hidden ${
                isLowMana
                  ? 'low-mana-bar'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-[#A3E635] shadow-[0_0_15px_#06B6D4]'
              }`}
            >
              {/* Shimmer overlay */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
              />
            </motion.div>

            {/* Retro Segment Grid Ticks */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-[2px] h-full bg-black/50 border-r border-white/20" />
              ))}
            </div>
          </div>

          {/* Low-mana warning label */}
          {isLowMana && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black uppercase text-red-400 mt-1 tracking-widest z-10"
            >
              ⚠️ CRITICAL — Refill now before your quests go dark!
            </motion.p>
          )}

          {/* ── Floating Damage Text (RPG heal numbers) ── */}
          <div className="absolute inset-0 overflow-visible pointer-events-none z-30">
            {damageTexts.map(d => (
              <div
                key={d.id}
                className="damage-text absolute font-black text-[#FFE600] text-xl md:text-2xl"
                style={{
                  left: `${d.x}%`,
                  bottom: '60%',
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
                  whiteSpace: 'nowrap'
                }}
              >
                +{d.amount.toLocaleString()} MP! 🧪✨
              </div>
            ))}
          </div>

          {/* Refill floating popup (legacy mini popup) */}
          <AnimatePresence>
            {refillNotification && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: -30, opacity: 1, scale: 1.15 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute top-2 right-4 bg-accent text-on-accent border-2 border-outline font-black text-xs md:text-sm px-3 py-1 shadow-brutal z-30"
              >
                MANA REFILLED! 🧪✨
              </motion.div>
            )}
          </AnimatePresence>

          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-[#06B6D4] opacity-10 pointer-events-none" />
        </div>
      </motion.div>

      {/* ── Typewriter Alchemist NPC Dialogue + Urgency Timer ──────────── */}
      <motion.div variants={itemVariants} className="bg-accent border-4 border-outline p-5 md:p-6 shadow-brutal-lg flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-4 relative z-10 flex-1">
          {/* NPC Merchant Portrait */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, -3, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-16 h-16 bg-amber-200 border-4 border-outline rounded-full flex items-center justify-center text-3xl shadow-brutal-sm"
            >
              🧙‍♂️
            </motion.div>
            <div className="absolute -bottom-1 -right-1 bg-black text-[#FFE600] text-[9px] font-black uppercase px-1.5 py-0.5 border border-white shadow-brutal-sm">
              NPC
            </div>
          </div>

          {/* Merchant Typewriter Speech */}
          <div className="flex-1">
            <div className="bg-black text-[#A3E635] border-2 border-white px-2.5 py-0.5 inline-block text-xs font-black uppercase mb-2 shadow-brutal-sm -rotate-1">
              Billing Notice 📜
            </div>
            <div className="bg-black border-2 border-white p-3 relative shadow-brutal">
              {/* Speech bubble pointer */}
              <div className="absolute -left-3 top-4 w-0 h-0 border-t-8 border-b-8 border-r-[12px] border-t-transparent border-b-transparent border-r-black" />
              <p className="text-[#A3E635] text-xs md:text-sm font-mono leading-relaxed min-h-[3em]">
                <span className="text-[#FFE600] font-black">[ALCHEMIST]: </span>
                <span className="typewriter-caret">{typedDialogue}</span>
              </p>
            </div>
            <p className="text-xs font-bold text-ink mt-2">Only server-confirmed Stripe payments change your balance.</p>
          </div>
        </div>

        {/* Unsupported bundles remain visibly unavailable. */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 relative z-10">
          <button
            disabled
            onMouseEnter={sfxBlip}
            className="w-full md:w-auto bg-zinc-800 text-ink-muted font-black text-base uppercase px-6 py-3.5 border-4 border-white shadow-brutal-lg cursor-not-allowed"
          >
            [BUNDLE NOT FOR SALE]
          </button>
          <div className="bg-zinc-600 text-white border-2 border-outline font-black text-[10px] uppercase px-3 py-1 shadow-brutal-sm tracking-widest text-center">
            NO FALSE URGENCY
          </div>
        </div>
      </motion.div>
    </>
  )
}
