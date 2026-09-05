'use client'

import { Shield } from 'lucide-react'
import { QuestPanel, QuestSectionHeading, questSurface } from '@/components/quest'
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
    <section className="w-full space-y-4" aria-labelledby="guild-ledger-heading">
      <QuestSectionHeading
        titleId="guild-ledger-heading"
        icon={<Shield className="h-6 w-6" />}
        iconTone="gold"
        title="Guild activity ledger"
        subtitle="Only stored, consented profile values"
        className="mb-0 pb-3"
      />

      {hunters.length === 0 ? (
        <QuestPanel padding="lg" className="text-center">
          <h3 className="font-display text-xl font-semibold normal-case">No public hunters</h3>
          <p className="mt-2 font-medium text-ink-muted">Public rankings require explicit participant opt-in.</p>
        </QuestPanel>
      ) : (
        <>
        {/* Phones (<640px) get stacked cards; tablets and desktops (640px+) get the scrollable table */}
        <ul className="space-y-3 sm:hidden">
          {hunters.map((hunter) => (
            <li
              key={hunter.id}
              className={questSurface({ shadow: 'md', className: 'p-3.5' })}
            >
              <div className="flex items-start gap-3">
                <span className={questSurface({ tone: 'gold', border: 2, shadow: 'xs', className: 'shrink-0 px-2 py-1 text-xs font-semibold' })}>
                  #{hunter.rank}
                </span>
                <div className="min-w-0 flex-1 text-sm font-semibold normal-case">
                  {onSelectHunter ? (
                    <button
                      type="button"
                      onClick={() => onSelectHunter(hunter)}
                      className="min-h-[44px] flex items-center font-semibold underline decoration-2 underline-offset-4 text-left break-word-safe"
                    >
                      View {displayName(hunter)} details
                    </button>
                  ) : (
                    <span className="break-word-safe">{displayName(hunter)}</span>
                  )}
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-outline pt-3">
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold normal-case text-ink-muted">Processed leads</dt>
                  <dd className="mt-0.5 text-base font-semibold">{hunter.bountiesSlayed.toLocaleString()}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold normal-case text-ink-muted">Active streak</dt>
                  <dd className="mt-0.5 text-base font-semibold">{hunter.activeStreak} days</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <div className={questSurface({ className: 'hidden overflow-x-auto sm:block' })}>
          <table className="min-w-[620px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline bg-black text-xs font-semibold normal-case text-white">
                <th className="p-4">Stored rank</th>
                <th className="p-4">Hunter</th>
                <th className="p-4 text-right">Processed leads</th>
                <th className="p-4 text-right">Active streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-sm font-semibold">
              {hunters.map((hunter) => (
                <tr key={hunter.id} className={onSelectHunter ? 'hover:bg-canvas focus-within:bg-canvas' : ''}>
                  <td className="p-4">#{hunter.rank}</td>
                  <td className="p-4 normal-case">
                    {onSelectHunter ? (
                      <button type="button" onClick={() => onSelectHunter(hunter)} className="min-h-[44px] flex items-center font-semibold underline decoration-2 underline-offset-4">
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
        </>
      )}
    </section>
  )
}
