'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Plus, X, Crosshair, Sparkles } from 'lucide-react'
import type { DashboardKeyword } from '@/features/dashboard/types'

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

/**
 * Keyword Battlefield — tracked phrases for scanning (not SERP rankings).
 * Mobile uses a compact action list; desktop keeps denser rows without fake metrics.
 */
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
  const activeCount = keywords.filter((keyword) => keyword.active).length

  return (
    <motion.section
      id="tracked-keywords"
      variants={item}
      aria-labelledby="keyword-battlefield-heading"
      className="flex min-w-0 flex-col border-4 border-outline bg-highlight p-5 shadow-brutal-lg md:p-6"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b-4 border-outline pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 border-4 border-outline bg-[#13D7C2] px-3 py-2 shadow-brutal">
              <Crosshair className="h-4 w-4 text-on-accent" aria-hidden />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-on-accent">
                Keyword Battlefield
              </span>
            </div>

            <h2
              id="keyword-battlefield-heading"
              className="text-2xl font-black uppercase leading-tight text-ink md:text-3xl"
            >
              Track phrases to scan
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-ink/70">
              These are match phrases for public posts — not search-engine ranking positions. Keep the list tight
              so scans stay focused.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="border-4 border-outline bg-card px-3 py-2 text-xs font-black uppercase shadow-brutal">
              {`${keywords.length} tracked · ${activeCount} active`}
            </div>
            <div className="border-4 border-outline bg-highlight-strong px-3 py-2 text-xs font-black uppercase shadow-brutal">
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
            className="min-w-0 flex-[1.6] border-4 border-outline bg-card px-4 py-3 text-base font-black shadow-brutal focus:outline-none focus:ring-4 focus:ring-[#13D7C2]"
          />

          <label htmlFor="keyword-class" className="sr-only">
            Signal class
          </label>

          <select
            id="keyword-class"
            value={selectedHeroClass}
            onChange={(e) => setSelectedHeroClass(e.target.value)}
            className="min-w-0 border-4 border-outline bg-[#13D7C2] px-4 py-3 text-sm font-black uppercase shadow-brutal focus:outline-none focus:ring-4 focus:ring-[#13D7C2] xl:w-[220px]"
          >
            <option value="Warrior 🥷">Warrior 🥷</option>
            <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
            <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
          </select>

          <button
            type="button"
            onClick={addKeyword}
            disabled={isPending}
            className="inline-flex min-h-14 items-center justify-center gap-2 border-4 border-outline bg-black px-5 py-3 font-black uppercase text-[#FFE600] shadow-brutal transition-transform hover:-translate-y-0.5 disabled:opacity-50 xl:w-auto"
          >
            <Plus aria-hidden="true" className="h-5 w-5 shrink-0 stroke-[3px]" />
            Add keyword
          </button>
        </div>

        {notice ? (
          <div
            id="dashboard-notice"
            className={`border-4 border-outline px-4 py-3 text-sm font-black shadow-brutal ${
              noticeIsError ? 'bg-[#FFD6D6] text-on-accent' : 'bg-[#C7FFF3] text-on-accent'
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
              className="inline-flex min-h-11 items-center gap-2 border-2 border-outline bg-card px-3 py-2 text-xs font-black uppercase shadow-brutal-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {preset}
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {keywords.length ? (
            <ul className="flex flex-col gap-2 border-4 border-outline bg-card shadow-brutal md:gap-0 md:divide-y-4 md:divide-outline">
              {keywords.map((keyword) => {
                const label = keyword.phrase || ''
                const statusLabel = keyword.active ? 'Active' : 'Inactive'

                return (
                  <motion.li
                    key={keyword.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex min-h-14 min-w-0 items-center justify-between gap-3 px-3 py-3 md:px-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black uppercase leading-snug text-ink md:text-base">
                        {label}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase text-ink/55">
                        {statusLabel}
                        <span className="mx-2 text-ink/30" aria-hidden>
                          ·
                        </span>
                        Presentation class: {selectedHeroClass}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword.id)}
                      disabled={isPending}
                      aria-label={`Remove ${label}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-outline bg-highlight shadow-brutal-sm disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-4 border-dashed border-outline bg-[#FFFBEA] px-6 py-10 text-center shadow-brutal"
            >
              <p className="text-lg font-black uppercase text-on-accent">First-use: no keywords yet</p>
              <p className="mt-2 text-sm font-bold text-ink/65">
                Add one phrase or tap a preset. Until then, scans have nothing to match against.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
