'use client'

import { Shield } from 'lucide-react'
import { GuildHunter } from '@/features/guild/types'

interface GuildLedgerTableProps {
  hunters: GuildHunter[]
  isAnonymousMode: boolean
  onSelectHunter?: (hunter: GuildHunter) => void
}

export default function GuildLedgerTable({ hunters, isAnonymousMode, onSelectHunter }: GuildLedgerTableProps) {
  const displayName = (hunter: GuildHunter) => {
    if (hunter.isOwner && !isAnonymousMode) return hunter.name || 'Unnamed hunter'
    return hunter.alias || 'Anonymous hunter'
  }

  return (
    <section className="w-full space-y-4">
      <header className="flex items-center gap-3 border-b-4 border-black pb-3">
        <div className="border-2 border-black bg-[#FFE600] p-2 shadow-[2px_2px_0_0_#000]">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase md:text-3xl">Guild activity ledger</h2>
          <p className="text-xs font-bold uppercase text-gray-500">Only stored, consented profile values</p>
        </div>
      </header>

      {hunters.length === 0 ? (
        <div className="border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#000]">
          <h3 className="text-xl font-black uppercase">No public hunters</h3>
          <p className="mt-2 font-bold text-gray-600">Public rankings require explicit participant opt-in.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
          <table className="min-w-[620px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-black bg-black text-xs font-black uppercase text-white">
                <th className="p-4">Stored rank</th>
                <th className="p-4">Hunter</th>
                <th className="p-4 text-right">Processed leads</th>
                <th className="p-4 text-right">Active streak</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black text-sm font-black">
              {hunters.map((hunter) => (
                <tr key={hunter.id} className={onSelectHunter ? 'hover:bg-[#F4F0EA] focus-within:bg-[#F4F0EA]' : ''}>
                  <td className="p-4">#{hunter.rank}</td>
                  <td className="p-4 uppercase">
                    {onSelectHunter ? (
                      <button type="button" onClick={() => onSelectHunter(hunter)} className="min-h-11 font-black underline decoration-2 underline-offset-4">
                        View {displayName(hunter)} details
                      </button>
                    ) : displayName(hunter)}
                  </td>
                  <td className="p-4 text-right">{hunter.bountiesSlayed.toLocaleString()}</td>
                  <td className="p-4 text-right">{hunter.activeStreak} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
