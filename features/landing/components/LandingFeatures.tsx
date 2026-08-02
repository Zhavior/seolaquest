import React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Target, Compass, Gem } from 'lucide-react'

export const PAPER_TEXTURE_DATA_URI = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

interface BrutalCardProps {
  children: React.ReactNode
  className?: string
  bgColor?: string
  texture?: boolean
}

export const BrutalCard = ({ children, className = "", bgColor = "bg-[#fcf8f2]", texture = false }: BrutalCardProps) => (
  <div className={`relative border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none ${bgColor} overflow-hidden ${className}`}>
    {texture && <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("${PAPER_TEXTURE_DATA_URI}")` }} />}
    <div className="relative z-10">{children}</div>
  </div>
)

export function LandingFeatures() {
  const shouldReduceMotion = useReducedMotion()
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } }
  }

  return (
    <section className="py-20 sm:py-32 relative z-10 border-t-4 border-black bg-white cv-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial={shouldReduceMotion ? false : "hidden"} whileInView={shouldReduceMotion ? undefined : "visible"} viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16 sm:mb-24">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-widest mb-4">
            The Adventurer&apos;s Log
          </h2>
          <div className="w-20 sm:w-24 h-2 bg-[#ff4500] mx-auto border-2 border-black" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          
          {/* 1. Configure search */}
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }} whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0 }}>
            <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-6 sm:p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8 bg-[#4169e1] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-3">
                <Target size={40} strokeWidth={2.5} className="text-black sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-4">Configure Search</h3>
              <p className="font-bold text-base sm:text-lg leading-relaxed">Store the phrases you want configured providers to search for. A keyword match is not proof of purchase intent.</p>
            </BrutalCard>
          </motion.div>

          {/* 2. Scout Regions */}
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }} whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}>
            <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-6 sm:p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
              
              {/* Workflow illustration */}
              <div className="w-full bg-black border-4 border-black mb-6 text-left font-mono text-xs overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                <div className="bg-[#ff4500] px-2 py-1 text-white font-black border-b-4 border-black uppercase tracking-widest flex items-center gap-2">
                  <Compass size={12}/> PROVIDER WORKFLOW
                </div>
                <div className="p-3 text-[#32cd32]">
                  <p className="mb-1">{`>`} Start manual keyword scan</p>
                  <p className="mb-1 text-[#ffd700]">{`>`} Wait for provider result</p>
                  <p className="text-gray-300 border-l-2 border-gray-600 pl-2 mt-2">Store only records returned by the backend.</p>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-4">Scan Sources</h3>
              <p className="font-bold text-base sm:text-lg leading-relaxed">Start a manual scan against configured sources. Unavailable providers produce no new records.</p>
            </BrutalCard>
          </motion.div>

          {/* 3. Claim Victory */}
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }} whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }}>
            <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-6 sm:p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8 bg-[#ffd700] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-3">
                <Gem size={40} strokeWidth={2.5} className="text-black sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-4">Review Results</h3>
              <p className="font-bold text-base sm:text-lg leading-relaxed">Review stored matches, mark your own workflow state, and measure outcomes outside CoQuest until revenue attribution exists.</p>
            </BrutalCard>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
