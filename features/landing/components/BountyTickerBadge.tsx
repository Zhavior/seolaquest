import { Activity } from 'lucide-react'

export default function BountyTickerBadge() {
  return (
    <div className="mb-6 inline-flex -rotate-1 flex-wrap items-center justify-center gap-2 border-2 border-black bg-black px-3 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(255,69,0,1)] sm:border-3 sm:px-4 sm:text-sm lg:justify-start">
      <span className="flex items-center gap-1 font-black text-white">
        <Activity size={14} /> PRODUCT BETA
      </span>
      <span className="hidden opacity-50 sm:inline">|</span>
      <span className="text-[#FFF36B]">No fabricated live counters</span>
    </div>
  )
}
