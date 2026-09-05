'use client'

import { useMemo, useState } from 'react'
import { Search, Sparkles, Zap, BookOpen, Filter } from 'lucide-react'
import { Post, filterPosts } from '@/lib/blog-types'
import { BlogHeroCard } from '@/features/blog/components/BlogHeroCard'
import { BlogPostCard } from '@/features/blog/components/BlogPostCard'
import { ALL_TAG, BlogTagFilter, deriveTags } from '@/features/blog/components/BlogTagFilter'
import { sfx } from '@/lib/sfx'

import { GuildNewsletterBox } from '@/features/blog/components/GuildNewsletterBox'

interface BlogIndexClientProps {
  initialPosts: Post[]
  featuredPost: Post | null
}

export default function BlogIndexClient({ initialPosts, featuredPost }: BlogIndexClientProps) {
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Only categories with a published post behind them get a button.
  const tags = useMemo(() => deriveTags(initialPosts), [initialPosts])

  const filteredPosts = filterPosts(initialPosts, selectedTag, searchQuery)
  // Grid posts exclude the featured post if tag is [ALL] and no search query
  const displayGridPosts =
    featuredPost && selectedTag === ALL_TAG && !searchQuery
      ? filteredPosts.filter((p) => p.slug !== featuredPost.slug)
      : filteredPosts

  return (
    <div id="blog-index" className="min-h-screen bg-canvas p-4 sm:p-6 md:p-10 pb-20 relative overflow-hidden">

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Arcade Hero Header */}
        <section className="relative rounded-[20px] border border-outline bg-accent p-6 md:p-10 overflow-hidden">

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-xl border border-outline bg-forest px-4 py-1.5 font-semibold text-xs text-accent">
              <Sparkles size={14} className="text-accent" /> SEOLAQUEST KNOWLEDGE VAULT
            </div>

            {/* The H1 is the on-page half of the title tag. It carries the same
                searchable entities; the lore lives in the badge above it. */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-ink leading-none">
              SEO Growth & Developer Playbooks
            </h1>

            <p className="text-sm md:text-lg font-medium text-ink/80 max-w-2xl leading-relaxed">
              Implementation guides on SaaS gamification, activation metrics, neo-brutalist React UI, metered API billing, and lead-response speed. Working code, honest numbers.
            </p>

            {/* Search Input Bar */}
            <div className="pt-2 flex items-center max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink w-5 h-5 stroke-[3px]" />
                <label htmlFor="blog-search" className="sr-only">Search articles</label>
                <input
                  id="blog-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => sfx.playHoverBlip()}
                  placeholder="Search articles by keyword or topic..."
                  className="w-full rounded-xl border border-outline bg-card py-3.5 pl-12 pr-4 font-medium text-sm text-ink placeholder:text-ink-muted  focus:outline-none focus:bg-highlight transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Tag Filter Bar */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-ink-muted">
            <Filter size={14} /> FILTER QUEST CATEGORY:
          </div>
          <BlogTagFilter tags={tags} activeTag={selectedTag} onSelectTag={setSelectedTag} />
        </section>

        {/* Featured Post Hero Card (Shown when on [ALL] tag & no search filter) */}
        {featuredPost && selectedTag === ALL_TAG && !searchQuery && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-medium tracking-tight text-ink flex items-center gap-2">
                <Zap className="fill-accent text-ink stroke-[2.5px]" /> LATEST FEATURED ARTICLE
              </h2>
            </div>
            <BlogHeroCard post={featuredPost} />
          </section>
        )}

        {/* Articles Grid Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline pb-3">
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink flex items-center gap-2">
              <BookOpen size={22} className="stroke-[3px]" />
              {selectedTag !== ALL_TAG ? `${selectedTag} ARTICLES` : 'ALL QUEST LOGS'}
              <span className="ml-2 rounded-xl border border-outline bg-forest px-2 py-0.5 text-xs text-accent">
                {filteredPosts.length}
              </span>
            </h2>
          </div>

          {displayGridPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGridPosts.map((post, idx) => (
                <BlogPostCard key={post.slug} post={post} index={idx} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-outline bg-card p-12 text-center space-y-4">
              <p className="text-2xl font-semibold text-ink">🐉 NO ARTICLES FOUND IN THIS VAULT</p>
              <p className="text-sm font-medium text-ink-muted">
                Try adjusting your search query or switching to another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.playCoinDrop()
                  setSelectedTag(ALL_TAG)
                  setSearchQuery('')
                }}
                className="inline-flex min-h-11 items-center rounded-xl border border-outline bg-accent px-6 py-2.5 font-semibold text-xs  hover:bg-highlight"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>

        {/* Guild Dispatch Newsletter Box */}
        <section className="pt-4">
          <GuildNewsletterBox />
        </section>

      </div>
    </div>
  )
}
