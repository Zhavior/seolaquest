import Link from 'next/link'
import type { GuildHudData } from './shared/types'

const ONLINE_DOT: Record<GuildHudData['onlineStatus'], string> = {
  online:  'bg-[#22C55E]',
  away:    'bg-[#EAB308]',
  offline: 'bg-[#A1A1AA]',
}

export function GuildHudBar({ data }: { data: GuildHudData }) {
  const totalCrystals = Math.max(1, Math.floor(data.manaMax / 10))
  const activeCrystals = Math.max(0, Math.min(totalCrystals, Math.floor(data.mana / 10)))

  return (
    <header className="border-b-4 border-black bg-[#FFE600] text-black shadow-[0_4px_0_0_#000]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-5 xl:flex-row xl:items-center xl:justify-between">

        {/* ── identity anchor ── */}
        <div className="flex items-center gap-3">
          {/* avatar + online dot */}
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-white text-sm font-black uppercase shadow-[3px_3px_0_0_#000]">
              {data.avatarLabel}
            </div>
            <span
              aria-label={data.onlineStatus}
              className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-black ${ONLINE_DOT[data.onlineStatus]}`}
            />
          </div>

          {/* name / class / rank */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black uppercase tracking-[0.08em]">
                {data.playerName}
              </p>
              {/* rank insignia — compact, no level number */}
              <span className="border-2 border-black bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FFE600]">
                {data.guildRank}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-black/70">
              {data.className}
            </p>
          </div>
        </div>

        {/* ── operational state ── */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

          {/* mana vault */}
          <div className="flex flex-wrap items-center gap-3 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
                Mana
              </span>
              {Array.from({ length: totalCrystals }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={i < activeCrystals ? 'text-sm opacity-100' : 'text-sm opacity-20 grayscale'}
                >
                  💎
                </span>
              ))}
            </div>
            <div className="border-l-2 border-black pl-3 text-[11px] font-black uppercase tracking-[0.12em]">
              {data.mana}/{data.manaMax} MP
            </div>
            <span className="border-2 border-black bg-[#FFF7AE] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]">
              {data.planName}
            </span>
          </div>

          {/* active quests counter */}
          {data.activeQuests > 0 && (
            <div className="flex items-center gap-2 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]">
              <span aria-hidden="true" className="text-sm">📜</span>
              <span className="text-[11px] font-black uppercase tracking-[0.12em]">
                {data.activeQuests} Active
              </span>
            </div>
          )}

          {/* provider pips — desktop only */}
          <div className="hidden items-center gap-2 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000] lg:flex">
            {data.providers.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 border border-black ${
                    p.status === 'active'  ? 'bg-[#22C55E]' :
                    p.status === 'warning' ? 'bg-[#EAB308]' :
                                             'bg-[#A1A1AA]'
                  }`}
                />
                <span>{p.name}</span>
              </div>
            ))}
          </div>

          {/* buy mana CTA */}
          <Link
            href="/app/billing"
            className="inline-flex min-h-11 items-center justify-center border-4 border-black bg-[#67E8F9] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_0_#000] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000] active:translate-y-0 active:shadow-[1px_1px_0_0_#000]"
          >
            + Buy Mana
          </Link>
        </div>

      </div>
    </header>
  )
}
