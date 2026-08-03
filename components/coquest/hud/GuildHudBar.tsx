import Link from 'next/link'
import type { GuildHudData } from './types'

export function GuildHudBar({ data }: { data: GuildHudData }) {
  const totalCrystals = Math.max(1, Math.floor(data.manaMax / 10))
  const activeCrystals = Math.max(0, Math.min(totalCrystals, Math.floor(data.mana / 10)))

  return (
    <header className="border-b-4 border-black bg-[#FFE600] text-black shadow-[0_4px_0_0_#000]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black bg-white text-sm font-black uppercase shadow-[3px_3px_0_0_#000]">
            {data.avatarLabel}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black uppercase tracking-[0.08em]">
                {data.playerName}
              </p>
              <span className="border-2 border-black bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                LVL {data.level}
              </span>
            </div>

            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-black/70">
              {data.className}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
                Vault
              </span>
              {Array.from({ length: totalCrystals }).map((_, index) => (
                <span
                  key={index}
                  className={index < activeCrystals ? 'text-base opacity-100' : 'text-base opacity-25 grayscale'}
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

          <div className="hidden items-center gap-2 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000] lg:flex">
            {data.providers.map((provider) => (
              <div key={provider.name} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 border border-black ${
                    provider.status === 'active'
                      ? 'bg-[#22C55E]'
                      : provider.status === 'warning'
                        ? 'bg-[#EAB308]'
                        : 'bg-[#A1A1AA]'
                  }`}
                />
                <span>{provider.name}</span>
              </div>
            ))}
          </div>

          <Link
            href="/app/billing"
            className="inline-flex min-h-11 items-center justify-center border-4 border-black bg-[#67E8F9] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_0_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            + Recharge
          </Link>
        </div>
      </div>
    </header>
  )
}
