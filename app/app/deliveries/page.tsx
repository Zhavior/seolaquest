import type { Metadata } from 'next'
import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { Radio, Sparkles } from 'lucide-react'
import { listCurrentUserDeliveries } from '@/features/deliveries/queries'
import DeliveriesLoading from './loading'

const DeliveryList = nextDynamic(() =>
  import('@/features/deliveries/components/DeliveryList').then((m) => m.DeliveryList)
)

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Campaign Broadcast & CRM Deliveries | CoQuest',
  description: 'Review the recorded worker status and dispatch history of your CRM deliveries.',
}

export default function DeliveriesPage() {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FDFBF7] select-none">
      {/* Authentic Parchment / Commander's Map Paper Overlay (1:1 with Guild Hall) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-[1400px] p-4 font-black md:p-8 space-y-8">
        {/* Background Emblem Watermark */}
        <div className="hidden md:block absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.05] pointer-events-none">
          <Radio className="w-[650px] h-[650px] text-black" />
        </div>

        {/* Neo-Brutalist Ticker Banner (1:1 with Guild Hall) */}
        <div className="w-full overflow-hidden border-4 border-black bg-[#FFE600] py-2 flex whitespace-nowrap shadow-[4px_4px_0_0_#000]">
          <div className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black animate-[marquee_25s_linear_infinite]">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-black" /> 📡 CAMPAIGN BROADCAST <Sparkles className="w-5 h-5 text-black" /> 🛡️ CRM DISPATCH LEDGER
              </span>
            ))}
          </div>
        </div>

        {/* Header (1:1 with Guild Hall) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Radio className="w-8 h-8 text-[#FF5722]" />
              <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
                COMMANDER&apos;S MAP & CAMPAIGN DISPATCHES
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
              Campaign Broadcast
            </h1>
            <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-black">
              CRM Deliveries & Recorded Worker Status
            </p>
          </div>
          
          <div className="flex items-center gap-3 border-4 border-black bg-white px-5 py-3 shadow-[6px_6px_0_0_#000]">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase text-gray-500 font-bold">DISPATCH ENGINE</span>
              <span className="text-lg uppercase font-black leading-none text-black">ACTIVE [MONITORED]</span>
            </div>
          </div>
        </div>

        <Suspense fallback={<DeliveriesLoading />}>
          <DeliveryListData />
        </Suspense>
      </div>
    </div>
  )
}

async function DeliveryListData() {
  const result = await listCurrentUserDeliveries()
  return <DeliveryList {...result} />
}
