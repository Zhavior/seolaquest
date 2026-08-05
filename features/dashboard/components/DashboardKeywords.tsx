import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Plus, X, Radar, Sparkles } from 'lucide-react'
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

function getKeywordTone(label: string) {
  const value = label.toLowerCase()

  if (/pricing|quote|budget|demo|switch|urgent/.test(value)) {
    return 'bg-[#FFE0C7]'
  }

  if (/crm|pipeline|analytics|compare|replace/.test(value)) {
    return 'bg-[#F4E2FF]'
  }

  if (/looking for|searching for|automation|workflow|tool/.test(value)) {
    return 'bg-[#FFF3BF]'
  }

  return 'bg-white'
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
    <motion.section
      id="tracked-keywords"
      variants={item}
      className="flex min-w-0 flex-col border-4 border-black bg-[#FFF7CC] p-5 shadow-[8px_8px_0px_#000] md:p-6"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b-4 border-black pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 border-4 border-black bg-[#13D7C2] px-3 py-2 shadow-[4px_4px_0px_#000]">
              <Radar className="h-4 w-4 text-black" />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-black">
                Signal Queue
              </span>
            </div>

            <h2 className="text-2xl font-black uppercase leading-tight text-black md:text-3xl">
              Track live buying intent
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-black/70">
              Add keywords, load presets, and keep your hunt list tight without wasting dashboard space.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="border-4 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_#000]">
              {keywords.length} tracked
            </div>
            <div className="border-4 border-black bg-[#FFE082] px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_#000]">
              {isPending ? 'Updating…' : selectedHeroClass}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
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
            placeholder="Add a keyword or phrase..."
            className="min-w-0 flex-[1.6] border-4 border-black bg-white px-4 py-3 font-black text-base shadow-[4px_4px_0px_#000] focus:outline-none focus:ring-4 focus:ring-[#13D7C2]"
          />

          <label htmlFor="keyword-class" className="sr-only">
            Signal class
          </label>

          <select
            id="keyword-class"
            value={selectedHeroClass}
            onChange={(e) => setSelectedHeroClass(e.target.value)}
            className="min-w-0 xl:w-[220px] border-4 border-black bg-[#13D7C2] px-4 py-3 font-black text-sm uppercase shadow-[4px_4px_0px_#000] focus:outline-none"
          >
            <option value="Warrior 🥷">Warrior 🥷</option>
            <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
            <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
          </select>

          <button
            type="button"
            onClick={addKeyword}
            disabled={isPending}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 border-4 border-black bg-black px-5 py-3 font-black uppercase text-[#FFE600] shadow-[4px_4px_0px_#000] transition-transform hover:-translate-y-0.5 disabled:opacity-50 xl:w-auto"
          >
            <Plus aria-hidden="true" className="h-5 w-5 shrink-0 stroke-[3px]" />
            Arm Signal
          </button>
        </div>

        {notice ? (
          <div
            id="dashboard-notice"
            className={`border-4 border-black px-4 py-3 text-sm font-black shadow-[4px_4px_0px_#000] ${
              noticeIsError ? 'bg-[#FFD6D6] text-black' : 'bg-[#C7FFF3] text-black'
            }`}
          >
            {notice}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {PRESET_KEYWORDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isPending}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_#000] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {preset}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {keywords.length ? (
              keywords.map((keyword) => {
                const label = keyword.phrase || ''

                return (
                  <motion.div
                    key={keyword.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`flex min-h-[132px] min-w-0 flex-col justify-between border-4 border-black p-4 shadow-[4px_4px_0px_#000] ${getKeywordTone(label)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-base font-black uppercase leading-6 text-black break-words">
                        {label}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword.id)}
                        disabled={isPending}
                        aria-label={`Remove ${label}`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_#000] disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#FFE600]">
                        Active
                      </span>
                      <span className="truncate text-xs font-black uppercase text-black/55">
                        {selectedHeroClass}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="md:col-span-2 2xl:col-span-3 border-4 border-dashed border-black bg-[#FFFBEA] px-6 py-10 text-center shadow-[4px_4px_0px_#000]"
              >
                <p className="text-lg font-black uppercase text-black">No tracked keywords yet</p>
                <p className="mt-2 text-sm font-bold text-black/65">
                  Add one phrase or tap a preset to start filling this queue.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  )
}
