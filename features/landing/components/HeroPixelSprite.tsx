'use client'

import { Database, Search, ShieldCheck } from 'lucide-react'

export default function HeroPixelSprite() {
  return (
    <div className="relative w-full border-4 border-black bg-[#ffd700] p-5 shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:p-8">
      <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Search className="h-5 w-5" /> Keyword workflow</span>
          <span className="border border-black bg-[#F4F0EA] px-2 py-1 text-[10px] font-black uppercase">Illustration only</span>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 border-2 border-black bg-[#F4F0EA] p-3">
            <Database className="h-5 w-5 shrink-0 text-[#06B6D4]" />
            <p className="text-sm font-bold">Configured providers may store posts that match a tenant keyword.</p>
          </div>
          <div className="flex items-start gap-3 border-2 border-black bg-[#F4F0EA] p-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#FF5722]" />
            <p className="text-sm font-bold">The user reviews the source record. No intent, revenue, reply, or reward is inferred.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
