import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Flame, Radar, Plus } from 'lucide-react'
import { DashboardLead } from '@/features/dashboard/types'
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

export function DashboardFeed({
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
  handlePresetClick
}: DashboardFeedProps) {
  return (
    <motion.div variants={item}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#EF4444] p-4 border-4 border-black shadow-[6px_6px_0_0_#000] -rotate-3">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl uppercase font-black tracking-tight text-black" style={{ WebkitTextStroke: '1px white' }}>Potential Opportunities</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-black text-white px-3 py-1 uppercase text-sm font-black">
                {filteredLeads.length} Source {filteredLeads.length === 1 ? 'Match' : 'Matches'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const isTw = platform.toUpperCase().includes('TWITTER') || platform.toUpperCase().includes('X')
            const isRd = platform.toUpperCase().includes('REDDIT')
            return (
              <button
                key={platform}
                onClick={() => setFilter(platform)}
                className={`border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 flex items-center gap-2 ${filter === platform ? 'bg-[#FFE600]' : 'bg-white hover:bg-gray-100'}`}
              >
                {isTw && <XTwitterIcon className="w-4 h-4 text-black" />}
                {isRd && <RedditIcon className="w-4 h-4 text-[#FF5722]" />}
                {platform === 'TWITTER' ? 'TWITTER (X)' : platform}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
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
        </AnimatePresence>
      </div>

      {!filteredLeads.length && (
        <div className="mt-8 border-4 border-black bg-white p-8 md:p-12 text-center flex flex-col items-center shadow-[8px_8px_0_0_#000]">
          <div className="bg-[#FFE600] p-4 border-4 border-black mb-4 -rotate-3 shadow-[4px_4px_0_0_#000]">
            <Radar className="w-16 h-16 text-black" />
          </div>
          <h3 className="font-black text-3xl md:text-4xl uppercase tracking-tight text-black">
            No Source Matches Yet
          </h3>
          <p className="mt-2 text-base font-bold text-gray-600 uppercase max-w-lg">
            Add a keyword and run a manual scan. Only source matches returned and stored by a connected provider will appear here.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const inputEl = document.getElementById('keyword-input')
              if (inputEl) {
                inputEl.focus()
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
              } else {
                handlePresetClick('looking for CRM')
              }
            }}
            className="mt-6 bg-[#A3E635] hover:bg-lime-400 text-black border-4 border-black px-6 py-4 font-black text-xl uppercase shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-none flex items-center gap-3 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[4px]" /> ADD A KEYWORD
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
