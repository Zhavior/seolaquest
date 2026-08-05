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
      className="group flex flex-col justify-between border-4 border-outline bg-card shadow-brutal-lg hover:shadow-brutal-lg transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
    >
      {/* Top Banner Accent */}
      <div
        className="h-2.5 w-full border-b-4 border-outline"
        style={{ backgroundColor: post.coverColor || '#FFE600' }}
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-block border-2 border-outline bg-canvas px-2.5 py-0.5 text-[11px] font-black uppercase text-ink shadow-brutal-sm">
              {post.tag}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-black uppercase text-ink-muted">
              <Clock size={12} /> {post.readTimeMinutes} MIN READ
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            className="block mb-2"
          >
            <h3 className="text-xl font-black uppercase tracking-tight text-ink group-hover:text-[#06B6D4] transition-colors leading-snug line-clamp-2">
              {post.title}
            </h3>
          </Link>

          {/* Description Excerpt */}
          <p className="text-xs font-bold text-ink-muted line-clamp-3 leading-relaxed mb-4">
            {post.description}
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t-2 border-outline flex items-center justify-between mt-auto">
          {/* Author info */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center border-2 border-outline bg-success text-xs font-black shadow-brutal-sm">
              {post.authorAvatar}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-ink leading-none">{post.author}</p>
              <p className="text-[9px] font-bold uppercase text-ink-muted">{post.date}</p>
            </div>
          </div>

          {/* Read Arrow */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            className="flex h-8 w-8 items-center justify-center border-2 border-outline bg-accent text-on-accent shadow-brutal-sm group-hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <ArrowUpRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  )
}
