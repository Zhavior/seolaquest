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
    <div className="min-h-screen bg-canvas p-4 sm:p-6 md:p-10 pb-24 relative overflow-hidden">

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Navigation Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/blog"
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center gap-2 rounded-xl border border-outline bg-card px-4 py-2 text-xs font-semibold text-ink  hover:bg-accent transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={3} /> Back to Vault
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-xl border border-outline bg-highlight px-3 py-1 text-xs font-semibold text-on-accent">
            {post.tag}
          </span>
        </div>

        {/* Post Header Hero Section */}
        <header className="rounded-[20px] border border-outline bg-card p-6 md:p-10 space-y-6">
          <div className="h-3 w-full border border-outline bg-accent" />

          <div className="space-y-4">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink leading-tight">
              {post.title}
            </h1>

            <p className="text-base md:text-xl font-medium text-ink-muted leading-relaxed max-w-3xl">
              {post.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-outline">
            {/* Author Crest */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-outline bg-accent text-xl font-semibold">
                {post.authorAvatar}
              </div>
              <div>
                <p className="font-semibold text-sm text-ink">{post.author}</p>
                <p className="text-xs font-medium text-ink-muted">{post.authorRole}</p>
              </div>
            </div>

            {/* Read & Date metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-muted">
              <span className="flex items-center gap-1.5 rounded-xl border border-outline bg-canvas px-3 py-1.5">
                <Clock size={14} /> {post.readTimeMinutes} MIN READ
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-outline bg-canvas px-3 py-1.5">
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
              <div className="rounded-xl border border-outline bg-card p-5">
                <div className="flex items-center gap-2 border-b border-outline pb-3 mb-4 font-semibold text-sm text-ink">
                  <List size={18} strokeWidth={3} className="text-forest" /> TABLE OF CONTENTS
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
                        className={`block text-xs font-semibold transition-all py-1.5 px-2 border-l ${
                          heading.level === 3 ? 'ml-3' : ''
                        } ${
                          isActive
                            ? 'border-outline bg-accent text-on-accent '
                            : 'border-transparent text-ink-muted hover:text-on-accent hover:border-outline'
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
            <article className="rounded-[20px] border border-outline bg-card p-6 sm:p-8 md:p-10 space-y-6">
              <BlogMarkdownRenderer content={post.content} />

              {/* High-Converting Operational CTA Banner Card */}
              <div className="my-8 rounded-xl border border-outline bg-accent p-6 md:p-8 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-xl border border-outline bg-forest px-3 py-1 text-xs font-semibold text-accent">
                  <Zap size={14} className="text-accent" /> EXPLORE THE CURRENT BETA
                </div>
                <h3 className="font-display text-xl md:text-2xl font-medium text-ink leading-tight">
                  Review SEOlaQuest&apos;s Stored Lead Workflow
                </h3>
                <p className="text-xs md:text-sm font-medium text-ink/80 leading-relaxed">
                  Configure keywords, queue supported provider work, and review only the source records the backend actually stores.
                </p>

                {/* Hardcoded Operational Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    onClick={() => sfx.playCoinDrop()}
                    onMouseEnter={() => sfx.playHoverBlip()}
                    className="inline-flex items-center gap-2 rounded-xl border border-outline bg-forest px-5 py-3 font-semibold text-accent text-xs  hover:bg-forest hover:text-on-forest active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Zap size={16} /> OPEN DASHBOARD
                  </Link>

                  <Link
                    href="/app/guild"
                    onClick={() => sfx.playCoinDrop()}
                    onMouseEnter={() => sfx.playHoverBlip()}
                    className="inline-flex items-center gap-2 rounded-xl border border-outline bg-success px-5 py-3 font-semibold text-on-accent text-xs  hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Shield size={16} /> ENTER GUILD HALL 🐉
                  </Link>
                </div>
              </div>

              {/* End of article badge */}
              <div className="pt-8 border-t border-outline flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Sparkles className="text-forest" /> END OF ARTICLE LOG
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playCoinDrop()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="rounded-xl border border-outline bg-accent px-3 py-1 font-semibold text-xs  hover:bg-highlight"
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
          <section className="pt-8 space-y-6 border-t border-outline">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink flex items-center gap-2">
              <Sword className="text-forest stroke-[3px]" /> RELATED GUILD QUESTS
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
