'use client'

import { motion, Variants } from 'framer-motion'
import {
  Radar,
  Zap,
  Crosshair,
  Crown,
  Coins,
  Swords,
  TimerReset,
  Shield,
  Activity,
} from 'lucide-react'
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
      state: 'LOCKED',
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
          className={`inline-flex min-h-11 min-w-0 items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0_0_#000] border-2 border-black ${provider.tone}`}
        >
          <span className={`inline-block h-3 w-3 shrink-0 rounded-full border-2 border-black ${provider.dotTone}`} />
          <span className="truncate">
            {provider.label} {provider.state}
          </span>
        </button>
      ))}
    </div>
  )
}

function getIntentScore(lead: DashboardLead) {
  const body = `${lead.content} ${lead.matched}`.toLowerCase()

  let score = 58
  if (/budget|pricing|quote|urgent|asap|switch/i.test(body)) score += 24
  if (/alternative|compare|best|recommend|looking for/i.test(body)) score += 12
  if ((lead.matched || '').split(',').filter(Boolean).length >= 2) score += 6

  return Math.min(score, 98)
}

function getEstimatedArr(lead: DashboardLead) {
  const score = getIntentScore(lead)

  if (score >= 92) return 4800
  if (score >= 84) return 2400
  if (score >= 72) return 1200
  return 600
}

function getTopLeadMetrics(leads: DashboardLead[]) {
  if (!leads.length) {
    return {
      hottestLeadScore: 0,
      projectedArr: 0,
      highIntentCount: 0,
    }
  }

  const scores = leads.map(getIntentScore)
  const hottestLeadScore = Math.max(...scores)
  const projectedArr = leads.reduce((sum, lead) => sum + getEstimatedArr(lead), 0)
  const highIntentCount = scores.filter((score) => score >= 80).length

  return {
    hottestLeadScore,
    projectedArr,
    highIntentCount,
  }
}

function TelemetryCard({
  icon,
  label,
  value,
  detail,
  tone = 'bg-white',
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <div className={`p-6 flex flex-col h-full border-4 border-black shadow-[6px_6px_0_0_#000] ${tone}`}>
      <div className="flex items-start justify-between gap-3 mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-black">{label}</p>
        <div className="bg-[#FFF4BF] p-2 border-2 border-black shadow-[2px_2px_0_#000]">
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl md:text-4xl font-black uppercase text-black leading-none">{value}</p>
        <p className="mt-3 text-xs font-bold uppercase leading-relaxed text-black/80">{detail}</p>
      </div>
    </div>
  )
}

function DailyQuestCard({
  questsRemaining,
  leadsCount,
  highIntentCount,
}: {
  questsRemaining: number
  leadsCount: number
  highIntentCount: number
}) {
  const completedQuestCount = Math.max(0, 3 - questsRemaining)

  const questRows = [
    {
      label: 'Quest streak progress',
      progressLabel: `${completedQuestCount} / 3`,
      done: questsRemaining <= 0,
      tone: 'bg-[#A3E635]',
    },
    {
      label: 'Review 1 live lead',
      progressLabel: `${Math.min(leadsCount, 1)} / 1`,
      done: leadsCount >= 1,
      tone: 'bg-[#C7FFF3]',
    },
    {
      label: 'Flag high-intent targets',
      progressLabel: `${Math.min(highIntentCount, 3)} / 3`,
      done: highIntentCount >= 3,
      tone: 'bg-[#FFE082]',
    },
  ]

  return (
    <div className="bg-[#FFF9EC] p-6 border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-black/60">Quest board</p>
          <h3 className="mt-1 text-2xl font-black uppercase text-black">Daily objectives</h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 border-2 border-black bg-[#FFE600] px-3 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#000]">
          <Zap className="h-4 w-4 shrink-0" />
          +100 XP
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 flex-1">
        {questRows.map((quest) => (
          <div
            key={quest.label}
            className={`flex min-w-0 flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0_0_#000] ${quest.done ? quest.tone : 'bg-white'}`}
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
  leads,
}: DashboardStatsProps) {
  const questsRemaining = user.questsRemaining ?? 3
  const hasLeadData = leads.length > 0
  const { hottestLeadScore, projectedArr, highIntentCount } = getTopLeadMetrics(leads)

  return (
    <motion.div
      variants={item}
      className="w-full min-w-0 max-w-full flex flex-col gap-6"
    >
      {/* Provider Status Header Strip */}
      <div className="border-4 border-black bg-[#FFF8D9] p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="bg-black text-[#FFE600] text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black -rotate-1">
              RADAR INTEGRATIONS & PROVIDERS
            </span>
          </div>
          <ProviderStatusStrip />

          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_#000]">
              <Radar className="h-4 w-4 shrink-0" />
              Command pulse stable
            </span>
            <span className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE082] px-3 py-2 shadow-[3px_3px_0_#000]">
              <TimerReset className="h-4 w-4 shrink-0" />
              Next auto-run 26m
            </span>
            <span className="inline-flex items-center gap-2 border-2 border-black bg-[#06B6D4] px-3 py-2 shadow-[3px_3px_0_#000]">
              <Activity className="h-4 w-4 shrink-0" />
              Last synced 4m ago
            </span>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[1.2fr_0.95fr] gap-6">
        <div className="flex flex-col min-w-0 gap-6">
          {/* Commander Profile Hero Badge */}
          <div className="border-4 border-black bg-[#FFF8D9] p-6 shadow-[6px_6px_0_0_#000]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#FF5722]" />
                <span className="border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600] shadow-[2px_2px_0_#000]">
                  COMMANDER PROFILE
                </span>
              </div>
              <span className="border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-black shadow-[2px_2px_0_#000]">
                RANK & TELEMETRY
              </span>
            </div>

            <HeroCrest
              heroName={user.name}
              heroTitle={characterTitle}
              level={user.level}
              isScanning={isScanning}
              recentLevelUp={recentLevelUp}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <TelemetryCard
              icon={<Crosshair className="h-6 w-6 text-black" />}
              label="Hottest lead"
              value={hasLeadData ? `${hottestLeadScore}%` : '--'}
              detail={
                hasLeadData
                  ? 'Highest urgency and buyer intent detected.'
                  : 'Run a scan to generate your first ranked target.'
              }
              tone="bg-[#FFE082]"
            />
            <TelemetryCard
              icon={<Coins className="h-6 w-6 text-black" />}
              label="Projected ARR"
              value={hasLeadData ? `$${projectedArr.toLocaleString()}` : '--'}
              detail={
                hasLeadData
                  ? 'Rough opportunity stack based on current signal quality.'
                  : 'Appears after your queue starts filling with leads.'
              }
              tone="bg-[#06B6D4]"
            />
            <TelemetryCard
              icon={<Swords className="h-6 w-6 text-black" />}
              label="Active queue"
              value={`${leads.length}`}
              detail="Total live signals ready for triage, reply, or CRM export."
              tone="bg-white"
            />
            <TelemetryCard
              icon={<Crown className="h-6 w-6 text-black" />}
              label="High-intent"
              value={`${highIntentCount}`}
              detail="Signals above the fast-action threshold and worth immediate review."
              tone="bg-[#FFE3C7]"
            />
          </div>
        </div>

        <div className="flex flex-col min-w-0 gap-6">
          <DailyQuestCard
            questsRemaining={questsRemaining}
            leadsCount={leads.length}
            highIntentCount={highIntentCount}
          />

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <div className="flex items-start justify-between gap-3 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/60">Command perks</p>
                <h3 className="mt-1 text-2xl font-black uppercase text-black">Unlock track</h3>
              </div>
              <div className="bg-[#FFF4BF] p-2 border-2 border-black shadow-[2px_2px_0_#000]">
                <Shield className="h-6 w-6 text-black" />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {[
                {
                  title: 'Instant reply combos',
                  detail: 'Chain response presets for faster outbound momentum.',
                  unlocked: user.level >= 2,
                },
                {
                  title: 'CRM auto-routing',
                  detail: 'Send top-tier leads directly into the right pipeline lane.',
                  unlocked: user.level >= 3,
                },
                {
                  title: 'Multi-feed scanner',
                  detail: 'Blend Reddit, X, and future provider signals into one pass.',
                  unlocked: user.level >= 4,
                },
              ].map((perk) => (
                <div
                  key={perk.title}
                  className={`p-4 border-3 border-black shadow-[3px_3px_0_0_#000] ${perk.unlocked ? 'bg-[#A3E635]' : 'bg-[#FFF8D9]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase text-black">{perk.title}</p>
                      <p className="mt-1 text-xs font-bold text-black/75">{perk.detail}</p>
                    </div>
                    <span className="shrink-0 border-2 border-black bg-black px-2 py-0.5 text-xs font-black uppercase text-[#FFE600]">
                      {perk.unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
