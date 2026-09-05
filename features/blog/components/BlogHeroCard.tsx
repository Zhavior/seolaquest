'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Calendar, Flame } from 'lucide-react'
import { Post } from '@/lib/blog-types'
import { sfx } from '@/lib/sfx'

interface BlogHeroCardProps {
  post: Post
}

export function BlogHeroCard({ post }: BlogHeroCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-outline bg-card transition-all duration-300"
    >
      {/* Neo-Brutalist Top Accent Bar */}
      <div
        className="h-3 w-full border-b border-outline bg-accent"
      />

      <div className="p-6 md:p-8">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-outline bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
              <Flame size={14} className="text-ink" /> FEATURED QUEST
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-outline bg-highlight px-3 py-1 text-xs font-semibold text-on-accent">
              {post.tag}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.readTimeMinutes} MIN READ
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {post.date}
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <Link
          href={`/blog/${post.slug}`}
          onClick={() => sfx.playCoinDrop()}
          onMouseEnter={() => sfx.playHoverBlip()}
          className="block"
        >
          <h2 className="font-display text-2xl md:text-4xl font-medium tracking-tight text-ink group-hover:text-forest transition-colors leading-tight mb-4">
            {post.title}
          </h2>
        </Link>

        {/* Hero Description */}
        <p className="text-sm md:text-base font-medium text-ink-muted leading-relaxed mb-6 line-clamp-3">
          {post.description}
        </p>

        {/* Footer Author & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-outline">
          {/* Author Crest */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline bg-forest text-on-forest font-semibold text-lg">
              {post.authorAvatar}
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">{post.author}</p>
              <p className="text-[11px] font-medium text-ink-muted">{post.authorRole}</p>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline bg-accent px-6 py-3 font-semibold text-on-accent  hover:bg-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>Read Article</span>
            <ArrowRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  )
}
