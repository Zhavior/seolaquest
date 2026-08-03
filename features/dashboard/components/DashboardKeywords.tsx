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
    <motion.div id="tracked-keywords" variants={item} className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0_0_#000] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
          <div className="bg-[#A3E635] p-3 border-4 border-black">
            <Swords className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl md:text-3xl uppercase">Tracked Keywords ({keywords.length})</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <label htmlFor="keyword-input" className="sr-only">Keyword or phrase to track</label>
          <input 
            id="keyword-input" 
            aria-invalid={noticeIsError}
            aria-errormessage={noticeIsError && notice ? 'dashboard-notice' : undefined}
            value={newKeyword} 
            onChange={(e) => setNewKeyword(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()} 
            placeholder="Track a keyword (e.g. 'looking for CRM')..." 
            className="flex-1 border-4 border-black bg-[#F4F0EA] p-3 font-black text-lg focus:outline-none focus:ring-4 focus:ring-[#FFE600]" 
          />
          <label htmlFor="keyword-class" className="sr-only">Keyword display class</label>
          <select 
            id="keyword-class"
            value={selectedHeroClass} 
            onChange={(e) => setSelectedHeroClass(e.target.value)} 
            className="border-4 border-black bg-[#FFE600] p-3 font-black text-sm uppercase focus:outline-none"
          >
            <option value="Warrior 🥷">Warrior 🥷</option>
            <option value="Mage 🧙‍♂️">Mage 🧙‍♂️</option>
            <option value="Knight 🦸‍♂️">Knight 🦸‍♂️</option>
          </select>
          <button 
            type="button" 
            onClick={addKeyword} 
            disabled={isPending} 
            className="border-4 border-black bg-[#06B6D4] hover:bg-cyan-400 p-3 font-black shadow-[4px_4px_0_0_#000] disabled:opacity-50 uppercase flex items-center justify-center gap-2"
          >
            <Plus aria-hidden="true" className="w-5 h-5 stroke-[3px]" /> Save Keyword
          </button>
        </div>

        {/* QUICK PRESET TAGS */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs uppercase font-black text-gray-500 mr-1">Quick Presets:</span>
          {PRESET_KEYWORDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isPending}
              className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3px]" /> &quot;{preset}&quot;
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {keywords.map((keyword, idx) => {
            const heroIcon = idx % 4 === 0 ? '🥷' : idx % 4 === 1 ? '🧙‍♂️' : '🦸‍♂️'
            return (
              <motion.div key={keyword.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-3 border-4 border-black bg-black text-white px-4 py-2 font-black shadow-[4px_4px_0_0_#A3E635]">
                <span className="text-[#A3E635] text-lg">{heroIcon}</span>
                <span className="uppercase tracking-wide">&quot;{keyword.phrase}&quot;</span>
                <button type="button" aria-label={`Remove keyword ${keyword.phrase}`} onClick={() => removeKeyword(keyword.id)} disabled={isPending} className="ml-2 flex min-h-11 min-w-11 items-center justify-center bg-[#EF4444] text-white p-1 hover:bg-red-600 border-2 border-transparent hover:border-white transition-colors">
                  <X aria-hidden="true" size={18} className="stroke-[3px]" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
