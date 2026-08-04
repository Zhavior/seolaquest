'use client'

import { memo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Flame, Radar, Plus, Crosshair } from 'lucide-react'
import type { DashboardLead } from '@/features/dashboard/types'
import { XTwitterIcon, RedditIcon } from '@/components/PlatformIcons'
import BountyCard from '@/components/BountyCard'

type DashboardFeedProps = {
  item: Variants
  filteredLeads: DashboardLead[]
  platforms: string[]
  filter: string
  setFilter: (f: string) => void
  isPending: boolean
  handleClaimBounty: (lead: DashboardLead) => void
  generateAIReply: (lead: DashboardLead) => void
  exportToCRM: (lead: DashboardLead) => void
  dismissLead: (id: string) => void
  handlePresetClick: (phrase: string) => void
}

function DashboardFeedComponent({
  item,
  filteredLeads,
  platforms,
  filter,
  setFilter,
  isPending,
  handleClaimBounty,
  generateAIReply,
  exportToCRM,
  dismissLead,
  handlePresetClick,
}: DashboardFeedProps) {
  return (
    <motion.div variants={item}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <div className="border-4 border-black bg-[#EF4444] p-4 shadow-[6px_6px_0_0_#000] -rotate-3">
            <Flame className="h-10 w-10 text-white" />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">
              Battlestation feed
            </p>
            <h2
              className="text-4xl font-black uppercase tracking-tight text-black md:text-5xl"
              style={{ WebkitTextStroke: '1px white' }}
            >
              Live Hunt Board
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="bg-black px-3 py-1 text-sm font-black uppercase text-white">
                {filteredLeads.length} Active {filteredLeads.length === 1 ? 'Signal' : 'Signals'}
              </span>
              <span className="border-2 border-black bg-white px-3 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                Fresh intent only
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const normalized = platform.toUpperCase()
            const isTw = normalized.includes('TWITTER') || normalized.includes('X')
            const isRd = normalized.includes('REDDIT')

            return (
              <button
                key={platform}
                type="button"
                onClick={() => setFilter(platform)}
                className={`flex items-center gap-2 border-4 border-black px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  filter === platform ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {isTw ? <XTwitterIcon className="h-4 w-4 text-black" /> : null}
                {isRd ? <RedditIcon className="h-4 w-4 text-[#FF5722]" /> : null}
                {platform === 'TWITTER' ? 'TWITTER / X' : platform}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {filteredLeads.map((lead) => (
          <BountyCard
            key={lead.id}
            lead={lead}
            isPending={isPending}
            onClaim={handleClaimBounty}
            onGenerateAIReply={generateAIReply}
            onExportToCRM={exportToCRM}
            onDismiss={dismissLead}
          />
        ))}
      </div>

      {!filteredLeads.length ? (
        <div className="mt-8 flex flex-col items-center border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000] md:p-12">
          <div className="mb-4 -rotate-3 border-4 border-black bg-[#13D7C2] p-4 shadow-[4px_4px_0_0_#000]">
            <Radar className="h-16 w-16 text-black" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
            No Live Signals Yet
          </h3>
          <p className="mt-2 max-w-lg text-base font-bold uppercase text-gray-600">
            Arm a signal phrase and run a scan. Fresh provider matches will land here when the battlestation finds active intent.
          </p>
          <button
            type="button"
            onClick={() => {
              const inputEl = document.getElementById('keyword-input')
              if (inputEl) {
                inputEl.focus()
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
              } else {
                handlePresetClick('looking for CRM')
              }
            }}
            className="mt-6 flex cursor-pointer items-center gap-3 border-4 border-black bg-[#A3E635] px-6 py-4 text-xl font-black uppercase text-black shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-none hover:bg-lime-400"
          >
            <Crosshair className="h-6 w-6 stroke-[4px]" />
            Arm a signal
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}

const DashboardFeed = memo(DashboardFeedComponent)
export default DashboardFeed
