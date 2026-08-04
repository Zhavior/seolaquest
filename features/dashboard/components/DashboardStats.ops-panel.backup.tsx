import { motion, Variants } from 'framer-motion'
import { Share2, Sparkles, Radar, ScrollText, Zap, ShieldAlert, Crosshair } from 'lucide-react'
import HeroCrest from '@/components/HeroCrest'
import { DashboardUser, DashboardLead } from '@/features/dashboard/types'

function ProviderStatusStrip() {
  const providers = [
    {
      label: 'Reddit',
      state: 'ACTIVE',
      detail: 'Signal feed live',
      tone: 'bg-[#A3E635]',
      dotTone: 'bg-[#2F5A00]',
    },
    {
      label: 'X',
      state: 'WARNING',
      detail: 'Rate limit watch',
      tone: 'bg-[#F7D046]',
      dotTone: 'bg-[#7A5200]',
    },
    {
      label: 'LinkedIn',
      state: 'INACTIVE',
      detail: 'Auth needed',
      tone: 'bg-white',
      dotTone: 'bg-black',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {providers.map((provider) => (
        <button
          key={provider.label}
          type="button"
          title={`${provider.label}: ${provider.state} — ${provider.detail}`}
          className={`inline-flex min-w-0 max-w-full items-center gap-2 border-2 border-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] shadow-[2px_2px_0_0_#000] ${provider.tone}`}
        >
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black ${provider.dotTone}`} />
          <span className="truncate">
            {provider.label} {provider.state}
          </span>
        </button>
      ))}
    </div>
  )
}

function DailyQuestCard({
  questsRemaining,
  leadsCount,
}: {
  questsRemaining: number
  leadsCount: number
}) {
  const completedQuestCount = Math.max(0, 3 - questsRemaining)

  const questRows = [
    {
      label: 'Quest streak progress',
      progressLabel: `${completedQuestCount} / 3`,
      done: questsRemaining <= 0,
    },
    {
      label: 'Review 1 lead today',
      progressLabel: `${Math.min(leadsCount, 1)} / 1`,
      done: leadsCount >= 1,
    },
  ]

  return (
    <div className="min-w-0 border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
      <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Daily quest log</p>
          <h3 className="text-xl font-black uppercase">XP Objectives</h3>
        </div>
        <span className="inline-flex w-full justify-center sm:w-auto shrink-0 items-center gap-2 whitespace-nowrap border-2 border-black bg-[#FFE600] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          +100 XP
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {questRows.map((quest) => (
          <div
            key={quest.label}
            className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-2 border-black px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] ${
              quest.done ? 'bg-[#A3E635]' : 'bg-[#F4F0EA]'
            }`}
          >
            <span className="min-w-0 flex-1 break-words">
              {quest.done ? '[x]' : '[ ]'} {quest.label}
            </span>
            <span className="shrink-0 whitespace-nowrap">{quest.progressLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type DashboardStatsProps = {
  item: Variants
  user: DashboardUser
  characterTitle: string
  isScanning: boolean
  recentLevelUp: boolean
  xpPercent: number
  leads: DashboardLead[]
  shareStats: () => void
}

export function DashboardStats({
  item,
  user,
  characterTitle,
  isScanning,
  recentLevelUp,
  xpPercent,
  leads,
  shareStats,
}: DashboardStatsProps) {
  const questsRemaining = user.questsRemaining ?? 3
  const hasLeadData = leads.length > 0

  return (
    <motion.div
      variants={item}
      className="w-full min-w-0 max-w-full overflow-hidden border-4 border-black bg-[#13D7C2] p-4 shadow-[8px_8px_0_0_#000] sm:p-6 md:p-8 xl:p-10"
    >
      <div className="mb-8 flex flex-col gap-3">
        <ProviderStatusStrip />
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/75">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0_0_#000]">
            <Radar className="h-3.5 w-3.5 shrink-0" />
            Command pulse stable
          </span>
          <span>Last synced: 4m ago</span>
          <span className="hidden text-black/40 sm:inline">•</span>
          <span>Next auto-run: 26m</span>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] 2xl:grid-cols-[1.15fr_1fr_0.95fr]">
        <div className="min-w-0 space-y-6">
          <HeroCrest
            heroName={user.name}
            heroTitle={characterTitle}
            level={user.level}
            isScanning={isScanning}
            recentLevelUp={recentLevelUp}
          />

          <div className="min-w-0 border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Level progress</p>
                <h3 className="text-xl font-black uppercase">Quest XP</h3>
              </div>
              <span className="inline-flex items-center gap-2 whitespace-nowrap border-2 border-black bg-[#67E8F9] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                <Radar className="h-3.5 w-3.5 shrink-0" />
                {Math.round(xpPercent)}%
              </span>
            </div>

            <div className="mt-4">
              <div className="flex flex-col gap-2 text-[11px] font-black uppercase tracking-[0.14em] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {user.xp} / {user.xpRequired} XP
                </span>
                <span>Lvl {user.level}</span>
              </div>

              <div className="mt-2 h-5 border-2 border-black bg-[#F4F0EA] p-[2px] shadow-[2px_2px_0_0_#000]">
                <div
                  className="h-full border border-black bg-[#06B6D4] transition-[width] duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <DailyQuestCard questsRemaining={questsRemaining} leadsCount={leads.length} />

          <div className="min-w-0 border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Hunter pressure</p>
                <h3 className="text-xl font-black uppercase">Lead posture</h3>
              </div>
              <span className="inline-flex w-full justify-center sm:w-auto shrink-0 items-center gap-2 whitespace-nowrap border-2 border-black bg-[#A3E635] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                <ScrollText className="h-3.5 w-3.5 shrink-0" />
                {leads.length} tracked
              </span>
            </div>

            <div className="mt-3 space-y-2 text-[11px] font-black uppercase tracking-[0.12em]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2">
                <span>Fresh matches</span>
                <span>{leads.length}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2">
                <span>Scanner mode</span>
                <span>{isScanning ? 'Patrolling' : 'Idle'}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-[#F4F0EA] px-3 py-2">
                <span>Lead board</span>
                <span>{hasLeadData ? 'Live' : 'Awaiting matches'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="min-w-0 border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Share your command state</p>
                <h3 className="text-xl font-black uppercase">Broadcast snapshot</h3>
              </div>
              <button
                type="button"
                onClick={shareStats}
                className="inline-flex w-full justify-center sm:w-auto shrink-0 items-center gap-2 whitespace-nowrap border-2 border-black bg-[#FFE600] px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:translate-x-0.5"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                Copy report
              </button>
            </div>

            <div className="mt-3 space-y-2 text-[11px] font-black uppercase tracking-[0.12em]">
              <div className="border-2 border-black bg-[#F4F0EA] px-3 py-3">
                Broadcast live hunt posture, quest pace, and tracked momentum without leaving the battlestation.
              </div>
              <div className="border-2 border-black bg-[#F4F0EA] px-3 py-3">
                Use this snapshot when you need fast alignment across your guild, ops, or client workflow.
              </div>
            </div>
          </div>

          <div className="min-w-0 border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Battlestation brief</p>
                <h3 className="text-xl font-black uppercase">Command doctrine</h3>
              </div>
              <span className="inline-flex w-full justify-center sm:w-auto shrink-0 items-center gap-2 whitespace-nowrap border-2 border-black bg-[#D9F99D] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                <Crosshair className="h-3.5 w-3.5 shrink-0" />
                Live tactics
              </span>
            </div>

            <div className="mt-3 space-y-2 text-[11px] font-black uppercase tracking-[0.12em]">
              <div className="border-2 border-black bg-[#F4F0EA] px-3 py-3">
                This room is built for scanning momentum, XP pressure, and fast response windows while signals are still hot.
              </div>
              <div className="border-2 border-black bg-[#F4F0EA] px-3 py-3">
                Billing handles mana and plan strategy. Battlestation handles live pursuit, lead readiness, and tactical timing.
              </div>
            </div>
          </div>

          <div className="min-w-0 border-4 border-black bg-[#FFF7CC] p-4 shadow-[4px_4px_0_0_#000]">
            <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Signal pressure</p>
                <h3 className="text-xl font-black uppercase">Live command cue</h3>
              </div>
              <span className="inline-flex w-full justify-center sm:w-auto shrink-0 items-center gap-2 whitespace-nowrap border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                Stay sharp
              </span>
            </div>

            <div className="mt-3 border-2 border-black bg-white px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em]">
              Fresh signals lose value fast. Keep your scan loop tight, clear stale noise early, and act on high-intent movement first.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
