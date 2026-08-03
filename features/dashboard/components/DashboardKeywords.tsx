import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Swords, Plus, X } from 'lucide-react'
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
      className="flex h-full min-w-0 flex-col justify-between overflow-hidden border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] md:p-8"
    >
      <div className="min-w-0">
        <div className="mb-6 flex min-w-0 items-center gap-4 border-b-4 border-black pb-4">
          <div className="shrink-0 border-4 border-black bg-[#A3E635] p-3">
            <Swords className="h-6 w-6 text-black" />
          </div>
          <h2 className="min-w-0 text-2xl uppercase leading-tight md:text-3xl">
            Tracked Keywords ({keywords.length})
          </h2>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          <label htmlFor="keyword-input" className="sr-only">
            Keyword or phrase to track
          </label>
          <input
            id="keyword-input"
            aria-invalid={noticeIsError}
            aria-errormessage={noticeIsError && notice ? 'dashboard-notice' : undefined}
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Track a keyword (e.g. 'looking for CRM')..."
            className="min-w-0 flex-[999_1_18rem] border-4 border-black bg-[#F4F0EA] p-3 font-black text-base focus:outline-none focus:ring-4 focus:ring-[#FFE600] md:text-lg"
          />
          <label htmlFor="keyword-class" className="sr-only">
            Keyword display class
          </label>
          <select
            id="keyword-class"
            value={selectedHeroClass}
            onChange={(e) => setSelectedHeroClass(e.target.value)}
            className="w-full min-w-0 border-4 border-black bg-[#FFE600] p-3 font-black text-sm uppercase focus:outline-none sm:flex-none"
          >
            <option value="Warrior 🥷">Warrior 🥷</option>
            <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
            <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
          </select>
          <button
            type="button"
            onClick={addKeyword}
            disabled={isPending}
            className="flex min-h-[56px] w-full min-w-0 items-center justify-center gap-2 border-4 border-black bg-[#06B6D4] p-3 font-black uppercase shadow-[4px_4px_0_0_#000] transition-colors hover:bg-cyan-400 disabled:opacity-50 sm:flex-none"
          >
            <Plus aria-hidden="true" className="h-5 w-5 shrink-0 stroke-[3px]" />
            <span className="whitespace-nowrap">+ Save Keyword</span>
          </button>
        </div>

        <div className="mt-2 mb-6 flex flex-wrap items-center gap-2 pt-2">
          <span className="mr-1 text-xs font-black uppercase text-gray-500">Quick Presets:</span>
          {PRESET_KEYWORDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isPending}
              className="flex items-center gap-1 border-2 border-black bg-[#FFE600] px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3px]" />
              <span className="break-words">&quot;{preset}&quot;</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex max-h-[260px] min-w-0 flex-wrap content-start gap-3 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {keywords.map((keyword, idx) => {
              const heroIcon = idx % 4 === 0 ? '🥷' : idx % 4 === 1 ? '🧙‍♂️' : '🦸‍♂️'

              return (
                <motion.div
                  key={keyword.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex min-w-0 max-w-full items-center gap-3 border-4 border-black bg-black px-4 py-3 font-black text-white shadow-[4px_4px_0_0_#A3E635]"
                >
                  <span className="shrink-0 text-lg text-[#A3E635]">{heroIcon}</span>
                  <span className="min-w-0 break-words uppercase tracking-wide">
                    &quot;{keyword.phrase}&quot;
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove keyword ${keyword.phrase}`}
                    onClick={() => removeKeyword(keyword.id)}
                    disabled={isPending}
                    className="ml-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center border-2 border-transparent bg-[#EF4444] p-1 text-white transition-colors hover:border-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <X aria-hidden="true" className="h-4 w-4 stroke-[3px]" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
