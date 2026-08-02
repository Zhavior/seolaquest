'use client'

import { useState } from 'react'
import { Search, Sparkles, Sword, Zap, BookOpen, Filter } from 'lucide-react'
import { Post, filterPosts } from '@/lib/blog-types'
import { BlogHeroCard } from '@/features/blog/components/BlogHeroCard'
import { BlogPostCard } from '@/features/blog/components/BlogPostCard'
import { BlogTagFilter } from '@/features/blog/components/BlogTagFilter'
import { sfx } from '@/lib/sfx'

import { GuildNewsletterBox } from '@/features/blog/components/GuildNewsletterBox'

interface BlogIndexClientProps {
  initialPosts: Post[]
  featuredPost: Post | null
}

export default function BlogIndexClient({ initialPosts, featuredPost }: BlogIndexClientProps) {
  const [selectedTag, setSelectedTag] = useState<string>('[ALL]')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredPosts = filterPosts(initialPosts, selectedTag, searchQuery)
  // Grid posts exclude the featured post if tag is [ALL] and no search query
  const displayGridPosts =
    featuredPost && selectedTag === '[ALL]' && !searchQuery
      ? filteredPosts.filter((p) => p.slug !== featuredPost.slug)
      : filteredPosts

  return (
    <div id="blog-index" className="min-h-screen bg-[#F4F0EA] p-4 sm:p-6 md:p-10 pb-20 relative overflow-hidden">
      <style>{`
        @media (max-width: 359px) {
          body:has(#blog-index) header.sticky > .max-w-7xl {
            flex-wrap: wrap;
          }

          body:has(#blog-index) header.sticky > .max-w-7xl > div:last-child {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
      {/* CRT Scanline Overlay Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px'
        }}
      />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Arcade Hero Header */}
        <section className="relative border-4 border-black bg-[#FFE600] p-6 md:p-10 shadow-[10px_10px_0_0_#000] overflow-hidden">
          {/* Decorative Corner Crest */}
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-[#00FFFF] border-4 border-black rotate-12 flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <Sword className="text-black w-10 h-10 -rotate-45" />
          </div>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 border-3 border-black bg-black px-4 py-1.5 font-black uppercase text-xs text-[#FFE600] shadow-[3px_3px_0_0_#000]">
              <Sparkles size={14} className="text-[#00FFFF]" /> COQUEST KNOWLEDGE VAULT
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-black leading-none">
              Arcade Blog & Guild Lore
            </h1>

            <p className="text-sm md:text-lg font-bold text-black/80 max-w-2xl leading-relaxed">
              Tactical playbooks on B2B speed-to-lead velocity, metered API monetization, arcade SaaS growth, and Guild Hall tactics.
            </p>

            {/* Search Input Bar */}
            <div className="pt-2 flex items-center max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5 stroke-[3px]" />
                <label htmlFor="blog-search" className="sr-only">Search articles</label>
                <input
                  id="blog-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => sfx.playHoverBlip()}
                  placeholder="Search articles by keyword or topic..."
                  className="w-full border-4 border-black bg-white py-3.5 pl-12 pr-4 font-bold text-sm text-black placeholder:text-zinc-500 shadow-[4px_4px_0_0_#000] focus:outline-none focus:bg-[#FFF7AA] transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Tag Filter Bar */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 font-black uppercase text-xs text-zinc-600">
            <Filter size={14} /> FILTER QUEST CATEGORY:
          </div>
          <BlogTagFilter activeTag={selectedTag} onSelectTag={setSelectedTag} />
        </section>

        {/* Featured Post Hero Card (Shown when on [ALL] tag & no search filter) */}
        {featuredPost && selectedTag === '[ALL]' && !searchQuery && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                <Zap className="fill-[#FFE600] text-black stroke-[2.5px]" /> LATEST FEATURED ARTICLE
              </h2>
            </div>
            <BlogHeroCard post={featuredPost} />
          </section>
        )}

        {/* Articles Grid Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-black pb-3">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <BookOpen size={22} className="stroke-[3px]" />
              {selectedTag !== '[ALL]' ? `${selectedTag} ARTICLES` : 'ALL QUEST LOGS'}
              <span className="ml-2 border-2 border-black bg-black px-2 py-0.5 text-xs text-[#FFE600]">
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
            <div className="border-4 border-black bg-white p-12 text-center shadow-[8px_8px_0_0_#000] space-y-4">
              <p className="text-2xl font-black uppercase text-black">🐉 NO ARTICLES FOUND IN THIS VAULT</p>
              <p className="text-sm font-bold text-zinc-600">
                Try adjusting your search query or switching to another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.playCoinDrop()
                  setSelectedTag('[ALL]')
                  setSearchQuery('')
                }}
                className="inline-flex min-h-11 items-center border-3 border-black bg-[#FFE600] px-6 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:bg-[#00FFFF]"
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
