'use client'

import Link from 'next/link'
import { Clock, ArrowUpRight } from 'lucide-react'
import { Post } from '@/lib/blog-types'
import { sfx } from '@/lib/sfx'

interface BlogPostCardProps {
  post: Post
  index?: number
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <div
      onMouseEnter={() => sfx.playHoverBlip()}
      className="group flex flex-col justify-between rounded-xl border border-outline bg-card   transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
    >
      {/* Top Banner Accent */}
      <div
        className="h-2.5 w-full border-b border-outline bg-accent"
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-block rounded-xl border border-outline bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-ink">
              {post.tag}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted">
              <Clock size={12} /> {post.readTimeMinutes} MIN READ
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            className="block mb-2"
          >
            <h3 className="font-display text-xl font-medium tracking-tight text-ink group-hover:text-forest transition-colors leading-snug line-clamp-2">
              {post.title}
            </h3>
          </Link>

          {/* Description Excerpt */}
          <p className="text-xs font-medium text-ink-muted line-clamp-3 leading-relaxed mb-4">
            {post.description}
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-outline flex items-center justify-between mt-auto">
          {/* Author info */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-outline bg-success text-xs font-semibold">
              {post.authorAvatar}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink leading-none">{post.author}</p>
              <p className="text-[9px] font-medium text-ink-muted">{post.date}</p>
            </div>
          </div>

          {/* Read Arrow. An icon-only link needs a name: axe reported this as
              link-name on every card, and a screen reader announced "link"
              with no destination. */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline bg-accent text-on-accent  group-hover:bg-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <ArrowUpRight size={16} strokeWidth={3} aria-hidden="true" />
            <span className="sr-only">Read: {post.title}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
