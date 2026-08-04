import { motion, Variants } from 'framer-motion'
import {
  Share2,
  Sparkles,
  Radar,
  ScrollText,
  Zap,
  ShieldAlert,
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
      tone: 'bg-[#F4F0EA]',
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
          className={`inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 border-[3px] border-black px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0px_#000] ${provider.tone}`}
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
    <div className={`border-[3px] border-black ${tone} p-4 shadow-[4px_4px_0px_#000]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">{label}</p>
          <p className="mt-2 text-2xl font-black uppercase text-black">{value}</p>
          <p className="mt-2 text-xs font-bold uppercase leading-5 text-black/65">{detail}</p>
        </div>
        <div className="border-[3px] border-black bg-[#FFF4BF] p-2 shadow-[3px_3px_0px_#000]">
          {icon}
        </div>
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
    <div className="border-[3px] border-black bg-[#FFF9EC] p-5 shadow-[5px_5px_0px_#000]">
      <div className="flex flex-col gap-3 border-b-[3px] border-black pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">Quest board</p>
          <h3 className="mt-1 text-2xl font-black uppercase text-black">Daily objectives</h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 border-[3px] border-black bg-[#FFE600] px-3 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0px_#000]">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          +100 XP
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {questRows.map((quest) => (
          <div
            key={quest.label}
            className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-[3px] border-black px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] shadow-[3px_3px_0px_#000] ${quest.done ? quest.tone : 'bg-white'}`}
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
  const { hottestLeadScore, projectedArr, highIntentCount } = getTopLeadMetrics(leads)

  return (
    <motion.div
      variants={item}
      className="w-full min-w-0 max-w-full overflow-hidden border-[4px] border-black bg-[#13D7C2] p-4 shadow-[8px_8px_0px_#000] sm:p-6 md:p-8"
    >
      <div className="relative overflow-hidden border-[3px] border-black bg-[#FFF9EC] p-4 shadow-[6px_6px_0px_#000] md:p-5">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mb-5 flex flex-col gap-3">
          <ProviderStatusStrip />

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/75">
            <span className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_#000]">
              <Radar className="h-3.5 w-3.5 shrink-0" />
              Command pulse stable
            </span>
            <span className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFE082] px-3 py-2 shadow-[3px_3px_0px_#000]">
              <TimerReset className="h-3.5 w-3.5 shrink-0" />
              Next auto-run 26m
            </span>
            <span className="inline-flex items-center gap-2 border-[3px] border-black bg-[#C7FFF3] px-3 py-2 shadow-[3px_3px_0px_#000]">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              Last synced 4m ago
            </span>
          </div>
        </div>

        <div className="relative grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.95fr]">
          <div className="min-w-0 space-y-5">
            <div className="overflow-hidden border-[3px] border-black bg-[#F7F1DD] p-4 shadow-[5px_5px_0px_#000]">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="border-[3px] border-black bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[3px_3px_0px_#000]">
                  Commander profile
                </span>
                <span className="border-[3px] border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0px_#000]">
                  Rank telemetry
                </span>
              </div>

              <HeroCrest
                heroName={user.name}
                heroTitle={characterTitle}
                level={user.level}
                isScanning={isScanning}
                recentLevelUp={recentLevelUp}
                xpPercent={xpPercent}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TelemetryCard
                icon={<Crosshair className="h-5 w-5 text-black" />}
                label="Hottest lead"
                value={hasLeadData ? `${hottestLeadScore}%` : '--'}
                detail={
                  hasLeadData
                    ? 'Highest urgency and buyer intent detected across your active queue.'
                    : 'Run a scan to generate your first ranked target.'
                }
                tone="bg-[#FFE082]"
              />

              <TelemetryCard
                icon={<Coins className="h-5 w-5 text-black" />}
                label="Projected ARR"
                value={hasLeadData ? `$${projectedArr.toLocaleString()}` : '--'}
                detail={
                  hasLeadData
                    ? 'Rough opportunity stack based on current signal quality.'
                    : 'Appears after your queue starts filling with leads.'
                }
                tone="bg-[#C7FFF3]"
              />

              <TelemetryCard
                icon={<Swords className="h-5 w-5 text-black" />}
                label="Active queue"
                value={`${leads.length}`}
                detail="Total live signals ready for triage, reply, or CRM export."
                tone="bg-white"
              />

              <TelemetryCard
                icon={<Crown className="h-5 w-5 text-black" />}
                label="High-intent"
                value={`${highIntentCount}`}
                detail="Signals above the fast-action threshold and worth immediate review."
                tone="bg-[#FFE3C7]"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <DailyQuestCard
              questsRemaining={questsRemaining}
              leadsCount={leads.length}
              highIntentCount={highIntentCount}
            />

            <div className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_#000]">
              <div className="flex items-start justify-between gap-3 border-b-[3px] border-black pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">Command perks</p>
                  <h3 className="mt-1 text-2xl font-black uppercase text-black">Unlock track</h3>
                </div>
                <div className="border-[3px] border-black bg-[#FFF4BF] p-2 shadow-[3px_3px_0px_#000]">
                  <Shield className="h-5 w-5 text-black" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
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
                    className={`border-[3px] border-black p-3 shadow-[3px_3px_0px_#000] ${
                      perk.unlocked ? 'bg-[#A3E635]' : 'bg-[#F4F0EA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-black">{perk.title}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase leading-5 text-black/65">
                          {perk.detail}
                        </p>
                      </div>
                      <span className="shrink-0 border-[2px] border-black bg-white px-2 py-1 text-[10px] font-black uppercase">
                        {perk.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[3px] border-black bg-[#FFF9EC] p-5 shadow-[5px_5px_0px_#000]">
              <div className="flex items-start justify-between gap-3 border-b-[3px] border-black pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">Combat actions</p>
                  <h3 className="mt-1 text-2xl font-black uppercase text-black">Quick ops</h3>
                </div>
                <div className="border-[3px] border-black bg-[#FFE082] p-2 shadow-[3px_3px_0px_#000]">
                  <Sparkles className="h-5 w-5 text-black" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={shareStats}
                  className="inline-flex min-h-12 items-center justify-between gap-3 border-[3px] border-black bg-[#FFE600] px-4 py-3 text-left text-xs font-black uppercase shadow-[4px_4px_0px_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share commander stats
                  </span>
                  <span>↗</span>
                </button>

                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-between gap-3 border-[3px] border-black bg-white px-4 py-3 text-left text-xs font-black uppercase shadow-[4px_4px_0px_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFF1BE] hover:shadow-[6px_6px_0px_#000]"
                >
                  <span className="inline-flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    Open battle report
                  </span>
                  <span className="text-black/55">Soon</span>
                </button>

                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-between gap-3 border-[3px] border-black bg-[#FBE4E4] px-4 py-3 text-left text-xs font-black uppercase shadow-[4px_4px_0px_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Threat watch
                  </span>
                  <span>{hasLeadData ? 'Monitoring' : 'Idle'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
