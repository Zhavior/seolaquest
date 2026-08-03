import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Radar } from 'lucide-react'
import { DashboardKeyword } from '@/features/dashboard/types'

type DashboardRadarProps = {
  item: Variants
  particles: { id: number; x: number; y: number }[]
  keywords: DashboardKeyword[]
  isPending: boolean
  runMockScanner: () => void
}

export function DashboardRadar({
  item,
  particles,
  keywords,
  isPending,
  runMockScanner
}: DashboardRadarProps) {
  return (
    <motion.div variants={item} className="xl:col-span-4 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] flex flex-col items-center justify-center relative overflow-hidden group">
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }} animate={{ opacity: 0, scale: 3, x: p.x, y: p.y }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#EF4444] border-2 border-black rounded-full pointer-events-none z-30" />
        ))}
      </AnimatePresence>
      
      <div className={`uppercase text-xs md:text-sm font-black px-4 py-1.5 border-2 border-black mb-6 rotate-2 shadow-[2px_2px_0_0_#000] text-center ${
        keywords.length > 0
          ? 'bg-[#EF4444] text-white'
          : 'bg-zinc-200 text-zinc-800'
      }`}>
        {keywords.length > 0
          ? `${keywords.length} KEYWORD${keywords.length > 1 ? 'S' : ''} CONFIGURED`
          : 'NO KEYWORDS CONFIGURED'}
      </div>
      
      <div className="relative flex items-center justify-center w-full max-w-[240px] aspect-square">
        {keywords.length > 0 && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#EF4444]/30 animate-ping pointer-events-none z-0" />
            <div className="absolute -inset-4 rounded-full border-4 border-dashed border-[#EF4444] animate-[spin_10s_linear_infinite] pointer-events-none opacity-60 z-0" />
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
          animate={isPending ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] } : {}}
          transition={{ repeat: isPending ? Infinity : 0, duration: 0.2 }}
          onClick={runMockScanner}
          disabled={isPending}
          className="w-full aspect-square max-w-[240px] rounded-full bg-[#EF4444] border-8 border-black shadow-[8px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-4 cursor-crosshair disabled:opacity-50 relative z-10"
          style={{ background: 'radial-gradient(circle at 30% 30%, #ff7373, #EF4444)' }}
        >
          <Radar className="w-20 h-20 text-white" />
          <span className="font-black text-2xl uppercase text-white tracking-wider" style={{ WebkitTextStroke: '1px black' }}>MANUAL SCAN</span>
        </motion.button>
      </div>
      <Radar className="absolute top-0 right-0 w-64 h-64 text-black opacity-5 group-hover:rotate-45 transition-transform duration-1000" />
    </motion.div>
  )
}
