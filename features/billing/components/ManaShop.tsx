import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { FlaskConical, Sparkles, Flame } from 'lucide-react'

type ManaShopProps = {
  itemVariants: Variants
  buyPotion: (potionId: string, questAmount: number) => void
  purchasingPotion: string | null
  potionSuccess: string | null
  potionCheckoutEnabled: boolean
  sfxBlip: () => void
}

export function ManaShop({
  itemVariants,
  buyPotion,
  purchasingPotion,
  potionSuccess,
  potionCheckoutEnabled,
  sfxBlip
}: ManaShopProps) {
  const [hoveredPotion, setHoveredPotion] = useState<string | null>(null)

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-4 mb-6 border-b-4 border-outline pb-4">
        <div className="bg-info p-3 border-4 border-outline shadow-brutal">
          <FlaskConical className="w-8 h-8 text-on-accent" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl uppercase">Consumable Potions</h2>
          <p className="text-xs font-bold text-ink-muted">
            {potionCheckoutEnabled ? 'Secure Stripe top-ups are available.' : 'Top-ups are paused until refund and dispute reversals ship.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* 1. Minor Mana Vial */}
        <motion.div 
          initial="rest" 
          whileHover="hover" 
          whileTap="tap" 
          animate="rest"
          onHoverStart={() => { setHoveredPotion('minor'); sfxBlip() }}
          onHoverEnd={() => setHoveredPotion(null)}
          className="bg-card border-4 border-outline p-6 flex flex-col justify-between group relative overflow-visible shadow-brutal-lg"
        >
          {/* ── 1. Arcade Grid Aura on hover ── */}
          {hoveredPotion === 'minor' && (
            <div className="arcade-grid-bg absolute inset-0 z-0 rounded-none opacity-60" />
          )}
          <div className="absolute top-0 right-0 bg-info text-on-accent border-l-4 border-b-4 border-outline px-3 py-1 uppercase text-xs shadow-[-4px_4px_0_0_#000] font-black z-10">
            Starter Vial
          </div>

          {hoveredPotion === 'minor' && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: [-10, -40, -55], x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)], opacity: [0, 1, 0], scale: [0.6, 1.3, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.25, ease: "easeOut" }}
                  className="text-xl select-none"
                >
                  {i % 2 === 0 ? '✨' : '🧪'}
                </motion.span>
              ))}
            </div>
          )}

          <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
            <div>
              <motion.div 
                animate={{ rotate: hoveredPotion === 'minor' ? 45 : 0, scale: hoveredPotion === 'minor' ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-24 h-24 mx-auto bg-cyan-100 border-4 border-outline flex items-center justify-center my-4 shadow-brutal-lg animate-arcade-float"
              >
                <FlaskConical className="w-12 h-12 text-[#06B6D4] pixel-icon" />
              </motion.div>

              <h3 className="font-black text-2xl uppercase text-center">Minor Mana Vial</h3>
              <p className="text-4xl font-black text-center mt-1 text-[#06B6D4]" style={{ WebkitTextStroke: '1px black' }}>+1,000 Scan Credits</p>

              <div className="mt-4 bg-black text-[#A3E635] border-2 border-outline p-2 text-center text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#06B6D4]">
                <span>🧾</span> Credits apply after verified payment
              </div>
            </div>
            
            <button
              onClick={() => buyPotion('minor_vial', 1000)}
              disabled={!potionCheckoutEnabled || purchasingPotion === 'minor_vial'}
              onMouseEnter={() => { setHoveredPotion('minor'); sfxBlip() }}
              onMouseLeave={() => setHoveredPotion(null)}
              className="mt-6 w-full bg-accent hover:bg-yellow-300 font-black text-base md:text-lg uppercase py-3.5 border-4 border-outline shadow-brutal-lg hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-1.5 active:translate-y-1.5 active:shadow-brutal-sm transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{!potionCheckoutEnabled ? 'TOP-UPS PAUSED' : potionSuccess === 'minor_vial' ? '✅ VERIFIED' : purchasingPotion === 'minor_vial' ? '⚡ OPENING…' : '[BUY VIAL]'}</span>
              <span className="bg-black text-white px-2 py-0.5 text-sm border-2 border-outline">$5.00</span>
            </button>
          </div>
        </motion.div>

        {/* 2. Greater Mana Elixir */}
        <motion.div 
          initial="rest" 
          whileHover="hover" 
          whileTap="tap" 
          animate="rest"
          onHoverStart={() => { setHoveredPotion('greater'); sfxBlip() }}
          onHoverEnd={() => setHoveredPotion(null)}
          className="bg-accent border-4 border-outline p-6 flex flex-col justify-between group relative overflow-visible shadow-brutal-lg"
        >
          {hoveredPotion === 'greater' && (
            <div className="arcade-grid-bg absolute inset-0 z-0 opacity-40" />
          )}
          <div className="absolute top-0 left-0 bg-[#A855F7] text-white border-r-4 border-b-4 border-outline px-3 py-1 uppercase text-xs shadow-brutal font-black z-10">
            2,500 Credits
          </div>

          {hoveredPotion === 'greater' && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: [-10, -40, -55], x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)], opacity: [0, 1, 0], scale: [0.6, 1.3, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.25, ease: "easeOut" }}
                  className="text-xl select-none"
                >
                  {i % 2 === 0 ? '🟣' : '✨'}
                </motion.span>
              ))}
            </div>
          )}

          <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
            <div>
              <motion.div 
                animate={{ rotate: hoveredPotion === 'greater' ? -45 : 0, scale: hoveredPotion === 'greater' ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-24 h-24 mx-auto bg-card border-4 border-outline flex items-center justify-center my-4 shadow-brutal-lg animate-arcade-float"
              >
                <Sparkles className="w-12 h-12 text-[#A855F7] pixel-icon" />
              </motion.div>

              <h3 className="font-black text-2xl uppercase text-center">Greater Mana Elixir</h3>
              <p className="text-4xl font-black text-center mt-1 text-ink">+2,500 Scan Credits</p>

              <div className="mt-4 bg-black text-[#FFE600] border-2 border-outline p-2 text-center text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#A855F7]">
                <span>🧾</span> Credits apply after verified payment
              </div>
            </div>
            
            <button
              onClick={() => buyPotion('greater_elixir', 2500)}
              disabled={!potionCheckoutEnabled || purchasingPotion === 'greater_elixir'}
              onMouseEnter={() => { setHoveredPotion('greater'); sfxBlip() }}
              onMouseLeave={() => setHoveredPotion(null)}
              className="mt-6 w-full bg-card hover:bg-inset text-ink font-black text-base md:text-lg uppercase py-3.5 border-4 border-outline shadow-brutal-lg hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-1.5 active:translate-y-1.5 active:shadow-brutal-sm transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{!potionCheckoutEnabled ? 'TOP-UPS PAUSED' : potionSuccess === 'greater_elixir' ? '✅ VERIFIED' : purchasingPotion === 'greater_elixir' ? '⚡ OPENING…' : '[BUY ELIXIR]'}</span>
              <span className="bg-black text-white px-2 py-0.5 text-sm border-2 border-outline">$10.00</span>
            </button>
          </div>
        </motion.div>

        {/* 3. Dragon's Mana Cauldron */}
        <motion.div 
          initial="rest" 
          whileHover="hover" 
          whileTap="tap" 
          animate="rest"
          onHoverStart={() => { setHoveredPotion('dragon_cauldron'); sfxBlip() }}
          onHoverEnd={() => setHoveredPotion(null)}
          className="bg-accent-2 border-4 border-outline p-6 flex flex-col justify-between group relative overflow-visible legendary-fire-border" 
          style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
        >
          <div className="absolute inset-0 bg-accent-2 opacity-90 z-0"></div>

          <span className="absolute -top-4 -right-2 bg-red-600 text-white font-black px-3 py-1 border-2 border-outline animate-bounce text-xs uppercase tracking-widest shadow-brutal-sm z-20">
            🔥 6,000 CREDITS
          </span>

          <div className="absolute top-0 right-0 bg-black text-[#F59E0B] border-l-4 border-b-4 border-white px-3 py-1 uppercase text-xs shadow-[-4px_4px_0_0_#F59E0B] z-10 font-black">
            One-Time Top-Up
          </div>

          {hoveredPotion === 'dragon_cauldron' && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: [-10, -40, -55], x: [(i % 2 === 0 ? -15 : 15), (i % 2 === 0 ? 20 : -20)], opacity: [0, 1, 0], scale: [0.6, 1.3, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.25, ease: "easeOut" }}
                  className="text-xl select-none"
                >
                  {i % 2 === 0 ? '🔥' : '🐉'}
                </motion.span>
              ))}
            </div>
          )}
          
          <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
            <div>
              <motion.div 
                animate={{ rotate: hoveredPotion === 'dragon_cauldron' ? 45 : 0, scale: hoveredPotion === 'dragon_cauldron' ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-24 h-24 mx-auto bg-black border-4 border-white flex items-center justify-center my-4 shadow-[6px_6px_0_0_#F59E0B] animate-arcade-float"
              >
                <Flame className="w-12 h-12 text-[#F59E0B] pixel-icon" />
              </motion.div>

              <h3 className="font-black text-2xl uppercase text-center text-white" style={{ WebkitTextStroke: '1px black' }}>Dragon&apos;s Mana Cauldron</h3>
              <p className="text-4xl font-black text-center mt-1 text-[#FFE600] drop-shadow-brutal-sm">+6,000 Scan Credits</p>

              <div className="mt-4 bg-black text-[#F59E0B] border-2 border-white p-2 text-center text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#FF5722]">
                <span>🧾</span> Credits apply after verified payment
              </div>
            </div>
            
            <button
              onClick={() => buyPotion('dragon_cauldron', 6000)}
              disabled={!potionCheckoutEnabled || purchasingPotion === 'dragon_cauldron'}
              onMouseEnter={() => { setHoveredPotion('dragon_cauldron'); sfxBlip() }}
              onMouseLeave={() => setHoveredPotion(null)}
              className="mt-6 w-full bg-black hover:bg-zinc-800 text-[#F59E0B] font-black text-base md:text-lg uppercase py-3.5 border-4 border-white shadow-[6px_6px_0_0_#F59E0B] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#F59E0B] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[2px_2px_0_0_#F59E0B] transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{!potionCheckoutEnabled ? 'TOP-UPS PAUSED' : potionSuccess === 'dragon_cauldron' ? '✅ VERIFIED' : purchasingPotion === 'dragon_cauldron' ? '⚡ OPENING…' : '[BUY CAULDRON]'}</span>
              <span className="bg-[#F59E0B] text-on-accent px-2 py-0.5 text-sm border-2 border-outline">$20.00</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
