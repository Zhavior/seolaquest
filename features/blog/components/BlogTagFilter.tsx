'use client'

import { sfx } from '@/lib/sfx'

export const BLOG_TAGS = [
  '[ALL]',
  '⚔️ SPEED-TO-LEAD',
  '🧪 MANA & APIS',
  '🐉 GUILD LORE',
  '📊 SAAS GROWTH',
] as const

interface BlogTagFilterProps {
  activeTag: string
  onSelectTag: (tag: string) => void
}

export function BlogTagFilter({ activeTag, onSelectTag }: BlogTagFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {BLOG_TAGS.map((tag) => {
        const isActive = activeTag === tag
        return (
          <button
            key={tag}
            type="button"
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={() => {
              sfx.playCoinDrop()
              onSelectTag(tag)
            }}
            className={`min-h-11 border-3 border-outline px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              isActive
                ? 'bg-black text-[#FFE600] shadow-[4px_4px_0_0_#FFE600] translate-x-0.5 translate-y-0.5'
                : 'bg-card text-ink shadow-brutal hover:bg-inset'
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
