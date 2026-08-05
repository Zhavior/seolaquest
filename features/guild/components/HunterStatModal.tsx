'use client'

import { useEffect } from 'react'
import { BarChart3, Flame, Search, Shield, Target } from 'lucide-react'
import AccessibleDialog from '@/components/AccessibleDialog'
import { GuildHunter } from '@/features/guild/types'
import { sfx } from '@/lib/sfx'

interface HunterStatModalProps {
  hunter: GuildHunter | null
  isAnonymousMode?: boolean
  onClose: () => void
}

export default function HunterStatModal({ hunter, isAnonymousMode = false, onClose }: HunterStatModalProps) {
  useEffect(() => {
    if (hunter) sfx.playCoinDrop()
  }, [hunter])

  if (!hunter) return null

  const displayName = hunter.isOwner && !isAnonymousMode
    ? hunter.name || 'Unnamed hunter'
    : hunter.alias || 'Anonymous hunter'
  const hasXp = hunter.level !== undefined && hunter.xp !== undefined && hunter.xpMax !== undefined && hunter.xpMax > 0
  const xpPercent = hasXp ? Math.min(100, Math.round((hunter.xp! / hunter.xpMax!) * 100)) : 0
  const activeScouts = hunter.activeScouts ?? []

  const handleClose = () => {
    sfx.playHoverBlip()
    onClose()
  }

  return (
    <AccessibleDialog
      open
      onClose={handleClose}
      labelledBy="hunter-stat-dialog-title"
      describedBy="hunter-stat-dialog-description"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xs"
      panelClassName="relative my-8 w-full max-w-xl space-y-6 border-4 border-outline bg-accent p-6 text-on-accent shadow-brutal-lg md:p-8"
      initial={{ scale: 0.9, opacity: 0, y: 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
    >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 border-2 border-outline bg-black px-3 py-1.5 text-xs font-black uppercase text-[#FFE600] hover:bg-accent-2 hover:text-white"
          aria-label="Close hunter details"
        >
          [✕ Close]
        </button>

        <header className="border-b-4 border-outline pb-5 pr-24">
          <span className="inline-block border border-outline bg-black px-2.5 py-0.5 text-xs font-black uppercase text-[#FFE600]">
            Stored rank #{hunter.rank}
          </span>
          <h2 id="hunter-stat-dialog-title" className="mt-3 break-words text-3xl font-black uppercase leading-none">{displayName}</h2>
          {hunter.classTitle && <p className="mt-2 text-sm font-black uppercase">{hunter.classTitle}</p>}
        </header>

        {hasXp ? (
          <section className="space-y-2 border-4 border-outline bg-card p-4 shadow-brutal">
            <div className="flex justify-between text-xs font-black uppercase">
              <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Level {hunter.level}</span>
              <span>{hunter.xp!.toLocaleString()} / {hunter.xpMax!.toLocaleString()} XP</span>
            </div>
            <div className="h-5 overflow-hidden border-2 border-outline bg-inset">
              <div className="h-full bg-success" style={{ width: `${xpPercent}%` }} />
            </div>
          </section>
        ) : (
          <p className="border-4 border-outline bg-card p-4 text-sm font-black uppercase shadow-brutal">
            Level and XP are not measured for this profile.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Target className="h-5 w-5" />} label="Processed leads" value={hunter.bountiesSlayed.toLocaleString()} />
          <StatCard icon={<Flame className="h-5 w-5" />} label="Active streak" value={`${hunter.activeStreak} days`} />
          <StatCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Efficiency"
            value={hunter.manaEfficiency > 0 ? `${hunter.manaEfficiency}%` : 'Not measured'}
          />
        </div>

        {hunter.totalLeads !== undefined && (
          <p className="border-2 border-outline bg-card p-3 text-sm font-black uppercase">
            Stored lead total: {hunter.totalLeads.toLocaleString()}
          </p>
        )}

        {hunter.avgLatency && (
          <p className="border-2 border-outline bg-card p-3 text-sm font-black uppercase">
            Measured average latency: {hunter.avgLatency}
          </p>
        )}

        <section className="border-4 border-outline bg-card p-4 shadow-brutal">
          <h3 className="flex items-center gap-2 border-b-2 border-outline pb-2 text-xs font-black uppercase">
            <Search className="h-4 w-4" /> Stored scout labels
          </h3>
          {activeScouts.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeScouts.map((scout) => (
                <span key={scout} className="border-2 border-outline bg-canvas px-3 py-1 text-xs font-black uppercase">
                  {scout}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm font-bold text-ink-muted">No scout labels are stored for this profile.</p>
          )}
        </section>

        <p id="hunter-stat-dialog-description" className="text-xs font-bold uppercase text-ink-muted">
          No pipeline value, response SLA, customer identity, or achievement is inferred in this view.
        </p>
    </AccessibleDialog>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-4 border-outline bg-card p-4 shadow-brutal">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-ink-muted">{icon}{label}</div>
      <p className="mt-2 text-2xl font-black uppercase">{value}</p>
    </div>
  )
}
