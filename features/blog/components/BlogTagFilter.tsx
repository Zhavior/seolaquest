'use client'

import { sfx } from '@/lib/sfx'
import type { Post } from '@/lib/blog-types'

export const ALL_TAG = '[ALL]'

/**
 * Categories are derived from the posts that actually exist, never hardcoded.
 *
 * The previous fixed list advertised '⚔️ SPEED-TO-LEAD' and '🧪 MANA & APIS'
 * while both of those posts sat unpublished, so two of five filters could only
 * ever render the empty state. It also drifted the other way: a post whose tag
 * was edited stopped matching its own filter button, because `filterPosts`
 * compares the strings.
 *
 * Deriving the list makes both failures impossible — a filter exists if and
 * only if it has at least one published post behind it.
 */
export function deriveTags(posts: Post[]): string[] {
  const seen = new Set<string>()

  for (const post of posts) {
    const tag = post.tag?.trim()
    if (tag && tag !== ALL_TAG) seen.add(tag)
  }

  return [ALL_TAG, ...[...seen].sort((a, b) => a.localeCompare(b))]
}

interface BlogTagFilterProps {
  tags: string[]
  activeTag: string
  onSelectTag: (tag: string) => void
}

export function BlogTagFilter({ tags, activeTag, onSelectTag }: BlogTagFilterProps) {
  // One category is not a filter, it is a label. Hide the control entirely.
  if (tags.length <= 2) return null

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tags.map((tag) => {
        const isActive = activeTag === tag
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isActive}
            onMouseEnter={() => sfx.playHoverBlip()}
            onClick={() => {
              sfx.playCoinDrop()
              onSelectTag(tag)
            }}
            className={`min-h-11 border border-outline px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
              isActive
                ? 'bg-forest text-accent  translate-x-0.5 translate-y-0.5'
                : 'bg-card text-ink  hover:bg-inset'
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
