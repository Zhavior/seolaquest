import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Swords, Plus, X, Radar, Crosshair } from 'lucide-react'
import { DashboardKeyword } from '@/features/dashboard/types'

type DashboardKeywordsProps = {
  item: Variants
  keywords: DashboardKeyword[]
  newKeyword: string
  setNewKeyword: (v: string) => void
  selectedHeroClass: string
  setSelectedHeroClass: (v: string) => void
  isPending: boolean
  PRESET_KEYWORDS: string[]
  addKeyword: () => void
  handlePresetClick: (phrase: string) => void
  removeKeyword: (id: string) => void
  notice?: string
  noticeIsError?: boolean
}

export function DashboardKeywords({
  item,
  keywords,
  newKeyword,
  setNewKeyword,
  selectedHeroClass,
  setSelectedHeroClass,
  isPending,
  PRESET_KEYWORDS,
  addKeyword,
  handlePresetClick,
  removeKeyword,
  notice,
  noticeIsError = false,
}: DashboardKeywordsProps) {
  return (
    <motion.div
      id="tracked-keywords"
      variants={item}
      className="flex h-full min-w-0 flex-col justify-between overflow-hidden border-4 border-black bg-[#FFF7CC] p-6 shadow-[8px_8px_0_0_#000] md:p-8"
    >
      <div className="min-w-0">
        <div className="mb-6 flex min-w-0 items-start justify-between gap-4 border-b-4 border-black pb-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0 border-4 border-black bg-[#13D7C2] p-3 shadow-[4px_4px_0_0_#000]">
              <Radar className="h-6 w-6 text-black" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">
                Battlestation watchlist
              </p>
              <h2 className="min-w-0 text-2xl uppercase leading-tight md:text-3xl">
                Signal Queue ({keywords.length})
              </h2>
            </div>
          </div>

          <div className="hidden shrink-0 border-4 border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[4px_4px_0_0_#000] md:block">
            Hunt inputs armed
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          <label htmlFor="keyword-input" className="sr-only">
            Signal phrase to track
          </label>
          <input
            id="keyword-input"
            aria-invalid={noticeIsError}
            aria-errormessage={noticeIsError && notice ? 'dashboard-notice' : undefined}
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Arm a signal phrase (e.g. 'looking for CRM')..."
            className="min-w-0 flex-[999_1_18rem] border-4 border-black bg-white p-3 font-black text-base focus:outline-none focus:ring-4 focus:ring-[#13D7C2] md:text-lg"
          />
          <label htmlFor="keyword-class" className="sr-only">
            Signal class
          </label>
          <select
            id="keyword-class"
            value={selectedHeroClass}
            onChange={(e) => setSelectedHeroClass(e.target.value)}
            className="w-full min-w-0 border-4 border-black bg-[#13D7C2] p-3 font-black text-sm uppercase focus:outline-none sm:flex-none"
          >
            <option value="Warrior 🥷">Warrior 🥷</option>
            <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
            <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
          </select>
          <button
            type="button"
            onClick={addKeyword}
            disabled={isPending}
            className="flex min-h-[56px] w-full min-w-0 items-center justify-center gap-2 border-4 border-black bg-black p-3 font-black uppercase text-[#FFE600] shadow-[4px_4px_0_0_#000] transition-all hover:-translate-y-0.5 hover:translate-x-0.5 disabled:opacity-50 sm:flex-none"
          >
            <Plus aria-hidden="true" className="h-5 w-5 shrink-0 stroke-[3px]" />
            <span className="whitespace-nowrap">Arm signal</span>
          </button>
        </div>

        <div className="mb-6 mt-2 flex flex-wrap items-center gap-2 pt-2">
          <span className="mr-1 text-xs font-black uppercase text-black/55">Quick loadout:</span>
          {PRESET_KEYWORDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isPending}
              className="flex items-center gap-1 border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              <Crosshair className="h-3.5 w-3.5 stroke-[3px]" />
              <span className="break-words">&quot;{preset}&quot;</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/60">
            Live tracked phrases
          </p>
          <div className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000]">
            {keywords.length} armed
          </div>
        </div>

        {keywords.length === 0 ? (
          <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex items-start gap-3">
              <div className="border-2 border-black bg-[#13D7C2] p-2">
                <Swords className="h-5 w-5 text-black" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.06em] text-black">
                  No signal phrases armed yet
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/70">
                  Load a preset or arm a custom phrase to start feeding the battlestation live matches.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {keywords.map((keyword) => (
                <motion.div
                  key={keyword.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex min-w-0 items-center justify-between gap-3 border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-[0.05em] text-black">
                      {keyword.phrase}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-black/55">
                      {keyword.active ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword.id)}
                    disabled={isPending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black bg-[#FF8C69] text-black shadow-[3px_3px_0_0_#000] transition-all hover:-translate-y-0.5 hover:translate-x-0.5 disabled:opacity-50"
                    aria-label={`Remove ${keyword.phrase}`}
                  >
                    <X aria-hidden="true" className="h-4 w-4 stroke-[3px]" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
