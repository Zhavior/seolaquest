'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, List, Sparkles, Sword, Zap, Shield } from 'lucide-react'
import { Post } from '@/lib/blog-types'
import { ShareBar } from '@/features/blog/components/ShareBar'
import { BlogPostCard } from '@/features/blog/components/BlogPostCard'
import { GuildNewsletterBox } from '@/features/blog/components/GuildNewsletterBox'
import { sfx } from '@/lib/sfx'
import { BlogMarkdownRenderer } from './BlogMarkdownRenderer'

interface PostReaderClientProps {
  post: Post
  relatedPosts: Post[]
}

export function PostReaderClient({ post, relatedPosts }: PostReaderClientProps) {
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [shareUrl] = useState<string>(() => (typeof window !== 'undefined' ? window.location.href : ''))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px' }
    )

    post.toc.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [post])

  return (
    <div className="min-h-screen bg-[#F4F0EA] p-4 sm:p-6 md:p-10 pb-24 relative overflow-hidden">
      {/* Subtle CRT Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/blog"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center gap-2 border-3 border-black bg-white px-4 py-2 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#FFE600] transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={3} /> Back to Vault
          </Link>

          <span className="inline-flex items-center gap-1.5 border-3 border-black bg-[#00FFFF] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
            {post.tag}
          </span>
        </div>

        {/* Post Header Hero Section */}
        <header className="border-4 border-black bg-white p-6 md:p-10 shadow-[10px_10px_0_0_#000] space-y-6">
          <div className="h-3 w-full border border-black" style={{ backgroundColor: post.coverColor || '#FFE600' }} />

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-tight">
              {post.title}
            </h1>

            <p className="text-base md:text-xl font-bold text-zinc-700 leading-relaxed max-w-3xl">
              {post.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t-3 border-black">
            {/* Author Crest */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-3 border-black bg-[#FFE600] text-xl font-black shadow-[2px_2px_0_0_#000]">
                {post.authorAvatar}
              </div>
              <div>
                <p className="font-black text-sm uppercase text-black">{post.author}</p>
                <p className="text-xs font-bold uppercase text-zinc-500">{post.authorRole}</p>
              </div>
            </div>

            {/* Read & Date metadata */}
            <div className="flex items-center gap-4 text-xs font-black uppercase text-zinc-600">
              <span className="flex items-center gap-1.5 border-2 border-black bg-[#F4F0EA] px-3 py-1.5 shadow-[2px_2px_0_0_#000]">
                <Clock size={14} /> {post.readTimeMinutes} MIN READ
              </span>
              <span className="flex items-center gap-1.5 border-2 border-black bg-[#F4F0EA] px-3 py-1.5 shadow-[2px_2px_0_0_#000]">
                <Calendar size={14} /> {post.date}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Layout with Sticky TOC Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sticky Table of Contents Sidebar */}
          {post.toc.length > 0 && (
            <aside className="lg:col-span-4 order-2 lg:order-1 sticky top-6 space-y-4">
              <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]">
                <div className="flex items-center gap-2 border-b-3 border-black pb-3 mb-4 font-black uppercase text-sm text-black">
                  <List size={18} strokeWidth={3} className="text-[#8A2BE2]" /> TABLE OF CONTENTS
                </div>

                <nav className="space-y-2">
                  {post.toc.map((heading) => {
                    const isActive = activeHeading === heading.id
                    return (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onMouseEnter={() => sfx.playHoverBlip()}
                        onClick={() => sfx.playCoinDrop()}
                        className={`block text-xs font-black uppercase transition-all py-1.5 px-2 border-l-4 ${
                          heading.level === 3 ? 'ml-3' : ''
                        } ${
                          isActive
                            ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                            : 'border-transparent text-zinc-600 hover:text-black hover:border-black'
                        }`}
                      >
                        {heading.text}
                      </a>
                    )
                  })}
                </nav>
              </div>

              {/* Share Bar Card */}
              <ShareBar title={post.title} url={shareUrl} />
            </aside>
          )}

          {/* Article Main Body */}
          <main className={`order-1 lg:order-2 ${post.toc.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            <article className="border-4 border-black bg-white p-6 sm:p-8 md:p-10 shadow-[8px_8px_0_0_#000] space-y-6">
              <BlogMarkdownRenderer content={post.content} />

              {/* High-Converting Operational CTA Banner Card */}
              <div className="my-8 border-4 border-black bg-[#FFE600] p-6 md:p-8 shadow-[6px_6px_0_0_#000] space-y-5">
                <div className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase text-[#FFE600] shadow-[2px_2px_0_0_#000]">
                  <Zap size={14} className="text-[#00FFFF]" /> EXPLORE THE CURRENT BETA
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-black leading-tight">
                  Review CoQuest&apos;s Stored Lead Workflow
                </h3>
                <p className="text-xs md:text-sm font-bold text-black/80 leading-relaxed">
                  Configure keywords, queue supported provider work, and review only the source records the backend actually stores.
                </p>

                {/* Hardcoded Operational Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    onClick={() => sfx.playCoinDrop()}
                    onMouseEnter={() => sfx.playHoverBlip()}
                    className="inline-flex items-center gap-2 border-3 border-black bg-black px-5 py-3 font-black uppercase text-[#FFE600] text-xs shadow-[3px_3px_0_0_#000] hover:bg-[#8A2BE2] hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Zap size={16} /> OPEN DASHBOARD
                  </Link>

                  <Link
                    href="/app/guild"
                    onClick={() => sfx.playCoinDrop()}
                    onMouseEnter={() => sfx.playHoverBlip()}
                    className="inline-flex items-center gap-2 border-3 border-black bg-[#A3E635] px-5 py-3 font-black uppercase text-black text-xs shadow-[3px_3px_0_0_#000] hover:bg-[#FFE600] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Shield size={16} /> ENTER GUILD HALL 🐉
                  </Link>
                </div>
              </div>

              {/* End of article badge */}
              <div className="pt-8 border-t-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-2 font-black uppercase text-xs">
                  <Sparkles className="text-[#06B6D4]" /> END OF ARTICLE LOG
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCoinDrop()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="border-2 border-black bg-[#FFE600] px-3 py-1 font-black uppercase text-xs shadow-[2px_2px_0_0_#000] hover:bg-[#00FFFF]"
                >
                  ↑ Return to Top
                </button>
              </div>
            </article>
          </main>
        </div>

        {/* Guild Dispatch Newsletter Box */}
        <section className="pt-4">
          <GuildNewsletterBox />
        </section>

        {/* Related Quests Section */}
        {relatedPosts.length > 0 && (
          <section className="pt-8 space-y-6 border-t-4 border-black">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Sword className="text-[#FF3333] stroke-[3px]" /> RELATED GUILD QUESTS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relPost, idx) => (
                <BlogPostCard key={relPost.slug} post={relPost} index={idx} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
